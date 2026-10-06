import { Notification, User, Group } from "../models";
import { NotificationType, INotification } from "../models/Notification";
import mongoose from "mongoose";
import logger from "../utils/logger";
import { getMessaging, isFirebaseReady } from "../config/firebase";

interface NotificationData {
  groupId?: mongoose.Types.ObjectId | string;
  proposalId?: mongoose.Types.ObjectId | string;
  transactionId?: mongoose.Types.ObjectId | string;
  amount?: number;
  actionUrl?: string;
  groupName?: string;
  memberName?: string;
  proposalTitle?: string;
  [key: string]: unknown;
}

interface NotificationTemplate {
  title: string;
  message: string;
  priority: "low" | "normal" | "high";
}

interface PushNotificationPayload {
  _id?: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: unknown;
}

// Notification templates
const templates: Record<
  NotificationType,
  (data: NotificationData) => NotificationTemplate
> = {
  group_invitation: (data) => ({
    title: "Invitation à rejoindre un groupe",
    message: `Vous avez été invité à rejoindre le groupe "${data.groupName}"`,
    priority: "normal",
  }),
  member_joined: (data) => ({
    title: "Nouveau membre",
    message: `${data.memberName} a rejoint le groupe "${data.groupName}"`,
    priority: "low",
  }),
  proposal_created: (data) => ({
    title: "Nouvelle proposition",
    message: `Nouvelle proposition créée dans "${data.groupName}": ${data.proposalTitle}`,
    priority: "normal",
  }),
  proposal_approved: (data) => ({
    title: "Proposition approuvée",
    message: `La proposition "${data.proposalTitle}" a été approuvée`,
    priority: "normal",
  }),
  proposal_rejected: (data) => ({
    title: "Proposition rejetée",
    message: `La proposition "${data.proposalTitle}" a été rejetée`,
    priority: "normal",
  }),
  contribution_received: (data) => ({
    title: "Contribution reçue",
    message: `Nouvelle contribution de ${data.amount} ${data.currency || "XOF"} reçue dans "${data.groupName}"`,
    priority: "normal",
  }),
  vote_reminder: (data) => ({
    title: "Rappel de vote",
    message: `N'oubliez pas de voter sur "${data.voteTitle}" - ${data.timeRemaining} restant`,
    priority: "high",
  }),
  payment_reminder: (data) => ({
    title: "Rappel de paiement",
    message: `Votre cotisation de ${data.amount} ${data.currency || "XOF"} est attendue pour "${data.groupName}"`,
    priority: "high",
  }),
  expense_executed: (data) => ({
    title: "Dépense exécutée",
    message: `Dépense de ${data.amount} ${data.currency || "XOF"} effectuée dans "${data.groupName}"`,
    priority: "normal",
  }),
  role_changed: (data) => ({
    title: "Rôle modifié",
    message: `Votre rôle dans "${data.groupName}" a été changé en ${data.newRole}`,
    priority: "normal",
  }),
  group_archived: (data) => ({
    title: "Groupe archivé",
    message: `Le groupe "${data.groupName}" a été archivé`,
    priority: "normal",
  }),
};

/**
 * Create and send a notification to a user
 */
export const createNotification = async (
  userId: mongoose.Types.ObjectId | string,
  type: NotificationType,
  templateData: NotificationData,
  additionalData?: NotificationData,
): Promise<INotification> => {
  try {
    const template = templates[type](templateData);

    const notification = await Notification.create({
      userId,
      type,
      title: template.title,
      message: template.message,
      priority: template.priority,
      data: additionalData || {},
      isRead: false,
    });

    await sendPushNotification(userId, notification);

    return notification;
  } catch (error) {
    logger.error("Create notification error:", error);
    throw error;
  }
};

/**
 * Send push notification via Firebase Cloud Messaging
 */
