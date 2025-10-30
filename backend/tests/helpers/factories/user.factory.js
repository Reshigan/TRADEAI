/**
 * User Factory
 * Generate test user data
 */

const { faker } = require('@faker-js/faker');

/**
 * Build a single user object
 */
function buildUser(overrides = {}) {
  return {
    email: faker.internet.email().toLowerCase(),
    password: 'Test@123456',
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    company: 'mondelez',
    role: 'user',
    status: 'active',
    phone: faker.phone.number(),
    department: faker.helpers.arrayElement(['Sales', 'Marketing', 'Finance', 'Operations']),
    ...overrides
  };
}

/**
 * Build multiple users
 */
function buildManyUsers(count = 5, overrides = {}) {
  return Array.from({ length: count }, () => buildUser(overrides));
}

/**
 * Build admin user
 */
function buildAdmin(overrides = {}) {
  return buildUser({
    role: 'admin',
    email: 'admin@example.com',
    ...overrides
  });
}

/**
 * Build user with specific role
 */
function buildUserWithRole(role, overrides = {}) {
  return buildUser({
    role,
    ...overrides
  });
}

module.exports = {
  buildUser,
  buildManyUsers,
  buildAdmin,
  buildUserWithRole
};
