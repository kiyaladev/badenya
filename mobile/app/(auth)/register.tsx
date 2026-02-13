import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const router = useRouter();
  const { register, isLoading, clearError } = useAuthStore();

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    };

    if (!fullName.trim()) {
      newErrors.fullName = 'Nom complet requis';
      valid = false;
    }

    if (!email) {
      newErrors.email = 'Email requis';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email invalide';
      valid = false;
    }

    if (!phone) {
      newErrors.phone = 'Téléphone requis';
      valid = false;
    }

    if (!password) {
      newErrors.password = 'Mot de passe requis';
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Minimum 6 caractères';
      valid = false;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleRegister = async () => {
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      await register({ fullName, email, phone, password });
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message :
        typeof err === 'object' && err !== null && 'response' in err
          ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message)
          : undefined;
      Alert.alert(
        "Erreur d'inscription",
        message || 'Une erreur est survenue'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="bg-white"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pt-16">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-4xl font-bold text-gray-800 mb-2">Créer un compte</Text>
            <Text className="text-lg text-gray-600">Rejoignez Badenya aujourd'hui</Text>
          </View>

          {/* Form */}
          <Input
            label="Nom complet"
            value={fullName}
            onChangeText={text => {
              setFullName(text);
              setErrors({ ...errors, fullName: '' });
            }}
            placeholder="Jean Dupont"
            error={errors.fullName}
          />

          <Input
            label="Email"
            value={email}
            onChangeText={text => {
              setEmail(text);
              setErrors({ ...errors, email: '' });
            }}
            placeholder="exemple@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label="Téléphone"
            value={phone}
            onChangeText={text => {
              setPhone(text);
              setErrors({ ...errors, phone: '' });
            }}
            placeholder="+225 07 XX XX XX XX"
            keyboardType="phone-pad"
            error={errors.phone}
          />

          <Input
            label="Mot de passe"
            value={password}
            onChangeText={text => {
              setPassword(text);
              setErrors({ ...errors, password: '' });
            }}
            placeholder="••••••••"
            secureTextEntry
            error={errors.password}
          />

          <Input
            label="Confirmer le mot de passe"
            value={confirmPassword}
            onChangeText={text => {
              setConfirmPassword(text);
              setErrors({ ...errors, confirmPassword: '' });
            }}
            placeholder="••••••••"
            secureTextEntry
            error={errors.confirmPassword}
          />

          {/* Register Button */}
          <Button
            title="S'inscrire"
            onPress={handleRegister}
            loading={isLoading}
            fullWidth
            style={{ marginBottom: 24 }}
          />

          {/* Login Link */}
          <View className="flex-row justify-center mb-8">
            <Text className="text-gray-600 text-base">Déjà un compte ? </Text>
            <Button
              title="Se connecter"
              variant="ghost"
              size="sm"
              onPress={() => router.back()}
              style={{ padding: 0, marginTop: -8 }}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
