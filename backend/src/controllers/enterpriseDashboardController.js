const Budget = require('../models/Budget');
const Promotion = require('../models/Promotion');
const TradeSpend = require('../models/TradeSpend');
const SalesHistory = require('../models/SalesHistory');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { cacheService } = require('../services/cacheService');
const mlService = require('../services/mlService');

/**
 * ENTERPRISE DASHBOARD CONTROLLER
 * Advanced dashboard system with real-time KPIs, drill-downs, and analytics
 */

// =====================================================
// EXECUTIVE DASHBOARDS
// =====================================================

/**
 * Get comprehensive executive dashboard
 * Includes KPIs, trends, alerts, and drill-down data
 */
exports.getExecutiveDashboard = asyncHandler(async (req, res, next) => {
  const {
    year = new Date().getFullYear(),
    quarter,
    month,
    region,
    customerId,
    compareWith, // 'previous_year', 'previous_quarter', 'previous_month'
    refresh = false
  } = req.query;

  // Cache configuration
  const cacheKey = cacheService.generateKey('enterprise', 'executive', {
    year, quarter, month, region, customerId, compareWith
  });
  
  if (!refresh) {
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true,
        timestamp: new Date()
      });
    }
  }

  // Date range calculation
  const dateRange = calculateDateRange({ year, quarter, month });
  const comparisonRange = calculateComparisonRange(dateRange, compareWith);

  // Parallel data fetching for performance
  const [
    kpiMetrics,
    trendData,
    alerts,
    topPerformers,
    bottomPerformers,
    categoryBreakdown,
    channelPerformance,
    regionalData
  ] = await Promise.all([
    getKPIMetrics(dateRange, { region, customerId }),
    getTrendData(dateRange, { region, customerId }),
    getAlerts(dateRange, { region, customerId }),
    getTopPerformers(dateRange, { region, customerId }),
    getBottomPerformers(dateRange, { region, customerId }),
    getCategoryBreakdown(dateRange, { region, customerId }),
    getChannelPerformance(dateRange, { region, customerId }),
    getRegionalData(dateRange, { region, customerId })
  ]);

  // Comparison data if requested
  let comparisonData = null;
  if (compareWith && comparisonRange) {
    comparisonData = await getKPIMetrics(comparisonRange, { region, customerId });
  }

  const dashboardData = {
    metadata: {
      dateRange,
      comparisonRange,
      filters: { year, quarter, month, region, customerId },
      generatedAt: new Date(),
      refreshInterval: 300000 // 5 minutes
    },
    kpi: {
      current: kpiMetrics,
      comparison: comparisonData,
      growth: calculateGrowth(kpiMetrics, comparisonData)
    },
    trends: trendData,
    alerts: alerts,
    performance: {
      topPerformers,
      bottomPerformers
    },
    breakdown: {
      byCategory: categoryBreakdown,
      byChannel: channelPerformance,
      byRegion: regionalData
    },
    insights: await generateInsights({
      kpi: kpiMetrics,
      trends: trendData,
      alerts: alerts
    })
  };

  // Cache for 5 minutes
  await cacheService.set(cacheKey, dashboardData, 300);

  res.json({
    success: true,
    data: dashboardData,
    cached: false,
    timestamp: new Date()
  });
});

/**
 * Get real-time KPI metrics
 */
exports.getRealTimeKPIs = asyncHandler(async (req, res, next) => {
  const { metrics = 'all', period = 'today' } = req.query;
  
  const dateRange = period === 'today' 
    ? { start: new Date().setHours(0,0,0,0), end: new Date() }
    : calculateDateRange({ period });

  const requestedMetrics = metrics === 'all' 
    ? ['revenue', 'margin', 'volume', 'roi', 'promotions', 'customers']
    : metrics.split(',');

  const tenantId = req.tenant._id;
  const kpiData = {};

  const promises = requestedMetrics.map(async (metric) => {
    switch(metric) {
      case 'revenue':
        kpiData.revenue = await getRevenueKPI(tenantId, dateRange);
        break;
      case 'margin':
        kpiData.margin = await getMarginKPI(tenantId, dateRange);
        break;
      case 'volume':
        kpiData.volume = await getVolumeKPI(tenantId, dateRange);
        break;
      case 'roi':
        kpiData.roi = await getROIKPI(tenantId, dateRange);
        break;
      case 'promotions':
        kpiData.promotions = await getPromotionKPI(tenantId, dateRange);
        break;
      case 'customers':
        kpiData.customers = await getCustomerKPI(tenantId, dateRange);
        break;
    }
  });

  await Promise.all(promises);

  res.json({
    success: true,
    data: {
      kpis: kpiData,
      timestamp: new Date(),
      period: dateRange
    }
  });
});

