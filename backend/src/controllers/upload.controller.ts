import { Request, Response } from "express";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { AuthRequest } from "../middleware/auth";
import { requireAuth } from "../utils/typeGuards";
import logger from "../utils/logger";

const uploadDirectory = path.resolve(
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"),
);
const allowedMimeTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Accept a small base64 image from the mobile client and persist it as a
 * regular file. This keeps the mobile flow functional without putting base64
 * blobs inside transaction documents. A production deployment should replace
 * this local storage with an object store and signed URLs.
 */
export const uploadImage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;

    const { data, filename, mimeType } = req.body as {
      data?: unknown;
      filename?: unknown;
      mimeType?: unknown;
    };
    const normalizedMimeType = String(mimeType || "").toLowerCase();
    const extension = allowedMimeTypes.get(normalizedMimeType);

    if (typeof data !== "string" || !data || !extension) {
      res.status(400).json({
        status: "error",
        message: "A valid JPEG, PNG or WEBP image is required",
      });
      return;
    }

    const base64Payload = data.replace(/^data:[^;]+;base64,/, "");
    const imageBuffer = Buffer.from(base64Payload, "base64");
    if (!imageBuffer.length || imageBuffer.length > MAX_IMAGE_BYTES) {
      res.status(413).json({
        status: "error",
        message: "Image must be smaller than 5 MB",
      });
      return;
    }

    await fs.mkdir(uploadDirectory, { recursive: true });
    const storedFilename = `${crypto.randomBytes(16).toString("hex")}${extension}`;
    await fs.writeFile(
      path.join(uploadDirectory, storedFilename),
      imageBuffer,
      { flag: "wx" },
    );

    const configuredBaseUrl = process.env.PUBLIC_API_URL?.replace(
      /\/api\/v\d+\/?$/,
      "",
    );
    const publicBaseUrl =
      configuredBaseUrl || `${req.protocol}://${req.get("host")}`;
    const url = `${publicBaseUrl.replace(/\/$/, "")}/uploads/${storedFilename}`;

    res.status(201).json({
      status: "success",
      data: {
        file: {
          url,
          filename: String(filename || storedFilename).slice(0, 160),
          mimeType: normalizedMimeType,
          size: imageBuffer.length,
        },
      },
    });
  } catch (error) {
    logger.error("Upload image error:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to upload image" });
  }
};
