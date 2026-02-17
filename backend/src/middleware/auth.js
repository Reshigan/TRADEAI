const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const logger = require('../utils/logger');
const crypto = require('crypto');
const { SecurityAuditLogger } = require('../utils/security-audit');
const { cacheService } = require('../services/cacheService');

// Initialize security logger
const securityLogger = new SecurityAuditLogger({
  logDir: process.env.SECURITY_LOG_DIR || './logs/security',
  logLevel: process.env.SECURITY_LOG_LEVEL || 'info'
});

// Authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {

    // Get token from authorization header or cookies
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      securityLogger.logAuth({ id: 'unknown' }, 'access', false, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.originalUrl,
        method: req.method,
        reason: 'No token provided'
      });

      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'] // Explicitly specify algorithm
    });

    // Check if token is in blacklist
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      securityLogger.logAuth({ id: decoded.userId || decoded._id || 'unknown' }, 'access', false, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.originalUrl,
        method: req.method,
        reason: 'Token is blacklisted'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }

    // Get user from database
    const userId = decoded.userId || decoded._id; // Support both userId and _id for compatibility

    const user = await User.findById(userId)
      .populate('companyId', 'name code currency');

    if (!user) {
      securityLogger.logAuth({ id: userId || 'unknown' }, 'access', false, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.originalUrl,
        method: req.method,
        reason: 'User not found'
      });

      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      securityLogger.logAuth(user, 'access', false, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.originalUrl,
        method: req.method,
        reason: 'Account is deactivated'
      });

      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check if password was changed after token was issued
    if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat)) {
      securityLogger.logAuth(user, 'access', false, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.originalUrl,
        method: req.method,
        reason: 'Password changed after token issued'
      });

      return res.status(401).json({
        success: false,
        message: 'Password recently changed. Please login again.'
      });
    }

    // Check for suspicious activity
    const isSuspicious = await checkForSuspiciousActivity(user, req);
    if (isSuspicious) {
      securityLogger.logSecurityViolation('suspicious_activity', 'Suspicious activity detected', {
        userId: user._id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.originalUrl,
        method: req.method
      });

      // In a real implementation, you might want to:
      // 1. Force re-authentication
      // 2. Require 2FA
      // 3. Lock the account
      // 4. Send notification to user and admin

      // For now, we'll just log it and continue
    }

    // Log successful authentication
    securityLogger.logAuth(user, 'access', true, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.originalUrl,
      method: req.method
    });

    // Add user and token to request
    req.user = user;
    req.token = token;
    req.tenantId = user.tenantId; // Add tenantId for easy access
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      securityLogger.logAuth({ id: 'unknown' }, 'access', false, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.originalUrl,
        method: req.method,
        error: 'Invalid token'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      securityLogger.logAuth({ id: 'unknown' }, 'access', false, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.originalUrl,
        method: req.method,
        error: 'Token expired'
      });

      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    // Log other errors
    logger.error('Authentication error:', error);
    securityLogger.error('Authentication error', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.originalUrl,
      method: req.method,
      error: error.message
    });

    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Check if user has required role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      securityLogger.logAccess({ id: 'unknown' }, req.originalUrl, req.method, false, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        reason: 'No authenticated user'
      });

      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Flatten roles array if it's nested (e.g., [['admin', 'user']] -> ['admin', 'user'])
    const allowedRoles = roles.flat();

    if (!allowedRoles.includes(req.user.role)) {
      // Log unauthorized access attempt
      logger.warn('Unauthorized access attempt', {
        userId: req.user._id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path
      });

      // Log to security audit
      securityLogger.logAccess(req.user, req.originalUrl, req.method, false, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });

      // Check for repeated unauthorized access attempts
      checkForRepeatedUnauthorizedAccess(req.user, req);

      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    // Log successful authorization
    securityLogger.logAccess(req.user, req.originalUrl, req.method, true, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      requiredRoles: roles,
      userRole: req.user.role
    });

    next();
  };
};

/**
 * Check for repeated unauthorized access attempts
 * @param {Object} user - User object
 * @param {Object} req - Express request object
 */
