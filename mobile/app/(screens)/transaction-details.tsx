import { useAuthStore } from '@/store/authStore';
import { Alert } from '@/services/dialog.service';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Linking,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTransactionStore } from '@/store/transactionStore';
import { useGroupStore } from '@/store/groupStore';
import { Icon, Loading } from '@/components/ui';
import type { IconName } from '@/components/ui/Icon';

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
  const { groups, fetchGroupById } = useGroupStore();
  const user = useAuthStore(state => state.user);
  useEffect(() => {
    if (currentTransaction?.groupId) fetchGroupById(currentTransaction.groupId);
  }, [currentTransaction?.groupId, fetchGroupById]);

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
      <View className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center px-6">
        <Icon name="times-circle" size={48} color="#dc2626" />
        <Text className="text-gray-800 dark:text-gray-100 text-xl font-bold mb-2">
          Transaction introuvable
        </Text>
        <Text className="text-gray-600 dark:text-gray-300 text-center mb-6">
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
  const getStatusStyle = () => {
    switch (transaction.status) {
      case 'completed':
        return { bg: 'bg-green-50 dark:bg-green-950', text: 'text-green-600' };
      case 'pending':
        return { bg: 'bg-yellow-50 dark:bg-yellow-950', text: 'text-yellow-600' };
      case 'failed':
        return { bg: 'bg-red-50 dark:bg-red-950', text: 'text-red-600' };
      case 'cancelled':
        return { bg: 'bg-gray-50 dark:bg-gray-900', text: 'text-gray-600 dark:text-gray-300' };
      default:
        return { bg: 'bg-gray-50 dark:bg-gray-900', text: 'text-gray-600 dark:text-gray-300' };
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

  const member = group?.members.find(
    member => member.userId === user?._id && (!member.status || member.status === 'active')
  );
  const canManage = member?.role === 'admin' || member?.role === 'treasurer';
  const canVerify = transaction.status === 'pending' && canManage;
  const canCancel =
    transaction.status === 'pending' && (canManage || transaction.initiatedBy._id === user?._id);

  const openAttachment = async (url?: string) => {
    if (!url) return;
    try {
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
      }
    } catch {
      Alert.alert('Erreur', "Impossible d'ouvrir la pièce jointe");
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="p-4">
        {/* Header Card */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="w-10 mr-3 items-center">
                <Icon name={getTypeIcon()} size={24} color="#0284c7" />
              </View>
              <View>
                <Text className="text-gray-800 dark:text-gray-100 text-xl font-bold">
                  {getTypeLabel()}
                </Text>
                {group && (
                  <Text className="text-gray-600 dark:text-gray-300 text-sm">{group.name}</Text>
                )}
              </View>
            </View>
            {(() => {
              const statusStyle = getStatusStyle();
              return (
                <View className={`px-3 py-1 rounded-full ${statusStyle.bg}`}>
                  <Text className={`font-semibold text-sm ${statusStyle.text}`}>
                    {getStatusLabel()}
                  </Text>
                </View>
              );
            })()}
          </View>

          <View className="border-t border-gray-200 dark:border-gray-600 pt-4">
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
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4">
          <Text className="text-gray-800 dark:text-gray-100 text-lg font-bold mb-4">Détails</Text>

          {/* Description */}
          {transaction.description && (
            <View className="mb-4">
              <Text className="text-gray-600 dark:text-gray-300 text-sm mb-1">Description</Text>
              <Text className="text-gray-800 dark:text-gray-100">{transaction.description}</Text>
            </View>
          )}

          {/* Category */}
          {transaction.category && (
            <View className="mb-4">
              <Text className="text-gray-600 dark:text-gray-300 text-sm mb-1">Catégorie</Text>
              <Text className="text-gray-800 dark:text-gray-100">{transaction.category}</Text>
            </View>
          )}

          {/* Initiated By */}
          <View className="mb-4">
            <Text className="text-gray-600 dark:text-gray-300 text-sm mb-1">Initié par</Text>
            <Text className="text-gray-800 dark:text-gray-100">
              {transaction.initiatedBy.fullName}
            </Text>
          </View>

          {/* Payment Method */}
          {transaction.paymentMethod && (
            <View className="mb-4">
              <Text className="text-gray-600 dark:text-gray-300 text-sm mb-1">
                Méthode de paiement
              </Text>
              <View className="flex-row items-center">
                <Text className="text-gray-800 dark:text-gray-100 mr-2">
                  {transaction.paymentMethod.type === 'cash' && 'Espèces'}
                  {transaction.paymentMethod.type === 'mobile_money' && 'Mobile Money'}
                  {transaction.paymentMethod.type === 'bank_transfer' && 'Virement'}
                  {transaction.paymentMethod.type === 'card' && 'Carte'}
                </Text>
                {transaction.paymentMethod.provider && (
                  <Text className="text-gray-600 dark:text-gray-300">
                    ({transaction.paymentMethod.provider})
                  </Text>
                )}
              </View>
              {transaction.paymentMethod.reference && (
                <Text className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                  Réf: {transaction.paymentMethod.reference}
                </Text>
              )}
            </View>
          )}

          {/* Dates */}
          <View className="mb-4">
            <Text className="text-gray-600 dark:text-gray-300 text-sm mb-1">Date de création</Text>
            <Text className="text-gray-800 dark:text-gray-100">
              {formatDate(transaction.createdAt)}
            </Text>
          </View>

          {transaction.processedAt && (
            <View className="mb-4">
              <Text className="text-gray-600 dark:text-gray-300 text-sm mb-1">
                Date de traitement
              </Text>
              <Text className="text-gray-800 dark:text-gray-100">
                {formatDate(transaction.processedAt)}
              </Text>
            </View>
          )}

          {/* Notes */}
          {transaction.metadata?.notes && (
            <View className="mb-4">
              <Text className="text-gray-600 dark:text-gray-300 text-sm mb-1">Notes</Text>
              <Text className="text-gray-800 dark:text-gray-100">{transaction.metadata.notes}</Text>
            </View>
          )}
        </View>

        {/* Attachments */}
        {transaction.attachments && transaction.attachments.length > 0 && (
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4">
            <Text className="text-gray-800 dark:text-gray-100 text-lg font-bold mb-3">
              Pièces jointes
            </Text>
            {transaction.attachments.map((attachment, index) => (
              <TouchableOpacity
                key={index}
                className="flex-row items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg mb-2"
                onPress={() => openAttachment(attachment.url)}
                disabled={!attachment.url}
                accessibilityRole="button"
                accessibilityLabel={`Ouvrir ${attachment.name}`}
              >
                {attachment.type === 'image' && attachment.url ? (
                  <Image source={{ uri: attachment.url }} className="w-12 h-12 rounded mr-3" />
                ) : (
                  <Icon
                    name={attachment.type === 'image' ? 'image' : 'file-text-o'}
                    size={20}
                    color="#6b7280"
                  />
                )}
                <View className="flex-1">
                  <Text className="text-gray-800 dark:text-gray-100 font-medium">
                    {attachment.name}
                  </Text>
                  <Text className="text-gray-600 dark:text-gray-300 text-sm">
                    {attachment.filename}
                  </Text>
                </View>
                {attachment.url && <Icon name="external-link" size={14} color="#0284c7" />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Actions */}
        {(canVerify || canCancel) && (
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4">
            <Text className="text-gray-800 dark:text-gray-100 text-lg font-bold mb-3">Actions</Text>

            {canVerify && (
              <TouchableOpacity
                onPress={handleVerify}
                className="bg-green-600 py-3 rounded-lg mb-3"
              >
                <View className="flex-row items-center justify-center">
                  <Icon name="check" size={16} color="#ffffff" />
                  <Text className="text-white font-semibold ml-2">Vérifier la transaction</Text>
                </View>
              </TouchableOpacity>
            )}

            {canCancel && (
              <TouchableOpacity onPress={handleCancel} className="bg-red-600 py-3 rounded-lg">
                <View className="flex-row items-center justify-center">
                  <Icon name="times" size={16} color="#ffffff" />
                  <Text className="text-white font-semibold ml-2">Annuler la transaction</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
