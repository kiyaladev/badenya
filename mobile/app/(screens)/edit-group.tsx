import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGroupStore } from '@/store/groupStore';
import { useAuthStore } from '@/store/authStore';
import { Button, Input } from '@/components/ui';

type GroupType = 'tontine' | 'savings' | 'investment' | 'lending';
type ContributionFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';

export default function EditGroupScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { groups, updateGroup, isLoading } = useGroupStore();
  const { user } = useAuthStore();

  const group = groups.find(g => g._id === id);

  const [formData, setFormData] = useState({
    name: group?.name || '',
    description: group?.description || '',
    type: (group?.type || 'tontine') as GroupType,
    contributionAmount: group?.contributionAmount?.toString() || '',
    contributionFrequency: (group?.contributionFrequency || 'monthly') as ContributionFrequency,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!group) {
      Alert.alert('Erreur', 'Groupe introuvable', [{ text: 'OK', onPress: () => router.back() }]);
      return;
    }

    // Check if user is admin
    const userMember = group.members.find(m => m.userId === user?.id);
    if (userMember?.role !== 'admin') {
      Alert.alert('Accès refusé', 'Seuls les administrateurs peuvent modifier le groupe', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }, [group, user]);

  const groupTypes = [
    { value: 'tontine', label: '💰 Tontine', description: 'Système rotatif de crédit' },
    { value: 'savings', label: '🏦 Épargne', description: "Groupe d'épargne collectif" },
    { value: 'investment', label: '📈 Investissement', description: 'Investissement en groupe' },
    { value: 'lending', label: '🤝 Prêt', description: 'Prêts entre membres' },
  ];

  const frequencies = [
    { value: 'daily', label: 'Quotidien' },
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'monthly', label: 'Mensuel' },
    { value: 'custom', label: 'Personnalisé' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du groupe est requis';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Le nom doit contenir au moins 3 caractères';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }

    if (!formData.contributionAmount || parseFloat(formData.contributionAmount) <= 0) {
      newErrors.contributionAmount = 'Le montant doit être supérieur à 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    try {
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        contributionAmount: parseFloat(formData.contributionAmount),
        contributionFrequency: formData.contributionFrequency,
      };

      await updateGroup(id!, updateData);

      Alert.alert('Succès', 'Le groupe a été modifié avec succès', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const error = err as { message?: string };
      Alert.alert('Erreur', error.message || 'Impossible de modifier le groupe');
    }
  };

  if (!group) {
    return null;
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 mb-2">Modifier le groupe</Text>
          <Text className="text-gray-600">Mettez à jour les informations du groupe</Text>
        </View>

        {/* Warning */}
        <View className="bg-yellow-50 p-4 rounded-lg mb-6">
          <Text className="text-yellow-800 text-sm">
            ⚠️ <Text className="font-semibold">Attention:</Text> Les modifications affecteront tous
            les membres du groupe.
          </Text>
        </View>

        {/* Form */}
        <View className="mb-4">
          <Input
            label="Nom du groupe *"
            value={formData.name}
            onChangeText={text => setFormData({ ...formData, name: text })}
            placeholder="Ex: Groupe d'épargne familial"
            error={errors.name}
          />
        </View>

        <View className="mb-4">
          <Input
            label="Description *"
            value={formData.description}
            onChangeText={text => setFormData({ ...formData, description: text })}
            placeholder="Décrivez l'objectif du groupe"
            error={errors.description}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Group Type */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Type de groupe *</Text>
          <View className="space-y-2">
            {groupTypes.map(type => (
              <TouchableOpacity
                key={type.value}
                onPress={() => setFormData({ ...formData, type: type.value as GroupType })}
                className={`p-4 rounded-lg border-2 ${
                  formData.type === type.value
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-gray-800 font-medium mb-1">{type.label}</Text>
                    <Text className="text-gray-600 text-sm">{type.description}</Text>
                  </View>
                  {formData.type === type.value && (
                    <Text className="text-primary-600 text-xl">✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contribution Settings */}
        <View className="mb-4">
          <Input
            label="Montant de contribution *"
            value={formData.contributionAmount}
            onChangeText={text => setFormData({ ...formData, contributionAmount: text })}
            placeholder="Ex: 10000"
            error={errors.contributionAmount}
            keyboardType="numeric"
            rightIcon={<Text className="text-gray-500">XOF</Text>}
          />
        </View>

        {/* Frequency */}
        <View className="mb-6">
          <Text className="text-gray-700 font-medium mb-2">Fréquence de contribution *</Text>
          <View className="flex-row flex-wrap gap-2">
            {frequencies.map(freq => (
              <TouchableOpacity
                key={freq.value}
                onPress={() =>
                  setFormData({
                    ...formData,
                    contributionFrequency: freq.value as ContributionFrequency,
                  })
                }
                className={`px-4 py-2 rounded-lg border ${
                  formData.contributionFrequency === freq.value
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 bg-white'
                }`}
              >
                <Text
                  className={
                    formData.contributionFrequency === freq.value
                      ? 'text-primary-600 font-medium'
                      : 'text-gray-700'
                  }
                >
                  {freq.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View className="mb-4">
          <Button
            title={isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            onPress={handleSubmit}
            disabled={isLoading}
          />
        </View>

        <View className="mb-6">
          <Button title="Annuler" onPress={() => router.back()} variant="secondary" />
        </View>
      </View>
    </ScrollView>
  );
}
