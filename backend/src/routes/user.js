const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { body, validationResult } = require('express-validator');

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

// Get all users (admin only)
router.get('/', authenticateToken, authorize('admin'), asyncHandler(async (req, res) => {
  const users = await User.find()
    .select('-password')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: users.length,
    data: users
  });
}));

// Create new user (admin only)
router.post('/', authenticateToken, authorize('admin'), asyncHandler(async (req, res) => {
  const { employeeId: rawEmployeeId, email, password, firstName: rawFirstName, lastName: rawLastName, role, department } = req.body;
  let employeeId = rawEmployeeId;
  let firstName = rawFirstName;
  let lastName = rawLastName;

  // Sanitize string inputs to prevent XSS
  employeeId = sanitizeInput(employeeId);
  firstName = sanitizeInput(firstName);
  lastName = sanitizeInput(lastName);

  // Validate required fields
  if (!employeeId || !email || !password || !firstName || !lastName) {
    throw new AppError('Missing required fields: employeeId, email, password, firstName, lastName', 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Invalid email format', 400);
  }

  // Validate password strength (min 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special char)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new AppError('Password must be at least 8 characters and contain uppercase, lowercase, number, and special character', 400);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError('User with this email already exists', 409);
  }

  // Check if employeeId already exists
  const existingEmployee = await User.findOne({ employeeId });
  if (existingEmployee) {
    throw new AppError('User with this employee ID already exists', 409);
  }

  // Set tenant from request context (added by tenantIsolation middleware)
  const tenantId = req.tenantId || req.user.tenantId;
  if (!tenantId) {
    throw new AppError('Tenant context not found', 400);
  }

  // Create new user
  const user = new User({
    employeeId,
    email: email.toLowerCase(),
    password, // Will be hashed by pre-save hook
    firstName,
    lastName,
    role: role || 'user',
    department,
    tenantId,
    isActive: true
  });

  await user.save();

  // Remove password from response
  const userObj = user.toObject();
  delete userObj.password;

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: userObj
  });
}));

// IMPORTANT: Route order matters!
// The /me route must be defined BEFORE /:id route
// Otherwise, Express will treat 'me' as an ID parameter
// and route to /:id handler instead of /me handler

// Get current user profile
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  res.json({
    success: true,
    data: user
  });
}));

// Get user by ID (admin only)
router.get('/:id', authenticateToken, authorize('admin'), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: user
  });
}));

// Update current user profile
// Note: Only allows updating safe fields. Protected fields like role,
// company, password, etc. must be updated through admin endpoints
router.put('/me', authenticateToken, asyncHandler(async (req, res) => {
  const allowedUpdates = ['firstName', 'lastName', 'phone', 'preferences'];

  // Validate that at least one field is being updated
  const updateKeys = Object.keys(req.body).filter((key) => allowedUpdates.includes(key));
  if (updateKeys.length === 0) {
    throw new AppError('No valid fields provided for update', 400);
  }

  // Filter to only allowed updates
  const updates = updateKeys.reduce((obj, key) => {
    obj[key] = req.body[key];
    return obj;
  }, {});

  // Validate input lengths
  if (updates.firstName && updates.firstName.length > 100) {
    throw new AppError('First name must be less than 100 characters', 400);
  }
  if (updates.lastName && updates.lastName.length > 100) {
    throw new AppError('Last name must be less than 100 characters', 400);
  }
  if (updates.phone && updates.phone.length > 20) {
    throw new AppError('Phone number must be less than 20 characters', 400);
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Remove password from response
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: userObj
  });
}));

// Update user by ID (admin only)
router.put('/:id', authenticateToken, authorize('admin'), asyncHandler(async (req, res) => {
  const { password, ...updates } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: user
  });
}));

// Delete user (admin only)
router.delete('/:id', authenticateToken, authorize('admin'), asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

module.exports = router;
