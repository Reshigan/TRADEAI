/**
 * Business Simulation Engine
 *
 * Simulates business scenarios over 30-day periods with:
 * - Revenue modeling
 * - Cost dynamics
 * - Margin impact
 * - Rebate effects
 * - Market conditions
 */

const rebateCalculationService = require('../services/rebateCalculationService');

class SimulationEngine {
  constructor() {
    this.scenarios = {
      positive: {
        name: 'Positive Growth Scenario',
        description: '30-day period with strong growth and healthy margins',
        parameters: {
          dailyGrowthRate: 0.015,        // 1.5% daily growth
          volumeIncrease: 0.20,          // 20% volume increase
          marginImprovement: 0.05,       // 5% margin improvement
          promotionEfficiency: 1.3,      // 30% better promo efficiency
          rebateOptimization: 0.85,      // 15% rebate optimization
          churnRate: 0.02,               // 2% customer churn
          marketCondition: 'bull'
        }
      },
      negative: {
        name: 'Negative Pressure Scenario',
        description: '30-day period with margin pressure and market challenges',
        parameters: {
          dailyGrowthRate: -0.01,        // -1% daily decline
          volumeIncrease: -0.15,         // 15% volume decrease
          marginImprovement: -0.10,      // 10% margin erosion
          promotionEfficiency: 0.7,      // 30% worse promo efficiency
          rebateOptimization: 1.15,      // 15% more rebate spending
          churnRate: 0.08,               // 8% customer churn
          marketCondition: 'bear'
        }
      },
      baseline: {
        name: 'Baseline Scenario',
        description: 'Current state with no changes',
        parameters: {
          dailyGrowthRate: 0,
          volumeIncrease: 0,
          marginImprovement: 0,
          promotionEfficiency: 1.0,
          rebateOptimization: 1.0,
          churnRate: 0.05,
          marketCondition: 'neutral'
        }
      }
    };
  }

