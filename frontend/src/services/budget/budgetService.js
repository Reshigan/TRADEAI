import apiClient from '../apiClient';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
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

const budgetService = {
  getBudgets: async (filters = {}) => {
    const cacheKey = getCacheKey('budgets', filters);
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get('/budgets', { params: filters });
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
      throw error;
    }
  },

  getBudget: async (id) => {
    const cacheKey = getCacheKey('budget', { id });
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get(`/budgets/${id}`);
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch budget ${id}:`, error);
      throw error;
    }
  },

  getBudgetHierarchy: async (budgetId) => {
    const cacheKey = getCacheKey('budget-hierarchy', { budgetId });
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get(`/budgets/${budgetId}/hierarchy`);
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch budget hierarchy for ${budgetId}:`, error);
      throw error;
    }
  },

  getBudgetPerformance: async (budgetId) => {
    const cacheKey = getCacheKey('budget-performance', { budgetId });
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get(`/budgets/${budgetId}/performance`);
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch budget performance for ${budgetId}:`, error);
      throw error;
    }
  },

  createBudget: async (budgetData) => {
    try {
      const response = await apiClient.post('/budgets', budgetData);
      clearCache();
      return response.data;
    } catch (error) {
      console.error('Failed to create budget:', error);
      throw error;
    }
  },

  updateBudget: async (id, budgetData) => {
    try {
      const response = await apiClient.put(`/budgets/${id}`, budgetData);
      clearCache();
      return response.data;
    } catch (error) {
      console.error(`Failed to update budget ${id}:`, error);
      throw error;
    }
  },

  deleteBudget: async (id) => {
    try {
      const response = await apiClient.delete(`/budgets/${id}`);
      clearCache();
      return response.data;
    } catch (error) {
      console.error(`Failed to delete budget ${id}:`, error);
      throw error;
    }
  },

  clearCache
};

export default budgetService;
