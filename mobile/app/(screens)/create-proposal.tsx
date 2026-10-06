import { Alert } from '@/services/dialog.service';
import { View, Text, ScrollView, TouchableOpacity, Platform, Keyboard } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useProposalStore } from '@/store/proposalStore';
import { useGroupStore } from '@/store/groupStore';
import { Button, EmptyState, Icon, Input, Loading } from '@/components/ui';
import type { IconName } from '@/components/ui/Icon';

type ProposalCategory = 'loan' | 'investment' | 'charity' | 'event' | 'emergency' | 'other';
type ProposalPriority = 'low' | 'medium' | 'high' | 'urgent';

export default function CreateProposalScreen() {
  const router = useRouter();
  const { groupId: routeGroupId } = useLocalSearchParams<{ groupId?: string }>();
  const { createProposal, isLoading: isSubmitting } = useProposalStore();
  const { groups, fetchGroups, isLoading: isGroupsLoading } = useGroupStore();

  const [selectedGroupId, setSelectedGroupId] = useState<string>(routeGroupId || '');

  useEffect(() => {
    if (groups.length === 0) {
      fetchGroups();
    }
  }, []);

  useEffect(() => {
    if (routeGroupId) {
      setSelectedGroupId(routeGroupId);
    } else if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(groups[0]._id);
    }
  }, [routeGroupId, groups, selectedGroupId]);

  const group = groups.find(g => g._id === selectedGroupId);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'other' as ProposalCategory,
    priority: 'medium' as ProposalPriority,
    recipientName: '',
    recipientDetails: '',
    votingDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories: Array<{
    value: ProposalCategory;
    label: string;
    icon: IconName;
    description: string;
  }> = [
    { value: 'loan', label: 'Prêt', icon: 'money', description: 'Prêt à un membre' },
    {
      value: 'investment',
      label: 'Investissement',
      icon: 'line-chart',
      description: 'Investissement collectif',
    },
    { value: 'charity', label: 'Charité', icon: 'heart', description: 'Don caritatif' },
    {
      value: 'event',
      label: 'Événement',
      icon: 'calendar',
      description: "Organisation d'événement",
    },
    {
      value: 'emergency',
      label: 'Urgence',
      icon: 'exclamation-triangle',
      description: "Situation d'urgence",
    },
    {
      value: 'other',
      label: 'Autre',
      icon: 'file-text-o',
      description: 'Autre type de proposition',
    },
  ];

  const priorities: Array<{
    value: ProposalPriority;
    label: string;
    bgSelected: string;
    textSelected: string;
    iconColor: string;
    icon: IconName;
  }> = [
    {
      value: 'low',
      label: 'Basse',
      bgSelected: 'bg-gray-100 dark:bg-gray-700',
      textSelected: 'text-gray-700 dark:text-gray-200',
      iconColor: '#4b5563',
      icon: 'arrow-down',
    },
    {
      value: 'medium',
      label: 'Moyenne',
      bgSelected: 'bg-blue-100',
      textSelected: 'text-blue-700',
      iconColor: '#1d4ed8',
      icon: 'minus',
    },
    {
      value: 'high',
      label: 'Haute',
      bgSelected: 'bg-orange-100',
      textSelected: 'text-orange-700',
      iconColor: '#c2410c',
      icon: 'arrow-up',
    },
    {
      value: 'urgent',
      label: 'Urgente',
      bgSelected: 'bg-red-100',
      textSelected: 'text-red-700',
      iconColor: '#b91c1c',
      icon: 'exclamation-circle',
    },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Le titre doit contenir au moins 5 caractères';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'La description doit contenir au moins 20 caractères';
    }

    if (!formData.amount) {
      newErrors.amount = 'Le montant est requis';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Le montant doit être un nombre positif';
      } else if (amount > 100_000_000) {
        newErrors.amount = 'Le montant ne peut pas dépasser 100 000 000 XOF';
      }
    }

    if (formData.votingDeadline <= new Date()) {
      newErrors.votingDeadline = 'La date limite doit être dans le futur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    if (!selectedGroupId || !group) {
      Alert.alert('Erreur', 'Veuillez sélectionner un groupe valide');
      return;
    }

    try {
      await createProposal(selectedGroupId, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        category: formData.category,
        priority: formData.priority,
        recipient: formData.recipientName.trim()
          ? {
              name: formData.recipientName.trim(),
              details: formData.recipientDetails.trim() || undefined,
            }
          : undefined,
        votingDeadline: formData.votingDeadline.toISOString(),
      });

      Alert.alert('Succès', 'Proposition créée avec succès', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: unknown) {
      const error = err as { message?: string };
      Alert.alert('Erreur', error.message || 'Impossible de créer la proposition');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isGroupsLoading && groups.length === 0) {
    return <Loading />;
  }

  if (groups.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center px-6">
        <EmptyState
          title="Aucun groupe actif"
          description="Vous devez faire partie d'un groupe d'épargne pour créer une proposition de dépense."
          actionLabel="Créer un groupe"
          onAction={() => router.push('/(screens)/create-group')}
        />
      </View>
    );
  }

  if (!group) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center px-6">
        <Icon name="times-circle" size={48} color="#dc2626" />
        <Text className="text-gray-800 dark:text-gray-100 text-xl font-bold mb-2">
          Groupe introuvable
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

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="px-6 py-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Nouvelle proposition
          </Text>
          <Text className="text-gray-600 dark:text-gray-300">
            Créez une proposition pour le groupe {group.name}
          </Text>
        </View>

        {/* Group Selector when not routed with groupId */}
        {!routeGroupId && groups.length > 1 && (
          <View className="mb-6">
            <Text className="text-gray-700 dark:text-gray-200 font-medium mb-2">
              Groupe concerné *
            </Text>
            <View className="bg-white dark:bg-gray-800 rounded-xl border border-gray-300 overflow-hidden">
              {groups.map((g, index) => {
                const isSelected = g._id === selectedGroupId;
                return (
                  <TouchableOpacity
                    key={g._id}
                    onPress={() => setSelectedGroupId(g._id)}
                    className={`flex-row items-center justify-between p-3.5 ${
                      index !== groups.length - 1
                        ? 'border-b border-gray-200 dark:border-gray-600'
                        : ''
                    } ${isSelected ? 'bg-primary-50/60' : ''}`}
                  >
                    <View className="flex-row items-center flex-1 mr-3">
                      <View
                        className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${
                          isSelected ? 'bg-primary-600' : 'bg-gray-100 dark:bg-gray-700'
                        }`}
                      >
                        <Icon name="users" size={16} color={isSelected ? '#ffffff' : '#4b5563'} />
                      </View>
                      <View className="flex-1">
                        <Text
                          className={`font-medium ${
                            isSelected
                              ? 'text-primary-700 font-semibold'
                              : 'text-gray-800 dark:text-gray-100'
                          }`}
                          numberOfLines={1}
                        >
                          {g.name}
                        </Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-xs">
                          {g.balance.toLocaleString()} {g.currency} disponible • {g.members.length}{' '}
                          membres
                        </Text>
                      </View>
                    </View>
                    <View
                      className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                        isSelected ? 'border-primary-600 bg-primary-600' : 'border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <View className="w-2.5 h-2.5 rounded-full bg-white dark:bg-gray-800" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Info Box */}
        <View className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg mb-6">
          <Text className="text-blue-800 text-sm">
            <Icon name="info-circle" size={14} color="#1e40af" />{' '}
            <Text className="font-semibold">Info:</Text> Tous les membres du groupe pourront voter
            sur cette proposition.
          </Text>
        </View>

        {/* Title */}
        <View className="mb-4">
          <Input
            label="Titre *"
            value={formData.title}
            onChangeText={text => setFormData({ ...formData, title: text })}
            placeholder="Ex: Prêt pour projet personnel"
            error={errors.title}
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View className="mb-4">
          <Input
            label="Description *"
            value={formData.description}
            onChangeText={text => setFormData({ ...formData, description: text })}
            placeholder="Décrivez en détail la proposition..."
            error={errors.description}
            multiline
            numberOfLines={5}
            maxLength={500}
          />
        </View>

        {/* Amount */}
        <View className="mb-4">
          <Input
            label="Montant *"
            value={formData.amount}
            onChangeText={text => setFormData({ ...formData, amount: text })}
            placeholder="Ex: 50000"
            keyboardType="numeric"
            error={errors.amount}
            rightIcon={
              <Text className="text-gray-500 dark:text-gray-400 text-sm">
                {group?.currency || 'XOF'}
              </Text>
            }
          />
        </View>

        {/* Category */}
        <View className="mb-4">
          <Text className="text-gray-700 dark:text-gray-200 font-medium mb-2">Catégorie *</Text>
          <View className="space-y-2">
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.value}
                onPress={() =>
                  setFormData({ ...formData, category: cat.value as ProposalCategory })
                }
                className={`p-4 rounded-lg border-2 ${
                  formData.category === cat.value
                    ? 'border-primary-600 bg-primary-50 dark:bg-gray-800'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
                }`}
              >
                <View className="flex-row items-center">
                  <View className="w-8 items-center mr-3">
                    <Icon name={cat.icon} size={18} color="#0284c7" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-800 dark:text-gray-100 font-semibold">
                      {cat.label}
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-300 text-sm">
                      {cat.description}
                    </Text>
                  </View>
                  {formData.category === cat.value && (
                    <Icon name="check" size={16} color="#0284c7" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Priority */}
        <View className="mb-4">
          <Text className="text-gray-700 dark:text-gray-200 font-medium mb-2">Priorité *</Text>
          <View className="flex-row flex-wrap gap-2">
            {priorities.map(priority => {
              const isSelected = formData.priority === priority.value;
              return (
                <TouchableOpacity
                  key={priority.value}
                  onPress={() =>
                    setFormData({ ...formData, priority: priority.value as ProposalPriority })
                  }
                  className={`px-4 py-3 rounded-lg border-2 ${
                    isSelected
                      ? `border-primary-600 ${priority.bgSelected}`
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
                  }`}
                >
                  <View className="flex-row items-center">
                    <Icon
                      name={priority.icon}
                      size={14}
                      color={isSelected ? priority.iconColor : '#6b7280'}
                    />
                    <Text
                      className={`ml-2 font-medium ${
                        isSelected ? priority.textSelected : 'text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {priority.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Recipient (Optional) */}
        <View className="mb-4">
          <Text className="text-gray-700 dark:text-gray-200 font-medium mb-2">
            Bénéficiaire (optionnel)
          </Text>
          <View className="mb-2">
            <Input
              label="Nom du bénéficiaire"
              value={formData.recipientName}
              onChangeText={text => setFormData({ ...formData, recipientName: text })}
              placeholder="Ex: Jean Dupont"
            />
          </View>
          <View>
            <Input
              label="Détails"
              value={formData.recipientDetails}
              onChangeText={text => setFormData({ ...formData, recipientDetails: text })}
              placeholder="Ex: Membre du groupe, entrepreneur..."
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        {/* Voting Deadline */}
        <View className="mb-6">
          <Text className="text-gray-700 dark:text-gray-200 font-medium mb-2">
            Date limite de vote *
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="bg-white dark:bg-gray-800 border border-gray-300 rounded-lg px-4 py-3"
          >
            <View className="flex-row items-center">
              <Icon name="calendar" size={16} color="#374151" />
              <Text className="text-gray-800 dark:text-gray-100 ml-2">
                {formatDate(formData.votingDeadline)}
              </Text>
            </View>
          </TouchableOpacity>
          {errors.votingDeadline && (
            <Text className="text-red-600 text-sm mt-1">{errors.votingDeadline}</Text>
          )}

          {showDatePicker && (
            <DateTimePicker
              value={formData.votingDeadline}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setFormData({ ...formData, votingDeadline: selectedDate });
                }
              }}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Submit Button */}
        <Button
          title="Créer la proposition"
          onPress={handleSubmit}
          disabled={isSubmitting}
          loading={isSubmitting}
        />

        <View className="h-6" />
      </View>
    </ScrollView>
  );
}
