const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User');
const RefreshToken = require('../../models/RefreshToken');
const ActiveSession = require('../../models/ActiveSession');

describe('Auth Enhanced API Integration Tests', () => {
  let _server;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/tradeai_test';
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await RefreshToken.deleteMany({});
    await ActiveSession.deleteMany({});
  });

  describe('POST /api/auth-enhanced/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
        organization: 'TestOrg'
      };

      const response = await request(app)
        .post('/api/auth-enhanced/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 400 for missing required fields', async () => {
      const userData = {
        email: 'newuser@example.com'
        // missing password
      };

      const response = await request(app)
        .post('/api/auth-enhanced/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      };

      await request(app)
        .post('/api/auth-enhanced/register')
        .send(userData)
        .expect(201);

      const response = await request(app)
        .post('/api/auth-enhanced/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('already registered');
    });

    it('should return 400 for weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth-enhanced/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth-enhanced/login', () => {
    let _testUser;

    beforeEach(async () => {
      const registerData = {
        email: 'logintest@example.com',
        password: 'Password123!',
        firstName: 'Login',
        lastName: 'Test'
      };

      const response = await request(app)
        .post('/api/auth-enhanced/register')
        .send(registerData);

      testUser = response.body.user;
    });

    it('should login successfully with correct credentials', async () => {
      const credentials = {
        email: 'logintest@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth-enhanced/login')
        .send(credentials)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toHaveProperty('email', credentials.email);
    });

    it('should return 401 with incorrect password', async () => {
      const credentials = {
        email: 'logintest@example.com',
        password: 'WrongPassword!'
      };

      const response = await request(app)
        .post('/api/auth-enhanced/login')
        .send(credentials)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 401 with non-existent email', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth-enhanced/login')
        .send(credentials)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth-enhanced/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth-enhanced/logout', () => {
    let accessToken;
    let userId;

    beforeEach(async () => {
      const registerData = {
        email: 'logouttest@example.com',
        password: 'Password123!',
        firstName: 'Logout',
        lastName: 'Test'
      };

      const response = await request(app)
        .post('/api/auth-enhanced/register')
        .send(registerData);

      accessToken = response.body.accessToken;
      userId = response.body.user._id;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth-enhanced/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('Logged out successfully');

      const refreshTokens = await RefreshToken.find({ userId });
      expect(refreshTokens).toHaveLength(0);

      const sessions = await ActiveSession.find({ userId });
      expect(sessions).toHaveLength(0);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/auth-enhanced/logout')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth-enhanced/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      const registerData = {
        email: 'refreshtest@example.com',
        password: 'Password123!',
        firstName: 'Refresh',
        lastName: 'Test'
      };

      const response = await request(app)
        .post('/api/auth-enhanced/register')
        .send(registerData);

      refreshToken = response.body.refreshToken;
    });

    it('should refresh access token successfully', async () => {
      const response = await request(app)
        .post('/api/auth-enhanced/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.accessToken).toBeTruthy();
    });

    it('should return 401 with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth-enhanced/refresh')
        .send({ refreshToken: 'invalidToken' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth-enhanced/refresh')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/auth-enhanced/verify', () => {
    let accessToken;

    beforeEach(async () => {
      const registerData = {
        email: 'verifytest@example.com',
        password: 'Password123!',
        firstName: 'Verify',
        lastName: 'Test'
      };

      const response = await request(app)
        .post('/api/auth-enhanced/register')
        .send(registerData);

      accessToken = response.body.accessToken;
    });

    it('should verify valid token', async () => {
      const response = await request(app)
        .get('/api/auth-enhanced/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'verifytest@example.com');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth-enhanced/verify')
        .set('Authorization', 'Bearer invalidToken')
        .expect(401);

      expect(response.body).toHaveProperty('valid', false);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth-enhanced/verify')
        .expect(401);

      expect(response.body).toHaveProperty('valid', false);
    });
  });

  describe('GET /api/auth-enhanced/sessions', () => {
    let accessToken;

    beforeEach(async () => {
      const registerData = {
        email: 'sessiontest@example.com',
        password: 'Password123!',
        firstName: 'Session',
        lastName: 'Test'
      };

      const response = await request(app)
        .post('/api/auth-enhanced/register')
        .send(registerData);

      accessToken = response.body.accessToken;
    });

    it('should return active sessions', async () => {
      const response = await request(app)
        .get('/api/auth-enhanced/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('sessions');
      expect(Array.isArray(response.body.sessions)).toBe(true);
      expect(response.body.sessions.length).toBeGreaterThan(0);
    });

    it('should return 401 without token', async () => {
      await request(app)
        .get('/api/auth-enhanced/sessions')
        .expect(401);
    });
  });

  describe('POST /api/auth-enhanced/change-password', () => {
    let accessToken;

    beforeEach(async () => {
      const registerData = {
        email: 'passwordtest@example.com',
        password: 'OldPassword123!',
        firstName: 'Password',
        lastName: 'Test'
      };

      const response = await request(app)
        .post('/api/auth-enhanced/register')
        .send(registerData);

      accessToken = response.body.accessToken;
    });

    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!'
      };

      const response = await request(app)
        .post('/api/auth-enhanced/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      const loginResponse = await request(app)
        .post('/api/auth-enhanced/login')
        .send({
          email: 'passwordtest@example.com',
          password: 'NewPassword123!'
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('success', true);
    });

    it('should return 401 with incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'WrongPassword!',
        newPassword: 'NewPassword123!'
      };

      const response = await request(app)
        .post('/api/auth-enhanced/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(passwordData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 401 without token', async () => {
      const passwordData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!'
      };

      await request(app)
        .post('/api/auth-enhanced/change-password')
        .send(passwordData)
        .expect(401);
    });
  });
});
