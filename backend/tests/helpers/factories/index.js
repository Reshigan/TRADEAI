/**
 * Factories Index
 * Export all test data factories
 */

const userFactory = require('./user.factory');
const promotionFactory = require('./promotion.factory');
const customerFactory = require('./customer.factory');
const productFactory = require('./product.factory');

module.exports = {
  userFactory,
  promotionFactory,
  customerFactory,
  productFactory
};
