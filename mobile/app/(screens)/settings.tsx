import { Alert } from '@/services/dialog.service';
import { getCapabilities, Capabilities } from '@/services/capabilities.service';
import { View, Text, ScrollView, TouchableOpacity, Switch, Linking } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore, ThemeMode } from '@/store/themeStore';
import pushNotificationService from '@/services/push-notification.service';
import authService from '@/services/auth.service';
import biometricService from '@/services/biometric.service';
import logger from '@/services/logger';
import { Icon } from '@/components/ui';

const settingsIconStyle = { marginRight: 12 };

export default function SettingsScreen() {
  const [capabilities, setCapabilities] = useState<Capabilities>({
    ai: false,
    push: false,
    email: false,
  });
  useEffect(() => {
    getCapabilities().then(setCapabilities);
  }, []);
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();
  const { mode: themeMode, setTheme } = useThemeStore();

  // Settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  // Biometric state
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricName, setBiometricName] = useState('Biométrie');

  useEffect(() => {
    (async () => {
      const available = await biometricService.isBiometricAvailable();
      setBiometricsAvailable(available);
      if (available) {
        const name = await biometricService.getBiometricName();
        setBiometricName(name);
        const enabled = await biometricService.isBiometricLoginEnabled();
        setBiometricsEnabled(enabled);
      }
    })();
  }, []);

  useEffect(() => {
    const preferences = user?.preferences;
    if (!preferences) return;
    setEmailNotifications(preferences.notifications?.email !== false);
    setPushNotifications(preferences.notifications?.push !== false);
    if (preferences.theme) setTheme(preferences.theme as ThemeMode);
  }, [setTheme, user?.preferences]);

  const persistPreferences = async (preferences: {
    language?: 'fr' | 'en' | 'ar';
    theme?: ThemeMode;
    notifications?: { push?: boolean; email?: boolean };
  }) => {
    const current = user?.preferences;
    await updateProfile({
      preferences: {
        ...current,
        ...preferences,
        notifications: {
          ...current?.notifications,
          ...preferences.notifications,
        },
      },
    });
  };

  // Sync dark mode with theme store
  const isDarkMode = themeMode === 'dark';

  const handleDarkModeToggle = () => {
    const nextMode: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
    setTheme(nextMode);
    persistPreferences({ theme: nextMode }).catch(() => {
      Alert.alert('Erreur', 'Le thème local a été modifié, mais la synchronisation a échoué.');
    });
  };

  const handleEmailNotificationsToggle = (value: boolean) => {
    setEmailNotifications(value);
    persistPreferences({ notifications: { email: value } }).catch(() => {
      setEmailNotifications(!value);
      Alert.alert('Erreur', 'Impossible de sauvegarder les notifications email.');
    });
  };

  const handlePushNotificationsToggle = async (value: boolean) => {
    try {
      if (value) {
        // Request permissions and register
        const hasPermission = await pushNotificationService.requestNotificationPermissions();

        if (hasPermission) {
          const token = await pushNotificationService.registerForPushNotifications();
          if (!token) {
            setPushNotifications(false);
            Alert.alert(
              'Configuration requise',
              'Les notifications push seront disponibles après la configuration du projet Expo.'
            );
            return;
          }
          setPushNotifications(true);
          await persistPreferences({ notifications: { push: true } });
          Alert.alert('Succès', 'Les notifications push sont activées');
        } else {
          Alert.alert(
            'Permission refusée',
            'Veuillez activer les notifications dans les paramètres de votre appareil'
          );
        }
      } else {
        // Unregister from notifications
        await pushNotificationService.unregisterFromPushNotifications();
        setPushNotifications(false);
        await persistPreferences({ notifications: { push: false } });
      }
    } catch (error) {
      logger.error('Settings', 'Error toggling push notifications', error);
      Alert.alert('Erreur', 'Impossible de modifier les paramètres de notification');
    }
  };

  const handleChangePassword = () => {
    router.push('/(screens)/change-password');
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const auth = await biometricService.authenticate(
        `Activez ${biometricName} pour sécuriser votre compte`
      );
      if (auth.success) {
        setBiometricsEnabled(true);
        await biometricService.setBiometricLoginEnabled(true);
        Alert.alert('Sécurité activée', `${biometricName} a été configurée avec succès.`);
      } else {
        Alert.alert(
          'Échec de validation',
          auth.error || 'Vérification biométrique impossible ou annulée.'
        );
      }
    } else {
      setBiometricsEnabled(false);
      await biometricService.setBiometricLoginEnabled(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes vos données seront supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.deleteAccount();
              router.replace('/(auth)/login');
            } catch (error) {
              logger.error('Settings', 'Error deleting account', error);
              Alert.alert('Erreur', 'Impossible de supprimer le compte. Veuillez réessayer.');
            }
          },
        },
      ]
    );
  };

  const openExternalPage = async (url: string, title: string) => {
    try {
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Lien indisponible', `Impossible d'ouvrir ${title.toLowerCase()}.`);
      }
    } catch {
      Alert.alert('Erreur', `Impossible d'ouvrir ${title.toLowerCase()}.`);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        {/* Security Section */}
        <View className="mb-6">
          <Text className="text-gray-600 dark:text-gray-300 text-sm font-semibold mb-3 px-2">
            SÉCURITÉ
          </Text>
          <View className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
            <TouchableOpacity
              className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700"
              onPress={handleChangePassword}
            >
              <View className="flex-row items-center">
                <Icon name="lock" size={20} color="#6b7280" style={settingsIconStyle} />
                <Text className="text-gray-800 dark:text-gray-100 text-base">
                  Changer le mot de passe
                </Text>
              </View>
              <Icon name="chevron-right" size={14} color="#9ca3af" />
            </TouchableOpacity>

            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center flex-1 pr-2">
                <Icon name="shield" size={20} color="#10b981" style={settingsIconStyle} />
                <View className="flex-1">
                  <Text className="text-gray-800 dark:text-gray-100 text-base">
                    {biometricName}
                  </Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-xs">
                    {biometricsAvailable
                      ? 'Connexion sécurisée par empreinte ou reconnaissance faciale'
                      : 'Non supporté sur cet appareil'}
                  </Text>
                </View>
              </View>
              <Switch
                value={biometricsEnabled}
                disabled={!biometricsAvailable}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View className="mb-6">
          <Text className="text-gray-600 dark:text-gray-300 text-sm font-semibold mb-3 px-2">
            NOTIFICATIONS
          </Text>
          <View className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
            <View className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
              <View className="flex-row items-center flex-1">
                <Icon name="envelope" size={20} color="#10b981" style={settingsIconStyle} />
                <Text className="text-gray-800 dark:text-gray-100 text-base">
                  Notifications email
                </Text>
              </View>
              <Switch
                value={capabilities.email && emailNotifications}
                disabled={!capabilities.email}
                onValueChange={handleEmailNotificationsToggle}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor="#ffffff"
              />
            </View>

            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center flex-1">
                <Icon name="mobile" size={20} color="#0284c7" style={settingsIconStyle} />
                <Text className="text-gray-800 dark:text-gray-100 text-base">
                  Notifications push
                </Text>
              </View>
              <Switch
                value={capabilities.push && pushNotifications}
                disabled={!capabilities.push}
                onValueChange={handlePushNotificationsToggle}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View className="mb-6">
          <Text className="text-gray-600 dark:text-gray-300 text-sm font-semibold mb-3 px-2">
            PRÉFÉRENCES
          </Text>
          <View className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center flex-1">
                <Icon name="moon-o" size={20} color="#6366f1" style={settingsIconStyle} />
                <Text className="text-gray-800 dark:text-gray-100 text-base">Mode sombre</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={handleDarkModeToggle}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* About Section */}
        <View className="mb-6">
          <Text className="text-gray-600 dark:text-gray-300 text-sm font-semibold mb-3 px-2">
            À PROPOS
          </Text>
          <View className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
            <TouchableOpacity
              className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700"
              onPress={() =>
                openExternalPage(
                  process.env.EXPO_PUBLIC_TERMS_URL || 'https://badenya.naimba.com/terms',
                  "les conditions d'utilisation"
                )
              }
            >
              <View className="flex-row items-center">
                <Icon name="file-text-o" size={20} color="#6b7280" style={settingsIconStyle} />
                <Text className="text-gray-800 dark:text-gray-100 text-base">
                  Conditions d'utilisation
                </Text>
              </View>
              <Icon name="chevron-right" size={14} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700"
              onPress={() =>
                openExternalPage(
                  process.env.EXPO_PUBLIC_PRIVACY_URL || 'https://badenya.naimba.com/privacy',
                  'la politique de confidentialité'
                )
              }
            >
              <View className="flex-row items-center">
                <Icon name="shield" size={20} color="#6b7280" style={settingsIconStyle} />
                <Text className="text-gray-800 dark:text-gray-100 text-base">
                  Politique de confidentialité
                </Text>
              </View>
              <Icon name="chevron-right" size={14} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700"
              onPress={() =>
                openExternalPage(
                  process.env.EXPO_PUBLIC_SUPPORT_URL || 'mailto:support@badenya.app',
                  'le support'
                )
              }
            >
              <View className="flex-row items-center">
                <Icon name="question-circle" size={20} color="#0ea5e9" style={settingsIconStyle} />
                <Text className="text-gray-800 dark:text-gray-100 text-base">Aide & Support</Text>
              </View>
              <Icon name="chevron-right" size={14} color="#9ca3af" />
            </TouchableOpacity>

            <View className="p-4">
              <View className="flex-row items-center">
                <Icon name="info-circle" size={20} color="#6b7280" style={settingsIconStyle} />
                <Text className="text-gray-800 dark:text-gray-100 text-base">Version</Text>
              </View>
              <Text className="text-gray-600 dark:text-gray-300 text-sm mt-1 ml-11">1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Account */}
        <View className="mb-8">
          <Text className="text-gray-600 dark:text-gray-300 text-sm font-semibold mb-3 px-2">
            COMPTE
          </Text>
          <View className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
            <TouchableOpacity className="p-4" onPress={handleDeleteAccount}>
              <View className="flex-row items-center">
                <Icon name="trash" size={20} color="#dc2626" style={settingsIconStyle} />
                <Text className="text-red-600 text-base">Supprimer mon compte</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
