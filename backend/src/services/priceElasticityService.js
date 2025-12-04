/**
 * Price Elasticity Service
 * Learns price elasticity from actual SalesHistory data
 * Uses log-log regression to estimate price elasticity coefficients
 */

const SalesHistory = require('../models/SalesHistory');
const Product = require('../models/Product');
const logger = require('../utils/logger');

class PriceElasticityService {
  constructor() {
    // Cache for computed elasticities (refreshed periodically)
    this.elasticityCache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Calculate price elasticity for a specific product using log-log regression
   * Elasticity = % change in quantity / % change in price
   * Using log-log model: ln(Q) = a + b*ln(P) where b is the elasticity
   */
  async calculateProductElasticity(tenantId, productId) {
    const cacheKey = `${tenantId}_${productId}`;
    const cached = this.elasticityCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      // Get sales history with price variations
      const salesData = await SalesHistory.aggregate([
        {
          $match: {
            company: tenantId,
            product: productId,
            quantity: { $gt: 0 },
            'pricing.invoicePrice': { $gt: 0 }
          }
        },
        {
          $group: {
            _id: {
              price: { $round: ['$pricing.invoicePrice', 2] }
            },
            totalQuantity: { $sum: '$quantity' },
            count: { $sum: 1 },
            avgPrice: { $avg: '$pricing.invoicePrice' }
          }
        },
        { $sort: { '_id.price': 1 } }
      ]);

      if (salesData.length < 3) {
        // Not enough price variation to calculate elasticity
        return {
          elasticity: -1.5, // Default assumption
          confidence: 'low',
          dataPoints: salesData.length,
          method: 'default',
          message: 'Insufficient price variation data, using default elasticity'
        };
      }

      // Prepare data for log-log regression
      const logPrices = [];
      const logQuantities = [];

      for (const point of salesData) {
        if (point.avgPrice > 0 && point.totalQuantity > 0) {
          logPrices.push(Math.log(point.avgPrice));
          logQuantities.push(Math.log(point.totalQuantity));
        }
      }

      if (logPrices.length < 3) {
        return {
          elasticity: -1.5,
          confidence: 'low',
          dataPoints: logPrices.length,
          method: 'default',
          message: 'Insufficient valid data points for regression'
        };
      }

      // Calculate log-log regression: ln(Q) = a + b*ln(P)
      const n = logPrices.length;
      const sumX = logPrices.reduce((a, b) => a + b, 0);
      const sumY = logQuantities.reduce((a, b) => a + b, 0);
      const sumXY = logPrices.reduce((sum, x, i) => sum + x * logQuantities[i], 0);
      const sumX2 = logPrices.reduce((sum, x) => sum + x * x, 0);

      const denominator = n * sumX2 - sumX * sumX;
      if (Math.abs(denominator) < 0.0001) {
        return {
          elasticity: -1.5,
          confidence: 'low',
          dataPoints: n,
          method: 'default',
          message: 'Insufficient price variation for regression'
        };
      }

      // b (elasticity) = (n*sumXY - sumX*sumY) / (n*sumX2 - sumX^2)
      const elasticity = (n * sumXY - sumX * sumY) / denominator;
      const intercept = (sumY - elasticity * sumX) / n;

      // Calculate R-squared for confidence
      const meanY = sumY / n;
      const ssTotal = logQuantities.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
      const ssResidual = logQuantities.reduce((sum, y, i) => {
        const predicted = intercept + elasticity * logPrices[i];
        return sum + Math.pow(y - predicted, 2);
      }, 0);
      const rSquared = 1 - (ssResidual / ssTotal);

      // Determine confidence based on R-squared and data points
      let confidence;
      if (rSquared > 0.7 && n >= 10) confidence = 'high';
      else if (rSquared > 0.4 && n >= 5) confidence = 'medium';
      else confidence = 'low';

      // Elasticity should typically be negative (price up = quantity down)
      // If positive, it might indicate luxury goods or data issues
      const result = {
        elasticity: elasticity,
        intercept: intercept,
        rSquared: rSquared,
        confidence: confidence,
        dataPoints: n,
        method: 'log-log-regression',
        priceRange: {
          min: Math.exp(Math.min(...logPrices)),
          max: Math.exp(Math.max(...logPrices))
        },
        interpretation: this.interpretElasticity(elasticity)
      };

      // Cache the result
      this.elasticityCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      logger.error('Error calculating product elasticity:', error);
      return {
        elasticity: -1.5,
        confidence: 'low',
        method: 'default',
        error: error.message
      };
    }
  }

