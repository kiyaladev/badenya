import { Alert } from '@/services/dialog.service';
import { getCapabilities, Capabilities } from '@/services/capabilities.service';
import { View, Text, ScrollView, TouchableOpacity, Switch, Linking } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useGroupStore } from '@/store/groupStore';
import { useThemeStore, ThemeMode } from '@/store/themeStore';
import { Avatar, Card, Icon, StatItem } from '@/components/ui';
import type { IconName } from '@/components/ui';
import userService from '@/services/user.service';
import pushNotificationService from '@/services/push-notification.service';
import authService from '@/services/auth.service';
import biometricService from '@/services/biometric.service';
import logger from '@/services/logger';

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: 'Clair' },
  { mode: 'dark', label: 'Sombre' },
  { mode: 'auto', label: 'Auto' },
];

const appVersion = Constants.expoConfig?.version ?? '1.0.0';

interface MenuItemProps {
  icon: IconName;
  iconColor: string;
  iconBg: string;
  label: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
  rightElement?: React.ReactNode;
  danger?: boolean;
  testID?: string;
}

function MenuItem({
  icon,
  iconColor,
  iconBg,
  label,
  subtitle,
  value,
  onPress,
  isLast,
  rightElement,
  danger,
  testID,
}: MenuItemProps) {
  const content = (
    <>
      <View
        className="w-9 h-9 rounded-[10px] items-center justify-center mr-3.5"
        style={{ backgroundColor: iconBg }}
      >
        <Icon name={icon} size={16} color={iconColor} />
      </View>
      <View className="flex-1 pr-2">
        <Text
          className={`text-[15px] ${danger ? 'text-red-500 font-medium' : 'text-gray-900 dark:text-gray-50 font-normal'}`}
        >
          {label}
        </Text>
        {subtitle && (
          <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</Text>
        )}
      </View>
      {rightElement || (
        <>
          {value && <Text className="text-sm text-gray-500 dark:text-gray-300 mr-2">{value}</Text>}
          {onPress && <Icon name="chevron-right" size={12} color="#d1d5db" />}
        </>
      )}
    </>
  );
  const rowClass = `flex-row items-center py-3.5 px-4 border-gray-100 dark:border-gray-700 ${isLast ? 'border-b-0' : 'border-b'}`;

  if (!onPress) {
    return (
      <View className={rowClass} testID={testID}>
        {content}
      </View>
    );
  }
  return (
    <TouchableOpacity className={rowClass} onPress={onPress} activeOpacity={0.7} testID={testID}>
      {content}
    </TouchableOpacity>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase mb-2 mt-6 px-1">
      {children}
    </Text>
  );
}

