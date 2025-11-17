const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');

describe('TRADEAI Backend API - Complete Integration Tests', () => {
  let authToken;
  let _testUser;
  let _testCompany;

  beforeAll(async () => {
    // Setup test database connection
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/tradeai_test');

    // Create test user and get auth token
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
        role: 'admin'
      });

    authToken = response.body.token;
    testUser = response.body.user;
  });

  afterAll(async () => {
    // Cleanup
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe('Authentication & Authorization', () => {
    test('POST /api/auth/register - should create new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'Test123!@#',
          name: 'New User'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'newuser@example.com');
    });

    test('POST /api/auth/login - should login user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    test('GET /api/auth/me - should get current user', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', 'test@example.com');
    });

    test('POST /api/auth/logout - should logout user', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('Trade Spend Management', () => {
    let tradeSpendId;

    test('POST /api/trade-spends - should create trade spend', async () => {
      const res = await request(app)
        .post('/api/trade-spends')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Trade Spend',
          amount: 10000,
          customer: 'Test Customer',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('name', 'Test Trade Spend');
      tradeSpendId = res.body._id;
    });

    test('GET /api/trade-spends - should list trade spends', async () => {
      const res = await request(app)
        .get('/api/trade-spends')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /api/trade-spends/:id - should get trade spend by id', async () => {
      const res = await request(app)
        .get(`/api/trade-spends/${tradeSpendId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('_id', tradeSpendId);
    });

    test('PUT /api/trade-spends/:id - should update trade spend', async () => {
      const res = await request(app)
        .put(`/api/trade-spends/${tradeSpendId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 15000 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('amount', 15000);
    });

    test('DELETE /api/trade-spends/:id - should delete trade spend', async () => {
      const res = await request(app)
        .delete(`/api/trade-spends/${tradeSpendId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('Budget Management', () => {
    let _budgetId;

    test('POST /api/budgets - should create budget', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Budget',
          amount: 50000,
          period: 'quarterly',
          year: 2025
        });

      expect(res.status).toBe(201);
      budgetId = res.body._id;
    });

    test('GET /api/budgets - should list budgets', async () => {
      const res = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Customer Management', () => {
    let _customerId;

    test('POST /api/customers - should create customer', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Customer',
          email: 'customer@example.com',
          type: 'retail'
        });

      expect(res.status).toBe(201);
      customerId = res.body._id;
    });

    test('GET /api/customers - should list customers', async () => {
      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Product Management', () => {
    let _productId;

    test('POST /api/products - should create product', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Product',
          sku: 'TEST-001',
          price: 99.99
        });

      expect(res.status).toBe(201);
      productId = res.body._id;
    });

    test('GET /api/products - should list products', async () => {
      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Campaign Management', () => {
    test('POST /api/campaigns - should create campaign', async () => {
      const res = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Campaign',
          type: 'promotion',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

      expect(res.status).toBe(201);
    });

    test('GET /api/campaigns - should list campaigns', async () => {
      const res = await request(app)
        .get('/api/campaigns')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Analytics & Reporting', () => {
    test('GET /api/analytics/dashboard - should get dashboard data', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('metrics');
    });

    test('GET /api/reports - should list reports', async () => {
      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('Health & System', () => {
    test('GET /api/health - should return health status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'UP');
    });
  });
});
