const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Models
const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const AuditLog = require('../models/AuditLog');
const SecurityEvent = require('../models/SecurityEvent');

/**
 * Enhanced Security Service
 * Handles RBAC, audit logging, security events, and tenant-aware permissions
 */
class SecurityService {
  constructor() {
    this.sessionStore = new Map();
    this.failedAttempts = new Map();
    this.securityPolicies = {
      maxFailedAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      passwordMinLength: 8,
      passwordRequireSpecialChar: true,
      passwordRequireNumber: true,
      passwordRequireUppercase: true,
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      requireMFA: false,
      allowedIpRanges: [],
      maxConcurrentSessions: 5
    };
  }

  /**
   * Enhanced user authentication with security logging
   */
  async authenticateUser(email, password, ipAddress, userAgent, tenantId) {
    try {
      const startTime = Date.now();
      
      // Check for account lockout
      const lockoutKey = `${email}_${tenantId}`;
      const failedAttempt = this.failedAttempts.get(lockoutKey);
      
      if (failedAttempt && failedAttempt.lockedUntil > Date.now()) {
        await this.logSecurityEvent({
          type: 'AUTHENTICATION_BLOCKED',
          severity: 'HIGH',
          tenantId,
          email,
          ipAddress,
          userAgent,
          details: {
            reason: 'Account locked due to failed attempts',
            lockedUntil: new Date(failedAttempt.lockedUntil)
          }
        });
        
        throw new Error('Account temporarily locked due to failed login attempts');
      }

      // Find user with tenant context (or without if tenantId is null in single-tenant mode)
      const userQuery = { 
        email: email.toLowerCase(),
        isActive: true,
        isDeleted: false
      };
      
      // Only add tenantId filter if provided (for multi-tenant scenarios)
      if (tenantId) {
        userQuery.tenantId = tenantId;
      }
      
      const user = await User.findOne(userQuery);

      if (!user) {
        // For logging, use provided tenantId or 'unknown'
        const logTenantId = tenantId || 'unknown';
        await this.recordFailedAttempt(lockoutKey, ipAddress, userAgent, logTenantId);
        // Skip security event logging if tenantId is not available (prevents validation errors)
        if (tenantId) {
          await this.logSecurityEvent({
            type: 'AUTHENTICATION_FAILED',
            severity: 'MEDIUM',
            tenantId,
            email,
            ipAddress,
            userAgent,
            details: { reason: 'User not found' }
          });
        }
        throw new Error('Invalid credentials');
      }

      // Use the user's tenantId if not provided in request (for single-tenant scenarios)
      const effectiveTenantId = tenantId || user.tenantId;

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        await this.recordFailedAttempt(lockoutKey, ipAddress, userAgent, effectiveTenantId);
        if (effectiveTenantId) {
          await this.logSecurityEvent({
            type: 'AUTHENTICATION_FAILED',
            severity: 'MEDIUM',
            tenantId: effectiveTenantId,
            userId: user._id,
            email,
            ipAddress,
            userAgent,
            details: { reason: 'Invalid password' }
          });
        }
        throw new Error('Invalid credentials');
      }

      // Check IP restrictions
      if (this.securityPolicies.allowedIpRanges.length > 0) {
        if (!this.isIpAllowed(ipAddress)) {
          if (effectiveTenantId) {
            await this.logSecurityEvent({
              type: 'AUTHENTICATION_BLOCKED',
              severity: 'HIGH',
              tenantId: effectiveTenantId,
              userId: user._id,
              email,
              ipAddress,
              userAgent,
              details: { reason: 'IP address not in allowed ranges' }
            });
          }
          throw new Error('Access denied from this IP address');
        }
      }

      // Clear failed attempts on successful login
      this.failedAttempts.delete(lockoutKey);

      // Generate session token
      const sessionToken = this.generateSessionToken();
      const tokenPayload = {
        userId: user._id,
        tenantId: user.tenantId,
        email: user.email,
        role: user.role, // Single role, not array
        permissions: user.permissions || [], // Use direct permissions if available
        sessionId: sessionToken
      };

      const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: '24h'
      });

      // Store session
      this.sessionStore.set(sessionToken, {
        userId: user._id,
        tenantId: user.tenantId,
        ipAddress,
        userAgent,
        createdAt: new Date(),
        lastActivity: new Date(),
        isActive: true
      });

      // Update user login info
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            lastLogin: new Date(),
            lastLoginIp: ipAddress,
            lastLoginUserAgent: userAgent
          },
          $inc: { loginCount: 1 }
        }
      );

      // Log successful authentication (only if tenantId is available)
      if (effectiveTenantId) {
        await this.logSecurityEvent({
          type: 'AUTHENTICATION_SUCCESS',
          severity: 'LOW',
          tenantId: effectiveTenantId,
          userId: user._id,
          email,
          ipAddress,
          userAgent,
          details: {
            sessionId: sessionToken,
            authenticationTime: Date.now() - startTime
          }
        });

        // Log audit event
        await this.logAuditEvent({
          tenantId: effectiveTenantId,
          userId: user._id,
          action: 'USER_LOGIN',
          resource: 'authentication',
          resourceId: user._id,
          ipAddress,
          userAgent,
          details: {
            loginMethod: 'password',
            sessionId: sessionToken
          }
        });
      }

      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role, // Single role
          permissions: tokenPayload.permissions,
          tenantId: user.tenantId
        },
        token: accessToken, // Changed from accessToken to token for consistency
        sessionToken,
        expiresIn: '24h'
      };

    } catch (error) {
      logger.error('Authentication error:', error);
      throw error;
    }
  }

  /**
   * Role-Based Access Control (RBAC) check
   */
  async checkPermission(userId, tenantId, resource, action, context = {}) {
    try {
      // Get user with roles and permissions
      const user = await User.findOne({
        _id: userId,
        tenantId,
        isActive: true
      }).populate('roles permissions');

      if (!user) {
        return { allowed: false, reason: 'User not found' };
      }

      // Super admin bypass
      if (user.roles.some(role => role.name === 'super_admin')) {
        return { allowed: true, reason: 'Super admin access' };
      }

      // Aggregate all permissions from roles and direct permissions
      const allPermissions = this.aggregatePermissions(user.roles, user.permissions);

      // Check for specific permission
      const requiredPermission = `${resource}:${action}`;
      const hasPermission = allPermissions.some(permission => {
        // Exact match
        if (permission === requiredPermission) return true;
        
        // Wildcard match (e.g., "reports:*" matches "reports:create")
        if (permission.endsWith(':*')) {
          const resourcePart = permission.split(':')[0];
          return requiredPermission.startsWith(`${resourcePart}:`);
        }
        
        // Global wildcard
        if (permission === '*:*') return true;
        
        return false;
      });

      // Check context-based permissions (e.g., own resources only)
      if (hasPermission && context.resourceOwnerId) {
        const ownershipPermission = `${resource}:${action}:own`;
        const globalPermission = `${resource}:${action}:all`;
        
        const hasOwnershipPermission = allPermissions.includes(ownershipPermission);
        const hasGlobalPermission = allPermissions.includes(globalPermission);
        
        if (hasOwnershipPermission && context.resourceOwnerId.toString() !== userId.toString()) {
          return { allowed: false, reason: 'Can only access own resources' };
        }
        
        if (!hasOwnershipPermission && !hasGlobalPermission) {
          return { allowed: false, reason: 'Insufficient ownership permissions' };
        }
      }

      // Log permission check for audit
      await this.logAuditEvent({
        tenantId,
        userId,
        action: 'PERMISSION_CHECK',
        resource: 'rbac',
        details: {
          requestedPermission: requiredPermission,
          result: hasPermission ? 'ALLOWED' : 'DENIED',
          context
        }
      });

      return {
        allowed: hasPermission,
        reason: hasPermission ? 'Permission granted' : 'Insufficient permissions',
        permissions: allPermissions
      };

    } catch (error) {
      logger.error('Permission check error:', error);
      return { allowed: false, reason: 'Permission check failed' };
    }
  }

  /**
   * Create or update role with permissions
   */
  async manageRole(tenantId, roleData, userId) {
    try {
      const { name, description, permissions, isActive = true } = roleData;

      // Check if role exists
      let role = await Role.findOne({ name, tenantId });

      if (role) {
        // Update existing role
        role.description = description;
        role.permissions = permissions;
        role.isActive = isActive;
        role.updatedBy = userId;
        await role.save();
      } else {
        // Create new role
        role = await Role.create({
          name,
          description,
          permissions,
          tenantId,
          isActive,
          createdBy: userId
        });
      }

      // Log audit event
      await this.logAuditEvent({
        tenantId,
        userId,
        action: role.isNew ? 'ROLE_CREATED' : 'ROLE_UPDATED',
        resource: 'role',
        resourceId: role._id,
        details: {
          roleName: name,
          permissions,
          isActive
        }
      });

      return role;

    } catch (error) {
      logger.error('Role management error:', error);
      throw error;
    }
  }

  /**
   * Assign role to user
   */
  async assignRole(tenantId, userId, roleId, assignedBy) {
    try {
      const user = await User.findOne({ _id: userId, tenantId });
      const role = await Role.findOne({ _id: roleId, tenantId });

      if (!user || !role) {
        throw new Error('User or role not found');
      }

      // Check if role already assigned
      if (!user.roles.includes(roleId)) {
        user.roles.push(roleId);
        await user.save();
      }

      // Log audit event
      await this.logAuditEvent({
        tenantId,
        userId: assignedBy,
        action: 'ROLE_ASSIGNED',
        resource: 'user_role',
        resourceId: userId,
        details: {
          targetUserId: userId,
          roleId,
          roleName: role.name
        }
      });

      return { success: true, message: 'Role assigned successfully' };

    } catch (error) {
      logger.error('Role assignment error:', error);
      throw error;
    }
  }

  /**
   * Enhanced audit logging
   */
  async logAuditEvent(eventData) {
    try {
      const auditEvent = {
        tenantId: eventData.tenantId,
        userId: eventData.userId,
        action: eventData.action,
        resource: eventData.resource,
        resourceId: eventData.resourceId,
        ipAddress: eventData.ipAddress,
        userAgent: eventData.userAgent,
        timestamp: new Date(),
        details: eventData.details || {},
        severity: eventData.severity || 'INFO'
      };

      await AuditLog.create(auditEvent);

      // Also log to application logger for immediate visibility
      logger.info('Audit Event:', auditEvent);

    } catch (error) {
      logger.error('Audit logging error:', error);
      // Don't throw error to avoid breaking main functionality
    }
  }

  /**
   * Security event logging
   */
  async logSecurityEvent(eventData) {
    try {
      const securityEvent = {
        type: eventData.type,
        severity: eventData.severity,
        tenantId: eventData.tenantId,
        userId: eventData.userId,
        email: eventData.email,
        ipAddress: eventData.ipAddress,
        userAgent: eventData.userAgent,
        timestamp: new Date(),
        details: eventData.details || {}
      };

      await SecurityEvent.create(securityEvent);

      // Log high severity events immediately
      if (eventData.severity === 'HIGH' || eventData.severity === 'CRITICAL') {
        logger.warn('High Severity Security Event:', securityEvent);
      }

    } catch (error) {
      logger.error('Security event logging error:', error);
    }
  }

  /**
   * Session management
   */
  async validateSession(sessionToken) {
    const session = this.sessionStore.get(sessionToken);
    
    if (!session) {
      return { valid: false, reason: 'Session not found' };
    }

    if (!session.isActive) {
      return { valid: false, reason: 'Session inactive' };
    }

    // Check session timeout
    const now = Date.now();
    const sessionAge = now - session.createdAt.getTime();
    
    if (sessionAge > this.securityPolicies.sessionTimeout) {
      this.sessionStore.delete(sessionToken);
      return { valid: false, reason: 'Session expired' };
    }

    // Update last activity
    session.lastActivity = new Date();
    this.sessionStore.set(sessionToken, session);

    return { valid: true, session };
  }

  /**
   * Invalidate session (logout)
   */
  async invalidateSession(sessionToken, userId, tenantId, reason = 'USER_LOGOUT') {
    try {
      const session = this.sessionStore.get(sessionToken);
      
      if (session) {
        session.isActive = false;
        this.sessionStore.delete(sessionToken);

        // Log audit event
        await this.logAuditEvent({
          tenantId,
          userId,
          action: 'USER_LOGOUT',
          resource: 'authentication',
          details: {
            sessionId: sessionToken,
            reason
          }
        });
      }

      return { success: true };

    } catch (error) {
      logger.error('Session invalidation error:', error);
      throw error;
    }
  }

  /**
   * Password security validation
   */
  validatePasswordStrength(password) {
    const errors = [];

    if (password.length < this.securityPolicies.passwordMinLength) {
      errors.push(`Password must be at least ${this.securityPolicies.passwordMinLength} characters long`);
    }

    if (this.securityPolicies.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (this.securityPolicies.passwordRequireNumber && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (this.securityPolicies.passwordRequireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: this.calculatePasswordStrength(password)
    };
  }

  /**
   * Data encryption/decryption utilities
   */
  encryptSensitiveData(data, key = process.env.ENCRYPTION_KEY) {
    try {
      const algorithm = 'aes-256-gcm';
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, key);
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      logger.error('Encryption error:', error);
      throw new Error('Data encryption failed');
    }
  }

  decryptSensitiveData(encryptedData, key = process.env.ENCRYPTION_KEY) {
    try {
      const algorithm = 'aes-256-gcm';
      const decipher = crypto.createDecipher(algorithm, key);
      
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      logger.error('Decryption error:', error);
      throw new Error('Data decryption failed');
    }
  }

  /**
   * Security monitoring and alerts
   */
  async checkSecurityThreats(tenantId, timeWindow = 60 * 60 * 1000) { // 1 hour
    try {
      const since = new Date(Date.now() - timeWindow);
      
      // Check for suspicious activities
      const suspiciousEvents = await SecurityEvent.aggregate([
        {
          $match: {
            tenantId: new mongoose.Types.ObjectId(tenantId),
            timestamp: { $gte: since },
            severity: { $in: ['HIGH', 'CRITICAL'] }
          }
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            events: { $push: '$$ROOT' }
          }
        }
      ]);

      // Check for failed login patterns
      const failedLogins = await SecurityEvent.countDocuments({
        tenantId: new mongoose.Types.ObjectId(tenantId),
        type: 'AUTHENTICATION_FAILED',
        timestamp: { $gte: since }
      });

      // Check for unusual IP addresses
      const uniqueIPs = await SecurityEvent.distinct('ipAddress', {
        tenantId: new mongoose.Types.ObjectId(tenantId),
        timestamp: { $gte: since }
      });

      const threats = {
        suspiciousEvents,
        failedLoginCount: failedLogins,
        uniqueIPCount: uniqueIPs.length,
        riskLevel: this.calculateRiskLevel(suspiciousEvents, failedLogins, uniqueIPs.length),
        recommendations: this.generateSecurityRecommendations(suspiciousEvents, failedLogins)
      };

      return threats;

    } catch (error) {
      logger.error('Security threat check error:', error);
      throw error;
    }
  }

  // Helper methods

  recordFailedAttempt(key, ipAddress, userAgent, tenantId) {
    const attempts = this.failedAttempts.get(key) || { count: 0, attempts: [] };
    attempts.count++;
    attempts.attempts.push({
      timestamp: new Date(),
      ipAddress,
      userAgent
    });

    if (attempts.count >= this.securityPolicies.maxFailedAttempts) {
      attempts.lockedUntil = Date.now() + this.securityPolicies.lockoutDuration;
    }

    this.failedAttempts.set(key, attempts);
  }

  generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  aggregatePermissions(roles, directPermissions) {
    const permissions = new Set();

    // Add permissions from roles
    roles.forEach(role => {
      if (role.permissions && Array.isArray(role.permissions)) {
        role.permissions.forEach(permission => permissions.add(permission));
      }
    });

    // Add direct permissions
    if (directPermissions && Array.isArray(directPermissions)) {
      directPermissions.forEach(permission => permissions.add(permission));
    }

    return Array.from(permissions);
  }

  isIpAllowed(ipAddress) {
    if (this.securityPolicies.allowedIpRanges.length === 0) return true;
    
    // Simple IP range check - in production, use a proper IP range library
    return this.securityPolicies.allowedIpRanges.some(range => {
      return ipAddress.startsWith(range.replace('*', ''));
    });
  }

  calculatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    if (password.length >= 16) score += 1;

    if (score <= 2) return 'WEAK';
    if (score <= 4) return 'MEDIUM';
    if (score <= 6) return 'STRONG';
    return 'VERY_STRONG';
  }

  calculateRiskLevel(suspiciousEvents, failedLogins, uniqueIPs) {
    let riskScore = 0;
    
    if (failedLogins > 10) riskScore += 2;
    if (failedLogins > 50) riskScore += 3;
    
    if (uniqueIPs > 20) riskScore += 2;
    if (uniqueIPs > 50) riskScore += 3;
    
    suspiciousEvents.forEach(event => {
      if (event.count > 5) riskScore += 2;
      if (event.count > 20) riskScore += 3;
    });

    if (riskScore <= 2) return 'LOW';
    if (riskScore <= 5) return 'MEDIUM';
    if (riskScore <= 8) return 'HIGH';
    return 'CRITICAL';
  }

  generateSecurityRecommendations(suspiciousEvents, failedLogins) {
    const recommendations = [];

    if (failedLogins > 20) {
      recommendations.push('Consider implementing CAPTCHA for login attempts');
      recommendations.push('Review and strengthen password policies');
    }

    if (suspiciousEvents.length > 0) {
      recommendations.push('Review recent security events and investigate anomalies');
      recommendations.push('Consider enabling additional monitoring');
    }

    if (recommendations.length === 0) {
      recommendations.push('Security posture appears normal');
    }

    return recommendations;
  }
}

module.exports = new SecurityService();