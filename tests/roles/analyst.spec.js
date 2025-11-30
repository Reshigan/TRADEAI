/**
 * Analyst Role Tests
 * Tests for analyst user permissions (read-only analytics and reports)
 * @tags @role:analyst
 */

const { test, expect } = require('@playwright/test');
const { createAuthContext } = require('../helpers/auth');
const { APIClient, assertSuccess, assertForbidden } = require('../helpers/api');

test.describe('Analyst Role Tests', () => {
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

  test('should authenticate successfully as analyst', async () => {
    expect(auth.token).toBeDefined();
    expect(auth.user).toBeDefined();
    expect(auth.role).toBe('analyst');
  });

  test('should read analytics dashboards', async () => {
    const response = await api.getDashboardAnalytics();
    assertSuccess(response, 'Analyst should access analytics');
  });

  test('should read sales analytics', async () => {
    const response = await api.getSalesAnalytics();
    assertSuccess(response, 'Analyst should access sales analytics');
  });

  test('should read promotion analytics', async () => {
    const response = await api.getPromotionAnalytics();
    assertSuccess(response, 'Analyst should access promotion analytics');
  });

  test('should read budget analytics', async () => {
    const response = await api.getBudgetAnalytics();
    assertSuccess(response, 'Analyst should access budget analytics');
  });

  test('should read products (read-only)', async () => {
    const response = await api.getProducts();
    assertSuccess(response, 'Analyst should read products');
  });

  test('should read customers (read-only)', async () => {
    const response = await api.getCustomers();
    assertSuccess(response, 'Analyst should read customers');
  });

  test('should NOT create products', async () => {
    const response = await api.createProduct({
      sku: 'TEST-ANALYST-001',
      name: 'Test Product',
      category: 'Test'
    });
    
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  test('should NOT create budgets', async () => {
    const response = await api.createBudget({
      name: 'Test Budget',
      totalBudget: 100000
    });
    
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  test('should NOT create promotions', async () => {
    const response = await api.createPromotion({
      name: 'Test Promotion',
      type: 'Price Discount'
    });
    
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  test('should access ML insights (read-only)', async () => {
    const response = await api.getMLModels();
    assertSuccess(response, 'Analyst should access ML models');
  });
});
