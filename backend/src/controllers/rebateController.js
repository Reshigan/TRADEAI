const Rebate = require('../models/Rebate');
const RebateAccrual = require('../models/RebateAccrual');
const Transaction = require('../models/Transaction');
const rebateCalculationService = require('../services/rebateCalculationService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Get all rebates with optional filtering
 */
exports.getAllRebates = asyncHandler(async (req, res) => {
  const { status, type, customer } = req.query;
  const filter = { company: req.user.company };

  if (status) filter.status = status;
  if (type) filter.type = type;
  if (customer) filter.customer = customer;

  const rebates = await Rebate.find(filter)
    .populate('customer', 'name code')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: rebates
  });
});

/**
 * Get a single rebate by ID
 */
exports.getRebateById = asyncHandler(async (req, res) => {
  const rebate = await Rebate.findOne({
    _id: req.params.id,
    company: req.user.company
  })
    .populate('customer', 'name code tradingTerms')
    .populate('createdBy', 'name email')
    .populate('approvedBy', 'name email');

  if (!rebate) {
    throw new AppError('Rebate not found', 404);
  }

  res.status(200).json({
    success: true,
    data: rebate
  });
});

/**
 * Create a new rebate
 */
exports.createRebate = asyncHandler(async (req, res) => {
  const rebateData = {
    ...req.body,
    company: req.user.company,
    createdBy: req.user._id,
    status: 'draft'
  };

  const rebate = await Rebate.create(rebateData);

  logger.logAudit('rebate_created', req.user._id, {
    rebateId: rebate._id,
    rebateName: rebate.name,
    type: rebate.type
  });

  res.status(201).json({
    success: true,
    data: rebate
  });
});

/**
 * Update a rebate
 */
exports.updateRebate = asyncHandler(async (req, res) => {
  const rebate = await Rebate.findOne({
    _id: req.params.id,
    company: req.user.company
  });

  if (!rebate) {
    throw new AppError('Rebate not found', 404);
  }

  if (rebate.status === 'approved' && req.body.status !== 'active' && req.body.status !== 'inactive') {
    throw new AppError('Cannot modify approved rebate', 400);
  }

  Object.assign(rebate, req.body);
  rebate.updatedBy = req.user._id;
  await rebate.save();

  logger.logAudit('rebate_updated', req.user._id, {
    rebateId: rebate._id,
    changes: req.body
  });

  res.status(200).json({
    success: true,
    data: rebate
  });
});

/**
 * Delete a rebate
 */
exports.deleteRebate = asyncHandler(async (req, res) => {
  const rebate = await Rebate.findOne({
    _id: req.params.id,
    company: req.user.company
  });

  if (!rebate) {
    throw new AppError('Rebate not found', 404);
  }

  if (rebate.status === 'active') {
    throw new AppError('Cannot delete active rebate. Please deactivate it first.', 400);
  }

  await rebate.deleteOne();

  logger.logAudit('rebate_deleted', req.user._id, {
    rebateId: rebate._id,
    rebateName: rebate.name
  });

  res.status(200).json({
    success: true,
    message: 'Rebate deleted successfully'
  });
});

/**
 * Approve a rebate
 */
exports.approveRebate = asyncHandler(async (req, res) => {
  const rebate = await Rebate.findOne({
    _id: req.params.id,
    company: req.user.company
  });

  if (!rebate) {
    throw new AppError('Rebate not found', 404);
  }

  if (rebate.status !== 'pending_approval') {
    throw new AppError('Rebate is not pending approval', 400);
  }

  rebate.status = 'approved';
  rebate.approvedBy = req.user._id;
  rebate.approvedDate = new Date();
  await rebate.save();

  logger.logAudit('rebate_approved', req.user._id, {
    rebateId: rebate._id,
    rebateName: rebate.name
  });

  res.status(200).json({
    success: true,
    data: rebate
  });
});

/**
 * Deactivate a rebate
 */
exports.deactivateRebate = asyncHandler(async (req, res) => {
  const rebate = await Rebate.findOne({
    _id: req.params.id,
    company: req.user.company
  });

  if (!rebate) {
    throw new AppError('Rebate not found', 404);
  }

  rebate.status = 'inactive';
  rebate.endDate = new Date();
  await rebate.save();

  logger.logAudit('rebate_deactivated', req.user._id, {
    rebateId: rebate._id,
    rebateName: rebate.name
  });

  res.status(200).json({
    success: true,
    data: rebate
  });
});

