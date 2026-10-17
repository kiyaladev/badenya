import { notificationRoute } from '@/utils/notificationRoute';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { AppState, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import '../global.css';
import type { EventSubscription } from 'expo-modules-core';

import { useColorScheme as useSystemColorScheme } from '@/components/useColorScheme';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { Icon } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useOfflineStore } from '@/store/offlineStore';
import { useThemeStore } from '@/store/themeStore';
import pushNotificationService from '@/services/push-notification.service';
import offlineService from '@/services/offline.service';
import logger from '@/services/logger';
import { validateEnv } from '@/utils/validateEnv';

validateEnv();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  syncBanner: {
    paddingBottom: 6,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  bannerIcon: {
    marginRight: 8,
  },
  bannerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});

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
  const systemColorScheme = useSystemColorScheme();
  const { mode: themeMode, setTheme } = useThemeStore();
  const { setColorScheme } = useNativeWindColorScheme();
  const colorScheme = themeMode === 'auto' ? systemColorScheme : themeMode;
  const router = useRouter();
  const { isAuthenticated, checkAuth, user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { isConnected, setConnected } = useOfflineStore();
  const offlineBannerStyle: ViewStyle = {
    ...styles.syncBanner,
    paddingTop: insets.top + 4,
    backgroundColor: '#f59e0b',
  };
  useEffect(() => {
    setColorScheme(themeMode === 'auto' ? 'system' : themeMode);
  }, [setColorScheme, themeMode]);

  const notificationListener = useRef<EventSubscription | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);

  useEffect(() => {
    const preference = user?.preferences?.theme;
    if (preference) setTheme(preference);
  }, [user?.preferences?.theme, setTheme]);

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = offlineService.onConnectivityChange(connected => {
      setConnected(connected);
      logger.info('Layout', `Network ${connected ? 'online' : 'offline'}`);
    });
    return unsubscribe;
  }, [setConnected]);

  // Check auth status when app returns to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && isAuthenticated) {
        checkAuth().catch(() => {
          // Token expired or invalid — user will be logged out by checkAuth
        });
      }
    });
    return () => subscription.remove();
  }, [isAuthenticated, checkAuth, user]);

  useEffect(() => {
    // Register for push notifications when user is authenticated
    if (isAuthenticated && user?.preferences?.notifications?.push !== false) {
      pushNotificationService
        .registerForPushNotifications()
        .catch(err => logger.error('Layout', 'Failed to register push notifications', err));
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

      const target = notificationRoute(data);
      if (target) router.push(target as Parameters<typeof router.push>[0]);
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
  }, [isAuthenticated, user?.preferences?.notifications?.push]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={styles.root}>
        {!isConnected && (
          <View style={offlineBannerStyle}>
            <Icon name="exclamation-triangle" size={14} color="#ffffff" style={styles.bannerIcon} />
            <Text style={styles.bannerText}>
              Mode hors-ligne — Consultation des données enregistrées ; une connexion est nécessaire
              pour modifier
            </Text>
          </View>
        )}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(screens)" />
        </Stack>
      </View>
    </ThemeProvider>
  );
}