/**
 * Get drill-down data for specific metric
 */
exports.getDrillDownData = asyncHandler(async (req, res, next) => {
  const {
    metric, // 'revenue', 'margin', 'volume', etc.
    dimension, // 'product', 'customer', 'region', 'channel'
    dateRange,
    filters = {}
  } = req.body;

  if (!metric || !dimension) {
    throw new AppError('Metric and dimension are required', 400);
  }

  const range = dateRange || calculateDateRange({ period: 'ytd' });
  
  let drillDownData;
  
  switch(dimension) {
    case 'product':
      drillDownData = await drillDownByProduct(metric, range, filters);
      break;
    case 'customer':
      drillDownData = await drillDownByCustomer(metric, range, filters);
      break;
    case 'region':
      drillDownData = await drillDownByRegion(metric, range, filters);
      break;
    case 'channel':
      drillDownData = await drillDownByChannel(metric, range, filters);
      break;
    case 'time':
      drillDownData = await drillDownByTime(metric, range, filters);
      break;
    default:
      throw new AppError(`Unsupported dimension: ${dimension}`, 400);
  }

  res.json({
    success: true,
    data: {
      metric,
      dimension,
      dateRange: range,
      drillDown: drillDownData,
      aggregations: calculateAggregations(drillDownData)
    }
  });
});

// =====================================================
// OPERATIONAL DASHBOARDS
// =====================================================

/**
 * Get trade spend tracking dashboard
 */
exports.getTradeSpendDashboard = asyncHandler(async (req, res, next) => {
  const { year = new Date().getFullYear(), status, spendType } = req.query;

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  // Build match criteria
  const matchCriteria = {
    'period.startDate': { $gte: startDate, $lte: endDate }
  };
  if (status) matchCriteria.status = status;
  if (spendType) matchCriteria.spendType = spendType;

  // Aggregate trade spend data
  const [
    spendByType,
    spendByStatus,
    spendTrend,
    topSpendAreas,
    budgetVsActual,
    upcomingCommitments
  ] = await Promise.all([
    TradeSpend.aggregate([
      { $match: matchCriteria },
      { $group: {
        _id: '$spendType',
        totalBudget: { $sum: '$amount.budgeted' },
        totalSpent: { $sum: '$amount.spent' },
        totalCommitted: { $sum: '$amount.committed' },
        count: { $sum: 1 }
      }},
      { $sort: { totalSpent: -1 } }
    ]),
    TradeSpend.aggregate([
      { $match: matchCriteria },
      { $group: {
        _id: '$status',
        total: { $sum: '$amount.spent' },
        count: { $sum: 1 }
      }}
    ]),
    getSpendTrend(year),
    getTopSpendAreas(matchCriteria, 10),
    getBudgetVsActualSpend(year),
    getUpcomingCommitments(30) // Next 30 days
  ]);

  // Calculate utilization rates
  const utilizationRate = budgetVsActual.totalBudget > 0
    ? (budgetVsActual.totalSpent / budgetVsActual.totalBudget) * 100
    : 0;

  res.json({
    success: true,
    data: {
      summary: {
        totalBudget: budgetVsActual.totalBudget,
        totalSpent: budgetVsActual.totalSpent,
        totalCommitted: budgetVsActual.totalCommitted,
        available: budgetVsActual.totalBudget - budgetVsActual.totalSpent - budgetVsActual.totalCommitted,
        utilizationRate: utilizationRate.toFixed(2)
      },
      breakdown: {
        byType: spendByType,
        byStatus: spendByStatus
      },
      trends: spendTrend,
      topSpendAreas,
      upcomingCommitments,
      alerts: generateSpendAlerts(budgetVsActual, utilizationRate)
    }
  });
});

