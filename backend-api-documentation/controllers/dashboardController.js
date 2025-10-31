const Budget = require('../models/Budget');
const Promotion = require('../models/Promotion');
const TradeSpend = require('../models/TradeSpend');
const SalesHistory = require('../models/SalesHistory');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { cacheService } = require('../services/cacheService');
const mlService = require('../services/mlService');

// Executive Dashboard
exports.getExecutiveDashboard = asyncHandler(async (req, res, next) => {
  const { year = new Date().getFullYear() } = req.query;
  
  // Try to get from cache
  const cacheKey = cacheService.generateKey('dashboard', 'executive', 'year', year);
  const cached = await cacheService.get(cacheKey);
  
  if (cached) {
    return res.json({
      success: true,
      data: cached,
      cached: true
    });
  }
  
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  const currentDate = new Date();
  const ytdEndDate = currentDate > endDate ? endDate : currentDate;
  
  // Get YTD Sales
  const salesData = await SalesHistory.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: ytdEndDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$revenue.gross' },
        totalVolume: { $sum: '$quantity' },
        totalMargin: { $sum: '$margins.grossMargin' }
      }
    }
  ]);
  
  // Get last year same period for comparison
  const lastYearStart = new Date(year - 1, 0, 1);
  const lastYearEnd = new Date(year - 1, ytdEndDate.getMonth(), ytdEndDate.getDate());
  
  const lastYearSales = await SalesHistory.aggregate([
    {
      $match: {
        date: { $gte: lastYearStart, $lte: lastYearEnd }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$revenue.gross' },
        totalVolume: { $sum: '$quantity' }
      }
    }
  ]);
  
  // Get Trade Spend
  const tradeSpendData = await TradeSpend.aggregate([
    {
      $match: {
        'period.startDate': { $gte: startDate, $lte: ytdEndDate },
        status: { $in: ['approved', 'active', 'completed'] }
      }
    },
    {
      $group: {
        _id: '$spendType',
        total: { $sum: '$amount.spent' }
      }
    }
  ]);
  
  // Get Active Promotions
  const activePromotions = await Promotion.countDocuments({
    'period.startDate': { $lte: currentDate },
    'period.endDate': { $gte: currentDate },
    status: 'active'
  });
  
  // Get Budget Performance
  const budgets = await Budget.find({
    year,
    status: 'approved',
    budgetType: 'budget'
  });
  
  let budgetPerformance = {
    salesBudget: 0,
    salesActual: salesData[0]?.totalRevenue || 0,
    tradeSpendBudget: 0,
    tradeSpendActual: tradeSpendData.reduce((sum, item) => sum + item.total, 0)
  };
  
  budgets.forEach(budget => {
    budgetPerformance.salesBudget += budget.annualTotals.sales.value;
    budgetPerformance.tradeSpendBudget += budget.annualTotals.tradeSpend.total;
  });
  
  // Calculate KPIs
  const kpis = {
    revenue: {
      ytd: salesData[0]?.totalRevenue || 0,
      lastYear: lastYearSales[0]?.totalRevenue || 0,
      growth: lastYearSales[0]?.totalRevenue ? 
        ((salesData[0]?.totalRevenue - lastYearSales[0].totalRevenue) / lastYearSales[0].totalRevenue) * 100 : 0,
      vsTarget: budgetPerformance.salesBudget > 0 ?
        ((salesData[0]?.totalRevenue / budgetPerformance.salesBudget) * 100) : 0
    },
    volume: {
      ytd: salesData[0]?.totalVolume || 0,
      lastYear: lastYearSales[0]?.totalVolume || 0,
      growth: lastYearSales[0]?.totalVolume ?
        ((salesData[0]?.totalVolume - lastYearSales[0].totalVolume) / lastYearSales[0].totalVolume) * 100 : 0
    },
    margin: {
      amount: salesData[0]?.totalMargin || 0,
      percentage: salesData[0]?.totalRevenue > 0 ?
        (salesData[0].totalMargin / salesData[0].totalRevenue) * 100 : 0
    },
    tradeSpend: {
      total: budgetPerformance.tradeSpendActual,
      budget: budgetPerformance.tradeSpendBudget,
      utilization: budgetPerformance.tradeSpendBudget > 0 ?
        (budgetPerformance.tradeSpendActual / budgetPerformance.tradeSpendBudget) * 100 : 0,
      roi: salesData[0]?.totalRevenue > 0 ?
        ((salesData[0].totalRevenue - budgetPerformance.tradeSpendActual) / budgetPerformance.tradeSpendActual) : 0
    }
  };
  
  // Get monthly trend
  const monthlyTrend = await SalesHistory.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: ytdEndDate }
      }
    },
    {
      $group: {
        _id: { month: '$month' },
        revenue: { $sum: '$revenue.gross' },
        volume: { $sum: '$quantity' },
        tradeSpend: { $sum: '$tradeSpend.total' }
      }
    },
    { $sort: { '_id.month': 1 } }
  ]);
  
  // Get top performers
  const topCustomers = await SalesHistory.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: ytdEndDate }
      }
    },
    {
      $group: {
        _id: '$customer',
        revenue: { $sum: '$revenue.gross' }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customer'
      }
    },
    { $unwind: '$customer' }
  ]);
  
  const topProducts = await SalesHistory.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: ytdEndDate }
      }
    },
    {
      $group: {
        _id: '$product',
        revenue: { $sum: '$revenue.gross' },
        volume: { $sum: '$quantity' }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' }
  ]);
  
  const dashboard = {
    period: {
      year,
      ytdEndDate
    },
    kpis,
    monthlyTrend,
    topPerformers: {
      customers: topCustomers.map(c => ({
        id: c._id,
        name: c.customer.name,
        revenue: c.revenue
      })),
      products: topProducts.map(p => ({
        id: p._id,
        name: p.product.name,
        sku: p.product.sku,
        revenue: p.revenue,
        volume: p.volume
      }))
    },
    activePromotions,
    tradeSpendBreakdown: tradeSpendData,
    alerts: await this.generateAlerts('executive', year)
  };
  
  // Cache the result
  await cacheService.set(cacheKey, dashboard, 300); // 5 minutes
  
  res.json({
    success: true,
    data: dashboard
  });
});

