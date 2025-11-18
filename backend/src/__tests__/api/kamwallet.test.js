const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const KAMWallet = require('../../models/KAMWallet');
const User = require('../../models/User');
const Company = require('../../models/Company');
const Customer = require('../../models/Customer');

describe('KAM Wallet API Tests', () => {
  let authToken;
  let testCompany;
  let testUser;
  let testCustomer;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/tradeai_test', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    testCompany = await Company.create({
      name: 'Test Company',
      code: 'TEST003',
      currency: 'ZAR',
      status: 'active'
    });

    testCustomer = await Customer.create({
      company: testCompany._id,
      name: 'Test Customer',
      code: 'CUST002',
      status: 'active'
    });

    testUser = await User.create({
      email: 'kamwallet.test@test.com',
      password: 'Test@123456',
      name: 'KAM Wallet Test User',
      role: 'key_account_manager',
      company: testCompany._id,
      companyId: testCompany._id
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'kamwallet.test@test.com',
        password: 'Test@123456'
      });

    authToken = loginRes.body.token;
  });

  afterAll(async () => {
    // Cleanup
    await KAMWallet.deleteMany({ company: testCompany._id });
    await Customer.deleteMany({ company: testCompany._id });
    await User.deleteMany({ email: 'kamwallet.test@test.com' });
    await Company.deleteMany({ code: 'TEST003' });
    await mongoose.connection.close();
  });

  describe('POST /api/kamwallets', () => {
    it('should create a new KAM wallet', async () => {
      const walletData = {
        user: testUser._id,
        year: 2025,
        quarter: 'Q1',
        totalBudget: 50000,
        status: 'active'
      };

      const res = await request(app)
        .post('/api/kamwallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(walletData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.totalBudget).toBe(50000);
      expect(res.body.allocated).toBe(0);
      expect(res.body.remaining).toBe(50000);
    });
  });

  describe('GET /api/kamwallets', () => {
    it('should retrieve all KAM wallets for the company', async () => {
      const res = await request(app)
        .get('/api/kamwallets')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/kamwallets/:id', () => {
    it('should retrieve a specific KAM wallet by ID', async () => {
      const wallet = await KAMWallet.create({
        company: testCompany._id,
        user: testUser._id,
        year: 2025,
        quarter: 'Q2',
        totalBudget: 60000,
        allocated: 0,
        remaining: 60000,
        spent: 0,
        status: 'active',
        allocations: []
      });

      const res = await request(app)
        .get(`/api/kamwallets/${wallet._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(wallet._id.toString());
      expect(res.body.totalBudget).toBe(60000);
    });
  });

  describe('POST /api/kamwallets/:id/allocate', () => {
    it('should allocate funds to a customer', async () => {
      const wallet = await KAMWallet.create({
        company: testCompany._id,
        user: testUser._id,
        year: 2025,
        quarter: 'Q3',
        totalBudget: 70000,
        allocated: 0,
        remaining: 70000,
        spent: 0,
        status: 'active',
        allocations: []
      });

      const allocationData = {
        customer: testCustomer._id,
        amount: 10000,
        purpose: 'Trade promotion support'
      };

      const res = await request(app)
        .post(`/api/kamwallets/${wallet._id}/allocate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(allocationData);

      expect(res.status).toBe(200);
      expect(res.body.allocated).toBe(10000);
      expect(res.body.remaining).toBe(60000);
      expect(res.body.allocations.length).toBe(1);
      expect(res.body.allocations[0].customer.toString()).toBe(testCustomer._id.toString());
    });

    it('should prevent overspending', async () => {
      const wallet = await KAMWallet.create({
        company: testCompany._id,
        user: testUser._id,
        year: 2025,
        quarter: 'Q4',
        totalBudget: 5000,
        allocated: 0,
        remaining: 5000,
        spent: 0,
        status: 'active',
        allocations: []
      });

      const allocationData = {
        customer: testCustomer._id,
        amount: 10000,
        purpose: 'Exceeds budget'
      };

      const res = await request(app)
        .post(`/api/kamwallets/${wallet._id}/allocate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(allocationData);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Insufficient funds');
    });
  });
});
