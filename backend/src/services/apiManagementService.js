const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const Redis = require('ioredis');
const config = require('../config');

class APIManagementService {
  constructor() {
    this.rateLimiters = new Map();
    this.apiKeys = new Map();
    this.apiUsage = new Map();
    this.quotas = new Map();
    this.analytics = new Map();
    this.redis = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    console.log('Initializing API Management Service...');

    // Initialize Redis connection (guarded by env)
    await this.initializeRedis();

    // Initialize default rate limiters
    this.initializeRateLimiters();

    // Initialize API key management
    this.initializeAPIKeys();

    // Start analytics collection
    this.startAnalyticsCollection();

    this.initialized = true;
    console.log('API Management Service initialized successfully');
  }

  initializeRedis() {
    try {
      const redisEnabled = process.env.REDIS_ENABLED !== 'false';
      const host = process.env.REDIS_HOST || (config.jobs && config.jobs.redis && config.jobs.redis.host) || 'localhost';
      const port = Number(process.env.REDIS_PORT || (config.jobs && config.jobs.redis && config.jobs.redis.port) || 6379);
      const password = process.env.REDIS_PASSWORD || (config.jobs && config.jobs.redis && config.jobs.redis.password);
      const db = Number(process.env.REDIS_DB || (config.jobs && config.jobs.redis && config.jobs.redis.db) || 0);

      if (!redisEnabled || (process.env.NODE_ENV === 'production' && !password)) {
        console.warn('API Management: Redis disabled or not configured; using in-memory stores');
        this.redis = null;
        return;
      }

      this.redis = new Redis({ host, port, password, db, retryDelayOnFailover: 100, maxRetriesPerRequest: 3 });
      this.redis.on('connect', () => console.log('Connected to Redis for API Management'));
      this.redis.on('error', (error) => console.error('Redis connection error:', error));
    } catch (error) {
      console.warn('Redis not available, using in-memory storage for API management');
      this.redis = null;
    }
  }


