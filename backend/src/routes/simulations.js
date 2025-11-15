const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const revenueImpactService = require('../services/revenueImpactService');
const logger = require('../utils/logger');

router.use(authenticate);

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * POST /api/simulations/promotion
 * Simulate a promotion's impact using hierarchy-based calculations
 */
router.post('/promotion', [
  body('customers')
    .isArray({ min: 1 })
    .withMessage('At least one customer is required'),
  body('products')
    .isArray({ min: 1 })
    .withMessage('At least one product is required'),
  body('discountPercentage')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  body('promotionType')
    .optional()
    .isIn(['price_discount', 'volume_discount', 'bogo', 'bundle', 'gift', 'loyalty', 'display', 'feature'])
    .withMessage('Invalid promotion type'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { customers, products, discountPercentage, startDate, endDate, promotionType, budget } = req.body;
    const tenantId = req.user.tenantId;

    const impact = await revenueImpactService.calculatePromotionImpact(tenantId, {
      customers,
      products,
      discountPercentage,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      promotionType: promotionType || 'price_discount'
    });

    logger.logAudit({
      action: 'simulation_run',
      userId: req.user._id,
      tenantId,
      details: {
        type: 'promotion',
        customers: customers.length,
        products: products.length,
        discountPercentage,
        roi: impact.roi
      }
    });

    res.json({
      success: true,
      simulation: {
        id: `sim_${Date.now()}`,
        type: 'promotion',
        input: {
          customers,
          products,
          discountPercentage,
          startDate,
          endDate,
          promotionType: promotionType || 'price_discount'
        },
        results: impact,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Promotion simulation failed', {
      error: error.message,
      userId: req.user._id,
      tenantId: req.user.tenantId
    });

    res.status(500).json({
      success: false,
      error: 'Simulation failed',
      message: error.message
    });
  }
});

/**
 * POST /api/simulations/compare
 * Compare multiple promotion scenarios side-by-side
 */
router.post('/compare', [
  body('scenarios')
    .isArray({ min: 2, max: 5 })
    .withMessage('Must provide between 2 and 5 scenarios to compare'),
  body('scenarios.*.name')
    .isString()
    .withMessage('Each scenario must have a name'),
  body('scenarios.*.customers')
    .isArray({ min: 1 })
    .withMessage('Each scenario must have at least one customer'),
  body('scenarios.*.products')
    .isArray({ min: 1 })
    .withMessage('Each scenario must have at least one product'),
  body('scenarios.*.discountPercentage')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { scenarios, baseline } = req.body;
    const tenantId = req.user.tenantId;

    const results = await Promise.all(
      scenarios.map(async (scenario) => {
        const impact = await revenueImpactService.calculatePromotionImpact(tenantId, {
          customers: scenario.customers,
          products: scenario.products,
          discountPercentage: scenario.discountPercentage,
          startDate: new Date(scenario.startDate),
          endDate: new Date(scenario.endDate),
          promotionType: scenario.promotionType || 'price_discount'
        });

        return {
          name: scenario.name,
          input: scenario,
          results: impact
        };
      })
    );

    const comparison = {
      scenarios: results,
      baseline: baseline || results[0].results.baselineRevenue,
      deltas: results.map((result, index) => ({
        name: result.name,
        vsBaseline: {
          revenue: result.results.incrementalRevenue,
          roi: result.results.roi,
          spend: result.results.totalSpend
        },
        vsPrevious: index > 0 ? {
          revenue: result.results.incrementalRevenue - results[index - 1].results.incrementalRevenue,
          roi: result.results.roi - results[index - 1].results.roi,
          spend: result.results.totalSpend - results[index - 1].results.totalSpend
        } : null
      })),
      recommendation: results.reduce((best, current) =>
        current.results.roi > best.results.roi ? current : best
      ).name
    };

    logger.logAudit({
      action: 'simulation_compare',
      userId: req.user._id,
      tenantId,
      details: {
        scenarioCount: scenarios.length,
        recommendation: comparison.recommendation
      }
    });

    res.json({
      success: true,
      comparison,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Scenario comparison failed', {
      error: error.message,
      userId: req.user._id,
      tenantId: req.user.tenantId
    });

    res.status(500).json({
      success: false,
      error: 'Comparison failed',
      message: error.message
    });
  }
});

module.exports = router;
