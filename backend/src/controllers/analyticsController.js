const AnalyticsEngine = require('../services/analyticsEngine');
const { asyncHandler } = require('../middleware/asyncHandler');
const { validateTenant } = require('../middleware/tenantValidation');

/**
 * Analytics Controller
 * Exposes advanced analytics capabilities through REST API
 */

class AnalyticsController {
  constructor() {
    this.analyticsEngine = new AnalyticsEngine();
  }

  /**
   * Calculate ROI for a specific promotion
   * GET /api/analytics/roi/:promotionId
   */
  calculateROI = asyncHandler(async (req, res) => {
    const { promotionId } = req.params;
    const { forceRefresh } = req.query;
    const tenantId = req.tenant.id;

    const roi = await this.analyticsEngine.calculateROI(
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

    const lift = await this.analyticsEngine.calculateLift(
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

    res.json({
      success: true,
      message: `Cache cleared successfully${type ? ` for ${type}` : ''}`
    });
  });
}

module.exports = new AnalyticsController();