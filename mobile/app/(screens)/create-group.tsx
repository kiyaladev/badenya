import { Alert } from '@/services/dialog.service';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Keyboard } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useGroupStore } from '@/store/groupStore';
import { Button, Icon, Input } from '@/components/ui';
import {
  SUPPORTED_CURRENCIES,
  type ContributionFrequency,
  type GroupType,
} from '@/services/group.service';
import type { IconName } from '@/components/ui/Icon';

type Frequency = ContributionFrequency;

export default function CreateGroupScreen() {
  const router = useRouter();
  const { createGroup, isLoading } = useGroupStore();

  const [formData, setFormData] = useState({
    currency: 'XOF',
    isPrivate: true,
    name: '',
    description: '',
    type: 'tontine' as GroupType,
    contributionAmount: '',
    frequency: 'monthly' as Frequency,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du groupe est requis';
    }

    if (!formData.contributionAmount) {
      newErrors.contributionAmount = 'Le montant de cotisation est requis';
    } else if (
      isNaN(Number(formData.contributionAmount)) ||
      Number(formData.contributionAmount) <= 0
    ) {
      newErrors.contributionAmount = 'Le montant doit être un nombre positif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!validateForm()) {
      return;
    }

    try {
      await createGroup({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        currency: formData.currency,
        settings: { isPrivate: formData.isPrivate, requireApprovalToJoin: true },
        contributionSettings: {
          amount: Number(formData.contributionAmount),
          frequency: formData.frequency,
          autoReminder: true,
        },
      });

      Alert.alert('Succès', 'Groupe créé avec succès!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: unknown) {
      const error = err as { message?: string };
      Alert.alert('Erreur', error.message || 'Impossible de créer le groupe');
    }
  };

  const groupTypes: Array<{ value: GroupType; label: string; icon: IconName }> = [
    { value: 'tontine', label: 'Tontine', icon: 'refresh' },
    { value: 'association', label: 'Association', icon: 'bank' },
    { value: 'family', label: 'Famille', icon: 'home' },
    { value: 'friends', label: 'Amis', icon: 'users' },
    { value: 'project', label: 'Projet', icon: 'flag' },
  ];

  const frequencies = [
    { value: 'daily', label: 'Quotidienne' },
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'monthly', label: 'Mensuelle' },
    { value: 'custom', label: 'Personnalisée' },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="px-6 py-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Créer un nouveau groupe
          </Text>
          <Text className="text-gray-600 dark:text-gray-300">
            Remplissez les informations pour créer votre groupe d'épargne
          </Text>
        </View>

        {/* Group Name */}
        <View className="mb-4">
          <Input
            label="Nom du groupe *"
            value={formData.name}
            onChangeText={text => setFormData({ ...formData, name: text })}
            placeholder="Ex: Groupe d'épargne familiale"
            error={errors.name}
          />
        </View>

        {/* Description */}
        <View className="mb-4">
          <Text className="text-gray-700 dark:text-gray-200 text-sm font-medium mb-2">
            Description (optionnel)
          </Text>
          <TextInput
            className="bg-white dark:bg-gray-800 rounded-lg px-4 py-3 text-gray-800 dark:text-gray-100 border border-gray-300"
            value={formData.description}
            onChangeText={text => setFormData({ ...formData, description: text })}
            placeholder="Décrivez l'objectif du groupe..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Group Type */}
        <View className="mb-4">
          <Text className="text-gray-700 dark:text-gray-200 text-sm font-medium mb-3">
            Type de groupe *
          </Text>
          <View className="flex-row flex-wrap">
            {groupTypes.map(type => (
              <TouchableOpacity
                key={type.value}
                className={`flex-1 min-w-[45%] mr-2 mb-2 p-4 rounded-lg border-2 ${
                  formData.type === type.value
                    ? 'border-primary-600 bg-primary-50 dark:bg-gray-800'
                    : 'border-gray-300 bg-white dark:bg-gray-800'
                }`}
                onPress={() => setFormData({ ...formData, type: type.value as GroupType })}
              >
                <Icon name={type.icon} size={22} color="#0284c7" />
                <Text
                  className={`font-medium ${
                    formData.type === type.value
                      ? 'text-primary-600'
                      : 'text-gray-800 dark:text-gray-100'
                  }`}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-gray-700 dark:text-gray-200 font-medium mb-3">
            Devise du groupe
          </Text>
          <View className="flex-row flex-wrap">
            {SUPPORTED_CURRENCIES.map(currency => (
              <TouchableOpacity
                key={currency}
                accessibilityRole="radio"
                accessibilityState={{ selected: formData.currency === currency }}
                className={`p-3 mr-2 mb-2 rounded-lg ${formData.currency === currency ? 'bg-primary-600' : 'bg-white dark:bg-gray-800'}`}
                onPress={() => setFormData({ ...formData, currency })}
              >
                <Text
                  className={
                    formData.currency === currency
                      ? 'text-white font-bold'
                      : 'text-gray-700 dark:text-gray-200'
                  }
                >
                  {currency}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            accessibilityRole="checkbox"
            accessibilityState={{ checked: formData.isPrivate }}
            className="p-3 bg-white dark:bg-gray-800 rounded-lg"
            onPress={() => setFormData({ ...formData, isPrivate: !formData.isPrivate })}
          >
            <Text className="text-gray-700 dark:text-gray-200">
              {formData.isPrivate
                ? '✓ Groupe privé, invitation requise'
                : 'Groupe public, visible dans Découvrir'}
            </Text>
          </TouchableOpacity>
        </View>
        {/* Contribution Amount */}
        <View className="mb-4">
          <Input
            label="Montant de cotisation *"
            value={formData.contributionAmount}
            onChangeText={text => setFormData({ ...formData, contributionAmount: text })}
            placeholder="Ex: 10000"
            keyboardType="numeric"
            error={errors.contributionAmount}
            rightIcon={
              <Text className="text-gray-500 dark:text-gray-400 text-sm">{formData.currency}</Text>
            }
          />
        </View>

        {/* Frequency */}
        <View className="mb-6">
          <Text className="text-gray-700 dark:text-gray-200 text-sm font-medium mb-3">
            Fréquence de cotisation *
          </Text>
          <View className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-300">
            {frequencies.map((freq, index) => (
              <TouchableOpacity
                key={freq.value}
                className={`flex-row items-center justify-between p-4 ${
                  index !== frequencies.length - 1
                    ? 'border-b border-gray-200 dark:border-gray-600'
                    : ''
                }`}
                onPress={() => setFormData({ ...formData, frequency: freq.value as Frequency })}
              >
                <Text className="text-gray-800 dark:text-gray-100">{freq.label}</Text>
                <View
                  className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                    formData.frequency === freq.value ? 'border-primary-600' : 'border-gray-300'
                  }`}
                >
                  {formData.frequency === freq.value && (
                    <View className="w-3 h-3 rounded-full bg-primary-600" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit Button */}
        <Button
          title="Créer le groupe"
          onPress={handleSubmit}
          loading={isLoading}
          className="mb-6"
        />

        {/* Cancel Button */}
        <TouchableOpacity className="py-3" onPress={() => router.back()} disabled={isLoading}>
          <Text className="text-center text-gray-600 dark:text-gray-300 font-medium">Annuler</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
