const mongoose = require('mongoose');
const TradeSpend = require('../models/TradeSpend');
const Promotion = require('../models/Promotion');
const SalesHistory = require('../models/SalesHistory');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const logger = require('../utils/logger');

/**
 * Advanced Analytics Engine
 * Provides comprehensive analytics including ROI, Lift, Performance Metrics, and Predictive Analytics
 */
class AdvancedAnalyticsEngine {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Calculate ROI (Return on Investment) for promotions
   */
  async calculateROI(tenantId, promotionId, options = {}) {
    try {
      const cacheKey = `roi_${tenantId}_${promotionId}`;
      const cached = this.getFromCache(cacheKey);
      if (cached && !options.forceRefresh) return cached;

      // Get promotion data
      const promotion = await Promotion.findOne({
        _id: promotionId,
        tenantId
      }).populate('products customers');

      if (!promotion) {
        throw new Error('Promotion not found');
      }

      // Get trade spend data
      const tradeSpend = await TradeSpend.find({
        promotionId,
        tenantId
      });

      // Calculate total investment
      const totalInvestment = tradeSpend.reduce((sum, spend) => {
        return sum + (spend.actualAmount || spend.plannedAmount || 0);
      }, 0);

      // Get sales data for promotion period
      const salesData = await this.getPromotionSalesData(tenantId, promotion);

      // Calculate baseline sales (pre-promotion average)
      const baselineSales = await this.calculateBaselineSales(
        tenantId,
        promotion.products.map((p) => p._id),
        promotion.customers.map((c) => c._id),
        promotion.startDate
      );

      // Calculate incremental sales
      const incrementalSales = salesData.totalSales - baselineSales.averageSales;
      const incrementalRevenue = incrementalSales * salesData.averagePrice;

      // Calculate ROI
      const roi = totalInvestment > 0 ?
        ((incrementalRevenue - totalInvestment) / totalInvestment) * 100 : 0;

      const result = {
        promotionId,
        promotionName: promotion.name,
        totalInvestment,
        incrementalSales,
        incrementalRevenue,
        roi,
        roiCategory: this.categorizeROI(roi),
        calculatedAt: new Date(),
        period: {
          startDate: promotion.startDate,
          endDate: promotion.endDate
        },
        metrics: {
          totalSales: salesData.totalSales,
          baselineSales: baselineSales.averageSales,
          averagePrice: salesData.averagePrice,
          salesLift: this.calculateLiftPercentage(salesData.totalSales, baselineSales.averageSales)
        }
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      logger.error('ROI calculation error:', error);
      throw error;
    }
  }

  /**
   * Calculate Sales Lift for promotions
   */
  async calculateLift(tenantId, promotionId, options = {}) {
    try {
      const cacheKey = `lift_${tenantId}_${promotionId}`;
      const cached = this.getFromCache(cacheKey);
      if (cached && !options.forceRefresh) return cached;

      const promotion = await Promotion.findOne({
        _id: promotionId,
        tenantId
      }).populate('products customers');

      if (!promotion) {
        throw new Error('Promotion not found');
      }

      // Get promotion sales data
      const promotionSales = await this.getPromotionSalesData(tenantId, promotion);

      // Get baseline sales data
      const baselineSales = await this.calculateBaselineSales(
        tenantId,
        promotion.products.map((p) => p._id),
        promotion.customers.map((c) => c._id),
        promotion.startDate
      );

      // Calculate different types of lift
      const volumeLift = this.calculateLiftPercentage(promotionSales.totalVolume, baselineSales.averageVolume);
      const revenueLift = this.calculateLiftPercentage(promotionSales.totalRevenue, baselineSales.averageRevenue);
      const unitLift = this.calculateLiftPercentage(promotionSales.totalUnits, baselineSales.averageUnits);

      const result = {
        promotionId,
        promotionName: promotion.name,
        lifts: {
          volume: {
            percentage: volumeLift,
            absolute: promotionSales.totalVolume - baselineSales.averageVolume,
            category: this.categorizeLift(volumeLift)
          },
          revenue: {
            percentage: revenueLift,
            absolute: promotionSales.totalRevenue - baselineSales.averageRevenue,
            category: this.categorizeLift(revenueLift)
          },
          units: {
            percentage: unitLift,
            absolute: promotionSales.totalUnits - baselineSales.averageUnits,
            category: this.categorizeLift(unitLift)
          }
        },
        overallLift: (volumeLift + revenueLift + unitLift) / 3,
        calculatedAt: new Date(),
        period: {
          startDate: promotion.startDate,
          endDate: promotion.endDate
        }
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      logger.error('Lift calculation error:', error);
      throw error;
    }
  }

  /**
   * Calculate comprehensive performance metrics
   */
  async calculatePerformanceMetrics(tenantId, options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        endDate = new Date(),
        customerIds = [],
        productIds = [],
        promotionIds = []
      } = options;

      const cacheKey = `performance_${tenantId}_${startDate.getTime()}_${endDate.getTime()}`;
      const cached = this.getFromCache(cacheKey);
      if (cached && !options.forceRefresh) return cached;

      // Build aggregation pipeline
      const pipeline = [
        {
          $match: {
            tenantId: new mongoose.Types.ObjectId(tenantId),
            date: { $gte: startDate, $lte: endDate },
            ...(customerIds.length && { customerId: { $in: customerIds.map((id) => new mongoose.Types.ObjectId(id)) } }),
            ...(productIds.length && { productId: { $in: productIds.map((id) => new mongoose.Types.ObjectId(id)) } })
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$revenue' },
            totalVolume: { $sum: '$volume' },
            totalUnits: { $sum: '$units' },
            totalTransactions: { $sum: 1 },
            averageTransactionValue: { $avg: '$revenue' },
            uniqueCustomers: { $addToSet: '$customerId' },
            uniqueProducts: { $addToSet: '$productId' }
          }
        },
        {
          $project: {
            totalRevenue: 1,
            totalVolume: 1,
            totalUnits: 1,
            totalTransactions: 1,
            averageTransactionValue: 1,
            uniqueCustomerCount: { $size: '$uniqueCustomers' },
            uniqueProductCount: { $size: '$uniqueProducts' }
          }
        }
      ];

      const [metrics] = await SalesHistory.aggregate(pipeline);

      if (!metrics) {
        return {
          totalRevenue: 0,
          totalVolume: 0,
          totalUnits: 0,
          totalTransactions: 0,
          averageTransactionValue: 0,
          uniqueCustomerCount: 0,
          uniqueProductCount: 0,
          calculatedAt: new Date()
        };
      }

      // Calculate additional metrics
      const customerMetrics = await this.calculateCustomerMetrics(tenantId, { startDate, endDate });
      const productMetrics = await this.calculateProductMetrics(tenantId, { startDate, endDate });
      const promotionMetrics = await this.calculatePromotionMetrics(tenantId, { startDate, endDate, promotionIds });

      const result = {
        ...metrics,
        period: { startDate, endDate },
        customerMetrics,
        productMetrics,
        promotionMetrics,
        kpis: {
          revenuePerCustomer: metrics.uniqueCustomerCount > 0 ?
            metrics.totalRevenue / metrics.uniqueCustomerCount : 0,
          revenuePerProduct: metrics.uniqueProductCount > 0 ?
            metrics.totalRevenue / metrics.uniqueProductCount : 0,
          averageOrderValue: metrics.totalTransactions > 0 ?
            metrics.totalRevenue / metrics.totalTransactions : 0,
          volumePerTransaction: metrics.totalTransactions > 0 ?
            metrics.totalVolume / metrics.totalTransactions : 0
        },
        calculatedAt: new Date()
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      logger.error('Performance metrics calculation error:', error);
      throw error;
    }
  }

  /**
   * Predictive analytics for sales forecasting
   */
  async predictSalesPerformance(tenantId, options = {}) {
    try {
      const {
        productIds = [],
        customerIds = [],
        forecastDays = 30,
        confidenceLevel = 0.95
      } = options;

      // Get historical sales data
      const historicalData = await this.getHistoricalSalesData(tenantId, {
        productIds,
        customerIds,
        days: 90 // Use 90 days of history for prediction
      });

      // Simple linear regression for trend analysis
      const trendAnalysis = this.calculateTrend(historicalData);

      // Seasonal analysis
      const seasonalFactors = this.calculateSeasonalFactors(historicalData);

      // Generate forecast
      const forecast = this.generateForecast(
        historicalData,
        trendAnalysis,
        seasonalFactors,
        forecastDays
      );

      // Calculate confidence intervals
      const confidenceIntervals = this.calculateConfidenceIntervals(
        forecast,
        historicalData,
        confidenceLevel
      );

      return {
        forecast,
        confidenceIntervals,
        trendAnalysis,
        seasonalFactors,
        accuracy: this.calculateForecastAccuracy(historicalData),
        metadata: {
          forecastDays,
          confidenceLevel,
          historicalDataPoints: historicalData.length,
          calculatedAt: new Date()
        }
      };

    } catch (error) {
      logger.error('Predictive analytics error:', error);
      throw error;
    }
  }

  /**
   * Optimization recommendations
   */
  async generateOptimizationRecommendations(tenantId, options = {}) {
    try {
      const performanceMetrics = await this.calculatePerformanceMetrics(tenantId, options);
      const recommendations = [];

      // ROI-based recommendations
      const lowROIPromotions = await this.findLowROIPromotions(tenantId);
      if (lowROIPromotions.length > 0) {
        recommendations.push({
          type: 'roi_optimization',
          priority: 'high',
          title: 'Optimize Low-Performing Promotions',
          description: `${lowROIPromotions.length} promotions have ROI below 10%`,
          action: 'Review and adjust promotion strategies',
          impact: 'potential_revenue_increase',
          data: lowROIPromotions
        });
      }

      // Customer concentration recommendations
      if (performanceMetrics.customerMetrics.concentrationRisk > 0.7) {
        recommendations.push({
          type: 'customer_diversification',
          priority: 'medium',
          title: 'Diversify Customer Base',
          description: 'High revenue concentration in few customers',
          action: 'Expand customer acquisition efforts',
          impact: 'risk_reduction',
          data: { concentrationRisk: performanceMetrics.customerMetrics.concentrationRisk }
        });
      }

      // Product performance recommendations
      const underperformingProducts = await this.findUnderperformingProducts(tenantId);
      if (underperformingProducts.length > 0) {
        recommendations.push({
          type: 'product_optimization',
          priority: 'medium',
          title: 'Address Underperforming Products',
          description: `${underperformingProducts.length} products below average performance`,
          action: 'Review pricing and promotion strategies',
          impact: 'revenue_optimization',
          data: underperformingProducts
        });
      }

      return {
        recommendations,
        summary: {
          totalRecommendations: recommendations.length,
          highPriority: recommendations.filter((r) => r.priority === 'high').length,
          mediumPriority: recommendations.filter((r) => r.priority === 'medium').length,
          lowPriority: recommendations.filter((r) => r.priority === 'low').length
        },
        generatedAt: new Date()
      };

    } catch (error) {
      logger.error('Optimization recommendations error:', error);
      throw error;
    }
  }

  // Helper methods

  async getPromotionSalesData(tenantId, promotion) {
    const salesData = await SalesHistory.aggregate([
      {
        $match: {
          tenantId: new mongoose.Types.ObjectId(tenantId),
          productId: { $in: promotion.products.map((p) => p._id) },
          customerId: { $in: promotion.customers.map((c) => c._id) },
          date: { $gte: promotion.startDate, $lte: promotion.endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$revenue' },
          totalVolume: { $sum: '$volume' },
          totalRevenue: { $sum: '$revenue' },
          totalUnits: { $sum: '$units' },
          averagePrice: { $avg: '$unitPrice' }
        }
      }
    ]);

    return salesData[0] || {
      totalSales: 0,
      totalVolume: 0,
      totalRevenue: 0,
      totalUnits: 0,
      averagePrice: 0
    };
  }

  async calculateBaselineSales(tenantId, productIds, customerIds, promotionStartDate) {
    const baselineEndDate = new Date(promotionStartDate);
    const baselineStartDate = new Date(baselineEndDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days before

    const baselineData = await SalesHistory.aggregate([
      {
        $match: {
          tenantId: new mongoose.Types.ObjectId(tenantId),
          productId: { $in: productIds },
          customerId: { $in: customerIds },
          date: { $gte: baselineStartDate, $lt: baselineEndDate }
        }
      },
      {
        $group: {
          _id: null,
          averageSales: { $avg: '$revenue' },
          averageVolume: { $avg: '$volume' },
          averageRevenue: { $avg: '$revenue' },
          averageUnits: { $avg: '$units' }
        }
      }
    ]);

    return baselineData[0] || {
      averageSales: 0,
      averageVolume: 0,
      averageRevenue: 0,
      averageUnits: 0
    };
  }

  calculateLiftPercentage(current, baseline) {
    if (baseline === 0) return 0;
    return ((current - baseline) / baseline) * 100;
  }

  categorizeROI(roi) {
    if (roi >= 50) return 'excellent';
    if (roi >= 25) return 'good';
    if (roi >= 10) return 'fair';
    if (roi >= 0) return 'poor';
    return 'negative';
  }

  categorizeLift(lift) {
    if (lift >= 30) return 'high';
    if (lift >= 15) return 'medium';
    if (lift >= 5) return 'low';
    if (lift >= 0) return 'minimal';
    return 'negative';
  }

  async calculateCustomerMetrics(tenantId, options) {
    // Implementation for customer-specific metrics
    return {
      totalCustomers: 0,
      activeCustomers: 0,
      newCustomers: 0,
      churnRate: 0,
      concentrationRisk: 0
    };
  }

  async calculateProductMetrics(tenantId, options) {
    // Implementation for product-specific metrics
    return {
      totalProducts: 0,
      activeProducts: 0,
      topPerformers: [],
      underPerformers: []
    };
  }

  async calculatePromotionMetrics(tenantId, options) {
    // Implementation for promotion-specific metrics
    return {
      totalPromotions: 0,
      activePromotions: 0,
      averageROI: 0,
      averageLift: 0
    };
  }

  // Cache management
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = new AdvancedAnalyticsEngine();
