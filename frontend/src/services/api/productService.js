import apiClient from './apiClient';
import { normalizeProduct, normalizeApiResponse } from './dataAdapters';

const productService = {
  /**
   * Get all products
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with products data
   */
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/products', { params });
      // Normalize API response to match frontend expectations
      const normalized = normalizeApiResponse(response.data, normalizeProduct);
      return normalized;
    } catch (error) {
      console.error('Get products error:', error);
      throw error;
    }
  },
  
  /**
   * Get product by ID
   * @param {string} id - Product ID
   * @returns {Promise} - Promise with product data
   */
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/products/${id}`);
      // Normalize API response to match frontend expectations
      const normalized = normalizeApiResponse(response.data, normalizeProduct);
      return normalized;
    } catch (error) {
      console.error(`Get product ${id} error:`, error);
      throw error;
    }
  },
  
  /**
   * Create new product
   * @param {Object} productData - Product data
   * @returns {Promise} - Promise with created product data
   */
  create: async (productData) => {
    try {
      const response = await apiClient.post('/products', productData);
      return response.data;
    } catch (error) {
      console.error('Create product error:', error);
      throw error;
    }
  },
  
  /**
   * Update product
   * @param {string} id - Product ID
   * @param {Object} productData - Product data to update
   * @returns {Promise} - Promise with updated product data
   */
  update: async (id, productData) => {
    try {
      const response = await apiClient.put(`/products/${id}`, productData);
      return response.data;
    } catch (error) {
      console.error(`Update product ${id} error:`, error);
      throw error;
    }
  },
  
  /**
   * Delete product
   * @param {string} id - Product ID
   * @returns {Promise} - Promise with success status
   */
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Delete product ${id} error:`, error);
      throw error;
    }
  },
  
  /**
   * Get product promotions
   * @param {string} id - Product ID
   * @returns {Promise} - Promise with product promotions data
   */
  getPromotions: async (id) => {
    try {
      const response = await apiClient.get(`/products/${id}/promotions`);
      return response.data;
    } catch (error) {
      console.error(`Get product ${id} promotions error:`, error);
      throw error;
    }
  },
  
  /**
   * Get product trade spends
   * @param {string} id - Product ID
   * @returns {Promise} - Promise with product trade spends data
   */
  getTradeSpends: async (id) => {
    try {
      const response = await apiClient.get(`/products/${id}/trade-spends`);
      return response.data;
    } catch (error) {
      console.error(`Get product ${id} trade spends error:`, error);
      throw error;
    }
  },
  
  /**
   * Get product sales data
   * @param {string} id - Product ID
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with product sales data
   */
  getSalesData: async (id, params = {}) => {
    try {
      const response = await apiClient.get(`/products/${id}/sales`, { params });
      return response.data;
    } catch (error) {
      console.error(`Get product ${id} sales data error:`, error);
      throw error;
    }
  },
  
  /**
   * Get product performance
   * @param {string} id - Product ID
   * @returns {Promise} - Promise with product performance data
   */
  getPerformance: async (id) => {
    try {
      const response = await apiClient.get(`/products/${id}/performance`);
      return response.data;
    } catch (error) {
      console.error(`Get product ${id} performance error:`, error);
      throw error;
    }
  }
};

export default productService;
