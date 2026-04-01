import api from './api';

export const dashboardService = {
  // Fetch executive dashboard data
  getExecutiveDashboard: async (params = {}) => {
    try {
      const response = await api.get('/dashboard/executive', { params });
      if (!response.data) {
        throw new Error('No data received from server');
      }
      return response.data;
    } catch (error) {
      throw new Error(`Failed to load executive dashboard data: ${error.message}`);
    }
  },

  // Fetch KAM dashboard data
  getKAMDashboard: async (params = {}) => {
    try {
      const response = await api.get('/dashboard/kam', { params });
      if (!response.data) {
        throw new Error('No data received from server');
      }
      return response.data;
    } catch (error) {
      throw new Error(`Failed to load KAM dashboard data: ${error.message}`);
    }
  },

  // Fetch analytics dashboard data
  getAnalyticsDashboard: async (params = {}) => {
    try {
      const response = await api.get('/dashboard/analytics', { params });
      if (!response.data) {
        throw new Error('No data received from server');
      }
      return response.data;
    } catch (error) {
      throw new Error(`Failed to load analytics dashboard data: ${error.message}`);
    }
  },

  // Fetch dashboard stats
  getDashboardStats: async () => {
    try {
      const response = await api.get('/dashboard/stats');
      if (!response.data) {
        throw new Error('No statistics data received from server');
      }
      return response.data;
    } catch (error) {
      throw new Error(`Failed to load dashboard statistics: ${error.message}`);
    }
  },

  // Fetch dashboard activity
  getDashboardActivity: async (limit = 10) => {
    try {
      const response = await api.get('/dashboard/activity', { params: { _limit: limit } });
      if (!response.data) {
        throw new Error('No activity data received from server');
      }
      return response.data;
    } catch (error) {
      throw new Error(`Failed to load dashboard activity: ${error.message}`);
    }
  }
};