const Promotion = require('../models/Promotion');
const SalesHistory = require('../models/SalesHistory');
const Product = require('../models/Product');
// const Customer = require('../models/Customer');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const mlService = require('../services/mlService');
const BusinessRulesConfig = require('../models/BusinessRulesConfig');
const logger = require('../utils/logger');

// Create new promotion
exports.createPromotion = asyncHandler(async (req, res, _next) => {
  // Get tenant from request context
  const tenantId = req.tenantId || req.user.tenantId;
  if (!tenantId) {
    throw new AppError('Tenant context not found', 400);
  }

  // Generate promotion ID
  const promotionCount = await Promotion.countDocuments();
  const promotionId = `PROMO-${new Date().getFullYear()}-${String(promotionCount + 1).padStart(5, '0')}`;

  const promotionData = {
    ...req.body,
    promotionId,
    tenantId,
    createdBy: req.user._id,
    status: 'draft'
  };

  // Validate products are promotable
  const productIds = promotionData.products.map((p) => p.product);
  const products = await Product.find({ _id: { $in: productIds } });

  for (const product of products) {
    if (!product.isPromotableInPeriod(promotionData.period.startDate, promotionData.period.endDate)) {
      throw new AppError(`Product ${product.name} is not promotable in the selected period`, 400);
    }
  }

  // Load tenant business rules
  const rules = await BusinessRulesConfig.getOrCreate(tenantId);

  // Enforce duration limits
  const start = new Date(promotionData.period.startDate);
  const end = new Date(promotionData.period.endDate);
  const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  if (rules?.promotions?.duration?.minDays && durationDays < rules.promotions.duration.minDays) {
    throw new AppError(`Promotion duration (${durationDays} days) below minimum of ${rules.promotions.duration.minDays}`, 400);
  }
  if (rules?.promotions?.duration?.maxDays && durationDays > rules.promotions.duration.maxDays) {
    throw new AppError(`Promotion duration (${durationDays} days) exceeds maximum of ${rules.promotions.duration.maxDays}`, 400);
  }

  // Enforce discount caps
  const { discountType, discountValue } = promotionData.mechanics || {};
  const caps = rules?.promotions?.discountCaps || {};
  if (discountType === 'percentage' && typeof discountValue === 'number') {
    if (typeof caps.maxPercent === 'number' && discountValue > caps.maxPercent) {
      throw new AppError(`Discount ${discountValue}% exceeds cap of ${caps.maxPercent}%`, 400);
    }
  }
  if (discountType === 'fixed_amount' && typeof discountValue === 'number') {
    if (typeof caps.maxAbsolute === 'number' && caps.maxAbsolute > 0 && discountValue > caps.maxAbsolute) {
      throw new AppError(`Discount amount exceeds cap of ${caps.maxAbsolute}`, 400);
    }
  }

  // Check for overlapping promotions
  const overlapping = await Promotion.findOverlapping(
    promotionData.scope.customers[0]?.customer,
    productIds[0],
    promotionData.period.startDate,
    promotionData.period.endDate
  );

  if (overlapping.length > 0) {
    const stack = rules?.promotions?.stacking || {};
    // Enforce stacking/overlap rules
    if (stack.overlapPolicy === 'disallow' || stack.allowStacking === false) {
      throw new AppError('Overlapping promotions are not allowed by policy', 400);
    }
    if (typeof stack.maxStackedPromotions === 'number' && stack.maxStackedPromotions > 0) {
      const totalIfCreated = overlapping.length + 1;
      if (totalIfCreated > stack.maxStackedPromotions) {
        throw new AppError(`Stacking limit (${stack.maxStackedPromotions}) would be exceeded`, 400);
      }
    }

    promotionData.conflicts = overlapping.map((p) => ({
      promotion: p._id,
      type: 'overlap',
      severity: 'medium'
    }));
  }

  // Get AI predictions if requested
  if (req.body.generatePredictions) {
    const predictions = await mlService.predictPromotionEffectiveness({
      discountPercentage: promotionData.mechanics.discountValue,
      duration: Math.ceil((new Date(promotionData.period.endDate) - new Date(promotionData.period.startDate)) / (1000 * 60 * 60 * 24)),
      productCategory: products[0].category,
      customerSegment: 'regular', // Would be determined from customer data
      historicalPromotions: [] // Would fetch historical data
    });

    promotionData.aiAnalysis = {
      recommendedPrice: predictions.optimalPrice,
      recommendedVolumeLift: predictions.expectedLift,
      confidenceScore: predictions.confidenceScore,
      optimizationSuggestions: predictions.recommendedAdjustments
    };
  }

  const promotion = await Promotion.create(promotionData);

  logger.logAudit('promotion_created', req.user._id, {
    promotionId: promotion._id,
    name: promotion.name
  });

  res.status(201).json({
    success: true,
    data: promotion
  });
});

