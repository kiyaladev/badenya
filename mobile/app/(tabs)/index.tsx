import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGroupStore } from '@/store/groupStore';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import GroupCard from '@/components/GroupCard';
import { Loading, EmptyState, Avatar, Icon } from '@/components/ui';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { groups, isLoading, fetchGroups } = useGroupStore();
  const { user } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    fetchGroups();
    fetchNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchGroups(), fetchNotifications()]);
    setRefreshing(false);
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <View className="bg-primary-600 px-5 pb-6" style={{ paddingTop: insets.top + 16 }}>
        <View className="flex-row items-center">
          <View className="flex-1">
            <Text className="text-white/80 text-base">Bonjour</Text>
            <Text className="text-white text-2xl font-bold">{user?.fullName || 'Utilisateur'}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(screens)/notifications')}
            accessibilityLabel={`Notifications${unreadCount ? `, ${unreadCount} non lues` : ''}`}
            className="mr-4 p-2"
          >
            <Icon name="bell" size={22} color="#ffffff" />
            {unreadCount > 0 && (
              <View className="absolute top-0 right-0 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
                <Text className="text-white text-[10px] font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.8}>
            <Avatar
              name={user?.fullName || 'User'}
              imageUrl={user?.avatar?.url}
              size="lg"
              backgroundColor="rgba(255,255,255,0.25)"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-5 mt-6 mb-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Mes groupes
          </Text>
          {groups.length > 3 && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/groups')}>
              <Text className="text-primary-600 font-medium">Voir tout</Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading && !refreshing ? (
          <Loading />
        ) : groups.length === 0 ? (
          <EmptyState
            icon="users"
            title="Aucun groupe"
            description="Créez ou rejoignez un groupe pour commencer à épargner ensemble"
            actionLabel="Créer ou rejoindre un groupe"
            onAction={() => router.push('/(tabs)/groups')}
          />
        ) : (
          <>
            {groups.slice(0, 3).map(group => (
              <GroupCard key={group._id} group={group} />
            ))}
            <TouchableOpacity
              className="mt-2 flex-row items-center justify-center rounded-xl bg-primary-50 dark:bg-gray-800 p-4"
              onPress={() => router.push('/(tabs)/groups')}
            >
              <Icon name="plus" size={14} color="#0284c7" />
              <Text className="ml-2 text-primary-600 font-semibold">
                Créer ou rejoindre un groupe
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}
