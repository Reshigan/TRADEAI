const Product = require('../models/Product');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Create product
exports.createProduct = asyncHandler(async (req, res, next) => {
  const productData = {
    ...req.body,
    company: req.user.company,
    createdBy: req.user._id
  };

  const product = await Product.create(productData);

  logger.logAudit('product_created', req.user._id, {
    productId: product._id,
    productName: product.name,
    sku: product.sku
  });

  res.status(201).json({
    success: true,
    data: product
  });
});

// Get single product
exports.getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('company', 'name')
    .populate('createdBy', 'firstName lastName');

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check if user has access to this product
  if (product.company.toString() !== req.user.company.toString()) {
    throw new AppError('Access denied', 403);
  }

  // Transform product to match UI expectations
  const productObj = product.toObject();
  const transformedProduct = {
    ...productObj,
    price: productObj.unitPrice || 0,
    cost: productObj.costPrice || 0,
    stock: productObj.stock || 0,
    margin: productObj.unitPrice && productObj.costPrice 
      ? ((productObj.unitPrice - productObj.costPrice) / productObj.unitPrice * 100).toFixed(2)
      : 0
  };

  res.json({
    success: true,
    data: transformedProduct
  });
});

// Update product
exports.updateProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check if user has access to this product
  if (product.company.toString() !== req.user.company.toString()) {
    throw new AppError('Access denied', 403);
  }

  Object.assign(product, req.body);
  product.lastModifiedBy = req.user._id;
  
  await product.save();

  logger.logAudit('product_updated', req.user._id, {
    productId: product._id,
    productName: product.name,
    sku: product.sku
  });

  res.json({
    success: true,
    data: product
  });
});

// Delete product
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check if user has access to this product
  if (product.company.toString() !== req.user.company.toString()) {
    throw new AppError('Access denied', 403);
  }

  // Check if product is referenced in other documents
  const TradeSpend = require('../models/TradeSpend');
  const Promotion = require('../models/Promotion');
  
  const tradeSpendCount = await TradeSpend.countDocuments({ products: product._id });
  const promotionCount = await Promotion.countDocuments({ 'products.product': product._id });
  
  if (tradeSpendCount > 0 || promotionCount > 0) {
    throw new AppError('Cannot delete product with existing trade spends or promotions', 400);
  }

  await product.deleteOne();

  logger.logAudit('product_deleted', req.user._id, {
    productId: product._id,
    productName: product.name,
    sku: product.sku
  });

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// Get all products
exports.getProducts = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
    search,
    status,
    category,
    brand,
    minPrice,
    maxPrice,
    ...filters
  } = req.query;

  // Build query
  const query = { company: req.user.company };
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (status) {
    query.status = status;
  }
  
  if (category) {
    query.category = category;
  }
  
  if (brand) {
    query['attributes.brand'] = brand;
  }
  
  if (minPrice || maxPrice) {
    query['pricing.sellingPrice'] = {};
    if (minPrice) query['pricing.sellingPrice'].$gte = parseFloat(minPrice);
    if (maxPrice) query['pricing.sellingPrice'].$lte = parseFloat(maxPrice);
  }
  
  // Apply additional filters
  Object.assign(query, filters);

  const products = await Product.find(query)
    .populate('company', 'name')
    .populate('createdBy', 'firstName lastName')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Product.countDocuments(query);

  // Transform products to match UI expectations
  const transformedProducts = products.map(product => {
    const productObj = product.toObject();
    return {
      ...productObj,
      // Map DB field names to UI field names
      price: productObj.unitPrice || 0,
      cost: productObj.costPrice || 0,
      // Calculate missing fields
      stock: productObj.stock || 0,
      margin: productObj.unitPrice && productObj.costPrice 
        ? ((productObj.unitPrice - productObj.costPrice) / productObj.unitPrice * 100).toFixed(2)
        : 0
    };
  });

  res.json({
    success: true,
    data: transformedProducts,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  });
});

// Get product statistics
exports.getProductStats = asyncHandler(async (req, res, next) => {
  const stats = await Product.aggregate([
    { $match: { company: req.user.company } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
        avgPrice: { $avg: '$pricing.sellingPrice' },
        totalValue: { $sum: { $multiply: ['$pricing.sellingPrice', '$inventory.currentStock'] } }
      }
    }
  ]);

  const categoryStats = await Product.aggregate([
    { $match: { company: req.user.company } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgPrice: { $avg: '$pricing.sellingPrice' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const brandStats = await Product.aggregate([
    { $match: { company: req.user.company } },
    {
      $group: {
        _id: '$attributes.brand',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.json({
    success: true,
    data: {
      overview: stats[0] || { total: 0, active: 0, inactive: 0, avgPrice: 0, totalValue: 0 },
      byCategory: categoryStats,
      byBrand: brandStats
    }
  });
});

// Get product categories
exports.getProductCategories = asyncHandler(async (req, res, next) => {
  const categories = await Product.distinct('category', { company: req.user.company });
  
  res.json({
    success: true,
    data: categories.filter(cat => cat) // Remove null/undefined values
  });
});

// Get product brands
exports.getProductBrands = asyncHandler(async (req, res, next) => {
  const brands = await Product.distinct('attributes.brand', { company: req.user.company });
  
  res.json({
    success: true,
    data: brands.filter(brand => brand) // Remove null/undefined values
  });
});

// Bulk operations
exports.bulkUpdateProducts = asyncHandler(async (req, res, next) => {
  const { productIds, updates } = req.body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw new AppError('Product IDs are required', 400);
  }

  const result = await Product.updateMany(
    { 
      _id: { $in: productIds },
      company: req.user.company
    },
    {
      ...updates,
      lastModifiedBy: req.user._id,
      updatedAt: new Date()
    }
  );

  logger.logAudit('products_bulk_updated', req.user._id, {
    count: result.modifiedCount,
    updates
  });

  res.json({
    success: true,
    data: {
      matched: result.matchedCount,
      modified: result.modifiedCount
    }
  });
});

// Update product inventory
exports.updateProductInventory = asyncHandler(async (req, res, next) => {
  const { currentStock, reorderLevel, maxStock } = req.body;
  
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check if user has access to this product
  if (product.company.toString() !== req.user.company.toString()) {
    throw new AppError('Access denied', 403);
  }

  if (currentStock !== undefined) product.inventory.currentStock = currentStock;
  if (reorderLevel !== undefined) product.inventory.reorderLevel = reorderLevel;
  if (maxStock !== undefined) product.inventory.maxStock = maxStock;
  
  product.lastModifiedBy = req.user._id;
  await product.save();

  logger.logAudit('product_inventory_updated', req.user._id, {
    productId: product._id,
    productName: product.name,
    currentStock
  });

  res.json({
    success: true,
    data: product
  });
});