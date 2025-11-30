/**
 * Manager Role Tests
 * Tests for manager user permissions (budget planning, promotion approval, analytics)
 * @tags @role:manager
 */

const { test, expect } = require('@playwright/test');
const { createAuthContext } = require('../helpers/auth');
const { APIClient, assertSuccess } = require('../helpers/api');
const { createBudget, createPromotion } = require('../helpers/data');

test.describe('Manager Role Tests', () => {
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

  test('should authenticate successfully as manager', async () => {
    expect(auth.token).toBeDefined();
    expect(auth.user).toBeDefined();
    expect(auth.role).toBe('manager');
  });

  test('should create budgets', async () => {
    const budget = await createBudget(api, { seed: 2001 });
    expect(budget).toBeDefined();
    expect(budget.name).toBeDefined();
    expect(budget.totalBudget).toBeGreaterThan(0);
  });

  test('should read budgets', async () => {
    const response = await api.getBudgets();
    assertSuccess(response, 'Manager should read budgets');
  });

  test('should create promotions', async () => {
    const promotion = await createPromotion(api, { seed: 2002 });
    expect(promotion).toBeDefined();
    expect(promotion.name).toBeDefined();
  });

  test('should read promotions', async () => {
    const response = await api.getPromotions();
    assertSuccess(response, 'Manager should read promotions');
  });

  test('should access analytics', async () => {
    const response = await api.getDashboardAnalytics();
    assertSuccess(response, 'Manager should access analytics');
  });

  test('should access budget analytics', async () => {
    const response = await api.getBudgetAnalytics();
    assertSuccess(response, 'Manager should access budget analytics');
  });

  test('should access promotion analytics', async () => {
    const response = await api.getPromotionAnalytics();
    assertSuccess(response, 'Manager should access promotion analytics');
  });

  test('should read products', async () => {
    const response = await api.getProducts();
    assertSuccess(response, 'Manager should read products');
  });

  test('should read customers', async () => {
    const response = await api.getCustomers();
    assertSuccess(response, 'Manager should read customers');
  });

  test('should access approval workflows', async () => {
    const response = await api.get('/api/approvals');
    expect(response.status).toBeLessThan(500);
  });
});
