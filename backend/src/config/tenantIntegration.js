/**
 * Tenant Integration Configuration
 * Configures the application to use the new multi-tenant architecture
 */

const { tenantIsolation } = require('../middleware/tenantIsolation');
const { applyTenantQueryFilter, validateTenantConsistency } = require('../middleware/tenantQueryFilter');
const tenantRoutes = require('../routes/tenantRoutes');

/**
 * Configure tenant middleware for the Express app
 */
function configureTenantMiddleware(app) {
  // Apply tenant isolation middleware globally
  // This should be applied after authentication but before route handlers
  app.use('/api', tenantIsolation);

  // Apply tenant query filtering
  app.use('/api', applyTenantQueryFilter);

  // Apply tenant validation for data consistency
  app.use('/api', validateTenantConsistency);

  console.log('✓ Tenant middleware configured');
}

/**
 * Configure tenant routes
 */
function configureTenantRoutes(app) {
  // Add tenant management routes
  app.use('/api/tenants', tenantRoutes);

  console.log('✓ Tenant routes configured');
}

/**
 * Configure tenant-aware error handling
 */
function configureTenantErrorHandling(app) {
  // Tenant-specific error handler
  app.use((error, req, res, next) => {
    // Log tenant context with errors
    if (req.tenant) {
      console.error(`[Tenant: ${req.tenant.name}] Error:`, error);
    }

    // Handle tenant-specific errors
    if (error.name === 'TenantAccessError') {
      return res.status(403).json({
        error: 'Tenant access denied',
        message: error.message
      });
    }

    if (error.name === 'TenantLimitExceededError') {
      return res.status(429).json({
        error: 'Tenant limit exceeded',
        message: error.message,
        limits: error.limits
      });
    }

    // Continue with default error handling
    next(error);
  });

  console.log('✓ Tenant error handling configured');
}

/**
 * Initialize tenant system
 */
async function initializeTenantSystem(app) {
  try {
    console.log('Initializing multi-tenant system...');

    // Configure middleware
    configureTenantMiddleware(app);

    // Configure routes
    configureTenantRoutes(app);

    // Configure error handling
    configureTenantErrorHandling(app);

    console.log('✅ Multi-tenant system initialized successfully');

    return {
      success: true,
      message: 'Multi-tenant system initialized'
    };

  } catch (error) {
    console.error('❌ Failed to initialize tenant system:', error);
    throw error;
  }
}

/**
 * Tenant-aware database connection configuration
 */
function configureTenantDatabase() {
  // Add any tenant-specific database configuration here
  // For example, connection pooling per tenant, read replicas, etc.

  console.log('✓ Tenant database configuration applied');
}

/**
 * Utility functions for tenant integration
 */
const tenantUtils = {
  /**
   * Check if a feature is enabled for the current tenant
   */
  isFeatureEnabled(req, featureName) {
    if (!req.tenant) return false;
    return req.tenant.features && req.tenant.features[featureName] === true;
  },

  /**
   * Check if tenant has reached usage limits
   */
  checkUsageLimit(req, limitType) {
    if (!req.tenant) return { allowed: false, reason: 'No tenant context' };

    const usage = req.tenant.usage || {};
    const limits = req.tenant.limits || {};

    const currentUsage = usage[limitType] || 0;
    const limit = limits[`max${limitType.charAt(0).toUpperCase() + limitType.slice(1)}`] || 0;

    if (limit === 0) return { allowed: true }; // No limit set

    const allowed = currentUsage < limit;

    return {
      allowed,
      current: currentUsage,
      limit,
      remaining: Math.max(0, limit - currentUsage),
      reason: allowed ? null : `${limitType} limit exceeded`
    };
  },

  /**
   * Increment tenant usage
   */
  async incrementUsage(tenantId, usageType, amount = 1) {
    const Tenant = require('../models/Tenant');
    const { withoutTenantFilter } = require('../middleware/tenantQueryFilter');

    return await withoutTenantFilter(async () => {
      return await Tenant.findByIdAndUpdate(
        tenantId,
        {
          $inc: { [`usage.${usageType}`]: amount },
          $set: { updatedAt: new Date() }
        },
        { new: true }
      );
    });
  },

  /**
   * Get tenant subscription info
   */
  getSubscriptionInfo(req) {
    if (!req.tenant) return null;

    return {
      tier: req.tenant.subscription?.tier || 'trial',
      status: req.tenant.subscription?.status || 'inactive',
      features: req.tenant.subscription?.features || [],
      expiresAt: req.tenant.subscription?.expiresAt
    };
  }
};

/**
 * Middleware factory for feature gating
 */
function requireFeature(featureName) {
  return (req, res, next) => {
    if (!tenantUtils.isFeatureEnabled(req, featureName)) {
      return res.status(403).json({
        error: 'Feature not available',
        message: `The ${featureName} feature is not available for your subscription`,
        feature: featureName
      });
    }
    next();
  };
}

/**
 * Middleware factory for usage limit checking
 */
function checkUsageLimit(limitType) {
  return (req, res, next) => {
    const check = tenantUtils.checkUsageLimit(req, limitType);

    if (!check.allowed) {
      return res.status(429).json({
        error: 'Usage limit exceeded',
        message: check.reason,
        usage: {
          current: check.current,
          limit: check.limit,
          remaining: check.remaining
        }
      });
    }

    // Add usage info to request for potential use in handlers
    req.usageCheck = check;
    next();
  };
}

module.exports = {
  initializeTenantSystem,
  configureTenantMiddleware,
  configureTenantRoutes,
  configureTenantErrorHandling,
  configureTenantDatabase,
  tenantUtils,
  requireFeature,
  checkUsageLimit
};
