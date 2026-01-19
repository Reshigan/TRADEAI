import apiClient from './apiClient';
import { normalizePromotion, normalizeApiResponse } from './dataAdapters';

const promotionService = {
  /**
   * Get all promotions
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with promotions data
   */
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/promotions', { params });
      // Normalize API response to match frontend expectations
      const normalized = normalizeApiResponse(response.data, normalizePromotion);
      return normalized;
    } catch (error) {
      console.error('Get promotions error:', error);
      throw error;
    }
  },
  
  /**
   * Get promotion by ID
   * @param {string} id - Promotion ID
   * @returns {Promise} - Promise with promotion data
   */
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/promotions/${id}`);
      // Normalize API response to match frontend expectations
      const normalized = normalizeApiResponse(response.data, normalizePromotion);
      return normalized;
    } catch (error) {
      console.error(`Get promotion ${id} error:`, error);
      throw error;
    }
  },
  
  /**
   * Create new promotion
   * @param {Object} promotionData - Promotion data
   * @returns {Promise} - Promise with created promotion data
   */
  create: async (promotionData) => {
    try {
      const response = await apiClient.post('/promotions', promotionData);
      return response.data;
    } catch (error) {
      console.error('Create promotion error:', error);
      throw error;
    }
  },
  
  /**
   * Update promotion
   * @param {string} id - Promotion ID
   * @param {Object} promotionData - Promotion data to update
   * @returns {Promise} - Promise with updated promotion data
   */
  update: async (id, promotionData) => {
    try {
      const response = await apiClient.put(`/promotions/${id}`, promotionData);
      return response.data;
    } catch (error) {
      console.error(`Update promotion ${id} error:`, error);
      throw error;
    }
  },
  
  /**
   * Delete promotion
   * @param {string} id - Promotion ID
   * @returns {Promise} - Promise with success status
   */
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/promotions/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Delete promotion ${id} error:`, error);
      throw error;
    }
  },
  
  /**
   * Get promotion performance
   * @param {string} id - Promotion ID
   * @returns {Promise} - Promise with promotion performance data
   */
  getPerformance: async (id) => {
    try {
      const response = await apiClient.get(`/promotions/${id}/performance`);
      return response.data;
    } catch (error) {
      console.error(`Get promotion ${id} performance error:`, error);
      throw error;
    }
  },
  
  /**
   * Activate promotion
   * @param {string} id - Promotion ID
   * @returns {Promise} - Promise with activated promotion data
   */
  activate: async (id) => {
    try {
      const response = await apiClient.post(`/promotions/${id}/activate`);
      return response.data;
    } catch (error) {
      console.error(`Activate promotion ${id} error:`, error);
      throw error;
    }
  },
  
  /**
   * Deactivate promotion
   * @param {string} id - Promotion ID
   * @returns {Promise} - Promise with deactivated promotion data
   */
  deactivate: async (id) => {
    try {
      const response = await apiClient.post(`/promotions/${id}/deactivate`);
      return response.data;
    } catch (error) {
      console.error(`Deactivate promotion ${id} error:`, error);
      throw error;
    }
  }
};

export default promotionService;
