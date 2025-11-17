const express = require('express');
const router = express.Router();
const { authenticateToken, _authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const exportService = require('../services/exportService');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

/**
 * Export Routes
 * Handles Excel export for all entities
 */

// Export customers
router.get('/customers', authenticateToken, asyncHandler(async (req, res) => {
  logger.info('Exporting customers', { userId: req.user._id, tenantId: req.tenantId });

  const { search, status, channel } = req.query;

  // Build query
  const query = { tenantId: req.tenantId };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } }
    ];
  }
  if (status) query.status = status;
  if (channel) query.channel = channel;

  // Fetch all matching customers (no pagination for export)
  const customers = await Customer.find(query)
    .sort({ name: 1 })
    .lean();

  // Generate Excel workbook
  const workbook = await exportService.exportCustomers(customers, req.user.companyName);

  // Set response headers
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=customers_${Date.now()}.xlsx`
  );

  // Write to response
  await workbook.xlsx.write(res);
  res.end();

  logger.info('Customers exported successfully', {
    count: customers.length,
    userId: req.user._id
  });
}));

// Export products
router.get('/products', authenticateToken, asyncHandler(async (req, res) => {
  logger.info('Exporting products', { userId: req.user._id, tenantId: req.tenantId });

  const { search, brand, category, isActive } = req.query;

  const query = { tenantId: req.tenantId };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } }
    ];
  }
  if (brand) query.brand = brand;
  if (category) query.category = category;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const products = await Product.find(query)
    .sort({ name: 1 })
    .lean();

  const workbook = await exportService.exportProducts(products, req.user.companyName);

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=products_${Date.now()}.xlsx`
  );

  await workbook.xlsx.write(res);
  res.end();

  logger.info('Products exported successfully', {
    count: products.length,
    userId: req.user._id
  });
}));

// Export promotions
router.get('/promotions', authenticateToken, asyncHandler(async (req, res) => {
  logger.info('Exporting promotions', { userId: req.user._id, tenantId: req.tenantId });

  const { search, status, type, customerId } = req.query;

  const query = { tenantId: req.tenantId };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { promotionId: { $regex: search, $options: 'i' } }
    ];
  }
  if (status) query.status = status;
  if (type) query.type = type;
  if (customerId) query.customer = customerId;

  const promotions = await Promotion.find(query)
    .populate('customer', 'name')
    .populate('product', 'name')
    .sort({ startDate: -1 })
    .lean();

  const workbook = await exportService.exportPromotions(promotions, req.user.companyName);

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=promotions_${Date.now()}.xlsx`
  );

  await workbook.xlsx.write(res);
  res.end();

  logger.info('Promotions exported successfully', {
    count: promotions.length,
    userId: req.user._id
  });
}));

// Export budgets
router.get('/budgets', authenticateToken, asyncHandler(async (req, res) => {
  logger.info('Exporting budgets', { userId: req.user._id, tenantId: req.tenantId });

  const { search, status, type, customerId } = req.query;

  const query = { tenantId: req.tenantId };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { budgetId: { $regex: search, $options: 'i' } }
    ];
  }
  if (status) query.status = status;
  if (type) query.type = type;
  if (customerId) query.customer = customerId;

  const budgets = await Budget.find(query)
    .populate('customer', 'name')
    .sort({ createdAt: -1 })
    .lean();

  const workbook = await exportService.exportBudgets(budgets, req.user.companyName);

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=budgets_${Date.now()}.xlsx`
  );

  await workbook.xlsx.write(res);
  res.end();

  logger.info('Budgets exported successfully', {
    count: budgets.length,
    userId: req.user._id
  });
}));

