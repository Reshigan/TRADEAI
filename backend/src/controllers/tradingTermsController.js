const TradingTerm = require('../models/TradingTerm');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Trading Terms Controller
 * Manages trading terms for companies
 * PRODUCTION: All mock data removed - using real MongoDB only
 */

// Get all trading terms
exports.getTradingTerms = asyncHandler(async (req, res, _next) => {
  const {
    page = 1,
    limit = 10,
    search,
    termType,
    status,
    priority,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const currentUser = req.user;

  // Build query based on user role
  const query = {};

  // Non-super admins can only see terms from their company
  if (currentUser.role !== 'super_admin') {
    query.company = currentUser.companyId;
  }

  // Apply filters
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  if (termType) query.termType = termType;
  if (status) query['approvalWorkflow.status'] = status;
  if (priority) query.priority = priority;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const tradingTerms = await TradingTerm.find(query)
    .populate('company', 'name code')
    .populate('createdBy', 'firstName lastName')
    .populate('approvalWorkflow.submittedBy', 'firstName lastName')
    .populate('approvalWorkflow.approvedBy', 'firstName lastName')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await TradingTerm.countDocuments(query);

  res.json({
    success: true,
    data: {
      tradingTerms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get single trading term
exports.getTradingTerm = asyncHandler(async (req, res, _next) => {
  const { id } = req.params;
  const currentUser = req.user;

  const query = { _id: id };

  // Non-super admins can only view terms from their company
  if (currentUser.role !== 'super_admin') {
    query.company = currentUser.companyId;
  }

  const tradingTerm = await TradingTerm.findOne(query)
    .populate('company', 'name code currency')
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email')
    .populate('approvalWorkflow.submittedBy', 'firstName lastName email')
    .populate('approvalWorkflow.approvedBy', 'firstName lastName email')
    .populate('applicability.customers.customer', 'name code')
    .populate('applicability.products.product', 'name code');

  if (!tradingTerm) {
    throw new AppError('Trading term not found', 404);
  }

  res.json({
    success: true,
    data: { tradingTerm }
  });
});

// Create new trading term
exports.createTradingTerm = asyncHandler(async (req, res, _next) => {
  const currentUser = req.user;

  // Check permissions
  if (!currentUser.hasPermission('tradingterms', 'write')) {
    throw new AppError('Insufficient permissions to create trading terms', 403);
  }

  const tradingTermData = {
    ...req.body,
    company: currentUser.companyId,
    createdBy: currentUser._id,
    approvalWorkflow: {
      status: 'draft',
      submittedBy: currentUser._id,
      submittedAt: new Date()
    }
  };

  // Validate required fields
  if (!tradingTermData.name || !tradingTermData.code || !tradingTermData.termType) {
    throw new AppError('Name, code, and term type are required', 400);
  }

  // Check if code already exists for this company
  const existingTerm = await TradingTerm.findOne({
    company: currentUser.companyId,
    code: tradingTermData.code.toUpperCase()
  });

  if (existingTerm) {
    throw new AppError('Trading term with this code already exists', 400);
  }

  // Ensure code is uppercase
  tradingTermData.code = tradingTermData.code.toUpperCase();

  const tradingTerm = await TradingTerm.create(tradingTermData);

  // Log creation
  logger.logAudit('trading_term_created', currentUser._id, {
    tradingTermId: tradingTerm._id,
    name: tradingTerm.name,
    code: tradingTerm.code
  });

  // Return populated trading term
  const populatedTerm = await TradingTerm.findById(tradingTerm._id)
    .populate('company', 'name code')
    .populate('createdBy', 'firstName lastName');

  res.status(201).json({
    success: true,
    message: 'Trading term created successfully',
    data: { tradingTerm: populatedTerm }
  });
});

// Update trading term
exports.updateTradingTerm = asyncHandler(async (req, res, _next) => {
  const { id } = req.params;
  const currentUser = req.user;
  const updates = req.body;

  // Find trading term
  const query = { _id: id };
  if (currentUser.role !== 'super_admin') {
    query.company = currentUser.companyId;
  }

  const tradingTerm = await TradingTerm.findOne(query);
  if (!tradingTerm) {
    throw new AppError('Trading term not found', 404);
  }

  // Check permissions
  if (!currentUser.hasPermission('tradingterms', 'write')) {
    throw new AppError('Insufficient permissions to update trading terms', 403);
  }

  // Prevent updates to approved terms unless user can approve
  if (tradingTerm.approvalWorkflow.status === 'approved' &&
      !currentUser.hasPermission('tradingterms', 'approve')) {
    throw new AppError('Cannot modify approved trading terms', 403);
  }

  // If code is being updated, check for duplicates
  if (updates.code && updates.code !== tradingTerm.code) {
    const existingTerm = await TradingTerm.findOne({
      company: currentUser.companyId,
      code: updates.code.toUpperCase(),
      _id: { $ne: id }
    });

    if (existingTerm) {
      throw new AppError('Trading term with this code already exists', 400);
    }

    updates.code = updates.code.toUpperCase();
  }

  // Add audit trail entry
  const auditEntry = {
    action: 'updated',
    performedBy: currentUser._id,
    performedAt: new Date(),
    changes: Object.keys(updates),
    notes: updates.notes || 'Trading term updated'
  };

  updates.updatedBy = currentUser._id;
  updates.$push = { auditTrail: auditEntry };

  const updatedTerm = await TradingTerm.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  ).populate('company', 'name code')
    .populate('updatedBy', 'firstName lastName');

  // Log update
  logger.logAudit('trading_term_updated', currentUser._id, {
    tradingTermId: tradingTerm._id,
    changes: Object.keys(updates)
  });

  res.json({
    success: true,
    message: 'Trading term updated successfully',
    data: { tradingTerm: updatedTerm }
  });
});

// Delete trading term
exports.deleteTradingTerm = asyncHandler(async (req, res, _next) => {
  const { id } = req.params;
  const currentUser = req.user;

  // Find trading term
  const query = { _id: id };
  if (currentUser.role !== 'super_admin') {
    query.company = currentUser.companyId;
  }

  const tradingTerm = await TradingTerm.findOne(query);
  if (!tradingTerm) {
    throw new AppError('Trading term not found', 404);
  }

  // Check permissions
  if (!currentUser.hasPermission('tradingterms', 'delete')) {
    throw new AppError('Insufficient permissions to delete trading terms', 403);
  }

  // Prevent deletion of approved terms unless user is admin
  if (tradingTerm.approvalWorkflow.status === 'approved' &&
      currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
    throw new AppError('Cannot delete approved trading terms', 403);
  }

  // Soft delete (deactivate)
  await TradingTerm.findByIdAndUpdate(id, {
    isActive: false,
    updatedBy: currentUser._id,
    $push: {
      auditTrail: {
        action: 'deleted',
        performedBy: currentUser._id,
        performedAt: new Date(),
        notes: 'Trading term deleted'
      }
    }
  });

  // Log deletion
  logger.logAudit('trading_term_deleted', currentUser._id, {
    tradingTermId: tradingTerm._id,
    name: tradingTerm.name
  });

  res.json({
    success: true,
    message: 'Trading term deleted successfully'
  });
});

// Submit trading term for approval
exports.submitForApproval = asyncHandler(async (req, res, _next) => {
  const { id } = req.params;
  const currentUser = req.user;

  // Find trading term
  const query = { _id: id };
  if (currentUser.role !== 'super_admin') {
    query.company = currentUser.companyId;
  }

  const tradingTerm = await TradingTerm.findOne(query);
  if (!tradingTerm) {
    throw new AppError('Trading term not found', 404);
  }

  // Check if term is in draft status
  if (tradingTerm.approvalWorkflow.status !== 'draft') {
    throw new AppError('Only draft terms can be submitted for approval', 400);
  }

  // Update approval workflow
  await TradingTerm.findByIdAndUpdate(id, {
    'approvalWorkflow.status': 'pending_approval',
    'approvalWorkflow.submittedBy': currentUser._id,
    'approvalWorkflow.submittedAt': new Date(),
    $push: {
      auditTrail: {
        action: 'submitted_for_approval',
        performedBy: currentUser._id,
        performedAt: new Date(),
        notes: 'Trading term submitted for approval'
      }
    }
  });

  // Log submission
  logger.logAudit('trading_term_submitted', currentUser._id, {
    tradingTermId: tradingTerm._id,
    name: tradingTerm.name
  });

  res.json({
    success: true,
    message: 'Trading term submitted for approval successfully'
  });
});

// Approve/Reject trading term
exports.approveRejectTradingTerm = asyncHandler(async (req, res, _next) => {
  const { id } = req.params;
  const { action, notes } = req.body; // action: 'approve' or 'reject'
  const currentUser = req.user;

  // Check approval permissions
  if (!currentUser.hasPermission('tradingterms', 'approve')) {
    throw new AppError('Insufficient permissions to approve trading terms', 403);
  }

  // Find trading term
  const query = { _id: id };
  if (currentUser.role !== 'super_admin') {
    query.company = currentUser.companyId;
  }

  const tradingTerm = await TradingTerm.findOne(query);
  if (!tradingTerm) {
    throw new AppError('Trading term not found', 404);
  }

  // Check if term is pending approval
  if (tradingTerm.approvalWorkflow.status !== 'pending_approval') {
    throw new AppError('Only pending terms can be approved or rejected', 400);
  }

  // Validate action
  if (!['approve', 'reject'].includes(action)) {
    throw new AppError('Invalid action. Must be "approve" or "reject"', 400);
  }

  // Update approval workflow
  const updates = {
    'approvalWorkflow.status': action === 'approve' ? 'approved' : 'rejected',
    'approvalWorkflow.approvedBy': currentUser._id,
    'approvalWorkflow.approvedAt': new Date(),
    $push: {
      auditTrail: {
        action: action === 'approve' ? 'approved' : 'rejected',
        performedBy: currentUser._id,
        performedAt: new Date(),
        notes: notes || `Trading term ${action}d`
      }
    }
  };

  if (action === 'reject') {
    updates['approvalWorkflow.rejectionReason'] = notes;
  } else {
    updates['approvalWorkflow.approvalNotes'] = notes;
  }

  await TradingTerm.findByIdAndUpdate(id, updates);

  // Log approval/rejection
  logger.logAudit(`trading_term_${action}d`, currentUser._id, {
    tradingTermId: tradingTerm._id,
    name: tradingTerm.name
  });

  res.json({
    success: true,
    message: `Trading term ${action}d successfully`
  });
});

// Get trading term types and options
exports.getTradingTermOptions = asyncHandler((req, res, _next) => {
  const termTypes = [
    { value: 'volume_discount', label: 'Volume Discount', description: 'Discounts based on purchase volume' },
    { value: 'early_payment', label: 'Early Payment', description: 'Discounts for early payment' },
    { value: 'prompt_payment', label: 'Prompt Payment', description: 'Standard payment terms' },
    { value: 'rebate', label: 'Volume Rebate', description: 'Rebates based on volume thresholds' },
    { value: 'listing_fee', label: 'Listing Fee', description: 'Fees for product listing' },
    { value: 'promotional_support', label: 'Promotional Support', description: 'Support for promotional activities' },
    { value: 'marketing_contribution', label: 'Marketing Contribution', description: 'Contributions to marketing funds' },
    { value: 'settlement_discount', label: 'Settlement Discount', description: 'Discounts for settlement' },
    { value: 'cash_discount', label: 'Cash Discount', description: 'Discounts for cash payments' },
    { value: 'quantity_discount', label: 'Quantity Discount', description: 'Discounts based on quantity' },
    { value: 'loyalty_bonus', label: 'Loyalty Bonus', description: 'Bonuses for loyal customers' },
    { value: 'growth_incentive', label: 'Growth Incentive', description: 'Incentives for growth targets' }
  ];

  const customerTiers = [
    { value: 'platinum', label: 'Platinum' },
    { value: 'gold', label: 'Gold' },
    { value: 'silver', label: 'Silver' },
    { value: 'bronze', label: 'Bronze' },
    { value: 'all', label: 'All Tiers' }
  ];

  const customerTypes = [
    { value: 'chain', label: 'Chain Store' },
    { value: 'independent', label: 'Independent' },
    { value: 'wholesaler', label: 'Wholesaler' },
    { value: 'distributor', label: 'Distributor' },
    { value: 'online', label: 'Online' },
    { value: 'all', label: 'All Types' }
  ];

  const channels = [
    { value: 'modern_trade', label: 'Modern Trade' },
    { value: 'traditional_trade', label: 'Traditional Trade' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'horeca', label: 'HoReCa' },
    { value: 'b2b', label: 'B2B' },
    { value: 'all', label: 'All Channels' }
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  const statuses = [
    { value: 'draft', label: 'Draft' },
    { value: 'pending_approval', label: 'Pending Approval' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'expired', label: 'Expired' },
    { value: 'suspended', label: 'Suspended' }
  ];

  res.json({
    success: true,
    data: {
      termTypes,
      customerTiers,
      customerTypes,
      channels,
      priorities,
      statuses
    }
  });
});

// Calculate discount for given parameters
exports.calculateDiscount = asyncHandler(async (req, res, _next) => {
  const { id } = req.params;
  const { volume, value, customerId, productId } = req.body;
  const currentUser = req.user;

  // Find trading term
  const query = { _id: id };
  if (currentUser.role !== 'super_admin') {
    query.company = currentUser.companyId;
  }

  const tradingTerm = await TradingTerm.findOne(query);
  if (!tradingTerm) {
    throw new AppError('Trading term not found', 404);
  }

  // Check if term is active and approved
  if (!tradingTerm.isCurrentlyActive) {
    throw new AppError('Trading term is not currently active', 400);
  }

  // Check if term applies to the given parameters
  const applies = tradingTerm.appliesTo(customerId, productId, value, volume);
  if (!applies) {
    return res.json({
      success: true,
      data: {
        applies: false,
        discount: 0,
        rebate: 0,
        message: 'Trading term does not apply to the given parameters'
      }
    });
  }

  // Calculate discount
  const calculation = tradingTerm.calculateDiscount(volume, value);

  res.json({
    success: true,
    data: {
      applies: true,
      ...calculation,
      termName: tradingTerm.name,
      termCode: tradingTerm.code
    }
  });
});

module.exports = exports;
