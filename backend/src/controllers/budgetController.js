const Budget = require('../models/Budget');
const SalesHistory = require('../models/SalesHistory');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { cacheService } = require('../services/cacheService');
const mlService = require('../services/mlService');
const logger = require('../utils/logger');

// Create new budget
exports.createBudget = asyncHandler(async (req, res, next) => {
  const budgetData = {
    ...req.body,
    createdBy: req.user._id,
    status: 'draft'
  };
  
  // Handle total_amount from frontend form
  if (req.body.total_amount) {
    budgetData.allocated = 0; // Start with 0 allocated
    budgetData.remaining = req.body.total_amount; // All amount is remaining initially
    budgetData.spent = 0; // No spending yet
    delete budgetData.total_amount; // Remove the frontend field
  }
  
  // Generate ML forecast if requested
  if (req.body.generateForecast) {
    const forecast = await mlService.generateBudgetForecast({
      year: budgetData.year,
      scope: budgetData.scope,
      historicalMonths: 24
    });
    
    budgetData.mlForecast = forecast;
    budgetData.budgetLines = forecast.monthlyForecasts.map((f, index) => ({
      month: index + 1,
      sales: {
        units: f.salesUnits,
        value: f.salesValue
      },
      tradeSpend: {
        marketing: { budget: f.suggestedMarketing },
        cashCoop: { budget: f.suggestedCashCoop },
        tradingTerms: { budget: f.suggestedTradingTerms },
        promotions: { budget: f.suggestedPromotions }
      }
    }));
  }
  
  const budget = await Budget.create(budgetData);
  
  logger.logAudit('budget_created', req.user._id, {
    budgetId: budget._id,
    year: budget.year,
    type: budget.budgetType
  });
  
  res.status(201).json({
    success: true,
    data: budget
  });
});

// Get all budgets with filtering
exports.getBudgets = asyncHandler(async (req, res, next) => {
  const {
    year,
    budgetType,
    status,
    scope,
    page = 1,
    limit = 20,
    sort = '-createdAt'
  } = req.query;
  
  const query = {};
  
  if (year) query.year = year;
  if (budgetType) query.budgetType = budgetType;
  if (status) query.status = status;
  if (scope) query['scope.level'] = scope;
  
  // Apply user-based filtering
  if (req.user.role === 'kam' || req.user.role === 'sales_rep') {
    query.$or = [
      { createdBy: req.user._id },
      { 'scope.customers': { $in: req.user.assignedCustomers } }
    ];
  }
  
  const budgets = await Budget.find(query)
    .populate('createdBy', 'firstName lastName')
    .populate('scope.customers', 'name code')
    .populate('scope.vendors', 'name code')
    .populate('scope.products', 'name sku')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const count = await Budget.countDocuments(query);
  
  res.json({
    success: true,
    data: budgets,
    pagination: {
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit)
    }
  });
});

// Get single budget
exports.getBudget = asyncHandler(async (req, res, next) => {
  const budget = await Budget.findById(req.params.id)
    .populate('createdBy', 'firstName lastName')
    .populate('scope.customers', 'name code')
    .populate('scope.vendors', 'name code')
    .populate('scope.products', 'name sku')
    .populate('approvals.approver', 'firstName lastName');
  
  if (!budget) {
    throw new AppError('Budget not found', 404);
  }
  
  res.json({
    success: true,
    data: budget
  });
});

// Update budget
exports.updateBudget = asyncHandler(async (req, res, next) => {
  const budget = await Budget.findById(req.params.id);
  
  if (!budget) {
    throw new AppError('Budget not found', 404);
  }
  
  if (budget.status === 'locked' || budget.status === 'approved') {
    throw new AppError('Cannot update locked or approved budget', 400);
  }
  
  // Update allowed fields
  const updates = req.body;
  delete updates.status; // Status changes through workflow
  delete updates.createdBy;
  
  Object.assign(budget, updates);
  budget.lastModifiedBy = req.user._id;
  
  await budget.save();
  
  // Invalidate cache
  await cacheService.invalidateRelated('budget', budget._id);
  
  res.json({
    success: true,
    data: budget
  });
});

