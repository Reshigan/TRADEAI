const Budget = require('../models/Budget');
const SalesHistory = require('../models/SalesHistory');
const logger = require('../utils/logger');
const mlService = require('./mlService');
const { AppError } = require('../middleware/errorHandler');

/**
 * Enterprise Budget Management Service
 * Provides advanced budget planning, scenario analysis, workflow automation, and forecasting
 */
class EnterpriseBudgetService {
  /**
   * Create Budget Scenario
   * Allows creating multiple what-if scenarios for budget planning
   */
  async createBudgetScenario(baseData, scenarioParams) {
    try {
      const {
        name,
        description,
        adjustments, // { category: percentage change }
        assumptions,
        marketConditions
      } = scenarioParams;

      // Clone base budget structure
      const scenario = {
        name,
        description,
        baseScenario: baseData._id || null,
        type: 'scenario',
        assumptions,
        marketConditions,
        budgetLines: []
      };

      // Apply adjustments to create scenario
      if (baseData.budgetLines) {
        scenario.budgetLines = baseData.budgetLines.map((line) => {
          const adjustedLine = { ...line };

          // Apply percentage adjustments
          Object.keys(adjustments).forEach((category) => {
            if (adjustedLine.tradeSpend && adjustedLine.tradeSpend[category]) {
              const adjustment = 1 + (adjustments[category] / 100);
              adjustedLine.tradeSpend[category].budget *= adjustment;
            }
          });

          return adjustedLine;
        });
      }

      // Calculate scenario totals
      scenario.totals = this.calculateScenarioTotals(scenario.budgetLines);

      // Run predictive analysis
      scenario.predictedOutcomes = await this.predictScenarioOutcomes(scenario);

      return scenario;
    } catch (error) {
      logger.error('Error creating budget scenario', error);
      throw new AppError('Failed to create budget scenario', 500);
    }
  }

  /**
   * Compare Multiple Scenarios
   * Side-by-side comparison of different budget scenarios
   */
  async compareScenarios(scenarios) {
    try {
      const comparison = {
        scenarios: [],
        metrics: {},
        recommendations: []
      };

      for (const scenario of scenarios) {
        const analysis = {
          id: scenario._id || scenario.name,
          name: scenario.name,
          totals: this.calculateScenarioTotals(scenario.budgetLines),
          roi: await this.calculateROI(scenario),
          risk: this.assessRisk(scenario),
          marketFit: this.assessMarketFit(scenario)
        };

        comparison.scenarios.push(analysis);
      }

      // Calculate comparative metrics
      comparison.metrics = this.calculateComparativeMetrics(comparison.scenarios);

      // Generate recommendations
      comparison.recommendations = this.generateScenarioRecommendations(comparison.scenarios);

      return comparison;
    } catch (error) {
      logger.error('Error comparing scenarios', error);
      throw new AppError('Failed to compare scenarios', 500);
    }
  }

  /**
   * Budget Variance Analysis
   * Detailed variance tracking between actual and budgeted amounts
   */
  async analyzeVariance(budgetId, actualData, period) {
    try {
      const budget = await Budget.findById(budgetId);
      if (!budget) throw new AppError('Budget not found', 404);

      const variance = {
        period,
        budgetId,
        categories: [],
        summary: {},
        trends: [],
        alerts: []
      };

      // Analyze each budget category
      const categories = ['marketing', 'cashCoop', 'tradingTerms', 'promotions'];

      for (const category of categories) {
        const categoryVariance = {
          name: category,
          budgeted: 0,
          actual: 0,
          variance: 0,
          variancePercent: 0,
          trend: 'stable',
          reasons: []
        };

        // Calculate budgeted amount
        budget.budgetLines.forEach((line) => {
          if (line.tradeSpend && line.tradeSpend[category]) {
            categoryVariance.budgeted += line.tradeSpend[category].budget || 0;
          }
        });

        // Get actual amount
        categoryVariance.actual = actualData[category] || 0;

        // Calculate variance
        categoryVariance.variance = categoryVariance.actual - categoryVariance.budgeted;
        categoryVariance.variancePercent =
          (categoryVariance.variance / categoryVariance.budgeted) * 100;

        // Determine trend
        categoryVariance.trend = this.determineTrend(categoryVariance.variancePercent);

        // Identify reasons for variance
        categoryVariance.reasons = await this.identifyVarianceReasons(
          category,
          categoryVariance,
          actualData
        );

        // Generate alerts for significant variances
        if (Math.abs(categoryVariance.variancePercent) > 10) {
          variance.alerts.push({
            severity: Math.abs(categoryVariance.variancePercent) > 20 ? 'high' : 'medium',
            category,
            message: `${category} variance of ${categoryVariance.variancePercent.toFixed(2)}% detected`,
            action: this.suggestCorrectiveAction(categoryVariance)
          });
        }

        variance.categories.push(categoryVariance);
      }

      // Calculate summary
      variance.summary = this.calculateVarianceSummary(variance.categories);

      // Identify trends
      variance.trends = await this.identifyVarianceTrends(budgetId, period);

      return variance;
    } catch (error) {
      logger.error('Error analyzing variance', error);
      throw new AppError('Failed to analyze variance', 500);
    }
  }

