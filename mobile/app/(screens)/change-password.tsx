import { View, Text, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Button, Input } from '@/components/ui';

export default function ChangePasswordScreen() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Le mot de passe actuel est requis';
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'Le nouveau mot de passe est requis';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Veuillez confirmer le mot de passe';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = "Le nouveau mot de passe doit être différent de l'ancien";
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
      setLoading(true);

      // TODO: Call backend API to change password
      // await authService.changePassword(formData);

      Alert.alert('Succès', 'Votre mot de passe a été modifié avec succès', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: unknown) {
      const error = err as { message?: string };
      Alert.alert('Erreur', error.message || 'Impossible de changer le mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 mb-2">Changer le mot de passe</Text>
          <Text className="text-gray-600">
            Pour votre sécurité, choisissez un mot de passe fort
          </Text>
        </View>

        {/* Security Tips */}
        <View className="bg-blue-50 p-4 rounded-lg mb-6">
          <Text className="text-blue-800 text-sm font-semibold mb-2">💡 Conseils de sécurité</Text>
          <Text className="text-blue-700 text-sm mb-1">• Au moins 8 caractères</Text>
          <Text className="text-blue-700 text-sm mb-1">
            • Mélange de lettres majuscules et minuscules
          </Text>
          <Text className="text-blue-700 text-sm mb-1">
            • Inclure des chiffres et des caractères spéciaux
          </Text>
          <Text className="text-blue-700 text-sm">• Ne pas utiliser de mots de passe évidents</Text>
        </View>

        {/* Form */}
        <View className="mb-4">
          <Input
            label="Mot de passe actuel *"
            value={formData.currentPassword}
            onChangeText={text => setFormData({ ...formData, currentPassword: text })}
            placeholder="Entrez votre mot de passe actuel"
            error={errors.currentPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <View className="mb-4">
          <Input
            label="Nouveau mot de passe *"
            value={formData.newPassword}
            onChangeText={text => setFormData({ ...formData, newPassword: text })}
            placeholder="Entrez votre nouveau mot de passe"
            error={errors.newPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <View className="mb-6">
          <Input
            label="Confirmer le mot de passe *"
            value={formData.confirmPassword}
            onChangeText={text => setFormData({ ...formData, confirmPassword: text })}
            placeholder="Confirmez votre nouveau mot de passe"
            error={errors.confirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {/* Actions */}
        <View className="mb-4">
          <Button
            title={loading ? 'Modification...' : 'Changer le mot de passe'}
            onPress={handleSubmit}
            disabled={loading}
          />
        </View>

        <View className="mb-6">
          <Button title="Annuler" onPress={() => router.back()} variant="secondary" />
        </View>

        {/* Warning */}
        <View className="bg-yellow-50 p-4 rounded-lg">
          <Text className="text-yellow-800 text-sm">
            ⚠️ <Text className="font-semibold">Important:</Text> Après avoir changé votre mot de
            passe, vous serez déconnecté de tous vos appareils pour des raisons de sécurité.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
