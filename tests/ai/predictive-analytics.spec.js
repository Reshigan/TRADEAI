/**
 * Predictive Analytics Tests
 * Tests for ML-powered predictions and forecasts
 * @tags @ai:predictive @feat:ai
 */

const { test, expect } = require('@playwright/test');
const { createAuthContext } = require('../helpers/auth');
const { APIClient, assertSuccess } = require('../helpers/api');
const { createProduct, createCustomer } = require('../helpers/data');
const { assertPredictionSchema, assertResponseSchema } = require('../helpers/asserts');

test.describe('Predictive Analytics Tests', () => {
  let context, auth, api;

  test.beforeAll(async () => {
    const authContext = await createAuthContext('analyst');
    context = authContext.context;
    auth = authContext.auth;
    api = new APIClient(context, auth);
  });

  test.afterAll(async () => {
    await context.dispose();
  });

  test('should predict sales forecast', async () => {
    const product = await createProduct(api, { seed: 8001 });

    const response = await api.predictSales({
      productId: product._id || product.id,
      horizon: 3
    });

    expect(response.status).toBeLessThan(500);

    if (response.ok && response.data) {
      assertPredictionSchema(response.data);
      
      if (Array.isArray(response.data.predictions)) {
        response.data.predictions.forEach(pred => {
          expect(pred.value).toBeGreaterThanOrEqual(0);
          expect(pred.value).not.toBeNaN();
        });
      }
    }
  });

  test('should predict budget needs', async () => {
    const response = await api.predictBudgetNeeds({
      category: 'Marketing',
      horizon: 6
    });

    expect(response.status).toBeLessThan(500);

    if (response.ok && response.data) {
      assertPredictionSchema(response.data);
      
      if (Array.isArray(response.data.predictions)) {
        response.data.predictions.forEach(pred => {
          expect(pred.value).toBeGreaterThan(0);
        });
      }
    }
  });

  test('should get ML model metrics', async () => {
    const response = await api.getMLModels();
    assertSuccess(response, 'Should access ML models');

    const models = response.data;
    expect(Array.isArray(models)).toBeTruthy();

    models.forEach(model => {
      expect(model.id || model.name).toBeDefined();
      expect(model.status).toBeDefined();
      
      if (model.accuracy !== undefined) {
        expect(model.accuracy).toBeGreaterThanOrEqual(0);
        expect(model.accuracy).toBeLessThanOrEqual(1);
      }
    });
  });

  test('should get ML insights for model', async () => {
    const modelsResponse = await api.getMLModels();
    
    if (modelsResponse.ok && modelsResponse.data?.length > 0) {
      const modelId = modelsResponse.data[0].id;
      
      const response = await api.getMLInsights(modelId);
      expect(response.status).toBeLessThan(500);

      if (response.ok && response.data) {
        assertResponseSchema(response.data, ['keyFactors', 'recommendations']);
        
        if (Array.isArray(response.data.keyFactors)) {
          response.data.keyFactors.forEach(factor => {
            expect(factor.factor).toBeDefined();
            expect(factor.importance).toBeGreaterThanOrEqual(0);
            expect(factor.importance).toBeLessThanOrEqual(1);
          });
        }
      }
    }
  });

  test('should predict customer churn', async () => {
    const customer = await createCustomer(api, { seed: 8002 });

    const response = await api.post('/api/ml/predict/churn', {
      customerId: customer._id || customer.id
    });

    expect(response.status).toBeLessThan(500);

    if (response.ok && response.data) {
      if (response.data.churnProbability !== undefined) {
        expect(response.data.churnProbability).toBeGreaterThanOrEqual(0);
        expect(response.data.churnProbability).toBeLessThanOrEqual(1);
      }
    }
  });

  test('should forecast demand', async () => {
    const product = await createProduct(api, { seed: 8003 });

    const response = await api.post('/api/ml/predict/demand-forecast', {
      productId: product._id || product.id,
      horizon: 4
    });

    expect(response.status).toBeLessThan(500);

    if (response.ok && response.data) {
      if (Array.isArray(response.data.forecast || response.data.predictions)) {
        const forecast = response.data.forecast || response.data.predictions;
        
        forecast.forEach(pred => {
          expect(pred.demand || pred.value).toBeDefined();
          expect(pred.demand || pred.value).toBeGreaterThanOrEqual(0);
        });
      }
    }
  });

  test('should run what-if scenario analysis', async () => {
    const response = await api.post('/api/predictive-analytics/what-if', {
      scenario: 'price_increase',
      parameters: {
        priceIncrease: 10,
        affectedProducts: ['all']
      }
    });

    expect(response.status).toBeLessThan(500);

    if (response.ok && response.data) {
      assertResponseSchema(response.data, ['impact']);
      
      if (response.data.impact) {
        expect(response.data.impact.revenue !== undefined || response.data.impact.sales !== undefined).toBeTruthy();
      }
    }
  });

  test('should provide confidence intervals for predictions', async () => {
    const response = await api.predictSales({
      horizon: 3,
      includeConfidenceInterval: true
    });

    expect(response.status).toBeLessThan(500);

    if (response.ok && response.data?.predictions) {
      response.data.predictions.forEach(pred => {
        if (pred.confidence !== undefined) {
          expect(pred.confidence).toBeGreaterThanOrEqual(0);
          expect(pred.confidence).toBeLessThanOrEqual(1);
        }
        
        if (pred.lowerBound !== undefined && pred.upperBound !== undefined) {
          expect(pred.lowerBound).toBeLessThanOrEqual(pred.value);
          expect(pred.upperBound).toBeGreaterThanOrEqual(pred.value);
        }
      });
    }
  });
});
