import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import reportService, { ReportSummary } from '@/services/report.service';
import { Button } from '@/components/ui';
import { useGroupStore } from '@/store/groupStore';

export default function GroupReportsScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { groups } = useGroupStore();

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'month' | 'year' | 'custom'>('all');

  const group = groups.find(g => g._id === groupId);

  useEffect(() => {
    if (groupId) {
      loadSummary();
    }
  }, [groupId, selectedPeriod]);

  const loadSummary = async () => {
    try {
      setLoading(true);

      let startDate: string | undefined;
      let endDate: string | undefined;

      if (selectedPeriod === 'month') {
        // Current month
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
      } else if (selectedPeriod === 'year') {
        // Current year
        const now = new Date();
        startDate = new Date(now.getFullYear(), 0, 1).toISOString();
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString();
      }

      const data = await reportService.getGroupSummary(groupId!, startDate, endDate);
      setSummary(data);
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error('Error loading summary:', error);
      Alert.alert('Erreur', 'Impossible de charger le rapport');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!group) return;

    try {
      setDownloading(true);
      const url = await reportService.downloadPdfReport(groupId!, group.name);

      // Open in browser
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        Alert.alert('Info', "Le rapport PDF s'ouvrira dans votre navigateur");
      } else {
        throw new Error('Cannot open URL');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error('Error downloading PDF:', error);
      Alert.alert('Erreur', "Impossible d'ouvrir le rapport PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!group) return;

    try {
      setDownloading(true);
      const url = await reportService.downloadExcelReport(groupId!, group.name);

      // Open in browser
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        Alert.alert('Info', "L'export Excel s'ouvrira dans votre navigateur");
      } else {
        throw new Error('Cannot open URL');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error('Error downloading Excel:', error);
      Alert.alert('Erreur', "Impossible d'ouvrir l'export Excel");
    } finally {
      setDownloading(false);
    }
  };

  if (!group) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-600">Groupe non trouvé</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 mb-2">Rapports Financiers</Text>
          <Text className="text-gray-600">{group.name}</Text>
        </View>

        {/* Period Selector */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">Période</Text>
          <View className="flex-row space-x-2">
            {(['all', 'month', 'year'] as const).map(period => (
              <TouchableOpacity
                key={period}
                onPress={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg flex-1 ${
                  selectedPeriod === period ? 'bg-blue-500' : 'bg-white border border-gray-300'
                }`}
              >
                <Text
                  className={`text-center font-medium ${
                    selectedPeriod === period ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {period === 'all' ? 'Tout' : period === 'month' ? 'Ce mois' : 'Cette année'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-600 mt-4">Chargement du rapport...</Text>
          </View>
        ) : summary ? (
          <>
            {/* Summary Cards */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-800 mb-3">Résumé</Text>

              <View className="bg-white rounded-lg p-4 mb-3 shadow-sm">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-600">Total Contributions</Text>
                  <Text className="text-lg font-semibold text-green-600">
                    +{summary.totalContributions.toLocaleString()} {group.currency}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-600">Total Dépenses</Text>
                  <Text className="text-lg font-semibold text-red-600">
                    -{summary.totalExpenses.toLocaleString()} {group.currency}
                  </Text>
                </View>

                {summary.totalRefunds > 0 && (
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-gray-600">Remboursements</Text>
                    <Text className="text-lg font-semibold text-blue-600">
                      +{summary.totalRefunds.toLocaleString()} {group.currency}
                    </Text>
                  </View>
                )}

                <View className="border-t border-gray-200 my-2" />

                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-800 font-semibold">Balance Nette</Text>
                  <Text
                    className={`text-xl font-bold ${summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {summary.netBalance >= 0 ? '+' : ''}
                    {summary.netBalance.toLocaleString()} {group.currency}
                  </Text>
                </View>

                <Text className="text-gray-500 text-sm mt-2">
                  {summary.transactionCount} transactions
                </Text>
              </View>
            </View>

            {/* Category Breakdown */}
            {summary.expensesByCategory.length > 0 && (
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-800 mb-3">
                  Dépenses par Catégorie
                </Text>
                <View className="bg-white rounded-lg p-4 shadow-sm">
                  {summary.expensesByCategory.slice(0, 5).map((cat, index) => (
                    <View key={cat.category} className="flex-row justify-between items-center mb-3">
                      <View className="flex-row items-center flex-1">
                        <View
                          className="w-3 h-3 rounded-full mr-2"
                          style={{
                            backgroundColor: [
                              '#3B82F6',
                              '#10B981',
                              '#F59E0B',
                              '#EF4444',
                              '#8B5CF6',
                            ][index % 5],
                          }}
                        />
                        <Text className="text-gray-700 flex-1">{cat.category}</Text>
                      </View>
                      <Text className="text-gray-900 font-medium">
                        {cat.amount.toLocaleString()} {group.currency}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Top Contributors */}
            {summary.contributionsByMember.length > 0 && (
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-800 mb-3">Top Contributeurs</Text>
                <View className="bg-white rounded-lg p-4 shadow-sm">
                  {summary.contributionsByMember.slice(0, 5).map((member, index) => (
                    <View
                      key={member.userId}
                      className="flex-row justify-between items-center mb-3"
                    >
                      <View className="flex-row items-center flex-1">
                        <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3">
                          <Text className="text-blue-600 text-sm font-bold">{index + 1}</Text>
                        </View>
                        <Text className="text-gray-700 flex-1">{member.userName}</Text>
                      </View>
                      <Text className="text-gray-900 font-medium">
                        {member.amount.toLocaleString()} {group.currency}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Download Actions */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-800 mb-3">
                Télécharger et Partager
              </Text>

              <Button
                title="📄 Télécharger PDF"
                onPress={handleDownloadPdf}
                loading={downloading}
                className="mb-3"
              />

              <Button
                title="📊 Exporter Excel"
                onPress={handleDownloadExcel}
                loading={downloading}
                variant="outline"
              />
            </View>
          </>
        ) : (
          <View className="items-center py-12">
            <Text className="text-gray-600">Aucune donnée disponible</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
