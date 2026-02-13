import { View, Text, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function SplashScreen() {
  const router = useRouter();
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if user is authenticated
        await checkAuth();

        // Wait a bit for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Navigate based on authentication status
        if (isAuthenticated) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/onboarding');
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        // On error, go to onboarding
        router.replace('/(auth)/onboarding');
      }
    };

    initializeApp();
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-primary-600">
      <Text className="text-4xl font-bold text-white mb-4">Badenya</Text>
      <Text className="text-xl text-white mb-8">Épargne Collaborative</Text>
      <ActivityIndicator size="large" color="#ffffff" />
    </View>
  );
}