// KAM Dashboard
exports.getKAMDashboard = asyncHandler(async (req, res, next) => {
  const { customerId, year = new Date().getFullYear() } = req.query;
  
  // Validate customer access
  if (customerId && !req.user.assignedCustomers.includes(customerId)) {
    throw new AppError('Not authorized to view this customer', 403);
  }
  
  const customerFilter = customerId ? 
    { customer: customerId } : 
    { customer: { $in: req.user.assignedCustomers } };
  
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  const currentDate = new Date();
  
  // Get customer performance
  const customerPerformance = await SalesHistory.aggregate([
    {
      $match: {
        ...customerFilter,
        date: { $gte: startDate, $lte: currentDate }
      }
    },
    {
      $group: {
        _id: '$customer',
        revenue: { $sum: '$revenue.gross' },
        volume: { $sum: '$quantity' },
        visits: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customer'
      }
    },
    { $unwind: '$customer' }
  ]);
  
  // Get active promotions
  const activePromotions = await Promotion.find({
    'scope.customers.customer': customerId || { $in: req.user.assignedCustomers },
    'period.endDate': { $gte: currentDate },
    status: { $in: ['approved', 'active'] }
  })
  .populate('products.product', 'name sku')
  .sort('period.startDate')
  .limit(10);
  
  // Get pending approvals
  const pendingApprovals = await TradeSpend.countDocuments({
    ...customerFilter,
    status: 'submitted',
    'approvals.level': req.user.role,
    'approvals.status': 'pending'
  });
  
  // Get wallet balances
  const walletBalances = {};
  if (req.user.wallet) {
    for (const customerId of req.user.assignedCustomers) {
      const customer = await Customer.findById(customerId).select('name code');
      if (customer) {
        walletBalances[customerId] = {
          customer: {
            id: customer._id,
            name: customer.name,
            code: customer.code
          },
          balance: req.user.wallet[customerId] || 0
        };
      }
    }
  }
  
  // Get trade spend summary
  const tradeSpendSummary = await TradeSpend.aggregate([
    {
      $match: {
        ...customerFilter,
        'period.startDate': { $gte: startDate, $lte: currentDate },
        status: { $in: ['approved', 'active', 'completed'] }
      }
    },
    {
      $group: {
        _id: '$spendType',
        allocated: { $sum: '$amount.approved' },
        spent: { $sum: '$amount.spent' }
      }
    }
  ]);
  
  // Get product performance
  const productPerformance = await SalesHistory.aggregate([
    {
      $match: {
        ...customerFilter,
        date: { $gte: startDate, $lte: currentDate }
      }
    },
    {
      $group: {
        _id: '$product',
        revenue: { $sum: '$revenue.gross' },
        volume: { $sum: '$quantity' }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' }
  ]);
  
  const dashboard = {
    period: {
      year,
      currentDate
    },
    customerPerformance: customerPerformance.map(cp => ({
      customer: {
        id: cp.customer._id,
        name: cp.customer.name,
        code: cp.customer.code,
        channel: cp.customer.channel
      },
      metrics: {
        revenue: cp.revenue,
        volume: cp.volume,
        visits: cp.visits,
        avgOrderValue: cp.visits > 0 ? cp.revenue / cp.visits : 0
      }
    })),
    activePromotions: activePromotions.map(p => ({
      id: p._id,
      name: p.name,
      period: p.period,
      type: p.promotionType,
      products: p.products.map(prod => ({
        name: prod.product.name,
        sku: prod.product.sku,
        discount: prod.promotionalPrice
      }))
    })),
    pendingApprovals,
    walletBalances: Object.values(walletBalances),
    tradeSpendSummary,
    productPerformance: productPerformance.map(p => ({
      product: {
        id: p.product._id,
        name: p.product.name,
        sku: p.product.sku
      },
      revenue: p.revenue,
      volume: p.volume
    })),
    tasks: await this.getKAMTasks(req.user._id)
  };
  
  res.json({
    success: true,
    data: dashboard
  });
});

// Analytics Dashboard
exports.getAnalyticsDashboard = asyncHandler(async (req, res, next) => {
  const { 
    startDate = new Date(new Date().getFullYear(), 0, 1),
    endDate = new Date(),
    groupBy = 'month'
  } = req.query;
  
  // Sales Analytics
  const salesAnalytics = await SalesHistory.aggregate([
    {
      $match: {
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: this.getGroupByExpression(groupBy),
        revenue: { $sum: '$revenue.gross' },
        volume: { $sum: '$quantity' },
        transactions: { $sum: 1 },
        avgPrice: { $avg: '$pricing.invoicePrice' }
      }
    },
    { $sort: { '_id': 1 } }
  ]);
  
  // Channel Performance
  const channelPerformance = await SalesHistory.aggregate([
    {
      $match: {
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: '$channel',
        revenue: { $sum: '$revenue.gross' },
        volume: { $sum: '$quantity' },
        customers: { $addToSet: '$customer' }
      }
    },
    {
      $project: {
        channel: '$_id',
        revenue: 1,
        volume: 1,
        customerCount: { $size: '$customers' }
      }
    }
  ]);
  
  // Promotion Effectiveness
  const promotionAnalytics = await Promotion.aggregate([
    {
      $match: {
        'period.startDate': { $gte: new Date(startDate), $lte: new Date(endDate) },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$promotionType',
        count: { $sum: 1 },
        avgROI: { $avg: '$financial.profitability.roi' },
        avgLift: { $avg: '$performance.metrics.trueLift' },
        totalSpend: { $sum: '$financial.costs.totalCost' },
        totalRevenue: { $sum: '$financial.actual.incrementalRevenue' }
      }
    }
  ]);
  
  // Anomalies
  const recentSales = await SalesHistory.find({
    date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  }).select('date customer product quantity revenue anomaly');
  
  const anomalies = await mlService.detectAnomalies(
    recentSales.map(s => ({
      date: s.date,
      value: s.revenue.gross,
      customer: s.customer,
      product: s.product
    }))
  );
  
  // Forecast
  const forecast = await mlService.generateBudgetForecast({
    year: new Date().getFullYear(),
    scope: {},
    historicalMonths: 12
  });
  
  const dashboard = {
    period: {
      startDate,
      endDate
    },
    salesAnalytics,
    channelPerformance,
    promotionAnalytics,
    anomalies: anomalies.slice(0, 10),
    forecast: forecast.monthlyForecasts.slice(0, 3),
    insights: await this.generateInsights(salesAnalytics, channelPerformance, promotionAnalytics)
  };
  
  res.json({
    success: true,
    data: dashboard
  });
});

// Real-time Dashboard Updates
exports.subscribeToUpdates = asyncHandler(async (req, res, next) => {
  const { dashboardType } = req.params;
  const io = req.app.get('io');
  
  // Join dashboard room
  const socketId = req.headers['x-socket-id'];
  if (socketId) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.join(`dashboard:${dashboardType}`);
    }
  }
  
  res.json({
    success: true,
    message: `Subscribed to ${dashboardType} dashboard updates`
  });
});

