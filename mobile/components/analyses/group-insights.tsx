import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAIStore } from '@/store/aiStore';
import { useGroupStore } from '@/store/groupStore';
import { Button, Icon, Loading } from '@/components/ui';
import type { IconName } from '@/components/ui/Icon';

const styles = StyleSheet.create({
  detailsIcon: {
    marginLeft: 6,
  },
});

export default function GroupInsightsScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { groups } = useGroupStore();
  const { insights, isLoading, error, generateInsights, fetchGroupInsights, clearError } =
    useAIStore();

  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const group = groups.find(g => g._id === groupId);

  useEffect(() => {
    if (groupId) {
      loadInsights();
    }
  }, [groupId]);

  useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error);
      clearError();
    }
  }, [error]);

  const loadInsights = async () => {
    if (!groupId) return;
    await fetchGroupInsights(groupId);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInsights();
    setRefreshing(false);
  };

  const handleGenerateInsights = async () => {
    if (!groupId) return;

    try {
      setGenerating(true);
      // Generate insights for the last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      await generateInsights(groupId, startDate, endDate);
      Alert.alert('Succès', 'Insights générés avec succès!');
    } catch {
      // Error already handled by store
    } finally {
      setGenerating(false);
    }
  };

  const handleViewInsight = (reportId: string) => {
    router.push(`/(screens)/insight-details?reportId=${reportId}`);
  };

  const getSeverityColor = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
        return 'text-gray-600 dark:text-gray-300';
    }
  };

  const getSeverityIcon = (direction: 'up' | 'down' | 'stable'): IconName => {
    switch (direction) {
      case 'up':
        return 'arrow-up';
      case 'down':
        return 'arrow-down';
      case 'stable':
        return 'minus';
    }
  };

  if (!group) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Text className="text-gray-600 dark:text-gray-300 text-lg">Groupe non trouvé</Text>
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
      {/* Header */}
      <View className="bg-white dark:bg-gray-800 p-6 border-b border-gray-100 dark:border-gray-700">
        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">Insights IA</Text>
        <Text className="text-gray-600 dark:text-gray-300">{group.name}</Text>
      </View>

      {/* Generate Button */}
      <View className="p-4">
        <Button
          onPress={handleGenerateInsights}
          loading={generating}
          disabled={generating}
          variant="primary"
        >
          {generating ? 'Génération en cours...' : 'Générer de nouveaux insights'}
        </Button>
      </View>

      {/* AI Service Status */}
      {insights.length === 0 && !isLoading && (
        <View className="mx-4 mb-4 bg-blue-50 dark:bg-blue-950 p-4 rounded-xl">
          <View className="flex-row items-center mb-2">
            <Icon name="lightbulb-o" size={16} color="#1e40af" />
            <Text className="text-blue-800 font-medium ml-2">À propos des Insights IA</Text>
          </View>
          <Text className="text-blue-700 text-sm">
            L'intelligence artificielle analyse vos transactions et génère des insights
            personnalisés, détecte les anomalies et propose des recommandations pour améliorer la
            gestion de votre groupe.
          </Text>
        </View>
      )}

      {/* Insights List */}
      {insights.length > 0 ? (
        <View className="px-4">
          <Text className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-3">
            Rapports récents
          </Text>

          {insights.map(insight => (
            <TouchableOpacity
              key={insight._id}
              onPress={() => handleViewInsight(insight._id)}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 border border-gray-100 dark:border-gray-700"
              activeOpacity={0.7}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(insight.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {new Date(insight.periodStart).toLocaleDateString('fr-FR')} -{' '}
                    {new Date(insight.periodEnd).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <View className="bg-primary-50 dark:bg-gray-800 px-3 py-1 rounded-full">
                  <Text className="text-primary-700 text-xs font-medium">
                    {insight.transactionsAnalyzed} transactions
                  </Text>
                </View>
              </View>

              {/* Summary */}
              <Text className="text-gray-800 dark:text-gray-100 mb-3" numberOfLines={2}>
                {insight.report.summary}
              </Text>

              {/* Stats */}
              <View className="flex-row justify-between mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
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
                  <Text className="text-xs text-gray-500 dark:text-gray-400">Balance</Text>
                  <Text className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                    {insight.report.netBalance.toLocaleString()} {group.currency}
                  </Text>
                </View>
              </View>

              {/* Insights Preview */}
              {insight.report.insights.length > 0 && (
                <View className="mb-2">
                  <Text className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
                    {insight.report.insights.length} insights
                  </Text>
                  <Text className="text-xs text-gray-600 dark:text-gray-300" numberOfLines={1}>
                    {insight.report.insights[0].observation}
                  </Text>
                </View>
              )}

              {/* Trends Preview */}
              {insight.report.trends.length > 0 && (
                <View className="flex-row flex-wrap gap-2">
                  {insight.report.trends.slice(0, 3).map((trend, index) => (
                    <View
                      key={index}
                      className="flex-row items-center bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded"
                    >
                      <Icon name={getSeverityIcon(trend.direction)} size={12} color="#6b7280" />
                      <Text className={`text-xs ${getSeverityColor(trend.direction)}`}>
                        {trend.metric}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* View Details */}
              <View className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <View className="flex-row items-center justify-center">
                  <Text className="text-primary-600 text-sm font-medium">Voir les détails</Text>
                  <Icon name="arrow-right" size={14} color="#0284c7" style={styles.detailsIcon} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        !isLoading && (
          <View className="mx-4 bg-white dark:bg-gray-800 rounded-xl p-8 items-center">
            <Icon name="lightbulb-o" size={48} color="#0284c7" />
            <Text className="text-gray-600 dark:text-gray-300 text-center">
              Aucun insight généré pour ce groupe
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-sm text-center mt-2">
              Générez votre premier rapport d'insights pour obtenir des analyses détaillées
            </Text>
          </View>
        )
      )}

      {/* Additional Actions */}
      <View className="p-4 space-y-3">
        <Button onPress={() => router.setParams({ section: 'anomalies' })} variant="outline">
          Détecter les anomalies
        </Button>
        <Button onPress={() => router.setParams({ section: 'recommendations' })} variant="outline">
          Obtenir des recommandations
        </Button>
      </View>

      <View className="h-8" />
    </ScrollView>
  );
}
