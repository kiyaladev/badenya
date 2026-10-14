import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import authService from '@/services/auth.service';
import { getErrorMessage } from '@/utils/errorHandler';
import { themedStyles } from '@/utils/themedStyles';
import { useThemeStore } from '@/store/themeStore';
import { Button, Input, Icon } from '@/components/ui';
import { authFormStyles } from './(auth)/forgot-password';

export default function ResetPassword() {
  const styles = themedStyles(
    authFormStyles,
    useThemeStore(state => state.colors)
  );
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const headerStyle: ViewStyle = { ...styles.header, paddingTop: insets.top + 20 };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!token) return setError('Lien invalide. Demandez un nouveau lien.');
    if (password.length < 8) return setError('Huit caractères minimum.');
    if (password !== confirm) return setError('Les mots de passe ne correspondent pas.');
    setError('');
    setBusy(true);
    try {
      await authService.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <View style={styles.success}>
        <View style={styles.successIcon}>
          <Icon name="check" size={40} color="#0284c7" />
        </View>
        <Text style={styles.successTitle}>Mot de passe modifié</Text>
        <Text style={styles.successText}>Vous pouvez maintenant vous connecter.</Text>
        <Button
          title="Se connecter"
          onPress={() => router.replace('/(auth)/login')}
          fullWidth
          size="lg"
        />
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
        <LinearGradient
          colors={['#0284c7', '#0369a1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={headerStyle}
        >
          <View style={styles.headerContent}>
            <View style={styles.logo}>
              <Icon name="key" size={30} color="#ffffff" />
            </View>
            <Text style={styles.title}>Nouveau mot de passe</Text>
            <Text style={styles.subtitle}>Choisissez un mot de passe d'au moins 8 caractères</Text>
          </View>
        </LinearGradient>

        <View style={styles.formCard}>
          <Input
            label="Nouveau mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon={<Icon name="lock" size={18} color="#9ca3af" />}
          />
          <Input
            label="Confirmer le mot de passe"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            error={error}
            leftIcon={<Icon name="lock" size={18} color="#9ca3af" />}
          />
          <Button
            title="Enregistrer"
            onPress={handleSubmit}
            loading={busy}
            fullWidth
            size="lg"
            style={styles.submitButton}
          />
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.footerText}>Retour à la connexion</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
