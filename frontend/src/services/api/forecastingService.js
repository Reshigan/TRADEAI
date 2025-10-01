import apiClient from './apiClient';

const forecastingService = {
  // Sales Forecasting
  generateSalesForecast: (params) => {
    return apiClient.post('/api/v1/forecasting/sales', params);
  },

  // Demand Forecasting
  generateDemandForecast: (params) => {
    return apiClient.post('/api/v1/forecasting/demand', params);
  },

  // Budget Forecasting
  generateBudgetForecast: (params) => {
    return apiClient.post('/api/v1/forecasting/budget', params);
  },

  // Scenario Planning
  performScenarioPlanning: (scenarios) => {
    return apiClient.post('/api/v1/forecasting/scenarios', { scenarios });
  },

  // Promotion Performance Prediction
  predictPromotionPerformance: (promotionData) => {
    return apiClient.post('/api/v1/forecasting/promotion-prediction', promotionData);
  },

  // Export Forecasts
  exportForecast: (type, params) => {
    return apiClient.post(`/api/v1/forecasting/export/${type}`, params, {
      responseType: 'blob'
    });
  },

  // Get forecast history
  getForecastHistory: (params = {}) => {
    return apiClient.get('/api/v1/forecasting/history', { params });
  },

  // Get products for filtering
  getProducts: () => {
    return apiClient.get('/api/v1/products');
  },

  // Get customers for filtering
  getCustomers: () => {
    return apiClient.get('/api/v1/customers');
  },

  // Forecast accuracy metrics
  getForecastAccuracy: (forecastId) => {
    return apiClient.get(`/api/v1/forecasting/accuracy/${forecastId}`);
  },

  // Update forecast parameters
  updateForecastParameters: (forecastId, params) => {
    return apiClient.put(`/api/v1/forecasting/${forecastId}/parameters`, params);
  },

  // Get forecast recommendations
  getForecastRecommendations: (forecastId) => {
    return apiClient.get(`/api/v1/forecasting/${forecastId}/recommendations`);
  }
};

export default forecastingService;