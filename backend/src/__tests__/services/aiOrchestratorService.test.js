/**
 * AI Orchestrator Service Tests
 * Comprehensive test coverage for industry-leading quality
 */

const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const AIOrchestratorService = require('../services/aiOrchestratorService');

describe('AI Orchestrator Service', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    // Create test user
    testUser = await global.testUtils.createTestUser({
      email: 'ai-test@example.com',
      role: 'admin',
    });
    authToken = await global.testUtils.generateTestToken(testUser);
  });

  describe('Tool Selection', () => {
    it('should correctly identify demand forecasting intent', async () => {
      const intent = 'What will be the demand for product ABC next month?';
      
      const result = await AIOrchestratorService.selectTool(intent, {
        productId: 'abc123',
      });

      expect(result.tool).toBe('forecast_demand');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.parameters).toHaveProperty('productId');
    });

    it('should correctly identify price optimization intent', async () => {
      const intent = 'What is the optimal price for maximizing revenue?';
      
      const result = await AIOrchestratorService.selectTool(intent, {
        productId: 'xyz789',
      });

      expect(result.tool).toBe('optimize_price');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should correctly identify churn prediction intent', async () => {
      const intent = 'Is customer XYZ at risk of churning?';
      
      const result = await AIOrchestratorService.selectTool(intent, {
        customerId: 'cust123',
      });

      expect(result.tool).toBe('predict_churn');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should correctly identify customer LTV intent', async () => {
      const intent = 'What is the lifetime value of this customer?';
      
      const result = await AIOrchestratorService.selectTool(intent, {
        customerId: 'cust456',
      });

      expect(result.tool).toBe('predict_customer_ltv');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should correctly identify promotion lift analysis intent', async () => {
      const intent = 'How effective was our last promotion?';
      
      const result = await AIOrchestratorService.selectTool(intent, {
        promotionId: 'promo123',
      });

      expect(result.tool).toBe('analyze_promotion_lift');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should correctly identify customer segmentation intent', async () => {
      const intent = 'Segment our customers by behavior';
      
      const result = await AIOrchestratorService.selectTool(intent, {});

      expect(result.tool).toBe('segment_customers');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should correctly identify anomaly detection intent', async () => {
      const intent = 'Detect any unusual patterns in sales data';
      
      const result = await AIOrchestratorService.selectTool(intent, {
        metric: 'sales',
      });

      expect(result.tool).toBe('detect_anomalies');
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Orchestration Endpoint', () => {
    it('POST /api/ai-orchestrator/orchestrate - should handle demand forecast request', async () => {
      const response = await request(app)
        .post('/api/ai-orchestrator/orchestrate')
        .set(global.testUtils.createAuthHeaders(testUser))
        .send({
          intent: 'Forecast demand for product ABC',
          context: {
            productId: 'abc123',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('tool');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('explanation');
      expect(response.body).toHaveProperty('confidence');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('POST /api/ai-orchestrator/orchestrate - should handle price optimization request', async () => {
      const response = await request(app)
        .post('/api/ai-orchestrator/orchestrate')
        .set(global.testUtils.createAuthHeaders(testUser))
        .send({
          intent: 'Optimize price for product XYZ',
          context: {
            productId: 'xyz789',
            constraints: {
              minPrice: 10,
              maxPrice: 100,
            },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tool).toBe('optimize_price');
    });

    it('POST /api/ai-orchestrator/orchestrate - should handle churn prediction request', async () => {
      const response = await request(app)
        .post('/api/ai-orchestrator/orchestrate')
        .set(global.testUtils.createAuthHeaders(testUser))
        .send({
          intent: 'Predict churn risk for customer',
          context: {
            customerId: 'cust123',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tool).toBe('predict_churn');
    });

    it('POST /api/ai-orchestrator/orchestrate - should require authentication', async () => {
      const response = await request(app)
        .post('/api/ai-orchestrator/orchestrate')
        .send({
          intent: 'Test without auth',
        });

      expect(response.status).toBe(401);
    });

    it('POST /api/ai-orchestrator/orchestrate - should validate intent parameter', async () => {
      const response = await request(app)
        .post('/api/ai-orchestrator/orchestrate')
        .set(global.testUtils.createAuthHeaders(testUser))
        .send({
          intent: '',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('POST /api/ai-orchestrator/orchestrate - should handle invalid tool selection', async () => {
      const response = await request(app)
        .post('/api/ai-orchestrator/orchestrate')
        .set(global.testUtils.createAuthHeaders(testUser))
        .send({
          intent: 'Random unrelated question about weather',
          context: {},
        });

      // Should fallback to rule-based or return appropriate error
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Explain Endpoint', () => {
    it('POST /api/ai-orchestrator/explain - should generate explanation for ML results', async () => {
      const response = await request(app)
        .post('/api/ai-orchestrator/explain')
        .set(global.testUtils.createAuthHeaders(testUser))
        .send({
          data: {
            predictedCLV: 15000,
            confidence: 0.85,
          },
          context: {
            userIntent: 'What is this customer\'s value?',
            toolName: 'predict_customer_ltv',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('explanation');
      expect(response.body.explanation).toContain('$15,000');
    });

    it('POST /api/ai-orchestrator/explain - should handle missing data', async () => {
      const response = await request(app)
        .post('/api/ai-orchestrator/explain')
        .set(global.testUtils.createAuthHeaders(testUser))
        .send({
          data: null,
          context: {},
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Tools Endpoint', () => {
    it('GET /api/ai-orchestrator/tools - should return available tools', async () => {
      const response = await request(app)
        .get('/api/ai-orchestrator/tools')
        .set(global.testUtils.createAuthHeaders(testUser));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('tools');
      expect(Array.isArray(response.body.tools)).toBe(true);
      expect(response.body.tools.length).toBeGreaterThan(0);
    });

    it('GET /api/ai-orchestrator/tools - should include tool metadata', async () => {
      const response = await request(app)
        .get('/api/ai-orchestrator/tools')
        .set(global.testUtils.createAuthHeaders(testUser));

      const tool = response.body.tools[0];
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('parameters');
    });
  });

  describe('Health Endpoint', () => {
    it('GET /api/ai-orchestrator/health - should return service health', async () => {
      const response = await request(app)
        .get('/api/ai-orchestrator/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('orchestrator');
      expect(response.body).toHaveProperty('ollama');
      expect(response.body).toHaveProperty('mlService');
      expect(response.body).toHaveProperty('fallback');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('GET /api/ai-orchestrator/health - should not require authentication', async () => {
      const response = await request(app)
        .get('/api/ai-orchestrator/health');

      expect(response.status).toBe(200);
    });
  });

  describe('Cache Management', () => {
    it('POST /api/ai-orchestrator/cache/clear - should clear cache (admin only)', async () => {
      const response = await request(app)
        .post('/api/ai-orchestrator/cache/clear')
        .set(global.testUtils.createAuthHeaders(testUser));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('POST /api/ai-orchestrator/cache/clear - should reject non-admin users', async () => {
      const regularUser = await global.testUtils.createTestUser({
        email: 'regular@example.com',
        role: 'user',
      });
      
      const response = await request(app)
        .post('/api/ai-orchestrator/cache/clear')
        .set(global.testUtils.createAuthHeaders(regularUser));

      expect(response.status).toBe(403);
    });
  });

  describe('Fallback Behavior', () => {
    it('should use fallback when Ollama is unavailable', async () => {
      // Mock Ollama service as unavailable
      jest.spyOn(AIOrchestratorService, 'callOllama').mockRejectedValue(new Error('Service unavailable'));

      const result = await AIOrchestratorService.orchestrate(
        'Forecast demand for product ABC',
        { productId: 'abc123' },
        testUser._id
      );

      expect(result.success).toBe(true);
      expect(result.fallback).toBe(true);
      expect(result.tool).toBe('forecast_demand');
    });

    it('should use fallback when ML service is unavailable', async () => {
      // Mock ML service as unavailable
      jest.spyOn(AIOrchestratorService, 'callMLService').mockRejectedValue(new Error('Service unavailable'));

      const result = await AIOrchestratorService.orchestrate(
        'Forecast demand for product ABC',
        { productId: 'abc123' },
        testUser._id
      );

      expect(result.success).toBe(true);
      expect(result.fallback).toBe(true);
    });

    it('should return rule-based response when both services unavailable', async () => {
      // Mock both services as unavailable
      jest.spyOn(AIOrchestratorService, 'callOllama').mockRejectedValue(new Error('Service unavailable'));
      jest.spyOn(AIOrchestratorService, 'callMLService').mockRejectedValue(new Error('Service unavailable'));

      const result = await AIOrchestratorService.orchestrate(
        'Forecast demand for product ABC',
        { productId: 'abc123' },
        testUser._id
      );

      expect(result.success).toBe(true);
      expect(result.fallback).toBe(true);
      expect(result.confidence).toBeLessThan(0.8);
    });
  });

  describe('Caching', () => {
    it('should cache orchestration results', async () => {
      const intent = 'Forecast demand for product ABC';
      const context = { productId: 'abc123' };

      // First call
      const result1 = await AIOrchestratorService.orchestrate(intent, context, testUser._id);
      
      // Second call (should be cached)
      const result2 = await AIOrchestratorService.orchestrate(intent, context, testUser._id);

      expect(result1.data).toEqual(result2.data);
      expect(result2.cached).toBe(true);
    });

    it('should respect cache TTL', async () => {
      const intent = 'Forecast demand for product ABC';
      const context = { productId: 'abc123' };

      // First call
      await AIOrchestratorService.orchestrate(intent, context, testUser._id);
      
      // Wait for cache to expire (30 minutes in production, shorter in tests)
      jest.useFakeTimers();
      jest.advanceTimersByTime(31 * 60 * 1000); // 31 minutes

      // Second call (cache expired)
      const result = await AIOrchestratorService.orchestrate(intent, context, testUser._id);

      expect(result.cached).toBe(false);
      jest.useRealTimers();
    });
  });

  describe('Tenant Isolation', () => {
    it('should isolate data by tenant', async () => {
      const tenant1User = await global.testUtils.createTestUser({
        email: 'tenant1@example.com',
        tenantId: 'tenant1',
      });

      const tenant2User = await global.testUtils.createTestUser({
        email: 'tenant2@example.com',
        tenantId: 'tenant2',
      });

      // Make request for tenant1
      const result1 = await AIOrchestratorService.orchestrate(
        'Forecast demand',
        { productId: 'abc123' },
        tenant1User._id
      );

      // Make request for tenant2
      const result2 = await AIOrchestratorService.orchestrate(
        'Forecast demand',
        { productId: 'abc123' },
        tenant2User._id
      );

      // Results should be isolated (different cache keys)
      expect(result1.tenantId).toBe('tenant1');
      expect(result2.tenantId).toBe('tenant2');
    });
  });

  describe('Performance', () => {
    it('should complete orchestration within acceptable time', async () => {
      const startTime = Date.now();

      await AIOrchestratorService.orchestrate(
        'Forecast demand for product ABC',
        { productId: 'abc123' },
        testUser._id
      );

      const duration = Date.now() - startTime;
      
      // Should complete within 5 seconds (adjust based on actual performance)
      expect(duration).toBeLessThan(5000);
    });

    it('should handle concurrent requests', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          AIOrchestratorService.orchestrate(
            `Forecast demand for product ${i}`,
            { productId: `prod${i}` },
            testUser._id
          )
        );
      }

      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed intent gracefully', async () => {
      const result = await AIOrchestratorService.orchestrate(
        '',
        {},
        testUser._id
      );

      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
    });

    it('should handle missing context gracefully', async () => {
      const result = await AIOrchestratorService.orchestrate(
        'Forecast demand',
        null,
        testUser._id
      );

      // Should not crash, should use defaults or return error
      expect(result).toBeDefined();
    });

    it('should handle invalid user ID gracefully', async () => {
      const result = await AIOrchestratorService.orchestrate(
        'Forecast demand',
        { productId: 'abc123' },
        'invalid-user-id'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('user');
    });
  });
});
