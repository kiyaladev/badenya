import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Proposal } from '@/services/proposal.service';
import { Icon } from '@/components/ui';
import { getCategoryLabel } from '@/constants/labels';

interface VoteCardProps {
  proposal: Proposal;
}

function VoteCard({ proposal }: VoteCardProps) {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      pending: {
        bg: 'bg-yellow-50 dark:bg-yellow-950',
        text: 'text-yellow-700',
        border: 'border-yellow-500',
      },
      approved: {
        bg: 'bg-green-50 dark:bg-green-950',
        text: 'text-green-700',
        border: 'border-green-500',
      },
      rejected: { bg: 'bg-red-50 dark:bg-red-950', text: 'text-red-700', border: 'border-red-500' },
      executed: {
        bg: 'bg-blue-50 dark:bg-blue-950',
        text: 'text-blue-700',
        border: 'border-blue-500',
      },
    };
    return colors[status] || colors.pending;
  };

  const calculateProgress = () => {
    if (!proposal.votes || proposal.votes.length === 0) return 0;
    const totalVotes = proposal.votes.length;
    const forVotes = proposal.votes.filter(v => v.decision === 'for').length;
    return Math.round((forVotes / totalVotes) * 100);
  };

  const getVoteStats = () => {
    if (!proposal.votes || proposal.votes.length === 0) {
      return { for: 0, against: 0, abstain: 0 };
    }
    return {
      for: proposal.votes.filter(v => v.decision === 'for').length,
      against: proposal.votes.filter(v => v.decision === 'against').length,
      abstain: proposal.votes.filter(v => v.decision === 'abstain').length,
    };
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handlePress = () => {
    router.push(`/(screens)/proposal-details?id=${proposal._id}`);
  };

  const statusColors = getStatusColor(proposal.status);
  const progress = calculateProgress();
  const stats = getVoteStats();
  const isActive = proposal.status === 'pending';

  return (
    <TouchableOpacity
      onPress={handlePress}
      className={`bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 shadow-sm border ${statusColors.border}`}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-3">
          <Text className="text-gray-800 dark:text-gray-100 font-bold text-lg mb-1">
            {proposal.title}
          </Text>
          <Text className="text-gray-600 dark:text-gray-300 text-sm" numberOfLines={2}>
            {proposal.description}
          </Text>
        </View>

        {/* Status Badge */}
        <View className={`px-3 py-1 rounded-full ${statusColors.bg}`}>
          <Text className={`text-xs font-medium ${statusColors.text}`}>
            {proposal.status === 'pending' && 'En cours'}
            {proposal.status === 'approved' && 'Approuvé'}
            {proposal.status === 'rejected' && 'Rejeté'}
            {proposal.status === 'executed' && 'Exécuté'}
          </Text>
        </View>
      </View>

      {/* Amount */}
      <View className="mb-3">
        <View>
          <Text className="text-gray-500 dark:text-gray-400 text-xs mb-1">Montant</Text>
          <Text className="text-primary-600 font-bold text-lg">
            {formatAmount(proposal.amount)}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      {isActive && (
        <View className="mb-3">
          <View className="flex-row justify-between mb-1">
            <Text className="text-gray-600 dark:text-gray-300 text-xs">Progression du vote</Text>
            <Text className="text-gray-800 dark:text-gray-100 text-xs font-medium">
              {progress}%
            </Text>
          </View>
          <View className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <View className="h-full bg-primary-600" style={{ width: `${progress}%` }} />
          </View>
        </View>
      )}

      {/* Vote Stats */}
      <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
        <View className="flex-row items-center">
          <View className="flex-row items-center mr-4">
            <Icon name="thumbs-up" size={14} color="#16a34a" />
            <Text className="text-gray-700 dark:text-gray-200 text-sm font-medium">
              {stats.for}
            </Text>
          </View>
          <View className="flex-row items-center mr-4">
            <Icon name="thumbs-down" size={14} color="#dc2626" />
            <Text className="text-gray-700 dark:text-gray-200 text-sm font-medium">
              {stats.against}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Icon name="minus-circle" size={14} color="#6b7280" />
            <Text className="text-gray-700 dark:text-gray-200 text-sm font-medium">
              {stats.abstain}
            </Text>
          </View>
        </View>

        <Text className="text-gray-500 dark:text-gray-400 text-xs">
          {proposal.votes?.length || 0} vote{(proposal.votes?.length || 0) > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Footer */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-gray-500 dark:text-gray-400 text-xs">
            Catégorie : {getCategoryLabel(proposal.category)}
          </Text>
        </View>

        {proposal.votingDeadline && (
          <Text className="text-gray-500 dark:text-gray-400 text-xs">
            {isActive ? 'Fin: ' : 'Terminé: '}
            {formatDate(proposal.votingDeadline)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default React.memo(VoteCard);
