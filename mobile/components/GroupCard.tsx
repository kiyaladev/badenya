import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Group } from '@/services/group.service';

interface GroupCardProps {
  group: Group;
  variant?: 'default' | 'compact';
}

// Group type configuration
const groupTypeConfig = {
  tontine: {
    label: 'Tontine',
    icon: 'refresh' as const,
    bgColor: '#fae8ff',
    textColor: '#a21caf',
    iconColor: '#c026d3',
  },
  saving: {
    label: 'Épargne',
    icon: 'bank' as const,
    bgColor: '#dcfce7',
    textColor: '#166534',
    iconColor: '#10b981',
  },
  investment: {
    label: 'Investissement',
    icon: 'line-chart' as const,
    bgColor: '#dbeafe',
    textColor: '#1e40af',
    iconColor: '#3b82f6',
  },
  loan: {
    label: 'Crédit',
    icon: 'handshake-o' as const,
    bgColor: '#ffedd5',
    textColor: '#c2410c',
    iconColor: '#f97316',
  },
};

export default function GroupCard({ group, variant = 'default' }: GroupCardProps) {
  const router = useRouter();
  const isCompact = variant === 'compact';

  const typeConfig = groupTypeConfig[group.type as keyof typeof groupTypeConfig] || {
    label: group.type,
    icon: 'users' as const,
    bgColor: '#f3f4f6',
    textColor: '#374151',
    iconColor: '#6b7280',
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const cardStyle: ViewStyle = {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: isCompact ? 14 : 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  };

  return (
    <TouchableOpacity
      style={cardStyle}
      onPress={() => router.push(`/(screens)/group-details?id=${group._id}`)}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 14,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
          {/* Group Icon */}
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: typeConfig.bgColor,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <FontAwesome name={typeConfig.icon} size={20} color={typeConfig.iconColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#111827',
                marginBottom: 2,
              }}
              numberOfLines={1}
            >
              {group.name}
            </Text>
            {group.description && !isCompact && (
              <Text style={{ fontSize: 13, color: '#6b7280' }} numberOfLines={1}>
                {group.description}
              </Text>
            )}
          </View>
        </View>

        {/* Badge */}
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 20,
            backgroundColor: typeConfig.bgColor,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: typeConfig.textColor,
            }}
          >
            {typeConfig.label}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 14,
          borderTopWidth: 1,
          borderTopColor: '#f3f4f6',
        }}
      >
        <View>
          <Text style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: '500' }}>
            Solde
          </Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#0284c7' }}>
            {formatCurrency(group.balance)}{' '}
            <Text style={{ fontSize: 12, fontWeight: '500' }}>{group.currency}</Text>
          </Text>
        </View>

        <View style={{ alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <FontAwesome name="users" size={10} color="#6b7280" style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '500' }}>Membres</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
            {group.members?.length || 0}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: '500' }}>
            Cotisation
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
            {formatCurrency(group.contributionAmount)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
