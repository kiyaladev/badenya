import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAIStore } from '@/store/aiStore';
import { Icon, Loading } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { AIInsight, AITrend, AIPrediction } from '@/services/ai.service';

export default function InsightDetailsScreen() {
  const router = useRouter();
  const { reportId } = useLocalSearchParams<{ reportId: string }>();
  const { currentInsight, isLoading, fetchInsightById } = useAIStore();

  useEffect(() => {
    if (reportId) {
      fetchInsightById(reportId);
    }
  }, [reportId]);

  if (isLoading || !currentInsight) {
    return <Loading />;
  }

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

  const getSeverityBg = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return 'bg-green-50 dark:bg-green-950';
      case 'down':
        return 'bg-red-50 dark:bg-red-950';
      case 'stable':
        return 'bg-gray-50 dark:bg-gray-900';
    }
  };

  const getCategoryIcon = (category: string): IconName => {
    const icons: Record<string, IconName> = {
      savings: 'money',
      expenses: 'credit-card',
      participation: 'users',
      growth: 'line-chart',
      risk: 'exclamation-triangle',
      performance: 'bullseye',
    };
    return icons[category] || 'lightbulb-o';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-gray-600 dark:text-gray-300';
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="bg-white dark:bg-gray-800 p-6 border-b border-gray-100 dark:border-gray-700">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-3 flex-row items-center"
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <Icon name="arrow-left" size={16} color="#0284c7" />
          <Text className="ml-2 text-primary-600">Retour</Text>
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">
          Rapport d'Insights IA
        </Text>
        <Text className="text-gray-600 dark:text-gray-300">
          {new Date(currentInsight.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Période: {new Date(currentInsight.periodStart).toLocaleDateString('fr-FR')} -{' '}
          {new Date(currentInsight.periodEnd).toLocaleDateString('fr-FR')}
        </Text>
        <Text className="text-xs text-gray-400 mt-1">
          {currentInsight.transactionsAnalyzed} transactions analysées • {currentInsight.modelUsed}
        </Text>
      </View>

      {/* Summary */}
      <View className="bg-white dark:bg-gray-800 p-6 mx-4 mt-4 rounded-xl">
        <View className="flex-row items-center mb-3">
          <Icon name="bar-chart" size={18} color="#111827" />
          <Text className="ml-2 text-lg font-semibold text-gray-900 dark:text-gray-50">Résumé</Text>
        </View>
        <Text className="text-gray-700 dark:text-gray-200 leading-6">
          {currentInsight.report.summary}
        </Text>

        <View className="flex-row justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <View>
            <Text className="text-xs text-gray-500 dark:text-gray-400">Cotisations</Text>
            <Text className="text-lg font-bold text-green-600">
              +{currentInsight.report.totalContributions.toLocaleString()}
            </Text>
          </View>
          <View>
            <Text className="text-xs text-gray-500 dark:text-gray-400">Dépenses</Text>
            <Text className="text-lg font-bold text-red-600">
              -{currentInsight.report.totalExpenses.toLocaleString()}
            </Text>
          </View>
          <View>
            <Text className="text-xs text-gray-500 dark:text-gray-400">Balance</Text>
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-50">
              {currentInsight.report.netBalance.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Insights */}
      {currentInsight.report.insights.length > 0 && (
        <View className="bg-white dark:bg-gray-800 p-6 mx-4 mt-4 rounded-xl">
          <View className="flex-row items-center mb-4">
            <Icon name="lightbulb-o" size={18} color="#111827" />
            <Text className="ml-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
              Insights Clés
            </Text>
          </View>

          {currentInsight.report.insights.map((insight: AIInsight, index: number) => (
            <View
              key={index}
              className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              <View className="flex-row items-center mb-2">
                <Icon name={getCategoryIcon(insight.category)} size={20} color="#374151" />
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-200 capitalize">
                  {insight.category}
                </Text>
              </View>
              <Text className="text-gray-700 dark:text-gray-200 mb-2">{insight.observation}</Text>
              <View className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                <Text className="text-xs text-blue-700 font-medium mb-1">Recommandation</Text>
                <Text className="text-sm text-blue-800">{insight.recommendation}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Trends */}
      {currentInsight.report.trends.length > 0 && (
        <View className="bg-white dark:bg-gray-800 p-6 mx-4 mt-4 rounded-xl">
          <View className="flex-row items-center mb-4">
            <Icon name="line-chart" size={18} color="#111827" />
            <Text className="ml-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
              Tendances
            </Text>
          </View>

          {currentInsight.report.trends.map((trend: AITrend, index: number) => (
            <View key={index} className={`mb-3 p-4 rounded-lg ${getSeverityBg(trend.direction)}`}>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="font-semibold text-gray-800 dark:text-gray-100">
                  {trend.metric}
                </Text>
                <View className="flex-row items-center">
                  <Icon
                    name={
                      trend.direction === 'up'
                        ? 'arrow-up'
                        : trend.direction === 'down'
                          ? 'arrow-down'
                          : 'minus'
                    }
                    size={14}
                    color={
                      trend.direction === 'up'
                        ? '#16a34a'
                        : trend.direction === 'down'
                          ? '#dc2626'
                          : '#4b5563'
                    }
                  />
                  <Text className={`text-lg font-bold ${getSeverityColor(trend.direction)}`}>
                    {trend.change > 0 ? '+' : ''}
                    {trend.change.toFixed(1)}%
                  </Text>
                </View>
              </View>
              <Text className="text-gray-600 dark:text-gray-300">
                Valeur actuelle: {trend.value.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Predictions */}
      {currentInsight.report.predictions.length > 0 && (
        <View className="bg-white dark:bg-gray-800 p-6 mx-4 mt-4 rounded-xl">
          <View className="flex-row items-center mb-4">
            <Icon name="bullseye" size={18} color="#111827" />
            <Text className="ml-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
              Prédictions
            </Text>
          </View>

          {currentInsight.report.predictions.map((prediction: AIPrediction, index: number) => (
            <View key={index} className="mb-3 p-4 bg-purple-50 rounded-lg">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="font-semibold text-gray-800 dark:text-gray-100">
                  {prediction.metric}
                </Text>
                <View className="bg-purple-100 px-2 py-1 rounded">
                  <Text className="text-xs text-purple-700 font-medium">
                    {prediction.timeframe}
                  </Text>
                </View>
              </View>
              <Text className="text-lg font-bold text-purple-700 mb-1">
                {prediction.predictedValue.toLocaleString()}
              </Text>
              <View className="flex-row items-center">
                <View className="flex-1 bg-gray-200 dark:bg-gray-600 h-2 rounded-full mr-2">
                  <View
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${prediction.confidence * 100}%` }}
                  />
                </View>
                <Text className={`text-xs ${getConfidenceColor(prediction.confidence)}`}>
                  {(prediction.confidence * 100).toFixed(0)}% confiance
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Generated By */}
      <View className="p-6 mx-4 mt-4 bg-gray-100 dark:bg-gray-700 rounded-xl">
        <Text className="text-xs text-gray-500 dark:text-gray-400">Généré par</Text>
        <Text className="text-sm text-gray-700 dark:text-gray-200">
          {currentInsight.generatedBy.fullName}
        </Text>
        {currentInsight.tokensUsed && (
          <Text className="text-xs text-gray-400 mt-1">
            {currentInsight.tokensUsed} tokens utilisés
          </Text>
        )}
      </View>

      <View className="h-8" />
    </ScrollView>
  );
}
