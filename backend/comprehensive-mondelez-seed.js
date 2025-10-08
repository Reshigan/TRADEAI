const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
require('dotenv').config();

// Import ALL models
const User = require('./src/models/User');
const Company = require('./src/models/Company');
const Tenant = require('./src/models/Tenant');
const Product = require('./src/models/Product');
const Customer = require('./src/models/Customer');
const Budget = require('./src/models/Budget');
const SalesHistory = require('./src/models/SalesHistory');
const Promotion = require('./src/models/Promotion');
const Campaign = require('./src/models/Campaign');
const TradeSpend = require('./src/models/TradeSpend');
const TradingTerm = require('./src/models/TradingTerm');
const ActivityGrid = require('./src/models/ActivityGrid');
const Vendor = require('./src/models/Vendor');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trade-ai');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Mondelez South Africa Complete Product Catalog
const mondelezProducts = [
  // Biscuits & Cookies
  { category: 'Biscuits', brand: 'Oreo', name: 'Oreo Original Cookies 154g', sku: 'ORE-001', price: 25.99, cost: 15.59, barcode: '6001087381901' },
  { category: 'Biscuits', brand: 'Oreo', name: 'Oreo Golden Cookies 154g', sku: 'ORE-002', price: 25.99, cost: 15.59, barcode: '6001087381902' },
  { category: 'Biscuits', brand: 'Oreo', name: 'Oreo Thins Original 95g', sku: 'ORE-003', price: 19.99, cost: 11.99, barcode: '6001087381903' },
  { category: 'Biscuits', brand: 'Oreo', name: 'Oreo Chocolate Cream 154g', sku: 'ORE-004', price: 25.99, cost: 15.59, barcode: '6001087381904' },
  { category: 'Biscuits', brand: 'Bakers', name: 'Bakers Tennis Biscuits 200g', sku: 'BAK-001', price: 18.99, cost: 11.39, barcode: '6001087382001' },
  { category: 'Biscuits', brand: 'Bakers', name: 'Bakers Eet-Sum-Mor 200g', sku: 'BAK-002', price: 18.99, cost: 11.39, barcode: '6001087382002' },
  { category: 'Biscuits', brand: 'Bakers', name: 'Bakers Romany Creams 200g', sku: 'BAK-003', price: 22.99, cost: 13.79, barcode: '6001087382003' },
  { category: 'Biscuits', brand: 'Bakers', name: 'Bakers Salticrax 200g', sku: 'BAK-004', price: 16.99, cost: 10.19, barcode: '6001087382004' },
  
  // Chocolate & Confectionery
  { category: 'Chocolate', brand: 'Cadbury', name: 'Cadbury Dairy Milk 80g', sku: 'CAD-001', price: 22.99, cost: 13.79, barcode: '6001087383001' },
  { category: 'Chocolate', brand: 'Cadbury', name: 'Cadbury Dairy Milk Fruit & Nut 80g', sku: 'CAD-002', price: 24.99, cost: 14.99, barcode: '6001087383002' },
  { category: 'Chocolate', brand: 'Cadbury', name: 'Cadbury Dairy Milk Top Deck 80g', sku: 'CAD-003', price: 24.99, cost: 14.99, barcode: '6001087383003' },
  { category: 'Chocolate', brand: 'Cadbury', name: 'Cadbury Lunch Bar 48g', sku: 'CAD-004', price: 12.99, cost: 7.79, barcode: '6001087383004' },
  { category: 'Chocolate', brand: 'Cadbury', name: 'Cadbury PS Bar 52g', sku: 'CAD-005', price: 12.99, cost: 7.79, barcode: '6001087383005' },
  { category: 'Chocolate', brand: 'Toblerone', name: 'Toblerone Milk Chocolate 100g', sku: 'TOB-001', price: 45.99, cost: 27.59, barcode: '6001087384001' },
  { category: 'Chocolate', brand: 'Toblerone', name: 'Toblerone Dark Chocolate 100g', sku: 'TOB-002', price: 45.99, cost: 27.59, barcode: '6001087384002' },
  { category: 'Chocolate', brand: 'Milka', name: 'Milka Alpine Milk 100g', sku: 'MIL-001', price: 28.99, cost: 17.39, barcode: '6001087385001' },
  { category: 'Chocolate', brand: 'Milka', name: 'Milka Oreo 100g', sku: 'MIL-002', price: 32.99, cost: 19.79, barcode: '6001087385002' },
  
  // Gum & Mints
  { category: 'Gum', brand: 'Trident', name: 'Trident Spearmint Gum 14s', sku: 'TRI-001', price: 8.99, cost: 5.39, barcode: '6001087386001' },
  { category: 'Gum', brand: 'Trident', name: 'Trident Peppermint Gum 14s', sku: 'TRI-002', price: 8.99, cost: 5.39, barcode: '6001087386002' },
  { category: 'Gum', brand: 'Stimorol', name: 'Stimorol Ice 14s', sku: 'STI-001', price: 8.99, cost: 5.39, barcode: '6001087387001' },
  { category: 'Gum', brand: 'Halls', name: 'Halls Mentho-Lyptus 33.5g', sku: 'HAL-001', price: 12.99, cost: 7.79, barcode: '6001087388001' },
  
  // Beverages
  { category: 'Beverages', brand: 'Tang', name: 'Tang Orange 500g', sku: 'TAN-001', price: 35.99, cost: 21.59, barcode: '6001087389001' },
  { category: 'Beverages', brand: 'Tang', name: 'Tang Mango 500g', sku: 'TAN-002', price: 35.99, cost: 21.59, barcode: '6001087389002' },
  { category: 'Beverages', brand: 'Jacobs', name: 'Jacobs Kronung Coffee 200g', sku: 'JAC-001', price: 89.99, cost: 53.99, barcode: '6001087390001' },
  { category: 'Beverages', brand: 'Jacobs', name: 'Jacobs Decaf Coffee 200g', sku: 'JAC-002', price: 94.99, cost: 56.99, barcode: '6001087390002' },
  
  // Cheese & Dairy
  { category: 'Cheese', brand: 'Philadelphia', name: 'Philadelphia Original Cream Cheese 230g', sku: 'PHI-001', price: 42.99, cost: 25.79, barcode: '6001087391001' },
  { category: 'Cheese', brand: 'Philadelphia', name: 'Philadelphia Light Cream Cheese 230g', sku: 'PHI-002', price: 42.99, cost: 25.79, barcode: '6001087391002' },
];

