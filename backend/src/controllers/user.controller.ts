import { Request, Response } from 'express';
import { User } from '../models';
import { AuthRequest } from '../middleware/auth';
import { requireAuth } from '../utils/typeGuards';
import logger from '../utils/logger';

// Search users by name, email, or phone
export const searchUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;

    const query = (req.query.q as string).trim();

    const users = await User.find({
      $or: [
        { fullName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
      ],
      _id: { $ne: authReq.user.id }, // Exclude the current user
    })
      .select('fullName email phone avatar')
      .limit(20);

    res.status(200).json({
      status: 'success',
      data: { users },
    });
  } catch (error) {
    logger.error('Search users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to search users',
    });
  }
};
