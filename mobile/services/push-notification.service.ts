import { Alert } from '@/services/dialog.service';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import SecureStore from './token-storage';
import { getCapabilities } from './capabilities.service';
import notificationService from './notification.service';
import logger from './logger';

const PUSH_TOKEN_KEY = 'pushNotificationToken';

/**
 * Configure notification handler
 * This determines how notifications are displayed when the app is in the foreground
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If permissions haven't been granted yet, request them
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert(
        'Permission requise',
        'Les notifications vous permettent de recevoir des alertes importantes sur vos groupes et transactions.',
        [{ text: 'OK' }]
      );
      return false;
    }

    return true;
  } catch (error) {
    logger.error('PushNotification', 'Error requesting notification permissions', error);
    return false;
  }
};

/**
 * Get push notification token
 * This app uses Expo push tokens. The backend routes Expo tokens to the Expo
 * gateway and native FCM/APNs tokens to Firebase when configured.
 */
export const getPushNotificationToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web' || !(await getCapabilities()).push) return null;
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId ||
      process.env.EXPO_PUBLIC_PROJECT_ID;
    if (!projectId) {
      logger.warn(
        'PushNotification',
        'No EAS projectId configured; push registration is disabled for this build'
      );
      return null;
    }

    // Expo reports unsupported simulators; that failure is handled without a false success.
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    // Get Expo push token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    // Token registered successfully
    return token.data;
  } catch (error) {
    logger.error('PushNotification', 'Error getting push notification token', error);
    return null;
  }
};

/**
 * Register device for push notifications
 */
export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    const token = await getPushNotificationToken();

    if (token) {
      // Register token with backend
      await notificationService.updateDeviceToken(token, Platform.OS);
      await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
    }

    return token;
  } catch (error) {
    logger.error('PushNotification', 'Error registering for push notifications', error);
    return null;
  }
};

/**
 * Unregister device from push notifications
 */
export const unregisterFromPushNotifications = async (): Promise<void> => {
  try {
    const token = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);

    if (token) {
      await notificationService.removeDeviceToken(token);
      await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
    }
  } catch (error) {
    logger.error('PushNotification', 'Error unregistering from push notifications', error);
  } finally {
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
  }
};

/**
 * Schedule a local notification
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  data?: Record<string, unknown>,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string> => {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: trigger || null, // null means show immediately
    });

    return id;
  } catch (error) {
    logger.error('PushNotification', 'Error scheduling local notification', error);
    throw error;
  }
};

/**
 * Cancel a scheduled notification
 */
export const cancelNotification = async (notificationId: string): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    logger.error('PushNotification', 'Error canceling notification', error);
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    logger.error('PushNotification', 'Error canceling all notifications', error);
  }
};

/**
 * Get notification badge count
 */
export const getBadgeCount = async (): Promise<number> => {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    logger.error('PushNotification', 'Error getting badge count', error);
    return 0;
  }
};

/**
 * Set notification badge count
 */
export const setBadgeCount = async (count: number): Promise<void> => {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    logger.error('PushNotification', 'Error setting badge count', error);
  }
};

/**
 * Clear notification badge
 */
export const clearBadge = async (): Promise<void> => {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    logger.error('PushNotification', 'Error clearing badge', error);
  }
};

/**
 * Add notification received listener
 */
export const addNotificationReceivedListener = (
  callback: (notification: Notifications.Notification) => void
) => {
  return Notifications.addNotificationReceivedListener(callback);
};

/**
 * Add notification response listener (when user taps on notification)
 */
export const addNotificationResponseListener = (
  callback: (response: Notifications.NotificationResponse) => void
) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

/**
 * Get all scheduled notifications
 */
export const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    logger.error('PushNotification', 'Error getting scheduled notifications', error);
    return [];
  }
};

export default {
  requestNotificationPermissions,
  getPushNotificationToken,
  registerForPushNotifications,
  unregisterFromPushNotifications,
  scheduleLocalNotification,
  cancelNotification,
  cancelAllNotifications,
  getBadgeCount,
  setBadgeCount,
  clearBadge,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  getScheduledNotifications,
};
