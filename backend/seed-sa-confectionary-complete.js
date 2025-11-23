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

// South African Confectionary Products (30+ SKUs)
const saConfectionaryProducts = [
  // Chocolates - Slabs
  { category: 'Chocolate', brand: 'Dairy Delight', name: 'Dairy Delight Milk Chocolate 80g', sku: 'DD-CHO-001', price: 22.99, cost: 13.79, barcode: '6001234001001' },
  { category: 'Chocolate', brand: 'Dairy Delight', name: 'Dairy Delight Fruit & Nut 80g', sku: 'DD-CHO-002', price: 24.99, cost: 14.99, barcode: '6001234001002' },
  { category: 'Chocolate', brand: 'Dairy Delight', name: 'Dairy Delight Top Layer 80g', sku: 'DD-CHO-003', price: 24.99, cost: 14.99, barcode: '6001234001003' },
  { category: 'Chocolate', brand: 'Dairy Delight', name: 'Dairy Delight Caramel Crisp 80g', sku: 'DD-CHO-004', price: 24.99, cost: 14.99, barcode: '6001234001004' },
  { category: 'Chocolate', brand: 'Dairy Delight', name: 'Dairy Delight Peppermint Crisp 49g', sku: 'DD-CHO-005', price: 14.99, cost: 8.99, barcode: '6001234001005' },
  
  // Chocolates - Bars
  { category: 'Chocolate', brand: 'Lunch Time', name: 'Lunch Time Bar 48g', sku: 'LT-BAR-001', price: 12.99, cost: 7.79, barcode: '6001234002001' },
  { category: 'Chocolate', brand: 'Lunch Time', name: 'Lunch Time Peanut Bar 52g', sku: 'LT-BAR-002', price: 12.99, cost: 7.79, barcode: '6001234002002' },
  { category: 'Chocolate', brand: 'Snack Time', name: 'Snack Time Wafer 40g', sku: 'ST-WAF-001', price: 10.99, cost: 6.59, barcode: '6001234003001' },
  { category: 'Chocolate', brand: 'Snack Time', name: 'Snack Time Crispy 45g', sku: 'ST-WAF-002', price: 10.99, cost: 6.59, barcode: '6001234003002' },
  
  { category: 'Chocolate', brand: 'Premium Gold', name: 'Premium Gold 70% Dark 100g', sku: 'PG-DRK-001', price: 45.99, cost: 27.59, barcode: '6001234004001' },
  { category: 'Chocolate', brand: 'Premium Gold', name: 'Premium Gold Hazelnut 100g', sku: 'PG-HAZ-001', price: 48.99, cost: 29.39, barcode: '6001234004002' },
  { category: 'Chocolate', brand: 'Premium Gold', name: 'Premium Gold Assorted 200g', sku: 'PG-ASS-001', price: 89.99, cost: 53.99, barcode: '6001234004003' },
  
  { category: 'Gummies', brand: 'Fruity Bites', name: 'Fruity Bites Gummies 125g', sku: 'FB-GUM-001', price: 22.99, cost: 13.79, barcode: '6001234005001' },
  { category: 'Gummies', brand: 'Fruity Bites', name: 'Fruity Bites Wine Gums 125g', sku: 'FB-WIN-001', price: 22.99, cost: 13.79, barcode: '6001234005002' },
  { category: 'Gummies', brand: 'Fruity Bites', name: 'Fruity Bites Sour Mix 125g', sku: 'FB-SOU-001', price: 24.99, cost: 14.99, barcode: '6001234005003' },
  { category: 'Gummies', brand: 'Jelly Joy', name: 'Jelly Joy Babies 150g', sku: 'JJ-BAB-001', price: 18.99, cost: 11.39, barcode: '6001234006001' },
  { category: 'Gummies', brand: 'Jelly Joy', name: 'Jelly Joy Beans 150g', sku: 'JJ-BEA-001', price: 18.99, cost: 11.39, barcode: '6001234006002' },
  
  { category: 'Candy', brand: 'Sweet Treats', name: 'Sweet Treats Toffees 250g', sku: 'SW-TOF-001', price: 28.99, cost: 17.39, barcode: '6001234007001' },
  { category: 'Candy', brand: 'Sweet Treats', name: 'Sweet Treats Mints 200g', sku: 'SW-MIN-001', price: 24.99, cost: 14.99, barcode: '6001234007002' },
  { category: 'Candy', brand: 'Sweet Treats', name: 'Sweet Treats Lollipops Pack 10', sku: 'SW-LOP-001', price: 19.99, cost: 11.99, barcode: '6001234007003' },
  { category: 'Candy', brand: 'Candy Mix', name: 'Candy Mix Assorted 300g', sku: 'CM-ASS-001', price: 32.99, cost: 19.79, barcode: '6001234008001' },
  
  { category: 'Gum', brand: 'Fresh Mint', name: 'Fresh Mint Spearmint 14s', sku: 'FM-SPE-001', price: 8.99, cost: 5.39, barcode: '6001234009001' },
  { category: 'Gum', brand: 'Fresh Mint', name: 'Fresh Mint Peppermint 14s', sku: 'FM-PEP-001', price: 8.99, cost: 5.39, barcode: '6001234009002' },
  { category: 'Gum', brand: 'Fresh Mint', name: 'Fresh Mint Ice 14s', sku: 'FM-ICE-001', price: 8.99, cost: 5.39, barcode: '6001234009003' },
  { category: 'Gum', brand: 'Bubble Fun', name: 'Bubble Fun Original 50g', sku: 'BF-ORI-001', price: 12.99, cost: 7.79, barcode: '6001234010001' },
  
  { category: 'Multipack', brand: 'Dairy Delight', name: 'Dairy Delight Variety Pack 6x80g', sku: 'DD-VAR-001', price: 119.99, cost: 71.99, barcode: '6001234011001' },
  { category: 'Multipack', brand: 'Lunch Time', name: 'Lunch Time Multipack 12x48g', sku: 'LT-MUL-001', price: 129.99, cost: 77.99, barcode: '6001234011002' },
  { category: 'Multipack', brand: 'Fruity Bites', name: 'Fruity Bites Family Pack 3x125g', sku: 'FB-FAM-001', price: 59.99, cost: 35.99, barcode: '6001234011003' },
  
  { category: 'Chocolate', brand: 'Premium Gold', name: 'Premium Gold Easter Eggs 250g', sku: 'PG-EAS-001', price: 79.99, cost: 47.99, barcode: '6001234012001' },
  { category: 'Chocolate', brand: 'Dairy Delight', name: 'Dairy Delight Hearts 150g', sku: 'DD-HRT-001', price: 39.99, cost: 23.99, barcode: '6001234012002' },
  { category: 'Candy', brand: 'Sweet Treats', name: 'Sweet Treats Gift Box 400g', sku: 'SW-GIF-001', price: 69.99, cost: 41.99, barcode: '6001234012003' },
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

const seedCompanies = async () => {
  console.log('\n🏢 Creating 5 Companies with Tenants...');
  
  const companies = [];
  
  const companyConfigs = [
    {
      name: 'Pomades Confectionary',
      slug: 'pomades',
      code: 'POMADES',
      type: 'manufacturer',
      city: 'Johannesburg',
      state: 'Gauteng'
    },
    {
      name: 'Sweet Dreams Manufacturing',
      slug: 'sweetdreams',
      code: 'SWEETDREAMS',
      type: 'manufacturer',
      city: 'Cape Town',
      state: 'Western Cape'
    },
    {
      name: 'Rainbow Distributors',
      slug: 'rainbow',
      code: 'RAINBOW',
      type: 'distributor',
      city: 'Durban',
      state: 'KwaZulu-Natal'
    },
    {
      name: 'Fresh Foods Retail',
      slug: 'freshfoods',
      code: 'FRESHFOODS',
      type: 'retailer',
      city: 'Pretoria',
      state: 'Gauteng'
    },
    {
      name: 'Metro Wholesale',
      slug: 'metro',
      code: 'METRO',
      type: 'distributor',
      city: 'Bloemfontein',
      state: 'Free State',
      blank: true
    }
  ];
  
  for (const config of companyConfigs) {
    const tenant = await Tenant.create({
      name: config.name,
      slug: config.slug,
      domain: `${config.slug}.demo`,
      subscription: {
        plan: 'enterprise',
        status: 'active'
      },
      limits: {
        maxUsers: 50,
        maxProducts: 5000,
        maxCustomers: 2000
      },
      settings: {
        timezone: 'Africa/Johannesburg',
        currency: 'ZAR',
        language: 'en'
      }
    });
    
    const company = await Company.create({
      name: config.name,
      code: config.code,
      domain: config.slug,
      companyType: config.type,
      country: 'ZA',
      currency: 'ZAR',
      timezone: 'Africa/Johannesburg',
      address: {
        city: config.city,
        state: config.state,
        country: 'South Africa'
      },
      isActive: true
    });
    
    companies.push({ tenant, company, blank: config.blank || false });
  }
  
  console.log(`✅ Created ${companies.length} companies with tenants`);
  return companies;
};

// Seed Users for all companies
const seedAllUsers = async (companies) => {
  console.log('\n👥 Creating Users for all companies...');
  
  const allUsers = [];
  const credentials = [];
  
  for (const { tenant, company, blank } of companies) {
    if (blank) {
      const admin = await User.create({
        tenantId: tenant._id,
        companyId: company._id,
        employeeId: `${company.code}-001`,
        email: `admin@${company.code.toLowerCase()}.demo`,
        password: await bcrypt.hash('Demo@123', 10),
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        department: 'admin',
        isActive: true
      });
      allUsers.push(admin);
      credentials.push({ company: company.name, email: admin.email, password: 'Demo@123', role: 'admin' });
      continue;
    }
    
    const admin = await User.create({
      tenantId: tenant._id,
      companyId: company._id,
      employeeId: `${company.code}-001`,
      email: `admin@${company.code.toLowerCase()}.demo`,
      password: await bcrypt.hash('Demo@123', 10),
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      department: 'admin',
      isActive: true
    });
    allUsers.push(admin);
    credentials.push({ company: company.name, email: admin.email, password: 'Demo@123', role: 'admin' });
    
    const manager = await User.create({
      tenantId: tenant._id,
      companyId: company._id,
      employeeId: `${company.code}-002`,
      email: `manager@${company.code.toLowerCase()}.demo`,
      password: await bcrypt.hash('Demo@123', 10),
      firstName: 'Sales',
      lastName: 'Manager',
      role: 'manager',
      department: 'sales',
      isActive: true
    });
    allUsers.push(manager);
    credentials.push({ company: company.name, email: manager.email, password: 'Demo@123', role: 'manager' });
    
    const kam = await User.create({
      tenantId: tenant._id,
      companyId: company._id,
      employeeId: `${company.code}-003`,
      email: `kam@${company.code.toLowerCase()}.demo`,
      password: await bcrypt.hash('Demo@123', 10),
      firstName: 'Key Account',
      lastName: 'Manager',
      role: 'kam',
      department: 'sales',
      isActive: true
    });
    allUsers.push(kam);
    credentials.push({ company: company.name, email: kam.email, password: 'Demo@123', role: 'kam' });
  }
  
  console.log(`✅ Created ${allUsers.length} users`);
  return { users: allUsers, credentials };
};

// Seed Products for all companies
const seedAllProducts = async (companies) => {
  console.log('\n📦 Creating Products for all companies...');
  
  const allProducts = [];
  let companyIndex = 0;
  
  for (const { tenant, company, blank } of companies) {
    if (blank) continue; // Skip blank company
    
    let prodIndex = 0;
    for (const prod of saConfectionaryProducts) {
      const uniqueBarcode = `${prod.barcode.substring(0, 10)}${companyIndex}${prod.barcode.substring(11)}`;
      
      const product = await Product.create({
        tenantId: tenant._id,
        companyId: company._id,
        name: prod.name,
        sku: `${company.code}-${prod.sku}`,
        sapMaterialId: `MAT-${company.code}-${String(prodIndex).padStart(4, '0')}`,
        barcode: uniqueBarcode,
        category: prod.category,
        brand: prod.brand,
        productType: 'own_brand',
        description: `${prod.brand} ${prod.name} - Premium South African confectionary`,
        pricing: {
          listPrice: prod.price,
          costPrice: prod.cost,
          currency: 'ZAR'
        },
        inventory: {
          stockLevel: faker.number.int({ min: 500, max: 5000 }),
          reorderLevel: 200,
          unit: 'unit'
        },
        isActive: true
      });
      allProducts.push(product);
      prodIndex++;
    }
    companyIndex++;
  }
  
  console.log(`✅ Created ${allProducts.length} products`);
  return allProducts;
};

// Seed Customers for all companies
const seedAllCustomers = async (companies) => {
  console.log('\n🏪 Creating Customers for all companies...');
  
  const allCustomers = [];
  let customerIndex = 0;
  
  for (const { tenant, company, blank } of companies) {
    if (blank) continue; // Skip blank company
    
    for (const retailer of saRetailers) {
      const numStores = retailer.tier === 'National' ? 10 : (retailer.tier === 'Regional' ? 5 : 3);
      
      for (let i = 0; i < numStores; i++) {
        const region = faker.helpers.arrayElement(saRegions);
        
        const tierMap = {
          'National': 'platinum',
          'Regional': 'gold',
          'Premium': 'platinum',
          'Discount': 'silver'
        };
        
        const customer = await Customer.create({
          tenantId: tenant._id,
          companyId: company._id,
          sapCustomerId: `SAP-CUST-${company.code}-${String(customerIndex).padStart(5, '0')}`,
          name: `${retailer.name} - ${region} ${i + 1}`,
          code: `${company.code}-${retailer.name.substring(0, 3).toUpperCase()}-${region.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
          customerType: retailer.type.toLowerCase().replace(' ', '_') === 'supermarket' ? 'retailer' : 'wholesaler',
          tier: tierMap[retailer.tier] || 'standard',
          addresses: [{
            type: 'both',
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            state: region,
            country: 'South Africa',
            postalCode: faker.location.zipCode()
          }],
          contacts: [{
            name: faker.person.fullName(),
            email: `${retailer.name.toLowerCase().replace(' ', '.')}${i + 1}@example.com`,
            phone: faker.phone.number('+27 ## ### ####'),
            isPrimary: true
          }],
          status: 'active',
          creditLimit: faker.number.int({ min: 100000, max: 1000000 }),
          paymentTerms: 'NET30',
          currency: 'ZAR'
        });
        allCustomers.push(customer);
        customerIndex++;
      }
    }
  }
  
  console.log(`✅ Created ${allCustomers.length} customers`);
  return allCustomers;
};

// Seed Promotions (Last 12 months + next 3 months)
const seedPromotions = async (tenantId, companyId, products, customers, users, startCounter = 0) => {
  console.log('\n🎉 Creating Promotions...');
  
  const promotions = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);
  
  const promotionTypes = ['price_discount', 'volume_discount', 'bogo', 'bundle', 'display'];
  
  for (let i = 0; i < 30; i++) {
    const promotionStart = new Date(startDate);
    promotionStart.setDate(promotionStart.getDate() + (i * 6));
    
    const promotionEnd = new Date(promotionStart);
    promotionEnd.setDate(promotionEnd.getDate() + faker.number.int({ min: 7, max: 14 }));
    
    const selectedProducts = faker.helpers.arrayElements(products, faker.number.int({ min: 2, max: 5 }));
    const selectedCustomers = faker.helpers.arrayElements(customers, faker.number.int({ min: 3, max: 10 }));
    
    const promotionType = faker.helpers.arrayElement(promotionTypes);
    const discountValue = faker.number.int({ min: 10, max: 25 });
    
    const creator = users && users.length > 0 ? users[0]._id : null;
    
    const promotion = await Promotion.create({
      tenantId,
      companyId,
      promotionId: `PROMO-GLOBAL-${String(startCounter + i + 1).padStart(6, '0')}`,
      name: `${faker.helpers.arrayElement(['Summer', 'Winter', 'Spring', 'Holiday', 'Weekend', 'Back to School'])} ${faker.helpers.arrayElement(['Sale', 'Special', 'Promo', 'Deal'])} ${i + 1}`,
      description: faker.commerce.productDescription(),
      promotionType,
      period: {
        startDate: promotionStart,
        endDate: promotionEnd
      },
      mechanics: {
        discountType: 'percentage',
        discountValue: discountValue
      },
      status: promotionEnd < new Date() ? 'completed' : (promotionStart > new Date() ? 'draft' : 'active'),
      products: selectedProducts.map(p => ({
        product: p._id,
        regularPrice: p.pricing?.listPrice || 100,
        promotionalPrice: (p.pricing?.listPrice || 100) * (1 - discountValue / 100),
        expectedLift: faker.number.float({ min: 1.2, max: 2.5 })
      })),
      scope: {
        customers: selectedCustomers.map(c => ({
          customer: c._id
        }))
      },
      financial: {
        planned: {
          baselineVolume: faker.number.int({ min: 1000, max: 5000 }),
          promotionalVolume: faker.number.int({ min: 2000, max: 10000 }),
          incrementalVolume: faker.number.int({ min: 500, max: 3000 })
        },
        costs: {
          discountCost: faker.number.int({ min: 10000, max: 100000 }),
          marketingCost: faker.number.int({ min: 5000, max: 50000 })
        }
      },
      createdBy: creator
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
const seedBudgets = async (tenantId, companyId, users, startCounter = 0) => {
  console.log('\n💰 Creating Budgets...');
  
  const budgets = [];
  const currentYear = new Date().getFullYear();
  
  const quarters = [
    { name: 'Q1', start: new Date(currentYear, 0, 1), end: new Date(currentYear, 2, 31) },
    { name: 'Q2', start: new Date(currentYear, 3, 1), end: new Date(currentYear, 5, 30) },
    { name: 'Q3', start: new Date(currentYear, 6, 1), end: new Date(currentYear, 8, 30) },
    { name: 'Q4', start: new Date(currentYear, 9, 1), end: new Date(currentYear, 11, 31) }
  ];
  
  for (let i = 0; i < quarters.length; i++) {
    const quarter = quarters[i];
    const totalBudget = faker.number.int({ min: 2000000, max: 5000000 });
    const spent = quarter.end < new Date() ? faker.number.int({ min: totalBudget * 0.7, max: totalBudget * 0.95 }) : 
                  faker.number.int({ min: 0, max: totalBudget * 0.6 });
    
    const creator = users && users.length > 0 ? users[0]._id : null;
    
    const budget = await Budget.create({
      tenantId,
      company: companyId,
      name: `${currentYear} ${quarter.name} Trade Budget`,
      code: `BDG-GLOBAL-${String(startCounter + i + 1).padStart(6, '0')}`,
      year: currentYear,
      budgetType: 'budget',
      budgetCategory: 'trade_marketing',
      scope: {
        level: 'company'
      },
      status: quarter.end < new Date() ? 'locked' : (quarter.start > new Date() ? 'draft' : 'approved'),
      createdBy: creator
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
  
  if (!customers || customers.length === 0 || !users || users.length === 0) {
    console.log('⚠️  Skipping activities - no customers or users available');
    return [];
  }
  
  const activities = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 3);
  
  const availableUsers = users.filter(u => u.role === 'manager' || u.role === 'kam');
  const assignableUsers = availableUsers.length > 0 ? availableUsers : users;
  
  for (let i = 0; i < 50; i++) {
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
      assignedTo: faker.helpers.arrayElement(assignableUsers)._id,
      customerId: faker.helpers.arrayElement(customers)._id,
      promotionId: promotions && promotions.length > 0 ? faker.helpers.arrayElement([null, ...promotions.map(p => p._id)]) : null,
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
const seedVendors = async (tenantId, companyId, startCounter = 0) => {
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
  
  for (let i = 0; i < vendorNames.length; i++) {
    const name = vendorNames[i];
    const vendor = await Vendor.create({
      tenantId,
      companyId,
      name,
      code: `VEN-${name.substring(0, 3).toUpperCase()}-${String(startCounter + i + 1).padStart(4, '0')}`,
      sapVendorId: `SAP-VEN-GLOBAL-${String(startCounter + i + 1).padStart(6, '0')}`,
      vendorType: faker.helpers.arrayElement(['principal', 'manufacturer', 'distributor', 'importer', 'agent']),
      contacts: [{
        name: faker.person.fullName(),
        email: name.toLowerCase().replace(/ /g, '.') + '@example.com',
        phone: '+27 11 123 4567',
        isPrimary: true
      }],
      addresses: [{
        type: 'headquarters',
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.helpers.arrayElement(saRegions),
        country: 'South Africa',
        postalCode: faker.location.zipCode()
      }],
      paymentTerms: 'NET30',
      status: 'active'
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
    console.log('║   🌱 SA CONFECTIONARY SEED - 4 COMPANIES + 6 MONTHS     ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    
    await connectDB();
    await clearData();
    
    const companies = await seedCompanies();
    const { users, credentials } = await seedAllUsers(companies);
    const products = await seedAllProducts(companies);
    const customers = await seedAllCustomers(companies);
    
    let totalPromotions = 0, totalBudgets = 0, totalSales = 0, totalTradeSpends = 0;
    let globalPromoCounter = 0;
    let globalBudgetCounter = 0;
    let globalVendorCounter = 0;
    
    for (const { tenant, company, blank } of companies) {
      if (blank) continue;
      
      const companyProducts = products.filter(p => p.companyId && p.companyId.toString() === company._id.toString());
      const companyCustomers = customers.filter(c => c.companyId && c.companyId.toString() === company._id.toString());
      const companyUsers = users.filter(u => u.companyId && u.companyId.toString() === company._id.toString());
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Seeding 6 months data for ${company.name}...`);
      console.log(`${'='.repeat(60)}`);
      
      const promotions = await seedPromotions(tenant._id, company._id, companyProducts, companyCustomers, companyUsers, globalPromoCounter);
      globalPromoCounter += promotions.length;
      const budgets = await seedBudgets(tenant._id, company._id, companyUsers, globalBudgetCounter);
      globalBudgetCounter += budgets.length;
      const salesHistory = await seedSalesHistory(tenant._id, company._id, companyProducts, companyCustomers, promotions);
      const tradeSpends = await seedTradeSpends(tenant._id, company._id, companyCustomers, promotions);
      await seedTradingTerms(tenant._id, company._id, companyCustomers);
      await seedActivityGrid(tenant._id, company._id, companyCustomers, companyUsers, promotions);
      const vendors = await seedVendors(tenant._id, company._id, globalVendorCounter);
      globalVendorCounter += vendors.length;
      
      totalPromotions += promotions.length;
      totalBudgets += budgets.length;
      totalSales += salesHistory.length;
      totalTradeSpends += tradeSpends.length;
    }
    
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ SEED COMPLETE                       ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('\n📊 Summary:');
    console.log(`   • Companies: ${companies.length} (4 with data, 1 blank)`);
    console.log(`   • Users: ${users.length}`);
    console.log(`   • Products: ${products.length}`);
    console.log(`   • Customers: ${customers.length}`);
    console.log(`   • Promotions: ${totalPromotions}`);
    console.log(`   • Budgets: ${totalBudgets}`);
    console.log(`   • Sales Records: ${totalSales}`);
    console.log(`   • Trade Spends: ${totalTradeSpends}`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('━'.repeat(60));
    credentials.forEach(cred => {
      console.log(`\n${cred.company} (${cred.role}):`);
      console.log(`   Email: ${cred.email}`);
      console.log(`   Password: ${cred.password}`);
    });
    
    console.log('\n✅ All done! South African confectionary data loaded successfully!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
};

main();
