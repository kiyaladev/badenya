import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Request, Response } from "express";
import { Group, User, Notification, Transaction } from "../../models";
import { deleteAccount } from "../../controllers/auth.controller";
import { updateMemberRole } from "../../controllers/group.controller";
let mongo: MongoMemoryReplSet;
let a: mongoose.Types.ObjectId, b: mongoose.Types.ObjectId;
function req(userId: mongoose.Types.ObjectId, extra = {}) {
  return {
    user: { id: String(userId), email: "deletion@example.test" },
    body: {},
    params: {},
    ...extra,
  } as unknown as Request;
}
function res() {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
    clearCookie: jest.fn(),
  };
  response.status.mockReturnValue(response);
  response.clearCookie.mockReturnValue(response);
  return response as unknown as Response & {
    status: jest.Mock;
    json: jest.Mock;
    clearCookie: jest.Mock;
  };
}
async function group(roles = ["admin", "admin"]) {
  return Group.create({
    name: "Shared",
    type: "association",
    createdBy: a,
    members: [
      { userId: a, role: roles[0], status: "active" },
      { userId: b, role: roles[1], status: "active" },
    ],
  });
}
beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
beforeEach(async () => {
  await Promise.all([
    Group.deleteMany({}),
    User.deleteMany({}),
    Notification.deleteMany({}),
    Transaction.deleteMany({}),
  ]);
  const users = await User.create(
    ["A", "B"].map((name, index) => ({
      fullName: name,
      email: `${name}@deletion.example.test`,
      phone: `+2237000010${index}`,
      password: "hash",
      isActive: true,
    })),
  );
  [a, b] = users.map((user) => user._id as mongoose.Types.ObjectId);
});
it("blocks deleting a last administrator and rolls back cleanup in every other group", async () => {
  const shared = await group(["member", "admin"]);
  const sole = await Group.create({
    name: "Sole admin",
    type: "association",
    createdBy: a,
    members: [{ userId: a, role: "admin", status: "active" }],
  });
  const notification = await Notification.create({
    userId: a,
    type: "member_joined",
    title: "Keep",
    message: "Unchanged",
  });
  const response = res();
  await deleteAccount(req(a), response);
  expect(response.status).toHaveBeenCalledWith(409);
  expect(response.json.mock.calls[0][0].code).toBe("LAST_GROUP_ADMIN");
  expect(await User.exists({ _id: a })).toBeTruthy();
  expect(await Notification.exists({ _id: notification._id })).toBeTruthy();
  expect((await Group.findById(shared._id))!.members).toHaveLength(2);
  expect((await Group.findById(sole._id))!.members).toHaveLength(1);
  expect((await Group.findById(shared._id))!.get("__v")).toBe(
    shared.get("__v"),
  );
});
it("atomically removes the account, requests and notifications while preserving financial history", async () => {
  const shared = await group(["member", "admin"]);
  shared.balance = 100;
  shared.stats.totalContributions = 100;
  shared.joinRequests.push({
    _id: new mongoose.Types.ObjectId(),
    userId: a,
    requestedAt: new Date(),
  });
  await shared.save();
  const transaction = await Transaction.create({
    groupId: shared._id,
    initiatedBy: a,
    type: "contribution",
    amount: 100,
    currency: "XOF",
    description: "Historical contribution",
    status: "completed",
  });
  await Notification.create({
    userId: a,
    type: "member_joined",
    title: "Delete",
    message: "Private notification",
  });
  const response = res();
  await deleteAccount(req(a), response);
  expect(response.status).toHaveBeenCalledWith(200);
  expect(await User.exists({ _id: a })).toBeNull();
  expect(await Notification.countDocuments({ userId: a })).toBe(0);
  const after = await Group.findById(shared._id);
  expect(after!.members.map((member) => String(member.userId))).toEqual([
    String(b),
  ]);
  expect(after!.joinRequests).toHaveLength(0);
  expect(after!.balance).toBe(100);
  expect(after!.stats.totalContributions).toBe(100);
  expect(await Transaction.exists({ _id: transaction._id })).toBeTruthy();
  expect(after!.get("__v")).toBe(shared.get("__v") + 1);
  expect(response.clearCookie).toHaveBeenCalledWith("admin_token", {
    path: "/",
  });
});
it("never removes both administrators when their account deletions run concurrently", async () => {
  const shared = await group();
  const responses = [res(), res()];
  await Promise.all([
    deleteAccount(req(a), responses[0]),
    deleteAccount(req(b), responses[1]),
  ]);
  expect(
    responses.filter((response) =>
      response.status.mock.calls.some((call) => call[0] === 200),
    ),
  ).toHaveLength(1);
  expect(
    responses.filter((response) =>
      response.status.mock.calls.some((call) => call[0] === 409),
    ),
  ).toHaveLength(1);
  const after = await Group.findById(shared._id);
  expect(
    after!.members.filter(
      (member) => member.status === "active" && member.role === "admin",
    ),
  ).toHaveLength(1);
  expect(await User.countDocuments()).toBe(1);
});
it("keeps a live administrator when deletion races a last-admin demotion", async () => {
  const shared = await group();
  const responses = [res(), res()];
  await Promise.all([
    deleteAccount(req(a), responses[0]),
    updateMemberRole(
      req(a, {
        params: { id: String(shared._id), userId: String(b) },
        body: { role: "member" },
      }),
      responses[1],
    ),
  ]);
  const after = await Group.findById(shared._id);
  expect(
    after!.members.filter(
      (member) => member.status === "active" && member.role === "admin",
    ),
  ).toHaveLength(1);
  for (const response of responses)
    expect(response.status.mock.calls.flat()).not.toContain(500);
});
it("permits deletion of the last administrator of an archived group", async () => {
  const shared = await group(["admin", "member"]);
  shared.isActive = false;
  shared.archivedAt = new Date();
  await shared.save();
  const response = res();
  await deleteAccount(req(a), response);
  expect(response.status).toHaveBeenCalledWith(200);
  expect(await User.exists({ _id: a })).toBeNull();
});
