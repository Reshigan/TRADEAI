/**
 * Cache Service
 * Redis-based caching with fallback to in-memory cache
 */

const Redis = require('ioredis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.redis = null;
    this.inMemoryCache = new Map();
    this.useRedis = process.env.REDIS_URL && process.env.NODE_ENV === 'production';

    if (this.useRedis) {
      this.initRedis();
    } else {
      logger.info('Using in-memory cache (Redis not configured)');
    }
  }

  /**
   * Initialize Redis connection
   */
  initRedis() {
    try {
      this.redis = new Redis(process.env.REDIS_URL, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true
      });

      this.redis.on('connect', () => {
        logger.info('Redis connected successfully');
      });

      this.redis.on('error', (err) => {
        logger.error('Redis connection error:', err);
        this.useRedis = false;
      });

      this.redis.on('close', () => {
        logger.warn('Redis connection closed');
      });

      this.redis.connect();
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      this.useRedis = false;
    }
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  async get(key) {
    try {
      if (this.useRedis && this.redis) {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        const cached = this.inMemoryCache.get(key);
        if (cached && cached.expiry > Date.now()) {
          return cached.value;
        } else if (cached) {
          this.inMemoryCache.delete(key);
        }
        return null;
      }
    } catch (error) {
      logger.error('Cache get error:', { key, error: error.message });
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 300)
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = 300) {
    try {
      if (this.useRedis && this.redis) {
        await this.redis.setex(key, ttl, JSON.stringify(value));
        return true;
      } else {
        this.inMemoryCache.set(key, {
          value,
          expiry: Date.now() + (ttl * 1000)
        });

        // Cleanup expired entries periodically
        this.cleanupInMemoryCache();
        return true;
      }
    } catch (error) {
      logger.error('Cache set error:', { key, error: error.message });
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async del(key) {
    try {
      if (this.useRedis && this.redis) {
        await this.redis.del(key);
        return true;
      } else {
        this.inMemoryCache.delete(key);
        return true;
      }
    } catch (error) {
      logger.error('Cache delete error:', { key, error: error.message });
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   * @param {string} pattern - Key pattern (e.g., 'user:*')
   * @returns {Promise<number>} Number of keys deleted
   */
  async delPattern(pattern) {
    try {
      if (this.useRedis && this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          return keys.length;
        }
        return 0;
      } else {
        let count = 0;
        const regex = new RegExp(pattern.replace('*', '.*'));

        for (const key of this.inMemoryCache.keys()) {
          if (regex.test(key)) {
            this.inMemoryCache.delete(key);
            count++;
          }
        }
        return count;
      }
    } catch (error) {
      logger.error('Cache pattern delete error:', { pattern, error: error.message });
      return 0;
    }
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Exists status
   */
  async exists(key) {
    try {
      if (this.useRedis && this.redis) {
        const result = await this.redis.exists(key);
        return result === 1;
      } else {
        const cached = this.inMemoryCache.get(key);
        return cached && cached.expiry > Date.now();
      }
    } catch (error) {
      logger.error('Cache exists error:', { key, error: error.message });
      return false;
    }
  }

  /**
   * Clear all cache
   * @returns {Promise<boolean>} Success status
   */
  async clear() {
    try {
      if (this.useRedis && this.redis) {
        await this.redis.flushdb();
        return true;
      } else {
        this.inMemoryCache.clear();
        return true;
      }
    } catch (error) {
      logger.error('Cache clear error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache stats
   */
  async getStats() {
    try {
      if (this.useRedis && this.redis) {
        const info = await this.redis.info('stats');
        const dbSize = await this.redis.dbsize();
        return {
          type: 'redis',
          size: dbSize,
          info
        };
      } else {
        // Cleanup expired entries before reporting
        this.cleanupInMemoryCache();

        return {
          type: 'memory',
          size: this.inMemoryCache.size,
          keys: Array.from(this.inMemoryCache.keys())
        };
      }
    } catch (error) {
      logger.error('Cache stats error:', error);
      return { type: 'error', error: error.message };
    }
  }

  /**
   * Cleanup expired entries from in-memory cache
   */
  cleanupInMemoryCache() {
    const now = Date.now();
    for (const [key, cached] of this.inMemoryCache.entries()) {
      if (cached.expiry <= now) {
        this.inMemoryCache.delete(key);
      }
    }
  }

  /**
   * Cache wrapper for functions
   * @param {string} key - Cache key
   * @param {Function} fn - Function to execute if cache miss
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<any>} Cached or fresh data
   */
  async wrap(key, fn, ttl = 300) {
    try {
      // Try to get from cache
      const cached = await this.get(key);
      if (cached !== null) {
        logger.debug('Cache hit', { key });
        return cached;
      }

      // Cache miss - execute function
      logger.debug('Cache miss', { key });
      const result = await fn();

      // Store in cache
      await this.set(key, result, ttl);

      return result;
    } catch (error) {
      logger.error('Cache wrap error:', { key, error: error.message });
      // Execute function without caching on error
      return fn();
    }
  }

  /**
   * Generate cache key
   * @param {string} prefix - Key prefix
   * @param  {...any} parts - Key parts
   * @returns {string} Cache key
   */
  generateKey(prefix, ...parts) {
    return `${prefix}:${parts.filter((p) => p !== undefined && p !== null).join(':')}`;
  }

  /**
   * Close connections
   */
  async disconnect() {
    try {
      if (this.redis) {
        await this.redis.quit();
        logger.info('Redis disconnected');
      }
      this.inMemoryCache.clear();
    } catch (error) {
      logger.error('Redis disconnect error:', error);
    }
  }
}

// Export singleton instance
module.exports = new CacheService();
