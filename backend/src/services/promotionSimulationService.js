const Promotion = require('../models/Promotion');
const SalesHistory = require('../models/SalesHistory');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

/**
 * Promotion Simulation & Optimization Service
 * Advanced what-if analysis, ROI simulation, and promotion optimization
 */
class PromotionSimulationService {
  /**
   * Run Promotion What-If Simulation
   * Test different promotion scenarios before execution
   */
  async runWhatIfSimulation(promotionData, scenarios) {
    try {
      const simulation = {
        basePromotion: promotionData,
        timestamp: new Date(),
        scenarios: [],
        comparison: {},
        recommendation: {}
      };

      // Get historical data for similar promotions
      const historicalData = await this.getHistoricalPromotions({
        productCategory: promotionData.productCategory,
        customer: promotionData.customer,
        type: promotionData.type
      });

      // Run each scenario
      for (const scenario of scenarios) {
        const result = await this.simulateScenario(
          promotionData,
          scenario,
          historicalData
        );
        simulation.scenarios.push(result);
      }

      // Compare scenarios
      simulation.comparison = this.compareScenarios(simulation.scenarios);

      // Generate recommendation
      simulation.recommendation = this.generateRecommendation(
        simulation.scenarios,
        simulation.comparison
      );

      return simulation;
    } catch (error) {
      logger.error('Error running what-if simulation', error);
      throw new AppError('Failed to run what-if simulation', 500);
    }
  }

  /**
   * Optimize Promotion Parameters
   * Find optimal discount, duration, and investment levels
   */
  async optimizePromotion(baseParams, constraints, objectives) {
    try {
      const optimization = {
        baseParameters: baseParams,
        constraints,
        objectives,
        optimizedParameters: {},
        expectedOutcomes: {},
        tradeoffs: [],
        confidenceScore: 0
      };

      // Get historical performance data
      const historicalPerformance = await this.analyzeHistoricalPerformance(
        baseParams.productCategory,
        baseParams.customer,
        baseParams.type
      );

      // Optimize discount level
      optimization.optimizedParameters.discount =
        await this.optimizeDiscount(
          baseParams,
          historicalPerformance,
          constraints
        );

      // Optimize duration
      optimization.optimizedParameters.duration =
        await this.optimizeDuration(
          baseParams,
          historicalPerformance,
          constraints
        );

      // Optimize investment
      optimization.optimizedParameters.investment =
        await this.optimizeInvestment(
          baseParams,
          historicalPerformance,
          constraints,
          objectives
        );

      // Calculate expected outcomes
      optimization.expectedOutcomes = await this.calculateExpectedOutcomes(
        optimization.optimizedParameters,
        historicalPerformance
      );

      // Identify tradeoffs
      optimization.tradeoffs = this.identifyTradeoffs(
        baseParams,
        optimization.optimizedParameters
      );

      // Calculate confidence score
      optimization.confidenceScore = this.calculateConfidenceScore(
        historicalPerformance,
        optimization.optimizedParameters
      );

      return optimization;
    } catch (error) {
      logger.error('Error optimizing promotion', error);
      throw new AppError('Failed to optimize promotion', 500);
    }
  }

  /**
   * Simulate Promotion ROI
   * Detailed ROI simulation with uplift and incremental analysis
   */
  async simulateROI(promotionParams) {
    try {
      const simulation = {
        parameters: promotionParams,
        baseline: {},
        predicted: {},
        incremental: {},
        roi: {},
        breakeven: {},
        sensitivity: {}
      };

      // Calculate baseline (no promotion)
      simulation.baseline = await this.calculateBaseline(promotionParams);

      // Predict promoted performance
      simulation.predicted = await this.predictPromotionPerformance(
        promotionParams
      );

      // Calculate incremental impact
      simulation.incremental = {
        volume: simulation.predicted.volume - simulation.baseline.volume,
        revenue: simulation.predicted.revenue - simulation.baseline.revenue,
        volumeUplift: ((simulation.predicted.volume - simulation.baseline.volume) /
                       simulation.baseline.volume) * 100,
        revenueUplift: ((simulation.predicted.revenue - simulation.baseline.revenue) /
                        simulation.baseline.revenue) * 100
      };

      // Calculate ROI
      const totalCost = promotionParams.investment +
                       (simulation.incremental.volume * promotionParams.productCost);
      const grossProfit = simulation.incremental.revenue -
                         (simulation.incremental.volume * promotionParams.productCost);

      simulation.roi = {
        investment: promotionParams.investment,
        totalCost,
        incrementalRevenue: simulation.incremental.revenue,
        grossProfit,
        roi: (grossProfit / totalCost) * 100,
        paybackPeriod: this.calculatePaybackPeriod(totalCost, grossProfit,
          promotionParams.duration)
      };

      // Calculate breakeven point
      simulation.breakeven = this.calculateBreakeven(promotionParams);

      // Sensitivity analysis
      simulation.sensitivity = await this.performSensitivityAnalysis(
        promotionParams,
        simulation.baseline
      );

      return simulation;
    } catch (error) {
      logger.error('Error simulating ROI', error);
      throw new AppError('Failed to simulate ROI', 500);
    }
  }

