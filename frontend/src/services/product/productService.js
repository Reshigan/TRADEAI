import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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

const productService = {
  getProducts: async (filters = {}) => {
    const cacheKey = getCacheKey('products', filters);
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${API_BASE_URL}/api/products`, {
        params: filters,
        headers: getAuthHeaders()
      });
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw error;
    }
  },

  getProduct: async (id) => {
    const cacheKey = getCacheKey('product', { id });
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${API_BASE_URL}/api/products/${id}`, {
        headers: getAuthHeaders()
      });
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch product ${id}:`, error);
      throw error;
    }
  },

  getProductHierarchy: async (productId = null) => {
    const cacheKey = getCacheKey('product-hierarchy', { productId });
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const url = productId 
        ? `${API_BASE_URL}/api/products/${productId}/hierarchy`
        : `${API_BASE_URL}/api/products/hierarchy`;
      
      const response = await axios.get(url, {
        headers: getAuthHeaders()
      });
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch product hierarchy:', error);
      throw error;
    }
  },

  getProductPerformance: async (productId) => {
    const cacheKey = getCacheKey('product-performance', { productId });
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${API_BASE_URL}/api/products/${productId}/performance`, {
        headers: getAuthHeaders()
      });
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch product performance for ${productId}:`, error);
      throw error;
    }
  },

  createProduct: async (productData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/products`, productData, {
        headers: getAuthHeaders()
      });
      clearCache(); // Invalidate cache on mutation
      return response.data;
    } catch (error) {
      console.error('Failed to create product:', error);
      throw error;
    }
  },

  updateProduct: async (id, productData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/products/${id}`, productData, {
        headers: getAuthHeaders()
      });
      clearCache(); // Invalidate cache on mutation
      return response.data;
    } catch (error) {
      console.error(`Failed to update product ${id}:`, error);
      throw error;
    }
  },

  deleteProduct: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/products/${id}`, {
        headers: getAuthHeaders()
      });
      clearCache(); // Invalidate cache on mutation
      return response.data;
    } catch (error) {
      console.error(`Failed to delete product ${id}:`, error);
      throw error;
    }
  },

  clearCache
};

export default productService;
