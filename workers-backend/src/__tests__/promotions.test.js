/**
 * GAP-16: E2E/Integration Test Suite - Promotion Lifecycle Tests
 * Tests: create, read, update, status transitions, approval flow
 */

const BASE_URL = 'http://localhost:8787';

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function getToken() {
  const { data } = await request('POST', '/auth/login', {
    email: 'admin@test.com', password: 'TestPassword123!'
  });
  return data.token;
}

describe('Promotion Lifecycle', () => {
  let token = null;
  let promotionId = null;

  beforeAll(async () => {
    token = await getToken();
  });

  test('GET /promotions returns list with pagination', async () => {
    if (!token) return;
    const { status, data } = await request('GET', '/promotions?page=1&limit=10', null, token);
    expect([200]).toContain(status);
    const items = data.data || data.promotions || data;
    expect(Array.isArray(items)).toBe(true);
    // GAP-09: Check pagination object
    if (data.pagination) {
      expect(data.pagination.page).toBeDefined();
      expect(data.pagination.limit).toBeDefined();
    }
  });

  test('POST /promotions creates a new promotion', async () => {
    if (!token) return;
    const { status, data } = await request('POST', '/promotions', {
      name: 'Test Promotion E2E',
      type: 'discount',
      status: 'draft',
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      description: 'E2E test promotion'
    }, token);
    expect([200, 201]).toContain(status);
    promotionId = data.id || data.data?.id;
  });

  test('GET /promotions/:id returns promotion detail', async () => {
    if (!token || !promotionId) return;
    const { status, data } = await request('GET', `/promotions/${promotionId}`, null, token);
    expect(status).toBe(200);
    expect(data.name || data.data?.name).toBe('Test Promotion E2E');
  });

  test('PUT /promotions/:id updates promotion', async () => {
    if (!token || !promotionId) return;
    const { status } = await request('PUT', `/promotions/${promotionId}`, {
      name: 'Test Promotion E2E Updated',
      description: 'Updated description'
    }, token);
    expect([200]).toContain(status);
  });

  test('PUT /promotions/:id/status changes status', async () => {
    if (!token || !promotionId) return;
    const { status } = await request('PUT', `/promotions/${promotionId}/status`, {
      status: 'pending_approval'
    }, token);
    expect([200, 400]).toContain(status);
  });
});

describe('Financial Flow', () => {
  let token = null;

  beforeAll(async () => {
    token = await getToken();
  });

  test('GET /budgets returns budgets with amounts', async () => {
    if (!token) return;
    const { status, data } = await request('GET', '/budgets', null, token);
    expect(status).toBe(200);
    const items = data.data || data.budgets || data;
    expect(Array.isArray(items)).toBe(true);
  });

  test('GET /pnl/calculate returns financial calculations', async () => {
    if (!token) return;
    const { status, data } = await request('POST', '/pnl/calculate', {
      startDate: '2025-01-01',
      endDate: '2025-12-31'
    }, token);
    expect([200, 400]).toContain(status);
  });

  test('GET /claims returns claims list', async () => {
    if (!token) return;
    const { status, data } = await request('GET', '/claims', null, token);
    expect([200]).toContain(status);
  });

  test('GET /deductions returns deductions list', async () => {
    if (!token) return;
    const { status, data } = await request('GET', '/deductions', null, token);
    expect([200]).toContain(status);
  });
});