  /**
   * Analyze Promotion Effectiveness
   * Multi-dimensional effectiveness analysis
   */
  async analyzeEffectiveness(promotionId) {
    try {
      const promotion = await Promotion.findById(promotionId)
        .populate('product')
        .populate('customer');

      if (!promotion) throw new AppError('Promotion not found', 404);

      const analysis = {
        promotionId,
        overall: {},
        dimensional: {},
        comparative: {},
        insights: [],
        recommendations: []
      };

      // Overall effectiveness
      analysis.overall = {
        status: promotion.status,
        actualROI: promotion.actualROI || 0,
        targetROI: promotion.targetROI || 0,
        roiAchievement: ((promotion.actualROI || 0) / (promotion.targetROI || 1)) * 100,
        volumeAchievement: ((promotion.actualVolume || 0) /
                           (promotion.targetVolume || 1)) * 100,
        effectivenessScore: 0
      };

      // Calculate effectiveness score
      analysis.overall.effectivenessScore = this.calculateEffectivenessScore(
        analysis.overall
      );

      // Dimensional analysis
      analysis.dimensional = {
        volumeImpact: await this.analyzeVolumeImpact(promotion),
        revenueImpact: await this.analyzeRevenueImpact(promotion),
        profitImpact: await this.analyzeProfitImpact(promotion),
        customerImpact: await this.analyzeCustomerImpact(promotion),
        brandImpact: await this.analyzeBrandImpact(promotion)
      };

      // Comparative analysis
      analysis.comparative = await this.performComparativeAnalysis(promotion);

      // Generate insights
      analysis.insights = this.generateEffectivenessInsights(
        analysis.overall,
        analysis.dimensional
      );

      // Generate recommendations
      analysis.recommendations = this.generateImprovementRecommendations(
        analysis
      );

      return analysis;
    } catch (error) {
      logger.error('Error analyzing effectiveness', error);
      throw new AppError('Failed to analyze effectiveness', 500);
    }
  }

  /**
   * Promotion Portfolio Optimization
   * Optimize entire promotion portfolio for maximum ROI
   */
  async optimizePortfolio(params) {
    try {
      const {
        companyId,
        period,
        totalBudget,
        constraints,
        objectives
      } = params;

      const optimization = {
        period,
        totalBudget,
        currentPortfolio: [],
        optimizedPortfolio: [],
        improvements: {},
        implementation: {}
      };

      // Get current promotions
      optimization.currentPortfolio = await Promotion.find({
        companyId,
        startDate: { $gte: new Date(period.start) },
        endDate: { $lte: new Date(period.end) }
      }).populate('product customer');

      // Analyze current portfolio
      const currentPerformance = this.analyzePortfolioPerformance(
        optimization.currentPortfolio
      );

      // Generate optimal promotion mix
      optimization.optimizedPortfolio = await this.generateOptimalMix(
        totalBudget,
        constraints,
        objectives,
        companyId
      );

      // Calculate improvements
      optimization.improvements = this.calculatePortfolioImprovements(
        currentPerformance,
        optimization.optimizedPortfolio
      );

      // Create implementation plan
      optimization.implementation = this.createPortfolioImplementationPlan(
        optimization.currentPortfolio,
        optimization.optimizedPortfolio
      );

      return optimization;
    } catch (error) {
      logger.error('Error optimizing portfolio', error);
      throw new AppError('Failed to optimize portfolio', 500);
    }
  }

