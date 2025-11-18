const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const TradeSpend = require('../../models/TradeSpend');
const User = require('../../models/User');
const Company = require('../../models/Company');
const Customer = require('../../models/Customer');

describe('TradeSpend API Tests', () => {
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
      code: 'TEST002',
      currency: 'ZAR',
      status: 'active'
    });

    testCustomer = await Customer.create({
      company: testCompany._id,
      name: 'Test Customer',
      code: 'CUST001',
      status: 'active'
    });

    testUser = await User.create({
      email: 'tradespend.test@test.com',
      password: 'Test@123456',
      name: 'TradeSpend Test User',
      role: 'admin',
      company: testCompany._id,
      companyId: testCompany._id
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'tradespend.test@test.com',
        password: 'Test@123456'
      });

    authToken = loginRes.body.token;
  });

  afterAll(async () => {
    // Cleanup
    await TradeSpend.deleteMany({ company: testCompany._id });
    await Customer.deleteMany({ company: testCompany._id });
    await User.deleteMany({ email: 'tradespend.test@test.com' });
    await Company.deleteMany({ code: 'TEST002' });
    await mongoose.connection.close();
  });

  describe('POST /api/trade-spends', () => {
    it('should create a new trade spend with activityType', async () => {
      const tradeSpendData = {
        spendId: 'TS-2025-001',
        spendType: 'promotion',
        activityType: 'trade_marketing',
        category: 'Trade Promotions',
        amount: {
          requested: 5000
        },
        customer: testCustomer._id,
        status: 'draft'
      };

      const res = await request(app)
        .post('/api/trade-spends')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tradeSpendData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.activityType).toBe('trade_marketing');
      expect(res.body.spendType).toBe('promotion');
    });

    it('should create a trade spend with key_account activityType', async () => {
      const tradeSpendData = {
        spendId: 'TS-2025-002',
        spendType: 'cash_coop',
        activityType: 'key_account',
        category: 'Key Account Management',
        amount: {
          requested: 10000
        },
        customer: testCustomer._id,
        status: 'draft'
      };

      const res = await request(app)
        .post('/api/trade-spends')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tradeSpendData);

      expect(res.status).toBe(201);
      expect(res.body.activityType).toBe('key_account');
    });

    it('should allow null activityType', async () => {
      const tradeSpendData = {
        spendId: 'TS-2025-003',
        spendType: 'rebate',
        category: 'Volume Rebates',
        amount: {
          requested: 3000
        },
        customer: testCustomer._id,
        status: 'draft'
      };

      const res = await request(app)
        .post('/api/trade-spends')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tradeSpendData);

      expect(res.status).toBe(201);
      expect(res.body.activityType).toBeNull();
    });
  });

  describe('GET /api/trade-spends', () => {
    it('should retrieve all trade spends for the company', async () => {
      const res = await request(app)
        .get('/api/trade-spends')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter trade spends by activityType', async () => {
      const res = await request(app)
        .get('/api/trade-spends?activityType=trade_marketing')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach(spend => {
        expect(spend.activityType).toBe('trade_marketing');
      });
    });
  });

  describe('GET /api/trade-spends/:id', () => {
    it('should retrieve a specific trade spend by ID', async () => {
      const tradeSpend = await TradeSpend.create({
        company: testCompany._id,
        spendId: 'TS-2025-DETAIL',
        spendType: 'promotion',
        activityType: 'trade_marketing',
        category: 'Trade Promotions',
        amount: {
          requested: 5000
        },
        customer: testCustomer._id,
        status: 'draft'
      });

      const res = await request(app)
        .get(`/api/trade-spends/${tradeSpend._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(tradeSpend._id.toString());
      expect(res.body.activityType).toBe('trade_marketing');
    });
  });

  describe('PUT /api/trade-spends/:id', () => {
    it('should update a trade spend including activityType', async () => {
      const tradeSpend = await TradeSpend.create({
        company: testCompany._id,
        spendId: 'TS-2025-UPDATE',
        spendType: 'promotion',
        activityType: 'trade_marketing',
        category: 'Trade Promotions',
        amount: {
          requested: 5000
        },
        customer: testCustomer._id,
        status: 'draft'
      });

      const updateData = {
        activityType: 'key_account',
        amount: {
          requested: 7500
        }
      };

      const res = await request(app)
        .put(`/api/trade-spends/${tradeSpend._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.activityType).toBe('key_account');
      expect(res.body.amount.requested).toBe(7500);
    });
  });
});
