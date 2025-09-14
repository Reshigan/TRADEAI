import api from './api';

export const tradingTermsService = {
  // Get all trading terms with filters and pagination
  getTradingTerms: async (params = {}) => {
    const response = await api.get('/trading-terms', { params });
    return response.data;
  },

  // Get single trading term by ID
  getTradingTerm: async (id) => {
    const response = await api.get(`/trading-terms/${id}`);
    return response.data;
  },

  // Create new trading term
  createTradingTerm: async (data) => {
    const response = await api.post('/trading-terms', data);
    return response.data;
  },

  // Update trading term
  updateTradingTerm: async (id, data) => {
    const response = await api.put(`/trading-terms/${id}`, data);
    return response.data;
  },

  // Delete trading term
  deleteTradingTerm: async (id) => {
    const response = await api.delete(`/trading-terms/${id}`);
    return response.data;
  },

  // Submit trading term for approval
  submitForApproval: async (id) => {
    const response = await api.post(`/trading-terms/${id}/submit`);
    return response.data;
  },

  // Approve or reject trading term
  approveRejectTradingTerm: async (id, data) => {
    const response = await api.post(`/trading-terms/${id}/approve-reject`, data);
    return response.data;
  },

  // Get trading term options (types, statuses, etc.)
  getTradingTermOptions: async () => {
    const response = await api.get('/trading-terms/options');
    return response.data;
  },

  // Calculate discount for given parameters
  calculateDiscount: async (id, data) => {
    const response = await api.post(`/trading-terms/${id}/calculate`, data);
    return response.data;
  },

  // Get applicable trading terms for customer/product
  getApplicableTerms: async (customerId, productId, orderValue, volume) => {
    const response = await api.get('/trading-terms/applicable', {
      params: { customerId, productId, orderValue, volume }
    });
    return response.data;
  }
};

export default tradingTermsService;