/**
 * Tenant validation middleware
 * Validates tenant context for multi-tenant operations
 */

const validateTenant = (req, res, next) => {
  // Extract tenant from request (could be from headers, params, or user context)
  const tenantId = req.headers['x-tenant-id'] || req.params.tenantId || req.user?.tenantId;
  
  if (!tenantId) {
    return res.status(400).json({
      error: 'Tenant ID is required',
      message: 'Please provide a valid tenant identifier'
    });
  }
  
  // Add tenant to request context
  req.tenantId = tenantId;
  next();
};

const optionalTenant = (req, res, next) => {
  // Extract tenant from request but don't require it
  const tenantId = req.headers['x-tenant-id'] || req.params.tenantId || req.user?.tenantId;
  
  if (tenantId) {
    req.tenantId = tenantId;
  }
  
  next();
};

module.exports = {
  validateTenant,
  optionalTenant
};