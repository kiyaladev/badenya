import { atomic, BusinessError } from "../services/financial.service";
import { entityId } from "../utils/membership";
import { sessionVersionQuery } from "../utils/sessionVersion";
import { Request, Response } from "express";
import crypto from "crypto";
import { User, Notification, Group } from "../models";
import { hashPassword, comparePassword } from "../utils/password";
import { generateTokens, verifyRefreshToken } from "../utils/jwt";
import { generateToken } from "../utils/crypto";
import { AuthRequest } from "../middleware/auth";
import { requireAuth } from "../utils/typeGuards";
import logger from "../utils/logger";
import {
  sendPasswordResetEmail,
  isEmailConfigured,
} from "../services/email.service";

/** Cookie options for httpOnly auth tokens (admin panel) */
const cookieOptions = (maxAgeMs: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite:
    process.env.AUTH_COOKIE_SAME_SITE === "none" &&
    process.env.NODE_ENV === "production"
      ? ("none" as const)
      : ("strict" as const),
  path: "/",
  maxAge: maxAgeMs,
});

const ACCESS_TOKEN_MAX_AGE = 24 * 60 * 60 * 1000; // 24h
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7d

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, phone, password, deviceId, deviceName } = req.body;

    // Validate input formats
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        status: "error",
        message: "Invalid email format",
      });
      return;
    }

    if (!password || password.length < 8) {
      res.status(400).json({
        status: "error",
        message: "Password must be at least 8 characters",
      });
      return;
    }

    if (!phone || !/^\+?[\d\s\-()]{10,}$/.test(phone)) {
      res.status(400).json({
        status: "error",
        message: "Invalid phone number format",
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      res.status(400).json({
        status: "error",
        message: "User with this email or phone already exists",
      });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      fullName,
      email,
      phone,
      password: hashedPassword,
      isEmailVerified: false,
    });

    if (!user.isActive) {
      res
        .status(403)
        .json({
          status: "error",
          code: "ACCOUNT_SUSPENDED",
          message: "Compte suspendu",
        });
      return;
    }
    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      sessionVersion: user.sessionVersion || 0,
    });

    // Save refresh token (with minimal info for now)
    user.refreshTokens.push({
      token: tokens.refreshToken,
      deviceId: deviceId || "web",
      deviceName: deviceName || "Web Browser",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    const { password: _, refreshTokens: __, ...safeUser } = userResponse;

    res
      .status(201)
      .cookie(
        "admin_token",
        tokens.accessToken,
        cookieOptions(ACCESS_TOKEN_MAX_AGE),
      )
      .cookie(
        "admin_refresh_token",
        tokens.refreshToken,
        cookieOptions(REFRESH_TOKEN_MAX_AGE),
      )
      .json({
        status: "success",
        message: "User registered successfully",
        data: {
          user: safeUser,
          tokens,
        },
      });
  } catch (error) {
    logger.error("Register error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to register user",
    });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, deviceId, deviceName } = req.body;

    // Find user by email or phone
    const user = await User.findOne({
      $or: [{ email }, { phone: email }],
    });

    if (!user) {
      res.status(401).json({
        status: "error",
        message: "Invalid credentials",
      });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        status: "error",
        message: "Invalid credentials",
      });
      return;
    }

    if (!user.isActive) {
      res
        .status(403)
        .json({
          status: "error",
          code: "ACCOUNT_SUSPENDED",
          message: "Compte suspendu",
        });
      return;
    }
    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      sessionVersion: user.sessionVersion || 0,
    });

    // Save refresh token
    user.refreshTokens.push({
      token: tokens.refreshToken,
      deviceId: deviceId || "web",
      deviceName: deviceName || "Web Browser",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // A concurrent suspension or password change must prevent session creation.
    const authenticated = await User.findOneAndUpdate(
      {
        _id: user._id,
        isActive: { $ne: false },
        ...sessionVersionQuery(user.sessionVersion || 0),
      },
      {
        $push: {
          refreshTokens: user.refreshTokens[user.refreshTokens.length - 1],
        },
        $set: { lastLoginAt: new Date() },
      },
      { new: true },
    );
    if (!authenticated) {
      res.status(401).json({ status: "error", message: "Session révoquée" });
      return;
    }

    // Remove password from response
    const userResponse = user.toObject();
    const { password: _, refreshTokens: __, ...safeUser } = userResponse;

    res
      .status(200)
      .cookie(
        "admin_token",
        tokens.accessToken,
        cookieOptions(ACCESS_TOKEN_MAX_AGE),
      )
      .cookie(
        "admin_refresh_token",
        tokens.refreshToken,
        cookieOptions(REFRESH_TOKEN_MAX_AGE),
      )
      .json({
        status: "success",
        message: "Login successful",
        data: {
          user: safeUser,
          tokens,
        },
      });
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to login",
    });
  }
};

