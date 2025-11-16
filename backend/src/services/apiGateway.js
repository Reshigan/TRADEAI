const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const Redis = require('redis');

/**
 * API Gateway Service
 * Provides service mesh, API versioning, rate limiting, load balancing, and monitoring
 */

class APIGateway {
  constructor() {
    this.app = express();
    this.services = new Map();
    this.routes = new Map();
    this.rateLimiters = new Map();
    this.loadBalancers = new Map();
    this.metrics = new Map();
    this.redisClient = null;
    this.isInitialized = false;

    this.initializeGateway();
  }

  async initializeGateway() {
    try {
      console.log('Initializing API Gateway...');

      // Initialize Redis for caching and rate limiting
      await this.initializeRedis();

      // Setup middleware
      this.setupMiddleware();

      // Register services
      await this.registerServices();

      // Setup routes
      this.setupRoutes();

      // Setup monitoring
      this.setupMonitoring();

      this.isInitialized = true;
      console.log('API Gateway initialized successfully');
    } catch (error) {
      console.error('Failed to initialize API Gateway:', error);
    }
  }

  async initializeRedis() {
    try {
      this.redisClient = Redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      });
      await this.redisClient.connect();
      console.log('Redis connected for API Gateway');
    } catch (error) {
      console.warn('Redis not available for API Gateway:', error.message);
    }
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:']
        }
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: (origin, callback) => {
        // Allow requests from configured origins
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-API-Version']
    }));

    // Compression
    this.app.use(compression());

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging and metrics
    this.app.use(this.requestLogger.bind(this));
    this.app.use(this.metricsCollector.bind(this));

    // Authentication middleware
    this.app.use(this.authenticationMiddleware.bind(this));

    // Tenant validation
    this.app.use(this.tenantValidationMiddleware.bind(this));

    // API versioning
    this.app.use(this.versioningMiddleware.bind(this));
  }

  async registerServices() {
    // Register microservices
    this.services.set('analytics', {
      name: 'Analytics Service',
      baseUrl: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3001',
      healthCheck: '/health',
      version: '1.0',
      instances: [
        { url: 'http://localhost:3001', healthy: true, weight: 1 },
        { url: 'http://localhost:3002', healthy: true, weight: 1 }
      ]
    });

    this.services.set('reporting', {
      name: 'Reporting Service',
      baseUrl: process.env.REPORTING_SERVICE_URL || 'http://localhost:3003',
      healthCheck: '/health',
      version: '1.0',
      instances: [
        { url: 'http://localhost:3003', healthy: true, weight: 1 }
      ]
    });

    this.services.set('ml', {
      name: 'ML Service',
      baseUrl: process.env.ML_SERVICE_URL || 'http://localhost:3004',
      healthCheck: '/health',
      version: '1.0',
      instances: [
        { url: 'http://localhost:3004', healthy: true, weight: 1 }
      ]
    });

    this.services.set('workflow', {
      name: 'Workflow Service',
      baseUrl: process.env.WORKFLOW_SERVICE_URL || 'http://localhost:3005',
      healthCheck: '/health',
      version: '1.0',
      instances: [
        { url: 'http://localhost:3005', healthy: true, weight: 1 }
      ]
    });

    this.services.set('bulk', {
      name: 'Bulk Operations Service',
      baseUrl: process.env.BULK_SERVICE_URL || 'http://localhost:3006',
      healthCheck: '/health',
      version: '1.0',
      instances: [
        { url: 'http://localhost:3006', healthy: true, weight: 1 }
      ]
    });

    // Initialize load balancers for each service
    this.services.forEach((service, serviceName) => {
      this.loadBalancers.set(serviceName, new LoadBalancer(service.instances));
    });

    console.log('Services registered:', Array.from(this.services.keys()));
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: this.getServiceHealthStatus()
      });
    });

    // Gateway info endpoint
    this.app.get('/gateway/info', (req, res) => {
      res.json({
        version: '1.0.0',
        services: Array.from(this.services.keys()),
        uptime: process.uptime(),
        metrics: this.getGatewayMetrics()
      });
    });

    // Service discovery endpoint
    this.app.get('/gateway/services', (req, res) => {
      const serviceList = Array.from(this.services.entries()).map(([name, service]) => ({
        name,
        displayName: service.name,
        version: service.version,
        healthy: this.loadBalancers.get(name).getHealthyInstances().length > 0,
        instances: service.instances.length
      }));

      res.json({
        services: serviceList,
        total: serviceList.length
      });
    });

    // Metrics endpoint
    this.app.get('/gateway/metrics', (req, res) => {
      res.json(this.getDetailedMetrics());
    });

    // Setup service proxies with rate limiting
    this.setupServiceProxies();

    // Catch-all for undefined routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    });

    // Error handling middleware
    this.app.use(this.errorHandler.bind(this));
  }

  setupServiceProxies() {
    // Analytics service routes
    this.setupServiceProxy('/api/v1/analytics', 'analytics', {
      rateLimit: { windowMs: 15 * 60 * 1000, max: 1000 }, // 1000 requests per 15 minutes
      timeout: 30000,
      retries: 3
    });

    // Reporting service routes
    this.setupServiceProxy('/api/v1/reports', 'reporting', {
      rateLimit: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
      timeout: 60000, // Longer timeout for report generation
      retries: 2
    });

    // ML service routes
    this.setupServiceProxy('/api/v1/ml', 'ml', {
      rateLimit: { windowMs: 15 * 60 * 1000, max: 500 },
      timeout: 45000,
      retries: 2
    });

    // Workflow service routes
    this.setupServiceProxy('/api/v1/workflows', 'workflow', {
      rateLimit: { windowMs: 15 * 60 * 1000, max: 2000 },
      timeout: 30000,
      retries: 3
    });

    // Bulk operations service routes
    this.setupServiceProxy('/api/v1/bulk', 'bulk', {
      rateLimit: { windowMs: 15 * 60 * 1000, max: 50 }, // Lower limit for bulk operations
      timeout: 300000, // 5 minutes for bulk operations
      retries: 1
    });
  }

  setupServiceProxy(path, serviceName, options = {}) {
    const service = this.services.get(serviceName);
    if (!service) {
      console.error(`Service ${serviceName} not found`);
      return;
    }

    // Setup rate limiting
    if (options.rateLimit) {
      const limiter = rateLimit({
        windowMs: options.rateLimit.windowMs,
        max: options.rateLimit.max,
        message: {
          error: 'Too many requests',
          retryAfter: Math.ceil(options.rateLimit.windowMs / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
          return `${req.ip}:${req.headers['x-tenant-id'] || 'unknown'}:${serviceName}`;
        },
        store: this.redisClient ? new RedisStore(this.redisClient) : undefined
      });

      this.rateLimiters.set(serviceName, limiter);
      this.app.use(path, limiter);
    }

    // Setup proxy middleware
    const proxyMiddleware = createProxyMiddleware({
      target: service.baseUrl,
      changeOrigin: true,
      pathRewrite: {
        [`^${path}`]: ''
      },
      timeout: options.timeout || 30000,
      retries: options.retries || 3,
      router: (req) => {
        // Use load balancer to select instance
        const loadBalancer = this.loadBalancers.get(serviceName);
        const instance = loadBalancer.getNextInstance();
        return instance ? instance.url : service.baseUrl;
      },
      onProxyReq: (proxyReq, req, res) => {
        // Add headers for service identification
        proxyReq.setHeader('X-Gateway-Service', serviceName);
        proxyReq.setHeader('X-Gateway-Request-ID', req.requestId);
        proxyReq.setHeader('X-Gateway-Timestamp', new Date().toISOString());

        // Forward tenant information
        if (req.tenant) {
          proxyReq.setHeader('X-Tenant-ID', req.tenant.id);
          proxyReq.setHeader('X-Tenant-Name', req.tenant.name);
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        // Add response headers
        proxyRes.headers['X-Gateway-Service'] = serviceName;
        proxyRes.headers['X-Gateway-Request-ID'] = req.requestId;

        // Update metrics
        this.updateServiceMetrics(serviceName, req, proxyRes);
      },
      onError: (err, req, res) => {
        console.error(`Proxy error for ${serviceName}:`, err.message);

        // Update error metrics
        this.updateErrorMetrics(serviceName, err);

        // Mark instance as unhealthy if connection error
        if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
          const loadBalancer = this.loadBalancers.get(serviceName);
          loadBalancer.markInstanceUnhealthy(req.target);
        }

        res.status(502).json({
          error: 'Service temporarily unavailable',
          service: serviceName,
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
      }
    });

    this.app.use(path, proxyMiddleware);
    console.log(`Proxy setup for ${serviceName} at ${path}`);
  }

  // Middleware functions
  requestLogger(req, res, next) {
    req.requestId = this.generateRequestId();
    req.startTime = Date.now();

    console.log(`[${req.requestId}] ${req.method} ${req.originalUrl} - ${req.ip}`);

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - req.startTime;
      console.log(`[${req.requestId}] ${res.statusCode} - ${duration}ms`);
    });

    next();
  }

  metricsCollector(req, res, next) {
    // Collect request metrics
    const service = this.extractServiceFromPath(req.path);
    if (service) {
      this.incrementMetric(`requests.${service}.total`);
      this.incrementMetric(`requests.${service}.${req.method.toLowerCase()}`);
    }

    // Collect response metrics when finished
    res.on('finish', () => {
      const duration = Date.now() - req.startTime;

      if (service) {
        this.recordMetric(`response_time.${service}`, duration);
        this.incrementMetric(`responses.${service}.${Math.floor(res.statusCode / 100)}xx`);

        if (res.statusCode >= 400) {
          this.incrementMetric(`errors.${service}.total`);
        }
      }
    });

    next();
  }

  authenticationMiddleware(req, res, next) {
    // Skip authentication for health checks and public endpoints
    if (req.path === '/health' || req.path.startsWith('/gateway/')) {
      return next();
    }

    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Bearer token must be provided'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token verification failed'
      });
    }
  }

  tenantValidationMiddleware(req, res, next) {
    // Skip for public endpoints
    if (req.path === '/health' || req.path.startsWith('/gateway/')) {
      return next();
    }

    const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        error: 'Tenant ID required',
        message: 'X-Tenant-ID header or token tenant claim required'
      });
    }

    // Mock tenant validation - would check database in production
    req.tenant = {
      id: tenantId,
      name: `Tenant ${tenantId}`,
      plan: 'enterprise'
    };

    next();
  }

  versioningMiddleware(req, res, next) {
    const apiVersion = req.headers['x-api-version'] || '1.0';
    req.apiVersion = apiVersion;

    // Version compatibility check
    if (!this.isVersionSupported(apiVersion)) {
      return res.status(400).json({
        error: 'Unsupported API version',
        supportedVersions: ['1.0'],
        requestedVersion: apiVersion
      });
    }

    next();
  }

  errorHandler(error, req, res, next) {
    console.error(`[${req.requestId}] Error:`, error);

    // Update error metrics
    this.incrementMetric('errors.gateway.total');

    if (error.type === 'entity.too.large') {
      return res.status(413).json({
        error: 'Request too large',
        message: 'Request body exceeds size limit'
      });
    }

    if (error.message === 'Not allowed by CORS') {
      return res.status(403).json({
        error: 'CORS error',
        message: 'Origin not allowed'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    });
  }

  setupMonitoring() {
    // Health check for services
    setInterval(async () => {
      await this.performHealthChecks();
    }, 30000); // Every 30 seconds

    // Metrics cleanup
    setInterval(() => {
      this.cleanupMetrics();
    }, 300000); // Every 5 minutes

    console.log('Monitoring setup complete');
  }

  async performHealthChecks() {
    for (const [serviceName, service] of this.services) {
      const loadBalancer = this.loadBalancers.get(serviceName);

      for (const instance of service.instances) {
        try {
          const response = await fetch(`${instance.url}${service.healthCheck}`, {
            timeout: 5000
          });

          const isHealthy = response.ok;
          loadBalancer.updateInstanceHealth(instance.url, isHealthy);

        } catch (error) {
          loadBalancer.updateInstanceHealth(instance.url, false);
          console.warn(`Health check failed for ${serviceName} instance ${instance.url}:`, error.message);
        }
      }
    }
  }

  // Utility methods
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  extractServiceFromPath(path) {
    const match = path.match(/^\/api\/v\d+\/(\w+)/);
    return match ? match[1] : null;
  }

  isVersionSupported(version) {
    const supportedVersions = ['1.0'];
    return supportedVersions.includes(version);
  }

  incrementMetric(key) {
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, current + 1);
  }

  recordMetric(key, value) {
    const existing = this.metrics.get(key) || [];
    existing.push({ value, timestamp: Date.now() });

    // Keep only last 1000 values
    if (existing.length > 1000) {
      existing.splice(0, existing.length - 1000);
    }

    this.metrics.set(key, existing);
  }

  getServiceHealthStatus() {
    const status = {};

    this.services.forEach((service, serviceName) => {
      const loadBalancer = this.loadBalancers.get(serviceName);
      const healthyInstances = loadBalancer.getHealthyInstances();

      status[serviceName] = {
        healthy: healthyInstances.length > 0,
        totalInstances: service.instances.length,
        healthyInstances: healthyInstances.length
      };
    });

    return status;
  }

  getGatewayMetrics() {
    const totalRequests = Array.from(this.metrics.keys())
      .filter((key) => key.startsWith('requests.') && key.endsWith('.total'))
      .reduce((sum, key) => sum + (this.metrics.get(key) || 0), 0);

    const totalErrors = Array.from(this.metrics.keys())
      .filter((key) => key.startsWith('errors.') && key.endsWith('.total'))
      .reduce((sum, key) => sum + (this.metrics.get(key) || 0), 0);

    return {
      totalRequests,
      totalErrors,
      errorRate: totalRequests > 0 ? `${(totalErrors / totalRequests * 100).toFixed(2)}%` : '0%',
      uptime: process.uptime()
    };
  }

  getDetailedMetrics() {
    const metrics = {};

    // Group metrics by category
    this.metrics.forEach((value, key) => {
      const parts = key.split('.');
      const category = parts[0];

      if (!metrics[category]) {
        metrics[category] = {};
      }

      if (Array.isArray(value)) {
        // For time-series data, calculate statistics
        const values = value.map((v) => v.value);
        metrics[category][key] = {
          count: values.length,
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          latest: values[values.length - 1]
        };
      } else {
        metrics[category][key] = value;
      }
    });

    return metrics;
  }

  updateServiceMetrics(serviceName, req, proxyRes) {
    const duration = Date.now() - req.startTime;
    this.recordMetric(`service_response_time.${serviceName}`, duration);

    if (proxyRes.statusCode >= 400) {
      this.incrementMetric(`service_errors.${serviceName}.total`);
    }
  }

  updateErrorMetrics(serviceName, error) {
    this.incrementMetric(`proxy_errors.${serviceName}.total`);
    this.incrementMetric(`proxy_errors.${serviceName}.${error.code || 'unknown'}`);
  }

  cleanupMetrics() {
    // Remove old time-series data
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours

    this.metrics.forEach((value, key) => {
      if (Array.isArray(value)) {
        const filtered = value.filter((v) => v.timestamp > cutoff);
        if (filtered.length !== value.length) {
          this.metrics.set(key, filtered);
        }
      }
    });
  }

  // Public methods
  start(port = 3000) {
    return new Promise((resolve, reject) => {
      if (!this.isInitialized) {
        return reject(new Error('Gateway not initialized'));
      }

      const server = this.app.listen(port, (error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`API Gateway listening on port ${port}`);
          resolve(server);
        }
      });
    });
  }

  async shutdown() {
    console.log('Shutting down API Gateway...');

    if (this.redisClient) {
      await this.redisClient.quit();
    }

    console.log('API Gateway shutdown complete');
  }
}

