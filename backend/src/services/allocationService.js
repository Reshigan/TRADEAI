const mongoose = require('mongoose');
const SalesHistory = require('../models/SalesHistory');
const SalesTransaction = require('../models/SalesTransaction');
const scopeResolver = require('../utils/scopeResolver');

/**
 * Allocation Service
 * Handles proportional allocation of amounts across product/customer hierarchies
 * based on historical sales data (volume or revenue)
 */

class AllocationService {
  /**
   * Calculate allocation weights from sales history
   * @param {string} companyId - Company ID for tenant isolation
   * @param {Array} leafIds - Array of leaf entity IDs to calculate weights for
   * @param {string} entityType - 'product' or 'customer'
   * @param {string} metric - 'volume' or 'revenue'
   * @param {Date} startDate - Period start date
   * @param {Date} endDate - Period end date
   * @returns {Promise<Object>} Weights object { entityId: weight, ... }
   */
  async calculateWeights(companyId, leafIds, entityType, metric, startDate, endDate) {
    if (!leafIds || leafIds.length === 0) {
      return {};
    }

    const fieldName = entityType === 'product' ? 'product' : 'customer';
    const metricField = metric === 'volume' ? '$quantity' : '$revenue.gross';

    const objectIds = leafIds.map((id) =>
      id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(id)
    );

    const pipeline = [
      {
        $match: {
          company: new mongoose.Types.ObjectId(companyId),
          [fieldName]: { $in: objectIds },
          date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }
      },
      {
        $group: {
          _id: `$${fieldName}`,
          totalMetric: { $sum: metricField }
        }
      }
    ];

    let results;
    try {
      results = await SalesHistory.aggregate(pipeline);
    } catch (_err) {
      results = await SalesTransaction.aggregate(pipeline);
    }

    const metricTotals = {};
    let grandTotal = 0;

    for (const result of results) {
      const entityId = result._id.toString();
      metricTotals[entityId] = result.totalMetric || 0;
      grandTotal += result.totalMetric || 0;
    }

    const weights = {};

    if (grandTotal === 0) {
      const equalWeight = 1 / leafIds.length;
      for (const id of leafIds) {
        weights[id.toString()] = equalWeight;
      }
    } else {
      for (const id of leafIds) {
        const idStr = id.toString();
        weights[idStr] = (metricTotals[idStr] || 0) / grandTotal;
      }
    }

    return weights;
  }

  /**
   * Allocate an amount proportionally based on weights
   * Uses deterministic rounding to ensure total matches
   * @param {number} totalAmount - Total amount to allocate
   * @param {Object} weights - Weights object { entityId: weight, ... }
   * @param {number} precision - Decimal precision (default 2 for currency)
   * @returns {Object} Allocations { entityId: allocatedAmount, ... }
   */
  allocateAmount(totalAmount, weights, precision = 2) {
    const allocations = {};
    const multiplier = Math.pow(10, precision);
    let allocatedSum = 0;
    let maxWeight = 0;
    let maxWeightId = null;

    const sortedIds = Object.keys(weights).sort((a, b) => weights[b] - weights[a]);

    for (const entityId of sortedIds) {
      const weight = weights[entityId];
      const rawAmount = totalAmount * weight;
      const roundedAmount = Math.floor(rawAmount * multiplier) / multiplier;

      allocations[entityId] = roundedAmount;
      allocatedSum += roundedAmount;

      if (weight > maxWeight) {
        maxWeight = weight;
        maxWeightId = entityId;
      }
    }

    const remainder = Math.round((totalAmount - allocatedSum) * multiplier) / multiplier;
    if (remainder !== 0 && maxWeightId) {
      allocations[maxWeightId] = Math.round((allocations[maxWeightId] + remainder) * multiplier) / multiplier;
    }

    return allocations;
  }