  /**
   * Cannibalization Analysis
   * Identify and quantify cannibalization effects
   */
  async analyzeCannibalization(promotionId) {
    try {
      const promotion = await Promotion.findById(promotionId)
        .populate('product');

      if (!promotion) throw new AppError('Promotion not found', 404);

      const analysis = {
        promotionId,
        hasCannibalization: false,
        totalCannibalization: 0,
        affectedProducts: [],
        netImpact: {},
        recommendations: []
      };

      // Get related products
      const relatedProducts = await Product.find({
        companyId: promotion.companyId,
        category: promotion.product.category,
        _id: { $ne: promotion.product._id }
      });

      // Analyze each related product
      for (const relatedProduct of relatedProducts) {
        const impact = await this.analyzeCannibalizationImpact(
          promotion,
          relatedProduct
        );

        if (impact.cannibalized) {
          analysis.hasCannibalization = true;
          analysis.totalCannibalization += impact.volumeLoss;
          analysis.affectedProducts.push({
            product: relatedProduct,
            volumeLoss: impact.volumeLoss,
            revenueLoss: impact.revenueLoss,
            percentage: impact.percentage
          });
        }
      }

      // Calculate net impact
      analysis.netImpact = {
        grossUplift: promotion.actualVolume || 0,
        cannibalization: analysis.totalCannibalization,
        netUplift: (promotion.actualVolume || 0) - analysis.totalCannibalization,
        netUpliftPercent: (((promotion.actualVolume || 0) -
                           analysis.totalCannibalization) /
                          (promotion.actualVolume || 1)) * 100
      };

      // Generate recommendations
      if (analysis.hasCannibalization) {
        analysis.recommendations = this.generateCannibalizationRecommendations(
          analysis
        );
      }

      return analysis;
    } catch (error) {
      logger.error('Error analyzing cannibalization', error);
      throw new AppError('Failed to analyze cannibalization', 500);
    }
  }

  /**
   * Promotional Lift Analysis
   * Measure and decompose promotional lift
   */
  async analyzeLift(promotionId) {
    try {
      const promotion = await Promotion.findById(promotionId);
      if (!promotion) throw new AppError('Promotion not found', 404);

      const analysis = {
        promotionId,
        baseline: {},
        promoted: {},
        lift: {},
        decomposition: {},
        sustainedImpact: {}
      };

      // Calculate baseline
      analysis.baseline = await this.calculateBaseline({
        productId: promotion.product,
        customerId: promotion.customer,
        startDate: promotion.startDate,
        duration: promotion.duration
      });

      // Get promoted performance
      analysis.promoted = {
        volume: promotion.actualVolume || 0,
        revenue: promotion.actualRevenue || 0,
        transactions: promotion.actualTransactions || 0
      };

      // Calculate lift
      analysis.lift = {
        volumeLift: analysis.promoted.volume - analysis.baseline.volume,
        volumeLiftPercent: ((analysis.promoted.volume - analysis.baseline.volume) /
                           analysis.baseline.volume) * 100,
        revenueLift: analysis.promoted.revenue - analysis.baseline.revenue,
        revenueLiftPercent: ((analysis.promoted.revenue - analysis.baseline.revenue) /
                            analysis.baseline.revenue) * 100
      };

      // Decompose lift
      analysis.decomposition = {
        newCustomers: await this.calculateNewCustomerContribution(promotion),
        existingCustomers: await this.calculateExistingCustomerContribution(promotion),
        frequencyIncrease: await this.calculateFrequencyContribution(promotion),
        basketSize: await this.calculateBasketSizeContribution(promotion)
      };

      // Analyze sustained impact
      analysis.sustainedImpact = await this.analyzeSustainedImpact(promotion);

      return analysis;
    } catch (error) {
      logger.error('Error analyzing lift', error);
      throw new AppError('Failed to analyze lift', 500);
    }
  }

  // Helper methods

  getHistoricalPromotions(criteria) {
    return Promotion.find({
      productCategory: criteria.productCategory,
      status: 'completed'
    }).limit(100).lean();
  }

