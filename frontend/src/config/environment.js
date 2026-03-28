/**
 * Production Environment Configuration
 * Environment-specific settings for TRADEAI
 */

const environments = {
  // ============================================================================
  // Production
  // ============================================================================
  production: {
    // API Configuration
    API_URL: process.env.REACT_APP_API_URL || 'https://tradeai-api.vantax.workers.dev',
    WS_URL: process.env.REACT_APP_WS_URL || 'wss://tradeai-api.vantax.workers.dev/ws',
    
    // Feature Flags
    features: {
      aiSuggestions: true,
      realTimeUpdates: true,
      analytics: true,
      export: true,
      adminPanel: true,
      superAdminPanel: true,
    },
    
    // Security
    security: {
      tokenExpiry: 3600000, // 1 hour
      refreshExpiry: 604800000, // 7 days
      requireHTTPS: true,
      enableCSP: true,
      enableXSSProtection: true,
    },
    
    // Performance
    performance: {
      cacheTTL: 300000, // 5 minutes
      retryAttempts: 3,
      requestTimeout: 30000, // 30 seconds
      enableCDN: true,
    },
    
    // Monitoring
    monitoring: {
      enabled: true,
      errorTracking: true,
      performanceTracking: true,
      userAnalytics: false, // Privacy-focused
    },
    
    // Logging
    logging: {
      level: 'error', // Only errors in production
      remoteLogging: true,
      sensitiveDataMasking: true,
    },
  },

  // ============================================================================
  // Staging
  // ============================================================================
  staging: {
    API_URL: process.env.REACT_APP_API_URL || 'https://tradeai-staging.vantax.workers.dev',
    WS_URL: process.env.REACT_APP_WS_URL || 'wss://tradeai-staging.vantax.workers.dev/ws',
    
    features: {
      aiSuggestions: true,
      realTimeUpdates: true,
      analytics: true,
      export: true,
      adminPanel: true,
      superAdminPanel: true,
    },
    
    security: {
      tokenExpiry: 7200000, // 2 hours
      refreshExpiry: 604800000,
      requireHTTPS: true,
      enableCSP: true,
      enableXSSProtection: true,
    },
    
    performance: {
      cacheTTL: 120000, // 2 minutes
      retryAttempts: 3,
      requestTimeout: 30000,
      enableCDN: true,
    },
    
    monitoring: {
      enabled: true,
      errorTracking: true,
      performanceTracking: true,
      userAnalytics: true,
    },
    
    logging: {
      level: 'warn', // Warnings and errors
      remoteLogging: true,
      sensitiveDataMasking: true,
    },
  },

  // ============================================================================
  // Development
  // ============================================================================
  development: {
    API_URL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
    WS_URL: process.env.REACT_APP_WS_URL || 'ws://localhost:8080/ws',
    
    features: {
      aiSuggestions: true,
      realTimeUpdates: true,
      analytics: true,
      export: true,
      adminPanel: true,
      superAdminPanel: true,
      debugMode: true,
    },
    
    security: {
      tokenExpiry: 86400000, // 24 hours
      refreshExpiry: 604800000,
      requireHTTPS: false,
      enableCSP: false,
      enableXSSProtection: true,
    },
    
    performance: {
      cacheTTL: 30000, // 30 seconds
      retryAttempts: 5,
      requestTimeout: 60000,
      enableCDN: false,
    },
    
    monitoring: {
      enabled: false,
      errorTracking: true,
      performanceTracking: true,
      userAnalytics: false,
    },
    
    logging: {
      level: 'debug', // All logs
      remoteLogging: false,
      sensitiveDataMasking: true,
    },
  },
};

// Get current environment
const getEnvironment = () => {
  if (process.env.REACT_APP_ENV === 'production') return 'production';
  if (process.env.REACT_APP_ENV === 'staging') return 'staging';
  return 'development';
};

// Export current environment config
export const config = environments[getEnvironment()];
export const environment = getEnvironment();

// Export all environments for testing
export default environments;
