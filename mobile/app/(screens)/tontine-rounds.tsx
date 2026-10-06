import { Alert } from '@/services/dialog.service';
import { getErrorMessage } from '@/utils/errorHandler';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useGroupStore } from '@/store/groupStore';
import { useAuthStore } from '@/store/authStore';
import tontineService, { TontineSchedule } from '@/services/tontine.service';
import { Button, Icon, Loading, Badge } from '@/components/ui';

export default function TontineRoundsScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { groups, fetchGroupById } = useGroupStore();
  const { user } = useAuthStore();

  const group = groups.find(g => g._id === groupId);

  const [customIntervalDays, setCustomIntervalDays] = useState('');
  const [schedule, setSchedule] = useState<TontineSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);

  const currentUserId = user?._id || user?.id;
  const userMember = currentUserId
    ? group?.members.find(m => m.userId === currentUserId)
    : undefined;
  const isAdmin = userMember?.role === 'admin' || userMember?.role === 'treasurer';

  const loadSchedule = useCallback(async () => {
    if (!groupId) return;
    try {
      const data = await tontineService.getTontineSchedule(groupId, group);
      setSchedule(data);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger le tour de rôle');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId, group]);

  useEffect(() => {
    if (groupId && !group) {
      fetchGroupById(groupId);
    }
  }, [groupId, group, fetchGroupById]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSchedule();
  };

  const handleAdvanceRound = () => {
    Alert.alert(
      'Confirmer le versement',
      `Confirmez-vous que le tour n°${schedule?.currentRoundNumber} a été versé au bénéficiaire ? Le tour suivant deviendra actif.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            if (!groupId) return;
            setUpdating(true);
            try {
              const updated = await tontineService.advanceToNextRound(groupId);
              setSchedule(updated);
              Alert.alert('Succès', 'Le tour a été mis à jour avec succès.');
            } catch (error) {
              Alert.alert('Versement refusé', getErrorMessage(error, 'Le tour reste inchangé.'));
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleMoveRound = async (index: number, direction: 'up' | 'down') => {
    if (!schedule) return;
    const newRounds = [...schedule.rounds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newRounds.length) return;

    // Don't swap completed rounds
    if (newRounds[index].status === 'completed' || newRounds[targetIndex].status === 'completed') {
      Alert.alert('Information', 'Les tours déjà terminés ne peuvent pas être déplacés.');
      return;
    }

    const temp = newRounds[index];
    newRounds[index] = newRounds[targetIndex];
    newRounds[targetIndex] = temp;

    setUpdating(true);
    try {
      const updated = await tontineService.reorderRounds(schedule.groupId, newRounds);
      setSchedule(updated);
    } catch {
      Alert.alert('Erreur', "Impossible de réorganiser l'ordre des tours.");
    } finally {
      setUpdating(false);
    }
  };

  const handleShareSchedule = async () => {
    if (!schedule || !group) return;

    const roundsText = schedule.rounds
      .map(
        r =>
          `• Tour ${r.roundNumber}: ${r.beneficiaryName} (${new Date(r.payoutDate).toLocaleDateString('fr-FR')}) - ${
            r.status === 'completed' ? 'Effectué' : r.status === 'current' ? 'EN COURS' : 'À venir'
          }`
      )
      .join('\n');

    const message =
      `*Badenya — Ordre des tours de la Tontine : ${group.name}*\n\n` +
      `Cycle : ${schedule.cycleNumber}\n` +
      `Montant de la cagnotte par tour : ${schedule.potAmount.toLocaleString()} ${group.currency}\n` +
      `Fréquence : ${group.frequency === 'weekly' ? 'Hebdomadaire' : 'Mensuelle'}\n\n` +
      `Calendrier des tours :\n${roundsText}\n\n` +
      `Géré en toute transparence sur l'application Badenya.`;

    try {
      await Share.share({
        message,
        title: `Tontine ${group.name} - Tour de rôle`,
      });
    } catch {
      // User cancelled share
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!group || !schedule) {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-gray-50 dark:bg-gray-900">
        <Icon name="refresh" size={48} color="#9ca3af" />
        <Text className="text-gray-800 dark:text-gray-100 text-lg font-bold mt-4 mb-2">
          Aucun calendrier trouvé
        </Text>
        <Text className="text-gray-600 dark:text-gray-300 text-center mb-6">
          Vous pouvez initialiser le calendrier de rotation pour ce groupe.
        </Text>
        {group?.frequency === 'custom' && (
          <TextInput
            accessibilityLabel="Intervalle en jours"
            placeholder="Intervalle personnalisé en jours"
            keyboardType="number-pad"
            value={customIntervalDays}
            onChangeText={setCustomIntervalDays}
            className="bg-white dark:bg-gray-800 dark:text-white border border-gray-300 rounded-lg p-3 mb-4"
          />
        )}
        <Button
          disabled={!isAdmin || updating}
          onPress={async () => {
            if (!group || !isAdmin) return;
            setUpdating(true);
            try {
              await tontineService.saveTontineSchedule(
                tontineService.generateDefaultSchedule(
                  group,
                  group.frequency === 'custom' ? Number(customIntervalDays) : undefined
                )
              );
              await loadSchedule();
            } catch (error) {
              Alert.alert('Calendrier non créé', getErrorMessage(error));
            } finally {
              setUpdating(false);
            }
          }}
        >
          Initialiser le tour de rôle
        </Button>
      </View>
    );
  }

  const currentRound = schedule.rounds.find(r => r.status === 'current');

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header Banner */}
      <View className="bg-primary-600 px-6 py-6">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-white text-2xl font-bold">Tour de rôle</Text>
          <TouchableOpacity
            onPress={handleShareSchedule}
            className="bg-primary-700 px-3 py-1.5 rounded-full flex-row items-center"
          >
            <Icon name="share-alt" size={14} color="#ffffff" />
            <Text className="text-white font-medium text-xs ml-1.5">Partager</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-white text-sm opacity-90 mb-4">{group.name}</Text>

        <View className="flex-row justify-between bg-primary-700/50 rounded-xl p-4">
          <View>
            <Text className="text-primary-100 text-xs">Cagnotte par tour</Text>
            <Text className="text-white text-lg font-bold">
              {schedule.potAmount.toLocaleString()} {group.currency}
            </Text>
          </View>
          <View>
            <Text className="text-primary-100 text-xs">Progression</Text>
            <Text className="text-white text-lg font-bold">
              {currentRound
                ? `Tour ${schedule.currentRoundNumber}/${schedule.totalRounds}`
                : 'Cycle terminé'}
            </Text>
          </View>
          <View>
            <Text className="text-primary-100 text-xs">Cycle</Text>
            <Text className="text-white text-lg font-bold">N° {schedule.cycleNumber}</Text>
          </View>
        </View>
      </View>

      {/* Current Round Card */}
      {currentRound && (
        <View className="mx-6 mt-[-16px] bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-primary-100">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2" />
              <Text className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Bénéficiaire actuel (Tour {currentRound.roundNumber})
              </Text>
            </View>
            <Badge variant="success" size="sm">
              En cours
            </Badge>
          </View>

          <View className="flex-row items-center mb-4">
            <View className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center mr-3">
              <Icon name="user" size={22} color="#0284c7" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 dark:text-gray-50 font-bold text-lg">
                {currentRound.beneficiaryName}
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-xs">
                Versement prévu le : {new Date(currentRound.payoutDate).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-emerald-600 font-bold text-base">
                +{currentRound.potAmount.toLocaleString()} {group.currency}
              </Text>
            </View>
          </View>

          {isAdmin && (
            <Button onPress={handleAdvanceRound} disabled={updating} variant="primary" size="sm">
              {updating ? 'Mise à jour...' : 'Valider le versement et passer au tour suivant'}
            </Button>
          )}
        </View>
      )}

      {!currentRound && schedule.rounds.every(round => round.status === 'completed') && (
        <View className="mx-6 mt-4 p-5 bg-white dark:bg-gray-800 rounded-xl">
          <Text className="text-gray-800 dark:text-white font-bold mb-3">
            Cycle terminé : tous les versements sont enregistrés.
          </Text>
          {isAdmin && (
            <Button
              disabled={updating}
              onPress={() =>
                Alert.alert(
                  'Nouveau cycle',
                  'Démarrer un nouveau calendrier avec les membres actifs et conserver les versements du cycle précédent ?',
                  [
                    { text: 'Annuler', style: 'cancel' },
                    {
                      text: 'Démarrer',
                      onPress: async () => {
                        setUpdating(true);
                        try {
                          setSchedule(await tontineService.startNextCycle(groupId));
                        } catch (error) {
                          Alert.alert('Cycle non créé', getErrorMessage(error));
                        } finally {
                          setUpdating(false);
                        }
                      },
                    },
                  ]
                )
              }
            >
              Démarrer le cycle suivant
            </Button>
          )}
        </View>
      )}
      {/* Full Rotation List */}
      <View className="px-6 mt-6 mb-8">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-gray-800 dark:text-gray-100 text-lg font-bold">
            Ordre complet des tours
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {schedule.rounds.filter(r => r.status === 'completed').length}/{schedule.rounds.length}{' '}
            terminés
          </Text>
        </View>

        <View className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm divide-y divide-gray-100">
          {schedule.rounds.map((round, index) => {
            const isCompleted = round.status === 'completed';
            const isCurrent = round.status === 'current';

            return (
              <View
                key={round.roundNumber}
                className={`p-4 flex-row items-center justify-between ${
                  isCurrent ? 'bg-primary-50/50' : ''
                }`}
              >
                <View className="flex-row items-center flex-1">
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                      isCompleted
                        ? 'bg-emerald-100'
                        : isCurrent
                          ? 'bg-primary-600'
                          : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    {isCompleted ? (
                      <Icon name="check" size={12} color="#059669" />
                    ) : (
                      <Text
                        className={`text-xs font-bold ${
                          isCurrent ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {round.roundNumber}
                      </Text>
                    )}
                  </View>

                  <View className="flex-1 mr-2">
                    <Text
                      className={`font-semibold text-sm ${
                        isCurrent
                          ? 'text-primary-900 font-bold'
                          : 'text-gray-800 dark:text-gray-100'
                      }`}
                    >
                      {round.beneficiaryName}
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(round.payoutDate).toLocaleDateString('fr-FR')} •{' '}
                      {round.potAmount.toLocaleString()} {group.currency}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <View className="mr-2">
                    {isCompleted && (
                      <Badge variant="success" size="sm">
                        Effectué
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge variant="primary" size="sm">
                        En cours
                      </Badge>
                    )}
                    {!isCompleted && !isCurrent && (
                      <Badge variant="default" size="sm">
                        À venir
                      </Badge>
                    )}
                  </View>

                  {isAdmin && !isCompleted && (
                    <View className="flex-col ml-1">
                      {index > 0 && schedule.rounds[index - 1].status !== 'completed' && (
                        <TouchableOpacity
                          onPress={() => handleMoveRound(index, 'up')}
                          className="p-1"
                          hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                        >
                          <Icon name="chevron-up" size={12} color="#6b7280" />
                        </TouchableOpacity>
                      )}
                      {index < schedule.rounds.length - 1 && (
                        <TouchableOpacity
                          onPress={() => handleMoveRound(index, 'down')}
                          className="p-1"
                          hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                        >
                          <Icon name="chevron-down" size={12} color="#6b7280" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}
