import api from './api';

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
  readAt?: Date;
  createdAt: Date;
}

export interface NotificationsResponse {
  notifications: Notification[];
  count: number;
  total: number;
  unreadCount: number;
}

const notificationService = {
  // Get all notifications for current user
  getNotifications: async (params?: {
    limit?: number;
    skip?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationsResponse> => {
    const response = await api.get('/notifications', { params });
    return response.data.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<Notification> => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data.data.notification;
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<{ modifiedCount: number }> => {
    const response = await api.put('/notifications/mark-all-read');
    return response.data.data;
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
