const TradeSpend = require('../models/TradeSpend');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Budget = require('../models/Budget');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');

// Create trade spend request
exports.createTradeSpend = asyncHandler(async (req, res, next) => {
  // Generate spend ID
  const spendCount = await TradeSpend.countDocuments();
  const spendId = `TS-${new Date().getFullYear()}-${String(spendCount + 1).padStart(6, '0')}`;
  
  const tradeSpendData = {
    ...req.body,
    spendId,
    createdBy: req.user._id,
    status: 'draft'
  };
  
  // Validate budget availability
  if (tradeSpendData.budget) {
    const budget = await Budget.findById(tradeSpendData.budget);
    if (!budget) {
      throw new AppError('Budget not found', 404);
    }
    
    // Check budget limits
    const budgetLine = budget.budgetLines.find(
      line => line.month === new Date(tradeSpendData.period.startDate).getMonth() + 1
    );
    
    if (budgetLine) {
      const spendType = tradeSpendData.spendType;
      const available = budgetLine.tradeSpend[spendType].budget - 
                       budgetLine.tradeSpend[spendType].allocated;
      
      if (tradeSpendData.amount.requested > available) {
        throw new AppError(`Insufficient budget. Available: ${available}`, 400);
      }
    }
  }
  
  // For cash co-op, check user wallet
  if (tradeSpendData.spendType === 'cash_coop' && req.user.wallet) {
    const walletBalance = req.user.wallet[tradeSpendData.customer] || 0;
    
    if (tradeSpendData.amount.requested > walletBalance) {
      throw new AppError(`Insufficient wallet balance. Available: ${walletBalance}`, 400);
    }
  }
  
  // Set approval requirements based on amount
  tradeSpendData.approvals = this.getRequiredApprovals(
    tradeSpendData.amount.requested,
    tradeSpendData.spendType
  );
  
  const tradeSpend = await TradeSpend.create(tradeSpendData);
  
  logger.logAudit('trade_spend_created', req.user._id, {
    spendId: tradeSpend._id,
    type: tradeSpend.spendType,
    amount: tradeSpend.amount.requested
  });
  
  res.status(201).json({
    success: true,
    data: tradeSpend
  });
});

// Get all trade spends
exports.getTradeSpends = asyncHandler(async (req, res, next) => {
  const {
    spendType,
    status,
    customer,
    vendor,
    startDate,
    endDate,
    page = 1,
    limit = 20,
    sort = '-createdAt'
  } = req.query;
  
  const query = {};
  
  if (spendType) query.spendType = spendType;
  if (status) query.status = status;
  if (customer) query.customer = customer;
  if (vendor) query.vendor = vendor;
  
  if (startDate || endDate) {
    query['period.startDate'] = {};
    if (startDate) query['period.startDate'].$gte = new Date(startDate);
    if (endDate) query['period.startDate'].$lte = new Date(endDate);
  }
  
  // Apply user-based filtering
  if (req.user.role === 'kam' || req.user.role === 'sales_rep') {
    query.$or = [
      { createdBy: req.user._id },
      { customer: { $in: req.user.assignedCustomers } }
    ];
  }
  
  const tradeSpends = await TradeSpend.find(query)
    .populate('customer', 'name code')
    .populate('vendor', 'name code')
    .populate('products', 'name sku')
    .populate('createdBy', 'firstName lastName')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const count = await TradeSpend.countDocuments(query);
  
  res.json({
    success: true,
    data: tradeSpends,
    pagination: {
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit)
    }
  });
});

// Get single trade spend
exports.getTradeSpend = asyncHandler(async (req, res, next) => {
  const tradeSpend = await TradeSpend.findById(req.params.id)
    .populate('customer')
    .populate('vendor')
    .populate('products')
    .populate('promotion')
    .populate('campaign')
    .populate('budget')
    .populate('createdBy', 'firstName lastName')
    .populate('approvals.approver', 'firstName lastName');
  
  if (!tradeSpend) {
    throw new AppError('Trade spend not found', 404);
  }
  
  res.json({
    success: true,
    data: tradeSpend
  });
});

// Update trade spend
exports.updateTradeSpend = asyncHandler(async (req, res, next) => {
  const tradeSpend = await TradeSpend.findById(req.params.id);
  
  if (!tradeSpend) {
    throw new AppError('Trade spend not found', 404);
  }
  
  if (tradeSpend.status !== 'draft') {
    throw new AppError('Only draft trade spends can be updated', 400);
  }
  
  Object.assign(tradeSpend, req.body);
  tradeSpend.lastModifiedBy = req.user._id;
  
  await tradeSpend.save();
  
  res.json({
    success: true,
    data: tradeSpend
  });
});

