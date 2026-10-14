import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { createTestApp } from "../helpers/app";
import { User, Group, Transaction, Proposal } from "../../models";
import { generateTokens } from "../../utils/jwt";
import { hashPassword } from "../../utils/password";
jest.mock("../../services/email.service", () => ({
  isEmailConfigured: () => false,
  sendContactConfirmationEmail: jest.fn().mockResolvedValue(false),
  sendEmail: jest.fn().mockResolvedValue(false),
}));
const app = createTestApp();
let db: MongoMemoryReplSet;
let token: string;
let refresh: string;
let userId: string;
let groupId: string;
const auth = () => ({ Authorization: `Bearer ${token}` });
beforeAll(async () => {
  db = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    instanceOpts: [{ launchTimeout: 120000 }],
  });
  await mongoose.connect(db.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  await db.stop();
});
beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Group.deleteMany({}),
    Transaction.deleteMany({}),
    Proposal.deleteMany({}),
  ]);
  const user = await User.create({
    fullName: "Audit User",
    email: "audit@example.test",
    phone: "+221700000000",
    password: await hashPassword("Password123!"),
    role: "admin",
  });
  userId = user.id;
  const tokens = generateTokens({ id: userId, email: user.email });
  token = tokens.accessToken;
  refresh = tokens.refreshToken;
  user.refreshTokens.push({
    token: refresh,
    deviceId: "test",
    deviceName: "test",
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 86400000),
  });
  await user.save();
  const group = await Group.create({
    name: "Audit Group",
    type: "tontine",
    balance: 1000,
    createdBy: userId,
    members: [{ userId, role: "admin", status: "active" }],
  });
  groupId = group.id;
});
it("allows active members to read populated group details", async () => {
  await request(app).get(`/api/v1/groups/${groupId}`).set(auth()).expect(200);
});
it("denies all suspended account sessions and new logins", async () => {
  await User.findByIdAndUpdate(userId, { isActive: false });
  await request(app).get("/api/v1/auth/me").set(auth()).expect(403);
  await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "audit@example.test", password: "Password123!" })
    .expect(403);
  await request(app)
    .post("/api/v1/auth/refresh-token")
    .send({ refreshToken: refresh })
    .expect(403);
});
it("leaves an unaffordable expense pending and balance untouched", async () => {
  const tx = await Transaction.create({
    groupId,
    type: "expense",
    amount: 1001,
    initiatedBy: userId,
  });
  await request(app)
    .put(`/api/v1/transactions/${tx.id}/verify`)
    .set(auth())
    .send({})
    .expect(409);
  expect((await Transaction.findById(tx.id))?.status).toBe("pending");
  expect((await Group.findById(groupId))?.balance).toBe(1000);
});
it("applies simultaneous validation and subsequent flag/retry only once", async () => {
  const tx = await Transaction.create({
    groupId,
    type: "contribution",
    amount: 500,
    initiatedBy: userId,
  });
  const responses = await Promise.all(
    [1, 2, 3].map(() =>
      request(app)
        .put(`/api/v1/transactions/${tx.id}/verify`)
        .set(auth())
        .send({}),
    ),
  );
  expect(responses.every((r) => r.status === 200)).toBe(true);
  await request(app)
    .put(`/api/v1/admin/transactions/${tx.id}/flag`)
    .set(auth())
    .send({ reason: "review" })
    .expect(200);
  expect((await Transaction.findById(tx.id))?.status).toBe("completed");
  await request(app)
    .put(`/api/v1/transactions/${tx.id}/verify`)
    .set(auth())
    .send({})
    .expect(200);
  expect((await Group.findById(groupId))?.balance).toBe(1500);
});
it("executes an approved proposal once with its expense and recipient", async () => {
  const proposal = await Proposal.create({
    groupId,
    title: "Approved",
    description: "Equipment",
    amount: 300,
    category: "other",
    recipient: { name: "Supplier" },
    proposedBy: userId,
    votingDeadline: new Date(),
    status: "approved",
  });
  await Promise.all(
    [1, 2].map(() =>
      request(app)
        .post(`/api/v1/proposals/${proposal.id}/execute`)
        .set(auth())
        .send({})
        .expect(200),
    ),
  );
  const saved = await Proposal.findById(proposal.id);
  expect(saved?.status).toBe("executed");
  expect(saved?.transactionId).toBeDefined();
  expect(
    await Transaction.countDocuments({ "metadata.proposalId": proposal.id }),
  ).toBe(1);
  expect((await Group.findById(groupId))?.balance).toBe(700);
});

