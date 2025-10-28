const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000, // Default 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // Default 100 requests
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            error: 'Too many requests from this IP, please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: req.rateLimit.resetTime
        });
    },
    skip: (req) => {
        // Skip rate limiting for health check
        return req.path === '/api/health';
    }
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
    windowMs: (parseInt(process.env.AUTH_RATE_LIMIT_WINDOW) || 15) * 60 * 1000, // 15 minutes
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5, // 5 attempts
    message: {
        success: false,
        error: 'Too many authentication attempts, please try again later.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Auth rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
        res.status(429).json({
            success: false,
            error: 'Too many authentication attempts from this IP. Please try again later.',
            code: 'AUTH_RATE_LIMIT_EXCEEDED',
            retryAfter: req.rateLimit.resetTime
        });
    }
});

/**
 * Strict rate limiter for password reset endpoints
 */
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: {
        success: false,
        error: 'Too many password reset attempts, please try again later.',
        code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Password reset rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            error: 'Too many password reset attempts. Please try again in an hour.',
            code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
            retryAfter: req.rateLimit.resetTime
        });
    }
});

/**
 * Rate limiter for file uploads
 */
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 uploads
    message: {
        success: false,
        error: 'Too many upload attempts, please try again later.',
        code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    apiLimiter,
    authLimiter,
    passwordResetLimiter,
    uploadLimiter
};
