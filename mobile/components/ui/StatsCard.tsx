import { useThemeStore } from '@/store/themeStore';
import React from 'react';
import { View, Text, TextStyle, ViewStyle } from 'react-native';

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
  const valueStyle: TextStyle = { fontSize: 20, fontWeight: '700', color: color ?? colors.text };
  const labelStyle: TextStyle = { fontSize: 12, color: colors.textSecondary, marginTop: 2 };

  return (
    <View style={containerStyle}>
      <Text style={valueStyle}>{value}</Text>
      <Text style={labelStyle}>{label}</Text>
    </View>
  );
}