// Submit budget for approval
exports.submitForApproval = asyncHandler(async (req, res, next) => {
  const budget = await Budget.findById(req.params.id);
  
  if (!budget) {
    throw new AppError('Budget not found', 404);
  }
  
  if (budget.status !== 'draft') {
    throw new AppError('Only draft budgets can be submitted', 400);
  }
  
  await budget.submitForApproval(req.user._id);
  
  // Send approval notifications
  const io = req.app.get('io');
  io.to('role:manager').emit('approval_required', {
    type: 'budget',
    id: budget._id,
    name: budget.name
  });
  
  res.json({
    success: true,
    message: 'Budget submitted for approval',
    data: budget
  });
});

// Approve budget
exports.approveBudget = asyncHandler(async (req, res, next) => {
  const { comments } = req.body;
  const budget = await Budget.findById(req.params.id);
  
  if (!budget) {
    throw new AppError('Budget not found', 404);
  }
  
  // Determine approval level based on user role
  const approvalLevel = {
    manager: 'manager',
    director: 'director',
    board: 'board',
    admin: 'finance'
  }[req.user.role];
  
  if (!approvalLevel) {
    throw new AppError('You do not have approval rights', 403);
  }
  
  await budget.approve(approvalLevel, req.user._id, comments);
  
  // Notify creator
  const io = req.app.get('io');
  io.to(`user:${budget.createdBy}`).emit('budget_approved', {
    budgetId: budget._id,
    approver: req.user.firstName + ' ' + req.user.lastName
  });
  
  res.json({
    success: true,
    message: 'Budget approved',
    data: budget
  });
});

// Generate forecast
exports.generateForecast = asyncHandler(async (req, res, next) => {
  const { year, scope, historicalMonths = 24 } = req.body;
  
  const forecast = await mlService.generateBudgetForecast({
    year,
    scope,
    historicalMonths
  });
  
  res.json({
    success: true,
    data: forecast
  });
});

// Compare budgets
exports.compareBudgets = asyncHandler(async (req, res, next) => {
  const { budgetIds } = req.body;
  
  if (!budgetIds || budgetIds.length < 2) {
    throw new AppError('At least 2 budget IDs required for comparison', 400);
  }
  
  const budgets = await Budget.find({ _id: { $in: budgetIds } });
  
  if (budgets.length !== budgetIds.length) {
    throw new AppError('One or more budgets not found', 404);
  }
  
  // Generate comparison data
  const comparison = {
    budgets: budgets.map(b => ({
      id: b._id,
      name: b.name,
      year: b.year,
      type: b.budgetType,
      version: b.version
    })),
    metrics: {
      totalSales: budgets.map(b => b.annualTotals.sales.value),
      totalTradeSpend: budgets.map(b => b.annualTotals.tradeSpend.total),
      roi: budgets.map(b => b.annualTotals.profitability.roi),
      monthlyData: []
    }
  };
  
  // Compare monthly data
  for (let month = 1; month <= 12; month++) {
    const monthData = {
      month,
      sales: budgets.map(b => {
        const line = b.budgetLines.find(l => l.month === month);
        return line ? line.sales.value : 0;
      }),
      tradeSpend: budgets.map(b => {
        const line = b.budgetLines.find(l => l.month === month);
        return line ? 
          (line.tradeSpend.marketing.budget + 
           line.tradeSpend.cashCoop.budget + 
           line.tradeSpend.tradingTerms.budget + 
           line.tradeSpend.promotions.budget) : 0;
      })
    };
    comparison.metrics.monthlyData.push(monthData);
  }
  
  res.json({
    success: true,
    data: comparison
  });
});

