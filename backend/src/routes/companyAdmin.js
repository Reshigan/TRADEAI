const express = require('express');
const router = express.Router();
const companyAdminController = require('../controllers/companyAdminController');
const { authenticateToken } = require('../middleware/auth');

// Middleware to check company admin role
const requireCompanyAdmin = (req, res, next) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Company admin privileges required.'
    });
  }
  next();
};

// All routes require authentication and company admin role
router.use(authenticateToken);
router.use(requireCompanyAdmin);

// ==================== DASHBOARD ====================
router.get('/dashboard/stats', companyAdminController.getDashboardStats);

// ==================== LEARNING COURSES ====================
router.get('/courses', companyAdminController.getCourses);
router.get('/courses/:id', companyAdminController.getCourse);
router.post('/courses', companyAdminController.createCourse);
router.put('/courses/:id', companyAdminController.updateCourse);
router.delete('/courses/:id', companyAdminController.deleteCourse);

// ==================== GAMES ====================
router.get('/games', companyAdminController.getGames);
router.get('/games/:id', companyAdminController.getGame);
router.post('/games', companyAdminController.createGame);
router.put('/games/:id', companyAdminController.updateGame);
router.delete('/games/:id', companyAdminController.deleteGame);

// ==================== ANNOUNCEMENTS ====================
router.get('/announcements', companyAdminController.getAnnouncements);
router.get('/announcements/:id', companyAdminController.getAnnouncement);
router.post('/announcements', companyAdminController.createAnnouncement);
router.put('/announcements/:id', companyAdminController.updateAnnouncement);
router.delete('/announcements/:id', companyAdminController.deleteAnnouncement);
router.post('/announcements/:id/publish', companyAdminController.publishAnnouncement);

// ==================== POLICIES ====================
router.get('/policies', companyAdminController.getPolicies);
router.get('/policies/:id', companyAdminController.getPolicy);
router.post('/policies', companyAdminController.createPolicy);
router.put('/policies/:id', companyAdminController.updatePolicy);
router.delete('/policies/:id', companyAdminController.deletePolicy);
router.post('/policies/:id/publish', companyAdminController.publishPolicy);

// ==================== COMPANY SETTINGS ====================
router.get('/settings', companyAdminController.getSettings);
router.put('/settings', companyAdminController.updateSettings);
router.post('/settings/logo', companyAdminController.uploadLogo);

// ==================== AZURE AD INTEGRATION ====================
router.get('/azure-ad', companyAdminController.getAzureADConfig);
router.post('/azure-ad', companyAdminController.saveAzureADConfig);
router.post('/azure-ad/test', companyAdminController.testAzureADConnection);
router.post('/azure-ad/sync', companyAdminController.syncAzureAD);

// ==================== EMPLOYEES ====================
router.get('/employees', companyAdminController.getEmployees);
router.get('/employees/:id', companyAdminController.getEmployee);
router.post('/employees', companyAdminController.createEmployee);
router.put('/employees/:id', companyAdminController.updateEmployee);
router.post('/employees/:id/provision', companyAdminController.provisionEmployeeUser);

// ==================== DEPARTMENTS ====================
router.get('/departments', companyAdminController.getDepartments);
router.get('/departments/tree', companyAdminController.getDepartmentTree);
router.post('/departments', companyAdminController.createDepartment);
router.put('/departments/:id', companyAdminController.updateDepartment);

// ==================== USER MANAGEMENT ====================
router.get('/users', companyAdminController.getUsers);
router.get('/users/:id', companyAdminController.getUser);
router.post('/users', companyAdminController.createUser);
router.put('/users/:id', companyAdminController.updateUser);
router.patch('/users/:id/toggle-status', companyAdminController.toggleUserStatus);
router.patch('/users/:id/role', companyAdminController.updateUserRole);

// ==================== ERP SETTINGS ====================
router.get('/erp-settings', companyAdminController.getERPSettings);
router.put('/erp-settings', companyAdminController.updateERPSettings);
router.post('/erp-settings/test-sap', companyAdminController.testSAPConnection);
router.post('/erp-settings/test-erp', companyAdminController.testERPConnection);
router.post('/erp-settings/sync-master-data', companyAdminController.syncMasterData);
router.post('/erp-settings/sync-sales-data', companyAdminController.syncSalesData);
router.get('/erp-settings/sync-history', companyAdminController.getERPSyncHistory);

// ==================== AUDIT LOGS ====================
router.get('/audit-logs', companyAdminController.getAuditLogs);

module.exports = router;