it("echoes one allowed CORS origin and rejects an unknown browser origin", async () => {
  process.env.CORS_ORIGIN =
    "https://badenya.naimba.com,https://admin.badenya.app";
  const allowed = await request(app)
    .options("/api/v1/auth/login")
    .set("Origin", "https://badenya.naimba.com")
    .set("Access-Control-Request-Method", "POST");
  expect(allowed.headers["access-control-allow-origin"]).toBe(
    "https://badenya.naimba.com",
  );
  expect(allowed.headers["access-control-allow-credentials"]).toBe("true");
  const blocked = await request(app)
    .get("/health")
    .set("Origin", "https://evil.example");
  expect(blocked.headers["access-control-allow-origin"]).toBeUndefined();
});
it("persists public contact content and newsletter without a session", async () => {
  const { ContactSubmission, NewsletterSubscription } =
    await import("../../models/PublicSubmission");
  await request(app)
    .post("/api/v1/contact")
    .send({
      name: "Visitor",
      email: "visitor@example.test",
      subject: "Help",
      message: "Please preserve my message",
    })
    .expect(200);
  expect(
    (await ContactSubmission.findOne({ email: "visitor@example.test" }))
      ?.message,
  ).toBe("Please preserve my message");
  await request(app)
    .post("/api/v1/contact/newsletter")
    .send({ email: "visitor@example.test" })
    .expect(200);
  expect(
    await NewsletterSubscription.countDocuments({
      email: "visitor@example.test",
    }),
  ).toBe(1);
});
it("keeps suspended members out of group lists and joins", async () => {
  const other = await User.create({
    fullName: "Other",
    email: "other@example.test",
    phone: "+221700000001",
    password: "hash",
  });
  await Group.updateOne(
    { _id: groupId },
    { $set: { "members.0.status": "suspended" } },
  );
  await Group.updateOne(
    { _id: groupId },
    {
      $push: {
        members: { userId: other._id, role: "member", status: "active" },
      },
    },
  );
  const list = await request(app).get("/api/v1/groups").set(auth()).expect(200);
  expect(list.body.data.groups).toHaveLength(0);
  await request(app)
    .post(`/api/v1/groups/${groupId}/join`)
    .set(auth())
    .send({})
    .expect(403);
});
it("returns real discovery and accepts an approved join request once", async () => {
  const visitor = await User.create({
    fullName: "Visitor",
    email: "join@example.test",
    phone: "+221700000002",
    password: "hash",
  });
  const visitorToken = generateTokens({
    id: visitor.id,
    email: visitor.email,
  }).accessToken;
  const discovery = await request(app)
    .get("/api/v1/groups/discover")
    .set(auth())
    .expect(200);
  expect(
    discovery.body.data.groups.some((g: { _id: string }) => g._id === groupId),
  ).toBe(true);
  expect(discovery.body.data.groups[0].invitationCode).toBeUndefined();
  const joined = await request(app)
    .post(`/api/v1/groups/${groupId}/join`)
    .set("Authorization", `Bearer ${visitorToken}`)
    .send({})
    .expect(200);
  expect(joined.body.data.status).toBe("pending");
  const pending = await request(app)
    .get(`/api/v1/groups/${groupId}/join-requests`)
    .set(auth())
    .expect(200);
  await request(app)
    .post(
      `/api/v1/groups/${groupId}/join-requests/${pending.body.data.requests[0]._id}/approve`,
    )
    .set(auth())
    .send({})
    .expect(200);
  await request(app)
    .get(`/api/v1/groups/${groupId}`)
    .set("Authorization", `Bearer ${visitorToken}`)
    .expect(200);
  expect(
    (await Group.findById(groupId))?.members.filter(
      (m) => String(m.userId) === visitor.id,
    ),
  ).toHaveLength(1);
});
it("shares a tontine calendar, rejects stale revisions and pays each round once", async () => {
  await Group.updateOne(
    { _id: groupId },
    { $set: { "contributionSettings.amount": 100 } },
  );
  const response = await request(app)
    .get(`/api/v1/groups/${groupId}/tontine`)
    .set(auth())
    .expect(200);
  const schedule = response.body.data.schedule;
  const saved = await request(app)
    .put(`/api/v1/groups/${groupId}/tontine`)
    .set(auth())
    .send(schedule)
    .expect(200);
  await request(app)
    .put(`/api/v1/groups/${groupId}/tontine`)
    .set(auth())
    .send(schedule)
    .expect(409);
  await Promise.all(
    [1, 2].map(() =>
      request(app)
        .post(`/api/v1/groups/${groupId}/tontine/payout`)
        .set(auth())
        .send({ roundId: saved.body.data.schedule.rounds[0].roundId })
        .expect(200),
    ),
  );
  const final = await request(app)
    .get(`/api/v1/groups/${groupId}/tontine`)
    .set(auth())
    .expect(200);
  expect(final.body.data.schedule.rounds[0].status).toBe("completed");
  expect(final.body.data.schedule.currentRoundNumber).toBe(0);
  expect((await Group.findById(groupId))?.balance).toBe(900);
});
it("paginates actual transactions and preserves the group currency", async () => {
  await Group.updateOne({ _id: groupId }, { $set: { currency: "EUR" } });
  const created = await request(app)
    .post(`/api/v1/groups/${groupId}/transactions`)
    .set(auth())
    .send({ type: "contribution", amount: 10 })
    .expect(201);
  expect(created.body.data.transaction.currency).toBe("EUR");
  await Transaction.create({
    groupId,
    type: "contribution",
    amount: 2,
    currency: "EUR",
    initiatedBy: userId,
  });
  const result = await request(app)
    .get("/api/v1/transactions?page=2&limit=1")
    .set(auth())
    .expect(200);
  expect(result.body.data.transactions).toHaveLength(1);
  expect(result.body.data.total).toBe(2);
  expect(result.body.data.page).toBe(2);
});

