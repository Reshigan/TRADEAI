const License = require('../models/License');
const { AppError } = require('./errorHandler');
const logger = require('../utils/logger');

/**
 * License Checking Middleware
 * Validates tenant license and feature access
 */

/**
 * Check if tenant has active license
 */
exports.checkLicense = async (req, res, next) => {
  try {
    if (!req.user || !req.user.tenantId) {
      return next();
    }

    // Skip for super admin
    if (req.user.role === 'superadmin') {
      return next();
    }

    const license = await License.findOne({ tenantId: req.user.tenantId });

    if (!license) {
      throw new AppError('No license found for this tenant', 403);
    }

    if (license.isExpired()) {
      throw new AppError('License has expired. Please contact support.', 403);
    }

    if (license.status !== 'active') {
      throw new AppError(`License is ${license.status}. Please contact support.`, 403);
    }

    // Attach license to request
    req.license = license;
    next();
  } catch (error) {
    logger.error('License check failed', error);
    next(error);
  }
};

/**
 * Check if tenant has access to specific feature
 */
exports.checkFeature = (featureName) => {
  return (req, res, next) => {
    try {
      // Skip for super admin
      if (req.user.role === 'superadmin') {
        return next();
      }

      if (!req.license) {
        throw new AppError('License information not found', 403);
      }

      if (!req.license.canAccessFeature(featureName)) {
        throw new AppError(
          `This feature requires a license upgrade. Current plan: ${req.license.licenseType}`,
          403
        );
      }

      next();
    } catch (error) {
      logger.error('Feature check failed', error);
      next(error);
    }
  };
};

/**
 * Check resource capacity
 */
exports.checkCapacity = (resourceType) => {
  return (req, res, next) => {
    try {
      // Skip for super admin
      if (req.user.role === 'superadmin') {
        return next();
      }

      if (!req.license) {
        throw new AppError('License information not found', 403);
      }

      if (!req.license.hasCapacity(resourceType)) {
        throw new AppError(
          `${resourceType} limit reached. Current plan allows ${req.license.features[`max${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}`]}. Please upgrade your license.`,
          403
        );
      }

      next();
    } catch (error) {
      logger.error('Capacity check failed', error);
      next(error);
    }
  };
};

/**
 * Track usage (increment counters)
 */
exports.trackUsage = (resourceType) => {
  return async (req, res, next) => {
    try {
      // Skip for super admin
      if (req.user.role === 'superadmin') {
        return next();
      }

      if (!req.license) {
        return next();
      }

      // Track API calls
      req.license.usage.apiCalls = (req.license.usage.apiCalls || 0) + 1;
      await req.license.save();

      next();
    } catch (error) {
      logger.error('Usage tracking failed', error);
      // Don't block request if tracking fails
      next();
    }
  };
};

module.exports = exports;
