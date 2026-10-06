import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';
import api from '@/services/api';
import { getErrorMessage } from '@/utils/errorHandler';
export default function Unsubscribe() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <View className="flex-1 justify-center p-6 bg-white dark:bg-gray-900">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Se désabonner de la newsletter
      </Text>
      <Text className="text-gray-700 dark:text-gray-200 mb-4">
        Confirmez pour ne plus recevoir la newsletter Badenya.
      </Text>
      {message && (
        <Text accessibilityRole="alert" className="text-gray-700 dark:text-gray-200 mb-4">
          {message}
        </Text>
      )}
      <TouchableOpacity
        disabled={busy || done || !token}
        className="bg-primary-600 rounded-lg p-4"
        onPress={async () => {
          setBusy(true);
          try {
            await api.post('/contact/newsletter/unsubscribe', { token });
            setDone(true);
            setMessage('Votre désabonnement est confirmé.');
          } catch (error) {
            setMessage(getErrorMessage(error));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Text className="text-white text-center">
          {done ? 'Désabonné' : busy ? 'En cours…' : 'Confirmer le désabonnement'}
        </Text>
      </TouchableOpacity>
      {!token && (
        <Text className="text-red-600 mt-4">
          Lien invalide : utilisez le lien présent dans votre email.
        </Text>
      )}
    </View>
  );
}