// Export transactions
router.get('/transactions', authenticateToken, asyncHandler(async (req, res) => {
  logger.info('Exporting transactions', { userId: req.user._id, tenantId: req.tenantId });

  const { search, type, status, customerId, startDate, endDate } = req.query;

  const query = { tenantId: req.tenantId };
  if (search) {
    query.$or = [
      { transactionId: { $regex: search, $options: 'i' } },
      { reference: { $regex: search, $options: 'i' } }
    ];
  }
  if (type) query.type = type;
  if (status) query.status = status;
  if (customerId) query.customer = customerId;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const transactions = await Transaction.find(query)
    .populate('customer', 'name')
    .populate('product', 'name')
    .populate('promotion', 'name')
    .sort({ date: -1 })
    .lean();

  const workbook = await exportService.exportTransactions(transactions, req.user.companyName);

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=transactions_${Date.now()}.xlsx`
  );

  await workbook.xlsx.write(res);
  res.end();

  logger.info('Transactions exported successfully', {
    count: transactions.length,
    userId: req.user._id
  });
}));

// Export template for bulk import
router.get('/template/:type', authenticateToken, asyncHandler(async (req, res) => {
  const { type } = req.params;
  logger.info('Generating import template', { type, userId: req.user._id });

  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(type.charAt(0).toUpperCase() + type.slice(1));

  // Define templates
  const templates = {
    customers: [
      ['Customer Code*', 'Customer Name*', 'Type', 'Region', 'Contact Name', 'Contact Email', 'Contact Phone', 'Status'],
      ['CUST001', 'Example Customer', 'Retail', 'Western Cape', 'John Doe', 'john@example.com', '+27123456789', 'active'],
      ['CUST002', 'Another Customer', 'Wholesale', 'Gauteng', 'Jane Smith', 'jane@example.com', '+27987654321', 'active']
    ],
    products: [
      ['SKU*', 'Product Name*', 'Brand', 'Category', 'Subcategory', 'Pack Size', 'Unit Price', 'Unit Cost', 'Active'],
      ['SKU001', 'Example Product', 'Brand A', 'Snacks', 'Chips', '100g', '10.00', '6.00', 'Yes'],
      ['SKU002', 'Another Product', 'Brand B', 'Beverages', 'Soft Drinks', '500ml', '15.00', '9.00', 'Yes']
    ],
    promotions: [
      ['Promotion Name*', 'Type*', 'Customer Code*', 'Product SKU*', 'Start Date*', 'End Date*', 'Discount %', 'Budget'],
      ['Summer Sale', 'Discount', 'CUST001', 'SKU001', '2025-01-01', '2025-01-31', '15', '50000'],
      ['Winter Promo', 'BOGOF', 'CUST002', 'SKU002', '2025-06-01', '2025-06-30', '0', '30000']
    ]
  };

  const templateData = templates[type];
  if (!templateData) {
    return res.status(400).json({ success: false, message: 'Invalid template type' });
  }

  // Add header row
  const headerRow = worksheet.addRow(templateData[0]);
  headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2E7D32' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 30;

  // Add example rows
  for (let i = 1; i < templateData.length; i++) {
    worksheet.addRow(templateData[i]);
  }

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    column.width = 20;
  });

  // Add instructions sheet
  const instructionsSheet = workbook.addWorksheet('Instructions');
  instructionsSheet.addRow(['Bulk Import Template - Instructions']);
  instructionsSheet.addRow([]);
  instructionsSheet.addRow(['1. Fill in the required fields marked with * (asterisk)']);
  instructionsSheet.addRow(['2. Do not change the column headers']);
  instructionsSheet.addRow(['3. Delete the example rows before importing']);
  instructionsSheet.addRow(['4. Save and upload the file']);
  instructionsSheet.addRow([]);
  instructionsSheet.addRow(['Notes:']);
  instructionsSheet.addRow(['- Dates should be in YYYY-MM-DD format']);
  instructionsSheet.addRow(['- Numbers should not contain currency symbols']);
  instructionsSheet.addRow(['- Use "Yes"/"No" for boolean fields']);

  instructionsSheet.getCell('A1').font = { bold: true, size: 14 };
  instructionsSheet.columns.forEach((column) => {
    column.width = 60;
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=${type}_import_template.xlsx`
  );

  await workbook.xlsx.write(res);
  res.end();

  logger.info('Import template generated', { type, userId: req.user._id });
}));

module.exports = router;
