// Production configuration overrides
// This file handles production-specific configurations and graceful fallbacks

const fs = require('fs');
const path = require('path');

// Ensure logs directory exists with proper permissions
const ensureLogsDirectory = () => {
  try {
    const logsDir = path.join(__dirname, '../../logs');
    const securityLogsDir = path.join(logsDir, 'security');

    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true, mode: 0o755 });
    }

    // Create security logs directory if it doesn't exist
    if (!fs.existsSync(securityLogsDir)) {
      fs.mkdirSync(securityLogsDir, { recursive: true, mode: 0o755 });
    }

    console.log('✓ Logs directories created successfully');
    return true;
  } catch (error) {
    console.warn('⚠ Could not create logs directory:', error.message);
    return false;
  }
};

// Redis configuration with fallback
const getRedisConfig = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
  const disableRedis = process.env.DISABLE_REDIS === 'true';

  if (disableRedis) {
    console.log('ℹ Redis disabled by configuration');
    return null;
  }

  return {
    url: redisUrl,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    connectTimeout: 10000,
    commandTimeout: 5000,
    retryDelayOnClusterDown: 300
  };
};

// MongoDB configuration
const getMongoConfig = () => {
  return {
    uri: process.env.MONGODB_URI || 'mongodb://mongodb:27017/trade_ai_production',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      waitQueueTimeoutMS: 5000,
      retryWrites: true,
      retryReads: true
    }
  };
};

// Security logging configuration
const getSecurityLogConfig = () => {
  const disableSecurityLogs = process.env.DISABLE_SECURITY_LOGS === 'true';

  if (disableSecurityLogs) {
    console.log('ℹ Security logging disabled by configuration');
    return { enabled: false };
  }

  const logsCreated = ensureLogsDirectory();

  return {
    enabled: logsCreated,
    directory: logsCreated ? path.join(__dirname, '../../logs/security') : null,
    fallback: !logsCreated
  };
};

// Cache configuration with fallback
const getCacheConfig = () => {
  const redisConfig = getRedisConfig();

  if (!redisConfig) {
    return {
      type: 'memory',
      enabled: false
    };
  }

  return {
    type: 'redis',
    enabled: true,
    redis: redisConfig
  };
};

module.exports = {
  ensureLogsDirectory,
  getRedisConfig,
  getMongoConfig,
  getSecurityLogConfig,
  getCacheConfig
};
