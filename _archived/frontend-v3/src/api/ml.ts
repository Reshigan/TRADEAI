import apiClient from './client'

export const mlApi = {
  // Demand Forecasting
  getForecast: (params: any) =>
    apiClient.post('/ml/forecast', params),

  // Price Optimization
  optimizePrice: (params: any) =>
    apiClient.post('/ml/price-optimization', params),

  // Promotion Recommendation
  getPromotionRecommendations: (customerId: string) =>
    apiClient.get(`/ml/recommendations/promotions/${customerId}`),

  // Budget Allocation
  optimizeBudgetAllocation: (params: any) =>
    apiClient.post('/ml/budget-allocation', params),

  // Customer Segmentation
  getCustomerSegments: () =>
    apiClient.get('/ml/customer-segmentation'),

  // Anomaly Detection
  detectAnomalies: (params: any) =>
    apiClient.post('/ml/anomaly-detection', params),

  // Performance Prediction
  predictPerformance: (promotionId: string) =>
    apiClient.get(`/ml/predict-performance/${promotionId}`),
}

export const aiApi = {
  // AI Chatbot
  chat: (message: string, conversationId?: string) =>
    apiClient.post('/ai/chat', { message, conversationId }),

  getConversations: () =>
    apiClient.get('/ai/conversations'),

  // AI Insights
  getInsights: (context: string) =>
    apiClient.get(`/ai/insights?context=${context}`),

  generateSummary: (data: any) =>
    apiClient.post('/ai/generate-summary', data),
}