// Submit for approval
exports.submitForApproval = asyncHandler(async (req, res, next) => {
  const tradeSpend = await TradeSpend.findById(req.params.id);
  
  if (!tradeSpend) {
    throw new AppError('Trade spend not found', 404);
  }
  
  await tradeSpend.submitForApproval(req.user._id);
  
  // Send approval notifications
  const firstApproval = tradeSpend.approvals[0];
  if (firstApproval) {
    const approvers = await User.find({ 
      role: firstApproval.level,
      isActive: true 
    });
    
    for (const approver of approvers) {
      await emailService.sendApprovalRequestEmail(approver, {
        id: tradeSpend.spendId,
        name: `${tradeSpend.spendType} - ${tradeSpend.category}`,
        amount: tradeSpend.amount.requested,
        requestedBy: req.user.firstName + ' ' + req.user.lastName
      }, 'Trade Spend');
    }
    
    // Real-time notification
    const io = req.app.get('io');
    io.to(`role:${firstApproval.level}`).emit('approval_required', {
      type: 'trade_spend',
      id: tradeSpend._id,
      spendId: tradeSpend.spendId,
      amount: tradeSpend.amount.requested
    });
  }
  
  res.json({
    success: true,
    message: 'Trade spend submitted for approval',
    data: tradeSpend
  });
});

// Approve trade spend
exports.approveTradeSpend = asyncHandler(async (req, res, next) => {
  const { approvedAmount, comments } = req.body;
  const tradeSpend = await TradeSpend.findById(req.params.id);
  
  if (!tradeSpend) {
    throw new AppError('Trade spend not found', 404);
  }
  
  // Check approval limit
  if (!req.user.canApprove('trade_spend', approvedAmount || tradeSpend.amount.requested)) {
    throw new AppError('Amount exceeds your approval limit', 403);
  }
  
  const approvalLevel = this.getUserApprovalLevel(req.user.role);
  await tradeSpend.approve(
    approvalLevel, 
    req.user._id, 
    approvedAmount || tradeSpend.amount.requested, 
    comments
  );
  
  // If fully approved, process wallet deduction for cash co-op
  if (tradeSpend.status === 'approved' && tradeSpend.spendType === 'cash_coop') {
    await this.processWalletDeduction(tradeSpend);
  }
  
  // Notify creator
  const creator = await User.findById(tradeSpend.createdBy);
  await emailService.sendApprovalNotificationEmail(creator, {
    id: tradeSpend.spendId,
    name: `${tradeSpend.spendType} - ${tradeSpend.category}`,
    amount: tradeSpend.amount.approved
  }, 'Trade Spend', 'Approved');
  
  res.json({
    success: true,
    message: 'Trade spend approved',
    data: tradeSpend
  });
});

// Reject trade spend
exports.rejectTradeSpend = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  const tradeSpend = await TradeSpend.findById(req.params.id);
  
  if (!tradeSpend) {
    throw new AppError('Trade spend not found', 404);
  }
  
  const approvalLevel = this.getUserApprovalLevel(req.user.role);
  await tradeSpend.reject(approvalLevel, req.user._id, reason);
  
  // Notify creator
  const creator = await User.findById(tradeSpend.createdBy);
  await emailService.sendApprovalNotificationEmail(creator, {
    id: tradeSpend.spendId,
    name: `${tradeSpend.spendType} - ${tradeSpend.category}`,
    amount: tradeSpend.amount.requested,
    rejectionReason: reason
  }, 'Trade Spend', 'Rejected');
  
  res.json({
    success: true,
    message: 'Trade spend rejected',
    data: tradeSpend
  });
});

// Record actual spend
exports.recordSpend = asyncHandler(async (req, res, next) => {
  const { amount, documents } = req.body;
  const tradeSpend = await TradeSpend.findById(req.params.id);
  
  if (!tradeSpend) {
    throw new AppError('Trade spend not found', 404);
  }
  
  if (tradeSpend.status !== 'approved' && tradeSpend.status !== 'active') {
    throw new AppError('Can only record spend for approved items', 400);
  }
  
  await tradeSpend.recordSpend(amount, documents);
  
  // Update budget actuals if linked
  if (tradeSpend.budget) {
    const budget = await Budget.findById(tradeSpend.budget);
    const month = new Date(tradeSpend.period.startDate).getMonth() + 1;
    const budgetLine = budget.budgetLines.find(line => line.month === month);
    
    if (budgetLine) {
      budgetLine.tradeSpend[tradeSpend.spendType].spent += amount;
      await budget.save();
    }
  }
  
  res.json({
    success: true,
    message: 'Spend recorded successfully',
    data: tradeSpend
  });
});

// Get wallet balance
exports.getWalletBalance = asyncHandler(async (req, res, next) => {
  const { customerId } = req.params;
  
  const user = await User.findById(req.user._id);
  const customer = await Customer.findById(customerId);
  
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }
  
  const balance = user.wallet[customerId] || 0;
  
  // Get wallet transactions
  const transactions = await TradeSpend.find({
    'cashCoopDetails.walletDeduction.fromUser': user._id,
    customer: customerId,
    spendType: 'cash_coop'
  })
  .select('spendId amount period cashCoopDetails.walletDeduction createdAt')
  .sort('-createdAt')
  .limit(50);
  
  res.json({
    success: true,
    data: {
      customer: {
        id: customer._id,
        name: customer.name,
        code: customer.code
      },
      balance,
      transactions: transactions.map(t => ({
        id: t._id,
        spendId: t.spendId,
        amount: t.cashCoopDetails.walletDeduction.amount,
        date: t.cashCoopDetails.walletDeduction.date,
        period: t.period
      }))
    }
  });
});

