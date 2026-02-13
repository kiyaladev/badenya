import { useNotificationStore } from '../notificationStore';
import notificationService from '@/services/notification.service';

// Mock the notification service
jest.mock('@/services/notification.service', () => ({
  __esModule: true,
  default: {
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    deleteNotification: jest.fn(),
    updateDeviceToken: jest.fn(),
    removeDeviceToken: jest.fn(),
  },
}));

describe('NotificationStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  describe('fetchNotifications', () => {
    it('should fetch notifications successfully', async () => {
      const mockData = {
        notifications: [
          {
            _id: '1',
            userId: 'user1',
            type: 'contribution_received' as const,
            title: 'New Contribution',
            message: 'You received a contribution',
            isRead: false,
            createdAt: new Date().toISOString(),
          },
          {
            _id: '2',
            userId: 'user1',
            type: 'vote_created' as const,
            title: 'New Vote',
            message: 'A new vote was created',
            isRead: true,
            readAt: new Date(),
            createdAt: new Date().toISOString(),
          },
        ],
        unreadCount: 1,
      };

      (notificationService.getNotifications as jest.Mock).mockResolvedValue(mockData);

      await useNotificationStore.getState().fetchNotifications();

      expect(notificationService.getNotifications).toHaveBeenCalledWith({
        limit: 100,
        unreadOnly: false,
      });
      expect(useNotificationStore.getState().notifications).toEqual(mockData.notifications);
      expect(useNotificationStore.getState().unreadCount).toBe(1);
      expect(useNotificationStore.getState().isLoading).toBe(false);
    });

    it('should fetch only unread notifications when specified', async () => {
      const mockData = {
        notifications: [
          {
            _id: '1',
            userId: 'user1',
            type: 'contribution_received' as const,
            title: 'New Contribution',
            message: 'You received a contribution',
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        ],
        unreadCount: 1,
      };

      (notificationService.getNotifications as jest.Mock).mockResolvedValue(mockData);

      await useNotificationStore.getState().fetchNotifications(true);

      expect(notificationService.getNotifications).toHaveBeenCalledWith({
        limit: 100,
        unreadOnly: true,
      });
    });

    it('should handle fetch errors', async () => {
      const errorMessage = 'Network error';
      (notificationService.getNotifications as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await useNotificationStore.getState().fetchNotifications();

      expect(useNotificationStore.getState().error).toBe(errorMessage);
      expect(useNotificationStore.getState().isLoading).toBe(false);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notifications = [
        {
          _id: '1',
          userId: 'user1',
          type: 'contribution_received' as const,
          title: 'Test',
          message: 'Message',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          _id: '2',
          userId: 'user1',
          type: 'vote_created' as const,
          title: 'Test 2',
          message: 'Message 2',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ];

      useNotificationStore.setState({ notifications, unreadCount: 2 });

      (notificationService.markAsRead as jest.Mock).mockResolvedValue({});

      await useNotificationStore.getState().markAsRead('1');

      expect(notificationService.markAsRead).toHaveBeenCalledWith('1');
      expect(useNotificationStore.getState().notifications[0].isRead).toBe(true);
      expect(useNotificationStore.getState().notifications[0].readAt).toBeDefined();
      expect(useNotificationStore.getState().unreadCount).toBe(1);
    });

    it('should handle mark as read errors', async () => {
      (notificationService.markAsRead as jest.Mock).mockRejectedValue(new Error('Failed'));

      await useNotificationStore.getState().markAsRead('1');

      expect(useNotificationStore.getState().error).toBe('Failed to mark as read');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      const notifications = [
        {
          _id: '1',
          userId: 'user1',
          type: 'contribution_received' as const,
          title: 'Test',
          message: 'Message',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          _id: '2',
          userId: 'user1',
          type: 'vote_created' as const,
          title: 'Test 2',
          message: 'Message 2',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ];

      useNotificationStore.setState({ notifications, unreadCount: 2 });

      (notificationService.markAllAsRead as jest.Mock).mockResolvedValue({});

      await useNotificationStore.getState().markAllAsRead();

      expect(notificationService.markAllAsRead).toHaveBeenCalled();
      expect(useNotificationStore.getState().notifications.every(n => n.isRead)).toBe(true);
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it('should handle mark all as read errors', async () => {
      (notificationService.markAllAsRead as jest.Mock).mockRejectedValue(new Error('Failed'));

      await useNotificationStore.getState().markAllAsRead();

      expect(useNotificationStore.getState().error).toBeTruthy();
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      const notifications = [
        {
          _id: '1',
          userId: 'user1',
          type: 'contribution_received' as const,
          title: 'Test',
          message: 'Message',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          _id: '2',
          userId: 'user1',
          type: 'vote_created' as const,
          title: 'Test 2',
          message: 'Message 2',
          isRead: true,
          readAt: new Date(),
          createdAt: new Date().toISOString(),
        },
      ];

      useNotificationStore.setState({ notifications, unreadCount: 1 });

      (notificationService.deleteNotification as jest.Mock).mockResolvedValue({});

      await useNotificationStore.getState().deleteNotification('1');

      expect(notificationService.deleteNotification).toHaveBeenCalledWith('1');
      expect(useNotificationStore.getState().notifications).toHaveLength(1);
      expect(useNotificationStore.getState().notifications[0]._id).toBe('2');
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it('should handle delete errors', async () => {
      (notificationService.deleteNotification as jest.Mock).mockRejectedValue(new Error('Failed'));

      await useNotificationStore.getState().deleteNotification('1');

      expect(useNotificationStore.getState().error).toBeTruthy();
    });
  });

  describe('updateDeviceToken', () => {
    it('should update device token successfully', async () => {
      (notificationService.updateDeviceToken as jest.Mock).mockResolvedValue({});

      await useNotificationStore.getState().updateDeviceToken('test-token', 'ios');

      expect(notificationService.updateDeviceToken).toHaveBeenCalledWith('test-token', 'ios');
    });

    it('should handle update token errors silently', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      (notificationService.updateDeviceToken as jest.Mock).mockRejectedValue(new Error('Failed'));

      await useNotificationStore.getState().updateDeviceToken('test-token');

      expect(consoleError).toHaveBeenCalledWith(
        'Failed to update device token:',
        expect.any(Error)
      );
      consoleError.mockRestore();
    });
  });

  describe('removeDeviceToken', () => {
    it('should remove device token successfully', async () => {
      (notificationService.removeDeviceToken as jest.Mock).mockResolvedValue({});

      await useNotificationStore.getState().removeDeviceToken('test-token');

      expect(notificationService.removeDeviceToken).toHaveBeenCalledWith('test-token');
    });

    it('should handle remove token errors silently', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      (notificationService.removeDeviceToken as jest.Mock).mockRejectedValue(new Error('Failed'));

      await useNotificationStore.getState().removeDeviceToken('test-token');

      expect(consoleError).toHaveBeenCalledWith(
        'Failed to remove device token:',
        expect.any(Error)
      );
      consoleError.mockRestore();
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      useNotificationStore.setState({ error: 'Some error' });

      useNotificationStore.getState().clearError();

      expect(useNotificationStore.getState().error).toBeNull();
    });
  });
});