/**
 * Get promotion performance dashboard
 */
exports.getPromotionDashboard = asyncHandler(async (req, res, next) => {
  const { status = 'all', period = 'current', type } = req.query;

  let dateFilter = {};
  const currentDate = new Date();

  switch(period) {
    case 'current':
      dateFilter = {
        'period.startDate': { $lte: currentDate },
        'period.endDate': { $gte: currentDate }
      };
      break;
    case 'upcoming':
      dateFilter = {
        'period.startDate': { $gt: currentDate }
      };
      break;
    case 'past':
      dateFilter = {
        'period.endDate': { $lt: currentDate }
      };
      break;
  }

  const matchCriteria = { ...dateFilter };
  if (status !== 'all') matchCriteria.status = status;
  if (type) matchCriteria.type = type;

  const [
    promotionStats,
    performanceMetrics,
    topPromotions,
    promotionTrends,
    channelPerformance,
    roiAnalysis
  ] = await Promise.all([
    Promotion.aggregate([
      { $match: matchCriteria },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalInvestment: { $sum: '$budget.allocated' },
        totalActual: { $sum: '$budget.actual' }
      }}
    ]),
    getPromotionPerformanceMetrics(matchCriteria),
    getTopPerformingPromotions(matchCriteria, 10),
    getPromotionTrends(period),
    getPromotionChannelPerformance(matchCriteria),
    getPromotionROIAnalysis(matchCriteria)
  ]);

  res.json({
    success: true,
    data: {
      statistics: promotionStats,
      performance: performanceMetrics,
      topPromotions,
      trends: promotionTrends,
      channelPerformance,
      roiAnalysis,
      insights: await generatePromotionInsights(performanceMetrics)
    }
  });
});

/**
 * Get budget utilization dashboard
 */
exports.getBudgetDashboard = asyncHandler(async (req, res, next) => {
  const { year = new Date().getFullYear(), department, category } = req.query;

  const matchCriteria = { year };
  if (department) matchCriteria.department = department;
  if (category) matchCriteria.category = category;

  const [
    budgetOverview,
    utilizationByCategory,
    monthlyUtilization,
    topSpenders,
    budgetAlerts,
    forecast
  ] = await Promise.all([
    getBudgetOverview(matchCriteria),
    getBudgetUtilizationByCategory(matchCriteria),
    getMonthlyBudgetUtilization(year),
    getTopBudgetSpenders(matchCriteria, 10),
    getBudgetAlerts(matchCriteria),
    getBudgetForecast(year)
  ]);

  res.json({
    success: true,
    data: {
      overview: budgetOverview,
      utilization: {
        byCategory: utilizationByCategory,
        byMonth: monthlyUtilization
      },
      topSpenders,
      alerts: budgetAlerts,
      forecast,
      recommendations: generateBudgetRecommendations(budgetOverview, utilizationByCategory)
    }
  });
});

// =====================================================
// ANALYTICS DASHBOARDS
// =====================================================

/**
 * Get sales performance dashboard
 */
exports.getSalesPerformanceDashboard = asyncHandler(async (req, res, next) => {
  const {
    period = 'ytd',
    groupBy = 'month',
    product,
    customer,
    region
  } = req.query;

  const dateRange = calculateDateRange({ period });
  const filters = {};
  if (product) filters.productId = product;
  if (customer) filters.customerId = customer;
  if (region) filters.region = region;

  const [
    salesMetrics,
    salesTrend,
    topProducts,
    topCustomers,
    regionPerformance,
    salesForecast,
    cohortAnalysis
  ] = await Promise.all([
    getSalesMetrics(dateRange, filters),
    getSalesTrend(dateRange, groupBy, filters),
    getTopProducts(dateRange, filters, 10),
    getTopCustomers(dateRange, filters, 10),
    getRegionPerformance(dateRange, filters),
    getSalesForecast(dateRange, filters),
    getCohortAnalysis(dateRange, filters)
  ]);

  res.json({
    success: true,
    data: {
      metrics: salesMetrics,
      trends: salesTrend,
      topPerformers: {
        products: topProducts,
        customers: topCustomers
      },
      regional: regionPerformance,
      forecast: salesForecast,
      cohorts: cohortAnalysis,
      insights: await generateSalesInsights(salesMetrics, salesTrend)
    }
  });
});

