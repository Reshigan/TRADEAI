import api from './api';

const rebateService = {
  // Get all rebates
  getAllRebates: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/rebates?${params.toString()}`);
    return response.data;
  },

  // Get rebate by ID
  getRebateById: async (id) => {
    const response = await api.get(`/rebates/${id}`);
    return response.data;
  },

  // Create new rebate
  createRebate: async (rebateData) => {
    const response = await api.post('/rebates', rebateData);
    return response.data;
  },

  // Update rebate
  updateRebate: async (id, rebateData) => {
    const response = await api.put(`/rebates/${id}`, rebateData);
    return response.data;
  },

  // Delete rebate
  deleteRebate: async (id) => {
    const response = await api.delete(`/rebates/${id}`);
    return response.data;
  },

  // Activate rebate
  activateRebate: async (id) => {
    const response = await api.post(`/rebates/${id}/activate`);
    return response.data;
  },

  // Deactivate rebate
  deactivateRebate: async (id) => {
    const response = await api.post(`/rebates/${id}/deactivate`);
    return response.data;
  },

  // Submit for approval
  submitForApproval: async (id, data) => {
    const response = await api.post(`/rebates/${id}/submit`, data);
    return response.data;
  },

  // Approve rebate
  approveRebate: async (id, data) => {
    const response = await api.post(`/rebates/${id}/approve`, data);
    return response.data;
  },

  // Reject rebate
  rejectRebate: async (id, data) => {
    const response = await api.post(`/rebates/${id}/reject`, data);
    return response.data;
  },

  // Calculate rebate
  calculateRebate: async (id, data) => {
    const response = await api.post(`/rebates/${id}/calculate`, data);
    return response.data;
  },

  // Get rebate accruals
  getRebateAccruals: async (rebateId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/rebates/${rebateId}/accruals?${params.toString()}`);
    return response.data;
  },

  // Get rebate analytics
  getRebateAnalytics: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/rebates/analytics?${params.toString()}`);
    return response.data;
  }
};

export default rebateService;
