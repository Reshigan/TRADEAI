/**
 * Forward Buy Detection Routes
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const forwardBuyController = require('../controllers/forwardBuyController');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route POST /api/forward-buy/detect
 * @desc Detect forward buying effect for completed promotion
 */
router.post('/detect', forwardBuyController.detectForwardBuy);

/**
 * @route POST /api/forward-buy/net-impact
 * @desc Calculate net promotion impact (gross - forward buy)
 */
router.post('/net-impact', forwardBuyController.calculateNetPromotionImpact);

/**
 * @route POST /api/forward-buy/predict-risk
 * @desc Predict forward buy risk for planned promotion
 */
router.post('/predict-risk', forwardBuyController.predictForwardBuyRisk);

/**
 * @route POST /api/forward-buy/category-analysis
 * @desc Analyze forward buy patterns across product category
 */
router.post('/category-analysis', forwardBuyController.analyzeCategoryForwardBuy);

module.exports = router;