it("allows only one of cancellation or validation to commit", async () => {
  const tx = await Transaction.create({
    groupId,
    type: "contribution",
    amount: 250,
    initiatedBy: userId,
  });
  const results = await Promise.all([
    request(app)
      .put(`/api/v1/transactions/${tx.id}/verify`)
      .set(auth())
      .send({}),
    request(app).delete(`/api/v1/transactions/${tx.id}`).set(auth()).send({}),
  ]);
  expect(results.some((r) => r.status === 200)).toBe(true);
  expect(results.every((r) => [200, 409].includes(r.status))).toBe(true);
  const final = await Transaction.findById(tx.id);
  const group = await Group.findById(groupId);
  expect(group?.balance).toBe(final?.status === "completed" ? 1250 : 1000);
  expect(["completed", "cancelled"]).toContain(final?.status);
});
it("deduplicates concurrent creation and rejects a changed retry body", async () => {
  const body = { type: "contribution", amount: 100, description: "Monthly" };
  const key = "audit-stable-key";
  const responses = await Promise.all(
    [1, 2].map(() =>
      request(app)
        .post(`/api/v1/groups/${groupId}/transactions`)
        .set(auth())
        .set("Idempotency-Key", key)
        .send(body),
    ),
  );
  expect(responses.every((r) => [200, 201].includes(r.status))).toBe(true);
  expect(await Transaction.countDocuments({ idempotencyKey: key })).toBe(1);
  await request(app)
    .post(`/api/v1/groups/${groupId}/transactions`)
    .set(auth())
    .set("Idempotency-Key", key)
    .send({ ...body, description: "Different" })
    .expect(409);
});
it("closes due proposals with quorum and a durable outcome event", async () => {
  const { closeDueProposals } =
    await import("../../services/proposal-lifecycle.service");
  const { default: DomainEvent } = await import("../../models/DomainEvent");
  const proposal = await Proposal.create({
    groupId,
    title: "Expired vote",
    description: "Decision",
    amount: 100,
    category: "other",
    proposedBy: userId,
    votingDeadline: new Date(Date.now() - 1000),
    votes: [{ userId, decision: "for" }],
  });
  await Group.updateOne(
    { _id: groupId },
    { $set: { "stats.activeProposals": 1 } },
  );
  await closeDueProposals();
  await closeDueProposals();
  const saved = await Proposal.findById(proposal.id);
  expect(saved?.status).toBe("approved");
  expect(saved?.result?.participationRate).toBe(100);
  expect((await Group.findById(groupId))?.stats.activeProposals).toBe(0);
  expect(
    await DomainEvent.countDocuments({ key: `proposal:${proposal.id}:closed` }),
  ).toBe(1);
});
it("requires a trusted Origin for cookie-based mutations", async () => {
  await request(app)
    .post("/api/v1/auth/logout")
    .set("Cookie", `admin_token=${token}`)
    .send({})
    .expect(403);
  process.env.CORS_ORIGIN = "https://badenya.naimba.com";
  await request(app)
    .post("/api/v1/auth/logout")
    .set("Cookie", `admin_token=${token}`)
    .set("Origin", "https://badenya.naimba.com")
    .send({ refreshToken: refresh })
    .expect(200);
});

