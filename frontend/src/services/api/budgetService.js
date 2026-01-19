import apiClient from './apiClient';
import { normalizeBudget, normalizeBudgets, normalizeApiResponse } from './dataAdapters';

const budgetService = {
  /**
   * Get all budgets
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with budgets data
   */
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/budgets', { params });
      // Normalize API response to match frontend expectations
      const normalized = normalizeApiResponse(response.data, normalizeBudget);
      return normalized;
    } catch (error) {
      console.error('Get budgets error:', error);
      throw error;
    }
  },
  
  /**
   * Get budget by ID
   * @param {string} id - Budget ID
   * @returns {Promise} - Promise with budget data
   */
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/budgets/${id}`);
      // Normalize API response to match frontend expectations
      const normalized = normalizeApiResponse(response.data, normalizeBudget);
      return normalized;
    } catch (error) {
      console.error(`Get budget ${id} error:`, error);
      throw error;
    }
  },
  
  /**
   * Create new budget
   * @param {Object} budgetData - Budget data
   * @returns {Promise} - Promise with created budget data
   */
  create: async (budgetData) => {
    try {
      const response = await apiClient.post('/budgets', budgetData);
      return response.data;
    } catch (error) {
      console.error('Create budget error:', error);
      throw error;
    }
  },
  
  /**
   * Update budget
   * @param {string} id - Budget ID
   * @param {Object} budgetData - Budget data to update
   * @returns {Promise} - Promise with updated budget data
   */
  update: async (id, budgetData) => {
    try {
      const response = await apiClient.put(`/budgets/${id}`, budgetData);
      return response.data;
    } catch (error) {
      console.error(`Update budget ${id} error:`, error);
      throw error;
    }
  },
  
  /**
   * Delete budget
   * @param {string} id - Budget ID
   * @returns {Promise} - Promise with success status
   */
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/budgets/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Delete budget ${id} error:`, error);
      throw error;
    }
  },
  
  /**
   * Get budget utilization
   * @param {string} id - Budget ID
   * @returns {Promise} - Promise with budget utilization data
   */
  getUtilization: async (id) => {
    try {
      const response = await apiClient.get(`/budgets/${id}/utilization`);
      return response.data;
    } catch (error) {
      console.error(`Get budget ${id} utilization error:`, error);
      throw error;
    }
  },
  
  /**
   * Approve budget
   * @param {string} id - Budget ID
   * @returns {Promise} - Promise with approved budget data
   */
  approve: async (id) => {
    try {
      const response = await apiClient.post(`/budgets/${id}/approve`);
      return response.data;
    } catch (error) {
      console.error(`Approve budget ${id} error:`, error);
      throw error;
    }
  },
  
  /**
   * Reject budget
   * @param {string} id - Budget ID
   * @param {Object} data - Rejection data
   * @param {string} data.reason - Rejection reason
   * @returns {Promise} - Promise with rejected budget data
   */
  reject: async (id, data) => {
    try {
      const response = await apiClient.post(`/budgets/${id}/reject`, data);
      return response.data;
    } catch (error) {
      console.error(`Reject budget ${id} error:`, error);
      throw error;
    }
  }
};

export default budgetService;
