const { asyncHandler, AppError } = require('../middleware/errorHandler');
const LearningCourse = require('../models/LearningCourse');
const Game = require('../models/Game');
const Announcement = require('../models/Announcement');
const Policy = require('../models/Policy');
const CompanySettings = require('../models/CompanySettings');
const AzureADConfig = require('../models/AzureADConfig');
const ERPSettings = require('../models/ERPSettings');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

/**
 * Company Admin Controller
 * All endpoints are scoped to the company of the authenticated admin
 */

// Helper to get company ID from authenticated user
const getCompanyId = (req) => {
  if (!req.user.companyId) {
    throw new AppError('Company ID not found for user', 400);
  }
  return req.user.companyId;
};

// ==================== LEARNING COURSES ====================

exports.getCourses = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const { status, category, search, page = 1, limit = 20 } = req.query;

  const query = { companyId };
  if (status) query.status = status;
  if (category) query.category = category;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const courses = await LearningCourse.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('createdBy', 'firstName lastName')
    .lean();

  const total = await LearningCourse.countDocuments(query);

  res.json({
    success: true,
    data: {
      courses,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    }
  });
});

exports.getCourse = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const course = await LearningCourse.findOne({ _id: req.params.id, companyId })
    .populate('createdBy', 'firstName lastName')
    .populate('assignedTo', 'firstName lastName email');

  if (!course) throw new AppError('Course not found', 404);

  res.json({ success: true, data: course });
});

exports.createCourse = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const course = await LearningCourse.create({
    ...req.body,
    companyId,
    createdBy: req.user._id
  });

  logger.logAudit('course_created', req.user._id, { courseId: course._id, title: course.title });

  res.status(201).json({ success: true, data: course });
});

exports.updateCourse = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const course = await LearningCourse.findOneAndUpdate(
    { _id: req.params.id, companyId },
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!course) throw new AppError('Course not found', 404);

  logger.logAudit('course_updated', req.user._id, { courseId: course._id });

  res.json({ success: true, data: course });
});

exports.deleteCourse = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const course = await LearningCourse.findOneAndDelete({ _id: req.params.id, companyId });

  if (!course) throw new AppError('Course not found', 404);

  logger.logAudit('course_deleted', req.user._id, { courseId: req.params.id });

  res.json({ success: true, message: 'Course deleted successfully' });
});

// ==================== GAMES ====================

exports.getGames = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const { status, type, page = 1, limit = 20 } = req.query;

  const query = { companyId };
  if (status) query.status = status;
  if (type) query.type = type;

  const games = await Game.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('createdBy', 'firstName lastName')
    .lean();

  const total = await Game.countDocuments(query);

  res.json({
    success: true,
    data: {
      games,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    }
  });
});

exports.getGame = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const game = await Game.findOne({ _id: req.params.id, companyId })
    .populate('createdBy', 'firstName lastName')
    .populate('participants.userId', 'firstName lastName email');

  if (!game) throw new AppError('Game not found', 404);

  res.json({ success: true, data: game });
});

exports.createGame = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const game = await Game.create({
    ...req.body,
    companyId,
    createdBy: req.user._id
  });

  logger.logAudit('game_created', req.user._id, { gameId: game._id, name: game.name });

  res.status(201).json({ success: true, data: game });
});

exports.updateGame = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const game = await Game.findOneAndUpdate(
    { _id: req.params.id, companyId },
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!game) throw new AppError('Game not found', 404);

  logger.logAudit('game_updated', req.user._id, { gameId: game._id });

  res.json({ success: true, data: game });
});

exports.deleteGame = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const game = await Game.findOneAndDelete({ _id: req.params.id, companyId });

  if (!game) throw new AppError('Game not found', 404);

  logger.logAudit('game_deleted', req.user._id, { gameId: req.params.id });

  res.json({ success: true, message: 'Game deleted successfully' });
});

// ==================== ANNOUNCEMENTS ====================

