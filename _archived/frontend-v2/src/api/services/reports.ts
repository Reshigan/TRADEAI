import apiClient from '../../lib/axios';

export interface Report {
  id: string;
  name: string;
  type: 'sales' | 'performance' | 'financial' | 'inventory' | 'custom';
  description?: string;
  schedule?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  format: 'pdf' | 'excel' | 'csv';
  recipients?: string[];
  filters: any;
  createdBy: string;
  createdAt: string;
  lastRun?: string;
  nextRun?: string;
  status: 'active' | 'paused' | 'archived';
}

export interface ReportExecution {
  id: string;
  reportId: string;
  reportName: string;
  executedAt: string;
  executedBy: string;
  status: 'running' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  duration?: number;
  error?: string;
}

export interface KPI {
  id: string;
  name: string;
  value: number;
  target?: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  category: string;
  period: string;
}

export interface AdvancedAnalytics {
  revenue: {
    total: number;
    byMonth: { month: string; amount: number }[];
    byCategory: { category: string; amount: number; percent: number }[];
    trend: number;
  };
  customers: {
    total: number;
    active: number;
    new: number;
    churnRate: number;
    ltv: number;
  };
  products: {
    topSellers: { id: string; name: string; units: number; revenue: number }[];
    lowStock: { id: string; name: string; quantity: number }[];
  };
  performance: {
    conversionRate: number;
    avgOrderValue: number;
    orderFulfillment: number;
    returnRate: number;
  };
}

class ReportsService {
  private baseUrl = '/reports';

  async getAllReports() {
    const response = await apiClient.get<{ data: Report[] }>(this.baseUrl);
    return response.data;
  }

  async getReport(id: string) {
    const response = await apiClient.get<{ data: Report }>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createReport(report: Omit<Report, 'id' | 'createdAt' | 'lastRun'>) {
    const response = await apiClient.post<{ data: Report }>(this.baseUrl, report);
    return response.data;
  }

  async updateReport(id: string, report: Partial<Report>) {
    const response = await apiClient.put<{ data: Report }>(`${this.baseUrl}/${id}`, report);
    return response.data;
  }

  async deleteReport(id: string) {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  async executeReport(id: string, format?: string) {
    const response = await apiClient.post<{ data: ReportExecution }>(
      `${this.baseUrl}/${id}/execute`,
      { format }
    );
    return response.data;
  }

  async getReportExecutions(reportId?: string) {
    const response = await apiClient.get<{ data: ReportExecution[] }>(
      `${this.baseUrl}/executions`,
      { params: { reportId } }
    );
    return response.data;
  }

  async downloadReport(executionId: string) {
    const response = await apiClient.get(`${this.baseUrl}/executions/${executionId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getKPIs(period: string = 'month') {
    const response = await apiClient.get<{ data: KPI[] }>(`${this.baseUrl}/kpis`, {
      params: { period },
    });
    return response.data;
  }

  async getAdvancedAnalytics(filters?: {
    startDate?: string;
    endDate?: string;
    groupBy?: string;
  }) {
    const response = await apiClient.get<{ data: AdvancedAnalytics }>(
      `${this.baseUrl}/analytics`,
      { params: filters }
    );
    return response.data;
  }

  async exportData(
    type: string,
    format: 'csv' | 'excel' | 'json',
    filters?: any
  ) {
    const response = await apiClient.post(
      `${this.baseUrl}/export`,
      { type, format, filters },
      { responseType: 'blob' }
    );
    return response.data;
  }

  async scheduleReport(reportId: string, schedule: any) {
    const response = await apiClient.post(`${this.baseUrl}/${reportId}/schedule`, schedule);
    return response.data;
  }
}

export const reportsService = new ReportsService();
export default reportsService;
