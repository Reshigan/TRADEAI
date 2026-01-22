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

const userService = {
  getUsers: async (filters = {}) => {
    const cacheKey = getCacheKey('users', filters);
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get(`/users`, { params: filters });
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  },

  getUser: async (id) => {
    const cacheKey = getCacheKey('user', { id });
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get(`/users/${id}`);
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch user ${id}:`, error);
      throw error;
    }
  },

  createUser: async (userData) => {
    try {
      const response = await apiClient.post(`/users`, userData);
      clearCache();
      return response.data;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  },

  updateUser: async (id, userData) => {
    try {
      const response = await apiClient.put(`/users/${id}`, userData);
      clearCache();
      return response.data;
    } catch (error) {
      console.error(`Failed to update user ${id}:`, error);
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      const response = await apiClient.delete(`/users/${id}`);
      clearCache();
      return response.data;
    } catch (error) {
      console.error(`Failed to delete user ${id}:`, error);
      throw error;
    }
  },

  clearCache
};

export default userService;
