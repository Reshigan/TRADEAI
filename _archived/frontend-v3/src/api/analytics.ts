import apiClient from './client'

export const analyticsApi = {
  getTradeSpendAnalysis: (params: any) =>
    apiClient.get('/analytics/trade-spend', { params }),

  getROIAnalysis: (params: any) =>
    apiClient.get('/analytics/roi', { params }),

  getSalesLiftAnalysis: (params: any) =>
    apiClient.get('/analytics/sales-lift', { params }),

  getCustomerPerformance: (params: any) =>
    apiClient.get('/analytics/customer-performance', { params }),

  getProductPerformance: (params: any) =>
    apiClient.get('/analytics/product-performance', { params }),

  getPromotionEffectiveness: (params: any) =>
    apiClient.get('/analytics/promotion-effectiveness', { params }),

  getBudgetVariance: (params: any) =>
    apiClient.get('/analytics/budget-variance', { params }),

  getTrendAnalysis: (params: any) =>
    apiClient.get('/analytics/trends', { params }),
}

export const reportsApi = {
  generate: (type: string, params: any) =>
    apiClient.post(`/reports/generate/${type}`, params),

  getAll: () =>
    apiClient.get('/reports'),

  getById: (id: string) =>
    apiClient.get(`/reports/${id}`),

  download: (id: string, format: string) =>
    apiClient.get(`/reports/${id}/download?format=${format}`, { responseType: 'blob' }),

  schedule: (reportConfig: any) =>
    apiClient.post('/reports/schedule', reportConfig),
}