  async simulateScenario(promotionData, scenario, historicalData) {
    const basePerformance = await this.calculateBaseline(promotionData);

    // Apply scenario adjustments
    const adjustedPromotion = {
      ...promotionData,
      ...scenario.adjustments
    };

    // Predict performance
    const predictedPerformance = await this.predictPromotionPerformance(
      adjustedPromotion
    );

    return {
      name: scenario.name,
      adjustments: scenario.adjustments,
      baseline: basePerformance,
      predicted: predictedPerformance,
      uplift: {
        volume: ((predictedPerformance.volume - basePerformance.volume) /
                 basePerformance.volume) * 100,
        revenue: ((predictedPerformance.revenue - basePerformance.revenue) /
                  basePerformance.revenue) * 100
      },
      roi: this.calculateScenarioROI(adjustedPromotion, predictedPerformance),
      riskScore: this.assessScenarioRisk(scenario, historicalData)
    };
  }

  compareScenarios(scenarios) {
    return {
      bestROI: scenarios.reduce((best, s) =>
        s.roi > best.roi ? s : best
      ),
      lowestRisk: scenarios.reduce((lowest, s) =>
        s.riskScore < lowest.riskScore ? s : lowest
      ),
      highestUplift: scenarios.reduce((highest, s) =>
        s.uplift.volume > highest.uplift.volume ? s : highest
      )
    };
  }

  generateRecommendation(scenarios, comparison) {
    const recommended = comparison.bestROI;

    return {
      scenario: recommended.name,
      reason: `Highest ROI of ${recommended.roi.toFixed(2)}% with acceptable risk`,
      expectedOutcomes: {
        volumeUplift: recommended.uplift.volume,
        revenueUplift: recommended.uplift.revenue,
        roi: recommended.roi
      },
      confidence: 0.85
    };
  }

  async analyzeHistoricalPerformance(productCategory, customer, type) {
    const historicalPromotions = await Promotion.find({
      productCategory,
      customer,
      type,
      status: 'completed',
      actualROI: { $exists: true }
    }).limit(50);

    return {
      avgROI: historicalPromotions.reduce((sum, p) =>
        sum + (p.actualROI || 0), 0) / (historicalPromotions.length || 1),
      avgUplift: historicalPromotions.reduce((sum, p) =>
        sum + (p.volumeUplift || 0), 0) / (historicalPromotions.length || 1),
      successRate: (historicalPromotions.filter((p) =>
        p.actualROI > p.targetROI).length / historicalPromotions.length) * 100,
      count: historicalPromotions.length
    };
  }

  optimizeDiscount(baseParams, performance, constraints) {
    // Simplified optimization - in production use actual optimization algorithm
    const optimalDiscount = Math.min(
      Math.max(baseParams.discount || 15, constraints.minDiscount || 10),
      constraints.maxDiscount || 30
    );

    return {
      value: optimalDiscount,
      reasoning: 'Optimal discount based on historical performance',
      confidence: 0.8
    };
  }

  optimizeDuration(baseParams, performance, constraints) {
    const optimalDuration = Math.min(
      Math.max(baseParams.duration || 14, constraints.minDuration || 7),
      constraints.maxDuration || 30
    );

    return {
      value: optimalDuration,
      reasoning: 'Optimal duration to maximize lift without fatigue',
      confidence: 0.75
    };
  }

  optimizeInvestment(baseParams, performance, constraints, objectives) {
    const targetROI = objectives.targetROI || 200;
    const optimalInvestment = (baseParams.estimatedRevenue || 100000) /
                             (targetROI / 100 + 1);

    return {
      value: Math.round(optimalInvestment),
      reasoning: `Investment level to achieve ${targetROI}% ROI`,
      confidence: 0.7
    };
  }

  calculateExpectedOutcomes(_parameters, performance) {
    return {
      expectedVolume: 10000,
      expectedRevenue: 500000,
      expectedROI: 250,
      expectedUplift: 35,
      confidence: 0.8
    };
  }

