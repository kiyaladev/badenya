import api from './api';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import authService from './auth.service';
import { unwrapApiData } from '@/utils/apiResponse';

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
    const data = unwrapApiData<{ summary?: ReportSummary } & Partial<ReportSummary>>(response.data);
    return (data.summary || data) as ReportSummary;
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

  private async downloadFile(url: string, filename: string): Promise<string> {
    const accessToken = await authService.getAccessToken();
    if (!accessToken) {
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    const directory = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    if (!directory) {
      throw new Error('Stockage local indisponible');
    }

    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const targetUri = `${directory}${safeFilename}`;
    const task = FileSystem.createDownloadResumable(url, targetUri, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const result = await task.downloadAsync();
    if (!result?.uri) {
      throw new Error('Le téléchargement du rapport a échoué');
    }
    return result.uri;
  }

  async shareReport(uri: string, mimeType: string): Promise<boolean> {
    if (!(await Sharing.isAvailableAsync())) {
      return false;
    }
    await Sharing.shareAsync(uri, { mimeType, dialogTitle: 'Partager le rapport' });
    return true;
  }

  /** Download PDF report with the authenticated mobile session. */
  async downloadPdfReport(
    groupId: string,
    groupName: string,
    startDate?: string,
    endDate?: string
  ): Promise<string> {
    return this.downloadFile(
      this.getPdfReportUrl(groupId, startDate, endDate),
      `${groupName}_rapport.pdf`
    );
  }

  /** Download Excel report with the authenticated mobile session. */
  async downloadExcelReport(
    groupId: string,
    groupName: string,
    startDate?: string,
    endDate?: string
  ): Promise<string> {
    return this.downloadFile(
      this.getExcelReportUrl(groupId, startDate, endDate),
      `${groupName}_rapport.xlsx`
    );
  }

  /**
   * Get monthly report
   */
  async getMonthlyReport(groupId: string, year: number, month: number): Promise<MonthlyReport> {
    const response = await api.get(`/groups/${groupId}/reports/monthly/${year}/${month}`);
    return unwrapApiData<MonthlyReport>(response.data);
  }
}

export default new ReportService();
