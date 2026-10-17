import { Request, Response } from "express";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../utils/typeGuards";
import { AuthRequest } from "../middleware/auth";
import { Group, User } from "../models";
import UploadedFile, { UploadQuota } from "../models/UploadedFile";
import { activeMember } from "../utils/membership";
import { BusinessError } from "../services/financial.service";
import {
  canReadUpload,
  reserveUploadBytes,
  safeFilename,
  uploadDirectory,
  uploadUrl,
} from "../services/upload.service";
import logger from "../utils/logger";

export const uploadLimiter = rateLimit({
  windowMs: 3600000,
  limit: 30,
  keyGenerator: (req) => (req as AuthRequest).user?.id || "anonymous",
  message: {
    status: "error",
    message: "Limite de 30 images par heure atteinte",
  },
});
function uploadSigningSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET requis");
  return secret;
}
const MAX_BYTES = 5 * 1024 * 1024;
const types: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};
const failure = (res: Response, error: unknown) => {
  if (error instanceof BusinessError)
    res.status(error.status).json({ status: "error", message: error.message });
  else {
    logger.error("Upload failed", error);
    res
      .status(500)
      .json({ status: "error", message: "Impossible de traiter le fichier" });
  }
};

export async function uploadImage(req: Request, res: Response) {
  const authReq = req as AuthRequest;
  if (!requireAuth(authReq, res)) return;
  const actor = authReq.user.id;
  let reserved = 0;
  let filename: string | undefined;
  try {
    const { data, mimeType, purpose, groupId } = req.body;
    if (purpose !== undefined && !["avatar", "receipt"].includes(purpose))
      throw new BusinessError(400, "Usage du fichier invalide");
    const visibility = purpose === "avatar" ? "public" : "private";
    if (
      visibility === "private" &&
      (!/^[a-f0-9]{24}$/i.test(String(groupId)) ||
        !activeMember(await Group.findById(groupId), actor))
    )
      throw new BusinessError(
        403,
        "Un groupe accessible est requis pour le justificatif",
      );
    if (
      typeof data !== "string" ||
      data.length > Math.ceil(MAX_BYTES / 3) * 4 + 100
    )
      throw new BusinessError(413, "Image limitée à 5 Mo");
    const payload = data.replace(/^data:image\/(?:jpeg|png|webp);base64,/, "");
    if (
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
        payload,
      ) ||
      !payload.length
    )
      throw new BusinessError(400, "Image base64 invalide");
    const input = Buffer.from(payload, "base64");
    if (input.length > MAX_BYTES)
      throw new BusinessError(413, "Image limitée à 5 Mo");
    let output: Buffer;
    try {
      const image = sharp(input, {
        limitInputPixels: 16000000,
        failOn: "warning",
      });
      const meta = await image.metadata();
      if (
        !meta.format ||
        types[meta.format] !== mimeType ||
        !meta.width ||
        !meta.height ||
        meta.width > 8192 ||
        meta.height > 8192 ||
        (meta.pages || 1) > 1
      )
        throw new Error("Invalid image");
      // Full decoding rejects damaged data; re-encoding strips metadata and embedded payloads.
      output = await image
        .rotate()
        .resize({
          width: 2400,
          height: 2400,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      throw new BusinessError(
        400,
        "Image JPEG, PNG ou WEBP valide requise (16 mégapixels maximum)",
      );
    }
    if (output.length > MAX_BYTES)
      throw new BusinessError(413, "Image traitée trop volumineuse");
    await reserveUploadBytes(actor, output.length);
    reserved = output.length;
    filename = `${crypto.randomBytes(16).toString("hex")}.webp`;
    await fs.mkdir(uploadDirectory(), { recursive: true, mode: 0o700 });
    await fs.writeFile(path.join(uploadDirectory(), filename), output, {
      flag: "wx",
      mode: 0o600,
    });
    await UploadedFile.create({
      filename,
      ownerId: actor,
      groupId: visibility === "private" ? groupId : undefined,
      visibility,
      size: output.length,
      mimeType: "image/webp",
    });
    reserved = 0;
    res.status(201).json({
      status: "success",
      data: {
        file: {
          url: uploadUrl(filename),
          filename,
          mimeType: "image/webp",
          size: output.length,
        },
      },
    });
  } catch (error) {
    if (reserved) {
      await UploadQuota.updateOne(
        { _id: actor },
        { $inc: { bytes: -reserved } },
      );
      if (filename)
        await fs.unlink(path.join(uploadDirectory(), filename)).catch(() => {});
    }
    failure(res, error);
  }
}

export async function getUploadAccess(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const actor = authReq.user.id;
    const file = safeFilename(String(req.params.filename))
      ? await UploadedFile.findOne({ filename: req.params.filename })
      : null;
    if (!file || !(await canReadUpload(file, actor)))
      throw new BusinessError(404, "Fichier inaccessible");
    const user = await User.findById(actor);
    const token = jwt.sign(
      {
        purpose: "upload",
        file: file.filename,
        sub: actor,
        sessionVersion: user?.sessionVersion || 0,
      },
      uploadSigningSecret(),
      { expiresIn: 120 },
    );
    res.setHeader("Cache-Control", "no-store");
    res.json({
      status: "success",
      data: {
        url: `${uploadUrl(file.filename)}?access=${encodeURIComponent(token)}`,
        expiresIn: 120,
      },
    });
  } catch (error) {
    failure(res, error);
  }
}

export async function serveUpload(req: Request, res: Response) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  try {
    const filename = String(req.params.filename);
    const file = safeFilename(filename)
      ? await UploadedFile.findOne({ filename })
      : null;
    if (!file) throw new BusinessError(404, "Fichier inaccessible");
    if (file.visibility !== "public") {
      let decoded: jwt.JwtPayload;
      try {
        decoded = jwt.verify(
          String(req.query.access || ""),
          uploadSigningSecret(),
          { algorithms: ["HS256"] },
        ) as jwt.JwtPayload;
      } catch {
        throw new BusinessError(401, "Lien expiré ou session requise");
      }
      if (
        decoded.purpose !== "upload" ||
        decoded.file !== filename ||
        !decoded.sub
      )
        throw new BusinessError(401, "Lien invalide");
      const user = await User.findById(decoded.sub).select(
        "isActive sessionVersion",
      );
      if (
        !user?.isActive ||
        (user.sessionVersion || 0) !== decoded.sessionVersion ||
        !(await canReadUpload(file, user.id))
      )
        throw new BusinessError(403, "Accès révoqué");
    }
    res.type(file.mimeType);
    res.sendFile(path.join(uploadDirectory(), filename), (error) => {
      if (error && !res.headersSent)
        res
          .status(404)
          .json({ status: "error", message: "Fichier introuvable" });
    });
  } catch (error) {
    failure(res, error);
  }
}
