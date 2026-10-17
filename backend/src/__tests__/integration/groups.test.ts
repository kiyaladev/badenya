import request from "supertest";
import { Group } from "../../models";
import { financialFixture } from "../helpers/financial-fixture";
const fixture = financialFixture();
it("requires authentication to create groups", async () => {
  await request(fixture.app)
    .post("/api/v1/groups")
    .send({ name: "Groupe", type: "tontine" })
    .expect(401);
  expect(await Group.countDocuments()).toBe(1);
});
it.each([
  {},
  { name: "Groupe", type: "invalid-type" },
  { name: "", type: "tontine" },
  { name: "Groupe", type: "tontine", contributionSettings: { amount: -1 } },
])(
  "rejects invalid group data with an authenticated session: %j",
  async (body) => {
    await request(fixture.app)
      .post("/api/v1/groups")
      .set(fixture.auth())
      .send(body)
      .expect(400);
    expect(await Group.countDocuments()).toBe(1);
  },
);
it("rejects malformed identifiers with 400", async () => {
  await request(fixture.app)
    .get("/api/v1/groups/invalid-id")
    .set(fixture.auth())
    .expect(400);
});
it("persists configuration and returns the group to its creator", async () => {
  const created = await request(fixture.app)
    .post("/api/v1/groups")
    .set(fixture.auth())
    .send({
      name: "Épargne",
      type: "association",
      contributionSettings: { amount: 50, frequency: "weekly" },
    })
    .expect(201);
  const id = created.body.data.group._id;
  const saved = await Group.findById(id);
  expect(saved?.contributionSettings.frequency).toBe("weekly");
  expect(saved?.contributionSettings.nextDueAt).toBeInstanceOf(Date);
  const result = await request(fixture.app)
    .get(`/api/v1/groups/${id}`)
    .set(fixture.auth())
    .expect(200);
  expect(result.body.data.group.members[0].role).toBe("admin");
});
it("validates member identity and role before changing persisted membership", async () => {
  await request(fixture.app)
    .post(`/api/v1/groups/${fixture.groupId}/members`)
    .set(fixture.auth())
    .send({ userId: "bad", role: "member" })
    .expect(400);
  await request(fixture.app)
    .put(`/api/v1/groups/${fixture.groupId}/members/${fixture.actor}/role`)
    .set(fixture.auth())
    .send({ role: "invalid" })
    .expect(400);
  expect((await Group.findById(fixture.groupId))?.members).toHaveLength(1);
});
