const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Middleware to check super admin role
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Super admin privileges required.'
    });
  }
  next();
};

// All routes require authentication and super admin role
router.use(authenticateToken);
router.use(requireSuperAdmin);

/**
 * @route   POST /api/super-admin/tenants
 * @desc    Create new tenant with license
 * @access  Super Admin only
 */
router.post('/tenants', superAdminController.createTenant);

/**
 * @route   GET /api/super-admin/tenants
 * @desc    Get all tenants with filters
 * @access  Super Admin only
 */
router.get('/tenants', superAdminController.getAllTenants);

/**
 * @route   GET /api/super-admin/tenants/:tenantId
 * @desc    Get single tenant details
 * @access  Super Admin only
 */
router.get('/tenants/:tenantId', superAdminController.getTenant);

/**
 * @route   PATCH /api/super-admin/tenants/:tenantId/status
 * @desc    Update tenant status
 * @access  Super Admin only
 */
router.patch('/tenants/:tenantId/status', superAdminController.updateTenantStatus);

/**
 * @route   DELETE /api/super-admin/tenants/:tenantId
 * @desc    Delete tenant (soft delete)
 * @access  Super Admin only
 */
router.delete('/tenants/:tenantId', superAdminController.deleteTenant);

/**
 * @route   POST /api/super-admin/tenants/bulk
 * @desc    Bulk tenant operations
 * @access  Super Admin only
 */
router.post('/tenants/bulk', superAdminController.bulkTenantOperation);

/**
 * @route   POST /api/super-admin/tenants/:tenantId/license
 * @desc    Manage tenant license
 * @access  Super Admin only
 */
router.post('/tenants/:tenantId/license', superAdminController.manageLicense);

/**
 * @route   GET /api/super-admin/tenants/:tenantId/license/usage
 * @desc    Get license usage report
 * @access  Super Admin only
 */
router.get('/tenants/:tenantId/license/usage', superAdminController.getLicenseUsage);

/**
 * @route   GET /api/super-admin/license-plans
 * @desc    Get available license plans
 * @access  Super Admin only
 */
router.get('/license-plans', superAdminController.getLicensePlans);

/**
 * @route   GET /api/super-admin/statistics
 * @desc    Get system statistics
 * @access  Super Admin only
 */
router.get('/statistics', superAdminController.getSystemStatistics);

/**
 * @route   GET /api/super-admin/health
 * @desc    Get system health
 * @access  Super Admin only
 */
router.get('/health', superAdminController.getSystemHealth);

module.exports = router;
