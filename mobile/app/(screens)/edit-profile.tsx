import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { Button, Input } from '@/components/ui';
import {
  showImagePicker,
  saveImageLocally,
  deleteImageLocally,
  ImageInfo,
} from '@/services/upload.service';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<ImageInfo | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Le nom complet est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Le téléphone est requis';
    } else if (!/^[0-9+\s-]{8,}$/.test(formData.phone)) {
      newErrors.phone = 'Numéro invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChooseAvatar = async () => {
    try {
      const images = await showImagePicker({
        allowsMultipleSelection: false,
        quality: 0.7,
        aspect: [1, 1], // Square aspect ratio for avatar
      });

      if (images && images.length > 0) {
        const image = images[0];

        // Save image locally
        const savedPath = await saveImageLocally(image.uri, `avatar_${Date.now()}.jpg`);

        if (savedPath) {
          // Delete old avatar if exists
          if (avatar) {
            await deleteImageLocally(avatar.uri);
          }

          setAvatar({
            ...image,
            uri: savedPath,
          });
        }
      }
    } catch (error) {
      console.error('Error choosing avatar:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner la photo');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    try {
      setLoading(true);

      // Prepare update data
      const updateData: Record<string, string> = {
        ...formData,
      };

      // Add avatar if selected
      if (avatar) {
        updateData.avatar = avatar.uri;
      }

      // Call backend API to update profile
      await updateProfile(updateData);

      Alert.alert('Succès', 'Votre profil a été mis à jour', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: unknown) {
      const error = err as { message?: string };
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 mb-2">Modifier le profil</Text>
          <Text className="text-gray-600">Mettez à jour vos informations personnelles</Text>
        </View>

        {/* Avatar Section */}
        <View className="items-center mb-6">
          {avatar ? (
            <Image
              source={{ uri: avatar.uri }}
              className="w-24 h-24 rounded-full mb-3"
              resizeMode="cover"
            />
          ) : (
            <View className="w-24 h-24 bg-primary-100 rounded-full items-center justify-center mb-3">
              <Text className="text-4xl font-bold text-primary-600">
                {formData.fullName[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <TouchableOpacity onPress={handleChooseAvatar}>
            <Text className="text-primary-600 font-medium">Changer la photo de profil</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View className="mb-4">
          <Input
            label="Nom complet *"
            value={formData.fullName}
            onChangeText={text => setFormData({ ...formData, fullName: text })}
            placeholder="Votre nom complet"
            error={errors.fullName}
            autoCapitalize="words"
          />
        </View>

        <View className="mb-4">
          <Input
            label="Email *"
            value={formData.email}
            onChangeText={text => setFormData({ ...formData, email: text })}
            placeholder="email@exemple.com"
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View className="mb-6">
          <Input
            label="Téléphone *"
            value={formData.phone}
            onChangeText={text => setFormData({ ...formData, phone: text })}
            placeholder="+223 XX XX XX XX"
            error={errors.phone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Actions */}
        <View className="mb-4">
          <Button
            title={loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            onPress={handleSubmit}
            disabled={loading}
          />
        </View>

        <View className="mb-6">
          <Button title="Annuler" onPress={() => router.back()} variant="secondary" />
        </View>

        {/* Additional Info */}
        <View className="bg-blue-50 p-4 rounded-lg">
          <Text className="text-blue-800 text-sm">
            💡 <Text className="font-semibold">Note:</Text> Certaines informations comme votre email
            peuvent nécessiter une vérification avant d'être modifiées.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
