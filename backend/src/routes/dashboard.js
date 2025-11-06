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

// Dashboard stats endpoint for frontend-v2
router.get('/stats', async (req, res, next) => {
  try {
    const Customer = require('../models/Customer');
    const Product = require('../models/Product');
    const Promotion = require('../models/Promotion');
    const TradeSpend = require('../models/TradeSpend');

    // Get current counts
    const totalCustomers = await Customer.countDocuments({ status: { $ne: 'deleted' } });
    const totalProducts = await Product.countDocuments({ status: { $ne: 'deleted' } });
    const activePromotions = await Promotion.countDocuments({ 
      status: 'active',
      'period.endDate': { $gte: new Date() }
    });

    // Calculate total revenue from trade spends
    const revenueResult = await TradeSpend.aggregate([
      { $match: { status: { $in: ['approved', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$amount.spent' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Return stats
    res.json({
      success: true,
      data: {
        totalRevenue,
        revenueChange: 0,
        activePromotions,
        promotionsChange: 0,
        totalCustomers,
        customersChange: 0,
        totalProducts,
        productsChange: 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// Dashboard activity endpoint
router.get('/activity', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    // For now, return empty array - can be populated later
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    next(error);
  }
});

// Dashboard chart data endpoint
router.get('/charts/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    // For now, return empty array - can be populated later
    res.json({
      success: true,
      data: []
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