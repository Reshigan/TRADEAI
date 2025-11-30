/**
 * Promotion Workflow Tests
 * Tests the complete promotion planning and execution workflow
 * @tags @workflow:promotion
 */

const { test, expect } = require('@playwright/test');
const { createAuthContext } = require('../helpers/auth');
const { APIClient, assertSuccess } = require('../helpers/api');
const { createPromotion, createProduct, createCustomer, createBudget } = require('../helpers/data');
const { assertValidDateRange, assertNoNegativeValues, assertPromotionBudgetConstraints } = require('../helpers/asserts');

test.describe('Promotion Workflow Tests', () => {
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

  test('should create promotion with valid date range', async () => {
    const now = new Date();
    const startDate = now;
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const promotion = await createPromotion(api, {
      seed: 5001,
      name: 'Summer Sale 2025',
      type: 'Price Discount',
      startDate,
      endDate
    });

    expect(promotion).toBeDefined();
    expect(promotion.name).toBe('Summer Sale 2025');
    expect(promotion.type).toBe('Price Discount');

    assertValidDateRange(promotion.startDate, promotion.endDate, 'Promotion date range');
  });

  test('should link products to promotion', async () => {
    const product1 = await createProduct(api, { seed: 5002 });
    const product2 = await createProduct(api, { seed: 5003 });

    const promotion = await createPromotion(api, {
      seed: 5004,
      products: [product1._id || product1.id, product2._id || product2.id]
    });

    expect(promotion.products).toBeDefined();
    if (Array.isArray(promotion.products)) {
      expect(promotion.products.length).toBeGreaterThan(0);
    }
  });

  test('should link customers to promotion', async () => {
    const customer1 = await createCustomer(api, { seed: 5005 });
    const customer2 = await createCustomer(api, { seed: 5006 });

    const promotion = await createPromotion(api, {
      seed: 5007,
      customers: [customer1._id || customer1.id, customer2._id || customer2.id]
    });

    expect(promotion.customers).toBeDefined();
    if (Array.isArray(promotion.customers)) {
      expect(promotion.customers.length).toBeGreaterThan(0);
    }
  });

  test('should associate promotion with budget', async () => {
    const budget = await createBudget(api, {
      seed: 5008,
      totalBudget: 200000
    });

    const promotion = await createPromotion(api, {
      seed: 5009,
      allocated: 50000
    });

    expect(promotion.budget).toBeDefined();
    expect(promotion.budget.allocated).toBe(50000);

    assertPromotionBudgetConstraints(promotion, budget);
  });

  test('should support different promotion types', async () => {
    const types = ['Price Discount', 'Volume Discount', 'BOGO', 'Bundle'];

    for (const type of types) {
      const promotion = await createPromotion(api, {
        seed: 5010 + types.indexOf(type),
        type
      });

      expect(promotion.type).toBe(type);
    }
  });

  test('should track promotion spend', async () => {
    const promotion = await createPromotion(api, {
      seed: 5014,
      allocated: 30000,
      spent: 15000
    });

    expect(promotion.budget.allocated).toBe(30000);
    expect(promotion.budget.spent).toBe(15000);

    assertNoNegativeValues(promotion.budget, ['allocated', 'spent']);

    expect(promotion.budget.spent).toBeLessThanOrEqual(promotion.budget.allocated);
  });

  test('should calculate promotion ROI', async () => {
    const promotion = await createPromotion(api, {
      seed: 5015,
      allocated: 20000
    });

    if (promotion._id || promotion.id) {
      const response = await api.get(`/api/analytics/roi/${promotion._id || promotion.id}`);
      
      expect(response.status).toBeLessThan(500);
    }
  });

  test('should get promotion analytics', async () => {
    const response = await api.getPromotionAnalytics();
    assertSuccess(response, 'Should access promotion analytics');

    const analytics = response.data;
    expect(analytics).toBeDefined();

    if (analytics.totalPromotions !== undefined) {
      expect(analytics.totalPromotions).toBeGreaterThanOrEqual(0);
    }
    if (analytics.activePromotions !== undefined) {
      expect(analytics.activePromotions).toBeGreaterThanOrEqual(0);
    }
    if (analytics.avgROI !== undefined) {
      expect(analytics.avgROI).not.toBeNaN();
    }
  });

  test('should support promotion status lifecycle', async () => {
    const statuses = ['draft', 'active', 'completed', 'cancelled'];

    for (const status of statuses) {
      const promotion = await createPromotion(api, {
        seed: 5016 + statuses.indexOf(status),
        status
      });

      expect(promotion.status).toBe(status);
    }
  });
});
