const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');

// Get inventory list (aggregated from products)
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, lowStock = false } = req.query;
  
  const query = {};
  
  // Filter for low stock items
  if (lowStock === 'true') {
    query['$expr'] = {
      '$lt': ['$inventory.stockLevel', '$inventory.reorderPoint']
    };
  }
  
  const products = await Product.find(query)
    .select('name sku inventory.stockLevel inventory.reorderPoint inventory.minStock inventory.maxStock status')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ 'inventory.stockLevel': 1 });
  
  const count = await Product.countDocuments(query);
  
  // Transform to inventory format
  const inventory = products.map(product => ({
    productId: product._id,
    productName: product.name,
    sku: product.sku,
    stockLevel: product.inventory?.stockLevel || 0,
    reorderPoint: product.inventory?.reorderPoint || 0,
    minStock: product.inventory?.minStock || 0,
    maxStock: product.inventory?.maxStock || 0,
    status: product.status,
    isLowStock: (product.inventory?.stockLevel || 0) < (product.inventory?.reorderPoint || 0)
  }));
  
  res.json({
    success: true,
    data: inventory,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
    total: count
  });
}));

// Get low stock alerts
router.get('/low-stock', asyncHandler(async (req, res) => {
  const products = await Product.find({
    '$expr': {
      '$lt': ['$inventory.stockLevel', '$inventory.reorderPoint']
    },
    status: 'active'
  })
    .select('name sku inventory.stockLevel inventory.reorderPoint')
    .sort({ 'inventory.stockLevel': 1 })
    .limit(50);
  
  const alerts = products.map(product => ({
    productId: product._id,
    productName: product.name,
    sku: product.sku,
    stockLevel: product.inventory?.stockLevel || 0,
    reorderPoint: product.inventory?.reorderPoint || 0,
    deficit: (product.inventory?.reorderPoint || 0) - (product.inventory?.stockLevel || 0)
  }));
  
  res.json({
    success: true,
    data: alerts,
    total: alerts.length
  });
}));

module.exports = router;
