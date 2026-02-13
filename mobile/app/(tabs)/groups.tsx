import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useGroupStore } from '@/store/groupStore';
import GroupCard from '@/components/GroupCard';
import { Loading } from '@/components/ui';

export default function GroupsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const router = useRouter();

  const { groups, isLoading, fetchGroups } = useGroupStore();

  useEffect(() => {
    fetchGroups();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || group.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800 mb-4">Mes Groupes</Text>

        {/* Search Bar */}
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Rechercher un groupe..."
          className="bg-gray-100 px-4 py-3 rounded-lg text-base"
        />
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Group Categories */}
        <View className="px-6 mt-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              className={`px-4 py-2 rounded-full mr-2 ${selectedFilter === 'all' ? 'bg-primary-600' : 'bg-gray-200'}`}
              onPress={() => setSelectedFilter('all')}
            >
              <Text
                className={`font-medium ${selectedFilter === 'all' ? 'text-white' : 'text-gray-700'}`}
              >
                Tous
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`px-4 py-2 rounded-full mr-2 ${selectedFilter === 'tontine' ? 'bg-primary-600' : 'bg-gray-200'}`}
              onPress={() => setSelectedFilter('tontine')}
            >
              <Text
                className={`font-medium ${selectedFilter === 'tontine' ? 'text-white' : 'text-gray-700'}`}
              >
                Tontines
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`px-4 py-2 rounded-full mr-2 ${selectedFilter === 'saving' ? 'bg-primary-600' : 'bg-gray-200'}`}
              onPress={() => setSelectedFilter('saving')}
            >
              <Text
                className={`font-medium ${selectedFilter === 'saving' ? 'text-white' : 'text-gray-700'}`}
              >
                Épargne
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`px-4 py-2 rounded-full mr-2 ${selectedFilter === 'investment' ? 'bg-primary-600' : 'bg-gray-200'}`}
              onPress={() => setSelectedFilter('investment')}
            >
              <Text
                className={`font-medium ${selectedFilter === 'investment' ? 'text-white' : 'text-gray-700'}`}
              >
                Investissement
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Groups List */}
        <View className="px-6 mt-6">
          {isLoading && !refreshing ? (
            <Loading />
          ) : filteredGroups.length === 0 ? (
            /* Empty State */
            <View className="bg-white rounded-xl p-8 items-center">
              <Text className="text-6xl mb-4">👥</Text>
              <Text className="text-gray-800 text-lg font-bold mb-2">
                {searchQuery ? 'Aucun groupe trouvé' : 'Aucun groupe'}
              </Text>
              <Text className="text-gray-600 text-sm text-center mb-6">
                {searchQuery
                  ? 'Essayez une autre recherche'
                  : "Commencez par créer votre premier groupe d'épargne"}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  className="bg-primary-600 px-6 py-3 rounded-lg flex-row items-center"
                  onPress={() => router.push('/(screens)/create-group')}
                >
                  <Text className="text-white text-base font-bold mr-2">+</Text>
                  <Text className="text-white text-base font-bold">Créer un groupe</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            /* Groups List */
            filteredGroups.map(group => <GroupCard key={group._id} group={group} />)
          )}
        </View>

        {/* Discover Groups - Only show when user has groups */}
        {groups.length > 0 && (
          <View className="px-6 mt-6 mb-6">
            <Text className="text-gray-800 text-lg font-bold mb-4">Découvrir</Text>
            <View className="bg-white rounded-xl p-6">
              <Text className="text-gray-800 text-base font-medium mb-2">Groupes publics</Text>
              <Text className="text-gray-600 text-sm mb-4">
                Rejoignez des groupes d'épargne publics dans votre région
              </Text>
              <TouchableOpacity className="bg-gray-100 px-4 py-3 rounded-lg">
                <Text className="text-gray-700 text-center font-medium">Explorer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-primary-600 w-16 h-16 rounded-full items-center justify-center shadow-lg"
        style={{ elevation: 5 }}
        onPress={() => router.push('/(screens)/create-group')}
      >
        <Text className="text-white text-3xl">+</Text>
      </TouchableOpacity>
    </View>
  );
}
