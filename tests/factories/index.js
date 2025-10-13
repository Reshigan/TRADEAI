// TRADEAI v2.0 - Test Data Factories for 100% Coverage Testing

const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

// Base factory class
class BaseFactory {
  constructor(model) {
    this.model = model;
    this.defaultAttributes = {};
  }

  build(overrides = {}) {
    return { ...this.defaultAttributes, ...overrides };
  }

  async create(overrides = {}) {
    const attributes = this.build(overrides);
    return await this.model.create(attributes);
  }

  async createMany(count, overrides = {}) {
    const items = [];
    for (let i = 0; i < count; i++) {
      items.push(await this.create(overrides));
    }
    return items;
  }
}

// User Factory
class UserFactory extends BaseFactory {
  constructor(model) {
    super(model);
    this.defaultAttributes = {
      firstName: () => faker.person.firstName(),
      lastName: () => faker.person.lastName(),
      email: () => faker.internet.email(),
      password: () => faker.internet.password(),
      role: () => faker.helpers.arrayElement(['user', 'admin', 'manager']),
      companyId: () => new mongoose.Types.ObjectId(),
      isActive: true,
      lastLogin: () => faker.date.recent(),
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: true
      },
      createdAt: () => faker.date.past(),
      updatedAt: () => faker.date.recent()
    };
  }

  admin(overrides = {}) {
    return this.build({ role: 'admin', ...overrides });
  }

  manager(overrides = {}) {
    return this.build({ role: 'manager', ...overrides });
  }

  inactive(overrides = {}) {
    return this.build({ isActive: false, ...overrides });
  }
}

// Company Factory
class CompanyFactory extends BaseFactory {
  constructor(model) {
    super(model);
    this.defaultAttributes = {
      name: () => faker.company.name(),
      industry: () => faker.helpers.arrayElement(['FMCG', 'Retail', 'Manufacturing', 'Technology']),
      size: () => faker.helpers.arrayElement(['Small', 'Medium', 'Large', 'Enterprise']),
      country: () => faker.location.country(),
      currency: () => faker.finance.currencyCode(),
      settings: {
        fiscalYearStart: 1,
        defaultBudgetCurrency: 'USD',
        approvalWorkflow: true
      },
      subscription: {
        plan: 'enterprise',
        status: 'active',
        expiresAt: () => faker.date.future()
      },
      createdAt: () => faker.date.past(),
      updatedAt: () => faker.date.recent()
    };
  }

  enterprise(overrides = {}) {
    return this.build({
      size: 'Enterprise',
      subscription: { plan: 'enterprise', status: 'active' },
      ...overrides
    });
  }

  small(overrides = {}) {
    return this.build({
      size: 'Small',
      subscription: { plan: 'basic', status: 'active' },
      ...overrides
    });
  }
}

// Export factories
module.exports = {
  BaseFactory,
  UserFactory,
  CompanyFactory,
  
  // Helper function to create all factories
  createFactories: (models) => ({
    user: new UserFactory(models.User),
    company: new CompanyFactory(models.Company)
  })
};