import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useProposalStore } from '@/store/proposalStore';
import { Loading, Button } from '@/components/ui';

export default function VoteScreen() {
  const router = useRouter();
  const { proposalId } = useLocalSearchParams<{ proposalId: string }>();
  const [selectedDecision, setSelectedDecision] = useState<'for' | 'against' | 'abstain' | null>(
    null
  );
  const [comment, setComment] = useState('');

  const { currentProposal, isLoading, fetchProposalById, voteOnProposal } = useProposalStore();

  useEffect(() => {
    if (proposalId) {
      loadProposal();
    }
  }, [proposalId]);

  const loadProposal = async () => {
    try {
      await fetchProposalById(proposalId!);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger la proposition');
    }
  };

  const handleVote = async () => {
    if (!selectedDecision) {
      Alert.alert('Attention', 'Veuillez sélectionner une option de vote');
      return;
    }

    try {
      await voteOnProposal(proposalId!, {
        decision: selectedDecision,
        comment: comment.trim() || undefined,
      });

      Alert.alert('Succès', 'Votre vote a été enregistré', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: unknown) {
      const error = err as { message?: string };
      Alert.alert('Erreur', error.message || "Impossible d'enregistrer votre vote");
    }
  };

  if (isLoading && !currentProposal) {
    return <Loading />;
  }

  if (!currentProposal) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Text className="text-6xl mb-4">❌</Text>
        <Text className="text-gray-800 text-xl font-bold mb-2">Proposition introuvable</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary-600 py-3 px-6 rounded-lg"
        >
          <Text className="text-white font-semibold">Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const proposal = currentProposal;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: proposal.currency || 'XOF',
    }).format(amount);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Proposal Summary */}
        <View className="bg-white rounded-xl p-6 mb-4">
          <Text className="text-gray-800 text-xl font-bold mb-2">{proposal.title}</Text>
          <Text className="text-gray-600 mb-4">{proposal.description}</Text>
          <View className="border-t border-gray-200 pt-4">
            <Text className="text-gray-600 text-sm mb-1">Montant demandé</Text>
            <Text className="text-primary-600 text-2xl font-bold">
              {formatAmount(proposal.amount)}
            </Text>
          </View>
        </View>

        {/* Vote Options */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-gray-800 text-lg font-bold mb-4">Votre vote</Text>

          {/* For */}
          <TouchableOpacity
            className={`flex-row items-center p-4 rounded-lg mb-3 border-2 ${
              selectedDecision === 'for'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-white'
            }`}
            onPress={() => setSelectedDecision('for')}
          >
            <View
              className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                selectedDecision === 'for' ? 'border-green-500 bg-green-500' : 'border-gray-300'
              }`}
            >
              {selectedDecision === 'for' && <Text className="text-white text-sm">✓</Text>}
            </View>
            <View className="flex-1">
              <Text
                className={`font-semibold ${
                  selectedDecision === 'for' ? 'text-green-700' : 'text-gray-800'
                }`}
              >
                👍 Pour
              </Text>
              <Text className="text-gray-600 text-sm">Vous approuvez cette proposition</Text>
            </View>
          </TouchableOpacity>

          {/* Against */}
          <TouchableOpacity
            className={`flex-row items-center p-4 rounded-lg mb-3 border-2 ${
              selectedDecision === 'against'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 bg-white'
            }`}
            onPress={() => setSelectedDecision('against')}
          >
            <View
              className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                selectedDecision === 'against' ? 'border-red-500 bg-red-500' : 'border-gray-300'
              }`}
            >
              {selectedDecision === 'against' && <Text className="text-white text-sm">✓</Text>}
            </View>
            <View className="flex-1">
              <Text
                className={`font-semibold ${
                  selectedDecision === 'against' ? 'text-red-700' : 'text-gray-800'
                }`}
              >
                👎 Contre
              </Text>
              <Text className="text-gray-600 text-sm">Vous rejetez cette proposition</Text>
            </View>
          </TouchableOpacity>

          {/* Abstain */}
          <TouchableOpacity
            className={`flex-row items-center p-4 rounded-lg border-2 ${
              selectedDecision === 'abstain'
                ? 'border-gray-500 bg-gray-50'
                : 'border-gray-200 bg-white'
            }`}
            onPress={() => setSelectedDecision('abstain')}
          >
            <View
              className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                selectedDecision === 'abstain' ? 'border-gray-500 bg-gray-500' : 'border-gray-300'
              }`}
            >
              {selectedDecision === 'abstain' && <Text className="text-white text-sm">✓</Text>}
            </View>
            <View className="flex-1">
              <Text
                className={`font-semibold ${
                  selectedDecision === 'abstain' ? 'text-gray-700' : 'text-gray-800'
                }`}
              >
                🤷 Abstention
              </Text>
              <Text className="text-gray-600 text-sm">Vous ne prenez pas position</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Comment */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-gray-800 text-base font-semibold mb-2">
            Commentaire (optionnel)
          </Text>
          <TextInput
            className="bg-gray-50 rounded-lg p-3 text-gray-800"
            value={comment}
            onChangeText={setComment}
            placeholder="Ajoutez un commentaire à votre vote..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text className="text-gray-500 text-xs mt-2 text-right">{comment.length}/500</Text>
        </View>

        {/* Submit Button */}
        <Button
          title="Enregistrer mon vote"
          onPress={handleVote}
          loading={isLoading}
          disabled={!selectedDecision}
          fullWidth
        />

        {/* Cancel Button */}
        <TouchableOpacity className="mt-3 py-3" onPress={() => router.back()}>
          <Text className="text-gray-600 text-center font-medium">Annuler</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
