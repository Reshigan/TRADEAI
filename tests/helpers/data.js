/**
 * Data Helper
 * Idempotent data creators for test entities
 */

const { RUN_ID, TENANT_ID } = require('./api');

/**
 * Seeded random number generator for deterministic tests
 */
class SeededRandom {
  constructor(seed = 42) {
    this.seed = seed;
  }

  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  randomInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  randomFloat(min, max) {
    return this.next() * (max - min) + min;
  }

  randomChoice(array) {
    return array[this.randomInt(0, array.length - 1)];
  }
}

/**
 * Create or find product (idempotent)
 */
async function createProduct(api, options = {}) {
  const rng = new SeededRandom(options.seed || 42);
  const sku = options.sku || `SKU-${TENANT_ID}-${RUN_ID}-${rng.randomInt(1000, 9999)}`;
  
  const existing = await api.get(`/api/products?sku=${sku}`);
  if (existing.ok && existing.data?.products?.length > 0) {
    return existing.data.products[0];
  }

  // Create new product
  const productData = {
    sku,
    name: options.name || `Test Product ${sku}`,
    category: options.category || rng.randomChoice(['Snacks', 'Beverages', 'Confectionery', 'Dairy']),
    pricing: {
      cost: options.cost || rng.randomFloat(2, 25),
      price: options.price || rng.randomFloat(5, 50),
      currency: 'USD'
    },
    isActive: options.isActive !== undefined ? options.isActive : true,
    ...options.extra
  };

  const response = await api.createProduct(productData);
  return response.data;
}

/**
 * Create or find customer (idempotent)
 */
async function createCustomer(api, options = {}) {
  const rng = new SeededRandom(options.seed || 42);
  const code = options.code || `CUST-${TENANT_ID}-${RUN_ID}-${rng.randomInt(1000, 9999)}`;
  
  const existing = await api.get(`/api/customers?code=${code}`);
  if (existing.ok && existing.data?.customers?.length > 0) {
    return existing.data.customers[0];
  }

  // Create new customer
  const customerData = {
    code,
    name: options.name || `Test Customer ${code}`,
    type: options.type || rng.randomChoice(['National Retailer', 'Regional Chain', 'Independent Store']),
    email: options.email || `${code.toLowerCase()}@test.com`,
    phone: options.phone || `+1-555-${rng.randomInt(1000, 9999)}`,
    isActive: options.isActive !== undefined ? options.isActive : true,
    ...options.extra
  };

  const response = await api.createCustomer(customerData);
  return response.data;
}

/**
 * Create budget
 */
async function createBudget(api, options = {}) {
  const rng = new SeededRandom(options.seed || 42);
  const year = options.year || new Date().getFullYear();
  
  const budgetData = {
    name: options.name || `Test Budget ${RUN_ID}`,
    category: options.category || rng.randomChoice(['Marketing', 'Promotions', 'Trade Spend', 'Advertising']),
    fiscalYear: year,
    startDate: options.startDate || new Date(`${year}-01-01`),
    endDate: options.endDate || new Date(`${year}-12-31`),
    totalBudget: options.totalBudget || rng.randomFloat(100000, 1000000),
    allocated: options.allocated || 0,
    spent: options.spent || 0,
    remaining: options.remaining || options.totalBudget || rng.randomFloat(100000, 1000000),
    currency: 'USD',
    status: options.status || 'active',
    ...options.extra
  };

  const response = await api.createBudget(budgetData);
  return response.data;
}

/**
 * Create promotion
 */
async function createPromotion(api, options = {}) {
  const rng = new SeededRandom(options.seed || 42);
  const now = new Date();
  const startDate = options.startDate || now;
  const endDate = options.endDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const promotionData = {
    name: options.name || `Test Promotion ${RUN_ID}`,
    type: options.type || rng.randomChoice(['Price Discount', 'Volume Discount', 'BOGO', 'Bundle']),
    startDate,
    endDate,
    status: options.status || 'active',
    budget: {
      allocated: options.allocated || rng.randomFloat(10000, 50000),
      spent: options.spent || 0
    },
    discount: {
      type: options.discountType || 'percentage',
      value: options.discountValue || rng.randomFloat(10, 30)
    },
    products: options.products || [],
    customers: options.customers || [],
    ...options.extra
  };

  const response = await api.createPromotion(promotionData);
  return response.data;
}

/**
 * Create transaction
 */
async function createTransaction(api, options = {}) {
  const rng = new SeededRandom(options.seed || 42);
  
  const transactionData = {
    transactionId: options.transactionId || `TXN-${RUN_ID}-${rng.randomInt(10000, 99999)}`,
    date: options.date || new Date(),
    customerId: options.customerId,
    productId: options.productId,
    quantity: options.quantity || rng.randomInt(10, 100),
    unitPrice: options.unitPrice || rng.randomFloat(5, 50),
    totals: {
      subtotal: options.subtotal || 0,
      discount: options.discount || 0,
      tax: options.tax || 0,
      total: options.total || 0
    },
    status: options.status || 'completed',
    ...options.extra
  };

  if (!options.total) {
    transactionData.totals.subtotal = transactionData.quantity * transactionData.unitPrice;
    transactionData.totals.discount = transactionData.totals.subtotal * (options.discountPercent || 0);
    transactionData.totals.tax = (transactionData.totals.subtotal - transactionData.totals.discount) * 0.1;
    transactionData.totals.total = transactionData.totals.subtotal - transactionData.totals.discount + transactionData.totals.tax;
  }

  const response = await api.createTransaction(transactionData);
  return response.data;
}

/**
 * Create trading term
 */
async function createTradingTerm(api, options = {}) {
  const rng = new SeededRandom(options.seed || 42);
  
  const termData = {
    termId: options.termId || `TT-${RUN_ID}-${rng.randomInt(1000, 9999)}`,
    name: options.name || `Test Trading Term ${RUN_ID}`,
    type: options.type || rng.randomChoice(['Volume Discount', 'Early Payment', 'Rebate', 'Allowance']),
    customerId: options.customerId,
    startDate: options.startDate || new Date(),
    endDate: options.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    terms: options.terms || {
      discountPercent: rng.randomFloat(5, 15),
      minimumVolume: rng.randomInt(1000, 10000)
    },
    status: options.status || 'active',
    ...options.extra
  };

  const response = await api.createTradingTerm(termData);
  return response.data;
}

/**
 * Cleanup test data for a run
 */
async function cleanupTestData(api) {
  console.log(`Cleanup for run ${RUN_ID} would be executed here`);
}

module.exports = {
  SeededRandom,
  createProduct,
  createCustomer,
  createBudget,
  createPromotion,
  createTransaction,
  createTradingTerm,
  cleanupTestData,
  RUN_ID,
  TENANT_ID
};
