import { Alert } from '@/services/dialog.service';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useProposalStore } from '@/store/proposalStore';
import { useAuthStore } from '@/store/authStore';
import proposalService from '@/services/proposal.service';
import { useGroupStore } from '@/store/groupStore';
import { getErrorMessage } from '@/utils/errorHandler';
import { Icon, Loading } from '@/components/ui';
import { getCategoryLabel } from '@/constants/labels';

export default function ProposalDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const [comment, setComment] = useState('');
  const [isVoting, setIsVoting] = useState(false);

  const {
    currentProposal,
    isLoading,
    fetchProposalById,
    executeProposal,
    cancelProposal,
    voteOnProposal,
  } = useProposalStore();
  const { user } = useAuthStore();
  const groups = useGroupStore(state => state.groups);
  const fetchGroupById = useGroupStore(state => state.fetchGroupById);
  useEffect(() => {
    if (currentProposal?.groupId) fetchGroupById(currentProposal.groupId);
  }, [currentProposal?.groupId, fetchGroupById]);

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

  const handleVote = async (vote: 'for' | 'against' | 'abstain') => {
    setIsVoting(true);
    try {
      await voteOnProposal(id!, { vote, comment: comment.trim() || undefined });
      setComment('');
      Alert.alert('Succès', 'Votre vote a été enregistré');
    } catch (error) {
      Alert.alert('Erreur', getErrorMessage(error, "Impossible d'enregistrer votre vote"));
    } finally {
      setIsVoting(false);
    }
  };

  const handleExecute = async () => {
    Alert.alert(
      'Effectuer la dépense',
      'Voulez-vous effectuer cette dépense et créer la transaction ?',
      [
        { text: 'Retour', style: 'cancel' },
        {
          text: 'Effectuer',
          onPress: async () => {
            try {
              await executeProposal(id!);
              Alert.alert('Succès', 'Dépense effectuée');
              loadProposal();
            } catch (err: unknown) {
              // Shows the API message (e.g. financial storage unavailable)
              // instead of axios' generic "Request failed with status code".
              Alert.alert('Erreur', getErrorMessage(err, "Impossible d'effectuer la dépense"));
            }
          },
        },
      ]
    );
  };

  const handleCancelProposal = () => {
    Alert.alert(
      'Retirer la proposition',
      'Voulez-vous retirer cette proposition ? Elle ne pourra plus être votée ni dépensée.',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, retirer',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelProposal(id!);
              Alert.alert('Succès', 'Proposition retirée', [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ]);
            } catch (err: unknown) {
              // Shows the API message (e.g. financial storage unavailable)
              // instead of axios' generic "Request failed with status code".
              Alert.alert('Erreur', getErrorMessage(err, 'Impossible de retirer la proposition'));
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
      <View className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center px-6">
        <Icon name="times-circle" size={48} color="#dc2626" />
        <Text className="text-gray-800 dark:text-gray-100 text-xl font-bold mb-2">
          Proposition introuvable
        </Text>
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

  const getStatusStyle = () => {
    switch (proposal.status) {
      case 'approved':
        return { bg: 'bg-green-50 dark:bg-green-950', text: 'text-green-600' };
      case 'pending':
        return { bg: 'bg-yellow-50 dark:bg-yellow-950', text: 'text-yellow-600' };
      case 'rejected':
        return { bg: 'bg-red-50 dark:bg-red-950', text: 'text-red-600' };
      case 'expired':
        return { bg: 'bg-gray-50 dark:bg-gray-900', text: 'text-gray-600 dark:text-gray-300' };
      case 'executed':
        return { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-600' };
      default:
        return { bg: 'bg-gray-50 dark:bg-gray-900', text: 'text-gray-600 dark:text-gray-300' };
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

  const currentUserId = user?._id || user?.id;
  const hasUserVoted = proposal.votes.some(v => v.userId === currentUserId);
  const canVote =
    proposal.status === 'pending' &&
    !hasUserVoted &&
    new Date(proposal.votingDeadline).getTime() > Date.now();
  const member = groups
    .find(group => group._id === proposal.groupId)
    ?.members.find(member => member.userId === currentUserId);
  const canManage = member?.role === 'admin' || member?.role === 'treasurer';
  const canExecute = canManage && proposal.status === 'approved' && !proposal.executedAt;
  const canClose =
    proposal.status === 'pending' &&
    (canManage || proposal.proposedBy._id === currentUserId) &&
    new Date(proposal.votingDeadline).getTime() <= Date.now();
  const isCreator = proposal.proposedBy._id === currentUserId;
  const canCancel =
    (proposal.status === 'pending' || proposal.status === 'approved') &&
    !proposal.executedAt &&
    isCreator;

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="p-4">
        {/* Header Card */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-4">
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1 mr-2">
              <Text className="text-gray-800 dark:text-gray-100 text-2xl font-bold mb-2">
                {proposal.title}
              </Text>
              {(() => {
                const statusStyle = getStatusStyle();
                return (
                  <View className={`self-start px-3 py-1 rounded-full ${statusStyle.bg}`}>
                    <Text className={`font-semibold text-sm ${statusStyle.text}`}>
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
                );
              })()}
            </View>
          </View>

          {/* Amount */}
          <View className="border-t border-gray-200 dark:border-gray-600 pt-4 mb-4">
            <Text className="text-gray-600 dark:text-gray-300 text-sm mb-1">Montant demandé</Text>
            <Text className="text-primary-600 text-3xl font-bold">
              {formatAmount(proposal.amount)}
            </Text>
          </View>

          {/* Description */}
          <View className="mb-4">
            <Text className="text-gray-600 dark:text-gray-300 text-sm mb-1">Description</Text>
            <Text className="text-gray-800 dark:text-gray-100">{proposal.description}</Text>
          </View>

          {/* Category */}
          <View>
            <Text className="text-gray-600 dark:text-gray-300 text-sm mb-1">Catégorie</Text>
            <Text className="text-gray-800 dark:text-gray-100">
              {getCategoryLabel(proposal.category)}
            </Text>
          </View>
        </View>

        {/* Voting Results */}
        {proposal.result && (
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4">
            <Text className="text-gray-800 dark:text-gray-100 text-lg font-bold mb-4">
              Résultats du vote
            </Text>

            {/* Vote Breakdown */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-600 dark:text-gray-300">Pour</Text>
                <Text className="text-green-600 font-bold">{proposal.result.votesFor}</Text>
              </View>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-600 dark:text-gray-300">Contre</Text>
                <Text className="text-red-600 font-bold">{proposal.result.votesAgainst}</Text>
              </View>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-600 dark:text-gray-300">Abstentions</Text>
                <Text className="text-gray-500 dark:text-gray-400 font-bold">
                  {proposal.result.votesAbstain}
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View className="bg-gray-100 dark:bg-gray-700 h-4 rounded-full overflow-hidden mb-2">
              <View
                className="bg-green-500 h-full"
                style={{
                  width: `${(proposal.result.votesFor / Math.max(1, proposal.result.totalVotes)) * 100}%`,
                }}
              />
            </View>
            <Text className="text-gray-600 dark:text-gray-300 text-sm text-center">
              {proposal.result.totalVotes} vote(s) • {proposal.result.participationRate.toFixed(0)}%
              de participation
            </Text>
          </View>
        )}

        {/* Details */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4">
          <Text className="text-gray-800 dark:text-gray-100 text-lg font-bold mb-3">Détails</Text>

          <View className="mb-3">
            <Text className="text-gray-600 dark:text-gray-300 text-sm mb-1">Proposé par</Text>
            <Text className="text-gray-800 dark:text-gray-100">{proposal.proposedBy.fullName}</Text>
          </View>

          {proposal.recipient && (
            <View className="mb-3">
              <Text className="text-gray-600 dark:text-gray-300 text-sm mb-1">Bénéficiaire</Text>
              <Text className="text-gray-800 dark:text-gray-100">
                {proposal.recipient.name || 'Non spécifié'}
              </Text>
              {proposal.recipient.details && (
                <Text className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                  {proposal.recipient.details}
                </Text>
              )}
            </View>
          )}

          <View className="mb-3">
            <Text className="text-gray-600 dark:text-gray-300 text-sm mb-1">Date de création</Text>
            <Text className="text-gray-800 dark:text-gray-100">
              {formatDate(proposal.createdAt)}
            </Text>
          </View>

          <View className="mb-3">
            <Text className="text-gray-600 dark:text-gray-300 text-sm mb-1">Échéance du vote</Text>
            <Text className="text-gray-800 dark:text-gray-100">
              {formatDate(proposal.votingDeadline)}
            </Text>
          </View>

          {proposal.executedAt && (
            <View>
              <Text className="text-gray-600 dark:text-gray-300 text-sm mb-1">
                Date d'exécution
              </Text>
              <Text className="text-gray-800 dark:text-gray-100">
                {formatDate(proposal.executedAt)}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        {(canVote || canExecute || canCancel || canClose) && (
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4">
            {canClose && (
              <TouchableOpacity
                className="bg-primary-600 py-3 rounded-lg mb-3"
                onPress={async () => {
                  try {
                    await proposalService.closeProposal(id!);
                    await loadProposal();
                  } catch (error) {
                    Alert.alert('Clôture impossible', getErrorMessage(error));
                  }
                }}
              >
                <Text className="text-white text-center font-semibold">
                  Clôturer le vote et compter les voix
                </Text>
              </TouchableOpacity>
            )}
            {canVote && (
              <View className="mb-3">
                <Text className="text-gray-800 dark:text-gray-100 font-semibold mb-2">
                  Votre vote
                </Text>
                <TextInput
                  className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 mb-3 text-gray-800 dark:text-gray-100"
                  placeholder="Commentaire (optionnel)"
                  placeholderTextColor="#9ca3af"
                  value={comment}
                  onChangeText={setComment}
                  maxLength={500}
                />
                <View className="flex-row">
                  {(
                    [
                      { value: 'for', label: 'Pour', className: 'bg-green-600' },
                      { value: 'against', label: 'Contre', className: 'bg-red-600' },
                      { value: 'abstain', label: 'Abstention', className: 'bg-gray-500' },
                    ] as const
                  ).map((option, index) => (
                    <TouchableOpacity
                      key={option.value}
                      disabled={isVoting}
                      onPress={() => handleVote(option.value)}
                      className={`flex-1 py-3 rounded-lg ${option.className} ${index < 2 ? 'mr-2' : ''} ${isVoting ? 'opacity-50' : ''}`}
                    >
                      <Text className="text-white text-center font-semibold">{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {canExecute && (
              <TouchableOpacity
                onPress={handleExecute}
                className={`bg-green-600 py-3 rounded-lg ${canCancel ? 'mb-3' : ''}`}
              >
                <View className="flex-row items-center justify-center">
                  <Icon name="play" size={16} color="#ffffff" />
                  <Text className="text-white font-semibold ml-2">Effectuer la dépense</Text>
                </View>
              </TouchableOpacity>
            )}

            {canCancel && (
              <TouchableOpacity
                onPress={handleCancelProposal}
                className="bg-red-50 dark:bg-red-950 py-3 rounded-lg border border-red-200"
              >
                <View className="flex-row items-center justify-center">
                  <Icon name="times-circle" size={16} color="#dc2626" />
                  <Text className="text-red-600 font-semibold ml-2">Retirer la proposition</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
