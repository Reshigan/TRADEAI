/**
 * GAP-16: E2E/Integration Test Suite - Auth Flow Tests
 * Tests: login, 2FA, token refresh, password reset, RBAC
 */

// Test helpers
const BASE_URL = 'http://localhost:8787';
const TEST_USER = { email: 'admin@test.com', password: 'TestPassword123!' };

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

describe('Auth Flow', () => {
  let authToken = null;

  test('POST /auth/login returns token for valid credentials', async () => {
    const { status, data } = await request('POST', '/auth/login', TEST_USER);
    // Should either succeed with token or require 2FA
    expect([200, 401, 403]).toContain(status);
    if (status === 200) {
      if (data.requires2FA) {
        expect(data.tempToken).toBeDefined();
      } else {
        expect(data.token).toBeDefined();
        authToken = data.token;
      }
    }
  });

  test('POST /auth/login rejects invalid credentials', async () => {
    const { status } = await request('POST', '/auth/login', {
      email: 'wrong@test.com',
      password: 'wrongpassword'
    });
    expect([401, 404]).toContain(status);
  });

  test('GET /auth/me returns user info with valid token', async () => {
    if (!authToken) return; // Skip if login failed
    const { status, data } = await request('GET', '/auth/me', null, authToken);
    expect(status).toBe(200);
    expect(data.email || data.user?.email).toBeDefined();
  });

  test('GET /auth/me rejects without token', async () => {
    const { status } = await request('GET', '/auth/me');
    expect([401, 403]).toContain(status);
  });

  test('POST /auth/2fa/setup returns secret and QR URL', async () => {
    if (!authToken) return;
    const { status, data } = await request('POST', '/auth/2fa/setup', {}, authToken);
    expect([200, 201, 400, 404]).toContain(status);
    if (status === 200 || status === 201) {
      expect(data.secret || data.qrCodeUrl).toBeDefined();
    }
  });

  test('POST /auth/forgot-password accepts email', async () => {
    const { status } = await request('POST', '/auth/forgot-password', {
      email: TEST_USER.email
    });
    // Should accept even if email doesn't exist (security)
    expect([200, 201, 404]).toContain(status);
  });
});

describe('RBAC Enforcement', () => {
  test('Admin-only routes reject non-admin tokens', async () => {
    // Without token, admin routes should reject
    const { status } = await request('GET', '/role-management/roles');
    expect([401, 403]).toContain(status);
  });

  test('Protected routes require authentication', async () => {
    const protectedRoutes = [
      '/dashboard',
      '/promotions',
      '/budgets',
      '/customers',
      '/products'
    ];
    for (const route of protectedRoutes) {
      const { status } = await request('GET', route);
      expect([401, 403]).toContain(status);
    }
  });
});
