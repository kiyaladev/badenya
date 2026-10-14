import { Alert } from '@/services/dialog.service';
import { View, Text, ScrollView, TouchableOpacity, Image, Keyboard } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTransactionStore } from '@/store/transactionStore';
import { useGroupStore } from '@/store/groupStore';
import { Button, Icon, Input, EmptyState, Loading } from '@/components/ui';
import type { IconName } from '@/components/ui/Icon';
import {
  showImagePicker,
  saveImageLocally,
  deleteImageLocally,
  uploadImage,
  ImageInfo,
} from '@/services/upload.service';
import logger from '@/services/logger';
import { PAYMENT_METHOD_LABELS, MOBILE_MONEY_OPERATOR_LABELS } from '@/constants/labels';

// Backend enum has no 'other' value: "Autre" is stored as 'bank_transfer'.
type PaymentMethodType = 'cash' | 'mobile_money' | 'bank_transfer';

export default function AddContributionScreen() {
  const router = useRouter();
  const { groupId: routeGroupId } = useLocalSearchParams<{ groupId?: string }>();
  const { createTransaction, isLoading: isSubmitting } = useTransactionStore();
  const { groups, fetchGroups, isLoading: isGroupsLoading } = useGroupStore();

  const draftIdentity = useRef({ signature: '', key: '' });
  const [selectedGroupId, setSelectedGroupId] = useState<string>(routeGroupId || '');
  const [isUploading, setIsUploading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    paymentMethod: 'mobile_money' as PaymentMethodType,
    mobileProvider: 'wave' as 'wave' | 'orange_money' | 'mtn_momo' | 'moov_money',
    mobileReference: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<ImageInfo[]>([]);

  useEffect(() => {
    if (groups.length === 0) {
      fetchGroups();
    }
  }, []);

  useEffect(() => {
    if (routeGroupId) {
      setSelectedGroupId(routeGroupId);
      const matched = groups.find(g => g._id === routeGroupId);
      if (matched?.contributionAmount && !formData.amount) {
        setFormData(prev => ({ ...prev, amount: String(matched.contributionAmount) }));
      }
    } else if (!selectedGroupId && groups.length === 1) {
      setSelectedGroupId(groups[0]._id);
      if (groups[0].contributionAmount && !formData.amount) {
        setFormData(prev => ({ ...prev, amount: String(groups[0].contributionAmount) }));
      }
    }
  }, [routeGroupId, groups]);

  const mobileMoneyProviders: Array<{
    id: 'wave' | 'orange_money' | 'mtn_momo' | 'moov_money';
    activeBorder: string;
    activeBg: string;
    activeText: string;
    dotColor: string;
  }> = [
    {
      id: 'wave',
      activeBorder: 'border-sky-500',
      activeBg: 'bg-sky-50',
      activeText: 'text-sky-700',
      dotColor: 'bg-sky-500',
    },
    {
      id: 'orange_money',
      activeBorder: 'border-orange-500',
      activeBg: 'bg-orange-50',
      activeText: 'text-orange-700',
      dotColor: 'bg-orange-500',
    },
    {
      id: 'mtn_momo',
      activeBorder: 'border-amber-500',
      activeBg: 'bg-amber-50',
      activeText: 'text-amber-700',
      dotColor: 'bg-amber-500',
    },
    {
      id: 'moov_money',
      activeBorder: 'border-emerald-500',
      activeBg: 'bg-emerald-50',
      activeText: 'text-emerald-700',
      dotColor: 'bg-emerald-500',
    },
  ];

  const paymentMethods: Array<{ value: PaymentMethodType; label: string; icon: IconName }> = [
    { value: 'mobile_money', label: PAYMENT_METHOD_LABELS.mobile_money, icon: 'mobile' },
    { value: 'cash', label: PAYMENT_METHOD_LABELS.cash, icon: 'money' },
    { value: 'bank_transfer', label: PAYMENT_METHOD_LABELS.bank_transfer, icon: 'ellipsis-h' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedGroupId) {
      newErrors.group = 'Veuillez sélectionner un groupe';
    }

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
      logger.error('AddContribution', 'Error adding attachment', error);
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
      logger.error('AddContribution', 'Error removing attachment', error);
      Alert.alert('Erreur', 'Impossible de supprimer la pièce jointe');
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!validateForm()) {
      const firstError =
        errors.group ||
        errors.amount ||
        (!selectedGroupId
          ? 'Veuillez sélectionner un groupe'
          : !formData.amount
            ? 'Le montant est requis'
            : 'Veuillez corriger les erreurs dans le formulaire');
      Alert.alert('Formulaire incomplet', firstError);
      return;
    }

    try {
      let uploadedAttachments: Array<{
        name: string;
        filename: string;
        url: string;
        type: string;
        uri: string;
        size?: number;
      }> = [];

      if (attachments.length > 0) {
        setIsUploading(true);
        uploadedAttachments = await Promise.all(
          attachments.map(async attachment => {
            const uploaded = await uploadImage(attachment);
            return {
              name: attachment.name,
              filename: uploaded.filename || attachment.name,
              url: uploaded.url,
              type: 'image',
              uri: attachment.uri,
              size: attachment.size,
            };
          })
        );
      }

      const signature = JSON.stringify({
        selectedGroupId,
        formData,
        attachments: attachments.map(item => item.uri),
      });
      if (draftIdentity.current.signature !== signature)
        draftIdentity.current = {
          signature,
          key: `contribution:${Date.now()}:${Math.random().toString(36).slice(2)}`,
        };
      await createTransaction(selectedGroupId, {
        idempotencyKey: draftIdentity.current.key,
        type: 'contribution',
        amount: Number(formData.amount),
        description: formData.description.trim() || undefined,
        paymentMethod: {
          type: formData.paymentMethod,
          provider: formData.paymentMethod === 'mobile_money' ? formData.mobileProvider : undefined,
          reference:
            formData.paymentMethod === 'mobile_money'
              ? formData.mobileReference.trim() || undefined
              : undefined,
        },
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      });

      // Clean up local files after successful submission
      for (const attachment of attachments) {
        await deleteImageLocally(attachment.uri);
      }

      Alert.alert('Succès', 'Cotisation enregistrée', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: unknown) {
      const error = err as { message?: string };
      Alert.alert('Erreur', error.message || "Impossible d'enregistrer la cotisation");
    } finally {
      setIsUploading(false);
    }
  };

  const selectedGroup = groups.find(g => g._id === selectedGroupId);

  if (isGroupsLoading && groups.length === 0) {
    return <Loading text="Chargement des groupes..." />;
  }

  if (groups.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900 p-6 justify-center">
        <EmptyState
          icon="users"
          title="Aucun groupe disponible"
          description="Vous devez appartenir à au moins un groupe pour verser une cotisation."
          actionLabel="Créer un groupe"
          onAction={() => router.replace('/(screens)/create-group')}
        />
      </View>
    );
  }

  const isLoading = isSubmitting || isUploading;

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="px-6 py-6">
        {/* Group Selector */}
        <View className="mb-5">
          <Text className="text-gray-700 dark:text-gray-200 text-sm font-medium mb-2">
            Groupe destinataire *
          </Text>
          {(routeGroupId || groups.length === 1) && selectedGroup ? (
            <View className="bg-primary-50 dark:bg-gray-800 border border-primary-200 rounded-xl p-4 flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-primary-600 items-center justify-center mr-3">
                  <Icon name="users" size={18} color="#ffffff" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 dark:text-gray-50 font-semibold text-base">
                    {selectedGroup.name}
                  </Text>
                  <Text className="text-gray-600 dark:text-gray-300 text-xs">
                    Cotisation : {selectedGroup.contributionAmount.toLocaleString()}{' '}
                    {selectedGroup.currency}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View className="bg-white dark:bg-gray-800 rounded-xl border border-gray-300 overflow-hidden">
              {groups.map((group, index) => {
                const isSelected = group._id === selectedGroupId;
                return (
                  <TouchableOpacity
                    key={group._id}
                    onPress={() => {
                      setSelectedGroupId(group._id);
                      setErrors(prev => ({ ...prev, group: '' }));
                      if (!formData.amount && group.contributionAmount) {
                        setFormData(prev => ({
                          ...prev,
                          amount: String(group.contributionAmount),
                        }));
                      }
                    }}
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
                          className={`font-medium ${isSelected ? 'text-primary-700 font-semibold' : 'text-gray-800 dark:text-gray-100'}`}
                          numberOfLines={1}
                        >
                          {group.name}
                        </Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-xs">
                          {group.contributionAmount.toLocaleString()} {group.currency} •{' '}
                          {group.members.length} membres
                        </Text>
                      </View>
                    </View>
                    <View
                      className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                        isSelected ? 'border-primary-600 bg-primary-600' : 'border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <View className="w-2 h-2 rounded-full bg-white dark:bg-gray-800" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          {errors.group ? <Text className="text-red-500 text-xs mt-1">{errors.group}</Text> : null}
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
            rightIcon={<Text className="text-gray-500 dark:text-gray-400 text-sm">XOF</Text>}
          />
        </View>

        {/* Payment Method */}
        <View className="mb-6">
          <Text className="text-gray-700 dark:text-gray-200 text-sm font-medium mb-3">
            Mode de paiement *
          </Text>
          <View className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-300">
            {paymentMethods.map((method, index) => (
              <TouchableOpacity
                key={method.value}
                className={`flex-row items-center justify-between p-4 ${
                  index !== paymentMethods.length - 1
                    ? 'border-b border-gray-200 dark:border-gray-600'
                    : ''
                }`}
                onPress={() =>
                  setFormData({ ...formData, paymentMethod: method.value as PaymentMethodType })
                }
              >
                <View className="flex-row items-center">
                  <View className="w-8 mr-3 items-center">
                    <Icon name={method.icon} size={20} color="#0284c7" />
                  </View>
                  <Text className="text-gray-800 dark:text-gray-100">{method.label}</Text>
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

        {/* Mobile Money Provider & Reference */}
        {formData.paymentMethod === 'mobile_money' && (
          <View className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl border border-primary-200 shadow-sm">
            <Text className="text-gray-800 dark:text-gray-100 text-sm font-semibold mb-3">
              Opérateur Mobile Money *
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {mobileMoneyProviders.map(provider => {
                const isSelected = formData.mobileProvider === provider.id;
                return (
                  <TouchableOpacity
                    key={provider.id}
                    onPress={() => setFormData({ ...formData, mobileProvider: provider.id })}
                    className={`flex-1 min-w-[45%] py-3 px-3 rounded-lg border flex-row items-center justify-center ${
                      isSelected
                        ? `${provider.activeBg} ${provider.activeBorder}`
                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <View className={`w-3 h-3 rounded-full mr-2 ${provider.dotColor}`} />
                    <Text
                      className={`text-xs text-center ${
                        isSelected
                          ? `${provider.activeText} font-bold`
                          : 'text-gray-700 dark:text-gray-200 font-medium'
                      }`}
                    >
                      {MOBILE_MONEY_OPERATOR_LABELS[provider.id]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              label="Référence / ID de transaction Mobile Money (optionnel)"
              value={formData.mobileReference}
              onChangeText={text => setFormData({ ...formData, mobileReference: text })}
              placeholder="Ex: TXN-984321 ou reçu de transfert"
            />
          </View>
        )}

        {/* Optional details */}
        <TouchableOpacity
          className="flex-row items-center mb-4"
          onPress={() => setShowDetails(value => !value)}
        >
          <Icon name={showDetails ? 'chevron-down' : 'chevron-right'} size={12} color="#0284c7" />
          <Text className="text-primary-600 font-medium ml-2">Plus de détails</Text>
        </TouchableOpacity>
        {showDetails && (
          <>
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

            {/* Attachments */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                  Justificatifs (optionnel)
                </Text>
                <TouchableOpacity
                  onPress={handleAddAttachment}
                  className="flex-row items-center"
                  disabled={isLoading}
                >
                  <View className="flex-row items-center">
                    <Icon name="paperclip" size={16} color="#0284c7" />
                    <Text className="text-primary-600 font-medium ml-2">Ajouter</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {attachments.length > 0 && (
                <View className="space-y-2">
                  {attachments.map((attachment, index) => (
                    <View
                      key={index}
                      className="bg-white dark:bg-gray-800 rounded-lg p-3 flex-row items-center border border-gray-200 dark:border-gray-600"
                    >
                      <Image
                        source={{ uri: attachment.uri }}
                        className="w-12 h-12 rounded mr-3"
                        resizeMode="cover"
                      />
                      <View className="flex-1">
                        <Text
                          className="text-gray-800 dark:text-gray-100 font-medium"
                          numberOfLines={1}
                        >
                          {attachment.name}
                        </Text>
                        {attachment.size && (
                          <Text className="text-gray-600 dark:text-gray-300 text-xs">
                            {(attachment.size / 1024 / 1024).toFixed(2)} MB
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveAttachment(index)}
                        className="p-2"
                        disabled={isLoading}
                      >
                        <Icon name="times" size={18} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {attachments.length === 0 && (
                <View className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-dashed border-gray-300">
                  <Text className="text-gray-600 dark:text-gray-300 text-center text-sm">
                    Ajoutez des photos de reçus ou justificatifs (optionnel)
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Submit Button */}
        <Button
          title={isUploading ? 'Téléversement des pièces...' : 'Enregistrer la cotisation'}
          onPress={handleSubmit}
          loading={isLoading}
          className="mb-6"
        />
      </View>
    </ScrollView>
  );
}
