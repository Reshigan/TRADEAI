/**
 * South African Chocolate Market Demo Seed Data
 *
 * Generates 6 months of comprehensive demo data:
 * - 50,000 sales transactions per month (300,000 total)
 * - Users (admin, managers, KAMs, analysts)
 * - Customers (800 stores across major SA retailers)
 * - Products (100 chocolate SKUs from major brands)
 * - Budgets (monthly allocations for 6 months)
 * - Promotions (retrospective with before/after analytics)
 * - Trade Spends (linked to promotions)
 * - KAM Wallets (monthly allocations)
 * - Claims and Deductions
 * - Approval workflows
 *
 * All amounts in South African Rands (ZAR)
 * Timezone: Africa/Johannesburg
 */

// Models
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Budget = require('../models/Budget');
const logger = require('../utils/logger');

// Configuration
const START_DATE = new Date('2025-05-01'); // 6 months ago from now
const CURRENCY = 'ZAR';

const SA_REGIONS = [
  { code: 'GP', name: 'Gauteng', weight: 0.30 },
  { code: 'WC', name: 'Western Cape', weight: 0.20 },
  { code: 'KZN', name: 'KwaZulu-Natal', weight: 0.18 },
  { code: 'EC', name: 'Eastern Cape', weight: 0.12 },
  { code: 'MP', name: 'Mpumalanga', weight: 0.08 },
  { code: 'LP', name: 'Limpopo', weight: 0.07 },
  { code: 'NW', name: 'North West', weight: 0.05 }
];

const SA_RETAILERS = [
  { name: 'Shoprite', stores: 200, channel: 'modern_trade', tier: 'gold' },
  { name: 'Checkers', stores: 150, channel: 'modern_trade', tier: 'platinum' },
  { name: 'Pick n Pay', stores: 180, channel: 'modern_trade', tier: 'gold' },
  { name: 'Spar', stores: 120, channel: 'modern_trade', tier: 'silver' },
  { name: 'Woolworths', stores: 80, channel: 'modern_trade', tier: 'platinum' },
  { name: 'Makro', stores: 20, channel: 'modern_trade', tier: 'gold' },
  { name: 'Game', stores: 30, channel: 'modern_trade', tier: 'silver' },
  { name: 'Clicks', stores: 15, channel: 'modern_trade', tier: 'bronze' },
  { name: 'Dis-Chem', stores: 5, channel: 'modern_trade', tier: 'bronze' }
];

