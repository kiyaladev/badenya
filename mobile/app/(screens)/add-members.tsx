import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGroupStore } from '@/store/groupStore';
import { useAuthStore } from '@/store/authStore';
import userService, { User } from '@/services/user.service';
import groupService from '@/services/group.service';
import { Button, Loading } from '@/components/ui';

export default function AddMembersScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { groups, fetchGroupById } = useGroupStore();
  const { user: currentUser } = useAuthStore();

  const group = groups.find(g => g._id === groupId);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!group) {
      Alert.alert('Erreur', 'Groupe introuvable', [{ text: 'OK', onPress: () => router.back() }]);
      return;
    }

    // Check if user has permission (admin or treasurer)
    const currentMember = group.members.find(m => m.userId === currentUser?._id);
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
    <View className="flex-1 bg-gray-50">
      <View className="px-6 py-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 mb-2">Ajouter des membres</Text>
          <Text className="text-gray-600">
            Recherchez et ajoutez des membres au groupe {group.name}
          </Text>
        </View>

        {/* Search Box */}
        <View className="mb-6">
          <View className="flex-row items-center bg-white border border-gray-300 rounded-lg px-4 py-2 mb-2">
            <Text className="text-2xl mr-2">🔍</Text>
            <TextInput
              className="flex-1 text-gray-800 py-2"
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

        {/* Info */}
        <View className="bg-blue-50 p-4 rounded-lg mb-4">
          <Text className="text-blue-800 text-sm">
            💡 <Text className="font-semibold">Astuce:</Text> Recherchez les utilisateurs par email
            ou numéro de téléphone
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
            <Text className="text-gray-700 font-semibold mb-3">
              {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} trouvé
              {searchResults.length > 1 ? 's' : ''}
            </Text>

            {searchResults.map(user => (
              <TouchableOpacity
                key={user._id}
                onPress={() => toggleUserSelection(user._id)}
                className={`bg-white p-4 rounded-lg mb-3 border-2 ${
                  selectedUsers.has(user._id)
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-gray-800 font-semibold text-base mb-1">
                      {user.fullName}
                    </Text>
                    <Text className="text-gray-600 text-sm mb-1">📧 {user.email}</Text>
                    <Text className="text-gray-600 text-sm">📱 {user.phone}</Text>
                  </View>
                  {selectedUsers.has(user._id) && (
                    <View className="bg-primary-600 w-8 h-8 rounded-full items-center justify-center">
                      <Text className="text-white text-lg">✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {!isSearching && searchQuery && searchResults.length === 0 && (
          <View className="py-12 items-center">
            <Text className="text-6xl mb-4">🔍</Text>
            <Text className="text-gray-800 text-lg font-bold mb-2">Aucun utilisateur trouvé</Text>
            <Text className="text-gray-600 text-sm text-center">
              Essayez avec un autre email ou numéro
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add Button */}
      {selectedUsers.size > 0 && (
        <View className="px-6 py-4 bg-white border-t border-gray-200">
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
