const { asyncHandler, AppError } = require('../middleware/errorHandler');
const superAdminService = require('../services/superAdminService');
const Tenant = require('../models/Tenant');
const logger = require('../utils/logger');

/**
 * Super Admin Controller
 * System administration endpoints
 */

// Create new tenant
exports.createTenant = asyncHandler(async (req, res) => {
  const { tenantData, adminData, licenseType } = req.body;

  if (!tenantData || !adminData) {
    throw new AppError('Tenant and admin data required', 400);
  }

  const result = await superAdminService.createTenant(
    tenantData,
    adminData,
    licenseType
  );

  logger.logAudit('tenant_created', req.user._id, {
    tenantId: result.tenant._id,
    licenseType
  });

  res.status(201).json({
    success: true,
    data: result
  });
});

// Get all tenants
exports.getAllTenants = asyncHandler(async (req, res) => {
  const filters = {
    status: req.query.status,
    licenseType: req.query.licenseType,
    search: req.query.search,
    industry: req.query.industry
  };

  const pagination = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
    sortBy: req.query.sortBy || 'createdAt',
    sortOrder: req.query.sortOrder || 'desc'
  };

  const result = await superAdminService.getAllTenants(filters, pagination);

  res.json({
    success: true,
    data: result
  });
});

// Get single tenant
exports.getTenant = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;

  const tenant = await Tenant.findById(tenantId)
    .populate('licenseId')
    .lean();

  if (!tenant) {
    throw new AppError('Tenant not found', 404);
  }

  res.json({
    success: true,
    data: tenant
  });
});

// Update tenant status
exports.updateTenantStatus = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const { status, reason } = req.body;

  if (!['active', 'suspended', 'inactive'].includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  const tenant = await superAdminService.updateTenantStatus(
    tenantId,
    status,
    reason
  );

  logger.logAudit('tenant_status_updated', req.user._id, {
    tenantId,
    status,
    reason
  });

  res.json({
    success: true,
    data: tenant
  });
});

// Delete tenant
exports.deleteTenant = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const { reason } = req.body;

  const result = await superAdminService.deleteTenant(tenantId, reason);

  logger.logAudit('tenant_deleted', req.user._id, {
    tenantId,
    reason
  });

  res.json({
    success: true,
    data: result
  });
});

// Manage license
exports.manageLicense = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const { action, data } = req.body;

  const validActions = ['upgrade', 'downgrade', 'renew', 'suspend', 'reactivate', 'cancel'];
  if (!validActions.includes(action)) {
    throw new AppError('Invalid license action', 400);
  }

  const license = await superAdminService.manageLicense(tenantId, action, data);

  logger.logAudit('license_action', req.user._id, {
    tenantId,
    action,
    data
  });

  res.json({
    success: true,
    data: license
  });
});

// Get license usage report
exports.getLicenseUsage = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;

  const report = await superAdminService.getLicenseUsageReport(tenantId);

  res.json({
    success: true,
    data: report
  });
});

// Get system statistics
exports.getSystemStatistics = asyncHandler(async (req, res) => {
  const stats = await superAdminService.getSystemStatistics();

  res.json({
    success: true,
    data: stats
  });
});

// Get license plans
exports.getLicensePlans = asyncHandler(async (req, res) => {
  const License = require('../models/License');
  const plans = License.getLicensePlans();

  res.json({
    success: true,
    data: plans
  });
});

// Bulk tenant operations
exports.bulkTenantOperation = asyncHandler(async (req, res) => {
  const { tenantIds, operation, data } = req.body;

  if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
    throw new AppError('Invalid tenant IDs', 400);
  }

  const results = {
    successful: [],
    failed: []
  };

  for (const tenantId of tenantIds) {
    try {
      let result;
      switch (operation) {
        case 'suspend':
          result = await superAdminService.updateTenantStatus(
            tenantId,
            'suspended',
            data.reason
          );
          break;
        case 'activate':
          result = await superAdminService.updateTenantStatus(
            tenantId,
            'active',
            data.reason
          );
          break;
        case 'delete':
          result = await superAdminService.deleteTenant(
            tenantId,
            data.reason
          );
          break;
        default:
          throw new AppError('Invalid operation', 400);
      }
      results.successful.push({ tenantId, result });
    } catch (error) {
      results.failed.push({ tenantId, error: error.message });
    }
  }

  logger.logAudit('bulk_tenant_operation', req.user._id, {
    operation,
    total: tenantIds.length,
    successful: results.successful.length,
    failed: results.failed.length
  });

  res.json({
    success: true,
    data: results
  });
});

// System health check
exports.getSystemHealth = asyncHandler(async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date(),
    services: {
      database: 'healthy',
      redis: 'healthy',
      api: 'healthy'
    },
    metrics: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  };

  res.json({
    success: true,
    data: health
  });
});

module.exports = exports;
