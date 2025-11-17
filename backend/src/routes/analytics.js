const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { bulkOperationsLimiter } = require('../middleware/security');

// Get all analytics overview
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { period = '30days', currency = 'USD' } = req.query;

  const analytics = await analyticsController.getDashboardAnalytics({
    userId: req.user._id,
    period,
    currency
  });

  res.json({
    success: true,
    data: analytics
  });
}));

// Get dashboard analytics
router.get('/dashboard', authenticateToken, asyncHandler(async (req, res) => {
  const { period = '30days', currency = 'USD' } = req.query;

  const analytics = await analyticsController.getDashboardAnalytics({
    userId: req.user._id,
    period,
    currency
  });

  res.json({
    success: true,
    data: analytics
  });
}));

// Get available currencies
router.get('/currencies', asyncHandler((req, res) => {
  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' }
  ];

  res.json({
    success: true,
    data: currencies
  });
}));

// Get sales analytics
router.get('/sales', authenticateToken, asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy = 'month', customerId, productId } = req.query;

  const analytics = await analyticsController.getSalesAnalytics({
    startDate,
    endDate,
    groupBy,
    customerId,
    productId
  });

  res.json({
    success: true,
    data: analytics
  });
}));

// Get promotion analytics
router.get('/promotions', authenticateToken, asyncHandler((req, res) => {
  const { _year = new Date().getFullYear() } = req.query;

  // Return promotion analytics mock data
  res.json({
    success: true,
    data: {
      totalPromotions: 45,
      activePromotions: 12,
      avgROI: 2.34,
      totalInvestment: 1200000,
      totalRevenue: 2808000,
      topPromotions: [],
      performanceByType: {
        price_discount: { count: 20, roi: 2.5 },
        volume_discount: { count: 15, roi: 2.1 },
        bogo: { count: 10, roi: 2.8 }
      }
    }
  });
}));

// Get budget analytics
router.get('/budgets', authenticateToken, asyncHandler((req, res) => {
  const { _year = new Date().getFullYear(), _customerId } = req.query;

  // Return budget analytics mock data
  res.json({
    success: true,
    data: {
      totalBudget: 5000000,
      allocated: 3200000,
      spent: 2800000,
      remaining: 2200000,
      utilizationRate: 56,
      byCategory: {
        marketing: { budget: 2000000, spent: 1200000 },
        promotions: { budget: 1500000, spent: 900000 },
        trade_spend: { budget: 1500000, spent: 700000 }
      },
      forecast: {
        projectedSpend: 4500000,
        confidence: 85
      }
    }
  });
}));

// Get trade spend analytics
router.get('/trade-spend', authenticateToken, asyncHandler((req, res) => {
  const { _startDate, _endDate, _customerId, _vendorId } = req.query;

  // Return trade spend analytics mock data
  res.json({
    success: true,
    data: {
      totalSpend: 850000,
      approvedSpend: 650000,
      pendingSpend: 200000,
      avgApprovalTime: 3.5,
      byCategory: {
        marketing: 350000,
        cash_coop: 200000,
        trading_terms: 150000,
        rebate: 100000,
        promotion: 50000
      },
      byVendor: [],
      trends: {
        currentMonth: 120000,
        previousMonth: 95000,
        growth: 26.3
      },
      topSpends: []
    }
  });
}));

// Get customer analytics
router.get('/customers', authenticateToken, asyncHandler(async (req, res) => {
  const { period = '12months' } = req.query;

  const analytics = await analyticsController.getCustomerAnalytics({
    period
  });

  res.json({
    success: true,
    data: analytics
  });
}));

// Get product analytics
router.get('/products', authenticateToken, asyncHandler(async (req, res) => {
  const { period = '12months', category } = req.query;

  const analytics = await analyticsController.getProductAnalytics({
    period,
    category
  });

  res.json({
    success: true,
    data: analytics
  });
}));

// Get predictive analytics
router.get('/predictions', authenticateToken, asyncHandler(async (req, res) => {
  const { type, targetId, horizon = 3 } = req.query;

  if (!type || !targetId) {
    throw new AppError('Type and target ID are required', 400);
  }

  const predictions = await analyticsController.getPredictiveAnalytics({
    type,
    targetId,
    horizon: parseInt(horizon)
  });

  res.json({
    success: true,
    data: predictions
  });
}));

// ROI calculation routes
router.get('/roi/:promotionId', authenticateToken, analyticsController.calculateROI);
router.post('/bulk-roi', bulkOperationsLimiter, authenticateToken, analyticsController.bulkCalculateROI);

// Lift calculation routes
router.get('/lift/:promotionId', authenticateToken, analyticsController.calculateLift);
router.post('/bulk-lift', bulkOperationsLimiter, authenticateToken, analyticsController.bulkCalculateLift);

// Performance prediction
router.post('/predict', authenticateToken, analyticsController.predictPerformance);

// Spend optimization
router.post('/optimize-spend', authenticateToken, analyticsController.optimizeSpend);

// Insights and recommendations
router.get('/insights', authenticateToken, analyticsController.getInsights);

// Export functionality
router.get('/export', authenticateToken, analyticsController.exportAnalytics);

// Performance metrics
router.get('/performance', authenticateToken, analyticsController.getPerformanceMetrics);

// Cache management
router.delete('/cache', authenticateToken, analyticsController.clearCache);

// Advanced Analytics Routes
router.get('/advanced/performance', authenticateToken, analyticsController.getAdvancedPerformanceMetrics);
router.post('/advanced/predict', authenticateToken, analyticsController.getPredictiveAnalytics);
router.get('/advanced/recommendations', authenticateToken, analyticsController.getOptimizationRecommendations);
router.post('/advanced/bulk-roi', bulkOperationsLimiter, authenticateToken, analyticsController.bulkCalculateROI);
router.post('/advanced/bulk-lift', bulkOperationsLimiter, authenticateToken, analyticsController.bulkCalculateLift);

// Alias routes for common analytics endpoints (for backward compatibility)
router.get('/spend-trends', authenticateToken, asyncHandler((req, res) => {
  // Return trade-spend analytics mock data
  res.json({
    success: true,
    data: {
      totalSpend: 2500000,
      spendByType: {
        marketing: 800000,
        cash_coop: 600000,
        trading_terms: 500000,
        rebate: 400000,
        promotion: 200000
      },
      trends: [],
      periodComparison: {
        currentPeriod: 2500000,
        previousPeriod: 2200000,
        change: 13.6
      }
    }
  });
}));

router.get('/roi', authenticateToken, asyncHandler((req, res) => {
  // Return basic ROI metrics
  res.json({
    success: true,
    data: {
      averageROI: 2.45,
      totalInvestment: 1500000,
      totalRevenue: 3675000,
      topPerformers: []
    }
  });
}));

router.get('/vendor-performance', authenticateToken, asyncHandler((req, res) => {
  // Return vendor performance metrics
  res.json({
    success: true,
    data: {
      totalVendors: 0,
      activeVendors: 0,
      avgPerformanceScore: 0,
      vendors: []
    }
  });
}));

module.exports = router;
