import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import authService from '@/services/auth.service';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const validateEmail = () => {
    if (!email) {
      setError('Email requis');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email invalide');
      return false;
    }
    setError('');
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setEmailSent(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      Alert.alert(
        'Erreur',
        error.response?.data?.message || 'Une erreur est survenue. Veuillez réessayer.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <View className="flex-1 bg-white px-6 justify-center items-center">
        <Text className="text-6xl mb-6">📧</Text>
        <Text className="text-2xl font-bold text-gray-800 text-center mb-4">Email envoyé !</Text>
        <Text className="text-base text-gray-600 text-center mb-8">
          Vérifiez votre boîte mail pour réinitialiser votre mot de passe.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary-600 py-4 px-8 rounded-lg"
        >
          <Text className="text-white text-base font-bold">Retour à la connexion</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
          <View className="mb-10">
            <TouchableOpacity onPress={() => router.back()} className="mb-6">
              <Text className="text-primary-600 text-base font-medium">← Retour</Text>
            </TouchableOpacity>

            <Text className="text-4xl font-bold text-gray-800 mb-2">Mot de passe oublié ?</Text>
            <Text className="text-lg text-gray-600">
              Entrez votre email pour recevoir un lien de réinitialisation
            </Text>
          </View>

          {/* Form */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
            <TextInput
              value={email}
              onChangeText={text => {
                setEmail(text);
                setError('');
              }}
              placeholder="exemple@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-gray-100 px-4 py-3 rounded-lg text-base"
            />
            {error ? <Text className="text-red-500 text-sm mt-1">{error}</Text> : null}
          </View>

          {/* Reset Button */}
          <TouchableOpacity
            onPress={handleResetPassword}
            disabled={isLoading}
            className={`py-4 rounded-lg ${isLoading ? 'bg-primary-400' : 'bg-primary-600'}`}
          >
            <Text className="text-white text-center text-base font-bold">
              {isLoading ? 'Envoi...' : 'Envoyer le lien'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
