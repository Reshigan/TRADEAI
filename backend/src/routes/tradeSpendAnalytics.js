const express = require('express');
const router = express.Router();
const tradeSpendAnalyticsController = require('../controllers/tradeSpendAnalyticsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/dashboard', authorize(['admin', 'manager', 'user']), tradeSpendAnalyticsController.getDashboardMetrics);

router.get('/spend-analysis', authorize(['admin', 'manager', 'user']), tradeSpendAnalyticsController.getSpendAnalysis);

router.get('/campaign-performance', authorize(['admin', 'manager', 'user']), tradeSpendAnalyticsController.getCampaignPerformance);

router.get('/customer-analytics', authorize(['admin', 'manager', 'user']), tradeSpendAnalyticsController.getCustomerAnalytics);

router.get('/product-performance', authorize(['admin', 'manager', 'user']), tradeSpendAnalyticsController.getProductPerformance);

router.get('/rebate-effectiveness', authorize(['admin', 'manager', 'user']), tradeSpendAnalyticsController.getRebateEffectiveness);

router.get('/forecast', authorize(['admin', 'manager']), tradeSpendAnalyticsController.getForecastData);

module.exports = router;