exports.getAnnouncements = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const { status, type, page = 1, limit = 20 } = req.query;

  const query = { companyId };
  if (status) query.status = status;
  if (type) query.type = type;

  const announcements = await Announcement.find(query)
    .sort({ isPinned: -1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('createdBy', 'firstName lastName')
    .lean();

  const total = await Announcement.countDocuments(query);

  res.json({
    success: true,
    data: {
      announcements,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    }
  });
});

exports.getAnnouncement = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const announcement = await Announcement.findOne({ _id: req.params.id, companyId })
    .populate('createdBy', 'firstName lastName');

  if (!announcement) throw new AppError('Announcement not found', 404);

  res.json({ success: true, data: announcement });
});

exports.createAnnouncement = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const announcement = await Announcement.create({
    ...req.body,
    companyId,
    createdBy: req.user._id
  });

  logger.logAudit('announcement_created', req.user._id, { announcementId: announcement._id, title: announcement.title });

  res.status(201).json({ success: true, data: announcement });
});

exports.updateAnnouncement = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const announcement = await Announcement.findOneAndUpdate(
    { _id: req.params.id, companyId },
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!announcement) throw new AppError('Announcement not found', 404);

  logger.logAudit('announcement_updated', req.user._id, { announcementId: announcement._id });

  res.json({ success: true, data: announcement });
});

exports.deleteAnnouncement = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const announcement = await Announcement.findOneAndDelete({ _id: req.params.id, companyId });

  if (!announcement) throw new AppError('Announcement not found', 404);

  logger.logAudit('announcement_deleted', req.user._id, { announcementId: req.params.id });

  res.json({ success: true, message: 'Announcement deleted successfully' });
});

exports.publishAnnouncement = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const announcement = await Announcement.findOne({ _id: req.params.id, companyId });

  if (!announcement) throw new AppError('Announcement not found', 404);

  await announcement.publish(req.user._id);

  logger.logAudit('announcement_published', req.user._id, { announcementId: announcement._id });

  res.json({ success: true, data: announcement });
});

// ==================== POLICIES ====================

exports.getPolicies = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const { status, category, page = 1, limit = 20 } = req.query;

  const query = { companyId };
  if (status) query.status = status;
  if (category) query.category = category;

  const policies = await Policy.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('createdBy', 'firstName lastName')
    .lean();

  const total = await Policy.countDocuments(query);

  res.json({
    success: true,
    data: {
      policies,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    }
  });
});

exports.getPolicy = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const policy = await Policy.findOne({ _id: req.params.id, companyId })
    .populate('createdBy', 'firstName lastName')
    .populate('owner', 'firstName lastName email');

  if (!policy) throw new AppError('Policy not found', 404);

  res.json({ success: true, data: policy });
});

exports.createPolicy = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const policy = await Policy.create({
    ...req.body,
    companyId,
    createdBy: req.user._id
  });

  logger.logAudit('policy_created', req.user._id, { policyId: policy._id, title: policy.title });

  res.status(201).json({ success: true, data: policy });
});

exports.updatePolicy = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const policy = await Policy.findOneAndUpdate(
    { _id: req.params.id, companyId },
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!policy) throw new AppError('Policy not found', 404);

  logger.logAudit('policy_updated', req.user._id, { policyId: policy._id });

  res.json({ success: true, data: policy });
});

exports.deletePolicy = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const policy = await Policy.findOneAndDelete({ _id: req.params.id, companyId });

  if (!policy) throw new AppError('Policy not found', 404);

  logger.logAudit('policy_deleted', req.user._id, { policyId: req.params.id });

  res.json({ success: true, message: 'Policy deleted successfully' });
});

exports.publishPolicy = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const policy = await Policy.findOne({ _id: req.params.id, companyId });

  if (!policy) throw new AppError('Policy not found', 404);

  await policy.publish(req.user._id);

  logger.logAudit('policy_published', req.user._id, { policyId: policy._id });

  res.json({ success: true, data: policy });
});

// ==================== COMPANY SETTINGS ====================