// Helper functions
exports.generateAlerts = async (dashboardType, year) => {
  const alerts = [];
  
  // Budget utilization alerts
  const budgets = await Budget.find({
    year,
    status: 'approved'
  });
  
  for (const budget of budgets) {
    const utilization = (budget.annualTotals.tradeSpend.total / budget.annualTotals.tradeSpend.total) * 100;
    
    if (utilization > 90) {
      alerts.push({
        type: 'budget',
        severity: 'high',
        message: `Budget ${budget.name} is ${utilization.toFixed(1)}% utilized`,
        action: 'Review and adjust allocations'
      });
    }
  }
  
  // Promotion alerts
  const upcomingPromotions = await Promotion.countDocuments({
    'period.startDate': {
      $gte: new Date(),
      $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    status: 'approved'
  });
  
  if (upcomingPromotions > 0) {
    alerts.push({
      type: 'promotion',
      severity: 'medium',
      message: `${upcomingPromotions} promotions starting in next 7 days`,
      action: 'Ensure execution readiness'
    });
  }
  
  return alerts;
};

exports.getKAMTasks = async (userId) => {
  const tasks = [];
  
  // Pending approvals
  const pendingApprovals = await TradeSpend.countDocuments({
    createdBy: userId,
    status: 'submitted'
  });
  
  if (pendingApprovals > 0) {
    tasks.push({
      type: 'approval',
      title: `${pendingApprovals} trade spends pending approval`,
      priority: 'high'
    });
  }
  
  // Expiring promotions
  const expiringPromotions = await Promotion.countDocuments({
    createdBy: userId,
    'period.endDate': {
      $gte: new Date(),
      $lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    },
    status: 'active'
  });
  
  if (expiringPromotions > 0) {
    tasks.push({
      type: 'promotion',
      title: `${expiringPromotions} promotions ending soon`,
      priority: 'medium'
    });
  }
  
  return tasks;
};

exports.getGroupByExpression = (groupBy) => {
  switch (groupBy) {
    case 'day':
      return {
        year: { $year: '$date' },
        month: { $month: '$date' },
        day: { $dayOfMonth: '$date' }
      };
    case 'week':
      return {
        year: { $year: '$date' },
        week: { $week: '$date' }
      };
    case 'month':
      return {
        year: { $year: '$date' },
        month: { $month: '$date' }
      };
    case 'quarter':
      return {
        year: { $year: '$date' },
        quarter: { $ceil: { $divide: [{ $month: '$date' }, 3] } }
      };
    default:
      return { year: { $year: '$date' } };
  }
};

exports.generateInsights = async (salesData, channelData, promotionData) => {
  const insights = [];
  
  // Sales trend insight
  if (salesData.length > 1) {
    const lastPeriod = salesData[salesData.length - 1];
    const previousPeriod = salesData[salesData.length - 2];
    const growth = ((lastPeriod.revenue - previousPeriod.revenue) / previousPeriod.revenue) * 100;
    
    insights.push({
      type: 'trend',
      title: growth > 0 ? 'Sales Growing' : 'Sales Declining',
      description: `Sales ${growth > 0 ? 'increased' : 'decreased'} by ${Math.abs(growth).toFixed(1)}% compared to previous period`,
      impact: Math.abs(growth) > 10 ? 'high' : 'medium'
    });
  }
  
  // Channel performance insight
  const topChannel = channelData.sort((a, b) => b.revenue - a.revenue)[0];
  if (topChannel) {
    insights.push({
      type: 'performance',
      title: 'Top Performing Channel',
      description: `${topChannel.channel} generated ${(topChannel.revenue / 1000000).toFixed(1)}M in revenue`,
      impact: 'medium'
    });
  }
  
  // Promotion effectiveness
  const bestPromotion = promotionData.sort((a, b) => b.avgROI - a.avgROI)[0];
  if (bestPromotion) {
    insights.push({
      type: 'optimization',
      title: 'Most Effective Promotion Type',
      description: `${bestPromotion._id} promotions show ${bestPromotion.avgROI.toFixed(0)}% average ROI`,
      impact: 'high'
    });
  }
  
  return insights;
};