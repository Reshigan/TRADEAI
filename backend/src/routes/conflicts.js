const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
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
 * POST /api/promotions/conflicts/preview
 * Preview conflicts for a proposed promotion without saving
 */
router.post('/preview', [
  body('customers')
    .isArray({ min: 1 })
    .withMessage('At least one customer is required'),
  body('products')
    .isArray({ min: 1 })
    .withMessage('At least one product is required'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { customers, products, startDate, endDate, excludePromotionId } = req.body;
    const tenantId = req.user.tenantId;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const overlapping = await Promotion.findOverlapping(
      tenantId,
      start,
      end,
      customers,
      products
    );

    const conflicts = overlapping.filter((promo) =>
      !excludePromotionId || promo._id.toString() !== excludePromotionId
    );

    const categorizedConflicts = conflicts.map((conflictPromo) => {
      const customerOverlap = customers.some((custId) =>
        conflictPromo.scope.customers.some((c) => c.customer.toString() === custId)
      );
      const productOverlap = products.some((prodId) =>
        conflictPromo.scope.products.some((p) => p.product.toString() === prodId)
      );

      let conflictType = 'timing';
      if (customerOverlap && productOverlap) {
        conflictType = 'full_overlap';
      } else if (customerOverlap) {
        conflictType = 'customer';
      } else if (productOverlap) {
        conflictType = 'product';
      }

      let severity = 'low';
      if (conflictType === 'full_overlap') {
        severity = 'high';
      } else if (customerOverlap || productOverlap) {
        severity = 'medium';
      }

      return {
        promotionId: conflictPromo._id,
        promotionName: conflictPromo.name,
        promotionType: conflictPromo.promotionType,
        period: {
          startDate: conflictPromo.period.startDate,
          endDate: conflictPromo.period.endDate
        },
        conflictType,
        severity,
        description: generateConflictDescription(conflictType, conflictPromo),
        suggestions: generateConflictSuggestions(conflictType, start, end, conflictPromo)
      };
    });

    const severityOrder = { high: 0, medium: 1, low: 2 };
    categorizedConflicts.sort((a, b) =>
      severityOrder[a.severity] - severityOrder[b.severity]
    );

    logger.logAudit({
      action: 'conflict_preview',
      userId: req.user._id,
      tenantId,
      details: {
        conflictCount: categorizedConflicts.length,
        highSeverity: categorizedConflicts.filter((c) => c.severity === 'high').length
      }
    });

    res.json({
      success: true,
      conflicts: categorizedConflicts,
      summary: {
        total: categorizedConflicts.length,
        high: categorizedConflicts.filter((c) => c.severity === 'high').length,
        medium: categorizedConflicts.filter((c) => c.severity === 'medium').length,
        low: categorizedConflicts.filter((c) => c.severity === 'low').length
      },
      hasBlockingConflicts: categorizedConflicts.some((c) => c.severity === 'high'),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Conflict preview failed', {
      error: error.message,
      userId: req.user._id,
      tenantId: req.user.tenantId
    });

    res.status(500).json({
      success: false,
      error: 'Conflict preview failed',
      message: error.message
    });
  }
});

function generateConflictDescription(conflictType, promotion) {
  switch (conflictType) {
    case 'full_overlap':
      return `Complete overlap with "${promotion.name}" - same customers, products, and timeframe`;
    case 'customer':
      return `Customer overlap with "${promotion.name}" during the same period`;
    case 'product':
      return `Product overlap with "${promotion.name}" during the same period`;
    case 'timing':
      return `Timing overlap with "${promotion.name}"`;
    default:
      return `Conflict with "${promotion.name}"`;
  }
}

function generateConflictSuggestions(conflictType, proposedStart, proposedEnd, conflictPromo) {
  const suggestions = [];

  if (conflictType === 'full_overlap') {
    suggestions.push('Consider merging these promotions into a single campaign');
    suggestions.push('Adjust timing to run sequentially instead of concurrently');
    suggestions.push('Narrow the scope to different customer or product segments');
  } else if (conflictType === 'customer' || conflictType === 'product') {
    suggestions.push('Adjust scope to exclude overlapping customers/products');
    suggestions.push('Coordinate with the other promotion to avoid cannibalization');
  }

  const conflictEnd = new Date(conflictPromo.period.endDate);
  const conflictStart = new Date(conflictPromo.period.startDate);

  if (proposedStart < conflictEnd) {
    const daysAfter = Math.ceil((conflictEnd - proposedStart) / (1000 * 60 * 60 * 24)) + 1;
    suggestions.push(`Start ${daysAfter} days later (after ${conflictEnd.toISOString().split('T')[0]})`);
  }

  if (proposedEnd > conflictStart) {
    const daysBefore = Math.ceil((proposedEnd - conflictStart) / (1000 * 60 * 60 * 24)) + 1;
    suggestions.push(`End ${daysBefore} days earlier (before ${conflictStart.toISOString().split('T')[0]})`);
  }

  return suggestions;
}

module.exports = router;
