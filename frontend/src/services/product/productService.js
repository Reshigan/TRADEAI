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

const productService = {
  getProducts: async (filters = {}) => {
    const cacheKey = getCacheKey('products', filters);
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get(`/api/products`, { params: filters });
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
      const response = await apiClient.get(`/api/products/${id}`);
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
        ? `/api/products/${productId}/hierarchy`
        : `/api/products/hierarchy`;
      
      const response = await apiClient.get(url);
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
      const response = await apiClient.get(`/api/products/${productId}/performance`);
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch product performance for ${productId}:`, error);
      throw error;
    }
  },

  createProduct: async (productData) => {
    try {
      const response = await apiClient.post(`/api/products`, productData);
      clearCache();
      return response.data;
    } catch (error) {
      console.error('Failed to create product:', error);
      throw error;
    }
  },

  updateProduct: async (id, productData) => {
    try {
      const response = await apiClient.put(`/api/products/${id}`, productData);
      clearCache();
      return response.data;
    } catch (error) {
      console.error(`Failed to update product ${id}:`, error);
      throw error;
    }
  },

  deleteProduct: async (id) => {
    try {
      const response = await apiClient.delete(`/api/products/${id}`);
      clearCache();
      return response.data;
    } catch (error) {
      console.error(`Failed to delete product ${id}:`, error);
      throw error;
    }
  },

  clearCache
};

export default productService;
