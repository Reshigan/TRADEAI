const Tenant = require('../models/Tenant');
const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Tenant Context Manager
 * Manages tenant context throughout the request lifecycle
 */
class TenantContext {
  constructor() {
    this.contexts = new Map();
  }
  
  setTenant(requestId, tenantData) {
    this.contexts.set(requestId, {
      id: tenantData._id.toString(),
      slug: tenantData.slug,
      name: tenantData.name,
      features: tenantData.features,
      limits: tenantData.limits,
      usage: tenantData.usage,
      settings: tenantData.settings,
      isActive: tenantData.isActive,
      isSuspended: tenantData.isSuspended
    });
  }
  
  getTenant(requestId) {
    return this.contexts.get(requestId);
  }
  
  clearTenant(requestId) {
    this.contexts.delete(requestId);
  }
  
  hasFeature(requestId, featureName) {
    const tenant = this.getTenant(requestId);
    return tenant && tenant.features && tenant.features[featureName] === true;
  }
  
  canPerformAction(requestId, action, currentUsage = 0) {
    const tenant = this.getTenant(requestId);
    if (!tenant) return false;
    
    const actionLimits = {
      'add_user': tenant.limits.maxUsers,
      'add_customer': tenant.limits.maxCustomers,
      'add_product': tenant.limits.maxProducts,
      'add_promotion': tenant.limits.maxPromotions,
      'api_call': tenant.limits.maxAPICallsPerMonth
    };
    
    const actionUsage = {
      'add_user': tenant.usage.users,
      'add_customer': tenant.usage.customers,
      'add_product': tenant.usage.products,
      'add_promotion': tenant.usage.promotions,
      'api_call': tenant.usage.apiCallsThisMonth
    };
    
    const limit = actionLimits[action];
    const usage = actionUsage[action] || currentUsage;
    
    return limit === -1 || usage < limit; // -1 means unlimited
  }
}

// Global tenant context instance
const tenantContext = new TenantContext();

/**
 * Extract tenant ID from various sources
 */
function extractTenantId(req) {
  // Priority order:
  // 1. X-Tenant-ID header
  // 2. Subdomain
  // 3. JWT token
  // 4. Query parameter
  
  let tenantId = null;
  let tenantSlug = null;
  
  // 1. Check X-Tenant-ID header
  tenantId = req.headers['x-tenant-id'];
  if (tenantId) {
    return { type: 'id', value: tenantId };
  }
  
  // 2. Check subdomain
  const host = req.headers.host;
  if (host) {
    const subdomain = host.split('.')[0];
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      return { type: 'slug', value: subdomain };
    }
  }
  
  // 3. Check JWT token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.JWT_SECRET);
      if (decoded.tenantId) {
        return { type: 'id', value: decoded.tenantId };
      }
      if (decoded.tenantSlug) {
        return { type: 'slug', value: decoded.tenantSlug };
      }
    } catch (error) {
      // Token invalid, continue to other methods
    }
  }
  
  // 4. Check query parameter
  tenantId = req.query.tenantId;
  if (tenantId) {
    return { type: 'id', value: tenantId };
  }
  
  tenantSlug = req.query.tenantSlug;
  if (tenantSlug) {
    return { type: 'slug', value: tenantSlug };
  }
  
  return null;
}

/**
 * Check if route is public (doesn't require tenant)
 */
function isPublicRoute(path) {
  const publicRoutes = [
    '/health',
    '/api/health',
    '/api/v1/health',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/quick-login',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/quick-login',
    '/v1/auth/login',
    '/v1/auth/register',
    '/v1/auth/forgot-password',
    '/v1/auth/reset-password',
    '/tenants/signup',
    '/tenants/verify',
    '/api/tenants/signup',
    '/api/tenants/verify',
    '/v1/tenants/signup',
    '/v1/tenants/verify',
    '/docs',
    '/api-docs',
    '/api/docs',
    '/swagger',
    '/openapi.json'
  ];
  
  return publicRoutes.some(route => path.startsWith(route));
}

/**
 * Check if route is admin-only (system admin routes)
 */
function isAdminRoute(path) {
  const adminRoutes = [
    '/api/v1/admin',
    '/api/v1/system',
    '/api/v1/tenants/admin'
  ];
  
  return adminRoutes.some(route => path.startsWith(route));
}

/**
 * Main tenant isolation middleware
 */
