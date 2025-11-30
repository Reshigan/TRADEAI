/**
 * Data Helper
 * Idempotent data creators for test entities
 */

const { RUN_ID, TENANT_ID, pickEntity, pickList } = require('./api');

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
  const sku = options.sku || `SKU-${TENANT_ID}-${RUN_ID}-${rng.randomInt(1000, 9999)}`.toUpperCase();
  
  const listResponse = await api.getProducts({ limit: 100 });
  const existingList = pickList(listResponse.data);
  const existing = existingList.find(p => p.sku === sku);
  if (existing) {
    return existing;
  }

  // Create new product with required fields from Product.js schema
  const productData = {
    sku: sku.toUpperCase(),
    name: options.name || `Test Product ${sku}`,
    sapMaterialId: options.sapMaterialId || `SAP-${TENANT_ID}-${RUN_ID}-${rng.randomInt(1000, 9999)}`,
    productType: options.productType || rng.randomChoice(['own_brand', 'distributed', 'private_label', 'consignment']),
    category: options.category || rng.randomChoice(['Snacks', 'Beverages', 'Confectionery', 'Dairy']),
    brand: options.brand || 'Test Brand',
    pricing: {
      listPrice: options.listPrice || rng.randomFloat(5, 50),
      costPrice: options.costPrice || rng.randomFloat(2, 25),
      currency: 'USD'
    },
    status: options.status || 'active',
    ...options.extra
  };

  const response = await api.createProduct(productData);
  return pickEntity(response.data) || pickEntity(response.body);
}

/**
 * Create or find customer (idempotent)
 */
async function createCustomer(api, options = {}) {
  const rng = new SeededRandom(options.seed || 42);
  const code = options.code || `CUST-${TENANT_ID}-${RUN_ID}-${rng.randomInt(1000, 9999)}`.toUpperCase();
  
  const listResponse = await api.getCustomers({ limit: 100 });
  const existingList = pickList(listResponse.data);
  const existing = existingList.find(c => c.code === code);
  if (existing) {
    return existing;
  }

  // Create new customer with required fields from Customer.js schema
  const customerData = {
    code: code.toUpperCase(),
    name: options.name || `Test Customer ${code}`,
    sapCustomerId: options.sapCustomerId || `SAPCUST-${TENANT_ID}-${RUN_ID}-${rng.randomInt(1000, 9999)}`,
    customerType: options.customerType || rng.randomChoice(['retailer', 'wholesaler', 'distributor', 'chain', 'independent', 'online']),
    channel: options.channel || rng.randomChoice(['modern_trade', 'traditional_trade', 'horeca', 'ecommerce', 'b2b', 'export']),
    tier: options.tier || 'standard',
    status: options.status || 'active',
    ...options.extra
  };

  const response = await api.createCustomer(customerData);
  return pickEntity(response.data) || pickEntity(response.body);
}

/**
 * Create budget
 */
async function createBudget(api, options = {}) {
  const rng = new SeededRandom(options.seed || 42);
  const year = options.year || new Date().getFullYear();
  
  let createdBy = options.createdBy;
  if (!createdBy) {
    const identity = await api.getIdentity();
    const user = pickEntity(identity.data);
    createdBy = user?._id || user?.id;
  }
  
  // Create budget with required fields from Budget.js schema
  const budgetData = {
    code: options.code || `BUD-${TENANT_ID}-${RUN_ID}-${rng.randomInt(1000, 9999)}`,
    name: options.name || `Test Budget ${RUN_ID}`,
    year: year,
    budgetType: options.budgetType || rng.randomChoice(['forecast', 'budget', 'revised_budget', 'scenario']),
    budgetCategory: options.budgetCategory || 'marketing',
    scope: {
      level: options.scopeLevel || rng.randomChoice(['company', 'vendor', 'customer', 'product', 'mixed'])
    },
    status: options.status || 'draft',
    createdBy: createdBy,
    allocated: options.allocated || 0,
    spent: options.spent || 0,
    remaining: options.remaining || 0,
    ...options.extra
  };

  const response = await api.createBudget(budgetData);
  return pickEntity(response.data) || pickEntity(response.body);
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
  return pickEntity(response.data) || pickEntity(response.body);
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
  return pickEntity(response.data) || pickEntity(response.body);
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
  return pickEntity(response.data) || pickEntity(response.body);
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