// South African Major Retailers
const saRetailers = [
  { name: 'Pick n Pay', type: 'Supermarket', tier: 'National' },
  { name: 'Shoprite', type: 'Supermarket', tier: 'National' },
  { name: 'Checkers', type: 'Supermarket', tier: 'National' },
  { name: 'Spar', type: 'Supermarket', tier: 'Regional' },
  { name: 'Woolworths', type: 'Supermarket', tier: 'Premium' },
  { name: 'OK Foods', type: 'Supermarket', tier: 'Regional' },
  { name: 'Food Lovers Market', type: 'Supermarket', tier: 'Regional' },
  { name: 'Cambridge Food', type: 'Convenience Store', tier: 'Regional' },
  { name: 'Boxer', type: 'Supermarket', tier: 'Discount' },
  { name: 'Makro', type: 'Wholesale', tier: 'National' },
];

const saRegions = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'];

// Helper to generate date range
const generateDateRange = (startDate, endDate) => {
  const dates = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

// Clear existing data
const clearData = async () => {
  console.log('\n🗑️  Clearing existing data...');
  await User.deleteMany({});
  await Company.deleteMany({});
  await Tenant.deleteMany({});
  await Product.deleteMany({});
  await Customer.deleteMany({});
  await Budget.deleteMany({});
  await SalesHistory.deleteMany({});
  await Promotion.deleteMany({});
  await Campaign.deleteMany({});
  await TradeSpend.deleteMany({});
  await TradingTerm.deleteMany({});
  await ActivityGrid.deleteMany({});
  await Vendor.deleteMany({});
  console.log('✅ Data cleared');
};

// Seed Tenant
const seedTenant = async () => {
  console.log('\n🏢 Creating Tenant...');
  
  const tenant = await Tenant.create({
    name: 'Mondelez International',
    slug: 'mondelez',
    domain: 'mondelez.com',
    status: 'active',
    subscription: {
      plan: 'enterprise',
      status: 'active',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31')
    },
    features: {
      analytics: true,
      forecasting: true,
      mlPredictions: true,
      multiCurrency: true,
      customReports: true,
      apiAccess: true,
      realTimeAlerts: true,
      advancedSecurity: true,
      dataExport: true,
      integrations: true
    },
    limits: {
      maxUsers: 100,
      maxProducts: 10000,
      maxCustomers: 5000,
      storageGB: 500
    }
  });
  
  console.log(`✅ Tenant created: ${tenant.name}`);
  return tenant;
};

// Seed Company
const seedCompany = async (tenantId) => {
  console.log('\n🏭 Creating Company...');
  
  const company = await Company.create({
    tenantId,
    name: 'Mondelez South Africa',
    code: 'MDZSA',
    domain: 'mondelez-sa',
    description: 'Leading snacking company in South Africa',
    address: {
      street: '1 Discovery Place',
      city: 'Sandton',
      state: 'Gauteng',
      country: 'South Africa',
      postalCode: '2196'
    },
    contact: {
      phone: '+27 11 123 4567',
      email: 'info@mondelez.co.za',
      website: 'www.mondelez.co.za'
    },
    isActive: true
  });
  
  console.log(`✅ Company created: ${company.name}`);
  return company;
};

// Seed Users
const seedUsers = async (tenantId, companyId) => {
  console.log('\n👥 Creating Users...');
  
  const users = [];
  
  // Super Admin
  const superAdmin = await User.create({
    tenantId,
    companyId,
    email: 'admin@mondelez.com',
    password: await bcrypt.hash('Admin@123', 10),
    firstName: 'System',
    lastName: 'Administrator',
    role: 'super_admin',
    permissions: ['all'],
    isActive: true
  });
  users.push(superAdmin);
  
  // Sales Director
  const salesDirector = await User.create({
    tenantId,
    companyId,
    email: 'sales.director@mondelez.com',
    password: await bcrypt.hash('Sales@123', 10),
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'admin',
    permissions: ['view_analytics', 'manage_promotions', 'view_forecasting', 'manage_budgets'],
    isActive: true
  });
  users.push(salesDirector);
  
  // Key Account Managers
  const kamNames = [
    ['John', 'Smith'],
    ['Mary', 'Williams'],
    ['David', 'Brown'],
    ['Lisa', 'Taylor'],
    ['Michael', 'Anderson']
  ];
  
  for (const [firstName, lastName] of kamNames) {
    const kam = await User.create({
      tenantId,
      companyId,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@mondelez.com`,
      password: await bcrypt.hash('User@123', 10),
      firstName,
      lastName,
      role: 'manager',
      permissions: ['view_analytics', 'manage_promotions', 'view_customers'],
      isActive: true
    });
    users.push(kam);
  }
  
  console.log(`✅ Created ${users.length} users`);
  return users;
};

// Seed Products
const seedProducts = async (tenantId, companyId) => {
  console.log('\n📦 Creating Products...');
  
  const products = [];
  
  for (const prod of mondelezProducts) {
    const product = await Product.create({
      tenantId,
      companyId,
      name: prod.name,
      sku: prod.sku,
      barcode: prod.barcode,
      category: prod.category,
      brand: prod.brand,
      description: `${prod.brand} ${prod.name} - Premium quality ${prod.category.toLowerCase()}`,
      price: prod.price,
      cost: prod.cost,
      stockLevel: faker.number.int({ min: 500, max: 5000 }),
      reorderLevel: 200,
      unit: 'unit',
      isActive: true,
      attributes: {
        weight: prod.name.match(/\d+g/) ? prod.name.match(/\d+g/)[0] : '100g',
        packSize: '1'
      }
    });
    products.push(product);
  }
  
  console.log(`✅ Created ${products.length} products`);
  return products;
};

// Seed Customers
const seedCustomers = async (tenantId, companyId) => {
  console.log('\n🏪 Creating Customers...');
  
  const customers = [];
  
  for (const retailer of saRetailers) {
    // Create multiple stores per retailer across regions
    const numStores = retailer.tier === 'National' ? 15 : (retailer.tier === 'Regional' ? 8 : 5);
    
    for (let i = 0; i < numStores; i++) {
      const region = faker.helpers.arrayElement(saRegions);
      const customer = await Customer.create({
        tenantId,
        companyId,
        name: `${retailer.name} - ${region} ${i + 1}`,
        code: `${retailer.name.substring(0, 3).toUpperCase()}-${region.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
        type: retailer.type.toLowerCase().replace(' ', '_'),
        tier: retailer.tier.toLowerCase(),
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: region,
          country: 'South Africa',
          postalCode: faker.location.zipCode()
        },
        contact: {
          name: faker.person.fullName(),
          email: `${retailer.name.toLowerCase().replace(' ', '.')}${i + 1}@example.com`,
          phone: faker.phone.number('+27 ## ### ####')
        },
        isActive: true,
        creditLimit: faker.number.int({ min: 100000, max: 1000000 }),
        paymentTerms: 30
      });
      customers.push(customer);
    }
  }
  
  console.log(`✅ Created ${customers.length} customers`);
  return customers;
};

