const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// General API rate limiter - prevents DDoS and abuse
exports.apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests, please slow down.',
      message: `You have exceeded the rate limit. Please try again after ${req.rateLimit.resetTime}`
    });
  }
});

// Strict limiter for authentication endpoints - prevents brute force attacks
// Disable in development/test environments for easier testing
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
exports.authLimiter = isDevelopment
  ? (req, res, next) => next() // Bypass in development
  : rateLimit({
    windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 5, // Only 5 attempts per window
    skipSuccessfulRequests: true, // Don't count successful logins
    skipFailedRequests: false, // Count failed attempts
    message: {
      success: false,
      error: 'Too many authentication attempts. Please try again after 15 minutes.',
      securityNote: 'Your IP has been temporarily blocked due to multiple failed login attempts.'
    },
    handler: (req, res) => {
      // Log security event
      console.warn(`🔐 Rate limit exceeded for authentication: IP=${req.ip}, Path=${req.path}`);

      res.status(429).json({
        success: false,
        error: 'Too many login attempts.',
        message: 'For security reasons, your account has been temporarily locked. Please try again after 15 minutes.',
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      });
    }
  });

// Speed limiter - slows down requests instead of blocking (softer approach)
exports.speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per window at full speed
  delayMs: () => 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  skipFailedRequests: false,
  skipSuccessfulRequests: false
});

// Strict limiter for data export/download (prevents data scraping)
exports.exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Only 10 exports per hour
  message: {
    success: false,
    error: 'Export limit reached. Please try again later.',
    limit: '10 exports per hour'
  },
  standardHeaders: true,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Export rate limit exceeded.',
      message: 'You have reached the maximum number of exports allowed per hour. Please try again later.',
      resetTime: new Date(req.rateLimit.resetTime).toISOString()
    });
  }
});

// Limiter for password reset (prevents abuse)
exports.passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 password reset requests per hour
  skipSuccessfulRequests: false,
  message: {
    success: false,
    error: 'Too many password reset requests. Please try again later.'
  },
  handler: (req, res) => {
    console.warn(`🔐 Password reset rate limit exceeded: IP=${req.ip}, Email=${req.body.email}`);

    res.status(429).json({
      success: false,
      error: 'Password reset limit reached.',
      message: 'For security reasons, you can only request a password reset 3 times per hour.',
      retryAfter: '1 hour'
    });
  }
});

// Create custom rate limiter
exports.createLimiter = (windowMs, max, message = 'Rate limit exceeded') => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// IP-based request logger for security monitoring
exports.requestLogger = (req, res, next) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress,
    method: req.method,
    path: req.path,
    userAgent: req.get('user-agent'),
    tenantId: req.user?.tenantId || 'anonymous'
  };

  // Log suspicious patterns
  if (req.path.includes('../') || req.path.includes('..\\')) {
    console.warn('⚠️  Suspicious path traversal attempt:', logEntry);
  }

  next();
};
