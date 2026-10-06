import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useTransactionStore } from '@/store/transactionStore';
import { useGroupStore } from '@/store/groupStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, Loading } from '@/components/ui';
import transactionService, { Transaction } from '@/services/transaction.service';
import { getErrorMessage } from '@/utils/errorHandler';
import TransactionItem from '@/components/TransactionItem';

export default function TransactionsScreen() {
  const { groupId: queryGroupId } = useLocalSearchParams<{ groupId?: string }>();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(queryGroupId || null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'contributions' | 'expenses'>('all');
  const insets = useSafeAreaInsets();

  const PAGE_SIZE = 15;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [pageTransactions, setPageTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(false);

  const { isLoading } = useTransactionStore();
  const { groups, fetchGroups } = useGroupStore();

  useEffect(() => {
    if (queryGroupId) {
      setSelectedGroupId(queryGroupId);
    }
  }, [queryGroupId]);

  useEffect(() => {
    fetchGroups();
  }, []);
  useEffect(() => {
    loadTransactions();
  }, [selectedGroupId, selectedTab]);
  const loadTransactions = async (nextPage = 1) => {
    setPageLoading(true);
    setFetchError(null);
    try {
      const data = await transactionService.getTransactionPage({
        page: nextPage,
        limit: PAGE_SIZE,
        groupId: selectedGroupId || undefined,
        type:
          selectedTab === 'contributions'
            ? 'contribution'
            : selectedTab === 'expenses'
              ? 'expense'
              : undefined,
      });
      setPageTransactions(previous =>
        nextPage === 1 ? data.transactions : [...previous, ...data.transactions]
      );
      setPage(nextPage);
      setPages(data.pages);
      setTotal(data.total);
      setVisibleCount(nextPage * PAGE_SIZE);
    } catch (error) {
      setFetchError(getErrorMessage(error));
    } finally {
      setPageLoading(false);
    }
  };
  const transactions = pageTransactions;

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setVisibleCount(PAGE_SIZE);
    setRefreshing(false);
  };

  const handleTabChange = (tab: 'all' | 'contributions' | 'expenses') => {
    setSelectedTab(tab);
    setVisibleCount(PAGE_SIZE);
  };

  const selectedGroup = groups.find(g => g._id === selectedGroupId);

  // Filter transactions by selected group if any
  const groupFilteredTransactions = selectedGroupId
    ? transactions.filter(t => t.groupId === selectedGroupId)
    : transactions;

  // Filter transactions based on selected tab
  const filteredTransactions = groupFilteredTransactions.filter(t => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'contributions') return t.type === 'contribution';
    if (selectedTab === 'expenses') return t.type === 'expense';
    return true;
  });

  // Sort chronologically (newest first)
  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const displayedTransactions = sortedTransactions.slice(0, visibleCount);
  const hasMore = page < pages;

  // Calculate stats for current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthTransactions = groupFilteredTransactions.filter(t => {
    const date = new Date(t.createdAt);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const monthContributions = monthTransactions
    .filter(t => t.type === 'contribution' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpenses = monthTransactions
    .filter(t => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  if (isLoading && transactions.length === 0) {
    return <Loading />;
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {fetchError && (
        <Text accessibilityRole="alert" className="text-red-600 p-4">
          {fetchError}
        </Text>
      )}
      {/* Header */}
      <View
        className="bg-white dark:bg-gray-800 px-6 pb-4 border-b border-gray-200 dark:border-gray-600"
        style={{ paddingTop: insets.top + 16 }}
      >
        <Text className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Transactions
        </Text>

        {selectedGroupId && (
          <View className="flex-row items-center bg-primary-50 dark:bg-gray-800 border border-primary-200 rounded-lg px-3 py-1.5 self-start mb-3">
            <Icon name="users" size={12} color="#0284c7" />
            <Text className="text-xs font-semibold text-primary-700 ml-1.5 mr-2">
              {selectedGroup ? selectedGroup.name : 'Groupe filtré'}
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedGroupId(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="times" size={13} color="#0284c7" />
            </TouchableOpacity>
          </View>
        )}

        {/* Filter Tabs */}
        <View className="flex-row">
          <TouchableOpacity
            onPress={() => handleTabChange('all')}
            className={`flex-1 py-3 border-b-2 ${
              selectedTab === 'all' ? 'border-primary-600' : 'border-transparent'
            }`}
          >
            <Text
              className={`text-center font-medium ${
                selectedTab === 'all' ? 'text-primary-600' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Toutes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleTabChange('contributions')}
            className={`flex-1 py-3 border-b-2 ${
              selectedTab === 'contributions' ? 'border-primary-600' : 'border-transparent'
            }`}
          >
            <Text
              className={`text-center font-medium ${
                selectedTab === 'contributions'
                  ? 'text-primary-600'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Contributions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleTabChange('expenses')}
            className={`flex-1 py-3 border-b-2 ${
              selectedTab === 'expenses' ? 'border-primary-600' : 'border-transparent'
            }`}
          >
            <Text
              className={`text-center font-medium ${
                selectedTab === 'expenses' ? 'text-primary-600' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Dépenses
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Card */}
        <View className="px-6 mt-6">
          <View className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <Text className="text-gray-800 dark:text-gray-100 text-base font-bold mb-4">
              Ce mois-ci · opérations chargées
            </Text>
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <View className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                <Text className="text-gray-700 dark:text-gray-200">Contributions</Text>
              </View>
              <Text className="text-gray-800 dark:text-gray-100 font-bold">
                {selectedGroup
                  ? `${monthContributions.toLocaleString()} ${selectedGroup.currency}`
                  : 'Sélectionnez un groupe'}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                <Text className="text-gray-700 dark:text-gray-200">Dépenses</Text>
              </View>
              <Text className="text-gray-800 dark:text-gray-100 font-bold">
                {selectedGroup
                  ? `${monthExpenses.toLocaleString()} ${selectedGroup.currency}`
                  : 'Sélectionnez un groupe'}
              </Text>
            </View>
          </View>
        </View>

        {/* Transactions List */}
        {sortedTransactions.length > 0 ? (
          <View className="mt-6 mb-6">
            <View className="bg-white dark:bg-gray-800">
              {displayedTransactions.map(transaction => (
                <TransactionItem key={transaction._id} transaction={transaction} />
              ))}
            </View>
            {hasMore && (
              <TouchableOpacity
                disabled={pageLoading}
                onPress={() => loadTransactions(page + 1)}
                className="mx-6 mt-4 py-3.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 items-center justify-center flex-row shadow-sm active:bg-gray-50"
              >
                <Icon name="chevron-down" size={14} color="#0284c7" />
                <Text className="text-primary-600 font-semibold ml-2 text-sm">
                  Afficher plus de transactions ({Math.max(0, total - pageTransactions.length)}{' '}
                  restantes)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View className="px-6 mt-6">
            <View className="bg-white dark:bg-gray-800 rounded-xl p-8 items-center">
              <Icon name="exchange" size={48} color="#0284c7" />
              <Text className="text-gray-800 dark:text-gray-100 text-lg font-bold mb-2">
                Aucune transaction
              </Text>
              <Text className="text-gray-600 dark:text-gray-300 text-sm text-center mb-6">
                {selectedTab === 'all'
                  ? 'Vos transactions apparaîtront ici'
                  : selectedTab === 'contributions'
                    ? 'Aucune contribution pour le moment'
                    : 'Aucune dépense pour le moment'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
