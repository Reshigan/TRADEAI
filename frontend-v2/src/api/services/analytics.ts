import apiClient from '../../lib/axios';

export interface AnalyticsData {
  revenue: number[];
  promotions: number[];
  customers: number[];
  labels: string[];
}

export interface TrendData {
  metric: string;
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export const analyticsService = {
  getRevenueTrends: async (period: string = '30d') => {
    const response = await apiClient.get(`/analytics/revenue?period=${period}`);
    return response.data;
  },

  getPromotionPerformance: async (promotionId?: string) => {
    const url = promotionId
      ? `/analytics/promotions/${promotionId}`
      : '/analytics/promotions';
    const response = await apiClient.get(url);
    return response.data;
  },

  getCustomerAnalytics: async () => {
    const response = await apiClient.get('/analytics/customers');
    return response.data;
  },

  getProductAnalytics: async () => {
    const response = await apiClient.get('/analytics/products');
    return response.data;
  },

  getTrends: async (): Promise<TrendData[]> => {
    const response = await apiClient.get('/analytics/trends');
    return response.data;
  },

  getROI: async (promotionId: string) => {
    const response = await apiClient.get(`/analytics/roi/${promotionId}`);
    return response.data;
  },

  getCustomReport: async (params: any) => {
    const response = await apiClient.post('/analytics/custom-report', params);
    return response.data;
  },

  exportReport: async (reportId: string, format: 'pdf' | 'excel' | 'csv') => {
    const response = await apiClient.get(`/analytics/reports/${reportId}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },
};
