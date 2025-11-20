import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

/**
 * Check overall API health
 * @returns {Promise<{ok: boolean, latency: number, environment: string, database: string}>}
 */
export const checkAPIHealth = async () => {
  const startTime = Date.now();
  
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000
    });
    
    const latency = Date.now() - startTime;
    
    return {
      ok: response.status === 200,
      latency,
      environment: response.data.environment || 'unknown',
      database: response.data.database || 'unknown',
      version: response.data.version || 'unknown',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
      latency: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Test specific ML endpoint availability
 * @param {string} endpoint - ML endpoint to test
 * @returns {Promise<boolean>}
 */
export const testMLEndpoint = async (endpoint) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}${endpoint}`,
      { test: true },
      { 
        timeout: 3000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.status === 200 || response.status === 201;
  } catch (error) {
    // 404 means endpoint doesn't exist
    // 401/403 means auth required but endpoint exists
    // 500 means server error but endpoint exists
    return error.response && [401, 403, 500].includes(error.response.status);
  }
};

/**
 * Detect current environment
 * @returns {'development' | 'staging' | 'production'}
 */
export const detectEnvironment = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  } else if (hostname.includes('staging') || hostname.includes('dev')) {
    return 'staging';
  } else {
    return 'production';
  }
};

/**
 * Check multiple API endpoints in parallel
 * @param {string[]} endpoints - Array of endpoint paths
 * @returns {Promise<{[key: string]: boolean}>}
 */
export const checkMultipleEndpoints = async (endpoints) => {
  const results = {};
  
  await Promise.all(
    endpoints.map(async (endpoint) => {
      try {
        const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
          timeout: 3000
        });
        results[endpoint] = response.status === 200;
      } catch (error) {
        results[endpoint] = false;
      }
    })
  );
  
  return results;
};

/**
 * Pre-flight check before form submission
 * @returns {Promise<{canSubmit: boolean, warnings: string[]}>}
 */
export const preFlightCheck = async () => {
  const warnings = [];
  
  // Check API health
  const health = await checkAPIHealth();
  if (!health.ok) {
    warnings.push('API is not responding. Your changes may not be saved.');
    return { canSubmit: false, warnings };
  }
  
  // Check if database is connected
  if (health.database === 'in-memory') {
    warnings.push('Using temporary storage. Data will be lost on server restart.');
  }
  
  // Check latency
  if (health.latency > 2000) {
    warnings.push('High latency detected. Save may take longer than usual.');
  }
  
  return {
    canSubmit: true,
    warnings
  };
};

/**
 * Retry API call with exponential backoff
 * @param {Function} apiCall - Function that returns a promise
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<any>}
 */
export const retryWithBackoff = async (apiCall, maxRetries = 3) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, i), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Monitor API health continuously
 * @param {Function} onHealthChange - Callback when health status changes
 * @param {number} interval - Check interval in milliseconds
 * @returns {Function} Cleanup function
 */
export const monitorAPIHealth = (onHealthChange, interval = 30000) => {
  let lastStatus = null;
  
  const check = async () => {
    const health = await checkAPIHealth();
    
    // Only notify on status change
    if (lastStatus === null || lastStatus.ok !== health.ok) {
      onHealthChange(health);
    }
    
    lastStatus = health;
  };
  
  // Initial check
  check();
  
  // Set up interval
  const intervalId = setInterval(check, interval);
  
  // Return cleanup function
  return () => clearInterval(intervalId);
};

const apiHealth = {
  checkAPIHealth,
  testMLEndpoint,
  detectEnvironment,
  checkMultipleEndpoints,
  preFlightCheck,
  retryWithBackoff,
  monitorAPIHealth
};
export default apiHealth;
