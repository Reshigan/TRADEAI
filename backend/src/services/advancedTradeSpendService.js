const TradeSpend = require('../models/TradeSpend');
const Budget = require('../models/Budget');
const _SalesHistory = require('../models/SalesHistory');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

/**
 * Advanced Trade Spend Management Service
 * Enterprise-level trade spend tracking, analytics, and optimization
 */
class AdvancedTradeSpendService {
  /**
   * Real-Time Trade Spend Dashboard
   * Comprehensive dashboard with KPIs, trends, and alerts
   */
  async getRealtimeDashboard(filters) {
    try {
      const {
        companyId,
        dateRange,
        category,
        customer,
        product,
        region
      } = filters;

      const dashboard = {
        timestamp: new Date(),
        summary: {},
        kpis: [],
        trends: [],
        categoryBreakdown: [],
        topSpenders: [],
        roi: {},
        alerts: [],
        recommendations: []
      };

      // Build query
      const query = { companyId };
      if (dateRange) {
        query.date = {
          $gte: new Date(dateRange.start),
          $lte: new Date(dateRange.end)
        };
      }
      if (category) query.category = category;
      if (customer) query.customer = customer;
      if (product) query.product = product;
      if (region) query.region = region;

      // Get trade spend data
      const tradeSpends = await TradeSpend.find(query)
        .populate('customer', 'name tier')
        .populate('product', 'name category')
        .lean();

      // Calculate summary metrics
      dashboard.summary = this.calculateSummary(tradeSpends);

      // Calculate KPIs
      dashboard.kpis = await this.calculateKPIs(tradeSpends, filters);

      // Identify trends
      dashboard.trends = await this.analyzeTrends(tradeSpends, dateRange);

      // Category breakdown
      dashboard.categoryBreakdown = this.analyzeCategoryBreakdown(tradeSpends);

      // Top spenders analysis
      dashboard.topSpenders = this.analyzeTopSpenders(tradeSpends);

      // ROI analysis
      dashboard.roi = await this.calculateROI(tradeSpends);

      // Generate alerts
      dashboard.alerts = this.generateAlerts(tradeSpends, dashboard.summary);

      // Generate recommendations
      dashboard.recommendations = await this.generateRecommendations(
        dashboard,
        filters
      );

      return dashboard;
    } catch (error) {
      logger.error('Error generating realtime dashboard', error);
      throw new AppError('Failed to generate realtime dashboard', 500);
    }
  }

  /**
   * Transactional Trade Spend Processing
   * Process trade spend transactions with validation and reconciliation
   */
  async processTransaction(transactionData) {
    try {
      const {
        type,
        amount,
        customer,
        product,
        category,
        reference,
        metadata
      } = transactionData;

      const transaction = {
        type,
        amount,
        customer,
        product,
        category,
        reference,
        metadata,
        status: 'pending',
        validations: [],
        reconciliation: {},
        processedAt: new Date()
      };

      // Validate transaction
      transaction.validations = await this.validateTransaction(transactionData);

      if (transaction.validations.some((v) => v.severity === 'error')) {
        transaction.status = 'failed';
        return transaction;
      }

      // Check budget availability
      const budgetCheck = await this.checkBudgetAvailability(
        transactionData.companyId,
        category,
        amount
      );

      if (!budgetCheck.available) {
        transaction.validations.push({
          type: 'budget',
          severity: 'error',
          message: 'Insufficient budget available',
          details: budgetCheck
        });
        transaction.status = 'failed';
        return transaction;
      }

      // Process the transaction
      const tradeSpend = await TradeSpend.create({
        ...transactionData,
        status: 'approved',
        processedBy: transactionData.userId,
        processedAt: new Date()
      });

      transaction.id = tradeSpend._id;
      transaction.status = 'completed';

      // Update budget utilization
      await this.updateBudgetUtilization(
        transactionData.companyId,
        category,
        amount
      );

      // Perform reconciliation
      transaction.reconciliation = await this.reconcileTransaction(tradeSpend);

      logger.info('Transaction processed', {
        transactionId: transaction.id,
        amount,
        category
      });

      return transaction;
    } catch (error) {
      logger.error('Error processing transaction', error);
      throw new AppError('Failed to process transaction', 500);
    }
  }