// Get all promotions
exports.getPromotions = asyncHandler(async (req, res, _next) => {
  const {
    status,
    promotionType,
    startDate,
    endDate,
    customer,
    customerId,
    product,
    productId,
    page = 1,
    limit = 20,
    sort = '-createdAt'
  } = req.query;

  const query = {};

  if (status) query.status = status;
  if (promotionType) query.promotionType = promotionType;

  if (startDate || endDate) {
    query['period.startDate'] = {};
    if (startDate) query['period.startDate'].$gte = new Date(startDate);
    if (endDate) query['period.startDate'].$lte = new Date(endDate);
  }

  if (customer || customerId) query['scope.customers.customer'] = customer || customerId;
  if (product || productId) query['products.product'] = product || productId;

  // Apply user-based filtering
  if (req.user.role === 'kam' || req.user.role === 'sales_rep') {
    query.$or = [
      { createdBy: req.user._id },
      { 'scope.customers.customer': { $in: req.user.assignedCustomers } }
    ];
  }

  const promotions = await Promotion.find(query)
    .populate('createdBy', 'firstName lastName')
    .populate('products.product', 'name sku')
    .populate('scope.customers.customer', 'name code')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Promotion.countDocuments(query);

  res.json({
    success: true,
    data: promotions,
    pagination: {
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit)
    }
  });
});

// Get single promotion
exports.getPromotion = asyncHandler(async (req, res, _next) => {
  const promotion = await Promotion.findById(req.params.id)
    .populate('createdBy', 'firstName lastName')
    .populate('products.product')
    .populate('scope.customers.customer')
    .populate('campaign', 'name campaignId')
    .populate('approvals.approver', 'firstName lastName');

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  res.json({
    success: true,
    data: promotion
  });
});

// Update promotion
exports.updatePromotion = asyncHandler(async (req, res, _next) => {
  const promotion = await Promotion.findById(req.params.id);

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  if (promotion.status !== 'draft') {
    throw new AppError('Only draft promotions can be updated', 400);
  }

  Object.assign(promotion, req.body);
  promotion.lastModifiedBy = req.user._id;

  await promotion.save();

  res.json({
    success: true,
    data: promotion
  });
});

// Submit for approval
exports.submitForApproval = asyncHandler(async (req, res, _next) => {
  const promotion = await Promotion.findById(req.params.id);

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  await promotion.submitForApproval(req.user._id);

  // Send notifications
  const io = req.app.get('io');
  io.to('role:manager').emit('approval_required', {
    type: 'promotion',
    id: promotion._id,
    name: promotion.name
  });

  res.json({
    success: true,
    message: 'Promotion submitted for approval',
    data: promotion
  });
});

// Approve promotion
exports.approvePromotion = asyncHandler(async (req, res, _next) => {
  const { comments } = req.body;
  const promotion = await Promotion.findById(req.params.id);

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  const approvalLevel = {
    kam: 'kam',
    manager: 'manager',
    director: 'director',
    admin: 'finance'
  }[req.user.role];

  await promotion.approve(approvalLevel, req.user._id, comments);

  res.json({
    success: true,
    message: 'Promotion approved',
    data: promotion
  });
});

// Calculate promotion performance
exports.calculatePerformance = asyncHandler(async (req, res, _next) => {
  const promotion = await Promotion.findById(req.params.id)
    .populate('products.product')
    .populate('scope.customers.customer');

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  // Get sales data for analysis windows
  const salesData = await SalesHistory.find({
    date: {
      $gte: promotion.analysisWindows.baseline.startDate,
      $lte: promotion.analysisWindows.post.endDate
    },
    product: { $in: promotion.products.map((p) => p.product._id) },
    customer: { $in: promotion.scope.customers.map((c) => c.customer._id) }
  });

  await promotion.calculatePerformance(salesData);

  // Calculate ROI
  const performance = {
    promotion: {
      id: promotion._id,
      name: promotion.name,
      period: promotion.period
    },
    baseline: promotion.performance.baseline,
    during: promotion.performance.promotion,
    post: promotion.performance.post,
    metrics: promotion.performance.metrics,
    roi: {
      incrementalRevenue: promotion.financial.actual.incrementalRevenue,
      totalCost: promotion.financial.costs.totalCost,
      netProfit: promotion.financial.profitability.netProfit,
      roiPercentage: promotion.financial.profitability.roi,
      paybackPeriod: promotion.financial.costs.totalCost > 0 ?
        promotion.financial.costs.totalCost / (promotion.financial.actual.incrementalRevenue / 30) : 0
    },
    effectiveness: {
      volumeLift: promotion.performance.metrics.trueLift,
      score: promotion.performance.metrics.score,
      rating: promotion.performance.metrics.score > 80 ? 'Excellent' :
        promotion.performance.metrics.score > 60 ? 'Good' :
          promotion.performance.metrics.score > 40 ? 'Average' : 'Poor'
    }
  };

  res.json({
    success: true,
    data: performance
  });
});

