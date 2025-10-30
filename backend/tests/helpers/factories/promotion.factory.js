/**
 * Promotion Factory
 * Generate test promotion data
 */

const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

/**
 * Build a single promotion object
 */
function buildPromotion(overrides = {}) {
  const startDate = overrides.startDate || new Date();
  const endDate = overrides.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return {
    name: faker.commerce.productName() + ' Promotion',
    description: faker.lorem.sentence(),
    startDate,
    endDate,
    budget: faker.number.int({ min: 10000, max: 100000 }),
    discountType: faker.helpers.arrayElement(['percentage', 'fixed_amount', 'buy_x_get_y']),
    discountValue: faker.number.int({ min: 5, max: 25 }),
    status: 'draft',
    company: 'mondelez',
    objective: faker.helpers.arrayElement(['Increase Revenue', 'Market Share', 'Clear Inventory', 'New Product Launch']),
    expectedRevenue: faker.number.int({ min: 50000, max: 500000 }),
    ...overrides
  };
}

/**
 * Build promotion with specific status
 */
function buildPromotionWithStatus(status, overrides = {}) {
  return buildPromotion({
    status,
    ...overrides
  });
}

/**
 * Build active promotion
 */
function buildActivePromotion(overrides = {}) {
  return buildPromotion({
    status: 'active',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Started 7 days ago
    endDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000), // Ends in 23 days
    ...overrides
  });
}

/**
 * Build draft promotion
 */
function buildDraftPromotion(overrides = {}) {
  return buildPromotion({
    status: 'draft',
    ...overrides
  });
}

/**
 * Build approved promotion
 */
function buildApprovedPromotion(overrides = {}) {
  return buildPromotion({
    status: 'approved',
    ...overrides
  });
}

/**
 * Build promotion with customer and product IDs
 */
function buildPromotionWithRelations(customerIds = [], productIds = [], overrides = {}) {
  return buildPromotion({
    customerIds: customerIds.length > 0 ? customerIds : [new mongoose.Types.ObjectId()],
    productIds: productIds.length > 0 ? productIds : [new mongoose.Types.ObjectId()],
    ...overrides
  });
}

/**
 * Build multiple promotions
 */
function buildManyPromotions(count = 5, overrides = {}) {
  return Array.from({ length: count }, () => buildPromotion(overrides));
}

/**
 * Build promotion with specific discount type
 */
function buildPromotionWithDiscount(discountType, value, overrides = {}) {
  return buildPromotion({
    discountType,
    discountValue: value,
    ...overrides
  });
}

/**
 * Build expired promotion
 */
function buildExpiredPromotion(overrides = {}) {
  return buildPromotion({
    status: 'completed',
    startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    ...overrides
  });
}

module.exports = {
  buildPromotion,
  buildPromotionWithStatus,
  buildActivePromotion,
  buildDraftPromotion,
  buildApprovedPromotion,
  buildPromotionWithRelations,
  buildManyPromotions,
  buildPromotionWithDiscount,
  buildExpiredPromotion
};