exports.getSettings = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const settings = await CompanySettings.getOrCreate(companyId);

  res.json({ success: true, data: settings });
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  let settings = await CompanySettings.findOne({ companyId });

  if (!settings) {
    settings = await CompanySettings.create({ companyId, ...req.body, updatedBy: req.user._id });
  } else {
    Object.assign(settings, req.body);
    settings.updatedBy = req.user._id;
    await settings.save();
  }

  logger.logAudit('company_settings_updated', req.user._id, { companyId });

  res.json({ success: true, data: settings });
});

exports.uploadLogo = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  
  // In production, this would handle file upload to S3/cloud storage
  // For now, we'll accept a URL or base64
  const { logoUrl, logoType = 'default' } = req.body;

  if (!logoUrl) throw new AppError('Logo URL is required', 400);

  let settings = await CompanySettings.findOne({ companyId });
  if (!settings) {
    settings = await CompanySettings.create({ companyId });
  }

  if (logoType === 'light') {
    settings.branding.logoLight = logoUrl;
  } else if (logoType === 'dark') {
    settings.branding.logoDark = logoUrl;
  } else {
    settings.branding.logoUrl = logoUrl;
  }

  settings.updatedBy = req.user._id;
  await settings.save();

  logger.logAudit('company_logo_updated', req.user._id, { companyId, logoType });

  res.json({ success: true, data: settings });
});

// ==================== AZURE AD INTEGRATION ====================

exports.getAzureADConfig = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  let config = await AzureADConfig.findOne({ companyId });

  if (!config) {
    config = { connectionStatus: 'not_configured' };
  }

  res.json({ success: true, data: config });
});

exports.saveAzureADConfig = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const { tenantId, clientId, clientSecret, directoryId, syncEnabled, syncSchedule } = req.body;

  let config = await AzureADConfig.findOne({ companyId });

  if (!config) {
    config = await AzureADConfig.create({
      companyId,
      tenantId,
      clientId,
      clientSecret,
      directoryId,
      syncEnabled,
      syncSchedule,
      connectionStatus: 'configured',
      createdBy: req.user._id
    });
  } else {
    config.tenantId = tenantId;
    config.clientId = clientId;
    if (clientSecret) config.clientSecret = clientSecret;
    config.directoryId = directoryId;
    config.syncEnabled = syncEnabled;
    config.syncSchedule = syncSchedule;
    config.connectionStatus = 'configured';
    config.updatedBy = req.user._id;
    await config.save();
  }

  logger.logAudit('azure_ad_config_saved', req.user._id, { companyId });

  res.json({ success: true, data: config });
});

exports.testAzureADConnection = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const config = await AzureADConfig.findOne({ companyId });

  if (!config) throw new AppError('Azure AD not configured', 400);

  await config.testConnection();

  res.json({ success: true, data: { status: config.connectionStatus, lastTest: config.lastConnectionTest } });
});

