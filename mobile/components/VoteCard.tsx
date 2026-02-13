import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Proposal } from '@/services/proposal.service';

interface VoteCardProps {
  proposal: Proposal;
}

export default function VoteCard({ proposal }: VoteCardProps) {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-500' },
      approved: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-500' },
      rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-500' },
      executed: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-500' },
    };
    return colors[status] || colors.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      low: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Basse' },
      medium: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Moyenne' },
      high: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Haute' },
      critical: { bg: 'bg-red-100', text: 'text-red-700', label: 'Critique' },
    };
    return badges[priority] || badges.medium;
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

  const formatDate = (date: Date) => {
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
  const priorityBadge = getPriorityBadge(proposal.priority);
  const progress = calculateProgress();
  const stats = getVoteStats();
  const isActive = proposal.status === 'pending';

  return (
    <TouchableOpacity
      onPress={handlePress}
      className={`bg-white rounded-xl p-4 mb-3 shadow-sm border ${statusColors.border}`}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-3">
          <Text className="text-gray-800 font-bold text-lg mb-1">{proposal.title}</Text>
          <Text className="text-gray-600 text-sm" numberOfLines={2}>
            {proposal.description}
          </Text>
        </View>

        {/* Status Badge */}
        <View className={`px-3 py-1 rounded-full ${statusColors.bg}`}>
          <Text className={`text-xs font-medium ${statusColors.text}`}>
            {proposal.status === 'pending' && '⏳ En cours'}
            {proposal.status === 'approved' && '✅ Approuvé'}
            {proposal.status === 'rejected' && '❌ Rejeté'}
            {proposal.status === 'executed' && '✓ Exécuté'}
          </Text>
        </View>
      </View>

      {/* Amount & Priority */}
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-gray-500 text-xs mb-1">Montant</Text>
          <Text className="text-primary-600 font-bold text-lg">
            {formatAmount(proposal.amount)}
          </Text>
        </View>

        <View className={`px-3 py-1 rounded-full ${priorityBadge.bg}`}>
          <Text className={`text-xs font-medium ${priorityBadge.text}`}>{priorityBadge.label}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      {isActive && (
        <View className="mb-3">
          <View className="flex-row justify-between mb-1">
            <Text className="text-gray-600 text-xs">Progression du vote</Text>
            <Text className="text-gray-800 text-xs font-medium">{progress}%</Text>
          </View>
          <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <View className="h-full bg-primary-600" style={{ width: `${progress}%` }} />
          </View>
        </View>
      )}

      {/* Vote Stats */}
      <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-gray-100">
        <View className="flex-row items-center">
          <View className="flex-row items-center mr-4">
            <Text className="text-green-600 text-sm mr-1">👍</Text>
            <Text className="text-gray-700 text-sm font-medium">{stats.for}</Text>
          </View>
          <View className="flex-row items-center mr-4">
            <Text className="text-red-600 text-sm mr-1">👎</Text>
            <Text className="text-gray-700 text-sm font-medium">{stats.against}</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-gray-500 text-sm mr-1">⊝</Text>
            <Text className="text-gray-700 text-sm font-medium">{stats.abstain}</Text>
          </View>
        </View>

        <Text className="text-gray-500 text-xs">
          {proposal.votes?.length || 0} vote{(proposal.votes?.length || 0) > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Footer */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-gray-500 text-xs">Catégorie: {proposal.category}</Text>
        </View>

        {proposal.endDate && (
          <Text className="text-gray-500 text-xs">
            {isActive ? 'Fin: ' : 'Terminé: '}
            {formatDate(proposal.endDate)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