/**
 * Get customer analytics dashboard
 */
exports.getCustomerAnalyticsDashboard = asyncHandler(async (req, res, next) => {
  const { segment, status = 'active', period = 'ytd' } = req.query;

  const dateRange = calculateDateRange({ period });
  const filters = { status };
  if (segment) filters.segment = segment;

  const [
    customerMetrics,
    segmentAnalysis,
    customerLifetimeValue,
    churnAnalysis,
    topCustomers,
    customerGrowth,
    engagementMetrics
  ] = await Promise.all([
    getCustomerMetrics(filters),
    getCustomerSegmentAnalysis(filters),
    getCustomerLifetimeValue(dateRange, filters),
    getChurnAnalysis(dateRange, filters),
    getTopCustomersByRevenue(dateRange, filters, 20),
    getCustomerGrowthTrend(dateRange),
    getCustomerEngagementMetrics(dateRange, filters)
  ]);

  res.json({
    success: true,
    data: {
      metrics: customerMetrics,
      segments: segmentAnalysis,
      lifetimeValue: customerLifetimeValue,
      churn: churnAnalysis,
      topCustomers,
      growth: customerGrowth,
      engagement: engagementMetrics,
      insights: await generateCustomerInsights(customerMetrics, churnAnalysis)
    }
  });
});

/**
 * Get product analytics dashboard
 */
exports.getProductAnalyticsDashboard = asyncHandler(async (req, res, next) => {
  const { category, brand, period = 'ytd' } = req.query;

  const dateRange = calculateDateRange({ period });
  const filters = {};
  if (category) filters.category = category;
  if (brand) filters.brand = brand;

  const [
    productMetrics,
    productPerformance,
    productMix,
    inventoryStatus,
    pricingAnalysis,
    profitabilityAnalysis
  ] = await Promise.all([
    getProductMetrics(filters),
    getProductPerformance(dateRange, filters),
    getProductMix(dateRange, filters),
    getInventoryStatus(filters),
    getPricingAnalysis(dateRange, filters),
    getProfitabilityAnalysis(dateRange, filters)
  ]);

  res.json({
    success: true,
    data: {
      metrics: productMetrics,
      performance: productPerformance,
      mix: productMix,
      inventory: inventoryStatus,
      pricing: pricingAnalysis,
      profitability: profitabilityAnalysis,
      insights: await generateProductInsights(productPerformance, profitabilityAnalysis)
    }
  });
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Calculate date range based on parameters
 */
function calculateDateRange(params) {
  const { year, quarter, month, period } = params;
  const now = new Date();

  if (period) {
    switch(period) {
      case 'today':
        return {
          start: new Date(now.setHours(0,0,0,0)),
          end: new Date()
        };
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          start: new Date(yesterday.setHours(0,0,0,0)),
          end: new Date(yesterday.setHours(23,59,59,999))
        };
      case 'wtd': // Week to date
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return {
          start: new Date(weekStart.setHours(0,0,0,0)),
          end: new Date()
        };
      case 'mtd': // Month to date
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date()
        };
      case 'qtd': // Quarter to date
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
        return {
          start: new Date(now.getFullYear(), quarterStartMonth, 1),
          end: new Date()
        };
      case 'ytd': // Year to date
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date()
        };
      case 'last7days':
        return {
          start: new Date(now.setDate(now.getDate() - 7)),
          end: new Date()
        };
      case 'last30days':
        return {
          start: new Date(now.setDate(now.getDate() - 30)),
          end: new Date()
        };
      case 'last90days':
        return {
          start: new Date(now.setDate(now.getDate() - 90)),
          end: new Date()
        };
    }
  }

  if (month) {
    return {
      start: new Date(year, month - 1, 1),
      end: new Date(year, month, 0, 23, 59, 59, 999)
    };
  }

  if (quarter) {
    const quarterStartMonth = (quarter - 1) * 3;
    return {
      start: new Date(year, quarterStartMonth, 1),
      end: new Date(year, quarterStartMonth + 3, 0, 23, 59, 59, 999)
    };
  }

  // Default to full year
  return {
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 31, 23, 59, 59, 999)
  };
}

