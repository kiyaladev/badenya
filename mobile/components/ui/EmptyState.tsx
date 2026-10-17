import { useThemeStore } from '@/store/themeStore';
import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import Icon, { IconName } from './Icon';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'compact';
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default',
}: EmptyStateProps) {
  const colors = useThemeStore(state => state.colors);
  const isCompact = variant === 'compact';

  const containerStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: isCompact ? 24 : 32,
    alignItems: 'center',
  };
  const iconContainerStyle = {
    width: isCompact ? 64 : 80,
    height: isCompact ? 64 : 80,
    borderRadius: isCompact ? 32 : 40,
    backgroundColor: '#f0f9ff',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: isCompact ? 12 : 16,
  };
  const titleStyle = {
    fontSize: isCompact ? 16 : 18,
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'center' as const,
    marginBottom: 8,
  };
  const descriptionStyle = {
    fontSize: isCompact ? 13 : 14,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: onAction ? 16 : 0,
  };
  const actionStyle = {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  };
  const actionTextStyle = {
    color: '#ffffff',
    fontWeight: '600' as const,
    fontSize: 14,
  };

  return (
    <View style={containerStyle}>
      {/* Monochrome icon */}
      {icon && (
        <View style={iconContainerStyle}>
          <Icon name={icon} size={isCompact ? 24 : 32} color="#0284c7" />
        </View>
      )}

      {/* Title */}
      <Text style={titleStyle}>{title}</Text>

      {/* Description */}
      {description && <Text style={descriptionStyle}>{description}</Text>}

      {/* Action Button */}
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} style={actionStyle} activeOpacity={0.8}>
          <Icon name="plus" size={14} color="#ffffff" />
          <Text style={actionTextStyle}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
