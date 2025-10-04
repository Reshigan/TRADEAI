# 🔐 TRADEAI Production Security Configuration Guide

**Last Updated:** October 3, 2025  
**Version:** 1.0.0  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [Environment Variables Setup](#1-environment-variables-setup)
2. [JWT Secret Generation](#2-jwt-secret-generation)
3. [API Rate Limiting](#3-api-rate-limiting)
4. [CORS Configuration](#4-cors-configuration)
5. [Error Tracking with Sentry](#5-error-tracking-with-sentry)
6. [Health Check Monitoring](#6-health-check-monitoring)
7. [Redis Caching](#7-redis-caching)
8. [SSL/HTTPS Setup](#8-sslhttps-setup)
9. [Security Headers](#9-security-headers)
10. [Database Security](#10-database-security)

---

## 1. Environment Variables Setup

### Step 1: Copy Production Template

```bash
cd /workspace/project/TRADEAI/backend
cp .env.production.template .env.production
```

### Step 2: Generate Strong Secrets

Generate cryptographically secure secrets for production:

```bash
# JWT_SECRET (128 characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# JWT_REFRESH_SECRET (different from JWT_SECRET)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# ENCRYPTION_KEY (32 bytes for AES-256)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Update Production Values

Edit `.env.production` and replace ALL `[REPLACE_*]` placeholders with actual values:

```env
JWT_SECRET=<paste_generated_secret_here>
JWT_REFRESH_SECRET=<paste_different_secret_here>
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tradeai
REDIS_HOST=your-redis-host.com
REDIS_PASSWORD=<strong_redis_password>
CORS_ORIGINS=https://yourdomain.com
```

### Step 4: Validate Configuration

```bash
# Verify all required variables are set
node -e "
const dotenv = require('dotenv');
dotenv.config({ path: '.env.production' });

const required = ['JWT_SECRET', 'MONGODB_URI', 'REDIS_HOST', 'CORS_ORIGINS'];
const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required variables:', missing);
  process.exit(1);
} else {
  console.log('✅ All required variables are set');
}
"
```

---

## 2. JWT Secret Generation

### Requirements

- **Minimum Length:** 64 characters (128 recommended)
- **Entropy:** Cryptographically secure random bytes
- **Uniqueness:** Different secrets for JWT and refresh tokens

### Generation Script

```javascript
// save as generate-secrets.js
const crypto = require('crypto');

console.log('═══════════════════════════════════════');
console.log('   JWT SECRET GENERATION');
console.log('═══════════════════════════════════════\n');

console.log('JWT_SECRET:');
console.log(crypto.randomBytes(64).toString('hex'));
console.log('\n');

console.log('JWT_REFRESH_SECRET:');
console.log(crypto.randomBytes(64).toString('hex'));
console.log('\n');

console.log('SESSION_SECRET:');
console.log(crypto.randomBytes(64).toString('hex'));
console.log('\n');

console.log('ENCRYPTION_KEY (32 bytes for AES-256):');
console.log(crypto.randomBytes(32).toString('hex'));
console.log('\n═══════════════════════════════════════\n');
```

Run: `node generate-secrets.js`

---

## 3. API Rate Limiting

### Installation

```bash
cd backend
npm install express-rate-limit express-slow-down
```

### Implementation

Create `backend/src/middleware/rateLimiter.js`:

```javascript
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// General API rate limiter
exports.apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Store in Redis for distributed systems
  store: process.env.REDIS_HOST ? getRedisStore() : undefined
});

// Strict limiter for authentication endpoints
exports.authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 5,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: 'Too many login attempts. Please try again after 15 minutes.'
  }
});

// Speed limiter (slows down requests instead of blocking)
exports.speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: () => 500,
  maxDelayMs: 20000
});

// Redis store for distributed rate limiting
function getRedisStore() {
  const RedisStore = require('rate-limit-redis');
  const Redis = require('ioredis');
  
  const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB || 0
  });
  
  return new RedisStore({
    client: redisClient,
    prefix: 'rl:'
  });
}
```

### Usage in app.js

```javascript
const { apiLimiter, authLimiter, speedLimiter } = require('./middleware/rateLimiter');

