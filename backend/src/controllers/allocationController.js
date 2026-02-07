const Allocation = require('../models/Allocation');
const allocationService = require('../services/allocationService');
const scopeResolver = require('../utils/scopeResolver');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const BusinessRulesConfig = require('../models/BusinessRulesConfig');
const logger = require('../utils/logger');

/**
 * Allocation Controller
 * Handles proportional allocation operations for hierarchies
 */

// Preview allocation without persisting
exports.previewAllocation = asyncHandler(async (req, res, _next) => {
  const companyId = req.user.companyId || req.user.company;
  const {
    entityType,
    selector,
    amount,
    metric = 'revenue',
    periodStart,
    periodEnd
  } = req.body;

  if (!entityType || !['product', 'customer'].includes(entityType)) {
    throw new AppError('entityType must be "product" or "customer"', 400);
  }

  if (!selector) {
    throw new AppError('selector is required', 400);
  }

  if (!amount || amount <= 0) {
    throw new AppError('amount must be a positive number', 400);
  }

  if (!periodStart || !periodEnd) {
    throw new AppError('periodStart and periodEnd are required', 400);
  }

  const preview = await allocationService.previewAllocation(
    companyId,
    entityType,
    selector,
    amount,
    metric,
    new Date(periodStart),
    new Date(periodEnd)
  );

  res.json({
    success: true,
    data: preview
  });
});

// Execute and persist allocation
exports.createAllocation = asyncHandler(async (req, res, _next) => {
  const companyId = req.user.companyId || req.user.company;
  const userId = req.user._id;
  const {
    sourceType,
    sourceId,
    sourceName,
    entityType,
    selector,
    amount,
    metric = 'revenue',
    periodStart,
    periodEnd,
    notes
  } = req.body;

  if (!sourceType || !sourceId) {
    throw new AppError('sourceType and sourceId are required', 400);
  }

  if (!entityType || !['product', 'customer'].includes(entityType)) {
    throw new AppError('entityType must be "product" or "customer"', 400);
  }

  const rules = companyId ? await BusinessRulesConfig.getOrCreate(companyId) : null;
  const budgetCaps = rules?.budgets?.allocationCaps || {};

  if (budgetCaps.overallPercentOfRevenue > 0 && req.body.revenueBase) {
    const maxAlloc = req.body.revenueBase * (budgetCaps.overallPercentOfRevenue / 100);
    if (amount > maxAlloc) {
      throw new AppError(
        `Allocation ${amount} exceeds ${budgetCaps.overallPercentOfRevenue}% of revenue cap (${maxAlloc})`,
        400
      );
    }
  }

  const result = await allocationService.executeAllocation(
    companyId,
    sourceType,
    sourceId,
    entityType,
    selector,
    amount,
    metric,
    new Date(periodStart),
    new Date(periodEnd),
    userId
  );

  if (!result.success) {
    throw new AppError(result.error || 'Allocation failed', 400);
  }

  const existingAllocation = await Allocation.findBySource(companyId, sourceType, sourceId);
  if (existingAllocation) {
    await existingAllocation.supersede(null, userId, 'New allocation created');
  }

  const allocation = new Allocation({
    company: companyId,
    sourceType,
    sourceId,
    sourceName,
    allocationDimension: entityType,
    selector,
    basisMetric: metric,
    periodStart: new Date(periodStart),
    periodEnd: new Date(periodEnd),
    totalAmount: amount,
    totalAllocated: result.metadata.totalAllocated,
    allocations: result.allocation.allocations,
    hasHistoricalData: result.metadata.hasHistoricalData,
    fallbackUsed: result.metadata.hasHistoricalData ? 'none' : 'equal_split',
    notes,
    createdBy: userId,
    auditTrail: [{
      action: 'created',
      performedBy: userId,
      performedAt: new Date(),
      notes: 'Initial allocation created'
    }]
  });

  if (existingAllocation) {
    allocation.version = existingAllocation.version + 1;
    allocation.parentAllocation = existingAllocation._id;
  }

  await allocation.save();

  logger.logAudit('allocation_created', userId, {
    allocationId: allocation._id,
    sourceType,
    sourceId,
    entityCount: allocation.allocations.length
  });

  res.status(201).json({
    success: true,
    message: 'Allocation created successfully',
    data: { allocation }
  });
});

// Get allocation by ID
exports.getAllocation = asyncHandler(async (req, res, _next) => {
  const companyId = req.user.companyId || req.user.company;
  const { id } = req.params;

  const allocation = await Allocation.findOne({
    _id: id,
    company: companyId
  }).populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');

  if (!allocation) {
    throw new AppError('Allocation not found', 404);
  }

  res.json({
    success: true,
    data: { allocation }
  });
});

// Get allocation by source
exports.getAllocationBySource = asyncHandler(async (req, res, _next) => {
  const companyId = req.user.companyId || req.user.company;
  const { sourceType, sourceId } = req.params;

  const allocation = await Allocation.findBySource(companyId, sourceType, sourceId);

  if (!allocation) {
    return res.json({
      success: true,
      data: { allocation: null }
    });
  }

  res.json({
    success: true,
    data: { allocation }
  });
});

// Get all allocations for a source (including history)
exports.getAllocationHistory = asyncHandler(async (req, res, _next) => {
  const companyId = req.user.companyId || req.user.company;
  const { sourceType, sourceId } = req.params;

  const allocations = await Allocation.findAllBySource(companyId, sourceType, sourceId);

  res.json({
    success: true,
    data: { allocations }
  });
});

