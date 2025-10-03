const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;
let redisEnabled = false;

// Initialize Redis connection
function initRedis() {
  // Check if Redis is enabled
  const enabled = process.env.REDIS_ENABLED !== 'false';
  const host = process.env.REDIS_HOST;

  if (!enabled) {
    logger.info('⚠️  Redis caching disabled (REDIS_ENABLED=false)');
    return null;
  }

  if (!host) {
    logger.warn('⚠️  Redis host not configured. Caching disabled.');
    logger.info('💡 To enable Redis: Set REDIS_HOST in your .env file');
    return null;
  }

  try {
    const config = {
      host: host,
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB) || 0,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: true,
      lazyConnect: false,
      // Connection timeouts
      connectTimeout: 10000,
      // Key prefix for multi-tenant isolation
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'tradeai:',
    };

    redisClient = new Redis(config);

    redisClient.on('connect', () => {
      logger.info('✅ Redis connecting...');
    });

    redisClient.on('ready', () => {
      redisEnabled = true;
      logger.info('✅ Redis connected successfully');
      logger.info(`📊 Redis: ${host}:${config.port} (DB ${config.db})`);
    });

    redisClient.on('error', (err) => {
      redisEnabled = false;
      logger.error('❌ Redis connection error:', err.message);
      logger.warn('⚠️  Falling back to no-cache mode');
    });

    redisClient.on('close', () => {
      redisEnabled = false;
      logger.warn('⚠️  Redis connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('🔄 Redis reconnecting...');
    });

    return redisClient;

  } catch (error) {
    logger.error('❌ Failed to initialize Redis:', error.message);
    return null;
  }
}

// Get Redis client
function getRedisClient() {
  return redisClient;
}

// Check if Redis is enabled and connected
function isRedisEnabled() {
  return redisEnabled && redisClient && redisClient.status === 'ready';
}

// Cache middleware for Express routes
function cacheMiddleware(options = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = (req) => `${req.method}:${req.originalUrl}`,
    condition = () => true
  } = options;

  return async (req, res, next) => {
    // Skip caching if Redis is not available
    if (!isRedisEnabled()) {
      return next();
    }

    // Skip if condition is not met
    if (!condition(req)) {
      return next();
    }

    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const cacheKey = keyGenerator(req);
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        logger.debug(`Cache hit: ${cacheKey}`);
        return res.json(JSON.parse(cachedData));
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache the response
      res.json = function(data) {
        // Cache the response
        redisClient.setex(cacheKey, ttl, JSON.stringify(data))
          .catch(err => logger.error('Cache set error:', err));

        logger.debug(`Cache set: ${cacheKey} (TTL: ${ttl}s)`);

        // Call original json method
        return originalJson(data);
      };

      next();

    } catch (error) {
      logger.error('Cache middleware error:', error);
      next(); // Continue without caching on error
    }
  };
}

// Get cached data
async function get(key) {
  if (!isRedisEnabled()) {
    return null;
  }

  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error(`Redis GET error for key ${key}:`, error);
    return null;
  }
}

// Set cached data
async function set(key, value, ttl = 300) {
  if (!isRedisEnabled()) {
    return false;
  }

  try {
    const serialized = JSON.stringify(value);
    if (ttl > 0) {
      await redisClient.setex(key, ttl, serialized);
    } else {
      await redisClient.set(key, serialized);
    }
    return true;
  } catch (error) {
    logger.error(`Redis SET error for key ${key}:`, error);
    return false;
  }
}

// Delete cached data
async function del(key) {
  if (!isRedisEnabled()) {
    return false;
  }

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error(`Redis DEL error for key ${key}:`, error);
    return false;
  }
}

// Delete multiple keys by pattern
async function delPattern(pattern) {
  if (!isRedisEnabled()) {
    return 0;
  }

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
    return keys.length;
  } catch (error) {
    logger.error(`Redis DEL pattern error for ${pattern}:`, error);
    return 0;
  }
}

// Increment counter
async function incr(key, ttl = null) {
  if (!isRedisEnabled()) {
    return null;
  }

  try {
    const value = await redisClient.incr(key);
    if (ttl && value === 1) {
      await redisClient.expire(key, ttl);
    }
    return value;
  } catch (error) {
    logger.error(`Redis INCR error for key ${key}:`, error);
    return null;
  }
}

// Flush all cache (use with caution!)
async function flushAll() {
  if (!isRedisEnabled()) {
    return false;
  }

  try {
    await redisClient.flushdb();
    logger.warn('⚠️  Redis cache flushed');
    return true;
  } catch (error) {
    logger.error('Redis FLUSHDB error:', error);
    return false;
  }
}

// Get cache statistics
async function getStats() {
  if (!isRedisEnabled()) {
    return {
      enabled: false,
      status: 'disabled'
    };
  }

  try {
    const info = await redisClient.info('stats');
    const dbsize = await redisClient.dbsize();

    return {
      enabled: true,
      status: 'connected',
      host: redisClient.options.host,
      port: redisClient.options.port,
      db: redisClient.options.db,
      keys: dbsize,
      info: info
    };
  } catch (error) {
    logger.error('Redis stats error:', error);
    return {
      enabled: true,
      status: 'error',
      error: error.message
    };
  }
}

// Graceful shutdown
async function closeRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('✅ Redis connection closed gracefully');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    }
  }
}

module.exports = {
  initRedis,
  getRedisClient,
  isRedisEnabled,
  cacheMiddleware,
  get,
  set,
  del,
  delPattern,
  incr,
  flushAll,
  getStats,
  closeRedis
};