const CHOCOLATE_BRANDS = [
  {
    name: 'Cadbury',
    owner: 'company',
    products: [
      { name: 'Dairy Milk 80g', sku: 'CDM-080', listPrice: 18.99, cost: 11.50, category: 'Tablets' },
      { name: 'Dairy Milk 150g', sku: 'CDM-150', listPrice: 32.99, cost: 20.00, category: 'Tablets' },
      { name: 'Lunch Bar 48g', sku: 'CLB-048', listPrice: 12.99, cost: 7.80, category: 'Bars' },
      { name: 'PS 52g', sku: 'CPS-052', listPrice: 13.99, cost: 8.40, category: 'Bars' },
      { name: 'Top Deck 80g', sku: 'CTD-080', listPrice: 19.99, cost: 12.00, category: 'Tablets' },
      { name: 'Flake 32g', sku: 'CFL-032', listPrice: 11.99, cost: 7.20, category: 'Bars' },
      { name: 'Crunchie 40g', sku: 'CCR-040', listPrice: 12.99, cost: 7.80, category: 'Bars' },
      { name: 'Whispers 125g', sku: 'CWH-125', listPrice: 45.99, cost: 28.00, category: 'Boxed' },
      { name: 'Roses 225g', sku: 'CRO-225', listPrice: 89.99, cost: 54.00, category: 'Boxed' },
      { name: 'Astros 125g', sku: 'CAS-125', listPrice: 42.99, cost: 26.00, category: 'Boxed' }
    ]
  },
  {
    name: 'Nestlé',
    owner: 'company',
    products: [
      { name: 'KitKat 41.5g', sku: 'NKK-041', listPrice: 12.99, cost: 7.80, category: 'Bars' },
      { name: 'Aero 40g', sku: 'NAE-040', listPrice: 12.99, cost: 7.80, category: 'Bars' },
      { name: 'Bar One 55g', sku: 'NBO-055', listPrice: 13.99, cost: 8.40, category: 'Bars' },
      { name: 'Peppermint Crisp 49g', sku: 'NPC-049', listPrice: 12.99, cost: 7.80, category: 'Bars' },
      { name: 'Tex 40g', sku: 'NTX-040', listPrice: 12.99, cost: 7.80, category: 'Bars' },
      { name: 'Smarties 38g', sku: 'NSM-038', listPrice: 14.99, cost: 9.00, category: 'Boxed' },
      { name: 'Quality Street 240g', sku: 'NQS-240', listPrice: 99.99, cost: 60.00, category: 'Boxed' },
      { name: 'Aero Bubbles 102g', sku: 'NAB-102', listPrice: 39.99, cost: 24.00, category: 'Boxed' }
    ]
  },
  {
    name: 'Lindt',
    owner: 'principal',
    products: [
      { name: 'Excellence 70% 100g', sku: 'LEX-100', listPrice: 49.99, cost: 30.00, category: 'Premium' },
      { name: 'Excellence 85% 100g', sku: 'LEX-085', listPrice: 49.99, cost: 30.00, category: 'Premium' },
      { name: 'Lindor Milk 200g', sku: 'LLM-200', listPrice: 129.99, cost: 78.00, category: 'Premium' },
      { name: 'Lindor Dark 200g', sku: 'LLD-200', listPrice: 129.99, cost: 78.00, category: 'Premium' },
      { name: 'Swiss Classic 100g', sku: 'LSC-100', listPrice: 54.99, cost: 33.00, category: 'Premium' }
    ]
  },
  {
    name: 'Ferrero',
    owner: 'principal',
    products: [
      { name: 'Ferrero Rocher 16pc', sku: 'FFR-016', listPrice: 119.99, cost: 72.00, category: 'Premium' },
      { name: 'Ferrero Rocher 24pc', sku: 'FFR-024', listPrice: 179.99, cost: 108.00, category: 'Premium' },
      { name: 'Raffaello 150g', sku: 'FRA-150', listPrice: 89.99, cost: 54.00, category: 'Premium' },
      { name: 'Kinder Bueno 43g', sku: 'FKB-043', listPrice: 16.99, cost: 10.20, category: 'Bars' },
      { name: 'Kinder Joy 20g', sku: 'FKJ-020', listPrice: 14.99, cost: 9.00, category: 'Novelty' }
    ]
  },
  {
    name: 'Beacon',
    owner: 'company',
    products: [
      { name: 'Peppermint Crisp 150g', sku: 'BPC-150', listPrice: 32.99, cost: 20.00, category: 'Tablets' },
      { name: 'Chocolate Mint Crisp 49g', sku: 'BCM-049', listPrice: 12.99, cost: 7.80, category: 'Bars' },
      { name: 'Liquorice Allsorts 200g', sku: 'BLA-200', listPrice: 34.99, cost: 21.00, category: 'Confectionery' },
      { name: 'Jelly Tots 100g', sku: 'BJT-100', listPrice: 18.99, cost: 11.40, category: 'Confectionery' },
      { name: 'Fizz Pops 100g', sku: 'BFP-100', listPrice: 16.99, cost: 10.20, category: 'Confectionery' }
    ]
  }
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function weightedRandomChoice(items, weightKey = 'weight') {
  const totalWeight = items.reduce((sum, item) => sum + item[weightKey], 0);
  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= item[weightKey];
    if (random <= 0) return item;
  }

  return items[items.length - 1];
}

async function seedTenant() {
  logger.info('🏢 Creating Default tenant...');

  let tenant = await Tenant.findOne({ slug: 'default' });

  if (!tenant) {
    tenant = await Tenant.create({
      name: 'Default',
      code: 'DEFAULT',
      slug: 'default',
      isActive: true,
      settings: {
        currency: CURRENCY,
        timezone: 'Africa/Johannesburg',
        locale: 'en-ZA'
      }
    });
    logger.info(`✅ Created tenant: ${tenant.name} (${tenant._id})`);
  } else {
    logger.info(`✅ Tenant already exists: ${tenant.name} (${tenant._id})`);
  }

  return tenant;
}

