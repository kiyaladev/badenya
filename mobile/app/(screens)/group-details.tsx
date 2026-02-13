import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { useGroupStore } from '@/store/groupStore';
import { useTransactionStore } from '@/store/transactionStore';
import { useAuthStore } from '@/store/authStore';
import { Loading } from '@/components/ui';
import TransactionItem from '@/components/TransactionItem';

export default function GroupDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [refreshing, setRefreshing] = useState(false);

  const { groups, isLoading, fetchGroups } = useGroupStore();
  const { transactions, fetchGroupTransactions } = useTransactionStore();
  const { user } = useAuthStore();

  // Find the current group
  const group = groups.find(g => g._id === id);

  useEffect(() => {
    if (id) {
      loadGroupData();
    }
  }, [id]);

  const loadGroupData = async () => {
    try {
      await Promise.all([fetchGroups(), fetchGroupTransactions(id!)]);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les données du groupe');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroupData();
    setRefreshing(false);
  };

  if (isLoading && !group) {
    return <Loading />;
  }

  if (!group) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-600 text-lg">Groupe non trouvé</Text>
      </View>
    );
  }

  const recentTransactions = transactions.slice(0, 5);
  const totalContributions = transactions
    .filter(t => t.type === 'contribution' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      tontine: 'Tontine',
      saving: 'Épargne',
      investment: 'Investissement',
      loan: 'Prêt',
    };
    return labels[type] || type;
  };

  // Check if current user is admin or treasurer
  const userMember = user?.id ? group?.members.find(m => m.userId === user.id) : undefined;
  const isAdmin = userMember?.role === 'admin';
  const canAddMembers = userMember?.role === 'admin' || userMember?.role === 'treasurer';

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="bg-primary-600 p-6">
        <Text className="text-white text-2xl font-bold mb-2">{group.name}</Text>
        <Text className="text-white text-sm opacity-90">
          {getTypeLabel(group.type)} • {group.members.length} membre
          {group.members.length > 1 ? 's' : ''}
        </Text>
        {group.description && (
          <Text className="text-white text-sm opacity-80 mt-2">{group.description}</Text>
        )}
      </View>

      {/* Balance */}
      <View className="mx-6 mt-[-20px] bg-white rounded-xl p-6 shadow-lg">
        <Text className="text-gray-600 text-sm mb-2">Solde du groupe</Text>
        <Text className="text-3xl font-bold text-gray-800 mb-4">
          {group.balance.toLocaleString()} {group.currency}
        </Text>
        <View className="flex-row justify-between">
          <View>
            <Text className="text-gray-600 text-xs mb-1">Total cotisations</Text>
            <Text className="text-green-600 font-bold">
              {totalContributions.toLocaleString()} {group.currency}
            </Text>
          </View>
          <View>
            <Text className="text-gray-600 text-xs mb-1">Total dépenses</Text>
            <Text className="text-red-600 font-bold">
              {totalExpenses.toLocaleString()} {group.currency}
            </Text>
          </View>
        </View>
      </View>

      {/* Group Info */}
      <View className="px-6 mt-6">
        <View className="bg-white rounded-xl p-4">
          <View className="flex-row justify-between mb-3">
            <Text className="text-gray-600">Cotisation</Text>
            <Text className="text-gray-800 font-medium">
              {group.contributionAmount.toLocaleString()} {group.currency}
            </Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className="text-gray-600">Fréquence</Text>
            <Text className="text-gray-800 font-medium">
              {group.frequency === 'weekly'
                ? 'Hebdomadaire'
                : group.frequency === 'monthly'
                  ? 'Mensuelle'
                  : 'Personnalisée'}
            </Text>
          </View>
          {group.nextContributionDate && (
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Prochaine cotisation</Text>
              <Text className="text-gray-800 font-medium">
                {new Date(group.nextContributionDate).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View className="px-6 mt-6">
        <Text className="text-gray-800 text-lg font-bold mb-4">Actions</Text>
        <View className="bg-white rounded-xl overflow-hidden">
          <TouchableOpacity
            className="flex-row items-center px-4 py-4 border-b border-gray-100"
            onPress={() => router.push(`/(screens)/add-contribution?groupId=${id}`)}
          >
            <Text className="text-2xl mr-3">💰</Text>
            <Text className="flex-1 text-gray-800">Faire une contribution</Text>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/(screens)/proposals?groupId=${id}`)}
            className="flex-row items-center px-4 py-4 border-b border-gray-100"
          >
            <Text className="text-2xl mr-3">📋</Text>
            <Text className="flex-1 text-gray-800">Voir les propositions</Text>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/(screens)/group-members?groupId=${id}`)}
            className="flex-row items-center px-4 py-4 border-b border-gray-100"
          >
            <Text className="text-2xl mr-3">👥</Text>
            <Text className="flex-1 text-gray-800">Membres du groupe</Text>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/(screens)/group-reports?groupId=${id}`)}
            className="flex-row items-center px-4 py-4 border-b border-gray-100"
          >
            <Text className="text-2xl mr-3">📊</Text>
            <Text className="flex-1 text-gray-800">Rapports financiers</Text>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/(screens)/group-insights?groupId=${id}`)}
            className="flex-row items-center px-4 py-4 border-b border-gray-100"
          >
            <Text className="text-2xl mr-3">🤖</Text>
            <Text className="flex-1 text-gray-800">Insights IA</Text>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>
          {canAddMembers && (
            <TouchableOpacity
              onPress={() => router.push(`/(screens)/add-members?groupId=${id}`)}
              className="flex-row items-center px-4 py-4 border-b border-gray-100"
            >
              <Text className="text-2xl mr-3">➕</Text>
              <Text className="flex-1 text-gray-800">Ajouter des membres</Text>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>
          )}
          {isAdmin && (
            <TouchableOpacity
              onPress={() => router.push(`/(screens)/edit-group?id=${id}`)}
              className="flex-row items-center px-4 py-4"
            >
              <Text className="text-2xl mr-3">⚙️</Text>
              <Text className="flex-1 text-gray-800">Modifier le groupe</Text>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Recent Activity */}
      <View className="px-6 mt-6 mb-6">
        <Text className="text-gray-800 text-lg font-bold mb-4">Activité récente</Text>
        {recentTransactions.length > 0 ? (
          <View className="bg-white rounded-xl overflow-hidden">
            {recentTransactions.map(transaction => (
              <TransactionItem key={transaction._id} transaction={transaction} />
            ))}
            {transactions.length > 5 && (
              <TouchableOpacity
                className="px-4 py-3 border-t border-gray-100"
                onPress={() => router.push('/(tabs)/transactions')}
              >
                <Text className="text-primary-600 text-center font-medium">
                  Voir toutes les transactions
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View className="bg-white rounded-xl p-6">
            <Text className="text-gray-600 text-center">Aucune activité récente</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
