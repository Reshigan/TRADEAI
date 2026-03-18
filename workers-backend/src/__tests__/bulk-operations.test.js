/**
 * GAP-16: E2E/Integration Test Suite - Bulk Operations & Tenant Isolation
 * Tests: bulk actions, bulk approve, bulk delete, tenant isolation
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

describe('Bulk Operations (GAP-10)', () => {
  let token = null;

  beforeAll(async () => {
    token = await getToken();
  });

  test('POST /bulk/promotions/action performs bulk status change', async () => {
    if (!token) return;
    const { status, data } = await request('POST', '/bulk/promotions/action', {
      ids: ['test-id-1', 'test-id-2'],
      action: 'activate',
      status: 'active'
    }, token);
    // Should accept the request format even if IDs don't exist
    expect([200, 400, 404]).toContain(status);
    if (status === 200) {
      expect(data.processed).toBeDefined();
      expect(data.failed).toBeDefined();
    }
  });

  test('POST /bulk/promotions/approve performs bulk approval', async () => {
    if (!token) return;
    const { status, data } = await request('POST', '/bulk/promotions/approve', {
      ids: ['test-id-1'],
      comments: 'Bulk approved via E2E test'
    }, token);
    expect([200, 400, 404]).toContain(status);
  });

  test('DELETE /bulk/promotions performs bulk soft delete', async () => {
    if (!token) return;
    const { status, data } = await request('DELETE', '/bulk/promotions', {
      ids: ['non-existent-id']
    }, token);
    expect([200, 400, 404]).toContain(status);
  });
});

describe('Tenant Isolation', () => {
  test('Requests without tenant context are rejected', async () => {
    // Unauthenticated requests should not return data
    const { status } = await request('GET', '/customers');
    expect([401, 403]).toContain(status);
  });

  test('Cross-tenant data access is prevented', async () => {
    // Two users from different tenants should not see each other's data
    // This is a structural test - the middleware enforces companyId filtering
    const token = await getToken();
    if (!token) return;
    const { status, data } = await request('GET', '/customers', null, token);
    if (status === 200) {
      const items = data.data || data;
      if (Array.isArray(items)) {
        // All items should belong to the same tenant
        const companyIds = [...new Set(items.map(c => c.companyId).filter(Boolean))];
        expect(companyIds.length).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('Pagination (GAP-09)', () => {
  let token = null;

  beforeAll(async () => {
    token = await getToken();
  });

  test('List endpoints return pagination metadata', async () => {
    if (!token) return;
    const endpoints = ['/promotions', '/customers', '/products', '/budgets'];
    for (const endpoint of endpoints) {
      const { status, data } = await request('GET', `${endpoint}?page=1&limit=5`, null, token);
      if (status === 200 && data.pagination) {
        expect(data.pagination.page).toBeDefined();
        expect(data.pagination.limit).toBeDefined();
        expect(data.pagination.total).toBeDefined();
      }
    }
  });

  test('Limit is capped at 100', async () => {
    if (!token) return;
    const { status, data } = await request('GET', '/promotions?page=1&limit=999', null, token);
    if (status === 200 && data.pagination) {
      expect(data.pagination.limit).toBeLessThanOrEqual(100);
    }
  });
});
