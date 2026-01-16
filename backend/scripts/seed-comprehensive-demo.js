/**
 * Comprehensive Demo Seed Script for TRADEAI
 * 
 * Creates realistic test data for three company types:
 * 1. Manufacturer (Sunrise Foods SA) - FMCG manufacturer with multiple brands
 * 2. Distributor (Metro Distribution) - Regional distributor serving retailers
 * 3. Retailer (FreshMart Stores) - Retail chain with multiple locations
 * 
 * Includes:
 * - Realistic products across FMCG categories
 * - Customer hierarchies (regions, channels, stores)
 * - Promotions with plan vs actual performance data
 * - Budgets with utilization tracking
 * - Trade spends with approval workflows
 * - Historical data for trend analysis
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const Company = require('../src/models/Company');
const User = require('../src/models/User');
const Customer = require('../src/models/Customer');
const Product = require('../src/models/Product');
const Promotion = require('../src/models/Promotion');
const Budget = require('../src/models/Budget');
const TradeSpend = require('../src/models/TradeSpend');
const Vendor = require('../src/models/Vendor');

// Helper functions
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const randomFromArray = (arr) => arr[Math.floor(Math.random() * arr.length)];
const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
const subtractDays = (date, days) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000);

// South African context data
const SA_REGIONS = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Mpumalanga', 'Limpopo', 'North West', 'Northern Cape'];
const SA_CITIES = {
  'Gauteng': ['Johannesburg', 'Pretoria', 'Sandton', 'Midrand', 'Centurion'],
  'Western Cape': ['Cape Town', 'Stellenbosch', 'Paarl', 'Somerset West'],
  'KwaZulu-Natal': ['Durban', 'Pietermaritzburg', 'Umhlanga', 'Ballito'],
  'Eastern Cape': ['Port Elizabeth', 'East London', 'Mthatha'],
  'Free State': ['Bloemfontein', 'Welkom'],
  'Mpumalanga': ['Nelspruit', 'Witbank'],
  'Limpopo': ['Polokwane', 'Tzaneen'],
  'North West': ['Rustenburg', 'Potchefstroom'],
  'Northern Cape': ['Kimberley', 'Upington']
};

// FMCG Product Categories
const PRODUCT_CATEGORIES = {
  'Beverages': {
    subcategories: ['Carbonated Soft Drinks', 'Juices', 'Water', 'Energy Drinks', 'Iced Tea'],
    brands: ['Sunrise Refresh', 'Pure Valley', 'Energize', 'Cool Wave']
  },
  'Snacks': {
    subcategories: ['Chips', 'Nuts', 'Biscuits', 'Crackers', 'Popcorn'],
    brands: ['Crunch Master', 'Nutty Delight', 'Golden Bites']
  },
  'Confectionery': {
    subcategories: ['Chocolate', 'Candy', 'Gum', 'Mints'],
    brands: ['Sweet Dreams', 'Choco Bliss', 'Minty Fresh']
  },
  'Dairy': {
    subcategories: ['Milk', 'Yogurt', 'Cheese', 'Butter', 'Cream'],
    brands: ['Farm Fresh', 'Creamy Goodness', 'Pure Dairy']
  },
  'Personal Care': {
    subcategories: ['Shampoo', 'Soap', 'Deodorant', 'Toothpaste', 'Skincare'],
    brands: ['Clean & Fresh', 'Natural Glow', 'Daily Care']
  },
  'Home Care': {
    subcategories: ['Detergent', 'Dishwashing', 'Surface Cleaners', 'Air Fresheners'],
    brands: ['Sparkle Clean', 'Home Shine', 'Fresh Air']
  }
};

// Retailer types
const RETAILER_TYPES = ['chain', 'independent', 'wholesaler', 'online'];
const CHANNELS = ['modern_trade', 'traditional_trade', 'horeca', 'ecommerce'];
const TIERS = ['platinum', 'gold', 'silver', 'bronze', 'standard'];

// Promotion types
const PROMOTION_TYPES = ['price_discount', 'volume_discount', 'bogo', 'bundle', 'display', 'feature'];

async function seedComprehensiveDemo() {
  try {
    console.log('Starting comprehensive demo seed...');
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tradeai', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');

    // Clear existing demo data (optional - comment out to preserve)
    console.log('Clearing existing demo data...');
    await clearDemoData();

    // Create companies
    console.log('\n=== Creating Companies ===');
    const companies = await createCompanies();
    
    // Create users for each company
    console.log('\n=== Creating Users ===');
    const users = await createUsers(companies);
    
    // Create vendors (for manufacturer)
    console.log('\n=== Creating Vendors ===');
    const vendors = await createVendors(companies.manufacturer);
    
    // Create products for manufacturer
    console.log('\n=== Creating Products ===');
    const products = await createProducts(companies.manufacturer, users.manufacturer);
    
    // Create customers for each company type
    console.log('\n=== Creating Customers ===');
    const customers = await createCustomers(companies, users);
    
    // Create budgets
    console.log('\n=== Creating Budgets ===');
    const budgets = await createBudgets(companies, users);
    
    // Create promotions with plan vs actual data
    console.log('\n=== Creating Promotions ===');
    const promotions = await createPromotions(companies.manufacturer, users.manufacturer, products, customers.manufacturer, budgets.manufacturer);
    
    // Create trade spends with approval workflows
    console.log('\n=== Creating Trade Spends ===');
    await createTradeSpends(companies.manufacturer, users.manufacturer, products, customers.manufacturer, budgets.manufacturer, promotions);
    
    console.log('\n=== Seed Complete ===');
    console.log('Demo data created successfully!');
    console.log('\nLogin credentials:');
    console.log('Manufacturer Admin: admin@sunrisefoods.co.za / Demo@123');
    console.log('Distributor Admin: admin@metrodist.co.za / Demo@123');
    console.log('Retailer Admin: admin@freshmart.co.za / Demo@123');
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

async function clearDemoData() {
  // Only clear demo companies and their related data
  const demoCompanyCodes = ['SUNRISE', 'METRODIST', 'FRESHMART'];
  
  const companies = await Company.find({ code: { $in: demoCompanyCodes } });
  const companyIds = companies.map(c => c._id);
  
  if (companyIds.length > 0) {
    await User.deleteMany({ companyId: { $in: companyIds } });
    await Customer.deleteMany({ company: { $in: companyIds } });
    await Product.deleteMany({ company: { $in: companyIds } });
    await Promotion.deleteMany({ company: { $in: companyIds } });
    await Budget.deleteMany({ company: { $in: companyIds } });
    await TradeSpend.deleteMany({ company: { $in: companyIds } });
    await Vendor.deleteMany({ company: { $in: companyIds } });
    await Company.deleteMany({ code: { $in: demoCompanyCodes } });
  }
}

async function createCompanies() {
  const companiesData = [
    {
      name: 'Sunrise Foods SA',
      code: 'SUNRISE',
      domain: 'sunrisefoods.co.za',
      companyType: 'manufacturer',
      industry: 'fmcg',
      country: 'ZA',
      currency: 'ZAR',
      timezone: 'Africa/Johannesburg',
      address: {
        street: '123 Industrial Drive',
        city: 'Johannesburg',
        state: 'Gauteng',
        country: 'South Africa',
        postalCode: '2001'
      },
      contactInfo: {
        phone: '+27 11 123 4567',
        email: 'info@sunrisefoods.co.za',
        website: 'www.sunrisefoods.co.za'
      },
      subscription: {
        plan: 'enterprise',
        status: 'active',
        maxUsers: 100,
        maxCustomers: 5000,
        maxProducts: 10000
      }
    },
    {
      name: 'Metro Distribution',
      code: 'METRODIST',
      domain: 'metrodist.co.za',
      companyType: 'distributor',
      industry: 'distribution',
      country: 'ZA',
      currency: 'ZAR',
      timezone: 'Africa/Johannesburg',
      address: {
        street: '456 Logistics Park',
        city: 'Pretoria',
        state: 'Gauteng',
        country: 'South Africa',
        postalCode: '0001'
      },
      contactInfo: {
        phone: '+27 12 456 7890',
        email: 'info@metrodist.co.za',
        website: 'www.metrodist.co.za'
      },
      subscription: {
        plan: 'professional',
        status: 'active',
        maxUsers: 50,
        maxCustomers: 2000,
        maxProducts: 5000
      }
    },
    {
      name: 'FreshMart Stores',
      code: 'FRESHMART',
      domain: 'freshmart.co.za',
      companyType: 'retailer',
      industry: 'retail',
      country: 'ZA',
      currency: 'ZAR',
      timezone: 'Africa/Johannesburg',
      address: {
        street: '789 Retail Boulevard',
        city: 'Cape Town',
        state: 'Western Cape',
        country: 'South Africa',
        postalCode: '8001'
      },
      contactInfo: {
        phone: '+27 21 789 0123',
        email: 'info@freshmart.co.za',
        website: 'www.freshmart.co.za'
      },
      subscription: {
        plan: 'professional',
        status: 'active',
        maxUsers: 30,
        maxCustomers: 500,
        maxProducts: 2000
      }
    }
  ];

  const companies = {};
  for (const data of companiesData) {
    const company = await Company.create(data);
    companies[data.companyType] = company;
    console.log(`Created company: ${company.name} (${company.companyType})`);
  }
  
  return companies;
}

async function createUsers(companies) {
  const hashedPassword = await bcrypt.hash('Demo@123', 10);
  
  const usersConfig = {
    manufacturer: [
      { firstName: 'Admin', lastName: 'User', email: 'admin@sunrisefoods.co.za', role: 'admin', department: 'admin', employeeId: 'SF001' },
      { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@sunrisefoods.co.za', role: 'manager', department: 'sales', employeeId: 'SF002' },
      { firstName: 'Michael', lastName: 'Chen', email: 'michael.chen@sunrisefoods.co.za', role: 'kam', department: 'sales', employeeId: 'SF003' },
      { firstName: 'Lisa', lastName: 'Naidoo', email: 'lisa.naidoo@sunrisefoods.co.za', role: 'kam', department: 'sales', employeeId: 'SF004' },
      { firstName: 'David', lastName: 'Mokoena', email: 'david.mokoena@sunrisefoods.co.za', role: 'analyst', department: 'finance', employeeId: 'SF005' },
      { firstName: 'Emma', lastName: 'van der Berg', email: 'emma.vdb@sunrisefoods.co.za', role: 'manager', department: 'marketing', employeeId: 'SF006' },
      { firstName: 'James', lastName: 'Pillay', email: 'james.pillay@sunrisefoods.co.za', role: 'user', department: 'operations', employeeId: 'SF007' }
    ],
    distributor: [
      { firstName: 'Admin', lastName: 'User', email: 'admin@metrodist.co.za', role: 'admin', department: 'admin', employeeId: 'MD001' },
      { firstName: 'Peter', lastName: 'Botha', email: 'peter.botha@metrodist.co.za', role: 'manager', department: 'sales', employeeId: 'MD002' },
      { firstName: 'Nomsa', lastName: 'Dlamini', email: 'nomsa.dlamini@metrodist.co.za', role: 'kam', department: 'sales', employeeId: 'MD003' },
      { firstName: 'John', lastName: 'Smith', email: 'john.smith@metrodist.co.za', role: 'analyst', department: 'finance', employeeId: 'MD004' }
    ],
    retailer: [
      { firstName: 'Admin', lastName: 'User', email: 'admin@freshmart.co.za', role: 'admin', department: 'admin', employeeId: 'FM001' },
      { firstName: 'Thandi', lastName: 'Zulu', email: 'thandi.zulu@freshmart.co.za', role: 'manager', department: 'operations', employeeId: 'FM002' },
      { firstName: 'Robert', lastName: 'Williams', email: 'robert.williams@freshmart.co.za', role: 'analyst', department: 'finance', employeeId: 'FM003' }
    ]
  };

  const users = { manufacturer: [], distributor: [], retailer: [] };
  
  for (const [companyType, userList] of Object.entries(usersConfig)) {
    const company = companies[companyType];
    for (const userData of userList) {
      const user = await User.create({
        ...userData,
        password: hashedPassword,
        companyId: company._id,
        tenantId: company._id,
        isActive: true,
        approvalLimits: {
          marketing: userData.role === 'admin' ? 1000000 : userData.role === 'manager' ? 500000 : 100000,
          cashCoop: userData.role === 'admin' ? 500000 : userData.role === 'manager' ? 250000 : 50000,
          tradingTerms: userData.role === 'admin' ? 1000000 : userData.role === 'manager' ? 500000 : 100000,
          promotions: userData.role === 'admin' ? 1000000 : userData.role === 'manager' ? 500000 : 100000
        }
      });
      users[companyType].push(user);
      console.log(`Created user: ${user.firstName} ${user.lastName} (${companyType})`);
    }
  }
  
  return users;
}

async function createVendors(company) {
  const vendorsData = [
    { name: 'Global Ingredients Ltd', code: 'GIL', category: 'Raw Materials', country: 'ZA', vendorType: 'manufacturer', sapVendorId: 'VEND-GIL-001' },
    { name: 'PackRight Solutions', code: 'PRS', category: 'Packaging', country: 'ZA', vendorType: 'manufacturer', sapVendorId: 'VEND-PRS-002' },
    { name: 'FlavorTech Industries', code: 'FTI', category: 'Flavoring', country: 'ZA', vendorType: 'manufacturer', sapVendorId: 'VEND-FTI-003' },
    { name: 'EcoPackage SA', code: 'EPS', category: 'Sustainable Packaging', country: 'ZA', vendorType: 'manufacturer', sapVendorId: 'VEND-EPS-004' }
  ];

  const vendors = [];
  for (const data of vendorsData) {
    const vendor = await Vendor.create({
      ...data,
      company: company._id,
      tenantId: company._id,
      status: 'active',
      contacts: [{
        name: `Contact at ${data.name}`,
        email: `info@${data.code.toLowerCase()}.co.za`,
        phone: '+27 11 ' + randomBetween(100, 999) + ' ' + randomBetween(1000, 9999),
        isPrimary: true
      }]
    });
    vendors.push(vendor);
    console.log(`Created vendor: ${vendor.name}`);
  }
  
  return vendors;
}

async function createProducts(company, users) {
  const products = [];
  let productCount = 0;
  
  for (const [category, config] of Object.entries(PRODUCT_CATEGORIES)) {
    for (const subcategory of config.subcategories) {
      for (const brand of config.brands) {
        // Create 2-4 variants per brand/subcategory combination
        const variants = randomBetween(2, 4);
        for (let v = 0; v < variants; v++) {
          const sizes = ['250ml', '500ml', '1L', '2L', '100g', '200g', '500g', '1kg'];
          const size = randomFromArray(sizes);
          const listPrice = randomFloat(15, 150);
          const costPrice = listPrice * randomFloat(0.4, 0.6);
          
          const product = await Product.create({
            company: company._id,
            tenantId: company._id,
            sapMaterialId: `SAP${String(productCount + 1).padStart(6, '0')}`,
            name: `${brand} ${subcategory} ${size}`,
            sku: `${brand.substring(0, 3).toUpperCase()}${subcategory.substring(0, 3).toUpperCase()}${String(productCount + 1).padStart(4, '0')}`,
            barcode: `6001234${String(productCount + 1).padStart(6, '0')}`,
            description: `${brand} ${subcategory} - ${size} pack`,
            hierarchy: {
              level1: { id: category, name: category, code: category.substring(0, 3).toUpperCase() },
              level2: { id: subcategory, name: subcategory, code: subcategory.substring(0, 3).toUpperCase() },
              level3: { id: brand, name: brand, code: brand.substring(0, 3).toUpperCase() }
            },
            productType: 'own_brand',
            category: category,
            brand: brand,
            attributes: {
              size: size,
              weight: parseFloat(size) || randomBetween(100, 1000),
              weightUnit: size.includes('ml') || size.includes('L') ? 'ml' : 'g',
              unitsPerCase: randomBetween(6, 24),
              casesPerPallet: randomBetween(40, 80)
            },
            pricing: {
              listPrice: listPrice,
              currency: 'ZAR',
              costPrice: costPrice,
              marginPercentage: ((listPrice - costPrice) / listPrice) * 100
            },
            performance: {
              lastYearSales: { units: randomBetween(10000, 100000), value: randomBetween(500000, 5000000) },
              currentYearTarget: { units: randomBetween(12000, 120000), value: randomBetween(600000, 6000000) },
              currentYearActual: { units: randomBetween(8000, 110000), value: randomBetween(400000, 5500000) }
            },
            promotionSettings: {
              isPromotable: true,
              maxDiscountPercentage: randomBetween(15, 35),
              allowedPromotionTypes: ['price_discount', 'volume_discount', 'bogo', 'bundle']
            },
            status: 'active'
          });
          
          products.push(product);
          productCount++;
        }
      }
    }
  }
  
  console.log(`Created ${products.length} products`);
  return products;
}

async function createCustomers(companies, users) {
  const customers = { manufacturer: [], distributor: [], retailer: [] };
  
  // For manufacturer: Create retailer customers (chains and independents)
  const retailerNames = [
    { name: 'Pick n Pay', code: 'PNP', type: 'chain', tier: 'platinum', channel: 'modern_trade' },
    { name: 'Shoprite', code: 'SHP', type: 'chain', tier: 'platinum', channel: 'modern_trade' },
    { name: 'Checkers', code: 'CHK', type: 'chain', tier: 'platinum', channel: 'modern_trade' },
    { name: 'Woolworths', code: 'WOL', type: 'chain', tier: 'platinum', channel: 'modern_trade' },
    { name: 'Spar', code: 'SPR', type: 'chain', tier: 'gold', channel: 'modern_trade' },
    { name: 'Makro', code: 'MAK', type: 'wholesaler', tier: 'gold', channel: 'modern_trade' },
    { name: 'Game', code: 'GAM', type: 'chain', tier: 'gold', channel: 'modern_trade' },
    { name: 'Clicks', code: 'CLK', type: 'chain', tier: 'silver', channel: 'modern_trade' },
    { name: 'Dis-Chem', code: 'DSC', type: 'chain', tier: 'silver', channel: 'modern_trade' },
    { name: 'OK Foods', code: 'OKF', type: 'chain', tier: 'silver', channel: 'traditional_trade' },
    { name: 'Boxer', code: 'BOX', type: 'chain', tier: 'bronze', channel: 'traditional_trade' },
    { name: 'Usave', code: 'USA', type: 'chain', tier: 'bronze', channel: 'traditional_trade' }
  ];

  // Create customers for manufacturer
  for (const retailer of retailerNames) {
    // Create regional stores for each retailer
    for (const region of SA_REGIONS.slice(0, 5)) { // Top 5 regions
      const cities = SA_CITIES[region] || [region];
      for (const city of cities.slice(0, 2)) { // Top 2 cities per region
        const storeCount = retailer.tier === 'platinum' ? randomBetween(3, 5) : randomBetween(1, 3);
        
        for (let s = 0; s < storeCount; s++) {
          const customer = await Customer.create({
            company: companies.manufacturer._id,
            tenantId: companies.manufacturer._id,
            name: `${retailer.name} ${city} ${s > 0 ? `Store ${s + 1}` : 'Main'}`,
            code: `${retailer.code}${region.substring(0, 2).toUpperCase()}${city.substring(0, 2).toUpperCase()}${String(s + 1).padStart(2, '0')}`,
            sapCustomerId: `SAP${retailer.code}${String(customers.manufacturer.length + 1).padStart(5, '0')}`,
            hierarchy: {
              level1: { id: region, name: region, code: region.substring(0, 3).toUpperCase() },
              level2: { id: city, name: city, code: city.substring(0, 3).toUpperCase() },
              level3: { id: retailer.name, name: retailer.name, code: retailer.code }
            },
            customerType: retailer.type,
            channel: retailer.channel,
            tier: retailer.tier,
            contacts: [{
              name: `Store Manager`,
              position: 'Store Manager',
              email: `manager.${city.toLowerCase()}@${retailer.name.toLowerCase().replace(/\s/g, '')}.co.za`,
              phone: '+27 ' + randomBetween(10, 99) + ' ' + randomBetween(100, 999) + ' ' + randomBetween(1000, 9999),
              isPrimary: true
            }],
            addresses: [{
              type: 'both',
              street: `${randomBetween(1, 999)} ${randomFromArray(['Main', 'High', 'Market', 'Church', 'Long'])} Street`,
              city: city,
              state: region,
              country: 'South Africa',
              postalCode: String(randomBetween(1000, 9999))
            }],
            creditLimit: retailer.tier === 'platinum' ? 5000000 : retailer.tier === 'gold' ? 2000000 : 500000,
            paymentTerms: retailer.tier === 'platinum' ? 'NET60' : 'NET30',
            currency: 'ZAR',
            budgetAllocations: {
              marketing: { annual: randomBetween(100000, 1000000), ytd: 0, available: randomBetween(100000, 1000000) },
              cashCoop: { annual: randomBetween(50000, 500000), ytd: 0, available: randomBetween(50000, 500000) },
              tradingTerms: { annual: randomBetween(200000, 2000000), ytd: 0, available: randomBetween(200000, 2000000) }
            },
            performance: {
              lastYearSales: randomBetween(1000000, 50000000),
              currentYearTarget: randomBetween(1200000, 60000000),
              currentYearActual: randomBetween(800000, 55000000),
              growthRate: randomFloat(-10, 25),
              marketShare: randomFloat(1, 15)
            },
            accountManager: users.manufacturer.find(u => u.role === 'kam')?._id,
            status: 'active',
            complianceStatus: 'compliant'
          });
          
          customers.manufacturer.push(customer);
        }
      }
    }
  }
  
  console.log(`Created ${customers.manufacturer.length} customers for manufacturer`);
  
  // Create customers for distributor (smaller retailers and wholesalers)
  const smallRetailers = ['Local Superette', 'Corner Store', 'Mini Mart', 'Quick Shop', 'Family Store'];
  for (let i = 0; i < 30; i++) {
    const region = randomFromArray(SA_REGIONS);
    const city = randomFromArray(SA_CITIES[region] || [region]);
    const name = `${randomFromArray(smallRetailers)} ${city} ${i + 1}`;
    
    const customer = await Customer.create({
      company: companies.distributor._id,
      tenantId: companies.distributor._id,
      name: name,
      code: `DIST${String(i + 1).padStart(4, '0')}`,
      sapCustomerId: `SAPDIST${String(i + 1).padStart(5, '0')}`,
      customerType: 'independent',
      channel: 'traditional_trade',
      tier: randomFromArray(['silver', 'bronze', 'standard']),
      hierarchy: {
        level1: { id: region, name: region, code: region.substring(0, 3).toUpperCase() },
        level2: { id: city, name: city, code: city.substring(0, 3).toUpperCase() }
      },
      addresses: [{
        type: 'both',
        city: city,
        state: region,
        country: 'South Africa'
      }],
      creditLimit: randomBetween(50000, 200000),
      paymentTerms: 'NET30',
      currency: 'ZAR',
      performance: {
        lastYearSales: randomBetween(100000, 1000000),
        currentYearTarget: randomBetween(120000, 1200000),
        currentYearActual: randomBetween(80000, 1100000)
      },
      status: 'active'
    });
    
    customers.distributor.push(customer);
  }
  
  console.log(`Created ${customers.distributor.length} customers for distributor`);
  
  // Create store locations for retailer (internal cost centers)
  for (let i = 0; i < 15; i++) {
    const region = randomFromArray(SA_REGIONS.slice(0, 5));
    const city = randomFromArray(SA_CITIES[region] || [region]);
    
    const customer = await Customer.create({
      company: companies.retailer._id,
      tenantId: companies.retailer._id,
      name: `FreshMart ${city} ${i > 0 ? `Branch ${i + 1}` : 'Flagship'}`,
      code: `FM${String(i + 1).padStart(3, '0')}`,
      sapCustomerId: `SAPFM${String(i + 1).padStart(5, '0')}`,
      customerType: 'chain',
      channel: 'modern_trade',
      tier: i === 0 ? 'platinum' : randomFromArray(['gold', 'silver']),
      hierarchy: {
        level1: { id: region, name: region, code: region.substring(0, 3).toUpperCase() },
        level2: { id: city, name: city, code: city.substring(0, 3).toUpperCase() }
      },
      addresses: [{
        type: 'both',
        city: city,
        state: region,
        country: 'South Africa'
      }],
      performance: {
        lastYearSales: randomBetween(5000000, 50000000),
        currentYearTarget: randomBetween(6000000, 60000000),
        currentYearActual: randomBetween(4000000, 55000000)
      },
      status: 'active'
    });
    
    customers.retailer.push(customer);
  }
  
  console.log(`Created ${customers.retailer.length} customers for retailer`);
  
  return customers;
}

async function createBudgets(companies, users) {
  const budgets = { manufacturer: [], distributor: [], retailer: [] };
  const currentYear = new Date().getFullYear();
  
  // Create budgets for manufacturer
  const budgetTypes = [
    { name: 'Marketing Budget', code: 'MKT', budgetType: 'budget', budgetCategory: 'marketing', totalAmount: 50000000 },
    { name: 'Trade Marketing Budget', code: 'TRD', budgetType: 'budget', budgetCategory: 'trade_marketing', totalAmount: 80000000 },
    { name: 'Q1 Forecast', code: 'Q1F', budgetType: 'forecast', budgetCategory: 'marketing', totalAmount: 15000000 },
    { name: 'Revised Budget', code: 'REV', budgetType: 'revised_budget', budgetCategory: 'trade_marketing', totalAmount: 85000000 }
  ];

  for (const bt of budgetTypes) {
    const monthlyBudget = bt.totalAmount / 12;
    const budgetLines = [];
    
    for (let month = 1; month <= 12; month++) {
      const variance = randomFloat(0.8, 1.2);
      const monthBudget = monthlyBudget * variance;
      const spent = month <= new Date().getMonth() + 1 ? monthBudget * randomFloat(0.6, 1.1) : 0;
      
      budgetLines.push({
        month: month,
        sales: {
          units: randomBetween(100000, 500000),
          value: randomBetween(5000000, 25000000)
        },
        tradeSpend: {
          marketing: { budget: monthBudget * 0.3, allocated: monthBudget * 0.25, committed: spent * 0.8, spent: spent * 0.3 },
          cashCoop: { budget: monthBudget * 0.2, allocated: monthBudget * 0.15, committed: spent * 0.5, spent: spent * 0.2 },
          tradingTerms: { budget: monthBudget * 0.3, allocated: monthBudget * 0.25, committed: spent * 0.7, spent: spent * 0.3 },
          promotions: { budget: monthBudget * 0.2, allocated: monthBudget * 0.2, committed: spent * 0.6, spent: spent * 0.2 }
        },
        profitability: {
          grossMargin: randomFloat(25, 40),
          netMargin: randomFloat(8, 15),
          roi: randomFloat(150, 350)
        }
      });
    }

    const totalSpent = budgetLines.reduce((sum, line) => {
      return sum + (line.tradeSpend.marketing.spent + line.tradeSpend.cashCoop.spent + 
                    line.tradeSpend.tradingTerms.spent + line.tradeSpend.promotions.spent);
    }, 0);

    const budget = await Budget.create({
      company: companies.manufacturer._id,
      name: `${bt.name} ${currentYear}`,
      code: `${bt.code}${currentYear}`,
      year: currentYear,
      budgetType: bt.budgetType,
      budgetCategory: bt.budgetCategory,
      version: 1,
      status: bt.budgetType === 'budget' ? 'approved' : 'draft',
      scope: { level: 'company' },
      budgetLines: budgetLines,
      allocated: bt.totalAmount,
      spent: totalSpent,
      remaining: bt.totalAmount - totalSpent,
      approvals: [
        { level: 'manager', status: 'approved', date: subtractDays(new Date(), 60) },
        { level: 'director', status: 'approved', date: subtractDays(new Date(), 55) },
        { level: 'finance', status: 'approved', date: subtractDays(new Date(), 50) }
      ],
      createdBy: users.manufacturer[0]._id,
      lastModifiedBy: users.manufacturer[0]._id
    });
    
    budgets.manufacturer.push(budget);
    console.log(`Created budget: ${budget.name}`);
  }
  
  return budgets;
}

async function createPromotions(company, users, products, customers, budgets) {
  const promotions = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Create promotions for different time periods
  const promotionConfigs = [
    // Completed promotions (past) - with actual performance data
    { name: 'Summer Refresh Campaign', type: 'price_discount', status: 'completed', daysAgo: 90, duration: 14, category: 'Beverages' },
    { name: 'Back to School Snacks', type: 'volume_discount', status: 'completed', daysAgo: 75, duration: 21, category: 'Snacks' },
    { name: 'Easter Chocolate Festival', type: 'bogo', status: 'completed', daysAgo: 60, duration: 10, category: 'Confectionery' },
    { name: 'Dairy Days Promotion', type: 'bundle', status: 'completed', daysAgo: 45, duration: 14, category: 'Dairy' },
    { name: 'Clean Home Week', type: 'bundle', status: 'completed', daysAgo: 30, duration: 7, category: 'Home Care' },
    
    // Active promotions (current)
    { name: 'Winter Warmers', type: 'price_discount', status: 'active', daysAgo: 5, duration: 21, category: 'Beverages' },
    { name: 'Family Snack Pack', type: 'bundle', status: 'active', daysAgo: 3, duration: 14, category: 'Snacks' },
    
    // Approved promotions (upcoming)
    { name: 'Spring Fresh Launch', type: 'gift', status: 'approved', daysAgo: -14, duration: 21, category: 'Personal Care' },
    { name: 'Holiday Season Kickoff', type: 'price_discount', status: 'approved', daysAgo: -30, duration: 28, category: 'Confectionery' },
    
    // Pending approval
    { name: 'New Year New You', type: 'volume_discount', status: 'pending_approval', daysAgo: -45, duration: 14, category: 'Personal Care' },
    { name: 'Summer BBQ Essentials', type: 'bundle', status: 'pending_approval', daysAgo: -60, duration: 21, category: 'Beverages' },
    
    // Draft promotions
    { name: 'Q2 Trade Push', type: 'loyalty', status: 'draft', daysAgo: -90, duration: 30, category: 'Snacks' }
  ];

  for (const config of promotionConfigs) {
    const startDate = subtractDays(now, config.daysAgo);
    const endDate = addDays(startDate, config.duration);
    
    // Select products from the category
    const categoryProducts = products.filter(p => p.category === config.category).slice(0, randomBetween(3, 8));
    const selectedCustomers = customers.slice(0, randomBetween(5, 15));
    
    // Calculate planned metrics
    const plannedBaselineVolume = randomBetween(50000, 200000);
    const plannedLift = randomFloat(15, 45);
    const plannedIncrementalVolume = Math.round(plannedBaselineVolume * (plannedLift / 100));
    const plannedPromotionalVolume = plannedBaselineVolume + plannedIncrementalVolume;
    const avgPrice = categoryProducts.length > 0 ? categoryProducts.reduce((sum, p) => sum + p.pricing.listPrice, 0) / categoryProducts.length : 50;
    const discountPercent = randomFloat(10, 25);
    const promotionalPrice = avgPrice * (1 - discountPercent / 100);
    
    const plannedBaselineRevenue = plannedBaselineVolume * avgPrice;
    const plannedPromotionalRevenue = plannedPromotionalVolume * promotionalPrice;
    const plannedIncrementalRevenue = plannedPromotionalRevenue - plannedBaselineRevenue;
    
    // Calculate costs
    const discountCost = plannedPromotionalVolume * (avgPrice - promotionalPrice);
    const marketingCost = randomBetween(50000, 200000);
    const displayCost = config.type === 'display' ? randomBetween(100000, 300000) : randomBetween(10000, 50000);
    const totalCost = discountCost + marketingCost + displayCost;
    
    // Calculate actual metrics (only for completed/active promotions)
    let actualData = null;
    let performanceData = null;
    
    if (config.status === 'completed' || config.status === 'active') {
      // Simulate variance from plan (-20% to +30%)
      const volumeVariance = randomFloat(0.8, 1.3);
      const revenueVariance = randomFloat(0.75, 1.25);
      
      const actualBaselineVolume = Math.round(plannedBaselineVolume * randomFloat(0.9, 1.1));
      const actualPromotionalVolume = Math.round(plannedPromotionalVolume * volumeVariance);
      const actualIncrementalVolume = actualPromotionalVolume - actualBaselineVolume;
      const actualLift = (actualIncrementalVolume / actualBaselineVolume) * 100;
      
      const actualBaselineRevenue = actualBaselineVolume * avgPrice;
      const actualPromotionalRevenue = actualPromotionalVolume * promotionalPrice * revenueVariance;
      const actualIncrementalRevenue = actualPromotionalRevenue - actualBaselineRevenue;
      
      actualData = {
        baselineVolume: actualBaselineVolume,
        promotionalVolume: actualPromotionalVolume,
        incrementalVolume: actualIncrementalVolume,
        volumeLift: actualLift,
        baselineRevenue: actualBaselineRevenue,
        promotionalRevenue: actualPromotionalRevenue,
        incrementalRevenue: actualIncrementalRevenue
      };
      
      // Performance metrics
      const actualROI = ((actualIncrementalRevenue - totalCost) / totalCost) * 100;
      const effectiveness = actualROI > 200 ? 'Excellent' : actualROI > 100 ? 'Good' : actualROI > 50 ? 'Average' : actualROI > 0 ? 'Below Average' : 'Poor';
      
      performanceData = {
        baseline: {
          avgWeeklyVolume: actualBaselineVolume / (config.duration / 7),
          avgWeeklyRevenue: actualBaselineRevenue / (config.duration / 7),
          avgPrice: avgPrice,
          volatility: randomFloat(5, 15)
        },
        promotion: {
          totalVolume: actualPromotionalVolume,
          totalRevenue: actualPromotionalRevenue,
          avgPrice: promotionalPrice,
          peakDayVolume: Math.round(actualPromotionalVolume / config.duration * randomFloat(1.5, 2.5)),
          stockouts: randomBetween(0, 3)
        },
        post: {
          avgWeeklyVolume: actualBaselineVolume * randomFloat(0.85, 1.05) / (config.duration / 7),
          avgWeeklyRevenue: actualBaselineRevenue * randomFloat(0.85, 1.05) / (config.duration / 7),
          pantryLoading: randomFloat(5, 20),
          returnToBaseline: randomBetween(7, 21)
        },
        metrics: {
          trueLift: actualLift - randomFloat(2, 8), // Account for pantry loading
          incrementalProfit: actualIncrementalRevenue - totalCost,
          effectiveness: actualROI,
          efficiency: (actualIncrementalRevenue / totalCost) * 100,
          score: randomFloat(60, 95)
        }
      };
    }

    const promotion = await Promotion.create({
      company: company._id,
      tenantId: company._id,
      promotionId: generateId('PROMO'),
      name: config.name,
      description: `${config.name} - ${config.category} promotion targeting key retail accounts`,
      promotionType: config.type,
      mechanics: {
        discountType: config.type === 'price_discount' ? 'percentage' : config.type === 'volume_discount' ? 'fixed_amount' : 'percentage',
        discountValue: discountPercent,
        buyQuantity: config.type === 'bogo' ? 2 : config.type === 'volume_discount' ? 3 : null,
        getQuantity: config.type === 'bogo' ? 1 : null,
        minimumPurchase: config.type === 'volume_discount' ? randomBetween(100, 500) : null
      },
      period: {
        startDate: startDate,
        endDate: endDate,
        sellInStartDate: subtractDays(startDate, 7),
        sellInEndDate: subtractDays(startDate, 1)
      },
      scope: {
        customers: selectedCustomers.map(c => ({ customer: c._id })),
        channels: [randomFromArray(CHANNELS)],
        regions: SA_REGIONS.slice(0, randomBetween(3, 6))
      },
      products: categoryProducts.map(p => ({
        product: p._id,
        regularPrice: p.pricing.listPrice,
        promotionalPrice: p.pricing.listPrice * (1 - discountPercent / 100),
        expectedLift: plannedLift,
        minimumOrder: randomBetween(10, 50)
      })),
      financial: {
        planned: {
          baselineVolume: plannedBaselineVolume,
          promotionalVolume: plannedPromotionalVolume,
          incrementalVolume: plannedIncrementalVolume,
          volumeLift: plannedLift,
          baselineRevenue: plannedBaselineRevenue,
          promotionalRevenue: plannedPromotionalRevenue,
          incrementalRevenue: plannedIncrementalRevenue
        },
        actual: actualData,
        costs: {
          discountCost: discountCost,
          marketingCost: marketingCost,
          displayCost: displayCost,
          totalCost: totalCost
        },
        profitability: config.status === 'completed' ? {
          grossProfit: actualData ? actualData.incrementalRevenue * 0.35 : 0,
          netProfit: actualData ? actualData.incrementalRevenue - totalCost : 0,
          roi: actualData ? ((actualData.incrementalRevenue - totalCost) / totalCost) * 100 : 0,
          profitPerUnit: actualData ? (actualData.incrementalRevenue - totalCost) / actualData.incrementalVolume : 0
        } : null
      },
      budgetAllocation: {
        marketing: {
          budgetId: budgets[0]?._id,
          amount: marketingCost,
          approved: config.status !== 'draft' && config.status !== 'pending_approval'
        },
        tradingTerms: {
          amount: displayCost,
          approved: config.status !== 'draft' && config.status !== 'pending_approval'
        }
      },
      performance: performanceData,
      postEventAnalysis: config.status === 'completed' ? {
        status: 'completed',
        generatedAt: addDays(endDate, 7),
        baseline: performanceData?.baseline,
        incrementalLift: {
          volume: actualData?.incrementalVolume,
          revenue: actualData?.incrementalRevenue,
          statisticalSignificance: randomFloat(90, 99),
          pValue: randomFloat(0.001, 0.05)
        },
        effectiveness: {
          score: performanceData?.metrics?.score,
          rank: performanceData?.metrics?.effectiveness > 150 ? 'Excellent' : performanceData?.metrics?.effectiveness > 100 ? 'Good' : 'Average',
          benchmark: randomFloat(80, 120),
          percentile: randomBetween(40, 95)
        },
        learnings: [
          { insight: 'Strong performance in urban stores', category: 'targeting', actionable: true, priority: 'high' },
          { insight: 'Weekend sales significantly higher', category: 'timing', actionable: true, priority: 'medium' },
          { insight: 'Display compliance varied by region', category: 'execution', actionable: true, priority: 'high' }
        ],
        recommendations: [
          { recommendation: 'Increase focus on top-performing regions', expectedImpact: '+15% ROI', priority: 'high', category: 'targeting' },
          { recommendation: 'Extend promotion duration by 1 week', expectedImpact: '+10% volume', priority: 'medium', category: 'timing' }
        ]
      } : undefined,
      status: config.status,
      approvals: config.status !== 'draft' ? [
        { level: 'kam', status: config.status === 'pending_approval' ? 'pending' : 'approved', approver: users.find(u => u.role === 'kam')?._id, date: subtractDays(startDate, 14) },
        { level: 'manager', status: config.status === 'pending_approval' ? 'pending' : 'approved', approver: users.find(u => u.role === 'manager')?._id, date: subtractDays(startDate, 10) },
        { level: 'finance', status: config.status === 'pending_approval' ? 'pending' : 'approved', approver: users.find(u => u.department === 'finance')?._id, date: subtractDays(startDate, 7) }
      ] : [],
      createdBy: users.find(u => u.role === 'kam')?._id || users[0]._id,
      lastModifiedBy: users[0]._id,
      history: [
        { action: 'created', performedBy: users[0]._id, performedDate: subtractDays(startDate, 21) }
      ]
    });
    
    promotions.push(promotion);
    console.log(`Created promotion: ${promotion.name} (${config.status})`);
  }
  
  return promotions;
}

async function createTradeSpends(company, users, products, customers, budgets, promotions) {
  const tradeSpends = [];
  const now = new Date();
  
  const spendTypes = ['marketing', 'cash_coop', 'trading_terms', 'promotion'];
  const categories = {
    marketing: ['Advertising', 'Point of Sale', 'Sampling', 'Events', 'Digital Marketing'],
    cash_coop: ['Shelf Space', 'End Cap Display', 'Flyer Participation', 'In-Store Demo'],
    trading_terms: ['Volume Rebate', 'Prompt Payment', 'Listing Fee', 'Annual Bonus'],
    promotion: ['Price Discount', 'BOGO', 'Bundle Deal', 'Loyalty Reward']
  };

  // Create trade spends for the past 6 months
  for (let monthsAgo = 0; monthsAgo < 6; monthsAgo++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0);
    
    // Create 20-40 trade spends per month
    const spendsThisMonth = randomBetween(20, 40);
    
    for (let i = 0; i < spendsThisMonth; i++) {
      const spendType = randomFromArray(spendTypes);
      const category = randomFromArray(categories[spendType]);
      const customer = randomFromArray(customers);
      const requestedAmount = randomBetween(10000, 500000);
      
      // Determine status based on age
      let status;
      if (monthsAgo > 2) {
        status = randomFromArray(['completed', 'completed', 'completed', 'cancelled']);
      } else if (monthsAgo > 0) {
        status = randomFromArray(['completed', 'active', 'approved']);
      } else {
        status = randomFromArray(['draft', 'submitted', 'approved', 'active']);
      }
      
      const approvedAmount = status !== 'draft' && status !== 'submitted' ? requestedAmount * randomFloat(0.8, 1.0) : null;
      const spentAmount = status === 'completed' || status === 'active' ? approvedAmount * randomFloat(0.7, 1.0) : null;
      
      const startDate = new Date(monthStart.getTime() + Math.random() * (monthEnd.getTime() - monthStart.getTime()));
      const endDate = addDays(startDate, randomBetween(7, 30));
      
      const tradeSpend = await TradeSpend.create({
        company: company._id,
        spendId: generateId('TS'),
        spendType: spendType,
        activityType: randomFromArray(['trade_marketing', 'key_account']),
        category: category,
        cashCoopDetails: spendType === 'cash_coop' ? {
          reason: randomFromArray(['shelf_space', 'end_cap_display', 'flyer_participation', 'in_store_demo']),
          criteria: {
            minimumPurchase: randomBetween(10000, 50000),
            displayDuration: randomBetween(7, 30),
            conditions: 'Standard terms apply'
          }
        } : undefined,
        amount: {
          requested: requestedAmount,
          approved: approvedAmount,
          spent: spentAmount,
          currency: 'ZAR'
        },
        period: {
          startDate: startDate,
          endDate: endDate
        },
        customer: customer._id,
        products: products.slice(0, randomBetween(1, 5)).map(p => p._id),
        promotion: promotions.length > 0 && spendType === 'promotion' ? randomFromArray(promotions)._id : undefined,
        budget: budgets.length > 0 ? randomFromArray(budgets)._id : undefined,
        status: status,
        approvals: status !== 'draft' ? [
          { level: 'kam', status: status === 'submitted' ? 'pending' : 'approved', approver: users.find(u => u.role === 'kam')?._id, amount: requestedAmount, date: startDate },
          { level: 'manager', status: status === 'submitted' ? 'pending' : 'approved', approver: users.find(u => u.role === 'manager')?._id, amount: approvedAmount, date: addDays(startDate, 2) },
          { level: 'finance', status: ['approved', 'active', 'completed'].includes(status) ? 'approved' : 'pending', approver: users.find(u => u.department === 'finance')?._id, amount: approvedAmount, date: addDays(startDate, 4) }
        ] : [],
        performance: status === 'completed' ? {
          targetMetric: 'Sales Uplift',
          targetValue: randomBetween(100000, 1000000),
          actualValue: randomBetween(80000, 1200000),
          achievement: randomFloat(70, 130),
          roi: randomFloat(50, 300),
          effectiveness: randomFromArray(['highly_effective', 'effective', 'moderate', 'ineffective'])
        } : undefined,
        financial: {
          glAccount: `6${randomBetween(100, 999)}00`,
          costCenter: `CC${randomBetween(100, 999)}`,
          profitCenter: `PC${randomBetween(10, 99)}`
        },
        notes: `${category} spend for ${customer.name}`,
        createdBy: users.find(u => u.role === 'kam')?._id || users[0]._id,
        lastModifiedBy: users[0]._id,
        history: [
          { action: 'created', performedBy: users[0]._id, performedDate: subtractDays(startDate, 7) }
        ]
      });
      
      tradeSpends.push(tradeSpend);
    }
  }
  
  console.log(`Created ${tradeSpends.length} trade spends`);
  return tradeSpends;
}

// Run the seed
seedComprehensiveDemo();
