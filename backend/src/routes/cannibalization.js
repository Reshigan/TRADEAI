/**
 * Cannibalization Analysis Routes
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const cannibalizationController = require('../controllers/cannibalizationController');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route POST /api/cannibalization/analyze-promotion
 * @desc Analyze cannibalization impact of a promotion
 */
router.post('/analyze-promotion', cannibalizationController.analyzePromotion);

/**
 * @route POST /api/cannibalization/substitution-matrix
 * @desc Calculate substitution matrix for product category
 */
router.post('/substitution-matrix', cannibalizationController.calculateSubstitutionMatrix);

/**
 * @route POST /api/cannibalization/category-impact
 * @desc Analyze category-level cannibalization
 */
router.post('/category-impact', cannibalizationController.analyzeCategoryImpact);

/**
 * @route POST /api/cannibalization/net-incremental
 * @desc Calculate net incremental volume (gross - cannibalized)
 */
router.post('/net-incremental', cannibalizationController.calculateNetIncremental);

/**
 * @route POST /api/cannibalization/predict
 * @desc Predict cannibalization for planned promotion
 */
router.post('/predict', cannibalizationController.predictCannibalization);

module.exports = router;