// Update allocation actuals
exports.updateActuals = asyncHandler(async (req, res, _next) => {
  const companyId = req.user.companyId || req.user.company;
  const userId = req.user._id;
  const { id } = req.params;
  const { actuals } = req.body;

  if (!actuals || !Array.isArray(actuals)) {
    throw new AppError('actuals array is required', 400);
  }

  const allocation = await Allocation.findOne({
    _id: id,
    company: companyId,
    status: 'active'
  });

  if (!allocation) {
    throw new AppError('Allocation not found', 404);
  }

  await allocation.updateActuals(actuals);

  logger.logAudit('allocation_actuals_updated', userId, {
    allocationId: allocation._id,
    actualsCount: actuals.length
  });

  res.json({
    success: true,
    message: 'Actuals updated successfully',
    data: { allocation }
  });
});

// Recalculate allocation with new period
exports.recalculateAllocation = asyncHandler(async (req, res, _next) => {
  const companyId = req.user.companyId || req.user.company;
  const userId = req.user._id;
  const { id } = req.params;
  const { newPeriodEnd } = req.body;

  const existingAllocation = await Allocation.findOne({
    _id: id,
    company: companyId,
    status: 'active'
  });

  if (!existingAllocation) {
    throw new AppError('Allocation not found', 404);
  }

  const result = await allocationService.recalculateAllocation(
    existingAllocation,
    newPeriodEnd ? new Date(newPeriodEnd) : null
  );

  if (!result.success) {
    throw new AppError(result.error || 'Recalculation failed', 400);
  }

  await existingAllocation.supersede(null, userId, 'Recalculated');

  const newAllocation = new Allocation({
    company: companyId,
    sourceType: existingAllocation.sourceType,
    sourceId: existingAllocation.sourceId,
    sourceName: existingAllocation.sourceName,
    allocationDimension: existingAllocation.allocationDimension,
    selector: existingAllocation.selector,
    basisMetric: existingAllocation.basisMetric,
    periodStart: existingAllocation.periodStart,
    periodEnd: newPeriodEnd ? new Date(newPeriodEnd) : existingAllocation.periodEnd,
    totalAmount: existingAllocation.totalAmount,
    totalAllocated: result.metadata.totalAllocated,
    allocations: result.allocation.allocations,
    hasHistoricalData: result.metadata.hasHistoricalData,
    version: existingAllocation.version + 1,
    parentAllocation: existingAllocation._id,
    createdBy: userId,
    auditTrail: [{
      action: 'recalculated',
      performedBy: userId,
      performedAt: new Date(),
      notes: 'Allocation recalculated'
    }]
  });

  await newAllocation.save();

  logger.logAudit('allocation_recalculated', userId, {
    oldAllocationId: existingAllocation._id,
    newAllocationId: newAllocation._id
  });

  res.json({
    success: true,
    message: 'Allocation recalculated successfully',
    data: { allocation: newAllocation }
  });
});

// Get hierarchy tree for selection UI
exports.getHierarchyTree = asyncHandler(async (req, res, _next) => {
  const companyId = req.user.companyId || req.user.company;
  const { entityType } = req.params;
  const { rootLevel = 1, maxDepth = 5 } = req.query;

  if (!entityType || !['product', 'customer'].includes(entityType)) {
    throw new AppError('entityType must be "product" or "customer"', 400);
  }

  const tree = await scopeResolver.getHierarchyTree(
    companyId,
    entityType,
    parseInt(rootLevel),
    parseInt(maxDepth)
  );

  res.json({
    success: true,
    data: { tree }
  });
});

// List allocations with filters
exports.listAllocations = asyncHandler(async (req, res, _next) => {
  const companyId = req.user.companyId || req.user.company;
  const {
    page = 1,
    limit = 20,
    sourceType,
    status,
    entityType,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const query = { company: companyId };

  if (sourceType) query.sourceType = sourceType;
  if (status) query.status = status;
  if (entityType) query.allocationDimension = entityType;

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const allocations = await Allocation.find(query)
    .populate('createdBy', 'firstName lastName')
    .sort(sort)
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await Allocation.countDocuments(query);

  res.json({
    success: true,
    data: {
      allocations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// Delete/archive allocation
exports.archiveAllocation = asyncHandler(async (req, res, _next) => {
  const companyId = req.user.companyId || req.user.company;
  const userId = req.user._id;
  const { id } = req.params;

  const allocation = await Allocation.findOne({
    _id: id,
    company: companyId
  });

  if (!allocation) {
    throw new AppError('Allocation not found', 404);
  }

  allocation.status = 'archived';
  allocation.updatedBy = userId;
  allocation.auditTrail.push({
    action: 'archived',
    performedBy: userId,
    performedAt: new Date(),
    notes: 'Allocation archived'
  });

  await allocation.save();

  logger.logAudit('allocation_archived', userId, {
    allocationId: allocation._id
  });

  res.json({
    success: true,
    message: 'Allocation archived successfully'
  });
});

// Get allocation statistics
exports.getAllocationStats = asyncHandler(async (req, res, _next) => {
  const companyId = req.user.companyId || req.user.company;

  const stats = await Allocation.aggregate([
    { $match: { company: companyId, status: 'active' } },
    {
      $group: {
        _id: '$sourceType',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        avgEntityCount: { $avg: '$statistics.entityCount' }
      }
    }
  ]);

  const totalActive = await Allocation.countDocuments({
    company: companyId,
    status: 'active'
  });

  res.json({
    success: true,
    data: {
      totalActive,
      bySourceType: stats
    }
  });
});