exports.syncAzureAD = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const config = await AzureADConfig.findOne({ companyId });

  if (!config) throw new AppError('Azure AD not configured', 400);

  // Simulated sync - in production this would call Microsoft Graph API
  const startTime = Date.now();

  // Generate simulated departments
  const simulatedDepartments = [
    { name: 'Sales', code: 'SALES', description: 'Sales Department' },
    { name: 'Marketing', code: 'MKT', description: 'Marketing Department' },
    { name: 'Finance', code: 'FIN', description: 'Finance Department' },
    { name: 'Operations', code: 'OPS', description: 'Operations Department' },
    { name: 'Human Resources', code: 'HR', description: 'Human Resources Department' },
    { name: 'IT', code: 'IT', description: 'Information Technology' }
  ];

  // Generate simulated employees
  const simulatedEmployees = [
    { firstName: 'Alice', lastName: 'Khoza', email: 'alice.khoza@company.co.za', jobTitle: 'Key Account Manager', departmentName: 'Sales' },
    { firstName: 'Bob', lastName: 'Naidoo', email: 'bob.naidoo@company.co.za', jobTitle: 'Sales Representative', departmentName: 'Sales' },
    { firstName: 'Carol', lastName: 'van der Berg', email: 'carol.vdb@company.co.za', jobTitle: 'Marketing Manager', departmentName: 'Marketing' },
    { firstName: 'David', lastName: 'Mokoena', email: 'david.mokoena@company.co.za', jobTitle: 'Financial Analyst', departmentName: 'Finance' },
    { firstName: 'Emma', lastName: 'Pillay', email: 'emma.pillay@company.co.za', jobTitle: 'Operations Lead', departmentName: 'Operations' },
    { firstName: 'Frank', lastName: 'Botha', email: 'frank.botha@company.co.za', jobTitle: 'HR Manager', departmentName: 'Human Resources' },
    { firstName: 'Grace', lastName: 'Dlamini', email: 'grace.dlamini@company.co.za', jobTitle: 'IT Administrator', departmentName: 'IT' },
    { firstName: 'Henry', lastName: 'Govender', email: 'henry.govender@company.co.za', jobTitle: 'Sales Director', departmentName: 'Sales' }
  ];

  const stats = {
    departmentsCreated: 0,
    departmentsUpdated: 0,
    employeesCreated: 0,
    employeesUpdated: 0,
    employeesDeactivated: 0,
    errors: 0
  };

  // Sync departments
  for (const deptData of simulatedDepartments) {
    try {
      const existing = await Department.findOne({ companyId, code: deptData.code });
      if (existing) {
        existing.name = deptData.name;
        existing.description = deptData.description;
        existing.source = 'azure_ad';
        existing.lastSyncedAt = new Date();
        await existing.save();
        stats.departmentsUpdated++;
      } else {
        await Department.create({
          ...deptData,
          companyId,
          source: 'azure_ad',
          lastSyncedAt: new Date(),
          createdBy: req.user._id
        });
        stats.departmentsCreated++;
      }
    } catch (err) {
      stats.errors++;
    }
  }

  // Sync employees
  for (const empData of simulatedEmployees) {
    try {
      const dept = await Department.findOne({ companyId, name: empData.departmentName });
      const existing = await Employee.findOne({ companyId, email: empData.email });
      
      if (existing) {
        existing.firstName = empData.firstName;
        existing.lastName = empData.lastName;
        existing.jobTitle = empData.jobTitle;
        existing.department = dept?._id;
        existing.departmentName = empData.departmentName;
        existing.source = 'azure_ad';
        existing.lastSyncedAt = new Date();
        existing.syncStatus = 'synced';
        await existing.save();
        stats.employeesUpdated++;
      } else {
        await Employee.create({
          ...empData,
          employeeId: `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`.toUpperCase(),
          companyId,
          department: dept?._id,
          departmentName: empData.departmentName,
          source: 'azure_ad',
          lastSyncedAt: new Date(),
          syncStatus: 'synced',
          status: 'active',
          createdBy: req.user._id
        });
        stats.employeesCreated++;
      }
    } catch (err) {
      stats.errors++;
    }
  }

  stats.duration = Math.round((Date.now() - startTime) / 1000);

  await config.recordSync(stats, stats.errors > 0 ? 'partial' : 'success', req.user._id);

  logger.logAudit('azure_ad_sync_completed', req.user._id, { companyId, stats });

  res.json({ success: true, data: { stats, config } });
});

// ==================== EMPLOYEES ====================

exports.getEmployees = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const { status, department, search, page = 1, limit = 20 } = req.query;

  const query = { companyId };
  if (status) query.status = status;
  if (department) query.department = department;
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const employees = await Employee.find(query)
    .sort({ lastName: 1, firstName: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('department', 'name code')
    .lean();

  const total = await Employee.countDocuments(query);

  res.json({
    success: true,
    data: {
      employees,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    }
  });
});

exports.getEmployee = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const employee = await Employee.findOne({ _id: req.params.id, companyId })
    .populate('department', 'name code')
    .populate('manager', 'firstName lastName email');

  if (!employee) throw new AppError('Employee not found', 404);

  res.json({ success: true, data: employee });
});

