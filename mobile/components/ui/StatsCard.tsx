import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

type IconName = keyof typeof FontAwesome.glyphMap;

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
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: '#ffffff',
          borderWidth: 1,
          borderColor: '#e5e7eb',
        };
      case 'filled':
        return {
          backgroundColor: '#f9fafb',
        };
      default:
        return {
          backgroundColor: '#ffffff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        };
    }
  };

  const getTrendColor = () => {
    if (!trend) return '#6b7280';
    switch (trend.direction) {
      case 'up':
        return '#10b981';
      case 'down':
        return '#ef4444';
      default:
        return '#6b7280';
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

  return (
    <View style={containerStyle}>
      <View
        style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}
      >
        <View style={{ flex: 1 }}>
          {/* Title */}
          <Text
            style={{
              fontSize: 13,
              color: '#6b7280',
              marginBottom: 8,
              fontWeight: '500',
            }}
          >
            {title}
          </Text>

          {/* Value */}
          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: '#111827',
              marginBottom: trend || subtitle ? 8 : 0,
            }}
          >
            {value}
          </Text>

          {/* Trend or Subtitle */}
          {trend && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <FontAwesome name={getTrendIcon()} size={10} color={getTrendColor()} />
              <Text
                style={{
                  fontSize: 12,
                  color: getTrendColor(),
                  marginLeft: 4,
                  fontWeight: '500',
                }}
              >
                {trend.value > 0 ? '+' : ''}
                {trend.value}%
              </Text>
              {trend.label && (
                <Text
                  style={{
                    fontSize: 12,
                    color: '#9ca3af',
                    marginLeft: 4,
                  }}
                >
                  {trend.label}
                </Text>
              )}
            </View>
          )}
          {subtitle && !trend && <Text style={{ fontSize: 12, color: '#6b7280' }}>{subtitle}</Text>}
        </View>

        {/* Icon */}
        {icon && (
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: iconBgColor,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FontAwesome name={icon} size={20} color={iconColor} />
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
  color = '#111827',
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color }}>{value}</Text>
      <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{label}</Text>
    </View>
  );
}