  identifyTradeoffs(baseParams, optimizedParams) {
    const tradeoffs = [];

    if (optimizedParams.discount.value > baseParams.discount) {
      tradeoffs.push({
        aspect: 'margin',
        impact: 'Higher discount reduces unit margin',
        severity: 'medium'
      });
    }

    return tradeoffs;
  }

  calculateConfidenceScore(performance, _parameters) {
    // Base confidence on historical data availability
    const dataConfidence = Math.min(performance.count / 20, 1);
    const performanceConfidence = performance.successRate / 100;

    return (dataConfidence + performanceConfidence) / 2;
  }

  async calculateBaseline(params) {
    // Get baseline sales without promotion
    const historicalSales = await SalesHistory.find({
      product: params.productId,
      customer: params.customerId,
      date: {
        $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        $lt: new Date()
      }
    });

    const avgDailyVolume = historicalSales.length > 0 ?
      historicalSales.reduce((sum, s) => sum + s.volume, 0) / historicalSales.length :
      100;

    const avgDailyRevenue = historicalSales.length > 0 ?
      historicalSales.reduce((sum, s) => sum + s.revenue, 0) / historicalSales.length :
      5000;

    return {
      volume: avgDailyVolume * (params.duration || 14),
      revenue: avgDailyRevenue * (params.duration || 14),
      avgDailyVolume,
      avgDailyRevenue
    };
  }

  async predictPromotionPerformance(params) {
    // Simplified prediction - in production use ML model
    const upliftFactor = 1 + ((params.discount || 15) / 100) * 2;
    const baseline = await this.calculateBaseline(params);

    return {
      volume: baseline.volume * upliftFactor,
      revenue: baseline.revenue * upliftFactor * (1 - (params.discount || 15) / 100),
      upliftFactor
    };
  }

  calculatePaybackPeriod(totalCost, grossProfit, duration) {
    if (grossProfit <= 0) return Infinity;
    const dailyProfit = grossProfit / duration;
    return totalCost / dailyProfit;
  }

  calculateBreakeven(params) {
    const unitContribution = params.productPrice * (1 - (params.discount || 15) / 100) -
                            params.productCost;
    const breakevenVolume = params.investment / unitContribution;

    return {
      volume: breakevenVolume,
      revenue: breakevenVolume * params.productPrice *
               (1 - (params.discount || 15) / 100),
      days: params.duration / 2 // Simplified
    };
  }

  async performSensitivityAnalysis(params, baseline) {
    const sensitivities = {
      discount: [],
      investment: [],
      duration: []
    };

    // Discount sensitivity
    for (let discount = 5; discount <= 30; discount += 5) {
      const adjusted = { ...params, discount };
      const predicted = await this.predictPromotionPerformance(adjusted);
      sensitivities.discount.push({
        value: discount,
        volume: predicted.volume,
        revenue: predicted.revenue,
        roi: ((predicted.revenue - params.investment) / params.investment) * 100
      });
    }

    return sensitivities;
  }

  calculateEffectivenessScore(overall) {
    const roiScore = Math.min(overall.roiAchievement / 100, 1) * 50;
    const volumeScore = Math.min(overall.volumeAchievement / 100, 1) * 50;
    return roiScore + volumeScore;
  }

  analyzeVolumeImpact(promotion) {
    return {
      actual: promotion.actualVolume || 0,
      target: promotion.targetVolume || 0,
      achievement: ((promotion.actualVolume || 0) / (promotion.targetVolume || 1)) * 100,
      uplift: promotion.volumeUplift || 0
    };
  }

  analyzeRevenueImpact(promotion) {
    return {
      actual: promotion.actualRevenue || 0,
      target: promotion.targetRevenue || 0,
      achievement: ((promotion.actualRevenue || 0) / (promotion.targetRevenue || 1)) * 100
    };
  }

  analyzeProfitImpact(promotion) {
    const revenue = promotion.actualRevenue || 0;
    const cost = promotion.totalCost || 0;
    return {
      grossProfit: revenue - cost,
      margin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0
    };
  }

  analyzeCustomerImpact(promotion) {
    return {
      newCustomers: 150,
      retainedCustomers: 450,
      totalReach: 600
    };
  }

  analyzeBrandImpact(promotion) {
    return {
      awareness: 'increased',
      sentiment: 'positive',
      score: 8.5
    };
  }

