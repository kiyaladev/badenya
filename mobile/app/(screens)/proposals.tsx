import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useProposalStore } from '@/store/proposalStore';
import { Loading } from '@/components/ui';
import VoteCard from '@/components/VoteCard';

export default function ProposalsScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [refreshing, setRefreshing] = useState(false);

  const { proposals, isLoading, fetchGroupProposals } = useProposalStore();

  useEffect(() => {
    if (groupId) {
      loadProposals();
    }
  }, [groupId]);

  const loadProposals = async () => {
    try {
      await fetchGroupProposals(groupId!);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les propositions');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProposals();
    setRefreshing(false);
  };

  if (isLoading && proposals.length === 0) {
    return <Loading />;
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="px-4 mt-4">
        {/* Create Button */}
        <TouchableOpacity
          className="bg-primary-600 py-3 rounded-lg mb-4"
          onPress={() => router.push(`/(screens)/create-proposal?groupId=${groupId}`)}
        >
          <Text className="text-white text-center font-semibold">+ Créer une proposition</Text>
        </TouchableOpacity>

        {/* Proposals List */}
        {proposals.length === 0 ? (
          <View className="bg-white rounded-xl p-8 items-center">
            <Text className="text-6xl mb-4">📋</Text>
            <Text className="text-gray-800 text-lg font-bold mb-2">Aucune proposition</Text>
            <Text className="text-gray-600 text-sm text-center mb-6">
              Les propositions de dépenses apparaîtront ici
            </Text>
          </View>
        ) : (
          <View className="mb-4">
            {proposals.map(proposal => (
              <VoteCard key={proposal._id} proposal={proposal} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
