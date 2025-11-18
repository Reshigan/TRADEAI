const User = require('../models/User');
const Company = require('../models/Company');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

/**
 * User Management Controller
 * Implements proper role hierarchy:
 * - Super Admin: Creates companies and company administrators
 * - Company Admin: Creates and manages users within their company
 * - Other roles: Limited user management based on permissions
 */

// Get all users (with proper filtering based on role)
exports.getUsers = asyncHandler(async (req, res, _next) => {
  const { page = 1, limit = 10, search, role, status, department } = req.query;
  const currentUser = req.user;

  // Build query based on user role
  const query = {};

  // Super admin can see all users
  if (currentUser.role !== 'super_admin') {
    // Company admin and others can only see users from their company
    query.companyId = currentUser.companyId;
  }

  // Apply filters
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } }
    ];
  }

  if (role) query.role = role;
  if (status) query.isActive = status === 'active';
  if (department) query.department = department;

  // Execute query with pagination
  const users = await User.find(query)
    .populate('companyId', 'name code')
    .select('-password -twoFactorSecret')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get single user
exports.getUser = asyncHandler(async (req, res, _next) => {
  const { id } = req.params;
  const currentUser = req.user;

  const query = { _id: id };

  // Non-super admins can only view users from their company
  if (currentUser.role !== 'super_admin') {
    query.companyId = currentUser.companyId;
  }

  const user = await User.findOne(query)
    .populate('companyId', 'name code currency timezone')
    .select('-password -twoFactorSecret');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: { user }
  });
});

// Create new user
exports.createUser = asyncHandler(async (req, res, _next) => {
  const {
    email,
    password,
    firstName,
    lastName,
    employeeId,
    role,
    department,
    companyId,
    permissions,
    approvalLimits
  } = req.body;

  const currentUser = req.user;

  // Role-based creation restrictions
  if (currentUser.role === 'super_admin') {
    // Super admin can create companies and company admins
    if (role !== 'admin' && !companyId) {
      throw new AppError('Company ID required for non-admin users', 400);
    }

    // If creating company admin, verify company exists
    if (companyId) {
      const company = await Company.findById(companyId);
      if (!company) {
        throw new AppError('Company not found', 404);
      }
    }
  } else if (currentUser.role === 'admin') {
    // Company admin can create users within their company
    if (!companyId || companyId !== currentUser.companyId.toString()) {
      throw new AppError('Can only create users within your company', 403);
    }

    // Company admin cannot create super admins or other company admins
    if (role === 'super_admin' || role === 'admin') {
      throw new AppError('Insufficient permissions to create this role', 403);
    }
  } else {
    // Other roles cannot create users
    throw new AppError('Insufficient permissions to create users', 403);
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { employeeId }]
  });

  if (existingUser) {
    throw new AppError('User with this email or employee ID already exists', 400);
  }

  // Create user
  const userData = {
    email,
    password,
    firstName,
    lastName,
    employeeId,
    role,
    department,
    companyId: companyId || currentUser.companyId,
    permissions: permissions || [],
    approvalLimits: approvalLimits || {},
    createdBy: currentUser._id
  };

  const user = await User.create(userData);

  // Log user creation
  logger.logAudit('user_created', currentUser._id, {
    createdUserId: user._id,
    email: user.email,
    role: user.role
  });

  // Return user without sensitive data
  const userResponse = await User.findById(user._id)
    .populate('companyId', 'name code')
    .select('-password -twoFactorSecret');

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: { user: userResponse }
  });
});

// Update user
exports.updateUser = asyncHandler(async (req, res, _next) => {
  const { id } = req.params;
  const currentUser = req.user;
  const updates = req.body;

  // Find user to update
  const query = { _id: id };
  if (currentUser.role !== 'super_admin') {
    query.companyId = currentUser.companyId;
  }

  const user = await User.findOne(query);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Role-based update restrictions
  if (currentUser.role !== 'super_admin' && currentUser.role !== 'admin') {
    // Non-admins can only update themselves
    if (user._id.toString() !== currentUser._id.toString()) {
      throw new AppError('Can only update your own profile', 403);
    }

    // Restrict what non-admins can update
    const allowedUpdates = ['firstName', 'lastName', 'preferences'];
    Object.keys(updates).forEach((key) => {
      if (!allowedUpdates.includes(key)) {
        delete updates[key];
      }
    });
  }

  // Company admin cannot change role to super_admin or admin
  if (currentUser.role === 'admin' && updates.role) {
    if (updates.role === 'super_admin' || updates.role === 'admin') {
      throw new AppError('Cannot assign this role', 403);
    }
  }

  // Hash password if being updated
  if (updates.password) {
    const salt = await bcrypt.genSalt(10);
    updates.password = await bcrypt.hash(updates.password, salt);
    updates.passwordChangedAt = new Date();
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    id,
    { ...updates, updatedBy: currentUser._id },
    { new: true, runValidators: true }
  ).populate('companyId', 'name code').select('-password -twoFactorSecret');

  // Log user update
  logger.logAudit('user_updated', currentUser._id, {
    updatedUserId: user._id,
    changes: Object.keys(updates)
  });

  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user: updatedUser }
  });
});