// Get budget performance
exports.getBudgetPerformance = asyncHandler(async (req, res, next) => {
  const budget = await Budget.findById(req.params.id);
  
  if (!budget) {
    throw new AppError('Budget not found', 404);
  }
  
  // Get actual sales data
  const startDate = new Date(budget.year, 0, 1);
  const endDate = new Date();
  
  const actualData = await SalesHistory.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        // Add scope filters based on budget scope
      }
    },
    {
      $group: {
        _id: { month: '$month' },
        salesUnits: { $sum: '$quantity' },
        salesValue: { $sum: '$revenue.gross' },
        tradeSpend: { $sum: '$tradeSpend.total' }
      }
    },
    { $sort: { '_id.month': 1 } }
  ]);
  
  // Calculate performance metrics
  const performance = {
    budget: {
      id: budget._id,
      name: budget.name,
      year: budget.year
    },
    monthlyPerformance: [],
    ytdPerformance: {
      sales: {
        budget: 0,
        actual: 0,
        variance: 0,
        variancePercentage: 0
      },
      tradeSpend: {
        budget: 0,
        actual: 0,
        variance: 0,
        variancePercentage: 0
      }
    }
  };
  
  // Calculate monthly and YTD performance
  budget.budgetLines.forEach(budgetLine => {
    const actual = actualData.find(a => a._id.month === budgetLine.month);
    
    const monthPerf = {
      month: budgetLine.month,
      sales: {
        budget: budgetLine.sales.value,
        actual: actual ? actual.salesValue : 0,
        variance: actual ? actual.salesValue - budgetLine.sales.value : -budgetLine.sales.value
      },
      tradeSpend: {
        budget: budgetLine.tradeSpend.marketing.budget + 
                budgetLine.tradeSpend.cashCoop.budget + 
                budgetLine.tradeSpend.tradingTerms.budget + 
                budgetLine.tradeSpend.promotions.budget,
        actual: actual ? actual.tradeSpend : 0
      }
    };
    
    monthPerf.sales.variancePercentage = 
      budgetLine.sales.value > 0 ? 
      (monthPerf.sales.variance / budgetLine.sales.value) * 100 : 0;
    
    performance.monthlyPerformance.push(monthPerf);
    
    // Update YTD
    performance.ytdPerformance.sales.budget += monthPerf.sales.budget;
    performance.ytdPerformance.sales.actual += monthPerf.sales.actual;
    performance.ytdPerformance.tradeSpend.budget += monthPerf.tradeSpend.budget;
    performance.ytdPerformance.tradeSpend.actual += monthPerf.tradeSpend.actual;
  });
  
  // Calculate YTD variances
  performance.ytdPerformance.sales.variance = 
    performance.ytdPerformance.sales.actual - performance.ytdPerformance.sales.budget;
  performance.ytdPerformance.sales.variancePercentage = 
    performance.ytdPerformance.sales.budget > 0 ?
    (performance.ytdPerformance.sales.variance / performance.ytdPerformance.sales.budget) * 100 : 0;
  
  performance.ytdPerformance.tradeSpend.variance = 
    performance.ytdPerformance.tradeSpend.actual - performance.ytdPerformance.tradeSpend.budget;
  performance.ytdPerformance.tradeSpend.variancePercentage = 
    performance.ytdPerformance.tradeSpend.budget > 0 ?
    (performance.ytdPerformance.tradeSpend.variance / performance.ytdPerformance.tradeSpend.budget) * 100 : 0;
  
  res.json({
    success: true,
    data: performance
  });
});

// Create new version
exports.createNewVersion = asyncHandler(async (req, res, next) => {
  const budget = await Budget.findById(req.params.id);
  
  if (!budget) {
    throw new AppError('Budget not found', 404);
  }
  
  const newBudget = await budget.createNewVersion();
  
  res.status(201).json({
    success: true,
    message: 'New budget version created',
    data: newBudget
  });
});

// Lock budget
exports.lockBudget = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  const budget = await Budget.findById(req.params.id);
  
  if (!budget) {
    throw new AppError('Budget not found', 404);
  }
  
  await budget.lock(req.user._id, reason);
  
  res.json({
    success: true,
    message: 'Budget locked',
    data: budget
  });
});

exports.deleteBudget = asyncHandler(async (req, res, next) => {
  const budget = await Budget.findById(req.params.id);
  
  if (!budget) {
    return next(new AppError('Budget not found', 404));
  }
  
  // Only allow deletion of draft budgets
  if (budget.status !== 'draft') {
    return next(new AppError('Only draft budgets can be deleted', 400));
  }
  
  await budget.deleteOne();
  
  res.json({
    success: true,
    message: 'Budget deleted successfully'
  });
});