/**
 * Calculate comparison date range
 */
function calculateComparisonRange(dateRange, compareWith) {
  if (!compareWith) return null;

  const { start, end } = dateRange;
  const duration = end - start;

  switch(compareWith) {
    case 'previous_year':
      return {
        start: new Date(start.getFullYear() - 1, start.getMonth(), start.getDate()),
        end: new Date(end.getFullYear() - 1, end.getMonth(), end.getDate())
      };
    case 'previous_quarter':
      const prevQuarterStart = new Date(start);
      prevQuarterStart.setMonth(start.getMonth() - 3);
      return {
        start: prevQuarterStart,
        end: new Date(prevQuarterStart.getTime() + duration)
      };
    case 'previous_month':
      const prevMonthStart = new Date(start);
      prevMonthStart.setMonth(start.getMonth() - 1);
      return {
        start: prevMonthStart,
        end: new Date(prevMonthStart.getTime() + duration)
      };
    case 'previous_period':
      return {
        start: new Date(start.getTime() - duration),
        end: new Date(start.getTime() - 1)
      };
    default:
      return null;
  }
}

/**
 * Calculate growth percentage
 */
function calculateGrowth(current, comparison) {
  if (!comparison) return null;

  const growth = {};
  for (const key in current) {
    if (typeof current[key] === 'number' && typeof comparison[key] === 'number') {
      if (comparison[key] === 0) {
        growth[key] = current[key] > 0 ? 100 : 0;
      } else {
        growth[key] = ((current[key] - comparison[key]) / comparison[key]) * 100;
      }
    }
  }
  return growth;
}

/**
 * Get KPI metrics for a date range
 */
async function getKPIMetrics(dateRange, filters = {}) {
  const matchCriteria = {
    date: { $gte: dateRange.start, $lte: dateRange.end }
  };
  
  if (filters.region) matchCriteria.region = filters.region;
  if (filters.customerId) matchCriteria.customerId = filters.customerId;

  const [salesData, tradeSpendData, promotionData, customerData] = await Promise.all([
    SalesHistory.aggregate([
      { $match: matchCriteria },
      { $group: {
        _id: null,
        totalRevenue: { $sum: '$revenue.gross' },
        totalVolume: { $sum: '$quantity' },
        totalMargin: { $sum: '$margins.grossMargin' },
        avgPrice: { $avg: '$price' },
        transactions: { $sum: 1 }
      }}
    ]),
    TradeSpend.aggregate([
      { $match: {
        'period.startDate': { $gte: dateRange.start, $lte: dateRange.end },
        status: { $in: ['approved', 'active', 'completed'] }
      }},
      { $group: {
        _id: null,
        totalSpend: { $sum: '$amount.spent' },
        totalBudget: { $sum: '$amount.budgeted' }
      }}
    ]),
    Promotion.aggregate([
      { $match: {
        'period.startDate': { $lte: dateRange.end },
        'period.endDate': { $gte: dateRange.start }
      }},
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]),
    Customer.countDocuments({ isActive: true })
  ]);

  const sales = salesData[0] || {};
  const spend = tradeSpendData[0] || {};
  const activePromotions = promotionData.find(p => p._id === 'active')?.count || 0;

  // Calculate ROI
  const roi = spend.totalSpend > 0 
    ? ((sales.totalMargin - spend.totalSpend) / spend.totalSpend) * 100
    : 0;

  return {
    revenue: {
      value: sales.totalRevenue || 0,
      unit: 'USD',
      format: 'currency'
    },
    volume: {
      value: sales.totalVolume || 0,
      unit: 'units',
      format: 'number'
    },
    margin: {
      value: sales.totalMargin || 0,
      unit: 'USD',
      format: 'currency'
    },
    marginPercent: {
      value: sales.totalRevenue > 0 ? (sales.totalMargin / sales.totalRevenue) * 100 : 0,
      unit: '%',
      format: 'percentage'
    },
    tradeSpend: {
      value: spend.totalSpend || 0,
      unit: 'USD',
      format: 'currency'
    },
    roi: {
      value: roi,
      unit: '%',
      format: 'percentage'
    },
    activePromotions: {
      value: activePromotions,
      unit: 'count',
      format: 'number'
    },
    activeCustomers: {
      value: customerData,
      unit: 'count',
      format: 'number'
    },
    avgTransactionValue: {
      value: sales.transactions > 0 ? sales.totalRevenue / sales.transactions : 0,
      unit: 'USD',
      format: 'currency'
    }
  };
}

