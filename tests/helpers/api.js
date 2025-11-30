/**
 * API Helper
 * Typed API clients for backend endpoints with tenant scoping
 */

const { expect } = require('@playwright/test');

const TENANT_ID = process.env.TENANT_ID || 'DIST-TEST';
const RUN_ID = process.env.RUN_ID || `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

/**
 * API Client for common operations
 */
class APIClient {
  constructor(context, auth) {
    this.context = context;
    this.auth = auth;
    this.runId = RUN_ID;
    this.tenantId = TENANT_ID;
  }

  /**
   * Make authenticated GET request
   */
  async get(endpoint, options = {}) {
    const response = await this.context.get(endpoint, options);
    return this._handleResponse(response);
  }

  /**
   * Make authenticated POST request
   */
  async post(endpoint, data, options = {}) {
    const response = await this.context.post(endpoint, {
      data,
      ...options
    });
    return this._handleResponse(response);
  }

  /**
   * Make authenticated PUT request
   */
  async put(endpoint, data, options = {}) {
    const response = await this.context.put(endpoint, {
      data,
      ...options
    });
    return this._handleResponse(response);
  }

  /**
   * Make authenticated DELETE request
   */
  async delete(endpoint, options = {}) {
    const response = await this.context.delete(endpoint, options);
    return this._handleResponse(response);
  }

  /**
   * Handle API response
   */
  async _handleResponse(response) {
    const body = await response.json().catch(() => ({}));
    
    const result = {
      status: response.status(),
      ok: response.ok(),
      body,
      data: body.data || body,
      error: body.error || body.message
    };

    if (process.env.DEBUG_TESTS && (!result.ok || !result.data)) {
      console.debug('[API]', response.url(), result.status, JSON.stringify(result.body).slice(0, 500));
    }

    return result;
  }

  /**
   * Get user identity (for createdBy fields)
   */
  async getIdentity() {
    return this.get('/api/auth/me');
  }


  async getCompanies() {
    return this.get('/api/companies');
  }

  async getCompany(id) {
    return this.get(`/api/companies/${id}`);
  }

  async getBudgets(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/api/budgets${query ? `?${query}` : ''}`);
  }

  async createBudget(data) {
    return this.post('/api/budgets', data);
  }

  async getPromotions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/api/promotions${query ? `?${query}` : ''}`);
  }

  async createPromotion(data) {
    return this.post('/api/promotions', data);
  }

  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/api/products${query ? `?${query}` : ''}`);
  }

  async createProduct(data) {
    return this.post('/api/products', data);
  }

  async getCustomers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/api/customers${query ? `?${query}` : ''}`);
  }

  async createCustomer(data) {
    return this.post('/api/customers', data);
  }

  async getTransactions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/api/transactions${query ? `?${query}` : ''}`);
  }

  async createTransaction(data) {
    return this.post('/api/transactions', data);
  }

  async getClaims(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/api/claims${query ? `?${query}` : ''}`);
  }

  async createClaim(data) {
    return this.post('/api/claims', data);
  }

  async getTradingTerms(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/api/trading-terms${query ? `?${query}` : ''}`);
  }

  async createTradingTerm(data) {
    return this.post('/api/trading-terms', data);
  }


  async getDashboardAnalytics(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/api/analytics/dashboard${query ? `?${query}` : ''}`);
  }

  async getSalesAnalytics(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/api/analytics/sales${query ? `?${query}` : ''}`);
  }

  async getPromotionAnalytics(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/api/analytics/promotions${query ? `?${query}` : ''}`);
  }

  async getBudgetAnalytics(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/api/analytics/budgets${query ? `?${query}` : ''}`);
  }


  async getAISuggestions(data) {
    return this.post('/api/ai-promotion/generate-suggestions', data);
  }

  async validateUplift(data) {
    return this.post('/api/ai-promotion/validate-uplift', data);
  }

  async predictSales(data) {
    return this.post('/api/predictive-analytics/predict-sales', data);
  }

  async predictPromotionROI(data) {
    return this.post('/api/predictive-analytics/predict-promotion-roi', data);
  }

  async predictBudgetNeeds(data) {
    return this.post('/api/predictive-analytics/predict-budget-needs', data);
  }

  async getMLModels() {
    return this.get('/api/ml/models');
  }

  async getMLInsights(modelId) {
    return this.get(`/api/ml/insights/${modelId}`);
  }


  async getKAMWallets(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/api/kamwallets${query ? `?${query}` : ''}`);
  }

  async createKAMWallet(data) {
    return this.post('/api/kamwallets', data);
  }

  async allocateWallet(walletId, data) {
    return this.post(`/api/kamwallets/${walletId}/allocate`, data);
  }
}

/**
 * Normalize response to extract single entity
 * Handles various response shapes: { product }, { data: { product } }, { data: product }, etc.
 */
function pickEntity(obj, keys = ['product', 'customer', 'budget', 'promotion', 'wallet', 'entity', 'item', 'doc', 'user']) {
  if (!obj) return undefined;
  
  if (obj._id || obj.id || obj.sku || obj.code || obj.name) {
    return obj;
  }
  
  for (const key of keys) {
    if (obj[key]) return obj[key];
  }
  
  if (obj.data) {
    return pickEntity(obj.data, keys);
  }
  
  return undefined;
}

/**
 * Normalize response to extract list of entities
 * Handles various response shapes: { products: [] }, { data: [] }, { data: { products: [] } }, etc.
 */
function pickList(obj, keys = ['products', 'customers', 'budgets', 'promotions', 'items', 'results', 'data']) {
  if (!obj) return [];
  
  if (Array.isArray(obj)) return obj;
  
  for (const key of keys) {
    if (Array.isArray(obj[key])) return obj[key];
  }
  
  if (obj.data) {
    return pickList(obj.data, keys);
  }
  
  return [];
}

/**
 * Assert API response is successful
 */
function assertSuccess(response, message = 'API request should succeed') {
  expect(response.ok, `${message}: ${response.error || 'Unknown error'}`).toBeTruthy();
  expect(response.status).toBeLessThan(400);
  
  if (response.body && response.body.success === false) {
    throw new Error(`${message}: API returned success: false - ${response.error || response.body.message || 'Unknown error'}`);
  }
}

/**
 * Assert API response has expected status
 */
function assertStatus(response, expectedStatus, message = '') {
  expect(response.status, message || `Expected status ${expectedStatus}`).toBe(expectedStatus);
}

/**
 * Assert API response is forbidden (403)
 */
function assertForbidden(response, message = 'Should be forbidden') {
  expect(response.status, message).toBe(403);
}

/**
 * Assert API response is unauthorized (401)
 */
function assertUnauthorized(response, message = 'Should be unauthorized') {
  expect(response.status, message).toBe(401);
}

module.exports = {
  APIClient,
  assertSuccess,
  assertStatus,
  assertForbidden,
  assertUnauthorized,
  pickEntity,
  pickList,
  TENANT_ID,
  RUN_ID
};
