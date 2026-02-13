import { Notification, User, Group } from '../models';
import { NotificationType, INotification } from '../models/Notification';
import mongoose from 'mongoose';

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
  priority: 'low' | 'normal' | 'high';
}

// Notification templates
const templates: Record<NotificationType, (data: NotificationData) => NotificationTemplate> = {
  group_invitation: (data) => ({
    title: 'Invitation à rejoindre un groupe',
    message: `Vous avez été invité à rejoindre le groupe "${data.groupName}"`,
    priority: 'normal',
  }),
  member_joined: (data) => ({
    title: 'Nouveau membre',
    message: `${data.memberName} a rejoint le groupe "${data.groupName}"`,
    priority: 'low',
  }),
  proposal_created: (data) => ({
    title: 'Nouvelle proposition',
    message: `Nouvelle proposition créée dans "${data.groupName}": ${data.proposalTitle}`,
    priority: 'normal',
  }),
  proposal_approved: (data) => ({
    title: 'Proposition approuvée',
    message: `La proposition "${data.proposalTitle}" a été approuvée`,
    priority: 'normal',
  }),
  proposal_rejected: (data) => ({
    title: 'Proposition rejetée',
    message: `La proposition "${data.proposalTitle}" a été rejetée`,
    priority: 'normal',
  }),
  contribution_received: (data) => ({
    title: 'Contribution reçue',
    message: `Nouvelle contribution de ${data.amount} XOF reçue dans "${data.groupName}"`,
    priority: 'normal',
  }),
  vote_reminder: (data) => ({
    title: 'Rappel de vote',
    message: `N'oubliez pas de voter sur "${data.voteTitle}" - ${data.timeRemaining} restant`,
    priority: 'high',
  }),
  payment_reminder: (data) => ({
    title: 'Rappel de paiement',
    message: `Votre cotisation de ${data.amount} XOF est attendue pour "${data.groupName}"`,
    priority: 'high',
  }),
  expense_executed: (data) => ({
    title: 'Dépense exécutée',
    message: `Dépense de ${data.amount} XOF effectuée dans "${data.groupName}"`,
    priority: 'normal',
  }),
  role_changed: (data) => ({
    title: 'Rôle modifié',
    message: `Votre rôle dans "${data.groupName}" a été changé en ${data.newRole}`,
    priority: 'normal',
  }),
  group_archived: (data) => ({
    title: 'Groupe archivé',
    message: `Le groupe "${data.groupName}" a été archivé`,
    priority: 'normal',
  }),
};

/**
 * Create and send a notification to a user
 */
export const createNotification = async (
  userId: mongoose.Types.ObjectId | string,
  type: NotificationType,
  templateData: NotificationData,
  additionalData?: NotificationData
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

    // TODO: Send push notification via Firebase Cloud Messaging
    await sendPushNotification(userId, notification);

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

/**
 * Send push notification via Firebase Cloud Messaging
 * This is a placeholder - will be implemented when Firebase is configured
 */
const sendPushNotification = async (
  userId: mongoose.Types.ObjectId | string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _notification: any
): Promise<void> => {
  try {
    // Get user's device tokens
    const user = await User.findById(userId).select('deviceTokens');
    
    if (!user || !user.deviceTokens || user.deviceTokens.length === 0) {
      console.warn('No device tokens found for user:', userId);
      return;
    }

    // TODO: Implement Firebase Cloud Messaging integration
    // const admin = require('firebase-admin');
    // const message = {
    //   notification: {
    //     title: _notification.title,
    //     body: _notification.message,
    //   },
    //   data: _notification.data,
    //   tokens: user.deviceTokens.map((t) => t.token),
    // };
    // await admin.messaging().sendMulticast(message);

    console.warn('Push notification would be sent to:', user.deviceTokens.length, 'devices');
  } catch (error) {
    console.error('Send push notification error:', error);
    // Don't throw error - notification is still created in DB
  }
};

/**
 * Batch create notifications for multiple users
 */
export const createBatchNotifications = async (
  userIds: (mongoose.Types.ObjectId | string)[],
  type: NotificationType,
  templateData: NotificationData,
  additionalData?: NotificationData
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
        const notification = created.find((n) => n.userId.toString() === userId.toString());
        if (notification) {
          await sendPushNotification(userId, notification);
        }
      } catch (error) {
        console.error('Error sending push to user:', userId, error);
      }
    }

    return created as INotification[];
  } catch (error) {
    console.error('Create batch notifications error:', error);
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
  excludeUserIds?: (mongoose.Types.ObjectId | string)[]
): Promise<void> => {
  try {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    interface GroupMember {
      userId: mongoose.Types.ObjectId;
      status: string;
    }

    let memberIds = (group.members as GroupMember[])
      .filter((m) => m.status === 'active')
      .map((m) => m.userId);

    // Exclude specified users (e.g., the action initiator)
    if (excludeUserIds && excludeUserIds.length > 0) {
      memberIds = memberIds.filter(
        (id) => !excludeUserIds.some((excludeId) => id.toString() === excludeId.toString())
      );
    }

    if (memberIds.length > 0) {
      await createBatchNotifications(memberIds, type, templateData, {
        groupId,
      });
    }
  } catch (error) {
    console.error('Notify group members error:', error);
    throw error;
  }
};

export default {
  createNotification,
  createBatchNotifications,
  notifyGroupMembers,
};
