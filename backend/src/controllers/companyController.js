const Company = require('../models/Company');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Company Management Controller
 * Only accessible by Super Admin
 */

// Get all companies
exports.getCompanies = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, search, status, industry } = req.query;

  // Only super admin can access this
  if (req.user.role !== 'super_admin') {
    throw new AppError('Access denied. Super admin only.', 403);
  }

  // Build query
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { domain: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) query.isActive = status === 'active';
  if (industry) query.industry = industry;

  // Execute query with pagination
  const companies = await Company.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('activeUsersCount')
    .populate('customersCount')
    .populate('productsCount');

  const total = await Company.countDocuments(query);

  res.json({
    success: true,
    data: {
      companies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get single company
exports.getCompany = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Only super admin can access this
  if (req.user.role !== 'super_admin') {
    throw new AppError('Access denied. Super admin only.', 403);
  }

  const company = await Company.findById(id)
    .populate('activeUsersCount')
    .populate('customersCount')
    .populate('productsCount');

  if (!company) {
    throw new AppError('Company not found', 404);
  }

  // Get company administrators
  const admins = await User.find({
    companyId: id,
    role: 'admin',
    isActive: true
  }).select('firstName lastName email');

  res.json({
    success: true,
    data: {
      company,
      admins
    }
  });
});

// Create new company
exports.createCompany = asyncHandler(async (req, res, next) => {
  // Only super admin can create companies
  if (req.user.role !== 'super_admin') {
    throw new AppError('Access denied. Super admin only.', 403);
  }

  const {
    name,
    code,
    domain,
    industry,
    country,
    currency,
    timezone,
    address,
    contactInfo,
    subscription,
    settings,
    enabledModules
  } = req.body;

  // Check if company already exists
  const existingCompany = await Company.findOne({
    $or: [{ name }, { code }, { domain }]
  });

  if (existingCompany) {
    throw new AppError('Company with this name, code, or domain already exists', 400);
  }

  // Create company
  const companyData = {
    name,
    code: code.toUpperCase(),
    domain: domain.toLowerCase(),
    industry: industry || 'fmcg',
    country: country || 'ZA',
    currency: currency || 'ZAR',
    timezone: timezone || 'Africa/Johannesburg',
    address: address || {},
    contactInfo: contactInfo || {},
    subscription: subscription || {
      plan: 'professional',
      status: 'active',
      maxUsers: 50,
      maxCustomers: 1000,
      maxProducts: 5000
    },
    settings: settings || {},
    enabledModules: enabledModules || [
      { module: 'customers', enabled: true },
      { module: 'products', enabled: true },
      { module: 'campaigns', enabled: true },
      { module: 'budgets', enabled: true },
      { module: 'analytics', enabled: true },
      { module: 'ai_insights', enabled: true },
      { module: 'reporting', enabled: true },
      { module: 'integrations', enabled: true }
    ],
    createdBy: req.user._id
  };

  const company = await Company.create(companyData);

  // Log company creation
  logger.logAudit('company_created', req.user._id, {
    companyId: company._id,
    name: company.name,
    code: company.code
  });

  res.status(201).json({
    success: true,
    message: 'Company created successfully',
    data: { company }
  });
});

// Update company
exports.updateCompany = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Only super admin can update companies
  if (req.user.role !== 'super_admin') {
    throw new AppError('Access denied. Super admin only.', 403);
  }

  const company = await Company.findById(id);
  if (!company) {
    throw new AppError('Company not found', 404);
  }

  // Update company
  const updatedCompany = await Company.findByIdAndUpdate(
    id,
    { ...req.body, lastModifiedBy: req.user._id },
    { new: true, runValidators: true }
  );

  // Log company update
  logger.logAudit('company_updated', req.user._id, {
    companyId: company._id,
    changes: Object.keys(req.body)
  });

  res.json({
    success: true,
    message: 'Company updated successfully',
    data: { company: updatedCompany }
  });
});

// Delete company (soft delete)
exports.deleteCompany = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Only super admin can delete companies
  if (req.user.role !== 'super_admin') {
    throw new AppError('Access denied. Super admin only.', 403);
  }

  const company = await Company.findById(id);
  if (!company) {
    throw new AppError('Company not found', 404);
  }

  // Check if company has active users
  const activeUsers = await User.countDocuments({
    companyId: id,
    isActive: true
  });

  if (activeUsers > 0) {
    throw new AppError('Cannot delete company with active users. Deactivate users first.', 400);
  }

  // Soft delete (deactivate)
  await Company.findByIdAndUpdate(id, {
    isActive: false,
    lastModifiedBy: req.user._id
  });

  // Log company deletion
  logger.logAudit('company_deleted', req.user._id, {
    companyId: company._id,
    name: company.name
  });

  res.json({
    success: true,
    message: 'Company deleted successfully'
  });
});