  /**
   * Run simulation for specified scenario
   * @param {String} scenarioType - 'positive', 'negative', or 'baseline'
   * @param {Object} baseData - Starting business data
   * @param {Number} days - Number of days to simulate (default 30)
   * @returns {Object} - Simulation results
   */
  async runSimulation(scenarioType, baseData, days = 30) {
    const scenario = this.scenarios[scenarioType];
    if (!scenario) {
      throw new Error(`Invalid scenario type: ${scenarioType}`);
    }

    const params = scenario.parameters;
    const results = {
      scenario: scenarioType,
      scenarioName: scenario.name,
      description: scenario.description,
      parameters: params,
      dailyResults: [],
      summary: {},
      recommendations: []
    };

    // Initialize starting values
    let currentRevenue = baseData.dailyRevenue || 100000;
    let currentVolume = baseData.dailyVolume || 5000;
    const currentMargin = baseData.marginPercent || 35;
    let cumulativeRevenue = 0;
    let cumulativeProfit = 0;
    let cumulativeRebates = 0;

    // Simulate each day
    for (let day = 1; day <= days; day++) {
      // Apply growth rate
      currentRevenue *= (1 + params.dailyGrowthRate);
      currentVolume *= (1 + params.dailyGrowthRate);

      // Apply volume change (gradual)
      const volumeAdjustment = 1 + (params.volumeIncrease * (day / days));
      const adjustedVolume = currentVolume * volumeAdjustment;

      // Apply margin changes
      const adjustedMargin = currentMargin + (params.marginImprovement * 100 * (day / days));

      // Calculate revenue
      const dayRevenue = currentRevenue * volumeAdjustment;

      // Calculate COGS
      const dayCOGS = dayRevenue * ((100 - adjustedMargin) / 100);

      // Calculate gross profit
      const dayGrossProfit = dayRevenue - dayCOGS;

      // Calculate promotions (5% of revenue)
      const dayPromotions = dayRevenue * 0.05 * params.promotionEfficiency;

      // Calculate rebates (3% of revenue)
      const dayRebates = dayRevenue * 0.03 * params.rebateOptimization;

      // Calculate net profit
      const dayNetProfit = dayGrossProfit - dayPromotions - dayRebates;
      const dayNetMargin = (dayNetProfit / dayRevenue * 100);

      // Add market volatility (±2%)
      const volatility = (Math.random() - 0.5) * 0.04;
      const volatileRevenue = dayRevenue * (1 + volatility);

      // Store daily result
      results.dailyResults.push({
        day,
        date: new Date(Date.now() + day * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        revenue: parseFloat(volatileRevenue.toFixed(2)),
        volume: parseFloat(adjustedVolume.toFixed(0)),
        cogs: parseFloat(dayCOGS.toFixed(2)),
        grossProfit: parseFloat(dayGrossProfit.toFixed(2)),
        grossMargin: parseFloat(adjustedMargin.toFixed(2)),
        promotions: parseFloat(dayPromotions.toFixed(2)),
        rebates: parseFloat(dayRebates.toFixed(2)),
        netProfit: parseFloat(dayNetProfit.toFixed(2)),
        netMargin: parseFloat(dayNetMargin.toFixed(2))
      });

      // Accumulate totals
      cumulativeRevenue += volatileRevenue;
      cumulativeProfit += dayNetProfit;
      cumulativeRebates += dayRebates;
    }

    // Calculate summary statistics
    const avgDailyRevenue = cumulativeRevenue / days;
    const avgDailyProfit = cumulativeProfit / days;
    const finalDay = results.dailyResults[days - 1];
    const firstDay = results.dailyResults[0];

    results.summary = {
      totalRevenue: parseFloat(cumulativeRevenue.toFixed(2)),
      totalProfit: parseFloat(cumulativeProfit.toFixed(2)),
      totalRebates: parseFloat(cumulativeRebates.toFixed(2)),
      avgDailyRevenue: parseFloat(avgDailyRevenue.toFixed(2)),
      avgDailyProfit: parseFloat(avgDailyProfit.toFixed(2)),
      avgNetMargin: parseFloat((cumulativeProfit / cumulativeRevenue * 100).toFixed(2)),
      revenueGrowth: parseFloat(((finalDay.revenue - firstDay.revenue) / firstDay.revenue * 100).toFixed(2)),
      marginChange: parseFloat((finalDay.netMargin - firstDay.netMargin).toFixed(2)),
      roi: parseFloat((cumulativeProfit / cumulativeRevenue * 100).toFixed(2))
    };

    // Generate recommendations based on scenario
    results.recommendations = this.generateRecommendations(scenarioType, results.summary);

    return results;
  }

  /**
   * Generate AI-powered recommendations based on simulation results
   */
  generateRecommendations(scenarioType, summary) {
    const recommendations = [];

    if (scenarioType === 'positive') {
      recommendations.push({
        type: 'insight',
        priority: 'high',
        title: 'Strong Growth Momentum',
        message: `Revenue growing at ${summary.revenueGrowth.toFixed(1)}%. Consider increasing inventory to meet demand.`,
        action: 'Increase safety stock by 20%'
      });

      recommendations.push({
        type: 'suggestion',
        priority: 'medium',
        title: 'Margin Optimization Opportunity',
        message: 'Healthy margins allow for strategic investments. Consider expanding product portfolio.',
        action: 'Launch 3-5 new SKUs in high-performing categories'
      });

      recommendations.push({
        type: 'best-practice',
        priority: 'medium',
        title: 'Rebate Program Expansion',
        message: 'Strong performance enables enhanced rebate programs to drive loyalty.',
        action: 'Increase volume rebate tiers by 15%'
      });
    } else if (scenarioType === 'negative') {
      recommendations.push({
        type: 'warning',
        priority: 'high',
        title: 'Margin Pressure Alert',
        message: `Net margin declined by ${Math.abs(summary.marginChange).toFixed(1)}%. Immediate action required.`,
        action: 'Review pricing strategy and reduce low-margin SKUs'
      });

      recommendations.push({
        type: 'suggestion',
        priority: 'high',
        title: 'Cost Reduction Initiative',
        message: 'Revenue decline requires cost optimization. Focus on high-impact areas.',
        action: 'Reduce promotional spending by 10-15%'
      });

      recommendations.push({
        type: 'warning',
        priority: 'medium',
        title: 'Rebate Program Review',
        message: 'Rebate spending may be too aggressive given market conditions.',
        action: 'Tighten rebate eligibility criteria'
      });

      recommendations.push({
        type: 'suggestion',
        priority: 'medium',
        title: 'Customer Retention Focus',
        message: 'Higher churn rate requires enhanced customer engagement.',
        action: 'Launch customer retention campaign'
      });
    } else {
      recommendations.push({
        type: 'insight',
        priority: 'low',
        title: 'Steady State Performance',
        message: 'Business maintaining baseline performance. Opportunities for optimization exist.',
        action: 'Review quarterly goals and KPIs'
      });
    }

    return recommendations;
  }

  /**
   * Compare multiple scenarios
   */
  async compareScenarios(baseData) {
    const positive = await this.runSimulation('positive', baseData);
    const negative = await this.runSimulation('negative', baseData);
    const baseline = await this.runSimulation('baseline', baseData);

    return {
      comparison: {
        revenue: {
          positive: positive.summary.totalRevenue,
          baseline: baseline.summary.totalRevenue,
          negative: negative.summary.totalRevenue,
          bestCase: positive.summary.totalRevenue,
          worstCase: negative.summary.totalRevenue,
          variance: positive.summary.totalRevenue - negative.summary.totalRevenue
        },
        profit: {
          positive: positive.summary.totalProfit,
          baseline: baseline.summary.totalProfit,
          negative: negative.summary.totalProfit,
          bestCase: positive.summary.totalProfit,
          worstCase: negative.summary.totalProfit,
          variance: positive.summary.totalProfit - negative.summary.totalProfit
        },
        margin: {
          positive: positive.summary.avgNetMargin,
          baseline: baseline.summary.avgNetMargin,
          negative: negative.summary.avgNetMargin
        }
      },
      scenarios: {
        positive,
        baseline,
        negative
      }
    };
  }
}

module.exports = new SimulationEngine();
