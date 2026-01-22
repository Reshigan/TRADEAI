import apiClient from '../apiClient';

const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map();

const getCacheKey = (endpoint, params) => {
  return `${endpoint}_${JSON.stringify(params)}`;
};

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

const clearCache = () => {
  cache.clear();
};

const customerService = {
  getCustomers: async (filters = {}) => {
    const cacheKey = getCacheKey('customers', filters);
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get(`/customers`, { params: filters });
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      throw error;
    }
  },

  getCustomer: async (id) => {
    const cacheKey = getCacheKey('customer', { id });
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get(`/customers/${id}`);
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch customer ${id}:`, error);
      throw error;
    }
  },

  getCustomerHierarchy: async (customerId = null) => {
    const cacheKey = getCacheKey('customer-hierarchy', { customerId });
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
            const url = customerId 
              ? `/customers/${customerId}/hierarchy`
              : `/customers/hierarchy`;
      
      const response = await apiClient.get(url);
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch customer hierarchy:', error);
      throw error;
    }
  },

  getCustomerPerformance: async (customerId) => {
    const cacheKey = getCacheKey('customer-performance', { customerId });
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get(`/customers/${customerId}/performance`);
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch customer performance for ${customerId}:`, error);
      throw error;
    }
  },

  getCustomerAIInsights: async (customerId) => {
    const cacheKey = getCacheKey('customer-ai-insights', { customerId });
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get(`/customers/${customerId}/ai-insights`);
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch AI insights for customer ${customerId}:`, error);
      throw error;
    }
  },

  createCustomer: async (customerData) => {
    try {
      const response = await apiClient.post(`/customers`, customerData);
      clearCache();
      return response.data;
    } catch (error) {
      console.error('Failed to create customer:', error);
      throw error;
    }
  },

  updateCustomer: async (id, customerData) => {
    try {
      const response = await apiClient.put(`/customers/${id}`, customerData);
      clearCache();
      return response.data;
    } catch (error) {
      console.error(`Failed to update customer ${id}:`, error);
      throw error;
    }
  },

  deleteCustomer: async (id) => {
    try {
      const response = await apiClient.delete(`/customers/${id}`);
      clearCache();
      return response.data;
    } catch (error) {
      console.error(`Failed to delete customer ${id}:`, error);
      throw error;
    }
  },

  clearCache
};

export default customerService;
