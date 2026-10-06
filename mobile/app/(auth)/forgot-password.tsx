import { Alert } from '@/services/dialog.service';
import { themedStyles } from '@/utils/themedStyles';
import { useThemeStore } from '@/store/themeStore';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import authService from '@/services/auth.service';
import { Button, Input, Icon } from '@/components/ui';

const baseStyles = StyleSheet.create({
  success: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  successText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 20,
  },
  backIcon: {
    marginRight: 6,
  },
  backText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
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
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    textAlign: 'center',
  },
  formCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default function ForgotPasswordScreen() {
  const styles = themedStyles(
    baseStyles,
    useThemeStore(state => state.colors)
  );
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerStyle: ViewStyle = {
    ...styles.header,
    paddingTop: insets.top + 20,
  };

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
      <View style={styles.success}>
        <View style={styles.successIcon}>
          <Icon name="envelope-open" size={40} color="#0284c7" />
        </View>
        <Text style={styles.successTitle}>Demande prise en compte</Text>
        <Text style={styles.successText}>
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={14} color="#ffffff" style={styles.backIcon} />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <View style={styles.logo}>
              <Icon name="key" size={30} color="#ffffff" />
            </View>
            <Text style={styles.title}>Mot de passe oublié ?</Text>
            <Text style={styles.subtitle}>Recevez un lien de réinitialisation sécurisé</Text>
          </View>
        </LinearGradient>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.description}>
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

          <Button
            title="Envoyer le lien"
            onPress={handleResetPassword}
            loading={isLoading}
            fullWidth
            size="lg"
            iconName="paper-plane"
            iconPosition="right"
            style={styles.submitButton}
          />

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.footerText}>Retour à la connexion</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
