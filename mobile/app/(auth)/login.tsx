import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
    } else if (password.length < 6) {
      newErrors.password = 'Minimum 6 caractères';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleLogin = async () => {
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      await login({ email, password });
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message :
        typeof err === 'object' && err !== null && 'response' in err
          ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message)
          : undefined;
      Alert.alert(
        'Erreur de connexion',
        message || 'Email ou mot de passe incorrect'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        style={{ backgroundColor: '#ffffff' }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header with gradient accent */}
        <LinearGradient
          colors={['#0284c7', '#0369a1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: insets.top + 40,
            paddingBottom: 60,
            paddingHorizontal: 24,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <FontAwesome name="users" size={32} color="#ffffff" />
            </View>
            <Text style={{ color: '#ffffff', fontSize: 28, fontWeight: '700', marginBottom: 8 }}>
              Bienvenue
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15 }}>
              Connectez-vous à votre compte
            </Text>
          </View>
        </LinearGradient>

        {/* Form Card */}
        <View
          style={{
            flex: 1,
            backgroundColor: '#ffffff',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            marginTop: -32,
            paddingHorizontal: 24,
            paddingTop: 32,
          }}
        >
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
            leftIcon={<FontAwesome name="envelope" size={18} color="#9ca3af" />}
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
            leftIcon={<FontAwesome name="lock" size={20} color="#9ca3af" />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} size={18} color="#9ca3af" />
              </TouchableOpacity>
            }
          />

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            style={{ alignSelf: 'flex-end', marginBottom: 24, marginTop: -8 }}
          >
            <Text style={{ color: '#0284c7', fontSize: 14, fontWeight: '500' }}>
              Mot de passe oublié ?
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <Button
            title="Se connecter"
            onPress={handleLogin}
            loading={isLoading}
            fullWidth
            size="lg"
            iconName="sign-in"
            iconPosition="right"
            style={{ marginBottom: 24 }}
          />

          {/* Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
            <Text style={{ paddingHorizontal: 16, color: '#9ca3af', fontSize: 13 }}>ou</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
          </View>

          {/* Register Link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#6b7280', fontSize: 15 }}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={{ color: '#0284c7', fontSize: 15, fontWeight: '600' }}>S'inscrire</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
