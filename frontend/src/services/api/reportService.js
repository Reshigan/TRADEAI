import apiClient from './apiClient';

export const reportService = {
  // CRUD Operations for Report entities
  async createReport(reportData) {
    return await apiClient.post('/api/reports/reports', reportData);
  },

  async getReports(params = {}) {
    return await apiClient.get('/api/reports/reports', { params });
  },

  async getReport(id) {
    return await apiClient.get(`/api/reports/reports/${id}`);
  },

  async updateReport(id, reportData) {
    return await apiClient.put(`/api/reports/reports/${id}`, reportData);
  },

  async deleteReport(id) {
    return await apiClient.delete(`/api/reports/reports/${id}`);
  },

  // Report Generation Functions
  async generateReport(reportType, params = {}) {
    const endpoints = {
      'promotion_effectiveness': '/api/reports/promotion-effectiveness',
      'budget_utilization': '/api/reports/budget-utilization',
      'customer_performance': '/api/reports/customer-performance',
      'product_performance': '/api/reports/product-performance',
      'trade_spend_analysis': '/api/reports/trade-spend-analysis',
      'roi_analysis': '/api/reports/trade-spend-roi'
    };

    const endpoint = endpoints[reportType];
    if (!endpoint) {
      throw new Error(`Unknown report type: ${reportType}`);
    }

    return await apiClient.get(endpoint, { params });
  },

  async generatePromotionEffectivenessReport(params) {
    return await apiClient.get('/api/reports/promotion-effectiveness', { params });
  },

  async generateBudgetUtilizationReport(params) {
    return await apiClient.get('/api/reports/budget-utilization', { params });
  },

  async generateCustomerPerformanceReport(params) {
    return await apiClient.get('/api/reports/customer-performance', { params });
  },

  async generateProductPerformanceReport(params) {
    return await apiClient.get('/api/reports/product-performance', { params });
  },

  async generateTradeSpendROIReport(params) {
    return await apiClient.get('/api/reports/trade-spend-roi', { params });
  },

  async exportReport(reportData) {
    return await apiClient.post('/api/reports/export', reportData, {
      responseType: 'blob'
    });
  },

  async scheduleReport(scheduleData) {
    return await apiClient.post('/api/reports/schedule', scheduleData);
  },

  async getAvailableReports() {
    return await apiClient.get('/api/reports/');
  }
};

export default reportService;