/**
 * Calculate rebates for a transaction
 */
exports.calculateRebatesForTransaction = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;

  const transaction = await Transaction.findOne({
    _id: transactionId,
    company: req.user.company
  }).populate('customer');

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  const activeRebates = await Rebate.find({
    company: req.user.company,
    customer: transaction.customer._id,
    status: 'active',
    startDate: { $lte: transaction.date },
    $or: [
      { endDate: { $gte: transaction.date } },
      { endDate: null }
    ]
  });

  const calculations = [];

  for (const rebate of activeRebates) {
    try {
      const result = await rebateCalculationService.calculateRebate(
        rebate,
        transaction,
        { /* additional context */ }
      );

      if (result.eligible) {
        calculations.push({
          rebateId: rebate._id,
          rebateName: rebate.name,
          type: rebate.type,
          ...result
        });
      }
    } catch (error) {
      logger.error('Rebate calculation error', error);
    }
  }

  res.status(200).json({
    success: true,
    data: {
      transactionId: transaction._id,
      totalRebateAmount: calculations.reduce((sum, calc) => sum + calc.amount, 0),
      calculations
    }
  });
});

/**
 * Get rebate statistics
 */
exports.getRebateStatistics = asyncHandler(async (req, res) => {
  const { startDate, endDate, customer } = req.query;

  const filter = {
    company: req.user.company,
    status: { $in: ['active', 'completed'] }
  };

  if (customer) filter.customer = customer;

  const rebates = await Rebate.find(filter);

  const accrualFilter = { company: req.user.company };
  if (startDate && endDate) {
    accrualFilter.accrualDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  if (customer) accrualFilter.customer = customer;

  const accruals = await RebateAccrual.find(accrualFilter);

  const statistics = {
    totalRebates: rebates.length,
    activeRebates: rebates.filter((r) => r.status === 'active').length,
    totalAccrued: accruals.reduce((sum, acc) => sum + acc.accruedAmount, 0),
    totalPaid: accruals.filter((acc) => acc.status === 'paid').reduce((sum, acc) => sum + acc.accruedAmount, 0),
    totalPending: accruals.filter((acc) => acc.status === 'pending').reduce((sum, acc) => sum + acc.accruedAmount, 0),
    byType: {}
  };

  rebates.forEach((rebate) => {
    if (!statistics.byType[rebate.type]) {
      statistics.byType[rebate.type] = {
        count: 0,
        totalAccrued: 0,
        totalPaid: 0
      };
    }
    statistics.byType[rebate.type].count++;
  });

  accruals.forEach((accrual) => {
    const rebate = rebates.find((r) => r._id.equals(accrual.rebate));
    if (rebate && statistics.byType[rebate.type]) {
      statistics.byType[rebate.type].totalAccrued += accrual.accruedAmount;
      if (accrual.status === 'paid') {
        statistics.byType[rebate.type].totalPaid += accrual.accruedAmount;
      }
    }
  });

  res.status(200).json({
    success: true,
    data: statistics
  });
});

/**
 * Get rebate accruals
 */
exports.getRebateAccruals = asyncHandler(async (req, res) => {
  const { rebateId, status, startDate, endDate } = req.query;

  const filter = { company: req.user.company };

  if (rebateId) filter.rebate = rebateId;
  if (status) filter.status = status;
  if (startDate && endDate) {
    filter.accrualDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const accruals = await RebateAccrual.find(filter)
    .populate('rebate', 'name type')
    .populate('customer', 'name code')
    .populate('transaction')
    .sort({ accrualDate: -1 });

  res.status(200).json({
    success: true,
    data: accruals
  });
});

/**
 * Get customer rebate history
 */
exports.getCustomerRebateHistory = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const { startDate, endDate } = req.query;

  const filter = {
    company: req.user.company,
    customer: customerId
  };

  if (startDate && endDate) {
    filter.accrualDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const accruals = await RebateAccrual.find(filter)
    .populate('rebate', 'name type calculationType')
    .populate('transaction', 'date invoiceNumber totalAmount')
    .sort({ accrualDate: -1 });

  const summary = {
    totalAccrued: accruals.reduce((sum, acc) => sum + acc.accruedAmount, 0),
    totalPaid: accruals.filter((acc) => acc.status === 'paid').reduce((sum, acc) => sum + acc.accruedAmount, 0),
    totalPending: accruals.filter((acc) => acc.status === 'pending').reduce((sum, acc) => sum + acc.accruedAmount, 0),
    byRebateType: {}
  };

  accruals.forEach((accrual) => {
    if (accrual.rebate) {
      const type = accrual.rebate.type;
      if (!summary.byRebateType[type]) {
        summary.byRebateType[type] = {
          accrued: 0,
          paid: 0,
          pending: 0
        };
      }
      summary.byRebateType[type].accrued += accrual.accruedAmount;
      if (accrual.status === 'paid') {
        summary.byRebateType[type].paid += accrual.accruedAmount;
      } else {
        summary.byRebateType[type].pending += accrual.accruedAmount;
      }
    }
  });

  res.status(200).json({
    success: true,
    data: {
      summary,
      accruals
    }
  });
});

/**
 * Calculate net margin after rebates
 */
exports.calculateNetMargin = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;

  const transaction = await Transaction.findOne({
    _id: transactionId,
    company: req.user.company
  }).populate('customer product');

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  const accruals = await RebateAccrual.find({
    transaction: transactionId,
    company: req.user.company
  }).populate('rebate');

  const totalRebateAmount = accruals.reduce((sum, acc) => sum + acc.accruedAmount, 0);

  const grossMargin = transaction.totalAmount - (transaction.costPrice || 0);
  const netMargin = grossMargin - totalRebateAmount;
  const netMarginPercentage = transaction.totalAmount > 0
    ? (netMargin / transaction.totalAmount) * 100
    : 0;

  res.status(200).json({
    success: true,
    data: {
      transactionId: transaction._id,
      totalAmount: transaction.totalAmount,
      costPrice: transaction.costPrice || 0,
      grossMargin,
      totalRebates: totalRebateAmount,
      netMargin,
      netMarginPercentage: parseFloat(netMarginPercentage.toFixed(2)),
      rebateBreakdown: accruals.map((acc) => ({
        rebateName: acc.rebate.name,
        type: acc.rebate.type,
        amount: acc.accruedAmount
      }))
    }
  });
});

