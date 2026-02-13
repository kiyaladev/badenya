import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useGroupStore } from '@/store/groupStore';
import { Avatar, Card, StatItem } from '@/components/ui';

type IconName = keyof typeof FontAwesome.glyphMap;

interface MenuItemProps {
  icon: IconName;
  iconColor: string;
  iconBg: string;
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

function MenuItem({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  onPress,
  isLast,
  rightElement,
  danger,
}: MenuItemProps) {
  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: '#f3f4f6',
      }}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        }}
      >
        <FontAwesome name={icon} size={16} color={iconColor} />
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          color: danger ? '#ef4444' : '#111827',
          fontWeight: danger ? '500' : '400',
        }}
      >
        {label}
      </Text>
      {rightElement || (
        <>
          {value && <Text style={{ fontSize: 14, color: '#6b7280', marginRight: 8 }}>{value}</Text>}
          {onPress && <FontAwesome name="chevron-right" size={12} color="#d1d5db" />}
        </>
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { user, logout } = useAuthStore();
  const { groups } = useGroupStore();

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

  // Calculate user stats
  const totalGroups = groups.length;
  const totalContributions = 0; // TODO: Calculate from transactions
  const totalVotes = 0; // TODO: Calculate from votes

  const fullName =
    user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Utilisateur';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#0284c7', '#0369a1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 24, paddingBottom: 80, alignItems: 'center' }}
      >
        <Avatar name={fullName} size="xl" backgroundColor="rgba(255,255,255,0.25)" />
        <Text style={{ color: '#ffffff', fontSize: 22, fontWeight: '700', marginTop: 16 }}>
          {fullName}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 4 }}>
          {user?.email || 'utilisateur@email.com'}
        </Text>
        <TouchableOpacity
          style={{
            marginTop: 16,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)',
          }}
          onPress={() => router.push('/(screens)/edit-profile')}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600' }}>
            Modifier le profil
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Profile Stats */}
      <View style={{ marginHorizontal: 20, marginTop: -50 }}>
        <Card shadow="lg" padding="lg">
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <StatItem label="Groupes" value={totalGroups} />
            <View style={{ width: 1, backgroundColor: '#f3f4f6' }} />
            <StatItem label="Contributions" value={totalContributions} />
            <View style={{ width: 1, backgroundColor: '#f3f4f6' }} />
            <StatItem label="Votes" value={totalVotes} />
          </View>
        </Card>
      </View>

      {/* Account Settings */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: '#6b7280',
            marginBottom: 10,
            marginLeft: 4,
          }}
        >
          COMPTE
        </Text>
        <Card padding="none" shadow="sm">
          <MenuItem
            icon="user"
            iconColor="#0284c7"
            iconBg="#e0f2fe"
            label="Modifier le profil"
            onPress={() => router.push('/(screens)/edit-profile')}
          />
          <MenuItem
            icon="cog"
            iconColor="#6b7280"
            iconBg="#f3f4f6"
            label="Paramètres"
            onPress={() => router.push('/(screens)/settings')}
          />
          <MenuItem
            icon="globe"
            iconColor="#8b5cf6"
            iconBg="#ede9fe"
            label="Langue"
            value="Français"
            onPress={() => {}}
            isLast
          />
        </Card>
      </View>

      {/* Notifications Settings */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: '#6b7280',
            marginBottom: 10,
            marginLeft: 4,
          }}
        >
          NOTIFICATIONS
        </Text>
        <Card padding="none" shadow="sm">
          <MenuItem
            icon="bell"
            iconColor="#f59e0b"
            iconBg="#fef3c7"
            label="Notifications push"
            rightElement={
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: '#e5e7eb', true: '#0284c7' }}
                thumbColor="#ffffff"
              />
            }
          />
          <MenuItem
            icon="envelope"
            iconColor="#10b981"
            iconBg="#dcfce7"
            label="Notifications email"
            rightElement={
              <Switch
                value={emailEnabled}
                onValueChange={setEmailEnabled}
                trackColor={{ false: '#e5e7eb', true: '#0284c7' }}
                thumbColor="#ffffff"
              />
            }
            isLast
          />
        </Card>
      </View>

      {/* Preferences */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: '#6b7280',
            marginBottom: 10,
            marginLeft: 4,
          }}
        >
          PRÉFÉRENCES
        </Text>
        <Card padding="none" shadow="sm">
          <MenuItem
            icon="money"
            iconColor="#16a34a"
            iconBg="#dcfce7"
            label="Devise"
            value="XOF"
            onPress={() => {}}
          />
          <MenuItem
            icon="moon-o"
            iconColor="#6366f1"
            iconBg="#e0e7ff"
            label="Thème"
            value="Auto"
            onPress={() => {}}
            isLast
          />
        </Card>
      </View>

      {/* Other */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: '#6b7280',
            marginBottom: 10,
            marginLeft: 4,
          }}
        >
          AUTRE
        </Text>
        <Card padding="none" shadow="sm">
          <MenuItem
            icon="question-circle"
            iconColor="#0ea5e9"
            iconBg="#e0f2fe"
            label="Aide & Support"
            onPress={() => {}}
          />
          <MenuItem
            icon="file-text-o"
            iconColor="#6b7280"
            iconBg="#f3f4f6"
            label="Conditions d'utilisation"
            onPress={() => {}}
          />
          <MenuItem
            icon="shield"
            iconColor="#6b7280"
            iconBg="#f3f4f6"
            label="Politique de confidentialité"
            onPress={() => {}}
          />
          <MenuItem
            icon="sign-out"
            iconColor="#ef4444"
            iconBg="#fee2e2"
            label="Déconnexion"
            onPress={handleLogout}
            isLast
            danger
          />
        </Card>
      </View>

      {/* Version */}
      <View style={{ alignItems: 'center', paddingVertical: 32 }}>
        <Text style={{ color: '#9ca3af', fontSize: 13 }}>Badenya v1.0.0</Text>
      </View>
    </ScrollView>
  );
}
