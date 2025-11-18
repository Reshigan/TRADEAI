const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const _revenueImpactService = require('../services/_revenueImpactService');
const _Budget = require('../models/_Budget');
const Promotion = require('../models/Promotion');
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
 * POST /api/optimizer/budget/reallocate
 * Recommend budget reallocation based on ROI performance
 */
router.post('/budget/reallocate', [
  body('budgetId')
    .optional()
    .isString()
    .withMessage('Budget ID must be a string'),
  body('minROI')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum ROI must be a positive number'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { _budgetId, minROI = 100 } = req.body;
    const tenantId = req.user.tenantId;

    const promotions = await Promotion.find({
      tenantId,
      status: { $in: ['active', 'completed'] },
      'aiPredictions.predictedROI.value': { $exists: true }
    }).populate('scope.customers.customer scope.products.product');

    if (promotions.length === 0) {
      return res.json({
        success: true,
        recommendations: [],
        message: 'No promotions found with ROI data'
      });
    }

    const underperforming = [];
    const highPerforming = [];

    for (const promo of promotions) {
      const roi = promo.aiPredictions?.actualROI || promo.aiPredictions?.predictedROI?.value || 0;
      const spend = promo.financial?.budget?.total || 0;

      if (roi < minROI && spend > 0) {
        underperforming.push({
          promotion: promo,
          roi,
          spend,
          potentialSavings: spend * (1 - roi / 100)
        });
      } else if (roi > minROI * 1.5 && spend > 0) {
        highPerforming.push({
          promotion: promo,
          roi,
          spend,
          potentialGain: spend * (roi / 100 - 1)
        });
      }
    }

    underperforming.sort((a, b) => b.potentialSavings - a.potentialSavings);
    highPerforming.sort((a, b) => b.potentialGain - a.potentialGain);

    const recommendations = [];
    let totalReallocation = 0;

    for (let i = 0; i < Math.min(underperforming.length, 5); i++) {
      const under = underperforming[i];
      const reallocationAmount = under.spend * 0.3; // Reallocate 30% of underperforming budget

      if (highPerforming.length > 0) {
        const high = highPerforming[i % highPerforming.length];

        recommendations.push({
          type: 'reallocate',
          from: {
            promotionId: under.promotion._id,
            promotionName: under.promotion.name,
            currentROI: under.roi,
            currentSpend: under.spend
          },
          to: {
            promotionId: high.promotion._id,
            promotionName: high.promotion.name,
            currentROI: high.roi,
            currentSpend: high.spend
          },
          amount: reallocationAmount,
          expectedImpact: {
            revenueGain: reallocationAmount * (high.roi / 100 - under.roi / 100),
            roiImprovement: high.roi - under.roi
          },
          confidence: 0.75,
          priority: under.roi < minROI * 0.5 ? 'high' : 'medium',
          reasoning: `Reallocate ${(reallocationAmount / 1000).toFixed(1)}K from low-ROI (${under.roi.toFixed(1)}%) to high-ROI (${high.roi.toFixed(1)}%) promotion for ${((high.roi - under.roi) * reallocationAmount / 100 / 1000).toFixed(1)}K additional revenue.`
        });

        totalReallocation += reallocationAmount;
      } else {
        recommendations.push({
          type: 'reduce',
          from: {
            promotionId: under.promotion._id,
            promotionName: under.promotion.name,
            currentROI: under.roi,
            currentSpend: under.spend
          },
          amount: reallocationAmount,
          expectedImpact: {
            savingsRealized: reallocationAmount * (1 - under.roi / 100)
          },
          confidence: 0.8,
          priority: 'high',
          reasoning: `Reduce spend on underperforming promotion (${under.roi.toFixed(1)}% ROI) to save ${(reallocationAmount * (1 - under.roi / 100) / 1000).toFixed(1)}K.`
        });

        totalReallocation += reallocationAmount;
      }
    }

    const summary = {
      totalReallocation,
      expectedRevenueGain: recommendations.reduce((sum, rec) =>
        sum + (rec.expectedImpact.revenueGain || 0), 0
      ),
      expectedSavings: recommendations.reduce((sum, rec) =>
        sum + (rec.expectedImpact.savingsRealized || 0), 0
      ),
      underperformingCount: underperforming.length,
      highPerformingCount: highPerforming.length
    };

    logger.logAudit({
      action: 'budget_reallocation_recommendation',
      userId: req.user._id,
      tenantId,
      details: {
        recommendationCount: recommendations.length,
        totalReallocation,
        expectedRevenueGain: summary.expectedRevenueGain
      }
    });

    res.json({
      success: true,
      recommendations,
      summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Budget reallocation recommendation failed', {
      error: error.message,
      userId: req.user._id,
      tenantId: req.user.tenantId
    });

    res.status(500).json({
      success: false,
      error: 'Reallocation recommendation failed',
      message: error.message
    });
  }
});

module.exports = router;