const switchTrack = { false: '#d1d5db', true: '#10b981' };

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { user, logout, updateProfile } = useAuthStore();
  const { groups } = useGroupStore();
  const { mode: themeMode, setTheme } = useThemeStore();

  const [capabilities, setCapabilities] = useState<Capabilities>({
    ai: false,
    push: false,
    email: false,
  });
  useEffect(() => {
    getCapabilities().then(setCapabilities);
  }, []);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

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

  const handleThemeChange = (nextMode: ThemeMode) => {
    if (nextMode === themeMode) return;
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
        await pushNotificationService.unregisterFromPushNotifications();
        setPushNotifications(false);
        await persistPreferences({ notifications: { push: false } });
      }
    } catch (error) {
      logger.error('Profile', 'Error toggling push notifications', error);
      Alert.alert('Erreur', 'Impossible de modifier les paramètres de notification');
    }
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

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter?', [
      {
        text: 'Annuler',
        style: 'cancel',
      },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
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
              logger.error('Profile', 'Error deleting account', error);
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

  // User stats
  const totalGroups = groups.length;
  const [totalContributions, setTotalContributions] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    let mounted = true;
    userService.getUserStats().then(stats => {
      if (mounted) {
        setTotalContributions(stats.totalContributions);
        setTotalVotes(stats.totalVotes);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const fullName = user?.fullName || 'Utilisateur';
  // LinearGradient is not className-aware: layout stays inline with the safe-area inset.
  const gradientStyle = {
    paddingTop: insets.top + 24,
    paddingBottom: 80,
    alignItems: 'center' as const,
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-gray-800"
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#0284c7', '#0369a1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={gradientStyle}
      >
        <Avatar
          name={fullName}
          imageUrl={user?.avatar?.url}
          size="xl"
          backgroundColor="rgba(255,255,255,0.25)"
        />
        <Text className="text-white text-[22px] font-bold mt-4">{fullName}</Text>
        <Text className="text-white/85 text-sm mt-1">{user?.email || 'utilisateur@email.com'}</Text>
        <TouchableOpacity
          className="mt-4 px-5 py-2.5 rounded-full bg-white/20 border border-white/30"
          onPress={() => router.push('/(screens)/edit-profile')}
          activeOpacity={0.8}
        >
          <Text className="text-white text-[13px] font-semibold">Modifier le profil</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Profile Stats */}
      <View className="mx-5 -mt-[50px]">
        <Card shadow="lg" padding="lg">
          <View className="flex-row justify-around">
            <StatItem label="Groupes" value={totalGroups} />
            <View className="w-px bg-gray-100 dark:bg-gray-800" />
            <StatItem label="Cotisations" value={totalContributions} />
            <View className="w-px bg-gray-100 dark:bg-gray-800" />
            <StatItem label="Votes" value={totalVotes} />
          </View>
        </Card>
      </View>

      <View className="px-5 pb-4">
        <SectionTitle>Compte</SectionTitle>
        <Card padding="none" shadow="sm">
          <MenuItem
            icon="lock"
            iconColor="#6b7280"
            iconBg="#f3f4f6"
            label="Changer le mot de passe"
            onPress={() => router.push('/(screens)/change-password')}
            isLast
          />
        </Card>

        <SectionTitle>Préférences</SectionTitle>
        <Card padding="none" shadow="sm">
          <MenuItem
            icon="bell"
            iconColor="#0284c7"
            iconBg="#e0f2fe"
            label="Notifications"
            subtitle={capabilities.push ? undefined : 'Indisponible pour le moment'}
            rightElement={
              <Switch
                testID="push-notifications-switch"
                value={capabilities.push && pushNotifications}
                disabled={!capabilities.push}
                onValueChange={handlePushNotificationsToggle}
                trackColor={switchTrack}
                thumbColor="#ffffff"
              />
            }
          />
          {capabilities.email && (
            <MenuItem
              icon="envelope"
              iconColor="#10b981"
              iconBg="#d1fae5"
              label="Notifications email"
              rightElement={
                <Switch
                  testID="email-notifications-switch"
                  value={emailNotifications}
                  onValueChange={handleEmailNotificationsToggle}
                  trackColor={switchTrack}
                  thumbColor="#ffffff"
                />
              }
            />
          )}
          <MenuItem
            icon="moon-o"
            iconColor="#6366f1"
            iconBg="#e0e7ff"
            label="Thème"
            rightElement={
              <View className="flex-row rounded-lg bg-gray-100 dark:bg-gray-700 p-0.5">
                {THEME_OPTIONS.map(option => {
                  const selected = option.mode === themeMode;
                  return (
                    <TouchableOpacity
                      key={option.mode}
                      testID={`theme-${option.mode}`}
                      className={`px-2.5 py-1 rounded-md ${selected ? 'bg-white dark:bg-gray-900' : ''}`}
                      onPress={() => handleThemeChange(option.mode)}
                      accessibilityState={{ selected }}
                    >
                      <Text
                        className={`text-xs ${selected ? 'text-gray-900 dark:text-gray-50 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            }
          />
          <MenuItem
            icon="shield"
            iconColor="#10b981"
            iconBg="#d1fae5"
            label={biometricName}
            subtitle={
              biometricsAvailable
                ? 'Connexion sécurisée par empreinte ou reconnaissance faciale'
                : 'Non supporté sur cet appareil'
            }
            isLast
            rightElement={
              <Switch
                testID="biometric-switch"
                value={biometricsEnabled}
                disabled={!biometricsAvailable}
                onValueChange={handleBiometricToggle}
                trackColor={switchTrack}
                thumbColor="#ffffff"
              />
            }
          />
        </Card>

        <SectionTitle>À propos</SectionTitle>
        <Card padding="none" shadow="sm">
          <MenuItem
            icon="file-text-o"
            iconColor="#6b7280"
            iconBg="#f3f4f6"
            label="Conditions d'utilisation"
            onPress={() =>
              openExternalPage(
                process.env.EXPO_PUBLIC_TERMS_URL || 'https://badenya.naimba.com/terms',
                "les conditions d'utilisation"
              )
            }
          />
          <MenuItem
            icon="shield"
            iconColor="#6b7280"
            iconBg="#f3f4f6"
            label="Politique de confidentialité"
            onPress={() =>
              openExternalPage(
                process.env.EXPO_PUBLIC_PRIVACY_URL || 'https://badenya.naimba.com/privacy',
                'la politique de confidentialité'
              )
            }
          />
          <MenuItem
            icon="question-circle"
            iconColor="#0ea5e9"
            iconBg="#e0f2fe"
            label="Aide & Support"
            onPress={() =>
              openExternalPage(
                process.env.EXPO_PUBLIC_SUPPORT_URL || 'mailto:support@badenya.app',
                'le support'
              )
            }
          />
          <MenuItem
            icon="info-circle"
            iconColor="#6b7280"
            iconBg="#f3f4f6"
            label="Version"
            value={appVersion}
            isLast
          />
        </Card>

        <View className="mt-6">
          <Card padding="none" shadow="sm">
            <MenuItem
              icon="sign-out"
              iconColor="#ef4444"
              iconBg="#fee2e2"
              label="Déconnexion"
              onPress={handleLogout}
              danger
            />
            <MenuItem
              icon="trash"
              iconColor="#dc2626"
              iconBg="#fee2e2"
              label="Supprimer mon compte"
              onPress={handleDeleteAccount}
              isLast
              danger
            />
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}