const checkForRepeatedUnauthorizedAccess = (user, req) => {
  // In a real implementation, this would:
  // 1. Track unauthorized access attempts in a database or cache
  // 2. Implement a threshold for suspicious activity
  // 3. Take action when threshold is exceeded (e.g., lock account, require 2FA)

  // For now, we'll just log a warning if this is a sensitive endpoint
  const sensitiveEndpoints = [
    '/api/users',
    '/api/settings',
    '/api/admin',
    '/api/reports'
  ];

  if (sensitiveEndpoints.some((endpoint) => req.originalUrl.startsWith(endpoint))) {
    securityLogger.warn('Repeated access attempt to sensitive endpoint', {
      userId: user._id,
      userRole: user.role,
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
  }
};

// Check if user has specific permission
const checkPermission = (module, action) => {
  return (req, res, next) => {
    if (!req.user) {
      securityLogger.logAccess({ id: 'unknown' }, req.originalUrl, req.method, false, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        reason: 'No authenticated user',
        module,
        action
      });

      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has permission
    const hasPermission = req.user.hasPermission ?
      req.user.hasPermission(module, action) :
      false;

    if (!hasPermission) {
      // Log permission denied
      logger.warn('Permission denied', {
        userId: req.user._id,
        module,
        action,
        path: req.path
      });

      // Log to security audit
      securityLogger.logAccess(req.user, req.originalUrl, req.method, false, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        module,
        action,
        reason: 'Permission denied'
      });

      // Check for repeated permission denials
      checkForRepeatedPermissionDenials(req.user, req, module, action);

      return res.status(403).json({
        success: false,
        message: `Permission denied for ${module}:${action}`
      });
    }

    // Log successful permission check
    securityLogger.logAccess(req.user, req.originalUrl, req.method, true, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      module,
      action
    });

    next();
  };
};

/**
 * Check for repeated permission denials
 * @param {Object} user - User object
 * @param {Object} req - Express request object
 * @param {string} module - Permission module
 * @param {string} action - Permission action
 */
const checkForRepeatedPermissionDenials = (user, req, module, action) => {
  // In a real implementation, this would:
  // 1. Track permission denials in a database or cache
  // 2. Implement a threshold for suspicious activity
  // 3. Take action when threshold is exceeded

  // For now, we'll just log a warning for sensitive permissions
  const sensitivePermissions = [
    { module: 'users', action: 'create' },
    { module: 'users', action: 'update' },
    { module: 'users', action: 'delete' },
    { module: 'settings', action: 'update' },
    { module: 'admin', action: 'access' }
  ];

  const isSensitive = sensitivePermissions.some(
    (p) => p.module === module && p.action === action
  );

  if (isSensitive) {
    securityLogger.warn('Repeated permission denial for sensitive operation', {
      userId: user._id,
      userRole: user.role,
      module,
      action,
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
  }
};

// Check if user can access specific customer
const authorizeCustomer = (req, res, next) => {
  try {
    const customerId = req.params.customerId || req.body.customerId;

    if (!customerId) {
      return next();
    }

    // Admin and board can access all customers
    if (['admin', 'board', 'director'].includes(req.user.role)) {
      return next();
    }

    // Check if user is assigned to this customer
    const isAssigned = req.user.assignedCustomers.some(
      (customer) => customer._id.toString() === customerId
    );

    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this customer'
      });
    }

    next();
  } catch (error) {
    logger.error('Customer authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization error'
    });
  }
};

// Check if user can access specific vendor
const authorizeVendor = (req, res, next) => {
  try {
    const vendorId = req.params.vendorId || req.body.vendorId;

    if (!vendorId) {
      return next();
    }

    // Admin and board can access all vendors
    if (['admin', 'board', 'director'].includes(req.user.role)) {
      return next();
    }

    // Check if user is assigned to this vendor
    const isAssigned = req.user.assignedVendors.some(
      (vendor) => vendor._id.toString() === vendorId
    );

    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this vendor'
      });
    }

    next();
  } catch (error) {
    logger.error('Vendor authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization error'
    });
  }
};

// Check approval limits
const checkApprovalLimit = (type) => {
  return (req, res, next) => {
    try {
      const amount = req.body.amount || req.body.totalAmount;

      if (!amount) {
        return next();
      }

      if (!req.user.canApprove(type, amount)) {
        return res.status(403).json({
          success: false,
          message: `Approval limit exceeded for ${type}. Your limit is ${req.user.approvalLimits[type]}`
        });
      }

      next();
    } catch (error) {
      logger.error('Approval limit check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization error'
      });
    }
  };
};

