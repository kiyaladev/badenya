import AuthGate from '@/components/AuthGate';
import { useThemeStore } from '@/store/themeStore';
import React from 'react';
import { Tabs } from 'expo-router';
import { View, Platform, StyleSheet } from 'react-native';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { Icon, type IconName } from '@/components/ui';

export { ErrorBoundary } from 'expo-router';

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
  },
  icon: {
    marginBottom: 2,
  },
});

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: { name: IconName; color: string }) {
  return (
    <View style={styles.tabIcon}>
      <Icon size={22} style={styles.icon} name={props.name} color={props.color} />
    </View>
  );
}

export default function TabLayout() {
  const colors = useThemeStore(state => state.colors);
  return (
    <AuthGate>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#0284c7',
          tabBarInactiveTintColor: '#9ca3af',
          headerShown: useClientOnlyValue(false, true),
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: 8,
            paddingBottom: Platform.OS === 'ios' ? 24 : 8,
            height: Platform.OS === 'ios' ? 88 : 64,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 10,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
            marginTop: 2,
          },
          headerStyle: {
            backgroundColor: colors.card,
            shadowColor: 'transparent',
            elevation: 0,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
            color: colors.text,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            headerShown: false,
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="groups"
          options={{
            title: 'Groupes',
            headerShown: false,
            tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            headerShown: false,
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          }}
        />
      </Tabs>
    </AuthGate>
  );
}