// Get trade spend summary
exports.getTradeSpendSummary = asyncHandler(async (req, res, next) => {
  const { year = new Date().getFullYear(), groupBy = 'month' } = req.query;
  
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  const matchStage = {
    'period.startDate': { $gte: startDate, $lte: endDate },
    status: { $in: ['approved', 'active', 'completed'] }
  };
  
  // Apply user filters
  if (req.user.role === 'kam' || req.user.role === 'sales_rep') {
    matchStage.$or = [
      { createdBy: req.user._id },
      { customer: { $in: req.user.assignedCustomers } }
    ];
  }
  
  const groupId = groupBy === 'month' ? 
    { year: { $year: '$period.startDate' }, month: { $month: '$period.startDate' } } :
    groupBy === 'quarter' ?
    { year: { $year: '$period.startDate' }, quarter: { $ceil: { $divide: [{ $month: '$period.startDate' }, 3] } } } :
    { year: { $year: '$period.startDate' } };
  
  const summary = await TradeSpend.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: groupId,
        marketing: {
          $sum: {
            $cond: [{ $eq: ['$spendType', 'marketing'] }, '$amount.spent', 0]
          }
        },
        cashCoop: {
          $sum: {
            $cond: [{ $eq: ['$spendType', 'cash_coop'] }, '$amount.spent', 0]
          }
        },
        tradingTerms: {
          $sum: {
            $cond: [{ $eq: ['$spendType', 'trading_terms'] }, '$amount.spent', 0]
          }
        },
        rebate: {
          $sum: {
            $cond: [{ $eq: ['$spendType', 'rebate'] }, '$amount.spent', 0]
          }
        },
        promotion: {
          $sum: {
            $cond: [{ $eq: ['$spendType', 'promotion'] }, '$amount.spent', 0]
          }
        },
        total: { $sum: '$amount.spent' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.quarter': 1 } }
  ]);
  
  res.json({
    success: true,
    data: {
      year,
      groupBy,
      summary,
      totals: summary.reduce((acc, item) => ({
        marketing: acc.marketing + item.marketing,
        cashCoop: acc.cashCoop + item.cashCoop,
        tradingTerms: acc.tradingTerms + item.tradingTerms,
        rebate: acc.rebate + item.rebate,
        promotion: acc.promotion + item.promotion,
        total: acc.total + item.total
      }), {
        marketing: 0,
        cashCoop: 0,
        tradingTerms: 0,
        rebate: 0,
        promotion: 0,
        total: 0
      })
    }
  });
});

// Helper functions
exports.getRequiredApprovals = (amount, spendType) => {
  const approvalLevels = [];
  
  if (amount <= 5000) {
    approvalLevels.push({ level: 'kam', status: 'pending' });
  } else if (amount <= 20000) {
    approvalLevels.push({ level: 'kam', status: 'pending' });
    approvalLevels.push({ level: 'manager', status: 'pending' });
  } else if (amount <= 50000) {
    approvalLevels.push({ level: 'kam', status: 'pending' });
    approvalLevels.push({ level: 'manager', status: 'pending' });
    approvalLevels.push({ level: 'director', status: 'pending' });
  } else {
    approvalLevels.push({ level: 'kam', status: 'pending' });
    approvalLevels.push({ level: 'manager', status: 'pending' });
    approvalLevels.push({ level: 'director', status: 'pending' });
    approvalLevels.push({ level: 'board', status: 'pending' });
  }
  
  // Add finance approval for certain types
  if (['cash_coop', 'rebate'].includes(spendType) && amount > 10000) {
    approvalLevels.push({ level: 'finance', status: 'pending' });
  }
  
  return approvalLevels;
};

exports.getUserApprovalLevel = (role) => {
  const levelMap = {
    kam: 'kam',
    manager: 'manager',
    director: 'director',
    board: 'board',
    admin: 'finance'
  };
  
  return levelMap[role] || null;
};

exports.processWalletDeduction = async (tradeSpend) => {
  if (tradeSpend.spendType !== 'cash_coop') return;
  
  const user = await User.findById(tradeSpend.createdBy);
  const customerId = tradeSpend.customer.toString();
  
  if (!user.wallet[customerId] || user.wallet[customerId] < tradeSpend.amount.approved) {
    throw new AppError('Insufficient wallet balance', 400);
  }
  
  // Deduct from wallet
  user.wallet[customerId] -= tradeSpend.amount.approved;
  await user.save();
  
  // Record deduction
  tradeSpend.cashCoopDetails.walletDeduction = {
    fromUser: user._id,
    amount: tradeSpend.amount.approved,
    date: new Date()
  };
  
  await tradeSpend.save();
};