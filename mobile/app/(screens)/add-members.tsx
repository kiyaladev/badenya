import { Alert } from '@/services/dialog.service';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Share } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGroupStore } from '@/store/groupStore';
import { useAuthStore } from '@/store/authStore';
import userService, { User } from '@/services/user.service';
import groupService from '@/services/group.service';
import { Button, Icon, Loading } from '@/components/ui';

export default function AddMembersScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { groups, fetchGroupById } = useGroupStore();
  const { user: currentUser } = useAuthStore();

  const group = groups.find(g => g._id === groupId);

  const [requests, setRequests] = useState<Awaited<ReturnType<typeof groupService.joinRequests>>>(
    []
  );
  useEffect(() => {
    if (groupId)
      groupService
        .joinRequests(groupId)
        .then(setRequests)
        .catch(() => {});
  }, [groupId]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const handleShareInvite = async () => {
    if (!group) return;
    let inviteCode = group.invitationCode;
    try {
      inviteCode = inviteCode || (await groupService.invitationCode(group._id));
    } catch {
      return Alert.alert(
        'Invitation indisponible',
        'Seul un administrateur peut obtenir le code du groupe.'
      );
    }
    const message =
      `Rejoignez mon groupe "${group.name}" sur l'application Badenya !\n\n` +
      `Cotisation : ${group.contributionAmount.toLocaleString()} ${group.currency}\n` +
      `Code du groupe : ${inviteCode}\n\n` +
      `Téléchargez Badenya pour gérer vos tontines et épargnes solidaires.`;

    try {
      await Share.share({
        message,
        title: `Invitation au groupe ${group.name}`,
      });
    } catch {
      // User cancelled
    }
  };

  useEffect(() => {
    if (!group) {
      if (groupId) fetchGroupById(groupId);
      return;
    }

    // Check if user has permission (admin or treasurer)
    const currentUserId = currentUser?._id || currentUser?.id;
    const currentMember = group.members.find(m => m.userId === currentUserId);
    if (!currentMember || (currentMember.role !== 'admin' && currentMember.role !== 'treasurer')) {
      Alert.alert(
        'Accès refusé',
        'Seuls les administrateurs et trésoriers peuvent ajouter des membres',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, [group, currentUser]);

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
      const filteredResults = results.filter(user => !existingMemberIds.has(user._id));

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
      const promises = Array.from(selectedUsers).map(userId =>
        groupService.addMember(groupId!, userId)
      );

      await Promise.all(promises);

      // Refresh group data
      await fetchGroupById(groupId!);

      Alert.alert(
        'Succès',
        `${selectedUsers.size} membre${selectedUsers.size > 1 ? 's' : ''} ajouté${selectedUsers.size > 1 ? 's' : ''} avec succès`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: unknown) {
      const error = err as { message?: string };
      Alert.alert('Erreur', error.message || "Impossible d'ajouter les membres");
    } finally {
      setIsAdding(false);
    }
  };

  if (!group) {
    return <Loading />;
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="px-6 py-6">
        {requests
          .filter(request => !request.status || request.status === 'pending')
          .map(request => (
            <View key={request._id} className="p-4 bg-white dark:bg-gray-800 mb-2">
              <Text className="text-gray-800 dark:text-white font-bold">
                Demande : {request.userId?.fullName || request.userId?.email || 'Membre'}
              </Text>
              <View className="flex-row mt-2">
                {(['approve', 'reject'] as const).map(decision => (
                  <TouchableOpacity
                    key={decision}
                    className="p-3 mr-3 bg-primary-600 rounded-lg"
                    onPress={async () => {
                      try {
                        await groupService.reviewJoinRequest(groupId, request._id, decision);
                        setRequests(await groupService.joinRequests(groupId));
                        await fetchGroupById(groupId);
                      } catch {
                        Alert.alert('Erreur', 'La demande reste inchangée.');
                      }
                    }}
                  >
                    <Text className="text-white">
                      {decision === 'approve' ? 'Approuver' : 'Refuser'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Ajouter des membres
          </Text>
          <Text className="text-gray-600 dark:text-gray-300">
            Recherchez et ajoutez des membres au groupe {group.name}
          </Text>
        </View>

        {/* Search Box */}
        <View className="mb-6">
          <View className="flex-row items-center bg-white dark:bg-gray-800 border border-gray-300 rounded-lg px-4 py-2 mb-2">
            <Icon name="search" size={18} color="#9ca3af" />
            <TextInput
              className="flex-1 text-gray-800 dark:text-gray-100 py-2"
              placeholder="Email ou téléphone..."
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

        {/* Share Invite Card */}
        <TouchableOpacity
          onPress={handleShareInvite}
          className="flex-row items-center justify-between bg-primary-50 dark:bg-gray-800 border border-primary-200 rounded-xl p-4 mb-5 active:bg-primary-100"
        >
          <View className="flex-row items-center flex-1 mr-3">
            <View className="w-10 h-10 bg-primary-600 rounded-full items-center justify-center mr-3">
              <Icon name="share-alt" size={16} color="#ffffff" />
            </View>
            <View className="flex-1">
              <Text className="text-primary-900 font-bold text-sm">
                Inviter via WhatsApp ou SMS
              </Text>
              <Text className="text-primary-700 text-xs">
                Partagez directement le code et le lien d'invitation
              </Text>
            </View>
          </View>
          <Icon name="chevron-right" size={14} color="#0284c7" />
        </TouchableOpacity>

        {/* Info */}
        <View className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg mb-4">
          <Text className="text-blue-800 text-sm">
            <Icon name="lightbulb-o" size={14} color="#1d4ed8" />{' '}
            <Text className="font-semibold">Astuce:</Text> Recherchez les utilisateurs par email ou
            numéro de téléphone
          </Text>
        </View>
      </View>

      {/* Search Results */}
      <ScrollView className="flex-1 px-6">
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

            {searchResults.map(user => (
              <TouchableOpacity
                key={user._id}
                onPress={() => toggleUserSelection(user._id)}
                className={`bg-white dark:bg-gray-800 p-4 rounded-lg mb-3 border-2 ${
                  selectedUsers.has(user._id)
                    ? 'border-primary-600 bg-primary-50 dark:bg-gray-800'
                    : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-gray-800 dark:text-gray-100 font-semibold text-base mb-1">
                      {user.fullName}
                    </Text>
                    <View className="flex-row items-center mb-1">
                      <Icon name="envelope" size={13} color="#6b7280" />
                      <Text className="text-gray-600 dark:text-gray-300 text-sm ml-2">
                        {user.email}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Icon name="mobile" size={13} color="#6b7280" />
                      <Text className="text-gray-600 dark:text-gray-300 text-sm ml-2">
                        {user.phone}
                      </Text>
                    </View>
                  </View>
                  {selectedUsers.has(user._id) && (
                    <View className="bg-primary-600 w-8 h-8 rounded-full items-center justify-center">
                      <Icon name="check" size={16} color="#ffffff" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {!isSearching && searchQuery && searchResults.length === 0 && (
          <View className="py-12 items-center">
            <Icon name="search" size={48} color="#0284c7" />
            <Text className="text-gray-800 dark:text-gray-100 text-lg font-bold mb-2">
              Aucun utilisateur trouvé
            </Text>
            <Text className="text-gray-600 dark:text-gray-300 text-sm text-center">
              Essayez avec un autre email ou numéro
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add Button */}
      {selectedUsers.size > 0 && (
        <View className="px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600">
          <Button onPress={handleAddMembers} disabled={isAdding}>
            {isAdding
              ? 'Ajout en cours...'
              : `Ajouter ${selectedUsers.size} membre${selectedUsers.size > 1 ? 's' : ''}`}
          </Button>
        </View>
      )}
    </View>
  );
}
