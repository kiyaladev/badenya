import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { Group, GROUP_TYPE_LABELS } from '@/services/group.service';
import { Icon } from '@/components/ui';

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
  association: {
    label: 'Association',
    icon: 'bank' as const,
    bgColor: '#dcfce7',
    textColor: '#166534',
    iconColor: '#10b981',
  },
  family: {
    label: 'Famille',
    icon: 'home' as const,
    bgColor: '#dbeafe',
    textColor: '#1e40af',
    iconColor: '#3b82f6',
  },
  friends: {
    label: 'Amis',
    icon: 'users' as const,
    bgColor: '#fef3c7',
    textColor: '#92400e',
    iconColor: '#f59e0b',
  },
  project: {
    label: 'Projet',
    icon: 'flag' as const,
    bgColor: '#ffedd5',
    textColor: '#c2410c',
    iconColor: '#f97316',
  },
};

function GroupCard({ group, variant = 'default' }: GroupCardProps) {
  const router = useRouter();
  const colors = useThemeStore(state => state.colors);
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
    backgroundColor: colors.card,
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

  const headerStyle = {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 14,
  };
  const headerContentStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    marginRight: 12,
  };
  const iconContainerStyle = {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: typeConfig.bgColor,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  };
  const titleContainerStyle = { flex: 1 };
  const titleStyle = {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  };
  const descriptionStyle = { fontSize: 13, color: colors.textSecondary };
  const badgeStyle = {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: typeConfig.bgColor,
  };
  const badgeTextStyle = {
    fontSize: 11,
    fontWeight: '600' as const,
    color: typeConfig.textColor,
  };
  const statsStyle = {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  };
  const statsLabelStyle = {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500' as const,
  };
  const balanceStyle = { fontSize: 18, fontWeight: '700' as const, color: colors.primary };
  const currencyStyle = { fontSize: 12, fontWeight: '500' as const };
  const membersColumnStyle = { alignItems: 'center' as const };
  const membersHeaderStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  };
  const membersIconStyle = { marginRight: 4 };
  const membersCountStyle = { fontSize: 16, fontWeight: '700' as const, color: colors.text };
  const contributionColumnStyle = { alignItems: 'flex-end' as const };
  const contributionValueStyle = {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  };

  return (
    <TouchableOpacity
      style={cardStyle}
      onPress={() => router.push(`/(screens)/group-details?id=${group._id}`)}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={headerStyle}>
        <View style={headerContentStyle}>
          {/* Group Icon */}
          <View style={iconContainerStyle}>
            <Icon name={typeConfig.icon} size={20} color={typeConfig.iconColor} />
          </View>
          <View style={titleContainerStyle}>
            <Text style={titleStyle} numberOfLines={1}>
              {group.name}
            </Text>
            {group.description && !isCompact && (
              <Text style={descriptionStyle} numberOfLines={1}>
                {group.description}
              </Text>
            )}
          </View>
        </View>

        {/* Badge */}
        <View style={badgeStyle}>
          <Text style={badgeTextStyle}>{GROUP_TYPE_LABELS[group.type] || typeConfig.label}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={statsStyle}>
        <View>
          <Text style={statsLabelStyle}>Solde</Text>
          <Text style={balanceStyle}>
            {formatCurrency(group.balance)} <Text style={currencyStyle}>{group.currency}</Text>
          </Text>
        </View>

        <View style={membersColumnStyle}>
          <View style={membersHeaderStyle}>
            <Icon name="users" size={10} color={colors.textSecondary} style={membersIconStyle} />
            <Text style={statsLabelStyle}>Membres</Text>
          </View>
          <Text style={membersCountStyle}>{group.members?.length || 0}</Text>
        </View>

        <View style={contributionColumnStyle}>
          <Text style={statsLabelStyle}>Cotisation</Text>
          <Text style={contributionValueStyle}>{formatCurrency(group.contributionAmount)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default React.memo(GroupCard);
