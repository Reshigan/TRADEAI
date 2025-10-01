const AnalyticsEngine = require('../services/analyticsEngine');
const AdvancedAnalyticsEngine = require('../services/advancedAnalyticsEngine');
const asyncHandler = require('../middleware/asyncHandler');
const { validateTenant } = require('../middleware/tenantValidation');

/**
 * Analytics Controller
 * Exposes advanced analytics capabilities through REST API
 */

class AnalyticsController {
  constructor() {
    this.analyticsEngine = new AnalyticsEngine();
    this.advancedAnalyticsEngine = AdvancedAnalyticsEngine;
  }

  /**
   * Calculate ROI for a specific promotion
   * GET /api/analytics/roi/:promotionId
   */
  calculateROI = asyncHandler(async (req, res) => {
    const { promotionId } = req.params;
    const { forceRefresh } = req.query;
    const tenantId = req.tenant.id;

    const roi = await this.advancedAnalyticsEngine.calculateROI(
      tenantId, 
      promotionId, 
      { forceRefresh: forceRefresh === 'true' }
    );

    res.json({
      success: true,
      data: roi
    });
  });

  /**
   * Calculate lift metrics for a promotion
   * GET /api/analytics/lift/:promotionId
   */
  calculateLift = asyncHandler(async (req, res) => {
    const { promotionId } = req.params;
    const { forceRefresh } = req.query;
    const tenantId = req.tenant.id;

    const lift = await this.advancedAnalyticsEngine.calculateLift(
      tenantId, 
      promotionId, 
      { forceRefresh: forceRefresh === 'true' }
    );

    res.json({
      success: true,
      data: lift
    });
  });

  /**
   * Predict promotion performance
   * POST /api/analytics/predict
   */
  predictPerformance = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const promotionData = req.body;

    const prediction = await this.analyticsEngine.predictPerformance(
      tenantId, 
      promotionData
    );

