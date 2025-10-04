import axios from 'axios';

console.log('[apiClient.js] Module loading...');
console.log('[apiClient.js] process.env.REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

console.log('[apiClient.js] Axios instance created with baseURL:', apiClient.defaults.baseURL);

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    console.log('[apiClient] Request interceptor - URL:', config.url);
    console.log('[apiClient] Request interceptor - checking localStorage for token...');
    const token = localStorage.getItem('token');
    console.log('[apiClient] Token found:', token ? 'YES (length: ' + token.length + ')' : 'NO');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('[apiClient] Authorization header set');
    } else {
      console.warn('[apiClient] No token found in localStorage!');
    }
    console.log('[apiClient] Final headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('[apiClient] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.log('[apiClient] Response interceptor - Error:', error.response?.status, error.response?.data);
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.log('[apiClient] 401 Unauthorized - clearing storage and redirecting to login');
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      
      // Redirect to login page
      window.location.href = '/';
    }
    
    // Handle 403 Forbidden errors
    if (error.response && error.response.status === 403) {
      console.error('Permission denied:', error.response.data);
    }
    
    // Handle 500 Server errors
    if (error.response && error.response.status >= 500) {
      console.error('Server error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

console.log('[apiClient.js] Interceptors registered successfully');
console.log('[apiClient.js] Request interceptors count:', apiClient.interceptors.request.handlers?.length || 'unknown');
console.log('[apiClient.js] Response interceptors count:', apiClient.interceptors.response.handlers?.length || 'unknown');

export default apiClient;