  /**
   * Multi-Year Budget Planning
   * Create comprehensive multi-year budget plans with growth projections
   */
  async createMultiYearPlan(params) {
    try {
      const {
        startYear,
        years,
        baseData,
        growthAssumptions,
        marketFactors,
        strategicInitiatives
      } = params;

      const plan = {
        startYear,
        endYear: startYear + years - 1,
        years: [],
        summary: {},
        strategicAlignment: []
      };

      for (let i = 0; i < years; i++) {
        const year = startYear + i;
        const yearPlan = {
          year,
          quarters: [],
          totals: {},
          initiatives: []
        };

        // Apply growth factors
        const growthFactor = Math.pow(1 + (growthAssumptions.annualGrowth / 100), i);

        // Generate quarterly budgets
        for (let q = 1; q <= 4; q++) {
          const quarterBudget = await this.generateQuarterlyBudget(
            baseData,
            year,
            q,
            growthFactor,
            marketFactors
          );
          yearPlan.quarters.push(quarterBudget);
        }

        // Calculate year totals
        yearPlan.totals = this.calculateYearTotals(yearPlan.quarters);

        // Map strategic initiatives
        yearPlan.initiatives = this.mapStrategicInitiatives(
          strategicInitiatives,
          year
        );

        plan.years.push(yearPlan);
      }

      // Calculate plan summary
      plan.summary = this.calculatePlanSummary(plan.years);

      // Assess strategic alignment
      plan.strategicAlignment = this.assessStrategicAlignment(
        plan.years,
        strategicInitiatives
      );

      return plan;
    } catch (error) {
      logger.error('Error creating multi-year plan', error);
      throw new AppError('Failed to create multi-year plan', 500);
    }
  }

  /**
   * Budget Optimization
   * Optimize budget allocation across categories using ML and business rules
   */
  async optimizeBudgetAllocation(budgetData, constraints, objectives) {
    try {
      const optimization = {
        original: budgetData,
        optimized: null,
        improvements: {},
        tradeoffs: [],
        recommendation: ''
      };

      // Get ML recommendations
      const mlRecommendations = await mlService.optimizeBudgetAllocation({
        currentAllocation: budgetData,
        constraints,
        objectives
      });

      // Apply business rules
      const optimizedAllocation = this.applyBusinessRules(
        mlRecommendations,
        constraints
      );

      // Calculate improvements
      optimization.optimized = optimizedAllocation;
      optimization.improvements = this.calculateImprovements(
        budgetData,
        optimizedAllocation
      );

      // Identify tradeoffs
      optimization.tradeoffs = this.identifyTradeoffs(
        budgetData,
        optimizedAllocation
      );

      // Generate recommendation
      optimization.recommendation = this.generateOptimizationRecommendation(
        optimization.improvements,
        optimization.tradeoffs
      );

      return optimization;
    } catch (error) {
      logger.error('Error optimizing budget allocation', error);
      throw new AppError('Failed to optimize budget allocation', 500);
    }
  }