// Seed Promotions (Last 12 months + next 3 months)
const seedPromotions = async (tenantId, companyId, products, customers) => {
  console.log('\n🎉 Creating Promotions...');
  
  const promotions = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);
  
  // Create 30 promotions over the period
  for (let i = 0; i < 30; i++) {
    const promotionStart = new Date(startDate);
    promotionStart.setDate(promotionStart.getDate() + (i * 15));
    
    const promotionEnd = new Date(promotionStart);
    promotionEnd.setDate(promotionEnd.getDate() + faker.number.int({ min: 7, max: 30 }));
    
    const selectedProducts = faker.helpers.arrayElements(products, faker.number.int({ min: 2, max: 8 }));
    const selectedCustomers = faker.helpers.arrayElements(customers, faker.number.int({ min: 5, max: 20 }));
    
    const discountType = faker.helpers.arrayElement(['percentage', 'fixed_amount', 'buy_x_get_y']);
    
    const promotion = await Promotion.create({
      tenantId,
      companyId,
      name: `${faker.helpers.arrayElement(['Summer', 'Winter', 'Spring', 'Holiday', 'Weekend', 'Back to School'])} ${faker.helpers.arrayElement(['Sale', 'Special', 'Promo', 'Deal'])} ${i + 1}`,
      description: faker.commerce.productDescription(),
      startDate: promotionStart,
      endDate: promotionEnd,
      status: promotionEnd < new Date() ? 'completed' : (promotionStart > new Date() ? 'scheduled' : 'active'),
      type: discountType,
      discountType,
      discountValue: discountType === 'percentage' ? faker.number.int({ min: 10, max: 30 }) : faker.number.int({ min: 5, max: 20 }),
      products: selectedProducts.map(p => p._id),
      customers: selectedCustomers.map(c => c._id),
      budget: faker.number.int({ min: 50000, max: 500000 }),
      actualSpend: faker.number.int({ min: 40000, max: 450000 }),
      terms: 'Standard promotional terms apply'
    });
    promotions.push(promotion);
  }
  
  console.log(`✅ Created ${promotions.length} promotions`);
  return promotions;
};