  initializeRateLimiters() {
    // Global rate limiter
    this.rateLimiters.set('global', rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: this.redis ? new (require('rate-limit-redis'))({
        sendCommand: (...args) => this.redis.call(...args)
      }) : undefined
    }));

    // API key based rate limiter
    this.rateLimiters.set('api_key', rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: (req) => {
        const apiKey = this.extractAPIKey(req);
        const keyData = this.apiKeys.get(apiKey);
        return keyData ? keyData.rateLimit : 100;
      },
      keyGenerator: (req) => {
        return this.extractAPIKey(req) || req.ip;
      },
      message: {
        error: 'API rate limit exceeded for your key',
        code: 'API_RATE_LIMIT_EXCEEDED'
      },
      store: this.redis ? new (require('rate-limit-redis'))({
        sendCommand: (...args) => this.redis.call(...args)
      }) : undefined
    }));

    // Tenant based rate limiter
    this.rateLimiters.set('tenant', rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: (req) => {
        const tenantId = req.tenant?.id;
        const quota = this.quotas.get(tenantId);
        return quota ? quota.hourlyLimit : 500;
      },
      keyGenerator: (req) => {
        return req.tenant?.id || req.ip;
      },
      message: {
        error: 'Tenant rate limit exceeded',
        code: 'TENANT_RATE_LIMIT_EXCEEDED'
      },
      store: this.redis ? new (require('rate-limit-redis'))({
        sendCommand: (...args) => this.redis.call(...args)
      }) : undefined
    }));

    // Slow down middleware for gradual throttling
    this.rateLimiters.set('slowdown', slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 100, // allow 100 requests per 15 minutes at full speed
      delayMs: 500, // slow down subsequent requests by 500ms per request
      maxDelayMs: 20000, // maximum delay of 20 seconds
      store: this.redis ? new (require('rate-limit-redis'))({
        sendCommand: (...args) => this.redis.call(...args)
      }) : undefined
    }));

    // Endpoint specific rate limiters
    this.createEndpointRateLimiters();
  }

  createEndpointRateLimiters() {
    // ML/AI endpoints - more restrictive
    this.rateLimiters.set('ml', rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 100,
      message: {
        error: 'ML API rate limit exceeded',
        code: 'ML_RATE_LIMIT_EXCEEDED'
      }
    }));

    // Analytics endpoints
    this.rateLimiters.set('analytics', rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 200,
      message: {
        error: 'Analytics API rate limit exceeded',
        code: 'ANALYTICS_RATE_LIMIT_EXCEEDED'
      }
    }));

    // Reporting endpoints
    this.rateLimiters.set('reports', rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 50,
      message: {
        error: 'Reporting API rate limit exceeded',
        code: 'REPORTS_RATE_LIMIT_EXCEEDED'
      }
    }));

    // Webhook endpoints
    this.rateLimiters.set('webhooks', rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 1000,
      message: {
        error: 'Webhook API rate limit exceeded',
        code: 'WEBHOOK_RATE_LIMIT_EXCEEDED'
      }
    }));

    // Integration endpoints
    this.rateLimiters.set('integrations', rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 300,
      message: {
        error: 'Integration API rate limit exceeded',
        code: 'INTEGRATION_RATE_LIMIT_EXCEEDED'
      }
    }));
  }

  initializeAPIKeys() {
    // Create default API keys for different tiers
    this.createAPIKey('free', {
      name: 'Free Tier',
      rateLimit: 100,
      dailyQuota: 1000,
      features: ['basic_analytics', 'basic_reports'],
      restrictions: {
        ml: false,
        advanced_analytics: false,
        custom_integrations: false
      }
    });

    this.createAPIKey('pro', {
      name: 'Pro Tier',
      rateLimit: 500,
      dailyQuota: 10000,
      features: ['basic_analytics', 'advanced_analytics', 'basic_reports', 'ml_predictions'],
      restrictions: {
        custom_integrations: false
      }
    });

    this.createAPIKey('enterprise', {
      name: 'Enterprise Tier',
      rateLimit: 2000,
      dailyQuota: 100000,
      features: ['*'],
      restrictions: {}
    });
  }

  // API Key Management
  createAPIKey(tier, config) {
    const apiKey = this.generateAPIKey();

    const keyData = {
      key: apiKey,
      tier,
      name: config.name,
      rateLimit: config.rateLimit,
      dailyQuota: config.dailyQuota,
      features: config.features,
      restrictions: config.restrictions,
      active: true,
      createdAt: new Date(),
      lastUsed: null,
      usageCount: 0,
      quotaUsed: 0,
      quotaResetDate: this.getNextQuotaReset()
    };

    this.apiKeys.set(apiKey, keyData);
    return apiKey;
  }

  async generateAPIKeyForTenant(tenantId, tier = 'free') {
    const apiKey = this.generateAPIKey();
    const tierConfig = this.getTierConfig(tier);

    const keyData = {
      key: apiKey,
      tenantId,
      tier,
      name: `${tier} API Key`,
      rateLimit: tierConfig.rateLimit,
      dailyQuota: tierConfig.dailyQuota,
      features: tierConfig.features,
      restrictions: tierConfig.restrictions,
      active: true,
      createdAt: new Date(),
      lastUsed: null,
      usageCount: 0,
      quotaUsed: 0,
      quotaResetDate: this.getNextQuotaReset()
    };

    this.apiKeys.set(apiKey, keyData);

    // Store in Redis if available
    if (this.redis) {
      await this.redis.hset('api_keys', apiKey, JSON.stringify(keyData));
    }

    return {
      apiKey,
      tier,
      rateLimit: keyData.rateLimit,
      dailyQuota: keyData.dailyQuota,
      features: keyData.features
    };
  }

  getTierConfig(tier) {
    const configs = {
      free: {
        rateLimit: 100,
        dailyQuota: 1000,
        features: ['basic_analytics', 'basic_reports'],
        restrictions: {
          ml: false,
          advanced_analytics: false,
          custom_integrations: false
        }
      },
      pro: {
        rateLimit: 500,
        dailyQuota: 10000,
        features: ['basic_analytics', 'advanced_analytics', 'basic_reports', 'ml_predictions'],
        restrictions: {
          custom_integrations: false
        }
      },
      enterprise: {
        rateLimit: 2000,
        dailyQuota: 100000,
        features: ['*'],
        restrictions: {}
      }
    };

    return configs[tier] || configs.free;
  }

  async revokeAPIKey(apiKey) {
    const keyData = this.apiKeys.get(apiKey);
    if (!keyData) {
      throw new Error('API key not found');
    }

    keyData.active = false;
    keyData.revokedAt = new Date();

    if (this.redis) {
      await this.redis.hset('api_keys', apiKey, JSON.stringify(keyData));
    }

    return { success: true, message: 'API key revoked successfully' };
  }

  validateAPIKey(apiKey) {
    const keyData = this.apiKeys.get(apiKey);
    if (!keyData || !keyData.active) {
      return { valid: false, reason: 'Invalid or inactive API key' };
    }

    // Check quota
    if (keyData.quotaUsed >= keyData.dailyQuota) {
      return { valid: false, reason: 'Daily quota exceeded' };
    }

    // Reset quota if needed
    if (new Date() > keyData.quotaResetDate) {
      keyData.quotaUsed = 0;
      keyData.quotaResetDate = this.getNextQuotaReset();
    }

    return { valid: true, keyData };
  }

  // Rate Limiting Middleware
  getRateLimiter(type = 'global') {
    return this.rateLimiters.get(type) || this.rateLimiters.get('global');
  }

  createCustomRateLimiter(options) {
    return rateLimit({
      windowMs: options.windowMs || 15 * 60 * 1000,
      max: options.max || 100,
      message: options.message || {
        error: 'Rate limit exceeded',
        code: 'CUSTOM_RATE_LIMIT_EXCEEDED'
      },
      keyGenerator: options.keyGenerator,
      store: this.redis ? new (require('rate-limit-redis'))({
        sendCommand: (...args) => this.redis.call(...args)
      }) : undefined
    });
  }

  // API Usage Tracking
  async trackAPIUsage(req, res, next) {
    const startTime = Date.now();
    const apiKey = this.extractAPIKey(req);
    const tenantId = req.tenant?.id;
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    const userAgent = req.get('User-Agent');
    const ip = req.ip;

    // Track request
    const requestData = {
      timestamp: new Date(),
      method: req.method,
      endpoint,
      apiKey,
      tenantId,
      ip,
      userAgent,
      requestSize: req.get('content-length') || 0
    };

    // Continue with request
    res.on('finish', async () => {
      const responseTime = Date.now() - startTime;
      const responseSize = res.get('content-length') || 0;

      // Complete tracking data
      requestData.statusCode = res.statusCode;
      requestData.responseTime = responseTime;
      requestData.responseSize = responseSize;
      requestData.success = res.statusCode < 400;

      // Update API key usage
      if (apiKey) {
        await this.updateAPIKeyUsage(apiKey, requestData);
      }

      // Update tenant usage
      if (tenantId) {
        await this.updateTenantUsage(tenantId, requestData);
      }

      // Store analytics
      await this.storeAnalytics(requestData);
    });

    next();
  }

  async updateAPIKeyUsage(apiKey, requestData) {
    const keyData = this.apiKeys.get(apiKey);
    if (keyData) {
      keyData.usageCount++;
      keyData.quotaUsed++;
      keyData.lastUsed = new Date();

      if (this.redis) {
        await this.redis.hset('api_keys', apiKey, JSON.stringify(keyData));
      }
    }
  }

  async updateTenantUsage(tenantId, requestData) {
    const today = new Date().toISOString().split('T')[0];
    const usageKey = `tenant_usage:${tenantId}:${today}`;

    if (this.redis) {
      await this.redis.hincrby(usageKey, 'requests', 1);
      await this.redis.hincrby(usageKey, 'response_time', requestData.responseTime);

      if (!requestData.success) {
        await this.redis.hincrby(usageKey, 'errors', 1);
      }

      // Set expiry for 30 days
      await this.redis.expire(usageKey, 30 * 24 * 60 * 60);
    }
  }

  async storeAnalytics(requestData) {
    const hour = new Date().toISOString().slice(0, 13);
    const analyticsKey = `analytics:${hour}`;

    if (!this.analytics.has(analyticsKey)) {
      this.analytics.set(analyticsKey, {
        requests: 0,
        errors: 0,
        totalResponseTime: 0,
        endpoints: new Map(),
        statusCodes: new Map(),
        apiKeys: new Map()
      });
    }

    const analytics = this.analytics.get(analyticsKey);
    analytics.requests++;
    analytics.totalResponseTime += requestData.responseTime;

    if (!requestData.success) {
      analytics.errors++;
    }

    // Track by endpoint
    const endpointCount = analytics.endpoints.get(requestData.endpoint) || 0;
    analytics.endpoints.set(requestData.endpoint, endpointCount + 1);

    // Track by status code
    const statusCount = analytics.statusCodes.get(requestData.statusCode) || 0;
    analytics.statusCodes.set(requestData.statusCode, statusCount + 1);

    // Track by API key
    if (requestData.apiKey) {
      const keyCount = analytics.apiKeys.get(requestData.apiKey) || 0;
      analytics.apiKeys.set(requestData.apiKey, keyCount + 1);
    }

    // Store in Redis
    if (this.redis) {
      await this.redis.hset('analytics', analyticsKey, JSON.stringify({
        ...analytics,
        endpoints: Object.fromEntries(analytics.endpoints),
        statusCodes: Object.fromEntries(analytics.statusCodes),
        apiKeys: Object.fromEntries(analytics.apiKeys)
      }));
    }
  }

  // Feature Access Control
  async checkFeatureAccess(req, feature) {
    const apiKey = this.extractAPIKey(req);
    if (!apiKey) {
      return { allowed: false, reason: 'API key required' };
    }

    const validation = await this.validateAPIKey(apiKey);
    if (!validation.valid) {
      return { allowed: false, reason: validation.reason };
    }

    const keyData = validation.keyData;

    // Check if feature is allowed
    if (keyData.features.includes('*') || keyData.features.includes(feature)) {
      // Check restrictions
      if (keyData.restrictions[feature] === false) {
        return { allowed: false, reason: `Feature ${feature} not available in ${keyData.tier} tier` };
      }
      return { allowed: true };
    }

    return { allowed: false, reason: `Feature ${feature} not included in ${keyData.tier} tier` };
  }

  requireFeature(feature) {
    return async (req, res, next) => {
      const access = await this.checkFeatureAccess(req, feature);
      if (!access.allowed) {
        return res.status(403).json({
          error: 'Feature access denied',
          reason: access.reason,
          feature
        });
      }
      next();
    };
  }

  // Analytics and Reporting
  getAPIAnalytics(timeRange = '24h') {
    const analytics = {
      totalRequests: 0,
      totalErrors: 0,
      averageResponseTime: 0,
      topEndpoints: [],
      statusCodeDistribution: {},
      apiKeyUsage: {},
      hourlyStats: []
    };

    const hours = this.getHoursInRange(timeRange);

    for (const hour of hours) {
      const analyticsKey = `analytics:${hour}`;
      const hourData = this.analytics.get(analyticsKey);

      if (hourData) {
        analytics.totalRequests += hourData.requests;
        analytics.totalErrors += hourData.errors;
        analytics.totalResponseTime += hourData.totalResponseTime;

        // Merge endpoint data
        for (const [endpoint, count] of hourData.endpoints) {
          analytics.topEndpoints[endpoint] = (analytics.topEndpoints[endpoint] || 0) + count;
        }

        // Merge status code data
        for (const [code, count] of hourData.statusCodes) {
          analytics.statusCodeDistribution[code] = (analytics.statusCodeDistribution[code] || 0) + count;
        }

        // Merge API key data
        for (const [key, count] of hourData.apiKeys) {
          analytics.apiKeyUsage[key] = (analytics.apiKeyUsage[key] || 0) + count;
        }

        analytics.hourlyStats.push({
          hour,
          requests: hourData.requests,
          errors: hourData.errors,
          averageResponseTime: hourData.requests > 0 ? hourData.totalResponseTime / hourData.requests : 0
        });
      }
    }

    // Calculate average response time
    analytics.averageResponseTime = analytics.totalRequests > 0 ?
      analytics.totalResponseTime / analytics.totalRequests : 0;

    // Sort top endpoints
    analytics.topEndpoints = Object.entries(analytics.topEndpoints)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    return analytics;
  }

  async getTenantUsage(tenantId, days = 7) {
    const usage = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const usageKey = `tenant_usage:${tenantId}:${dateStr}`;

      if (this.redis) {
        const dayUsage = await this.redis.hgetall(usageKey);
        usage.push({
          date: dateStr,
          requests: parseInt(dayUsage.requests || 0),
          errors: parseInt(dayUsage.errors || 0),
          averageResponseTime: dayUsage.requests > 0 ?
            parseInt(dayUsage.response_time || 0) / parseInt(dayUsage.requests) : 0
        });
      }
    }

    return usage.reverse();
  }

  // Utility Methods
  extractAPIKey(req) {
    // Check Authorization header
    const authHeader = req.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check X-API-Key header
    const apiKeyHeader = req.get('X-API-Key');
    if (apiKeyHeader) {
      return apiKeyHeader;
    }

    // Check query parameter
    return req.query.api_key;
  }

  generateAPIKey() {
    const prefix = 'tradeai_';
    const randomBytes = require('crypto').randomBytes(32).toString('hex');
    return prefix + randomBytes;
  }

  getNextQuotaReset() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  getHoursInRange(timeRange) {
    const hours = [];
    const now = new Date();
    let hoursBack = 24;

    switch (timeRange) {
      case '1h': hoursBack = 1; break;
      case '6h': hoursBack = 6; break;
      case '12h': hoursBack = 12; break;
      case '24h': hoursBack = 24; break;
      case '7d': hoursBack = 168; break;
    }

    for (let i = 0; i < hoursBack; i++) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      hours.push(hour.toISOString().slice(0, 13));
    }

    return hours.reverse();
  }

  startAnalyticsCollection() {
    // Clean up old analytics data every hour
    setInterval(() => {
      this.cleanupOldAnalytics();
    }, 60 * 60 * 1000);
  }

  cleanupOldAnalytics() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7); // Keep 7 days

    for (const [key] of this.analytics) {
      const hourStr = key.replace('analytics:', '');
      const hourDate = new Date(`${hourStr}:00:00.000Z`);

      if (hourDate < cutoff) {
        this.analytics.delete(key);
      }
    }
  }

  // Health Check
  async healthCheck() {
    const health = {
      status: 'healthy',
      redis: this.redis ? 'connected' : 'not_available',
      rateLimiters: this.rateLimiters.size,
      apiKeys: this.apiKeys.size,
      analytics: this.analytics.size
    };

    if (this.redis) {
      try {
        await this.redis.ping();
        health.redis = 'connected';
      } catch (error) {
        health.redis = 'error';
        health.status = 'degraded';
      }
    }

    return health;
  }
}

module.exports = new APIManagementService();
