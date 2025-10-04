const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const logger = require('../utils/logger');

let redis = null;

// Initialize Redis if available
try {
  if (process.env.REDIS_HOST) {
    const Redis = require('ioredis');
    redis = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0,
      lazyConnect: true,
      retryStrategy: () => null, // Don't retry for health check
      maxRetriesPerRequest: 1
    });
  }
} catch (error) {
  logger.warn('Redis not configured for health checks');
}

// Basic health check - fast response
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  };

  res.status(200).json(health);
});

// Detailed health check with dependency status
router.get('/health/detailed', async (req, res) => {
  const startTime = Date.now();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    checks: {}
  };

  // MongoDB health check
  try {
    const mongoState = mongoose.connection.readyState;
    const stateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    if (mongoState === 1) {
      const pingStart = Date.now();
      await mongoose.connection.db.admin().ping();
      const latency = Date.now() - pingStart;
      
      health.checks.mongodb = {
        status: 'healthy',
        state: 'connected',
        latency: `${latency}ms`,
        host: mongoose.connection.host,
        database: mongoose.connection.name
      };
    } else {
      health.checks.mongodb = {
        status: 'unhealthy',
        state: stateMap[mongoState] || 'unknown',
        error: 'Database not connected'
      };
      health.status = 'degraded';
    }
  } catch (error) {
    health.checks.mongodb = {
      status: 'unhealthy',
      error: error.message
    };
    health.status = 'degraded';
  }

  // Redis health check
  if (redis) {
    try {
      const pingStart = Date.now();
      await redis.ping();
      const latency = Date.now() - pingStart;
      
      health.checks.redis = {
        status: 'healthy',
        latency: `${latency}ms`
      };
    } catch (error) {
      health.checks.redis = {
        status: 'unhealthy',
        error: error.message
      };
      // Redis failure is non-critical, don't mark as degraded
    }
  } else {
    health.checks.redis = {
      status: 'disabled',
      note: 'Redis not configured'
    };
  }

  // Memory health check
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const rssMB = Math.round(memUsage.rss / 1024 / 1024);
  const heapPercentage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

  health.checks.memory = {
    status: heapPercentage < 90 ? 'healthy' : 'warning',
    heapUsed: `${heapUsedMB}MB`,
    heapTotal: `${heapTotalMB}MB`,
    heapUsage: `${heapPercentage}%`,
    rss: `${rssMB}MB`
  };

  if (heapPercentage >= 90) {
    health.status = 'warning';
  }

  // CPU usage (approximate)
  const cpuUsage = process.cpuUsage();
  health.checks.cpu = {
    status: 'healthy',
    user: `${Math.round(cpuUsage.user / 1000)}ms`,
    system: `${Math.round(cpuUsage.system / 1000)}ms`
  };

  // Overall response time
  health.responseTime = `${Date.now() - startTime}ms`;

  // Determine HTTP status code
  const statusCode = health.status === 'healthy' ? 200 : 
                     health.status === 'warning' ? 200 : 
                     health.status === 'degraded' ? 503 : 500;

  res.status(statusCode).json(health);
});

// Kubernetes liveness probe handler
const livenessHandler = (req, res) => {
  // Simple check: is the process alive?
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
};

// Kubernetes readiness probe handler
const readinessHandler = async (req, res) => {
  // Check if critical dependencies are ready
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: 'not ready',
        reason: 'Database not connected',
        timestamp: new Date().toISOString()
      });
    }

    // Quick ping to verify database is responsive
    await mongoose.connection.db.admin().ping();

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      reason: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Kubernetes liveness probe (multiple paths for compatibility)
router.get('/health/live', livenessHandler);
router.get('/health/liveness', livenessHandler);

// Kubernetes readiness probe (multiple paths for compatibility)
router.get('/health/ready', readinessHandler);
router.get('/health/readiness', readinessHandler);

// Startup probe (for slow-starting applications)
router.get('/health/startup', async (req, res) => {
  try {
    // Check if application has fully started
    const isStarted = mongoose.connection.readyState === 1;
    
    if (isStarted) {
      res.status(200).json({
        status: 'started',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'starting',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'starting',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
