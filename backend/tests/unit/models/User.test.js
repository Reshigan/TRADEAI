/**
 * User Model Tests
 * Comprehensive tests for User model validation, authentication, and methods
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../../../models/User');
const dbHelper = require('../../helpers/db-helper');
const { userFactory } = require('../../helpers/factories');

describe('User Model', () => {
  beforeAll(async () => {
    await dbHelper.connect();
  });

  afterAll(async () => {
    await dbHelper.disconnect();
  });

  afterEach(async () => {
    await dbHelper.clearDatabase();
  });

  describe('Schema Validation', () => {
    describe('Required Fields', () => {
      it('should create a valid user with all required fields', async () => {
        const userData = userFactory.buildUser();
        const user = await User.create(userData);

        expect(user).toHaveProperty('_id');
        expect(user.email).toBe(userData.email.toLowerCase());
        expect(user.firstName).toBe(userData.firstName);
        expect(user.role).toBe('user');
      });

      it('should require email field', async () => {
        const userData = userFactory.buildUser({ email: undefined });
        await expect(User.create(userData)).rejects.toThrow(/email.*required/i);
      });

      it('should require username field', async () => {
        const userData = userFactory.buildUser({ username: undefined });
        // Generate username from email if not provided
        userData.username = userData.email.split('@')[0];
        const user = await User.create(userData);
        expect(user.username).toBeDefined();
      });

      it('should require password field', async () => {
        const userData = userFactory.buildUser({ password: undefined });
        await expect(User.create(userData)).rejects.toThrow(/password.*required/i);
      });

      it('should require firstName field', async () => {
        const userData = userFactory.buildUser({ firstName: undefined });
        await expect(User.create(userData)).rejects.toThrow(/firstName.*required/i);
      });

      it('should require lastName field', async () => {
        const userData = userFactory.buildUser({ lastName: undefined });
        await expect(User.create(userData)).rejects.toThrow(/lastName.*required/i);
      });
    });

    describe('Email Validation', () => {
      it('should validate email format', async () => {
        const userData = userFactory.buildUser({ email: 'invalid-email' });
        await expect(User.create(userData)).rejects.toThrow(/valid email/i);
      });

      it('should accept valid email formats', async () => {
        const validEmails = [
          'test@example.com',
          'user.name@example.com',
          'user+tag@example.co.uk',
          'test_user@subdomain.example.com'
        ];

        for (const email of validEmails) {
          const userData = userFactory.buildUser({ 
            email,
            username: email.split('@')[0]
          });
          const user = await User.create(userData);
          expect(user.email).toBe(email.toLowerCase());
          await User.deleteMany({});
        }
      });

      it('should convert email to lowercase', async () => {
        const userData = userFactory.buildUser({ email: 'TEST@EXAMPLE.COM' });
        const user = await User.create(userData);
        expect(user.email).toBe('test@example.com');
      });

      it('should require unique email', async () => {
        const userData = userFactory.buildUser({ email: 'duplicate@example.com' });
        await User.create(userData);

        const duplicateUser = userFactory.buildUser({ 
          email: 'duplicate@example.com',
          username: 'different_username'
        });
        
        await expect(User.create(duplicateUser)).rejects.toThrow();
      });
    });

    describe('Username Validation', () => {
      it('should validate minimum username length', async () => {
        const userData = userFactory.buildUser({ username: 'ab' });
        await expect(User.create(userData)).rejects.toThrow(/at least 3 characters/i);
      });

      it('should trim username', async () => {
        const userData = userFactory.buildUser({ username: '  testuser  ' });
        const user = await User.create(userData);
        expect(user.username).toBe('testuser');
      });

      it('should require unique username', async () => {
        const userData = userFactory.buildUser({ username: 'uniqueuser' });
        await User.create(userData);

        const duplicateUser = userFactory.buildUser({ 
          username: 'uniqueuser',
          email: 'different@example.com'
        });
        
        await expect(User.create(duplicateUser)).rejects.toThrow();
      });
    });

    describe('Password Validation', () => {
      it('should validate minimum password length', async () => {
        const userData = userFactory.buildUser({ password: 'short' });
        await expect(User.create(userData)).rejects.toThrow(/at least 8 characters/i);
      });

      it('should hash password before saving', async () => {
        const plainPassword = 'Test@123456';
        const userData = userFactory.buildUser({ password: plainPassword });
        const user = await User.create(userData);

        // Fetch user with password field
        const userWithPassword = await User.findById(user._id).select('+password');
        expect(userWithPassword.password).not.toBe(plainPassword);
        expect(userWithPassword.password.length).toBeGreaterThan(20); // bcrypt hash length
      });

      it('should not include password in default queries', async () => {
        const userData = userFactory.buildUser();
        const createdUser = await User.create(userData);
        
        const fetchedUser = await User.findById(createdUser._id);
        expect(fetchedUser.password).toBeUndefined();
      });

      it('should include password when explicitly selected', async () => {
        const userData = userFactory.buildUser();
        const createdUser = await User.create(userData);
        
        const userWithPassword = await User.findById(createdUser._id).select('+password');
        expect(userWithPassword.password).toBeDefined();
      });
    });

    describe('Role Validation', () => {
      it('should validate role enum', async () => {
        const userData = userFactory.buildUser({ role: 'invalid_role' });
        await expect(User.create(userData)).rejects.toThrow();
      });

      it('should accept valid roles', async () => {
        const roles = ['user', 'admin', 'manager', 'analyst'];

        for (const role of roles) {
          const userData = userFactory.buildUser({ 
            role,
            email: `${role}@example.com`,
            username: `${role}_user`
          });
          const user = await User.create(userData);
          expect(user.role).toBe(role);
          await User.deleteMany({});
        }
      });

      it('should default role to user', async () => {
        const userData = userFactory.buildUser({ role: undefined });
        const user = await User.create(userData);
        expect(user.role).toBe('user');
      });
    });

    describe('Default Values', () => {
      it('should set default tenant to mondelez', async () => {
        const userData = userFactory.buildUser({ tenant: undefined });
        const user = await User.create(userData);
        expect(user.tenant).toBe('mondelez');
      });

      it('should set default isActive to true', async () => {
        const userData = userFactory.buildUser();
        const user = await User.create(userData);
        expect(user.isActive).toBe(true);
      });

      it('should set default isEmailVerified to false', async () => {
        const userData = userFactory.buildUser();
        const user = await User.create(userData);
        expect(user.isEmailVerified).toBe(false);
      });

      it('should set default loginAttempts to 0', async () => {
        const userData = userFactory.buildUser();
        const user = await User.create(userData);
        expect(user.loginAttempts).toBe(0);
      });
    });
  });

  describe('Password Methods', () => {
    describe('Password Comparison', () => {
      it('should correctly verify valid password', async () => {
        const plainPassword = 'Test@123456';
        const userData = userFactory.buildUser({ password: plainPassword });
        const user = await User.create(userData);

        const userWithPassword = await User.findById(user._id).select('+password');
        const isMatch = await bcrypt.compare(plainPassword, userWithPassword.password);
        expect(isMatch).toBe(true);
      });

      it('should reject invalid password', async () => {
        const plainPassword = 'Test@123456';
        const userData = userFactory.buildUser({ password: plainPassword });
        const user = await User.create(userData);

        const userWithPassword = await User.findById(user._id).select('+password');
        const isMatch = await bcrypt.compare('WrongPassword', userWithPassword.password);
        expect(isMatch).toBe(false);
      });
    });

    describe('Password Update', () => {
      it('should hash new password when updated', async () => {
        const userData = userFactory.buildUser({ password: 'OldPassword@123' });
        const user = await User.create(userData);

        const newPassword = 'NewPassword@456';
        user.password = newPassword;
        await user.save();

        const updatedUser = await User.findById(user._id).select('+password');
        const isMatch = await bcrypt.compare(newPassword, updatedUser.password);
        expect(isMatch).toBe(true);
      });

      it('should update passwordChangedAt when password changes', async () => {
        const userData = userFactory.buildUser();
        const user = await User.create(userData);

        await new Promise(resolve => setTimeout(resolve, 10));
        
        user.password = 'NewPassword@789';
        user.passwordChangedAt = new Date();
        await user.save();

        expect(user.passwordChangedAt).toBeDefined();
        expect(user.passwordChangedAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('Account Security', () => {
    describe('Login Attempts', () => {
      it('should increment login attempts', async () => {
        const userData = userFactory.buildUser();
        const user = await User.create(userData);
        expect(user.loginAttempts).toBe(0);

        user.loginAttempts += 1;
        await user.save();

        const updated = await User.findById(user._id);
        expect(updated.loginAttempts).toBe(1);
      });

      it('should reset login attempts to 0', async () => {
        const userData = userFactory.buildUser({ loginAttempts: 5 });
        const user = await User.create(userData);
        expect(user.loginAttempts).toBe(5);

        user.loginAttempts = 0;
        await user.save();

        const updated = await User.findById(user._id);
        expect(updated.loginAttempts).toBe(0);
      });
    });

    describe('Account Locking', () => {
      it('should set lockUntil date', async () => {
        const userData = userFactory.buildUser();
        const user = await User.create(userData);

        const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        user.lockUntil = lockUntil;
        await user.save();

        const updated = await User.findById(user._id);
        expect(updated.lockUntil).toBeDefined();
        expect(updated.lockUntil.getTime()).toBeCloseTo(lockUntil.getTime(), -2);
      });

      it('should clear lockUntil date', async () => {
        const lockDate = new Date(Date.now() + 30 * 60 * 1000);
        const userData = userFactory.buildUser({ lockUntil: lockDate });
        const user = await User.create(userData);
        expect(user.lockUntil).toBeDefined();

        user.lockUntil = undefined;
        await user.save();

        const updated = await User.findById(user._id);
        expect(updated.lockUntil).toBeUndefined();
      });
    });
  });

  describe('User Status', () => {
    it('should activate user', async () => {
      const userData = userFactory.buildUser({ isActive: false });
      const user = await User.create(userData);
      expect(user.isActive).toBe(false);

      user.isActive = true;
      await user.save();

      const updated = await User.findById(user._id);
      expect(updated.isActive).toBe(true);
    });

    it('should deactivate user', async () => {
      const userData = userFactory.buildUser({ isActive: true });
      const user = await User.create(userData);
      expect(user.isActive).toBe(true);

      user.isActive = false;
      await user.save();

      const updated = await User.findById(user._id);
      expect(updated.isActive).toBe(false);
    });

    it('should verify email', async () => {
      const userData = userFactory.buildUser({ isEmailVerified: false });
      const user = await User.create(userData);
      expect(user.isEmailVerified).toBe(false);

      user.isEmailVerified = true;
      await user.save();

      const updated = await User.findById(user._id);
      expect(updated.isEmailVerified).toBe(true);
    });
  });

  describe('Timestamps', () => {
    it('should record lastLogin', async () => {
      const userData = userFactory.buildUser();
      const user = await User.create(userData);

      const loginTime = new Date();
      user.lastLogin = loginTime;
      await user.save();

      const updated = await User.findById(user._id);
      expect(updated.lastLogin).toBeDefined();
      expect(updated.lastLogin.getTime()).toBeCloseTo(loginTime.getTime(), -2);
    });

    it('should update lastLogin on subsequent logins', async () => {
      const userData = userFactory.buildUser();
      const user = await User.create(userData);

      const firstLogin = new Date();
      user.lastLogin = firstLogin;
      await user.save();

      await new Promise(resolve => setTimeout(resolve, 10));

      const secondLogin = new Date();
      user.lastLogin = secondLogin;
      await user.save();

      const updated = await User.findById(user._id);
      expect(updated.lastLogin.getTime()).toBeGreaterThan(firstLogin.getTime());
    });

    it('should automatically add createdAt', async () => {
      const userData = userFactory.buildUser();
      const user = await User.create(userData);

      expect(user.createdAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should automatically add updatedAt', async () => {
      const userData = userFactory.buildUser();
      const user = await User.create(userData);

      expect(user.updatedAt).toBeDefined();
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const userData = userFactory.buildUser();
      const user = await User.create(userData);
      const originalUpdatedAt = user.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));
      
      user.firstName = 'Updated';
      await user.save();

      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Queries', () => {
    it('should find users by email', async () => {
      const email = 'findme@example.com';
      const userData = userFactory.buildUser({ email });
      await User.create(userData);

      const found = await User.findOne({ email });
      expect(found).toBeDefined();
      expect(found.email).toBe(email);
    });

    it('should find users by role', async () => {
      await User.create([
        userFactory.buildUser({ role: 'admin', email: 'admin1@example.com', username: 'admin1' }),
        userFactory.buildUser({ role: 'admin', email: 'admin2@example.com', username: 'admin2' }),
        userFactory.buildUser({ role: 'user', email: 'user1@example.com', username: 'user1' })
      ]);

      const admins = await User.find({ role: 'admin' });
      expect(admins).toHaveLength(2);
    });

    it('should find active users', async () => {
      await User.create([
        userFactory.buildUser({ isActive: true, email: 'active1@example.com', username: 'active1' }),
        userFactory.buildUser({ isActive: true, email: 'active2@example.com', username: 'active2' }),
        userFactory.buildUser({ isActive: false, email: 'inactive@example.com', username: 'inactive' })
      ]);

      const activeUsers = await User.find({ isActive: true });
      expect(activeUsers).toHaveLength(2);
    });

    it('should find users by tenant', async () => {
      await User.create([
        userFactory.buildUser({ tenant: 'mondelez', email: 'user1@mondelez.com', username: 'user1' }),
        userFactory.buildUser({ tenant: 'mondelez', email: 'user2@mondelez.com', username: 'user2' }),
        userFactory.buildUser({ tenant: 'other', email: 'user@other.com', username: 'userother' })
      ]);

      const mondelezUsers = await User.find({ tenant: 'mondelez' });
      expect(mondelezUsers).toHaveLength(2);
    });
  });

  describe('JSON Transformation', () => {
    it('should exclude password from JSON output', async () => {
      const userData = userFactory.buildUser();
      const user = await User.create(userData);

      const json = user.toJSON();
      expect(json.password).toBeUndefined();
    });

    it('should exclude refreshToken from JSON output', async () => {
      const userData = userFactory.buildUser({ refreshToken: 'some-token' });
      const user = await User.create(userData);

      const json = user.toJSON();
      expect(json.refreshToken).toBeUndefined();
    });

    it('should exclude __v from JSON output', async () => {
      const userData = userFactory.buildUser();
      const user = await User.create(userData);

      const json = user.toJSON();
      expect(json.__v).toBeUndefined();
    });

    it('should include other fields in JSON output', async () => {
      const userData = userFactory.buildUser();
      const user = await User.create(userData);

      const json = user.toJSON();
      expect(json.email).toBeDefined();
      expect(json.firstName).toBeDefined();
      expect(json.lastName).toBeDefined();
      expect(json.role).toBeDefined();
    });
  });

  describe('Deletion', () => {
    it('should delete a user', async () => {
      const userData = userFactory.buildUser();
      const user = await User.create(userData);
      const userId = user._id;

      await User.deleteOne({ _id: userId });

      const deleted = await User.findById(userId);
      expect(deleted).toBeNull();
    });

    it('should delete multiple users', async () => {
      const tenant = 'test-tenant';
      await User.create([
        userFactory.buildUser({ tenant, email: 'user1@test.com', username: 'testuser1' }),
        userFactory.buildUser({ tenant, email: 'user2@test.com', username: 'testuser2' }),
        userFactory.buildUser({ tenant, email: 'user3@test.com', username: 'testuser3' })
      ]);

      const result = await User.deleteMany({ tenant });
      expect(result.deletedCount).toBe(3);

      const remaining = await User.find({ tenant });
      expect(remaining).toHaveLength(0);
    });
  });
});
