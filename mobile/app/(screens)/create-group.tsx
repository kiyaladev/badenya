import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useGroupStore } from '@/store/groupStore';
import { Button, Input } from '@/components/ui';

type GroupType = 'tontine' | 'saving' | 'investment' | 'loan';
type Frequency = 'weekly' | 'monthly' | 'custom';

export default function CreateGroupScreen() {
  const router = useRouter();
  const { createGroup, isLoading } = useGroupStore();

  const [formData, setFormData] = useState({
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
    if (!validateForm()) {
      return;
    }

    try {
      await createGroup({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        contributionAmount: Number(formData.contributionAmount),
        frequency: formData.frequency,
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

  const groupTypes = [
    { value: 'tontine', label: 'Tontine', icon: '🔄' },
    { value: 'saving', label: 'Épargne', icon: '💰' },
    { value: 'investment', label: 'Investissement', icon: '📈' },
    { value: 'loan', label: 'Prêt', icon: '🤝' },
  ];

  const frequencies = [
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'monthly', label: 'Mensuelle' },
    { value: 'custom', label: 'Personnalisée' },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 mb-2">Créer un nouveau groupe</Text>
          <Text className="text-gray-600">
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
          <Text className="text-gray-700 text-sm font-medium mb-2">Description (optionnel)</Text>
          <TextInput
            className="bg-white rounded-lg px-4 py-3 text-gray-800 border border-gray-300"
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
          <Text className="text-gray-700 text-sm font-medium mb-3">Type de groupe *</Text>
          <View className="flex-row flex-wrap">
            {groupTypes.map(type => (
              <TouchableOpacity
                key={type.value}
                className={`flex-1 min-w-[45%] mr-2 mb-2 p-4 rounded-lg border-2 ${
                  formData.type === type.value
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 bg-white'
                }`}
                onPress={() => setFormData({ ...formData, type: type.value as GroupType })}
              >
                <Text className="text-2xl mb-2">{type.icon}</Text>
                <Text
                  className={`font-medium ${
                    formData.type === type.value ? 'text-primary-600' : 'text-gray-800'
                  }`}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
            rightIcon={<Text className="text-gray-500 text-sm">XOF</Text>}
          />
        </View>

        {/* Frequency */}
        <View className="mb-6">
          <Text className="text-gray-700 text-sm font-medium mb-3">Fréquence de cotisation *</Text>
          <View className="bg-white rounded-lg overflow-hidden border border-gray-300">
            {frequencies.map((freq, index) => (
              <TouchableOpacity
                key={freq.value}
                className={`flex-row items-center justify-between p-4 ${
                  index !== frequencies.length - 1 ? 'border-b border-gray-200' : ''
                }`}
                onPress={() => setFormData({ ...formData, frequency: freq.value as Frequency })}
              >
                <Text className="text-gray-800">{freq.label}</Text>
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
          <Text className="text-center text-gray-600 font-medium">Annuler</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
