const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const EventEmitter = require('events');

/**
 * Security and Compliance Service
 * Provides RBAC, audit trails, data encryption, compliance reporting, and security monitoring
 */

class SecurityComplianceService extends EventEmitter {
  constructor() {
    super();
    this.roles = new Map();
    this.permissions = new Map();
    this.auditLogs = [];
    this.securityPolicies = new Map();
    this.encryptionKeys = new Map();
    this.complianceRules = new Map();
    this.securityMetrics = new Map();
    this.isInitialized = false;

    this.initializeService();
  }

  async initializeService() {
    try {
      console.log('Initializing Security and Compliance Service...');

      // Initialize RBAC system
      await this.initializeRBAC();

      // Setup encryption
      await this.initializeEncryption();

      // Load compliance rules
      await this.loadComplianceRules();

      // Setup security monitoring
      this.setupSecurityMonitoring();

      // Start audit log cleanup
      this.startAuditLogCleanup();

      this.isInitialized = true;
      console.log('Security and Compliance Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Security and Compliance Service:', error);
    }
  }

  /**
   * Initialize Role-Based Access Control (RBAC)
   */
  async initializeRBAC() {
    // Define permissions
    const permissions = [
      // Analytics permissions
      { id: 'analytics:read', name: 'View Analytics', category: 'analytics' },
      { id: 'analytics:create', name: 'Create Analytics', category: 'analytics' },
      { id: 'analytics:update', name: 'Update Analytics', category: 'analytics' },
      { id: 'analytics:delete', name: 'Delete Analytics', category: 'analytics' },

      // Reporting permissions
      { id: 'reports:read', name: 'View Reports', category: 'reporting' },
      { id: 'reports:create', name: 'Create Reports', category: 'reporting' },
      { id: 'reports:schedule', name: 'Schedule Reports', category: 'reporting' },
      { id: 'reports:export', name: 'Export Reports', category: 'reporting' },

      // Customer permissions
      { id: 'customers:read', name: 'View Customers', category: 'customers' },
      { id: 'customers:create', name: 'Create Customers', category: 'customers' },
      { id: 'customers:update', name: 'Update Customers', category: 'customers' },
      { id: 'customers:delete', name: 'Delete Customers', category: 'customers' },

      // Product permissions
      { id: 'products:read', name: 'View Products', category: 'products' },
      { id: 'products:create', name: 'Create Products', category: 'products' },
      { id: 'products:update', name: 'Update Products', category: 'products' },
      { id: 'products:delete', name: 'Delete Products', category: 'products' },

      // Promotion permissions
      { id: 'promotions:read', name: 'View Promotions', category: 'promotions' },
      { id: 'promotions:create', name: 'Create Promotions', category: 'promotions' },
      { id: 'promotions:update', name: 'Update Promotions', category: 'promotions' },
      { id: 'promotions:delete', name: 'Delete Promotions', category: 'promotions' },
      { id: 'promotions:approve', name: 'Approve Promotions', category: 'promotions' },

      // Workflow permissions
      { id: 'workflows:read', name: 'View Workflows', category: 'workflows' },
      { id: 'workflows:create', name: 'Create Workflows', category: 'workflows' },
      { id: 'workflows:approve', name: 'Approve Workflows', category: 'workflows' },
      { id: 'workflows:admin', name: 'Workflow Administration', category: 'workflows' },

      // Bulk operations permissions
      { id: 'bulk:import', name: 'Import Data', category: 'bulk' },
      { id: 'bulk:export', name: 'Export Data', category: 'bulk' },
      { id: 'bulk:update', name: 'Bulk Update', category: 'bulk' },
      { id: 'bulk:delete', name: 'Bulk Delete', category: 'bulk' },

      // ML permissions
      { id: 'ml:read', name: 'View ML Models', category: 'ml' },
      { id: 'ml:predict', name: 'Run Predictions', category: 'ml' },
      { id: 'ml:train', name: 'Train Models', category: 'ml' },
      { id: 'ml:admin', name: 'ML Administration', category: 'ml' },

      // System permissions
      { id: 'system:admin', name: 'System Administration', category: 'system' },
      { id: 'system:config', name: 'System Configuration', category: 'system' },
      { id: 'system:audit', name: 'View Audit Logs', category: 'system' },
      { id: 'system:security', name: 'Security Management', category: 'system' }
    ];

    permissions.forEach((permission) => {
      this.permissions.set(permission.id, permission);
    });

    // Define roles with permissions
    const roles = [
      {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access to data and reports',
        permissions: [
          'analytics:read', 'reports:read', 'customers:read',
          'products:read', 'promotions:read', 'workflows:read'
        ]
      },
      {
        id: 'analyst',
        name: 'Analyst',
        description: 'Analytics and reporting capabilities',
        permissions: [
          'analytics:read', 'analytics:create', 'reports:read',
          'reports:create', 'reports:export', 'customers:read',
          'products:read', 'promotions:read', 'ml:read', 'ml:predict'
        ]
      },
      {
        id: 'manager',
        name: 'Manager',
        description: 'Management capabilities with approval rights',
        permissions: [
          'analytics:read', 'analytics:create', 'reports:read',
          'reports:create', 'reports:schedule', 'reports:export',
          'customers:read', 'customers:create', 'customers:update',
          'products:read', 'products:create', 'products:update',
          'promotions:read', 'promotions:create', 'promotions:update',
          'promotions:approve', 'workflows:read', 'workflows:approve',
          'bulk:import', 'bulk:export', 'ml:read', 'ml:predict'
        ]
      },
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Full administrative access',
        permissions: [
          'analytics:read', 'analytics:create', 'analytics:update', 'analytics:delete',
          'reports:read', 'reports:create', 'reports:schedule', 'reports:export',
          'customers:read', 'customers:create', 'customers:update', 'customers:delete',
          'products:read', 'products:create', 'products:update', 'products:delete',
          'promotions:read', 'promotions:create', 'promotions:update', 'promotions:delete', 'promotions:approve',
          'workflows:read', 'workflows:create', 'workflows:approve', 'workflows:admin',
          'bulk:import', 'bulk:export', 'bulk:update', 'bulk:delete',
          'ml:read', 'ml:predict', 'ml:train', 'ml:admin',
          'system:admin', 'system:config', 'system:audit', 'system:security'
        ]
      },
      {
        id: 'data_scientist',
        name: 'Data Scientist',
        description: 'ML and advanced analytics capabilities',
        permissions: [
          'analytics:read', 'analytics:create', 'analytics:update',
          'reports:read', 'reports:create', 'reports:export',
          'customers:read', 'products:read', 'promotions:read',
          'ml:read', 'ml:predict', 'ml:train', 'ml:admin',
          'bulk:import', 'bulk:export'
        ]
      },
      {
        id: 'auditor',
        name: 'Auditor',
        description: 'Audit and compliance access',
        permissions: [
          'analytics:read', 'reports:read', 'customers:read',
          'products:read', 'promotions:read', 'workflows:read',
          'system:audit'
        ]
      }
    ];

