/**
 * KAM (Key Account Manager) Role Tests
 * Tests for KAM user permissions (customer management, wallet management, promotions)
 * @tags @role:kam
 */

const { test, expect } = require('@playwright/test');
const { createAuthContext } = require('../helpers/auth');
const { APIClient, assertSuccess } = require('../helpers/api');
const { createCustomer, createPromotion } = require('../helpers/data');

test.describe('KAM Role Tests', () => {
  let context, auth, api;

  test.beforeAll(async () => {
    const authContext = await createAuthContext('kam');
    context = authContext.context;
    auth = authContext.auth;
    api = new APIClient(context, auth);
  });

  test.afterAll(async () => {
    await context.dispose();
  });

  test('should authenticate successfully as KAM', async () => {
    expect(auth.token).toBeDefined();
    expect(auth.user).toBeDefined();
    expect(auth.role).toBe('kam');
  });

  test('should manage customers', async () => {
    const customer = await createCustomer(api, { seed: 3001 });
    expect(customer).toBeDefined();
    expect(customer.code).toBeDefined();
  });

  test('should read customers', async () => {
    const response = await api.getCustomers();
    assertSuccess(response, 'KAM should read customers');
  });

  test('should create promotions for customers', async () => {
    const promotion = await createPromotion(api, { seed: 3002 });
    expect(promotion).toBeDefined();
    expect(promotion.name).toBeDefined();
  });

  test('should read promotions', async () => {
    const response = await api.getPromotions();
    assertSuccess(response, 'KAM should read promotions');
  });

  test('should access KAM wallet endpoints', async () => {
    const response = await api.getKAMWallets();
    expect(response.status).toBeLessThan(500);
  });

  test('should read products', async () => {
    const response = await api.getProducts();
    assertSuccess(response, 'KAM should read products');
  });

  test('should access customer analytics', async () => {
    const response = await api.get('/api/analytics/customers');
    assertSuccess(response, 'KAM should access customer analytics');
  });

  test('should access trading terms', async () => {
    const response = await api.getTradingTerms();
    expect(response.status).toBeLessThan(500);
  });
});