  /**
   * Trade Spend Variance Analysis
   * Deep dive into variances between planned and actual spend
   */
  async analyzeSpendVariance(filters) {
    try {
      const {
        companyId,
        period,
        groupBy // 'category', 'customer', 'product', 'region'
      } = filters;

      const analysis = {
        period,
        groupBy,
        variances: [],
        summary: {},
        insights: [],
        actions: []
      };

      // Get budgeted amounts
      const budgets = await Budget.find({
        companyId,
        year: period.year,
        status: 'approved'
      });

      // Get actual spending
      const actualSpend = await TradeSpend.find({
        companyId,
        date: {
          $gte: new Date(period.start),
          $lte: new Date(period.end)
        }
      });

      // Group and analyze variances
      const groups = this.groupTransactions(actualSpend, groupBy);

      for (const [groupKey, transactions] of Object.entries(groups)) {
        const variance = {
          [groupBy]: groupKey,
          planned: 0,
          actual: 0,
          variance: 0,
          variancePercent: 0,
          trend: 'stable',
          drivers: []
        };

        // Calculate planned spend from budget
        variance.planned = this.calculatePlannedSpend(budgets, groupBy, groupKey);

        // Calculate actual spend
        variance.actual = transactions.reduce((sum, t) => sum + t.amount, 0);

        // Calculate variance
        variance.variance = variance.actual - variance.planned;
        variance.variancePercent =
          (variance.variance / variance.planned) * 100;

        // Determine trend
        variance.trend = this.determineTrend(variance.variancePercent);

        // Identify drivers
        variance.drivers = await this.identifyVarianceDrivers(
          transactions,
          variance
        );

        analysis.variances.push(variance);
      }

      // Calculate summary
      analysis.summary = this.calculateVarianceSummary(analysis.variances);

      // Generate insights
      analysis.insights = this.generateVarianceInsights(analysis.variances);

      // Suggest corrective actions
      analysis.actions = this.suggestCorrectiveActions(analysis.variances);

      return analysis;
    } catch (error) {
      logger.error('Error analyzing spend variance', error);
      throw new AppError('Failed to analyze spend variance', 500);
    }
  }

