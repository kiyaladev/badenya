import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';

/**
 * Extended Express Request interface that includes user information
 * after successful authentication.
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * Authentication middleware that verifies JWT tokens from Authorization header.
 * 
 * @description
 * This middleware extracts and verifies JWT tokens from the Authorization header.
 * On successful verification, it attaches the user information to the request object.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * 
 * @returns void - Calls next() on success, sends error response on failure
 * 
 * @throws {401} No token provided - When Authorization header is missing or malformed
 * @throws {401} Invalid token - When token verification fails
 * @throws {401} Token expired - When token has expired
 * @throws {401} User not found - When token is valid but user doesn't exist
 * @throws {500} Authentication failed - When an unexpected error occurs
 * 
 * @example
 * ```typescript
 * // Use in routes
 * router.get('/protected', authenticate, (req, res) => {
 *   const user = (req as AuthRequest).user;
 *   res.json({ user });
 * });
 * ```
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        status: 'error',
        message: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }
    
    const decoded = jwt.verify(token, jwtSecret) as {
      id: string;
      email: string;
    };

    // Check if user exists
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Attach user to request
    (req as AuthRequest).user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid token',
      });
      return;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        status: 'error',
        message: 'Token expired',
      });
      return;
    }

    res.status(500).json({
      status: 'error',
      message: 'Authentication failed',
    });
  }
};

/**
 * Middleware to check if the authenticated user has admin privileges.
 * 
 * @description
 * This middleware should be used after the authenticate middleware.
 * It checks if the user has admin role and grants or denies access accordingly.
 * 
 * @param req - Express request object (should be AuthRequest with user)
 * @param res - Express response object
 * @param next - Express next function
 * 
 * @returns void - Calls next() if user is admin, sends error response otherwise
 * 
 * @throws {403} Access denied - When user is not authenticated or not an admin
 * 
 * @example
 * ```typescript
 * // Use in admin-only routes
 * router.delete('/users/:id', authenticate, isAdmin, deleteUser);
 * ```
 */
export const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authReq = req as AuthRequest;
  
  if (!authReq.user) {
    res.status(403).json({
      status: 'error',
      message: 'Access denied. Admin only.',
    });
    return;
  }

  // Verify user has admin role
  const user = await User.findById(authReq.user.id).select('role');
  if (!user || user.role !== 'admin') {
    res.status(403).json({
      status: 'error',
      message: 'Access denied. Admin only.',
    });
    return;
  }

  next();
};
