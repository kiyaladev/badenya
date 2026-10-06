import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import authService from '@/services/auth.service';
import { getErrorMessage } from '@/utils/errorHandler';
export default function ResetPassword() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <View className="flex-1 justify-center bg-gray-50 dark:bg-gray-900 p-6">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-5">
        Réinitialiser le mot de passe
      </Text>
      <TextInput
        accessibilityLabel="Nouveau mot de passe"
        placeholder="Nouveau mot de passe"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        className="bg-white dark:bg-gray-800 dark:text-white rounded-lg p-4 mb-3"
      />
      <TextInput
        accessibilityLabel="Confirmer le mot de passe"
        placeholder="Confirmer le mot de passe"
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
        className="bg-white dark:bg-gray-800 dark:text-white rounded-lg p-4 mb-3"
      />
      {message ? (
        <Text accessibilityRole="alert" className="text-gray-800 dark:text-white mb-3">
          {message}
        </Text>
      ) : null}
      <TouchableOpacity
        disabled={busy}
        className="bg-primary-600 p-4 rounded-lg"
        onPress={async () => {
          if (!token) return setMessage('Lien invalide. Demandez un nouveau lien.');
          if (password.length < 8 || password !== confirm)
            return setMessage(
              'Saisissez deux mots de passe identiques de huit caractères au minimum.'
            );
          setBusy(true);
          try {
            await authService.resetPassword(token, password);
            setMessage('Mot de passe modifié. Vous pouvez vous connecter.');
          } catch (error) {
            setMessage(getErrorMessage(error));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Text className="text-white text-center font-bold">
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity className="p-4" onPress={() => router.replace('/(auth)/login')}>
        <Text className="text-primary-600 text-center">Connexion</Text>
      </TouchableOpacity>
    </View>
  );
}
