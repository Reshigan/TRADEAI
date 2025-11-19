/**
 * MetricsService
 *
 * Service for calculating and materializing metrics snapshots
 * to avoid recomputing on every page load.
 */

const { getMetrics, formatMetricValue } = require('../config/registries/metricsRegistry');

class MetricsService {
  constructor() {
    this.snapshotCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Calculate metrics for a specific module and entity
   */
  async calculateMetrics(module, entityId, Model, context = {}) {
    const moduleMetrics = getMetrics(module);
    if (!moduleMetrics) {
      return {};
    }

    const results = {};

    for (const [metricId, metric] of Object.entries(moduleMetrics)) {
      try {
        const value = await this.calculateMetric(metric, entityId, Model, context);
        results[metricId] = {
          id: metricId,
          name: metric.name,
          value,
          formattedValue: formatMetricValue(value, metric.format, context.currency),
          unit: metric.unit,
          format: metric.format,
          trend: metric.trend,
          category: metric.category
        };
      } catch (error) {
        console.error(`Error calculating metric ${metricId}:`, error);
        results[metricId] = {
          id: metricId,
          name: metric.name,
          value: null,
          formattedValue: 'N/A',
          error: error.message
        };
      }
    }

    return results;
  }

  /**
   * Calculate a single metric
   */
  async calculateMetric(metric, entityId, Model, context = {}) {
    try {
      const entity = await Model.findById(entityId);
      if (!entity) {
        return null;
      }

      const calculator = this.getCalculatorForMetric(metric.id, context.module);
      if (calculator) {
        return await calculator(entity, Model, context);
      }

      return null;
    } catch (error) {
      console.error(`Error calculating metric ${metric.id}:`, error);
      return null;
    }
  }

  /**
   * Get calculator function for a specific metric
   */
  getCalculatorForMetric(metricId, module) {
    const calculators = {
      budget: {
        totalBudget: (entity) => entity.annualTotals?.tradeSpend?.total || 0,
        budgetUtilization: (entity) => {
          const total = entity.annualTotals?.tradeSpend?.total || 0;
          const spent = entity.spent || 0;
          return total > 0 ? (spent / total) * 100 : 0;
        },
        budgetRemaining: (entity) => {
          const total = entity.annualTotals?.tradeSpend?.total || 0;
          const spent = entity.spent || 0;
          return total - spent;
        },
        budgetBurnRate: (entity) => {
          const spent = entity.spent || 0;
          const startDate = new Date(entity.year, 0, 1);
          const now = new Date();
          const daysElapsed = Math.max(1, Math.floor((now - startDate) / (1000 * 60 * 60 * 24)));
          return spent / daysElapsed;
        },
        projectedSpend: (entity) => {
          const spent = entity.spent || 0;
          const startDate = new Date(entity.year, 0, 1);
          const endDate = new Date(entity.year, 11, 31);
          const now = new Date();
          const daysElapsed = Math.max(1, Math.floor((now - startDate) / (1000 * 60 * 60 * 24)));
          const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
          return (spent / daysElapsed) * totalDays;
        }
      },
      promotion: {
        totalPromotions: (entity, Model) => {
          return Model.countDocuments({ company: entity.company });
        },
        activePromotions: (entity, Model) => {
          return Model.countDocuments({ company: entity.company, status: 'active' });
        },
        promotionROI: (entity) => {
          const incrementalRevenue = entity.financial?.actual?.incrementalRevenue || 0;
          const totalCost = entity.financial?.costs?.totalCost || 0;
          return totalCost > 0 ? ((incrementalRevenue - totalCost) / totalCost) * 100 : 0;
        },
        incrementalSales: (entity) => {
          return entity.financial?.actual?.incrementalRevenue || 0;
        },
        promotionLift: (entity) => {
          const actual = entity.financial?.actual?.promotionalVolume || 0;
          const baseline = entity.financial?.actual?.baselineVolume || 0;
          return baseline > 0 ? ((actual - baseline) / baseline) * 100 : 0;
        },
        promotionCost: (entity) => {
          return entity.financial?.costs?.totalCost || 0;
        }
      },
      tradeSpend: {
        totalTradeSpend: async (entity, Model) => {
          const result = await Model.aggregate([
            { $match: { company: entity.company } },
            { $group: { _id: null, total: { $sum: '$amount.requested' } } }
          ]);
          return result[0]?.total || 0;
        },
        tradeSpendAccruals: async (entity, Model) => {
          const result = await Model.aggregate([
            { $match: { company: entity.company } },
            { $unwind: { path: '$accruals', preserveNullAndEmptyArrays: true } },
            { $group: { _id: null, total: { $sum: '$accruals.amount' } } }
          ]);
          return result[0]?.total || 0;
        },
        tradeSpendAsPercentOfSales: async (entity, Model, context) => {
          const accruals = await Model.aggregate([
            { $match: { company: entity.company } },
            { $unwind: { path: '$accruals', preserveNullAndEmptyArrays: true } },
            { $group: { _id: null, total: { $sum: '$accruals.amount' } } }
          ]);
          const totalAccruals = accruals[0]?.total || 0;
          const netSales = context.netSales || 1;
          return netSales > 0 ? (totalAccruals / netSales) * 100 : 0;
        },
        tradeSpendROI: (entity) => {
          const incrementalRevenue = entity.performance?.actualValue || 0;
          const spent = entity.amount?.spent || 0;
          return spent > 0 ? ((incrementalRevenue - spent) / spent) * 100 : 0;
        }
      },
      claim: {
        totalClaims: (entity, Model) => {
          return Model.countDocuments({ company: entity.company });
        },
        claimAmount: async (entity, Model) => {
          const result = await Model.aggregate([
            { $match: { company: entity.company } },
            { $group: { _id: null, total: { $sum: '$claimAmount' } } }
          ]);
          return result[0]?.total || 0;
        },
        claimApprovalRate: async (entity, Model) => {
          const total = await Model.countDocuments({ company: entity.company });
          const approved = await Model.countDocuments({ company: entity.company, status: 'approved' });
          return total > 0 ? (approved / total) * 100 : 0;
        },
        averageClaimProcessingTime: async (entity, Model) => {
          const claims = await Model.find({
            company: entity.company,
            submittedAt: { $exists: true },
            reviewedAt: { $exists: true }
          }).lean();
          if (claims.length === 0) return 0;
          const totalDays = claims.reduce((sum, claim) => {
            const days = Math.floor((new Date(claim.reviewedAt) - new Date(claim.submittedAt)) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0);
          return totalDays / claims.length;
        },
        pendingClaims: (entity, Model) => {
          return Model.countDocuments({ company: entity.company, status: { $in: ['submitted', 'under_review'] } });
        }
      },
      deduction: {
        totalDeductions: (entity, Model) => {
          return Model.countDocuments({ company: entity.company });
        },
        deductionAmount: async (entity, Model) => {
          const result = await Model.aggregate([
            { $match: { company: entity.company } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ]);
          return result[0]?.total || 0;
        },
        deductionResolutionRate: async (entity, Model) => {
          const total = await Model.countDocuments({ company: entity.company });
          const resolved = await Model.countDocuments({ company: entity.company, status: 'resolved' });
          return total > 0 ? (resolved / total) * 100 : 0;
        },
        averageResolutionTime: async (entity, Model) => {
          const deductions = await Model.find({
            company: entity.company,
            identificationDate: { $exists: true },
            resolutionDate: { $exists: true }
          }).lean();
          if (deductions.length === 0) return 0;
          const totalDays = deductions.reduce((sum, deduction) => {
            const days = Math.floor((new Date(deduction.resolutionDate) - new Date(deduction.identificationDate)) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0);
          return totalDays / deductions.length;
        },
        validDeductionRate: async (entity, Model) => {
          const total = await Model.countDocuments({ company: entity.company });
          const valid = await Model.countDocuments({ company: entity.company, resolution: 'valid' });
          return total > 0 ? (valid / total) * 100 : 0;
        }
      }
    };

    return calculators[module]?.[metricId] || null;
  }

  /**
   * Get or calculate metrics with caching
   */
  async getMetricsWithCache(module, entityId, Model, context = {}) {
    const cacheKey = `${module}-${entityId}`;
    const cached = this.snapshotCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }

    const metrics = await this.calculateMetrics(module, entityId, Model, context);

    this.snapshotCache.set(cacheKey, {
      data: metrics,
      timestamp: Date.now()
    });

    return metrics;
  }

  /**
   * Materialize metrics snapshot to database
   */
  materializeSnapshot(module, entityId, metrics) {
    const cacheKey = `${module}-${entityId}`;
    this.snapshotCache.set(cacheKey, {
      data: metrics,
      timestamp: Date.now()
    });

    return metrics;
  }

  /**
   * Clear cache for a specific entity
   */
  clearCache(module, entityId) {
    const cacheKey = `${module}-${entityId}`;
    this.snapshotCache.delete(cacheKey);
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    this.snapshotCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.snapshotCache.size,
      timeout: this.cacheTimeout,
      entries: Array.from(this.snapshotCache.keys())
    };
  }
}

// Singleton instance
const metricsService = new MetricsService();

module.exports = metricsService;
