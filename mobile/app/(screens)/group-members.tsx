import { Alert } from '@/services/dialog.service';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useGroupStore } from '@/store/groupStore';
import { useAuthStore } from '@/store/authStore';
import groupService, { GroupMember } from '@/services/group.service';
import userService, { User } from '@/services/user.service';
import { shareGroupInvite } from '@/utils/shareInvite';
import { Button, Icon, Loading } from '@/components/ui';

type JoinRequest = Awaited<ReturnType<typeof groupService.joinRequests>>[number];

export default function GroupMembersScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<JoinRequest[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const { groups, isLoading, fetchGroups, fetchGroupById } = useGroupStore();
  const { user } = useAuthStore();

  const group = groups.find(g => g._id === groupId);
  const currentUserId = user?._id || user?.id;
  const currentRole = group?.members.find(m => m.userId === currentUserId)?.role;
  const isCurrentUserAdmin = currentRole === 'admin';
  const canManageMembers = currentRole === 'admin' || currentRole === 'treasurer';

  useEffect(() => {
    if (groupId) {
      loadData();
    }
  }, [groupId]);

  const loadRequests = async () => {
    try {
      const all = await groupService.joinRequests(groupId!);
      setRequests(all.filter(request => !request.status || request.status === 'pending'));
    } catch {
      setRequests([]);
    }
  };

  const loadData = async () => {
    await Promise.all([fetchGroups(), canManageMembers ? loadRequests() : Promise.resolve()]);
  };

  useEffect(() => {
    if (groupId && canManageMembers) void loadRequests();
  }, [groupId, canManageMembers]);

  const reviewRequest = async (requestId: string, decision: 'approve' | 'reject') => {
    try {
      await groupService.reviewJoinRequest(groupId!, requestId, decision);
      await Promise.all([loadRequests(), fetchGroups()]);
    } catch {
      Alert.alert('Erreur', 'La demande reste inchangée.');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await userService.searchUsers(searchQuery.trim());

      // Filter out users who are already members
      const existingMemberIds = new Set(group?.members.map(m => m.userId) || []);
      const filteredResults = results.filter(result => !existingMemberIds.has(result._id));

      setSearchResults(filteredResults);

      if (filteredResults.length === 0 && results.length > 0) {
        Alert.alert('Info', 'Tous les utilisateurs trouvés sont déjà membres du groupe');
      } else if (filteredResults.length === 0) {
        Alert.alert('Aucun résultat', 'Aucun utilisateur trouvé avec cette recherche');
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de rechercher des utilisateurs');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const handleAddMembers = async () => {
    if (selectedUsers.size === 0) {
      Alert.alert('Attention', 'Veuillez sélectionner au moins un utilisateur');
      return;
    }

    setIsAdding(true);

    try {
      const count = selectedUsers.size;
      await Promise.all(
        Array.from(selectedUsers).map(userId => groupService.addMember(groupId!, userId))
      );

      // Refresh group data
      await fetchGroupById(groupId!);

      setSelectedUsers(new Set());
      setSearchResults([]);
      setSearchQuery('');
      Alert.alert(
        'Succès',
        `${count} membre${count > 1 ? 's' : ''} ajouté${count > 1 ? 's' : ''} avec succès`
      );
    } catch (err: unknown) {
      const error = err as { message?: string };
      Alert.alert('Erreur', error.message || "Impossible d'ajouter les membres");
    } finally {
      setIsAdding(false);
    }
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

    const changeRole = async (role: GroupMember['role']) => {
      try {
        await groupService.updateMemberRole(groupId!, member.userId, role);
        await fetchGroups();
      } catch (err: unknown) {
        const error = err as { message?: string };
        Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le rôle');
      }
    };
    const roleOptions = (['admin', 'treasurer', 'member'] as const)
      .filter(role => role !== member.role)
      .map(role => ({ text: getRoleLabel(role), onPress: () => changeRole(role) }));

    Alert.alert(member.fullName || 'Membre', `Rôle actuel : ${getRoleLabel(member.role)}`, [
      ...roleOptions,
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
    ]);
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="px-6 mt-6 mb-6">
        {requests.length > 0 && (
          <View className="mb-6">
            <Text className="text-gray-800 dark:text-gray-100 text-lg font-bold mb-3">
              Demandes en attente ({requests.length})
            </Text>
            <View className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
              {requests.map((request, index) => (
                <View
                  key={request._id}
                  className={`px-4 py-4 ${
                    index !== requests.length - 1
                      ? 'border-b border-gray-100 dark:border-gray-700'
                      : ''
                  }`}
                >
                  <Text className="text-gray-800 dark:text-gray-100 font-medium mb-3">
                    {request.userId?.fullName || request.userId?.email || 'Utilisateur'}
                  </Text>
                  <View className="flex-row">
                    <Button
                      title="Approuver"
                      size="sm"
                      onPress={() => reviewRequest(request._id, 'approve')}
                      className="mr-2"
                    />
                    <Button
                      title="Refuser"
                      size="sm"
                      variant="outline"
                      onPress={() => reviewRequest(request._id, 'reject')}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text className="text-gray-800 dark:text-gray-100 text-lg font-bold mb-4">
          Membres ({group.members.length})
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
        {canManageMembers && (
          <View className="mt-8">
            <Text className="text-gray-800 dark:text-gray-100 text-lg font-bold mb-4">Inviter</Text>

            {/* Share Invite Card */}
            <TouchableOpacity
              onPress={() => shareGroupInvite(group)}
              className="flex-row items-center justify-between bg-primary-50 dark:bg-gray-800 border border-primary-200 rounded-xl p-4 mb-5 active:bg-primary-100"
            >
              <View className="flex-row items-center flex-1 mr-3">
                <View className="w-10 h-10 bg-primary-600 rounded-full items-center justify-center mr-3">
                  <Icon name="share-alt" size={16} color="#ffffff" />
                </View>
                <View className="flex-1">
                  <Text className="text-primary-900 dark:text-primary-100 font-bold text-sm">
                    Inviter via WhatsApp ou SMS
                  </Text>
                  <Text className="text-primary-700 dark:text-primary-200 text-xs">
                    Partagez directement le code et le lien d'invitation
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={14} color="#0284c7" />
            </TouchableOpacity>

            <Text className="text-gray-600 dark:text-gray-300 mb-3">
              Ou recherchez par email ou téléphone pour ajouter des membres à {group.name}
            </Text>

            {/* Search Box */}
            <View className="mb-4">
              <View className="flex-row items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 mb-2">
                <Icon name="search" size={18} color="#9ca3af" />
                <TextInput
                  className="flex-1 text-gray-800 dark:text-gray-100 py-2 ml-2"
                  placeholder="Email ou téléphone..."
                  placeholderTextColor="#9ca3af"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              <Button onPress={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                {isSearching ? 'Recherche...' : 'Rechercher'}
              </Button>
            </View>

            {isSearching && (
              <View className="py-8">
                <Loading />
              </View>
            )}

            {!isSearching && searchResults.length > 0 && (
              <>
                <Text className="text-gray-700 dark:text-gray-200 font-semibold mb-3">
                  {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} trouvé
                  {searchResults.length > 1 ? 's' : ''}
                </Text>

                {searchResults.map(result => (
                  <TouchableOpacity
                    key={result._id}
                    onPress={() => toggleUserSelection(result._id)}
                    className={`bg-white dark:bg-gray-800 p-4 rounded-lg mb-3 border-2 ${
                      selectedUsers.has(result._id)
                        ? 'border-primary-600 bg-primary-50 dark:bg-gray-800'
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-gray-800 dark:text-gray-100 font-semibold text-base mb-1">
                          {result.fullName}
                        </Text>
                        <View className="flex-row items-center mb-1">
                          <Icon name="envelope" size={13} color="#6b7280" />
                          <Text className="text-gray-600 dark:text-gray-300 text-sm ml-2">
                            {result.email}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Icon name="mobile" size={13} color="#6b7280" />
                          <Text className="text-gray-600 dark:text-gray-300 text-sm ml-2">
                            {result.phone}
                          </Text>
                        </View>
                      </View>
                      {selectedUsers.has(result._id) && (
                        <View className="bg-primary-600 w-8 h-8 rounded-full items-center justify-center">
                          <Icon name="check" size={16} color="#ffffff" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}

                {selectedUsers.size > 0 && (
                  <Button onPress={handleAddMembers} disabled={isAdding} className="mt-2">
                    {isAdding
                      ? 'Ajout en cours...'
                      : `Ajouter ${selectedUsers.size} membre${selectedUsers.size > 1 ? 's' : ''}`}
                  </Button>
                )}
              </>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
