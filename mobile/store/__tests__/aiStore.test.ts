import { useAIStore } from '../aiStore';
import aiService from '@/services/ai.service';

// Mock the AI service
jest.mock('@/services/ai.service', () => ({
  __esModule: true,
  default: {
    generateInsights: jest.fn(),
    getGroupInsights: jest.fn(),
    getInsightById: jest.fn(),
    detectAnomalies: jest.fn(),
    generateRecommendations: jest.fn(),
    deleteInsight: jest.fn(),
  },
}));

describe('AIStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAIStore.setState({
      insights: [],
      currentInsight: null,
      anomalies: null,
      recommendations: null,
      isLoading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  describe('generateInsights', () => {
    it('should generate insights successfully', async () => {
      const mockInsight = {
        _id: 'report1',
        groupId: 'group1',
        summary: 'AI generated summary',
        insights: ['Insight 1', 'Insight 2'],
        generatedAt: new Date().toISOString(),
      };

      (aiService.generateInsights as jest.Mock).mockResolvedValue(mockInsight);

      const result = await useAIStore.getState().generateInsights('group1');

      expect(aiService.generateInsights).toHaveBeenCalledWith('group1', undefined, undefined);
      expect(result).toEqual(mockInsight);
      expect(useAIStore.getState().insights).toContain(mockInsight);
      expect(useAIStore.getState().currentInsight).toEqual(mockInsight);
      expect(useAIStore.getState().isLoading).toBe(false);
    });

    it('should generate insights with date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockInsight = {
        _id: 'report1',
        groupId: 'group1',
        summary: 'AI generated summary',
        insights: ['Insight 1'],
        generatedAt: new Date().toISOString(),
      };

      (aiService.generateInsights as jest.Mock).mockResolvedValue(mockInsight);

      await useAIStore.getState().generateInsights('group1', startDate, endDate);

      expect(aiService.generateInsights).toHaveBeenCalledWith('group1', startDate, endDate);
    });

    it('should add new insight to beginning of list', async () => {
      const existingInsight = {
        _id: 'report1',
        groupId: 'group1',
        summary: 'Old summary',
        insights: ['Old insight'],
        generatedAt: new Date().toISOString(),
      };

      useAIStore.setState({ insights: [existingInsight] });

      const newInsight = {
        _id: 'report2',
        groupId: 'group1',
        summary: 'New summary',
        insights: ['New insight'],
        generatedAt: new Date().toISOString(),
      };

      (aiService.generateInsights as jest.Mock).mockResolvedValue(newInsight);

      await useAIStore.getState().generateInsights('group1');

      const insights = useAIStore.getState().insights;
      expect(insights[0]).toEqual(newInsight);
      expect(insights.length).toBe(2);
    });

    it('should handle generation errors and throw', async () => {
      const errorMessage = 'AI service unavailable';
      (aiService.generateInsights as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await expect(useAIStore.getState().generateInsights('group1')).rejects.toEqual({
        response: { data: { message: errorMessage } },
      });

      expect(useAIStore.getState().error).toBe(errorMessage);
    });
  });

  describe('fetchGroupInsights', () => {
    it('should fetch group insights successfully', async () => {
      const mockData = {
        reports: [
          {
            _id: 'report1',
            groupId: 'group1',
            summary: 'Summary 1',
            insights: ['Insight 1'],
            generatedAt: new Date().toISOString(),
          },
          {
            _id: 'report2',
            groupId: 'group1',
            summary: 'Summary 2',
            insights: ['Insight 2'],
            generatedAt: new Date().toISOString(),
          },
        ],
      };

      (aiService.getGroupInsights as jest.Mock).mockResolvedValue(mockData);

      await useAIStore.getState().fetchGroupInsights('group1');

      expect(aiService.getGroupInsights).toHaveBeenCalledWith('group1', 1);
      expect(useAIStore.getState().insights).toEqual(mockData.reports);
      expect(useAIStore.getState().isLoading).toBe(false);
    });

    it('should fetch with custom page number', async () => {
      const mockData = { reports: [] };
      (aiService.getGroupInsights as jest.Mock).mockResolvedValue(mockData);

      await useAIStore.getState().fetchGroupInsights('group1', 2);

      expect(aiService.getGroupInsights).toHaveBeenCalledWith('group1', 2);
    });

    it('should handle fetch errors', async () => {
      (aiService.getGroupInsights as jest.Mock).mockRejectedValue(new Error('Network error'));

      await useAIStore.getState().fetchGroupInsights('group1');

      expect(useAIStore.getState().error).toBeTruthy();
    });
  });

  describe('fetchInsightById', () => {
    it('should fetch single insight successfully', async () => {
      const mockInsight = {
        _id: 'report1',
        groupId: 'group1',
        summary: 'Summary',
        insights: ['Insight'],
        generatedAt: new Date().toISOString(),
      };

      (aiService.getInsightById as jest.Mock).mockResolvedValue(mockInsight);

      await useAIStore.getState().fetchInsightById('report1');

      expect(aiService.getInsightById).toHaveBeenCalledWith('report1');
      expect(useAIStore.getState().currentInsight).toEqual(mockInsight);
    });

    it('should handle fetch errors', async () => {
      (aiService.getInsightById as jest.Mock).mockRejectedValue(new Error('Not found'));

      await useAIStore.getState().fetchInsightById('invalid');

      expect(useAIStore.getState().currentInsight).toBeNull();
      expect(useAIStore.getState().error).toBeTruthy();
    });
  });

  describe('detectAnomalies', () => {
    it('should detect anomalies successfully', async () => {
      const mockAnomalies = {
        detected: true,
        anomalies: [{ type: 'unusual_transaction', description: 'Large transaction detected' }],
        analysisDate: new Date().toISOString(),
      };

      (aiService.detectAnomalies as jest.Mock).mockResolvedValue(mockAnomalies);

      await useAIStore.getState().detectAnomalies('group1');

      expect(aiService.detectAnomalies).toHaveBeenCalledWith('group1');
      expect(useAIStore.getState().anomalies).toEqual(mockAnomalies);
      expect(useAIStore.getState().isLoading).toBe(false);
    });

    it('should handle detection errors', async () => {
      (aiService.detectAnomalies as jest.Mock).mockRejectedValue(new Error('Analysis failed'));

      await useAIStore.getState().detectAnomalies('group1');

      expect(useAIStore.getState().anomalies).toBeNull();
      expect(useAIStore.getState().error).toBeTruthy();
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations successfully', async () => {
      const mockRecommendations = {
        recommendations: [
          { type: 'savings', suggestion: 'Increase monthly contribution' },
          { type: 'budget', suggestion: 'Reduce expenses' },
        ],
        generatedAt: new Date().toISOString(),
      };

      (aiService.generateRecommendations as jest.Mock).mockResolvedValue(mockRecommendations);

      await useAIStore.getState().generateRecommendations('group1');

      expect(aiService.generateRecommendations).toHaveBeenCalledWith('group1');
      expect(useAIStore.getState().recommendations).toEqual(mockRecommendations);
      expect(useAIStore.getState().isLoading).toBe(false);
    });

    it('should handle generation errors', async () => {
      (aiService.generateRecommendations as jest.Mock).mockRejectedValue(
        new Error('Service unavailable')
      );

      await useAIStore.getState().generateRecommendations('group1');

      expect(useAIStore.getState().recommendations).toBeNull();
      expect(useAIStore.getState().error).toBeTruthy();
    });
  });

  describe('deleteInsight', () => {
    it('should delete insight successfully', async () => {
      const insights = [
        {
          _id: 'report1',
          groupId: 'group1',
          summary: 'Summary 1',
          insights: ['Insight 1'],
          generatedAt: new Date().toISOString(),
        },
        {
          _id: 'report2',
          groupId: 'group1',
          summary: 'Summary 2',
          insights: ['Insight 2'],
          generatedAt: new Date().toISOString(),
        },
      ];

      useAIStore.setState({ insights });

      (aiService.deleteInsight as jest.Mock).mockResolvedValue(undefined);

      await useAIStore.getState().deleteInsight('report1');

      expect(aiService.deleteInsight).toHaveBeenCalledWith('report1');
      expect(useAIStore.getState().insights).toHaveLength(1);
      expect(useAIStore.getState().insights[0]._id).toBe('report2');
    });

    it('should handle delete errors', async () => {
      (aiService.deleteInsight as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      await useAIStore.getState().deleteInsight('report1');

      expect(useAIStore.getState().error).toBeTruthy();
    });
  });

  describe('utility methods', () => {
    it('should clear error', () => {
      useAIStore.setState({ error: 'Some error' });

      useAIStore.getState().clearError();

      expect(useAIStore.getState().error).toBeNull();
    });

    it('should clear anomalies', () => {
      useAIStore.setState({
        anomalies: {
          detected: true,
          anomalies: [],
          analysisDate: new Date().toISOString(),
        },
      });

      useAIStore.getState().clearAnomalies();

      expect(useAIStore.getState().anomalies).toBeNull();
    });

    it('should clear recommendations', () => {
      useAIStore.setState({
        recommendations: {
          recommendations: [],
          generatedAt: new Date().toISOString(),
        },
      });

      useAIStore.getState().clearRecommendations();

      expect(useAIStore.getState().recommendations).toBeNull();
    });
  });
});
