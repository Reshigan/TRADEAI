const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authorize, checkPermission } = require('../middleware/auth');
const { query, param } = require('express-validator');
const { validate } = require('../middleware/validation');

// Executive Dashboard - restricted to senior roles
router.get('/executive',
  authorize('director', 'board', 'admin', 'super_admin'),
  query('year').optional().isInt({ min: 2020, max: 2030 }),
  validate,
  dashboardController.getExecutiveDashboard
);

// KAM Dashboard - for sales team
router.get('/kam',
  authorize('kam', 'sales_rep', 'manager', 'director', 'admin', 'super_admin'),
  query('customerId').optional().isMongoId(),
  query('year').optional().isInt({ min: 2020, max: 2030 }),
  validate,
  dashboardController.getKAMDashboard
);

// Analytics Dashboard - for analysts and management
router.get('/analytics',
  authorize('analyst', 'manager', 'director', 'board', 'admin', 'super_admin'),
  query('startDate').optional().isISO8601().toDate(),
  query('endDate').optional().isISO8601().toDate(),
  query('groupBy').optional().isIn(['day', 'week', 'month', 'quarter', 'year']),
  validate,
  dashboardController.getAnalyticsDashboard
);

// Subscribe to real-time updates
router.post('/subscribe/:dashboardType',
  param('dashboardType').isIn(['executive', 'kam', 'analytics']),
  validate,
  dashboardController.subscribeToUpdates
);

module.exports = router;