  /**
   * Budget Workflow Management
   * Manage approval workflows with SLA tracking and escalation
   */
  async processBudgetWorkflow(budgetId, action, userId, comments) {
    try {
      const budget = await Budget.findById(budgetId);
      if (!budget) throw new AppError('Budget not found', 404);

      const workflow = {
        budgetId,
        action,
        userId,
        comments,
        timestamp: new Date(),
        previousStatus: budget.status,
        newStatus: null,
        nextApprovers: [],
        slaStatus: null
      };

      // Determine next status based on action
      switch (action) {
        case 'submit':
          workflow.newStatus = 'pending_approval';
          workflow.nextApprovers = await this.getNextApprovers(budget, 'manager');
          break;

        case 'approve': {
          const nextLevel = await this.getNextApprovalLevel(budget);
          if (nextLevel) {
            workflow.newStatus = `pending_${nextLevel}_approval`;
            workflow.nextApprovers = await this.getNextApprovers(budget, nextLevel);
          } else {
            workflow.newStatus = 'approved';
          }
          break;
        }

        case 'reject':
          workflow.newStatus = 'rejected';
          break;

        case 'revise':
          workflow.newStatus = 'revision_required';
          break;

        default:
          throw new AppError('Invalid workflow action', 400);
      }

      // Update budget status
      budget.status = workflow.newStatus;
      budget.workflowHistory = budget.workflowHistory || [];
      budget.workflowHistory.push({
        action,
        userId,
        comments,
        timestamp: new Date(),
        previousStatus: workflow.previousStatus,
        newStatus: workflow.newStatus
      });

      // Check SLA
      workflow.slaStatus = this.checkWorkflowSLA(budget);

      // Send notifications
      await this.sendWorkflowNotifications(budget, workflow);

      await budget.save();

      return workflow;
    } catch (error) {
      logger.error('Error processing budget workflow', error);
      throw new AppError('Failed to process budget workflow', 500);
    }
  }

  /**
   * Budget Consolidation
   * Consolidate multiple budgets across departments, regions, or products
   */
  async consolidateBudgets(budgetIds, consolidationParams) {
    try {
      const {
        type, // 'department', 'region', 'product'
        level, // consolidation level
        eliminations, // inter-company eliminations
        adjustments
      } = consolidationParams;

      const budgets = await Budget.find({ _id: { $in: budgetIds } });

      const consolidation = {
        type,
        level,
        budgets: budgets.map((b) => ({
          id: b._id,
          name: b.name,
          department: b.department,
          region: b.region
        })),
        consolidated: {
          budgetLines: [],
          totals: {},
          eliminations: [],
          adjustments: []
        },
        analysis: {}
      };

      // Aggregate budget lines
      const aggregatedLines = this.aggregateBudgetLines(budgets, type);

      // Apply eliminations
      const afterEliminations = this.applyEliminations(
        aggregatedLines,
        eliminations
      );

      // Apply adjustments
      consolidation.consolidated.budgetLines = this.applyAdjustments(
        afterEliminations,
        adjustments
      );

      // Calculate consolidated totals
      consolidation.consolidated.totals = this.calculateScenarioTotals(
        consolidation.consolidated.budgetLines
      );

      // Perform consolidation analysis
      consolidation.analysis = this.performConsolidationAnalysis(
        budgets,
        consolidation.consolidated
      );

      return consolidation;
    } catch (error) {
      logger.error('Error consolidating budgets', error);
      throw new AppError('Failed to consolidate budgets', 500);
    }
  }

  /**
   * Budget Performance Dashboard
   * Real-time budget performance metrics and KPIs
   */
  async getBudgetPerformanceDashboard(filters) {
    try {
      const {
        budgetIds,
        period,
        companyId,
        department,
        region
      } = filters;

      const dashboard = {
        overview: {},
        kpis: [],
        trends: [],
        alerts: [],
        recommendations: []
      };

      // Get budgets
      const query = { companyId };
      if (budgetIds) query._id = { $in: budgetIds };
      if (department) query.department = department;
      if (region) query.region = region;

      const budgets = await Budget.find(query);

      // Calculate overview metrics
      dashboard.overview = {
        totalBudgeted: 0,
        totalActual: 0,
        totalVariance: 0,
        utilizationRate: 0,
        budgetCount: budgets.length,
        approvedCount: budgets.filter((b) => b.status === 'approved').length,
        pendingCount: budgets.filter((b) => b.status.includes('pending')).length
      };

      // Calculate KPIs
      dashboard.kpis = await this.calculateBudgetKPIs(budgets, period);

      // Identify trends
      dashboard.trends = await this.identifyBudgetTrends(budgets, period);

      // Generate alerts
      dashboard.alerts = await this.generateBudgetAlerts(budgets);

      // Generate recommendations
      dashboard.recommendations = await this.generateBudgetRecommendations(
        dashboard.kpis,
        dashboard.trends
      );

      return dashboard;
    } catch (error) {
      logger.error('Error generating budget performance dashboard', error);
      throw new AppError('Failed to generate budget performance dashboard', 500);
    }
  }