// Seed Campaigns
const seedCampaigns = async (tenantId, companyId, promotions) => {
  console.log('\n📢 Creating Campaigns...');
  
  const campaigns = [];
  
  for (let i = 0; i < 10; i++) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - faker.number.int({ min: 1, max: 12 }));
    
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + faker.number.int({ min: 1, max: 6 }));
    
    const campaign = await Campaign.create({
      tenantId,
      companyId,
      name: `Q${faker.number.int({ min: 1, max: 4 })} ${new Date().getFullYear()} ${faker.helpers.arrayElement(['Growth', 'Awareness', 'Launch', 'Seasonal'])} Campaign`,
      description: faker.commerce.productDescription(),
      startDate,
      endDate,
      status: endDate < new Date() ? 'completed' : (startDate > new Date() ? 'planned' : 'active'),
      budget: faker.number.int({ min: 500000, max: 2000000 }),
      actualSpend: faker.number.int({ min: 400000, max: 1800000 }),
      promotions: faker.helpers.arrayElements(promotions.map(p => p._id), faker.number.int({ min: 2, max: 5 })),
      objectives: ['Increase market share', 'Drive volume growth', 'Build brand awareness'],
      channels: faker.helpers.arrayElements(['retail', 'digital', 'print', 'tv', 'radio'], 3)
    });
    campaigns.push(campaign);
  }
  
  console.log(`✅ Created ${campaigns.length} campaigns`);
  return campaigns;
};

