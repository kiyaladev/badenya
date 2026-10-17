import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import authService from '@/services/auth.service';
import { getErrorMessage } from '@/utils/errorHandler';
import { Button, Input, Icon } from '@/components/ui';
import { authForm, authHeaderStyle } from './(auth)/forgot-password';

export default function ResetPassword() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

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
      <View className={authForm.success}>
        <View className={authForm.successIcon}>
          <Icon name="check" size={40} color="#0284c7" />
        </View>
        <Text className={authForm.successTitle}>Mot de passe modifié</Text>
        <Text className={authForm.successText}>Vous pouvez maintenant vous connecter.</Text>
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
      className={authForm.keyboard}
    >
      <ScrollView
        contentContainerClassName="grow"
        className={authForm.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#0284c7', '#0369a1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={authHeaderStyle(insets.top)}
        >
          <View className={authForm.headerContent}>
            <View className={authForm.logo}>
              <Icon name="key" size={30} color="#ffffff" />
            </View>
            <Text className={authForm.title}>Nouveau mot de passe</Text>
            <Text className={authForm.subtitle}>
              Choisissez un mot de passe d'au moins 8 caractères
            </Text>
          </View>
        </LinearGradient>

        <View className={authForm.formCard}>
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
          <View className={authForm.submitButton}>
            <Button title="Enregistrer" onPress={handleSubmit} loading={busy} fullWidth size="lg" />
          </View>
          <View className={authForm.footer}>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text className={authForm.footerText}>Retour à la connexion</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
