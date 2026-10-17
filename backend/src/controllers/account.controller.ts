import { Request, Response } from "express";
import { User, Notification, Group } from "../models";
import { atomic, BusinessError } from "../services/financial.service";
import { entityId } from "../utils/membership";
import { sessionVersionQuery } from "../utils/sessionVersion";
import { hashPassword, comparePassword } from "../utils/password";
import { AuthRequest } from "../middleware/auth";
import { requireAuth } from "../utils/typeGuards";
import logger from "../utils/logger";
export const getCurrentUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;

    const user = await User.findById(authReq.user.id).select(
      "-password -refreshTokens",
    );

    if (!user) {
      res.status(404).json({
        status: "error",
        message: "Compte introuvable",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    logger.error("Get current user error:", error);
    res.status(500).json({
      status: "error",
      message: "Impossible de charger le compte",
    });
  }
};

// Update user profile
export const updateProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { fullName, email, phone, avatar, preferences } = req.body;

    const user = await User.findById(authReq.user.id);

    if (!user) {
      res.status(404).json({
        status: "error",
        message: "Compte introuvable",
      });
      return;
    }

    // Update fields
    if (fullName) user.fullName = fullName;
    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: user._id },
      });

      if (existingUser) {
        res.status(409).json({
          status: "error",
          message: "Un compte utilise déjà cette adresse email",
        });
        return;
      }

      user.email = email.toLowerCase();
      user.isEmailVerified = false;
    }
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;
    if (preferences) {
      user.preferences = {
        ...user.preferences,
        ...preferences,
        notifications: {
          ...user.preferences.notifications,
          ...(preferences.notifications || {}),
        },
      };
    }

    await user.save();

    const userResponse = user.toObject();
    const { password: _, refreshTokens: __, ...safeUser } = userResponse;

    res.status(200).json({
      status: "success",
      message: "Profil modifié",
      data: { user: safeUser },
    });
  } catch (error) {
    logger.error("Update profile error:", error);
    res.status(500).json({
      status: "error",
      message: "Impossible de modifier le profil",
    });
  }
};

// Change password
export const changePassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(authReq.user.id);

    if (!user) {
      res.status(404).json({
        status: "error",
        message: "Compte introuvable",
      });
      return;
    }

    // Verify current password
    const isPasswordValid = await comparePassword(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      res.status(401).json({
        status: "error",
        message: "Le mot de passe actuel est incorrect",
      });
      return;
    }

    const passwordHash = await hashPassword(newPassword);
    const changed = await User.findOneAndUpdate(
      {
        _id: user._id,
        isActive: { $ne: false },
        password: user.password,
        ...sessionVersionQuery(user.sessionVersion || 0),
      },
      {
        $set: {
          password: passwordHash,
          refreshTokens: [],
          tokensValidAfter: new Date(),
        },
        $inc: { sessionVersion: 1 },
      },
      { new: true },
    );
    if (!changed) {
      res.status(409).json({
        status: "error",
        message: "Compte modifié : reconnectez-vous avant de réessayer",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "Mot de passe modifié",
    });
  } catch (error) {
    logger.error("Change password error:", error);
    res.status(500).json({
      status: "error",
      message: "Impossible de modifier le mot de passe",
    });
  }
};

// Account deletion and group governance must commit together: neither a failed
// last-admin check nor a concurrent demotion may leave partial cleanup behind.
export const deleteAccount = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authReq = req as AuthRequest;
  if (!requireAuth(authReq, res)) return;
  try {
    await atomic(async (session) => {
      const userId = authReq.user.id;
      const user = await User.findById(userId).session(session);
      if (!user) throw new BusinessError(404, "Compte introuvable");
      const groups = await Group.find({
        $or: [{ "members.userId": userId }, { "joinRequests.userId": userId }],
      }).session(session);
      for (const group of groups) {
        const activeAdmins = group.members.filter(
          (member) => member.status === "active" && member.role === "admin",
        );
        if (
          group.isActive &&
          !group.archivedAt &&
          activeAdmins.length === 1 &&
          entityId(activeAdmins[0].userId) === userId
        ) {
          throw new BusinessError(
            409,
            "Désignez un autre administrateur actif avant de supprimer votre compte",
            "LAST_GROUP_ADMIN",
          );
        }
        group.members = group.members.filter(
          (member) => entityId(member.userId) !== userId,
        );
        group.joinRequests = group.joinRequests.filter(
          (request) => entityId(request.userId) !== userId,
        );
        // Version-checked writes serialize membership deletion against demotions.
        await group.save({ session });
      }
      await Notification.deleteMany({ userId }).session(session);
      await User.deleteOne({ _id: user._id }).session(session);
    });
    res
      .clearCookie("admin_token", { path: "/" })
      .clearCookie("admin_refresh_token", { path: "/" });
    res.status(200).json({ status: "success", message: "Compte supprimé" });
  } catch (error) {
    if (error instanceof BusinessError) {
      res
        .status(error.status)
        .json({ status: "error", code: error.code, message: error.message });
      return;
    }
    logger.error("Delete account error:", error);
    res
      .status(500)
      .json({ status: "error", message: "Échec de la suppression du compte" });
  }
};
