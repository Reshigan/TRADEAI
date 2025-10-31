import axios from '../axios';

export interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  activePromotions: number;
  promotionsChange: number;
  totalCustomers: number;
  customersChange: number;
  totalProducts: number;
  productsChange: number;
}

export interface RecentActivity {
  _id: string;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await axios.get('/dashboard/stats');
    return response.data;
  },

  getRecentActivity: async (limit = 10): Promise<RecentActivity[]> => {
    const response = await axios.get(`/dashboard/activity?limit=${limit}`);
    return response.data;
  },

  getChartData: async (type: string, dateRange?: { start: string; end: string }) => {
    const params = dateRange ? `?start=${dateRange.start}&end=${dateRange.end}` : '';
    const response = await axios.get(`/dashboard/charts/${type}${params}`);
    return response.data;
  },
};
