import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAIStore } from '@/store/aiStore';
import { useGroupStore } from '@/store/groupStore';
import { Button, Loading } from '@/components/ui';
import { Anomaly } from '@/services/ai.service';

export default function AnomalyDetectionScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { groups } = useGroupStore();
  const { anomalies, isLoading, error, detectAnomalies, clearError, clearAnomalies } = useAIStore();

  const [detecting, setDetecting] = useState(false);

  const group = groups.find(g => g._id === groupId);

  useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error);
      clearError();
    }
  }, [error]);

  useEffect(() => {
    // Clear previous anomalies when component unmounts
    return () => {
      clearAnomalies();
    };
  }, []);

  const handleDetectAnomalies = async () => {
    if (!groupId) return;

    try {
      setDetecting(true);
      await detectAnomalies(groupId);
    } catch {
      // Error already handled by store
    } finally {
      setDetecting(false);
    }
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      case 'low':
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getSeverityTextColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return 'text-red-700';
      case 'medium':
        return 'text-yellow-700';
      case 'low':
        return 'text-blue-700';
    }
  };

  const getSeverityIcon = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return '🚨';
      case 'medium':
        return '⚠️';
      case 'low':
        return 'ℹ️';
    }
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

        <Text className="text-2xl font-bold text-gray-900 mb-2">🔍 Détection d'Anomalies</Text>
        <Text className="text-gray-600">{group.name}</Text>
      </View>

      {/* Info Section */}
      <View className="mx-4 mt-4 bg-blue-50 p-4 rounded-xl">
        <Text className="text-blue-800 font-medium mb-2">À propos de la détection</Text>
        <Text className="text-blue-700 text-sm">
          L'IA analyse les 3 derniers mois de transactions pour détecter les comportements
          inhabituels, montants suspects et schémas anormaux.
        </Text>
      </View>

      {/* Detect Button */}
      {!anomalies && (
        <View className="p-4">
          <Button
            onPress={handleDetectAnomalies}
            loading={detecting}
            disabled={detecting}
            variant="primary"
          >
            {detecting ? 'Analyse en cours...' : '🔍 Lancer la détection'}
          </Button>
        </View>
      )}

      {/* Loading */}
      {isLoading && !anomalies && <Loading />}

      {/* Results */}
      {anomalies && (
        <>
          {/* Summary */}
          <View className="bg-white p-6 mx-4 mt-4 rounded-xl">
            <Text className="text-lg font-semibold text-gray-900 mb-3">📊 Résumé</Text>
            <Text className="text-gray-700">{anomalies.summary}</Text>

            {anomalies.anomalies.length === 0 && (
              <View className="mt-4 bg-green-50 p-4 rounded-lg">
                <Text className="text-green-700 font-medium">✅ Aucune anomalie détectée</Text>
                <Text className="text-green-600 text-sm mt-1">
                  Vos transactions semblent normales et cohérentes.
                </Text>
              </View>
            )}
          </View>

          {/* Anomalies List */}
          {anomalies.anomalies.length > 0 && (
            <View className="px-4 mt-4">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                🚨 Anomalies détectées ({anomalies.anomalies.length})
              </Text>

              {anomalies.anomalies.map((anomaly: Anomaly, index: number) => (
                <View
                  key={index}
                  className={`mb-3 p-4 rounded-xl border ${getSeverityColor(anomaly.severity)}`}
                >
                  <View className="flex-row items-start mb-3">
                    <Text className="text-2xl mr-2">{getSeverityIcon(anomaly.severity)}</Text>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="font-semibold text-gray-800 flex-1">{anomaly.type}</Text>
                        <View
                          className={`px-2 py-1 rounded ${
                            anomaly.severity === 'high'
                              ? 'bg-red-100'
                              : anomaly.severity === 'medium'
                                ? 'bg-yellow-100'
                                : 'bg-blue-100'
                          }`}
                        >
                          <Text
                            className={`text-xs font-medium ${getSeverityTextColor(anomaly.severity)}`}
                          >
                            {anomaly.severity === 'high'
                              ? 'Élevé'
                              : anomaly.severity === 'medium'
                                ? 'Moyen'
                                : 'Faible'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <Text className="text-gray-700 mb-3">{anomaly.description}</Text>

                  {anomaly.recommendation && (
                    <View className="bg-white/50 p-3 rounded-lg">
                      <Text className="text-xs text-gray-600 font-medium mb-1">Recommandation</Text>
                      <Text className="text-sm text-gray-800">{anomaly.recommendation}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Reanalyze Button */}
          <View className="p-4">
            <Button
              onPress={handleDetectAnomalies}
              loading={detecting}
              disabled={detecting}
              variant="outline"
            >
              🔄 Réanalyser
            </Button>
          </View>
        </>
      )}

      <View className="h-8" />
    </ScrollView>
  );
}