/**
 * Accrue rebates for a period
 */
exports.accrueRebatesForPeriod = asyncHandler(async (req, res) => {
  const { startDate, endDate, customerId } = req.body;

  if (!startDate || !endDate) {
    throw new AppError('Start date and end date are required', 400);
  }

  const filter = {
    company: req.user.company,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };

  if (customerId) filter.customer = customerId;

  const transactions = await Transaction.find(filter)
    .populate('customer')
    .sort({ date: 1 });

  const accrualResults = [];

  for (const transaction of transactions) {
    try {
      const activeRebates = await Rebate.find({
        company: req.user.company,
        customer: transaction.customer._id,
        status: 'active',
        startDate: { $lte: transaction.date },
        $or: [
          { endDate: { $gte: transaction.date } },
          { endDate: null }
        ]
      });

      for (const rebate of activeRebates) {
        const result = await rebateCalculationService.calculateRebate(
          rebate,
          transaction,
          {}
        );

        if (result.eligible && result.amount > 0) {
          const existingAccrual = await RebateAccrual.findOne({
            transaction: transaction._id,
            rebate: rebate._id
          });

          if (!existingAccrual) {
            const accrual = await RebateAccrual.create({
              company: req.user.company,
              rebate: rebate._id,
              customer: transaction.customer._id,
              transaction: transaction._id,
              accrualDate: transaction.date,
              accruedAmount: result.amount,
              calculationDetails: result.details,
              status: 'pending'
            });

            accrualResults.push(accrual);
          }
        }
      }
    } catch (error) {
      logger.error('Error accruing rebates for transaction', error);
    }
  }

  logger.logAudit('rebates_accrued', req.user._id, {
    period: { startDate, endDate },
    customerId,
    accrualsCreated: accrualResults.length
  });

  res.status(200).json({
    success: true,
    data: {
      transactionsProcessed: transactions.length,
      accrualsCreated: accrualResults.length,
      totalAccruedAmount: accrualResults.reduce((sum, acc) => sum + acc.accruedAmount, 0),
      accruals: accrualResults
    }
  });
});