  /**
   * Calculate category-level elasticity (aggregate across products)
   */
  async calculateCategoryElasticity(tenantId, category) {
    const cacheKey = `${tenantId}_category_${category}`;
    const cached = this.elasticityCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      // Get products in category
      const products = await Product.find({
        company: tenantId,
        category: category
      }).select('_id');

      const productIds = products.map(p => p._id);

      if (productIds.length === 0) {
        return {
          elasticity: -1.5,
          confidence: 'low',
          method: 'default',
          message: 'No products found in category'
        };
      }

      // Aggregate sales data across category
      const salesData = await SalesHistory.aggregate([
        {
          $match: {
            company: tenantId,
            product: { $in: productIds },
            quantity: { $gt: 0 },
            'pricing.invoicePrice': { $gt: 0 }
          }
        },
        {
          $group: {
            _id: {
              priceRange: {
                $switch: {
                  branches: [
                    { case: { $lt: ['$pricing.invoicePrice', 10] }, then: '0-10' },
                    { case: { $lt: ['$pricing.invoicePrice', 25] }, then: '10-25' },
                    { case: { $lt: ['$pricing.invoicePrice', 50] }, then: '25-50' },
                    { case: { $lt: ['$pricing.invoicePrice', 100] }, then: '50-100' },
                    { case: { $gte: ['$pricing.invoicePrice', 100] }, then: '100+' }
                  ],
                  default: 'unknown'
                }
              }
            },
            totalQuantity: { $sum: '$quantity' },
            avgPrice: { $avg: '$pricing.invoicePrice' },
            count: { $sum: 1 }
          }
        },
        { $sort: { avgPrice: 1 } }
      ]);

      if (salesData.length < 2) {
        return {
          elasticity: -1.5,
          confidence: 'low',
          dataPoints: salesData.length,
          method: 'default',
          message: 'Insufficient category data'
        };
      }

      // Calculate elasticity using price ranges
      const logPrices = salesData.map(d => Math.log(d.avgPrice));
      const logQuantities = salesData.map(d => Math.log(d.totalQuantity));

      const n = logPrices.length;
      const sumX = logPrices.reduce((a, b) => a + b, 0);
      const sumY = logQuantities.reduce((a, b) => a + b, 0);
      const sumXY = logPrices.reduce((sum, x, i) => sum + x * logQuantities[i], 0);
      const sumX2 = logPrices.reduce((sum, x) => sum + x * x, 0);

      const denominator = n * sumX2 - sumX * sumX;
      const elasticity = Math.abs(denominator) > 0.0001 
        ? (n * sumXY - sumX * sumY) / denominator 
        : -1.5;

      const result = {
        elasticity: elasticity,
        confidence: n >= 4 ? 'medium' : 'low',
        dataPoints: n,
        method: 'category-aggregate',
        category: category,
        productsAnalyzed: productIds.length,
        interpretation: this.interpretElasticity(elasticity)
      };

      this.elasticityCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      logger.error('Error calculating category elasticity:', error);
      return {
        elasticity: -1.5,
        confidence: 'low',
        method: 'default',
        error: error.message
      };
    }
  }

  /**
   * Predict volume at a given price point using learned elasticity
   */
  async predictVolumeAtPrice(tenantId, productId, newPrice) {
    try {
      // Get current baseline
      const recentSales = await SalesHistory.aggregate([
        {
          $match: {
            company: tenantId,
            product: productId
          }
        },
        {
          $sort: { date: -1 }
        },
        {
          $limit: 30
        },
        {
          $group: {
            _id: null,
            avgQuantity: { $avg: '$quantity' },
            avgPrice: { $avg: '$pricing.invoicePrice' },
            avgRevenue: { $avg: '$revenue.gross' },
            totalRecords: { $sum: 1 }
          }
        }
      ]);

      if (!recentSales[0]) {
        return {
          error: 'No sales history found for product',
          confidence: 'none'
        };
      }

      const baseline = recentSales[0];
      const currentPrice = baseline.avgPrice;
      const currentVolume = baseline.avgQuantity;

      // Get learned elasticity
      const elasticityResult = await this.calculateProductElasticity(tenantId, productId);
      const elasticity = elasticityResult.elasticity;

      // Calculate price change percentage
      const priceChangePercent = ((newPrice - currentPrice) / currentPrice) * 100;

      // Predict volume change using elasticity
      // % change in Q = elasticity * % change in P
      const volumeChangePercent = elasticity * priceChangePercent;
      const predictedVolume = currentVolume * (1 + volumeChangePercent / 100);

      // Calculate revenue impact
      const currentRevenue = currentPrice * currentVolume;
      const predictedRevenue = newPrice * predictedVolume;
      const revenueChangePercent = ((predictedRevenue - currentRevenue) / currentRevenue) * 100;

      // Calculate gross benefit (incremental revenue)
      const grossBenefit = predictedRevenue - currentRevenue;

      return {
        currentState: {
          price: currentPrice,
          volume: currentVolume,
          revenue: currentRevenue
        },
        prediction: {
          price: newPrice,
          volume: Math.max(0, predictedVolume),
          revenue: Math.max(0, predictedRevenue)
        },
        changes: {
          priceChange: priceChangePercent,
          volumeChange: volumeChangePercent,
          revenueChange: revenueChangePercent,
          grossBenefit: grossBenefit
        },
        elasticity: {
          value: elasticity,
          confidence: elasticityResult.confidence,
          method: elasticityResult.method,
          interpretation: elasticityResult.interpretation
        },
        recommendation: this.generatePriceRecommendation(priceChangePercent, volumeChangePercent, revenueChangePercent)
      };
    } catch (error) {
      logger.error('Error predicting volume at price:', error);
      throw error;
    }
  }

  /**
   * Generate optimal price suggestions for maximum revenue/profit
   */
  async suggestOptimalPrices(tenantId, productId, options = {}) {
    const { minPrice, maxPrice, steps = 10 } = options;

    try {
      // Get current baseline
      const recentSales = await SalesHistory.aggregate([
        {
          $match: {
            company: tenantId,
            product: productId
          }
        },
        {
          $sort: { date: -1 }
        },
        {
          $limit: 30
        },
        {
          $group: {
            _id: null,
            avgQuantity: { $avg: '$quantity' },
            avgPrice: { $avg: '$pricing.invoicePrice' },
            avgCost: { $avg: '$costs.unitCost' }
          }
        }
      ]);

      if (!recentSales[0]) {
        return { error: 'No sales history found' };
      }

      const baseline = recentSales[0];
      const currentPrice = baseline.avgPrice;
      const currentVolume = baseline.avgQuantity;
      const unitCost = baseline.avgCost || currentPrice * 0.6; // Assume 60% cost if not available

      // Get elasticity
      const elasticityResult = await this.calculateProductElasticity(tenantId, productId);
      const elasticity = elasticityResult.elasticity;

      // Define price range to test
      const priceMin = minPrice || currentPrice * 0.7;
      const priceMax = maxPrice || currentPrice * 1.3;
      const priceStep = (priceMax - priceMin) / steps;

      const scenarios = [];
      let optimalRevenueScenario = null;
      let optimalProfitScenario = null;

      for (let i = 0; i <= steps; i++) {
        const testPrice = priceMin + (i * priceStep);
        const priceChangePercent = ((testPrice - currentPrice) / currentPrice) * 100;
        const volumeChangePercent = elasticity * priceChangePercent;
        const predictedVolume = currentVolume * (1 + volumeChangePercent / 100);
        
        const revenue = testPrice * Math.max(0, predictedVolume);
        const profit = (testPrice - unitCost) * Math.max(0, predictedVolume);
        const margin = testPrice > 0 ? ((testPrice - unitCost) / testPrice) * 100 : 0;

        const scenario = {
          price: Math.round(testPrice * 100) / 100,
          predictedVolume: Math.round(predictedVolume),
          revenue: Math.round(revenue),
          profit: Math.round(profit),
          margin: Math.round(margin * 10) / 10,
          priceChange: Math.round(priceChangePercent * 10) / 10,
          volumeChange: Math.round(volumeChangePercent * 10) / 10
        };

        scenarios.push(scenario);

        if (!optimalRevenueScenario || revenue > optimalRevenueScenario.revenue) {
          optimalRevenueScenario = scenario;
        }
        if (!optimalProfitScenario || profit > optimalProfitScenario.profit) {
          optimalProfitScenario = scenario;
        }
      }

      return {
        currentState: {
          price: currentPrice,
          volume: currentVolume,
          revenue: currentPrice * currentVolume,
          profit: (currentPrice - unitCost) * currentVolume,
          unitCost: unitCost
        },
        elasticity: {
          value: elasticity,
          confidence: elasticityResult.confidence,
          interpretation: elasticityResult.interpretation
        },
        scenarios: scenarios,
        recommendations: {
          forMaxRevenue: {
            ...optimalRevenueScenario,
            revenueGain: optimalRevenueScenario.revenue - (currentPrice * currentVolume)
          },
          forMaxProfit: {
            ...optimalProfitScenario,
            profitGain: optimalProfitScenario.profit - ((currentPrice - unitCost) * currentVolume)
          }
        },
        analysis: this.generatePricingAnalysis(elasticity, optimalRevenueScenario, optimalProfitScenario, currentPrice)
      };
    } catch (error) {
      logger.error('Error suggesting optimal prices:', error);
      throw error;
    }
  }

  /**
   * Interpret elasticity value
   */
  interpretElasticity(elasticity) {
    const absElasticity = Math.abs(elasticity);
    
    if (absElasticity < 0.5) {
      return {
        type: 'inelastic',
        description: 'Demand is relatively insensitive to price changes. Price increases may boost revenue.',
        recommendation: 'Consider price increases to maximize revenue'
      };
    } else if (absElasticity < 1) {
      return {
        type: 'relatively_inelastic',
        description: 'Demand responds moderately to price changes.',
        recommendation: 'Small price adjustments recommended'
      };
    } else if (absElasticity === 1) {
      return {
        type: 'unit_elastic',
        description: 'Demand changes proportionally with price.',
        recommendation: 'Revenue is maximized at current price point'
      };
    } else if (absElasticity < 2) {
      return {
        type: 'relatively_elastic',
        description: 'Demand is sensitive to price changes.',
        recommendation: 'Consider price reductions to increase volume and revenue'
      };
    } else {
      return {
        type: 'highly_elastic',
        description: 'Demand is very sensitive to price changes. Small price changes cause large volume swings.',
        recommendation: 'Focus on competitive pricing; avoid price increases'
      };
    }
  }

  /**
   * Generate price recommendation based on predicted changes
   */
  generatePriceRecommendation(priceChange, volumeChange, revenueChange) {
    if (revenueChange > 5) {
      return {
        action: 'recommended',
        reason: `Expected ${revenueChange.toFixed(1)}% revenue increase`,
        confidence: 'high'
      };
    } else if (revenueChange > 0) {
      return {
        action: 'consider',
        reason: `Marginal ${revenueChange.toFixed(1)}% revenue increase expected`,
        confidence: 'medium'
      };
    } else if (revenueChange > -5) {
      return {
        action: 'neutral',
        reason: `Minor ${Math.abs(revenueChange).toFixed(1)}% revenue decrease expected`,
        confidence: 'medium'
      };
    } else {
      return {
        action: 'not_recommended',
        reason: `Significant ${Math.abs(revenueChange).toFixed(1)}% revenue decrease expected`,
        confidence: 'high'
      };
    }
  }

  /**
   * Generate pricing analysis summary
   */
  generatePricingAnalysis(elasticity, revenueOptimal, profitOptimal, currentPrice) {
    const insights = [];

    if (Math.abs(elasticity) < 1) {
      insights.push('Product has inelastic demand - price increases may boost revenue');
    } else {
      insights.push('Product has elastic demand - focus on competitive pricing');
    }

    if (revenueOptimal.price > currentPrice) {
      insights.push(`Revenue-optimal price is ${((revenueOptimal.price - currentPrice) / currentPrice * 100).toFixed(1)}% higher than current`);
    } else {
      insights.push(`Revenue-optimal price is ${((currentPrice - revenueOptimal.price) / currentPrice * 100).toFixed(1)}% lower than current`);
    }

    if (profitOptimal.price !== revenueOptimal.price) {
      insights.push('Revenue and profit optimization suggest different price points - consider business priorities');
    }

    return {
      insights,
      summary: `Based on learned elasticity of ${elasticity.toFixed(2)}, ${insights[0].toLowerCase()}`
    };
  }

  /**
   * Clear elasticity cache (for manual refresh)
   */
  clearCache() {
    this.elasticityCache.clear();
    return { message: 'Elasticity cache cleared' };
  }

  /**
   * Get all cached elasticities for a tenant
   */
  getCachedElasticities(tenantId) {
    const results = [];
    for (const [key, value] of this.elasticityCache.entries()) {
      if (key.startsWith(tenantId)) {
        results.push({
          key,
          ...value.data,
          cachedAt: new Date(value.timestamp).toISOString()
        });
      }
    }
    return results;
  }
}

module.exports = new PriceElasticityService();
