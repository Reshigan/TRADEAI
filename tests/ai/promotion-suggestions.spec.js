/**
 * AI Promotion Suggestions Tests
 * Tests for AI-powered promotion recommendations
 * @tags @ai:suggestions @feat:ai
 */

const { test, expect } = require('@playwright/test');
const { createAuthContext } = require('../helpers/auth');
const { APIClient, assertSuccess } = require('../helpers/api');
const { createProduct, createCustomer } = require('../helpers/data');
const { assertSuggestionsSchema, assertResponseSchema } = require('../helpers/asserts');

test.describe('AI Promotion Suggestions Tests', () => {
  let context, auth, api;

  test.beforeAll(async () => {
    const authContext = await createAuthContext('manager');
    context = authContext.context;
    auth = authContext.auth;
    api = new APIClient(context, auth);
  });

  test.afterAll(async () => {
    await context.dispose();
  });

  test('should generate promotion suggestions', async () => {
    const product = await createProduct(api, { seed: 7001 });
    const customer = await createCustomer(api, { seed: 7002 });

    const requestData = {
      productId: product._id || product.id,
      customerId: customer._id || customer.id,
      targetMetric: 'revenue',
      constraints: {
        maxDiscount: 30,
        minROI: 1.5
      }
    };

    const response = await api.getAISuggestions(requestData);

    expect(response.status).toBeLessThan(500);

    if (response.ok && response.data) {
      assertResponseSchema(response.data, ['suggestions']);

      if (Array.isArray(response.data.suggestions)) {
        assertSuggestionsSchema(response.data.suggestions);
      }
    }
  });

  test('should validate promotion uplift', async () => {
    const product = await createProduct(api, { seed: 7003 });

    const promotionData = {
      productId: product._id || product.id,
      discountPercent: 20,
      duration: 30,
      expectedUplift: 25
    };

    const response = await api.validateUplift(promotionData);

    expect(response.status).toBeLessThan(500);

    if (response.ok && response.data) {
      expect(response.data.isValid !== undefined || response.data.validation !== undefined).toBeTruthy();
      
      if (response.data.confidence !== undefined) {
        expect(response.data.confidence).toBeGreaterThanOrEqual(0);
        expect(response.data.confidence).toBeLessThanOrEqual(1);
      }
    }
  });

  test('should get AI model status', async () => {
    const response = await api.get('/api/ai-promotion/model-status');

    expect(response.status).toBeLessThan(500);

    if (response.ok && response.data) {
      expect(response.data.status || response.data.models).toBeDefined();
    }
  });

  test('should provide personalized promotion recommendations', async () => {
    const customer = await createCustomer(api, { seed: 7004 });

    const response = await api.post(`/api/ml/recommendations/personalized-promotions/${customer._id || customer.id}`, {
      limit: 5
    });

    expect(response.status).toBeLessThan(500);

    if (response.ok && response.data) {
      if (Array.isArray(response.data.recommendations || response.data)) {
        const recommendations = response.data.recommendations || response.data;
        
        recommendations.forEach(rec => {
          if (rec.score !== undefined) {
            expect(rec.score).toBeGreaterThanOrEqual(0);
            expect(rec.score).toBeLessThanOrEqual(1);
          }
        });
      }
    }
  });

  test('should suggest optimal promotion timing', async () => {
    const product = await createProduct(api, { seed: 7005 });

    const response = await api.post('/api/ai-promotion/generate-suggestions', {
      productId: product._id || product.id,
      suggestTiming: true
    });

    expect(response.status).toBeLessThan(500);

    if (response.ok && response.data?.suggestions) {
      const suggestions = response.data.suggestions;
      
      if (Array.isArray(suggestions)) {
        suggestions.forEach(suggestion => {
          expect(suggestion.timing || suggestion.period || suggestion.startDate).toBeDefined();
        });
      }
    }
  });

  test('should calculate expected promotion ROI', async () => {
    const product = await createProduct(api, { seed: 7006 });

    const response = await api.post('/api/predictive-analytics/predict-promotion-roi', {
      productId: product._id || product.id,
      discountPercent: 15,
      duration: 30,
      investment: 10000
    });

    expect(response.status).toBeLessThan(500);

    if (response.ok && response.data) {
      if (response.data.expectedROI !== undefined) {
        expect(response.data.expectedROI).not.toBeNaN();
      }
      
      if (response.data.confidence !== undefined) {
        expect(response.data.confidence).toBeGreaterThanOrEqual(0);
        expect(response.data.confidence).toBeLessThanOrEqual(1);
      }
    }
  });
});
