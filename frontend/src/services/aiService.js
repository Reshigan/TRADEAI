/**
 * AI Service - Real Backend Integration
 * Connects to 35+ AI/ML services running on backend
 */

import apiClient from './apiClient';

/**
 * AI Promotion Service
 */
export const aiPromotionService = {
  // Get promotion ROI prediction
  getPrediction: async (promotionData) => {
    const response = await apiClient.post('/advanced/promotions/roi-prediction', promotionData);
    return response.data;
  },

  // Analyze promotion lift
  analyzeLift: async (promotionId) => {
    const response = await apiClient.post('/ai/analyze/promotion-lift', { promotionId });
    return response.data;
  },

  // Run promotion simulation
  runSimulation: async (promotionData) => {
    const response = await apiClient.post('/ai-promotion/run-simulation', promotionData);
    return response.data;
  },

  // Get AI recommendations for promotion
  getRecommendations: async (context) => {
    const response = await apiClient.post('/ai-promotion/generate-suggestions', context);
    return response.data;
  },

  // Validate promotion uplift
  validateUplift: async (promotionId) => {
    const response = await apiClient.post('/ai-promotion/validate-uplift', { promotionId });
    return response.data;
  },
};

/**
 * AI Budget Service
 */
export const aiBudgetService = {
  // Get budget variance analysis
  getVarianceAnalysis: async (budgetId) => {
    const response = await apiClient.get(`/advanced/budgets/variance/${budgetId}`);
    return response.data;
  },

  // Get budget forecast
  getForecast: async (budgetData) => {
    const response = await apiClient.post('/advanced/budgets/forecast', budgetData);
    return response.data;
  },

  // Get AI budget recommendations
  getRecommendations: async (context) => {
    const response = await apiClient.post('/ai/forecast/demand', context);
    return response.data;
  },

  // Optimize budget allocation
  optimizeAllocation: async (budgetData) => {
    const response = await apiClient.post('/advanced/budgets/optimize', budgetData);
    return response.data;
  },
};

/**
 * AI Customer Service
 */
export const aiCustomerService = {
  // Get customer segmentation
  getSegmentation: async (filters) => {
    const response = await apiClient.post('/advanced/customers/segmentation', filters);
    return response.data;
  },

  // Predict customer churn
  predictChurn: async (customerId) => {
    const response = await apiClient.get(`/advanced/customers/churn-prediction/${customerId}`);
    return response.data;
  },

  // Get customer lifetime value
  getLifetimeValue: async (customerId) => {
    const response = await apiClient.get(`/advanced/customers/lifetime-value/${customerId}`);
    return response.data;
  },

  // Get product recommendations
  getProductRecommendations: async (customerId) => {
    const response = await apiClient.post('/ai/recommend/products', { customerId });
    return response.data;
  },

  // Optimize pricing
  optimizePricing: async (pricingData) => {
    const response = await apiClient.post('/ai/optimize/price', pricingData);
    return response.data;
  },
};

/**
 * AI Analytics Service
 */
export const aiAnalyticsService = {
  // Get real-time dashboard data
  getDashboard: async () => {
    const response = await apiClient.get('/analytics/dashboard');
    return response.data;
  },

  // Get performance metrics
  getPerformanceMetrics: async (filters) => {
    const response = await apiClient.post('/advanced/performance/realtime', filters);
    return response.data;
  },

  // Get AI insights
  getInsights: async (context) => {
    const response = await apiClient.post('/ai-chatbot/insights', context);
    return response.data;
  },

  // Generate automated report
  generateReport: async (reportConfig) => {
    const response = await apiClient.post('/ai-chatbot/generate-report', reportConfig);
    return response.data;
  },
};

/**
 * AI Accrual Service
 */
export const aiAccrualService = {
  // Calculate accruals automatically
  calculateAccruals: async (accrualData) => {
    const response = await apiClient.post('/advanced/accruals/calculate', accrualData);
    return response.data;
  },

  // Get variance report
  getVarianceReport: async (filters) => {
    const response = await apiClient.post('/advanced/accruals/variance-report', filters);
    return response.data;
  },

  // Reconcile accruals
  reconcile: async (accrualId) => {
    const response = await apiClient.post(`/advanced/accruals/${accrualId}/reconcile`);
    return response.data;
  },

  // Get journal entries
  getJournalEntries: async (accrualId) => {
    const response = await apiClient.get(`/advanced/accruals/${accrualId}/journal-entries`);
    return response.data;
  },
};

/**
 * Generic AI Service for all ML predictions
 */
export const aiService = {
  // Health check
  checkHealth: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Get AI model status
  getModelStatus: async () => {
    const response = await apiClient.get('/ai-promotion/model-status');
    return response.data;
  },

  // Generic prediction endpoint
  predict: async (model, data) => {
    const response = await apiClient.post(`/ai/${model}/predict`, data);
    return response.data;
  },
};

export default {
  promotion: aiPromotionService,
  budget: aiBudgetService,
  customer: aiCustomerService,
  analytics: aiAnalyticsService,
  accrual: aiAccrualService,
  general: aiService,
};