// Rate limit by user role
const rateLimitByRole = (req, res, next) => {
  // Different rate limits for different roles
  const roleLimits = {
    admin: 1000,
    board: 500,
    director: 500,
    manager: 300,
    kam: 200,
    sales_rep: 100,
    sales_admin: 150,
    analyst: 200
  };

  const limit = roleLimits[req.user?.role] || 50;
  req.rateLimit = { max: limit };
  next();
};

/**
 * Check if token is blacklisted
 * @param {string} token - JWT token
 * @returns {Promise<boolean>} - Whether token is blacklisted
 */
const isTokenBlacklisted = async (token) => {
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const key = `blacklist:${tokenHash}`;
    const result = await cacheService.get(key);
    return result !== null;
  } catch (error) {
    logger.error('Token blacklist check error:', error);
    return false;
  }
};

/**
 * Blacklist a token
 * @param {string} token - JWT token
 * @returns {Promise<boolean>} - Whether token was blacklisted
 */
const blacklistToken = async (token) => {
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const key = `blacklist:${tokenHash}`;
    const decoded = jwt.decode(token);
    const ttl = decoded && decoded.exp
      ? Math.max(decoded.exp - Math.floor(Date.now() / 1000), 60)
      : 86400;
    await cacheService.set(key, { blacklistedAt: new Date().toISOString() }, ttl);
    return true;
  } catch (error) {
    logger.error('Token blacklist error:', error);
    return false;
  }
};

/**
 * Check for suspicious activity
 * @param {Object} user - User object
 * @param {Object} req - Express request object
 * @returns {Promise<boolean>} - Whether activity is suspicious
 */
const checkForSuspiciousActivity = async (user, req) => {
  try {
    const key = `activity:${user._id}:${req.ip}`;
    const recentActivity = await cacheService.get(key);

    if (recentActivity) {
      const requestCount = (recentActivity.count || 0) + 1;
      await cacheService.set(key, { count: requestCount, lastSeen: new Date().toISOString() }, 300);
      if (requestCount > 500) {
        return true;
      }
    } else {
      await cacheService.set(key, { count: 1, lastSeen: new Date().toISOString() }, 300);
    }

    return false;
  } catch (error) {
    logger.error('Suspicious activity check error:', error);
    return false;
  }
};

/**
 * Generate secure random token
 * @param {number} length - Token length in bytes
 * @returns {string} - Random token
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash token
 * @param {string} token - Token to hash
 * @returns {string} - Hashed token
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate refresh token
 * @param {string} userId - User ID
 * @returns {string} - Refresh token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { _id: userId },
    config.jwt.refreshSecret || config.jwt.secret,
    {
      expiresIn: config.jwt.refreshExpiresIn || '7d',
      algorithm: 'HS256'
    }
  );
};

/**
 * Refresh token middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const refreshToken = async (req, res, _next) => {
  try {
    // Get refresh token
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      config.jwt.refreshSecret || config.jwt.secret,
      { algorithms: ['HS256'] }
    );

    // Get user
    const user = await User.findById(decoded._id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { _id: user._id },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn || '1h',
        algorithm: 'HS256'
      }
    );

    // Set cookie
    if (config.jwt.useCookies) {
      res.cookie('jwt', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000 // 1 hour
      });
    }

    // Log token refresh
    securityLogger.logAuth(user, 'token_refresh', true, {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Send new access token
    res.status(200).json({
      success: true,
      accessToken
    });
  } catch (error) {
    logger.error('Token refresh error:', error);

    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

/**
 * Logout middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logout = async (req, res) => {
  try {
    // Get token
    const token = req.token;

    // Blacklist token if it exists
    if (token) {
      await blacklistToken(token);
    }

    // Clear cookies
    if (req.cookies.jwt) {
      res.clearCookie('jwt');
    }

    if (req.cookies.refreshToken) {
      res.clearCookie('refreshToken');
    }

    // Log logout
    if (req.user) {
      securityLogger.logAuth(req.user, 'logout', true, {
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);

    res.status(500).json({
      success: false,
      message: 'Error logging out'
    });
  }
};

module.exports = {
  authenticateToken,
  authenticate: authenticateToken, // Alias for consistency
  protect: authenticateToken, // Alias for route protection
  authorize,
  checkPermission,
  authorizeCustomer,
  authorizeVendor,
  checkApprovalLimit,
  rateLimitByRole,
  refreshToken,
  logout,
  generateSecureToken,
  hashToken,
  generateRefreshToken,
  blacklistToken
};
