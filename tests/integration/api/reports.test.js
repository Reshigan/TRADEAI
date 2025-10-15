const request = require('supertest');
const app = require('../../../backend/src/app');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../../backend/src/models/User');
const Tenant = require('../../../backend/src/models/Tenant');

describe('Reports API Integration Tests', () => {
  let authToken;
  let testUser;
  let testTenant;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/tradeai_test');
    
    // Create test tenant
    testTenant = await Tenant.create({
      name: 'Test Organization',
      domain: 'test.com',
      settings: {
        currency: 'ZAR',
        timezone: 'Africa/Johannesburg'
      }
    });

    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      role: 'admin',
      tenantId: testTenant._id
    });

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser._id, tenantId: testTenant._id },
      process.env.JWT_SECRET || 'test_secret'
    );
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Tenant.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Product Reports API', () => {
    describe('GET /api/reports/products/overview', () => {
      test('should return product overview data', async () => {
        const response = await request(app)
          .get('/api/reports/products/overview')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('metrics');
        expect(response.body.data.metrics).toHaveProperty('totalRevenue');
        expect(response.body.data.metrics).toHaveProperty('unitsSold');
        expect(response.body.data.metrics).toHaveProperty('avgMargin');
        expect(response.body.data.metrics).toHaveProperty('activeProducts');
      });

      test('should filter by date range', async () => {
        const response = await request(app)
          .get('/api/reports/products/overview')
          .query({
            startDate: '2025-01-01',
            endDate: '2025-01-31'
          })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('metrics');
      });

      test('should filter by category', async () => {
        const response = await request(app)
          .get('/api/reports/products/overview')
          .query({ category: 'Beverages' })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('metrics');
      });

      test('should require authentication', async () => {
        await request(app)
          .get('/api/reports/products/overview')
          .expect(401);
      });

      test('should apply tenant isolation', async () => {
        // Create another tenant and user
        const otherTenant = await Tenant.create({
          name: 'Other Organization',
          domain: 'other.com'
        });

        const otherUser = await User.create({
          email: 'other@example.com',
          password: 'hashedpassword',
          firstName: 'Other',
          lastName: 'User',
          role: 'admin',
          tenantId: otherTenant._id
        });

        const otherToken = jwt.sign(
          { userId: otherUser._id, tenantId: otherTenant._id },
          process.env.JWT_SECRET || 'test_secret'
        );

        const response = await request(app)
          .get('/api/reports/products/overview')
          .set('Authorization', `Bearer ${otherToken}`)
          .expect(200);

        // Should return data specific to the other tenant
        expect(response.body.success).toBe(true);
        
        // Clean up
        await User.findByIdAndDelete(otherUser._id);
        await Tenant.findByIdAndDelete(otherTenant._id);
      });
    });

    describe('GET /api/reports/products/sales-performance', () => {
      test('should return sales performance data', async () => {
        const response = await request(app)
          .get('/api/reports/products/sales-performance')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('salesData');
        expect(response.body.data).toHaveProperty('summary');
        expect(Array.isArray(response.body.data.salesData)).toBe(true);
      });

      test('should handle pagination', async () => {
        const response = await request(app)
          .get('/api/reports/products/sales-performance')
          .query({ page: 1, limit: 10 })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.salesData.length).toBeLessThanOrEqual(10);
      });
    });

    describe('GET /api/reports/products/inventory', () => {
      test('should return inventory analytics data', async () => {
        const response = await request(app)
          .get('/api/reports/products/inventory')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('inventoryMetrics');
        expect(response.body.data).toHaveProperty('stockLevels');
        expect(response.body.data).toHaveProperty('turnoverRates');
      });
    });

    describe('GET /api/reports/products/profitability', () => {
      test('should return profitability analysis data', async () => {
        const response = await request(app)
          .get('/api/reports/products/profitability')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('profitabilityMetrics');
        expect(response.body.data).toHaveProperty('marginAnalysis');
      });
    });
  });

  describe('Promotion Reports API', () => {
    describe('GET /api/reports/promotions/campaigns', () => {
      test('should return campaign overview data', async () => {
        const response = await request(app)
          .get('/api/reports/promotions/campaigns')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('metrics');
        expect(response.body.data.metrics).toHaveProperty('totalROI');
        expect(response.body.data.metrics).toHaveProperty('totalSpend');
        expect(response.body.data.metrics).toHaveProperty('avgUplift');
        expect(response.body.data.metrics).toHaveProperty('totalConversions');
      });

      test('should filter by campaign status', async () => {
        const response = await request(app)
          .get('/api/reports/promotions/campaigns')
          .query({ status: 'active' })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('campaigns');
      });

      test('should filter by channel', async () => {
        const response = await request(app)
          .get('/api/reports/promotions/campaigns')
          .query({ channel: 'online' })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /api/reports/promotions/roi-analysis', () => {
      test('should return ROI analysis data', async () => {
        const response = await request(app)
          .get('/api/reports/promotions/roi-analysis')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('roiAnalysis');
        expect(response.body.data).toHaveProperty('benchmarks');
        expect(Array.isArray(response.body.data.roiAnalysis)).toBe(true);
      });
    });

    describe('GET /api/reports/promotions/uplift', () => {
      test('should return uplift measurement data', async () => {
        const response = await request(app)
          .get('/api/reports/promotions/uplift')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('upliftAnalysis');
        expect(response.body.data).toHaveProperty('baselineComparison');
      });
    });

    describe('GET /api/reports/promotions/channels', () => {
      test('should return channel performance data', async () => {
        const response = await request(app)
          .get('/api/reports/promotions/channels')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('channelPerformance');
        expect(response.body.data).toHaveProperty('channelComparison');
      });
    });
  });

  describe('Trade Spend Reports API', () => {
    describe('GET /api/reports/tradespend/overview', () => {
      test('should return trade spend overview data', async () => {
        const response = await request(app)
          .get('/api/reports/tradespend/overview')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('metrics');
        expect(response.body.data.metrics).toHaveProperty('totalBudget');
        expect(response.body.data.metrics).toHaveProperty('actualSpend');
        expect(response.body.data.metrics).toHaveProperty('averageROI');
        expect(response.body.data.metrics).toHaveProperty('budgetUtilization');
      });

      test('should include program breakdown', async () => {
        const response = await request(app)
          .get('/api/reports/tradespend/overview')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data).toHaveProperty('programs');
        expect(response.body.data).toHaveProperty('categoryBreakdown');
        expect(Array.isArray(response.body.data.programs)).toBe(true);
        expect(Array.isArray(response.body.data.categoryBreakdown)).toBe(true);
      });
    });

    describe('GET /api/reports/tradespend/budget-actual', () => {
      test('should return budget vs actual analysis', async () => {
        const response = await request(app)
          .get('/api/reports/tradespend/budget-actual')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('comparison');
        expect(response.body.data).toHaveProperty('summary');
        expect(response.body.data).toHaveProperty('forecasts');
      });

      test('should filter by time period', async () => {
        const response = await request(app)
          .get('/api/reports/tradespend/budget-actual')
          .query({
            startDate: '2025-01-01',
            endDate: '2025-03-31'
          })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /api/reports/tradespend/channels', () => {
      test('should return channel performance data', async () => {
        const response = await request(app)
          .get('/api/reports/tradespend/channels')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('channelAnalysis');
        expect(response.body.data).toHaveProperty('channelROI');
      });
    });

    describe('GET /api/reports/tradespend/optimization', () => {
      test('should return optimization analytics', async () => {
        const response = await request(app)
          .get('/api/reports/tradespend/optimization')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('optimizationMetrics');
        expect(response.body.data).toHaveProperty('recommendations');
      });
    });
  });

  describe('Report Export Functionality', () => {
    describe('POST /api/reports/export', () => {
      test('should export product reports to PDF', async () => {
        const response = await request(app)
          .post('/api/reports/export')
          .send({
            reportType: 'products',
            format: 'pdf',
            filters: {
              startDate: '2025-01-01',
              endDate: '2025-01-31'
            }
          })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('downloadUrl');
        expect(response.body.data).toHaveProperty('filename');
      });

      test('should export promotion reports to Excel', async () => {
        const response = await request(app)
          .post('/api/reports/export')
          .send({
            reportType: 'promotions',
            format: 'excel',
            filters: {
              status: 'active'
            }
          })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('downloadUrl');
      });

      test('should export trade spend reports to CSV', async () => {
        const response = await request(app)
          .post('/api/reports/export')
          .send({
            reportType: 'tradespend',
            format: 'csv'
          })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('downloadUrl');
      });

      test('should validate export parameters', async () => {
        const response = await request(app)
          .post('/api/reports/export')
          .send({
            reportType: 'invalid',
            format: 'pdf'
          })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid report endpoints', async () => {
      await request(app)
        .get('/api/reports/invalid/endpoint')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    test('should handle malformed query parameters', async () => {
      const response = await request(app)
        .get('/api/reports/products/overview')
        .query({ startDate: 'invalid-date' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle database connection errors', async () => {
      // Temporarily close database connection
      await mongoose.connection.close();

      const response = await request(app)
        .get('/api/reports/products/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('success', false);

      // Reconnect database
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/tradeai_test');
    });
  });

  describe('Performance Tests', () => {
    test('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/reports/products/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });

    test('should handle concurrent requests', async () => {
      const requests = Array(10).fill().map(() =>
        request(app)
          .get('/api/reports/products/overview')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits', async () => {
      // Make multiple rapid requests
      const requests = Array(101).fill().map(() =>
        request(app)
          .get('/api/reports/products/overview')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.allSettled(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(
        response => response.value && response.value.status === 429
      );
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Data Validation', () => {
    test('should validate date range parameters', async () => {
      const response = await request(app)
        .get('/api/reports/products/overview')
        .query({
          startDate: '2025-12-31',
          endDate: '2025-01-01' // End date before start date
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('date range');
    });

    test('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/reports/products/sales-performance')
        .query({
          page: -1,
          limit: 1000 // Exceeds maximum limit
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Caching', () => {
    test('should cache report data for performance', async () => {
      // First request
      const startTime1 = Date.now();
      const response1 = await request(app)
        .get('/api/reports/products/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const responseTime1 = Date.now() - startTime1;

      // Second request (should be cached)
      const startTime2 = Date.now();
      const response2 = await request(app)
        .get('/api/reports/products/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const responseTime2 = Date.now() - startTime2;

      // Cached response should be faster
      expect(responseTime2).toBeLessThan(responseTime1);
      expect(response1.body).toEqual(response2.body);
    });
  });
});