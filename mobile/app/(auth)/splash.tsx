import { View, Text, ActivityIndicator } from 'react-native';
import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import logger from '@/services/logger';

export default function SplashScreen() {
  const router = useRouter();
  const { checkAuth } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const initializeApp = async () => {
        try {
          await checkAuth();
          if (!active) return;
          await new Promise(resolve => setTimeout(resolve, 1500));
          if (!active) return;
          router.replace(
            useAuthStore.getState().isAuthenticated ? '/(tabs)' : '/(auth)/onboarding'
          );
        } catch (error) {
          if (!active) return;
          logger.error('Splash', 'Error initializing app', error);
          router.replace('/(auth)/onboarding');
        }
      };
      initializeApp();
      return () => {
        active = false;
      };
    }, [checkAuth, router])
  );

  return (
    <View className="flex-1 items-center justify-center bg-primary-600">
      <Text className="text-4xl font-bold text-white mb-4">Badenya</Text>
      <Text className="text-xl text-white mb-8">Épargne Collaborative</Text>
      <ActivityIndicator size="large" color="#ffffff" />
    </View>
  );
}
