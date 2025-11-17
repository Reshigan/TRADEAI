/**
 * Advanced Budget Management Service
 *
 * Features:
 * - Multi-level budget hierarchy (parent-child relationships)
 * - Budget variance analysis with forecasts
 * - Automated budget alerts and notifications
 * - Budget vs actual tracking with trending
 * - What-if scenario analysis
 */

const Budget = require('../models/Budget');
const TradeSpend = require('../models/TradeSpend');
const Accrual = require('../models/Accrual');
const logger = require('../../utils/logger');
const { safeNumber, calculatePercentage } = require('../../utils/safeNumbers');

class AdvancedBudgetService {

  /**
   * Calculate comprehensive budget variance analysis
   */
  async calculateVarianceAnalysis(params) {
    const { tenant, year, month, category, customerId } = params;

    try {
      const query = { tenant };
      if (year) query.year = year;
      if (month) query.month = month;
      if (category) query.category = category;
      if (customerId) query.customerId = customerId;

      const budgets = await Budget.find(query)
        .populate('customerId')
        .populate('parentBudgetId')
        .sort({ year: -1, month: -1 });

      const analysis = {
        period: { year, month },
        generatedAt: new Date(),
        summary: {
          totalBudget: 0,
          totalActual: 0,
          totalCommitted: 0,
          totalRemaining: 0,
          totalVariance: 0,
          variancePercent: 0,
          utilizationPercent: 0,
          budgetCount: budgets.length
        },
        budgets: [],
        alerts: [],
        trends: []
      };

      for (const budget of budgets) {
        // Get actual spend for this budget
        const actualSpend = await this.getActualSpend(budget);
        const committed = await this.getCommittedSpend(budget);

        const budgetAmount = safeNumber(budget.amount, 0);
        const remaining = budgetAmount - actualSpend - committed;
        const variance = budgetAmount - actualSpend;
        const variancePercent = calculatePercentage(variance, budgetAmount);
        const utilizationPercent = calculatePercentage(actualSpend, budgetAmount);

        // Forecast to period end
        const forecast = await this.forecastSpend(budget, actualSpend);
        const projectedVariance = budgetAmount - forecast;
        const projectedVariancePercent = calculatePercentage(projectedVariance, budgetAmount);

        const budgetAnalysis = {
          budgetId: budget._id,
          budgetName: budget.name || `${budget.category} ${budget.year}-${budget.month}`,
          category: budget.category,
          customer: budget.customerId?.name,
          period: {
            year: budget.year,
            month: budget.month,
            quarter: Math.ceil(budget.month / 3)
          },
          amounts: {
            budget: budgetAmount,
            actual: actualSpend,
            committed,
            remaining,
            variance,
            forecast,
            projectedVariance
          },
          percentages: {
            variance: variancePercent,
            utilization: utilizationPercent,
            projectedVariance: projectedVariancePercent
          },
          status: this.getBudgetStatus(utilizationPercent, projectedVariancePercent),
          healthScore: this.calculateHealthScore(utilizationPercent, variancePercent)
        };

        analysis.budgets.push(budgetAnalysis);

        // Generate alerts
        const alerts = this.generateBudgetAlerts(budgetAnalysis);
        analysis.alerts.push(...alerts);

        // Summary
        analysis.summary.totalBudget += budgetAmount;
        analysis.summary.totalActual += actualSpend;
        analysis.summary.totalCommitted += committed;
        analysis.summary.totalRemaining += remaining;
        analysis.summary.totalVariance += variance;
      }

      // Calculate overall metrics
      analysis.summary.variancePercent = calculatePercentage(
        analysis.summary.totalVariance,
        analysis.summary.totalBudget
      );
      analysis.summary.utilizationPercent = calculatePercentage(
        analysis.summary.totalActual,
        analysis.summary.totalBudget
      );

      // Add trend analysis
      analysis.trends = await this.calculateTrends(tenant, year, month, category);

      logger.info('Budget variance analysis complete', {
        tenant,
        budgetCount: budgets.length,
        totalBudget: analysis.summary.totalBudget,
        utilizationPercent: analysis.summary.utilizationPercent
      });

      return analysis;

    } catch (error) {
      logger.error('Error calculating variance analysis', { error: error.message, params });
      throw error;
    }
  }

