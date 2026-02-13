import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { useTransactionStore } from '@/store/transactionStore';
import { useGroupStore } from '@/store/groupStore';
import { Loading } from '@/components/ui';
import TransactionItem from '@/components/TransactionItem';

export default function TransactionsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'contributions' | 'expenses'>('all');

  const { transactions, loading, fetchGroupTransactions } = useTransactionStore();
  const { groups } = useGroupStore();

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    // Load transactions for all user's groups
    const promises = groups.map(group => fetchGroupTransactions(group._id));
    await Promise.all(promises);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  // Filter transactions based on selected tab
  const filteredTransactions = transactions.filter(t => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'contributions') return t.type === 'contribution';
    if (selectedTab === 'expenses') return t.type === 'expense';
    return true;
  });

  // Calculate stats for current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthTransactions = transactions.filter(t => {
    const date = new Date(t.createdAt);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const monthContributions = monthTransactions
    .filter(t => t.type === 'contribution' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpenses = monthTransactions
    .filter(t => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  if (loading && transactions.length === 0) {
    return <Loading />;
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800 mb-4">Transactions</Text>

        {/* Filter Tabs */}
        <View className="flex-row">
          <TouchableOpacity
            onPress={() => setSelectedTab('all')}
            className={`flex-1 py-3 border-b-2 ${
              selectedTab === 'all' ? 'border-primary-600' : 'border-transparent'
            }`}
          >
            <Text
              className={`text-center font-medium ${
                selectedTab === 'all' ? 'text-primary-600' : 'text-gray-600'
              }`}
            >
              Toutes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedTab('contributions')}
            className={`flex-1 py-3 border-b-2 ${
              selectedTab === 'contributions' ? 'border-primary-600' : 'border-transparent'
            }`}
          >
            <Text
              className={`text-center font-medium ${
                selectedTab === 'contributions' ? 'text-primary-600' : 'text-gray-600'
              }`}
            >
              Contributions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedTab('expenses')}
            className={`flex-1 py-3 border-b-2 ${
              selectedTab === 'expenses' ? 'border-primary-600' : 'border-transparent'
            }`}
          >
            <Text
              className={`text-center font-medium ${
                selectedTab === 'expenses' ? 'text-primary-600' : 'text-gray-600'
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
          <View className="bg-white rounded-xl p-6">
            <Text className="text-gray-800 text-base font-bold mb-4">Ce mois-ci</Text>
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <View className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                <Text className="text-gray-700">Contributions</Text>
              </View>
              <Text className="text-gray-800 font-bold">
                {monthContributions.toLocaleString()} XOF
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                <Text className="text-gray-700">Dépenses</Text>
              </View>
              <Text className="text-gray-800 font-bold">{monthExpenses.toLocaleString()} XOF</Text>
            </View>
          </View>
        </View>

        {/* Transactions List */}
        {filteredTransactions.length > 0 ? (
          <View className="mt-6 mb-6">
            <View className="bg-white">
              {filteredTransactions.map(transaction => (
                <TransactionItem key={transaction._id} transaction={transaction} />
              ))}
            </View>
          </View>
        ) : (
          <View className="px-6 mt-6">
            <View className="bg-white rounded-xl p-8 items-center">
              <Text className="text-6xl mb-4">💸</Text>
              <Text className="text-gray-800 text-lg font-bold mb-2">Aucune transaction</Text>
              <Text className="text-gray-600 text-sm text-center mb-6">
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
