import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from '@/services/dialog.service';
import { useAIStore } from '@/store/aiStore';
import { useGroupStore } from '@/store/groupStore';
import { Button, Icon, Loading } from '@/components/ui';

export default function GroupAnalyses() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { groups } = useGroupStore();
  const { insights, isLoading, error, generateInsights, fetchGroupInsights, clearError } =
    useAIStore();

  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const group = groups.find(g => g._id === groupId);

  useEffect(() => {
    if (groupId) fetchGroupInsights(groupId);
  }, [groupId, fetchGroupInsights]);

  useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error);
      clearError();
    }
  }, [error, clearError]);

  const handleRefresh = async () => {
    if (!groupId) return;
    setRefreshing(true);
    await fetchGroupInsights(groupId);
    setRefreshing(false);
  };

  const handleAnalyze = async () => {
    if (!groupId) return;
    setGenerating(true);
    try {
      // Analyse the last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      await generateInsights(groupId, startDate, endDate);
    } catch {
      // Error already surfaced by the store
    } finally {
      setGenerating(false);
    }
  };

  if (!group) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Text className="text-gray-600 dark:text-gray-300 text-lg">Groupe introuvable</Text>
      </View>
    );
  }

  if (isLoading && insights.length === 0) {
    return <Loading />;
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View className="p-4">
        <Button onPress={handleAnalyze} loading={generating} disabled={generating}>
          {generating ? 'Analyse en cours...' : 'Analyser'}
        </Button>
      </View>

      {insights.length === 0 && !isLoading ? (
        <Text className="mx-4 text-gray-600 dark:text-gray-300 text-center">
          Aucune analyse pour ce groupe.
        </Text>
      ) : (
        <View className="px-4">
          {insights.map(insight => (
            <TouchableOpacity
              key={insight._id}
              onPress={() => router.push(`/(screens)/insight-details?reportId=${insight._id}`)}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 border border-gray-100 dark:border-gray-700"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm text-gray-600 dark:text-gray-300">
                  {new Date(insight.periodStart).toLocaleDateString('fr-FR')} -{' '}
                  {new Date(insight.periodEnd).toLocaleDateString('fr-FR')}
                </Text>
                <Icon name="chevron-right" size={12} color="#9ca3af" />
              </View>
              <Text className="text-gray-800 dark:text-gray-100 mb-3" numberOfLines={2}>
                {insight.report.summary}
              </Text>
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">Cotisations</Text>
                  <Text className="text-sm font-semibold text-green-600">
                    +{insight.report.totalContributions.toLocaleString()} {group.currency}
                  </Text>
                </View>
                <View>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">Dépenses</Text>
                  <Text className="text-sm font-semibold text-red-600">
                    -{insight.report.totalExpenses.toLocaleString()} {group.currency}
                  </Text>
                </View>
                <View>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">Solde</Text>
                  <Text className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                    {insight.report.netBalance.toLocaleString()} {group.currency}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View className="h-8" />
    </ScrollView>
  );
}
