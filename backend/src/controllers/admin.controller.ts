import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User, Group, Transaction } from '../models';

/**
 * GET /admin/dashboard/stats
 * Get dashboard statistics for admin panel
 */
export const getDashboardStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      totalGroups,
      activeGroups,
      totalTransactions,
      transactionVolume,
      recentUsers,
      recentGroups,
      recentTransactions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: { $ne: false } }),
      Group.countDocuments(),
      Group.countDocuments({ isActive: true }),
      Transaction.countDocuments(),
      Transaction.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Group.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Transaction.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalGroups,
        activeGroups,
        totalTransactions,
        totalTransactionVolume: transactionVolume[0]?.total || 0,
        recentActivity: {
          newUsers: recentUsers,
          newGroups: recentGroups,
          newTransactions: recentTransactions,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load dashboard stats' });
  }
};

/**
 * GET /admin/users
 * List all users with pagination and search
 */
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const search = req.query.search as string | undefined;

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -refreshTokens -emailVerificationToken -passwordResetToken -passwordResetExpires')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: { users, total },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load users' });
  }
};

/**
 * GET /admin/users/:id
 * Get a single user by ID
 */
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshTokens -emailVerificationToken -passwordResetToken -passwordResetExpires')
      .lean();

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({ success: true, data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load user' });
  }
};

/**
 * PUT /admin/users/:id/suspend
 * Suspend a user
 */
export const suspendUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password -refreshTokens');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({ success: true, data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to suspend user' });
  }
};

/**
 * PUT /admin/users/:id/activate
 * Activate a user
 */
export const activateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select('-password -refreshTokens');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({ success: true, data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to activate user' });
  }
};

/**
 * GET /admin/groups
 * List all groups with pagination, search, and type filter
 */
export const getAllGroups = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const search = req.query.search as string | undefined;
    const type = req.query.type as string | undefined;

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (type) {
      filter.type = type;
    }

    const [groups, total] = await Promise.all([
      Group.find(filter)
        .populate('createdBy', 'fullName email')
        .populate('members.userId', 'fullName email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Group.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: { groups, total },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load groups' });
  }
};

/**
 * GET /admin/groups/:id
 * Get a single group by ID
 */
export const getGroupById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('createdBy', 'fullName email')
      .populate('members.userId', 'fullName email')
      .lean();

    if (!group) {
      res.status(404).json({ success: false, message: 'Group not found' });
      return;
    }

    res.json({ success: true, data: { group } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load group' });
  }
};

/**
 * PUT /admin/groups/:id/archive
 * Archive a group
 */
export const archiveGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { isActive: false, archivedAt: new Date() },
      { new: true }
    );

    if (!group) {
      res.status(404).json({ success: false, message: 'Group not found' });
      return;
    }

    res.json({ success: true, data: { group } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to archive group' });
  }
};

/**
 * GET /admin/transactions
 * List all transactions with pagination and filters
 */
export const getAllTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const status = req.query.status as string | undefined;
    const type = req.query.type as string | undefined;

    const filter: Record<string, unknown> = {};
    if (status) {
      filter.status = status;
    }
    if (type) {
      filter.type = type;
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('groupId', 'name')
        .populate('initiatedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    // Map to match expected format (group, user fields)
    const mapped = transactions.map((t) => ({
      ...t,
      group: t.groupId,
      user: t.initiatedBy,
    }));

    res.json({
      success: true,
      data: { transactions: mapped, total },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load transactions' });
  }
};

/**
 * PUT /admin/transactions/:id/flag
 * Flag a transaction for review
 */
export const flagTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          'metadata.notes': `FLAGGED: ${reason || 'No reason provided'}`,
          status: 'pending',
        },
      },
      { new: true }
    );

    if (!transaction) {
      res.status(404).json({ success: false, message: 'Transaction not found' });
      return;
    }

    res.json({ success: true, data: { transaction } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to flag transaction' });
  }
};
