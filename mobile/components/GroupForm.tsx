import { Alert } from '@/services/dialog.service';
import { View, Text, ScrollView, TouchableOpacity, Switch, Keyboard } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useGroupStore } from '@/store/groupStore';
import { useAuthStore } from '@/store/authStore';
import { Button, Icon, Input, Loading } from '@/components/ui';
import {
  SUPPORTED_CURRENCIES,
  type ContributionFrequency,
  type Group,
  type GroupType,
} from '@/services/group.service';
import {
  FREQUENCIES,
  FREQUENCY_LABELS,
  GROUP_TYPES,
  GROUP_TYPE_ICONS,
  GROUP_TYPE_LABELS,
} from '@/constants/labels';

type GroupFormProps = { mode: 'create' } | { mode: 'edit'; groupId: string };

interface FormState {
  name: string;
  description: string;
  type: GroupType;
  contributionAmount: string;
  frequency: ContributionFrequency;
  currency: string;
  isPrivate: boolean;
  customIntervalDays: string;
  firstDueAt: string;
  dueDay: string;
  autoReminder: boolean;
}

const fromGroup = (group?: Group): FormState => ({
  name: group?.name ?? '',
  description: group?.description ?? '',
  type: group?.type ?? 'tontine',
  contributionAmount: String(
    group?.contributionSettings?.amount ?? group?.contributionAmount ?? ''
  ),
  frequency: group?.contributionSettings?.frequency ?? group?.frequency ?? 'monthly',
  currency: group?.currency ?? 'XOF',
  isPrivate: true,
  customIntervalDays: String(group?.contributionSettings.customIntervalDays || ''),
  firstDueAt: String(group?.contributionSettings.firstDueAt || '').slice(0, 10),
  dueDay: String(group?.contributionSettings.dueDay || ''),
  autoReminder: group?.contributionSettings.autoReminder !== false,
});

