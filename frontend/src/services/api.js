import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      window.location.href = '/';
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
      
      console.log('Login API response:', { 
        status: response.status, 
        data: response.data,
        headers: response.headers 
      });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
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
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
      // Still remove items even if API call fails
      localStorage.removeItem('token');
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

export default api;