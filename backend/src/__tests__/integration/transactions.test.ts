import request from "supertest";
import { Transaction, Group } from "../../models";
import { financialFixture } from "../helpers/financial-fixture";
const fixture = financialFixture();

it("requires a session for financial routes", async () => {
  await request(fixture.app)
    .post(`/api/v1/groups/${fixture.groupId}/transactions`)
    .send({ type: "contribution", amount: 10 })
    .expect(401);
  expect(await Transaction.countDocuments()).toBe(0);
});
it.each([
  { type: "invalid", amount: 10 },
  { type: "contribution", amount: -1 },
  { type: "contribution" },
  { amount: 10 },
])("rejects invalid authenticated transaction data: %j", async (body) => {
  await request(fixture.app)
    .post(`/api/v1/groups/${fixture.groupId}/transactions`)
    .set(fixture.auth())
    .send(body)
    .expect(400);
  expect(await Transaction.countDocuments()).toBe(0);
  expect((await Group.findById(fixture.groupId))?.balance).toBe(1000);
});
it("rejects malformed identifiers before any transaction lookup", async () => {
  await request(fixture.app)
    .get("/api/v1/transactions/invalid-id")
    .set(fixture.auth())
    .expect(400);
});
it("creates, filters, validates and records the responsible person exactly once", async () => {
  const created = await request(fixture.app)
    .post(`/api/v1/groups/${fixture.groupId}/transactions`)
    .set(fixture.auth())
    .send({ type: "contribution", amount: 50 })
    .expect(201);
  const id = created.body.data.transaction._id;
  await request(fixture.app)
    .put(`/api/v1/transactions/${id}/verify`)
    .set(fixture.auth())
    .send({})
    .expect(200);
  await request(fixture.app)
    .put(`/api/v1/transactions/${id}/verify`)
    .set(fixture.auth())
    .send({})
    .expect(200);
  const saved = await Transaction.findById(id);
  expect(saved?.validatedBy?.toString()).toBe(fixture.actor);
  expect(saved?.validatedAt).toBeInstanceOf(Date);
  expect(saved?.auditTrail).toHaveLength(1);
  expect(saved?.auditTrail[0].action).toBe("validated");
  expect((await Group.findById(fixture.groupId))?.balance).toBe(1050);
  const list = await request(fixture.app)
    .get("/api/v1/transactions?type=contribution&status=completed")
    .set(fixture.auth())
    .expect(200);
  expect(
    list.body.data.transactions.map((tx: { _id: string }) => tx._id),
  ).toEqual([id]);
  const pending = await request(fixture.app)
    .get("/api/v1/transactions?status=pending")
    .set(fixture.auth())
    .expect(200);
  expect(pending.body.data.transactions).toEqual([]);
});
it("records a cancellation and refuses later validation", async () => {
  const tx = await Transaction.create({
    groupId: fixture.groupId,
    initiatedBy: fixture.actor,
    type: "contribution",
    amount: 50,
  });
  await request(fixture.app)
    .delete(`/api/v1/transactions/${tx.id}`)
    .set(fixture.auth())
    .send({ reason: "Doublon" })
    .expect(200);
  await request(fixture.app)
    .put(`/api/v1/transactions/${tx.id}/verify`)
    .set(fixture.auth())
    .send({})
    .expect(409);
  const saved = await Transaction.findById(tx.id);
  expect(saved?.auditTrail[0].actor.toString()).toBe(fixture.actor);
  expect(saved?.auditTrail[0].reason).toBe("Doublon");
  expect(saved?.validatedBy).toBeUndefined();
  expect((await Group.findById(fixture.groupId))?.balance).toBe(1000);
});
