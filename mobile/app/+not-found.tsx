import { Stack, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';
import { Icon } from '@/components/ui';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Page introuvable', headerShown: true }} />
      <View className="flex-1 items-center justify-center p-6 bg-slate-50 dark:bg-gray-800">
        <View className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center mb-5">
          <Icon name="compass" size={56} color="#0284c7" />
        </View>

        <Text className="text-[22px] font-bold text-gray-900 dark:text-gray-50 mb-2">
          Page introuvable
        </Text>
        <Text className="text-[15px] text-gray-500 dark:text-gray-300 text-center mb-7 leading-[22px] px-4">
          L'écran que vous recherchez n'existe pas ou a été déplacé.
        </Text>

        <TouchableOpacity
          className="flex-row items-center justify-center bg-primary-600 py-3.5 px-6 rounded-xl shadow-md"
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.8}
        >
          <View className="mr-2">
            <Icon name="home" size={18} color="#ffffff" />
          </View>
          <Text className="text-white text-base font-semibold">Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}