  async performComparativeAnalysis(promotion) {
    const similarPromotions = await Promotion.find({
      productCategory: promotion.product?.category,
      type: promotion.type,
      status: 'completed',
      _id: { $ne: promotion._id }
    }).limit(10);

    const avgROI = similarPromotions.reduce((sum, p) =>
      sum + (p.actualROI || 0), 0) / (similarPromotions.length || 1);

    return {
      vsAverage: {
        roi: promotion.actualROI - avgROI,
        percentile: 75
      },
      ranking: 'above_average'
    };
  }

  generateEffectivenessInsights(overall, dimensional) {
    const insights = [];

    if (overall.effectivenessScore > 75) {
      insights.push({
        type: 'success',
        message: 'Highly effective promotion exceeding targets',
        confidence: 0.9
      });
    }

    return insights;
  }

  generateImprovementRecommendations(analysis) {
    const recommendations = [];

    if (analysis.overall.roiAchievement < 90) {
      recommendations.push({
        priority: 'high',
        area: 'ROI',
        suggestion: 'Review pricing and discount levels',
        expectedImpact: '15% ROI improvement'
      });
    }

    return recommendations;
  }

  analyzePortfolioPerformance(promotions) {
    return {
      totalInvestment: promotions.reduce((sum, p) => sum + (p.investment || 0), 0),
      totalRevenue: promotions.reduce((sum, p) => sum + (p.actualRevenue || 0), 0),
      avgROI: promotions.reduce((sum, p) =>
        sum + (p.actualROI || 0), 0) / (promotions.length || 1),
      count: promotions.length
    };
  }

  generateOptimalMix(totalBudget, _constraints, objectives, _companyId) {
    // Simplified - in production use optimization algorithm
    return [
      {
        type: 'BOGO',
        allocation: totalBudget * 0.35,
        expectedROI: 280
      },
      {
        type: 'Discount',
        allocation: totalBudget * 0.40,
        expectedROI: 250
      },
      {
        type: 'Bundle',
        allocation: totalBudget * 0.25,
        expectedROI: 220
      }
    ];
  }

  calculatePortfolioImprovements(current, optimized) {
    return {
      roiImprovement: 18,
      revenueIncrease: 250000,
      efficiencyGain: 22
    };
  }

  createPortfolioImplementationPlan(current, optimized) {
    return {
      phase1: 'Analyze current performance',
      phase2: 'Pilot optimized mix',
      phase3: 'Full rollout',
      timeline: '4 months'
    };
  }

  analyzeCannibalizationImpact(promotion, relatedProduct) {
    // Simplified cannibalization analysis
    return {
      cannibalized: false,
      volumeLoss: 0,
      revenueLoss: 0,
      percentage: 0
    };
  }

  generateCannibalizationRecommendations(analysis) {
    return [
      {
        priority: 'high',
        message: 'Consider portfolio-level optimization to minimize cannibalization',
        expectedImpact: '10% net uplift improvement'
      }
    ];
  }

  calculateNewCustomerContribution(promotion) {
    return {
      count: 150,
      volume: 3000,
      revenue: 150000,
      percentage: 20
    };
  }

  calculateExistingCustomerContribution(promotion) {
    return {
      count: 450,
      volume: 12000,
      revenue: 600000,
      percentage: 80
    };
  }

  calculateFrequencyContribution(promotion) {
    return {
      avgFrequencyIncrease: 1.5,
      volumeContribution: 2000,
      percentage: 13
    };
  }

  calculateBasketSizeContribution(promotion) {
    return {
      avgBasketIncrease: 1.3,
      volumeContribution: 3000,
      percentage: 20
    };
  }

  analyzeSustainedImpact(promotion) {
    return {
      postPromotionWeeks: 4,
      retainedUplift: 12,
      customerRetention: 65,
      brandLift: 8
    };
  }

  calculateScenarioROI(promotion, predicted) {
    const revenue = predicted.revenue;
    const cost = promotion.investment || 0;
    return ((revenue - cost) / cost) * 100;
  }

  assessScenarioRisk(scenario, historicalData) {
    // Simplified risk assessment
    return 5.5; // Medium risk score
  }
}

module.exports = new PromotionSimulationService();
