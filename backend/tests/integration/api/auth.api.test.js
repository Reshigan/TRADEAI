/**
 * Authentication API Integration Tests
 * Tests for auth endpoints: register, login, logout, token refresh
 */

const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../../../models/User');
const dbHelper = require('../../helpers/db-helper');
const { userFactory } = require('../../helpers/factories');
const apiHelper = require('../../helpers/api-helper');

// Mock app (we'll need to create a test app instance)
let app;

// Try to load the app, handle if it requires database connection
try {
  app = require('../../../src/app');
} catch (error) {
  // If app requires DB connection, we'll mock it
  console.log('App requires setup, using mock');
}

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    await dbHelper.connect();
  });

  afterAll(async () => {
    await dbHelper.disconnect();
  });

  afterEach(async () => {
    await dbHelper.clearDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'StrongPass123!',
        firstName: 'New',
        lastName: 'User',
        tenant: 'mondelez'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.password).toBeUndefined(); // Should not return password
    });

    it('should not register user with duplicate email', async () => {
      const userData = userFactory.buildUser({
        email: 'duplicate@example.com',
        username: 'user1'
      });

      // Create first user
      await User.create(userData);

      // Try to create second user with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...userData,
          username: 'user2' // Different username
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/email.*already.*exists/i);
    });

    it('should not register user with duplicate username', async () => {
      const userData = userFactory.buildUser({
        email: 'user1@example.com',
        username: 'duplicateuser'
      });

      // Create first user
      await User.create(userData);

      // Try to create second user with same username
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...userData,
          email: 'user2@example.com' // Different email
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/username.*already.*exists/i);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com'
          // Missing required fields
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/required/i);
    });

    it('should validate email format', async () => {
      const userData = userFactory.buildUser({
        email: 'invalid-email'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/valid email/i);
    });

    it('should validate password strength', async () => {
      const userData = userFactory.buildUser({
        password: 'weak'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/password.*8 characters/i);
    });

    it('should sanitize input to prevent XSS', async () => {
      const userData = userFactory.buildUser({
        firstName: '<script>alert("xss")</script>',
        lastName: 'Test'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/);

      // Should either reject or sanitize
      if (response.status === 201) {
        expect(response.body.data.user.firstName).not.toContain('<script>');
      } else {
        expect(response.status).toBe(400);
      }
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;
    const plainPassword = 'TestPass123!';

    beforeEach(async () => {
      // Create a test user
      const userData = userFactory.buildUser({
        email: 'testuser@example.com',
        username: 'testuser',
        password: plainPassword
      });
      testUser = await User.create(userData);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: plainPassword
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should login with username instead of email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: plainPassword
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/invalid.*credentials/i);
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: plainPassword
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/invalid.*credentials/i);
    });

    it('should reject login for inactive user', async () => {
      // Deactivate user
      testUser.isActive = false;
      await testUser.save();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: plainPassword
        })
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/account.*inactive/i);
    });

    it('should update lastLogin timestamp on successful login', async () => {
      const beforeLogin = new Date();

      await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: plainPassword
        })
        .expect(200);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.lastLogin).toBeDefined();
      expect(updatedUser.lastLogin.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });

    it('should return refresh token on login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: plainPassword
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should handle rate limiting on failed login attempts', async () => {
      const maxAttempts = 5;

      // Make multiple failed login attempts
      for (let i = 0; i < maxAttempts; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: 'WrongPassword'
          });
      }

      // Next attempt should be rate limited
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword'
        })
        .expect(429);

      expect(response.body.error).toMatch(/too many.*attempts/i);
    });
  });

  describe('POST /api/auth/logout', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      // Create and login user
      const userData = userFactory.buildUser({
        password: 'TestPass123!'
      });
      testUser = await User.create(userData);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'TestPass123!'
        });

      authToken = loginResponse.body.data.token;
    });

    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/logout.*success/i);
    });

    it('should clear refresh token on logout', async () => {
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const updatedUser = await User.findById(testUser._id).select('+refreshToken');
      expect(updatedUser.refreshToken).toBeUndefined();
    });

    it('should reject logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/token.*required/i);
    });

    it('should reject logout with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token-12345')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/invalid.*token/i);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let testUser;
    let refreshToken;

    beforeEach(async () => {
      // Create and login user
      const userData = userFactory.buildUser({
        password: 'TestPass123!'
      });
      testUser = await User.create(userData);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'TestPass123!'
        });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.token).not.toBe(refreshToken);
    });

    it('should reject refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/invalid.*token/i);
    });

    it('should reject refresh without token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/token.*required/i);
    });
  });

  describe('GET /api/auth/me', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      // Create and login user
      const userData = userFactory.buildUser({
        password: 'TestPass123!'
      });
      testUser = await User.create(userData);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'TestPass123!'
        });

      authToken = loginResponse.body.data.token;
    });

    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    let testUser;

    beforeEach(async () => {
      const userData = userFactory.buildUser({
        email: 'reset@example.com',
        isEmailVerified: true
      });
      testUser = await User.create(userData);
    });

    it('should send password reset email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: testUser.email
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/reset.*email.*sent/i);
    });

    it('should not reveal if email does not exist', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com'
        })
        .expect('Content-Type', /json/)
        .expect(200);

      // Should return success even if email doesn't exist (security best practice)
      expect(response.body.success).toBe(true);
    });

    it('should generate and store password reset token', async () => {
      await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: testUser.email
        })
        .expect(200);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.passwordResetToken).toBeDefined();
      expect(updatedUser.passwordResetExpires).toBeDefined();
      expect(updatedUser.passwordResetExpires.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let testUser;
    let resetToken;

    beforeEach(async () => {
      const userData = userFactory.buildUser({
        email: 'reset@example.com'
      });
      testUser = await User.create(userData);

      // Generate reset token
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: testUser.email
        });

      const updatedUser = await User.findById(testUser._id);
      resetToken = updatedUser.passwordResetToken;
    });

    it('should reset password with valid token', async () => {
      const newPassword = 'NewSecurePass123!';

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/password.*reset.*success/i);

      // Verify can login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: newPassword
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should reject reset with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-reset-token',
          password: 'NewPass123!'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/invalid.*token/i);
    });

    it('should reject reset with expired token', async () => {
      // Expire the token
      testUser.passwordResetExpires = new Date(Date.now() - 60000); // 1 minute ago
      await testUser.save();

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPass123!'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/token.*expired/i);
    });

    it('should clear reset token after successful reset', async () => {
      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPass123!'
        })
        .expect(200);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.passwordResetToken).toBeUndefined();
      expect(updatedUser.passwordResetExpires).toBeUndefined();
    });
  });

  describe('Security', () => {
    it('should not expose sensitive information in errors', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrong'
        })
        .expect(401);

      // Should not reveal if user exists
      expect(response.body.error).not.toMatch(/user.*not.*found/i);
      expect(response.body.error).toMatch(/invalid.*credentials/i);
    });

    it('should prevent SQL injection attempts', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: "' OR '1'='1",
          password: "' OR '1'='1"
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should prevent NoSQL injection attempts', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: { $gt: "" },
          password: { $gt: "" }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle concurrent login requests properly', async () => {
      const userData = userFactory.buildUser({
        password: 'TestPass123!'
      });
      await User.create(userData);

      // Send 5 concurrent login requests
      const promises = Array(5).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: userData.email,
            password: 'TestPass123!'
          })
      );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});
