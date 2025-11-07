import api from './api';

const tradeSpendAnalyticsService = {
  getDashboardMetrics: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.customerId) params.append('customerId', filters.customerId);
    if (filters.productId) params.append('productId', filters.productId);
    
    const response = await api.get(`/trade-spend-analytics/dashboard?${params.toString()}`);
    return response.data;
  },

  getSpendAnalysis: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.groupBy) params.append('groupBy', filters.groupBy);
    
    const response = await api.get(`/trade-spend-analytics/spend-analysis?${params.toString()}`);
    return response.data;
  },

  getCampaignPerformance: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/trade-spend-analytics/campaign-performance?${params.toString()}`);
    return response.data;
  },

  getCustomerAnalytics: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.customerId) params.append('customerId', filters.customerId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/trade-spend-analytics/customer-analytics?${params.toString()}`);
    return response.data;
  },

  getProductPerformance: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await api.get(`/trade-spend-analytics/product-performance?${params.toString()}`);
    return response.data;
  },

  getRebateEffectiveness: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/trade-spend-analytics/rebate-effectiveness?${params.toString()}`);
    return response.data;
  },

  getForecastData: async (months = 3) => {
    const response = await api.get(`/trade-spend-analytics/forecast?months=${months}`);
    return response.data;
  }
};

export default tradeSpendAnalyticsService;