/**
 * Load Balancer for service instances
 */
class LoadBalancer {
  constructor(instances) {
    this.instances = instances.map((instance) => ({
      ...instance,
      healthy: true,
      requests: 0,
      lastHealthCheck: Date.now()
    }));
    this.currentIndex = 0;
  }

  getNextInstance() {
    const healthyInstances = this.getHealthyInstances();

    if (healthyInstances.length === 0) {
      return null;
    }

    // Round-robin with weights
    let selectedInstance = null;
    let minRequests = Infinity;

    for (const instance of healthyInstances) {
      const weightedRequests = instance.requests / (instance.weight || 1);
      if (weightedRequests < minRequests) {
        minRequests = weightedRequests;
        selectedInstance = instance;
      }
    }

    if (selectedInstance) {
      selectedInstance.requests++;
    }

    return selectedInstance;
  }

  getHealthyInstances() {
    return this.instances.filter((instance) => instance.healthy);
  }

  updateInstanceHealth(url, healthy) {
    const instance = this.instances.find((i) => i.url === url);
    if (instance) {
      instance.healthy = healthy;
      instance.lastHealthCheck = Date.now();
    }
  }

  markInstanceUnhealthy(url) {
    this.updateInstanceHealth(url, false);
  }
}

/**
 * Redis Store for rate limiting (if Redis is available)
 */
class RedisStore {
  constructor(redisClient) {
    this.client = redisClient;
  }

  async incr(key) {
    try {
      return await this.client.incr(key);
    } catch (error) {
      console.error('Redis incr error:', error);
      return 1;
    }
  }

  async expire(key, seconds) {
    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      console.error('Redis expire error:', error);
    }
  }
}

module.exports = APIGateway;