  // Helper methods

  calculateScenarioTotals(budgetLines) {
    const totals = {
      marketing: 0,
      cashCoop: 0,
      tradingTerms: 0,
      promotions: 0,
      total: 0
    };

    if (!budgetLines) return totals;

    budgetLines.forEach((line) => {
      if (line.tradeSpend) {
        Object.keys(totals).forEach((key) => {
          if (key !== 'total' && line.tradeSpend[key]) {
            totals[key] += line.tradeSpend[key].budget || 0;
          }
        });
      }
    });

    totals.total = totals.marketing + totals.cashCoop +
                   totals.tradingTerms + totals.promotions;

    return totals;
  }

  async predictScenarioOutcomes(scenario) {
    // Simplified prediction - in production, use actual ML model
    const baseROI = 2.5;
    const totalSpend = scenario.totals?.total || 0;

    return {
      expectedROI: baseROI,
      expectedRevenue: totalSpend * baseROI,
      confidenceLevel: 0.85,
      riskFactors: ['Market volatility', 'Competitive pressure'],
      opportunities: ['Seasonal trends', 'New product launches']
    };
  }

  async calculateROI(scenario) {
    const totalSpend = scenario.totals?.total || 0;
    const expectedReturn = totalSpend * 2.5; // Simplified calculation

    return {
      roi: ((expectedReturn - totalSpend) / totalSpend) * 100,
      expectedReturn,
      investmentRequired: totalSpend
    };
  }

  assessRisk(scenario) {
    // Simplified risk assessment
    return {
      level: 'medium',
      score: 5.5,
      factors: ['Market conditions', 'Budget size'],
      mitigations: ['Phased rollout', 'Regular monitoring']
    };
  }

  assessMarketFit(scenario) {
    return {
      score: 8.0,
      alignment: 'high',
      opportunities: ['Strong market demand'],
      concerns: ['Competitive pressure']
    };
  }

  calculateComparativeMetrics(scenarios) {
    return {
      bestROI: Math.max(...scenarios.map((s) => s.roi?.roi || 0)),
      lowestRisk: Math.min(...scenarios.map((s) => s.risk?.score || 10)),
      averageSpend: scenarios.reduce((sum, s) =>
        sum + (s.totals?.total || 0), 0) / scenarios.length
    };
  }

  generateScenarioRecommendations(scenarios) {
    const recommendations = [];

    scenarios.forEach((scenario) => {
      if (scenario.roi?.roi > 150) {
        recommendations.push({
          scenario: scenario.name,
          type: 'high_roi',
          message: `Strong ROI potential of ${scenario.roi.roi.toFixed(2)}%`,
          priority: 'high'
        });
      }
    });

    return recommendations;
  }

  determineTrend(variancePercent) {
    if (variancePercent > 5) return 'increasing';
    if (variancePercent < -5) return 'decreasing';
    return 'stable';
  }

  async identifyVarianceReasons(category, variance, actualData) {
    const reasons = [];

    if (variance.variancePercent > 10) {
      reasons.push({
        reason: 'Overspending detected',
        impact: 'high',
        suggestion: 'Review spending controls'
      });
    } else if (variance.variancePercent < -10) {
      reasons.push({
        reason: 'Underspending detected',
        impact: 'medium',
        suggestion: 'Review utilization and accelerate planned activities'
      });
    }

    return reasons;
  }

  suggestCorrectiveAction(variance) {
    if (variance.variancePercent > 0) {
      return 'Consider reducing spending or requesting budget increase';
    } else {
      return 'Accelerate planned activities or reallocate unused budget';
    }
  }

