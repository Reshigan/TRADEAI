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
router.get('/currencies', asyncHandler(async (req, res) => {
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
router.get('/promotions', authenticateToken, asyncHandler(async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;
  
  const analytics = await analyticsController.getPromotionAnalytics({
    year: parseInt(year)
  });
  
  res.json({
    success: true,
    data: analytics
  });
}));

// Get budget analytics
router.get('/budgets', authenticateToken, asyncHandler(async (req, res) => {
  const { year = new Date().getFullYear(), customerId } = req.query;
  
  const analytics = await analyticsController.getBudgetAnalytics({
    year: parseInt(year),
    customerId
  });
  
  res.json({
    success: true,
    data: analytics
  });
}));

// Get trade spend analytics
router.get('/trade-spend', authenticateToken, asyncHandler(async (req, res) => {
  const { startDate, endDate, customerId, vendorId } = req.query;
  
  const analytics = await analyticsController.getTradeSpendAnalytics({
    startDate,
    endDate,
    customerId,
    vendorId
  });
  
  res.json({
    success: true,
    data: analytics
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

module.exports = router;