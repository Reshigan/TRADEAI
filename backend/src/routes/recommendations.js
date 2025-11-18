const express = require('express');
const router = express.Router();
const { body, _query, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const revenueImpactService = require('../services/revenueImpactService');
const Customer = require('../models/Customer');
// const Product = require('../models/Product');
const _Promotion = require('../models/_Promotion');
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
 * POST /api/recommendations/next-best-promotion
 * Recommend next-best promotions for JAMs based on customer segments and product performance
 */
router.post('/next-best-promotion', [
  body('customerId')
    .optional()
    .isString()
    .withMessage('Customer ID must be a string'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { customerId, limit = 5 } = req.body;
    const tenantId = req.user.tenantId;

    let targetCustomers = [];

    if (customerId) {
      const customer = await Customer.findOne({ _id: customerId, tenantId });
      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }
      targetCustomers = [customer];
    } else {
      const segmentation = await revenueImpactService.segmentCustomers(tenantId, 'rfm');

      const highValueSegments = segmentation.segments.filter((seg) =>
        ['Champions', 'Loyal', 'Potential Loyalists', 'At Risk'].includes(seg.segment)
      );

      targetCustomers = highValueSegments.flatMap((seg) => seg.customers).slice(0, 10);
    }

    const recommendations = [];

    for (const customer of targetCustomers.slice(0, limit)) {
      const productRecs = await revenueImpactService.recommendProducts(
        tenantId,
        customer._id || customer,
        { limit: 3 }
      );

      for (const productRec of productRecs.recommendations.slice(0, 2)) {
        const discountLevels = [10, 15, 20];

        const impacts = await Promise.all(
          discountLevels.map(async (discount) => {
            try {
              const impact = await revenueImpactService.calculatePromotionImpact(tenantId, {
                customers: [customer._id || customer],
                products: [productRec.product._id],
                discountPercentage: discount,
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                promotionType: 'price_discount'
              });
              return { discount, impact };
            } catch (error) {
              logger.error('Failed to calculate impact for recommendation', {
                error: error.message,
                customerId: customer._id,
                productId: productRec.product._id
              });
              return null;
            }
          })
        );

        const validImpacts = impacts.filter((i) => i !== null);
        if (validImpacts.length === 0) continue;

        const bestDiscount = validImpacts.reduce((best, current) =>
          current.impact.roi > best.impact.roi ? current : best
        );

        recommendations.push({
          customer: {
            id: customer._id || customer,
            name: customer.name,
            tier: customer.tier
          },
          product: {
            id: productRec.product._id,
            name: productRec.product.name,
            sku: productRec.product.sku
          },
          recommendedDiscount: bestDiscount.discount,
          expectedImpact: {
            baselineRevenue: bestDiscount.impact.baselineRevenue,
            promotionalRevenue: bestDiscount.impact.promotionalRevenue,
            incrementalRevenue: bestDiscount.impact.incrementalRevenue,
            roi: bestDiscount.impact.roi,
            totalSpend: bestDiscount.impact.totalSpend
          },
          confidence: bestDiscount.impact.confidence,
          reasoning: `Based on ${productRec.reasoning}. Optimal discount of ${bestDiscount.discount}% yields ${bestDiscount.impact.roi.toFixed(1)}% ROI.`,
          priority: bestDiscount.impact.roi > 150 ? 'high' : bestDiscount.impact.roi > 100 ? 'medium' : 'low'
        });
      }
    }

    recommendations.sort((a, b) => b.expectedImpact.roi - a.expectedImpact.roi);

    logger.logAudit({
      action: 'next_best_promotion_recommendation',
      userId: req.user._id,
      tenantId,
      details: {
        customerId,
        recommendationCount: recommendations.length
      }
    });

    res.json({
      success: true,
      recommendations: recommendations.slice(0, limit),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Next-best promotion recommendation failed', {
      error: error.message,
      userId: req.user._id,
      tenantId: req.user.tenantId
    });

    res.status(500).json({
      success: false,
      error: 'Recommendation failed',
      message: error.message
    });
  }
});

module.exports = router;
