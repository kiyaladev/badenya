import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useGroupStore } from '@/store/groupStore';
import { Loading } from '@/components/ui';

export default function GroupMembersScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [refreshing, setRefreshing] = useState(false);

  const { groups, isLoading, fetchGroups } = useGroupStore();

  const group = groups.find(g => g._id === groupId);

  useEffect(() => {
    if (groupId) {
      loadData();
    }
  }, [groupId]);

  const loadData = async () => {
    await fetchGroups();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (isLoading && !group) {
    return <Loading />;
  }

  if (!group) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-600">Groupe non trouvé</Text>
      </View>
    );
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrateur',
      treasurer: 'Trésorier',
      member: 'Membre',
    };
    return labels[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700',
      treasurer: 'bg-blue-100 text-blue-700',
      member: 'bg-gray-100 text-gray-700',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="px-6 mt-6">
        <Text className="text-gray-800 text-lg font-bold mb-4">
          Membres du groupe ({group.members.length})
        </Text>

        {group.members.length > 0 ? (
          <View className="bg-white rounded-xl overflow-hidden">
            {group.members.map((member, index) => (
              <View
                key={member.userId || index}
                className={`flex-row items-center px-4 py-4 ${
                  index !== group.members.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                {/* Avatar */}
                <View className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center mr-3">
                  <Text className="text-lg font-bold text-primary-600">
                    {member.firstName?.[0]?.toUpperCase() ||
                      member.lastName?.[0]?.toUpperCase() ||
                      '?'}
                  </Text>
                </View>

                {/* Member Info */}
                <View className="flex-1">
                  <Text className="text-gray-800 font-medium mb-1">
                    {member.firstName && member.lastName
                      ? `${member.firstName} ${member.lastName}`
                      : 'Membre'}
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    Membre depuis{' '}
                    {new Date(member.joinedAt).toLocaleDateString('fr-FR', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>

                {/* Role Badge */}
                <View className={`px-3 py-1 rounded-full ${getRoleBadgeColor(member.role)}`}>
                  <Text className="text-xs font-medium">{getRoleLabel(member.role)}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-white rounded-xl p-8 items-center">
            <Text className="text-6xl mb-4">👥</Text>
            <Text className="text-gray-800 text-lg font-bold mb-2">Aucun membre</Text>
            <Text className="text-gray-600 text-sm text-center">
              Les membres du groupe apparaîtront ici
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
