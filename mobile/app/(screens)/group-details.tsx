import { Alert } from '@/services/dialog.service';
import groupService from '@/services/group.service';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { useGroupStore } from '@/store/groupStore';
import { useTransactionStore } from '@/store/transactionStore';
import { useAuthStore } from '@/store/authStore';
import { Icon, Loading } from '@/components/ui';
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

  const handleShareInvite = async () => {
    if (!group) return;
    let inviteCode = group.invitationCode;
    try {
      inviteCode = inviteCode || (await groupService.invitationCode(group._id));
    } catch {
      return Alert.alert(
        'Invitation indisponible',
        'Seul un administrateur peut obtenir le code du groupe.'
      );
    }
    const message =
      `Rejoignez mon groupe "${group.name}" sur l'application Badenya !\n\n` +
      `Type : ${getTypeLabel(group.type)}\n` +
      `Cotisation : ${group.contributionAmount.toLocaleString()} ${group.currency}\n` +
      `Code du groupe : ${inviteCode}\n\n` +
      `Téléchargez Badenya pour participer aux tontines et épargnes solidaires en toute sécurité.`;

    try {
      await Share.share({
        message,
        title: `Invitation au groupe ${group.name}`,
      });
    } catch {
      // User cancelled
    }
  };

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

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      tontine: 'Tontine',
      association: 'Association',
      family: 'Famille',
      friends: 'Amis',
      project: 'Projet',
    };
    return labels[type] || type;
  };

  // Check if current user is admin or treasurer
  const currentUserId = user?._id || user?.id;
  const userMember = currentUserId
    ? group?.members.find(m => m.userId === currentUserId)
    : undefined;
  const isAdmin = userMember?.role === 'admin';
  const canAddMembers = userMember?.role === 'admin' || userMember?.role === 'treasurer';

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-gray-900"
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
              {group.frequency === 'weekly'
                ? 'Hebdomadaire'
                : group.frequency === 'monthly'
                  ? 'Mensuelle'
                  : 'Personnalisée'}
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

      {/* Tontine Rotation Banner */}
      {group.type === 'tontine' && (
        <View className="px-6 mt-6">
          <TouchableOpacity
            onPress={() => router.push(`/(screens)/tontine-rounds?groupId=${id}`)}
            className="bg-primary-600 rounded-xl p-5 shadow-sm active:bg-primary-700"
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center mr-2.5">
                  <Icon name="refresh" size={16} color="#ffffff" />
                </View>
                <Text className="text-white font-bold text-base">Tour de rôle de la Tontine</Text>
              </View>
              <Icon name="chevron-right" size={14} color="#ffffff" />
            </View>
            <Text className="text-white/90 text-xs leading-relaxed">
              Consultez le calendrier des versements, le bénéficiaire du tour en cours et l'ordre
              des membres.
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Actions */}
      <View className="px-6 mt-6">
        <Text className="text-gray-800 dark:text-gray-100 text-lg font-bold mb-4">Actions</Text>
        <View className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
          {group.type === 'tontine' && (
            <TouchableOpacity
              className="flex-row items-center px-4 py-4 border-b border-gray-100 dark:border-gray-700"
              onPress={() => router.push(`/(screens)/tontine-rounds?groupId=${id}`)}
            >
              <Icon name="refresh" size={20} color="#0284c7" />
              <Text className="flex-1 text-gray-800 dark:text-gray-100 ml-3 font-medium">
                Tour de rôle (Tontine)
              </Text>
              <Icon name="chevron-right" size={14} color="#9ca3af" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            className="flex-row items-center px-4 py-4 border-b border-gray-100 dark:border-gray-700"
            onPress={() => router.push(`/(screens)/add-contribution?groupId=${id}`)}
          >
            <Icon name="money" size={20} color="#0284c7" />
            <Text className="flex-1 text-gray-800 dark:text-gray-100 ml-3">
              Faire une contribution
            </Text>
            <Icon name="chevron-right" size={14} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/(screens)/proposals?groupId=${id}`)}
            className="flex-row items-center px-4 py-4 border-b border-gray-100 dark:border-gray-700"
          >
            <Icon name="file-text-o" size={20} color="#0284c7" />
            <Text className="flex-1 text-gray-800 dark:text-gray-100 ml-3">
              Voir les propositions
            </Text>
            <Icon name="chevron-right" size={14} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/(screens)/group-members?groupId=${id}`)}
            className="flex-row items-center px-4 py-4 border-b border-gray-100 dark:border-gray-700"
          >
            <Icon name="users" size={20} color="#0284c7" />
            <Text className="flex-1 text-gray-800 dark:text-gray-100 ml-3">Membres du groupe</Text>
            <Icon name="chevron-right" size={14} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShareInvite}
            className="flex-row items-center px-4 py-4 border-b border-gray-100 dark:border-gray-700"
          >
            <Icon name="share-alt" size={20} color="#0284c7" />
            <Text className="flex-1 text-gray-800 dark:text-gray-100 ml-3">
              Partager l'invitation (WhatsApp / SMS)
            </Text>
            <Icon name="chevron-right" size={14} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/(screens)/group-reports?groupId=${id}`)}
            className="flex-row items-center px-4 py-4 border-b border-gray-100 dark:border-gray-700"
          >
            <Icon name="bar-chart" size={20} color="#0284c7" />
            <Text className="flex-1 text-gray-800 dark:text-gray-100 ml-3">
              Rapports financiers
            </Text>
            <Icon name="chevron-right" size={14} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/(screens)/group-insights?groupId=${id}`)}
            className="flex-row items-center px-4 py-4 border-b border-gray-100 dark:border-gray-700"
          >
            <Icon name="lightbulb-o" size={20} color="#0284c7" />
            <Text className="flex-1 text-gray-800 dark:text-gray-100 ml-3">Insights IA</Text>
            <Icon name="chevron-right" size={14} color="#9ca3af" />
          </TouchableOpacity>
          {canAddMembers && (
            <TouchableOpacity
              onPress={() => router.push(`/(screens)/add-members?groupId=${id}`)}
              className="flex-row items-center px-4 py-4 border-b border-gray-100 dark:border-gray-700"
            >
              <Icon name="user-plus" size={20} color="#0284c7" />
              <Text className="flex-1 text-gray-800 dark:text-gray-100 ml-3">
                Ajouter des membres
              </Text>
              <Icon name="chevron-right" size={14} color="#9ca3af" />
            </TouchableOpacity>
          )}
          {isAdmin && (
            <TouchableOpacity
              onPress={() => router.push(`/(screens)/edit-group?id=${id}`)}
              className="flex-row items-center px-4 py-4"
            >
              <Icon name="cog" size={20} color="#0284c7" />
              <Text className="flex-1 text-gray-800 dark:text-gray-100 ml-3">
                Modifier le groupe
              </Text>
              <Icon name="chevron-right" size={14} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

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
