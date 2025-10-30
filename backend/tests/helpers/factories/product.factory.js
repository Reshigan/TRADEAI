/**
 * Product Factory
 * Generate test product data
 */

const { faker } = require('@faker-js/faker');

/**
 * Build a single product object
 */
function buildProduct(overrides = {}) {
  const basePrice = faker.number.int({ min: 10, max: 500 });
  
  return {
    name: faker.commerce.productName(),
    productCode: faker.string.alphanumeric(10).toUpperCase(),
    description: faker.commerce.productDescription(),
    brand: faker.helpers.arrayElement(['Cadbury', 'Oreo', 'Milka', 'Toblerone', 'BelVita']),
    category: faker.helpers.arrayElement(['Chocolate', 'Biscuits', 'Snacks', 'Gum', 'Beverages']),
    subcategory: faker.commerce.department(),
    company: 'mondelez',
    status: 'active',
    pricing: {
      cost: basePrice * 0.6,
      listPrice: basePrice,
      currency: 'ZAR'
    },
    inventory: {
      available: faker.number.int({ min: 100, max: 10000 }),
      unit: faker.helpers.arrayElement(['EA', 'CS', 'PK'])
    },
    specifications: {
      weight: faker.number.int({ min: 50, max: 1000 }),
      weightUnit: 'g',
      dimensions: {
        length: faker.number.int({ min: 5, max: 50 }),
        width: faker.number.int({ min: 5, max: 50 }),
        height: faker.number.int({ min: 5, max: 50 }),
        unit: 'cm'
      }
    },
    ...overrides
  };
}

/**
 * Build multiple products
 */
function buildManyProducts(count = 5, overrides = {}) {
  return Array.from({ length: count }, () => buildProduct(overrides));
}

/**
 * Build product with specific brand
 */
function buildProductWithBrand(brand, overrides = {}) {
  return buildProduct({
    brand,
    ...overrides
  });
}

/**
 * Build product with specific category
 */
function buildProductWithCategory(category, overrides = {}) {
  return buildProduct({
    category,
    ...overrides
  });
}

/**
 * Build expensive product
 */
function buildExpensiveProduct(overrides = {}) {
  return buildProduct({
    pricing: {
      cost: 300,
      listPrice: 500,
      currency: 'ZAR'
    },
    ...overrides
  });
}

/**
 * Build budget product
 */
function buildBudgetProduct(overrides = {}) {
  return buildProduct({
    pricing: {
      cost: 6,
      listPrice: 10,
      currency: 'ZAR'
    },
    ...overrides
  });
}

/**
 * Build out-of-stock product
 */
function buildOutOfStockProduct(overrides = {}) {
  return buildProduct({
    inventory: {
      available: 0,
      unit: 'EA'
    },
    ...overrides
  });
}

/**
 * Build inactive product
 */
function buildInactiveProduct(overrides = {}) {
  return buildProduct({
    status: 'inactive',
    ...overrides
  });
}

module.exports = {
  buildProduct,
  buildManyProducts,
  buildProductWithBrand,
  buildProductWithCategory,
  buildExpensiveProduct,
  buildBudgetProduct,
  buildOutOfStockProduct,
  buildInactiveProduct
};
