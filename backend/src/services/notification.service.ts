import { User } from "../models";
import { NotificationType } from "../models/Notification";
import mongoose from "mongoose";
import logger from "../utils/logger";
import { getMessaging, isFirebaseReady } from "../config/firebase";


interface PushNotificationPayload {
  _id?: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: unknown;
}


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
