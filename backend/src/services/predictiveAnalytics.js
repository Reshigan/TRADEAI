const SalesHistory = require('../models/SalesHistory');
const Promotion = require('../models/Promotion');
const Budget = require('../models/Budget');

class PredictiveAnalyticsService {
  async predictSales(tenantId, options = {}) {
    const { months = 3, productId, customerId } = options;

    try {
      // Get historical sales data
      const matchCriteria = { company: tenantId };
      if (productId) matchCriteria.product = productId;
      if (customerId) matchCriteria.customer = customerId;

      const historicalSales = await SalesHistory.aggregate([
        { $match: matchCriteria },
        {
          $group: {
            _id: { year: '$year', month: '$month' },
            totalRevenue: { $sum: '$revenue.gross' },
            totalVolume: { $sum: '$quantity' },
            avgPrice: { $avg: '$pricing.invoicePrice' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      if (historicalSales.length < 3) {
        return {
          predictions: [],
          confidence: 'low',
          message: 'Insufficient historical data for prediction'
        };
      }

      // Simple linear regression for trend
      const revenues = historicalSales.map((s) => s.totalRevenue);
      const n = revenues.length;
      const xValues = Array.from({ length: n }, (_, i) => i);

      const sumX = xValues.reduce((a, b) => a + b, 0);
      const sumY = revenues.reduce((a, b) => a + b, 0);
      const sumXY = xValues.reduce((sum, x, i) => sum + x * revenues[i], 0);
      const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      const monthlyFactors = {};
      historicalSales.forEach((sale) => {
        const month = sale._id.month;
        if (!monthlyFactors[month]) {
          monthlyFactors[month] = [];
        }
        monthlyFactors[month].push(sale.totalRevenue);
      });

      const avgMonthlyRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length;
      const seasonalityFactors = {};
      Object.keys(monthlyFactors).forEach((month) => {
        const avgForMonth = monthlyFactors[month].reduce((a, b) => a + b, 0) / monthlyFactors[month].length;
        seasonalityFactors[month] = avgForMonth / avgMonthlyRevenue;
      });

      // Generate predictions
      const predictions = [];
      const currentDate = new Date();

      for (let i = 1; i <= months; i++) {
        const futureDate = new Date(currentDate);
        futureDate.setMonth(futureDate.getMonth() + i);
        const month = futureDate.getMonth() + 1;
        const year = futureDate.getFullYear();

        const trendValue = slope * (n + i - 1) + intercept;
        const seasonalityFactor = seasonalityFactors[month] || 1.0;
        const predictedRevenue = trendValue * seasonalityFactor;

        predictions.push({
          year,
          month,
          predictedRevenue: Math.max(0, predictedRevenue),
          trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
          seasonalityFactor
        });
      }

      const variance = revenues.reduce((sum, r, i) => {
        const predicted = slope * i + intercept;
        return sum + Math.pow(r - predicted, 2);
      }, 0) / n;

      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / avgMonthlyRevenue;

      let confidence;
      if (coefficientOfVariation < 0.2) confidence = 'high';
      else if (coefficientOfVariation < 0.5) confidence = 'medium';
      else confidence = 'low';

      return {
        predictions,
        confidence,
        trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
        trendStrength: Math.abs(slope),
        historicalAverage: avgMonthlyRevenue
      };
    } catch (error) {
      console.error('Predict sales error:', error);
      throw error;
    }
  }

  async predictPromotionROI(tenantId, promotionParams) {
    try {
      const { promotionType, discountValue, duration: _duration } = promotionParams;

      // Find similar historical promotions
      const similarPromotions = await Promotion.find({
        tenantId,
        promotionType,
        status: 'completed',
        'mechanics.discountValue': {
          $gte: discountValue * 0.8,
          $lte: discountValue * 1.2
        }
      }).limit(10);

      if (similarPromotions.length === 0) {
        return {
          predictedROI: null,
          confidence: 'low',
          message: 'No similar historical promotions found'
        };
      }

      let totalROI = 0;
      let count = 0;

      for (const promo of similarPromotions) {
        const sales = await SalesHistory.aggregate([
          {
            $match: {
              company: tenantId,
              'promotions.promotion': promo._id
            }
          },
          {
            $group: {
              _id: null,
              revenue: { $sum: '$revenue.gross' },
              cost: { $sum: '$costs.totalCost' }
            }
          }
        ]);

        if (sales[0]) {
          const grossProfit = sales[0].revenue - sales[0].cost;
          const spend = promo.financial?.costs?.totalCost || 0;
          if (spend > 0) {
            const roi = ((grossProfit - spend) / spend) * 100;
            totalROI += roi;
            count++;
          }
        }
      }

      const avgROI = count > 0 ? totalROI / count : 0;
      const confidence = count >= 5 ? 'high' : count >= 3 ? 'medium' : 'low';

      return {
        predictedROI: avgROI,
        confidence,
        similarPromotionsCount: count,
        recommendation: avgROI > 50 ? 'recommended' : avgROI > 0 ? 'neutral' : 'not_recommended'
      };
    } catch (error) {
      console.error('Predict promotion ROI error:', error);
      throw error;
    }
  }

  async predictBudgetNeeds(tenantId, options = {}) {
    try {
      const { category, months = 3 } = options;

      const matchCriteria = { tenantId };
      if (category) matchCriteria.category = category;

      const historicalBudgets = await Budget.aggregate([
        { $match: matchCriteria },
        {
          $group: {
            _id: { year: '$year', category: '$category' },
            totalAllocated: { $sum: '$allocated' },
            totalSpent: { $sum: '$spent' },
            avgUtilization: { $avg: { $divide: ['$spent', '$allocated'] } }
          }
        },
        { $sort: { '_id.year': 1 } }
      ]);

      if (historicalBudgets.length === 0) {
        return {
          predictions: [],
          confidence: 'low',
          message: 'No historical budget data found'
        };
      }

      const predictions = [];
      const avgUtilization = historicalBudgets.reduce((sum, b) => sum + b.avgUtilization, 0) / historicalBudgets.length;
      const avgSpent = historicalBudgets.reduce((sum, b) => sum + b.totalSpent, 0) / historicalBudgets.length;

      const spentValues = historicalBudgets.map((b) => b.totalSpent);
      const growthRate = spentValues.length > 1
        ? (spentValues[spentValues.length - 1] - spentValues[0]) / spentValues[0] / spentValues.length
        : 0;

      for (let i = 1; i <= months; i++) {
        const predictedSpend = avgSpent * Math.pow(1 + growthRate, i);
        const recommendedBudget = predictedSpend / Math.max(avgUtilization, 0.8);

        predictions.push({
          month: i,
          predictedSpend,
          recommendedBudget,
          expectedUtilization: avgUtilization
        });
      }

      return {
        predictions,
        confidence: historicalBudgets.length >= 6 ? 'high' : historicalBudgets.length >= 3 ? 'medium' : 'low',
        avgUtilization,
        growthRate: growthRate * 100
      };
    } catch (error) {
      console.error('Predict budget needs error:', error);
      throw error;
    }
  }

  async whatIfScenario(tenantId, scenario) {
    try {
      const { type, parameters } = scenario;

      switch (type) {
        case 'price_change':
          return await this.analyzePriceChange(tenantId, parameters);
        case 'promotion_change':
          return await this.analyzePromotionChange(tenantId, parameters);
        case 'budget_change':
          return await this.analyzeBudgetChange(tenantId, parameters);
        default:
          throw new Error('Invalid scenario type');
      }
    } catch (error) {
      console.error('What-if scenario error:', error);
      throw error;
    }
  }

  async analyzePriceChange(tenantId, parameters) {
    const { productId, priceChange } = parameters;

    const sales = await SalesHistory.find({
      company: tenantId,
      product: productId
    }).sort({ date: -1 }).limit(100);

    if (sales.length < 10) {
      return {
        impact: null,
        confidence: 'low',
        message: 'Insufficient data for price elasticity analysis'
      };
    }

    const avgVolume = sales.reduce((sum, s) => sum + s.quantity, 0) / sales.length;
    const avgRevenue = sales.reduce((sum, s) => sum + s.revenue.gross, 0) / sales.length;

    const elasticity = -1.5;
    const volumeChange = elasticity * priceChange;
    const newVolume = avgVolume * (1 + volumeChange / 100);
    const newRevenue = avgRevenue * (1 + priceChange / 100) * (1 + volumeChange / 100);

    return {
      currentVolume: avgVolume,
      predictedVolume: newVolume,
      volumeChange,
      currentRevenue: avgRevenue,
      predictedRevenue: newRevenue,
      revenueChange: ((newRevenue - avgRevenue) / avgRevenue) * 100,
      confidence: 'medium'
    };
  }

  async analyzePromotionChange(tenantId, parameters) {
    const { discountIncrease, expectedLiftIncrease } = parameters;

    const avgPromotion = await Promotion.aggregate([
      { $match: { tenantId, status: 'completed' } },
      {
        $group: {
          _id: null,
          avgDiscount: { $avg: '$mechanics.discountValue' },
          avgLift: { $avg: '$financial.planned.volumeLift' }
        }
      }
    ]);

    if (!avgPromotion[0]) {
      return {
        impact: null,
        confidence: 'low',
        message: 'No historical promotion data'
      };
    }

    const newDiscount = avgPromotion[0].avgDiscount * (1 + discountIncrease / 100);
    const newLift = avgPromotion[0].avgLift * (1 + expectedLiftIncrease / 100);

    return {
      currentAvgDiscount: avgPromotion[0].avgDiscount,
      predictedDiscount: newDiscount,
      currentAvgLift: avgPromotion[0].avgLift,
      predictedLift: newLift,
      confidence: 'medium'
    };
  }

  async analyzeBudgetChange(tenantId, parameters) {
    const { budgetIncrease, category } = parameters;

    const currentBudget = await Budget.aggregate([
      { $match: { tenantId, category } },
      {
        $group: {
          _id: null,
          totalAllocated: { $sum: '$allocated' },
          totalSpent: { $sum: '$spent' }
        }
      }
    ]);

    if (!currentBudget[0]) {
      return {
        impact: null,
        confidence: 'low',
        message: 'No budget data found'
      };
    }

    const newBudget = currentBudget[0].totalAllocated * (1 + budgetIncrease / 100);
    const utilization = currentBudget[0].totalSpent / currentBudget[0].totalAllocated;

    return {
      currentBudget: currentBudget[0].totalAllocated,
      predictedBudget: newBudget,
      currentUtilization: utilization * 100,
      additionalCapacity: newBudget - currentBudget[0].totalSpent,
      confidence: 'high'
    };
  }
}

module.exports = new PredictiveAnalyticsService();
