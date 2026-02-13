import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTransactionStore } from '@/store/transactionStore';
import { Button, Input } from '@/components/ui';
import {
  showImagePicker,
  saveImageLocally,
  deleteImageLocally,
  ImageInfo,
} from '@/services/upload.service';

type PaymentMethodType = 'cash' | 'mobile_money' | 'bank_transfer' | 'card';

export default function AddContributionScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { createTransaction, loading } = useTransactionStore();

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    paymentMethod: 'cash' as PaymentMethodType,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<ImageInfo[]>([]);

  const paymentMethods = [
    { value: 'cash', label: 'Espèces', icon: '💵' },
    { value: 'mobile_money', label: 'Mobile Money', icon: '📱' },
    { value: 'bank_transfer', label: 'Virement bancaire', icon: '🏦' },
    { value: 'card', label: 'Carte bancaire', icon: '💳' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount) {
      newErrors.amount = 'Le montant est requis';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Le montant doit être un nombre positif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddAttachment = async () => {
    try {
      const images = await showImagePicker({
        allowsMultipleSelection: true,
        quality: 0.7,
      });

      if (images && images.length > 0) {
        // Save images locally
        const savedImages: ImageInfo[] = [];

        for (const image of images) {
          const savedPath = await saveImageLocally(image.uri, image.name);
          if (savedPath) {
            savedImages.push({
              ...image,
              uri: savedPath,
            });
          }
        }

        setAttachments([...attachments, ...savedImages]);
      }
    } catch (error) {
      console.error('Error adding attachment:', error);
      Alert.alert('Erreur', "Impossible d'ajouter la pièce jointe");
    }
  };

  const handleRemoveAttachment = async (index: number) => {
    try {
      const attachment = attachments[index];

      // Delete from local storage
      await deleteImageLocally(attachment.uri);

      // Remove from state
      const newAttachments = attachments.filter((_, i) => i !== index);
      setAttachments(newAttachments);
    } catch (error) {
      console.error('Error removing attachment:', error);
      Alert.alert('Erreur', 'Impossible de supprimer la pièce jointe');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm() || !groupId) {
      return;
    }

    try {
      // Prepare attachments data
      const attachmentsData = attachments.map(att => ({
        name: att.name,
        filename: att.name,
        uri: att.uri,
        type: 'image',
        size: att.size,
      }));

      await createTransaction(groupId, {
        type: 'contribution',
        amount: Number(formData.amount),
        description: formData.description.trim() || undefined,
        paymentMethod: {
          type: formData.paymentMethod,
        },
        attachments: attachmentsData.length > 0 ? attachmentsData : undefined,
      });

      // Clean up local files after successful submission
      for (const attachment of attachments) {
        await deleteImageLocally(attachment.uri);
      }

      Alert.alert('Succès', 'Contribution enregistrée avec succès!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: unknown) {
      const error = err as { message?: string };
      Alert.alert('Erreur', error.message || "Impossible d'enregistrer la contribution");
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 mb-2">Faire une contribution</Text>
          <Text className="text-gray-600">Enregistrez votre contribution au groupe</Text>
        </View>

        {/* Amount */}
        <View className="mb-4">
          <Input
            label="Montant *"
            value={formData.amount}
            onChangeText={text => setFormData({ ...formData, amount: text })}
            placeholder="Ex: 10000"
            keyboardType="numeric"
            error={errors.amount}
            rightIcon={<Text className="text-gray-500 text-sm">XOF</Text>}
          />
        </View>

        {/* Description */}
        <View className="mb-4">
          <Input
            label="Description (optionnel)"
            value={formData.description}
            onChangeText={text => setFormData({ ...formData, description: text })}
            placeholder="Ex: Cotisation mensuelle janvier"
            multiline
          />
        </View>

        {/* Payment Method */}
        <View className="mb-6">
          <Text className="text-gray-700 text-sm font-medium mb-3">Mode de paiement *</Text>
          <View className="bg-white rounded-lg overflow-hidden border border-gray-300">
            {paymentMethods.map((method, index) => (
              <TouchableOpacity
                key={method.value}
                className={`flex-row items-center justify-between p-4 ${
                  index !== paymentMethods.length - 1 ? 'border-b border-gray-200' : ''
                }`}
                onPress={() =>
                  setFormData({ ...formData, paymentMethod: method.value as PaymentMethodType })
                }
              >
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-3">{method.icon}</Text>
                  <Text className="text-gray-800">{method.label}</Text>
                </View>
                <View
                  className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                    formData.paymentMethod === method.value
                      ? 'border-primary-600'
                      : 'border-gray-300'
                  }`}
                >
                  {formData.paymentMethod === method.value && (
                    <View className="w-3 h-3 rounded-full bg-primary-600" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Attachments */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-700 text-sm font-medium">Justificatifs (optionnel)</Text>
            <TouchableOpacity
              onPress={handleAddAttachment}
              className="flex-row items-center"
              disabled={loading}
            >
              <Text className="text-primary-600 font-medium">📎 Ajouter</Text>
            </TouchableOpacity>
          </View>

          {attachments.length > 0 && (
            <View className="space-y-2">
              {attachments.map((attachment, index) => (
                <View
                  key={index}
                  className="bg-white rounded-lg p-3 flex-row items-center border border-gray-200"
                >
                  <Image
                    source={{ uri: attachment.uri }}
                    className="w-12 h-12 rounded mr-3"
                    resizeMode="cover"
                  />
                  <View className="flex-1">
                    <Text className="text-gray-800 font-medium" numberOfLines={1}>
                      {attachment.name}
                    </Text>
                    {attachment.size && (
                      <Text className="text-gray-600 text-xs">
                        {(attachment.size / 1024 / 1024).toFixed(2)} MB
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveAttachment(index)}
                    className="p-2"
                    disabled={loading}
                  >
                    <Text className="text-red-600 text-lg">✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {attachments.length === 0 && (
            <View className="bg-gray-50 rounded-lg p-4 border border-dashed border-gray-300">
              <Text className="text-gray-600 text-center text-sm">
                Ajoutez des photos de reçus ou justificatifs (optionnel)
              </Text>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <Button
          title="Enregistrer la contribution"
          onPress={handleSubmit}
          loading={loading}
          className="mb-6"
        />

        {/* Cancel Button */}
        <TouchableOpacity className="py-3" onPress={() => router.back()} disabled={loading}>
          <Text className="text-center text-gray-600 font-medium">Annuler</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
