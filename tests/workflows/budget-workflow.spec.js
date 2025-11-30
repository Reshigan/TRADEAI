/**
 * Budget Workflow Tests
 * Tests the complete budget planning workflow
 * @tags @workflow:budget
 */

const { test, expect } = require('@playwright/test');
const { createAuthContext } = require('../helpers/auth');
const { APIClient, assertSuccess } = require('../helpers/api');
const { createBudget, createPromotion } = require('../helpers/data');
const { assertBudgetUtilization, assertNoNegativeValues, assertValidDateRange } = require('../helpers/asserts');

test.describe('Budget Workflow Tests', () => {
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

  test('should create annual budget', async () => {
    const budget = await createBudget(api, {
      seed: 4001,
      name: 'Annual Marketing Budget 2025',
      totalBudget: 500000,
      category: 'Marketing'
    });

    expect(budget).toBeDefined();
    expect(budget.name).toBe('Annual Marketing Budget 2025');
    expect(budget.totalBudget).toBe(500000);
    expect(budget.status).toBe('active');

    assertValidDateRange(budget.startDate, budget.endDate, 'Budget date range');

    assertNoNegativeValues(budget, ['totalBudget', 'allocated', 'spent', 'remaining']);
  });

  test('should allocate budget to promotions', async () => {
    const budget = await createBudget(api, {
      seed: 4002,
      totalBudget: 200000
    });

    const promotion = await createPromotion(api, {
      seed: 4003,
      allocated: 50000
    });

    expect(promotion.budget.allocated).toBe(50000);

    const budgetsResponse = await api.getBudgets();
    const promotionsResponse = await api.getPromotions();

    if (budgetsResponse.ok && promotionsResponse.ok) {
      const budgets = budgetsResponse.data.budgets || [budget];
      const promotions = promotionsResponse.data.promotions || [promotion];

      const utilization = assertBudgetUtilization(budgets, promotions);
      expect(utilization).toBeGreaterThanOrEqual(0);
      expect(utilization).toBeLessThanOrEqual(1);
    }
  });

  test('should track budget utilization', async () => {
    const budget = await createBudget(api, {
      seed: 4004,
      totalBudget: 100000,
      allocated: 30000,
      spent: 20000
    });

    expect(budget.totalBudget).toBe(100000);
    expect(budget.allocated).toBe(30000);
    expect(budget.spent).toBe(20000);

    const expectedRemaining = budget.totalBudget - budget.spent;
    expect(budget.remaining).toBeCloseTo(expectedRemaining, 2);

    const utilization = (budget.allocated / budget.totalBudget) * 100;
    expect(utilization).toBe(30);
  });

  test('should prevent over-allocation', async () => {
    const budget = await createBudget(api, {
      seed: 4005,
      totalBudget: 50000
    });

    const promotion = await createPromotion(api, {
      seed: 4006,
      allocated: 60000  // More than budget
    });

    if (promotion.budget) {
      expect(promotion.budget.allocated).toBeLessThanOrEqual(budget.totalBudget);
    }
  });

  test('should calculate budget analytics correctly', async () => {
    const response = await api.getBudgetAnalytics();
    assertSuccess(response, 'Should access budget analytics');

    const analytics = response.data;
    expect(analytics).toBeDefined();

    if (analytics.totalBudget !== undefined) {
      expect(analytics.totalBudget).toBeGreaterThanOrEqual(0);
    }
    if (analytics.allocated !== undefined) {
      expect(analytics.allocated).toBeGreaterThanOrEqual(0);
    }
    if (analytics.spent !== undefined) {
      expect(analytics.spent).toBeGreaterThanOrEqual(0);
    }
    if (analytics.utilizationRate !== undefined) {
      expect(analytics.utilizationRate).toBeGreaterThanOrEqual(0);
      expect(analytics.utilizationRate).toBeLessThanOrEqual(100);
    }
  });

  test('should support multiple budget categories', async () => {
    const categories = ['Marketing', 'Promotions', 'Trade Spend', 'Advertising'];
    
    for (const category of categories) {
      const budget = await createBudget(api, {
        seed: 4007 + categories.indexOf(category),
        category,
        totalBudget: 100000
      });

      expect(budget.category).toBe(category);
    }
  });
});
