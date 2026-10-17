import path from "path";
import fs from "fs/promises";
import mongoose from "mongoose";
import { Group, Transaction, Proposal, User } from "../models";
import UploadedFile, { UploadQuota } from "../models/UploadedFile";
import { activeMember } from "../utils/membership";
import { BusinessError } from "./financial.service";

export const uploadDirectory = () =>
  path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
export const uploadBaseUrl = () =>
  (process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`)
    .replace(/\/api\/v\d+\/?$/, "")
    .replace(/\/$/, "");
export const uploadUrl = (filename: string) =>
  `${uploadBaseUrl()}/uploads/${filename}`;
export const safeFilename = (filename: string) =>
  /^[a-f0-9]{32}\.(?:jpg|png|webp)$/.test(filename);

export async function canReadUpload(
  file: { visibility: string; groupId?: mongoose.Types.ObjectId | null },
  actor: string,
) {
  return (
    file.visibility === "public" ||
    Boolean(
      file.groupId && activeMember(await Group.findById(file.groupId), actor),
    )
  );
}

/** Only receipts uploaded by this actor for this group may enter a new record. */
export async function validateAttachments(
  attachments: unknown,
  groupId: string,
  actor: string,
) {
  if (attachments === undefined) return;
  if (!Array.isArray(attachments) || attachments.length > 10)
    throw new BusinessError(400, "Dix justificatifs au maximum");
  for (const attachment of attachments) {
    if (!attachment || typeof attachment.url !== "string")
      throw new BusinessError(400, "Justificatif invalide");
    let parsed: URL;
    try {
      parsed = new URL(attachment.url);
    } catch {
      throw new BusinessError(400, "URL de justificatif invalide");
    }
    const filename = path.posix.basename(parsed.pathname);
    if (!safeFilename(filename) || attachment.url !== uploadUrl(filename))
      throw new BusinessError(400, "Justificatif hébergé par Badenya requis");
    const file = await UploadedFile.findOne({
      filename,
      groupId,
      ownerId: actor,
      visibility: "private",
      createdAt: { $gte: new Date(Date.now() - 23 * 3600000) },
    });
    if (!file)
      throw new BusinessError(403, "Justificatif inaccessible pour ce groupe");
  }
}

/** Reserve a per-account disk budget atomically, including concurrent uploads. */
export async function reserveUploadBytes(owner: string, size: number) {
  await UploadQuota.updateOne(
    { _id: owner },
    { $setOnInsert: { bytes: 0 } },
    { upsert: true },
  );
  const reserved = await UploadQuota.findOneAndUpdate(
    { _id: owner, bytes: { $lte: 100 * 1024 * 1024 - size } },
    { $inc: { bytes: size } },
  );
  if (!reserved)
    throw new BusinessError(429, "Quota de stockage atteint (100 Mo)");
}

/** Retain all referenced receipts. Remove only abandoned uploads older than a day. */
export async function cleanupAbandonedUploads(now = new Date()) {
  const files = UploadedFile.find({
    createdAt: { $lt: new Date(now.getTime() - 86400000) },
  }).cursor();
  for await (const file of files) {
    const suffix = new RegExp(
      `/uploads/${file.filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
    );
    const referenced = await Promise.all([
      Transaction.exists({ "attachments.url": suffix }),
      Proposal.exists({ "attachments.url": suffix }),
      User.exists({ "avatar.url": suffix }),
      Group.exists({ "avatar.url": suffix }),
    ]);
    if (referenced.some(Boolean)) continue;
    // New attachments only accept files younger than 24h (see attachment validation).
    const deleted = await UploadedFile.findOneAndDelete({ _id: file._id });
    if (!deleted) continue;
    await fs
      .unlink(path.join(uploadDirectory(), file.filename))
      .catch((error) => {
        if (error.code !== "ENOENT") throw error;
      });
    await UploadQuota.updateOne(
      { _id: file.ownerId },
      { $inc: { bytes: -file.size } },
    );
  }
}
