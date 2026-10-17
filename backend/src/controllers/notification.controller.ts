import { Request, Response } from "express";
import { Notification, User } from "../models";
import { AuthRequest } from "../middleware/auth";
import { requireAuth } from "../utils/typeGuards";
import logger from "../utils/logger";

// Get all notifications for current user
export const getUserNotifications = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;

    const { limit = "50", skip = "0", unreadOnly = "false" } = req.query;

    // Build query
    interface NotificationQuery {
      userId: string;
      isRead?: boolean;
    }

    const query: NotificationQuery = { userId: authReq.user.id };
    if (unreadOnly === "true") {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(skip as string))
      .populate("data.groupId", "name avatar")
      .populate("data.proposalId", "title")
      .populate("data.transactionId", "amount type");

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      userId: authReq.user.id,
      isRead: false,
    });

    res.status(200).json({
      status: "success",
      data: {
        notifications,
        count: notifications.length,
        total,
        unreadCount,
      },
    });
  } catch (error) {
    logger.error("Get notifications error:", error);
    res.status(500).json({
      status: "error",
      message: "Impossible de charger les notifications",
    });
  }
};

// Mark notification as read
export const markAsRead = async (
  req: Request,
  res: Response,
): Promise<void> => {
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
        status: "error",
        message: "Notification introuvable",
      });
      return;
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.status(200).json({
      status: "success",
      message: "Notification marquée comme lue",
      data: { notification },
    });
  } catch (error) {
    logger.error("Mark notification as read error:", error);
    res.status(500).json({
      status: "error",
      message: "Impossible de marquer la notification comme lue",
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;

    const result = await Notification.updateMany(
      { userId: authReq.user.id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
    );

    res.status(200).json({
      status: "success",
      message: "Toutes les notifications sont marquées comme lues",
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    logger.error("Mark all as read error:", error);
    res.status(500).json({
      status: "error",
      message: "Impossible de marquer les notifications comme lues",
    });
  }
};

// Delete notification
export const deleteNotification = async (
  req: Request,
  res: Response,
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
        status: "error",
        message: "Notification introuvable",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "Notification supprimée",
    });
  } catch (error) {
    logger.error("Delete notification error:", error);
    res.status(500).json({
      status: "error",
      message: "Impossible de supprimer la notification",
    });
  }
};
// Update device token for push notifications
export const updateDeviceToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { token } = req.body;

    if (typeof token !== "string" || !token || token.length > 4096) {
      res.status(400).json({
        status: "error",
        message: "Le jeton de l’appareil est requis",
      });
      return;
    }

    const user = await User.findById(authReq.user.id);
    if (!user) {
      res.status(404).json({
        status: "error",
        message: "Compte introuvable",
      });
      return;
    }

    // A device token belongs to the current account, including after an offline logout.
    await User.updateMany(
      { _id: { $ne: user._id }, deviceTokens: token },
      { $pull: { deviceTokens: token } },
    );
    await User.updateOne(
      { _id: user._id, isActive: true },
      { $addToSet: { deviceTokens: token } },
    );

    res.status(200).json({
      status: "success",
      message: "Appareil enregistré pour les notifications",
    });
  } catch (error) {
    logger.error("Update device token error:", error);
    res.status(500).json({
      status: "error",
      message: "Impossible d’enregistrer l’appareil",
    });
  }
};

// Remove device token
export const removeDeviceToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { token } = req.body;

    if (typeof token !== "string" || !token || token.length > 4096) {
      res.status(400).json({
        status: "error",
        message: "Le jeton de l’appareil est requis",
      });
      return;
    }

    const user = await User.findById(authReq.user.id);
    if (!user) {
      res.status(404).json({
        status: "error",
        message: "Compte introuvable",
      });
      return;
    }

    if (user.deviceTokens) {
      user.deviceTokens = user.deviceTokens.filter((t) => t !== token);
      await user.save();
    }

    res.status(200).json({
      status: "success",
      message: "Appareil retiré des notifications",
    });
  } catch (error) {
    logger.error("Remove device token error:", error);
    res.status(500).json({
      status: "error",
      message: "Impossible de retirer l’appareil",
    });
  }
};
