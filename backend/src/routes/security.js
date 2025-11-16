const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');
const { authenticateToken } = require('../middleware/auth');
const { validateTenant } = require('../middleware/tenantValidation');
const { requirePermission } = require('../middleware/rbac');

// Authentication routes (no auth required)
router.post('/authenticate', securityController.authenticate);
router.get('/session/validate', securityController.validateSession);

// All other routes require authentication and tenant validation
router.use(authenticateToken);
router.use(validateTenant);

// Session management
router.post('/logout', securityController.logout);

// Permission checking
router.post('/permissions/check', securityController.checkPermission);
router.get('/permissions/user/:userId',
  requirePermission('users', 'read'),
  securityController.getUserPermissions
);

// Role management
router.get('/roles',
  requirePermission('roles', 'read'),
  securityController.getRoles
);

router.post('/roles',
  requirePermission('roles', 'create'),
  securityController.createRole
);

router.get('/roles/:id',
  requirePermission('roles', 'read'),
  securityController.getRole
);

router.put('/roles/:id',
  requirePermission('roles', 'update'),
  securityController.updateRole
);

router.delete('/roles/:id',
  requirePermission('roles', 'delete'),
  securityController.deleteRole
);

router.post('/roles/:roleId/assign',
  requirePermission('roles', 'manage'),
  securityController.assignRole
);

// Permission management
router.get('/permissions',
  requirePermission('permissions', 'read'),
  securityController.getPermissions
);

router.get('/permissions/matrix',
  requirePermission('permissions', 'read'),
  securityController.getPermissionMatrix
);

router.post('/permissions',
  requirePermission('permissions', 'create'),
  securityController.createPermission
);

// Audit logs
router.get('/audit-logs',
  requirePermission('audit_logs', 'read'),
  securityController.getAuditLogs
);

router.get('/audit-logs/summary',
  requirePermission('audit_logs', 'read'),
  securityController.getAuditSummary
);

router.get('/audit-logs/:id',
  requirePermission('audit_logs', 'read'),
  securityController.getAuditLog
);

// Security events
router.get('/events',
  requirePermission('security_events', 'read'),
  securityController.getSecurityEvents
);

router.get('/dashboard',
  requirePermission('security_events', 'read'),
  securityController.getSecurityDashboard
);

router.put('/events/:id',
  requirePermission('security_events', 'update'),
  securityController.updateSecurityEvent
);

router.post('/events/:id/assign',
  requirePermission('security_events', 'manage'),
  securityController.assignSecurityEvent
);

router.post('/events/:id/notes',
  requirePermission('security_events', 'update'),
  securityController.addInvestigationNote
);

router.post('/events/:id/resolve',
  requirePermission('security_events', 'manage'),
  securityController.resolveSecurityEvent
);

// Security monitoring
router.get('/metrics',
  requirePermission('system', 'read'),
  securityController.getSecurityMetrics
);

// Password validation
router.post('/password/validate', securityController.validatePassword);

// Security policies
router.get('/policies',
  requirePermission('system', 'read'),
  securityController.getSecurityPolicies
);

router.put('/policies',
  requirePermission('system', 'admin'),
  securityController.updateSecurityPolicies
);

module.exports = router;
