/**
 * Security Configuration
 * Helmet, CORS, Rate Limiting, and other security middleware
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cors = require('cors');
const logger = require('../utils/logger');

/**
 * General API rate limiter
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('user-agent')
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true, // Don't count successful logins
  message: 'Too many login attempts, please try again later',
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      email: req.body.email || req.body.username,
      userAgent: req.get('user-agent')
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many login attempts, please try again later',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Rate limiter for password reset endpoints
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: 'Too many password reset attempts',
  handler: (req, res) => {
    logger.warn('Password reset rate limit exceeded', {
      ip: req.ip,
      email: req.body.email,
      userAgent: req.get('user-agent')
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many password reset attempts, please try again later'
    });
  }
});

/**
 * Rate limiter for API creation endpoints
 */
const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 creates per minute
  message: 'Too many create requests'
});

/**
 * Helmet configuration for security headers
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", 'https:', 'wss:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  
  crossOriginEmbedderPolicy: false, // Allow embedding for iframe support
  
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  noSniff: true,
  
  frameguard: {
    action: 'deny' // Prevent clickjacking
  },
  
  xssFilter: true,
  
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
});

/**
 * CORS configuration
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'https://tradeai.gonxt.tech',
      'http://localhost:5173', // Vite dev server
      /\.gonxt\.tech$/,
      /\.all-hands\.dev$/ // For testing environments
    ];
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      }
      return allowed.test(origin);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Company-ID',
    'X-Request-ID'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

/**
 * MongoDB sanitization to prevent NoSQL injection
 */
const mongoSanitizeConfig = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn('MongoDB injection attempt detected', {
      ip: req.ip,
      key,
      path: req.path
    });
  }
});

/**
 * HTTP Parameter Pollution prevention
 */
const hppConfig = hpp({
  whitelist: [
    'filter',
    'sort',
    'page',
    'limit',
    'search',
    'status',
    'type',
    'category',
    'startDate',
    'endDate'
  ]
});

/**
 * Trusted proxy configuration
 */
const trustProxy = (req, res, next) => {
  req.app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
  next();
};

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Add request ID for tracking
  req.id = req.get('X-Request-ID') || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.id);
  
  next();
};

/**
 * Content-Type validation
 */
const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    
    if (!contentType || (!contentType.includes('application/json') && !contentType.includes('multipart/form-data'))) {
      return res.status(400).json({
        success: false,
        error: 'Content-Type must be application/json or multipart/form-data'
      });
    }
  }
  
  next();
};

/**
 * Apply all security middleware
 */
const applySecurityMiddleware = (app) => {
  // Trust proxy
  app.use(trustProxy);
  
  // Helmet security headers
  app.use(helmetConfig);
  
  // Custom security headers
  app.use(securityHeaders);
  
  // CORS
  app.use(cors(corsOptions));
  
  // MongoDB sanitization
  app.use(mongoSanitizeConfig);
  
  // HPP protection
  app.use(hppConfig);
  
  // Content-Type validation
  app.use(validateContentType);
  
  logger.info('Security middleware applied');
};

module.exports = {
  limiter,
  authLimiter,
  passwordResetLimiter,
  createLimiter,
  helmetConfig,
  corsOptions,
  mongoSanitizeConfig,
  hppConfig,
  trustProxy,
  securityHeaders,
  validateContentType,
  applySecurityMiddleware
};
