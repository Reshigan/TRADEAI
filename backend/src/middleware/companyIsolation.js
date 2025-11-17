const jwt = require('jsonwebtoken');
const Company = require('../models/Company');

/**
 * Middleware to ensure multi-tenant company isolation
 * This middleware MUST be used on all API routes to prevent data leakage between companies
 */
const companyIsolation = async (req, res, next) => {
  try {
    // Skip for public routes
    if (req.path.includes('/auth/login') || req.path.includes('/auth/register') || req.path.includes('/health')) {
      return next();
    }

    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Ensure company is in the token
      if (!decoded.company) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Company information missing.'
        });
      }

      // Verify company exists and is active
      const company = await Company.findById(decoded.company);
      if (!company || !company.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Company not found or inactive.'
        });
      }

      // Check subscription status
      if (company.subscription.status !== 'active' && company.subscription.status !== 'trial') {
        return res.status(403).json({
          success: false,
          message: 'Company subscription is not active.'
        });
      }

      // Add company and user info to request
      req.user = decoded;
      req.company = company;
      req.companyId = company._id;

      // Add company filter to all database queries
      req.companyFilter = { company: company._id };

      next();
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
  } catch (error) {
    console.error('Company isolation middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error in company isolation.'
    });
  }
};

/**
 * Helper function to add company filter to mongoose queries
 * Usage: addCompanyFilter(req, query)
 */
const addCompanyFilter = (req, query = {}) => {
  if (req.companyId) {
    query.company = req.companyId;
  }
  return query;
};

/**
 * Helper function to ensure data belongs to the user's company
 * Usage: await ensureCompanyOwnership(req, document)
 */
const ensureCompanyOwnership = (req, document) => {
  if (!document) {
    throw new Error('Document not found');
  }

  if (!document.company || document.company.toString() !== req.companyId.toString()) {
    throw new Error('Access denied. Document does not belong to your company.');
  }

  return true;
};

/**
 * Helper function to add company to new documents
 * Usage: addCompanyToDocument(req, documentData)
 */
const addCompanyToDocument = (req, documentData = {}) => {
  if (req.companyId) {
    documentData.company = req.companyId;
  }
  return documentData;
};

/**
 * Middleware to check if user has permission for specific module
 */
const checkModulePermission = (moduleName, action = 'read') => {
  return (req, res, next) => {
    try {
      // Admin always has access
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if company has the module enabled
      if (!req.company.hasModule(moduleName)) {
        return res.status(403).json({
          success: false,
          message: `Module '${moduleName}' is not enabled for your company.`
        });
      }

      // Check user permissions
      const modulePermissions = req.company.getModulePermissions(moduleName);
      if (!modulePermissions.includes(action) && !modulePermissions.includes('all')) {
        return res.status(403).json({
          success: false,
          message: `You don't have permission to ${action} in ${moduleName} module.`
        });
      }

      next();
    } catch (error) {
      console.error('Module permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking module permissions.'
      });
    }
  };
};

/**
 * Middleware to check subscription limits
 */
const checkSubscriptionLimits = (resourceType) => {
  return async (req, res, next) => {
    try {
      // Skip for GET requests
      if (req.method === 'GET') {
        return next();
      }

      // Check if within limits
      const withinLimits = await req.company.isWithinLimits(resourceType);
      if (!withinLimits) {
        return res.status(403).json({
          success: false,
          message: `You have reached the ${resourceType} limit for your subscription plan.`
        });
      }

      next();
    } catch (error) {
      console.error('Subscription limits check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking subscription limits.'
      });
    }
  };
};

module.exports = {
  companyIsolation,
  addCompanyFilter,
  ensureCompanyOwnership,
  addCompanyToDocument,
  checkModulePermission,
  checkSubscriptionLimits
};