async function seedUsers(tenantId) {
  logger.info('👥 Creating users...');

  const users = [];

  const admin = await User.findOne({ email: 'admin@tradeai.com' });
  if (admin) {
    users.push(admin);
    logger.info(`✅ Admin user exists: ${admin.email}`);
  }

  const managers = [
    { name: 'Thabo Mbeki', email: 'thabo.mbeki@tradeai.com', region: 'Gauteng' },
    { name: 'Sarah van der Merwe', email: 'sarah.vandermerwe@tradeai.com', region: 'Western Cape' },
    { name: 'Sipho Dlamini', email: 'sipho.dlamini@tradeai.com', region: 'KwaZulu-Natal' },
    { name: 'Lerato Mokoena', email: 'lerato.mokoena@tradeai.com', region: 'Eastern Cape' }
  ];

  for (const mgr of managers) {
    let user = await User.findOne({ email: mgr.email });
    if (!user) {
      user = await User.create({
        tenantId,
        employeeId: `MGR${randomInt(1000, 9999)}`,
        email: mgr.email,
        password: 'Manager@123',
        firstName: mgr.name.split(' ')[0],
        lastName: mgr.name.split(' ').slice(1).join(' '),
        role: 'manager',
        department: 'sales',
        isActive: true,
        customFields: { region: mgr.region }
      });
      logger.info(`✅ Created manager: ${user.email}`);
    }
    users.push(user);
  }

  const kamNames = [
    'Zanele Khumalo', 'Pieter Botha', 'Nomsa Ndlovu', 'Johan Pretorius',
    'Thandiwe Mthembu', 'Francois du Plessis', 'Busisiwe Zulu', 'Hendrik van Wyk',
    'Lindiwe Nkosi', 'Andries Steyn', 'Precious Mahlangu', 'Gerhard Fourie',
    'Nokuthula Sithole', 'Christiaan Venter', 'Zinhle Cele', 'Marius Kruger',
    'Thulisile Radebe', 'Willem Visser', 'Ayanda Ngcobo', 'Jacobus Smit'
  ];

  for (const name of kamNames) {
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@tradeai.com`;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        tenantId,
        employeeId: `KAM${randomInt(1000, 9999)}`,
        email,
        password: 'Kam@123',
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' '),
        role: 'kam',
        department: 'sales',
        isActive: true
      });
      logger.info(`✅ Created KAM: ${user.email}`);
    }
    users.push(user);
  }

  const analysts = [
    'Mpho Molefe', 'Elise Marais', 'Bongani Mkhize', 'Annelie Coetzee', 'Themba Shabalala'
  ];

  for (const name of analysts) {
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@tradeai.com`;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        tenantId,
        employeeId: `ANL${randomInt(1000, 9999)}`,
        email,
        password: 'Analyst@123',
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' '),
        role: 'analyst',
        department: 'finance',
        isActive: true
      });
      logger.info(`✅ Created analyst: ${user.email}`);
    }
    users.push(user);
  }

  logger.info(`✅ Total users: ${users.length}`);
  return users;
}

async function seedCustomers(tenantId, companyId, users) {
  logger.info('🏪 Creating customers (stores)...');

  const customers = [];
  const kams = users.filter((u) => u.role === 'kam');

  for (const retailer of SA_RETAILERS) {
    for (let i = 0; i < retailer.stores; i++) {
      const region = weightedRandomChoice(SA_REGIONS);
      const storeNumber = String(i + 1).padStart(4, '0');
      const code = `${retailer.name.substring(0, 3).toUpperCase()}-${region.code}-${storeNumber}`;

      const existing = await Customer.findOne({ code, tenantId });
      if (existing) {
        customers.push(existing);
        continue;
      }

      const customer = await Customer.create({
        tenantId,
        company: companyId,
        name: `${retailer.name} ${region.name} ${storeNumber}`,
        code,
        sapCustomerId: `SAP${randomInt(100000, 999999)}`,
        customerType: 'retailer',
        channel: retailer.channel,
        tier: retailer.tier,
        status: 'active',
        hierarchy: {
          level1: { id: retailer.name, name: retailer.name, code: retailer.name.substring(0, 3).toUpperCase() },
          level2: { id: region.code, name: region.name, code: region.code },
          level3: { id: storeNumber, name: `Store ${storeNumber}`, code: storeNumber }
        },
        addresses: [{
          type: 'both',
          city: region.name,
          state: region.name,
          country: 'South Africa',
          postalCode: String(randomInt(1000, 9999))
        }],
        creditLimit: randomInt(100000, 500000),
        paymentTerms: 'NET30',
        currency: CURRENCY,
        accountManager: randomChoice(kams)._id,
        budgetAllocations: {
          marketing: { annual: randomInt(50000, 200000), ytd: 0, available: 0 },
          cashCoop: { annual: randomInt(30000, 150000), ytd: 0, available: 0 },
          tradingTerms: { annual: randomInt(20000, 100000), ytd: 0, available: 0 }
        }
      });

      customers.push(customer);
    }
  }

  logger.info(`✅ Created ${customers.length} customers`);
  return customers;
}

