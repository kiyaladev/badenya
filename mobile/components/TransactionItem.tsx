import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Transaction } from '@/services/transaction.service';
import { Icon } from '@/components/ui';
import type { IconName } from '@/components/ui';

interface TransactionItemProps {
  transaction: Transaction;
}

function TransactionItem({ transaction }: TransactionItemProps) {
  const router = useRouter();

  const getTypeIcon = (): IconName => {
    switch (transaction.type) {
      case 'contribution':
        return 'money';
      case 'expense':
        return 'credit-card';
      case 'refund':
        return 'reply';
      case 'adjustment':
        return 'balance-scale';
      default:
        return 'file-text-o';
    }
  };

  const getTypeLabel = () => {
    switch (transaction.type) {
      case 'contribution':
        return 'Contribution';
      case 'expense':
        return 'Dépense';
      case 'refund':
        return 'Remboursement';
      case 'adjustment':
        return 'Ajustement';
      default:
        return transaction.type;
    }
  };

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      case 'cancelled':
        return 'text-gray-500 dark:text-gray-400';
      default:
        return 'text-gray-600 dark:text-gray-300';
    }
  };

  const getStatusLabel = () => {
    switch (transaction.status) {
      case 'completed':
        return 'Complété';
      case 'pending':
        return 'En attente';
      case 'failed':
        return 'Échoué';
      case 'cancelled':
        return 'Annulé';
      default:
        return transaction.status;
    }
  };

  const formatAmount = () => {
    const sign = transaction.type === 'contribution' || transaction.type === 'refund' ? '+' : '-';
    const color =
      transaction.type === 'contribution' || transaction.type === 'refund'
        ? 'text-green-600'
        : 'text-red-600';

    return (
      <Text className={`text-base font-bold ${color}`}>
        {sign}
        {transaction.amount.toLocaleString()} {transaction.currency}
      </Text>
    );
  };

  const formatDate = () => {
    const date = new Date(transaction.createdAt);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <TouchableOpacity
      className="bg-white dark:bg-gray-800 px-4 py-4 border-b border-gray-100 dark:border-gray-700"
      onPress={() => {
        router.push(`/(screens)/transaction-details?id=${transaction._id}`);
      }}
    >
      <View className="flex-row items-center">
        {/* Icon */}
        <View className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full items-center justify-center mr-3">
          <Icon name={getTypeIcon()} size={20} color="#0284c7" />
        </View>

        {/* Transaction Info */}
        <View className="flex-1">
          <Text className="text-gray-800 dark:text-gray-100 font-medium mb-1">
            {transaction.description || getTypeLabel()}
          </Text>
          <View className="flex-row items-center">
            <Text className="text-gray-600 dark:text-gray-300 text-xs mr-2">{formatDate()}</Text>
            {transaction.category && (
              <>
                <View className="w-1 h-1 bg-gray-400 rounded-full mr-2" />
                <Text className="text-gray-600 dark:text-gray-300 text-xs">
                  {transaction.category}
                </Text>
              </>
            )}
          </View>
          {transaction.status !== 'completed' && (
            <Text className={`text-xs mt-1 ${getStatusColor()}`}>{getStatusLabel()}</Text>
          )}
        </View>

        {/* Amount */}
        <View className="items-end">
          {formatAmount()}
          {transaction.paymentMethod && (
            <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              {transaction.paymentMethod.type === 'mobile_money'
                ? 'Mobile'
                : transaction.paymentMethod.type === 'bank_transfer'
                  ? 'Banque'
                  : transaction.paymentMethod.type === 'card'
                    ? 'Carte'
                    : 'Cash'}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default React.memo(TransactionItem);
