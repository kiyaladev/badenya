import { Alert } from '@/services/dialog.service';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useGroupStore } from '@/store/groupStore';
import { useAuthStore } from '@/store/authStore';
import groupService, { GroupMember } from '@/services/group.service';
import { Icon, Loading } from '@/components/ui';

export default function GroupMembersScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [refreshing, setRefreshing] = useState(false);

  const { groups, isLoading, fetchGroups } = useGroupStore();
  const { user } = useAuthStore();

  const group = groups.find(g => g._id === groupId);
  const currentUserId = user?._id || user?.id;
  const isCurrentUserAdmin = group?.members.some(
    m => m.userId === currentUserId && m.role === 'admin'
  );

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
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Text className="text-gray-600 dark:text-gray-300">Groupe non trouvé</Text>
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

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return { bg: 'bg-purple-100', text: 'text-purple-700' };
      case 'treasurer':
        return { bg: 'bg-blue-100', text: 'text-blue-700' };
      default:
        return { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-200' };
    }
  };

  const handleMemberAction = (member: GroupMember) => {
    if (!isCurrentUserAdmin || member.userId === currentUserId) return;

    Alert.alert(
      `Gérer ${member.fullName || 'le membre'}`,
      `Rôle actuel : ${getRoleLabel(member.role)}`,
      [
        {
          text: 'Définir comme Administrateur',
          onPress: async () => {
            try {
              await groupService.updateMemberRole(groupId!, member.userId, 'admin');
              await fetchGroups();
              Alert.alert('Succès', 'Rôle mis à jour');
            } catch (err: unknown) {
              const error = err as { message?: string };
              Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le rôle');
            }
          },
        },
        {
          text: 'Définir comme Trésorier',
          onPress: async () => {
            try {
              await groupService.updateMemberRole(groupId!, member.userId, 'treasurer');
              await fetchGroups();
              Alert.alert('Succès', 'Rôle mis à jour');
            } catch (err: unknown) {
              const error = err as { message?: string };
              Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le rôle');
            }
          },
        },
        {
          text: 'Définir comme Membre standard',
          onPress: async () => {
            try {
              await groupService.updateMemberRole(groupId!, member.userId, 'member');
              await fetchGroups();
              Alert.alert('Succès', 'Rôle mis à jour');
            } catch (err: unknown) {
              const error = err as { message?: string };
              Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le rôle');
            }
          },
        },
        {
          text: 'Retirer du groupe',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmer le retrait',
              `Voulez-vous vraiment retirer ${member.fullName || 'ce membre'} du groupe ?`,
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Retirer',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await groupService.removeMember(groupId!, member.userId);
                      await fetchGroups();
                      Alert.alert('Succès', 'Membre retiré avec succès');
                    } catch (err: unknown) {
                      const error = err as { message?: string };
                      Alert.alert('Erreur', error.message || 'Impossible de retirer le membre');
                    }
                  },
                },
              ]
            );
          },
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="px-6 mt-6">
        <Text className="text-gray-800 dark:text-gray-100 text-lg font-bold mb-4">
          Membres du groupe ({group.members.length})
        </Text>

        {group.members.length > 0 ? (
          <View className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
            {group.members.map((member, index) => {
              const isActionable = isCurrentUserAdmin && member.userId !== currentUserId;
              const badgeStyle = getRoleBadgeStyle(member.role);
              return (
                <TouchableOpacity
                  key={member.userId || index}
                  onPress={() => isActionable && handleMemberAction(member)}
                  disabled={!isActionable}
                  className={`flex-row items-center px-4 py-4 ${
                    index !== group.members.length - 1
                      ? 'border-b border-gray-100 dark:border-gray-700'
                      : ''
                  } ${isActionable ? 'active:bg-gray-50' : ''}`}
                >
                  {/* Avatar */}
                  <View className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center mr-3">
                    <Text className="text-lg font-bold text-primary-600">
                      {member.fullName?.[0]?.toUpperCase() || '?'}
                    </Text>
                  </View>

                  {/* Member Info */}
                  <View className="flex-1">
                    <Text className="text-gray-800 dark:text-gray-100 font-medium mb-1">
                      {member.fullName || 'Membre'}
                      {member.userId === currentUserId ? ' (Vous)' : ''}
                    </Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-xs">
                      Membre depuis{' '}
                      {new Date(member.joinedAt).toLocaleDateString('fr-FR', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>

                  {/* Role Badge */}
                  <View className={`px-3 py-1 rounded-full ${badgeStyle.bg}`}>
                    <Text className={`text-xs font-medium ${badgeStyle.text}`}>
                      {getRoleLabel(member.role)}
                    </Text>
                  </View>

                  {isActionable && (
                    <View className="ml-2 pl-1">
                      <Icon name="ellipsis-v" size={14} color="#9ca3af" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View className="bg-white dark:bg-gray-800 rounded-xl p-8 items-center">
            <Icon name="users" size={48} color="#0284c7" />
            <Text className="text-gray-800 dark:text-gray-100 text-lg font-bold mb-2">
              Aucun membre
            </Text>
            <Text className="text-gray-600 dark:text-gray-300 text-sm text-center">
              Les membres du groupe apparaîtront ici
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