    roles.forEach((role) => {
      this.roles.set(role.id, role);
    });

    console.log('RBAC system initialized with', permissions.length, 'permissions and', roles.length, 'roles');
  }

  /**
   * Initialize encryption system
   */
  async initializeEncryption() {
    // Generate master encryption key if not exists
    const masterKey = process.env.MASTER_ENCRYPTION_KEY || this.generateEncryptionKey();
    this.encryptionKeys.set('master', masterKey);

    // Generate tenant-specific keys
    this.encryptionKeys.set('tenant_data', this.generateEncryptionKey());
    this.encryptionKeys.set('pii_data', this.generateEncryptionKey());
    this.encryptionKeys.set('financial_data', this.generateEncryptionKey());

    console.log('Encryption system initialized');
  }

  /**
   * Load compliance rules
   */
  async loadComplianceRules() {
    // GDPR compliance rules
    this.complianceRules.set('gdpr', {
      name: 'General Data Protection Regulation',
      rules: [
        {
          id: 'data_retention',
          description: 'Personal data retention limits',
          check: (data) => this.checkDataRetention(data),
          severity: 'high'
        },
        {
          id: 'consent_tracking',
          description: 'Consent tracking for personal data',
          check: (data) => this.checkConsent(data),
          severity: 'high'
        },
        {
          id: 'data_minimization',
          description: 'Data minimization principle',
          check: (data) => this.checkDataMinimization(data),
          severity: 'medium'
        }
      ]
    });

    // SOX compliance rules
    this.complianceRules.set('sox', {
      name: 'Sarbanes-Oxley Act',
      rules: [
        {
          id: 'financial_controls',
          description: 'Financial data controls',
          check: (data) => this.checkFinancialControls(data),
          severity: 'high'
        },
        {
          id: 'audit_trail',
          description: 'Complete audit trail',
          check: (data) => this.checkAuditTrail(data),
          severity: 'high'
        }
      ]
    });

    // PCI DSS compliance rules
    this.complianceRules.set('pci_dss', {
      name: 'Payment Card Industry Data Security Standard',
      rules: [
        {
          id: 'card_data_encryption',
          description: 'Credit card data encryption',
          check: (data) => this.checkCardDataEncryption(data),
          severity: 'critical'
        },
        {
          id: 'access_controls',
          description: 'Access controls for cardholder data',
          check: (data) => this.checkCardDataAccess(data),
          severity: 'high'
        }
      ]
    });

    console.log('Compliance rules loaded:', Array.from(this.complianceRules.keys()));
  }

  /**
   * Setup security monitoring
   */
  setupSecurityMonitoring() {
    // Monitor failed login attempts
    this.on('login_failed', (event) => {
      this.handleFailedLogin(event);
    });

    // Monitor suspicious activities
    this.on('suspicious_activity', (event) => {
      this.handleSuspiciousActivity(event);
    });

    // Monitor data access patterns
    this.on('data_access', (event) => {
      this.monitorDataAccess(event);
    });

    // Periodic security scans
    setInterval(() => {
      this.performSecurityScan();
    }, 60 * 60 * 1000); // Every hour

    console.log('Security monitoring setup complete');
  }

  /**
   * Check user permissions
   */
  hasPermission(user, permission, resource = null) {
    if (!user || !user.roles) {
      return false;
    }

    // Check if user has required permission through any of their roles
    for (const roleId of user.roles) {
      const role = this.roles.get(roleId);
      if (role && role.permissions.includes(permission)) {
        // Additional resource-level checks
        if (resource) {
          return this.checkResourceAccess(user, permission, resource);
        }
        return true;
      }
    }

    return false;
  }

  /**
   * Check resource-level access
   */
  checkResourceAccess(user, permission, resource) {
    // Tenant isolation check
    if (resource.tenantId && user.tenantId !== resource.tenantId) {
      return false;
    }

    // Owner check for certain resources
    if (resource.ownerId && permission.includes('update') || permission.includes('delete')) {
      return resource.ownerId === user.id || this.hasPermission(user, 'system:admin');
    }

    return true;
  }

  /**
   * Create audit log entry
   */
  createAuditLog(event) {
    const auditEntry = {
      id: this.generateAuditId(),
      timestamp: new Date(),
      tenantId: event.tenantId,
      userId: event.userId,
      userEmail: event.userEmail,
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      details: event.details,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      success: event.success,
      errorMessage: event.errorMessage,
      sessionId: event.sessionId,
      requestId: event.requestId
    };

    this.auditLogs.push(auditEntry);

    // Emit audit event for real-time monitoring
    this.emit('audit_log_created', auditEntry);

    // Check for compliance violations
    this.checkComplianceViolations(auditEntry);

    return auditEntry.id;
  }

  /**
   * Get audit logs with filtering
   */
  getAuditLogs(filters = {}, pagination = {}) {
    let logs = [...this.auditLogs];

    // Apply filters
    if (filters.tenantId) {
      logs = logs.filter((log) => log.tenantId === filters.tenantId);
    }

    if (filters.userId) {
      logs = logs.filter((log) => log.userId === filters.userId);
    }

    if (filters.action) {
      logs = logs.filter((log) => log.action === filters.action);
    }

    if (filters.resource) {
      logs = logs.filter((log) => log.resource === filters.resource);
    }

    if (filters.startDate) {
      logs = logs.filter((log) => log.timestamp >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      logs = logs.filter((log) => log.timestamp <= new Date(filters.endDate));
    }

    if (filters.success !== undefined) {
      logs = logs.filter((log) => log.success === filters.success);
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => b.timestamp - a.timestamp);

    // Apply pagination
    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;
    const total = logs.length;
    logs = logs.slice(offset, offset + limit);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Encrypt sensitive data
   */
  encryptData(data, keyType = 'master') {
    const key = this.encryptionKeys.get(keyType);
    if (!key) {
      throw new Error(`Encryption key ${keyType} not found`);
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', key);

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      keyType
    };
  }

  /**
   * Decrypt sensitive data
   */
  decryptData(encryptedData) {
    const key = this.encryptionKeys.get(encryptedData.keyType);
    if (!key) {
      throw new Error(`Encryption key ${encryptedData.keyType} not found`);
    }

    const decipher = crypto.createDecipher('aes-256-gcm', key);
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  /**
   * Hash password
   */
  async hashPassword(password) {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password
   */
  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate secure token
   */
  generateSecureToken(payload, expiresIn = '24h') {
    const secret = process.env.JWT_SECRET || 'default-secret';
    return jwt.sign(payload, secret, { expiresIn });
  }

  /**
   * Verify token
   */
  verifyToken(token) {
    const secret = process.env.JWT_SECRET || 'default-secret';
    return jwt.verify(token, secret);
  }

  /**
   * Check compliance violations
   */
  checkComplianceViolations(auditEntry) {
    this.complianceRules.forEach((compliance, complianceType) => {
      compliance.rules.forEach((rule) => {
        try {
          const violation = rule.check(auditEntry);
          if (violation) {
            this.handleComplianceViolation(complianceType, rule, auditEntry, violation);
          }
        } catch (error) {
          console.error(`Compliance check error for ${rule.id}:`, error);
        }
      });
    });
  }

  /**
   * Handle compliance violation
   */
  handleComplianceViolation(complianceType, rule, auditEntry, violation) {
    const violationEvent = {
      id: this.generateViolationId(),
      timestamp: new Date(),
      complianceType,
      ruleId: rule.id,
      severity: rule.severity,
      description: rule.description,
      auditEntryId: auditEntry.id,
      violation,
      tenantId: auditEntry.tenantId,
      userId: auditEntry.userId
    };

    console.warn('Compliance violation detected:', violationEvent);

    // Emit violation event
    this.emit('compliance_violation', violationEvent);

    // Auto-remediation for critical violations
    if (rule.severity === 'critical') {
      this.performAutoRemediation(violationEvent);
    }
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(tenantId, complianceType, dateRange) {
    const { startDate, endDate } = dateRange;

    // Get relevant audit logs
    const auditLogs = this.getAuditLogs({
      tenantId,
      startDate,
      endDate
    }).logs;

    const compliance = this.complianceRules.get(complianceType);
    if (!compliance) {
      throw new Error(`Compliance type ${complianceType} not found`);
    }

    const report = {
      complianceType,
      complianceName: compliance.name,
      tenantId,
      dateRange: { startDate, endDate },
      generatedAt: new Date(),
      summary: {
        totalEvents: auditLogs.length,
        violations: 0,
        criticalViolations: 0,
        highViolations: 0,
        mediumViolations: 0,
        lowViolations: 0
      },
      ruleResults: [],
      recommendations: []
    };

    // Check each rule
    compliance.rules.forEach((rule) => {
      const ruleResult = {
        ruleId: rule.id,
        description: rule.description,
        severity: rule.severity,
        violations: [],
        compliant: true
      };

      auditLogs.forEach((auditEntry) => {
        try {
          const violation = rule.check(auditEntry);
          if (violation) {
            ruleResult.violations.push({
              auditEntryId: auditEntry.id,
              timestamp: auditEntry.timestamp,
              details: violation
            });
            ruleResult.compliant = false;
            report.summary.violations++;
            report.summary[`${rule.severity}Violations`]++;
          }
        } catch (error) {
          console.error(`Rule check error for ${rule.id}:`, error);
        }
      });

      report.ruleResults.push(ruleResult);
    });

    // Generate recommendations
    report.recommendations = this.generateComplianceRecommendations(report);

    return report;
  }

  /**
   * Generate security metrics
   */
  getSecurityMetrics(tenantId, timeRange = '24h') {
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case '24h':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
    }

    const auditLogs = this.getAuditLogs({
      tenantId,
      startDate,
      endDate
    }).logs;

    const metrics = {
      timeRange,
      totalEvents: auditLogs.length,
      successfulEvents: auditLogs.filter((log) => log.success).length,
      failedEvents: auditLogs.filter((log) => !log.success).length,
      uniqueUsers: new Set(auditLogs.map((log) => log.userId)).size,
      topActions: this.getTopActions(auditLogs),
      topResources: this.getTopResources(auditLogs),
      failureRate: auditLogs.length > 0 ?
        `${(auditLogs.filter((log) => !log.success).length / auditLogs.length * 100).toFixed(2)}%` : '0%',
      securityAlerts: this.getSecurityAlerts(auditLogs),
      complianceStatus: this.getComplianceStatus(tenantId)
    };

    return metrics;
  }

  // Helper methods for compliance checks
  checkDataRetention(auditEntry) {
    // Mock implementation - would check actual data retention policies
    if (auditEntry.action === 'data_access' && auditEntry.details?.dataAge > 365) {
      return 'Data older than retention policy accessed';
    }
    return null;
  }

  checkConsent(auditEntry) {
    // Mock implementation - would check consent records
    if (auditEntry.resource === 'customer' && !auditEntry.details?.consentVerified) {
      return 'Personal data accessed without verified consent';
    }
    return null;
  }

  checkDataMinimization(auditEntry) {
    // Mock implementation - would check data minimization
    if (auditEntry.details?.fieldsAccessed > 10) {
      return 'Excessive data fields accessed';
    }
    return null;
  }

  checkFinancialControls(auditEntry) {
    // Mock implementation - would check financial controls
    if (auditEntry.resource === 'financial_data' && !auditEntry.details?.approvalRequired) {
      return 'Financial data accessed without proper approval';
    }
    return null;
  }

  checkAuditTrail(auditEntry) {
    // Mock implementation - would check audit trail completeness
    if (!auditEntry.details || Object.keys(auditEntry.details).length === 0) {
      return 'Incomplete audit trail information';
    }
    return null;
  }

  checkCardDataEncryption(auditEntry) {
    // Mock implementation - would check card data encryption
    if (auditEntry.resource === 'payment_data' && !auditEntry.details?.encrypted) {
      return 'Unencrypted card data accessed';
    }
    return null;
  }

  checkCardDataAccess(auditEntry) {
    // Mock implementation - would check card data access controls
    if (auditEntry.resource === 'payment_data' && !auditEntry.details?.authorizedAccess) {
      return 'Unauthorized access to cardholder data';
    }
    return null;
  }

  // Security monitoring methods
  handleFailedLogin(event) {
    const key = `failed_logins:${event.ipAddress}`;
    const count = this.securityMetrics.get(key) || 0;
    this.securityMetrics.set(key, count + 1);

    // Block IP after 5 failed attempts
    if (count >= 5) {
      this.emit('ip_blocked', { ipAddress: event.ipAddress, reason: 'Too many failed login attempts' });
    }
  }

  handleSuspiciousActivity(event) {
    console.warn('Suspicious activity detected:', event);

    // Create high-priority audit log
    this.createAuditLog({
      ...event,
      action: 'suspicious_activity',
      success: false
    });
  }

  monitorDataAccess(event) {
    // Track data access patterns
    const userKey = `data_access:${event.userId}`;
    const accesses = this.securityMetrics.get(userKey) || [];
    accesses.push({
      timestamp: new Date(),
      resource: event.resource,
      action: event.action
    });

    // Keep only last 100 accesses
    if (accesses.length > 100) {
      accesses.splice(0, accesses.length - 100);
    }

    this.securityMetrics.set(userKey, accesses);

    // Detect unusual patterns
    this.detectUnusualAccess(event.userId, accesses);
  }

  detectUnusualAccess(userId, accesses) {
    // Simple anomaly detection
    const recentAccesses = accesses.filter((access) =>
      Date.now() - access.timestamp.getTime() < 60 * 60 * 1000 // Last hour
    );

    if (recentAccesses.length > 50) {
      this.emit('suspicious_activity', {
        userId,
        reason: 'Unusual high-frequency data access',
        count: recentAccesses.length
      });
    }
  }

  performSecurityScan() {
    console.log('Performing security scan...');

    // Check for security policy violations
    this.checkSecurityPolicies();

    // Check for expired tokens
    this.checkExpiredTokens();

    // Check for inactive users
    this.checkInactiveUsers();
  }

  checkSecurityPolicies() {
    // Mock implementation - would check actual security policies
    console.log('Security policies checked');
  }

  checkExpiredTokens() {
    // Mock implementation - would check token expiration
    console.log('Token expiration checked');
  }

  checkInactiveUsers() {
    // Mock implementation - would check user activity
    console.log('Inactive users checked');
  }

  performAutoRemediation(violationEvent) {
    console.log('Performing auto-remediation for critical violation:', violationEvent.id);

    // Mock auto-remediation actions
    switch (violationEvent.ruleId) {
      case 'card_data_encryption':
        // Immediately encrypt unencrypted card data
        console.log('Auto-encrypting card data');
        break;
      case 'unauthorized_access':
        // Suspend user account
        console.log('Suspending user account');
        break;
      default:
        console.log('No auto-remediation available for this violation');
    }
  }

  // Utility methods
  generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  generateAuditId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateViolationId() {
    return `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getTopActions(auditLogs) {
    const actionCounts = {};
    auditLogs.forEach((log) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    return Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));
  }

  getTopResources(auditLogs) {
    const resourceCounts = {};
    auditLogs.forEach((log) => {
      resourceCounts[log.resource] = (resourceCounts[log.resource] || 0) + 1;
    });

    return Object.entries(resourceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([resource, count]) => ({ resource, count }));
  }

  getSecurityAlerts(auditLogs) {
    return auditLogs
      .filter((log) => !log.success || log.action === 'suspicious_activity')
      .slice(0, 10)
      .map((log) => ({
        timestamp: log.timestamp,
        severity: log.success ? 'medium' : 'high',
        message: log.errorMessage || 'Suspicious activity detected',
        userId: log.userId
      }));
  }

  getComplianceStatus(tenantId) {
    // Mock compliance status
    return {
      gdpr: 'compliant',
      sox: 'compliant',
      pci_dss: 'non_compliant',
      lastChecked: new Date()
    };
  }

  generateComplianceRecommendations(report) {
    const recommendations = [];

    if (report.summary.criticalViolations > 0) {
      recommendations.push({
        priority: 'critical',
        title: 'Address Critical Violations',
        description: 'Immediate action required for critical compliance violations'
      });
    }

    if (report.summary.violations > report.summary.totalEvents * 0.1) {
      recommendations.push({
        priority: 'high',
        title: 'Review Security Policies',
        description: 'High violation rate indicates need for policy review'
      });
    }

    return recommendations;
  }

  startAuditLogCleanup() {
    // Clean up old audit logs every day
    setInterval(() => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90); // Keep 90 days

      const initialCount = this.auditLogs.length;
      this.auditLogs = this.auditLogs.filter((log) => log.timestamp > cutoff);

      const removedCount = initialCount - this.auditLogs.length;
      if (removedCount > 0) {
        console.log(`Cleaned up ${removedCount} old audit log entries`);
      }
    }, 24 * 60 * 60 * 1000); // Daily
  }
}

module.exports = SecurityComplianceService;
