const { asyncHandler } = require('../middleware/errorHandler');
const securityService = require('../services/securityService');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const SecurityEvent = require('../models/SecurityEvent');
const _logger = require('../utils/logger');

/**
 * Security Controller
 * Handles RBAC, audit logs, security events, and security monitoring
 */
class SecurityController {
  constructor() {
    this.securityService = securityService;
  }

  // Authentication & Session Management

  /**
   * Enhanced user authentication
   * POST /api/security/authenticate
   */
  authenticate = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const tenantId = req.tenant?.id;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const result = await this.securityService.authenticateUser(
      email,
      password,
      ipAddress,
      userAgent,
      tenantId
    );

    res.json(result);
  });

  /**
   * Validate session
   * GET /api/security/session/validate
   */
  validateSession = asyncHandler(async (req, res) => {
    const sessionToken = req.headers['x-session-token'];

    if (!sessionToken) {
      return res.status(400).json({
        success: false,
        error: 'Session token is required'
      });
    }

    const result = await this.securityService.validateSession(sessionToken);

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * Logout user
   * POST /api/security/logout
   */
  logout = asyncHandler(async (req, res) => {
    const sessionToken = req.headers['x-session-token'];
    const userId = req.user?._id;
    const tenantId = req.tenant?.id;

    if (sessionToken) {
      await this.securityService.invalidateSession(
        sessionToken,
        userId,
        tenantId,
        'USER_LOGOUT'
      );
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });

  // Role-Based Access Control (RBAC)

  /**
   * Check user permission
   * POST /api/security/permissions/check
   */
  checkPermission = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const userId = req.user._id;
    const { resource, action, context = {} } = req.body;

    if (!resource || !action) {
      return res.status(400).json({
        success: false,
        error: 'Resource and action are required'
      });
    }

    const result = await this.securityService.checkPermission(
      userId,
      tenantId,
      resource,
      action,
      context
    );

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * Get user permissions
   * GET /api/security/permissions/user/:userId
   */
  getUserPermissions = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { userId } = req.params;

    const user = await User.findOne({
      _id: userId,
      tenantId,
      isActive: true
    }).populate('roles permissions');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const allPermissions = this.securityService.aggregatePermissions(
      user.roles,
      user.permissions
    );

    res.json({
      success: true,
      data: {
        userId,
        roles: user.roles.map((role) => ({
          id: role._id,
          name: role.name,
          displayName: role.displayName,
          permissions: role.permissions
        })),
        directPermissions: user.permissions,
        effectivePermissions: allPermissions
      }
    });
  });

  // Role Management

  /**
   * Create role
   * POST /api/security/roles
   */
  createRole = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const userId = req.user._id;
    const roleData = req.body;

    const role = await this.securityService.manageRole(tenantId, roleData, userId);

    res.status(201).json({
      success: true,
      data: role
    });
  });

  /**
   * Get all roles
   * GET /api/security/roles
   */
  getRoles = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { type, isActive = true, includeSystem = false } = req.query;

    const query = { tenantId, isActive };
    if (type) query.type = type;
    if (!includeSystem) query.isSystem = false;

    const roles = await Role.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .sort({ level: 1, name: 1 });

    res.json({
      success: true,
      data: roles
    });
  });

  /**
   * Get role by ID
   * GET /api/security/roles/:id
   */
  getRole = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { id } = req.params;

    const role = await Role.findOne({ _id: id, tenantId })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('parentRole', 'name displayName')
      .populate('childRoles', 'name displayName');

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }

    // Get effective permissions
    const effectivePermissions = await role.getEffectivePermissions();

    res.json({
      success: true,
      data: {
        ...role.toObject(),
        effectivePermissions
      }
    });
  });

  /**
   * Update role
   * PUT /api/security/roles/:id
   */
  updateRole = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const userId = req.user._id;
    const { id } = req.params;
    const updates = req.body;

    const role = await Role.findOneAndUpdate(
      { _id: id, tenantId, isSystem: false },
      { ...updates, updatedBy: userId },
      { new: true, runValidators: true }
    );

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found or cannot be updated'
      });
    }

    // Log audit event
    await this.securityService.logAuditEvent({
      tenantId,
      userId,
      action: 'ROLE_UPDATED',
      resource: 'role',
      resourceId: role._id,
      details: { updates }
    });

    res.json({
      success: true,
      data: role
    });
  });

  /**
   * Delete role
   * DELETE /api/security/roles/:id
   */
  deleteRole = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const userId = req.user._id;
    const { id } = req.params;

    const role = await Role.findOne({ _id: id, tenantId, isSystem: false });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found or cannot be deleted'
      });
    }

    // Check if role is assigned to users
    const userCount = await User.countDocuments({
      tenantId,
      roles: id
    });

    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete role that is assigned to users'
      });
    }

    await role.remove();

    // Log audit event
    await this.securityService.logAuditEvent({
      tenantId,
      userId,
      action: 'ROLE_DELETED',
      resource: 'role',
      resourceId: id,
      details: { roleName: role.name }
    });

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  });

  /**
   * Assign role to user
   * POST /api/security/roles/:roleId/assign
   */
  assignRole = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const assignedBy = req.user._id;
    const { roleId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const result = await this.securityService.assignRole(
      tenantId,
      userId,
      roleId,
      assignedBy
    );

    res.json(result);
  });

  // Permission Management

  /**
   * Get all permissions
   * GET /api/security/permissions
   */
  getPermissions = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const {
      resource,
      category,
      riskLevel,
      isActive = true,
      includeSystem = false
    } = req.query;

    const query = { tenantId, isActive };
    if (resource) query.resource = resource;
    if (category) query.category = category;
    if (riskLevel) query.riskLevel = riskLevel;
    if (!includeSystem) query.isSystem = false;

    const permissions = await Permission.find(query)
      .sort({ category: 1, resource: 1, level: 1 });

    res.json({
      success: true,
      data: permissions
    });
  });

  /**
   * Get permission matrix
   * GET /api/security/permissions/matrix
   */
  getPermissionMatrix = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;

    const matrix = await Permission.getPermissionMatrix(tenantId);

    res.json({
      success: true,
      data: matrix
    });
  });

  /**
   * Create permission
   * POST /api/security/permissions
   */
  createPermission = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const userId = req.user._id;
    const permissionData = { ...req.body, tenantId, createdBy: userId };

    const permission = await Permission.create(permissionData);

    // Log audit event
    await this.securityService.logAuditEvent({
      tenantId,
      userId,
      action: 'PERMISSION_CREATED',
      resource: 'permission',
      resourceId: permission._id,
      details: { permissionName: permission.name }
    });

    res.status(201).json({
      success: true,
      data: permission
    });
  });

  // Audit Logs

  /**
   * Get audit logs
   * GET /api/security/audit-logs
   */
  getAuditLogs = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const {
      userId,
      action,
      resource,
      startDate,
      endDate,
      severity,
      page = 1,
      limit = 50
    } = req.query;

    const query = { tenantId };
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (severity) query.severity = severity;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'userId', select: 'firstName lastName email' }
      ]
    };

    const auditLogs = await AuditLog.paginate(query, options);

    res.json({
      success: true,
      data: auditLogs
    });
  });

  /**
   * Get audit log by ID
   * GET /api/security/audit-logs/:id
   */
  getAuditLog = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { id } = req.params;

    const auditLog = await AuditLog.findOne({ _id: id, tenantId })
      .populate('userId', 'firstName lastName email');

    if (!auditLog) {
      return res.status(404).json({
        success: false,
        error: 'Audit log not found'
      });
    }

    res.json({
      success: true,
      data: auditLog
    });
  });

  /**
   * Get audit activity summary
   * GET /api/security/audit-logs/summary
   */
  getAuditSummary = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { startDate, endDate } = req.query;

    const summary = await AuditLog.getActivitySummary(tenantId, {
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: summary
    });
  });

  // Security Events

  /**
   * Get security events
   * GET /api/security/events
   */
  getSecurityEvents = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const {
      type,
      severity,
      investigationStatus,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const query = { tenantId };
    if (type) query.type = type;
    if (severity) query.severity = severity;
    if (investigationStatus) query.investigationStatus = investigationStatus;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'userId', select: 'firstName lastName email' },
        { path: 'assignedTo', select: 'firstName lastName email' }
      ]
    };

    const securityEvents = await SecurityEvent.paginate(query, options);

    res.json({
      success: true,
      data: securityEvents
    });
  });

  /**
   * Get security dashboard
   * GET /api/security/dashboard
   */
  getSecurityDashboard = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { startDate, endDate } = req.query;

    const [
      eventSummary,
      threatTrends,
      topThreats,
      securityThreats
    ] = await Promise.all([
      SecurityEvent.getSecurityDashboard(tenantId, { startDate, endDate }),
      SecurityEvent.getThreatTrends(tenantId, { days: 30 }),
      SecurityEvent.getTopThreats(tenantId, { limit: 10, startDate, endDate }),
      this.securityService.checkSecurityThreats(tenantId)
    ]);

    res.json({
      success: true,
      data: {
        eventSummary,
        threatTrends,
        topThreats,
        securityThreats
      }
    });
  });

  /**
   * Update security event
   * PUT /api/security/events/:id
   */
  updateSecurityEvent = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const userId = req.user._id;
    const { id } = req.params;
    const updates = req.body;

    const securityEvent = await SecurityEvent.findOneAndUpdate(
      { _id: id, tenantId },
      updates,
      { new: true, runValidators: true }
    );

    if (!securityEvent) {
      return res.status(404).json({
        success: false,
        error: 'Security event not found'
      });
    }

    // Log audit event
    await this.securityService.logAuditEvent({
      tenantId,
      userId,
      action: 'SECURITY_EVENT_UPDATED',
      resource: 'security_event',
      resourceId: securityEvent._id,
      details: { updates }
    });

    res.json({
      success: true,
      data: securityEvent
    });
  });

  /**
   * Assign security event for investigation
   * POST /api/security/events/:id/assign
   */
  assignSecurityEvent = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const userId = req.user._id;
    const { id } = req.params;
    const { assignedTo } = req.body;

    const securityEvent = await SecurityEvent.findOne({ _id: id, tenantId });

    if (!securityEvent) {
      return res.status(404).json({
        success: false,
        error: 'Security event not found'
      });
    }

    await securityEvent.assignInvestigator(assignedTo);

    // Log audit event
    await this.securityService.logAuditEvent({
      tenantId,
      userId,
      action: 'SECURITY_EVENT_ASSIGNED',
      resource: 'security_event',
      resourceId: securityEvent._id,
      details: { assignedTo }
    });

    res.json({
      success: true,
      data: securityEvent
    });
  });

  /**
   * Add investigation note
   * POST /api/security/events/:id/notes
   */
  addInvestigationNote = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const userId = req.user._id;
    const { id } = req.params;
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({
        success: false,
        error: 'Note is required'
      });
    }

    const securityEvent = await SecurityEvent.findOne({ _id: id, tenantId });

    if (!securityEvent) {
      return res.status(404).json({
        success: false,
        error: 'Security event not found'
      });
    }

    await securityEvent.addInvestigationNote(note, userId);

    res.json({
      success: true,
      data: securityEvent
    });
  });

  /**
   * Resolve security event
   * POST /api/security/events/:id/resolve
   */
  resolveSecurityEvent = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const userId = req.user._id;
    const { id } = req.params;
    const { action, description } = req.body;

    if (!action || !description) {
      return res.status(400).json({
        success: false,
        error: 'Action and description are required'
      });
    }

    const securityEvent = await SecurityEvent.findOne({ _id: id, tenantId });

    if (!securityEvent) {
      return res.status(404).json({
        success: false,
        error: 'Security event not found'
      });
    }

    await securityEvent.resolve({ action, description }, userId);

    // Log audit event
    await this.securityService.logAuditEvent({
      tenantId,
      userId,
      action: 'SECURITY_EVENT_RESOLVED',
      resource: 'security_event',
      resourceId: securityEvent._id,
      details: { resolution: { action, description } }
    });

    res.json({
      success: true,
      data: securityEvent
    });
  });

  // Security Monitoring

  /**
   * Get security metrics
   * GET /api/security/metrics
   */
  getSecurityMetrics = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { timeWindow = 24 } = req.query; // hours

    const threats = await this.securityService.checkSecurityThreats(
      tenantId,
      timeWindow * 60 * 60 * 1000
    );

    res.json({
      success: true,
      data: threats
    });
  });

  /**
   * Validate password strength
   * POST /api/security/password/validate
   */
  validatePassword = asyncHandler((req, res) => {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    const validation = this.securityService.validatePasswordStrength(password);

    res.json({
      success: true,
      data: validation
    });
  });

  /**
   * Get security policies
   * GET /api/security/policies
   */
  getSecurityPolicies = asyncHandler((req, res) => {
    const policies = this.securityService.securityPolicies;

    res.json({
      success: true,
      data: policies
    });
  });

  /**
   * Update security policies
   * PUT /api/security/policies
   */
  updateSecurityPolicies = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const userId = req.user._id;
    const updates = req.body;

    // Update security policies
    Object.assign(this.securityService.securityPolicies, updates);

    // Log audit event
    await this.securityService.logAuditEvent({
      tenantId,
      userId,
      action: 'SECURITY_POLICY_CHANGED',
      resource: 'system',
      details: { updates }
    });

    res.json({
      success: true,
      data: this.securityService.securityPolicies
    });
  });
}

module.exports = new SecurityController();
