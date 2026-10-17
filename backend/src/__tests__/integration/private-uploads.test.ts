import request from "supertest";
import fs from "fs/promises";
import os from "os";
import path from "path";
import sharp from "sharp";
import jwt from "jsonwebtoken";
import { Group, Transaction } from "../../models";
import UploadedFile, { UploadQuota } from "../../models/UploadedFile";
import { financialFixture } from "../helpers/financial-fixture";
import { cleanupAbandonedUploads } from "../../services/upload.service";
const f = financialFixture();
let directory: string;
const originalDirectory = process.env.UPLOAD_DIR;
const originalUrl = process.env.PUBLIC_API_URL;
let payload: string;
beforeAll(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), "badenya-private-"));
  process.env.UPLOAD_DIR = directory;
  process.env.PUBLIC_API_URL = "https://api.test/api/v1";
  payload = (
    await sharp({
      create: { width: 10, height: 10, channels: 3, background: "red" },
    })
      .png()
      .toBuffer()
  ).toString("base64");
});
afterAll(async () => {
  if (originalDirectory === undefined) delete process.env.UPLOAD_DIR;
  else process.env.UPLOAD_DIR = originalDirectory;
  if (originalUrl === undefined) delete process.env.PUBLIC_API_URL;
  else process.env.PUBLIC_API_URL = originalUrl;
  await fs.rm(directory, { recursive: true, force: true });
});
const upload = () =>
  request(f.app).post("/api/v1/uploads/image").set(f.auth()).send({
    data: payload,
    mimeType: "image/png",
    purpose: "receipt",
    groupId: f.groupId,
  });
