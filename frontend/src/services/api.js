import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // D-11: Send httpOnly cookies with requests
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
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // Check if token is expiring soon and needs refresh
      // D-11: refreshToken is now in httpOnly cookie, no need to send in body
      if (isTokenExpiringSoon(token) && !isRefreshing) {
        isRefreshing = true;
        
        try {
          const response = await axios.post(
            `${api.defaults.baseURL}/auth/refresh-token`,
            {},
            { withCredentials: true }
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
      // If token expired, try to refresh using httpOnly cookie
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        
        if (isRefreshing) {
          // If already refreshing, wait for it to complete
          return new Promise((resolve) => {
            subscribeTokenRefresh((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(axios(originalRequest));
            });
          });
        }
        
        isRefreshing = true;
        
        try {
          // D-11: refreshToken sent via httpOnly cookie automatically
          const response = await axios.post(
            `${api.defaults.baseURL}/auth/refresh-token`,
            {},
            { withCredentials: true }
          );
          
          const newToken = response.data.token || response.data.accessToken || response.data.data?.tokens?.accessToken;
          localStorage.setItem('token', newToken);
          localStorage.setItem('accessToken', newToken);
          
          isRefreshing = false;
          onTokenRefreshed(newToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('user');
          
          const isAuthEndpoint = originalRequest.url?.includes('/auth/');
          const isOnLoginPage = window.location.pathname === '/' || window.location.pathname === '/login';
          
          if (!isOnLoginPage && !isAuthEndpoint) {
            window.location.href = '/';
          }
          
          return Promise.reject(refreshError);
        }
      } else {
        // Already tried refresh, log out
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
        
        const isAuthEndpoint = originalRequest.url?.includes('/auth/');
        const isOnLoginPage = window.location.pathname === '/' || window.location.pathname === '/login';
        
        if (!isOnLoginPage && !isAuthEndpoint) {
          window.location.href = '/';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to get user-friendly error messages
export const getErrorMessage = (error) => {
  // Network errors
  if (!error.response) {
    if (error.message === 'Network Error') {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    return error.message || 'An unexpected error occurred. Please try again.';
  }
  
  // Server errors with response
  const status = error.response.status;
  const serverMessage = error.response.data?.message || error.response.data?.error;
  
  switch (status) {
    case 400:
      return serverMessage || 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return serverMessage || 'The requested resource was not found.';
    case 409:
      return serverMessage || 'This record already exists or conflicts with existing data.';
    case 422:
      return serverMessage || 'The data provided is invalid. Please check your input.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Our team has been notified. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'The server is temporarily unavailable. Please try again in a few minutes.';
    default:
      return serverMessage || `An error occurred (${status}). Please try again.`;
  }
};

// Auth services
export const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      // GAP-01: Check if 2FA is required
      if (response.data.requires2FA) {
        return { requires2FA: true, tempToken: response.data.tempToken };
      }
      
      // Backend response structure: { success: true, token: "...", data: { user: {...}, tokens: {...} } }
      const { token, data } = response.data;
      const user = data?.user;
      const tokens = data?.tokens || {};
      
      if (!token || !user) {
        console.error('Invalid response structure:', response.data);
        throw new Error('Invalid login response structure');
      }
      
      // D-11: Store access token only; refresh token is in httpOnly cookie
      localStorage.setItem('token', token);
      localStorage.setItem('accessToken', token);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(user));
      
      return { token, user, tokens };
    } catch (error) {
      throw error;
    }
  },
  // GAP-01: 2FA login with TOTP code
  verify2FA: async ({ tempToken, token: totpCode, backupCode }) => {
    try {
      const response = await api.post('/auth/2fa/login', { tempToken, token: totpCode, backupCode });
      const { token, data } = response.data;
      const user = data?.user;
      if (!token || !user) throw new Error('Invalid 2FA response');
      localStorage.setItem('token', token);
      localStorage.setItem('accessToken', token);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(user));
      return { token, user };
    } catch (error) {
      throw error;
    }
  },
  generate2FA: async () => {
    const response = await api.post('/auth/2fa/generate');
    return response.data;
  },
  enable2FA: async (data) => {
    const response = await api.post('/auth/2fa/verify', data);
    return response.data;
  },
  disable2FA: async (data) => {
    const response = await api.post('/auth/2fa/disable', data);
    return response.data;
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
      // D-11: refreshToken cookie cleared server-side
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
      // Still remove items even if API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
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
  getBudgets: async (params) => {
    try {
      const response = await api.get('/budgets', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  applyReallocation: async (data) => {
    try {
      const response = await api.post('/budgets/reallocate', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getHierarchy: async (params) => {
    try {
      const response = await api.get('/budgets/hierarchy', { params });
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
  // W-08: Missing service methods
  submit: async (id) => { const r = await api.post(`/trade-spends/${id}/submit`); return r.data; },
  approve: async (id, data) => { const r = await api.post(`/trade-spends/${id}/approve`, data || {}); return r.data; },
  reject: async (id, data) => { const r = await api.post(`/trade-spends/${id}/reject`, data || {}); return r.data; },
  getTradeSpends: async (params) => {
    try {
      const response = await api.get('/trade-spends', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getTradeSpendSummary: async () => {
    try {
      const response = await api.get('/trade-spends/summary');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  deleteTradeSpend: async (id) => {
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
  // W-08: Missing service methods
  submit: async (id) => { const r = await api.post(`/promotions/${id}/submit`); return r.data; },
  approve: async (id, data) => { const r = await api.post(`/promotions/${id}/approve`, data || {}); return r.data; },
  reject: async (id, data) => { const r = await api.post(`/promotions/${id}/reject`, data || {}); return r.data; },
  clone: async (id, data) => { const r = await api.post(`/promotions/${id}/clone`, data || {}); return r.data; },
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
  getCustomers: async (params) => {
    try {
      const response = await api.get('/customers', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getCustomerHierarchy: async (params) => {
    try {
      const response = await api.get('/customers/hierarchy', { params });
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
  getProducts: async (params) => {
    try {
      const response = await api.get('/products', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getSalesData: async (id, params) => {
    try {
      const response = await api.get(`/products/${id}/sales`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getProductHierarchy: async (params) => {
    try {
      const response = await api.get('/products/hierarchy', { params });
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
  getDashboardSummary: async (params) => {
    try {
      const response = await api.get('/analytics/dashboard', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getSpendTrend: async (params) => {
    try {
      const response = await api.get('/analytics/spend-trend', { params });
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
      const response = await api.get('/settings/currencies/convert', {
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
  // T-01/T-02: Terminology API methods
  getTerminology: async () => {
    const response = await api.get('/settings/terminology');
    return response.data;
  },
  updateTerminology: async (data) => {
    const response = await api.put('/settings/terminology', data);
    return response.data;
  },
  resetTerminology: async () => {
    const response = await api.delete('/settings/terminology');
    return response.data;
  },
  setCompanyType: async (companyType) => {
    const response = await api.put('/settings/company-type', { companyType });
    return response.data;
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
  getAll: async (params) => {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getUsers: async (params) => {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getById: async (id) => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  create: async (data) => {
    try {
      const response = await api.post('/users', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (id, data) => {
    try {
      const response = await api.put(`/users/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/users/${id}`);
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
  getTradingTerms: async (params) => {
    try {
      const response = await api.get('/trading-terms', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  deleteTradingTerm: async (id) => {
    try {
      const response = await api.delete(`/trading-terms/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getTradingTerm: async (id) => {
    try {
      const response = await api.get(`/trading-terms/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  updateTradingTerm: async (id, data) => {
    try {
      const response = await api.put(`/trading-terms/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  createTradingTerm: async (data) => {
    try {
      const response = await api.post('/trading-terms', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // W-08: Missing service methods
  submit: async (id) => { const r = await api.post(`/trading-terms/${id}/submit`); return r.data; },
  approve: async (id, data) => { const r = await api.post(`/trading-terms/${id}/approve`, data || {}); return r.data; },
  reject: async (id, data) => { const r = await api.post(`/trading-terms/${id}/reject`, data || {}); return r.data; },
};

// W-08: Campaign service (was missing entirely)
export const campaignService = {
  getAll: async (params) => { const r = await api.get('/campaigns', { params }); return r.data; },
  getById: async (id) => { const r = await api.get(`/campaigns/${id}`); return r.data; },
  create: async (data) => { const r = await api.post('/campaigns', data); return r.data; },
  update: async (id, data) => { const r = await api.put(`/campaigns/${id}`, data); return r.data; },
  delete: async (id) => { const r = await api.delete(`/campaigns/${id}`); return r.data; },
  submit: async (id) => { const r = await api.post(`/campaigns/${id}/submit`); return r.data; },
  approve: async (id, data) => { const r = await api.post(`/campaigns/${id}/approve`, data || {}); return r.data; },
  reject: async (id, data) => { const r = await api.post(`/campaigns/${id}/reject`, data || {}); return r.data; },
  getSummary: async () => { const r = await api.get('/campaigns/summary'); return r.data; },
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

export const aiCopilotService = {
  ask: async (question, context) => {
    const response = await api.post('/ai-copilot/ask', { question, context });
    return response.data;
  },
  suggestActions: async () => {
    const response = await api.post('/ai-copilot/suggest-actions', {});
    return response.data;
  },
};

export const smartApprovalsService = {
  evaluate: async (approvalId) => {
    const response = await api.post('/smart-approvals/evaluate', { approvalId });
    return response.data;
  },
  bulkEvaluate: async () => {
    const response = await api.post('/smart-approvals/bulk-evaluate', {});
    return response.data;
  },
};

export const deductionMatchService = {
  autoMatch: async () => {
    const response = await api.post('/deduction-match/auto-match', {});
    return response.data;
  },
  summary: async () => {
    const response = await api.get('/deduction-match/summary');
    return response.data;
  },
};

export const postEventAnalysisService = {
  getAnalysis: async (promotionId) => {
    const response = await api.get(`/post-event-analysis/${promotionId}`);
    return response.data;
  },
  compare: async () => {
    const response = await api.get('/post-event-analysis/compare');
    return response.data;
  },
};

export const anomalyDetectionService = {
  scan: async () => {
    const response = await api.get('/anomaly-detection/scan');
    return response.data;
  },
};

export const promotionConflictService = {
  check: async (params) => {
    const response = await api.post('/promotion-conflict/check', params);
    return response.data;
  },
};

export const baselineService = {
  getAll: async (params) => {
    const response = await api.get('/baselines', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/baselines/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/baselines', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/baselines/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/baselines/${id}`);
    return response.data;
  },
  calculate: async (id) => {
    const response = await api.post(`/baselines/${id}/calculate`);
    return response.data;
  },
  decompose: async (id, data) => {
    const response = await api.post(`/baselines/${id}/decompose`, data);
    return response.data;
  },
  approve: async (id) => {
    const response = await api.post(`/baselines/${id}/approve`);
    return response.data;
  },
  getDecompositions: async (id) => {
    const response = await api.get(`/baselines/${id}/decompositions`);
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/baselines/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/baselines/options');
    return response.data;
  },
};

export const accrualService = {
  getAll: async (params) => {
    const response = await api.get('/accruals', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/accruals/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/accruals', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/accruals/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/accruals/${id}`);
    return response.data;
  },
  calculate: async (id) => {
    const response = await api.post(`/accruals/${id}/calculate`);
    return response.data;
  },
  post: async (id) => {
    const response = await api.post(`/accruals/${id}/post`);
    return response.data;
  },
  reverse: async (id, data) => {
    const response = await api.post(`/accruals/${id}/reverse`, data);
    return response.data;
  },
  approve: async (id) => {
    const response = await api.post(`/accruals/${id}/approve`);
    return response.data;
  },
  getJournals: async (id) => {
    const response = await api.get(`/accruals/${id}/journals`);
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/accruals/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/accruals/options');
    return response.data;
  },
};

export const settlementService = {
  getAll: async (params) => {
    const response = await api.get('/settlements', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/settlements/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/settlements', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/settlements/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/settlements/${id}`);
    return response.data;
  },
  process: async (id) => {
    const response = await api.post(`/settlements/${id}/process`);
    return response.data;
  },
  approve: async (id, data) => {
    const response = await api.post(`/settlements/${id}/approve`, data);
    return response.data;
  },
  reject: async (id, data) => {
    const response = await api.post(`/settlements/${id}/reject`, data);
    return response.data;
  },
  pay: async (id, data) => {
    const response = await api.post(`/settlements/${id}/pay`, data);
    return response.data;
  },
  getLines: async (id) => {
    const response = await api.get(`/settlements/${id}/lines`);
    return response.data;
  },
  getPayments: async (id) => {
    const response = await api.get(`/settlements/${id}/payments`);
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/settlements/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/settlements/options');
    return response.data;
  },
  generate: async (data) => {
    const response = await api.post('/settlements/generate', data);
    return response.data;
  },
};

export const pnlService = {
  getAll: async (params) => {
    const response = await api.get('/pnl', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/pnl/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/pnl', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/pnl/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/pnl/${id}`);
    return response.data;
  },
  generate: async (id) => {
    const response = await api.post(`/pnl/${id}/generate`);
    return response.data;
  },
  getLineItems: async (id) => {
    const response = await api.get(`/pnl/${id}/line-items`);
    return response.data;
  },
  getLiveByCustomer: async (params) => {
    const response = await api.get('/pnl/live-by-customer', { params });
    return response.data;
  },
  getLiveByPromotion: async (params) => {
    const response = await api.get('/pnl/live-by-promotion', { params });
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/pnl/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/pnl/options');
    return response.data;
  },
  calculate: async (data) => {
    const response = await api.post('/pnl/calculate', data);
    return response.data;
  },
};

export const budgetAllocationService = {
  getAll: async (params) => {
    const response = await api.get('/budget-allocations', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/budget-allocations/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/budget-allocations', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/budget-allocations/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/budget-allocations/${id}`);
    return response.data;
  },
  distribute: async (id, overrides) => {
    const response = await api.post(`/budget-allocations/${id}/distribute`, { overrides });
    return response.data;
  },
  lock: async (id) => {
    const response = await api.post(`/budget-allocations/${id}/lock`);
    return response.data;
  },
  unlock: async (id) => {
    const response = await api.post(`/budget-allocations/${id}/unlock`);
    return response.data;
  },
  refreshUtilization: async (id) => {
    const response = await api.post(`/budget-allocations/${id}/refresh-utilization`);
    return response.data;
  },
  getLines: async (id) => {
    const response = await api.get(`/budget-allocations/${id}/lines`);
    return response.data;
  },
  updateLine: async (id, lineId, data) => {
    const response = await api.put(`/budget-allocations/${id}/lines/${lineId}`, data);
    return response.data;
  },
  getWaterfall: async (params) => {
    const response = await api.get('/budget-allocations/waterfall', { params });
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/budget-allocations/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/budget-allocations/options');
    return response.data;
  },
};

export const demandSignalService = {
  getAll: async (params) => {
    const response = await api.get('/demand-signals', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/demand-signals/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/demand-signals', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/demand-signals/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/demand-signals/${id}`);
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/demand-signals/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/demand-signals/options');
    return response.data;
  },
  getTrends: async (params) => {
    const response = await api.get('/demand-signals/trends', { params });
    return response.data;
  },
  getAnomalies: async (params) => {
    const response = await api.get('/demand-signals/anomalies', { params });
    return response.data;
  },
  getSources: async (params) => {
    const response = await api.get('/demand-signals/sources/list', { params });
    return response.data;
  },
  getSourceById: async (id) => {
    const response = await api.get(`/demand-signals/sources/${id}`);
    return response.data;
  },
  createSource: async (data) => {
    const response = await api.post('/demand-signals/sources', data);
    return response.data;
  },
  updateSource: async (id, data) => {
    const response = await api.put(`/demand-signals/sources/${id}`, data);
    return response.data;
  },
  deleteSource: async (id) => {
    const response = await api.delete(`/demand-signals/sources/${id}`);
    return response.data;
  },
};

export const scenarioService = {
  getAll: async (params) => {
    const response = await api.get('/scenarios', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/scenarios/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/scenarios', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/scenarios/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/scenarios/${id}`);
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/scenarios/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/scenarios/options');
    return response.data;
  },
  compare: async (scenarioA, scenarioB) => {
    const response = await api.get('/scenarios/compare', { params: { scenario_a: scenarioA, scenario_b: scenarioB } });
    return response.data;
  },
  simulate: async (id) => {
    const response = await api.post(`/scenarios/${id}/simulate`);
    return response.data;
  },
  getVariables: async (id) => {
    const response = await api.get(`/scenarios/${id}/variables`);
    return response.data;
  },
  addVariable: async (id, data) => {
    const response = await api.post(`/scenarios/${id}/variables`, data);
    return response.data;
  },
  updateVariable: async (id, varId, data) => {
    const response = await api.put(`/scenarios/${id}/variables/${varId}`, data);
    return response.data;
  },
  deleteVariable: async (id, varId) => {
    const response = await api.delete(`/scenarios/${id}/variables/${varId}`);
    return response.data;
  },
  getResults: async (id) => {
    const response = await api.get(`/scenarios/${id}/results`);
    return response.data;
  },
};

export const promotionOptimizerService = {
  getAll: async (params) => {
    const response = await api.get('/promotion-optimizer', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/promotion-optimizer/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/promotion-optimizer', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/promotion-optimizer/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/promotion-optimizer/${id}`);
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/promotion-optimizer/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/promotion-optimizer/options');
    return response.data;
  },
  optimize: async (id) => {
    const response = await api.post(`/promotion-optimizer/${id}/optimize`);
    return response.data;
  },
  getRecommendations: async (id) => {
    const response = await api.get(`/promotion-optimizer/${id}/recommendations`);
    return response.data;
  },
  updateRecommendationAction: async (id, recId, data) => {
    const response = await api.put(`/promotion-optimizer/${id}/recommendations/${recId}/action`, data);
    return response.data;
  },
  getConstraints: async (id) => {
    const response = await api.get(`/promotion-optimizer/${id}/constraints`);
    return response.data;
  },
  addConstraint: async (id, data) => {
    const response = await api.post(`/promotion-optimizer/${id}/constraints`, data);
    return response.data;
  },
  deleteConstraint: async (id, conId) => {
    const response = await api.delete(`/promotion-optimizer/${id}/constraints/${conId}`);
    return response.data;
  },
};

export const tradeCalendarService = {
  getAll: async (params) => {
    const response = await api.get('/trade-calendar', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/trade-calendar/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/trade-calendar', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/trade-calendar/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/trade-calendar/${id}`);
    return response.data;
  },
  syncPromotion: async (id) => {
    const response = await api.post(`/trade-calendar/${id}/sync-promotion`);
    return response.data;
  },
  checkConstraints: async (data) => {
    const response = await api.post('/trade-calendar/check-constraints', data);
    return response.data;
  },
  getTimeline: async (params) => {
    const response = await api.get('/trade-calendar/timeline', { params });
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/trade-calendar/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/trade-calendar/options');
    return response.data;
  },
  getConstraints: async (params) => {
    const response = await api.get('/trade-calendar/constraints/list', { params });
    return response.data;
  },
  getConstraintById: async (id) => {
    const response = await api.get(`/trade-calendar/constraints/${id}`);
    return response.data;
  },
  createConstraint: async (data) => {
    const response = await api.post('/trade-calendar/constraints', data);
    return response.data;
  },
  updateConstraint: async (id, data) => {
    const response = await api.put(`/trade-calendar/constraints/${id}`, data);
    return response.data;
  },
  deleteConstraint: async (id) => {
    const response = await api.delete(`/trade-calendar/constraints/${id}`);
    return response.data;
  },
};

export const customer360Service = {
  getSummary: async () => {
    const response = await api.get('/customer-360/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/customer-360/options');
    return response.data;
  },
  getProfiles: async (params) => {
    const response = await api.get('/customer-360/profiles', { params });
    return response.data;
  },
  getProfileById: async (id) => {
    const response = await api.get(`/customer-360/profiles/${id}`);
    return response.data;
  },
  createProfile: async (data) => {
    const response = await api.post('/customer-360/profiles', data);
    return response.data;
  },
  updateProfile: async (id, data) => {
    const response = await api.put(`/customer-360/profiles/${id}`, data);
    return response.data;
  },
  deleteProfile: async (id) => {
    const response = await api.delete(`/customer-360/profiles/${id}`);
    return response.data;
  },
  getInsights: async (profileId, params) => {
    const response = await api.get(`/customer-360/profiles/${profileId}/insights`, { params });
    return response.data;
  },
  createInsight: async (data) => {
    const response = await api.post('/customer-360/insights', data);
    return response.data;
  },
  deleteInsight: async (id) => {
    const response = await api.delete(`/customer-360/insights/${id}`);
    return response.data;
  },
  recalculate: async (profileId) => {
    const response = await api.post(`/customer-360/profiles/${profileId}/recalculate`);
    return response.data;
  },
  getLeaderboard: async (params) => {
    const response = await api.get('/customer-360/leaderboard', { params });
    return response.data;
  },
  getAtRisk: async (params) => {
    const response = await api.get('/customer-360/at-risk', { params });
    return response.data;
  },
};

export const advancedReportingService = {
  getSummary: async () => {
    const response = await api.get('/advanced-reporting/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/advanced-reporting/options');
    return response.data;
  },
  getTemplates: async (params) => {
    const response = await api.get('/advanced-reporting/templates', { params });
    return response.data;
  },
  getTemplateById: async (id) => {
    const response = await api.get(`/advanced-reporting/templates/${id}`);
    return response.data;
  },
  createTemplate: async (data) => {
    const response = await api.post('/advanced-reporting/templates', data);
    return response.data;
  },
  updateTemplate: async (id, data) => {
    const response = await api.put(`/advanced-reporting/templates/${id}`, data);
    return response.data;
  },
  deleteTemplate: async (id) => {
    const response = await api.delete(`/advanced-reporting/templates/${id}`);
    return response.data;
  },
  runTemplate: async (id, data) => {
    const response = await api.post(`/advanced-reporting/templates/${id}/run`, data || {});
    return response.data;
  },
  getReports: async (params) => {
    const response = await api.get('/advanced-reporting/reports', { params });
    return response.data;
  },
  getReportById: async (id) => {
    const response = await api.get(`/advanced-reporting/reports/${id}`);
    return response.data;
  },
  updateReport: async (id, data) => {
    const response = await api.put(`/advanced-reporting/reports/${id}`, data);
    return response.data;
  },
  deleteReport: async (id) => {
    const response = await api.delete(`/advanced-reporting/reports/${id}`);
    return response.data;
  },
  toggleFavorite: async (id) => {
    const response = await api.post(`/advanced-reporting/reports/${id}/toggle-favorite`);
    return response.data;
  },
  getSchedules: async (params) => {
    const response = await api.get('/advanced-reporting/schedules', { params });
    return response.data;
  },
  getScheduleById: async (id) => {
    const response = await api.get(`/advanced-reporting/schedules/${id}`);
    return response.data;
  },
  createSchedule: async (data) => {
    const response = await api.post('/advanced-reporting/schedules', data);
    return response.data;
  },
  updateSchedule: async (id, data) => {
    const response = await api.put(`/advanced-reporting/schedules/${id}`, data);
    return response.data;
  },
  deleteSchedule: async (id) => {
    const response = await api.delete(`/advanced-reporting/schedules/${id}`);
    return response.data;
  },
  getCrossModuleReport: async (params) => {
    const response = await api.get('/advanced-reporting/cross-module', { params });
    return response.data;
  },
};

export const revenueGrowthService = {
  getSummary: async () => {
    const response = await api.get('/revenue-growth/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/revenue-growth/options');
    return response.data;
  },
  getInitiatives: async (params) => {
    const response = await api.get('/revenue-growth/initiatives', { params });
    return response.data;
  },
  getInitiativeById: async (id) => {
    const response = await api.get(`/revenue-growth/initiatives/${id}`);
    return response.data;
  },
  createInitiative: async (data) => {
    const response = await api.post('/revenue-growth/initiatives', data);
    return response.data;
  },
  updateInitiative: async (id, data) => {
    const response = await api.put(`/revenue-growth/initiatives/${id}`, data);
    return response.data;
  },
  deleteInitiative: async (id) => {
    const response = await api.delete(`/revenue-growth/initiatives/${id}`);
    return response.data;
  },
  getPricing: async (params) => {
    const response = await api.get('/revenue-growth/pricing', { params });
    return response.data;
  },
  getPricingById: async (id) => {
    const response = await api.get(`/revenue-growth/pricing/${id}`);
    return response.data;
  },
  createPricing: async (data) => {
    const response = await api.post('/revenue-growth/pricing', data);
    return response.data;
  },
  updatePricing: async (id, data) => {
    const response = await api.put(`/revenue-growth/pricing/${id}`, data);
    return response.data;
  },
  deletePricing: async (id) => {
    const response = await api.delete(`/revenue-growth/pricing/${id}`);
    return response.data;
  },
  getMixAnalyses: async (params) => {
    const response = await api.get('/revenue-growth/mix', { params });
    return response.data;
  },
  createMixAnalysis: async (data) => {
    const response = await api.post('/revenue-growth/mix', data);
    return response.data;
  },
  deleteMixAnalysis: async (id) => {
    const response = await api.delete(`/revenue-growth/mix/${id}`);
    return response.data;
  },
  getGrowthTracking: async (params) => {
    const response = await api.get('/revenue-growth/growth-tracking', { params });
    return response.data;
  },
  createGrowthTracker: async (data) => {
    const response = await api.post('/revenue-growth/growth-tracking', data);
    return response.data;
  },
  deleteGrowthTracker: async (id) => {
    const response = await api.delete(`/revenue-growth/growth-tracking/${id}`);
    return response.data;
  },
};

export const executiveKpiService = {
  getSummary: async () => {
    const response = await api.get('/executive-kpi/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/executive-kpi/options');
    return response.data;
  },
  getDefinitions: async (params) => {
    const response = await api.get('/executive-kpi/definitions', { params });
    return response.data;
  },
  createDefinition: async (data) => {
    const response = await api.post('/executive-kpi/definitions', data);
    return response.data;
  },
  updateDefinition: async (id, data) => {
    const response = await api.put(`/executive-kpi/definitions/${id}`, data);
    return response.data;
  },
  deleteDefinition: async (id) => {
    const response = await api.delete(`/executive-kpi/definitions/${id}`);
    return response.data;
  },
  getTargets: async (params) => {
    const response = await api.get('/executive-kpi/targets', { params });
    return response.data;
  },
  createTarget: async (data) => {
    const response = await api.post('/executive-kpi/targets', data);
    return response.data;
  },
  deleteTarget: async (id) => {
    const response = await api.delete(`/executive-kpi/targets/${id}`);
    return response.data;
  },
  getActuals: async (params) => {
    const response = await api.get('/executive-kpi/actuals', { params });
    return response.data;
  },
  createActual: async (data) => {
    const response = await api.post('/executive-kpi/actuals', data);
    return response.data;
  },
  deleteActual: async (id) => {
    const response = await api.delete(`/executive-kpi/actuals/${id}`);
    return response.data;
  },
  getScorecards: async (params) => {
    const response = await api.get('/executive-kpi/scorecards', { params });
    return response.data;
  },
  getScorecardById: async (id) => {
    const response = await api.get(`/executive-kpi/scorecards/${id}`);
    return response.data;
  },
  createScorecard: async (data) => {
    const response = await api.post('/executive-kpi/scorecards', data);
    return response.data;
  },
  updateScorecard: async (id, data) => {
    const response = await api.put(`/executive-kpi/scorecards/${id}`, data);
    return response.data;
  },
  deleteScorecard: async (id) => {
    const response = await api.delete(`/executive-kpi/scorecards/${id}`);
    return response.data;
  },
};

export const notificationCenterService = {
  getSummary: async () => { const r = await api.get('/notification-center/summary'); return r.data; },
  getOptions: async () => { const r = await api.get('/notification-center/options'); return r.data; },
  getNotifications: async (params) => { const r = await api.get('/notification-center/notifications', { params }); return r.data; },
  createNotification: async (data) => { const r = await api.post('/notification-center/notifications', data); return r.data; },
  markRead: async (id) => { const r = await api.put(`/notification-center/notifications/${id}/read`); return r.data; },
  dismiss: async (id) => { const r = await api.put(`/notification-center/notifications/${id}/dismiss`); return r.data; },
  markAllRead: async () => { const r = await api.put('/notification-center/notifications/mark-all-read'); return r.data; },
  deleteNotification: async (id) => { const r = await api.delete(`/notification-center/notifications/${id}`); return r.data; },
  getRules: async (params) => { const r = await api.get('/notification-center/rules', { params }); return r.data; },
  createRule: async (data) => { const r = await api.post('/notification-center/rules', data); return r.data; },
  updateRule: async (id, data) => { const r = await api.put(`/notification-center/rules/${id}`, data); return r.data; },
  deleteRule: async (id) => { const r = await api.delete(`/notification-center/rules/${id}`); return r.data; },
  getHistory: async (params) => { const r = await api.get('/notification-center/history', { params }); return r.data; },
  createAlert: async (data) => { const r = await api.post('/notification-center/history', data); return r.data; },
  acknowledgeAlert: async (id) => { const r = await api.put(`/notification-center/history/${id}/acknowledge`); return r.data; },
  resolveAlert: async (id) => { const r = await api.put(`/notification-center/history/${id}/resolve`); return r.data; },
  deleteAlert: async (id) => { const r = await api.delete(`/notification-center/history/${id}`); return r.data; },
};

export const documentManagementService = {
  getSummary: async () => { const r = await api.get('/document-management/summary'); return r.data; },
  getOptions: async () => { const r = await api.get('/document-management/options'); return r.data; },
  getDocuments: async (params) => { const r = await api.get('/document-management', { params }); return r.data; },
  getDocument: async (id) => { const r = await api.get(`/document-management/${id}`); return r.data; },
  createDocument: async (data) => { const r = await api.post('/document-management', data); return r.data; },
  updateDocument: async (id, data) => { const r = await api.put(`/document-management/${id}`, data); return r.data; },
  deleteDocument: async (id) => { const r = await api.delete(`/document-management/${id}`); return r.data; },
  getVersions: async (docId) => { const r = await api.get(`/document-management/${docId}/versions`); return r.data; },
  createVersion: async (docId, data) => { const r = await api.post(`/document-management/${docId}/versions`, data); return r.data; },
};

export const integrationHubService = {
  getSummary: async () => { const r = await api.get('/integration-hub/summary'); return r.data; },
  getOptions: async () => { const r = await api.get('/integration-hub/options'); return r.data; },
  getIntegrations: async (params) => { const r = await api.get('/integration-hub', { params }); return r.data; },
  getIntegration: async (id) => { const r = await api.get(`/integration-hub/${id}`); return r.data; },
  createIntegration: async (data) => { const r = await api.post('/integration-hub', data); return r.data; },
  updateIntegration: async (id, data) => { const r = await api.put(`/integration-hub/${id}`, data); return r.data; },
  deleteIntegration: async (id) => { const r = await api.delete(`/integration-hub/${id}`); return r.data; },
  syncIntegration: async (id) => { const r = await api.post(`/integration-hub/${id}/sync`); return r.data; },
  getLogs: async (id, params) => { const r = await api.get(`/integration-hub/${id}/logs`, { params }); return r.data; },
};

export const roleManagementService = {
  getSummary: async () => { const r = await api.get('/role-management/summary'); return r.data; },
  getOptions: async () => { const r = await api.get('/role-management/options'); return r.data; },
  getRoles: async (params) => { const r = await api.get('/role-management', { params }); return r.data; },
  getRole: async (id) => { const r = await api.get(`/role-management/${id}`); return r.data; },
  createRole: async (data) => { const r = await api.post('/role-management', data); return r.data; },
  updateRole: async (id, data) => { const r = await api.put(`/role-management/${id}`, data); return r.data; },
  deleteRole: async (id) => { const r = await api.delete(`/role-management/${id}`); return r.data; },
  getAssignments: async (params) => { const r = await api.get('/role-management/assignments/list', { params }); return r.data; },
  createAssignment: async (data) => { const r = await api.post('/role-management/assignments', data); return r.data; },
  deleteAssignment: async (id) => { const r = await api.delete(`/role-management/assignments/${id}`); return r.data; },
  getPermissionGroups: async () => { const r = await api.get('/role-management/permission-groups/list'); return r.data; },
  createPermissionGroup: async (data) => { const r = await api.post('/role-management/permission-groups', data); return r.data; },
};

export const systemConfigService = {
  getSummary: async () => { const r = await api.get('/system-config/summary'); return r.data; },
  getOptions: async () => { const r = await api.get('/system-config/options'); return r.data; },
  getConfigs: async (params) => { const r = await api.get('/system-config/configs', { params }); return r.data; },
  createConfig: async (data) => { const r = await api.post('/system-config/configs', data); return r.data; },
  updateConfig: async (id, data) => { const r = await api.put(`/system-config/configs/${id}`, data); return r.data; },
  deleteConfig: async (id) => { const r = await api.delete(`/system-config/configs/${id}`); return r.data; },
  getTenants: async (params) => { const r = await api.get('/system-config/tenants', { params }); return r.data; },
  createTenant: async (data) => { const r = await api.post('/system-config/tenants', data); return r.data; },
  updateTenant: async (id, data) => { const r = await api.put(`/system-config/tenants/${id}`, data); return r.data; },
  deleteTenant: async (id) => { const r = await api.delete(`/system-config/tenants/${id}`); return r.data; },
};

export const workflowEngineService = {
  getSummary: async () => { const r = await api.get('/workflow-engine/summary'); return r.data; },
  getOptions: async () => { const r = await api.get('/workflow-engine/options'); return r.data; },
  getTemplates: async (params) => { const r = await api.get('/workflow-engine/templates', { params }); return r.data; },
  getTemplate: async (id) => { const r = await api.get(`/workflow-engine/templates/${id}`); return r.data; },
  createTemplate: async (data) => { const r = await api.post('/workflow-engine/templates', data); return r.data; },
  updateTemplate: async (id, data) => { const r = await api.put(`/workflow-engine/templates/${id}`, data); return r.data; },
  deleteTemplate: async (id) => { const r = await api.delete(`/workflow-engine/templates/${id}`); return r.data; },
  getInstances: async (params) => { const r = await api.get('/workflow-engine/instances', { params }); return r.data; },
  getInstance: async (id) => { const r = await api.get(`/workflow-engine/instances/${id}`); return r.data; },
  createInstance: async (data) => { const r = await api.post('/workflow-engine/instances', data); return r.data; },
  completeStep: async (id, data) => { const r = await api.put(`/workflow-engine/steps/${id}/complete`, data); return r.data; },
  rejectStep: async (id, data) => { const r = await api.put(`/workflow-engine/steps/${id}/reject`, data); return r.data; },
};

export const claimService = {
  getAll: async (params) => { const r = await api.get('/claims', { params }); return r.data; },
  getById: async (id) => { const r = await api.get(`/claims/${id}`); return r.data; },
  create: async (data) => { const r = await api.post('/claims', data); return r.data; },
  update: async (id, data) => { const r = await api.put(`/claims/${id}`, data); return r.data; },
  delete: async (id) => { const r = await api.delete(`/claims/${id}`); return r.data; },
  getSummary: async () => { const r = await api.get('/claims/summary'); return r.data; },
  getAllClaims: async (params) => { const r = await api.get('/claims', { params }); return r.data; },
  createClaim: async (data) => { const r = await api.post('/claims', data); return r.data; },
  submitClaim: async (id) => { const r = await api.post(`/claims/${id}/submit`); return r.data; },
  submit: async (id) => { const r = await api.post(`/claims/${id}/submit`); return r.data; },
  approve: async (id, data) => { const r = await api.post(`/claims/${id}/approve`, data || {}); return r.data; },
  reject: async (id, data) => { const r = await api.post(`/claims/${id}/reject`, data || {}); return r.data; },
  settle: async (id, data) => { const r = await api.post(`/claims/${id}/settle`, data || {}); return r.data; },
  getUnmatchedClaims: async (params) => { const r = await api.get('/claims', { params: { ...params, status: 'unmatched' } }); return r.data; },
  getPendingApprovalClaims: async (params) => { const r = await api.get('/claims', { params: { ...params, status: 'pending_approval' } }); return r.data; },
  getClaimStatistics: async () => { const r = await api.get('/claims/summary'); return r.data; },
  autoMatchClaims: async () => { const r = await api.post('/claims/auto-match'); return r.data; },
  getClaimsByCustomer: async (customerId, startDate, endDate) => { const r = await api.get('/claims', { params: { customerId, startDate, endDate } }); return r.data; },
};

export const deductionService = {
  getAll: async (params) => { const r = await api.get('/deductions', { params }); return r.data; },
  getById: async (id) => { const r = await api.get(`/deductions/${id}`); return r.data; },
  create: async (data) => { const r = await api.post('/deductions', data); return r.data; },
  update: async (id, data) => { const r = await api.put(`/deductions/${id}`, data); return r.data; },
  delete: async (id) => { const r = await api.delete(`/deductions/${id}`); return r.data; },
  getSummary: async () => { const r = await api.get('/deductions/summary'); return r.data; },
  getAllDeductions: async (params) => { const r = await api.get('/deductions', { params }); return r.data; },
  createDeduction: async (data) => { const r = await api.post('/deductions', data); return r.data; },
  validate: async (id) => { const r = await api.post(`/deductions/${id}/review`); return r.data; },
  dispute: async (id, data) => { const r = await api.post(`/deductions/${id}/dispute`, data || {}); return r.data; },
  resolve: async (id, data) => { const r = await api.post(`/deductions/${id}/approve`, data || {}); return r.data; },
  approve: async (id, data) => { const r = await api.post(`/deductions/${id}/approve`, data || {}); return r.data; },
  writeOff: async (id, data) => { const r = await api.post(`/deductions/${id}/write-off`, data || {}); return r.data; },
  getUnmatchedDeductions: async (params) => { const r = await api.get('/deductions', { params: { ...params, status: 'unmatched' } }); return r.data; },
  getDisputedDeductions: async (params) => { const r = await api.get('/deductions', { params: { ...params, status: 'disputed' } }); return r.data; },
  getDeductionStatistics: async () => { const r = await api.get('/deductions/summary'); return r.data; },
  reconcileDeductionsWithClaims: async (customerId, startDate, endDate) => { const r = await api.post('/deductions/reconcile', { customerId, startDate, endDate }); return r.data; },
  getDeductionsByCustomer: async (customerId, startDate, endDate) => { const r = await api.get('/deductions', { params: { customerId, startDate, endDate } }); return r.data; },
};

export const approvalService = {
  getAll: async (params) => { const r = await api.get('/approvals', { params }); return r.data; },
  getById: async (id) => { const r = await api.get(`/approvals/${id}`); return r.data; },
  approve: async (id, data) => { const r = await api.patch(`/approvals/${id}/approve`, data); return r.data; },
  reject: async (id, data) => { const r = await api.patch(`/approvals/${id}/reject`, data); return r.data; },
  getSummary: async () => { const r = await api.get('/approvals/summary'); return r.data; },
  update: async (id, data) => { const r = await api.put(`/approvals/${id}`, data); return r.data; },
  getPendingApprovals: async (params) => { const r = await api.get('/approvals', { params: { ...params, status: 'pending' } }); return r.data; },
  getOverdueApprovals: async (params) => { const r = await api.get('/approvals', { params: { ...params, status: 'overdue' } }); return r.data; },
  approveApproval: async (id, data) => { const r = await api.patch(`/approvals/${id}/approve`, data); return r.data; },
  rejectApproval: async (id, data) => { const r = await api.patch(`/approvals/${id}/reject`, data); return r.data; },
};

export const kamWalletService = {
  getAll: async (params) => { const r = await api.get('/kam-wallets', { params }); return r.data; },
  getById: async (id) => { const r = await api.get(`/kam-wallets/${id}`); return r.data; },
  create: async (data) => { const r = await api.post('/kam-wallets', data); return r.data; },
  update: async (id, data) => { const r = await api.put(`/kam-wallets/${id}`, data); return r.data; },
  allocate: async (data) => { const r = await api.post('/kam-wallets/allocate', data); return r.data; },
  getSummary: async () => { const r = await api.get('/kam-wallets/summary'); return r.data; },
  getWallet: async (id) => { const r = await api.get(`/kam-wallets/${id}`); return r.data; },
  getWallets: async (params) => { const r = await api.get('/kam-wallets', { params }); return r.data; },
  createWallet: async (data) => { const r = await api.post('/kam-wallets', data); return r.data; },
  allocateToCustomer: async (walletId, customerId, amount, notes) => { const r = await api.post('/kam-wallets/allocate', { walletId, customerId, amount, notes }); return r.data; },
};

export const simulationService = {
  run: async (data) => { const r = await api.post('/simulations/run', data); return r.data; },
  getAll: async (params) => { const r = await api.get('/simulations', { params }); return r.data; },
  getById: async (id) => { const r = await api.get(`/simulations/${id}`); return r.data; },
  getSummary: async () => { const r = await api.get('/simulations/summary'); return r.data; },
  simulatePromotion: async (data) => { const r = await api.post('/simulations/run', data); return r.data; },
  compareScenarios: async (data) => { const r = await api.post('/simulations/compare', data); return r.data; },
  getConflictPreview: async (data) => { const r = await api.post('/simulations/conflict-preview', data); return r.data; },
  getNextBestPromotions: async (params) => { const r = await api.get('/simulations/next-best', { params }); return r.data; },
  reallocateBudget: async (data) => { const r = await api.post('/simulations/reallocate', data); return r.data; },
  simulateReallocation: async (data) => { const r = await api.post('/simulations/run', { ...data, type: 'reallocation' }); return r.data; },
};

export const activityGridService = {
  getAll: async (params) => { const r = await api.get('/activity-grid', { params }); return r.data; },
  getById: async (id) => { const r = await api.get(`/activity-grid/${id}`); return r.data; },
  create: async (data) => { const r = await api.post('/activity-grid', data); return r.data; },
  update: async (id, data) => { const r = await api.put(`/activity-grid/${id}`, data); return r.data; },
  getActivityGrid: async (params) => { const r = await api.get('/activity-grid', { params }); return r.data; },
  getConflicts: async (params) => { const r = await api.get('/activity-grid/conflicts', { params }); return r.data; },
  updateActivity: async (id, data) => { const r = await api.put(`/activity-grid/${id}`, data); return r.data; },
  getHeatMap: async (params) => { const r = await api.get('/activity-grid/heatmap', { params }); return r.data; },
  syncActivities: async (data) => { const r = await api.post('/activity-grid/sync', data); return r.data; },
  createActivity: async (data) => { const r = await api.post('/activity-grid', data); return r.data; },
  getActivity: async (id) => { const r = await api.get(`/activity-grid/${id}`); return r.data; },
  deleteActivity: async (id) => { const r = await api.delete(`/activity-grid/${id}`); return r.data; },
};

export const dataLineageService = {
  getLineage: async (params) => { const r = await api.get('/data-lineage', { params }); return r.data; },
  getImpact: async (id) => { const r = await api.get(`/data-lineage/${id}/impact`); return r.data; },
  getVarianceReasonCodes: async (params) => { const r = await api.get('/data-lineage/variance-reason-codes', { params }); return r.data; },
  getVarianceReport: async (params) => { const r = await api.get('/data-lineage/variance-report', { params }); return r.data; },
  analyzePromotionVariance: async (data) => { const r = await api.post('/data-lineage/analyze-promotion-variance', data); return r.data; },
  tagVariance: async (data) => { const r = await api.post('/data-lineage/tag-variance', data); return r.data; },
  seedDefaultReasonCodes: async () => { const r = await api.post('/data-lineage/seed-reason-codes'); return r.data; },
  createVarianceReasonCode: async (data) => { const r = await api.post('/data-lineage/variance-reason-codes', data); return r.data; },
  getOverriddenCalculations: async (params) => { const r = await api.get('/data-lineage/overridden-calculations', { params }); return r.data; },
  getImportBatches: async (params) => { const r = await api.get('/data-lineage/import-batches', { params }); return r.data; },
  getLineageForEntity: async (entityType, entityId) => { const r = await api.get(`/data-lineage/${entityType}/${entityId}`); return r.data; },
  getCalculationSummary: async (params) => { const r = await api.get('/data-lineage/calculation-summary', { params }); return r.data; },
  overrideCalculation: async (data) => { const r = await api.post('/data-lineage/override-calculation', data); return r.data; },
  getBaselineConfigs: async (params) => { const r = await api.get('/data-lineage/baseline-configs', { params }); return r.data; },
  getDefaultBaselineConfig: async () => { const r = await api.get('/data-lineage/baseline-configs/default'); return r.data; },
  updateBaselineConfig: async (id, data) => { const r = await api.put(`/data-lineage/baseline-configs/${id}`, data); return r.data; },
  createBaselineConfig: async (data) => { const r = await api.post('/data-lineage/baseline-configs', data); return r.data; },
  setDefaultBaselineConfig: async (id) => { const r = await api.patch(`/data-lineage/baseline-configs/${id}/set-default`); return r.data; },
};

export const mlService = {
  predict: async (data) => { const r = await api.post('/ai-orchestrator/predict', data); return r.data; },
  getModels: async () => { const r = await api.get('/ai-orchestrator/models'); return r.data; },
  getStatus: async () => { const r = await api.get('/ai-orchestrator/status'); return r.data; },
  forecastDemand: async (data) => { const r = await api.post('/forecasting/demand', data); return r.data; },
  optimizePrice: async (data) => { const r = await api.post('/ai-orchestrator/optimize-price', data); return r.data; },
  analyzePromotionLift: async (data) => { const r = await api.post('/ai-orchestrator/analyze-promotion-lift', data); return r.data; },
  getProductRecommendations: async (params) => { const r = await api.get('/ai-orchestrator/product-recommendations', { params }); return r.data; },
  checkMLHealth: async () => { const r = await api.get('/ai-orchestrator/health'); return r.data; },
  batchPredict: async (data) => { const r = await api.post('/ai-orchestrator/batch-predict', data); return r.data; },
};

export const aiOrchestratorService = {
  getInsights: async (params) => { const r = await api.get('/ai-orchestrator/insights', { params }); return r.data; },
  getRecommendations: async (params) => { const r = await api.get('/ai-orchestrator/recommendations', { params }); return r.data; },
  orchestrate: async (intent, context) => { const r = await api.post('/ai-orchestrator/orchestrate', { intent, context }); return r.data; },
  clearCache: async () => { const r = await api.post('/ai-orchestrator/clear-cache'); return r.data; },
};

export const reportService = {
  getAll: async (params) => { const r = await api.get('/reporting', { params }); return r.data; },
  getById: async (id) => { const r = await api.get(`/reporting/${id}`); return r.data; },
  generate: async (data) => { const r = await api.post('/reporting/generate', data); return r.data; },
  getDefinitions: async () => { const r = await api.get('/reporting/definitions'); return r.data; },
  getReport: async (id) => { const r = await api.get(`/reporting/${id}`); return r.data; },
  createReport: async (data) => { const r = await api.post('/reporting', data); return r.data; },
  updateReport: async (id, data) => { const r = await api.put(`/reporting/${id}`, data); return r.data; },
  deleteReport: async (id) => { const r = await api.delete(`/reporting/${id}`); return r.data; },
  generateReport: async (id, data) => { const r = await api.post(`/reporting/${id}/generate`, data); return r.data; },
};

export const securityService = {
  getEvents: async (params) => { const r = await api.get('/system-config/security-events', { params }); return r.data; },
  getStatus: async () => { const r = await api.get('/system-config/security-status'); return r.data; },
  getSecurityDashboard: async (params) => { const r = await api.get('/system-config/security-dashboard', { params }); return r.data; },
  getSecurityEvents: async (params) => { const r = await api.get('/system-config/security-events', { params }); return r.data; },
  getAuditLogs: async (params) => { const r = await api.get('/system-config/audit-logs', { params }); return r.data; },
  getRoles: async () => { const r = await api.get('/role-management'); return r.data; },
  getPermissions: async () => { const r = await api.get('/role-management/permissions'); return r.data; },
  setupMFA: async (data) => { const r = await api.post('/system-config/mfa/setup', data); return r.data; },
  enableMFA: async (data) => { const r = await api.post('/system-config/mfa/enable', data); return r.data; },
  blockUser: async (userId) => { const r = await api.post(`/users/${userId}/block`); return r.data; },
  terminateSession: async (sessionId) => { const r = await api.delete(`/system-config/sessions/${sessionId}`); return r.data; },
  updateRole: async (id, data) => { const r = await api.put(`/role-management/${id}`, data); return r.data; },
  createRole: async (data) => { const r = await api.post('/role-management', data); return r.data; },
};

export const vendorService = {
  getAll: async (params) => { const r = await api.get('/vendors', { params }); return r.data; },
  getById: async (id) => { const r = await api.get(`/vendors/${id}`); return r.data; },
  create: async (data) => { const r = await api.post('/vendors', data); return r.data; },
  update: async (id, data) => { const r = await api.put(`/vendors/${id}`, data); return r.data; },
};

export const workflowService = {
  getAll: async (params) => { const r = await api.get('/workflow-engine', { params }); return r.data; },
  getById: async (id) => { const r = await api.get(`/workflow-engine/${id}`); return r.data; },
  getWorkflowOverview: async () => { const r = await api.get('/workflow-engine/overview'); return r.data; },
  getActiveWorkflows: async (params) => { const r = await api.get('/workflow-engine', { params: { ...params, status: 'active' } }); return r.data; },
  getPendingApprovals: async (params) => { const r = await api.get('/workflow-engine/pending-approvals', { params }); return r.data; },
  getWorkflowTemplates: async () => { const r = await api.get('/workflow-engine/templates'); return r.data; },
  getWorkflowAnalytics: async (params) => { const r = await api.get('/workflow-engine/analytics', { params }); return r.data; },
  startWorkflow: async (templateId, data) => { const r = await api.post('/workflow-engine/start', { templateId, ...data }); return r.data; },
  handleUserAction: async (workflowId, stepId, action, data) => { const r = await api.post(`/workflow-engine/${workflowId}/action`, { stepId, action, ...data }); return r.data; },
  getWorkflowStatus: async (id) => { const r = await api.get(`/workflow-engine/${id}/status`); return r.data; },
};

export default api;
