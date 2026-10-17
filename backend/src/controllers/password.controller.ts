import { Request, Response } from "express";
import crypto from "crypto";
import { User } from "../models";
import { hashPassword } from "../utils/password";
import { generateToken } from "../utils/crypto";
import {
  sendPasswordResetEmail,
  isEmailConfigured,
} from "../services/email.service";
import logger from "../utils/logger";
// Forgot password - provider availability is checked before account lookup.
export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!isEmailConfigured()) {
      res.status(503).json({
        status: "error",
        message:
          "L’envoi du lien de réinitialisation est temporairement indisponible",
      });
      return;
    }
    const email = String(req.body.email).trim().toLowerCase();
    const user = await User.findOne({ email, isActive: { $ne: false } });
    if (user) {
      const resetToken = generateToken();
      const tokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      await User.updateOne(
        { _id: user._id, isActive: { $ne: false } },
        {
          $set: {
            passwordResetToken: tokenHash,
            passwordResetExpires: new Date(Date.now() + 3600000),
          },
        },
      );
      const sent = await sendPasswordResetEmail(
        user.email,
        resetToken,
        user.fullName,
      );
      if (!sent) {
        // Do not clear a newer reset request when concurrent sends finish out of order.
        await User.updateOne(
          { _id: user._id, passwordResetToken: tokenHash },
          {
            $unset: { passwordResetToken: "", passwordResetExpires: "" },
          },
        );
        logger.warn("Password reset delivery failed; token invalidated");
      }
    }
    res.status(200).json({
      status: "success",
      message:
        "Si un compte correspond, votre demande a été prise en compte. Si aucun email n’arrive, réessayez plus tard.",
    });
  } catch (error) {
    logger.error("Forgot password error:", error);
    res.status(500).json({
      status: "error",
      message: "Impossible de traiter la demande de réinitialisation",
    });
  }
};

// The token is consumed in the same atomic update that changes the password.
export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const password = await hashPassword(newPassword);
    const user = await User.findOneAndUpdate(
      {
        passwordResetToken: tokenHash,
        passwordResetExpires: { $gt: new Date() },
        isActive: { $ne: false },
      },
      {
        $set: { password, refreshTokens: [], tokensValidAfter: new Date() },
        $inc: { sessionVersion: 1 },
        $unset: { passwordResetToken: "", passwordResetExpires: "" },
      },
      { new: true },
    );
    if (!user) {
      res.status(400).json({
        status: "error",
        message: "Lien de réinitialisation invalide ou expiré",
      });
      return;
    }
    res.clearCookie("admin_token", { path: "/" });
    res.clearCookie("admin_refresh_token", { path: "/" });
    res
      .status(200)
      .json({ status: "success", message: "Mot de passe réinitialisé" });
  } catch (error) {
    logger.error("Reset password error:", error);
    res.status(500).json({
      status: "error",
      message: "Impossible de réinitialiser le mot de passe",
    });
  }
};
