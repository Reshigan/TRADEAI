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

module.exports = router;