// Delete user
exports.deleteUser = asyncHandler(async (req, res, _next) => {
  const { id } = req.params;
  const currentUser = req.user;

  // Find user to delete
  const query = { _id: id };
  if (currentUser.role !== 'super_admin') {
    query.companyId = currentUser.companyId;
  }

  const user = await User.findOne(query);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent self-deletion
  if (user._id.toString() === currentUser._id.toString()) {
    throw new AppError('Cannot delete your own account', 400);
  }

  // Role-based deletion restrictions
  if (currentUser.role === 'admin') {
    // Company admin cannot delete super admins or other company admins
    if (user.role === 'super_admin' || user.role === 'admin') {
      throw new AppError('Insufficient permissions to delete this user', 403);
    }
  } else if (currentUser.role !== 'super_admin') {
    throw new AppError('Insufficient permissions to delete users', 403);
  }

  // Soft delete (deactivate) instead of hard delete
  await User.findByIdAndUpdate(id, {
    isActive: false,
    deletedAt: new Date(),
    deletedBy: currentUser._id
  });

  // Log user deletion
  logger.logAudit('user_deleted', currentUser._id, {
    deletedUserId: user._id,
    email: user.email
  });

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// Toggle user status (activate/deactivate)
exports.toggleUserStatus = asyncHandler(async (req, res, _next) => {
  const { id } = req.params;
  const currentUser = req.user;

  // Find user
  const query = { _id: id };
  if (currentUser.role !== 'super_admin') {
    query.companyId = currentUser.companyId;
  }

  const user = await User.findOne(query);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent self-deactivation
  if (user._id.toString() === currentUser._id.toString()) {
    throw new AppError('Cannot change your own status', 400);
  }

  // Role-based restrictions
  if (currentUser.role === 'admin') {
    if (user.role === 'super_admin' || user.role === 'admin') {
      throw new AppError('Insufficient permissions to change this user status', 403);
    }
  } else if (currentUser.role !== 'super_admin') {
    throw new AppError('Insufficient permissions to change user status', 403);
  }

  // Toggle status
  const newStatus = !user.isActive;
  await User.findByIdAndUpdate(id, { isActive: newStatus });

  // Log status change
  logger.logAudit('user_status_changed', currentUser._id, {
    targetUserId: user._id,
    newStatus,
    email: user.email
  });

  res.json({
    success: true,
    message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`
  });
});

// Assign role to user
exports.assignRole = asyncHandler(async (req, res, _next) => {
  const { id } = req.params;
  const { role, permissions, approvalLimits } = req.body;
  const currentUser = req.user;

  // Find user
  const query = { _id: id };
  if (currentUser.role !== 'super_admin') {
    query.companyId = currentUser.companyId;
  }

  const user = await User.findOne(query);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Role assignment restrictions
  if (currentUser.role === 'admin') {
    // Company admin cannot assign super_admin or admin roles
    if (role === 'super_admin' || role === 'admin') {
      throw new AppError('Cannot assign this role', 403);
    }
  } else if (currentUser.role !== 'super_admin') {
    throw new AppError('Insufficient permissions to assign roles', 403);
  }

  // Update user role and permissions
  const updates = { role };
  if (permissions) updates.permissions = permissions;
  if (approvalLimits) updates.approvalLimits = approvalLimits;

  const updatedUser = await User.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  ).populate('companyId', 'name code').select('-password -twoFactorSecret');

  // Log role assignment
  logger.logAudit('role_assigned', currentUser._id, {
    targetUserId: user._id,
    newRole: role,
    email: user.email
  });

  res.json({
    success: true,
    message: 'Role assigned successfully',
    data: { user: updatedUser }
  });
});

// Get user roles and permissions
exports.getUserRoles = asyncHandler((req, res, _next) => {
  const currentUser = req.user;

  // Define available roles based on current user's role
  let availableRoles = [];

  if (currentUser.role === 'super_admin') {
    availableRoles = [
      { value: 'super_admin', label: 'Super Administrator', description: 'Full system access' },
      { value: 'admin', label: 'Company Administrator', description: 'Company management access' },
      { value: 'manager', label: 'Manager', description: 'Team and budget management' },
      { value: 'kam', label: 'Key Account Manager', description: 'Customer relationship management' },
      { value: 'analyst', label: 'Analyst', description: 'Data analysis and reporting' },
      { value: 'user', label: 'User', description: 'Basic system access' }
    ];
  } else if (currentUser.role === 'admin') {
    availableRoles = [
      { value: 'manager', label: 'Manager', description: 'Team and budget management' },
      { value: 'kam', label: 'Key Account Manager', description: 'Customer relationship management' },
      { value: 'analyst', label: 'Analyst', description: 'Data analysis and reporting' },
      { value: 'user', label: 'User', description: 'Basic system access' }
    ];
  }

  // Define available permissions
  const availablePermissions = [
    { module: 'dashboard', actions: ['read'] },
    { module: 'customers', actions: ['read', 'write', 'delete'] },
    { module: 'products', actions: ['read', 'write', 'delete'] },
    { module: 'budgets', actions: ['read', 'write', 'approve'] },
    { module: 'promotions', actions: ['read', 'write', 'approve'] },
    { module: 'tradespends', actions: ['read', 'write', 'approve'] },
    { module: 'analytics', actions: ['read', 'export'] },
    { module: 'reports', actions: ['read', 'create', 'export'] },
    { module: 'settings', actions: ['read', 'write'] },
    { module: 'users', actions: ['read', 'write', 'delete'] }
  ];

  res.json({
    success: true,
    data: {
      availableRoles,
      availablePermissions,
      currentUserRole: currentUser.role
    }
  });
});

module.exports = exports;
