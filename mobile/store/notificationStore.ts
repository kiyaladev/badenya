import { create } from 'zustand';
import { getErrorMessage } from '../utils/errorHandler';
import notificationService, { Notification } from '@/services/notification.service';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updateDeviceToken: (token: string, platform?: string) => Promise<void>;
  removeDeviceToken: (token: string) => Promise<void>;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async (unreadOnly = false) => {
    try {
      set({ isLoading: true, error: null });
      const data = await notificationService.getNotifications({
        limit: 100,
        unreadOnly,
      });
      set({
        notifications: data.notifications,
        unreadCount: data.unreadCount,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to fetch notifications'),
        isLoading: false,
      });
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      set({ error: null });
      await notificationService.markAsRead(notificationId);

      // Update local state
      const notifications = get().notifications.map(n =>
        n._id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n
      );
      const unreadCount = notifications.filter(n => !n.isRead).length;

      set({ notifications, unreadCount });
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to mark as read'),
      });
    }
  },

  markAllAsRead: async () => {
    try {
      set({ error: null });
      await notificationService.markAllAsRead();

      // Update local state
      const notifications = get().notifications.map(n => ({
        ...n,
        isRead: true,
        readAt: new Date(),
      }));

      set({ notifications, unreadCount: 0 });
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to mark all as read'),
      });
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      set({ error: null });
      await notificationService.deleteNotification(notificationId);

      // Update local state
      const notifications = get().notifications.filter(n => n._id !== notificationId);
      const unreadCount = notifications.filter(n => !n.isRead).length;

      set({ notifications, unreadCount });
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to delete notification'),
      });
    }
  },

  updateDeviceToken: async (token: string, platform?: string) => {
    try {
      await notificationService.updateDeviceToken(token, platform);
    } catch (error) {
      console.error('Failed to update device token:', error);
    }
  },

  removeDeviceToken: async (token: string) => {
    try {
      await notificationService.removeDeviceToken(token);
    } catch (error) {
      console.error('Failed to remove device token:', error);
    }
  },

  clearError: () => set({ error: null }),
}));
