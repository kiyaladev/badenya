import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useProposalStore } from '@/store/proposalStore';
import { useAuthStore } from '@/store/authStore';
import { Loading } from '@/components/ui';

export default function ProposalDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [refreshing, setRefreshing] = useState(false);

  const { currentProposal, isLoading, fetchProposalById, executeProposal } = useProposalStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (id) {
      loadProposal();
    }
  }, [id]);

  const loadProposal = async () => {
    try {
      await fetchProposalById(id!);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger la proposition');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProposal();
    setRefreshing(false);
  };

  const handleVote = () => {
    router.push(`/(screens)/vote?proposalId=${id}`);
  };

  const handleExecute = async () => {
    Alert.alert(
      'Exécuter la proposition',
      'Voulez-vous exécuter cette proposition et créer la transaction ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Exécuter',
          onPress: async () => {
            try {
              await executeProposal(id!);
              Alert.alert('Succès', 'Proposition exécutée avec succès');
              loadProposal();
            } catch (err: unknown) {
              const error = err as { message?: string };
              Alert.alert('Erreur', error.message || "Impossible d'exécuter la proposition");
            }
          },
        },
      ]
    );
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

  const getStatusColor = () => {
    switch (proposal.status) {
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      case 'expired':
        return 'text-gray-600 bg-gray-50';
      case 'executed':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: proposal.currency || 'XOF',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hasUserVoted = proposal.votes.some(v => v.userId === user?.id);
  const canVote = proposal.status === 'pending' && !hasUserVoted;
  const canExecute = proposal.status === 'approved' && !proposal.executedAt;

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="p-4">
        {/* Header Card */}
        <View className="bg-white rounded-xl p-6 mb-4">
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1 mr-2">
              <Text className="text-gray-800 text-2xl font-bold mb-2">{proposal.title}</Text>
              <View className={`self-start px-3 py-1 rounded-full ${getStatusColor()}`}>
                <Text className="font-semibold text-sm">
                  {proposal.status === 'approved'
                    ? 'Approuvée'
                    : proposal.status === 'pending'
                      ? 'En attente'
                      : proposal.status === 'rejected'
                        ? 'Rejetée'
                        : proposal.status === 'expired'
                          ? 'Expirée'
                          : proposal.status === 'executed'
                            ? 'Exécutée'
                            : proposal.status}
                </Text>
              </View>
            </View>
          </View>

          {/* Amount */}
          <View className="border-t border-gray-200 pt-4 mb-4">
            <Text className="text-gray-600 text-sm mb-1">Montant demandé</Text>
            <Text className="text-primary-600 text-3xl font-bold">
              {formatAmount(proposal.amount)}
            </Text>
          </View>

          {/* Description */}
          <View className="mb-4">
            <Text className="text-gray-600 text-sm mb-1">Description</Text>
            <Text className="text-gray-800">{proposal.description}</Text>
          </View>

          {/* Category & Priority */}
          <View className="flex-row">
            <View className="flex-1 mr-2">
              <Text className="text-gray-600 text-sm mb-1">Catégorie</Text>
              <Text className="text-gray-800 capitalize">{proposal.category}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-600 text-sm mb-1">Priorité</Text>
              <Text className="text-gray-800 capitalize">{proposal.priority}</Text>
            </View>
          </View>
        </View>

        {/* Voting Results */}
        {proposal.result && (
          <View className="bg-white rounded-xl p-4 mb-4">
            <Text className="text-gray-800 text-lg font-bold mb-4">Résultats du vote</Text>

            {/* Vote Breakdown */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-600">Pour</Text>
                <Text className="text-green-600 font-bold">{proposal.result.votesFor}</Text>
              </View>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-600">Contre</Text>
                <Text className="text-red-600 font-bold">{proposal.result.votesAgainst}</Text>
              </View>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-600">Abstentions</Text>
                <Text className="text-gray-500 font-bold">{proposal.result.votesAbstain}</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View className="bg-gray-100 h-4 rounded-full overflow-hidden mb-2">
              <View
                className="bg-green-500 h-full"
                style={{
                  width: `${(proposal.result.votesFor / proposal.result.totalVotes) * 100}%`,
                }}
              />
            </View>
            <Text className="text-gray-600 text-sm text-center">
              {proposal.result.totalVotes} vote(s) • {proposal.result.participationRate.toFixed(0)}%
              de participation
            </Text>
          </View>
        )}

        {/* Votes List */}
        {proposal.votes.length > 0 && (
          <View className="bg-white rounded-xl p-4 mb-4">
            <Text className="text-gray-800 text-lg font-bold mb-3">
              Votes ({proposal.votes.length})
            </Text>
            {proposal.votes.map((vote, index) => (
              <View
                key={index}
                className="flex-row items-center justify-between py-3 border-b border-gray-100"
              >
                <View className="flex-1">
                  <Text className="text-gray-800">Vote #{index + 1}</Text>
                  {vote.comment && (
                    <Text className="text-gray-600 text-sm mt-1">{vote.comment}</Text>
                  )}
                </View>
                <View
                  className={`px-3 py-1 rounded-full ${
                    vote.decision === 'for'
                      ? 'bg-green-50'
                      : vote.decision === 'against'
                        ? 'bg-red-50'
                        : 'bg-gray-50'
                  }`}
                >
                  <Text
                    className={`font-medium text-sm ${
                      vote.decision === 'for'
                        ? 'text-green-600'
                        : vote.decision === 'against'
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {vote.decision === 'for'
                      ? 'Pour'
                      : vote.decision === 'against'
                        ? 'Contre'
                        : 'Abstention'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Details */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-gray-800 text-lg font-bold mb-3">Détails</Text>

          <View className="mb-3">
            <Text className="text-gray-600 text-sm mb-1">Proposé par</Text>
            <Text className="text-gray-800">
              {proposal.proposedBy.fullName}
            </Text>
          </View>

          {proposal.recipient && (
            <View className="mb-3">
              <Text className="text-gray-600 text-sm mb-1">Bénéficiaire</Text>
              <Text className="text-gray-800">{proposal.recipient.name || 'Non spécifié'}</Text>
              {proposal.recipient.details && (
                <Text className="text-gray-600 text-sm mt-1">{proposal.recipient.details}</Text>
              )}
            </View>
          )}

          <View className="mb-3">
            <Text className="text-gray-600 text-sm mb-1">Date de création</Text>
            <Text className="text-gray-800">{formatDate(proposal.createdAt)}</Text>
          </View>

          <View className="mb-3">
            <Text className="text-gray-600 text-sm mb-1">Échéance du vote</Text>
            <Text className="text-gray-800">{formatDate(proposal.votingDeadline)}</Text>
          </View>

          {proposal.executedAt && (
            <View>
              <Text className="text-gray-600 text-sm mb-1">Date d'exécution</Text>
              <Text className="text-gray-800">{formatDate(proposal.executedAt)}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        {(canVote || canExecute) && (
          <View className="bg-white rounded-xl p-4 mb-4">
            {canVote && (
              <TouchableOpacity
                onPress={handleVote}
                className="bg-primary-600 py-3 rounded-lg mb-3"
              >
                <Text className="text-white text-center font-semibold">
                  🗳️ Voter sur cette proposition
                </Text>
              </TouchableOpacity>
            )}

            {canExecute && (
              <TouchableOpacity onPress={handleExecute} className="bg-green-600 py-3 rounded-lg">
                <Text className="text-white text-center font-semibold">
                  ✓ Exécuter la proposition
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
