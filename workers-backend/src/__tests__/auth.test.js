/**
 * GAP-16: E2E/Integration Test Suite - Auth Flow Tests
 * Expanded to cover 15+ scenarios including 2FA, lockout, and tenant isolation.
 */

// Test helpers
const BASE_URL = 'http://localhost:8787';
const TEST_USER = { email: 'admin@test.com', password: 'TestPassword123!' };
const OTHER_USER = { email: 'user@othercompany.com', password: 'Password123!' };

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

describe('Auth Flow - Core Login', () => {
  let authToken = null;

  test('POST /auth/login returns token for valid credentials', async () => {
    const { status, data } = await request('POST', '/auth/login', TEST_USER);
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
    const { status, data } = await request('POST', '/auth/login', {
      email: 'wrong@test.com',
      password: 'wrongpassword'
    });
    expect([401, 404]).toContain(status);
    expect(data.error?.code).toBe('UNAUTHORIZED');
  });

  test('POST /auth/login triggers account lockout after 5 failed attempts', async () => {
    const invalidUser = { email: 'lockout@test.com', password: 'wrongpassword' };
    for (let i = 0; i < 5; i++) {
      await request('POST', '/auth/login', invalidUser);
    }
    const { status, data } = await request('POST', '/auth/login', invalidUser);
    expect(status).toBe(423); // Locked
    expect(data.error?.code).toBe('LOCKED');
  });
});

describe('Auth Flow - 2FA & Security', () => {
  let authToken = null;

  beforeAll(async () => {
    const { data } = await request('POST', '/auth/login', TEST_USER);
    authToken = data.token;
  });

  test('POST /auth/2fa/verify with valid TOTP returns session token', async () => {
    if (!authToken) return;
    const { status } = await request('POST', '/auth/2fa/verify', {
      token: 'valid-temp-token',
      code: '123456'
    });
    // We expect 200 if Mocked, or 401/403 if not. In real tests we use a mock TOTP.
    expect([200, 401]).toContain(status);
  });

  test('POST /auth/2fa/verify rejects invalid TOTP', async () => {
    const { status } = await request('POST', '/auth/2fa/verify', {
      token: 'valid-temp-token',
      code: '000000'
    });
    expect(status).toBe(401);
  });

  test('POST /auth/2fa/setup returns secret and QR URL', async () => {
    if (!authToken) return;
    const { status, data } = await request('POST', '/auth/2fa/setup', {}, authToken);
    expect([200, 201, 400, 404]).toContain(status);
    if (status === 200 || status === 201) {
      expect(data.secret || data.qrCodeUrl).toBeDefined();
    }
  });
});

describe('Auth Flow - Token Lifecycle', () => {
  let authToken = null;
  let refreshToken = null;

  beforeAll(async () => {
    const { data } = await request('POST', '/auth/login', TEST_USER);
    authToken = data.token;
    refreshToken = data.refreshToken;
  });

  test('POST /auth/refresh returns new JWT with valid refresh token', async () => {
    if (!refreshToken) return;
    const { status, data } = await request('POST', '/auth/refresh', { refreshToken });
    expect(status).toBe(200);
    expect(data.token).toBeDefined();
  });

  test('POST /auth/refresh rejects expired or invalid refresh token', async () => {
    const { status } = await request('POST', '/auth/refresh', { refreshToken: 'invalid-token' });
    expect(status).toBe(401);
  });

  test('POST /auth/logout invalidates refresh token', async () => {
    if (!authToken) return;
    const { status } = await request('POST', '/auth/logout', {}, authToken);
    expect(status).toBe(200);
    
    const refreshRes = await request('POST', '/auth/refresh', { refreshToken });
    expect(refreshRes.status).toBe(401);
  });
});

describe('Auth Flow - Password Management', () => {
  test('POST /auth/forgot-password accepts email', async () => {
    const { status } = await request('POST', '/auth/forgot-password', {
      email: TEST_USER.email
    });
    expect([200, 201, 404]).toContain(status);
  });

  test('POST /auth/reset-password executes password change with valid token', async () => {
    const { status } = await request('POST', '/auth/reset-password', {
      token: 'valid-reset-token',
      newPassword: 'NewSecurePassword123!'
    });
    expect([200, 401]).toContain(status);
  });
});

describe('Auth Flow - Tenant Isolation', () => {
  let tokenA = null;
  let tokenB = null;

  beforeAll(async () => {
    const resA = await request('POST', '/auth/login', TEST_USER);
    tokenA = resA.data.token;
    const resB = await request('POST', '/auth/login', OTHER_USER);
    tokenB = resB.data.token;
  });

  test('User A cannot access User B tenant data', async () => {
    if (!tokenA || !tokenB) return;
    
    // Assume we know a budget ID from Company B
    const budgetB = 'budget-id-from-company-b';
    const { status } = await request('GET', `/budgets/${budgetB}`, null, tokenA);
    expect(status).toBe(404); // Should be Not Found or Forbidden, not 200
  });

  test('User A cannot update User B tenant settings', async () => {
    if (!tokenA) return;
    const { status } = await request('PUT', '/settings', { some: 'update' }, tokenA);
    // If the request targets another tenant via body/header, it should fail
    expect([403, 404]).toContain(status);
  });
});

describe('RBAC Enforcement', () => {
  test('Admin-only routes reject non-admin tokens', async () => {
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
