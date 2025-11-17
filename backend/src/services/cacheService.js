const redis = require('redis');
const { promisify } = require('util');
const config = require('../config');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async initialize() {
    try {
      const enabled = process.env.REDIS_ENABLED !== 'false';
      if (!enabled) {
        logger.info('⚠️  Redis caching disabled (REDIS_ENABLED=false)');
        return;
      }

      if (!config.redis.password) {
        logger.warn('⚠️  Redis password not provided. Skipping Redis cache initialization.');
        return;
      }

      // Redis v4 client configuration
      this.client = redis.createClient({
        socket: {
          host: config.redis.host,
          port: config.redis.port,
          reconnectStrategy: (retries) => {
            if (retries > 5) {
              logger.error('Redis max retry attempts reached');
              return false;
            }
            return Math.min(retries * 100, 2000);
          }
        },
        password: config.redis.password,
        database: config.redis.db || 0
      });

      // Event handlers
      this.client.on('connect', () => {
        logger.info('Redis connecting...');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        logger.info('Redis connected successfully');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        logger.error('Redis error:', err);
      });

      this.client.on('end', () => {
        this.isConnected = false;
        logger.info('Redis connection closed');
      });

      // Connect to Redis with timeout to avoid blocking server startup
      await Promise.race([
        this.client.connect(),
        new Promise((resolve) => setTimeout(() => {
          logger.warn('⚠️  Redis connect timeout. Continuing without cache.');
          resolve();
        }, 3000))
      ]);

    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      this.isConnected = false;
    }
  }

  // Generate cache key with prefix
  generateKey(type, id, ...args) {
    const parts = [config.redis.keyPrefix, type, id, ...args].filter(Boolean);
    return parts.join(':');
  }

  // Get cached data
  async get(key) {
    if (!this.isConnected) return null;

    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  // Set cache data
  async set(key, value, ttl = null) {
    if (!this.isConnected) return false;

    try {
      const serialized = JSON.stringify(value);
      const expiry = ttl || config.redis.ttl.default;

      await this.client.setEx(key, expiry, serialized);
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  // Delete cache entry
  async delete(key) {
    if (!this.isConnected) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  // Delete multiple keys by pattern
  async deletePattern(pattern) {
    if (!this.isConnected) return false;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
      return false;
    }
  }

  // Check if key exists
  async exists(key) {
    if (!this.isConnected) return false;

    try {
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  // Get remaining TTL
  getTTL(key) {
    if (!this.isConnected) return -1;

    try {
      return this.client.ttl(key);
    } catch (error) {
      logger.error('Cache TTL error:', error);
      return -1;
    }
  }

  // Cache wrapper for functions
  async wrap(key, fn, ttl = null) {
    // Try to get from cache
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }

  // Invalidate related caches
  async invalidateRelated(type, id) {
    const patterns = {
      user: [
        `${config.redis.keyPrefix}user:${id}:*`,
        `${config.redis.keyPrefix}dashboard:*:user:${id}`,
        `${config.redis.keyPrefix}activity:*:user:${id}`
      ],
      customer: [
        `${config.redis.keyPrefix}customer:${id}:*`,
        `${config.redis.keyPrefix}budget:*:customer:${id}`,
        `${config.redis.keyPrefix}promotion:*:customer:${id}`,
        `${config.redis.keyPrefix}grid:*:customer:${id}`
      ],
      product: [
        `${config.redis.keyPrefix}product:${id}:*`,
        `${config.redis.keyPrefix}promotion:*:product:${id}`,
        `${config.redis.keyPrefix}sales:*:product:${id}`
      ],
      vendor: [
        `${config.redis.keyPrefix}vendor:${id}:*`,
        `${config.redis.keyPrefix}budget:*:vendor:${id}`,
        `${config.redis.keyPrefix}product:*:vendor:${id}`
      ]
    };

    const patternsToInvalidate = patterns[type] || [];

    for (const pattern of patternsToInvalidate) {
      await this.deletePattern(pattern);
    }
  }

  // Specific cache methods
  cacheUser(userId, userData) {
    const key = this.generateKey('user', userId);
    return this.set(key, userData, config.cache.ttl.user);
  }

  getCachedUser(userId) {
    const key = this.generateKey('user', userId);
    return this.get(key);
  }

  cacheDashboard(type, userId, data) {
    const key = this.generateKey('dashboard', type, 'user', userId);
    return this.set(key, data, config.cache.ttl.dashboard);
  }

  getCachedDashboard(type, userId) {
    const key = this.generateKey('dashboard', type, 'user', userId);
    return this.get(key);
  }

  cacheReport(reportId, data) {
    const key = this.generateKey('report', reportId);
    return this.set(key, data, config.cache.ttl.report);
  }

  getCachedReport(reportId) {
    const key = this.generateKey('report', reportId);
    return this.get(key);
  }

  cacheActivityGrid(gridId, data) {
    const key = this.generateKey('grid', gridId);
    return this.set(key, data, config.cache.ttl.grid);
  }

  getCachedActivityGrid(gridId) {
    const key = this.generateKey('grid', gridId);
    return this.get(key);
  }

  // Session management
  setSession(sessionId, userData, ttl = 86400) {
    const key = this.generateKey('session', sessionId);
    return this.set(key, userData, ttl);
  }

  getSession(sessionId) {
    const key = this.generateKey('session', sessionId);
    return this.get(key);
  }

  deleteSession(sessionId) {
    const key = this.generateKey('session', sessionId);
    return this.delete(key);
  }

  // Rate limiting
  async incrementRateLimit(identifier, window = 60) {
    if (!this.isConnected) return { count: 0, remaining: window };

    const key = this.generateKey('ratelimit', identifier);

    try {
      const count = await this.incrAsync(key);

      if (count === 1) {
        await this.expireAsync(key, window);
      }

      const ttl = await this.ttlAsync(key);

      return {
        count,
        remaining: ttl > 0 ? ttl : window
      };
    } catch (error) {
      logger.error('Rate limit error:', error);
      return { count: 0, remaining: window };
    }
  }

  // Close connection
  close() {
    if (this.client) {
      this.client.quit();
    }
  }
}

// Create singleton instance
// Create mock cache service for mock mode
class MockCacheService {
  constructor() {
    this.cache = new Map();
    this.isConnected = true;
  }

  get(key) {
    return this.cache.get(key) || null;
  }

  set(key, value, ttl) {
    this.cache.set(key, value);
    if (ttl) {
      setTimeout(() => this.cache.delete(key), ttl * 1000);
    }
    return 'OK';
  }

  del(key) {
    return this.cache.delete(key) ? 1 : 0;
  }

  exists(key) {
    return this.cache.has(key) ? 1 : 0;
  }

  keys(pattern) {
    const allKeys = Array.from(this.cache.keys());
    if (pattern === '*') return allKeys;
    const regex = new RegExp(pattern.replace('*', '.*'));
    return allKeys.filter((key) => regex.test(key));
  }

  flushAll() {
    this.cache.clear();
    return 'OK';
  }

  cacheUser(userId, userData) {
    return this.set(`user:${userId}`, JSON.stringify(userData), 3600);
  }

  async getCachedUser(userId) {
    const data = await this.get(`user:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  invalidateUser(userId) {
    return this.del(`user:${userId}`);
  }

  cacheSession(sessionId, sessionData) {
    return this.set(`session:${sessionId}`, JSON.stringify(sessionData), 86400);
  }

  async getSession(sessionId) {
    const data = await this.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  }

  invalidateSession(sessionId) {
    return this.del(`session:${sessionId}`);
  }

  cacheData(key, data, ttl = 3600) {
    return this.set(key, JSON.stringify(data), ttl);
  }

  async getCachedData(key) {
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  async invalidatePattern(pattern) {
    const keys = await this.keys(pattern);
    for (const key of keys) {
      await this.del(key);
    }
    return keys.length;
  }

  initialize() {
    logger.info('Mock cache service initialized');
  }
}

// Check if we should use mock mode
const USE_MOCK_DB = process.env.USE_MOCK_DB === 'true' || process.env.NODE_ENV === 'mock';

const cacheService = USE_MOCK_DB ? new MockCacheService() : new CacheService();

// Initialize cache
const initializeCache = async () => {
  await cacheService.initialize();
};

module.exports = {
  cacheService,
  initializeCache
};
