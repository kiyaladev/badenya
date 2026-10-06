import { ScrollView, Text } from 'react-native';
export default function LegalPage() {
  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900 p-6">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Confidentialité</Text>
      <Text className="text-gray-700 dark:text-gray-200 leading-7">
        Badenya conserve les informations de votre compte, vos groupes, contributions, propositions,
        votes et notifications pour fournir le service. Les administrateurs de vos groupes peuvent
        consulter les informations nécessaires à leur gestion. Les notifications push et analyses IA
        sont facultatives selon votre configuration. Vous pouvez modifier vos préférences et
        demander la suppression de votre compte depuis votre profil. Les jetons sont protégés par le
        stockage sécurisé du téléphone ; sur le web, ils restent dans la session de cet onglet.
      </Text>
    </ScrollView>
  );
}