// Seed Budgets
const seedBudgets = async (tenantId, companyId) => {
  console.log('\n💰 Creating Budgets...');
  
  const budgets = [];
  const currentYear = new Date().getFullYear();
  
  // Create quarterly budgets for current year
  const quarters = [
    { name: 'Q1', start: new Date(currentYear, 0, 1), end: new Date(currentYear, 2, 31) },
    { name: 'Q2', start: new Date(currentYear, 3, 1), end: new Date(currentYear, 5, 30) },
    { name: 'Q3', start: new Date(currentYear, 6, 1), end: new Date(currentYear, 8, 30) },
    { name: 'Q4', start: new Date(currentYear, 9, 1), end: new Date(currentYear, 11, 31) }
  ];
  
  for (const quarter of quarters) {
    const totalBudget = faker.number.int({ min: 2000000, max: 5000000 });
    const spent = quarter.end < new Date() ? faker.number.int({ min: totalBudget * 0.7, max: totalBudget * 0.95 }) : 
                  faker.number.int({ min: 0, max: totalBudget * 0.6 });
    
    const budget = await Budget.create({
      tenantId,
      companyId,
      name: `${currentYear} ${quarter.name} Trade Budget`,
      description: `Quarterly trade spend budget for ${quarter.name} ${currentYear}`,
      startDate: quarter.start,
      endDate: quarter.end,
      totalBudget,
      allocatedBudget: totalBudget * 0.9,
      spentBudget: spent,
      remainingBudget: totalBudget - spent,
      status: quarter.end < new Date() ? 'completed' : (quarter.start > new Date() ? 'planned' : 'active'),
      category: 'trade_marketing',
      approvedBy: 'Finance Director',
      approvedDate: new Date(quarter.start.getTime() - 7 * 24 * 60 * 60 * 1000)
    });
    budgets.push(budget);
  }
  
  console.log(`✅ Created ${budgets.length} budgets`);
  return budgets;
};

// Seed Sales History (12 months of daily sales)
const seedSalesHistory = async (tenantId, companyId, products, customers, promotions) => {
  console.log('\n📊 Creating Sales History (this may take a while)...');
  
  const salesData = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);
  const endDate = new Date();
  
  const dates = generateDateRange(startDate, endDate);
  console.log(`   Generating sales for ${dates.length} days...`);
  
  let counter = 0;
  
  // For each date, create sales for a subset of customers
  for (const date of dates) {
    const dailyCustomers = faker.helpers.arrayElements(customers, Math.floor(customers.length * 0.3)); // 30% of customers buy each day
    
    for (const customer of dailyCustomers) {
      const dailyProducts = faker.helpers.arrayElements(products, faker.number.int({ min: 3, max: 10 }));
      
      for (const product of dailyProducts) {
        const quantity = faker.number.int({ min: 10, max: 200 });
        const unitPrice = product.price;
        
        // Check if there's an active promotion
        const activePromotion = promotions.find(p => 
          p.products.some(pid => pid.toString() === product._id.toString()) &&
          p.customers.some(cid => cid.toString() === customer._id.toString()) &&
          new Date(p.startDate) <= date &&
          new Date(p.endDate) >= date
        );
        
        const discount = activePromotion ? (activePromotion.discountValue / 100) * unitPrice : 0;
        const finalPrice = unitPrice - discount;
        
        salesData.push({
          tenantId,
          companyId,
          productId: product._id,
          customerId: customer._id,
          promotionId: activePromotion ? activePromotion._id : null,
          date,
          quantity,
          unitPrice,
          discount,
          totalAmount: finalPrice * quantity,
          channel: faker.helpers.arrayElement(['retail', 'wholesale', 'online']),
          region: customer.address.state,
          paymentMethod: faker.helpers.arrayElement(['credit', 'cash', 'eft']),
          status: 'completed'
        });
        
        counter++;
        if (counter % 1000 === 0) {
          console.log(`   Generated ${counter} sales records...`);
        }
      }
    }
  }
  
  console.log(`   Inserting ${salesData.length} sales records into database...`);
  await SalesHistory.insertMany(salesData);
  
  console.log(`✅ Created ${salesData.length} sales records`);
  return salesData;
};

