import api from './api';
import { getEntityId, unwrapApiData } from '@/utils/apiResponse';

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: {
    groupId?: string;
    proposalId?: string;
    transactionId?: string;
    [key: string]: unknown;
  };
  priority: 'low' | 'normal' | 'high';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  count: number;
  total: number;
  unreadCount: number;
}

function normalizeNotification(rawNotification: unknown): Notification {
  const raw = (rawNotification || {}) as {
    _id?: unknown;
    userId?: unknown;
    type?: unknown;
    title?: unknown;
    message?: unknown;
    data?: {
      groupId?: unknown;
      proposalId?: unknown;
      transactionId?: unknown;
      [key: string]: unknown;
    };
    priority?: unknown;
    isRead?: unknown;
    readAt?: unknown;
    createdAt?: unknown;
  };

  return {
    _id: getEntityId(raw._id),
    userId: getEntityId(raw.userId),
    type: String(raw.type || ''),
    title: String(raw.title || ''),
    message: String(raw.message || ''),
    data: raw.data
      ? {
          ...raw.data,
          groupId: raw.data.groupId ? getEntityId(raw.data.groupId) : undefined,
          proposalId: raw.data.proposalId ? getEntityId(raw.data.proposalId) : undefined,
          transactionId: raw.data.transactionId ? getEntityId(raw.data.transactionId) : undefined,
        }
      : undefined,
    priority: (raw.priority || 'normal') as Notification['priority'],
    isRead: Boolean(raw.isRead),
    readAt: raw.readAt ? String(raw.readAt) : undefined,
    createdAt: String(raw.createdAt || new Date().toISOString()),
  };
}

const notificationService = {
  // Get all notifications for current user
  getNotifications: async (params?: {
    limit?: number;
    skip?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationsResponse> => {
    const response = await api.get('/notifications', { params });
    const data = unwrapApiData<{
      notifications?: unknown[];
      count?: number;
      total?: number;
      unreadCount?: number;
    }>(response.data);
    return {
      notifications: (data.notifications || []).map(normalizeNotification),
      count: Number(data.count || 0),
      total: Number(data.total || 0),
      unreadCount: Number(data.unreadCount || 0),
    };
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<Notification> => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    const data = unwrapApiData<{ notification: unknown }>(response.data);
    return normalizeNotification(data.notification);
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<{ modifiedCount: number }> => {
    const response = await api.put('/notifications/mark-all-read');
    return unwrapApiData<{ modifiedCount: number }>(response.data);
  },

  // Delete notification
  deleteNotification: async (notificationId: string): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`);
  },

  // Update device token for push notifications
  updateDeviceToken: async (token: string, platform?: string): Promise<void> => {
    await api.post('/notifications/device-token', { token, platform });
  },

  // Remove device token
  removeDeviceToken: async (token: string): Promise<void> => {
    await api.delete('/notifications/device-token', { data: { token } });
  },
};

export default notificationService;
