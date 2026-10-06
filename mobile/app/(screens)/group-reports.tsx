import { Alert } from '@/services/dialog.service';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import reportService, { ReportSummary } from '@/services/report.service';
import { Button } from '@/components/ui';
import { useGroupStore } from '@/store/groupStore';
import logger from '@/services/logger';

type ReportPeriod = 'all' | 'month' | 'year' | 'custom';
type DateField = 'start' | 'end';

const categoryDotClasses = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-red-500',
  'bg-violet-500',
];

const getPeriodRange = (
  period: ReportPeriod,
  customStartDate: Date,
  customEndDate: Date
): { startDate?: string; endDate?: string } => {
  if (period === 'month') {
    const now = new Date();
    return {
      startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString(),
    };
  }

  if (period === 'year') {
    const now = new Date();
    return {
      startDate: new Date(now.getFullYear(), 0, 1).toISOString(),
      endDate: new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString(),
    };
  }

  if (period === 'custom') {
    const start = new Date(customStartDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(customEndDate);
    end.setHours(23, 59, 59, 999);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }

  return {};
};

const formatDate = (date: Date) =>
  date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

export default function GroupReportsScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { groups } = useGroupStore();

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('all');
  const [customStartDate, setCustomStartDate] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [customEndDate, setCustomEndDate] = useState(() => new Date());
  const [dateField, setDateField] = useState<DateField | null>(null);

  const group = groups.find(g => g._id === groupId);
  const currency = group?.currency || 'XOF';

  const getSelectedPeriod = () => getPeriodRange(selectedPeriod, customStartDate, customEndDate);

  const handlePeriodChange = (period: ReportPeriod) => {
    setSelectedPeriod(period);
    if (period === 'custom') {
      setDateField(null);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setDateField(null);
    if (event.type === 'dismissed' || !date) return;

    if (dateField === 'start') {
      if (date > customEndDate) {
        Alert.alert('Période invalide', 'La date de début doit précéder la date de fin.');
        return;
      }
      setCustomStartDate(date);
      return;
    }

    if (date < customStartDate) {
      Alert.alert('Période invalide', 'La date de fin doit suivre la date de début.');
      return;
    }
    setCustomEndDate(date);
  };

  useEffect(() => {
    if (groupId && (selectedPeriod !== 'custom' || customStartDate <= customEndDate)) {
      void loadSummary();
    }
  }, [groupId, selectedPeriod, customStartDate, customEndDate]);

  const loadSummary = async () => {
    try {
      setLoading(true);

      const { startDate, endDate } = getSelectedPeriod();
      const data = await reportService.getGroupSummary(groupId!, startDate, endDate);
      setSummary(data);
    } catch (err: unknown) {
      const error = err as { message?: string };
      logger.error('GroupReports', 'Error loading summary', error);
      Alert.alert('Erreur', 'Impossible de charger le rapport');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!group) return;

    try {
      setDownloading(true);
      const { startDate, endDate } = getSelectedPeriod();
      const uri = await reportService.downloadPdfReport(groupId!, group.name, startDate, endDate);
      const shared = await reportService.shareReport(uri, 'application/pdf');
      if (!shared) Alert.alert('Rapport enregistré', `Le fichier est disponible ici : ${uri}`);
    } catch (err: unknown) {
      const error = err as { message?: string };
      logger.error('GroupReports', 'Error downloading PDF', error);
      Alert.alert('Erreur', 'Impossible de télécharger le rapport PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!group) return;

    try {
      setDownloading(true);
      const { startDate, endDate } = getSelectedPeriod();
      const uri = await reportService.downloadExcelReport(groupId!, group.name, startDate, endDate);
      const shared = await reportService.shareReport(
        uri,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      if (!shared) Alert.alert('Export enregistré', `Le fichier est disponible ici : ${uri}`);
    } catch (err: unknown) {
      const error = err as { message?: string };
      logger.error('GroupReports', 'Error downloading Excel', error);
      Alert.alert('Erreur', "Impossible de télécharger l'export Excel");
    } finally {
      setDownloading(false);
    }
  };

  if (!group) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <Text className="text-gray-600 dark:text-gray-300">Groupe non trouvé</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="px-6 py-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Rapports Financiers
          </Text>
          <Text className="text-gray-600 dark:text-gray-300">{group.name}</Text>
        </View>

        {/* Period Selector */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Période</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
            <View className="flex-row px-1">
              {(['all', 'month', 'year', 'custom'] as const).map(period => (
                <TouchableOpacity
                  key={period}
                  onPress={() => handlePeriodChange(period)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedPeriod === period }}
                  className={`mr-2 rounded-lg border px-4 py-2 ${
                    selectedPeriod === period
                      ? 'bg-blue-500'
                      : 'bg-white dark:bg-gray-800 border border-gray-300'
                  }`}
                >
                  <Text
                    className={`text-center font-medium ${
                      selectedPeriod === period ? 'text-white' : 'text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {period === 'all'
                      ? 'Tout'
                      : period === 'month'
                        ? 'Ce mois'
                        : period === 'year'
                          ? 'Cette année'
                          : 'Personnalisé'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {selectedPeriod === 'custom' && (
            <View className="mt-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-3">
              <Text className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                Choisissez une période précise
              </Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => setDateField('start')}
                  accessibilityRole="button"
                  accessibilityLabel={`Date de début : ${formatDate(customStartDate)}`}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                >
                  <Text className="text-xs text-gray-500 dark:text-gray-400">Début</Text>
                  <Text className="font-medium text-gray-800 dark:text-gray-100">
                    {formatDate(customStartDate)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDateField('end')}
                  accessibilityRole="button"
                  accessibilityLabel={`Date de fin : ${formatDate(customEndDate)}`}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                >
                  <Text className="text-xs text-gray-500 dark:text-gray-400">Fin</Text>
                  <Text className="font-medium text-gray-800 dark:text-gray-100">
                    {formatDate(customEndDate)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {dateField && (
            <DateTimePicker
              value={dateField === 'start' ? customStartDate : customEndDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={dateField === 'start' ? customEndDate : undefined}
              minimumDate={dateField === 'end' ? customStartDate : undefined}
              onChange={handleDateChange}
            />
          )}
        </View>

        {loading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-600 dark:text-gray-300 mt-4">Chargement du rapport...</Text>
          </View>
        ) : summary ? (
          <>
            {/* Summary Cards */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
                Résumé
              </Text>

              <View className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 shadow-sm">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-600 dark:text-gray-300">Total Contributions</Text>
                  <Text className="text-lg font-semibold text-green-600">
                    +{summary.totalContributions.toLocaleString()} {currency}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-600 dark:text-gray-300">Total Dépenses</Text>
                  <Text className="text-lg font-semibold text-red-600">
                    -{summary.totalExpenses.toLocaleString()} {currency}
                  </Text>
                </View>

                {summary.totalRefunds > 0 && (
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-gray-600 dark:text-gray-300">Remboursements</Text>
                    <Text className="text-lg font-semibold text-blue-600">
                      +{summary.totalRefunds.toLocaleString()} {currency}
                    </Text>
                  </View>
                )}

                <View className="border-t border-gray-200 dark:border-gray-600 my-2" />

                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-800 dark:text-gray-100 font-semibold">
                    Balance Nette
                  </Text>
                  <Text
                    className={`text-xl font-bold ${summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {summary.netBalance >= 0 ? '+' : ''}
                    {summary.netBalance.toLocaleString()} {currency}
                  </Text>
                </View>

                <Text className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                  {summary.transactionCount} transactions
                </Text>
              </View>
            </View>

            {/* Category Breakdown */}
            {summary.expensesByCategory.length > 0 && (
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
                  Dépenses par Catégorie
                </Text>
                <View className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  {summary.expensesByCategory.slice(0, 5).map((cat, index) => (
                    <View key={cat.category} className="flex-row justify-between items-center mb-3">
                      <View className="flex-row items-center flex-1">
                        <View
                          className={`mr-2 h-3 w-3 rounded-full ${categoryDotClasses[index % categoryDotClasses.length]}`}
                        />
                        <Text className="text-gray-700 dark:text-gray-200 flex-1">
                          {cat.category}
                        </Text>
                      </View>
                      <Text className="text-gray-900 dark:text-gray-50 font-medium">
                        {cat.amount.toLocaleString()} {currency}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Top Contributors */}
            {summary.contributionsByMember.length > 0 && (
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
                  Top Contributeurs
                </Text>
                <View className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  {summary.contributionsByMember.slice(0, 5).map((member, index) => (
                    <View
                      key={member.userId}
                      className="flex-row justify-between items-center mb-3"
                    >
                      <View className="flex-row items-center flex-1">
                        <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3">
                          <Text className="text-blue-600 text-sm font-bold">{index + 1}</Text>
                        </View>
                        <Text className="text-gray-700 dark:text-gray-200 flex-1">
                          {member.userName}
                        </Text>
                      </View>
                      <Text className="text-gray-900 dark:text-gray-50 font-medium">
                        {member.amount.toLocaleString()} {currency}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Download Actions */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
                Télécharger et Partager
              </Text>

              <Button
                title="Télécharger PDF"
                iconName="file-pdf-o"
                onPress={handleDownloadPdf}
                loading={downloading}
                className="mb-3"
              />

              <Button
                title="Exporter Excel"
                iconName="file-excel-o"
                onPress={handleDownloadExcel}
                loading={downloading}
                variant="outline"
              />
            </View>
          </>
        ) : (
          <View className="items-center py-12">
            <Text className="text-gray-600 dark:text-gray-300">Aucune donnée disponible</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