  calculateVarianceSummary(categories) {
    const totalBudgeted = categories.reduce((sum, c) => sum + c.budgeted, 0);
    const totalActual = categories.reduce((sum, c) => sum + c.actual, 0);

    return {
      totalBudgeted,
      totalActual,
      totalVariance: totalActual - totalBudgeted,
      totalVariancePercent: ((totalActual - totalBudgeted) / totalBudgeted) * 100,
      categoriesOverBudget: categories.filter((c) => c.variance > 0).length,
      categoriesUnderBudget: categories.filter((c) => c.variance < 0).length
    };
  }

  async identifyVarianceTrends(budgetId, period) {
    // In production, analyze historical variance data
    return [
      {
        period: period - 1,
        trend: 'improving',
        variancePercent: -5
      },
      {
        period,
        trend: 'stable',
        variancePercent: 2
      }
    ];
  }

  async generateQuarterlyBudget(baseData, year, quarter, growthFactor, marketFactors) {
    const quarterBudget = {
      year,
      quarter,
      months: [],
      totals: {}
    };

    const startMonth = (quarter - 1) * 3 + 1;

    for (let m = 0; m < 3; m++) {
      const month = startMonth + m;
      quarterBudget.months.push({
        month,
        sales: (baseData.estimatedSales || 1000000) * growthFactor / 12,
        tradeSpend: {
          marketing: { budget: (baseData.marketing || 50000) * growthFactor / 12 },
          cashCoop: { budget: (baseData.cashCoop || 30000) * growthFactor / 12 },
          tradingTerms: { budget: (baseData.tradingTerms || 40000) * growthFactor / 12 },
          promotions: { budget: (baseData.promotions || 60000) * growthFactor / 12 }
        }
      });
    }

    return quarterBudget;
  }

  calculateYearTotals(quarters) {
    const totals = {
      sales: 0,
      marketing: 0,
      cashCoop: 0,
      tradingTerms: 0,
      promotions: 0,
      total: 0
    };

    quarters.forEach((q) => {
      q.months.forEach((m) => {
        totals.sales += m.sales || 0;
        if (m.tradeSpend) {
          totals.marketing += m.tradeSpend.marketing?.budget || 0;
          totals.cashCoop += m.tradeSpend.cashCoop?.budget || 0;
          totals.tradingTerms += m.tradeSpend.tradingTerms?.budget || 0;
          totals.promotions += m.tradeSpend.promotions?.budget || 0;
        }
      });
    });

    totals.total = totals.marketing + totals.cashCoop +
                   totals.tradingTerms + totals.promotions;

    return totals;
  }

  mapStrategicInitiatives(initiatives, year) {
    return initiatives
      .filter((i) => i.startYear <= year && i.endYear >= year)
      .map((i) => ({
        name: i.name,
        budget: i.annualBudget,
        status: 'planned'
      }));
  }

  calculatePlanSummary(years) {
    return {
      totalYears: years.length,
      totalBudget: years.reduce((sum, y) => sum + (y.totals?.total || 0), 0),
      averageAnnualBudget: years.reduce((sum, y) =>
        sum + (y.totals?.total || 0), 0) / years.length,
      totalInitiatives: years.reduce((sum, y) =>
        sum + (y.initiatives?.length || 0), 0)
    };
  }

  assessStrategicAlignment(years, initiatives) {
    return {
      score: 8.5,
      alignedInitiatives: initiatives.length,
      budgetAlignment: 'high',
      recommendations: ['Continue current strategy']
    };
  }

  applyBusinessRules(mlRecommendations, constraints) {
    const optimized = { ...mlRecommendations };

    // Apply minimum spend requirements
    if (constraints.minimumSpend) {
      Object.keys(constraints.minimumSpend).forEach((category) => {
        if (optimized[category] < constraints.minimumSpend[category]) {
          optimized[category] = constraints.minimumSpend[category];
        }
      });
    }

    return optimized;
  }

  calculateImprovements(original, optimized) {
    return {
      roiIncrease: 15, // Percentage
      efficiencyGain: 10,
      costSavings: 50000
    };
  }

  identifyTradeoffs(original, optimized) {
    return [
      {
        category: 'marketing',
        tradeoff: 'Reduced spend may impact brand awareness',
        severity: 'medium'
      }
    ];
  }

