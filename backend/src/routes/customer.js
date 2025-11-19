const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const Customer = require('../models/Customer');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// XSS sanitization helper
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Get customer hierarchy tree
router.get('/hierarchy', authenticateToken, asyncHandler(async (req, res) => {
  const tenantId = req.tenantId || req.user.tenantId;

  const buildTree = async (parentId = null) => {
    const customers = await Customer.find({
      tenantId,
      parentId
    }).sort({ name: 1 });

    const tree = await Promise.all(customers.map(async (customer) => {
      const children = await buildTree(customer._id);
      return {
        ...customer.toObject(),
        children
      };
    }));

    return tree;
  };

  const tree = await buildTree(null);

  res.json({
    success: true,
    data: tree
  });
}));

// Get all customers
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, status, channel } = req.query;

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { sapCustomerId: { $regex: search, $options: 'i' } }
    ];
  }
  if (status) query.status = status;
  if (channel) query.channel = channel;

  const customers = await Customer.find(query)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ name: 1 });

  const count = await Customer.countDocuments(query);

  res.json({
    success: true,
    data: customers,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    total: count
  });
}));

// Get customer by ID
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  res.json({
    success: true,
    data: customer
  });
}));

// Create new customer
router.post('/', authenticateToken, authorize('super_admin', 'admin', 'manager'), asyncHandler(async (req, res) => {
  // Get tenant from request context
  const tenantId = req.tenantId || req.user.tenantId;
  if (!tenantId) {
    throw new AppError('Tenant context not found', 400);
  }

  // Sanitize string fields to prevent XSS
  const sanitizedData = { ...req.body };
  if (sanitizedData.name) sanitizedData.name = sanitizeInput(sanitizedData.name);
  if (sanitizedData.code) sanitizedData.code = sanitizeInput(sanitizedData.code);
  if (sanitizedData.sapCustomerId) sanitizedData.sapCustomerId = sanitizeInput(sanitizedData.sapCustomerId);
  if (sanitizedData.address) sanitizedData.address = sanitizeInput(sanitizedData.address);
  if (sanitizedData.city) sanitizedData.city = sanitizeInput(sanitizedData.city);
  if (sanitizedData.state) sanitizedData.state = sanitizeInput(sanitizedData.state);
  if (sanitizedData.contactPerson) sanitizedData.contactPerson = sanitizeInput(sanitizedData.contactPerson);

  const customer = await Customer.create({
    ...sanitizedData,
    tenantId,
    createdBy: req.user._id
  });

  res.status(201).json({
    success: true,
    message: 'Customer created successfully',
    data: customer
  });
}));

// Update customer
router.put('/:id', authenticateToken, authorize('super_admin', 'admin', 'manager'), asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  res.json({
    success: true,
    data: customer
  });
}));

// Delete customer
router.delete('/:id', authenticateToken, authorize('super_admin', 'admin'), asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  res.json({
    success: true,
    message: 'Customer deleted successfully'
  });
}));

// Get customer hierarchy
router.get('/:id/hierarchy', authenticateToken, asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Get parent and children
  const [parent, children] = await Promise.all([
    customer.parent ? Customer.findById(customer.parent) : null,
    Customer.find({ parent: customer._id })
  ]);

  res.json({
    success: true,
    data: {
      customer,
      parent,
      children
    }
  });
}));

router.get('/:id/promotions', authenticateToken, asyncHandler(async (req, res) => {
  const Promotion = require('../models/Promotion');
  const promotions = await Promotion.find({ 'scope.customers.customer': req.params.id })
    .populate('products.product', 'name sku')
    .sort({ 'period.startDate': -1 });

  res.json({
    success: true,
    data: promotions
  });
}));

router.get('/:id/trade-spends', authenticateToken, asyncHandler(async (req, res) => {
  const TradeSpend = require('../models/TradeSpend');
  const tradeSpends = await TradeSpend.find({ customer: req.params.id })
    .populate('vendor', 'name')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: tradeSpends
  });
}));

router.get('/:id/trading-terms', authenticateToken, asyncHandler(async (req, res) => {
  const TradingTerm = require('../models/TradingTerm');
  const tradingTerms = await TradingTerm.find({ 'applicability.customers': req.params.id })
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: tradingTerms
  });
}));

router.get('/:id/budgets', authenticateToken, asyncHandler(async (req, res) => {
  const Budget = require('../models/Budget');
  const budgets = await Budget.find({ 'scope.customers': req.params.id })
    .sort({ year: -1 });

  res.json({
    success: true,
    data: budgets
  });
}));

router.get('/:id/claims', authenticateToken, asyncHandler(async (req, res) => {
  const Claim = require('../models/Claim');
  const claims = await Claim.find({ customer: req.params.id })
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: claims
  });
}));

router.get('/:id/deductions', authenticateToken, asyncHandler(async (req, res) => {
  const Deduction = require('../models/Deduction');
  const deductions = await Deduction.find({ customer: req.params.id })
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: deductions
  });
}));

router.get('/:id/sales-history', authenticateToken, asyncHandler(async (req, res) => {
  const SalesHistory = require('../models/SalesHistory');
  const salesHistory = await SalesHistory.find({ customer: req.params.id })
    .populate('product', 'name sku')
    .sort({ date: -1 })
    .limit(100);

  res.json({
    success: true,
    data: salesHistory
  });
}));

module.exports = router;
