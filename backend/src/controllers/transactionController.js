const Transaction = require('../models/Transaction');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const EnterpriseCrudService = require('../services/enterpriseCrudService');
const workflowEngine = require('../services/workflowEngine');

const crudService = new EnterpriseCrudService(Transaction);

/**
 * TRANSACTION CONTROLLER
 * Enterprise-level transaction management
 */

// Create transaction
exports.createTransaction = asyncHandler(async (req, res, next) => {
  const transactionData = {
    ...req.body,
    tenantId: req.user.tenantId,
    createdBy: req.user._id
  };

  // Calculate totals
  const transaction = new Transaction(transactionData);
  transaction.calculateTotals();

  // Initialize approval workflow if amount exceeds threshold
  if (transaction.amount.net >= 1000) {
    transaction.workflow = await workflowEngine.initializeWorkflow(
      transaction,
      'transaction_approval',
      { userId: req.user._id }
    );
    transaction.status = 'pending_approval';
  }

  await transaction.save();

  res.status(201).json({
    success: true,
    data: transaction
  });
});

// Get transactions with advanced filtering
exports.getTransactions = asyncHandler(async (req, res, next) => {
  const {
    page,
    limit,
    sort,
    status,
    transactionType,
    customerId,
    dateFrom,
    dateTo,
    search
  } = req.query;

  const filters = {
    tenantId: req.user.tenantId,
    isDeleted: false
  };

  if (status) filters.status = status;
  if (transactionType) filters.transactionType = transactionType;
  if (customerId) filters.customerId = customerId;
  
  if (dateFrom || dateTo) {
    filters.transactionDate = {};
    if (dateFrom) filters.transactionDate.$gte = new Date(dateFrom);
    if (dateTo) filters.transactionDate.$lte = new Date(dateTo);
  }

  const options = {
    page,
    limit,
    sort,
    populate: ['customerId', 'createdBy'],
    search,
    searchFields: ['transactionNumber', 'notes']
  };

  const result = await crudService.find(filters, options);

  res.json({
    success: true,
    ...result
  });
});

// Get transaction by ID
exports.getTransactionById = asyncHandler(async (req, res, next) => {
  const transaction = await crudService.findById(req.params.id, {
    populate: ['customerId', 'vendorId', 'createdBy', 'workflow.approvers.userId']
  });

  res.json({
    success: true,
    data: transaction
  });
});

// Update transaction
exports.updateTransaction = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const transaction = await Transaction.findById(id);
  
  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  // Only allow updates if transaction is in draft or pending
  if (!['draft', 'pending_approval'].includes(transaction.status)) {
    throw new AppError('Cannot update transaction in current status', 400);
  }

  const updated = await crudService.update(id, req.body, {
    versionHistory: true,
    auditLog: true,
    userId: req.user._id
  });

  res.json({
    success: true,
    data: updated
  });
});

// Delete transaction
exports.deleteTransaction = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const result = await crudService.softDelete(id, {
    auditLog: true,
    userId: req.user._id
  });

  res.json({
    success: true,
    data: result
  });
});

// Approve transaction
exports.approveTransaction = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { comments } = req.body;

  const transaction = await Transaction.findById(id);
  
  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  await transaction.approve(req.user._id, comments);

  res.json({
    success: true,
    data: transaction,
    message: 'Transaction approved successfully'
  });
});

// Reject transaction
exports.rejectTransaction = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { comments } = req.body;

  const transaction = await Transaction.findById(id);
  
  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  await transaction.reject(req.user._id, comments);

  res.json({
    success: true,
    data: transaction,
    message: 'Transaction rejected'
  });
});

// Settle transaction
exports.settleTransaction = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { settlementData } = req.body;

  const transaction = await Transaction.findById(id);
  
  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  if (transaction.status !== 'approved') {
    throw new AppError('Transaction must be approved before settlement', 400);
  }

  transaction.settlement = {
    ...settlementData,
    completedDate: new Date(),
    reconciledBy: req.user._id
  };
  transaction.status = 'completed';

  await transaction.save();

  res.json({
    success: true,
    data: transaction,
    message: 'Transaction settled successfully'
  });
});

// Get pending approvals
exports.getPendingApprovals = asyncHandler(async (req, res, next) => {
  const pending = await Transaction.getPendingApprovals(req.user._id);

  res.json({
    success: true,
    data: pending,
    count: pending.length
  });
});

// Bulk approve
exports.bulkApprove = asyncHandler(async (req, res, next) => {
  const { transactionIds, comments } = req.body;

  const results = {
    success: [],
    failed: []
  };

  for (const id of transactionIds) {
    try {
      const transaction = await Transaction.findById(id);
      await transaction.approve(req.user._id, comments);
      results.success.push(id);
    } catch (error) {
      results.failed.push({ id, error: error.message });
    }
  }

  res.json({
    success: true,
    data: results
  });
});
