import apiClient from './apiClient';
import { normalizeTradeSpend, normalizeApiResponse } from './dataAdapters';

const tradeSpendService = {
  /**
   * Get all trade spends
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with trade spends data
   */
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/trade-spends', { params });
      // Normalize API response to match frontend expectations
      const normalized = normalizeApiResponse(response.data, normalizeTradeSpend);
      return normalized;
    } catch (error) {
      console.error('Get trade spends error:', error);
      throw error;
    }
  },
  
  /**
   * Get trade spend by ID
   * @param {string} id - Trade spend ID
   * @returns {Promise} - Promise with trade spend data
   */
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/trade-spends/${id}`);
      // Normalize API response to match frontend expectations
      const normalized = normalizeApiResponse(response.data, normalizeTradeSpend);
      return normalized;
    } catch (error) {
      console.error(`Get trade spend ${id} error:`, error);
      throw error;
    }
  },
  
  /**
   * Create new trade spend
   * @param {Object} tradeSpendData - Trade spend data
   * @returns {Promise} - Promise with created trade spend data
   */
  create: async (tradeSpendData) => {
    try {
      const response = await apiClient.post('/trade-spends', tradeSpendData);
      return response.data;
    } catch (error) {
      console.error('Create trade spend error:', error);
      throw error;
    }
  },
  
  /**
   * Update trade spend
   * @param {string} id - Trade spend ID
   * @param {Object} tradeSpendData - Trade spend data to update
   * @returns {Promise} - Promise with updated trade spend data
   */
  update: async (id, tradeSpendData) => {
    try {
      const response = await apiClient.put(`/trade-spends/${id}`, tradeSpendData);
      return response.data;
    } catch (error) {
      console.error(`Update trade spend ${id} error:`, error);
      throw error;
    }
  },
  
  /**
   * Delete trade spend
   * @param {string} id - Trade spend ID
   * @returns {Promise} - Promise with success status
   */
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/trade-spends/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Delete trade spend ${id} error:`, error);
      throw error;
    }
  },
  
  /**
   * Approve trade spend
   * @param {string} id - Trade spend ID
   * @returns {Promise} - Promise with approved trade spend data
   */
  approve: async (id) => {
    try {
      const response = await apiClient.post(`/trade-spends/${id}/approve`);
      return response.data;
    } catch (error) {
      console.error(`Approve trade spend ${id} error:`, error);
      throw error;
    }
  },
  
  /**
   * Reject trade spend
   * @param {string} id - Trade spend ID
   * @param {Object} data - Rejection data
   * @param {string} data.reason - Rejection reason
   * @returns {Promise} - Promise with rejected trade spend data
   */
  reject: async (id, data) => {
    try {
      const response = await apiClient.post(`/trade-spends/${id}/reject`, data);
      return response.data;
    } catch (error) {
      console.error(`Reject trade spend ${id} error:`, error);
      throw error;
    }
  },
  
  /**
   * Get trade spend analytics
   * @param {string} id - Trade spend ID
   * @returns {Promise} - Promise with trade spend analytics data
   */
  getAnalytics: async (id) => {
    try {
      const response = await apiClient.get(`/trade-spends/${id}/analytics`);
      return response.data;
    } catch (error) {
      console.error(`Get trade spend ${id} analytics error:`, error);
      throw error;
    }
  }
};

export default tradeSpendService;
