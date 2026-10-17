import { Alert } from '@/services/dialog.service';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableOpacity,
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
  logo: 'w-[72px] h-[72px] rounded-full bg-white/20 items-center justify-center mb-4',
  title: 'text-white text-[28px] font-bold mb-1.5',
  subtitle: 'text-white/85 text-[15px]',
  formCard: 'flex-1 bg-white dark:bg-gray-800 rounded-t-[32px] -mt-8 px-6 pt-7',
  button: 'mt-2 mb-5',
  loginLink: 'flex-row justify-center items-center mb-8',
  loginPrompt: 'text-gray-500 dark:text-gray-300 text-[15px]',
  loginText: 'text-primary-600 text-[15px] font-semibold',
};

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { register, isLoading, clearError } = useAuthStore();
  // LinearGradient is not className-aware: layout stays inline with the safe-area inset.
  const headerStyle = { paddingTop: insets.top + 32, paddingBottom: 56, paddingHorizontal: 24 };

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
    } else if (!/^[0-9+\s-]{8,}$/.test(phone)) {
      newErrors.phone = 'Numéro invalide (minimum 8 chiffres)';
      valid = false;
    }

    if (!password) {
      newErrors.password = 'Mot de passe requis';
      valid = false;
    } else if (password.length < 8) {
      newErrors.password = 'Minimum 8 caractères';
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
    Keyboard.dismiss();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined;
      Alert.alert("Erreur d'inscription", message || 'Une erreur est survenue');
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
              <Icon name="user-plus" size={30} color="#ffffff" />
            </View>
            <Text className={tw.title}>Créer un compte</Text>
            <Text className={tw.subtitle}>Rejoignez Badenya dès aujourd'hui</Text>
          </View>
        </LinearGradient>

        {/* Form Card */}
        <View className={tw.formCard}>
          <Input
            label="Nom complet"
            value={fullName}
            onChangeText={text => {
              setFullName(text);
              setErrors({ ...errors, fullName: '' });
            }}
            placeholder="Jean Dupont"
            error={errors.fullName}
            leftIcon={<Icon name="user" size={18} color="#9ca3af" />}
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
            leftIcon={<Icon name="envelope" size={18} color="#9ca3af" />}
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
            leftIcon={<Icon name="phone" size={18} color="#9ca3af" />}
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

          <Input
            label="Confirmer le mot de passe"
            value={confirmPassword}
            onChangeText={text => {
              setConfirmPassword(text);
              setErrors({ ...errors, confirmPassword: '' });
            }}
            placeholder="••••••••"
            secureTextEntry={!showConfirmPassword}
            error={errors.confirmPassword}
            leftIcon={<Icon name="lock" size={20} color="#9ca3af" />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Icon name={showConfirmPassword ? 'eye-slash' : 'eye'} size={18} color="#9ca3af" />
              </TouchableOpacity>
            }
          />

          {/* Register Button */}
          <View className={tw.button}>
            <Button
              title="S'inscrire"
              onPress={handleRegister}
              loading={isLoading}
              fullWidth
              size="lg"
              iconName="check"
              iconPosition="right"
            />
          </View>

          {/* Login Link */}
          <View className={tw.loginLink}>
            <Text className={tw.loginPrompt}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className={tw.loginText}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
