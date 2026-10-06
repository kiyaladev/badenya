import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Summary from '@/components/analyses/group-insights';
import Recommendations from '@/components/analyses/ai-recommendations';
import Anomalies from '@/components/analyses/anomaly-detection';
import { getCapabilities } from '@/services/capabilities.service';
export default function Analyses() {
  const { section = 'summary' } = useLocalSearchParams<{ section?: string }>();
  const router = useRouter();
  const [available, setAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    getCapabilities().then(value => setAvailable(value.ai));
  }, []);
  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <Text className="text-xl font-bold text-gray-900 dark:text-white p-4">
        Analyses du groupe
      </Text>
      {available === false ? (
        <Text className="text-gray-700 dark:text-gray-200 p-4">
          Les analyses IA sont indisponibles : le service n’est pas configuré. Les rapports
          financiers restent accessibles dans le groupe.
        </Text>
      ) : available === null ? (
        <Text className="p-4 text-gray-700 dark:text-gray-200">Vérification du service…</Text>
      ) : (
        <>
          <View className="flex-row px-4">
            {[
              ['summary', 'Synthèse'],
              ['recommendations', 'Recommandations'],
              ['anomalies', 'Anomalies'],
            ].map(([key, label]) => (
              <TouchableOpacity
                key={key}
                accessibilityRole="tab"
                accessibilityState={{ selected: section === key }}
                className="flex-1 p-3"
                onPress={() => router.setParams({ section: key })}
              >
                <Text
                  className={
                    section === key
                      ? 'text-primary-600 font-bold'
                      : 'text-gray-600 dark:text-gray-300'
                  }
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {section === 'recommendations' ? (
            <Recommendations />
          ) : section === 'anomalies' ? (
            <Anomalies />
          ) : (
            <Summary />
          )}
        </>
      )}
    </View>
  );
}
