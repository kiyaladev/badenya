import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { Group, Proposal, Transaction, User } from "../models";
import UploadedFile, { UploadQuota } from "../models/UploadedFile";
import { safeFilename, uploadDirectory } from "./upload.service";

interface Reference {
  ownerId: string;
  groupId?: string;
  private: boolean;
}

/** Offline migration. Unknown and ambiguous files remain inaccessible. */
export async function migrateLegacyUploads(options: {
  apply: boolean;
  backupDirectory?: string;
}) {
  const references = new Map<string, Reference[]>();
  const collect = (url: unknown, ref: Reference) => {
    if (typeof url !== "string") return;
    let filename: string;
    try {
      filename = new URL(url).pathname.split("/uploads/")[1];
    } catch {
      return;
    }
    if (!filename || !safeFilename(filename)) return;
    references.set(filename, [...(references.get(filename) || []), ref]);
  };
  for await (const user of User.find({
    "avatar.url": { $exists: true },
  }).cursor())
    collect(user.avatar?.url, { ownerId: user.id, private: false });
  for await (const group of Group.find({
    "avatar.url": { $exists: true },
  }).cursor())
    collect(group.avatar?.url, {
      ownerId: String(group.createdBy),
      private: false,
    });
  for await (const tx of Transaction.find({
    "attachments.0": { $exists: true },
  }).cursor())
    for (const item of tx.attachments || [])
      collect(item.url, {
        ownerId: String(tx.initiatedBy),
        groupId: String(tx.groupId),
        private: true,
      });
  for await (const proposal of Proposal.find({
    "attachments.0": { $exists: true },
  }).cursor())
    for (const item of proposal.attachments || [])
      collect(item.url, {
        ownerId: String(proposal.proposedBy),
        groupId: String(proposal.groupId),
        private: true,
      });
  const conflicts = [...references]
    .filter(
      ([, refs]) =>
        new Set(refs.filter((ref) => ref.private).map((ref) => ref.groupId))
          .size > 1,
    )
    .map(([name]) => name);
  if (conflicts.length)
    throw new Error(
      `${conflicts.length} fichier(s) partagé(s) entre groupes : attribuer une copie distincte par groupe avant migration`,
    );
  const directory = uploadDirectory();
  const backupDirectory = options.backupDirectory;
  if (options.apply) {
    if (!options.backupDirectory)
      throw new Error("UPLOAD_MIGRATION_BACKUP requis en mode --apply");
    const relative = path.relative(
      directory,
      path.resolve(options.backupDirectory),
    );
    if (
      !relative ||
      (!relative.startsWith(".." + path.sep) &&
        relative !== ".." &&
        !path.isAbsolute(relative))
    )
      throw new Error("La sauvegarde doit être hors du dossier uploads");
    await fs.mkdir(options.backupDirectory, { recursive: true, mode: 0o700 });
  }
  let migrated = 0;
  let missing = 0;
  for (const [filename, refs] of references) {
    if (await UploadedFile.exists({ filename })) continue;
    const source = path.join(directory, filename);
    let data: Buffer;
    try {
      data = await fs.readFile(source);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        missing++;
        continue;
      }
      throw error;
    }
    const clean = await sharp(data, {
      limitInputPixels: 16000000,
      failOn: "warning",
    })
      .rotate()
      .resize({
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();
    const ref = refs.find((ref) => ref.private) || refs[0];
    if (options.apply) {
      // COPYFILE_EXCL keeps the first original on reruns.
      await fs
        .copyFile(
          source,
          path.join(String(backupDirectory), filename),
          fs.constants.COPYFILE_EXCL,
        )
        .catch((error) => {
          if (error.code !== "EEXIST") throw error;
        });
      await fs.writeFile(source + ".migrating", clean, { mode: 0o600 });
      await fs.rename(source + ".migrating", source);
      await UploadedFile.create({
        filename,
        ownerId: ref.ownerId,
        groupId: ref.groupId,
        visibility: ref.private ? "private" : "public",
        mimeType: "image/webp",
        size: clean.length,
      });
    }
    migrated++;
  }
  if (options.apply) {
    const totals = await UploadedFile.aggregate([
      { $group: { _id: "$ownerId", bytes: { $sum: "$size" } } },
    ]);
    for (const total of totals)
      await UploadQuota.updateOne(
        { _id: total._id },
        { $set: { bytes: total.bytes } },
        { upsert: true },
      );
  }
  return { candidates: migrated, missing, applied: options.apply };
}