    res.json({
      success: true,
      data: prediction
    });
  });

  /**
   * Optimize trade spend allocation
   * POST /api/analytics/optimize-spend
   */
  optimizeSpend = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { budget, constraints } = req.body;

    if (!budget || budget <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid budget amount is required'
      });
    }

    const optimization = await this.analyticsEngine.optimizeSpendAllocation(
      tenantId, 
      budget, 
      constraints
    );

    res.json({
      success: true,
      data: optimization
    });
  });

  /**
   * Get dashboard analytics data
   * Used by frontend Dashboard component
   */
  getDashboardAnalytics = async (options = {}) => {
    const { userId, period = '30days', currency = 'USD' } = options;
    
    try {
      // Get currency info
      const currencySymbols = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CAD': 'C$', 'AUD': 'A$'
      };
      const currencySymbol = currencySymbols[currency] || '$';
      
      // Generate realistic demo data based on currency
      const exchangeRates = {
        'USD': 1, 'EUR': 0.85, 'GBP': 0.73, 'JPY': 110, 'CAD': 1.25, 'AUD': 1.35
      };
      const rate = exchangeRates[currency] || 1;
      
      // Base amounts in USD, converted to selected currency
      const totalBudget = Math.round(5000000 * rate);
      const totalUsed = Math.round(2150000 * rate);
      const budgetUtilization = (totalUsed / totalBudget) * 100;
      
      const dashboardData = {
        summary: {
          totalBudget,
          totalUsed,
          budgetUtilization,
          activePromotions: 12,
          totalCustomers: 847,
          currencySymbol,
          currency
        },
        monthlySpend: [
          { month: 'Jan', amount: Math.round(180000 * rate), target: Math.round(200000 * rate) },
          { month: 'Feb', amount: Math.round(220000 * rate), target: Math.round(200000 * rate) },
          { month: 'Mar', amount: Math.round(195000 * rate), target: Math.round(200000 * rate) },
          { month: 'Apr', amount: Math.round(240000 * rate), target: Math.round(200000 * rate) },
          { month: 'May', amount: Math.round(210000 * rate), target: Math.round(200000 * rate) },
          { month: 'Jun', amount: Math.round(185000 * rate), target: Math.round(200000 * rate) }
        ],
        topCustomers: [
          { 
            id: 1, 
            name: 'Walmart Inc.', 
            totalSpend: Math.round(450000 * rate), 
            growth: 12.5,
            category: 'Retail Chain'
          },
          { 
            id: 2, 
            name: 'Target Corporation', 
            totalSpend: Math.round(380000 * rate), 
            growth: 8.3,
            category: 'Retail Chain'
          },
          { 
            id: 3, 
            name: 'Kroger Co.', 
            totalSpend: Math.round(320000 * rate), 
            growth: 15.7,
            category: 'Grocery Chain'
          },
          { 
            id: 4, 
            name: 'Costco Wholesale', 
            totalSpend: Math.round(290000 * rate), 
            growth: 6.9,
            category: 'Warehouse Club'
          }
        ],
        categoryPerformance: [
          { category: 'In-Store Displays', spend: Math.round(680000 * rate), roi: 3.2 },
          { category: 'Digital Advertising', spend: Math.round(520000 * rate), roi: 4.1 },
          { category: 'Price Promotions', spend: Math.round(450000 * rate), roi: 2.8 },
          { category: 'Trade Shows', spend: Math.round(380000 * rate), roi: 2.1 },
          { category: 'Co-op Advertising', spend: Math.round(320000 * rate), roi: 3.5 }
        ],
        pendingApprovals: [
          {
            id: 1,
            type: 'Trade Promotion',
            customer: 'Walmart Inc.',
            amount: Math.round(75000 * rate),
            requestedBy: 'Sarah Johnson',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending'
          },
          {
            id: 2,
            type: 'Display Allowance',
            customer: 'Target Corporation',
            amount: Math.round(45000 * rate),
            requestedBy: 'Mike Chen',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending'
          },
          {
            id: 3,
            type: 'Volume Rebate',
            customer: 'Kroger Co.',
            amount: Math.round(32000 * rate),
            requestedBy: 'Lisa Rodriguez',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending'
          }
        ],
        forecast: {
          recommendation: `Based on current spending patterns in ${currency}, you are projected to be within budget by year end with ${currencySymbol}${Math.round((totalBudget - totalUsed) / 1000000 * 10) / 10}M remaining.`,
          confidence: 87,
          projectedTotal: Math.round(totalBudget * 0.92 * rate),
          riskFactors: ['Seasonal demand increase', 'New product launches']
        }
      };
      
      return dashboardData;
    } catch (error) {
      console.error('Error generating dashboard analytics:', error);
      throw error;
    }
  };

  /**
   * Generate performance dashboard
   * GET /api/analytics/dashboard
   */
  generateDashboard = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { startDate, endDate, ...options } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    const dateRange = {
      start: new Date(startDate),
      end: new Date(endDate)
    };

    const dashboard = await this.analyticsEngine.generatePerformanceDashboard(
      tenantId, 
      dateRange, 
      options
    );

    res.json({
      success: true,
      data: dashboard
    });
  });

  /**
   * Batch ROI calculation for multiple promotions
   * POST /api/analytics/batch-roi
   */
  batchROICalculation = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { promotionIds, options = {} } = req.body;

    if (!Array.isArray(promotionIds) || promotionIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Array of promotion IDs is required'
      });
    }

    const results = await Promise.allSettled(
      promotionIds.map(promotionId => 
        this.analyticsEngine.calculateROI(tenantId, promotionId, options)
      )
    );

    const successful = [];
    const failed = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push({
          promotionId: promotionIds[index],
          data: result.value
        });
      } else {
        failed.push({
          promotionId: promotionIds[index],
          error: result.reason.message
        });
      }
    });

    res.json({
      success: true,
      data: {
        successful,
        failed,
        summary: {
          total: promotionIds.length,
          successful: successful.length,
          failed: failed.length
        }
      }
    });
  });

  /**
   * Get analytics insights and recommendations
   * GET /api/analytics/insights
   */
  getInsights = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { dateRange, category } = req.query;

    // This would implement intelligent insights generation
    // For now, returning mock insights
    const insights = {
      topPerformingPromotions: [
        {
          id: 'promo_001',
          name: 'Summer Sale 2024',
          roi: 25.5,
          recommendation: 'Consider extending this promotion type'
        }
      ],
      underperformingAreas: [
        {
          area: 'Budget Customer Segment',
          issue: 'Low engagement rates',
          recommendation: 'Review targeting strategy'
        }
      ],
      opportunities: [
        {
          opportunity: 'Cross-selling potential',
          description: 'Electronics customers show high interest in accessories',
          potentialImpact: 'High'
        }
      ],
      alerts: [
        {
          type: 'warning',
          message: 'ROI trending downward for Q4 promotions',
          action: 'Review promotion strategy'
        }
      ]
    };

    res.json({
      success: true,
      data: insights
    });
  });

  /**
   * Export analytics data
   * GET /api/analytics/export
   */
  exportAnalytics = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { type, format, dateRange, ...filters } = req.query;

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Export type is required (roi, lift, dashboard)'
      });
    }

    // This would implement data export functionality
    // For now, returning export configuration
    const exportConfig = {
      type,
      format: format || 'json',
      dateRange,
      filters,
      estimatedRecords: 1000,
      estimatedSize: '2.5MB'
    };

    res.json({
      success: true,
      message: 'Export initiated',
      data: exportConfig
    });
  });

  /**
   * Get analytics performance metrics
   * GET /api/analytics/performance
   */
  getPerformanceMetrics = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;

    // Mock performance metrics
    const metrics = {
      cacheHitRate: 85.2,
      averageQueryTime: 245, // milliseconds
      totalCalculations: 15420,
      errorRate: 0.8,
      lastUpdated: new Date(),
      systemHealth: 'good'
    };

    res.json({
      success: true,
      data: metrics
    });
  });

  /**
   * Clear analytics cache
   * DELETE /api/analytics/cache
   */
  clearCache = asyncHandler(async (req, res) => {
    const { type } = req.query; // 'roi', 'lift', 'all'

    // Clear specific cache or all caches
    this.analyticsEngine.cache.clear();
    this.advancedAnalyticsEngine.clearCache();

    res.json({
      success: true,
      message: `Cache cleared successfully${type ? ` for ${type}` : ''}`
    });
  });

  /**
   * Get comprehensive performance metrics
   * GET /api/analytics/advanced/performance
   */
  getAdvancedPerformanceMetrics = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const {
      startDate,
      endDate,
      customerIds,
      productIds,
      promotionIds,
      forceRefresh
    } = req.query;

    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      customerIds: customerIds ? customerIds.split(',') : [],
      productIds: productIds ? productIds.split(',') : [],
      promotionIds: promotionIds ? promotionIds.split(',') : [],
      forceRefresh: forceRefresh === 'true'
    };

    const metrics = await this.advancedAnalyticsEngine.calculatePerformanceMetrics(
      tenantId,
      options
    );

    res.json({
      success: true,
      data: metrics
    });
  });

  /**
   * Get predictive sales analytics
   * POST /api/analytics/advanced/predict
   */
  getPredictiveAnalytics = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const {
      productIds = [],
      customerIds = [],
      forecastDays = 30,
      confidenceLevel = 0.95
    } = req.body;

    const prediction = await this.advancedAnalyticsEngine.predictSalesPerformance(
      tenantId,
      {
        productIds,
        customerIds,
        forecastDays,
        confidenceLevel
      }
    );

    res.json({
      success: true,
      data: prediction
    });
  });

  /**
   * Get optimization recommendations
   * GET /api/analytics/advanced/recommendations
   */
  getOptimizationRecommendations = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const {
      startDate,
      endDate,
      category,
      priority
    } = req.query;

    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      category,
      priority
    };

    const recommendations = await this.advancedAnalyticsEngine.generateOptimizationRecommendations(
      tenantId,
      options
    );

    res.json({
      success: true,
      data: recommendations
    });
  });

  /**
   * Bulk calculate ROI for multiple promotions
   * POST /api/analytics/advanced/bulk-roi
   */
  bulkCalculateROI = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { promotionIds, forceRefresh } = req.body;

    if (!Array.isArray(promotionIds) || promotionIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'promotionIds array is required'
      });
    }

    const results = await Promise.allSettled(
      promotionIds.map(promotionId =>
        this.advancedAnalyticsEngine.calculateROI(
          tenantId,
          promotionId,
          { forceRefresh: forceRefresh === true }
        )
      )
    );

    const successful = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    const failed = results
      .filter(result => result.status === 'rejected')
      .map((result, index) => ({
        promotionId: promotionIds[index],
        error: result.reason.message
      }));

    res.json({
      success: true,
      data: {
        successful,
        failed,
        summary: {
          total: promotionIds.length,
          successful: successful.length,
          failed: failed.length
        }
      }
    });
  });

  /**
   * Bulk calculate lift for multiple promotions
   * POST /api/analytics/advanced/bulk-lift
   */
  bulkCalculateLift = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { promotionIds, forceRefresh } = req.body;

    if (!Array.isArray(promotionIds) || promotionIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'promotionIds array is required'
      });
    }

    const results = await Promise.allSettled(
      promotionIds.map(promotionId =>
        this.advancedAnalyticsEngine.calculateLift(
          tenantId,
          promotionId,
          { forceRefresh: forceRefresh === true }
        )
      )
    );

    const successful = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    const failed = results
      .filter(result => result.status === 'rejected')
      .map((result, index) => ({
        promotionId: promotionIds[index],
        error: result.reason.message
      }));

    res.json({
      success: true,
      data: {
        successful,
        failed,
        summary: {
          total: promotionIds.length,
          successful: successful.length,
          failed: failed.length
        }
      }
    });
  });
}

module.exports = new AnalyticsController();