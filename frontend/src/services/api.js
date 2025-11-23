import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token refresh state
let isRefreshing = false;
let refreshSubscribers = [];

// Function to subscribe to token refresh
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// Function to notify all subscribers when token is refreshed
const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// Check if token is about to expire (less than 5 minutes remaining)
const isTokenExpiringSoon = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;
    
    // Return true if less than 5 minutes remaining
    return timeUntilExpiry < 5 * 60 * 1000;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return false;
  }
};

// Add request interceptor for authentication and token refresh
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // Check if token is expiring soon and needs refresh
      if (refreshToken && isTokenExpiringSoon(token) && !isRefreshing) {
        isRefreshing = true;
        
        try {
          const response = await axios.post(
            `${api.defaults.baseURL}/auth/refresh-token`,
            { refreshToken }
          );
          
          const newToken = response.data.token || response.data.accessToken || response.data.data?.tokens?.accessToken;
          localStorage.setItem('token', newToken);
          localStorage.setItem('accessToken', newToken);
          config.headers.Authorization = `Bearer ${newToken}`;
          
          isRefreshing = false;
          onTokenRefreshed(newToken);
        } catch (error) {
          isRefreshing = false;
          console.error('Token refresh failed:', error);
          // Continue with old token
        }
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.log('[api.js] 401 interceptor triggered for:', originalRequest.url);
      console.log('[api.js] Has refreshToken:', !!localStorage.getItem('refreshToken'));
      console.log('[api.js] Already retried:', !!originalRequest._retry);
      
      // If token expired and we have refresh token, try to refresh
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken && !originalRequest._retry) {
        originalRequest._retry = true;
        
        if (isRefreshing) {
          console.log('[api.js] Already refreshing, queuing request');
          // If already refreshing, wait for it to complete
          return new Promise((resolve) => {
            subscribeTokenRefresh((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(axios(originalRequest));
            });
          });
        }
        
        isRefreshing = true;
        console.log('[api.js] Attempting token refresh...');
        
        try {
          const response = await axios.post(
            `${api.defaults.baseURL}/auth/refresh-token`,
            { refreshToken }
          );
          
          const newToken = response.data.token || response.data.accessToken || response.data.data?.tokens?.accessToken;
          localStorage.setItem('token', newToken);
          localStorage.setItem('accessToken', newToken);
          
          isRefreshing = false;
          onTokenRefreshed(newToken);
          
          console.log('[api.js] Token refresh successful, retrying request');
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          console.error('[api.js] Token refresh failed, logging out:', refreshError);
          // Refresh failed, log out user
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('user');
          window.location.href = '/';
          return Promise.reject(refreshError);
        }
      } else {
        console.log('[api.js] No refresh token or already retried, logging out');
        // No refresh token or already tried refresh, log out
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: async (credentials) => {
    try {
      console.log('authService.login called with:', { email: credentials.email, password: credentials.password ? '***' : 'empty' });
      console.log('API base URL:', api.defaults.baseURL);
      console.log('Making POST request to /auth/login...');
      
      const response = await api.post('/auth/login', credentials);
      
      console.log('✅ Login API response received');
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      console.log('Response data structure:', JSON.stringify(response.data, null, 2));
      
      // Backend response structure: { success: true, token: "...", data: { user: {...}, tokens: {...} } }
      const { token, data } = response.data;
      const user = data?.user;
      const tokens = data?.tokens || {};
      const refreshToken = tokens.refreshToken || data.refreshToken;
      
      console.log('Extracted token:', token ? 'YES' : 'NO');
      console.log('Extracted refreshToken:', refreshToken ? 'YES' : 'NO');
      console.log('Extracted data:', data);
      console.log('Extracted user:', user);
      
      if (!token || !user) {
        console.error('❌ Invalid response structure:', response.data);
        throw new Error('Invalid login response structure');
      }
      
      // Store token, refresh token, and user data
      localStorage.setItem('token', token);
      localStorage.setItem('accessToken', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('✅ Login successful, stored token and user data');
      
      return { token, refreshToken, user, tokens };
    } catch (error) {
      console.error('authService.login error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
      // Still remove items even if API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
    }
  },
};

// Budget services
export const budgetService = {
  getAll: async (params) => {
    try {
      const response = await api.get('/budgets', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getById: async (id) => {
    try {
      const response = await api.get(`/budgets/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  create: async (budget) => {
    try {
      const response = await api.post('/budgets', budget);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (id, budget) => {
    try {
      const response = await api.put(`/budgets/${id}`, budget);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/budgets/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Trade Spend services
export const tradeSpendService = {
  getAll: async (params) => {
    try {
      const response = await api.get('/trade-spends', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getById: async (id) => {
    try {
      const response = await api.get(`/trade-spends/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  create: async (tradeSpend) => {
    try {
      const response = await api.post('/trade-spends', tradeSpend);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (id, tradeSpend) => {
    try {
      const response = await api.put(`/trade-spends/${id}`, tradeSpend);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/trade-spends/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Promotion services
export const promotionService = {
  getAll: async (params) => {
    try {
      const response = await api.get('/promotions', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getById: async (id) => {
    try {
      const response = await api.get(`/promotions/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  create: async (promotion) => {
    try {
      const response = await api.post('/promotions', promotion);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (id, promotion) => {
    try {
      const response = await api.put(`/promotions/${id}`, promotion);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/promotions/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Customer services
export const customerService = {
  getAll: async (params) => {
    try {
      const response = await api.get('/customers', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getById: async (id) => {
    try {
      const response = await api.get(`/customers/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  create: async (customer) => {
    try {
      const response = await api.post('/customers', customer);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (id, customer) => {
    try {
      const response = await api.put(`/customers/${id}`, customer);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/customers/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Product services
export const productService = {
  getAll: async (params) => {
    try {
      const response = await api.get('/products', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getById: async (id) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  create: async (product) => {
    try {
      const response = await api.post('/products', product);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (id, product) => {
    try {
      const response = await api.put(`/products/${id}`, product);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Analytics services
export const analyticsService = {
  getSummary: async (params) => {
    try {
      const response = await api.get('/analytics/dashboard', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getDashboard: async (params) => {
    try {
      const response = await api.get('/analytics/dashboard', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getReports: async (params) => {
    try {
      const response = await api.get('/analytics/reports', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getBudgetAnalytics: async (params) => {
    try {
      const response = await api.get('/analytics/budgets', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getPromotionAnalytics: async (params) => {
    try {
      const response = await api.get('/analytics/promotions', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getCustomerAnalytics: async (params) => {
    try {
      const response = await api.get('/analytics/customers', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getProductAnalytics: async (params) => {
    try {
      const response = await api.get('/analytics/products', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getAll: async (params) => {
    try {
      const response = await api.get('/analytics/dashboard', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Currency services
export const currencyService = {
  getAll: async () => {
    try {
      const response = await api.get('/analytics/currencies');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  convert: async (amount, from, to) => {
    try {
      const response = await api.get('/currencies/convert', {
        params: { amount, from, to }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Settings services
export const settingsService = {
  get: async () => {
    try {
      const response = await api.get('/settings');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (settings) => {
    try {
      const response = await api.put('/settings', settings);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// User services
export const userService = {
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  updateProfile: async (profile) => {
    try {
      const response = await api.put('/users/profile', profile);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/users/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Trading Terms services
export const tradingTermsService = {
  getAll: async (params) => {
    try {
      const response = await api.get('/trading-terms', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getById: async (id) => {
    try {
      const response = await api.get(`/trading-terms/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  create: async (tradingTerm) => {
    try {
      const response = await api.post('/trading-terms', tradingTerm);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (id, tradingTerm) => {
    try {
      const response = await api.put(`/trading-terms/${id}`, tradingTerm);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/trading-terms/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Forecasting services
export const forecastingService = {
  getProducts: async () => {
    try {
      const response = await api.get('/products');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getCustomers: async () => {
    try {
      const response = await api.get('/customers');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  generateSalesForecast: async (filters) => {
    try {
      const response = await api.post('/forecasting/generate', filters);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  generateDemandForecast: async (params) => {
    try {
      const response = await api.post('/forecasting/demand', params);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  generateBudgetForecast: async (params) => {
    try {
      const response = await api.post('/forecasting/budget', params);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  exportForecast: async (type, filters) => {
    try {
      const response = await api.post(`/forecasting/export/${type}`, filters, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default api;