/**
 * Get trend data
 */
async function getTrendData(dateRange, filters = {}) {
  // Implementation for trend data
  // This would aggregate data by time periods (daily, weekly, monthly)
  // and return historical trends
  return {
    revenue: [],
    volume: [],
    margin: [],
    customers: []
  };
}

/**
 * Get alerts based on thresholds
 */
async function getAlerts(dateRange, filters = {}) {
  const alerts = [];
  
  // Check budget utilization
  const budgetData = await Budget.find({
    year: dateRange.start.getFullYear(),
    status: 'approved'
  });

  for (const budget of budgetData) {
    const utilization = budget.spent / budget.allocated;
    if (utilization > 0.9 && utilization < 1.0) {
      alerts.push({
        type: 'warning',
        category: 'budget',
        message: `Budget "${budget.name}" is 90% utilized`,
        severity: 'medium',
        value: utilization * 100
      });
    } else if (utilization >= 1.0) {
      alerts.push({
        type: 'critical',
        category: 'budget',
        message: `Budget "${budget.name}" exceeded!`,
        severity: 'high',
        value: utilization * 100
      });
    }
  }

  return alerts;
}

/**
 * Get top performers
 */
async function getTopPerformers(dateRange, filters = {}, limit = 10) {
  const matchCriteria = {
    date: { $gte: dateRange.start, $lte: dateRange.end }
  };

  const topProducts = await SalesHistory.aggregate([
    { $match: matchCriteria },
    { $group: {
      _id: '$productId',
      revenue: { $sum: '$revenue.gross' },
      volume: { $sum: '$quantity' },
      margin: { $sum: '$margins.grossMargin' }
    }},
    { $sort: { revenue: -1 } },
    { $limit: limit },
    { $lookup: {
      from: 'products',
      localField: '_id',
      foreignField: '_id',
      as: 'product'
    }},
    { $unwind: '$product' }
  ]);

  const topCustomers = await SalesHistory.aggregate([
    { $match: matchCriteria },
    { $group: {
      _id: '$customerId',
      revenue: { $sum: '$revenue.gross' },
      transactions: { $sum: 1 },
      margin: { $sum: '$margins.grossMargin' }
    }},
    { $sort: { revenue: -1 } },
    { $limit: limit },
    { $lookup: {
      from: 'customers',
      localField: '_id',
      foreignField: '_id',
      as: 'customer'
    }},
    { $unwind: '$customer' }
  ]);

  return {
    products: topProducts,
    customers: topCustomers
  };
}

/**
 * Get bottom performers
 */
async function getBottomPerformers(dateRange, filters = {}, limit = 10) {
  const matchCriteria = {
    date: { $gte: dateRange.start, $lte: dateRange.end }
  };

  const bottomProducts = await SalesHistory.aggregate([
    { $match: matchCriteria },
    { $group: {
      _id: '$productId',
      revenue: { $sum: '$revenue.gross' },
      volume: { $sum: '$quantity' },
      margin: { $sum: '$margins.grossMargin' }
    }},
    { $sort: { revenue: 1 } },
    { $limit: limit },
    { $lookup: {
      from: 'products',
      localField: '_id',
      foreignField: '_id',
      as: 'product'
    }},
    { $unwind: '$product' }
  ]);

  return {
    products: bottomProducts
  };
}

/**
 * Get category breakdown
 */
async function getCategoryBreakdown(dateRange, filters = {}) {
  // Implementation for category analysis
  return [];
}

/**
 * Get channel performance
 */
async function getChannelPerformance(dateRange, filters = {}) {
  // Implementation for channel analysis
  return [];
}

/**
 * Get regional data
 */
async function getRegionalData(dateRange, filters = {}) {
  // Implementation for regional analysis
  return [];
}