// Get promotion calendar
exports.getPromotionCalendar = asyncHandler(async (req, res, _next) => {
  const { year, month, view = 'month' } = req.query;

  let startDate, endDate;

  if (view === 'month') {
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0);
  } else if (view === 'quarter') {
    const quarter = Math.ceil(month / 3);
    startDate = new Date(year, (quarter - 1) * 3, 1);
    endDate = new Date(year, quarter * 3, 0);
  } else {
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31);
  }

  const promotions = await Promotion.find({
    $or: [
      {
        'period.startDate': { $gte: startDate, $lte: endDate }
      },
      {
        'period.endDate': { $gte: startDate, $lte: endDate }
      },
      {
        'period.startDate': { $lte: startDate },
        'period.endDate': { $gte: endDate }
      }
    ],
    status: { $in: ['approved', 'active', 'completed'] }
  })
    .populate('products.product', 'name')
    .populate('scope.customers.customer', 'name')
    .select('promotionId name period promotionType status financial.costs.totalCost');

  // Format for calendar view
  const calendarData = promotions.map((promo) => ({
    id: promo._id,
    title: promo.name,
    start: promo.period.startDate,
    end: promo.period.endDate,
    type: promo.promotionType,
    status: promo.status,
    cost: promo.financial.costs.totalCost,
    color: {
      price_discount: '#1976d2',
      volume_discount: '#388e3c',
      bogo: '#f57c00',
      bundle: '#7b1fa2',
      gift: '#c2185b'
    }[promo.promotionType] || '#757575'
  }));

  res.json({
    success: true,
    data: calendarData
  });
});

// Analyze cannibalization
exports.analyzeCannibalization = asyncHandler(async (req, res, _next) => {
  const promotion = await Promotion.findById(req.params.id)
    .populate('products.product');

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  // Find related products that might be cannibalized
  const promotedProducts = promotion.products.map((p) => p.product);
  const relatedProducts = await Product.find({
    _id: { $nin: promotedProducts.map((p) => p._id) },
    $or: [
      { category: { $in: promotedProducts.map((p) => p.category) } },
      { 'brand.name': { $in: promotedProducts.map((p) => p.brand.name) } }
    ]
  });

  // Get sales data during promotion period
  const salesData = await SalesHistory.aggregate([
    {
      $match: {
        date: {
          $gte: promotion.period.startDate,
          $lte: promotion.period.endDate
        },
        product: { $in: relatedProducts.map((p) => p._id) }
      }
    },
    {
      $group: {
        _id: '$product',
        totalVolume: { $sum: '$quantity' },
        totalRevenue: { $sum: '$revenue.gross' }
      }
    }
  ]);

  // Compare with baseline period
  const baselineData = await SalesHistory.aggregate([
    {
      $match: {
        date: {
          $gte: promotion.analysisWindows.baseline.startDate,
          $lte: promotion.analysisWindows.baseline.endDate
        },
        product: { $in: relatedProducts.map((p) => p._id) }
      }
    },
    {
      $group: {
        _id: '$product',
        avgVolume: { $avg: '$quantity' },
        avgRevenue: { $avg: '$revenue.gross' }
      }
    }
  ]);

  // Calculate cannibalization impact
  const cannibalizationAnalysis = relatedProducts.map((product) => {
    const duringPromo = salesData.find((s) => s._id.equals(product._id));
    const baseline = baselineData.find((b) => b._id.equals(product._id));

    if (!duringPromo || !baseline) return null;

    const volumeImpact = ((duringPromo.totalVolume - baseline.avgVolume) / baseline.avgVolume) * 100;
    const revenueImpact = ((duringPromo.totalRevenue - baseline.avgRevenue) / baseline.avgRevenue) * 100;

    return {
      product: {
        id: product._id,
        name: product.name,
        sku: product.sku
      },
      impact: {
        volumeChange: volumeImpact,
        revenueChange: revenueImpact,
        severity: Math.abs(volumeImpact) > 20 ? 'high' :
          Math.abs(volumeImpact) > 10 ? 'medium' : 'low'
      }
    };
  }).filter(Boolean);

  res.json({
    success: true,
    data: {
      promotionId: promotion._id,
      cannibalizationRisk: cannibalizationAnalysis.filter((c) => c.impact.volumeChange < -10).length > 0 ? 'high' : 'low',
      affectedProducts: cannibalizationAnalysis,
      recommendations: [
        'Consider bundling cannibalized products',
        'Adjust promotion timing to minimize overlap',
        'Create complementary promotions for affected products'
      ]
    }
  });
});

