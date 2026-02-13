import api from './api';

export interface AIInsight {
  category: string;
  observation: string;
  recommendation: string;
}

export interface AITrend {
  metric: string;
  value: number;
  change: number;
  direction: 'up' | 'down' | 'stable';
}

export interface AIPrediction {
  timeframe: string;
  metric: string;
  predictedValue: number;
  confidence: number;
}

export interface AIReport {
  _id: string;
  groupId: string;
  generatedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  periodStart: string;
  periodEnd: string;
  transactionsAnalyzed: number;
  report: {
    summary: string;
    totalContributions: number;
    totalExpenses: number;
    netBalance: number;
    insights: AIInsight[];
    trends: AITrend[];
    predictions: AIPrediction[];
  };
  modelUsed: string;
  tokensUsed?: number;
  createdAt: string;
}

export interface Anomaly {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}

export interface AnomalyDetectionResult {
  anomalies: Anomaly[];
  summary: string;
}

export interface Recommendation {
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
}

export interface RecommendationsResult {
  recommendations: Recommendation[];
}

/**
 * AI Service for interacting with AI-powered features
 */
class AIService {
  /**
   * Generate AI insights for a group
   */
  async generateInsights(groupId: string, startDate?: Date, endDate?: Date): Promise<AIReport> {
    const params: Record<string, string> = {};

    if (startDate) {
      params.startDate = startDate.toISOString();
    }

    if (endDate) {
      params.endDate = endDate.toISOString();
    }

    const response = await api.post(`/groups/${groupId}/insights`, {}, { params });
    return response.data.data;
  }

  /**
   * Get insights history for a group
   */
  async getGroupInsights(
    groupId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    reports: AIReport[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const response = await api.get(`/groups/${groupId}/insights`, {
      params: { page, limit },
    });
    return response.data.data;
  }

  /**
   * Get a specific insight report by ID
   */
  async getInsightById(reportId: string): Promise<AIReport> {
    const response = await api.get(`/insights/${reportId}`);
    return response.data.data;
  }

  /**
   * Detect anomalies in group transactions
   */
  async detectAnomalies(groupId: string): Promise<AnomalyDetectionResult> {
    const response = await api.post(`/groups/${groupId}/anomalies`);
    return response.data.data;
  }

  /**
   * Generate personalized recommendations for a group
   */
  async generateRecommendations(groupId: string): Promise<RecommendationsResult> {
    const response = await api.post(`/groups/${groupId}/recommendations`);
    return response.data.data;
  }

  /**
   * Delete an insight report
   */
  async deleteInsight(reportId: string): Promise<void> {
    await api.delete(`/insights/${reportId}`);
  }
}

export default new AIService();
