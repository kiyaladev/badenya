import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import GroupAnalyses from '@/components/analyses/group-insights';
import { getCapabilities } from '@/services/capabilities.service';

export default function Analyses() {
  const [available, setAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    getCapabilities().then(value => setAvailable(value.ai));
  }, []);

  if (available === null) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900">
        <Text className="p-4 text-gray-700 dark:text-gray-200">Vérification du service…</Text>
      </View>
    );
  }
  if (!available) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900">
        <Text className="text-gray-700 dark:text-gray-200 p-4">
          Les analyses sont indisponibles pour le moment. Les rapports financiers restent
          accessibles dans le groupe.
        </Text>
      </View>
    );
  }
  return <GroupAnalyses />;
}