  /**
   * Preview allocation without persisting
   * @param {string} companyId - Company ID
   * @param {string} entityType - 'product' or 'customer'
   * @param {Object} selector - Scope selector
   * @param {number} amount - Amount to allocate
   * @param {string} metric - 'volume' or 'revenue'
   * @param {Date} periodStart - Period start date
   * @param {Date} periodEnd - Period end date
   * @returns {Promise<Object>} Preview result with allocations and metadata
   */
  async previewAllocation(companyId, entityType, selector, amount, metric, periodStart, periodEnd) {
    const validation = scopeResolver.validateSelector(selector);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const leafIds = await scopeResolver.resolveToLeaves(companyId, entityType, selector);

    if (leafIds.length === 0) {
      return {
        success: false,
        error: 'No entities found matching the selector',
        allocations: [],
        metadata: { entityCount: 0, totalAmount: amount }
      };
    }

    const weights = await this.calculateWeights(
      companyId,
      leafIds,
      entityType,
      metric,
      periodStart,
      periodEnd
    );

    const allocations = this.allocateAmount(amount, weights);

    const Model = entityType === 'product'
      ? require('../models/Product')
      : require('../models/Customer');

    const entities = await Model.find({
      _id: { $in: leafIds }
    }).select('_id name code sku hierarchy');

    const entityMap = {};
    for (const entity of entities) {
      entityMap[entity._id.toString()] = entity;
    }

    const allocationDetails = Object.entries(allocations).map(([entityId, allocatedAmount]) => {
      const entity = entityMap[entityId];
      return {
        entityId,
        entityName: entity?.name || 'Unknown',
        entityCode: entity?.code || entity?.sku || entityId,
        weight: weights[entityId],
        weightPercentage: `${(weights[entityId] * 100).toFixed(2)}%`,
        allocatedAmount,
        hierarchy: entity?.hierarchy
      };
    });

    allocationDetails.sort((a, b) => b.allocatedAmount - a.allocatedAmount);

    const totalAllocated = Object.values(allocations).reduce((sum, amt) => sum + amt, 0);

    return {
      success: true,
      allocations: allocationDetails,
      metadata: {
        entityType,
        entityCount: leafIds.length,
        totalAmount: amount,
        totalAllocated,
        metric,
        periodStart,
        periodEnd,
        selector,
        hasHistoricalData: Object.values(weights).some((w) => w > 0 && w !== 1 / leafIds.length)
      }
    };
  }

  /**
   * Execute allocation and return results for persistence
   * @param {string} companyId - Company ID
   * @param {string} sourceType - Source type (promotion, budget, trade_spend, etc.)
   * @param {string} sourceId - Source document ID
   * @param {string} entityType - 'product' or 'customer'
   * @param {Object} selector - Scope selector
   * @param {number} amount - Amount to allocate
   * @param {string} metric - 'volume' or 'revenue'
   * @param {Date} periodStart - Period start date
   * @param {Date} periodEnd - Period end date
   * @param {string} userId - User performing the allocation
   * @returns {Promise<Object>} Allocation result for persistence
   */
  async executeAllocation(companyId, sourceType, sourceId, entityType, selector, amount, metric, periodStart, periodEnd, userId) {
    const preview = await this.previewAllocation(
      companyId,
      entityType,
      selector,
      amount,
      metric,
      periodStart,
      periodEnd
    );

    if (!preview.success) {
      return preview;
    }

    return {
      success: true,
      allocation: {
        companyId,
        sourceType,
        sourceId,
        entityType,
        selector,
        basisMetric: metric,
        periodStart,
        periodEnd,
        totalAmount: amount,
        allocations: preview.allocations.map((a) => ({
          entityId: a.entityId,
          entityName: a.entityName,
          entityCode: a.entityCode,
          weight: a.weight,
          amount: a.allocatedAmount
        })),
        createdBy: userId,
        createdAt: new Date()
      },
      metadata: preview.metadata
    };
  }

  /**
   * Recalculate allocation with updated sales data
   * @param {Object} existingAllocation - Existing allocation document
   * @param {Date} newPeriodEnd - New period end date (optional)
   * @returns {Promise<Object>} Updated allocation
   */
  async recalculateAllocation(existingAllocation, newPeriodEnd = null) {
    const periodEnd = newPeriodEnd || existingAllocation.periodEnd;

    const result = await this.executeAllocation(
      existingAllocation.companyId,
      existingAllocation.sourceType,
      existingAllocation.sourceId,
      existingAllocation.entityType,
      existingAllocation.selector,
      existingAllocation.totalAmount,
      existingAllocation.basisMetric,
      existingAllocation.periodStart,
      periodEnd,
      existingAllocation.createdBy
    );

    return result;
  }

  /**
   * Get allocation summary statistics
   * @param {Array} allocations - Array of allocation amounts
   * @returns {Object} Statistics
   */
  getStatistics(allocations) {
    if (!allocations || allocations.length === 0) {
      return { min: 0, max: 0, mean: 0, median: 0, stdDev: 0 };
    }

    const amounts = allocations.map((a) => a.allocatedAmount || a.amount || 0);
    const sorted = [...amounts].sort((a, b) => a - b);
    const sum = amounts.reduce((s, v) => s + v, 0);
    const mean = sum / amounts.length;

    const squaredDiffs = amounts.map((v) => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((s, v) => s + v, 0) / amounts.length;
    const stdDev = Math.sqrt(avgSquaredDiff);

    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: Math.round(mean * 100) / 100,
      median: Math.round(median * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      count: amounts.length
    };
  }
}

module.exports = new AllocationService();
