import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

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

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const budgetService = {
  getBudgets: async (filters = {}) => {
    const cacheKey = getCacheKey('budgets', filters);
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${API_BASE_URL}/api/budgets`, {
        params: filters,
        headers: getAuthHeaders()
      });
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
      const response = await axios.get(`${API_BASE_URL}/api/budgets/${id}`, {
        headers: getAuthHeaders()
      });
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
      const response = await axios.get(`${API_BASE_URL}/api/budgets/${budgetId}/hierarchy`, {
        headers: getAuthHeaders()
      });
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
      const response = await axios.get(`${API_BASE_URL}/api/budgets/${budgetId}/performance`, {
        headers: getAuthHeaders()
      });
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch budget performance for ${budgetId}:`, error);
      throw error;
    }
  },

  createBudget: async (budgetData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/budgets`, budgetData, {
        headers: getAuthHeaders()
      });
      clearCache(); // Invalidate cache on mutation
      return response.data;
    } catch (error) {
      console.error('Failed to create budget:', error);
      throw error;
    }
  },

  updateBudget: async (id, budgetData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/budgets/${id}`, budgetData, {
        headers: getAuthHeaders()
      });
      clearCache(); // Invalidate cache on mutation
      return response.data;
    } catch (error) {
      console.error(`Failed to update budget ${id}:`, error);
      throw error;
    }
  },

  deleteBudget: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/budgets/${id}`, {
        headers: getAuthHeaders()
      });
      clearCache(); // Invalidate cache on mutation
      return response.data;
    } catch (error) {
      console.error(`Failed to delete budget ${id}:`, error);
      throw error;
    }
  },

  clearCache
};

export default budgetService;
