import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

/**
 * Type guard to ensure request has authenticated user.
 * 
 * @description
 * This utility function checks if the request has an authenticated user
 * and sends a 401 response if not. It narrows the type of req.user
 * from optional to defined, eliminating the need for non-null assertions.
 * 
 * @param req - Express request object (AuthRequest)
 * @param res - Express response object
 * 
 * @returns boolean - True if user is authenticated, false otherwise
 * 
 * @example
 * ```typescript
 * export const someController = async (req: Request, res: Response) => {
 *   if (!requireAuth(req, res)) return;
 *   
 *   // Now req.user is guaranteed to be defined
 *   const userId = req.user.id; // No need for req.user!.id
 * };
 * ```
 */
export function requireAuth(
  req: AuthRequest,
  res: Response
): req is AuthRequest & { user: NonNullable<AuthRequest['user']> } {
  if (!req.user) {
    res.status(401).json({
      status: 'error',
      message: 'Unauthorized. Authentication required.',
    });
    return false;
  }
  return true;
}

/**
 * Gets authenticated user from request or throws error.
 * 
 * @description
 * Alternative helper that returns the user object directly.
 * Use this when you want to handle the error case differently.
 * 
 * @param req - Express request object (AuthRequest)
 * 
 * @returns User object from request
 * @throws Error if user is not authenticated
 * 
 * @example
 * ```typescript
 * export const someController = async (req: Request, res: Response) => {
 *   try {
 *     const user = getAuthUser(req);
 *     // Use user safely
 *   } catch (error) {
 *     return res.status(401).json({ message: 'Not authenticated' });
 *   }
 * };
 * ```
 */
export function getAuthUser(req: AuthRequest): NonNullable<AuthRequest['user']> {
  if (!req.user) {
    throw new Error('User not authenticated');
  }
  return req.user;
}