// Refresh access token
export const refreshToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const refreshToken =
      req.body?.refreshToken || req.cookies?.admin_refresh_token;
    const { deviceId, deviceName } = req.body || {};

    if (!refreshToken) {
      res.status(401).json({
        status: "error",
        message: "Refresh token is required",
      });
      return;
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({
        status: "error",
        message: "Invalid refresh token",
      });
      return;
    }

    if (!user.isActive) {
      res
        .status(403)
        .json({
          status: "error",
          code: "ACCOUNT_SUSPENDED",
          message: "Compte suspendu",
        });
      return;
    }
    if ((decoded.sessionVersion || 0) !== (user.sessionVersion || 0)) {
      res.status(401).json({ status: "error", message: "Session révoquée" });
      return;
    }
    const tokenExists = user.refreshTokens.some((t) => {
      try {
        const a = Buffer.from(t.token);
        const b = Buffer.from(refreshToken);
        return a.length === b.length && crypto.timingSafeEqual(a, b);
      } catch {
        return false;
      }
    });

    if (!tokenExists) {
      res.status(401).json({
        status: "error",
        message: "Invalid refresh token",
      });
      return;
    }

    // Generate new tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      sessionVersion: user.sessionVersion || 0,
    });

    // Rotate one matching session with a compare-and-set so revocation wins races.
    const rotated = await User.findOneAndUpdate(
      {
        _id: user._id,
        isActive: { $ne: false },
        ...sessionVersionQuery(user.sessionVersion || 0),
        refreshTokens: {
          $elemMatch: { token: refreshToken, expiresAt: { $gt: new Date() } },
        },
      },
      {
        $set: {
          "refreshTokens.$": {
            token: tokens.refreshToken,
            deviceId: deviceId || "web",
            deviceName: deviceName || "Web Browser",
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE),
          },
        },
      },
      { new: true },
    );
    if (!rotated) {
      res
        .status(401)
        .json({ status: "error", message: "Session expirée ou révoquée" });
      return;
    }

    res
      .status(200)
      .cookie(
        "admin_token",
        tokens.accessToken,
        cookieOptions(ACCESS_TOKEN_MAX_AGE),
      )
      .cookie(
        "admin_refresh_token",
        tokens.refreshToken,
        cookieOptions(REFRESH_TOKEN_MAX_AGE),
      )
      .json({
        status: "success",
        message: "Token refreshed successfully",
        data: { tokens },
      });
  } catch (error) {
    logger.error("Refresh token error:", error);
    res.status(401).json({
      status: "error",
      message: "Invalid refresh token",
    });
  }
};

// Logout user
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const refreshTokenValue =
      req.body?.refreshToken || req.cookies?.admin_refresh_token;

    // Removing a session cannot overwrite a concurrent login or renewal.
    if (refreshTokenValue)
      await User.updateOne(
        { _id: authReq.user.id },
        { $pull: { refreshTokens: { token: refreshTokenValue } } },
      );

    res
      .status(200)
      .clearCookie("admin_token", { path: "/" })
      .clearCookie("admin_refresh_token", { path: "/" })
      .json({
        status: "success",
        message: "Logout successful",
      });
  } catch (error) {
    logger.error("Logout error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to logout",
    });
  }
};

// Forgot password - provider availability is checked before account lookup.
export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!isEmailConfigured()) {
      res
        .status(503)
        .json({
          status: "error",
          message: "Password reset email is currently unavailable",
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
    res
      .status(200)
      .json({
        status: "success",
        message:
          "Si un compte correspond, votre demande a été prise en compte. Si aucun email n’arrive, réessayez plus tard.",
      });
  } catch (error) {
    logger.error("Forgot password error:", error);
    res
      .status(500)
      .json({
        status: "error",
        message: "Failed to process password reset request",
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
      res
        .status(400)
        .json({ status: "error", message: "Invalid or expired reset token" });
      return;
    }
    res.clearCookie("admin_token", { path: "/" });
    res.clearCookie("admin_refresh_token", { path: "/" });
    res
      .status(200)
      .json({ status: "success", message: "Password reset successful" });
  } catch (error) {
    logger.error("Reset password error:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to reset password" });
  }
};

// Get current user
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
        message: "User not found",
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
      message: "Failed to get user",
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
        message: "User not found",
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
          message: "User with this email already exists",
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
      message: "Profile updated successfully",
      data: { user: safeUser },
    });
  } catch (error) {
    logger.error("Update profile error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update profile",
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
        message: "User not found",
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
        message: "Current password is incorrect",
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
      res
        .status(409)
        .json({
          status: "error",
          message: "Compte modifié : reconnectez-vous avant de réessayer",
        });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "Password changed successfully",
    });
  } catch (error) {
    logger.error("Change password error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to change password",
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
