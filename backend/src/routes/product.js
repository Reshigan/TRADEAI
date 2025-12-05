const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const Product = require('../models/Product');
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

// Get product hierarchy tree
router.get('/hierarchy', authenticateToken, asyncHandler(async (req, res) => {
  const tenantId = req.tenantId || req.user.tenantId;

  const buildTree = async (parentId = null) => {
    const products = await Product.find({
      tenantId,
      parentId
    }).sort({ name: 1 });

    const tree = await Promise.all(products.map(async (product) => {
      const children = await buildTree(product._id);
      return {
        ...product.toObject(),
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

// Get all products
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, category, brand, status } = req.query;

  const tenantId = req.tenantId || req.user.tenantId;
  const query = { tenantId };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { sapMaterialId: { $regex: search, $options: 'i' } }
    ];
  }
  if (category) query.category = category;
  if (brand) query['brand.name'] = brand;
  if (status) query.status = status;

  const products = await Product.find(query)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ name: 1 });

  const count = await Product.countDocuments(query);

  res.json({
    success: true,
    data: products,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    total: count
  });
}));

// Get product by ID
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.json({
    success: true,
    data: product
  });
}));

// Create new product
router.post('/', authenticateToken, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  // Get tenant from request context
  const tenantId = req.tenantId || req.user.tenantId;
  if (!tenantId) {
    throw new AppError('Tenant context not found', 400);
  }

  // Sanitize string fields to prevent XSS
  const sanitizedData = { ...req.body };
  if (sanitizedData.name) sanitizedData.name = sanitizeInput(sanitizedData.name);
  if (sanitizedData.sku) sanitizedData.sku = sanitizeInput(sanitizedData.sku);
  if (sanitizedData.sapMaterialId) sanitizedData.sapMaterialId = sanitizeInput(sanitizedData.sapMaterialId);
  if (sanitizedData.description) sanitizedData.description = sanitizeInput(sanitizedData.description);

  const product = await Product.create({
    ...sanitizedData,
    tenantId,
    createdBy: req.user._id
  });

  res.status(201).json({
    success: true,
    data: product
  });
}));

// Update product
router.put('/:id', authenticateToken, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.json({
    success: true,
    data: product
  });
}));

// Delete product
router.delete('/:id', authenticateToken, authorize('admin'), asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
}));

// Get product hierarchy
router.get('/:id/hierarchy', authenticateToken, asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.json({
    success: true,
    data: {
      product,
      hierarchy: product.hierarchy
    }
  });
}));

// Get products by category
router.get('/category/:category', authenticateToken, asyncHandler(async (req, res) => {
  const products = await Product.find({
    category: req.params.category,
    status: 'active'
  }).sort({ name: 1 });

  res.json({
    success: true,
    data: products,
    count: products.length
  });
}));

router.get('/:id/promotions', authenticateToken, asyncHandler(async (req, res) => {
  const Promotion = require('../models/Promotion');
  const promotions = await Promotion.find({ 'products.product': req.params.id })
    .populate('scope.customers.customer', 'name code')
    .sort({ 'period.startDate': -1 });

  res.json({
    success: true,
    data: promotions
  });
}));

router.get('/:id/campaigns', authenticateToken, asyncHandler(async (req, res) => {
  const Campaign = require('../models/Campaign');
  const Promotion = require('../models/Promotion');

  const promotions = await Promotion.find({ 'products.product': req.params.id }).select('campaign');
  const campaignIds = [...new Set(promotions.map((p) => p.campaign).filter(Boolean))];
  const campaigns = await Campaign.find({ _id: { $in: campaignIds } });

  res.json({
    success: true,
    data: campaigns
  });
}));

router.get('/:id/trading-terms', authenticateToken, asyncHandler(async (req, res) => {
  const TradingTerm = require('../models/TradingTerm');
  const tradingTerms = await TradingTerm.find({ 'applicability.products': req.params.id })
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: tradingTerms
  });
}));

router.get('/:id/sales-history', authenticateToken, asyncHandler(async (req, res) => {
  const SalesHistory = require('../models/SalesHistory');
  const salesHistory = await SalesHistory.find({ product: req.params.id })
    .populate('customer', 'name code')
    .sort({ date: -1 })
    .limit(100);

  res.json({
    success: true,
    data: salesHistory
  });
}));

module.exports = router;