// Toggle company status
exports.toggleCompanyStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Only super admin can toggle company status
  if (req.user.role !== 'super_admin') {
    throw new AppError('Access denied. Super admin only.', 403);
  }

  const company = await Company.findById(id);
  if (!company) {
    throw new AppError('Company not found', 404);
  }

  // Toggle status
  const newStatus = !company.isActive;
  await Company.findByIdAndUpdate(id, {
    isActive: newStatus,
    lastModifiedBy: req.user._id
  });

  // If deactivating company, also deactivate all users
  if (!newStatus) {
    await User.updateMany(
      { companyId: id },
      { isActive: false }
    );
  }

  // Log status change
  logger.logAudit('company_status_changed', req.user._id, {
    companyId: company._id,
    newStatus,
    name: company.name
  });

  res.json({
    success: true,
    message: `Company ${newStatus ? 'activated' : 'deactivated'} successfully`
  });
});

// Create company administrator
exports.createCompanyAdmin = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const {
    email,
    password,
    firstName,
    lastName,
    employeeId
  } = req.body;

  // Only super admin can create company administrators
  if (req.user.role !== 'super_admin') {
    throw new AppError('Access denied. Super admin only.', 403);
  }

  // Verify company exists
  const company = await Company.findById(id);
  if (!company) {
    throw new AppError('Company not found', 404);
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { employeeId }]
  });

  if (existingUser) {
    throw new AppError('User with this email or employee ID already exists', 400);
  }

  // Create company administrator
  const adminData = {
    email,
    password,
    firstName,
    lastName,
    employeeId,
    role: 'admin',
    department: 'admin',
    companyId: id,
    permissions: [
      { module: 'users', actions: ['read', 'write', 'delete'] },
      { module: 'customers', actions: ['read', 'write', 'delete'] },
      { module: 'products', actions: ['read', 'write', 'delete'] },
      { module: 'budgets', actions: ['read', 'write', 'approve'] },
      { module: 'promotions', actions: ['read', 'write', 'approve'] },
      { module: 'tradespends', actions: ['read', 'write', 'approve'] },
      { module: 'analytics', actions: ['read', 'export'] },
      { module: 'reports', actions: ['read', 'create', 'export'] },
      { module: 'settings', actions: ['read', 'write'] }
    ],
    approvalLimits: {
      marketing: 1000000,
      cashCoop: 500000,
      tradingTerms: 2000000,
      promotions: 1000000
    }
  };

  const admin = await User.create(adminData);

  // Log admin creation
  logger.logAudit('company_admin_created', req.user._id, {
    companyId: id,
    adminId: admin._id,
    email: admin.email
  });

  // Return admin without sensitive data
  const adminResponse = await User.findById(admin._id)
    .populate('companyId', 'name code')
    .select('-password -twoFactorSecret');

  res.status(201).json({
    success: true,
    message: 'Company administrator created successfully',
    data: { admin: adminResponse }
  });
});

// Get company statistics
exports.getCompanyStats = asyncHandler(async (req, res, next) => {
  // Only super admin can access this
  if (req.user.role !== 'super_admin') {
    throw new AppError('Access denied. Super admin only.', 403);
  }

  const stats = await Company.aggregate([
    {
      $group: {
        _id: null,
        totalCompanies: { $sum: 1 },
        activeCompanies: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        inactiveCompanies: {
          $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
        },
        industriesCount: { $addToSet: '$industry' }
      }
    },
    {
      $project: {
        _id: 0,
        totalCompanies: 1,
        activeCompanies: 1,
        inactiveCompanies: 1,
        industriesCount: { $size: '$industriesCount' }
      }
    }
  ]);

  // Get subscription stats
  const subscriptionStats = await Company.aggregate([
    {
      $group: {
        _id: '$subscription.plan',
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      overview: stats[0] || {
        totalCompanies: 0,
        activeCompanies: 0,
        inactiveCompanies: 0,
        industriesCount: 0
      },
      subscriptionStats
    }
  });
});

module.exports = exports;
