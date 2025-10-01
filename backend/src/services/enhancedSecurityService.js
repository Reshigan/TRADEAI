const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Models
const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const SecurityEvent = require('../models/SecurityEvent');
const AuditLog = require('../models/AuditLog');

/**
 * Enhanced Security Service
 * Provides comprehensive security features including RBAC, MFA, audit logging, and threat detection
 */
class EnhancedSecurityService {
  constructor() {
    this.failedAttempts = new Map();
    this.suspiciousActivities = new Map();
    this.activeTokens = new Map();
    this.securityPolicies = new Map();
    
    this.initializeSecurityPolicies();
    this.startSecurityMonitoring();
  }

  /**
   * Initialize default security policies
   */
  initializeSecurityPolicies() {
    // Password Policy
    this.securityPolicies.set('password', {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventReuse: 5, // Last 5 passwords
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
      lockoutThreshold: 5,
      lockoutDuration: 30 * 60 * 1000 // 30 minutes
    });

    // Session Policy
    this.securityPolicies.set('session', {
      maxDuration: 8 * 60 * 60 * 1000, // 8 hours
      idleTimeout: 30 * 60 * 1000, // 30 minutes
      maxConcurrentSessions: 3,
      requireMFA: false,
      ipBinding: false
    });

    // Access Policy
    this.securityPolicies.set('access', {
      maxFailedAttempts: 5,
      lockoutDuration: 30 * 60 * 1000, // 30 minutes
      requireMFAForAdmin: true,
      allowedIPs: [],
      blockedIPs: [],
      requireSSL: true
    });
  }

  /**
   * Enhanced user authentication with security checks
   */
  async authenticateUser(email, password, options = {}) {
    try {
      const { ipAddress, userAgent, tenantId } = options;

      // Check for blocked IP
      if (this.isIPBlocked(ipAddress)) {
        await this.logSecurityEvent('blocked_ip_attempt', {
          ipAddress,
          email,
          userAgent
        });
        throw new Error('Access denied from this IP address');
      }

      // Check failed attempts
      const failedKey = `${email}_${ipAddress}`;
      const failedAttempts = this.failedAttempts.get(failedKey) || 0;
      
      if (failedAttempts >= this.securityPolicies.get('access').maxFailedAttempts) {
        await this.logSecurityEvent('account_locked', {
          email,
          ipAddress,
          failedAttempts
        });
        throw new Error('Account temporarily locked due to multiple failed attempts');
      }

      // Find user
      const user = await User.findOne({ email, tenantId }).populate('role');
      if (!user) {
        await this.recordFailedAttempt(failedKey, email, ipAddress);
        throw new Error('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        await this.logSecurityEvent('inactive_user_attempt', {
          userId: user._id,
          email,
          ipAddress
        });
        throw new Error('Account is inactive');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        await this.recordFailedAttempt(failedKey, email, ipAddress);
        throw new Error('Invalid credentials');
      }

      // Check if MFA is required
      if (user.mfaEnabled || this.requiresMFA(user)) {
        return {
          requiresMFA: true,
          userId: user._id,
          mfaToken: this.generateMFAToken(user._id)
        };
      }

      // Clear failed attempts
      this.failedAttempts.delete(failedKey);

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Log successful login
      await this.logSecurityEvent('successful_login', {
        userId: user._id,
        email,
        ipAddress,
        userAgent
      });

      // Update user login info
      user.lastLoginAt = new Date();
      user.lastLoginIP = ipAddress;
      await user.save();

      return {
        success: true,
        user: this.sanitizeUser(user),
        tokens,
        requiresMFA: false
      };

    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  /**
   * Verify MFA token
   */
  async verifyMFA(userId, token, mfaToken) {
    try {
      // Verify MFA token is valid
      if (!this.verifyMFAToken(userId, mfaToken)) {
        throw new Error('Invalid MFA session');
      }

      const user = await User.findById(userId).populate('role');
      if (!user || !user.mfaEnabled) {
        throw new Error('MFA not enabled for this user');
      }

      // Verify TOTP token
      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token,
        window: 2 // Allow 2 time steps (60 seconds) tolerance
      });

      if (!verified) {
        await this.logSecurityEvent('mfa_failed', {
          userId,
          timestamp: new Date()
        });
        throw new Error('Invalid MFA token');
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Log successful MFA
      await this.logSecurityEvent('mfa_success', {
        userId,
        timestamp: new Date()
      });

      return {
        success: true,
        user: this.sanitizeUser(user),
        tokens
      };

    } catch (error) {
      console.error('MFA verification error:', error);
      throw error;
    }
  }

