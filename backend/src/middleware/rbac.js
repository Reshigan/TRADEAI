const securityService = require('../services/securityService');
const logger = require('../utils/logger');

/**
 * Role-Based Access Control (RBAC) Middleware
 * Provides permission checking and access control
 */

/**
 * Middleware to require specific permission
 * @param {string} resource - Resource name (e.g., 'users', 'reports')
 * @param {string} action - Action name (e.g., 'create', 'read', 'update', 'delete')
 * @param {object} options - Additional options
 */
const requirePermission = (resource, action, options = {}) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id;
      const tenantId = req.tenant?.id;

      if (!userId || !tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Build context for permission check
      const context = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        currentTime: new Date(),
        ...options.context
      };

      // Add resource ownership context if applicable
      if (options.checkOwnership && req.params.id) {
        context.resourceOwnerId = req.params.id;
      }

      // Check permission
      const permissionResult = await securityService.checkPermission(
        userId,
        tenantId,
        resource,
        action,
        context
      );

      if (!permissionResult.allowed) {
        // Log unauthorized access attempt
        await securityService.logSecurityEvent({
          type: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          severity: 'MEDIUM',
          tenantId,
          userId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          details: {
            requestedPermission: `${resource}:${action}`,
            reason: permissionResult.reason,
            requestUrl: req.originalUrl,
            requestMethod: req.method
          }
        });

        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          details: {
            required: `${resource}:${action}`,
            reason: permissionResult.reason
          }
        });
      }

      // Store permission result in request for later use
      req.permissionResult = permissionResult;

      next();
    } catch (error) {
      logger.error('RBAC middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Permission check failed'
      });
    }
  };
};

/**
 * Middleware to require any of the specified permissions
 * @param {Array} permissions - Array of permission objects [{resource, action}]
 */
const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id;
      const tenantId = req.tenant?.id;

      if (!userId || !tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const context = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        currentTime: new Date()
      };

      // Check each permission until one is allowed
      for (const permission of permissions) {
        const permissionResult = await securityService.checkPermission(
          userId,
          tenantId,
          permission.resource,
          permission.action,
          context
        );

        if (permissionResult.allowed) {
          req.permissionResult = permissionResult;
          return next();
        }
      }

      // None of the permissions were allowed
      await securityService.logSecurityEvent({
        type: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        severity: 'MEDIUM',
        tenantId,
        userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        details: {
          requestedPermissions: permissions.map(p => `${p.resource}:${p.action}`),
          requestUrl: req.originalUrl,
          requestMethod: req.method
        }
      });

      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        details: {
          required: permissions.map(p => `${p.resource}:${p.action}`),
          reason: 'None of the required permissions are granted'
        }
      });
    } catch (error) {
      logger.error('RBAC middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Permission check failed'
      });
    }
  };
};

/**
 * Middleware to require all of the specified permissions
 * @param {Array} permissions - Array of permission objects [{resource, action}]
 */
const requireAllPermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id;
      const tenantId = req.tenant?.id;

      if (!userId || !tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const context = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        currentTime: new Date()
      };

      const results = [];
      const deniedPermissions = [];

      // Check all permissions
      for (const permission of permissions) {
        const permissionResult = await securityService.checkPermission(
          userId,
          tenantId,
          permission.resource,
          permission.action,
          context
        );

        results.push(permissionResult);

        if (!permissionResult.allowed) {
          deniedPermissions.push(`${permission.resource}:${permission.action}`);
        }
      }

      if (deniedPermissions.length > 0) {
        await securityService.logSecurityEvent({
          type: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          severity: 'MEDIUM',
          tenantId,
          userId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          details: {
            requestedPermissions: permissions.map(p => `${p.resource}:${p.action}`),
            deniedPermissions,
            requestUrl: req.originalUrl,
            requestMethod: req.method
          }
        });

        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          details: {
            required: permissions.map(p => `${p.resource}:${p.action}`),
            denied: deniedPermissions,
            reason: 'Not all required permissions are granted'
          }
        });
      }

      req.permissionResults = results;
      next();
    } catch (error) {
      logger.error('RBAC middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Permission check failed'
      });
    }
  };
};

