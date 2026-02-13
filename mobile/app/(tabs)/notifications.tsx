import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import NotificationItem from '@/components/NotificationItem';
import { Loading } from '@/components/ui';

export default function NotificationsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    await fetchNotifications(filter === 'unread');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    Alert.alert(
      'Tout marquer comme lu',
      `Marquer ${unreadCount} notification${unreadCount > 1 ? 's' : ''} comme lue${unreadCount > 1 ? 's' : ''} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            await markAllAsRead();
          },
        },
      ]
    );
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Supprimer la notification',
      'Voulez-vous vraiment supprimer cette notification ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteNotification(id);
          },
        },
      ]
    );
  };

  if (isLoading && notifications.length === 0) {
    return <Loading />;
  }

  const displayedNotifications =
    filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center mb-3">
          <View>
            <Text className="text-2xl font-bold text-gray-800">Notifications</Text>
            {unreadCount > 0 && (
              <Text className="text-gray-600 text-sm mt-1">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </Text>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllAsRead}>
              <Text className="text-primary-600 text-sm font-medium">Tout marquer lu</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View className="flex-row">
          <TouchableOpacity
            onPress={() => setFilter('all')}
            className={`flex-1 py-2 border-b-2 ${
              filter === 'all' ? 'border-primary-600' : 'border-transparent'
            }`}
          >
            <Text
              className={`text-center font-medium ${
                filter === 'all' ? 'text-primary-600' : 'text-gray-500'
              }`}
            >
              Toutes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('unread')}
            className={`flex-1 py-2 border-b-2 ${
              filter === 'unread' ? 'border-primary-600' : 'border-transparent'
            }`}
          >
            <Text
              className={`text-center font-medium ${
                filter === 'unread' ? 'text-primary-600' : 'text-gray-500'
              }`}
            >
              Non lues {unreadCount > 0 && `(${unreadCount})`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {displayedNotifications.length > 0 ? (
          <View className="px-4 pt-4">
            {displayedNotifications.map(notification => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
          </View>
        ) : (
          /* Empty State */
          <View className="px-6 mt-12">
            <View className="bg-white rounded-xl p-8 items-center">
              <Text className="text-6xl mb-4">🔔</Text>
              <Text className="text-gray-800 text-lg font-bold mb-2">
                {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
              </Text>
              <Text className="text-gray-600 text-sm text-center">
                {filter === 'unread'
                  ? 'Toutes vos notifications ont été lues'
                  : 'Vos notifications apparaîtront ici'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
