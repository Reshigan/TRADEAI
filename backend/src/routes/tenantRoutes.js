const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { authenticate } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenantIsolation');
const { applyTenantQueryFilter, validateTenantConsistency, withoutTenantFilter } = require('../middleware/tenantQueryFilter');
const Tenant = require('../models/Tenant');
const logger = require('../utils/logger');

/**
 * Tenant Management Routes
 * Handles tenant CRUD operations and management
 */

// Apply authentication to all routes
router.use(authenticate);

// Apply tenant isolation (but allow super admins to bypass)
router.use((req, res, next) => {
  if (req.user.role === 'super_admin') {
    // Super admins can access all tenant operations
    return next();
  }
  return tenantIsolation(req, res, next);
});

// Apply tenant query filtering
router.use(applyTenantQueryFilter);

// Apply tenant validation
router.use(validateTenantConsistency);

/**
 * @route   GET /api/tenants
 * @desc    Get all tenants (Super Admin only)
 * @access  Super Admin
 */
router.get('/', tenantController.getAllTenants);

/**
 * @route   GET /api/tenants/current
 * @desc    Get current tenant details
 * @access  Tenant Admin, Super Admin
 */
router.get('/current', tenantController.getCurrentTenant);

/**
 * @route   GET /api/tenants/stats
 * @desc    Get tenant statistics (Super Admin only)
 * @access  Super Admin
 */
router.get('/stats', tenantController.getTenantStats);

/**
 * @route   POST /api/tenants
 * @desc    Create new tenant (Super Admin only)
 * @access  Super Admin
 */
router.post('/', tenantController.createTenant);

/**
 * @route   GET /api/tenants/:id
 * @desc    Get specific tenant details
 * @access  Super Admin, Tenant Admin (own tenant only)
 */
router.get('/:id', (req, res, _next) => {
  // Reuse getCurrentTenant for specific tenant access
  req.params.tenantId = req.params.id;
  tenantController.getCurrentTenant(req, res);
});

/**
 * @route   PUT /api/tenants/:id
 * @desc    Update tenant
 * @access  Super Admin, Tenant Admin (own tenant only)
 */
router.put('/:id', tenantController.updateTenant);

/**
 * @route   DELETE /api/tenants/:id
 * @desc    Delete/Deactivate tenant (Super Admin only)
 * @access  Super Admin
 */
router.delete('/:id', tenantController.deleteTenant);

/**
 * @route   GET /api/tenants/:id/users
 * @desc    Get tenant users
 * @access  Super Admin, Tenant Admin (own tenant only)
 */
router.get('/:id/users', tenantController.getTenantUsers);

/**
 * @route   PUT /api/tenants/:id/subscription
 * @desc    Update tenant subscription (Super Admin only)
 * @access  Super Admin
 */
router.put('/:id/subscription', tenantController.updateSubscription);

/**
 * Tenant Feature Management Routes
 */

/**
 * @route   GET /api/tenants/:id/features
 * @desc    Get tenant feature flags
 * @access  Super Admin, Tenant Admin (own tenant only)
 */
router.get('/:id/features', async (req, res) => {
  try {
    const { id } = req.params;

    // Check permissions
    if (req.user.role !== 'super_admin' && (!req.tenant || req.tenant.id !== id)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view features for your own tenant'
      });
    }

    const tenant = await withoutTenantFilter(async () => {
      return Tenant.findById(id).select('features');
    });

    if (!tenant) {
      return res.status(404).json({
        error: 'Tenant not found',
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      data: tenant.features
    });

  } catch (error) {
    logger.error('Get tenant features error', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve tenant features'
    });
  }
});

/**
 * @route   PUT /api/tenants/:id/features
 * @desc    Update tenant feature flags (Super Admin only)
 * @access  Super Admin
 */
router.put('/:id/features', async (req, res) => {
  try {
    // Only super admins can update features
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only super administrators can update tenant features'
      });
    }

    const { id } = req.params;
    const features = req.body;

    const tenant = await withoutTenantFilter(async () => {
      return Tenant.findByIdAndUpdate(
        id,
        {
          features,
          updatedBy: req.user._id
        },
        { new: true, runValidators: true }
      ).select('features');
    });

    if (!tenant) {
      return res.status(404).json({
        error: 'Tenant not found',
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      data: tenant.features,
      message: 'Tenant features updated successfully'
    });

  } catch (error) {
    logger.error('Update tenant features error', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update tenant features'
    });
  }
});

/**
 * Tenant Usage and Limits Routes
 */

/**
 * @route   GET /api/tenants/:id/usage
 * @desc    Get tenant usage statistics
 * @access  Super Admin, Tenant Admin (own tenant only)
 */
router.get('/:id/usage', async (req, res) => {
  try {
    const { id } = req.params;

    // Check permissions
    if (req.user.role !== 'super_admin' && (!req.tenant || req.tenant.id !== id)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view usage for your own tenant'
      });
    }

    const tenant = await withoutTenantFilter(async () => {
      return Tenant.findById(id).select('usage limits');
    });

    if (!tenant) {
      return res.status(404).json({
        error: 'Tenant not found',
        message: 'Tenant not found'
      });
    }

    // Calculate usage percentages
    const usageWithPercentages = {
      ...tenant.usage.toObject(),
      percentages: {
        users: tenant.limits.maxUsers > 0 ? (tenant.usage.users / tenant.limits.maxUsers) * 100 : 0,
        storage: tenant.limits.maxStorage > 0 ? (tenant.usage.storage / tenant.limits.maxStorage) * 100 : 0,
        apiCalls: tenant.limits.maxApiCalls > 0 ? (tenant.usage.apiCalls / tenant.limits.maxApiCalls) * 100 : 0
      }
    };

    res.json({
      success: true,
      data: {
        usage: usageWithPercentages,
        limits: tenant.limits
      }
    });

  } catch (error) {
    logger.error('Get tenant usage error', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve tenant usage'
    });
  }
});

/**
 * @route   PUT /api/tenants/:id/limits
 * @desc    Update tenant limits (Super Admin only)
 * @access  Super Admin
 */
router.put('/:id/limits', async (req, res) => {
  try {
    // Only super admins can update limits
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only super administrators can update tenant limits'
      });
    }

    const { id } = req.params;
    const limits = req.body;

    const tenant = await withoutTenantFilter(async () => {
      return Tenant.findByIdAndUpdate(
        id,
        {
          limits,
          updatedBy: req.user._id
        },
        { new: true, runValidators: true }
      ).select('limits usage');
    });

    if (!tenant) {
      return res.status(404).json({
        error: 'Tenant not found',
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      data: {
        limits: tenant.limits,
        usage: tenant.usage
      },
      message: 'Tenant limits updated successfully'
    });

  } catch (error) {
    logger.error('Update tenant limits error', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update tenant limits'
    });
  }
});

module.exports = router;