/**
 * Middleware to require specific role
 * @param {string|Array} roles - Role name(s) required
 */
const requireRole = (roles) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];

  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id;

      if (!user || !tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Check if user has any of the required roles
      const userRoles = user.roles || [];
      const hasRequiredRole = roleArray.some(role => 
        userRoles.some(userRole => 
          userRole.name === role || userRole === role
        )
      );

      if (!hasRequiredRole) {
        await securityService.logSecurityEvent({
          type: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          severity: 'MEDIUM',
          tenantId,
          userId: user._id,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          details: {
            requiredRoles: roleArray,
            userRoles: userRoles.map(r => r.name || r),
            requestUrl: req.originalUrl,
            requestMethod: req.method
          }
        });

        return res.status(403).json({
          success: false,
          error: 'Insufficient role privileges',
          details: {
            required: roleArray,
            reason: 'User does not have any of the required roles'
          }
        });
      }

      next();
    } catch (error) {
      logger.error('Role middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Role check failed'
      });
    }
  };
};

/**
 * Middleware to check resource ownership
 * @param {string} resourceIdParam - Parameter name containing resource ID
 * @param {string} ownerField - Field name in resource containing owner ID
 */
const requireOwnership = (resourceIdParam = 'id', ownerField = 'createdBy') => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id;
      const tenantId = req.tenant?.id;
      const resourceId = req.params[resourceIdParam];

      if (!userId || !tenantId || !resourceId) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request parameters'
        });
      }

      // This is a simplified check - in practice, you'd query the specific resource
      // and check the ownership field
      const context = {
        resourceOwnerId: resourceId,
        checkOwnership: true
      };

      req.ownershipContext = context;
      next();
    } catch (error) {
      logger.error('Ownership middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Ownership check failed'
      });
    }
  };
};

/**
 * Middleware to log access attempts
 */
const logAccess = () => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id;
      const tenantId = req.tenant?.id;

      if (userId && tenantId) {
        // Log the access attempt
        await securityService.logAuditEvent({
          tenantId,
          userId,
          action: 'API_ACCESS',
          resource: 'api',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          details: {
            method: req.method,
            url: req.originalUrl,
            query: req.query,
            timestamp: new Date()
          }
        });
      }

      next();
    } catch (error) {
      logger.error('Access logging error:', error);
      // Don't fail the request if logging fails
      next();
    }
  };
};

/**
 * Middleware to check rate limits per user/tenant
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Time window in milliseconds
 */
const rateLimit = (maxRequests = 100, windowMs = 60000) => {
  const requestCounts = new Map();

  return async (req, res, next) => {
    try {
      const userId = req.user?._id;
      const tenantId = req.tenant?.id;
      const key = `${tenantId}_${userId}`;
      const now = Date.now();

      if (!userId || !tenantId) {
        return next();
      }

      // Clean up old entries
      for (const [k, data] of requestCounts.entries()) {
        if (now - data.windowStart > windowMs) {
          requestCounts.delete(k);
        }
      }

      // Get or create request count for this user/tenant
      let requestData = requestCounts.get(key);
      if (!requestData || now - requestData.windowStart > windowMs) {
        requestData = {
          count: 0,
          windowStart: now
        };
        requestCounts.set(key, requestData);
      }

      requestData.count++;

      if (requestData.count > maxRequests) {
        // Log rate limit exceeded
        await securityService.logSecurityEvent({
          type: 'RATE_LIMIT_EXCEEDED',
          severity: 'MEDIUM',
          tenantId,
          userId,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          details: {
            maxRequests,
            windowMs,
            currentCount: requestData.count,
            requestUrl: req.originalUrl,
            requestMethod: req.method
          }
        });

        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          details: {
            maxRequests,
            windowMs,
            retryAfter: windowMs - (now - requestData.windowStart)
          }
        });
      }

      next();
    } catch (error) {
      logger.error('Rate limit middleware error:', error);
      next(); // Don't fail the request if rate limiting fails
    }
  };
};

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  requireOwnership,
  logAccess,
  rateLimit
};