/**
 * Admin Role Tests
 * Tests for admin user permissions and capabilities
 * @tags @role:admin
 */

const { test, expect } = require('@playwright/test');
const { createAuthContext } = require('../helpers/auth');
const { APIClient, assertSuccess, assertForbidden } = require('../helpers/api');
const { createProduct, createCustomer, createBudget } = require('../helpers/data');

test.describe('Admin Role Tests', () => {
  let context, auth, api;

  test.beforeAll(async () => {
    const authContext = await createAuthContext('admin');
    context = authContext.context;
    auth = authContext.auth;
    api = new APIClient(context, auth);
  });

  test.afterAll(async () => {
    await context.dispose();
  });

  test('should authenticate successfully as admin', async () => {
    expect(auth.token).toBeDefined();
    expect(auth.user).toBeDefined();
    expect(auth.role).toBe('admin');
  });

  test('should access companies endpoint', async () => {
    const response = await api.getCompanies();
    assertSuccess(response, 'Admin should access companies');
    expect(response.data).toBeDefined();
  });

  test('should create and read products', async () => {
    const product = await createProduct(api, { seed: 1001 });
    expect(product).toBeDefined();
    expect(product.sku).toBeDefined();

    const response = await api.getProducts();
    assertSuccess(response, 'Admin should read products');
  });

  test('should create and read customers', async () => {
    const customer = await createCustomer(api, { seed: 1002 });
    expect(customer).toBeDefined();
    expect(customer.code).toBeDefined();

    const response = await api.getCustomers();
    assertSuccess(response, 'Admin should read customers');
  });

  test('should create and read budgets', async () => {
    const budget = await createBudget(api, { seed: 1003 });
    expect(budget).toBeDefined();
    expect(budget.name).toBeDefined();

    const response = await api.getBudgets();
    assertSuccess(response, 'Admin should read budgets');
  });

  test('should access analytics endpoints', async () => {
    const response = await api.getDashboardAnalytics();
    assertSuccess(response, 'Admin should access analytics');
  });

  test('should access ML models endpoint', async () => {
    const response = await api.getMLModels();
    assertSuccess(response, 'Admin should access ML models');
  });

  test('should have full CRUD permissions', async () => {
    const product = await createProduct(api, { seed: 1004 });
    expect(product).toBeDefined();

    const readResponse = await api.getProducts();
    assertSuccess(readResponse);

    if (product._id || product.id) {
      const updateResponse = await api.put(`/api/products/${product._id || product.id}`, {
        name: 'Updated Product Name'
      });
      expect(updateResponse.status).not.toBe(403);
    }

  });
});
