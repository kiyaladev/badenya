import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAIStore } from '@/store/aiStore';
import { Loading } from '@/components/ui';
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
        return 'text-gray-600';
    }
  };

  const getSeverityBg = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return 'bg-green-50';
      case 'down':
        return 'bg-red-50';
      case 'stable':
        return 'bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      savings: '💰',
      expenses: '💸',
      participation: '👥',
      growth: '📈',
      risk: '⚠️',
      performance: '🎯',
    };
    return icons[category] || '💡';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-primary-600">← Retour</Text>
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-gray-900 mb-2">Rapport d'Insights IA</Text>
        <Text className="text-gray-600">
          {new Date(currentInsight.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
        <Text className="text-sm text-gray-500 mt-1">
          Période: {new Date(currentInsight.periodStart).toLocaleDateString('fr-FR')} -{' '}
          {new Date(currentInsight.periodEnd).toLocaleDateString('fr-FR')}
        </Text>
        <Text className="text-xs text-gray-400 mt-1">
          {currentInsight.transactionsAnalyzed} transactions analysées • {currentInsight.modelUsed}
        </Text>
      </View>

      {/* Summary */}
      <View className="bg-white p-6 mx-4 mt-4 rounded-xl">
        <Text className="text-lg font-semibold text-gray-900 mb-3">📊 Résumé</Text>
        <Text className="text-gray-700 leading-6">{currentInsight.report.summary}</Text>

        <View className="flex-row justify-between mt-4 pt-4 border-t border-gray-100">
          <View>
            <Text className="text-xs text-gray-500">Cotisations</Text>
            <Text className="text-lg font-bold text-green-600">
              +{currentInsight.report.totalContributions.toLocaleString()}
            </Text>
          </View>
          <View>
            <Text className="text-xs text-gray-500">Dépenses</Text>
            <Text className="text-lg font-bold text-red-600">
              -{currentInsight.report.totalExpenses.toLocaleString()}
            </Text>
          </View>
          <View>
            <Text className="text-xs text-gray-500">Balance</Text>
            <Text className="text-lg font-bold text-gray-900">
              {currentInsight.report.netBalance.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Insights */}
      {currentInsight.report.insights.length > 0 && (
        <View className="bg-white p-6 mx-4 mt-4 rounded-xl">
          <Text className="text-lg font-semibold text-gray-900 mb-4">💡 Insights Clés</Text>

          {currentInsight.report.insights.map((insight: AIInsight, index: number) => (
            <View key={index} className="mb-4 pb-4 border-b border-gray-100 last:border-b-0">
              <View className="flex-row items-center mb-2">
                <Text className="text-2xl mr-2">{getCategoryIcon(insight.category)}</Text>
                <Text className="text-sm font-semibold text-gray-700 capitalize">
                  {insight.category}
                </Text>
              </View>
              <Text className="text-gray-700 mb-2">{insight.observation}</Text>
              <View className="bg-blue-50 p-3 rounded-lg">
                <Text className="text-xs text-blue-700 font-medium mb-1">Recommandation</Text>
                <Text className="text-sm text-blue-800">{insight.recommendation}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Trends */}
      {currentInsight.report.trends.length > 0 && (
        <View className="bg-white p-6 mx-4 mt-4 rounded-xl">
          <Text className="text-lg font-semibold text-gray-900 mb-4">📈 Tendances</Text>

          {currentInsight.report.trends.map((trend: AITrend, index: number) => (
            <View key={index} className={`mb-3 p-4 rounded-lg ${getSeverityBg(trend.direction)}`}>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="font-semibold text-gray-800">{trend.metric}</Text>
                <View className="flex-row items-center">
                  <Text className={`text-lg font-bold ${getSeverityColor(trend.direction)}`}>
                    {trend.change > 0 ? '+' : ''}
                    {trend.change.toFixed(1)}%
                  </Text>
                </View>
              </View>
              <Text className="text-gray-600">Valeur actuelle: {trend.value.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Predictions */}
      {currentInsight.report.predictions.length > 0 && (
        <View className="bg-white p-6 mx-4 mt-4 rounded-xl">
          <Text className="text-lg font-semibold text-gray-900 mb-4">🔮 Prédictions</Text>

          {currentInsight.report.predictions.map((prediction: AIPrediction, index: number) => (
            <View key={index} className="mb-3 p-4 bg-purple-50 rounded-lg">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="font-semibold text-gray-800">{prediction.metric}</Text>
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
                <View className="flex-1 bg-gray-200 h-2 rounded-full mr-2">
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
      <View className="p-6 mx-4 mt-4 bg-gray-100 rounded-xl">
        <Text className="text-xs text-gray-500">Généré par</Text>
        <Text className="text-sm text-gray-700">
          {currentInsight.generatedBy.firstName} {currentInsight.generatedBy.lastName}
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
