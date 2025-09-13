const redis = require('redis');
const logger = require('../utils/logger');

class SimpleCacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }
  
  async initialize() {
    try {
      console.log('🔄 Initializing Redis cache...');
      
      // Create Redis client with modern API
      this.client = redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || 'redis',
          port: parseInt(process.env.REDIS_PORT) || 6379,
          connectTimeout: 5000,
          lazyConnect: true
        },
        database: 0
      });

      // Handle connection events
      this.client.on('connect', () => {
        console.log('🔄 Redis connecting...');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis connected and ready');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.log('⚠️ Redis connection error:', err.message);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('⚠️ Redis connection ended');
        this.isConnected = false;
      });

      // Connect to Redis
      await this.client.connect();
      
      console.log('✅ Redis cache initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Redis cache:', error.message);
      console.log('⚠️ Continuing without Redis cache...');
      this.isConnected = false;
    }
  }

  async get(key) {
    if (!this.isConnected || !this.client) {
      return null;
    }
    
    try {
      return await this.client.get(key);
    } catch (error) {
      console.log('⚠️ Redis GET error:', error.message);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    if (!this.isConnected || !this.client) {
      return false;
    }
    
    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      console.log('⚠️ Redis SET error:', error.message);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.log('⚠️ Redis DEL error:', error.message);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.log('⚠️ Redis EXISTS error:', error.message);
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.disconnect();
        console.log('✅ Redis disconnected');
      } catch (error) {
        console.log('⚠️ Redis disconnect error:', error.message);
      }
    }
  }
}

// Create singleton instance
const cacheService = new SimpleCacheService();

// Initialize function for compatibility
const initializeCache = async () => {
  await cacheService.initialize();
};

module.exports = {
  cacheService,
  initializeCache
};