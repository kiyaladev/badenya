import { Alert } from '@/services/dialog.service';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useGroupStore } from '@/store/groupStore';
import { Avatar, Card, Icon, StatItem } from '@/components/ui';
import type { IconName } from '@/components/ui';
import userService from '@/services/user.service';

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
      className={`flex-row items-center py-3.5 px-4 border-gray-100 ${isLast ? 'border-b-0' : 'border-b'}`}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View
        className="w-9 h-9 rounded-[10px] items-center justify-center mr-3.5"
        style={{ backgroundColor: iconBg }}
      >
        <Icon name={icon} size={16} color={iconColor} />
      </View>
      <Text
        className={`flex-1 text-[15px] ${danger ? 'text-red-500 font-medium' : 'text-gray-900 dark:text-gray-50 font-normal'}`}
      >
        {label}
      </Text>
      {rightElement || (
        <>
          {value && <Text className="text-sm text-gray-500 dark:text-gray-300 mr-2">{value}</Text>}
          {onPress && <Icon name="chevron-right" size={12} color="#d1d5db" />}
        </>
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
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

      <View className="px-5 mt-6">
        <Card padding="none" shadow="sm">
          <MenuItem
            icon="cog"
            iconColor="#6b7280"
            iconBg="#f3f4f6"
            label="Paramètres"
            onPress={() => router.push('/(screens)/settings')}
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
      <View className="items-center py-8">
        <Text className="text-gray-400 text-[13px]">Badenya v1.0.0</Text>
      </View>
    </ScrollView>
  );
}
