/**
 * Authentication Helper
 * Provides login utilities and storage states for different user roles
 */

const { request } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://tradeai.gonxt.tech';

const TEST_USERS = {
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@testdistributor.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
    role: 'admin'
  },
  manager: {
    email: process.env.MANAGER_EMAIL || 'manager@testdistributor.com',
    password: process.env.MANAGER_PASSWORD || 'Manager@123',
    role: 'manager'
  },
  kam: {
    email: process.env.KAM_EMAIL || 'kam@testdistributor.com',
    password: process.env.KAM_PASSWORD || 'KAM@123',
    role: 'kam'
  },
  finance_manager: {
    email: process.env.FINANCE_EMAIL || 'finance@testdistributor.com',
    password: process.env.FINANCE_PASSWORD || 'Finance@123',
    role: 'finance_manager'
  },
  sales_manager: {
    email: process.env.SALES_EMAIL || 'sales@testdistributor.com',
    password: process.env.SALES_PASSWORD || 'Sales@123',
    role: 'sales_manager'
  },
  analyst: {
    email: process.env.ANALYST_EMAIL || 'analyst@testdistributor.com',
    password: process.env.ANALYST_PASSWORD || 'Analyst@123',
    role: 'analyst'
  },
  user: {
    email: process.env.USER_EMAIL || 'user@testdistributor.com',
    password: process.env.USER_PASSWORD || 'User@123',
    role: 'user'
  }
};

/**
 * Login and get authentication token
 * @param {string} role - User role (admin, manager, kam, etc.)
 * @returns {Promise<{token: string, user: object}>}
 */
async function login(role = 'admin') {
  const credentials = TEST_USERS[role];
  if (!credentials) {
    throw new Error(`Unknown role: ${role}`);
  }

  const context = await request.newContext({ baseURL: BASE_URL });
  
  try {
    const response = await context.post('/api/auth/login', {
      data: {
        email: credentials.email,
        password: credentials.password
      }
    });

    if (!response.ok()) {
      const error = await response.text();
      throw new Error(`Login failed for ${role}: ${response.status()} - ${error}`);
    }

    const data = await response.json();
    
    return {
      token: data.token || data.data?.token,
      user: data.user || data.data?.user,
      role: credentials.role
    };
  } finally {
    await context.dispose();
  }
}

/**
 * Create authenticated API context
 * @param {string} role - User role
 * @returns {Promise<{context: APIRequestContext, auth: object}>}
 */
async function createAuthContext(role = 'admin') {
  const auth = await login(role);
  
  const context = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      'Authorization': `Bearer ${auth.token}`,
      'Content-Type': 'application/json'
    }
  });

  return { context, auth };
}

/**
 * Save authentication state for Playwright browser tests
 * @param {Page} page - Playwright page
 * @param {string} role - User role
 */
async function loginUI(page, role = 'admin') {
  const credentials = TEST_USERS[role];
  if (!credentials) {
    throw new Error(`Unknown role: ${role}`);
  }

  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"], input[type="email"]', credentials.email);
  await page.fill('input[name="password"], input[type="password"]', credentials.password);
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
}

/**
 * Get storage state for a role (for reuse across tests)
 * @param {string} role - User role
 * @returns {string} - Path to storage state file
 */
function getStorageStatePath(role) {
  return `tests/fixtures/auth-${role}.json`;
}

module.exports = {
  TEST_USERS,
  login,
  createAuthContext,
  loginUI,
  getStorageStatePath,
  BASE_URL
};