// Apply to all API routes
app.use('/api/', apiLimiter);
app.use('/api/', speedLimiter);

// Apply strict limiter to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
```

---

## 4. CORS Configuration

### Production CORS Setup

Update `backend/src/app.js`:

```javascript
const cors = require('cors');

// Production CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:3000'];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
```

### Environment Variable

```env
# Single domain
CORS_ORIGINS=https://yourdomain.com

# Multiple domains
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://app.yourdomain.com
```

---

## 5. Error Tracking with Sentry

### Installation

```bash
cd backend
npm install @sentry/node @sentry/profiling-node
```

### Configuration

Create `backend/src/config/sentry.js`:

```javascript
const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

function initSentry(app) {
  if (process.env.SENTRY_ENABLED === 'true' && process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT || 'production',
      release: process.env.SENTRY_RELEASE || '1.0.0',
      
      // Performance monitoring
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
      
      // Profiling
      profilesSampleRate: 0.1,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app }),
        new ProfilingIntegration(),
      ],
      
      // Filtering
      beforeSend(event, hint) {
        // Don't send errors from health checks
        if (event.request && event.request.url && event.request.url.includes('/health')) {
          return null;
        }
        
        // Sanitize sensitive data
        if (event.request && event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        
        return event;
      },
      
      // Don't capture specific errors
      ignoreErrors: [
        'ValidationError',
        'CastError',
        /timeout/i
      ]
    });
    
    console.log('✅ Sentry error tracking initialized');
  } else {
    console.log('⚠️  Sentry disabled (SENTRY_ENABLED=false or no DSN)');
  }
}

module.exports = { initSentry, Sentry };
```

### Usage in app.js

```javascript
const { initSentry, Sentry } = require('./config/sentry');

// Initialize Sentry BEFORE all other middleware
initSentry(app);

// Request handler must be the first middleware
app.use(Sentry.Handlers.requestHandler());

// Tracing handler
app.use(Sentry.Handlers.tracingHandler());

// ... your routes ...

// Error handler must be AFTER all routes
app.use(Sentry.Handlers.errorHandler());
```

### Get Sentry DSN

1. Sign up at https://sentry.io
2. Create a new project
3. Get your DSN from Project Settings > Client Keys
4. Add to `.env.production`:

```env
SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project]
SENTRY_ENVIRONMENT=production
SENTRY_ENABLED=true
```

---

## 6. Health Check Monitoring

### Enhanced Health Check

Update `backend/src/routes/health.js`:

```javascript
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Redis = require('ioredis');

let redis;
if (process.env.REDIS_HOST) {
  redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    lazyConnect: true
  });
}

router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    checks: {}
  };

  // MongoDB check
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      health.checks.mongodb = { status: 'healthy', latency: 0 };
    } else {
      health.checks.mongodb = { status: 'disconnected' };
      health.status = 'degraded';
    }
  } catch (error) {
    health.checks.mongodb = { status: 'unhealthy', error: error.message };
    health.status = 'degraded';
  }

  // Redis check
  if (redis) {
    try {
      const start = Date.now();
      await redis.ping();
      health.checks.redis = { 
        status: 'healthy', 
        latency: Date.now() - start 
      };
    } catch (error) {
      health.checks.redis = { status: 'unhealthy', error: error.message };
      // Redis failure is non-critical
    }
  } else {
    health.checks.redis = { status: 'disabled' };
  }

  // Memory check
  const memUsage = process.memoryUsage();
  health.checks.memory = {
    status: 'healthy',
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
  };

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Liveness probe (for Kubernetes)
router.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// Readiness probe (for Kubernetes)
router.get('/health/ready', async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready' });
  }
});

module.exports = router;
```

### Automated Monitoring

Use tools like:
- **UptimeRobot** (free): https://uptimerobot.com
- **Pingdom**
- **DataDog**
- **New Relic**

Configure to hit: `https://api.yourdomain.com/health` every 1-5 minutes.

---

## 7. Redis Caching