exports.createEmployee = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const employee = await Employee.create({
    ...req.body,
    companyId,
    source: 'manual',
    createdBy: req.user._id
  });

  logger.logAudit('employee_created', req.user._id, { employeeId: employee._id });

  res.status(201).json({ success: true, data: employee });
});

exports.updateEmployee = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const employee = await Employee.findOneAndUpdate(
    { _id: req.params.id, companyId },
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!employee) throw new AppError('Employee not found', 404);

  logger.logAudit('employee_updated', req.user._id, { employeeId: employee._id });

  res.json({ success: true, data: employee });
});

exports.provisionEmployeeUser = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const { role = 'user', department = 'sales' } = req.body;

  const employee = await Employee.findOne({ _id: req.params.id, companyId });
  if (!employee) throw new AppError('Employee not found', 404);

  if (employee.userProvisioned) {
    throw new AppError('User account already provisioned for this employee', 400);
  }

  await employee.provisionUser(role, department);

  logger.logAudit('employee_user_provisioned', req.user._id, { employeeId: employee._id, userId: employee.userId });

  res.json({ success: true, data: employee });
});

// ==================== DEPARTMENTS ====================

exports.getDepartments = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const { status, page = 1, limit = 50 } = req.query;

  const query = { companyId };
  if (status) query.status = status;

  const departments = await Department.find(query)
    .sort({ level: 1, name: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('head', 'firstName lastName email')
    .lean();

  const total = await Department.countDocuments(query);

  res.json({
    success: true,
    data: {
      departments,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    }
  });
});

exports.getDepartmentTree = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const tree = await Department.getTree(companyId);

  res.json({ success: true, data: tree });
});

exports.createDepartment = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const department = await Department.create({
    ...req.body,
    companyId,
    source: 'manual',
    createdBy: req.user._id
  });

  logger.logAudit('department_created', req.user._id, { departmentId: department._id });

  res.status(201).json({ success: true, data: department });
});

exports.updateDepartment = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const department = await Department.findOneAndUpdate(
    { _id: req.params.id, companyId },
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!department) throw new AppError('Department not found', 404);

  logger.logAudit('department_updated', req.user._id, { departmentId: department._id });

  res.json({ success: true, data: department });
});

// ==================== USER MANAGEMENT ====================

exports.getUsers = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const { role, department, isActive, search, page = 1, limit = 20 } = req.query;

  const query = { companyId };
  if (role) query.role = role;
  if (department) query.department = department;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .select('-password -twoFactorSecret')
    .sort({ lastName: 1, firstName: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: {
      users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    }
  });
});

exports.getUser = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const user = await User.findOne({ _id: req.params.id, companyId })
    .select('-password -twoFactorSecret')
    .populate('manager', 'firstName lastName email');

  if (!user) throw new AppError('User not found', 404);

  res.json({ success: true, data: user });
});

exports.createUser = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  
  // Company admin can only create users with role <= admin
  const allowedRoles = ['admin', 'manager', 'kam', 'analyst', 'user'];
  if (!allowedRoles.includes(req.body.role)) {
    throw new AppError('Invalid role for company admin', 400);
  }

  const user = await User.create({
    ...req.body,
    companyId
  });

  logger.logAudit('user_created', req.user._id, { userId: user._id, email: user.email });

  const userResponse = await User.findById(user._id).select('-password -twoFactorSecret');

  res.status(201).json({ success: true, data: userResponse });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  
  // Prevent changing role to super_admin
  if (req.body.role === 'super_admin') {
    throw new AppError('Cannot assign super_admin role', 400);
  }

  const user = await User.findOneAndUpdate(
    { _id: req.params.id, companyId },
    req.body,
    { new: true, runValidators: true }
  ).select('-password -twoFactorSecret');

  if (!user) throw new AppError('User not found', 404);

  logger.logAudit('user_updated', req.user._id, { userId: user._id });

  res.json({ success: true, data: user });
});

exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const user = await User.findOne({ _id: req.params.id, companyId });

  if (!user) throw new AppError('User not found', 404);

  user.isActive = !user.isActive;
  await user.save();

  logger.logAudit('user_status_toggled', req.user._id, { userId: user._id, isActive: user.isActive });

  res.json({ success: true, data: { isActive: user.isActive } });
});

// ==================== AUDIT LOGS ====================

exports.getAuditLogs = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const { action, userId, startDate, endDate, page = 1, limit = 50 } = req.query;

  const query = { companyId };
  if (action) query.action = action;
  if (userId) query.userId = userId;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const logs = await AuditLog.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('userId', 'firstName lastName email')
    .lean();

  const total = await AuditLog.countDocuments(query);

  res.json({
    success: true,
    data: {
      logs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    }
  });
});

// ==================== ERP SETTINGS ====================

exports.getERPSettings = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const settings = await ERPSettings.getOrCreate(companyId);

  res.json({ success: true, data: settings });
});

exports.updateERPSettings = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  let settings = await ERPSettings.findOne({ companyId });

  if (!settings) {
    settings = await ERPSettings.create({ companyId, ...req.body, updatedBy: req.user._id });
  } else {
    // Deep merge for nested objects
    if (req.body.sap) Object.assign(settings.sap, req.body.sap);
    if (req.body.erp) Object.assign(settings.erp, req.body.erp);
    if (req.body.masterData) Object.assign(settings.masterData, req.body.masterData);
    if (req.body.salesData) Object.assign(settings.salesData, req.body.salesData);
    if (req.body.pos) Object.assign(settings.pos, req.body.pos);
    settings.updatedBy = req.user._id;
    await settings.save();
  }

  logger.logAudit('erp_settings_updated', req.user._id, { companyId });

  res.json({ success: true, data: settings });
});

exports.testSAPConnection = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const settings = await ERPSettings.findOne({ companyId });

  if (!settings) throw new AppError('ERP settings not configured', 400);

  await settings.testSAPConnection();

  logger.logAudit('sap_connection_tested', req.user._id, { companyId, status: settings.sap.connectionStatus });

  res.json({ success: true, data: { status: settings.sap.connectionStatus, lastTest: settings.sap.lastConnectionTest } });
});

exports.testERPConnection = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const settings = await ERPSettings.findOne({ companyId });

  if (!settings) throw new AppError('ERP settings not configured', 400);

  await settings.testERPConnection();

  logger.logAudit('erp_connection_tested', req.user._id, { companyId, status: settings.erp.connectionStatus });

  res.json({ success: true, data: { status: settings.erp.connectionStatus, lastTest: settings.erp.lastConnectionTest } });
});

exports.syncMasterData = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const { dataType } = req.body; // 'customers', 'products', 'pricing'
  
  const settings = await ERPSettings.findOne({ companyId });
  if (!settings) throw new AppError('ERP settings not configured', 400);

  // Simulated sync - in production this would call the actual ERP API
  const startTime = Date.now();
  const stats = {
    status: 'success',
    recordsProcessed: Math.floor(Math.random() * 100) + 50,
    recordsCreated: Math.floor(Math.random() * 20) + 5,
    recordsUpdated: Math.floor(Math.random() * 30) + 10,
    recordsFailed: 0,
    duration: 0
  };
  stats.duration = Math.round((Date.now() - startTime) / 1000) + Math.floor(Math.random() * 5);

  // Update last sync time
  if (dataType === 'customers') {
    settings.masterData.lastCustomerSync = new Date();
  } else if (dataType === 'products') {
    settings.masterData.lastProductSync = new Date();
  } else if (dataType === 'pricing') {
    settings.masterData.lastPricingSync = new Date();
  }

  await settings.recordSync(`master_data_${dataType}`, stats, req.user._id);

  logger.logAudit('master_data_synced', req.user._id, { companyId, dataType, stats });

  res.json({ success: true, data: { stats, dataType } });
});

