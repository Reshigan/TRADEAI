import apiClient from './apiClient';
import { normalizeCustomer, normalizeApiResponse } from './dataAdapters';

const customerService = {
  /**
   * Get all customers
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with customers data
   */
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/customers', { params });
      // Normalize API response to match frontend expectations
      const normalized = normalizeApiResponse(response.data, normalizeCustomer);
      return normalized;
    } catch (error) {
      console.error('Get customers error:', error);
      throw error;
    }
  },
  
  /**
   * Get customer by ID
   * @param {string} id - Customer ID
   * @returns {Promise} - Promise with customer data
   */
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/customers/${id}`);
      // Normalize API response to match frontend expectations
      const normalized = normalizeApiResponse(response.data, normalizeCustomer);
      return normalized;
    } catch (error) {
      console.error(`Get customer ${id} error:`, error);
      throw error;
    }
  },
  
  /**
   * Create new customer
   * @param {Object} customerData - Customer data
   * @returns {Promise} - Promise with created customer data
   */
  create: async (customerData) => {
    try {
      const response = await apiClient.post('/customers', customerData);
      return response.data;
    } catch (error) {
      console.error('Create customer error:', error);
      throw error;
    }
  },
  
  /**
   * Update customer
   * @param {string} id - Customer ID
   * @param {Object} customerData - Customer data to update
   * @returns {Promise} - Promise with updated customer data
   */
  update: async (id, customerData) => {
    try {
      const response = await apiClient.put(`/customers/${id}`, customerData);
      return response.data;
    } catch (error) {
      console.error(`Update customer ${id} error:`, error);
      throw error;
    }
  },
  
  /**
   * Delete customer
   * @param {string} id - Customer ID
   * @returns {Promise} - Promise with success status
   */
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/customers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Delete customer ${id} error:`, error);
      throw error;
    }
  },
  
  /**
   * Get customer trade spends
   * @param {string} id - Customer ID
   * @returns {Promise} - Promise with customer trade spends data
   */
  getTradeSpends: async (id) => {
    try {
      const response = await apiClient.get(`/customers/${id}/trade-spends`);
      return response.data;
    } catch (error) {
      console.error(`Get customer ${id} trade spends error:`, error);
      throw error;
    }
  },
  
  /**
   * Get customer promotions
   * @param {string} id - Customer ID
   * @returns {Promise} - Promise with customer promotions data
   */
  getPromotions: async (id) => {
    try {
      const response = await apiClient.get(`/customers/${id}/promotions`);
      return response.data;
    } catch (error) {
      console.error(`Get customer ${id} promotions error:`, error);
      throw error;
    }
  },
  
  /**
   * Get customer performance
   * @param {string} id - Customer ID
   * @returns {Promise} - Promise with customer performance data
   */
  getPerformance: async (id) => {
    try {
      const response = await apiClient.get(`/customers/${id}/performance`);
      return response.data;
    } catch (error) {
      console.error(`Get customer ${id} performance error:`, error);
      throw error;
    }
  }
};

export default customerService;
