import api from '../api';

console.log('[apiClient.js] Module loading...');
console.log('[apiClient.js] Re-exporting canonical api from ../api');

const apiClient = api;

console.log('[apiClient.js] Axios instance baseURL:', apiClient.defaults.baseURL);

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

// Track if we're currently refreshing token to avoid multiple refresh requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.log('[apiClient] Response interceptor - Error:', error.response?.status, error.response?.data);
    
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors with token refresh attempt
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        console.log('[apiClient] No refresh token available - clearing storage and redirecting');
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      try {
        console.log('[apiClient] Attempting to refresh token...');
        const response = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh-token`,
          { refreshToken }
        );
        
        const newToken = response.data.data?.tokens?.accessToken;
        const newRefreshToken = response.data.data?.tokens?.refreshToken;
        
        if (newToken) {
          console.log('[apiClient] Token refreshed successfully');
          localStorage.setItem('token', newToken);
          
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          
          apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
          originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
          
          processQueue(null, newToken);
          
          return apiClient(originalRequest);
        } else {
          throw new Error('No token in refresh response');
        }
      } catch (refreshError) {
        console.error('[apiClient] Token refresh failed:', refreshError);
        processQueue(refreshError, null);
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
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

// Helper function to clear auth data and redirect
function clearAuthAndRedirect() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('user');
  localStorage.removeItem('loginTimestamp');
  
  // Redirect to login page
  window.location.href = '/';
}

console.log('[apiClient.js] Interceptors registered successfully');
console.log('[apiClient.js] Request interceptors count:', apiClient.interceptors.request.handlers?.length || 'unknown');
console.log('[apiClient.js] Response interceptors count:', apiClient.interceptors.response.handlers?.length || 'unknown');

export default apiClient;