// Clone promotion
exports.clonePromotion = asyncHandler(async (req, res, _next) => {
  const originalPromotion = await Promotion.findById(req.params.id);

  if (!originalPromotion) {
    throw new AppError('Promotion not found', 404);
  }

  const promotionCount = await Promotion.countDocuments();
  const newPromotionId = `PROMO-${new Date().getFullYear()}-${String(promotionCount + 1).padStart(5, '0')}`;

  const clonedData = originalPromotion.toObject();
  delete clonedData._id;
  delete clonedData.createdAt;
  delete clonedData.updatedAt;

  const clonedPromotion = await Promotion.create({
    ...clonedData,
    promotionId: newPromotionId,
    name: `${clonedData.name} (Copy)`,
    status: 'draft',
    createdBy: req.user._id,
    approvals: [],
    history: [{
      action: 'cloned',
      performedBy: req.user._id,
      performedDate: new Date(),
      comment: `Cloned from ${originalPromotion.promotionId}`
    }]
  });

  res.status(201).json({
    success: true,
    message: 'Promotion cloned successfully',
    data: clonedPromotion
  });
});

// Delete promotion
exports.deletePromotion = asyncHandler(async (req, res, _next) => {
  const tenantId = req.tenantId || req.user.tenantId;

  const promotion = await Promotion.findOne({
    _id: req.params.id,
    tenantId
  });

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  // Only allow deletion of draft promotions
  if (promotion.status !== 'draft') {
    throw new AppError('Only draft promotions can be deleted', 400);
  }

  await promotion.deleteOne();

  res.json({
    success: true,
    message: 'Promotion deleted successfully'
  });
});

exports.getPromotionProducts = asyncHandler(async (req, res, _next) => {
  const promotion = await Promotion.findById(req.params.id)
    .populate('products.product');

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  res.json({
    success: true,
    data: promotion.products
  });
});

// Level 3: Add products to promotion
exports.addPromotionProducts = asyncHandler(async (req, res, _next) => {
  const promotion = await Promotion.findById(req.params.id);

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  if (promotion.status !== 'draft') {
    throw new AppError('Cannot modify products in non-draft promotion', 400);
  }

  promotion.products.push(...req.body.products);
  await promotion.save();

  res.json({
    success: true,
    data: promotion.products
  });
});

exports.updatePromotionProduct = asyncHandler(async (req, res, _next) => {
  const promotion = await Promotion.findById(req.params.id);

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  const productIndex = promotion.products.findIndex(
    (p) => p.product.toString() === req.params.productId
  );

  if (productIndex === -1) {
    throw new AppError('Product not found in promotion', 404);
  }

  Object.assign(promotion.products[productIndex], req.body);
  await promotion.save();

  res.json({
    success: true,
    data: promotion.products[productIndex]
  });
});

// Level 4: Remove product from promotion
exports.removePromotionProduct = asyncHandler(async (req, res, _next) => {
  const promotion = await Promotion.findById(req.params.id);

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  promotion.products = promotion.products.filter(
    (p) => p.product.toString() !== req.params.productId
  );

  await promotion.save();

  res.json({
    success: true,
    message: 'Product removed from promotion'
  });
});

exports.getPromotionCustomers = asyncHandler(async (req, res, _next) => {
  const promotion = await Promotion.findById(req.params.id)
    .populate('scope.customers.customer');

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  res.json({
    success: true,
    data: promotion.scope.customers
  });
});

// Level 3: Add customers to promotion
exports.addPromotionCustomers = asyncHandler(async (req, res, _next) => {
  const promotion = await Promotion.findById(req.params.id);

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  if (promotion.status !== 'draft') {
    throw new AppError('Cannot modify customers in non-draft promotion', 400);
  }

  promotion.scope.customers.push(...req.body.customers);
  await promotion.save();

  res.json({
    success: true,
    data: promotion.scope.customers
  });
});

