import { Request, Response } from 'express';
import { Notification, User } from '../models';
import { AuthRequest } from '../middleware/auth';
import { requireAuth } from '../utils/typeGuards';

// Get all notifications for current user
export const getUserNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    if (!requireAuth(authReq, res)) return;
    
    const { limit = '50', skip = '0', unreadOnly = 'false' } = req.query;

    // Build query
    interface NotificationQuery {
      userId: string;
      isRead?: boolean;
    }
    
    const query: NotificationQuery = { userId: authReq.user.id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(skip as string))
      .populate('data.groupId', 'name avatar')
      .populate('data.proposalId', 'title')
      .populate('data.transactionId', 'amount type');

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      userId: authReq.user.id,
      isRead: false,
    });

    res.status(200).json({
      status: 'success',
      data: {
        notifications,
        count: notifications.length,
        total,
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get notifications',
    });
  }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      userId: authReq.user.id,
    });

    if (!notification) {
      res.status(404).json({
        status: 'error',
        message: 'Notification not found',
      });
      return;
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read',
      data: { notification },
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark notification as read',
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;

    const result = await Notification.updateMany(
      { userId: authReq.user.id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read',
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark all notifications as read',
    });
  }
};

// Delete notification
export const deleteNotification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId: authReq.user.id,
    });

    if (!notification) {
      res.status(404).json({
        status: 'error',
        message: 'Notification not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete notification',
    });
  }
};

// Send notification (internal use or admin)
export const sendNotification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId, type, title, message, data, priority } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data: data || {},
      priority: priority || 'normal',
      isRead: false,
    });

    // TODO: Send push notification via Firebase Cloud Messaging
    // This will be implemented when Firebase is configured

    res.status(201).json({
      status: 'success',
      message: 'Notification sent successfully',
      data: { notification },
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send notification',
    });
  }
};

// Update device token for push notifications
export const updateDeviceToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        status: 'error',
        message: 'Device token is required',
      });
      return;
    }

    const user = await User.findById(authReq.user.id);
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Check if token already exists
    const tokenExists = user.deviceTokens?.some((t) => t === token);

    if (!tokenExists) {
      if (!user.deviceTokens) {
        user.deviceTokens = [];
      }
      user.deviceTokens.push(token);
      await user.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Device token updated successfully',
    });
  } catch (error) {
    console.error('Update device token error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update device token',
    });
  }
};

// Remove device token
export const removeDeviceToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        status: 'error',
        message: 'Device token is required',
      });
      return;
    }

    const user = await User.findById(authReq.user.id);
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    if (user.deviceTokens) {
      user.deviceTokens = user.deviceTokens.filter((t) => t !== token);
      await user.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Device token removed successfully',
    });
  } catch (error) {
    console.error('Remove device token error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove device token',
    });
  }
};
