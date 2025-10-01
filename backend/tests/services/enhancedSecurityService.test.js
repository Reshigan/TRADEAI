const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const EnhancedSecurityService = require('../../src/services/enhancedSecurityService');
const User = require('../../src/models/User');
const Role = require('../../src/models/Role');
const Permission = require('../../src/models/Permission');
const SecurityEvent = require('../../src/models/SecurityEvent');
const AuditLog = require('../../src/models/AuditLog');

describe('EnhancedSecurityService', () => {
  let securityService;
  let tenantId;
  let testUser;
  let testRole;
  let testPermission;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/tradeai_test');
    securityService = new EnhancedSecurityService();
    tenantId = new mongoose.Types.ObjectId();

    // Set up JWT secret for testing
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Role.deleteMany({});
    await Permission.deleteMany({});
    await SecurityEvent.deleteMany({});
    await AuditLog.deleteMany({});

    // Create test permission
    testPermission = await Permission.create({
      name: 'test_permission',
      description: 'Test permission',
      resource: 'test_resource',
      action: 'read'
    });

    // Create test role
    testRole = await Role.create({
      name: 'test_role',
      description: 'Test role',
      permissions: [testPermission._id],
      level: 1,
      tenantId
    });

    // Create test user
    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
    testUser = await User.create({
      email: 'test@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: testRole._id,
      tenantId,
      isActive: true
    });
  });

  describe('Authentication', () => {
    it('should authenticate user with valid credentials', async () => {
      const result = await securityService.authenticateUser(
        'test@example.com',
        'TestPassword123!',
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Test Agent',
          tenantId
        }
      );

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      expect(result.requiresMFA).toBe(false);
    });

    it('should reject authentication with invalid credentials', async () => {
      await expect(
        securityService.authenticateUser(
          'test@example.com',
          'WrongPassword',
          { ipAddress: '127.0.0.1', tenantId }
        )
      ).rejects.toThrow('Invalid credentials');
    });

    it('should reject authentication for inactive user', async () => {
      await User.findByIdAndUpdate(testUser._id, { isActive: false });

      await expect(
        securityService.authenticateUser(
          'test@example.com',
          'TestPassword123!',
          { ipAddress: '127.0.0.1', tenantId }
        )
      ).rejects.toThrow('Account is inactive');
    });

    it('should track failed login attempts', async () => {
      const ipAddress = '192.168.1.1';
      
      // Make multiple failed attempts
      for (let i = 0; i < 3; i++) {
        try {
          await securityService.authenticateUser(
            'test@example.com',
            'WrongPassword',
            { ipAddress, tenantId }
          );
        } catch (error) {
          // Expected to fail
        }
      }

      // Check that failed attempts are tracked
      const failedKey = `test@example.com_${ipAddress}`;
      expect(securityService.failedAttempts.get(failedKey)).toBe(3);
    });

    it('should lock account after max failed attempts', async () => {
      const ipAddress = '192.168.1.2';
      
      // Make max failed attempts
      for (let i = 0; i < 5; i++) {
        try {
          await securityService.authenticateUser(
            'test@example.com',
            'WrongPassword',
            { ipAddress, tenantId }
          );
        } catch (error) {
          // Expected to fail
        }
      }

      // Next attempt should be locked
      await expect(
        securityService.authenticateUser(
          'test@example.com',
          'TestPassword123!',
          { ipAddress, tenantId }
        )
      ).rejects.toThrow('Account temporarily locked');
    });
  });

  describe('Multi-Factor Authentication', () => {
    it('should setup MFA for user', async () => {
      const result = await securityService.setupMFA(testUser._id);

      expect(result.secret).toBeDefined();
      expect(result.qrCode).toBeDefined();
      expect(result.manualEntryKey).toBeDefined();

      // Check that temp secret is saved
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.mfaTempSecret).toBeDefined();
    });

    it('should enable MFA with valid token', async () => {
      // Setup MFA first
      await securityService.setupMFA(testUser._id);
      
      // Mock speakeasy verification for testing
      const speakeasy = require('speakeasy');
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true);

      const result = await securityService.enableMFA(testUser._id, '123456');

      expect(result.success).toBe(true);

      // Check that MFA is enabled
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.mfaEnabled).toBe(true);
      expect(updatedUser.mfaSecret).toBeDefined();
      expect(updatedUser.mfaTempSecret).toBeUndefined();

      // Restore original function
      speakeasy.totp.verify.mockRestore();
    });

    it('should reject MFA enable with invalid token', async () => {
      await securityService.setupMFA(testUser._id);

      await expect(
        securityService.enableMFA(testUser._id, '000000')
      ).rejects.toThrow('Invalid MFA token');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should grant permission for valid user and resource', async () => {
      const result = await securityService.checkPermission(
        testUser._id,
        'test_resource',
        'read'
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Permission granted');
    });

    it('should deny permission for invalid resource', async () => {
      const result = await securityService.checkPermission(
        testUser._id,
        'invalid_resource',
        'read'
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Insufficient permissions');
    });

    it('should allow super admin access to everything', async () => {
      // Create super admin role
      const superAdminRole = await Role.create({
        name: 'super_admin',
        description: 'Super Administrator',
        permissions: [],
        level: 10,
        tenantId
      });

      // Update user to super admin
      await User.findByIdAndUpdate(testUser._id, { role: superAdminRole._id });

      const result = await securityService.checkPermission(
        testUser._id,
        'any_resource',
        'any_action'
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Super admin access');
    });

    it('should handle wildcard permissions', async () => {
      // Create wildcard permission
      const wildcardPermission = await Permission.create({
        name: 'wildcard_permission',
        description: 'Wildcard permission',
        resource: '*',
        action: '*'
      });

      // Update role with wildcard permission
      await Role.findByIdAndUpdate(testRole._id, {
        permissions: [wildcardPermission._id]
      });

      const result = await securityService.checkPermission(
        testUser._id,
        'any_resource',
        'any_action'
      );

      expect(result.allowed).toBe(true);
    });
  });

  describe('Password Security', () => {
    it('should validate strong password', () => {
      const result = securityService.validatePassword('StrongPass123!');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.strength).toMatch(/medium|strong|very_strong/);
    });

    it('should reject weak password', () => {
      const result = securityService.validatePassword('weak');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.strength).toBe('weak');
    });

    it('should reject common passwords', () => {
      const result = securityService.validatePassword('password123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is too common, please choose a more secure password');
    });

    it('should reject passwords with personal information', () => {
      const user = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com'
      };

      const result = securityService.validatePassword('JohnPassword123!', user);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password should not contain personal information');
    });
  });

  describe('Security Event Logging', () => {
    it('should log security events', async () => {
      await securityService.logSecurityEvent('test_event', {
        userId: testUser._id,
        ipAddress: '127.0.0.1',
        details: 'Test event details'
      });

      const events = await SecurityEvent.find({ eventType: 'test_event' });
      expect(events).toHaveLength(1);
      expect(events[0].details.userId).toEqual(testUser._id);
    });

    it('should trigger alerts for high-severity events', async () => {
      const alertSpy = jest.spyOn(securityService, 'triggerSecurityAlert');

      await securityService.logSecurityEvent('blocked_ip_attempt', {
        ipAddress: '192.168.1.100',
        severity: 'critical'
      });

      expect(alertSpy).toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });

  describe('Audit Logging', () => {
    it('should log audit events', async () => {
      await securityService.logAuditEvent(
        testUser._id,
        'test_action',
        'test_resource',
        'resource_id_123',
        { ipAddress: '127.0.0.1' }
      );

      const auditLogs = await AuditLog.find({ action: 'test_action' });
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].userId).toEqual(testUser._id);
      expect(auditLogs[0].resourceType).toBe('test_resource');
    });
  });

  describe('Threat Detection', () => {
    it('should detect suspicious activity patterns', async () => {
      const userId = testUser._id;
      const action = 'login';

      // Simulate high-frequency activity
      for (let i = 0; i < 12; i++) {
        await securityService.analyzeSuspiciousActivity(userId, action, {
          ipAddress: '127.0.0.1',
          timestamp: new Date()
        });
      }

      // Check that suspicious activity was detected
      const events = await SecurityEvent.find({ 
        eventType: 'suspicious_activity',
        'details.pattern': 'high_frequency'
      });
      
      expect(events.length).toBeGreaterThan(0);
    });

    it('should detect multiple IP usage', async () => {
      const userId = testUser._id;
      const action = 'login';
      const ips = ['192.168.1.1', '192.168.1.2', '192.168.1.3', '192.168.1.4'];

      // Simulate activity from multiple IPs
      for (const ip of ips) {
        await securityService.analyzeSuspiciousActivity(userId, action, {
          ipAddress: ip,
          timestamp: new Date()
        });
      }

      const events = await SecurityEvent.find({ 
        eventType: 'suspicious_activity',
        'details.pattern': 'multiple_ips'
      });
      
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('Token Management', () => {
    it('should generate valid JWT tokens', async () => {
      const tokens = await securityService.generateTokens(testUser);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();

      // Verify access token
      const decoded = jwt.verify(tokens.accessToken, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(testUser._id.toString());
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.tenantId).toBe(testUser.tenantId.toString());
    });

    it('should track active tokens', async () => {
      const tokens = await securityService.generateTokens(testUser);
      
      expect(securityService.activeTokens.has(tokens.accessToken)).toBe(true);
      
      const tokenInfo = securityService.activeTokens.get(tokens.accessToken);
      expect(tokenInfo.userId).toEqual(testUser._id);
      expect(tokenInfo.createdAt).toBeDefined();
    });
  });

  describe('Security Middleware', () => {
    it('should create rate limiter middleware', () => {
      const middleware = securityService.createSecurityMiddleware();
      
      expect(middleware.rateLimiter).toBeDefined();
      expect(middleware.helmet).toBeDefined();
      expect(middleware.validateJWT).toBeDefined();
      expect(middleware.requirePermission).toBeDefined();
    });

    it('should validate JWT in middleware', async () => {
      const middleware = securityService.createSecurityMiddleware();
      const tokens = await securityService.generateTokens(testUser);

      const req = {
        headers: {
          authorization: `Bearer ${tokens.accessToken}`
        }
      };
      const res = {};
      const next = jest.fn();

      await middleware.validateJWT(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(testUser._id.toString());
    });

    it('should reject invalid JWT in middleware', async () => {
      const middleware = securityService.createSecurityMiddleware();

      const req = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await middleware.validateJWT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Role Management', () => {
    it('should create new role', async () => {
      const roleData = {
        name: 'new_role',
        description: 'New test role',
        permissions: [testPermission._id],
        level: 2
      };

      const result = await securityService.manageRole(roleData, {
        userId: testUser._id,
        tenantId
      });

      expect(result.name).toBe('new_role');
      expect(result.permissions).toContain(testPermission._id);
      expect(result.tenantId).toEqual(tenantId);
    });

    it('should update existing role', async () => {
      const roleData = {
        id: testRole._id,
        name: 'updated_role',
        description: 'Updated test role',
        permissions: [testPermission._id],
        level: 3
      };

      const result = await securityService.manageRole(roleData, {
        userId: testUser._id,
        tenantId
      });

      expect(result.name).toBe('updated_role');
      expect(result.level).toBe(3);
    });
  });

  describe('Security Monitoring', () => {
    it('should clean up expired data', async () => {
      // Add some test data to maps
      securityService.failedAttempts.set('test_key', Date.now() - 60000); // 1 minute ago
      securityService.suspiciousActivities.set('test_key', [
        { timestamp: Date.now() - 60000, details: {} }
      ]);

      // Manually trigger cleanup (normally done by intervals)
      const now = Date.now();
      const lockoutDuration = securityService.securityPolicies.get('access').lockoutDuration;
      
      for (const [key, timestamp] of securityService.failedAttempts) {
        if (now - timestamp > lockoutDuration) {
          securityService.failedAttempts.delete(key);
        }
      }

      expect(securityService.failedAttempts.has('test_key')).toBe(false);
    });
  });
});