// Level 4: Remove customer from promotion
exports.removePromotionCustomer = asyncHandler(async (req, res, _next) => {
  const promotion = await Promotion.findById(req.params.id);

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  promotion.scope.customers = promotion.scope.customers.filter(
    (c) => c.customer.toString() !== req.params.customerId
  );

  await promotion.save();

  res.json({
    success: true,
    message: 'Customer removed from promotion'
  });
});

exports.getPromotionBudget = asyncHandler(async (req, res, _next) => {
  const promotion = await Promotion.findById(req.params.id)
    .populate('budgetAllocation');

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  res.json({
    success: true,
    data: {
      budgetAllocation: promotion.budgetAllocation,
      financial: promotion.financial
    }
  });
});

exports.updatePromotionBudget = asyncHandler(async (req, res, _next) => {
  const promotion = await Promotion.findById(req.params.id);

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  if (req.body.budgetAllocation) {
    promotion.budgetAllocation = req.body.budgetAllocation;
  }

  if (req.body.financial) {
    Object.assign(promotion.financial, req.body.financial);
  }

  await promotion.save();

  res.json({
    success: true,
    data: {
      budgetAllocation: promotion.budgetAllocation,
      financial: promotion.financial
    }
  });
});

exports.getPromotionApprovals = asyncHandler(async (req, res, _next) => {
  const promotion = await Promotion.findById(req.params.id)
    .populate('approvals.approver', 'firstName lastName email role');

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  res.json({
    success: true,
    data: promotion.approvals
  });
});

exports.processApproval = asyncHandler(async (req, res, _next) => {
  const { action, comments } = req.body;
  const promotion = await Promotion.findById(req.params.id);

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  const approvalIndex = promotion.approvals.findIndex(
    (a) => a._id.toString() === req.params.approvalId
  );

  if (approvalIndex === -1) {
    throw new AppError('Approval not found', 404);
  }

  const approval = promotion.approvals[approvalIndex];

  if (action === 'approve') {
    approval.status = 'approved';
    approval.approvedDate = new Date();
    approval.approver = req.user._id;
    approval.comments = comments;
  } else if (action === 'reject') {
    approval.status = 'rejected';
    approval.approvedDate = new Date();
    approval.approver = req.user._id;
    approval.comments = comments;
    promotion.status = 'draft';
  } else if (action === 'reassign') {
    approval.approver = req.body.newApproverId;
  }

  promotion.history.push({
    action: `approval_${action}`,
    performedBy: req.user._id,
    performedDate: new Date(),
    comment: comments
  });

  await promotion.save();

  res.json({
    success: true,
    data: approval
  });
});

exports.getPromotionDocuments = asyncHandler(async (req, res, _next) => {
  const promotion = await Promotion.findById(req.params.id);

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  res.json({
    success: true,
    data: promotion.documents || []
  });
});

exports.addPromotionDocument = asyncHandler(async (req, res, _next) => {
  const promotion = await Promotion.findById(req.params.id);

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  if (!promotion.documents) {
    promotion.documents = [];
  }

  promotion.documents.push({
    ...req.body,
    uploadedBy: req.user._id,
    uploadedDate: new Date()
  });

  await promotion.save();

  res.json({
    success: true,
    data: promotion.documents
  });
});

exports.removePromotionDocument = asyncHandler(async (req, res, _next) => {
  const promotion = await Promotion.findById(req.params.id);

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  promotion.documents = promotion.documents.filter(
    (d) => d._id.toString() !== req.params.documentId
  );

  await promotion.save();

  res.json({
    success: true,
    message: 'Document removed'
  });
});

exports.getPromotionConflicts = asyncHandler(async (req, res, _next) => {
  const promotion = await Promotion.findById(req.params.id)
    .populate('conflicts.promotion', 'promotionId name period');

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  res.json({
    success: true,
    data: promotion.conflicts || []
  });
});

// Level 3: Get promotion performance
exports.getPromotionPerformance = asyncHandler(async (req, res, _next) => {
  const promotion = await Promotion.findById(req.params.id);

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  res.json({
    success: true,
    data: {
      performance: promotion.performance,
      financial: promotion.financial,
      aiPredictions: promotion.aiPredictions,
      postEventAnalysis: promotion.postEventAnalysis
    }
  });
});

exports.getPromotionHistory = asyncHandler(async (req, res, _next) => {
  const promotion = await Promotion.findById(req.params.id)
    .populate('history.performedBy', 'firstName lastName email');

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  res.json({
    success: true,
    data: promotion.history || []
  });
});
