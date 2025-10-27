import apiClient from './apiClient';

const authService = {
  /**
   * Login user
   * @param {Object} credentials - User credentials
   * @param {string} credentials.email - User email or username
   * @param {string} credentials.password - User password
   * @returns {Promise} - Promise with user data
   */
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      
      // Extract tokens from response
      const token = response.data.token || response.data.data?.tokens?.accessToken;
      const refreshToken = response.data.data?.tokens?.refreshToken;
      const user = response.data.user || response.data.data?.user;
      
      if (!token) {
        throw new Error('No authentication token received from server');
      }
      
      // Store token and user data in local storage
      localStorage.setItem('token', token);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(user));
      
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      // Store login timestamp for session management
      localStorage.setItem('loginTimestamp', Date.now().toString());
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      // Clear any partial authentication data
      authService.clearAuthData();
      throw error;
    }
  },
  
  /**
   * Logout user
   * @returns {Promise} - Promise with logout status
   */
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
      // Continue to clear local storage even if API call fails
    } finally {
      // Always clear local storage
      authService.clearAuthData();
    }
    
    return { success: true };
  },
  
  /**
   * Clear all authentication data from local storage
   */
  clearAuthData: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTimestamp');
  },
  
  /**
   * Check if user is authenticated
   * @returns {boolean} - True if user is authenticated
   */
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    
    // Check if session has expired (24 hours)
    const loginTimestamp = localStorage.getItem('loginTimestamp');
    if (loginTimestamp) {
      const sessionAge = Date.now() - parseInt(loginTimestamp, 10);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (sessionAge > maxAge) {
        console.log('Session expired, clearing auth data');
        authService.clearAuthData();
        return false;
      }
    }
    
    return !!(token && isAuth);
  },
  
  /**
   * Get current user
   * @returns {Object|null} - User data or null if not authenticated
   */
  getCurrentUser: () => {
    if (!authService.isAuthenticated()) {
      return null;
    }
    
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },
  
  /**
   * Get authentication token
   * @returns {string|null} - Auth token or null
   */
  getToken: () => {
    return localStorage.getItem('token');
  },
  
  /**
   * Get refresh token
   * @returns {string|null} - Refresh token or null
   */
  getRefreshToken: () => {
    return localStorage.getItem('refreshToken');
  },
  
  /**
   * Refresh authentication token
   * @returns {Promise} - Promise with new token
   */
  refreshToken: async () => {
    try {
      const refreshToken = authService.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await apiClient.post('/auth/refresh-token', { refreshToken });
      
      const newToken = response.data.data?.tokens?.accessToken;
      const newRefreshToken = response.data.data?.tokens?.refreshToken;
      
      if (newToken) {
        localStorage.setItem('token', newToken);
      }
      
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
      
      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error);
      authService.clearAuthData();
      throw error;
    }
  },
  
  /**
   * Update user profile
   * @param {Object} userData - User data to update
   * @returns {Promise} - Promise with updated user data
   */
  updateProfile: async (userData) => {
    try {
      const response = await apiClient.put('/auth/profile', userData);
      
      // Update user data in local storage
      localStorage.setItem('user', JSON.stringify(response.data));
      
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },
  
  /**
   * Change password
   * @param {Object} passwordData - Password data
   * @param {string} passwordData.currentPassword - Current password
   * @param {string} passwordData.newPassword - New password
   * @returns {Promise} - Promise with success status
   */
  changePassword: async (passwordData) => {
    try {
      const response = await apiClient.put('/auth/password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }
};

export default authService;