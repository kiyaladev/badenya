import { Alert } from '@/services/dialog.service';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import authService from '@/services/auth.service';
import { Button, Input, Icon } from '@/components/ui';

// Shared NativeWind classes for the auth form screens (also used by reset-password).
export const authForm = {
  success: 'flex-1 bg-white dark:bg-gray-800 px-6 justify-center items-center',
  successIcon: 'w-[88px] h-[88px] rounded-full bg-blue-100 items-center justify-center mb-6',
  successTitle: 'text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2.5',
  successText: 'text-[15px] text-gray-500 dark:text-gray-300 text-center mb-8 leading-[22px]',
  keyboard: 'flex-1',
  scroll: 'bg-white dark:bg-gray-800',
  backButton: 'flex-row items-center self-start py-2 px-3 rounded-full bg-white/20 mb-5',
  backText: 'text-white text-[13px] font-semibold',
  headerContent: 'items-center',
  logo: 'w-[72px] h-[72px] rounded-full bg-white/20 items-center justify-center mb-4',
  title: 'text-white text-[26px] font-bold mb-1.5',
  subtitle: 'text-white/85 text-sm text-center',
  formCard: 'flex-1 bg-white dark:bg-gray-800 rounded-t-[32px] -mt-8 px-6 pt-8',
  description: 'text-sm text-gray-500 dark:text-gray-300 mb-5 leading-5',
  submitButton: 'mt-2 mb-6',
  footer: 'items-center',
  footerText: 'text-primary-600 text-sm font-semibold',
};

// LinearGradient is not className-aware: keep its layout inline (with the safe-area inset).
export const authHeaderStyle = (top: number) => ({
  paddingTop: top + 20,
  paddingBottom: 56,
  paddingHorizontal: 24,
});

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const validateEmail = () => {
    if (!email) {
      setError('Email requis');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email invalide');
      return false;
    }
    setError('');
    return true;
  };

  const handleResetPassword = async () => {
    Keyboard.dismiss();
    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setEmailSent(true);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      Alert.alert(
        'Erreur',
        errorObj.response?.data?.message || 'Une erreur est survenue. Veuillez réessayer.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <View className={authForm.success}>
        <View className={authForm.successIcon}>
          <Icon name="envelope-open" size={40} color="#0284c7" />
        </View>
        <Text className={authForm.successTitle}>Demande prise en compte</Text>
        <Text className={authForm.successText}>
          Si un compte correspond, votre demande a été prise en compte. Si aucun email n’arrive,
          réessayez plus tard.
        </Text>
        <Button title="Retour à la connexion" onPress={() => router.back()} fullWidth size="lg" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={authForm.keyboard}
    >
      <ScrollView
        contentContainerClassName="grow"
        className={authForm.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header with gradient accent */}
        <LinearGradient
          colors={['#0284c7', '#0369a1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={authHeaderStyle(insets.top)}
        >
          <TouchableOpacity onPress={() => router.back()} className={authForm.backButton}>
            <View className="mr-1.5">
              <Icon name="arrow-left" size={14} color="#ffffff" />
            </View>
            <Text className={authForm.backText}>Retour</Text>
          </TouchableOpacity>

          <View className={authForm.headerContent}>
            <View className={authForm.logo}>
              <Icon name="key" size={30} color="#ffffff" />
            </View>
            <Text className={authForm.title}>Mot de passe oublié ?</Text>
            <Text className={authForm.subtitle}>Recevez un lien de réinitialisation sécurisé</Text>
          </View>
        </LinearGradient>

        {/* Form Card */}
        <View className={authForm.formCard}>
          <Text className={authForm.description}>
            Entrez l'adresse email associée à votre compte Badenya pour recevoir les instructions de
            réinitialisation.
          </Text>

          <Input
            label="Adresse email"
            value={email}
            onChangeText={text => {
              setEmail(text);
              setError('');
            }}
            placeholder="exemple@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={error}
            leftIcon={<Icon name="envelope" size={18} color="#9ca3af" />}
          />

          <View className={authForm.submitButton}>
            <Button
              title="Envoyer le lien"
              onPress={handleResetPassword}
              loading={isLoading}
              fullWidth
              size="lg"
              iconName="paper-plane"
              iconPosition="right"
            />
          </View>

          <View className={authForm.footer}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className={authForm.footerText}>Retour à la connexion</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
