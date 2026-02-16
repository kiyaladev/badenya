import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import pushNotificationService from '@/services/push-notification.service';
import authService from '@/services/auth.service';
import logger from '@/services/logger';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { mode: themeMode, toggleTheme } = useThemeStore();

  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [language, setLanguage] = useState('fr');

  // Sync dark mode with theme store
  const isDarkMode = themeMode === 'dark';

  const handleDarkModeToggle = () => {
    toggleTheme();
  };

  const handlePushNotificationsToggle = async (value: boolean) => {
    try {
      if (value) {
        // Request permissions and register
        const hasPermission = await pushNotificationService.requestNotificationPermissions();

        if (hasPermission) {
          await pushNotificationService.registerForPushNotifications();
          setPushNotifications(true);
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
      }
    } catch (error) {
      logger.error('Settings', 'Error toggling push notifications', error);
      Alert.alert('Erreur', 'Impossible de modifier les paramètres de notification');
    }
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            router.replace('/(auth)/login');
          } catch {
            Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion');
          }
        },
      },
    ]);
  };

  const handleChangePassword = () => {
    router.push('/(screens)/change-password');
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

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Account Section */}
        <View className="mb-6">
          <Text className="text-gray-600 text-sm font-semibold mb-3 px-2">COMPTE</Text>
          <View className="bg-white rounded-xl overflow-hidden">
            <TouchableOpacity
              className="flex-row items-center justify-between p-4 border-b border-gray-100"
              onPress={() => router.push('/(tabs)/profile')}
            >
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">👤</Text>
                <Text className="text-gray-800 text-base">Mon profil</Text>
              </View>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-between p-4"
              onPress={handleChangePassword}
            >
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">🔒</Text>
                <Text className="text-gray-800 text-base">Changer le mot de passe</Text>
              </View>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Section */}
        <View className="mb-6">
          <Text className="text-gray-600 text-sm font-semibold mb-3 px-2">NOTIFICATIONS</Text>
          <View className="bg-white rounded-xl overflow-hidden">
            <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
              <View className="flex-row items-center flex-1">
                <Text className="text-2xl mr-3">🔔</Text>
                <Text className="text-gray-800 text-base">Activer les notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor="#ffffff"
              />
            </View>

            {notificationsEnabled && (
              <>
                <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
                  <View className="flex-row items-center flex-1">
                    <Text className="text-2xl mr-3">📧</Text>
                    <Text className="text-gray-800 text-base">Notifications email</Text>
                  </View>
                  <Switch
                    value={emailNotifications}
                    onValueChange={setEmailNotifications}
                    trackColor={{ false: '#d1d5db', true: '#10b981' }}
                    thumbColor="#ffffff"
                  />
                </View>

                <View className="flex-row items-center justify-between p-4">
                  <View className="flex-row items-center flex-1">
                    <Text className="text-2xl mr-3">📱</Text>
                    <Text className="text-gray-800 text-base">Notifications push</Text>
                  </View>
                  <Switch
                    value={pushNotifications}
                    onValueChange={handlePushNotificationsToggle}
                    trackColor={{ false: '#d1d5db', true: '#10b981' }}
                    thumbColor="#ffffff"
                  />
                </View>
              </>
            )}
          </View>
        </View>

        {/* Preferences Section */}
        <View className="mb-6">
          <Text className="text-gray-600 text-sm font-semibold mb-3 px-2">PRÉFÉRENCES</Text>
          <View className="bg-white rounded-xl overflow-hidden">
            <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
              <View className="flex-row items-center flex-1">
                <Text className="text-2xl mr-3">🌙</Text>
                <Text className="text-gray-800 text-base">Mode sombre</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={handleDarkModeToggle}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor="#ffffff"
              />
            </View>

            <TouchableOpacity
              className="flex-row items-center justify-between p-4"
              onPress={() => {
                Alert.alert('Langue', 'Sélectionnez votre langue', [
                  {
                    text: 'Français',
                    onPress: () => setLanguage('fr'),
                  },
                  {
                    text: 'English',
                    onPress: () => setLanguage('en'),
                  },
                  { text: 'Annuler', style: 'cancel' },
                ]);
              }}
            >
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">🌍</Text>
                <Text className="text-gray-800 text-base">Langue</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-gray-600 mr-2">
                  {language === 'fr' ? 'Français' : 'English'}
                </Text>
                <Text className="text-gray-400">›</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View className="mb-6">
          <Text className="text-gray-600 text-sm font-semibold mb-3 px-2">À PROPOS</Text>
          <View className="bg-white rounded-xl overflow-hidden">
            <TouchableOpacity
              className="flex-row items-center justify-between p-4 border-b border-gray-100"
              onPress={() => Alert.alert('À venir', 'Cette fonctionnalité sera bientôt disponible')}
            >
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">📄</Text>
                <Text className="text-gray-800 text-base">Conditions d'utilisation</Text>
              </View>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-between p-4 border-b border-gray-100"
              onPress={() => Alert.alert('À venir', 'Cette fonctionnalité sera bientôt disponible')}
            >
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">🔐</Text>
                <Text className="text-gray-800 text-base">Politique de confidentialité</Text>
              </View>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-between p-4 border-b border-gray-100"
              onPress={() => Alert.alert('À venir', 'Cette fonctionnalité sera bientôt disponible')}
            >
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">❓</Text>
                <Text className="text-gray-800 text-base">Aide & Support</Text>
              </View>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>

            <View className="p-4">
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">ℹ️</Text>
                <Text className="text-gray-800 text-base">Version</Text>
              </View>
              <Text className="text-gray-600 text-sm mt-1 ml-11">1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View className="mb-8">
          <Text className="text-gray-600 text-sm font-semibold mb-3 px-2">ZONE DANGEREUSE</Text>
          <View className="bg-white rounded-xl overflow-hidden">
            <TouchableOpacity className="p-4 border-b border-gray-100" onPress={handleLogout}>
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">🚪</Text>
                <Text className="text-gray-800 text-base">Se déconnecter</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity className="p-4" onPress={handleDeleteAccount}>
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">🗑️</Text>
                <Text className="text-red-600 text-base">Supprimer mon compte</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