### Installation

```bash
npm install ioredis
```

### Redis Configuration

Create `backend/src/config/redis.js`:

```javascript
const Redis = require('ioredis');

let redisClient = null;

function initRedis() {
  if (!process.env.REDIS_HOST) {
    console.log('⚠️  Redis not configured, caching disabled');
    return null;
  }

  const redisConfig = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'tradeai:',
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false
  };

  // Enable TLS for production
  if (process.env.REDIS_TLS === 'true') {
    redisConfig.tls = {};
  }

  redisClient = new Redis(redisConfig);

  redisClient.on('connect', () => {
    console.log('✅ Redis connected');
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis error:', err.message);
  });

  redisClient.on('close', () => {
    console.log('⚠️  Redis connection closed');
  });

  return redisClient;
}

function getRedis() {
  return redisClient;
}

// Cache middleware
function cacheMiddleware(duration = 300) {
  return async (req, res, next) => {
    if (!redisClient || req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      const cached = await redisClient.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Store original send function
      const originalSend = res.json.bind(res);

      // Override send to cache the response
      res.json = function(data) {
        redisClient.setex(key, duration, JSON.stringify(data));
        originalSend(data);
      };

      next();
    } catch (error) {
      console.error('Cache error:', error);
      next();
    }
  };
}

module.exports = {
  initRedis,
  getRedis,
  cacheMiddleware
};
```

### Usage

```javascript
// In app.js
const { initRedis } = require('./config/redis');
initRedis();

// In routes
const { cacheMiddleware } = require('../config/redis');

// Cache for 5 minutes
router.get('/api/analytics/dashboard', 
  cacheMiddleware(300), 
  analyticsController.getDashboard
);
```

---

## 8. SSL/HTTPS Setup

### Option 1: Using Reverse Proxy (Recommended)

Use Nginx or Apache as reverse proxy to handle SSL:

**Nginx Configuration:**

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:5002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Let's Encrypt (Free SSL)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## 9. Security Headers

### Using Helmet.js

```bash
npm install helmet
```

### Configuration

```javascript
const helmet = require('helmet');

if (process.env.HELMET_ENABLED === 'true') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: parseInt(process.env.HSTS_MAX_AGE) || 31536000,
      includeSubDomains: true,
      preload: true
    },
    referrerPolicy: { policy: 'same-origin' },
    noSniff: true,
    xssFilter: true
  }));
}
```

---

## 10. Database Security

### MongoDB Security Checklist

- ✅ Enable authentication
- ✅ Use SSL/TLS connections
- ✅ Create separate users with minimal permissions
- ✅ Enable audit logging
- ✅ Regular backups
- ✅ Network isolation (VPC/firewall)

### Connection String (Production)

```env
MONGODB_URI=mongodb+srv://tradeai_app:PASSWORD@cluster.mongodb.net/tradeai?retryWrites=true&w=majority&ssl=true&authSource=admin
```

### Backup Strategy

```bash
# Daily automated backup
0 3 * * * mongodump --uri="MONGODB_URI" --out=/backups/$(date +\%Y\%m\%d) --gzip
```

---

## 🔐 Pre-Deployment Security Checklist

Before deploying to production, verify:

- [ ] All environment variables in `.env.production` are set
- [ ] JWT secrets are strong (128+ characters) and unique
- [ ] CORS origins restricted to production domain only
- [ ] Rate limiting enabled on all API routes
- [ ] Sentry or error tracking configured
- [ ] Health check endpoint tested and monitored
- [ ] Redis caching configured (optional but recommended)
- [ ] SSL/HTTPS enabled and tested
- [ ] Security headers (Helmet) enabled
- [ ] MongoDB using authentication and SSL
- [ ] File upload limits configured
- [ ] Logging configured to persistent storage
- [ ] Backup strategy implemented
- [ ] `.env.production` added to .gitignore
- [ ] Secrets not committed to version control

---

## 📞 Support

For questions or issues, contact:
- **Email:** devops@yourdomain.com
- **Slack:** #tradeai-production

---

**Status:** ✅ Ready for Production Deployment
