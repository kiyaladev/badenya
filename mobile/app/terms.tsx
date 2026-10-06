import { ScrollView, Text } from 'react-native';
export default function LegalPage() {
  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900 p-6">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Conditions d’utilisation
      </Text>
      <Text className="text-gray-700 dark:text-gray-200 leading-7">
        Badenya permet de suivre les décisions et opérations de vos groupes. Les montants
        enregistrés décrivent les opérations déclarées par les membres ; le service ne réalise pas
        de transfert bancaire ou mobile money. Les responsables du groupe vérifient les cotisations
        et autorisent les dépenses selon les règles de vote. Ne partagez pas vos identifiants ni le
        code d’invitation avec des personnes non autorisées. Pour une demande relative au service,
        utilisez le formulaire de contact du site public.
      </Text>
    </ScrollView>
  );
}
