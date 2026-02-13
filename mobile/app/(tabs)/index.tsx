import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGroupStore } from '@/store/groupStore';
import { useAuthStore } from '@/store/authStore';
import GroupCard from '@/components/GroupCard';
import { Loading, Card, EmptyState, Avatar } from '@/components/ui';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { groups, isLoading, fetchGroups } = useGroupStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchGroups();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  };

  const calculateTotalBalance = () => {
    return groups.reduce((sum, group) => sum + (group.balance || 0), 0);
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
      label: 'Statistiques',
      route: '/(tabs)/transactions',
      bgColor: '#fef3c7',
      iconColor: '#d97706',
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#0284c7', '#0369a1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 16, paddingBottom: 60, paddingHorizontal: 20 }}
      >
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, marginBottom: 4 }}>
              Bonjour 👋
            </Text>
            <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '700' }}>
              {user?.fullName || 'Utilisateur'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.8}>
            <Avatar
              name={user?.fullName || 'User'}
              size="lg"
              backgroundColor="rgba(255,255,255,0.25)"
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Balance Card - Overlapping */}
      <View style={{ marginHorizontal: 20, marginTop: -40 }}>
        <Card shadow="lg" padding="lg">
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: '#6b7280', fontSize: 14, marginBottom: 8 }}>Solde total</Text>
            <Text style={{ fontSize: 32, fontWeight: '700', color: '#111827' }}>
              {formatCurrency(calculateTotalBalance())}
              <Text style={{ fontSize: 18, fontWeight: '500', color: '#6b7280' }}> XOF</Text>
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              borderTopWidth: 1,
              borderTopColor: '#f3f4f6',
              paddingTop: 16,
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#dcfce7',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <FontAwesome name="arrow-up" size={16} color="#16a34a" />
              </View>
              <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Groupes</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
                {groups.length}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#f3f4f6' }} />
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#dbeafe',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <FontAwesome name="users" size={16} color="#2563eb" />
              </View>
              <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Membres</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
                {groups.reduce((sum, g) => sum + (g.members?.length || 0), 0)}
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Quick Actions */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text style={{ fontSize: 17, fontWeight: '600', color: '#111827', marginBottom: 14 }}>
          Actions rapides
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={{
                flex: 1,
                marginHorizontal: index === 1 ? 8 : 0,
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
              }}
              onPress={() => router.push(action.route as Parameters<typeof router.push>[0])}
              activeOpacity={0.7}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: action.bgColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                }}
              >
                <FontAwesome name={action.icon} size={22} color={action.iconColor} />
              </View>
              <Text
                style={{ fontSize: 12, fontWeight: '500', color: '#374151', textAlign: 'center' }}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* My Groups */}
      <View style={{ paddingHorizontal: 20, marginTop: 28, marginBottom: 24 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: '600', color: '#111827' }}>Mes groupes</Text>
          {groups.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/groups')}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#0284c7' }}>Voir tout</Text>
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
                style={{
                  backgroundColor: '#f3f4f6',
                  borderRadius: 12,
                  padding: 14,
                  alignItems: 'center',
                  marginTop: 4,
                }}
                onPress={() => router.push('/(tabs)/groups')}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#0284c7', fontWeight: '600', fontSize: 14 }}>
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
