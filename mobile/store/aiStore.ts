import { create } from 'zustand';
import { getErrorMessage } from '../utils/errorHandler';
import aiService, {
  AIReport,
  AnomalyDetectionResult,
  RecommendationsResult,
} from '../services/ai.service';

interface AIState {
  insights: AIReport[];
  currentInsight: AIReport | null;
  anomalies: AnomalyDetectionResult | null;
  recommendations: RecommendationsResult | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  generateInsights: (groupId: string, startDate?: Date, endDate?: Date) => Promise<AIReport>;
  fetchGroupInsights: (groupId: string, page?: number) => Promise<void>;
  fetchInsightById: (reportId: string) => Promise<void>;
  detectAnomalies: (groupId: string) => Promise<void>;
  generateRecommendations: (groupId: string) => Promise<void>;
  deleteInsight: (reportId: string) => Promise<void>;
  clearError: () => void;
  clearAnomalies: () => void;
  clearRecommendations: () => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  insights: [],
  currentInsight: null,
  anomalies: null,
  recommendations: null,
  isLoading: false,
  error: null,

  generateInsights: async (groupId: string, startDate?: Date, endDate?: Date) => {
    set({ isLoading: true, error: null });
    try {
      const newInsight = await aiService.generateInsights(groupId, startDate, endDate);
      const { insights } = get();
      set({
        insights: [newInsight, ...insights],
        currentInsight: newInsight,
        isLoading: false,
      });
      return newInsight;
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to generate insights');
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  fetchGroupInsights: async (groupId: string, page: number = 1) => {
    set({ isLoading: true, error: null });
    try {
      const { reports } = await aiService.getGroupInsights(groupId, page);
      set({ insights: reports, isLoading: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to fetch insights');
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchInsightById: async (reportId: string) => {
    set({ isLoading: true, error: null });
    try {
      const insight = await aiService.getInsightById(reportId);
      set({ currentInsight: insight, isLoading: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to fetch insight');
      set({ error: errorMessage, isLoading: false });
    }
  },

  detectAnomalies: async (groupId: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await aiService.detectAnomalies(groupId);
      set({ anomalies: result, isLoading: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to detect anomalies');
      set({ error: errorMessage, isLoading: false });
    }
  },

  generateRecommendations: async (groupId: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await aiService.generateRecommendations(groupId);
      set({ recommendations: result, isLoading: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to generate recommendations');
      set({ error: errorMessage, isLoading: false });
    }
  },

  deleteInsight: async (reportId: string) => {
    set({ isLoading: true, error: null });
    try {
      await aiService.deleteInsight(reportId);
      const { insights } = get();
      set({
        insights: insights.filter(i => i._id !== reportId),
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to delete insight');
      set({ error: errorMessage, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
  clearAnomalies: () => set({ anomalies: null }),
  clearRecommendations: () => set({ recommendations: null }),
}));
