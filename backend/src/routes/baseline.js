/**
 * Baseline Calculation Routes
 */

const express = require('express');
const router = express.Router();
const baselineController = require('../controllers/baselineController');
const { authenticateToken } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');

// Apply authentication
router.use(authenticateToken);

// Validation
const baselineValidation = [
  body('productId').isMongoId().withMessage('Invalid product ID'),
  body('customerId').optional().isMongoId().withMessage('Invalid customer ID'),
  body('promotionStartDate').isISO8601().withMessage('Invalid start date'),
  body('promotionEndDate').isISO8601().withMessage('Invalid end date')
];

// Get available methods
router.get('/methods', baselineController.getMethods);

// Calculate baseline
router.post('/calculate',
  baselineValidation,
  validate,
  baselineController.calculateBaseline
);

// Calculate incremental volume
router.post('/incremental',
  baselineValidation,
  validate,
  baselineController.calculateIncremental
);

module.exports = router;
