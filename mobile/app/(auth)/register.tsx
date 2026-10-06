import { Alert } from '@/services/dialog.service';
import { themedStyles } from '@/utils/themedStyles';
import { useThemeStore } from '@/store/themeStore';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Icon, Input } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

const baseStyles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  scroll: {
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingBottom: 56,
    paddingHorizontal: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
  },
  formCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  button: {
    marginTop: 8,
    marginBottom: 20,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  loginPrompt: {
    color: '#6b7280',
    fontSize: 15,
  },
  loginText: {
    color: '#0284c7',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default function RegisterScreen() {
  const styles = themedStyles(
    baseStyles,
    useThemeStore(state => state.colors)
  );
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
  const headerStyle: ViewStyle = {
    ...styles.header,
    paddingTop: insets.top + 32,
  };

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
      style={styles.keyboard}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={styles.scroll}
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
          <View style={styles.headerContent}>
            <View style={styles.logo}>
              <Icon name="user-plus" size={30} color="#ffffff" />
            </View>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>Rejoignez Badenya dès aujourd'hui</Text>
          </View>
        </LinearGradient>

        {/* Form Card */}
        <View style={styles.formCard}>
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
          <Button
            title="S'inscrire"
            onPress={handleRegister}
            loading={isLoading}
            fullWidth
            size="lg"
            iconName="check"
            iconPosition="right"
            style={styles.button}
          />

          {/* Login Link */}
          <View style={styles.loginLink}>
            <Text style={styles.loginPrompt}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginText}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