// Seed Trade Spends
const seedTradeSpends = async (tenantId, companyId, customers, promotions) => {
  console.log('\n💸 Creating Trade Spends...');
  
  const tradeSpends = [];
  
  for (const promotion of promotions) {
    const selectedCustomers = faker.helpers.arrayElements(customers, faker.number.int({ min: 3, max: 10 }));
    
    for (const customer of selectedCustomers) {
      const amount = faker.number.int({ min: 5000, max: 50000 });
      
      const tradeSpend = await TradeSpend.create({
        tenantId,
        companyId,
        customerId: customer._id,
        promotionId: promotion._id,
        date: promotion.startDate,
        category: faker.helpers.arrayElement(['promotional_allowance', 'display_allowance', 'volume_rebate', 'listing_fee']),
        amount,
        description: `Trade spend for ${promotion.name}`,
        status: 'approved',
        approvedBy: 'Finance Manager',
        approvedDate: new Date(promotion.startDate.getTime() - 3 * 24 * 60 * 60 * 1000)
      });
      tradeSpends.push(tradeSpend);
    }
  }
  
  console.log(`✅ Created ${tradeSpends.length} trade spends`);
  return tradeSpends;
};

// Seed Trading Terms
const seedTradingTerms = async (tenantId, companyId, customers) => {
  console.log('\n📜 Creating Trading Terms...');
  
  const tradingTerms = [];
  
  for (const customer of customers) {
    const terms = await TradingTerm.create({
      tenantId,
      companyId,
      customerId: customer._id,
      paymentTerms: faker.helpers.arrayElement([30, 45, 60]),
      creditLimit: faker.number.int({ min: 100000, max: 1000000 }),
      discountRate: faker.number.float({ min: 2, max: 10, precision: 0.5 }),
      volumeRebate: faker.number.float({ min: 1, max: 5, precision: 0.5 }),
      listingFee: faker.number.int({ min: 5000, max: 50000 }),
      startDate: new Date(new Date().getFullYear(), 0, 1),
      endDate: new Date(new Date().getFullYear(), 11, 31),
      status: 'active',
      terms: 'Standard trading terms as per agreement',
      conditions: [
        'Volume targets to be met quarterly',
        'Payment within agreed terms',
        'No returns without prior approval'
      ]
    });
    tradingTerms.push(terms);
  }
  
  console.log(`✅ Created ${tradingTerms.length} trading terms`);
  return tradingTerms;
};

// Seed Activity Grid
const seedActivityGrid = async (tenantId, companyId, customers, users, promotions) => {
  console.log('\n📅 Creating Activity Grid...');
  
  const activities = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 3);
  
  // Generate 100 activities
  for (let i = 0; i < 100; i++) {
    const activityDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
    
    const activity = await ActivityGrid.create({
      tenantId,
      companyId,
      title: faker.helpers.arrayElement([
        'Store Visit',
        'Promotion Setup',
        'Stock Review',
        'Merchandising',
        'Training Session',
        'Business Review',
        'Contract Negotiation',
        'Display Installation'
      ]),
      description: faker.commerce.productDescription(),
      type: faker.helpers.arrayElement(['visit', 'meeting', 'training', 'promotion', 'review']),
      date: activityDate,
      startTime: activityDate,
      endTime: new Date(activityDate.getTime() + faker.number.int({ min: 1, max: 4 }) * 60 * 60 * 1000),
      assignedTo: faker.helpers.arrayElement(users.filter(u => u.role === 'manager'))._id,
      customerId: faker.helpers.arrayElement(customers)._id,
      promotionId: faker.helpers.arrayElement([null, ...promotions.map(p => p._id)]),
      status: activityDate < new Date() ? 'completed' : 'scheduled',
      priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
      notes: activityDate < new Date() ? faker.lorem.sentence() : null,
      completedAt: activityDate < new Date() ? activityDate : null
    });
    activities.push(activity);
  }
  
  console.log(`✅ Created ${activities.length} activities`);
  return activities;
};