const tenantIsolation = async (req, res, next) => {
  try {
    // Generate unique request ID for context tracking
    req.requestId = req.headers['x-request-id'] || 
                   `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Skip tenant check for public routes
    if (isPublicRoute(req.path)) {
      return next();
    }
    
    // Handle admin routes differently
    if (isAdminRoute(req.path)) {
      // Admin routes require system admin privileges
      // This will be handled by admin authentication middleware
      return next();
    }
    
    // Extract tenant information
    const tenantInfo = extractTenantId(req);
    
    if (!tenantInfo) {
      return res.status(400).json({
        error: 'Tenant identification required',
        message: 'Please provide tenant ID via header, subdomain, or token',
        code: 'TENANT_REQUIRED'
      });
    }
    
    // Find tenant in database
    let tenant;
    
    // In mock mode, create a mock tenant to avoid database queries
    if (process.env.USE_MOCK_DB === 'true') {
      tenant = {
        _id: '507f1f77bcf86cd799439012',
        slug: 'demo-tenant',
        name: 'Demo Tenant',
        isActive: true,
        isSuspended: false,
        features: {
          promotionManagement: true,
          budgetManagement: true,
          aiPredictions: true,
          multiCurrency: true,
          customReports: true
        },
        limits: {
          maxUsers: 100,
          maxPromotions: 1000,
          maxStorageGB: 10
        },
        usage: {
          userCount: 5,
          promotionCount: 50,
          storageUsedGB: 2
        },
        settings: {
          timezone: 'UTC',
          currency: 'USD',
          dateFormat: 'YYYY-MM-DD'
        },
        subscription: {
          plan: 'enterprise'
        }
      };
    } else {
      if (tenantInfo.type === 'id') {
        tenant = await Tenant.findById(tenantInfo.value);
      } else if (tenantInfo.type === 'slug') {
        tenant = await Tenant.findBySlug(tenantInfo.value);
      }
      
      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant not found',
          message: 'The specified tenant does not exist',
          code: 'TENANT_NOT_FOUND'
        });
      }
    }
    
    // Check tenant status
    if (!tenant.isActive) {
      return res.status(403).json({
        error: 'Tenant inactive',
        message: 'This tenant account is inactive',
        code: 'TENANT_INACTIVE'
      });
    }
    
    if (tenant.isSuspended) {
      return res.status(403).json({
        error: 'Tenant suspended',
        message: 'This tenant account has been suspended',
        code: 'TENANT_SUSPENDED'
      });
    }
    
    // Check trial expiry
    if (tenant.isTrialExpired && tenant.subscription.plan === 'trial') {
      return res.status(402).json({
        error: 'Trial expired',
        message: 'Your trial period has expired. Please upgrade your subscription.',
        code: 'TRIAL_EXPIRED',
        trialEndDate: tenant.subscription.trialEndDate
      });
    }
    
    // Set tenant context
    tenantContext.setTenant(req.requestId, tenant);
    
    // Add tenant information to request
    req.tenant = {
      id: tenant._id.toString(),
      slug: tenant.slug,
      name: tenant.name,
      plan: tenant.subscription.plan,
      features: tenant.features,
      limits: tenant.limits,
      usage: tenant.usage,
      settings: tenant.settings
    };
    
    // Add helper methods to request
    req.hasFeature = (featureName) => tenantContext.hasFeature(req.requestId, featureName);
    req.canPerformAction = (action, currentUsage) => 
      tenantContext.canPerformAction(req.requestId, action, currentUsage);
    
    // Update last activity (skip in mock mode)
    if (process.env.USE_MOCK_DB !== 'true') {
      tenant.lastActivityAt = new Date();
      await tenant.save();
      
      // Increment API call usage
      if (req.method !== 'GET' || req.path.includes('/api/')) {
        await tenant.updateUsage('apiCallsThisMonth', 1);
      }
    }
    
    next();
  } catch (error) {
    console.error('Tenant isolation middleware error:', error);
    res.status(500).json({
      error: 'Tenant validation failed',
      message: 'An error occurred while validating tenant access',
      code: 'TENANT_VALIDATION_ERROR'
    });
  }
};

/**
 * Cleanup middleware to remove tenant context after request
 */
const tenantCleanup = (req, res, next) => {
  // Clean up tenant context after response is sent
  res.on('finish', () => {
    if (req.requestId) {
      tenantContext.clearTenant(req.requestId);
    }
  });
  
  next();
};

/**
 * Feature gate middleware factory
 * Creates middleware to check if tenant has specific feature
 */
const requireFeature = (featureName) => {
  return (req, res, next) => {
    if (!req.hasFeature || !req.hasFeature(featureName)) {
      return res.status(403).json({
        error: 'Feature not available',
        message: `This feature (${featureName}) is not available in your current plan`,
        code: 'FEATURE_NOT_AVAILABLE',
        feature: featureName,
        currentPlan: req.tenant?.plan
      });
    }
    next();
  };
};

/**
 * Usage limit middleware factory
 * Creates middleware to check usage limits
 */
const checkUsageLimit = (action) => {
  return (req, res, next) => {
    if (!req.canPerformAction || !req.canPerformAction(action)) {
      const tenant = req.tenant;
      return res.status(429).json({
        error: 'Usage limit exceeded',
        message: `You have reached the limit for ${action} in your current plan`,
        code: 'USAGE_LIMIT_EXCEEDED',
        action,
        currentPlan: tenant?.plan,
        limits: tenant?.limits,
        usage: tenant?.usage
      });
    }
    next();
  };
};

/**
 * Tenant-aware database query helper
 * Automatically adds tenant filter to queries
 */
const addTenantFilter = (req, query = {}) => {
  if (req.tenant && req.tenant.id) {
    query.tenantId = req.tenant.id;
  }
  return query;
};

/**
 * Tenant-aware model creation helper
 * Automatically adds tenant ID to new documents
 */
const addTenantData = (req, data = {}) => {
  if (req.tenant && req.tenant.id) {
    data.tenantId = req.tenant.id;
    if (req.user && req.user.id) {
      data.createdBy = req.user.id;
      data.updatedBy = req.user.id;
    }
  }
  return data;
};

module.exports = {
  tenantIsolation,
  tenantCleanup,
  requireFeature,
  checkUsageLimit,
  addTenantFilter,
  addTenantData,
  tenantContext,
  extractTenantId,
  isPublicRoute,
  isAdminRoute
};