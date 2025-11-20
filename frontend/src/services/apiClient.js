import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

let authMeCache = null;
let authMeCacheTime = 0;
const CACHE_DURATION = 5000;

const pendingAuthMeRequests = [];
let authMeInFlight = false;

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (config.url === '/auth/me' && config.method === 'get') {
      const now = Date.now();
      if (authMeCache && (now - authMeCacheTime) < CACHE_DURATION) {
        config.adapter = () => Promise.resolve({
          data: authMeCache,
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        });
      } else if (authMeInFlight) {
        config.adapter = () => new Promise((resolve, reject) => {
          pendingAuthMeRequests.push({ resolve, reject, config });
        });
      } else {
        authMeInFlight = true;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    if (response.config.url === '/auth/me' && response.config.method === 'get') {
      authMeCache = response.data;
      authMeCacheTime = Date.now();
      authMeInFlight = false;
      
      while (pendingAuthMeRequests.length > 0) {
        const { resolve, config } = pendingAuthMeRequests.shift();
        resolve({
          data: authMeCache,
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        });
      }
    }
    return response;
  },
  (error) => {
    if (error.config?.url === '/auth/me' && error.config?.method === 'get') {
      authMeInFlight = false;
      
      while (pendingAuthMeRequests.length > 0) {
        const { reject } = pendingAuthMeRequests.shift();
        reject(error);
      }
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
export { API_BASE_URL };