export default function GroupForm(props: GroupFormProps) {
  const router = useRouter();
  const isEdit = props.mode === 'edit';
  const groupId = isEdit ? props.groupId : undefined;
  const { groups, createGroup, updateGroup, deleteGroup, fetchGroups, isLoading } = useGroupStore();
  const { user } = useAuthStore();
  const group = groupId ? groups.find(g => g._id === groupId) : undefined;

  const [form, setForm] = useState<FormState>(() => fromGroup(group));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isArchiving, setIsArchiving] = useState(false);
  const set = (patch: Partial<FormState>) => setForm(prev => ({ ...prev, ...patch }));

  useEffect(() => {
    if (isEdit && !group) fetchGroups();
  }, [isEdit, group]);

  useEffect(() => {
    if (!isEdit) return;
    if (group) {
      setForm(fromGroup(group));
      const currentUserId = user?._id || user?.id;
      const member = group.members.find(m => m.userId === currentUserId);
      if (member && member.role !== 'admin') {
        Alert.alert('Accès refusé', 'Seuls les administrateurs peuvent modifier le groupe', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } else if (!isLoading && groups.length > 0) {
      Alert.alert('Erreur', 'Groupe introuvable', [{ text: 'OK', onPress: () => router.back() }]);
    }
  }, [group, user, isLoading, groups.length]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const amount = Number(form.contributionAmount);
    if (!form.name.trim()) next.name = 'Le nom du groupe est requis';
    else if (form.name.trim().length < 3) next.name = 'Le nom doit contenir au moins 3 caractères';
    if (!form.contributionAmount) next.contributionAmount = 'Le montant de cotisation est requis';
    else if (isNaN(amount) || amount <= 0)
      next.contributionAmount = 'Le montant doit être un nombre positif';
    if (
      form.frequency === 'custom' &&
      (!Number.isInteger(Number(form.customIntervalDays)) ||
        Number(form.customIntervalDays) < 1 ||
        Number(form.customIntervalDays) > 3650)
    )
      next.customIntervalDays = 'Indiquez un intervalle de 1 à 3650 jours';
    if (
      form.firstDueAt &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(form.firstDueAt) ||
        Number.isNaN(Date.parse(form.firstDueAt)) ||
        new Date(form.firstDueAt).toISOString().slice(0, 10) !== form.firstDueAt)
    )
      next.firstDueAt = 'Date attendue : AAAA-MM-JJ';
    if (
      form.dueDay &&
      (!Number.isInteger(Number(form.dueDay)) ||
        Number(form.dueDay) < 1 ||
        Number(form.dueDay) > 31)
    )
      next.dueDay = 'Jour attendu : 1 à 31';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!validate()) return;

    const base = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      type: form.type,
    };
    try {
      if (groupId) {
        await updateGroup(groupId, {
          ...base,
          contributionSettings: {
            amount: Number(form.contributionAmount),
            frequency: form.frequency,
            customIntervalDays:
              form.frequency === 'custom' ? Number(form.customIntervalDays) : undefined,
            firstDueAt: form.firstDueAt ? `${form.firstDueAt}T00:00:00.000Z` : undefined,
            dueDay: form.dueDay ? Number(form.dueDay) : undefined,
            autoReminder: form.autoReminder,
          },
        });
      } else {
        await createGroup({
          ...base,
          currency: form.currency,
          settings: { isPrivate: form.isPrivate, requireApprovalToJoin: true },
          contributionSettings: {
            amount: Number(form.contributionAmount),
            frequency: form.frequency,
            customIntervalDays:
              form.frequency === 'custom' ? Number(form.customIntervalDays) : undefined,
            firstDueAt: form.firstDueAt ? `${form.firstDueAt}T00:00:00.000Z` : undefined,
            dueDay: form.dueDay ? Number(form.dueDay) : undefined,
            autoReminder: form.autoReminder,
          },
        });
      }
      router.back();
    } catch (err: unknown) {
      const error = err as { message?: string };
      Alert.alert(
        'Erreur',
        error.message ||
          (isEdit ? 'Impossible de modifier le groupe' : 'Impossible de créer le groupe')
      );
    }
  };

  const handleArchive = () => {
    if (!groupId) return;
    Alert.alert(
      'Archiver le groupe',
      `Le groupe « ${group?.name} » sera désactivé pour tous les membres : plus de cotisations ni d'activité. Il ne pourra pas être restauré depuis l'application.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Archiver',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsArchiving(true);
              await deleteGroup(groupId);
              router.replace('/(tabs)/groups');
            } catch (err: unknown) {
              const error = err as { message?: string };
              Alert.alert('Erreur', error.message || 'Impossible d’archiver le groupe');
            } finally {
              setIsArchiving(false);
            }
          },
        },
      ]
    );
  };

  if (isEdit && !group) {
    return isLoading ? <Loading /> : null;
  }

  const chipClass = (active: boolean) =>
    `px-4 py-2 mr-2 mb-2 rounded-lg border ${
      active
        ? 'border-primary-600 bg-primary-50 dark:bg-gray-800'
        : 'border-gray-300 bg-white dark:bg-gray-800'
    }`;
  const chipTextClass = (active: boolean) =>
    active ? 'text-primary-600 font-medium' : 'text-gray-700 dark:text-gray-200';

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900" keyboardShouldPersistTaps="handled">
      <View className="px-6 py-6">
        <View className="mb-4">
          <Input
            label="Nom du groupe *"
            value={form.name}
            onChangeText={name => set({ name })}
            placeholder="Ex : Épargne familiale"
            error={errors.name}
          />
        </View>

        <View className="mb-4">
          <Input
            label="Description (facultatif)"
            value={form.description}
            onChangeText={description => set({ description })}
            placeholder="Décrivez l'objectif du groupe"
            multiline
            numberOfLines={3}
          />
        </View>

        <Text className="text-gray-700 dark:text-gray-200 text-sm font-medium mb-2">
          Type de groupe *
        </Text>
        <View className="flex-row flex-wrap mb-4">
          {GROUP_TYPES.map(type => (
            <TouchableOpacity
              key={type}
              accessibilityRole="radio"
              accessibilityState={{ selected: form.type === type }}
              className={`flex-row items-center ${chipClass(form.type === type)}`}
              onPress={() => set({ type })}
            >
              <Icon name={GROUP_TYPE_ICONS[type]} size={14} color="#0284c7" />
              <Text className={`ml-2 ${chipTextClass(form.type === type)}`}>
                {GROUP_TYPE_LABELS[type]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!isEdit && (
          <>
            <Text className="text-gray-700 dark:text-gray-200 text-sm font-medium mb-2">
              Devise
            </Text>
            <View className="flex-row flex-wrap mb-4">
              {SUPPORTED_CURRENCIES.map(currency => (
                <TouchableOpacity
                  key={currency}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: form.currency === currency }}
                  className={chipClass(form.currency === currency)}
                  onPress={() => set({ currency })}
                >
                  <Text className={chipTextClass(form.currency === currency)}>{currency}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View className="mb-4">
          <Input
            label="Montant de cotisation *"
            value={form.contributionAmount}
            onChangeText={contributionAmount => set({ contributionAmount })}
            placeholder="Ex : 10000"
            keyboardType="numeric"
            error={errors.contributionAmount}
            rightIcon={
              <Text className="text-gray-500 dark:text-gray-400 text-sm">{form.currency}</Text>
            }
          />
        </View>

        <Text className="text-gray-700 dark:text-gray-200 text-sm font-medium mb-2">
          Fréquence de cotisation *
        </Text>
        <View className="flex-row flex-wrap mb-4">
          {FREQUENCIES.map(frequency => (
            <TouchableOpacity
              key={frequency}
              accessibilityRole="radio"
              accessibilityState={{ selected: form.frequency === frequency }}
              className={chipClass(form.frequency === frequency)}
              onPress={() => set({ frequency })}
            >
              <Text className={chipTextClass(form.frequency === frequency)}>
                {FREQUENCY_LABELS[frequency]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {form.frequency === 'custom' && (
          <Input
            label="Intervalle en jours"
            value={form.customIntervalDays}
            onChangeText={customIntervalDays => set({ customIntervalDays })}
            keyboardType="number-pad"
            error={errors.customIntervalDays}
          />
        )}
        <Input
          label="Première échéance (AAAA-MM-JJ, UTC)"
          value={form.firstDueAt}
          onChangeText={firstDueAt => set({ firstDueAt })}
          placeholder="2026-11-01"
          error={errors.firstDueAt}
        />
        {form.frequency === 'monthly' && (
          <Input
            label="Jour du mois (1 à 31)"
            value={form.dueDay}
            onChangeText={dueDay => set({ dueDay })}
            keyboardType="number-pad"
            error={errors.dueDay}
          />
        )}
        <Text className="text-gray-500 mb-4">
          Les jours absents sont reportés au dernier jour du mois. Après une interruption, un seul
          rappel regroupe les échéances manquées.
        </Text>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-gray-700 dark:text-gray-200">Rappels de cotisation</Text>
          <Switch
            accessibilityLabel="Rappels de cotisation"
            value={form.autoReminder}
            onValueChange={autoReminder => set({ autoReminder })}
          />
        </View>

        {!isEdit && (
          <View className="flex-row items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 mb-6">
            <View className="flex-1 mr-3">
              <Text className="text-gray-800 dark:text-gray-100 font-medium">Groupe privé</Text>
              <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                {form.isPrivate
                  ? 'Accessible uniquement sur invitation'
                  : 'Visible par tous dans Découvrir'}
              </Text>
            </View>
            <Switch
              value={form.isPrivate}
              onValueChange={isPrivate => set({ isPrivate })}
              accessibilityLabel="Groupe privé"
            />
          </View>
        )}

        <Button
          title={isEdit ? 'Enregistrer' : 'Créer le groupe'}
          onPress={handleSubmit}
          loading={isLoading && !isArchiving}
          disabled={isLoading}
          className="mt-2 mb-6"
        />

        {isEdit && (
          <View className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <Text className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              L'archivage désactive le groupe pour tous les membres. Il ne pourra pas être restauré
              depuis l'application.
            </Text>
            <Button
              title="Archiver le groupe"
              onPress={handleArchive}
              variant="danger"
              disabled={isLoading || isArchiving}
              loading={isArchiving}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}
