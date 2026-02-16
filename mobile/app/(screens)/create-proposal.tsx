import { View, Text, ScrollView, TouchableOpacity, Alert, Platform, Keyboard } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useProposalStore } from '@/store/proposalStore';
import { useGroupStore } from '@/store/groupStore';
import { Button, Input } from '@/components/ui';

type ProposalCategory = 'loan' | 'investment' | 'charity' | 'event' | 'emergency' | 'other';
type ProposalPriority = 'low' | 'medium' | 'high' | 'urgent';

export default function CreateProposalScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { createProposal, isLoading } = useProposalStore();
  const { groups } = useGroupStore();

  const group = groups.find(g => g._id === groupId);

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

  const categories = [
    { value: 'loan', label: 'Prêt', icon: '💰', description: 'Prêt à un membre' },
    {
      value: 'investment',
      label: 'Investissement',
      icon: '📈',
      description: 'Investissement collectif',
    },
    { value: 'charity', label: 'Charité', icon: '❤️', description: 'Don caritatif' },
    { value: 'event', label: 'Événement', icon: '🎉', description: "Organisation d'événement" },
    { value: 'emergency', label: 'Urgence', icon: '🚨', description: "Situation d'urgence" },
    { value: 'other', label: 'Autre', icon: '📋', description: 'Autre type de proposition' },
  ];

  const priorities = [
    { value: 'low', label: 'Basse', color: 'bg-gray-100 text-gray-700', icon: '⬇️' },
    { value: 'medium', label: 'Moyenne', color: 'bg-blue-100 text-blue-700', icon: '➡️' },
    { value: 'high', label: 'Haute', color: 'bg-orange-100 text-orange-700', icon: '⬆️' },
    { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-700', icon: '🔴' },
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

    if (!group) {
      Alert.alert('Erreur', 'Groupe introuvable');
      return;
    }

    try {
      await createProposal(groupId!, {
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

  if (!group) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Text className="text-6xl mb-4">❌</Text>
        <Text className="text-gray-800 text-xl font-bold mb-2">Groupe introuvable</Text>
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
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 mb-2">Nouvelle proposition</Text>
          <Text className="text-gray-600">Créez une proposition pour le groupe {group.name}</Text>
        </View>

        {/* Info Box */}
        <View className="bg-blue-50 p-4 rounded-lg mb-6">
          <Text className="text-blue-800 text-sm">
            💡 <Text className="font-semibold">Info:</Text> Tous les membres du groupe pourront
            voter sur cette proposition.
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
            rightIcon={<Text className="text-gray-500 text-sm">XOF</Text>}
          />
        </View>

        {/* Category */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Catégorie *</Text>
          <View className="space-y-2">
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.value}
                onPress={() =>
                  setFormData({ ...formData, category: cat.value as ProposalCategory })
                }
                className={`p-4 rounded-lg border-2 ${
                  formData.category === cat.value
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-3">{cat.icon}</Text>
                  <View className="flex-1">
                    <Text className="text-gray-800 font-semibold">{cat.label}</Text>
                    <Text className="text-gray-600 text-sm">{cat.description}</Text>
                  </View>
                  {formData.category === cat.value && (
                    <Text className="text-primary-600 text-xl">✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Priority */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Priorité *</Text>
          <View className="flex-row flex-wrap gap-2">
            {priorities.map(priority => (
              <TouchableOpacity
                key={priority.value}
                onPress={() =>
                  setFormData({ ...formData, priority: priority.value as ProposalPriority })
                }
                className={`px-4 py-3 rounded-lg border-2 ${
                  formData.priority === priority.value
                    ? 'border-primary-600 ' + priority.color
                    : 'border-gray-200 bg-white'
                }`}
              >
                <Text
                  className={
                    formData.priority === priority.value
                      ? priority.color.split(' ')[1]
                      : 'text-gray-600'
                  }
                >
                  {priority.icon} {priority.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recipient (Optional) */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Bénéficiaire (optionnel)</Text>
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
          <Text className="text-gray-700 font-medium mb-2">Date limite de vote *</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="bg-white border border-gray-300 rounded-lg px-4 py-3"
          >
            <Text className="text-gray-800">📅 {formatDate(formData.votingDeadline)}</Text>
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
        <Button onPress={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Création en cours...' : 'Créer la proposition'}
        </Button>

        <View className="h-6" />
      </View>
    </ScrollView>
  );
}
