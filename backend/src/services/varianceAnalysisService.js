const mongoose = require('mongoose');
const DataLineage = require('../models/DataLineage');
const VarianceReasonCode = require('../models/VarianceReasonCode');

class VarianceAnalysisService {
  constructor(tenantId) {
    this.tenantId = tenantId;
  }

  async analyzePromotionVariance(promotion) {
    const planned = promotion.financial?.planned || {};
    const actual = promotion.financial?.actual || {};
    const costs = promotion.financial?.costs || {};

    const variances = [];

    if (planned.promotionalVolume && actual.promotionalVolume) {
      const volumeVariance = this.calculateVariance(
        planned.promotionalVolume,
        actual.promotionalVolume,
        'volume'
      );
      variances.push({
        metric: 'volume',
        ...volumeVariance,
        category: 'volume_variance'
      });
    }

    if (planned.promotionalRevenue && actual.promotionalRevenue) {
      const revenueVariance = this.calculateVariance(
        planned.promotionalRevenue,
        actual.promotionalRevenue,
        'revenue'
      );
      variances.push({
        metric: 'revenue',
        ...revenueVariance,
        category: 'revenue_variance'
      });
    }

    const plannedCost = this.sumCosts(planned.costs || costs);
    const actualCost = this.sumCosts(actual.costs || costs);
    if (plannedCost > 0) {
      const spendVariance = this.calculateVariance(plannedCost, actualCost, 'spend');
      variances.push({
        metric: 'spend',
        ...spendVariance,
        category: 'spend_variance'
      });
    }

    if (planned.roi && actual.roi) {
      const roiVariance = this.calculateVariance(planned.roi, actual.roi, 'roi');
      variances.push({
        metric: 'roi',
        ...roiVariance,
        category: 'roi_variance'
      });
    }

    const suggestedReasonCodes = await this.suggestReasonCodes(variances);

    const summary = this.generateVarianceSummary(variances);

    return {
      promotionId: promotion._id,
      variances,
      suggestedReasonCodes,
      summary,
      analyzedAt: new Date()
    };
  }

  calculateVariance(planned, actual, metricType) {
    const absoluteVariance = actual - planned;
    const percentageVariance = planned !== 0
      ? (absoluteVariance / planned) * 100
      : 0;

    let direction, severity;

    if (metricType === 'spend') {
      direction = absoluteVariance > 0 ? 'unfavorable' : 'favorable';
    } else {
      direction = absoluteVariance > 0 ? 'favorable' : 'unfavorable';
    }

    const absPercent = Math.abs(percentageVariance);
    if (absPercent <= 5) {
      severity = 'low';
    } else if (absPercent <= 15) {
      severity = 'medium';
    } else {
      severity = 'high';
    }

    return {
      planned,
      actual,
      absoluteVariance: Math.round(absoluteVariance * 100) / 100,
      percentageVariance: Math.round(percentageVariance * 100) / 100,
      direction,
      severity
    };
  }

  sumCosts(costs) {
    if (!costs) return 0;
    return (costs.discountCost || 0) +
           (costs.marketingCost || 0) +
           (costs.cashCoopCost || 0) +
           (costs.displayCost || 0) +
           (costs.logisticsCost || 0) +
           (costs.totalCost || 0);
  }

  async suggestReasonCodes(variances) {
    const suggestions = [];

    for (const variance of variances) {
      if (variance.severity === 'low') continue;

      const reasonCodes = await VarianceReasonCode.find({
        tenantId: this.tenantId,
        category: variance.category,
        isActive: true,
        varianceDirection: { $in: [variance.direction === 'favorable' ? 'positive' : 'negative', 'both'] }
      }).limit(3);

      suggestions.push({
        metric: variance.metric,
        variance: variance.percentageVariance,
        direction: variance.direction,
        suggestedCodes: reasonCodes.map((rc) => ({
          code: rc.code,
          name: rc.name,
          description: rc.description,
          requiresEvidence: rc.requiresEvidence
        }))
      });
    }

    return suggestions;
  }

  generateVarianceSummary(variances) {
    const highSeverity = variances.filter((v) => v.severity === 'high');
    const unfavorable = variances.filter((v) => v.direction === 'unfavorable');

    let overallStatus;
    if (highSeverity.length === 0 && unfavorable.length === 0) {
      overallStatus = 'on_track';
    } else if (highSeverity.length > 0 && unfavorable.length > 1) {
      overallStatus = 'critical';
    } else if (unfavorable.length > 0) {
      overallStatus = 'attention_needed';
    } else {
      overallStatus = 'minor_variance';
    }

    const topDrivers = variances
      .sort((a, b) => Math.abs(b.absoluteVariance) - Math.abs(a.absoluteVariance))
      .slice(0, 3)
      .map((v) => ({
        metric: v.metric,
        impact: v.absoluteVariance,
        direction: v.direction
      }));

    return {
      overallStatus,
      totalVariances: variances.length,
      highSeverityCount: highSeverity.length,
      unfavorableCount: unfavorable.length,
      topDrivers
    };
  }

