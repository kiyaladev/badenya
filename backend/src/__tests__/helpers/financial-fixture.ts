import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { User, Group } from "../../models";
import { generateTokens } from "../../utils/jwt";
import { createTestApp } from "./app";

/** Each suite owns an ephemeral replica set; never uses a developer database. */
export function financialFixture() {
  const app = createTestApp();
  let database: MongoMemoryReplSet;
  let actor: string;
  let groupId: string;
  let token: string;
  beforeAll(async () => {
    database = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(database.getUri());
  });
  beforeEach(async () => {
    for (const collection of Object.values(mongoose.connection.collections))
      await collection.deleteMany({});
    const user = await User.create({
      fullName: "Responsable",
      email: "fixture@example.test",
      phone: "+22370000123",
      password: "hash",
    });
    actor = user.id;
    token = generateTokens({ id: actor, email: user.email }).accessToken;
    const group = await Group.create({
      name: "Tontine test",
      type: "tontine",
      balance: 1000,
      createdBy: actor,
      members: [{ userId: actor, role: "admin", status: "active" }],
    });
    groupId = group.id;
  });
  afterAll(async () => {
    await mongoose.disconnect();
    await database?.stop();
  });
  return {
    app,
    get actor() {
      return actor;
    },
    get groupId() {
      return groupId;
    },
    get token() {
      return token;
    },
    auth: () => ({ Authorization: `Bearer ${token}` }),
  };
}
