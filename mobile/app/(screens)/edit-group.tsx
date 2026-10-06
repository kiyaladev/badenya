import { Alert } from '@/services/dialog.service';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGroupStore } from '@/store/groupStore';
import { useAuthStore } from '@/store/authStore';
import { Button, Icon, Input, Loading } from '@/components/ui';
import type { ContributionFrequency, GroupType } from '@/services/group.service';
import type { IconName } from '@/components/ui/Icon';

export default function EditGroupScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { groups, updateGroup, deleteGroup, fetchGroups, isLoading } = useGroupStore();
  const { user } = useAuthStore();

  const group = groups.find(g => g._id === id);

  const [formData, setFormData] = useState({
    name: group?.name || '',
    description: group?.description || '',
    type: (group?.type || 'tontine') as GroupType,
    contributionAmount: (
      group?.contributionSettings?.amount ??
      group?.contributionAmount ??
      ''
    )?.toString(),
    contributionFrequency: (group?.contributionSettings?.frequency ||
      group?.frequency ||
      'monthly') as ContributionFrequency,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!group && id) {
      fetchGroups();
    }
  }, [group, id]);

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        type: (group.type || 'tontine') as GroupType,
        contributionAmount: (
          group.contributionSettings?.amount ??
          group.contributionAmount ??
          ''
        )?.toString(),
        contributionFrequency: (group.contributionSettings?.frequency ||
          group.frequency ||
          'monthly') as ContributionFrequency,
      });

      // Check if user is admin
      const currentUserId = user?._id || user?.id;
      const userMember = group.members.find(m => m.userId === currentUserId);
      if (userMember && userMember.role !== 'admin') {
        Alert.alert('Accès refusé', 'Seuls les administrateurs peuvent modifier le groupe', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } else if (!isLoading && groups.length > 0) {
      Alert.alert('Erreur', 'Groupe introuvable', [{ text: 'OK', onPress: () => router.back() }]);
    }
  }, [group, user, isLoading, groups.length]);

  const groupTypes: Array<{
    value: GroupType;
    label: string;
    icon: IconName;
    description: string;
  }> = [
    {
      value: 'tontine',
      label: 'Tontine',
      icon: 'refresh',
      description: 'Système rotatif de crédit',
    },
    {
      value: 'association',
      label: 'Association',
      icon: 'bank',
      description: 'Association d’épargne collective',
    },
    { value: 'family', label: 'Famille', icon: 'home', description: 'Objectif financier familial' },
    { value: 'friends', label: 'Amis', icon: 'users', description: 'Projet financier entre amis' },
    {
      value: 'project',
      label: 'Projet',
      icon: 'flag',
      description: 'Financement d’un projet commun',
    },
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
        contributionSettings: {
          amount: parseFloat(formData.contributionAmount),
          frequency: formData.contributionFrequency,
        },
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

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteGroup = () => {
    Alert.alert(
      'Archiver le groupe',
      `Êtes-vous sûr de vouloir archiver le groupe "${group?.name}" ? Cette action désactivera le groupe.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Archiver le groupe',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await deleteGroup(id!);
              Alert.alert('Succès', 'Le groupe a été archivé avec succès', [
                {
                  text: 'OK',
                  onPress: () => router.replace('/(tabs)/groups'),
                },
              ]);
            } catch (err: unknown) {
              const error = err as { message?: string };
              Alert.alert('Erreur', error.message || 'Impossible d’archiver le groupe');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading && !group) {
    return <Loading />;
  }

  if (!group) {
    return null;
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="px-6 py-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Modifier le groupe
          </Text>
          <Text className="text-gray-600 dark:text-gray-300">
            Mettez à jour les informations du groupe
          </Text>
        </View>

        {/* Warning */}
        <View className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg mb-6 flex-row">
          <Icon name="exclamation-triangle" size={16} color="#92400e" />
          <Text className="text-yellow-800 text-sm ml-2 flex-1">
            <Text className="font-semibold">Attention:</Text> Les modifications affecteront tous les
            membres du groupe.
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
          <Text className="text-gray-700 dark:text-gray-200 font-medium mb-2">
            Type de groupe *
          </Text>
          <View className="space-y-2">
            {groupTypes.map(type => (
              <TouchableOpacity
                key={type.value}
                onPress={() => setFormData({ ...formData, type: type.value as GroupType })}
                className={`p-4 rounded-lg border-2 ${
                  formData.type === type.value
                    ? 'border-primary-600 bg-primary-50 dark:bg-gray-800'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Icon name={type.icon} size={16} color="#0284c7" />
                      <Text className="text-gray-800 dark:text-gray-100 font-medium ml-2">
                        {type.label}
                      </Text>
                    </View>
                    <Text className="text-gray-600 dark:text-gray-300 text-sm">
                      {type.description}
                    </Text>
                  </View>
                  {formData.type === type.value && <Icon name="check" size={16} color="#0284c7" />}
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
            rightIcon={<Text className="text-gray-500 dark:text-gray-400">XOF</Text>}
          />
        </View>

        {/* Frequency */}
        <View className="mb-6">
          <Text className="text-gray-700 dark:text-gray-200 font-medium mb-2">
            Fréquence de contribution *
          </Text>
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
                    ? 'border-primary-600 bg-primary-50 dark:bg-gray-800'
                    : 'border-gray-300 bg-white dark:bg-gray-800'
                }`}
              >
                <Text
                  className={
                    formData.contributionFrequency === freq.value
                      ? 'text-primary-600 font-medium'
                      : 'text-gray-700 dark:text-gray-200'
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

        {/* Danger Zone */}
        <View className="mt-2 pt-6 border-t border-red-200">
          <Text className="text-red-700 font-bold text-base mb-2">Zone de danger</Text>
          <Text className="text-gray-600 dark:text-gray-300 text-sm mb-4">
            L'archivage désactive les cotisations et clôture les activités du groupe pour tous les
            membres.
          </Text>
          <Button
            title={isDeleting ? 'Archivage en cours...' : 'Archiver le groupe'}
            onPress={handleDeleteGroup}
            variant="danger"
            disabled={isLoading || isDeleting}
            loading={isDeleting}
          />
        </View>
      </View>
    </ScrollView>
  );
}
