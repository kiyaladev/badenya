import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import 'react-native-reanimated';
import '../global.css';
import type { Subscription } from 'expo-modules-core';

import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '@/store/authStore';
import { useOfflineStore } from '@/store/offlineStore';
import pushNotificationService from '@/services/push-notification.service';
import offlineService from '@/services/offline.service';
import logger from '@/services/logger';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(auth)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { setConnected } = useOfflineStore();

  const notificationListener = useRef<Subscription | null>(null);
  const responseListener = useRef<Subscription | null>(null);

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = offlineService.onConnectivityChange((connected) => {
      setConnected(connected);
      logger.info('Layout', `Network ${connected ? 'online' : 'offline'}`);
    });
    return unsubscribe;
  }, [setConnected]);

  // Check auth status when app returns to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && isAuthenticated) {
        checkAuth().catch(() => {
          // Token expired or invalid — user will be logged out by checkAuth
        });
      }
    });
    return () => subscription.remove();
  }, [isAuthenticated, checkAuth]);

  useEffect(() => {
    // Register for push notifications when user is authenticated
    if (isAuthenticated) {
      pushNotificationService.registerForPushNotifications().catch((err) => logger.error('Layout', 'Failed to register push notifications', err));
    }

    // Setup notification listeners
    notificationListener.current = pushNotificationService.addNotificationReceivedListener(
      _notification => {
        // Notification received in foreground
        // You can handle the notification here if needed
      }
    );

    responseListener.current = pushNotificationService.addNotificationResponseListener(response => {
      // Notification tapped by user

      // Navigate to relevant screen based on notification data
      const data = response.notification.request.content.data;

      if (data.groupId) {
        router.push(`/(screens)/group-details?id=${data.groupId}`);
      } else if (data.proposalId) {
        router.push(`/(screens)/proposal-details?id=${data.proposalId}`);
      } else if (data.transactionId) {
        router.push(`/(screens)/transaction-details?id=${data.transactionId}`);
      }
    });

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
