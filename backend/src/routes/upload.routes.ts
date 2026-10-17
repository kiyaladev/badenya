import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  uploadImage,
  getUploadAccess,
  uploadLimiter,
} from "../controllers/upload.controller";

const router = Router();

router.post("/image", authenticate, uploadLimiter, uploadImage);
router.get("/:filename/access", authenticate, getUploadAccess);

export default router;
