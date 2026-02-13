import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAIStore } from '@/store/aiStore';
import { useGroupStore } from '@/store/groupStore';
import { Button, Loading } from '@/components/ui';
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
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      case 'low':
        return 'bg-green-50 border-green-200';
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

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      savings: '💰',
      expenses: '💸',
      participation: '👥',
      growth: '📈',
      governance: '⚖️',
      communication: '💬',
      general: '💡',
    };
    return icons[category] || '💡';
  };

  if (!group) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-600 text-lg">Groupe non trouvé</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-primary-600">← Retour</Text>
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-gray-900 mb-2">💡 Recommandations IA</Text>
        <Text className="text-gray-600">{group.name}</Text>
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
          >
            {generating ? 'Génération en cours...' : '💡 Générer des recommandations'}
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
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                📋 Recommandations ({recommendations.recommendations.length})
              </Text>

              {recommendations.recommendations.map((rec: Recommendation, index: number) => (
                <View
                  key={index}
                  className={`mb-4 p-5 rounded-xl border ${getPriorityColor(rec.priority)}`}
                >
                  {/* Header */}
                  <View className="flex-row items-start mb-3">
                    <Text className="text-3xl mr-3">{getCategoryIcon(rec.category)}</Text>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="flex-1 text-base font-bold text-gray-900">
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
                      <Text className="text-xs text-gray-500 capitalize">{rec.category}</Text>
                    </View>
                  </View>

                  {/* Description */}
                  <Text className="text-gray-700 mb-3 leading-5">{rec.description}</Text>

                  {/* Impact */}
                  {rec.impact && (
                    <View className="bg-white/70 p-3 rounded-lg">
                      <Text className="text-xs text-gray-600 font-medium mb-1">Impact attendu</Text>
                      <Text className="text-sm text-gray-800">{rec.impact}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View className="mx-4 mt-4 bg-white rounded-xl p-8 items-center">
              <Text className="text-6xl mb-4">✅</Text>
              <Text className="text-gray-700 text-center font-medium">
                Aucune recommandation particulière
              </Text>
              <Text className="text-gray-500 text-sm text-center mt-2">
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
            >
              🔄 Régénérer
            </Button>
          </View>
        </>
      )}

      <View className="h-8" />
    </ScrollView>
  );
}