exports.syncSalesData = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  
  const settings = await ERPSettings.findOne({ companyId });
  if (!settings) throw new AppError('ERP settings not configured', 400);

  // Simulated sync - in production this would call the actual sales data API
  const startTime = Date.now();
  const stats = {
    status: 'success',
    recordsProcessed: Math.floor(Math.random() * 500) + 200,
    recordsCreated: Math.floor(Math.random() * 100) + 50,
    recordsUpdated: Math.floor(Math.random() * 50) + 20,
    recordsFailed: Math.floor(Math.random() * 5),
    duration: 0
  };
  stats.duration = Math.round((Date.now() - startTime) / 1000) + Math.floor(Math.random() * 10);

  settings.salesData.lastBatchImport = new Date();
  settings.salesData.lastBatchImportStatus = 'success';
  settings.salesData.lastBatchImportRecords = stats.recordsProcessed;

  await settings.recordSync('sales_data', stats, req.user._id);

  logger.logAudit('sales_data_synced', req.user._id, { companyId, stats });

  res.json({ success: true, data: { stats } });
});

exports.getERPSyncHistory = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const { limit = 20 } = req.query;
  
  const settings = await ERPSettings.findOne({ companyId });
  if (!settings) {
    return res.json({ success: true, data: [] });
  }

  const history = settings.syncHistory.slice(0, parseInt(limit));

  res.json({ success: true, data: history });
});

// ==================== USER ROLE MANAGEMENT ====================

exports.updateUserRole = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const { role } = req.body;
  
  // Validate role - company admin can only assign these roles
  const allowedRoles = ['admin', 'manager', 'kam', 'analyst', 'user'];
  if (!allowedRoles.includes(role)) {
    throw new AppError('Invalid role. Allowed roles: admin, manager, kam, analyst, user', 400);
  }

  const user = await User.findOneAndUpdate(
    { _id: req.params.id, companyId },
    { role },
    { new: true, runValidators: true }
  ).select('-password -twoFactorSecret');

  if (!user) throw new AppError('User not found', 404);

  logger.logAudit('user_role_updated', req.user._id, { userId: user._id, newRole: role });

  res.json({ success: true, data: user });
});

// ==================== DASHBOARD STATS ====================

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);

  const [
    totalUsers,
    activeUsers,
    totalEmployees,
    totalDepartments,
    totalCourses,
    publishedCourses,
    activeGames,
    activeAnnouncements,
    publishedPolicies
  ] = await Promise.all([
    User.countDocuments({ companyId }),
    User.countDocuments({ companyId, isActive: true }),
    Employee.countDocuments({ companyId }),
    Department.countDocuments({ companyId, status: 'active' }),
    LearningCourse.countDocuments({ companyId }),
    LearningCourse.countDocuments({ companyId, status: 'published' }),
    Game.countDocuments({ companyId, status: 'active' }),
    Announcement.countDocuments({ companyId, status: 'published' }),
    Policy.countDocuments({ companyId, status: 'published' })
  ]);

  // Get ERP and Azure AD status
  const [erpSettings, azureConfig] = await Promise.all([
    ERPSettings.findOne({ companyId }),
    AzureADConfig.findOne({ companyId })
  ]);

  res.json({
    success: true,
    data: {
      users: { total: totalUsers, active: activeUsers },
      employees: { total: totalEmployees },
      departments: { total: totalDepartments },
      courses: { total: totalCourses, published: publishedCourses },
      games: { active: activeGames },
      announcements: { active: activeAnnouncements },
      policies: { published: publishedPolicies },
      integrations: {
        azureAD: azureConfig?.connectionStatus || 'not_configured',
        sap: erpSettings?.sap?.connectionStatus || 'not_configured',
        erp: erpSettings?.erp?.connectionStatus || 'not_configured',
        salesData: erpSettings?.salesData?.connectionStatus || 'not_configured'
      }
    }
  });
});

module.exports = exports;
