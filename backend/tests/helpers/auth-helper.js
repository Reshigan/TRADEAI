/**
 * Authentication Test Helper
 * Provides utilities for authentication in tests
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/**
 * Create a test user object (not saved to DB)
 */
function buildTestUser(overrides = {}) {
  return {
    email: overrides.email || 'test@example.com',
    password: overrides.password || 'Test@123456',
    firstName: overrides.firstName || 'Test',
    lastName: overrides.lastName || 'User',
    company: overrides.company || 'mondelez',
    role: overrides.role || 'user',
    status: overrides.status || 'active',
    ...overrides
  };
}

/**
 * Create and save a test user to database
 */
async function createTestUser(User, overrides = {}) {
  const userData = buildTestUser(overrides);
  
  // Hash password if provided
  if (userData.password) {
    userData.password = await bcrypt.hash(userData.password, 10);
  }
  
  const user = await User.create(userData);
  return user;
}

/**
 * Generate JWT token for user
 */
function generateToken(user, expiresIn = '1h') {
  const payload = {
    userId: user._id || user.id,
    company: user.company,
    role: user.role,
    email: user.email
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'test-secret-key-for-testing',
    { expiresIn }
  );
}

/**
 * Create auth headers with JWT token
 */
async function createAuthHeaders(User, userOverrides = {}) {
  const user = await createTestUser(User, userOverrides);
  const token = generateToken(user);
  
  return {
    Authorization: `Bearer ${token}`,
    'X-Company-ID': user.company,
    'Content-Type': 'application/json'
  };
}

/**
 * Create auth headers with existing user
 */
function createAuthHeadersForUser(user) {
  const token = generateToken(user);
  
  return {
    Authorization: `Bearer ${token}`,
    'X-Company-ID': user.company,
    'Content-Type': 'application/json'
  };
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'test-secret-key-for-testing');
  } catch (error) {
    return null;
  }
}

/**
 * Create admin user
 */
async function createAdminUser(User, overrides = {}) {
  return createTestUser(User, {
    role: 'admin',
    email: 'admin@example.com',
    ...overrides
  });
}

/**
 * Create multiple test users
 */
async function createManyTestUsers(User, count = 5, overrides = {}) {
  const users = [];
  
  for (let i = 0; i < count; i++) {
    const user = await createTestUser(User, {
      email: `test${i}@example.com`,
      firstName: `Test${i}`,
      ...overrides
    });
    users.push(user);
  }
  
  return users;
}

module.exports = {
  buildTestUser,
  createTestUser,
  generateToken,
  createAuthHeaders,
  createAuthHeadersForUser,
  verifyToken,
  createAdminUser,
  createManyTestUsers
};
