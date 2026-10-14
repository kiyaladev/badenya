import { Alert } from '@/services/dialog.service';
import { themedStyles } from '@/utils/themedStyles';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useGroupStore } from '@/store/groupStore';
import { useThemeStore } from '@/store/themeStore';
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

const baseStyles = StyleSheet.create({
  profileScroll: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  gradient: {
    paddingBottom: 80,
    alignItems: 'center',
  },
  name: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
  },
  email: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginTop: 4,
  },
  editButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  statsContainer: {
    marginHorizontal: 20,
    marginTop: -50,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#f3f4f6',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 10,
    marginLeft: 4,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    color: '#9ca3af',
    fontSize: 13,
  },
  menuValue: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
});

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
  const styles = themedStyles(
    baseStyles,
    useThemeStore(state => state.colors)
  );
  const itemStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: isLast ? 0 : 1,
    borderBottomColor: '#f3f4f6',
  };
  const iconContainerStyle: ViewStyle = {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  };
  const labelStyle: TextStyle = {
    flex: 1,
    fontSize: 15,
    color: danger ? '#ef4444' : useThemeStore(state => state.colors.text),
    fontWeight: danger ? '500' : '400',
  };

  return (
    <TouchableOpacity
      style={itemStyle}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={iconContainerStyle}>
        <Icon name={icon} size={16} color={iconColor} />
      </View>
      <Text style={labelStyle}>{label}</Text>
      {rightElement || (
        <>
          {value && <Text style={styles.menuValue}>{value}</Text>}
          {onPress && <Icon name="chevron-right" size={12} color="#d1d5db" />}
        </>
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const styles = themedStyles(
    baseStyles,
    useThemeStore(state => state.colors)
  );
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
  const gradientStyle: ViewStyle = {
    ...styles.gradient,
    paddingTop: insets.top + 24,
  };

  return (
    <ScrollView style={styles.profileScroll} showsVerticalScrollIndicator={false}>
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
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.email}>{user?.email || 'utilisateur@email.com'}</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push('/(screens)/edit-profile')}
          activeOpacity={0.8}
        >
          <Text style={styles.editButtonText}>Modifier le profil</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Profile Stats */}
      <View style={styles.statsContainer}>
        <Card shadow="lg" padding="lg">
          <View style={styles.statsRow}>
            <StatItem label="Groupes" value={totalGroups} />
            <View style={styles.statDivider} />
            <StatItem label="Cotisations" value={totalContributions} />
            <View style={styles.statDivider} />
            <StatItem label="Votes" value={totalVotes} />
          </View>
        </Card>
      </View>

      <View style={styles.section}>
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
      <View style={styles.footer}>
        <Text style={styles.footerText}>Badenya v1.0.0</Text>
      </View>
    </ScrollView>
  );
}