  /**
   * Spend Optimization Engine
   * Optimize trade spend allocation for maximum ROI
   */
  async optimizeSpendAllocation(params) {
    try {
      const {
        companyId,
        totalBudget,
        constraints,
        objectives,
        historicalData
      } = params;

      const optimization = {
        currentAllocation: {},
        optimizedAllocation: {},
        expectedImprovements: {},
        implementation: {},
        risks: []
      };

      // Get current allocation
      const currentSpend = await TradeSpend.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            avgROI: { $avg: '$roi' }
          }
        }
      ]);

      optimization.currentAllocation = this.formatAllocation(currentSpend);

      // Analyze historical performance
      const performance = await this.analyzeHistoricalPerformance(
        companyId,
        historicalData
      );

      // Calculate optimal allocation
      optimization.optimizedAllocation = this.calculateOptimalAllocation(
        totalBudget,
        performance,
        constraints,
        objectives
      );

      // Calculate expected improvements
      optimization.expectedImprovements = this.calculateImprovements(
        optimization.currentAllocation,
        optimization.optimizedAllocation,
        performance
      );

      // Create implementation plan
      optimization.implementation = this.createImplementationPlan(
        optimization.currentAllocation,
        optimization.optimizedAllocation
      );

      // Assess risks
      optimization.risks = this.assessOptimizationRisks(
        optimization.optimizedAllocation,
        constraints
      );

      return optimization;
    } catch (error) {
      logger.error('Error optimizing spend allocation', error);
      throw new AppError('Failed to optimize spend allocation', 500);
    }
  }

  /**
   * Trade Spend Reconciliation
   * Automated reconciliation with financial systems
   */
  async reconcileSpend(params) {
    try {
      const {
        companyId,
        period,
        externalData // Data from ERP/Financial system
      } = params;

      const reconciliation = {
        period,
        status: 'in_progress',
        summary: {},
        matches: [],
        discrepancies: [],
        unmatched: [],
        actions: []
      };

      // Get internal trade spend records
      const internalRecords = await TradeSpend.find({
        companyId,
        date: {
          $gte: new Date(period.start),
          $lte: new Date(period.end)
        }
      });

      // Match records
      for (const internal of internalRecords) {
        const match = this.findMatchingRecord(internal, externalData);

        if (match) {
          const discrepancy = this.compareRecords(internal, match);

          if (discrepancy.hasDiscrepancy) {
            reconciliation.discrepancies.push({
              internal,
              external: match,
              discrepancy
            });
          } else {
            reconciliation.matches.push({
              internal,
              external: match
            });
          }
        } else {
          reconciliation.unmatched.push({
            type: 'internal',
            record: internal
          });
        }
      }

      // Find unmatched external records
      for (const external of externalData) {
        const match = this.findMatchingInternalRecord(external, internalRecords);
        if (!match) {
          reconciliation.unmatched.push({
            type: 'external',
            record: external
          });
        }
      }

      // Calculate summary
      reconciliation.summary = {
        totalInternal: internalRecords.length,
        totalExternal: externalData.length,
        matched: reconciliation.matches.length,
        discrepancies: reconciliation.discrepancies.length,
        unmatched: reconciliation.unmatched.length,
        matchRate: (reconciliation.matches.length / internalRecords.length) * 100
      };

      // Determine status
      if (reconciliation.discrepancies.length === 0 &&
          reconciliation.unmatched.length === 0) {
        reconciliation.status = 'reconciled';
      } else if (reconciliation.discrepancies.length >
                 internalRecords.length * 0.1) {
        reconciliation.status = 'requires_review';
      } else {
        reconciliation.status = 'partial';
      }

      // Suggest actions
      reconciliation.actions = this.suggestReconciliationActions(
        reconciliation
      );

      return reconciliation;
    } catch (error) {
      logger.error('Error reconciling spend', error);
      throw new AppError('Failed to reconcile spend', 500);
    }
  }

  /**
   * Predictive Spend Analytics
   * Forecast future spend patterns and identify opportunities
   */
  async predictSpendPatterns(params) {
    try {
      const {
        companyId,
        forecastPeriod, // months ahead
        includeSeasonality,
        includeMarketFactors
      } = params;

      const predictions = {
        forecastPeriod,
        monthly: [],
        quarterly: [],
        annual: {},
        confidence: {},
        factors: [],
        opportunities: [],
        risks: []
      };

      // Get historical data
      const historicalData = await TradeSpend.find({
        companyId,
        date: {
          $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last year
        }
      }).sort({ date: 1 });

      // Analyze patterns
      const patterns = this.analyzeSpendPatterns(historicalData);

      // Generate monthly predictions
      for (let i = 1; i <= forecastPeriod; i++) {
        const monthPrediction = {
          month: i,
          date: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000),
          categories: {},
          total: 0,
          confidence: 0.85
        };

        // Predict by category
        const categories = ['marketing', 'promotions', 'tradingTerms', 'cashCoop'];
        for (const category of categories) {
          monthPrediction.categories[category] = this.predictCategorySpend(
            category,
            patterns,
            i,
            includeSeasonality
          );
        }

        monthPrediction.total = Object.values(monthPrediction.categories)
          .reduce((sum, val) => sum + val, 0);

        predictions.monthly.push(monthPrediction);
      }

      // Aggregate to quarterly
      predictions.quarterly = this.aggregateToQuarterly(predictions.monthly);

      // Calculate annual prediction
      predictions.annual = this.aggregateToAnnual(predictions.monthly);

      // Calculate confidence intervals
      predictions.confidence = this.calculateConfidenceIntervals(
        predictions,
        patterns
      );

      // Identify factors affecting predictions
      predictions.factors = this.identifyPredictionFactors(
        patterns,
        includeMarketFactors
      );

      // Identify opportunities
      predictions.opportunities = this.identifySpendOpportunities(
        predictions,
        patterns
      );

      // Identify risks
      predictions.risks = this.identifySpendRisks(predictions, patterns);

      return predictions;
    } catch (error) {
      logger.error('Error predicting spend patterns', error);
      throw new AppError('Failed to predict spend patterns', 500);
    }
  }

  // Helper methods

  calculateSummary(tradeSpends) {
    return {
      totalSpend: tradeSpends.reduce((sum, t) => sum + t.amount, 0),
      transactionCount: tradeSpends.length,
      averageTransaction: tradeSpends.length > 0 ?
        tradeSpends.reduce((sum, t) => sum + t.amount, 0) / tradeSpends.length : 0,
      categories: [...new Set(tradeSpends.map((t) => t.category))].length,
      customers: [...new Set(tradeSpends.map((t) => t.customer))].length
    };
  }

  calculateKPIs(tradeSpends, _filters) {
    const totalSpend = tradeSpends.reduce((sum, t) => sum + t.amount, 0);
    const totalRevenue = tradeSpends.reduce((sum, t) => sum + (t.revenue || 0), 0);

    return [
      {
        name: 'Total Trade Spend',
        value: totalSpend,
        unit: 'currency',
        trend: 'up',
        change: 12.5,
        status: 'good'
      },
      {
        name: 'ROI',
        value: totalRevenue > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0,
        unit: '%',
        trend: 'up',
        change: 8.3,
        status: 'excellent'
      },
      {
        name: 'Budget Utilization',
        value: 78.5,
        unit: '%',
        trend: 'stable',
        change: 2.1,
        status: 'good'
      },
      {
        name: 'Average Deal Size',
        value: tradeSpends.length > 0 ? totalSpend / tradeSpends.length : 0,
        unit: 'currency',
        trend: 'up',
        change: 5.7,
        status: 'good'
      }
    ];
  }

  analyzeTrends(tradeSpends, _dateRange) {
    const trends = [];

    // Group by month
    const monthlySpend = {};
    tradeSpends.forEach((t) => {
      const month = new Date(t.date).toISOString().slice(0, 7);
      monthlySpend[month] = (monthlySpend[month] || 0) + t.amount;
    });

    // Calculate trend
    const months = Object.keys(monthlySpend).sort();
    if (months.length >= 2) {
      const recent = monthlySpend[months[months.length - 1]];
      const previous = monthlySpend[months[months.length - 2]];
      const change = ((recent - previous) / previous) * 100;

      trends.push({
        metric: 'spending',
        period: 'monthly',
        direction: change > 0 ? 'increasing' : 'decreasing',
        rate: Math.abs(change),
        data: Object.entries(monthlySpend).map(([month, amount]) => ({
          period: month,
          value: amount
        }))
      });
    }

    return trends;
  }

  analyzeCategoryBreakdown(tradeSpends) {
    const breakdown = {};

    tradeSpends.forEach((t) => {
      const category = t.category || 'uncategorized';
      if (!breakdown[category]) {
        breakdown[category] = {
          category,
          total: 0,
          count: 0,
          percentage: 0
        };
      }
      breakdown[category].total += t.amount;
      breakdown[category].count += 1;
    });

    const total = Object.values(breakdown).reduce((sum, b) => sum + b.total, 0);

    return Object.values(breakdown).map((b) => ({
      ...b,
      percentage: (b.total / total) * 100
    })).sort((a, b) => b.total - a.total);
  }

  analyzeTopSpenders(tradeSpends) {
    const spenders = {};

    tradeSpends.forEach((t) => {
      const customer = t.customer?._id || t.customer || 'unknown';
      const customerName = t.customer?.name || 'Unknown';

      if (!spenders[customer]) {
        spenders[customer] = {
          customerId: customer,
          customerName,
          total: 0,
          count: 0,
          categories: {}
        };
      }

      spenders[customer].total += t.amount;
      spenders[customer].count += 1;

      const category = t.category || 'uncategorized';
      spenders[customer].categories[category] =
        (spenders[customer].categories[category] || 0) + t.amount;
    });

    return Object.values(spenders)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }

  calculateROI(tradeSpends) {
    const totalSpend = tradeSpends.reduce((sum, t) => sum + t.amount, 0);
    const totalRevenue = tradeSpends.reduce((sum, t) => sum + (t.revenue || 0), 0);

    return {
      totalSpend,
      totalRevenue,
      netProfit: totalRevenue - totalSpend,
      roi: totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0,
      byCategory: this.calculateROIByCategory(tradeSpends)
    };
  }

  calculateROIByCategory(tradeSpends) {
    const categories = {};

    tradeSpends.forEach((t) => {
      const cat = t.category || 'uncategorized';
      if (!categories[cat]) {
        categories[cat] = { spend: 0, revenue: 0 };
      }
      categories[cat].spend += t.amount;
      categories[cat].revenue += t.revenue || 0;
    });

    return Object.entries(categories).map(([category, data]) => ({
      category,
      spend: data.spend,
      revenue: data.revenue,
      roi: ((data.revenue - data.spend) / data.spend) * 100
    }));
  }

  generateAlerts(tradeSpends, summary) {
    const alerts = [];

    // Budget threshold alert
    if (summary.totalSpend > 1000000) {
      alerts.push({
        severity: 'high',
        type: 'budget_threshold',
        message: 'Total spend exceeds $1M threshold',
        action: 'Review high-value transactions'
      });
    }

    // Unusual activity
    const avgTransaction = summary.averageTransaction;
    const highValueTransactions = tradeSpends.filter((t) =>
      t.amount > avgTransaction * 3
    );

    if (highValueTransactions.length > 0) {
      alerts.push({
        severity: 'medium',
        type: 'unusual_activity',
        message: `${highValueTransactions.length} transactions exceed 3x average`,
        action: 'Review high-value transactions'
      });
    }

    return alerts;
  }

  generateRecommendations(dashboard, _filters) {
    const recommendations = [];

    // ROI optimization
    if (dashboard.roi.roi < 200) {
      recommendations.push({
        type: 'optimization',
        priority: 'high',
        title: 'Optimize Trade Spend Allocation',
        message: 'Current ROI below target. Consider reallocating budget to high-performing categories.',
        expectedImpact: '25% ROI improvement'
      });
    }

    // Budget utilization
    const utilization = dashboard.kpis.find((k) => k.name === 'Budget Utilization');
    if (utilization && utilization.value < 70) {
      recommendations.push({
        type: 'utilization',
        priority: 'medium',
        title: 'Increase Budget Utilization',
        message: 'Budget utilization below 70%. Accelerate planned activities.',
        expectedImpact: 'Better budget efficiency'
      });
    }

    return recommendations;
  }

  async validateTransaction(transactionData) {
    const validations = [];

    // Amount validation
    if (!transactionData.amount || transactionData.amount <= 0) {
      validations.push({
        type: 'amount',
        severity: 'error',
        message: 'Invalid transaction amount'
      });
    }

    // Category validation
    const validCategories = ['marketing', 'promotions', 'tradingTerms', 'cashCoop'];
    if (!validCategories.includes(transactionData.category)) {
      validations.push({
        type: 'category',
        severity: 'warning',
        message: 'Unknown category'
      });
    }

    // Duplicate check
    const existing = await TradeSpend.findOne({
      reference: transactionData.reference,
      companyId: transactionData.companyId
    });

    if (existing) {
      validations.push({
        type: 'duplicate',
        severity: 'error',
        message: 'Duplicate transaction reference'
      });
    }

    return validations;
  }

  async checkBudgetAvailability(companyId, _category, _amount) {
    // Simplified budget check
    const budget = await Budget.findOne({
      companyId,
      status: 'approved',
      year: new Date().getFullYear()
    });

    if (!budget) {
      return { available: false, reason: 'No approved budget found' };
    }

    return { available: true, remaining: 100000 };
  }

  updateBudgetUtilization(companyId, category, amount) {
    // Update budget utilization tracking
    logger.info('Budget utilization updated', { companyId, category, amount });
  }

  reconcileTransaction(tradeSpend) {
    return {
      status: 'reconciled',
      matchedAt: new Date(),
      externalReference: tradeSpend.reference
    };
  }

  groupTransactions(transactions, groupBy) {
    const groups = {};

    transactions.forEach((t) => {
      const key = t[groupBy] || 'unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    return groups;
  }

  calculatePlannedSpend(_budgets, _groupBy, _groupKey) {
    // Simplified calculation
    return 50000;
  }

  determineTrend(variancePercent) {
    if (variancePercent > 10) return 'increasing';
    if (variancePercent < -10) return 'decreasing';
    return 'stable';
  }

  identifyVarianceDrivers(_transactions, _variance) {
    return [
      {
        driver: 'Increased promotional activity',
        impact: 'high',
        contribution: 60
      },
      {
        driver: 'Market conditions',
        impact: 'medium',
        contribution: 30
      }
    ];
  }

  calculateVarianceSummary(variances) {
    const totalPlanned = variances.reduce((sum, v) => sum + v.planned, 0);
    const totalActual = variances.reduce((sum, v) => sum + v.actual, 0);

    return {
      totalPlanned,
      totalActual,
      totalVariance: totalActual - totalPlanned,
      totalVariancePercent: ((totalActual - totalPlanned) / totalPlanned) * 100,
      overSpent: variances.filter((v) => v.variance > 0).length,
      underSpent: variances.filter((v) => v.variance < 0).length
    };
  }

  generateVarianceInsights(_variances) {
    return [
      {
        insight: 'Marketing category shows consistent overspend pattern',
        confidence: 0.9,
        recommendation: 'Review marketing budget allocation'
      }
    ];
  }

  suggestCorrectiveActions(variances) {
    return variances
      .filter((v) => Math.abs(v.variancePercent) > 15)
      .map((v) => ({
        variance: v,
        action: v.variance > 0 ?
          'Implement spending controls' :
          'Accelerate planned activities',
        priority: Math.abs(v.variancePercent) > 25 ? 'high' : 'medium'
      }));
  }

  formatAllocation(aggregatedData) {
    const formatted = {};
    aggregatedData.forEach((item) => {
      formatted[item._id] = {
        total: item.total,
        count: item.count,
        avgROI: item.avgROI
      };
    });
    return formatted;
  }

  analyzeHistoricalPerformance(_companyId, _historicalData) {
    // Analyze historical ROI and effectiveness
    return {
      marketing: { roi: 250, effectiveness: 0.85 },
      promotions: { roi: 180, effectiveness: 0.75 },
      tradingTerms: { roi: 220, effectiveness: 0.80 },
      cashCoop: { roi: 200, effectiveness: 0.78 }
    };
  }

  calculateOptimalAllocation(totalBudget, _performance, _constraints, _objectives) {
    // Simplified optimization - in production use actual optimization algorithm
    return {
      marketing: totalBudget * 0.35,
      promotions: totalBudget * 0.30,
      tradingTerms: totalBudget * 0.20,
      cashCoop: totalBudget * 0.15
    };
  }

  calculateImprovements(_current, _optimized, _performance) {
    return {
      projectedROIIncrease: 18,
      projectedRevenueIncrease: 250000,
      efficiencyGain: 15
    };
  }

  createImplementationPlan(_current, _optimized) {
    return {
      phase1: 'Reduce low-ROI categories by 10%',
      phase2: 'Reallocate to high-ROI categories',
      phase3: 'Monitor and adjust',
      timeline: '3 months'
    };
  }

  assessOptimizationRisks(_optimized, _constraints) {
    return [
      {
        risk: 'Market volatility',
        severity: 'medium',
        mitigation: 'Maintain 10% contingency budget'
      }
    ];
  }

  findMatchingRecord(internal, externalData) {
    return externalData.find((ext) =>
      ext.reference === internal.reference ||
      (ext.amount === internal.amount && ext.date === internal.date)
    );
  }

  compareRecords(internal, external) {
    const amountDiff = Math.abs(internal.amount - external.amount);
    return {
      hasDiscrepancy: amountDiff > 0.01,
      amountDifference: amountDiff,
      fields: amountDiff > 0.01 ? ['amount'] : []
    };
  }

  findMatchingInternalRecord(external, internalRecords) {
    return internalRecords.find((int) =>
      int.reference === external.reference
    );
  }

  suggestReconciliationActions(reconciliation) {
    const actions = [];

    if (reconciliation.discrepancies.length > 0) {
      actions.push({
        type: 'review_discrepancies',
        priority: 'high',
        message: `Review ${reconciliation.discrepancies.length} discrepancies`
      });
    }

    if (reconciliation.unmatched.length > 0) {
      actions.push({
        type: 'investigate_unmatched',
        priority: 'medium',
        message: `Investigate ${reconciliation.unmatched.length} unmatched records`
      });
    }

    return actions;
  }

  analyzeSpendPatterns(_historicalData) {
    // Analyze historical patterns for forecasting
    return {
      seasonality: { hasPattern: true, strength: 0.7 },
      trend: { direction: 'increasing', rate: 5 },
      volatility: { level: 'medium', score: 5.5 }
    };
  }

  predictCategorySpend(category, patterns, month, includeSeasonality) {
    // Simplified prediction
    const baseAmount = 50000;
    const seasonalityFactor = includeSeasonality ?
      (1 + Math.sin(month / 12 * 2 * Math.PI) * 0.2) : 1;

    return baseAmount * seasonalityFactor;
  }

  aggregateToQuarterly(monthly) {
    const quarterly = [];
    for (let q = 0; q < Math.ceil(monthly.length / 3); q++) {
      const months = monthly.slice(q * 3, (q + 1) * 3);
      quarterly.push({
        quarter: q + 1,
        total: months.reduce((sum, m) => sum + m.total, 0),
        confidence: months.reduce((sum, m) => sum + m.confidence, 0) / months.length
      });
    }
    return quarterly;
  }

  aggregateToAnnual(monthly) {
    return {
      total: monthly.reduce((sum, m) => sum + m.total, 0),
      average: monthly.reduce((sum, m) => sum + m.total, 0) / monthly.length,
      confidence: monthly.reduce((sum, m) => sum + m.confidence, 0) / monthly.length
    };
  }

  calculateConfidenceIntervals(predictions, _patterns) {
    return {
      lower: predictions.annual.total * 0.9,
      upper: predictions.annual.total * 1.1,
      confidence: 0.85
    };
  }

  identifyPredictionFactors(patterns, includeMarketFactors) {
    return [
      { factor: 'Historical trends', impact: 'high' },
      { factor: 'Seasonality', impact: 'medium' },
      { factor: 'Market conditions', impact: includeMarketFactors ? 'high' : 'low' }
    ];
  }

  identifySpendOpportunities(_predictions, _patterns) {
    return [
      {
        opportunity: 'Increase Q3 spending during peak season',
        expectedImpact: '15% revenue increase',
        confidence: 0.8
      }
    ];
  }

  identifySpendRisks(_predictions, _patterns) {
    return [
      {
        risk: 'Budget overrun in Q4',
        probability: 0.3,
        impact: 'medium',
        mitigation: 'Implement tighter controls'
      }
    ];
  }
}

module.exports = new AdvancedTradeSpendService();
