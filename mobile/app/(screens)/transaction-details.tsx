import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTransactionStore } from '@/store/transactionStore';
import { useGroupStore } from '@/store/groupStore';
import { Loading } from '@/components/ui';

export default function TransactionDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [refreshing, setRefreshing] = useState(false);

  const {
    currentTransaction,
    isLoading,
    fetchTransactionById,
    verifyTransaction,
    cancelTransaction,
  } = useTransactionStore();
  const { groups } = useGroupStore();

  useEffect(() => {
    if (id) {
      loadTransaction();
    }
  }, [id]);

  const loadTransaction = async () => {
    try {
      await fetchTransactionById(id!);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger la transaction');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransaction();
    setRefreshing(false);
  };

  const handleVerify = async () => {
    Alert.alert(
      'Vérifier la transaction',
      'Voulez-vous marquer cette transaction comme vérifiée ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vérifier',
          onPress: async () => {
            try {
              await verifyTransaction(id!);
              Alert.alert('Succès', 'Transaction vérifiée avec succès');
              loadTransaction();
            } catch (err: unknown) {
              const error = err as { message?: string };
              Alert.alert('Erreur', error.message || 'Impossible de vérifier la transaction');
            }
          },
        },
      ]
    );
  };

  const handleCancel = async () => {
    Alert.alert('Annuler la transaction', 'Voulez-vous vraiment annuler cette transaction ?', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui, annuler',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelTransaction(id!);
            Alert.alert('Succès', 'Transaction annulée', [
              {
                text: 'OK',
                onPress: () => router.back(),
              },
            ]);
          } catch (err: unknown) {
            const error = err as { message?: string };
            Alert.alert('Erreur', error.message || "Impossible d'annuler la transaction");
          }
        },
      },
    ]);
  };

  if (isLoading && !currentTransaction) {
    return <Loading />;
  }

  if (!currentTransaction) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Text className="text-6xl mb-4">❌</Text>
        <Text className="text-gray-800 text-xl font-bold mb-2">Transaction introuvable</Text>
        <Text className="text-gray-600 text-center mb-6">
          Cette transaction n'existe pas ou a été supprimée
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

  const transaction = currentTransaction;
  const group = groups.find(g => g._id === transaction.groupId);

  // Get status styling
  const getStatusColor = () => {
    switch (transaction.status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = () => {
    switch (transaction.status) {
      case 'completed':
        return 'Complétée';
      case 'pending':
        return 'En attente';
      case 'failed':
        return 'Échouée';
      case 'cancelled':
        return 'Annulée';
      default:
        return transaction.status;
    }
  };

  const getTypeIcon = () => {
    switch (transaction.type) {
      case 'contribution':
        return '💰';
      case 'expense':
        return '💸';
      case 'refund':
        return '↩️';
      case 'adjustment':
        return '⚖️';
      default:
        return '📝';
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: transaction.currency || 'XOF',
    }).format(amount);
  };

  const canVerify = transaction.status === 'pending';
  const canCancel = transaction.status === 'pending';

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="p-4">
        {/* Header Card */}
        <View className="bg-white rounded-xl p-6 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Text className="text-4xl mr-3">{getTypeIcon()}</Text>
              <View>
                <Text className="text-gray-800 text-xl font-bold">{getTypeLabel()}</Text>
                {group && <Text className="text-gray-600 text-sm">{group.name}</Text>}
              </View>
            </View>
            <View className={`px-3 py-1 rounded-full ${getStatusColor()}`}>
              <Text className="font-semibold text-sm">{getStatusLabel()}</Text>
            </View>
          </View>

          <View className="border-t border-gray-200 pt-4">
            <Text
              className={`text-3xl font-bold ${
                transaction.type === 'contribution' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {transaction.type === 'contribution' ? '+' : '-'}
              {formatAmount(transaction.amount)}
            </Text>
          </View>
        </View>

        {/* Details Card */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-gray-800 text-lg font-bold mb-4">Détails</Text>

          {/* Description */}
          {transaction.description && (
            <View className="mb-4">
              <Text className="text-gray-600 text-sm mb-1">Description</Text>
              <Text className="text-gray-800">{transaction.description}</Text>
            </View>
          )}

          {/* Category */}
          {transaction.category && (
            <View className="mb-4">
              <Text className="text-gray-600 text-sm mb-1">Catégorie</Text>
              <Text className="text-gray-800">{transaction.category}</Text>
            </View>
          )}

          {/* Initiated By */}
          <View className="mb-4">
            <Text className="text-gray-600 text-sm mb-1">Initié par</Text>
            <Text className="text-gray-800">
              {transaction.initiatedBy.firstName} {transaction.initiatedBy.lastName}
            </Text>
          </View>

          {/* Payment Method */}
          {transaction.paymentMethod && (
            <View className="mb-4">
              <Text className="text-gray-600 text-sm mb-1">Méthode de paiement</Text>
              <View className="flex-row items-center">
                <Text className="text-gray-800 mr-2">
                  {transaction.paymentMethod.type === 'cash' && '💵 Espèces'}
                  {transaction.paymentMethod.type === 'mobile_money' && '📱 Mobile Money'}
                  {transaction.paymentMethod.type === 'bank_transfer' && '🏦 Virement'}
                  {transaction.paymentMethod.type === 'card' && '💳 Carte'}
                </Text>
                {transaction.paymentMethod.provider && (
                  <Text className="text-gray-600">({transaction.paymentMethod.provider})</Text>
                )}
              </View>
              {transaction.paymentMethod.reference && (
                <Text className="text-gray-600 text-sm mt-1">
                  Réf: {transaction.paymentMethod.reference}
                </Text>
              )}
            </View>
          )}

          {/* Dates */}
          <View className="mb-4">
            <Text className="text-gray-600 text-sm mb-1">Date de création</Text>
            <Text className="text-gray-800">{formatDate(transaction.createdAt)}</Text>
          </View>

          {transaction.processedAt && (
            <View className="mb-4">
              <Text className="text-gray-600 text-sm mb-1">Date de traitement</Text>
              <Text className="text-gray-800">{formatDate(transaction.processedAt)}</Text>
            </View>
          )}

          {/* Notes */}
          {transaction.metadata?.notes && (
            <View className="mb-4">
              <Text className="text-gray-600 text-sm mb-1">Notes</Text>
              <Text className="text-gray-800">{transaction.metadata.notes}</Text>
            </View>
          )}
        </View>

        {/* Attachments */}
        {transaction.attachments && transaction.attachments.length > 0 && (
          <View className="bg-white rounded-xl p-4 mb-4">
            <Text className="text-gray-800 text-lg font-bold mb-3">Pièces jointes</Text>
            {transaction.attachments.map((attachment, index) => (
              <TouchableOpacity
                key={index}
                className="flex-row items-center p-3 bg-gray-50 rounded-lg mb-2"
              >
                <Text className="text-2xl mr-3">{attachment.type === 'image' ? '🖼️' : '📄'}</Text>
                <View className="flex-1">
                  <Text className="text-gray-800 font-medium">{attachment.name}</Text>
                  <Text className="text-gray-600 text-sm">{attachment.filename}</Text>
                </View>
                <Text className="text-primary-600">›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Actions */}
        {(canVerify || canCancel) && (
          <View className="bg-white rounded-xl p-4 mb-4">
            <Text className="text-gray-800 text-lg font-bold mb-3">Actions</Text>

            {canVerify && (
              <TouchableOpacity
                onPress={handleVerify}
                className="bg-green-600 py-3 rounded-lg mb-3"
              >
                <Text className="text-white text-center font-semibold">
                  ✓ Vérifier la transaction
                </Text>
              </TouchableOpacity>
            )}

            {canCancel && (
              <TouchableOpacity onPress={handleCancel} className="bg-red-600 py-3 rounded-lg">
                <Text className="text-white text-center font-semibold">
                  ✕ Annuler la transaction
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
