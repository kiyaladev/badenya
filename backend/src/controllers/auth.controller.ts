import { Request, Response } from 'express';
import { User } from '../models';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { generateToken } from '../utils/crypto';
import { AuthRequest } from '../middleware/auth';
import { requireAuth } from '../utils/typeGuards';

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, phone, password } = req.body;

    // Validate input formats
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid email format',
      });
      return;
    }

    if (!password || password.length < 8) {
      res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters',
      });
      return;
    }

    if (!phone || !/^\+?[\d\s\-()]{10,}$/.test(phone)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid phone number format',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      res.status(400).json({
        status: 'error',
        message: 'User with this email or phone already exists',
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

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
    });

    // Save refresh token (with minimal info for now)
    user.refreshTokens.push({
      token: tokens.refreshToken,
      deviceId: 'web',
      deviceName: 'Web Browser',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    const { password: _, refreshTokens: __, ...safeUser } = userResponse;

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: safeUser,
        tokens,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to register user',
    });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user by email or phone
    const user = await User.findOne({
      $or: [{ email }, { phone: email }],
    });

    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
      return;
    }

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
    });

    // Save refresh token
    user.refreshTokens.push({
      token: tokens.refreshToken,
      deviceId: 'web',
      deviceName: 'Web Browser',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    
    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    const { password: _, refreshTokens: __, ...safeUser } = userResponse;

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: safeUser,
        tokens,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to login',
    });
  }
};

// Refresh access token
export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        status: 'error',
        message: 'Refresh token is required',
      });
      return;
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token',
      });
      return;
    }

    const tokenExists = user.refreshTokens.some((t) => t.token === refreshToken);

    if (!tokenExists) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token',
      });
      return;
    }

    // Generate new tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
    });

    // Replace old refresh token with new one
    user.refreshTokens = user.refreshTokens.filter(
      (t) => t.token !== refreshToken
    );
    user.refreshTokens.push({
      token: tokens.refreshToken,
      deviceId: 'web',
      deviceName: 'Web Browser',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: { tokens },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Invalid refresh token',
    });
  }
};

// Logout user
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { refreshToken } = req.body;

    // Find user and remove refresh token
    const user = await User.findById(authReq.user.id);

    if (user && refreshToken) {
      user.refreshTokens = user.refreshTokens.filter(
        (t) => t.token !== refreshToken
      );
      await user.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to logout',
    });
  }
};

// Forgot password - send reset token
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal that user doesn't exist
      res.status(200).json({
        status: 'success',
        message: 'If the email exists, a password reset link has been sent',
      });
      return;
    }

    // Generate reset token
    const resetToken = generateToken();
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // TODO: Send email with reset token
    // In production, send email instead of returning token
    res.status(200).json({
      status: 'success',
      message: 'If the email exists, a password reset link has been sent',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process password reset request',
    });
  }
};

// Reset password with token
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token',
      });
      return;
    }

    // Hash new password
    user.password = await hashPassword(newPassword);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    // Clear all refresh tokens
    user.refreshTokens = [];
    
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset password',
    });
  }
};

// Get current user
export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;

    const user = await User.findById(authReq.user.id).select('-password -refreshTokens');

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user',
    });
  }
};

// Update user profile
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { fullName, phone, avatar, preferences } = req.body;

    const user = await User.findById(authReq.user.id);

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Update fields
    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    const userResponse = user.toObject();
    const { password: _, refreshTokens: __, ...safeUser } = userResponse;

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { user: safeUser },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile',
    });
  }
};

// Change password
export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(authReq.user.id);

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect',
      });
      return;
    }

    // Hash and save new password
    user.password = await hashPassword(newPassword);
    
    // Clear all refresh tokens (force re-login on all devices)
    user.refreshTokens = [];
    
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to change password',
    });
  }
};