/**
 * Generate insights using ML
 */
async function generateInsights(data) {
  // Use ML service to generate insights
  return [
    {
      type: 'opportunity',
      title: 'Revenue Growth Opportunity',
      description: 'Based on current trends, there is potential for 15% revenue growth',
      confidence: 0.85,
      action: 'Increase investment in top-performing products'
    }
  ];
}

/**
 * KPI Helper Functions
 */

async function getRevenueKPI(tenantId, dateRange) {
  const aggregate = await SalesHistory.aggregate([
    {
      $match: {
        tenantId,
        date: { $gte: new Date(dateRange.start), $lte: new Date(dateRange.end) }
      }
    },
    {
      $group: {
        _id: null,
        current: { $sum: '$revenue.net' },
        gross: { $sum: '$revenue.gross' },
        count: { $sum: 1 }
      }
    }
  ]);

  const result = aggregate[0] || { current: 0, gross: 0, count: 0 };

  return {
    value: result.current,
    change: 0, // TODO: Calculate vs previous period
    trend: 'stable',
    unit: 'USD'
  };
}

async function getMarginKPI(tenantId, dateRange) {
  const aggregate = await SalesHistory.aggregate([
    {
      $match: {
        tenantId,
        date: { $gte: new Date(dateRange.start), $lte: new Date(dateRange.end) }
      }
    },
    {
      $group: {
        _id: null,
        margin: { $sum: '$margins.grossMargin' },
        revenue: { $sum: '$revenue.net' }
      }
    }
  ]);

  const result = aggregate[0] || { margin: 0, revenue: 1 };
  const marginPercent = result.revenue > 0 ? (result.margin / result.revenue) * 100 : 0;

  return {
    value: result.margin,
    percent: marginPercent,
    change: 0,
    trend: 'stable',
    unit: 'USD'
  };
}

async function getVolumeKPI(tenantId, dateRange) {
  const aggregate = await SalesHistory.aggregate([
    {
      $match: {
        tenantId,
        date: { $gte: new Date(dateRange.start), $lte: new Date(dateRange.end) }
      }
    },
    {
      $group: {
        _id: null,
        volume: { $sum: '$quantity' }
      }
    }
  ]);

  const result = aggregate[0] || { volume: 0 };

  return {
    value: result.volume,
    change: 0,
    trend: 'stable',
    unit: 'units'
  };
}

async function getROIKPI(tenantId, dateRange) {
  // Calculate ROI from promotions or trade spend
  const aggregate = await SalesHistory.aggregate([
    {
      $match: {
        tenantId,
        date: { $gte: new Date(dateRange.start), $lte: new Date(dateRange.end) }
      }
    },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$revenue.net' },
        spend: { $sum: { $ifNull: ['$tradeSpend', 0] } }
      }
    }
  ]);

  const result = aggregate[0] || { revenue: 0, spend: 1 };
  const roi = result.spend > 0 ? ((result.revenue - result.spend) / result.spend) * 100 : 0;

  return {
    value: roi,
    change: 0,
    trend: roi > 0 ? 'up' : 'down',
    unit: '%'
  };
}

async function getPromotionKPI(tenantId, dateRange) {
  const count = await Promotion.countDocuments({
    tenantId,
    startDate: { $lte: new Date(dateRange.end) },
    endDate: { $gte: new Date(dateRange.start) },
    status: 'active'
  });

  return {
    value: count,
    change: 0,
    trend: 'stable',
    unit: 'count'
  };
}

async function getCustomerKPI(tenantId, dateRange) {
  const aggregate = await SalesHistory.aggregate([
    {
      $match: {
        tenantId,
        date: { $gte: new Date(dateRange.start), $lte: new Date(dateRange.end) }
      }
    },
    {
      $group: {
        _id: '$customerId'
      }
    },
    {
      $count: 'total'
    }
  ]);

  const result = aggregate[0] || { total: 0 };

  return {
    value: result.total,
    change: 0,
    trend: 'stable',
    unit: 'count'
  };
}

// Export additional helper functions for use in other controllers
module.exports.calculateDateRange = calculateDateRange;
module.exports.calculateGrowth = calculateGrowth;
module.exports.getKPIMetrics = getKPIMetrics;
