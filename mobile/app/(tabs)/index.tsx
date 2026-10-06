import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGroupStore } from '@/store/groupStore';
import { useThemeStore } from '@/store/themeStore';
import { themedStyles } from '@/utils/themedStyles';
import { useAuthStore } from '@/store/authStore';
import GroupCard from '@/components/GroupCard';
import { Loading, Card, EmptyState, Avatar, Icon } from '@/components/ui';

const baseStyles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  gradient: {
    paddingBottom: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    marginBottom: 4,
  },
  userName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  balanceContainer: {
    marginHorizontal: 20,
    marginTop: -40,
  },
  balanceSummary: {
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 8,
  },
  balance: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  currency: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6b7280',
  },
  balanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
  },
  statColumn: {
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statIconGroups: {
    backgroundColor: '#dcfce7',
  },
  statIconMembers: {
    backgroundColor: '#dbeafe',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#f3f4f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  quickActionsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 14,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  quickActionMiddle: {
    marginHorizontal: 8,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  groupsSection: {
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 24,
  },
  groupsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  groupsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0284c7',
  },
  moreGroupsButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  moreGroupsText: {
    color: '#0284c7',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default function HomeScreen() {
  const colors = useThemeStore(state => state.colors);
  const styles = themedStyles(baseStyles, colors);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { groups, isLoading, fetchGroups } = useGroupStore();
  const { user } = useAuthStore();
  const gradientStyle: ViewStyle = {
    ...styles.gradient,
    paddingTop: insets.top + 16,
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  };

  const calculateTotalBalance = () => {
    return groups
      .filter(group => group.currency === 'XOF')
      .reduce((sum, group) => sum + (group.balance || 0), 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const quickActions = [
    {
      icon: 'plus-circle' as const,
      label: 'Nouveau Groupe',
      route: '/(screens)/create-group',
      bgColor: '#dbeafe',
      iconColor: '#2563eb',
    },
    {
      icon: 'money' as const,
      label: 'Contribution',
      route: '/(screens)/add-contribution',
      bgColor: '#dcfce7',
      iconColor: '#16a34a',
    },
    {
      icon: 'bar-chart' as const,
      label: 'Historique',
      route: '/(tabs)/transactions',
      bgColor: '#fef3c7',
      iconColor: '#d97706',
    },
  ];

  return (
    <ScrollView
      style={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#0284c7', '#0369a1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={gradientStyle}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Bonjour</Text>
            <Text style={styles.userName}>{user?.fullName || 'Utilisateur'}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.8}>
            <Avatar
              name={user?.fullName || 'User'}
              imageUrl={user?.avatar?.url}
              size="lg"
              backgroundColor="rgba(255,255,255,0.25)"
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Balance Card - Overlapping */}
      <View style={styles.balanceContainer}>
        <Card shadow="lg" padding="lg">
          <View style={styles.balanceSummary}>
            <Text style={styles.balanceLabel}>Solde total</Text>
            <Text style={styles.balance}>
              {formatCurrency(calculateTotalBalance())}
              <Text style={styles.currency}> XOF</Text>
              {Object.entries(
                groups
                  .filter(group => group.currency !== 'XOF')
                  .reduce<Record<string, number>>((totals, group) => {
                    totals[group.currency] = (totals[group.currency] || 0) + group.balance;
                    return totals;
                  }, {})
              ).map(([currency, amount]) => (
                <Text key={currency} style={styles.currency}>
                  {formatCurrency(amount)} {currency}
                </Text>
              ))}
            </Text>
          </View>

          <View style={styles.balanceStats}>
            <View style={styles.statColumn}>
              <View style={[styles.statIcon, styles.statIconGroups]}>
                <Icon name="arrow-up" size={16} color="#16a34a" />
              </View>
              <Text style={styles.statLabel}>Groupes</Text>
              <Text style={styles.statValue}>{groups.length}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statColumn}>
              <View style={[styles.statIcon, styles.statIconMembers]}>
                <Icon name="users" size={16} color="#2563eb" />
              </View>
              <Text style={styles.statLabel}>Membres</Text>
              <Text style={styles.statValue}>
                {groups.reduce((sum, g) => sum + (g.members?.length || 0), 0)}
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.quickActionsTitle}>Actions rapides</Text>
        <View style={styles.quickActionsRow}>
          {quickActions.map((action, index) => {
            const actionIconStyle: ViewStyle = {
              ...styles.quickActionIcon,
              backgroundColor: action.bgColor,
            };

            return (
              <TouchableOpacity
                key={index}
                style={[styles.quickActionCard, index === 1 && styles.quickActionMiddle]}
                onPress={() => router.push(action.route as Parameters<typeof router.push>[0])}
                activeOpacity={0.7}
              >
                <View style={actionIconStyle}>
                  <Icon name={action.icon} size={22} color={action.iconColor} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* My Groups */}
      <View style={styles.groupsSection}>
        <View style={styles.groupsHeader}>
          <Text style={styles.groupsTitle}>Mes groupes</Text>
          {groups.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/groups')}>
              <Text style={styles.viewAll}>Voir tout</Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading && !refreshing ? (
          <Loading />
        ) : groups.length === 0 ? (
          <EmptyState
            icon="users"
            title="Aucun groupe"
            description="Créez ou rejoignez un groupe pour commencer à épargner ensemble"
            actionLabel="Créer un groupe"
            onAction={() => router.push('/(screens)/create-group')}
          />
        ) : (
          <View>
            {groups.slice(0, 3).map(group => (
              <GroupCard key={group._id} group={group} />
            ))}
            {groups.length > 3 && (
              <TouchableOpacity
                style={styles.moreGroupsButton}
                onPress={() => router.push('/(tabs)/groups')}
                activeOpacity={0.7}
              >
                <Text style={styles.moreGroupsText}>
                  Voir {groups.length - 3} groupe{groups.length - 3 > 1 ? 's' : ''} de plus
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