export const sendPushNotification = async (
  userId: mongoose.Types.ObjectId | string,
  notification: PushNotificationPayload,
  channel?: "expo" | "fcm",
): Promise<boolean> => {
  try {
    const user = await User.findById(userId).select("deviceTokens preferences isActive");

    if (!user || !user.isActive || !user.deviceTokens || user.deviceTokens.length === 0) {
      return true;
    }

    // Respect user notification preferences
    if (user.preferences?.notifications?.push === false) {
      return true;
    }

    const preference=user.preferences?.notifications;
    if((notification.type==='proposal_created' && preference?.proposalCreated===false) || (notification.type==='contribution_received' && preference?.contributionReceived===false) || ((notification.type==='proposal_approved' || notification.type==='proposal_rejected') && preference?.proposalVoted===false))return true;
    const tokens = user.deviceTokens.filter(Boolean);
    if (tokens.length === 0) return true;

    // Convert data values to strings (FCM requirement)
    const stringData: Record<string, string> = {};
    if (notification.data) {
      for (const [key, value] of Object.entries(
        notification.data as Record<string, unknown>,
      )) {
        if (value !== undefined && value !== null) {
          stringData[key] = String(value);
        }
      }
    }
    stringData.notificationId = notification._id?.toString() ?? "";
    stringData.type = notification.type;

    const expoTokens = channel === "fcm" ? [] : tokens.filter(
      (token) =>
        token.startsWith("ExponentPushToken[") ||
        token.startsWith("ExpoPushToken["),
    );
    const fcmTokens = channel === "expo" ? [] : tokens.filter((token) => !token.startsWith("ExponentPushToken[") && !token.startsWith("ExpoPushToken["));

    if (expoTokens.length > 0) {
      const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        signal: AbortSignal.timeout(10000),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          expoTokens.map((to) => ({
            to,
            title: notification.title,
            body: notification.message,
            data: stringData,
            sound: "default",
            priority: "high",
          })),
        ),
      });

      if (!expoResponse.ok) {
        logger.warn(`Expo push gateway returned ${expoResponse.status}`);return false;
      }
      const tickets = await expoResponse.json() as {data?: Array<{status?:string;details?:{error?:string}}>};
      if (!Array.isArray(tickets.data) || tickets.data.length !== expoTokens.length || tickets.data.some(ticket=>ticket.status!=='ok')) return false;
    }

    if (fcmTokens.length === 0 || !isFirebaseReady()) {
      if (fcmTokens.length > 0 && !isFirebaseReady()) {
        logger.debug(
          "Firebase not configured — FCM push notifications skipped",
        );
      }
      return fcmTokens.length===0;
    }

    const messaging = getMessaging();
    if (!messaging) return false;

    const response = await messaging.sendEachForMulticast({
      notification: {
        title: notification.title,
        body: notification.message,
      },
      data: stringData,
      tokens: fcmTokens,
    });

    // Clean up invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (
          !resp.success &&
          resp.error?.code &&
          [
            "messaging/invalid-registration-token",
            "messaging/registration-token-not-registered",
          ].includes(resp.error.code)
        ) {
          invalidTokens.push(fcmTokens[idx]);
        }
      });

      if (invalidTokens.length > 0) {
        await User.findByIdAndUpdate(userId, {
          $pull: { deviceTokens: { $in: invalidTokens } },
        });
        logger.info(
          `Removed ${invalidTokens.length} invalid device tokens for user ${userId}`,
        );
      }
    }

    logger.info(
      `Push notification sent: ${response.successCount}/${fcmTokens.length} succeeded`,
    );
    return response.failureCount===0;
  } catch (error) {
    logger.error("Send push notification error:", error);
    return false;
    // Don't throw — notification is still persisted in DB
  }
};

/**
 * Batch create notifications for multiple users
 */
export const createBatchNotifications = async (
  userIds: (mongoose.Types.ObjectId | string)[],
  type: NotificationType,
  templateData: NotificationData,
  additionalData?: NotificationData,
): Promise<INotification[]> => {
  try {
    const template = templates[type](templateData);

    const notifications = userIds.map((userId) => ({
      userId,
      type,
      title: template.title,
      message: template.message,
      priority: template.priority,
      data: additionalData || {},
      isRead: false,
    }));

    const created = await Notification.insertMany(notifications);

    // Send push notifications to all users
    for (const userId of userIds) {
      try {
        const notification = created.find(
          (n) => n.userId.toString() === userId.toString(),
        );
        if (notification) {
          await sendPushNotification(userId, notification);
        }
      } catch (error) {
        logger.error("Error sending push to user:", userId, error);
      }
    }

    return created as INotification[];
  } catch (error) {
    logger.error("Create batch notifications error:", error);
    throw error;
  }
};

/**
 * Send notification to all group members
 */
export const notifyGroupMembers = async (
  groupId: mongoose.Types.ObjectId | string,
  type: NotificationType,
  templateData: Record<string, unknown>,
  excludeUserIds?: (mongoose.Types.ObjectId | string)[],
): Promise<void> => {
  try {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new Error("Group not found");
    }

    interface GroupMember {
      userId: mongoose.Types.ObjectId;
      status: string;
    }

    let memberIds = (group.members as GroupMember[])
      .filter((m) => m.status === "active")
      .map((m) => m.userId);

    // Exclude specified users (e.g., the action initiator)
    if (excludeUserIds && excludeUserIds.length > 0) {
      memberIds = memberIds.filter(
        (id) =>
          !excludeUserIds.some(
            (excludeId) => id.toString() === excludeId.toString(),
          ),
      );
    }

    if (memberIds.length > 0) {
      await createBatchNotifications(memberIds, type, templateData, {
        groupId,
      });
    }
  } catch (error) {
    logger.error("Notify group members error:", error);
    throw error;
  }
};

export default {
  createNotification,
  createBatchNotifications,
  notifyGroupMembers,
};
