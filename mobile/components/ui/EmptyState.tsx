import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface EmptyStateProps {
  icon?: keyof typeof FontAwesome.glyphMap;
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'compact';
}

export default function EmptyState({
  icon,
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default',
}: EmptyStateProps) {
  const isCompact = variant === 'compact';

  const containerStyle: ViewStyle = {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: isCompact ? 24 : 32,
    alignItems: 'center',
  };

  return (
    <View style={containerStyle}>
      {/* Icon or Emoji */}
      {(icon || emoji) && (
        <View
          style={{
            width: isCompact ? 64 : 80,
            height: isCompact ? 64 : 80,
            borderRadius: isCompact ? 32 : 40,
            backgroundColor: '#f0f9ff',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: isCompact ? 12 : 16,
          }}
        >
          {emoji ? (
            <Text style={{ fontSize: isCompact ? 28 : 36 }}>{emoji}</Text>
          ) : icon ? (
            <FontAwesome name={icon} size={isCompact ? 24 : 32} color="#0284c7" />
          ) : null}
        </View>
      )}

      {/* Title */}
      <Text
        style={{
          fontSize: isCompact ? 16 : 18,
          fontWeight: '600',
          color: '#111827',
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        {title}
      </Text>

      {/* Description */}
      {description && (
        <Text
          style={{
            fontSize: isCompact ? 13 : 14,
            color: '#6b7280',
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: onAction ? 16 : 0,
          }}
        >
          {description}
        </Text>
      )}

      {/* Action Button */}
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          style={{
            backgroundColor: '#0284c7',
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 10,
            flexDirection: 'row',
            alignItems: 'center',
          }}
          activeOpacity={0.8}
        >
          <FontAwesome name="plus" size={14} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 14 }}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
