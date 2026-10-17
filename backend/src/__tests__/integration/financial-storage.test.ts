import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createTestApp } from "../helpers/app";
import { User, Group, Transaction } from "../../models";
import { generateTokens } from "../../utils/jwt";
let db: MongoMemoryServer;
const app = createTestApp();
beforeAll(async () => {
  db = await MongoMemoryServer.create({ instance: { launchTimeout: 120000 } });
  await mongoose.connect(db.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  if (db) await db.stop();
});
it("reports standalone storage and refuses financial writes without partial changes", async () => {
  const user = await User.create({
    fullName: "Standalone User",
    email: "storage@example.test",
    phone: "+221700000099",
    password: "unused-hash",
  });
  const token = generateTokens({ id: user.id, email: user.email }).accessToken;
  const group = await Group.create({
    name: "Standalone group",
    type: "tontine",
    createdBy: user.id,
    balance: 100,
    members: [{ userId: user.id, role: "admin", status: "active" }],
  });
  const tx = await Transaction.create({
    groupId: group.id,
    type: "contribution",
    amount: 50,
    initiatedBy: user.id,
  });
  const health = await request(app).get("/health").expect(200);
  expect(health.body.database).toBe(true);
  expect(health.body.financialStorage).toBe(false);
  const refused = await request(app)
    .put(`/api/v1/transactions/${tx.id}/verify`)
    .set("Authorization", `Bearer ${token}`)
    .send({})
    .expect(503);
  expect(refused.body.code).toBe("FINANCIAL_STORAGE_UNAVAILABLE");
  expect((await Group.findById(group.id))?.balance).toBe(100);
  expect((await Transaction.findById(tx.id))?.status).toBe("pending");
});
