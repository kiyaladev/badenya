import { useThemeStore } from '@/store/themeStore';
import React from 'react';
import { View, Text, TextStyle, ViewStyle } from 'react-native';
import Icon, { IconName } from './Icon';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  icon?: IconName;
  iconColor?: string;
  iconBgColor?: string;
  variant?: 'default' | 'outlined' | 'filled';
}

export default function StatsCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  iconColor = '#0284c7',
  iconBgColor = '#e0f2fe',
  variant = 'default',
}: StatsCardProps) {
  const colors = useThemeStore(state => state.colors);
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'filled':
        return {
          backgroundColor: colors.surface,
        };
      default:
        return {
          backgroundColor: colors.card,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        };
    }
  };

  const getTrendColor = () => {
    if (!trend) return colors.textSecondary;
    switch (trend.direction) {
      case 'up':
        return '#10b981';
      case 'down':
        return '#ef4444';
      default:
        return colors.textSecondary;
    }
  };

  const getTrendIcon = (): IconName => {
    if (!trend) return 'minus';
    switch (trend.direction) {
      case 'up':
        return 'arrow-up';
      case 'down':
        return 'arrow-down';
      default:
        return 'minus';
    }
  };

  const containerStyle: ViewStyle = {
    borderRadius: 16,
    padding: 16,
    ...getVariantStyles(),
  };
  const topRowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  };
  const contentStyle: ViewStyle = { flex: 1 };
  const titleStyle: TextStyle = {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  };
  const valueStyle: TextStyle = {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: trend || subtitle ? 8 : 0,
  };
  const trendRowStyle: ViewStyle = { flexDirection: 'row', alignItems: 'center' };
  const trendTextStyle: TextStyle = {
    fontSize: 12,
    color: getTrendColor(),
    marginLeft: 4,
    fontWeight: '500',
  };
  const trendLabelStyle: TextStyle = {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  };
  const subtitleStyle: TextStyle = { fontSize: 12, color: colors.textSecondary };
  const iconWrapperStyle: ViewStyle = {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: iconBgColor,
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <View style={containerStyle}>
      <View style={topRowStyle}>
        <View style={contentStyle}>
          {/* Title */}
          <Text style={titleStyle}>{title}</Text>

          {/* Value */}
          <Text style={valueStyle}>{value}</Text>

          {/* Trend or Subtitle */}
          {trend && (
            <View style={trendRowStyle}>
              <Icon name={getTrendIcon()} size={10} color={getTrendColor()} />
              <Text style={trendTextStyle}>
                {trend.value > 0 ? '+' : ''}
                {trend.value}%
              </Text>
              {trend.label && <Text style={trendLabelStyle}>{trend.label}</Text>}
            </View>
          )}
          {subtitle && !trend && <Text style={subtitleStyle}>{subtitle}</Text>}
        </View>

        {/* Icon */}
        {icon && (
          <View style={iconWrapperStyle}>
            <Icon name={icon} size={20} color={iconColor} />
          </View>
        )}
      </View>
    </View>
  );
}

// Compact stats row for inline display
export function StatItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  const colors = useThemeStore(state => state.colors);
  const containerStyle: ViewStyle = { alignItems: 'center' };
  const valueStyle: TextStyle = { fontSize: 20, fontWeight: '700', color };
  const labelStyle: TextStyle = { fontSize: 12, color: colors.textSecondary, marginTop: 2 };

  return (
    <View style={containerStyle}>
      <Text style={valueStyle}>{value}</Text>
      <Text style={labelStyle}>{label}</Text>
    </View>
  );
}
