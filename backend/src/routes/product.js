const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const Product = require('../models/Product');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// Get all products
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, category, brand, status } = req.query;
  
  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { sapMaterialId: { $regex: search, $options: 'i' } }
    ];
  }
  if (category) query['category.primary'] = category;
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
  const product = await Product.create({
    ...req.body,
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
    'category.primary': req.params.category,
    status: 'active'
  }).sort({ name: 1 });
  
  res.json({
    success: true,
    data: products,
    count: products.length
  });
}));

module.exports = router;