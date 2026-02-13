import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';
import { AuthRequest } from '../middleware/auth';

/**
 * Extended Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user: IUser;
}

/**
 * Type guard to check if request has authenticated user
 * @param req Express request object
 * @returns true if request has authenticated user
 */
export function isAuthenticatedRequest(req: Request): req is AuthenticatedRequest {
  const authReq = req as AuthRequest;
  return authReq.user !== undefined && authReq.user !== null;
}

/**
 * Assert that request has authenticated user
 * Throws error if user is not authenticated
 * @param req Express request object
 * @param res Express response object
 * @returns The authenticated user or sends 401 response
 */
export function requireAuth(
  req: Request,
  res: Response
): asserts req is AuthenticatedRequest {
  if (!isAuthenticatedRequest(req)) {
    res.status(401).json({ message: 'Authentication required' });
    throw new Error('Unauthorized');
  }
}

/**
 * Get authenticated user from request
 * Returns user or sends 401 response and throws error
 * @param req Express request object
 * @param res Express response object
 * @returns The authenticated user
 */
export function getAuthUser(req: Request, res: Response): IUser {
  requireAuth(req, res);
  return req.user;
}

/**
 * Middleware to ensure request has authenticated user
 * Use after auth middleware to get type-safe user access
 */
export function ensureAuth(req: Request, res: Response, next: NextFunction): void {
  if (!isAuthenticatedRequest(req)) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  next();
}

/**
 * Type-safe wrapper for route handlers that require authentication
 * @param handler Route handler function
 * @returns Wrapped handler with type-safe user access
 */
export function withAuth(
  handler: (req: AuthenticatedRequest, res: Response) => Promise<void> | void
) {
  return async (req: Request, res: Response): Promise<void> => {
    if (!isAuthenticatedRequest(req)) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    await handler(req, res);
  };
}
