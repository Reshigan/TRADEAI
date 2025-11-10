/**
 * Cache Service - Redis Integration
 * High-performance caching layer for API responses
 */

class CacheService {
  constructor() {
    this.redis = null;
    this.enabled = false;
    this.defaultTTL = 300; // 5 minutes
    this.inMemoryCache = new Map(); // Fallback in-memory cache
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    try {
      // Try to connect to Redis
      const redis = require('redis');
      this.redis = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              return new Error('Max retries reached');
            }
            return retries * 100;
          }
        }
      });

      this.redis.on('error', (err) => {
        console.log('Redis error:', err.message);
        this.enabled = false;
      });

      this.redis.on('connect', () => {
        console.log('✓ Redis connected');
        this.enabled = true;
      });

      await this.redis.connect();
    } catch (error) {
      console.log('Redis not available, using in-memory cache fallback');
      this.enabled = false;
    }
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  async get(key) {
    try {
      if (this.enabled && this.redis) {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        // Fallback to in-memory cache
        const cached = this.inMemoryCache.get(key);
        if (cached && cached.expires > Date.now()) {
          return cached.value;
        } else if (cached) {
          this.inMemoryCache.delete(key);
        }
        return null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (this.enabled && this.redis) {
        await this.redis.setEx(key, ttl, JSON.stringify(value));
      } else {
        // Fallback to in-memory cache
        this.inMemoryCache.set(key, {
          value,
          expires: Date.now() + (ttl * 1000)
        });
        
        // Clean up old entries periodically
        if (this.inMemoryCache.size > 1000) {
          this.cleanupInMemoryCache();
        }
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete key from cache
   * @param {string} key - Cache key
   */
  async del(key) {
    try {
      if (this.enabled && this.redis) {
        await this.redis.del(key);
      } else {
        this.inMemoryCache.delete(key);
      }
    } catch (error) {
      console.error('Cache del error:', error);
    }
  }

  /**
   * Delete all keys matching pattern
   * @param {string} pattern - Key pattern (e.g., 'budget:*')
   */
  async delPattern(pattern) {
    try {
      if (this.enabled && this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(keys);
        }
      } else {
        // For in-memory cache, delete matching keys
        const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
        for (const key of this.inMemoryCache.keys()) {
          if (regex.test(key)) {
            this.inMemoryCache.delete(key);
          }
        }
      }
    } catch (error) {
      console.error('Cache delPattern error:', error);
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} True if key exists
   */
  async exists(key) {
    try {
      if (this.enabled && this.redis) {
        return await this.redis.exists(key) === 1;
      } else {
        const cached = this.inMemoryCache.get(key);
        return cached && cached.expires > Date.now();
      }
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Increment counter
   * @param {string} key - Cache key
   * @returns {Promise<number>} New value
   */
  async incr(key) {
    try {
      if (this.enabled && this.redis) {
        return await this.redis.incr(key);
      } else {
        const cached = this.inMemoryCache.get(key);
        const newValue = (cached?.value || 0) + 1;
        this.inMemoryCache.set(key, {
          value: newValue,
          expires: Date.now() + (this.defaultTTL * 1000)
        });
        return newValue;
      }
    } catch (error) {
      console.error('Cache incr error:', error);
      return 0;
    }
  }

  /**
   * Get or set value (cache-aside pattern)
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to fetch data if not cached
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<any>} Cached or fetched value
   */
  async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
    try {
      const cached = await this.get(key);
      if (cached !== null) {
        return { data: cached, cached: true };
      }

      const data = await fetchFn();
      await this.set(key, data, ttl);
      return { data, cached: false };
    } catch (error) {
      console.error('Cache getOrSet error:', error);
      // If caching fails, still return the data
      try {
        const data = await fetchFn();
        return { data, cached: false };
      } catch (fetchError) {
        throw fetchError;
      }
    }
  }

  /**
   * Clean up expired entries from in-memory cache
   */
  cleanupInMemoryCache() {
    const now = Date.now();
    for (const [key, cached] of this.inMemoryCache.entries()) {
      if (cached.expires < now) {
        this.inMemoryCache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    try {
      if (this.enabled && this.redis) {
        await this.redis.flushDb();
      } else {
        this.inMemoryCache.clear();
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<object>} Cache statistics
   */
  async getStats() {
    try {
      if (this.enabled && this.redis) {
        const info = await this.redis.info('stats');
        return {
          enabled: true,
          type: 'redis',
          info
        };
      } else {
        return {
          enabled: false,
          type: 'in-memory',
          size: this.inMemoryCache.size,
          maxSize: 1000
        };
      }
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        enabled: false,
        error: error.message
      };
    }
  }

  /**
   * Cache middleware for Express routes
   * @param {number} ttl - Time to live in seconds
   * @returns {Function} Express middleware
   */
  middleware(ttl = this.defaultTTL) {
    return async (req, res, next) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      const key = `api:${req.originalUrl}`;
      
      try {
        const cached = await this.get(key);
        if (cached) {
          return res.json({ ...cached, _cached: true });
        }

        // Store original res.json
        const originalJson = res.json.bind(res);

        // Override res.json to cache the response
        res.json = (data) => {
          this.set(key, data, ttl).catch(err => 
            console.error('Cache middleware set error:', err)
          );
          return originalJson(data);
        };

        next();
      } catch (error) {
        console.error('Cache middleware error:', error);
        next();
      }
    };
  }
}

module.exports = new CacheService();
