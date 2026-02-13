import { Request, Response } from 'express';
import { Transaction, Group } from '../models';
import { AuthRequest } from '../middleware/auth';
import { requireAuth } from '../utils/typeGuards';

// Create new transaction
export const createTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { groupId } = req.params;
    const {
      type,
      amount,
      description,
      category,
      paymentMethod,
      paymentDetails,
      metadata,
      attachments,
    } = req.body;

    // Check if group exists and user is a member
    const group = await Group.findById(groupId);

    if (!group) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    const isMember = group.members.some(
      (m) => m.userId.toString() === authReq.user.id && m.status === 'active'
    );

    if (!isMember) {
      res.status(403).json({
        status: 'error',
        message: 'You are not a member of this group',
      });
      return;
    }

    // Create transaction
    const transaction = await Transaction.create({
      groupId,
      initiatedBy: authReq.user.id,
      type,
      amount,
      description,
      category,
      paymentMethod: {
        type: paymentMethod || 'cash',
        provider: paymentDetails?.provider,
        reference: paymentDetails?.reference,
      },
      status: 'pending',
      metadata: metadata || {},
      attachments: attachments || [],
    });

    await transaction.populate('initiatedBy', 'fullName email avatar');
    await transaction.populate('groupId', 'name type');

    // Update group balance for contributions
    if (type === 'contribution' && transaction.status === 'completed') {
      group.balance += amount;
      await group.save();
    }

    res.status(201).json({
      status: 'success',
      message: 'Transaction created successfully',
      data: { transaction },
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create transaction',
    });
  }
};

// Get all transactions for a group
export const getGroupTransactions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { groupId } = req.params;
    const { type, status, limit = '50', skip = '0' } = req.query;

    // Check if group exists and user is a member
    const group = await Group.findById(groupId);

    if (!group) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    const isMember = group.members.some(
      (m) => m.userId.toString() === authReq.user.id && m.status === 'active'
    );

    if (!isMember) {
      res.status(403).json({
        status: 'error',
        message: 'You are not a member of this group',
      });
      return;
    }

    // Build query
    interface TransactionQuery {
      groupId: string;
      type?: string;
      status?: string;
    }
    
    const query: TransactionQuery = { groupId: groupId as string };
    if (type) query.type = type as string;
    if (status) query.status = status as string;

    const transactions = await Transaction.find(query)
      .populate('initiatedBy', 'fullName email avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(skip as string));

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        transactions,
        count: transactions.length,
        total,
      },
    });
  } catch (error) {
    console.error('Get group transactions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get transactions',
    });
  }
};

// Get transaction by ID
export const getTransactionById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { id } = req.params;

    const transaction = await Transaction.findById(id)
      .populate('initiatedBy', 'fullName email avatar phone')
      .populate('groupId', 'name type');

    if (!transaction) {
      res.status(404).json({
        status: 'error',
        message: 'Transaction not found',
      });
      return;
    }

    // Check if user is a member of the group
    const group = await Group.findById(transaction.groupId);

    if (!group) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    const isMember = group.members.some(
      (m) => m.userId.toString() === authReq.user.id && m.status === 'active'
    );

    if (!isMember) {
      res.status(403).json({
        status: 'error',
        message: 'You are not a member of this group',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { transaction },
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get transaction',
    });
  }
};

// Verify/Complete transaction (admin/treasurer only)
export const verifyTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { id } = req.params;
    const { notes } = req.body;

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      res.status(404).json({
        status: 'error',
        message: 'Transaction not found',
      });
      return;
    }

    // Check if user is admin or treasurer
    const group = await Group.findById(transaction.groupId);

    if (!group) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    const member = group.members.find(
      (m) => m.userId.toString() === authReq.user.id
    );

    if (!member || !['admin', 'treasurer'].includes(member.role)) {
      res.status(403).json({
        status: 'error',
        message: 'Only admins or treasurers can verify transactions',
      });
      return;
    }

    if (transaction.status !== 'pending') {
      res.status(400).json({
        status: 'error',
        message: 'Transaction is not pending',
      });
      return;
    }

    // Update transaction
    transaction.status = 'completed';
    transaction.processedAt = new Date();
    
    if (notes) {
      transaction.metadata = {
        ...transaction.metadata,
        notes,
      };
    }

    await transaction.save();

    // Update group balance
    if (transaction.type === 'contribution') {
      group.balance += transaction.amount;
      group.stats.totalContributions += transaction.amount;
    } else if (transaction.type === 'expense') {
      group.balance -= transaction.amount;
      group.stats.totalExpenses += transaction.amount;
    }

    // Update member's contribution
    const transactionMember = group.members.find(
      (m) => m.userId.toString() === transaction.initiatedBy.toString()
    );
    if (transactionMember && transaction.type === 'contribution') {
      transactionMember.totalContributed += transaction.amount;
      transactionMember.lastContributionAt = new Date();
    }

    await group.save();

    await transaction.populate('initiatedBy', 'fullName email avatar');

    res.status(200).json({
      status: 'success',
      message: 'Transaction verified successfully',
      data: { transaction },
    });
  } catch (error) {
    console.error('Verify transaction error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify transaction',
    });
  }
};

// Cancel transaction
export const cancelTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { id } = req.params;
    const { reason } = req.body;

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      res.status(404).json({
        status: 'error',
        message: 'Transaction not found',
      });
      return;
    }

    // Check if user is the creator or admin/treasurer
    const group = await Group.findById(transaction.groupId);

    if (!group) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    const member = group.members.find(
      (m) => m.userId.toString() === authReq.user.id
    );

    const isCreator = transaction.initiatedBy.toString() === authReq.user.id;
    const isAdminOrTreasurer =
      member && ['admin', 'treasurer'].includes(member.role);

    if (!isCreator && !isAdminOrTreasurer) {
      res.status(403).json({
        status: 'error',
        message: 'Only the creator or admins/treasurers can cancel transactions',
      });
      return;
    }

    if (transaction.status === 'completed') {
      res.status(400).json({
        status: 'error',
        message: 'Cannot cancel a completed transaction',
      });
      return;
    }

    transaction.status = 'cancelled';
    transaction.metadata = {
      ...transaction.metadata,
      notes: reason || 'Cancelled by user',
    };

    await transaction.save();

    res.status(200).json({
      status: 'success',
      message: 'Transaction cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel transaction error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel transaction',
    });
  }
};
