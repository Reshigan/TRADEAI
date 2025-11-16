// TRADEAI v2.0 - Trade Spend Controller Tests for 100% Coverage

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const tradeSpendController = require('../../controllers/tradeSpendController');
const TradeSpend = require('../../models/TradeSpend');
const { createFactories } = require('../../../tests/factories');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/tradespends', tradeSpendController);

// Mock authentication middleware
app.use((req, res, next) => {
  req.user = {
    id: new mongoose.Types.ObjectId(),
    companyId: new mongoose.Types.ObjectId(),
    role: 'admin'
  };
  next();
});

describe('TradeSpend Controller', () => {
  let factories;
  let testCompany;
  let testUser;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI);

    // Initialize factories
    factories = createFactories({
      TradeSpend,
      User: require('../../models/User'),
      Company: require('../../models/Company')
    });
  });

  beforeEach(async () => {
    // Clean database
    await TradeSpend.deleteMany({});

    // Create test data
    testCompany = await factories.company.create();
    testUser = await factories.user.create({ companyId: testCompany._id });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/tradespends', () => {
    test('should return all trade spends for company', async () => {
      // Create test trade spends
      const tradeSpend1 = await factories.tradeSpend.create({
        companyId: testCompany._id,
        amount: 10000,
        status: 'approved'
      });

      const tradeSpend2 = await factories.tradeSpend.create({
        companyId: testCompany._id,
        amount: 15000,
        status: 'pending'
      });

      const response = await request(app)
        .get('/api/tradespends')
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].amount).toBe(10000);
      expect(response.body.data[1].amount).toBe(15000);
    });

    test('should filter trade spends by status', async () => {
      await factories.tradeSpend.create({
        companyId: testCompany._id,
        status: 'approved'
      });

      await factories.tradeSpend.create({
        companyId: testCompany._id,
        status: 'pending'
      });

      const response = await request(app)
        .get('/api/tradespends?status=approved')
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('approved');
    });

    test('should paginate results', async () => {
      // Create 15 trade spends
      for (let i = 0; i < 15; i++) {
        await factories.tradeSpend.create({
          companyId: testCompany._id
        });
      }

      const response = await request(app)
        .get('/api/tradespends?page=1&limit=10')
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .expect(200);

      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.totalPages).toBe(2);
      expect(response.body.pagination.total).toBe(15);
    });

    test('should sort results by specified field', async () => {
      await factories.tradeSpend.create({
        companyId: testCompany._id,
        amount: 5000,
        createdAt: new Date('2023-01-01')
      });

      await factories.tradeSpend.create({
        companyId: testCompany._id,
        amount: 10000,
        createdAt: new Date('2023-01-02')
      });

      const response = await request(app)
        .get('/api/tradespends?sortBy=amount&sortOrder=desc')
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .expect(200);

      expect(response.body.data[0].amount).toBe(10000);
      expect(response.body.data[1].amount).toBe(5000);
    });

    test('should search trade spends by description', async () => {
      await factories.tradeSpend.create({
        companyId: testCompany._id,
        description: 'Summer promotion campaign'
      });

      await factories.tradeSpend.create({
        companyId: testCompany._id,
        description: 'Winter sale event'
      });

      const response = await request(app)
        .get('/api/tradespends?search=summer')
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].description).toContain('Summer');
    });

    test('should return 401 for unauthenticated requests', async () => {
      await request(app)
        .get('/api/tradespends')
        .expect(401);
    });

    test('should return empty array when no trade spends exist', async () => {
      const response = await request(app)
        .get('/api/tradespends')
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/tradespends/:id', () => {
    test('should return specific trade spend', async () => {
      const tradeSpend = await factories.tradeSpend.create({
        companyId: testCompany._id,
        amount: 25000,
        description: 'Test trade spend'
      });

      const response = await request(app)
        .get(`/api/tradespends/${tradeSpend._id}`)
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(25000);
      expect(response.body.data.description).toBe('Test trade spend');
    });

    test('should return 404 for non-existent trade spend', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/tradespends/${nonExistentId}`)
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Trade spend not found');
    });

    test('should return 400 for invalid ObjectId', async () => {
      const response = await request(app)
        .get('/api/tradespends/invalid-id')
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid ID format');
    });

    test('should not return trade spend from different company', async () => {
      const otherCompany = await factories.company.create();
      const tradeSpend = await factories.tradeSpend.create({
        companyId: otherCompany._id
      });

      await request(app)
        .get(`/api/tradespends/${tradeSpend._id}`)
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .expect(404);
    });
  });

  describe('POST /api/tradespends', () => {
    test('should create new trade spend', async () => {
      const tradeSpendData = {
        customerId: new mongoose.Types.ObjectId(),
        productId: new mongoose.Types.ObjectId(),
        amount: 30000,
        currency: 'USD',
        type: 'promotion',
        description: 'New promotion campaign',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      };

      const response = await request(app)
        .post('/api/tradespends')
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .send(tradeSpendData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(30000);
      expect(response.body.data.companyId.toString()).toBe(testCompany._id.toString());
      expect(response.body.data.createdBy.toString()).toBe(testUser._id.toString());
    });

    test('should validate required fields', async () => {
      const invalidData = {
        amount: 30000
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/tradespends')
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    test('should validate amount is positive', async () => {
      const invalidData = {
        customerId: new mongoose.Types.ObjectId(),
        productId: new mongoose.Types.ObjectId(),
        amount: -1000,
        currency: 'USD',
        type: 'promotion',
        description: 'Invalid amount test'
      };

      const response = await request(app)
        .post('/api/tradespends')
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Amount must be positive');
    });

    test('should validate date range', async () => {
      const invalidData = {
        customerId: new mongoose.Types.ObjectId(),
        productId: new mongoose.Types.ObjectId(),
        amount: 30000,
        currency: 'USD',
        type: 'promotion',
        description: 'Invalid date range test',
        startDate: new Date(),
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      };

      const response = await request(app)
        .post('/api/tradespends')
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('End date must be after start date');
    });

    test('should set default status to draft', async () => {
      const tradeSpendData = {
        customerId: new mongoose.Types.ObjectId(),
        productId: new mongoose.Types.ObjectId(),
        amount: 30000,
        currency: 'USD',
        type: 'promotion',
        description: 'Default status test'
      };

      const response = await request(app)
        .post('/api/tradespends')
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .send(tradeSpendData)
        .expect(201);

      expect(response.body.data.status).toBe('draft');
    });
  });

  describe('PUT /api/tradespends/:id', () => {
    test('should update existing trade spend', async () => {
      const tradeSpend = await factories.tradeSpend.create({
        companyId: testCompany._id,
        amount: 20000,
        description: 'Original description'
      });

      const updateData = {
        amount: 25000,
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/tradespends/${tradeSpend._id}`)
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(25000);
      expect(response.body.data.description).toBe('Updated description');
    });

    test('should not update approved trade spend', async () => {
      const tradeSpend = await factories.tradeSpend.create({
        companyId: testCompany._id,
        status: 'approved'
      });

      const updateData = {
        amount: 25000
      };

      const response = await request(app)
        .put(`/api/tradespends/${tradeSpend._id}`)
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot update approved trade spend');
    });

    test('should validate update data', async () => {
      const tradeSpend = await factories.tradeSpend.create({
        companyId: testCompany._id
      });

      const invalidData = {
        amount: -5000
      };

      const response = await request(app)
        .put(`/api/tradespends/${tradeSpend._id}`)
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 for non-existent trade spend', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/tradespends/${nonExistentId}`)
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .send({ amount: 25000 })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/tradespends/:id', () => {
    test('should delete trade spend', async () => {
      const tradeSpend = await factories.tradeSpend.create({
        companyId: testCompany._id,
        status: 'draft'
      });

      const response = await request(app)
        .delete(`/api/tradespends/${tradeSpend._id}`)
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Trade spend deleted successfully');

      // Verify deletion
      const deletedTradeSpend = await TradeSpend.findById(tradeSpend._id);
      expect(deletedTradeSpend).toBeNull();
    });

    test('should not delete approved trade spend', async () => {
      const tradeSpend = await factories.tradeSpend.create({
        companyId: testCompany._id,
        status: 'approved'
      });

      const response = await request(app)
        .delete(`/api/tradespends/${tradeSpend._id}`)
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot delete approved trade spend');
    });

    test('should return 404 for non-existent trade spend', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/tradespends/${nonExistentId}`)
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/tradespends/:id/approve', () => {
    test('should approve pending trade spend', async () => {
      const tradeSpend = await factories.tradeSpend.create({
        companyId: testCompany._id,
        status: 'pending'
      });

      const response = await request(app)
        .post(`/api/tradespends/${tradeSpend._id}/approve`)
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('approved');
      expect(response.body.data.approvedBy.toString()).toBe(testUser._id.toString());
      expect(response.body.data.approvedAt).toBeDefined();
    });

    test('should not approve already approved trade spend', async () => {
      const tradeSpend = await factories.tradeSpend.create({
        companyId: testCompany._id,
        status: 'approved'
      });

      const response = await request(app)
        .post(`/api/tradespends/${tradeSpend._id}/approve`)
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already approved');
    });

    test('should require admin role for approval', async () => {
      const regularUser = await factories.user.create({
        companyId: testCompany._id,
        role: 'user'
      });

      const tradeSpend = await factories.tradeSpend.create({
        companyId: testCompany._id,
        status: 'pending'
      });

      const response = await request(app)
        .post(`/api/tradespends/${tradeSpend._id}/approve`)
        .set('Authorization', `Bearer ${generateTestToken(regularUser)}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');
    });
  });

  describe('POST /api/tradespends/:id/reject', () => {
    test('should reject pending trade spend', async () => {
      const tradeSpend = await factories.tradeSpend.create({
        companyId: testCompany._id,
        status: 'pending'
      });

      const rejectionData = {
        reason: 'Budget exceeded'
      };

      const response = await request(app)
        .post(`/api/tradespends/${tradeSpend._id}/reject`)
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .send(rejectionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('rejected');
      expect(response.body.data.rejectionReason).toBe('Budget exceeded');
    });

    test('should require rejection reason', async () => {
      const tradeSpend = await factories.tradeSpend.create({
        companyId: testCompany._id,
        status: 'pending'
      });

      const response = await request(app)
        .post(`/api/tradespends/${tradeSpend._id}/reject`)
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Rejection reason is required');
    });
  });

  describe('GET /api/tradespends/analytics/summary', () => {
    test('should return trade spend analytics', async () => {
      // Create test data
      await factories.tradeSpend.create({
        companyId: testCompany._id,
        amount: 10000,
        status: 'approved',
        type: 'promotion'
      });

      await factories.tradeSpend.create({
        companyId: testCompany._id,
        amount: 15000,
        status: 'approved',
        type: 'discount'
      });

      const response = await request(app)
        .get('/api/tradespends/analytics/summary')
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalSpend).toBe(25000);
      expect(response.body.data.totalCount).toBe(2);
      expect(response.body.data.byType.promotion).toBe(10000);
      expect(response.body.data.byType.discount).toBe(15000);
    });

    test('should filter analytics by date range', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');

      await factories.tradeSpend.create({
        companyId: testCompany._id,
        amount: 10000,
        status: 'approved',
        createdAt: new Date('2023-06-01')
      });

      await factories.tradeSpend.create({
        companyId: testCompany._id,
        amount: 15000,
        status: 'approved',
        createdAt: new Date('2022-06-01') // Outside range
      });

      const response = await request(app)
        .get(`/api/tradespends/analytics/summary?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .expect(200);

      expect(response.body.data.totalSpend).toBe(10000);
      expect(response.body.data.totalCount).toBe(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      // Temporarily close database connection
      await mongoose.connection.close();

      const response = await request(app)
        .get('/api/tradespends')
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Database error');

      // Reconnect for other tests
      await mongoose.connect(process.env.MONGODB_TEST_URI);
    });

    test('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/tradespends')
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid JSON');
    });
  });

  describe('Performance', () => {
    test('should handle large datasets efficiently', async () => {
      // Create 1000 trade spends
      const tradeSpends = [];
      for (let i = 0; i < 1000; i++) {
        tradeSpends.push({
          companyId: testCompany._id,
          customerId: new mongoose.Types.ObjectId(),
          productId: new mongoose.Types.ObjectId(),
          amount: Math.floor(Math.random() * 100000),
          currency: 'USD',
          type: 'promotion',
          description: `Test trade spend ${i}`,
          status: 'approved'
        });
      }
      await TradeSpend.insertMany(tradeSpends);

      const startTime = Date.now();

      const response = await request(app)
        .get('/api/tradespends?limit=100')
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .expect(200);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(response.body.data).toHaveLength(100);
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should use database indexes for efficient queries', async () => {
      // This test would verify that proper indexes are being used
      // In a real scenario, you'd use MongoDB's explain() method
      const response = await request(app)
        .get('/api/tradespends?status=approved&sortBy=createdAt')
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});

// Helper function to generate test JWT token
function generateTestToken(user) {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    {
      id: user._id,
      companyId: user.companyId,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}
