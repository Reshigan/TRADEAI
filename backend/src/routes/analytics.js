const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

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

module.exports = router;