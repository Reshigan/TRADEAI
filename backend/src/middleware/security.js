/**
 * Security middleware for Trade AI platform
 * Provides enhanced security features including input validation, rate limiting,
 * CSRF protection, and security headers.
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
const cors = require('cors');
const validator = require('validator');
const crypto = require('crypto');
const { body, validationResult, matchedData } = require('express-validator');
const mongoSanitize = require('express-mongo-sanitize');

/**
 * Configure security middleware for Express app
 * @param {Object} app - Express app
 * @param {Object} config - Configuration options
 */
const configureSecurityMiddleware = (app, config = {}) => {
  // Set security HTTP headers
  app.use(helmet());

  // Enable CORS with options
  const corsOptions = config.cors || {
    origin: ['http://localhost:3000', 'https://trade-ai.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
  };
  app.use(cors(corsOptions));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimitWindow || 15 * 60 * 1000, // 15 minutes
    max: config.rateLimitMax || 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/api/', limiter);

  // Prevent parameter pollution
  app.use(hpp({
    whitelist: config.hppWhitelist || [
      'sort', 'fields', 'page', 'limit', 'expand', 'filter'
    ]
  }));

  // Data sanitization against NoSQL injection
  app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`Sanitized request data at key: ${key}`);
    }
  }));

  // XSS protection is handled by express-validator sanitizers in route handlers
  // CSRF protection note: For API-first applications with JWT auth, CSRF is mitigated by:
  // 1. Not using cookies for auth tokens
  // 2. Using custom headers (Authorization) which can't be set by attackers
  // 3. SameSite cookie attributes when cookies are used
  // If CSRF tokens are needed, implement per-route with a modern alternative like csrf-csrf

  // Content Security Policy
  if (config.enableCsp !== false) {
    app.use(helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
        imgSrc: ["'self'", 'data:', 'cdn.jsdelivr.net'],
        connectSrc: ["'self'", 'api.trade-ai.com'],
        fontSrc: ["'self'", 'cdn.jsdelivr.net'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        ...(config.cspDirectives || {})
      }
    }));
  }

  // Add security headers
  app.use((req, res, next) => {
    // Strict Transport Security
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Clickjacking protection
    res.setHeader('X-Frame-Options', 'DENY');

    // XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Feature policy
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    next();
  });
};

/**
 * Validate request data
 * @param {string} type - Validation type (e.g., 'user', 'product', 'login')
 * @returns {Array} - Array of validation middleware
 */
const validateRequest = (type) => {
  switch (type) {
    case 'login':
      return [
        body('email')
          .isEmail().withMessage('Please provide a valid email')
          .normalizeEmail()
          .trim(),
        body('password')
          .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
          .not().isEmpty().withMessage('Password is required')
      ];

    case 'user':
      return [
        body('name')
          .not().isEmpty().withMessage('Name is required')
          .trim()
          .escape()
          .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
        body('email')
          .isEmail().withMessage('Please provide a valid email')
          .normalizeEmail()
          .custom(async (email, { req }) => {
            // In a real implementation, check if email already exists in database
            if (email === 'test@example.com' && req.params.id !== '123') {
              throw new Error('Email already in use');
            }
          }),
        body('password')
          .if(body('password').exists())
          .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
          .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/).withMessage('Password must contain at least one number, one uppercase letter, one lowercase letter, and one special character')
      ];

    case 'product':
      return [
        body('name')
          .not().isEmpty().withMessage('Product name is required')
          .trim()
          .escape()
          .isLength({ min: 2, max: 100 }).withMessage('Product name must be between 2 and 100 characters'),
        body('price')
          .isNumeric().withMessage('Price must be a number')
          .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        body('category')
          .not().isEmpty().withMessage('Category is required')
          .trim()
          .escape()
      ];

    case 'promotion':
      return [
        body('name')
          .not().isEmpty().withMessage('Promotion name is required')
          .trim()
          .escape(),
        body('startDate')
          .isISO8601().withMessage('Start date must be a valid date')
          .toDate(),
        body('endDate')
          .isISO8601().withMessage('End date must be a valid date')
          .toDate()
          .custom((endDate, { req }) => {
            if (endDate <= req.body.startDate) {
              throw new Error('End date must be after start date');
            }
            return true;
          }),
        body('discount')
          .isNumeric().withMessage('Discount must be a number')
          .isFloat({ min: 0, max: 100 }).withMessage('Discount must be between 0 and 100')
      ];

    default:
      return [];
  }
};

