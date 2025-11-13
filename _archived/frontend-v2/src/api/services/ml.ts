import apiClient from '../../lib/axios';

export interface MLPrediction {
  model: string;
  prediction: number | string;
  confidence: number;
  features: { [key: string]: any };
  timestamp: string;
}

export interface ForecastResult {
  metric: string;
  forecasts: {
    date: string;
    value: number;
    lower: number;
    upper: number;
  }[];
  accuracy: number;
  model: string;
}

export const mlService = {
  // Get ML model predictions
  predict: async (model: string, features: any): Promise<MLPrediction> => {
    const response = await apiClient.post('/ml/predict', { model, features });
    return response.data;
  },

  // Sales forecasting
  forecastSales: async (
    productId: string,
    horizon: number = 30
  ): Promise<ForecastResult> => {
    const response = await apiClient.post('/ml/forecast/sales', { productId, horizon });
    return response.data;
  },

  // Revenue forecasting
  forecastRevenue: async (horizon: number = 30): Promise<ForecastResult> => {
    const response = await apiClient.post('/ml/forecast/revenue', { horizon });
    return response.data;
  },

  // Customer churn prediction
  predictChurn: async (customerId: string) => {
    const response = await apiClient.get(`/ml/customers/${customerId}/churn`);
    return response.data;
  },

  // Customer lifetime value
  predictLTV: async (customerId: string) => {
    const response = await apiClient.get(`/ml/customers/${customerId}/ltv`);
    return response.data;
  },

  // Product recommendation
  recommendProducts: async (customerId: string, limit: number = 10) => {
    const response = await apiClient.get(`/ml/customers/${customerId}/recommendations`, {
      params: { limit },
    });
    return response.data;
  },

  // Promotion optimization
  optimizePromotion: async (promotionData: any) => {
    const response = await apiClient.post('/ml/promotions/optimize', promotionData);
    return response.data;
  },

  // Basket analysis
  analyzeBasket: async (customerId: string) => {
    const response = await apiClient.get(`/ml/customers/${customerId}/basket-analysis`);
    return response.data;
  },

  // Price elasticity
  analyzePriceElasticity: async (productId: string) => {
    const response = await apiClient.get(`/ml/products/${productId}/price-elasticity`);
    return response.data;
  },

  // Get model performance metrics
  getModelMetrics: async (modelName: string) => {
    const response = await apiClient.get(`/ml/models/${modelName}/metrics`);
    return response.data;
  },
};
