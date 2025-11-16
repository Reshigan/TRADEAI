const Transaction = require('../models/Transaction');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const EnterpriseCrudService = require('../services/enterpriseCrudService');
const workflowEngine = require('../services/workflowEngine');
const XLSX = require('xlsx');
const csvParser = require('csv-parser');
const { Readable } = require('stream');

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

// Validate bulk upload data
const validateTransactionData = (row, index) => {
  const errors = [];

  if (!row.transactionType) {
    errors.push(`Row ${index + 1}: Transaction type is required`);
  } else if (!['order', 'trade_deal', 'settlement', 'payment', 'accrual', 'deduction'].includes(row.transactionType)) {
    errors.push(`Row ${index + 1}: Invalid transaction type`);
  }

  if (!row.customerId) {
    errors.push(`Row ${index + 1}: Customer ID is required`);
  }

  if (!row.amount || isNaN(parseFloat(row.amount))) {
    errors.push(`Row ${index + 1}: Valid amount is required`);
  }

  if (!row.transactionDate) {
    errors.push(`Row ${index + 1}: Transaction date is required`);
  } else if (isNaN(Date.parse(row.transactionDate))) {
    errors.push(`Row ${index + 1}: Invalid date format`);
  }

  return errors;
};

// Parse CSV data
const parseCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer.toString());

    stream
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

// Parse Excel data
const parseExcel = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet);
};

// Bulk upload transactions
exports.bulkUpload = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  let transactions = [];
  const fileExt = req.file.originalname.split('.').pop().toLowerCase();

  try {
    if (fileExt === 'csv') {
      transactions = await parseCSV(req.file.buffer);
    } else if (['xlsx', 'xls'].includes(fileExt)) {
      transactions = await parseExcel(req.file.buffer);
    } else {
      throw new AppError('Invalid file format. Only CSV and Excel files are supported', 400);
    }
  } catch (error) {
    throw new AppError(`File parsing error: ${error.message}`, 400);
  }

  if (transactions.length === 0) {
    throw new AppError('No transaction data found in file', 400);
  }

  if (transactions.length > 1000) {
    throw new AppError('Maximum 1000 transactions per upload', 400);
  }

  // Validate all rows
  const validationErrors = [];
  transactions.forEach((row, index) => {
    const errors = validateTransactionData(row, index);
    if (errors.length > 0) {
      validationErrors.push(...errors);
    }
  });

  if (validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors found',
      errors: validationErrors
    });
  }

  // Process transactions
  const results = {
    success: [],
    failed: [],
    total: transactions.length
  };

  for (let i = 0; i < transactions.length; i++) {
    try {
      const row = transactions[i];

      const transactionData = {
        transactionType: row.transactionType,
        customerId: row.customerId,
        vendorId: row.vendorId,
        transactionDate: new Date(row.transactionDate),
        currency: row.currency || 'USD',
        amount: {
          gross: parseFloat(row.amount),
          net: parseFloat(row.amount),
          tax: parseFloat(row.tax || 0),
          discount: parseFloat(row.discount || 0)
        },
        items: row.items ? JSON.parse(row.items) : [],
        payment: row.paymentMethod ? {
          method: row.paymentMethod,
          terms: row.paymentTerms,
          dueDate: row.paymentDueDate ? new Date(row.paymentDueDate) : null
        } : undefined,
        notes: row.notes ? [{
          text: row.notes,
          createdBy: req.user._id,
          createdAt: new Date()
        }] : [],
        tenantId: req.user.tenantId,
        createdBy: req.user._id
      };

      const transaction = new Transaction(transactionData);
      transaction.calculateTotals();

      // Initialize approval workflow if needed
      if (transaction.amount.net >= 1000) {
        transaction.workflow = await workflowEngine.initializeWorkflow(
          transaction,
          'transaction_approval',
          { userId: req.user._id }
        );
        transaction.status = 'pending_approval';
      }

      await transaction.save();
      results.success.push({
        row: i + 1,
        transactionNumber: transaction.transactionNumber,
        id: transaction._id
      });
    } catch (error) {
      results.failed.push({
        row: i + 1,
        error: error.message
      });
    }
  }

  res.status(201).json({
    success: true,
    message: `Uploaded ${results.success.length} of ${results.total} transactions`,
    data: results
  });
});

// Download template
exports.downloadTemplate = asyncHandler(async (req, res, next) => {
  const { format } = req.query;

  const templateData = [
    {
      transactionType: 'order',
      customerId: '507f1f77bcf86cd799439011',
      vendorId: '',
      transactionDate: '2024-11-04',
      amount: '1500.00',
      tax: '150.00',
      discount: '50.00',
      currency: 'USD',
      paymentMethod: 'credit',
      paymentTerms: 'net_30',
      paymentDueDate: '2024-12-04',
      items: '[]',
      notes: 'Sample transaction'
    }
  ];

  if (format === 'csv') {
    const csv = [
      Object.keys(templateData[0]).join(','),
      Object.values(templateData[0]).join(',')
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transaction_template.csv');
    res.send(csv);
  } else {
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=transaction_template.xlsx');
    res.send(buffer);
  }
});

// Export transactions
exports.exportTransactions = asyncHandler(async (req, res, next) => {
  const { format, ...filters } = req.query;

  const transactions = await Transaction.find({
    tenantId: req.user.tenantId,
    isDeleted: false,
    ...filters
  })
    .populate('customerId', 'name code')
    .populate('vendorId', 'name')
    .lean();

  if (transactions.length === 0) {
    throw new AppError('No transactions found to export', 404);
  }

  const exportData = transactions.map((t) => ({
    transactionNumber: t.transactionNumber,
    type: t.transactionType,
    status: t.status,
    customer: t.customerId?.name || '',
    vendor: t.vendorId?.name || '',
    date: new Date(t.transactionDate).toISOString().split('T')[0],
    grossAmount: t.amount.gross,
    discount: t.amount.discount,
    tax: t.amount.tax,
    netAmount: t.amount.net,
    currency: t.currency,
    paymentMethod: t.payment?.method || '',
    paymentTerms: t.payment?.terms || '',
    createdAt: new Date(t.createdAt).toISOString().split('T')[0]
  }));

  if (format === 'csv') {
    const headers = Object.keys(exportData[0]).join(',');
    const rows = exportData.map((row) => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions_export.csv');
    res.send(csv);
  } else {
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions_export.xlsx');
    res.send(buffer);
  }
});
