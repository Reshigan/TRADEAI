const Rebate = require('../models/Rebate');
const RebateAccrual = require('../models/RebateAccrual');
const rebateCalculationService = require('../services/rebateCalculationService');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * Get all rebates with optional filtering
 */
exports.getAllRebates = async (req, res) => {
  try {
    const { status, type, customer, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (customer) query.eligibleCustomers = customer;
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [rebates, total] = await Promise.all([
      Rebate.find(query)
        .populate('eligibleCustomers', 'name code')
        .populate('eligibleProducts', 'name sku')
        .populate('createdBy', 'firstName lastName email')
        .populate('approvedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Rebate.countDocuments(query)
    ]);

    return successResponse(res, {
      rebates,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching rebates:', error);
    return errorResponse(res, 'Failed to fetch rebates', 500);
  }
};

/**
 * Get rebate by ID
 */
exports.getRebateById = async (req, res) => {
  try {
    const rebate = await Rebate.findById(req.params.id)
      .populate('eligibleCustomers', 'name code type territory')
      .populate('eligibleProducts', 'name sku category')
      .populate('createdBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email');

    if (!rebate) {
      return errorResponse(res, 'Rebate not found', 404);
    }

    return successResponse(res, { rebate });
  } catch (error) {
    logger.error('Error fetching rebate:', error);
    return errorResponse(res, 'Failed to fetch rebate', 500);
  }
};

/**
 * Create new rebate
 */
exports.createRebate = async (req, res) => {
  try {
    const rebateData = {
      ...req.body,
      createdBy: req.user._id,
      status: 'draft'
    };

    const rebate = new Rebate(rebateData);
    await rebate.save();

    await rebate.populate('eligibleCustomers eligibleProducts createdBy');

    logger.info(`Rebate created: ${rebate.name} by user ${req.user.email}`);
    return successResponse(res, { rebate }, 'Rebate created successfully', 201);
  } catch (error) {
    logger.error('Error creating rebate:', error);
    return errorResponse(res, error.message || 'Failed to create rebate', 400);
  }
};

/**
 * Update rebate
 */
exports.updateRebate = async (req, res) => {
  try {
    const rebate = await Rebate.findById(req.params.id);
    if (!rebate) {
      return errorResponse(res, 'Rebate not found', 404);
    }

    // Don't allow updating approved rebates directly
    if (rebate.status === 'active' && !req.user.role.includes('admin')) {
      return errorResponse(res, 'Cannot update active rebate without admin privileges', 403);
    }

    Object.assign(rebate, req.body);
    await rebate.save();

    await rebate.populate('eligibleCustomers eligibleProducts createdBy approvedBy');

    logger.info(`Rebate updated: ${rebate.name} by user ${req.user.email}`);
    return successResponse(res, { rebate }, 'Rebate updated successfully');
  } catch (error) {
    logger.error('Error updating rebate:', error);
    return errorResponse(res, error.message || 'Failed to update rebate', 400);
  }
};

/**
 * Delete rebate
 */
exports.deleteRebate = async (req, res) => {
  try {
    const rebate = await Rebate.findById(req.params.id);
    if (!rebate) {
      return errorResponse(res, 'Rebate not found', 404);
    }

    // Check if rebate has accruals
    const accrualCount = await RebateAccrual.countDocuments({ rebateId: rebate._id });
    if (accrualCount > 0 && !req.user.role.includes('admin')) {
      return errorResponse(res, 'Cannot delete rebate with existing accruals', 403);
    }

    await rebate.deleteOne();

    logger.info(`Rebate deleted: ${rebate.name} by user ${req.user.email}`);
    return successResponse(res, null, 'Rebate deleted successfully');
  } catch (error) {
    logger.error('Error deleting rebate:', error);
    return errorResponse(res, 'Failed to delete rebate', 500);
  }
};

/**
 * Approve rebate (change status to active)
 */
exports.approveRebate = async (req, res) => {
  try {
    const rebate = await Rebate.findById(req.params.id);
    if (!rebate) {
      return errorResponse(res, 'Rebate not found', 404);
    }

    if (rebate.status === 'active') {
      return errorResponse(res, 'Rebate is already active', 400);
    }

    // Validate required fields
    if (!rebate.startDate || !rebate.endDate) {
      return errorResponse(res, 'Start and end dates are required for activation', 400);
    }

    if (rebate.calculationType === 'percentage' && !rebate.rate) {
      return errorResponse(res, 'Rate is required for percentage-based rebates', 400);
    }

    rebate.status = 'active';
    rebate.approvedBy = req.user._id;
    rebate.approvedAt = new Date();
    await rebate.save();

    await rebate.populate('eligibleCustomers eligibleProducts createdBy approvedBy');

    logger.info(`Rebate approved: ${rebate.name} by user ${req.user.email}`);
    return successResponse(res, { rebate }, 'Rebate approved and activated');
  } catch (error) {
    logger.error('Error approving rebate:', error);
    return errorResponse(res, 'Failed to approve rebate', 500);
  }
};

/**
 * Deactivate rebate
 */
exports.deactivateRebate = async (req, res) => {
  try {
    const rebate = await Rebate.findById(req.params.id);
    if (!rebate) {
      return errorResponse(res, 'Rebate not found', 404);
    }

    rebate.status = 'inactive';
    await rebate.save();

    await rebate.populate('eligibleCustomers eligibleProducts createdBy approvedBy');

    logger.info(`Rebate deactivated: ${rebate.name} by user ${req.user.email}`);
    return successResponse(res, { rebate }, 'Rebate deactivated');
  } catch (error) {
    logger.error('Error deactivating rebate:', error);
    return errorResponse(res, 'Failed to deactivate rebate', 500);
  }
};

/**
 * Calculate rebates for a transaction
 */
exports.calculateRebatesForTransaction = async (req, res) => {
  try {
    const transaction = req.body;
    
    if (!transaction.amount && !transaction.totalAmount) {
      return errorResponse(res, 'Transaction amount is required', 400);
    }

    const rebates = await rebateCalculationService.calculateRebatesForTransaction(transaction);
    const totalRebateAmount = rebates.reduce((sum, r) => sum + r.rebateAmount, 0);

    return successResponse(res, {
      applicableRebates: rebates,
      totalRebateAmount,
      netAmount: (transaction.amount || transaction.totalAmount) - totalRebateAmount
    });
  } catch (error) {
    logger.error('Error calculating rebates:', error);
    return errorResponse(res, 'Failed to calculate rebates', 500);
  }
};

/**
 * Get rebate accruals with filtering
 */
exports.getRebateAccruals = async (req, res) => {
  try {
    const { rebateId, customerId, period, status, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (rebateId) query.rebateId = rebateId;
    if (customerId) query.customerId = customerId;
    if (period) query.period = period;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [accruals, total] = await Promise.all([
      RebateAccrual.find(query)
        .populate('rebateId', 'name type calculationType')
        .populate('customerId', 'name code')
        .sort({ period: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      RebateAccrual.countDocuments(query)
    ]);

    // Calculate summary
    const summary = {
      totalAccrued: accruals.reduce((sum, a) => sum + (a.accruedAmount || 0), 0),
      totalSettled: accruals.reduce((sum, a) => sum + (a.settledAmount || 0), 0),
      totalRemaining: accruals.reduce((sum, a) => sum + (a.remainingAmount || 0), 0)
    };

    return successResponse(res, {
      accruals,
      summary,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching accruals:', error);
    return errorResponse(res, 'Failed to fetch accruals', 500);
  }
};

/**
 * Accrue rebates for a period
 */
exports.accrueRebatesForPeriod = async (req, res) => {
  try {
    const { period } = req.body; // Format: "2024-01"
    
    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      return errorResponse(res, 'Valid period is required (format: YYYY-MM)', 400);
    }

    const accruals = await rebateCalculationService.accrueRebatesForPeriod(period);

    logger.info(`Rebates accrued for period ${period} by user ${req.user.email}`);
    return successResponse(res, { accruals, period }, 'Rebates accrued successfully');
  } catch (error) {
    logger.error('Error accruing rebates:', error);
    return errorResponse(res, 'Failed to accrue rebates', 500);
  }
};

/**
 * Get rebate statistics
 */
exports.getRebateStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const query = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const [totalRebates, activeRebates, draftRebates, inactiveRebates] = await Promise.all([
      Rebate.countDocuments(query),
      Rebate.countDocuments({ ...query, status: 'active' }),
      Rebate.countDocuments({ ...query, status: 'draft' }),
      Rebate.countDocuments({ ...query, status: 'inactive' })
    ]);

    // Get rebate types distribution
    const rebatesByType = await Rebate.aggregate([
      { $match: query },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get top rebates by total accrued
    const topRebates = await Rebate.find(query)
      .select('name type totalAccrued totalPaid totalRemaining status')
      .sort({ totalAccrued: -1 })
      .limit(10);

    return successResponse(res, {
      summary: {
        total: totalRebates,
        active: activeRebates,
        draft: draftRebates,
        inactive: inactiveRebates
      },
      rebatesByType: rebatesByType.map(r => ({ type: r._id, count: r.count })),
      topRebates
    });
  } catch (error) {
    logger.error('Error fetching rebate statistics:', error);
    return errorResponse(res, 'Failed to fetch statistics', 500);
  }
};

/**
 * Calculate net margin with rebates
 */
exports.calculateNetMargin = async (req, res) => {
  try {
    const transaction = req.body;
    
    if (!transaction.amount && !transaction.totalAmount) {
      return errorResponse(res, 'Transaction amount is required', 400);
    }

    const marginAnalysis = await rebateCalculationService.calculateNetMargin(transaction);

    return successResponse(res, marginAnalysis);
  } catch (error) {
    logger.error('Error calculating net margin:', error);
    return errorResponse(res, 'Failed to calculate net margin', 500);
  }
};

/**
 * Get rebate history for a customer
 */
exports.getCustomerRebateHistory = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = { customerId };
    if (startDate || endDate) {
      query.period = {};
      if (startDate) query.period.$gte = startDate;
      if (endDate) query.period.$lte = endDate;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [accruals, total] = await Promise.all([
      RebateAccrual.find(query)
        .populate('rebateId', 'name type rate')
        .sort({ period: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      RebateAccrual.countDocuments(query)
    ]);

    const summary = {
      totalAccrued: accruals.reduce((sum, a) => sum + (a.accruedAmount || 0), 0),
      totalSettled: accruals.reduce((sum, a) => sum + (a.settledAmount || 0), 0),
      totalRemaining: accruals.reduce((sum, a) => sum + (a.remainingAmount || 0), 0)
    };

    return successResponse(res, {
      accruals,
      summary,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching customer rebate history:', error);
    return errorResponse(res, 'Failed to fetch rebate history', 500);
  }
};
