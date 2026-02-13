import api from './api';

export interface ReportSummary {
  totalContributions: number;
  totalExpenses: number;
  totalRefunds: number;
  netBalance: number;
  transactionCount: number;
  contributionsByMember: Array<{
    userId: string;
    userName: string;
    amount: number;
    count: number;
  }>;
  expensesByCategory: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
}

export interface MonthlyReport {
  groupId: string;
  period: {
    month: number;
    year: number;
    startDate: string;
    endDate: string;
  };
  summary: ReportSummary;
  generatedAt: string;
}

class ReportService {
  /**
   * Get financial summary for a group
   */
  async getGroupSummary(
    groupId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ReportSummary> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await api.get(`/groups/${groupId}/reports/summary`, { params });
    return response.data.data;
  }

  /**
   * Get PDF report URL (for opening in browser/sharing)
   */
  getPdfReportUrl(groupId: string, startDate?: string, endDate?: string): string {
    const baseUrl = api.defaults.baseURL;
    let url = `${baseUrl}/groups/${groupId}/reports/pdf`;

    const params: string[] = [];
    if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
    if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return url;
  }

  /**
   * Get Excel report URL (for opening in browser/sharing)
   */
  getExcelReportUrl(groupId: string, startDate?: string, endDate?: string): string {
    const baseUrl = api.defaults.baseURL;
    let url = `${baseUrl}/groups/${groupId}/reports/excel`;

    const params: string[] = [];
    if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
    if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return url;
  }

  /**
   * Download PDF report (simplified - opens in browser)
   */
  async downloadPdfReport(
    groupId: string,
    groupName: string,
    startDate?: string,
    endDate?: string
  ): Promise<string> {
    return this.getPdfReportUrl(groupId, startDate, endDate);
  }

  /**
   * Download Excel report (simplified - opens in browser)
   */
  async downloadExcelReport(
    groupId: string,
    groupName: string,
    startDate?: string,
    endDate?: string
  ): Promise<string> {
    return this.getExcelReportUrl(groupId, startDate, endDate);
  }

  /**
   * Get monthly report
   */
  async getMonthlyReport(groupId: string, year: number, month: number): Promise<MonthlyReport> {
    const response = await api.get(`/groups/${groupId}/reports/monthly/${year}/${month}`);
    return response.data.data;
  }
}

export default new ReportService();