/**
 * Handle validation errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Sanitize user input
 * @param {Object} data - Data to sanitize
 * @returns {Object} - Sanitized data
 */
const sanitizeInput = (data) => {
  const sanitized = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Sanitize strings
      sanitized[key] = validator.escape(value.trim());
    } else if (Array.isArray(value)) {
      // Sanitize arrays
      sanitized[key] = value.map((item) =>
        typeof item === 'string' ? validator.escape(item.trim()) : item
      );
    } else if (value && typeof value === 'object') {
      // Recursively sanitize objects
      sanitized[key] = sanitizeInput(value);
    } else {
      // Keep other types as is
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Generate secure random token
 * @param {number} length - Token length
 * @returns {string} - Random token
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash password securely
 * @param {string} password - Password to hash
 * @returns {string} - Hashed password
 */
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

/**
 * Verify password against hash
 * @param {string} password - Password to verify
 * @param {string} hashedPassword - Stored hash
 * @returns {boolean} - Whether password matches
 */
const verifyPassword = (password, hashedPassword) => {
  const [salt, storedHash] = hashedPassword.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return storedHash === hash;
};

/**
 * Middleware to detect and block common attack patterns
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const detectAttackPatterns = (req, res, next) => {
  // Check for SQL injection patterns
  const sqlPatterns = [
    /(%27)|(')|(--)|(%23)|(#)/i,
    /((%3D)|(=))[^\n]*((%27)|(')|(--)|(%3B)|(;))/i,
    /\w*((%27)|(')){((%6F)|o|(%4F))((%72)|r|(%52))/i,
    /((%27)|(')){union/i
  ];

  // Check for NoSQL injection patterns
  const noSqlPatterns = [
    /\{\s*\$\w+\s*:/i,
    /\$\w+\s*:/i
  ];

  // Check for path traversal
  const pathTraversalPatterns = [
    /(\.\.\/)/i,
    /(\.\.\\)/i,
    /(%2e%2e%2f)/i,
    /(%252e%252e%252f)/i,
    /(%c0%ae%c0%ae%c0%af)/i
  ];

  // Check request parameters
  const checkParams = (obj) => {
    if (!obj) return false;

    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        const value = obj[key];

        // Check SQL injection patterns
        for (const pattern of sqlPatterns) {
          if (pattern.test(value)) {
            return true;
          }
        }

        // Check NoSQL injection patterns
        for (const pattern of noSqlPatterns) {
          if (pattern.test(value)) {
            return true;
          }
        }

        // Check path traversal patterns
        for (const pattern of pathTraversalPatterns) {
          if (pattern.test(value)) {
            return true;
          }
        }
      } else if (typeof obj[key] === 'object') {
        if (checkParams(obj[key])) {
          return true;
        }
      }
    }

    return false;
  };

  if (
    checkParams(req.query) ||
    checkParams(req.body) ||
    checkParams(req.params)
  ) {
    return res.status(403).json({
      status: 'error',
      message: 'Potential security attack detected'
    });
  }

  next();
};

/**
 * Strict rate limiter for file upload endpoints
 * Prevents abuse of resource-intensive file operations
 */
const fileUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 file uploads per 15 minutes
  message: {
    status: 'error',
    message: 'Too many file uploads from this IP. Please try again later.',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests
  skipFailedRequests: false,
  // Custom key generator to track by IP and user
  keyGenerator: (req) => {
    return req.ip + (req.user?.id ? `-${req.user.id}` : '');
  }
});

/**
 * Stricter rate limiter for bulk operations
 * Even more restrictive for bulk data operations
 */
const bulkOperationsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit to 10 bulk operations per hour
  message: {
    status: 'error',
    message: 'Too many bulk operations. Please try again in an hour.',
    retryAfter: 60 * 60 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    return req.ip + (req.user?.id ? `-${req.user.id}` : '');
  }
});

module.exports = {
  configureSecurityMiddleware,
  validateRequest,
  handleValidationErrors,
  sanitizeInput,
  generateSecureToken,
  hashPassword,
  verifyPassword,
  detectAttackPatterns,
  fileUploadLimiter,
  bulkOperationsLimiter
};
