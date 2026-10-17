import { Alert } from '@/services/dialog.service';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Icon, Input } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

const tw = {
  keyboard: 'flex-1',
  scroll: 'bg-white dark:bg-gray-800',
  headerContent: 'items-center',
  logo: 'w-[72px] h-[72px] rounded-full bg-white/20 items-center justify-center mb-5',
  title: 'text-white text-[28px] font-bold mb-2',
  subtitle: 'text-white/85 text-[15px]',
  formCard: 'flex-1 bg-white dark:bg-gray-800 rounded-t-[32px] -mt-8 px-6 pt-8',
  forgotButton: 'self-end mb-6 -mt-2',
  forgotText: 'text-primary-600 text-sm font-medium',
  button: 'mb-6',
  divider: 'flex-row items-center mb-6',
  dividerLine: 'flex-1 h-px bg-gray-200 dark:bg-gray-700',
  dividerText: 'px-4 text-gray-400 text-[13px]',
  register: 'flex-row justify-center items-center',
  registerPrompt: 'text-gray-500 dark:text-gray-300 text-[15px]',
  registerLink: 'text-primary-600 text-[15px] font-semibold',
  bottomSpacing: 'h-10',
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // LinearGradient is not className-aware: layout stays inline with the safe-area inset.
  const headerStyle = { paddingTop: insets.top + 40, paddingBottom: 60, paddingHorizontal: 24 };

  const { login, isLoading, clearError } = useAuthStore();

  const validateForm = () => {
    let valid = true;
    const newErrors = { email: '', password: '' };

    if (!email) {
      newErrors.email = 'Email requis';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email invalide';
      valid = false;
    }

    if (!password) {
      newErrors.password = 'Mot de passe requis';
      valid = false;
    } else if (password.length < 8) {
      newErrors.password = 'Minimum 8 caractères';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      await login({ email, password });
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined;
      Alert.alert('Erreur de connexion', message || 'Email ou mot de passe incorrect');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={tw.keyboard}
    >
      <ScrollView
        contentContainerClassName="grow"
        className={tw.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header with gradient accent */}
        <LinearGradient
          colors={['#0284c7', '#0369a1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={headerStyle}
        >
          <View className={tw.headerContent}>
            <View className={tw.logo}>
              <Icon name="users" size={32} color="#ffffff" />
            </View>
            <Text className={tw.title}>Bienvenue</Text>
            <Text className={tw.subtitle}>Connectez-vous à votre compte</Text>
          </View>
        </LinearGradient>

        {/* Form Card */}
        <View className={tw.formCard}>
          {/* Form */}
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
            leftIcon={<Icon name="envelope" size={18} color="#9ca3af" />}
          />

          <Input
            label="Mot de passe"
            value={password}
            onChangeText={text => {
              setPassword(text);
              setErrors({ ...errors, password: '' });
            }}
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            error={errors.password}
            leftIcon={<Icon name="lock" size={20} color="#9ca3af" />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon name={showPassword ? 'eye-slash' : 'eye'} size={18} color="#9ca3af" />
              </TouchableOpacity>
            }
          />

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            className={tw.forgotButton}
          >
            <Text className={tw.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <View className={tw.button}>
            <Button
              title="Se connecter"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              size="lg"
              iconName="sign-in"
              iconPosition="right"
            />
          </View>

          {/* Divider */}
          <View className={tw.divider}>
            <View className={tw.dividerLine} />
            <Text className={tw.dividerText}>ou</Text>
            <View className={tw.dividerLine} />
          </View>

          {/* Register Link */}
          <View className={tw.register}>
            <Text className={tw.registerPrompt}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text className={tw.registerLink}>S'inscrire</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom spacing */}
          <View className={tw.bottomSpacing} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
