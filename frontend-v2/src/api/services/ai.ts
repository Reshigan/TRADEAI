import axios from '../axios';

export interface AIInsight {
  _id: string;
  type: 'recommendation' | 'alert' | 'prediction' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  data: any;
  createdAt: string;
}

export interface AIRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  confidence: number;
  potentialImpact: string;
  suggestedActions: string[];
  reasoning: string;
}

export interface PredictionResult {
  metric: string;
  predicted: number;
  confidence: number;
  factors: { name: string; weight: number }[];
  dateRange: { start: string; end: string };
}

export const aiService = {
  // Get AI insights for dashboard
  getInsights: async (context?: string): Promise<AIInsight[]> => {
    const response = await axios.get('/ai/insights', { params: { context } });
    return response.data;
  },

  // Get AI recommendations
  getRecommendations: async (type?: string): Promise<AIRecommendation[]> => {
    const response = await axios.get('/ai/recommendations', { params: { type } });
    return response.data;
  },

  // Get promotion recommendations
  getPromotionRecommendations: async (customerId?: string, productId?: string) => {
    const response = await axios.post('/ai/promotion/recommendations', {
      customerId,
      productId,
    });
    return response.data;
  },

  // Get customer intelligence
  getCustomerIntelligence: async (customerId: string) => {
    const response = await axios.get(`/ai/customers/${customerId}/intelligence`);
    return response.data;
  },

  // Price optimization
  optimizePrice: async (productId: string, context: any) => {
    const response = await axios.post(`/ai/products/${productId}/optimize-price`, context);
    return response.data;
  },

  // Predict demand
  predictDemand: async (productId: string, dateRange: any): Promise<PredictionResult> => {
    const response = await axios.post(`/ai/products/${productId}/predict-demand`, dateRange);
    return response.data;
  },

  // Analyze promotion effectiveness
  analyzePromotion: async (promotionId: string) => {
    const response = await axios.get(`/ai/promotions/${promotionId}/analyze`);
    return response.data;
  },

  // Get smart suggestions for form fields
  getSuggestions: async (field: string, context: any) => {
    const response = await axios.post('/ai/suggestions', { field, context });
    return response.data;
  },

  // Validate data with AI
  validateData: async (data: any, type: string) => {
    const response = await axios.post('/ai/validate', { data, type });
    return response.data;
  },

  // Chat with AI assistant
  chat: async (message: string, context?: any) => {
    const response = await axios.post('/ai/chat', { message, context });
    return response.data;
  },
};
