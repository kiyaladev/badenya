import { Alert } from '@/services/dialog.service';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { useGroupStore } from '@/store/groupStore';
import { useTransactionStore } from '@/store/transactionStore';
import { useAuthStore } from '@/store/authStore';
import { Button, Icon, Loading } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { getFrequencyLabel, getGroupTypeLabel } from '@/constants/labels';
import { shareGroupInvite } from '@/utils/shareInvite';
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
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Text className="text-gray-600 dark:text-gray-300 text-lg">Groupe non trouvé</Text>
      </View>
    );
  }

  const scopedTransactions = transactions.filter(t => t.groupId === id);
  const recentTransactions = scopedTransactions.slice(0, 5);
  const totalContributions =
    group.stats?.totalContributions ??
    scopedTransactions
      .filter(t => t.type === 'contribution' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses =
    group.stats?.totalExpenses ??
    scopedTransactions
      .filter(t => t.type === 'expense' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

  // Check if current user is admin or treasurer
  const currentUserId = user?._id || user?.id;
  const userMember = currentUserId
    ? group?.members.find(m => m.userId === currentUserId)
    : undefined;
  const isAdmin = userMember?.role === 'admin';

  type Action = { icon: IconName; label: string; onPress: () => void };
  const actions: Action[] = [
    ...(group.type === 'tontine'
      ? [
          {
            icon: 'refresh' as const,
            label: 'Tour de rôle',
            onPress: () => router.push(`/(screens)/tontine-rounds?groupId=${id}`),
          },
        ]
      : []),
    {
      icon: 'file-text-o',
      label: 'Propositions',
      onPress: () => router.push(`/(screens)/proposals?groupId=${id}`),
    },
    {
      icon: 'users',
      label: 'Membres',
      onPress: () => router.push(`/(screens)/group-members?groupId=${id}`),
    },
    {
      icon: 'bar-chart',
      label: 'Rapports',
      onPress: () => router.push(`/(screens)/group-reports?groupId=${id}`),
    },
  ];
  const adminActions: Action[] = isAdmin
    ? [
        {
          icon: 'share-alt',
          label: "Partager l'invitation",
          onPress: () => shareGroupInvite(group),
        },
        {
          icon: 'cog',
          label: 'Modifier le groupe',
          onPress: () => router.push(`/(screens)/edit-group?id=${id}`),
        },
      ]
    : [];

  const renderActionList = (items: Action[]) => (
    <View className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
      {items.map((action, index) => (
        <TouchableOpacity
          key={action.label}
          onPress={action.onPress}
          className={`flex-row items-center px-4 py-4 ${
            index !== items.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
          }`}
        >
          <Icon name={action.icon} size={20} color="#0284c7" />
          <Text className="flex-1 text-gray-800 dark:text-gray-100 ml-3">{action.label}</Text>
          <Icon name="chevron-right" size={14} color="#9ca3af" />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="bg-primary-600 p-6">
        <Text className="text-white text-2xl font-bold mb-2">{group.name}</Text>
        <Text className="text-white text-sm opacity-90">
          {getGroupTypeLabel(group.type)} • {group.members.length} membre
          {group.members.length > 1 ? 's' : ''}
        </Text>
        {group.description && (
          <Text className="text-white text-sm opacity-80 mt-2">{group.description}</Text>
        )}
      </View>

      {/* Balance */}
      <View className="mx-6 mt-[-20px] bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <Text className="text-gray-600 dark:text-gray-300 text-sm mb-2">Solde du groupe</Text>
        <Text className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          {group.balance.toLocaleString()} {group.currency}
        </Text>
        <View className="flex-row justify-between">
          <View>
            <Text className="text-gray-600 dark:text-gray-300 text-xs mb-1">Total cotisations</Text>
            <Text className="text-green-600 font-bold">
              {totalContributions.toLocaleString()} {group.currency}
            </Text>
          </View>
          <View>
            <Text className="text-gray-600 dark:text-gray-300 text-xs mb-1">Total dépenses</Text>
            <Text className="text-red-600 font-bold">
              {totalExpenses.toLocaleString()} {group.currency}
            </Text>
          </View>
        </View>
      </View>

      {/* Primary action */}
      <View className="px-6 mt-6">
        <Button
          title="Ajouter une cotisation"
          iconName="plus"
          onPress={() => router.push(`/(screens)/add-contribution?groupId=${id}`)}
        />
      </View>

      {/* Group Info */}
      <View className="px-6 mt-6">
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4">
          <View className="flex-row justify-between mb-3">
            <Text className="text-gray-600 dark:text-gray-300">Cotisation</Text>
            <Text className="text-gray-800 dark:text-gray-100 font-medium">
              {group.contributionAmount.toLocaleString()} {group.currency}
            </Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className="text-gray-600 dark:text-gray-300">Fréquence</Text>
            <Text className="text-gray-800 dark:text-gray-100 font-medium">
              {getFrequencyLabel(group.contributionSettings?.frequency ?? group.frequency)}
            </Text>
          </View>
          {group.nextContributionDate && (
            <View className="flex-row justify-between">
              <Text className="text-gray-600 dark:text-gray-300">Prochaine cotisation</Text>
              <Text className="text-gray-800 dark:text-gray-100 font-medium">
                {new Date(group.nextContributionDate).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Actions */}
      <View className="px-6 mt-6">{renderActionList(actions)}</View>

      {adminActions.length > 0 && (
        <View className="px-6 mt-6">
          <Text className="text-gray-800 dark:text-gray-100 text-lg font-bold mb-4">
            Administration
          </Text>
          {renderActionList(adminActions)}
        </View>
      )}

      {/* Recent Activity */}
      <View className="px-6 mt-6 mb-6">
        <Text className="text-gray-800 dark:text-gray-100 text-lg font-bold mb-4">
          Activité récente
        </Text>
        {recentTransactions.length > 0 ? (
          <View className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
            {recentTransactions.map(transaction => (
              <TransactionItem key={transaction._id} transaction={transaction} />
            ))}
            {scopedTransactions.length > 5 && (
              <TouchableOpacity
                className="px-4 py-3 border-t border-gray-100 dark:border-gray-700"
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/transactions',
                    params: { groupId: id },
                  })
                }
              >
                <Text className="text-primary-600 text-center font-medium">
                  Voir toutes les transactions
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <Text className="text-gray-600 dark:text-gray-300 text-center">
              Aucune activité récente
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
