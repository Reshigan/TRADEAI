const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authorize, checkPermission } = require('../middleware/auth');
const { query, param } = require('express-validator');
const { validate } = require('../middleware/validation');

// Default dashboard - routes to appropriate dashboard based on role
router.get('/', async (req, res, next) => {
  try {
    // Return mock dashboard data for UAT testing
    res.json({
      success: true,
      data: {
        dashboardType: 'overview',
        metrics: {
          totalBudget: 5000000,
          usedBudget: 3250000,
          remainingBudget: 1750000,
          activePromotions: 24,
          completedPromotions: 156,
          roi: 2.3,
          lift: 18.5
        },
        recentActivity: [
          { id: 1, type: 'budget', action: 'created', date: new Date() },
          { id: 2, type: 'promotion', action: 'approved', date: new Date() }
        ]
      }
    });
  } catch (error) {
    next(error);
  }
});

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