async function seedProducts(tenantId, companyId) {
  logger.info('🍫 Creating chocolate products...');

  const products = [];

  for (const brand of CHOCOLATE_BRANDS) {
    for (const prod of brand.products) {
      const existing = await Product.findOne({ sku: prod.sku, tenantId });
      if (existing) {
        products.push(existing);
        continue;
      }

      const product = await Product.create({
        tenantId,
        company: companyId,
        name: `${brand.name} ${prod.name}`,
        sku: prod.sku,
        sapMaterialId: `MAT${randomInt(100000, 999999)}`,
        barcode: `6${randomInt(100000000000, 999999999999)}`,
        description: `${brand.name} ${prod.name} - Premium South African chocolate`,
        productType: brand.owner === 'company' ? 'own_brand' : 'distributed',
        category: {
          primary: prod.category,
          secondary: ['Chocolate', 'Confectionery']
        },
        brand: {
          name: brand.name,
          owner: brand.owner
        },
        hierarchy: {
          level1: { id: 'CHOC', name: 'Chocolate', code: 'CHOC' },
          level2: { id: brand.name, name: brand.name, code: brand.name.substring(0, 3).toUpperCase() },
          level3: { id: prod.category, name: prod.category, code: prod.category.substring(0, 3).toUpperCase() }
        },
        pricing: {
          listPrice: prod.listPrice,
          currency: CURRENCY,
          costPrice: prod.cost,
          marginPercentage: ((prod.listPrice - prod.cost) / prod.listPrice * 100)
        },
        attributes: {
          weight: randomInt(20, 250),
          weightUnit: 'g',
          packaging: 'Retail Pack',
          unitsPerCase: randomInt(12, 48)
        },
        status: 'active',
        promotionSettings: {
          isPromotable: true,
          maxDiscountPercentage: 30,
          allowedPromotionTypes: ['price_discount', 'volume_discount', 'bogo', 'bundle']
        }
      });

      products.push(product);
    }
  }

  logger.info(`✅ Created ${products.length} products`);
  return products;
}

async function seedBudgets(tenantId, companyId, users) {
  logger.info('💰 Creating budgets...');

  const budgets = [];
  const year = START_DATE.getFullYear();
  const admin = users.find((u) => u.role === 'admin');

  for (const brand of CHOCOLATE_BRANDS) {
    const code = `BUD-${year}-${brand.name.toUpperCase()}`;

    const existing = await Budget.findOne({ code });
    if (existing) {
      budgets.push(existing);
      continue;
    }

    const budgetLines = [];
    for (let month = 1; month <= 12; month++) {
      const salesValue = randomInt(500000, 2000000);
      budgetLines.push({
        month,
        sales: {
          units: randomInt(10000, 50000),
          value: salesValue
        },
        tradeSpend: {
          marketing: { budget: salesValue * 0.05, allocated: 0, committed: 0, spent: 0 },
          cashCoop: { budget: salesValue * 0.03, allocated: 0, committed: 0, spent: 0 },
          tradingTerms: { budget: salesValue * 0.02, allocated: 0, committed: 0, spent: 0 },
          promotions: { budget: salesValue * 0.08, allocated: 0, committed: 0, spent: 0 }
        },
        profitability: {
          grossMargin: salesValue * 0.35,
          netMargin: salesValue * 0.20,
          roi: 150
        }
      });
    }

    const budget = await Budget.create({
      company: companyId,
      name: `${brand.name} ${year} Budget`,
      code,
      year,
      budgetType: 'budget',
      budgetCategory: 'marketing',
      status: 'approved',
      scope: {
        level: 'product',
        productHierarchy: {
          level: 2,
          value: brand.name
        }
      },
      budgetLines,
      createdBy: admin._id,
      approvals: [{
        level: 'director',
        approver: admin._id,
        status: 'approved',
        comments: 'Approved for execution',
        date: new Date(year, 0, 15)
      }]
    });

    budgets.push(budget);
  }

  logger.info(`✅ Created ${budgets.length} budgets`);
  return budgets;
}

module.exports = {
  seedTenant,
  seedUsers,
  seedCustomers,
  seedProducts,
  seedBudgets
};
