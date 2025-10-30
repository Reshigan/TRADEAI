/**
 * Customer Factory
 * Generate test customer data
 */

const { faker } = require('@faker-js/faker');

/**
 * Build a single customer object
 */
function buildCustomer(overrides = {}) {
  return {
    name: faker.company.name(),
    customerCode: faker.string.alphanumeric(10).toUpperCase(),
    email: faker.internet.email().toLowerCase(),
    phone: faker.phone.number(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      postalCode: faker.location.zipCode(),
      country: 'South Africa'
    },
    company: 'mondelez',
    channel: faker.helpers.arrayElement(['Retail', 'Wholesale', 'Online', 'Foodservice']),
    tier: faker.helpers.arrayElement(['Platinum', 'Gold', 'Silver', 'Bronze']),
    status: 'active',
    creditLimit: faker.number.int({ min: 50000, max: 1000000 }),
    paymentTerms: faker.helpers.arrayElement(['Net 30', 'Net 60', 'Net 90', 'COD']),
    taxNumber: faker.string.alphanumeric(12).toUpperCase(),
    ...overrides
  };
}

/**
 * Build multiple customers
 */
function buildManyCustomers(count = 5, overrides = {}) {
  return Array.from({ length: count }, () => buildCustomer(overrides));
}

/**
 * Build customer with specific tier
 */
function buildCustomerWithTier(tier, overrides = {}) {
  return buildCustomer({
    tier,
    creditLimit: tier === 'Platinum' ? 1000000 : tier === 'Gold' ? 500000 : tier === 'Silver' ? 250000 : 100000,
    ...overrides
  });
}

/**
 * Build premium customer
 */
function buildPremiumCustomer(overrides = {}) {
  return buildCustomer({
    tier: 'Platinum',
    creditLimit: 1000000,
    paymentTerms: 'Net 60',
    ...overrides
  });
}

/**
 * Build customer with specific channel
 */
function buildCustomerWithChannel(channel, overrides = {}) {
  return buildCustomer({
    channel,
    ...overrides
  });
}

/**
 * Build inactive customer
 */
function buildInactiveCustomer(overrides = {}) {
  return buildCustomer({
    status: 'inactive',
    ...overrides
  });
}

module.exports = {
  buildCustomer,
  buildManyCustomers,
  buildCustomerWithTier,
  buildPremiumCustomer,
  buildCustomerWithChannel,
  buildInactiveCustomer
};
