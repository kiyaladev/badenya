import { sessionVersionQuery } from "../utils/sessionVersion";
import { Request, Response } from "express";
import crypto from "crypto";
import { User } from "../models";
import { hashPassword, comparePassword } from "../utils/password";
import { generateTokens, verifyRefreshToken } from "../utils/jwt";
import { AuthRequest } from "../middleware/auth";
import { requireAuth } from "../utils/typeGuards";
import logger from "../utils/logger";

import {
  cookieOptions,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
} from "../utils/authCookies";

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, phone, password, deviceId, deviceName } = req.body;

    // Validate input formats
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        status: "error",
        message: "Adresse email invalide",
      });
      return;
    }

    if (!password || password.length < 8) {
      res.status(400).json({
        status: "error",
        message: "Le mot de passe doit contenir au moins 8 caractères",
      });
      return;
    }

    if (!phone || !/^\+?[\d\s\-()]{10,}$/.test(phone)) {
      res.status(400).json({
        status: "error",
        message: "Numéro de téléphone invalide",
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
        message: "Un compte utilise déjà cet email ou ce téléphone",
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
      res.status(403).json({
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
        message: "Compte créé",
        data: {
          user: safeUser,
          tokens,
        },
      });
  } catch (error) {
    logger.error("Register error:", error);
    res.status(500).json({
      status: "error",
      message: "Impossible de créer le compte",
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
        message: "Identifiants incorrects",
      });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        status: "error",
        message: "Identifiants incorrects",
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
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
        message: "Connexion réussie",
        data: {
          user: safeUser,
          tokens,
        },
      });
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({
      status: "error",
      message: "Impossible de se connecter",
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
        message: "Le jeton de renouvellement est requis",
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
        message: "Jeton de renouvellement invalide",
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
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
        message: "Jeton de renouvellement invalide",
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
        message: "Session renouvelée",
        data: { tokens },
      });
  } catch (error) {
    logger.error("Refresh token error:", error);
    res.status(401).json({
      status: "error",
      message: "Jeton de renouvellement invalide",
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
        message: "Déconnexion réussie",
      });
  } catch (error) {
    logger.error("Logout error:", error);
    res.status(500).json({
      status: "error",
      message: "Impossible de se déconnecter",
    });
  }
};

// Get current user

export { forgotPassword, resetPassword } from "./password.controller";
export {
  getCurrentUser,
  updateProfile,
  changePassword,
  deleteAccount,
} from "./account.controller";