  /**
   * Get actual spend for a budget
   */
  async getActualSpend(budget) {
    const startDate = new Date(budget.year, budget.month - 1, 1);
    const endDate = new Date(budget.year, budget.month, 0, 23, 59, 59);

    const query = {
      tenant: budget.tenant,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
      status: { $in: ['active', 'completed', 'approved'] }
    };

    if (budget.category) query.category = budget.category;
    if (budget.customerId) query.customerId = budget.customerId;

    const result = await TradeSpend.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSpend: { $sum: '$actualSpend' }
        }
      }
    ]);

    return safeNumber(result[0]?.totalSpend, 0);
  }

  /**
   * Get committed (but not yet spent) amounts
   */
  async getCommittedSpend(budget) {
    const startDate = new Date(budget.year, budget.month - 1, 1);
    const endDate = new Date(budget.year, budget.month, 0, 23, 59, 59);

    const query = {
      tenant: budget.tenant,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
      status: { $in: ['pending', 'approved'] } // Not yet active
    };

    if (budget.category) query.category = budget.category;
    if (budget.customerId) query.customerId = budget.customerId;

    const result = await TradeSpend.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCommitted: { $sum: '$totalBudget' }
        }
      }
    ]);

    return safeNumber(result[0]?.totalCommitted, 0);
  }

  /**
   * Forecast spend to end of period
   */
  forecastSpend(budget, actualSpend) {
    const today = new Date();
    const periodStart = new Date(budget.year, budget.month - 1, 1);
    const periodEnd = new Date(budget.year, budget.month, 0);

    const totalDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((today - periodStart) / (1000 * 60 * 60 * 24));
    const remainingDays = totalDays - elapsedDays;

    if (elapsedDays <= 0) return 0;
    if (remainingDays <= 0) return actualSpend;

    // Linear forecast based on current run rate
    const dailyRunRate = actualSpend / elapsedDays;
    const forecast = actualSpend + (dailyRunRate * remainingDays);

    return forecast;
  }

  /**
   * Calculate budget health score (0-100)
   */
  calculateHealthScore(utilizationPercent, variancePercent) {
    let score = 100;

    // Penalize over-utilization
    if (utilizationPercent > 100) {
      score -= (utilizationPercent - 100) * 2;
    }

    // Penalize under-utilization (might indicate poor planning)
    if (utilizationPercent < 50) {
      score -= (50 - utilizationPercent) * 0.5;
    }

    // Penalize high variance
    if (Math.abs(variancePercent) > 10) {
      score -= Math.abs(variancePercent - 10) * 0.5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get budget status
   */
  getBudgetStatus(utilizationPercent, projectedVariancePercent) {
    if (utilizationPercent >= 100) return 'over_budget';
    if (projectedVariancePercent < -10) return 'at_risk';
    if (utilizationPercent >= 90) return 'near_limit';
    if (utilizationPercent >= 75) return 'on_track';
    return 'healthy';
  }

  /**
   * Generate budget alerts
   */
  generateBudgetAlerts(budgetAnalysis) {
    const alerts = [];

    const { amounts, percentages, status, budgetName } = budgetAnalysis;

    // Over budget alert
    if (amounts.actual > amounts.budget) {
      alerts.push({
        severity: 'critical',
        type: 'over_budget',
        budget: budgetName,
        message: `Budget exceeded by ${Math.abs(percentages.variance).toFixed(1)}%`,
        amount: Math.abs(amounts.variance),
        recommendedAction: 'Review and adjust budget or reduce spending'
      });
    }

    // Near limit alert
    if (percentages.utilization >= 90 && percentages.utilization < 100) {
      alerts.push({
        severity: 'warning',
        type: 'near_limit',
        budget: budgetName,
        message: `Budget at ${percentages.utilization.toFixed(1)}% utilization`,
        amount: amounts.remaining,
        recommendedAction: `Monitor closely, only ZAR ${amounts.remaining.toLocaleString()} remaining`
      });
    }

    // Forecast overrun alert
    if (amounts.forecast > amounts.budget && percentages.utilization < 100) {
      alerts.push({
        severity: 'warning',
        type: 'forecast_overrun',
        budget: budgetName,
        message: `Projected to exceed budget by ${Math.abs(percentages.projectedVariance).toFixed(1)}%`,
        amount: Math.abs(amounts.projectedVariance),
        recommendedAction: 'Reduce spending rate or request budget increase'
      });
    }

    // Under-utilization alert (for year-end)
    const today = new Date();
    if (percentages.utilization < 50 && today.getMonth() >= 9) { // October onwards
      alerts.push({
        severity: 'info',
        type: 'under_utilization',
        budget: budgetName,
        message: `Only ${percentages.utilization.toFixed(1)}% utilized`,
        amount: amounts.remaining,
        recommendedAction: 'Review budget allocation, may need reallocation'
      });
    }

    return alerts;
  }

  /**
   * Calculate trends over time
   */
  async calculateTrends(tenant, year, month, category) {
    const trends = [];

    try {
      // Get last 6 months of data
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(year, month - 1 - i, 1);
        months.push({
          year: targetDate.getFullYear(),
          month: targetDate.getMonth() + 1
        });
      }

      for (const period of months) {
        const budgets = await Budget.find({
          tenant,
          year: period.year,
          month: period.month,
          ...(category && { category })
        });

        let totalBudget = 0;
        let totalActual = 0;

        for (const budget of budgets) {
          totalBudget += safeNumber(budget.amount, 0);
          const actualSpend = await this.getActualSpend(budget);
          totalActual += actualSpend;
        }

        trends.push({
          period: `${period.year}-${String(period.month).padStart(2, '0')}`,
          budget: totalBudget,
          actual: totalActual,
          variance: totalBudget - totalActual,
          utilizationPercent: calculatePercentage(totalActual, totalBudget)
        });
      }

    } catch (error) {
      logger.error('Error calculating trends', { error: error.message });
    }

    return trends;
  }

  /**
   * Create budget hierarchy (parent-child)
   */
  async createBudgetHierarchy(params) {
    const { tenant, parentBudgetId, childBudgets, userId } = params;

    try {
      const parent = await Budget.findById(parentBudgetId);

      if (!parent) {
        throw new Error('Parent budget not found');
      }

      const createdChildren = [];
      let totalChildAmount = 0;

      for (const childData of childBudgets) {
        const child = await Budget.create({
          ...childData,
          tenant,
          parentBudgetId,
          year: parent.year,
          month: parent.month,
          createdBy: userId
        });

        createdChildren.push(child);
        totalChildAmount += safeNumber(child.amount, 0);
      }

      // Validate: child budgets shouldn't exceed parent
      if (totalChildAmount > parent.amount) {
        logger.warn('Child budgets exceed parent budget', {
          parentId: parentBudgetId,
          parentAmount: parent.amount,
          totalChildAmount
        });
      }

      logger.info('Budget hierarchy created', {
        parentId: parentBudgetId,
        childCount: createdChildren.length,
        totalChildAmount
      });

      return {
        parent,
        children: createdChildren,
        totalChildAmount,
        remaining: parent.amount - totalChildAmount
      };

    } catch (error) {
      logger.error('Error creating budget hierarchy', { error: error.message, params });
      throw error;
    }
  }

  /**
   * What-if scenario analysis
   */
  async scenarioAnalysis(params) {
    const { tenant, year, month, scenarios } = params;

    try {
      const results = [];

      // Get baseline (current) budget
      const baselineBudgets = await Budget.find({ tenant, year, month });

      const baseline = {
        name: 'Baseline',
        totalBudget: 0,
        projectedSpend: 0,
        projectedVariance: 0
      };

      for (const budget of baselineBudgets) {
        baseline.totalBudget += safeNumber(budget.amount, 0);
        const actualSpend = await this.getActualSpend(budget);
        const forecast = await this.forecastSpend(budget, actualSpend);
        baseline.projectedSpend += forecast;
      }

      baseline.projectedVariance = baseline.totalBudget - baseline.projectedSpend;
      results.push(baseline);

      // Run scenarios
      for (const scenario of scenarios) {
        const scenarioResult = {
          name: scenario.name,
          description: scenario.description,
          totalBudget: baseline.totalBudget,
          projectedSpend: baseline.projectedSpend,
          adjustments: []
        };

        // Apply adjustments
        for (const adjustment of scenario.adjustments) {
          if (adjustment.type === 'increase_budget') {
            scenarioResult.totalBudget += safeNumber(adjustment.amount, 0);
            scenarioResult.adjustments.push({
              description: `Increase budget by ZAR ${adjustment.amount.toLocaleString()}`,
              impact: adjustment.amount
            });
          } else if (adjustment.type === 'reduce_spend') {
            scenarioResult.projectedSpend -= safeNumber(adjustment.amount, 0);
            scenarioResult.adjustments.push({
              description: `Reduce spend by ZAR ${adjustment.amount.toLocaleString()}`,
              impact: -adjustment.amount
            });
          } else if (adjustment.type === 'percentage_change') {
            const change = scenarioResult.projectedSpend * (adjustment.percentage / 100);
            scenarioResult.projectedSpend += change;
            scenarioResult.adjustments.push({
              description: `${adjustment.percentage > 0 ? 'Increase' : 'Decrease'} spend by ${Math.abs(adjustment.percentage)}%`,
              impact: change
            });
          }
        }

        scenarioResult.projectedVariance = scenarioResult.totalBudget - scenarioResult.projectedSpend;
        scenarioResult.variancePercent = calculatePercentage(
          scenarioResult.projectedVariance,
          scenarioResult.totalBudget
        );

        results.push(scenarioResult);
      }

      return {
        period: { year, month },
        scenarios: results,
        recommendation: this.getScenarioRecommendation(results)
      };

    } catch (error) {
      logger.error('Error in scenario analysis', { error: error.message, params });
      throw error;
    }
  }

  /**
   * Get scenario recommendation
   */
  getScenarioRecommendation(scenarios) {
    // Find scenario with best balance (positive variance, not too much)
    const scored = scenarios
      .filter((s) => s.name !== 'Baseline')
      .map((s) => ({
        ...s,
        score: s.projectedVariance > 0 ?
          (100 - Math.abs(s.variancePercent)) :
          (100 - Math.abs(s.variancePercent) * 2) // Penalize negative variance more
      }))
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
      return 'No scenarios provided';
    }

    const best = scored[0];
    return `Recommend: ${best.name} - Projects variance of ${best.variancePercent.toFixed(1)}% with adjustments applied`;
  }
}

module.exports = new AdvancedBudgetService();