// Seed Vendors
const seedVendors = async (tenantId, companyId) => {
  console.log('\n🚚 Creating Vendors...');
  
  const vendors = [];
  const vendorNames = [
    'SA Packaging Solutions',
    'National Logistics SA',
    'Premium Display Systems',
    'Africa Marketing Agency',
    'Digital Solutions SA',
    'Print & Promo SA'
  ];
  
  for (const name of vendorNames) {
    const vendor = await Vendor.create({
      tenantId,
      companyId,
      name,
      code: name.substring(0, 3).toUpperCase() + faker.number.int({ min: 100, max: 999 }),
      type: faker.helpers.arrayElement(['supplier', 'logistics', 'service_provider']),
      category: faker.helpers.arrayElement(['packaging', 'logistics', 'marketing', 'it_services']),
      contact: {
        name: faker.person.fullName(),
        email: name.toLowerCase().replace(/ /g, '.') + '@example.com',
        phone: faker.phone.number('+27 ## ### ####')
      },
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.helpers.arrayElement(saRegions),
        country: 'South Africa',
        postalCode: faker.location.zipCode()
      },
      paymentTerms: faker.helpers.arrayElement([7, 14, 30]),
      isActive: true
    });
    vendors.push(vendor);
  }
  
  console.log(`✅ Created ${vendors.length} vendors`);
  return vendors;
};

// Main seed function
const main = async () => {
  try {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║   🌱 COMPREHENSIVE MONDELEZ SEED DATA - FULL SYSTEM     ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    
    await connectDB();
    await clearData();
    
    const tenant = await seedTenant();
    const company = await seedCompany(tenant._id);
    const users = await seedUsers(tenant._id, company._id);
    const products = await seedProducts(tenant._id, company._id);
    const customers = await seedCustomers(tenant._id, company._id);
    const promotions = await seedPromotions(tenant._id, company._id, products, customers);
    const campaigns = await seedCampaigns(tenant._id, company._id, promotions);
    const budgets = await seedBudgets(tenant._id, company._id);
    const salesHistory = await seedSalesHistory(tenant._id, company._id, products, customers, promotions);
    const tradeSpends = await seedTradeSpends(tenant._id, company._id, customers, promotions);
    const tradingTerms = await seedTradingTerms(tenant._id, company._id, customers);
    const activities = await seedActivityGrid(tenant._id, company._id, customers, users, promotions);
    const vendors = await seedVendors(tenant._id, company._id);
    
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ SEED COMPLETE                       ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('\n📊 Summary:');
    console.log(`   • Tenant: 1`);
    console.log(`   • Company: 1`);
    console.log(`   • Users: ${users.length}`);
    console.log(`   • Products: ${products.length}`);
    console.log(`   • Customers: ${customers.length}`);
    console.log(`   • Promotions: ${promotions.length}`);
    console.log(`   • Campaigns: ${campaigns.length}`);
    console.log(`   • Budgets: ${budgets.length}`);
    console.log(`   • Sales Records: ${salesHistory.length}`);
    console.log(`   • Trade Spends: ${tradeSpends.length}`);
    console.log(`   • Trading Terms: ${tradingTerms.length}`);
    console.log(`   • Activities: ${activities.length}`);
    console.log(`   • Vendors: ${vendors.length}`);
    console.log('\n🔑 Login Credentials:');
    console.log('   Email: admin@mondelez.com');
    console.log('   Password: Admin@123');
    console.log('\n   Email: sales.director@mondelez.com');
    console.log('   Password: Sales@123');
    console.log('\n   Email: john.smith@mondelez.com');
    console.log('   Password: User@123');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
};

main();
