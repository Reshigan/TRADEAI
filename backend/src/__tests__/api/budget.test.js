const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const Budget = require('../../models/Budget');
const User = require('../../models/User');
const Company = require('../../models/Company');

describe('Budget API Tests', () => {
  let authToken;
  let testCompany;
  let testUser;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/tradeai_test', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    testCompany = await Company.create({
      name: 'Test Company',
      code: 'TEST001',
      currency: 'ZAR',
      status: 'active'
    });

    testUser = await User.create({
      email: 'budget.test@test.com',
      password: 'Test@123456',
      name: 'Budget Test User',
      role: 'admin',
      company: testCompany._id,
      companyId: testCompany._id
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'budget.test@test.com',
        password: 'Test@123456'
      });

    authToken = loginRes.body.token;
  });

  afterAll(async () => {
    // Cleanup
    await Budget.deleteMany({ company: testCompany._id });
    await User.deleteMany({ email: 'budget.test@test.com' });
    await Company.deleteMany({ code: 'TEST001' });
    await mongoose.connection.close();
  });

  describe('POST /api/budgets', () => {
    it('should create a new budget with budgetCategory', async () => {
      const budgetData = {
        name: 'Test Marketing Budget 2025',
        code: 'BUD-2025-TEST001',
        year: 2025,
        budgetType: 'budget',
        budgetCategory: 'marketing',
        scope: {
          level: 'company'
        },
        allocated: 100000,
        remaining: 100000,
        spent: 0
      };

      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(budgetData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.budgetCategory).toBe('marketing');
      expect(res.body.name).toBe('Test Marketing Budget 2025');
    });

    it('should create a budget with trade_marketing category', async () => {
      const budgetData = {
        name: 'Test Trade Marketing Budget 2025',
        code: 'BUD-2025-TEST002',
        year: 2025,
        budgetType: 'budget',
        budgetCategory: 'trade_marketing',
        scope: {
          level: 'company'
        },
        allocated: 50000,
        remaining: 50000,
        spent: 0
      };

      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(budgetData);

      expect(res.status).toBe(201);
      expect(res.body.budgetCategory).toBe('trade_marketing');
    });

    it('should default to marketing if budgetCategory not provided', async () => {
      const budgetData = {
        name: 'Test Default Budget 2025',
        code: 'BUD-2025-TEST003',
        year: 2025,
        budgetType: 'budget',
        scope: {
          level: 'company'
        },
        allocated: 75000,
        remaining: 75000,
        spent: 0
      };

      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(budgetData);

      expect(res.status).toBe(201);
      expect(res.body.budgetCategory).toBe('marketing');
    });
  });

  describe('GET /api/budgets', () => {
    it('should retrieve all budgets for the company', async () => {
      const res = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter budgets by budgetCategory', async () => {
      const res = await request(app)
        .get('/api/budgets?budgetCategory=marketing')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach(budget => {
        expect(budget.budgetCategory).toBe('marketing');
      });
    });
  });

  describe('GET /api/budgets/:id', () => {
    it('should retrieve a specific budget by ID', async () => {
      const budget = await Budget.create({
        company: testCompany._id,
        name: 'Test Budget Detail',
        code: 'BUD-2025-DETAIL',
        year: 2025,
        budgetType: 'budget',
        budgetCategory: 'marketing',
        scope: { level: 'company' },
        allocated: 100000,
        remaining: 100000,
        spent: 0
      });

      const res = await request(app)
        .get(`/api/budgets/${budget._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(budget._id.toString());
      expect(res.body.budgetCategory).toBe('marketing');
    });
  });

  describe('PUT /api/budgets/:id', () => {
    it('should update a budget including budgetCategory', async () => {
      const budget = await Budget.create({
        company: testCompany._id,
        name: 'Test Budget Update',
        code: 'BUD-2025-UPDATE',
        year: 2025,
        budgetType: 'budget',
        budgetCategory: 'marketing',
        scope: { level: 'company' },
        allocated: 100000,
        remaining: 100000,
        spent: 0
      });

      const updateData = {
        budgetCategory: 'trade_marketing',
        allocated: 120000
      };

      const res = await request(app)
        .put(`/api/budgets/${budget._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.budgetCategory).toBe('trade_marketing');
      expect(res.body.allocated).toBe(120000);
    });
  });
});
