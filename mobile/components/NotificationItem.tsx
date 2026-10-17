import { notificationRoute } from '@/utils/notificationRoute';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Notification } from '@/services/notification.service';
import { Icon } from '@/components/ui';
import type { IconName } from '@/components/ui';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const router = useRouter();

  const getNotificationIcon = (type: string): IconName => {
    const icons: Record<string, IconName> = {
      group_invitation: 'users',
      member_joined: 'user-plus',
      proposal_created: 'file-text-o',
      proposal_approved: 'check-circle',
      proposal_rejected: 'times-circle',
      contribution_received: 'money',
      vote_reminder: 'check-square-o',
      payment_reminder: 'clock-o',
      expense_executed: 'credit-card',
      role_changed: 'key',
      group_archived: 'archive',
    };
    return icons[type] || 'bell';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'border-red-500 bg-red-50 dark:bg-red-950',
      normal: 'border-primary-500 bg-primary-50 dark:bg-gray-800',
      low: 'border-gray-300 bg-gray-50 dark:bg-gray-900',
    };
    return colors[priority] || colors.normal;
  };

  const getTimeAgo = (date: string | Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}j`;
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const handlePress = () => {
    // Mark as read if unread
    if (!notification.isRead) {
      onMarkAsRead(notification._id);
    }

    // Navigate based on notification type
    const { data } = notification;
    const target = notificationRoute(data);
    if (target) router.push(target as Parameters<typeof router.push>[0]);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className={`mb-3 rounded-xl border-l-4 ${getPriorityColor(notification.priority)} ${
        !notification.isRead ? 'bg-white dark:bg-gray-800 shadow-sm' : 'bg-gray-50 dark:bg-gray-900'
      }`}
      activeOpacity={0.7}
    >
      <View className="p-4">
        <View className="flex-row items-start">
          {/* Icon */}
          <View className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center mr-3">
            <Icon name={getNotificationIcon(notification.type)} size={18} color="#6b7280" />
          </View>

          {/* Content */}
          <View className="flex-1">
            <View className="flex-row items-start justify-between mb-1">
              <Text
                className={`flex-1 text-gray-800 dark:text-gray-100 ${
                  !notification.isRead ? 'font-bold' : 'font-medium'
                }`}
              >
                {notification.title}
              </Text>

              {/* Unread indicator */}
              {!notification.isRead && (
                <View className="w-2 h-2 bg-primary-600 rounded-full ml-2 mt-1" />
              )}
            </View>

            <Text className="text-gray-600 dark:text-gray-300 text-sm mb-2">
              {notification.message}
            </Text>

            {/* Footer */}
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-400 text-xs">{getTimeAgo(notification.createdAt)}</Text>

              {/* Actions */}
              <View className="flex-row">
                {!notification.isRead && (
                  <TouchableOpacity
                    onPress={e => {
                      e.stopPropagation();
                      onMarkAsRead(notification._id);
                    }}
                    className="px-3 py-1"
                  >
                    <Text className="text-primary-600 text-xs font-medium">Marquer lu</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={e => {
                    e.stopPropagation();
                    onDelete(notification._id);
                  }}
                  className="px-3 py-1"
                >
                  <Text className="text-red-600 text-xs font-medium">Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
