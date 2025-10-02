import apiClient from './apiClient';

const analyticsService = {
  /**
   * Get all analytics data (comprehensive dashboard data)
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with comprehensive analytics data
   */
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/analytics/dashboard', { params });
      return response.data;
    } catch (error) {
      console.error('Get all analytics error:', error);
      throw error;
    }
  },

  /**
   * Get dashboard analytics
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with dashboard analytics data
   */
  getDashboard: async (params = {}) => {
    try {
      const response = await apiClient.get('/analytics/dashboard', { params });
      return response.data;
    } catch (error) {
      console.error('Get dashboard analytics error:', error);
      throw error;
    }
  },
  
  /**
   * Get sales performance analytics
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with sales performance analytics data
   */
  getSalesPerformance: async (params = {}) => {
    try {
      const response = await apiClient.get('/analytics/sales-performance', { params });
      return response.data;
    } catch (error) {
      console.error('Get sales performance analytics error:', error);
      throw error;
    }
  },
  
  /**
   * Get budget utilization analytics
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with budget utilization analytics data
   */
  getBudgetUtilization: async (params = {}) => {
    try {
      const response = await apiClient.get('/analytics/budget-utilization', { params });
      return response.data;
    } catch (error) {
      console.error('Get budget utilization analytics error:', error);
      throw error;
    }
  },
  
  /**
   * Get ROI analytics
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with ROI analytics data
   */
  getROIAnalysis: async (params = {}) => {
    try {
      const response = await apiClient.get('/analytics/roi-analysis', { params });
      return response.data;
    } catch (error) {
      console.error('Get ROI analytics error:', error);
      throw error;
    }
  },
  
  /**
   * Get customer performance analytics
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with customer performance analytics data
   */
  getCustomerPerformance: async (params = {}) => {
    try {
      const response = await apiClient.get('/analytics/customer-performance', { params });
      return response.data;
    } catch (error) {
      console.error('Get customer performance analytics error:', error);
      throw error;
    }
  },
  
  /**
   * Get product performance analytics
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with product performance analytics data
   */
  getProductPerformance: async (params = {}) => {
    try {
      const response = await apiClient.get('/analytics/product-performance', { params });
      return response.data;
    } catch (error) {
      console.error('Get product performance analytics error:', error);
      throw error;
    }
  },
  
  /**
   * Get trade spend trends analytics
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with trade spend trends analytics data
   */
  getTradeSpendTrends: async (params = {}) => {
    try {
      const response = await apiClient.get('/analytics/trade-spend-trends', { params });
      return response.data;
    } catch (error) {
      console.error('Get trade spend trends analytics error:', error);
      throw error;
    }
  },
  
  /**
   * Get AI predictions
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with AI predictions data
   */
  getAIPredictions: async (params = {}) => {
    try {
      const response = await apiClient.get('/analytics/ai-predictions', { params });
      return response.data;
    } catch (error) {
      console.error('Get AI predictions error:', error);
      throw error;
    }
  },
  
  /**
   * Export analytics data
   * @param {string} type - Export type (e.g., 'csv', 'excel', 'pdf')
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with exported data
   */
  exportData: async (type, params = {}) => {
    try {
      const response = await apiClient.get(`/analytics/export/${type}`, { 
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error(`Export analytics data as ${type} error:`, error);
      throw error;
    }
  }
};

export default analyticsService;