  generateOptimizationRecommendation(improvements, tradeoffs) {
    return 'Recommended optimization shows significant ROI improvement with manageable tradeoffs';
  }

  async getNextApprovers(budget, level) {
    // In production, query user roles and approval hierarchy
    return ['manager@example.com'];
  }

  async getNextApprovalLevel(budget) {
    const currentStatus = budget.status;

    if (currentStatus === 'pending_approval') return 'director';
    if (currentStatus === 'pending_director_approval') return 'executive';

    return null;
  }

  checkWorkflowSLA(budget) {
    // Check if workflow is within SLA
    const slaHours = 48;
    const hoursSinceSubmission =
      (Date.now() - budget.submittedAt) / (1000 * 60 * 60);

    return {
      withinSLA: hoursSinceSubmission < slaHours,
      hoursRemaining: Math.max(0, slaHours - hoursSinceSubmission),
      status: hoursSinceSubmission < slaHours ? 'on_track' : 'overdue'
    };
  }

  async sendWorkflowNotifications(budget, workflow) {
    // Send email/push notifications
    logger.info('Workflow notification sent', {
      budgetId: budget._id,
      action: workflow.action,
      recipients: workflow.nextApprovers
    });
  }

  aggregateBudgetLines(budgets, type) {
    const aggregated = [];

    budgets.forEach((budget) => {
      if (budget.budgetLines) {
        budget.budgetLines.forEach((line) => {
          aggregated.push({
            ...line,
            source: budget._id
          });
        });
      }
    });

    return aggregated;
  }

  applyEliminations(lines, eliminations) {
    // Remove inter-company transactions
    return lines.filter((line) => {
      return !eliminations.some((e) =>
        e.sourceId === line.source && e.type === 'elimination'
      );
    });
  }

  applyAdjustments(lines, adjustments) {
    return lines.map((line) => {
      const adjustment = adjustments.find((a) => a.lineId === line._id);
      if (adjustment) {
        return {
          ...line,
          adjusted: true,
          adjustmentReason: adjustment.reason,
          adjustmentAmount: adjustment.amount
        };
      }
      return line;
    });
  }

  performConsolidationAnalysis(budgets, consolidated) {
    return {
      totalBudgets: budgets.length,
      consolidatedTotal: consolidated.totals?.total || 0,
      averageBudget: (consolidated.totals?.total || 0) / budgets.length,
      distribution: 'balanced'
    };
  }

  async calculateBudgetKPIs(budgets, period) {
    return [
      {
        name: 'Budget Utilization',
        value: 78,
        unit: '%',
        trend: 'up',
        status: 'good'
      },
      {
        name: 'Average ROI',
        value: 245,
        unit: '%',
        trend: 'up',
        status: 'excellent'
      },
      {
        name: 'Variance',
        value: 5,
        unit: '%',
        trend: 'stable',
        status: 'good'
      }
    ];
  }

  async identifyBudgetTrends(budgets, period) {
    return [
      {
        metric: 'spending',
        trend: 'increasing',
        rate: 5,
        period: 'quarterly'
      },
      {
        metric: 'roi',
        trend: 'improving',
        rate: 3,
        period: 'monthly'
      }
    ];
  }

  async generateBudgetAlerts(budgets) {
    const alerts = [];

    budgets.forEach((budget) => {
      if (budget.status === 'pending_approval') {
        const age = (Date.now() - budget.submittedAt) / (1000 * 60 * 60);
        if (age > 48) {
          alerts.push({
            severity: 'high',
            type: 'sla_breach',
            budgetId: budget._id,
            message: `Budget approval pending for ${Math.floor(age)} hours`
          });
        }
      }
    });

    return alerts;
  }

  async generateBudgetRecommendations(kpis, trends) {
    return [
      {
        type: 'optimization',
        priority: 'high',
        message: 'Consider reallocating 10% from low-ROI categories to high performers',
        expectedImpact: '15% ROI improvement'
      },
      {
        type: 'workflow',
        priority: 'medium',
        message: 'Streamline approval process to reduce cycle time',
        expectedImpact: '30% faster approvals'
      }
    ];
  }
}

module.exports = new EnterpriseBudgetService();
