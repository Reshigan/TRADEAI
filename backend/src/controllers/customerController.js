const Customer = require('../models/Customer');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Create customer
exports.createCustomer = asyncHandler(async (req, res, next) => {
  const customerData = {
    ...req.body,
    company: req.user.company,
    createdBy: req.user._id
  };

  const customer = await Customer.create(customerData);

  logger.logAudit('customer_created', req.user._id, {
    customerId: customer._id,
    customerName: customer.name
  });

  res.status(201).json({
    success: true,
    data: customer
  });
});

// Get single customer
exports.getCustomer = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id)
    .populate('company', 'name')
    .populate('createdBy', 'firstName lastName');

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Check if user has access to this customer
  if (customer.company.toString() !== req.user.company.toString()) {
    throw new AppError('Access denied', 403);
  }

  res.json({
    success: true,
    data: customer
  });
});

// Update customer
exports.updateCustomer = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Check if user has access to this customer
  if (customer.company.toString() !== req.user.company.toString()) {
    throw new AppError('Access denied', 403);
  }

  Object.assign(customer, req.body);
  customer.lastModifiedBy = req.user._id;
  
  await customer.save();

  logger.logAudit('customer_updated', req.user._id, {
    customerId: customer._id,
    customerName: customer.name
  });

  res.json({
    success: true,
    data: customer
  });
});

// Delete customer
exports.deleteCustomer = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Check if user has access to this customer
  if (customer.company.toString() !== req.user.company.toString()) {
    throw new AppError('Access denied', 403);
  }

  // Check if customer is referenced in other documents
  const TradeSpend = require('../models/TradeSpend');
  const Promotion = require('../models/Promotion');
  
  const tradeSpendCount = await TradeSpend.countDocuments({ customer: customer._id });
  const promotionCount = await Promotion.countDocuments({ 'scope.customers.customer': customer._id });
  
  if (tradeSpendCount > 0 || promotionCount > 0) {
    throw new AppError('Cannot delete customer with existing trade spends or promotions', 400);
  }

  await customer.deleteOne();

  logger.logAudit('customer_deleted', req.user._id, {
    customerId: customer._id,
    customerName: customer.name
  });

  res.json({
    success: true,
    message: 'Customer deleted successfully'
  });
});

// Get all customers
exports.getCustomers = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
    search,
    status,
    type,
    tier,
    region,
    ...filters
  } = req.query;

  // Build query
  const query = { company: req.user.company };
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { 'contact.email': { $regex: search, $options: 'i' } }
    ];
  }
  
  if (status) {
    query.status = status;
  }
  
  if (type) {
    query.type = type;
  }
  
  if (tier) {
    query['classification.tier'] = tier;
  }
  
  if (region) {
    query['classification.region'] = region;
  }
  
  // Apply additional filters
  Object.assign(query, filters);

  // Apply user-based filtering for KAMs and Sales Reps
  if (req.user.role === 'kam' || req.user.role === 'sales_rep') {
    if (req.user.assignedCustomers && req.user.assignedCustomers.length > 0) {
      query._id = { $in: req.user.assignedCustomers };
    } else {
      // If no customers assigned, return empty result
      query._id = { $in: [] };
    }
  }

  const customers = await Customer.find(query)
    .populate('company', 'name')
    .populate('createdBy', 'firstName lastName')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Customer.countDocuments(query);

  res.json({
    success: true,
    data: customers,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  });
});

// Get customer statistics
exports.getCustomerStats = asyncHandler(async (req, res, next) => {
  const stats = await Customer.aggregate([
    { $match: { company: req.user.company } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
        byType: {
          $push: {
            type: '$type',
            tier: '$classification.tier'
          }
        }
      }
    }
  ]);

  const typeStats = await Customer.aggregate([
    { $match: { company: req.user.company } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    }
  ]);

  const tierStats = await Customer.aggregate([
    { $match: { company: req.user.company } },
    {
      $group: {
        _id: '$classification.tier',
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      overview: stats[0] || { total: 0, active: 0, inactive: 0 },
      byType: typeStats,
      byTier: tierStats
    }
  });
});

// Bulk operations
exports.bulkUpdateCustomers = asyncHandler(async (req, res, next) => {
  const { customerIds, updates } = req.body;

  if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
    throw new AppError('Customer IDs are required', 400);
  }

  const result = await Customer.updateMany(
    { 
      _id: { $in: customerIds },
      company: req.user.company
    },
    {
      ...updates,
      lastModifiedBy: req.user._id,
      updatedAt: new Date()
    }
  );

  logger.logAudit('customers_bulk_updated', req.user._id, {
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