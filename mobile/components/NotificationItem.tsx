import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Notification } from '@/services/notification.service';

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

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      group_invitation: '👥',
      member_joined: '🎉',
      proposal_created: '📝',
      proposal_approved: '✅',
      proposal_rejected: '❌',
      contribution_received: '💰',
      vote_reminder: '🗳️',
      payment_reminder: '⏰',
      expense_executed: '💸',
      role_changed: '🔑',
      group_archived: '📦',
    };
    return icons[type] || '🔔';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'border-red-500 bg-red-50',
      normal: 'border-primary-500 bg-primary-50',
      low: 'border-gray-300 bg-gray-50',
    };
    return colors[priority] || colors.normal;
  };

  const getTimeAgo = (date: Date) => {
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
    if (data?.groupId) {
      router.push(`/(screens)/group-details?id=${data.groupId._id || data.groupId}`);
    } else if (data?.proposalId) {
      router.push(`/(screens)/proposal-details?id=${data.proposalId._id || data.proposalId}`);
    } else if (data?.transactionId) {
      router.push(
        `/(screens)/transaction-details?id=${data.transactionId._id || data.transactionId}`
      );
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className={`mb-3 rounded-xl border-l-4 ${getPriorityColor(notification.priority)} ${
        !notification.isRead ? 'bg-white shadow-sm' : 'bg-gray-50'
      }`}
      activeOpacity={0.7}
    >
      <View className="p-4">
        <View className="flex-row items-start">
          {/* Icon */}
          <Text className="text-2xl mr-3">{getNotificationIcon(notification.type)}</Text>

          {/* Content */}
          <View className="flex-1">
            <View className="flex-row items-start justify-between mb-1">
              <Text
                className={`flex-1 text-gray-800 ${
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

            <Text className="text-gray-600 text-sm mb-2">{notification.message}</Text>

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