it("supports a legacy session version and cookie-only renewal, then revokes it on password change", async () => {
  await User.collection.updateOne(
    { _id: new mongoose.Types.ObjectId(userId) },
    { $unset: { sessionVersion: "" } },
  );
  const login = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "audit@example.test", password: "Password123!" })
    .expect(200);
  process.env.CORS_ORIGIN = "https://badenya.naimba.com";
  const renewed = await request(app)
    .post("/api/v1/auth/refresh-token")
    .set("Origin", "https://badenya.naimba.com")
    .set("Cookie", `admin_refresh_token=${login.body.data.tokens.refreshToken}`)
    .expect(200);
  expect(renewed.body.data.tokens.refreshToken).not.toBe(
    login.body.data.tokens.refreshToken,
  );
  await request(app)
    .put("/api/v1/auth/change-password")
    .set("Authorization", `Bearer ${renewed.body.data.tokens.accessToken}`)
    .send({ currentPassword: "Password123!", newPassword: "Replacement123!" })
    .expect(200);
  await request(app)
    .get("/api/v1/auth/me")
    .set("Authorization", `Bearer ${renewed.body.data.tokens.accessToken}`)
    .expect(401);
  await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "audit@example.test", password: "Replacement123!" })
    .expect(200);
});
it("archives a completed tontine cycle and refuses overlapping next cycles", async () => {
  await Group.updateOne(
    { _id: groupId },
    { $set: { "contributionSettings.amount": 100 } },
  );
  const first = await request(app)
    .get(`/api/v1/groups/${groupId}/tontine`)
    .set(auth())
    .expect(200);
  await request(app)
    .post(`/api/v1/groups/${groupId}/tontine/next-cycle`)
    .set(auth())
    .send({})
    .expect(409);
  await request(app)
    .post(`/api/v1/groups/${groupId}/tontine/payout`)
    .set(auth())
    .send({ roundId: first.body.data.schedule.rounds[0].roundId })
    .expect(200);
  const next = await request(app)
    .post(`/api/v1/groups/${groupId}/tontine/next-cycle`)
    .set(auth())
    .send({})
    .expect(200);
  expect(next.body.data.schedule.cycleNumber).toBe(2);
  expect(next.body.data.schedule.rounds[0].roundId).not.toBe(
    first.body.data.schedule.rounds[0].roundId,
  );
  await request(app)
    .post(`/api/v1/groups/${groupId}/tontine/next-cycle`)
    .set(auth())
    .send({})
    .expect(409);
  expect((await Group.findById(groupId))?.balance).toBe(900);
});
it("rejects cumulative accounting overflow without completing the operation", async () => {
  await Group.updateOne(
    { _id: groupId },
    { $set: { balance: Number.MAX_SAFE_INTEGER } },
  );
  const tx = await Transaction.create({
    groupId,
    type: "contribution",
    amount: 1,
    initiatedBy: userId,
  });
  await request(app)
    .put(`/api/v1/transactions/${tx.id}/verify`)
    .set(auth())
    .send({})
    .expect(409);
  expect((await Group.findById(groupId))?.balance).toBe(
    Number.MAX_SAFE_INTEGER,
  );
  expect((await Transaction.findById(tx.id))?.status).toBe("pending");
});

it("expires archived-group proposals while continuing other automatic decisions", async () => {
  const { closeDueProposals } =
    await import("../../services/proposal-lifecycle.service");
  const archived = await Group.create({
    name: "Archived",
    type: "tontine",
    createdBy: userId,
    members: [{ userId, role: "admin", status: "active" }],
    isActive: false,
  });
  const obsolete = await Proposal.create({
    groupId: archived.id,
    title: "Obsolete",
    description: "Archived vote",
    amount: 10,
    category: "other",
    proposedBy: userId,
    votingDeadline: new Date(Date.now() - 1000),
  });
  const current = await Proposal.create({
    groupId,
    title: "Current",
    description: "Active vote",
    amount: 10,
    category: "other",
    proposedBy: userId,
    votingDeadline: new Date(Date.now() - 1000),
    votes: [{ userId, decision: "for" }],
  });
  await closeDueProposals();
  expect((await Proposal.findById(obsolete.id))?.status).toBe("expired");
  expect((await Proposal.findById(current.id))?.status).toBe("approved");
});
