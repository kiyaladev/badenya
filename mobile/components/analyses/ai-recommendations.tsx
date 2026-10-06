import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAIStore } from '@/store/aiStore';
import { useGroupStore } from '@/store/groupStore';
import { Button, Icon, Loading } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { Recommendation } from '@/services/ai.service';

export default function AIRecommendationsScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { groups } = useGroupStore();
  const {
    recommendations,
    isLoading,
    error,
    generateRecommendations,
    clearError,
    clearRecommendations,
  } = useAIStore();

  const [generating, setGenerating] = useState(false);

  const group = groups.find(g => g._id === groupId);

  useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error);
      clearError();
    }
  }, [error]);

  useEffect(() => {
    // Clear previous recommendations when component unmounts
    return () => {
      clearRecommendations();
    };
  }, []);

  const handleGenerateRecommendations = async () => {
    if (!groupId) return;

    try {
      setGenerating(true);
      await generateRecommendations(groupId);
    } catch {
      // Error already handled by store
    } finally {
      setGenerating(false);
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 dark:bg-red-950 border-red-200';
      case 'medium':
        return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200';
      case 'low':
        return 'bg-green-50 dark:bg-green-950 border-green-200';
    }
  };

  const getPriorityTextColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'text-red-700';
      case 'medium':
        return 'text-yellow-700';
      case 'low':
        return 'text-green-700';
    }
  };

  const getCategoryIcon = (category: string): IconName => {
    const icons: Record<string, IconName> = {
      savings: 'money',
      expenses: 'credit-card',
      participation: 'users',
      growth: 'line-chart',
      governance: 'balance-scale',
      communication: 'comments',
      general: 'lightbulb-o',
    };
    return icons[category] || 'lightbulb-o';
  };

  if (!group) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Text className="text-gray-600 dark:text-gray-300 text-lg">Groupe non trouvé</Text>
      </View>
    );
  }

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

        <View className="flex-row items-center mb-2">
          <Icon name="lightbulb-o" size={24} color="#111827" />
          <Text className="ml-3 text-2xl font-bold text-gray-900 dark:text-gray-50">
            Recommandations IA
          </Text>
        </View>
        <Text className="text-gray-600 dark:text-gray-300">{group.name}</Text>
      </View>

      {/* Info Section */}
      <View className="mx-4 mt-4 bg-purple-50 p-4 rounded-xl">
        <Text className="text-purple-800 font-medium mb-2">À propos des recommandations</Text>
        <Text className="text-purple-700 text-sm">
          L'IA analyse les données de votre groupe et génère des recommandations personnalisées pour
          améliorer la gestion, augmenter l'épargne et optimiser les dépenses.
        </Text>
      </View>

      {/* Generate Button */}
      {!recommendations && (
        <View className="p-4">
          <Button
            onPress={handleGenerateRecommendations}
            loading={generating}
            disabled={generating}
            variant="primary"
            iconName="lightbulb-o"
          >
            {generating ? 'Génération en cours...' : 'Générer des recommandations'}
          </Button>
        </View>
      )}

      {/* Loading */}
      {isLoading && !recommendations && <Loading />}

      {/* Results */}
      {recommendations && (
        <>
          {/* Recommendations List */}
          {recommendations.recommendations.length > 0 ? (
            <View className="px-4 mt-4">
              <View className="flex-row items-center mb-3">
                <Icon name="list" size={18} color="#111827" />
                <Text className="ml-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Recommandations ({recommendations.recommendations.length})
                </Text>
              </View>

              {recommendations.recommendations.map((rec: Recommendation, index: number) => (
                <View
                  key={index}
                  className={`mb-4 p-5 rounded-xl border ${getPriorityColor(rec.priority)}`}
                >
                  {/* Header */}
                  <View className="flex-row items-start mb-3">
                    <View className="mr-3 mt-1">
                      <Icon name={getCategoryIcon(rec.category)} size={28} color="#374151" />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="flex-1 text-base font-bold text-gray-900 dark:text-gray-50">
                          {rec.title}
                        </Text>
                        <View
                          className={`ml-2 px-2 py-1 rounded ${
                            rec.priority === 'high'
                              ? 'bg-red-100'
                              : rec.priority === 'medium'
                                ? 'bg-yellow-100'
                                : 'bg-green-100'
                          }`}
                        >
                          <Text
                            className={`text-xs font-medium ${getPriorityTextColor(rec.priority)}`}
                          >
                            {rec.priority === 'high'
                              ? 'Urgent'
                              : rec.priority === 'medium'
                                ? 'Important'
                                : 'Optionnel'}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {rec.category}
                      </Text>
                    </View>
                  </View>

                  {/* Description */}
                  <Text className="text-gray-700 dark:text-gray-200 mb-3 leading-5">
                    {rec.description}
                  </Text>

                  {/* Impact */}
                  {rec.impact && (
                    <View className="bg-white/70 p-3 rounded-lg">
                      <Text className="text-xs text-gray-600 dark:text-gray-300 font-medium mb-1">
                        Impact attendu
                      </Text>
                      <Text className="text-sm text-gray-800 dark:text-gray-100">{rec.impact}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View className="mx-4 mt-4 bg-white dark:bg-gray-800 rounded-xl p-8 items-center">
              <Icon name="check-circle" size={48} color="#16a34a" />
              <Text className="text-gray-700 dark:text-gray-200 text-center font-medium">
                Aucune recommandation particulière
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-sm text-center mt-2">
                Votre groupe fonctionne bien. Continuez ainsi!
              </Text>
            </View>
          )}

          {/* Regenerate Button */}
          <View className="p-4">
            <Button
              onPress={handleGenerateRecommendations}
              loading={generating}
              disabled={generating}
              variant="outline"
              iconName="refresh"
            >
              Régénérer
            </Button>
          </View>
        </>
      )}

      <View className="h-8" />
    </ScrollView>
  );
}
