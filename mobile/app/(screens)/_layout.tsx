import { Stack } from 'expo-router';

export default function ScreensLayout() {
  return (
    <Stack>
      <Stack.Screen name="group-details" options={{ title: 'Détails du Groupe' }} />
      <Stack.Screen name="create-group" options={{ title: 'Nouveau Groupe' }} />
      <Stack.Screen name="edit-group" options={{ title: 'Modifier le Groupe' }} />
      <Stack.Screen name="group-members" options={{ title: 'Membres' }} />
      <Stack.Screen name="add-members" options={{ title: 'Ajouter des Membres' }} />
      <Stack.Screen name="proposals" options={{ title: 'Propositions' }} />
      <Stack.Screen name="proposal-details" options={{ title: 'Détails de la Proposition' }} />
      <Stack.Screen name="create-proposal" options={{ title: 'Nouvelle Proposition' }} />
      <Stack.Screen name="vote" options={{ title: 'Voter' }} />
      <Stack.Screen name="transaction-details" options={{ title: 'Détails Transaction' }} />
      <Stack.Screen name="add-contribution" options={{ title: 'Ajouter Contribution' }} />
      <Stack.Screen name="group-reports" options={{ title: 'Rapports' }} />
      <Stack.Screen name="settings" options={{ title: 'Paramètres' }} />
      <Stack.Screen name="edit-profile" options={{ title: 'Modifier le Profil' }} />
      <Stack.Screen name="change-password" options={{ title: 'Changer le mot de passe' }} />
    </Stack>
  );
}