it("protects receipts, grants short access and rechecks membership when reading the link", async () => {
  const response = await upload().expect(201);
  const { url, filename } = response.body.data.file;
  expect(response.body.data.file.mimeType).toBe("image/webp");
  expect(
    (await sharp(await fs.readFile(path.join(directory, filename))).metadata())
      .format,
  ).toBe("webp");
  await request(f.app).get(`/uploads/${filename}`).expect(401);
  const link = await request(f.app)
    .get(`/api/v1/uploads/${filename}/access`)
    .set(f.auth())
    .expect(200);
  const access = new URL(link.body.data.url);
  const result = await request(f.app)
    .get(access.pathname + access.search)
    .expect(200);
  expect(result.headers["cache-control"]).toContain("no-store");
  expect(link.body.data.expiresIn).toBe(120);
  await Group.updateOne(
    { _id: f.groupId },
    { $set: { "members.0.status": "left" } },
  );
  await request(f.app)
    .get(access.pathname + access.search)
    .expect(403);
  await request(f.app)
    .get(`/api/v1/uploads/${filename}/access`)
    .set(f.auth())
    .expect(404);
  expect(url).toBe(`https://api.test/uploads/${filename}`);
});
it("rejects expired links and upload tokens on normal API endpoints", async () => {
  const response = await upload().expect(201);
  const filename = response.body.data.file.filename;
  const token = jwt.sign(
    { purpose: "upload", file: filename, sub: f.actor },
    String(process.env.JWT_SECRET),
    { expiresIn: -1 },
  );
  await request(f.app).get(`/uploads/${filename}?access=${token}`).expect(401);
  const link = await request(f.app)
    .get(`/api/v1/uploads/${filename}/access`)
    .set(f.auth())
    .expect(200);
  const accessToken = new URL(link.body.data.url).searchParams.get("access");
  await request(f.app)
    .get("/api/v1/auth/me")
    .set("Authorization", `Bearer ${accessToken}`)
    .expect(401);
});
it("only publishes explicitly public avatars", async () => {
  const response = await request(f.app)
    .post("/api/v1/uploads/image")
    .set(f.auth())
    .send({ data: payload, mimeType: "image/png", purpose: "avatar" })
    .expect(201);
  await request(f.app)
    .get(`/uploads/${response.body.data.file.filename}`)
    .expect(200);
  await request(f.app)
    .post("/api/v1/uploads/image")
    .set(f.auth())
    .send({ data: payload, mimeType: "image/png" })
    .expect(403);
});
it.each([
  { data: "bm90IGFuIGltYWdl", mimeType: "image/png" },
  { data: "***", mimeType: "image/png" },
])("rejects fake image bytes: %j", async (image) => {
  await request(f.app)
    .post("/api/v1/uploads/image")
    .set(f.auth())
    .send({ ...image, groupId: f.groupId })
    .expect(400);
  expect(await UploadedFile.countDocuments()).toBe(0);
});
it("rejects mismatched image types and excessive dimensions", async () => {
  await request(f.app)
    .post("/api/v1/uploads/image")
    .set(f.auth())
    .send({ data: payload, mimeType: "image/jpeg", groupId: f.groupId })
    .expect(400);
  const wide = (
    await sharp({
      create: { width: 9000, height: 1, channels: 3, background: "red" },
    })
      .png()
      .toBuffer()
  ).toString("base64");
  await request(f.app)
    .post("/api/v1/uploads/image")
    .set(f.auth())
    .send({ data: wide, mimeType: "image/png", groupId: f.groupId })
    .expect(400);
});
it("enforces the storage budget", async () => {
  await UploadQuota.create({ _id: f.actor, bytes: 100 * 1024 * 1024 });
  await upload().expect(429);
  expect(await UploadedFile.countDocuments()).toBe(0);
});
it("rejects foreign attachments, retains referenced receipts and removes abandoned files", async () => {
  const response = await upload().expect(201);
  const file = response.body.data.file;
  await request(f.app)
    .post(`/api/v1/groups/${f.groupId}/transactions`)
    .set(f.auth())
    .send({
      type: "contribution",
      amount: 10,
      attachments: [{ type: "image", url: "https://evil.test/image.jpg" }],
    })
    .expect(400);
  await request(f.app)
    .post(`/api/v1/groups/${f.groupId}/transactions`)
    .set(f.auth())
    .send({
      type: "contribution",
      amount: 10,
      attachments: [{ type: "image", url: file.url }],
    })
    .expect(201);
  const orphan = await upload().expect(201);
  const old = new Date(Date.now() - 2 * 86400000);
  await UploadedFile.collection.updateMany({}, { $set: { createdAt: old } });
  await cleanupAbandonedUploads();
  expect(
    await UploadedFile.findOne({ filename: file.filename }),
  ).not.toBeNull();
  expect(
    await UploadedFile.findOne({ filename: orphan.body.data.file.filename }),
  ).toBeNull();
  await expect(
    fs.access(path.join(directory, orphan.body.data.file.filename)),
  ).rejects.toThrow();
  expect(await Transaction.countDocuments()).toBe(1);
});
it("migrates legacy receipts privately with an original backup and can be rerun", async () => {
  const { migrateLegacyUploads } =
    await import("../../services/upload-migration.service");
  const filename = "a".repeat(32) + ".png";
  const original = Buffer.from(payload, "base64");
  await fs.writeFile(path.join(directory, filename), original);
  await Transaction.create({
    groupId: f.groupId,
    initiatedBy: f.actor,
    type: "contribution",
    amount: 10,
    attachments: [
      { type: "image", url: `https://api.test/uploads/${filename}` },
    ],
  });
  const backup = await fs.mkdtemp(path.join(os.tmpdir(), "badenya-originals-"));
  try {
    const dry = await migrateLegacyUploads({ apply: false });
    expect(dry.candidates).toBe(1);
    expect(await UploadedFile.exists({ filename })).toBeNull();
    await migrateLegacyUploads({ apply: true, backupDirectory: backup });
    expect(await fs.readFile(path.join(backup, filename))).toEqual(original);
    expect((await UploadedFile.findOne({ filename }))?.visibility).toBe(
      "private",
    );
    await request(f.app).get(`/uploads/${filename}`).expect(401);
    expect(
      (await migrateLegacyUploads({ apply: true, backupDirectory: backup }))
        .candidates,
    ).toBe(0);
  } finally {
    await fs.rm(backup, { recursive: true, force: true });
  }
});
it("rejects receipts for another group and revokes signed links on session changes", async () => {
  const uploaded = await upload().expect(201);
  const filename = uploaded.body.data.file.filename;
  const other = await Group.create({
    name: "Autre groupe",
    type: "tontine",
    members: [{ userId: f.actor, role: "admin", status: "active" }],
  });
  await request(f.app)
    .post(`/api/v1/groups/${other.id}/transactions`)
    .set(f.auth())
    .send({
      type: "contribution",
      amount: 10,
      attachments: [{ type: "image", url: uploaded.body.data.file.url }],
    })
    .expect(403);
  const access = await request(f.app)
    .get(`/api/v1/uploads/${filename}/access`)
    .set(f.auth())
    .expect(200);
  const { User } = await import("../../models");
  await User.updateOne({ _id: f.actor }, { $inc: { sessionVersion: 1 } });
  const url = new URL(access.body.data.url);
  await request(f.app)
    .get(url.pathname + url.search)
    .expect(403);
});
it("refuses to publish a legacy receipt shared across groups without changing its bytes", async () => {
  const { migrateLegacyUploads } =
    await import("../../services/upload-migration.service");
  const filename = "b".repeat(32) + ".png";
  const original = Buffer.from(payload, "base64");
  await fs.writeFile(path.join(directory, filename), original);
  const other = await Group.create({
    name: "Groupe secondaire",
    type: "tontine",
    members: [{ userId: f.actor, role: "admin", status: "active" }],
  });
  for (const groupId of [f.groupId, other.id])
    await Transaction.create({
      groupId,
      initiatedBy: f.actor,
      type: "contribution",
      amount: 10,
      attachments: [
        { type: "image", url: `https://api.test/uploads/${filename}` },
      ],
    });
  await expect(migrateLegacyUploads({ apply: false })).rejects.toThrow(
    "partagé",
  );
  expect(await fs.readFile(path.join(directory, filename))).toEqual(original);
  expect(await UploadedFile.countDocuments()).toBe(0);
});
