import apiClient from './apiClient';

/**
 * Service for interacting with the Activity Grid API
 */
const activityGridService = {
  /**
   * Get activity grid data
   * @param {Object} params - Query parameters
   * @param {string} params.view - View type (month, week, day, list)
   * @param {string} params.startDate - Start date (ISO format)
   * @param {string} params.endDate - End date (ISO format)
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @returns {Promise} - Promise with activity grid data
   */
  getActivityGrid: (params = {}) => {
    console.log('[activityGridService] getActivityGrid called with params:', params);
    console.log('[activityGridService] localStorage token:', localStorage.getItem('token') ? 'EXISTS' : 'MISSING');
    return apiClient.get('/activity-grid', { params });
  },

  /**
   * Get heat map data
   * @param {Object} params - Query parameters
   * @param {number} params.year - Year
   * @param {number} params.month - Month (1-12)
   * @param {string} params.groupBy - Group by (customer, product, vendor)
   * @returns {Promise} - Promise with heat map data
   */
  getHeatMap: (params = {}) => {
    return apiClient.get('/activity-grid/heat-map', { params });
  },

  /**
   * Get conflicts
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (ISO format)
   * @param {string} params.endDate - End date (ISO format)
   * @param {string} params.severity - Severity (low, medium, high)
   * @returns {Promise} - Promise with conflicts data
   */
  getConflicts: (params = {}) => {
    return apiClient.get('/activity-grid/conflicts', { params });
  },

  /**
   * Create activity
   * @param {Object} data - Activity data
   * @returns {Promise} - Promise with created activity
   */
  createActivity: (data) => {
    return apiClient.post('/activity-grid', data);
  },

  /**
   * Update activity
   * @param {string} id - Activity ID
   * @param {Object} data - Updated activity data
   * @returns {Promise} - Promise with updated activity
   */
  updateActivity: (id, data) => {
    return apiClient.put(`/activity-grid/${id}`, data);
  },

  /**
   * Delete activity
   * @param {string} id - Activity ID
   * @returns {Promise} - Promise with deletion result
   */
  deleteActivity: (id) => {
    return apiClient.delete(`/activity-grid/${id}`);
  },

  /**
   * Sync activities from other modules
   * @param {Object} data - Sync parameters
   * @param {string} data.source - Source (promotions, tradespends, campaigns, all)
   * @param {string} data.startDate - Start date (ISO format)
   * @param {string} data.endDate - End date (ISO format)
   * @returns {Promise} - Promise with sync results
   */
  syncActivities: (data) => {
    return apiClient.post('/activity-grid/sync', data);
  }
};

export default activityGridService;