  /**
   * Setup MFA for user
   */
  async setupMFA(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `TradeAI (${user.email})`,
        issuer: 'TradeAI'
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      // Save secret (temporarily, until verified)
      user.mfaTempSecret = secret.base32;
      await user.save();

      return {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntryKey: secret.base32
      };

    } catch (error) {
      console.error('MFA setup error:', error);
      throw error;
    }
  }

  /**
   * Enable MFA after verification
   */
  async enableMFA(userId, token) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.mfaTempSecret) {
        throw new Error('MFA setup not initiated');
      }

      // Verify token with temporary secret
      const verified = speakeasy.totp.verify({
        secret: user.mfaTempSecret,
        encoding: 'base32',
        token,
        window: 2
      });

      if (!verified) {
        throw new Error('Invalid MFA token');
      }

      // Enable MFA
      user.mfaEnabled = true;
      user.mfaSecret = user.mfaTempSecret;
      user.mfaTempSecret = undefined;
      user.mfaEnabledAt = new Date();
      await user.save();

      // Log MFA enabled
      await this.logSecurityEvent('mfa_enabled', {
        userId,
        timestamp: new Date()
      });

      return { success: true, message: 'MFA enabled successfully' };

    } catch (error) {
      console.error('MFA enable error:', error);
      throw error;
    }
  }

  /**
   * Role-Based Access Control (RBAC)
   */
  async checkPermission(userId, resource, action, context = {}) {
    try {
      const user = await User.findById(userId).populate({
        path: 'role',
        populate: {
          path: 'permissions',
          model: 'Permission'
        }
      });

      if (!user || !user.role) {
        return { allowed: false, reason: 'User or role not found' };
      }

      // Check if user is active
      if (!user.isActive) {
        return { allowed: false, reason: 'User account is inactive' };
      }

      // Super admin has all permissions
      if (user.role.name === 'super_admin') {
        return { allowed: true, reason: 'Super admin access' };
      }

      // Check role permissions
      const hasPermission = user.role.permissions.some(permission => {
        return this.matchesPermission(permission, resource, action, context);
      });

      if (!hasPermission) {
        // Log unauthorized access attempt
        await this.logSecurityEvent('unauthorized_access', {
          userId,
          resource,
          action,
          context
        });

        return { allowed: false, reason: 'Insufficient permissions' };
      }

      // Check additional constraints
      const constraints = await this.checkConstraints(user, resource, action, context);
      if (!constraints.allowed) {
        return constraints;
      }

      return { allowed: true, reason: 'Permission granted' };

    } catch (error) {
      console.error('Permission check error:', error);
      return { allowed: false, reason: 'Permission check failed' };
    }
  }

  /**
   * Create or update role
   */
  async manageRole(roleData, options = {}) {
    try {
      const { name, description, permissions, level, isActive = true } = roleData;
      const { userId, tenantId } = options;

      // Check if user has permission to manage roles
      const canManage = await this.checkPermission(userId, 'roles', 'manage');
      if (!canManage.allowed) {
        throw new Error('Insufficient permissions to manage roles');
      }

      let role;
      if (roleData.id) {
        // Update existing role
        role = await Role.findById(roleData.id);
        if (!role) {
          throw new Error('Role not found');
        }

        role.name = name;
        role.description = description;
        role.permissions = permissions;
        role.level = level;
        role.isActive = isActive;
        role.updatedBy = userId;
        role.updatedAt = new Date();
      } else {
        // Create new role
        role = new Role({
          name,
          description,
          permissions,
          level,
          isActive,
          tenantId,
          createdBy: userId,
          createdAt: new Date()
        });
      }

      await role.save();

      // Log role management
      await this.logSecurityEvent('role_managed', {
        roleId: role._id,
        action: roleData.id ? 'updated' : 'created',
        managedBy: userId
      });

      return role;

    } catch (error) {
      console.error('Role management error:', error);
      throw error;
    }
  }

  /**
   * Audit logging
   */
  async logAuditEvent(userId, action, resourceType, resourceId, details = {}) {
    try {
      const auditLog = new AuditLog({
        userId,
        action,
        resourceType,
        resourceId,
        details,
        timestamp: new Date(),
        ipAddress: details.ipAddress,
        userAgent: details.userAgent
      });

      await auditLog.save();

      // Check for suspicious patterns
      await this.analyzeSuspiciousActivity(userId, action, details);

    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  /**
   * Security event logging
   */
  async logSecurityEvent(eventType, details = {}) {
    try {
      const securityEvent = new SecurityEvent({
        eventType,
        details,
        timestamp: new Date(),
        severity: this.getEventSeverity(eventType),
        ipAddress: details.ipAddress,
        userAgent: details.userAgent
      });

      await securityEvent.save();

      // Trigger alerts for high-severity events
      if (securityEvent.severity === 'high' || securityEvent.severity === 'critical') {
        await this.triggerSecurityAlert(securityEvent);
      }

    } catch (error) {
      console.error('Security event logging error:', error);
    }
  }

  /**
   * Threat detection and analysis
   */
  async analyzeSuspiciousActivity(userId, action, details) {
    try {
      const key = `${userId}_${action}`;
      const now = new Date();
      const timeWindow = 5 * 60 * 1000; // 5 minutes

      if (!this.suspiciousActivities.has(key)) {
        this.suspiciousActivities.set(key, []);
      }

      const activities = this.suspiciousActivities.get(key);
      
      // Remove old activities outside time window
      const recentActivities = activities.filter(activity => 
        now - activity.timestamp < timeWindow
      );

      recentActivities.push({ timestamp: now, details });
      this.suspiciousActivities.set(key, recentActivities);

      // Check for suspicious patterns
      if (recentActivities.length > 10) { // More than 10 actions in 5 minutes
        await this.logSecurityEvent('suspicious_activity', {
          userId,
          action,
          count: recentActivities.length,
          timeWindow: '5 minutes',
          pattern: 'high_frequency'
        });
      }

      // Check for unusual IP addresses
      const uniqueIPs = new Set(recentActivities.map(a => a.details.ipAddress));
      if (uniqueIPs.size > 3) { // More than 3 different IPs
        await this.logSecurityEvent('suspicious_activity', {
          userId,
          action,
          uniqueIPs: Array.from(uniqueIPs),
          pattern: 'multiple_ips'
        });
      }

    } catch (error) {
      console.error('Suspicious activity analysis error:', error);
    }
  }

  /**
   * Password security validation
   */
  validatePassword(password, user = null) {
    const policy = this.securityPolicies.get('password');
    const errors = [];

    // Length check
    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`);
    }

    if (password.length > policy.maxLength) {
      errors.push(`Password must not exceed ${policy.maxLength} characters`);
    }

    // Character requirements
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Common password check
    if (this.isCommonPassword(password)) {
      errors.push('Password is too common, please choose a more secure password');
    }

    // Personal information check
    if (user && this.containsPersonalInfo(password, user)) {
      errors.push('Password should not contain personal information');
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: this.calculatePasswordStrength(password)
    };
  }

  /**
   * Generate secure tokens
   */
  async generateTokens(user) {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role.name,
      tenantId: user.tenantId,
      permissions: user.role.permissions.map(p => p.name)
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '15m',
      issuer: 'tradeai',
      audience: 'tradeai-client'
    });

    const refreshToken = jwt.sign(
      { userId: user._id, tokenType: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Store active tokens
    this.activeTokens.set(accessToken, {
      userId: user._id,
      createdAt: new Date(),
      lastUsed: new Date()
    });

    return { accessToken, refreshToken };
  }

  /**
   * Security middleware factory
   */
  createSecurityMiddleware() {
    return {
      // Rate limiting
      rateLimiter: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP',
        standardHeaders: true,
        legacyHeaders: false
      }),

      // Helmet security headers
      helmet: helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
          }
        },
        crossOriginEmbedderPolicy: false
      }),

      // JWT validation
      validateJWT: async (req, res, next) => {
        try {
          const token = req.headers.authorization?.replace('Bearer ', '');
          if (!token) {
            return res.status(401).json({ error: 'No token provided' });
          }

          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const tokenInfo = this.activeTokens.get(token);

          if (!tokenInfo) {
            return res.status(401).json({ error: 'Invalid token' });
          }

          // Update last used
          tokenInfo.lastUsed = new Date();

          req.user = decoded;
          req.token = token;
          next();

        } catch (error) {
          return res.status(401).json({ error: 'Invalid token' });
        }
      },

      // Permission check middleware
      requirePermission: (resource, action) => {
        return async (req, res, next) => {
          try {
            const permission = await this.checkPermission(
              req.user.userId,
              resource,
              action,
              { tenantId: req.user.tenantId }
            );

            if (!permission.allowed) {
              return res.status(403).json({ 
                error: 'Insufficient permissions',
                reason: permission.reason 
              });
            }

            next();
          } catch (error) {
            return res.status(500).json({ error: 'Permission check failed' });
          }
        };
      }
    };
  }

  // Helper Methods

  isIPBlocked(ipAddress) {
    const policy = this.securityPolicies.get('access');
    return policy.blockedIPs.includes(ipAddress);
  }

  async recordFailedAttempt(key, email, ipAddress) {
    const attempts = this.failedAttempts.get(key) || 0;
    this.failedAttempts.set(key, attempts + 1);

    await this.logSecurityEvent('failed_login', {
      email,
      ipAddress,
      attempts: attempts + 1
    });

    // Auto-clear after lockout duration
    setTimeout(() => {
      this.failedAttempts.delete(key);
    }, this.securityPolicies.get('access').lockoutDuration);
  }

  requiresMFA(user) {
    const policy = this.securityPolicies.get('access');
    return policy.requireMFAForAdmin && user.role.name.includes('admin');
  }

  generateMFAToken(userId) {
    return jwt.sign(
      { userId, type: 'mfa', timestamp: Date.now() },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );
  }

  verifyMFAToken(userId, token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded.userId === userId && decoded.type === 'mfa';
    } catch {
      return false;
    }
  }

  sanitizeUser(user) {
    const sanitized = user.toObject();
    delete sanitized.password;
    delete sanitized.mfaSecret;
    delete sanitized.mfaTempSecret;
    return sanitized;
  }

  matchesPermission(permission, resource, action, context) {
    // Exact match
    if (permission.resource === resource && permission.action === action) {
      return this.checkPermissionConstraints(permission, context);
    }

    // Wildcard match
    if (permission.resource === '*' || permission.action === '*') {
      return this.checkPermissionConstraints(permission, context);
    }

    // Pattern match
    if (permission.resource.includes('*') || permission.action.includes('*')) {
      const resourcePattern = new RegExp(permission.resource.replace('*', '.*'));
      const actionPattern = new RegExp(permission.action.replace('*', '.*'));
      
      if (resourcePattern.test(resource) && actionPattern.test(action)) {
        return this.checkPermissionConstraints(permission, context);
      }
    }

    return false;
  }

  checkPermissionConstraints(permission, context) {
    if (!permission.constraints) return true;

    // Check tenant constraint
    if (permission.constraints.tenantId && 
        permission.constraints.tenantId !== context.tenantId) {
      return false;
    }

    // Check time constraints
    if (permission.constraints.timeRestriction) {
      const now = new Date();
      const hour = now.getHours();
      const { startHour, endHour } = permission.constraints.timeRestriction;
      
      if (hour < startHour || hour > endHour) {
        return false;
      }
    }

    return true;
  }

  async checkConstraints(user, resource, action, context) {
    // Check session constraints
    const sessionPolicy = this.securityPolicies.get('session');
    
    // Check concurrent sessions
    const activeSessions = await this.getActiveSessionCount(user._id);
    if (activeSessions > sessionPolicy.maxConcurrentSessions) {
      return { allowed: false, reason: 'Maximum concurrent sessions exceeded' };
    }

    return { allowed: true };
  }

  async getActiveSessionCount(userId) {
    let count = 0;
    for (const [token, info] of this.activeTokens) {
      if (info.userId.toString() === userId.toString()) {
        count++;
      }
    }
    return count;
  }

  getEventSeverity(eventType) {
    const severityMap = {
      'successful_login': 'low',
      'failed_login': 'medium',
      'account_locked': 'high',
      'mfa_failed': 'medium',
      'unauthorized_access': 'high',
      'suspicious_activity': 'high',
      'blocked_ip_attempt': 'critical'
    };

    return severityMap[eventType] || 'medium';
  }

  async triggerSecurityAlert(securityEvent) {
    // Implementation for security alerts (email, Slack, etc.)
    console.log(`SECURITY ALERT: ${securityEvent.eventType}`, securityEvent.details);
    
    // Could integrate with notification services here
    this.emit('securityAlert', securityEvent);
  }

  isCommonPassword(password) {
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890', 'abc123'
    ];
    
    return commonPasswords.includes(password.toLowerCase());
  }

  containsPersonalInfo(password, user) {
    const personalInfo = [
      user.firstName?.toLowerCase(),
      user.lastName?.toLowerCase(),
      user.email?.split('@')[0]?.toLowerCase()
    ].filter(Boolean);

    return personalInfo.some(info => 
      password.toLowerCase().includes(info)
    );
  }

  calculatePasswordStrength(password) {
    let score = 0;
    
    // Length bonus
    score += Math.min(password.length * 2, 20);
    
    // Character variety
    if (/[a-z]/.test(password)) score += 5;
    if (/[A-Z]/.test(password)) score += 5;
    if (/\d/.test(password)) score += 5;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;
    
    // Patterns penalty
    if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
    if (/123|abc|qwe/i.test(password)) score -= 10; // Sequential patterns
    
    if (score < 30) return 'weak';
    if (score < 60) return 'medium';
    if (score < 80) return 'strong';
    return 'very_strong';
  }

  startSecurityMonitoring() {
    // Clean up old failed attempts every hour
    setInterval(() => {
      const now = Date.now();
      const lockoutDuration = this.securityPolicies.get('access').lockoutDuration;
      
      for (const [key, timestamp] of this.failedAttempts) {
        if (now - timestamp > lockoutDuration) {
          this.failedAttempts.delete(key);
        }
      }
    }, 60 * 60 * 1000);

    // Clean up old suspicious activities every 30 minutes
    setInterval(() => {
      const now = Date.now();
      const timeWindow = 30 * 60 * 1000; // 30 minutes
      
      for (const [key, activities] of this.suspiciousActivities) {
        const recentActivities = activities.filter(activity => 
          now - activity.timestamp < timeWindow
        );
        
        if (recentActivities.length === 0) {
          this.suspiciousActivities.delete(key);
        } else {
          this.suspiciousActivities.set(key, recentActivities);
        }
      }
    }, 30 * 60 * 1000);

    // Clean up expired tokens every 15 minutes
    setInterval(() => {
      for (const [token, info] of this.activeTokens) {
        try {
          jwt.verify(token, process.env.JWT_SECRET);
        } catch {
          this.activeTokens.delete(token);
        }
      }
    }, 15 * 60 * 1000);
  }
}

module.exports = EnhancedSecurityService;