  async analyzeBudgetVariance(budget) {
    const variances = [];
    const monthlyVariances = [];

    if (budget.budgetLines && budget.budgetLines.length > 0) {
      for (const line of budget.budgetLines) {
        const monthVariance = {
          month: line.month,
          year: line.year,
          variances: []
        };

        if (line.salesTarget && line.actualSales !== undefined) {
          monthVariance.variances.push({
            metric: 'sales',
            ...this.calculateVariance(line.salesTarget, line.actualSales, 'sales')
          });
        }

        if (line.tradeSpend) {
          const categories = ['marketing', 'cashCoop', 'tradingTerms', 'promotions'];
          for (const cat of categories) {
            if (line.tradeSpend[cat]) {
              const planned = line.tradeSpend[cat].budget || 0;
              const actual = line.tradeSpend[cat].spent || 0;
              if (planned > 0) {
                monthVariance.variances.push({
                  metric: `${cat}_spend`,
                  ...this.calculateVariance(planned, actual, 'spend')
                });
              }
            }
          }
        }

        monthlyVariances.push(monthVariance);
      }
    }

    if (budget.annualTotals) {
      const totals = budget.annualTotals;

      if (totals.totalSalesTarget && totals.totalActualSales !== undefined) {
        variances.push({
          metric: 'annual_sales',
          ...this.calculateVariance(totals.totalSalesTarget, totals.totalActualSales, 'sales'),
          category: 'revenue_variance'
        });
      }

      if (totals.totalTradeSpendBudget && totals.totalTradeSpendActual !== undefined) {
        variances.push({
          metric: 'annual_trade_spend',
          ...this.calculateVariance(totals.totalTradeSpendBudget, totals.totalTradeSpendActual, 'spend'),
          category: 'spend_variance'
        });
      }
    }

    const suggestedReasonCodes = await this.suggestReasonCodes(variances);
    const summary = this.generateVarianceSummary(variances);

    return {
      budgetId: budget._id,
      annualVariances: variances,
      monthlyVariances,
      suggestedReasonCodes,
      summary,
      analyzedAt: new Date()
    };
  }

  async analyzeTradeSpendVariance(tradeSpend) {
    const variances = [];

    if (tradeSpend.amount) {
      const requested = tradeSpend.amount.requested || 0;
      const approved = tradeSpend.amount.approved || 0;
      const spent = tradeSpend.amount.spent || 0;

      if (requested > 0 && approved > 0) {
        variances.push({
          metric: 'approval_variance',
          ...this.calculateVariance(requested, approved, 'spend'),
          category: 'spend_variance'
        });
      }

      if (approved > 0 && spent > 0) {
        variances.push({
          metric: 'execution_variance',
          ...this.calculateVariance(approved, spent, 'spend'),
          category: 'spend_variance'
        });
      }
    }

    if (tradeSpend.performance) {
      const target = tradeSpend.performance.targetValue || 0;
      const actual = tradeSpend.performance.actualValue || 0;

      if (target > 0) {
        variances.push({
          metric: 'performance',
          ...this.calculateVariance(target, actual, 'performance'),
          category: 'execution_variance'
        });
      }
    }

    const suggestedReasonCodes = await this.suggestReasonCodes(variances);
    const summary = this.generateVarianceSummary(variances);

    return {
      tradeSpendId: tradeSpend._id,
      variances,
      suggestedReasonCodes,
      summary,
      analyzedAt: new Date()
    };
  }

  async tagVariance(entityType, entityId, metricType, reasonCodeId, notes, userId) {
    const reasonCode = await VarianceReasonCode.findById(reasonCodeId);
    if (!reasonCode) {
      throw new Error('Reason code not found');
    }

    await reasonCode.incrementUsage();

    let lineage = await DataLineage.findOne({
      tenantId: this.tenantId,
      entityType,
      entityId,
      metricType: 'variance'
    });

    if (!lineage) {
      lineage = new DataLineage({
        tenantId: this.tenantId,
        entityType,
        entityId,
        metricType: 'variance',
        calculatedValue: 0,
        calculationMethod: 'manual_tag',
        inputs: []
      });
    }

    lineage.manualOverride = {
      isOverridden: true,
      overriddenBy: userId,
      overriddenAt: new Date(),
      reason: notes,
      reasonCode: reasonCodeId
    };

    lineage.auditTrail.push({
      action: 'overridden',
      performedBy: userId,
      reason: `Tagged with reason code: ${reasonCode.code}`
    });

    await lineage.save();

    return {
      success: true,
      lineageId: lineage._id,
      reasonCode: {
        code: reasonCode.code,
        name: reasonCode.name
      }
    };
  }

  async getVarianceReport(entityType, startDate, endDate, options = {}) {
    const match = {
      tenantId: mongoose.Types.ObjectId(this.tenantId),
      entityType,
      metricType: 'variance',
      calculatedAt: { $gte: startDate, $lte: endDate }
    };

    if (options.hasReasonCode !== undefined) {
      match['manualOverride.isOverridden'] = options.hasReasonCode;
    }

    const report = await DataLineage.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'variancereasoncodes',
          localField: 'manualOverride.reasonCode',
          foreignField: '_id',
          as: 'reasonCode'
        }
      },
      { $unwind: { path: '$reasonCode', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$reasonCode.code',
          count: { $sum: 1 },
          reasonName: { $first: '$reasonCode.name' },
          category: { $first: '$reasonCode.category' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const untaggedCount = await DataLineage.countDocuments({
      ...match,
      'manualOverride.isOverridden': { $ne: true }
    });

    return {
      byReasonCode: report,
      untaggedCount,
      totalCount: report.reduce((sum, r) => sum + r.count, 0) + untaggedCount,
      period: { startDate, endDate }
    };
  }
}

module.exports = VarianceAnalysisService;
