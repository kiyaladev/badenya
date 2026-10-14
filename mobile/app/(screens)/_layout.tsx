import AuthGate from '@/components/AuthGate';
import { useThemeStore } from '@/store/themeStore';
import { Stack } from 'expo-router';

export default function ScreensLayout() {
  const colors = useThemeStore(state => state.colors);
  return (
    <AuthGate>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      >
        <Stack.Screen name="group-details" options={{ title: 'Détails du groupe' }} />
        <Stack.Screen name="create-group" options={{ title: 'Nouveau groupe' }} />
        <Stack.Screen name="edit-group" options={{ title: 'Modifier le groupe' }} />
        <Stack.Screen name="group-members" options={{ title: 'Membres' }} />
        <Stack.Screen name="add-members" options={{ title: 'Ajouter des membres' }} />
        <Stack.Screen name="proposals" options={{ title: 'Propositions' }} />
        <Stack.Screen name="proposal-details" options={{ title: 'Proposition' }} />
        <Stack.Screen name="create-proposal" options={{ title: 'Nouvelle proposition' }} />
        <Stack.Screen name="transaction-details" options={{ title: 'Détails de la transaction' }} />
        <Stack.Screen name="add-contribution" options={{ title: 'Ajouter une cotisation' }} />
        <Stack.Screen name="group-reports" options={{ title: 'Rapports' }} />
        <Stack.Screen name="group-insights" options={{ title: 'Analyses' }} />
        <Stack.Screen name="insight-details" options={{ title: 'Analyse' }} />
        <Stack.Screen name="settings" options={{ title: 'Paramètres' }} />
        <Stack.Screen name="tontine-rounds" options={{ title: 'Tour de rôle' }} />
        <Stack.Screen name="edit-profile" options={{ title: 'Modifier le profil' }} />
        <Stack.Screen name="change-password" options={{ title: 'Changer le mot de passe' }} />
      </Stack>
    </AuthGate>
  );
}
