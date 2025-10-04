#!/usr/bin/env node

/**
 * TRADEAI Demo Data Seeder
 * Seeds production database with comprehensive Mondelez South Africa demo data
 * 
 * Features:
 * - Clears all existing data
 * - Creates Mondelez SA tenant
 * - Creates super admin and demo users
 * - Seeds South African retailers and products
 * - Generates 50,000+ transactions
 * - Fills all tables with realistic 1-year historical data
 * 
 * Usage: Run from project root
 *   node seed-demo-data.js
 */

const path = require('path');

// Use backend's node_modules
const dotenv = require(path.join(__dirname, 'backend', 'node_modules', 'dotenv'));
const mongoose = require(path.join(__dirname, 'backend', 'node_modules', 'mongoose'));
const bcrypt = require(path.join(__dirname, 'backend', 'node_modules', 'bcryptjs'));
const { faker } = require(path.join(__dirname, 'backend', 'node_modules', '@faker-js', 'faker'));

// Load environment from backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

// Import models
const User = require('./backend/src/models/User');
const Tenant = require('./backend/src/models/Tenant');
const Company = require('./backend/src/models/Company');
const Customer = require('./backend/src/models/Customer');
const Product = require('./backend/src/models/Product');
const Promotion = require('./backend/src/models/Promotion');
const Budget = require('./backend/src/models/Budget');
const TradeSpend = require('./backend/src/models/TradeSpend');
const TradingTerm = require('./backend/src/models/TradingTerm');
const Transaction = require('./backend/src/models/Transaction');

// South African Retailers (Major chains)
const SA_RETAILERS = [
  { name: 'Shoprite', type: 'Hypermarket', chain: 'Shoprite Holdings', tier: 'National' },
  { name: 'Checkers', type: 'Supermarket', chain: 'Shoprite Holdings', tier: 'National' },
  { name: 'Pick n Pay', type: 'Supermarket', chain: 'Pick n Pay Stores', tier: 'National' },
  { name: 'Woolworths', type: 'Premium', chain: 'Woolworths Holdings', tier: 'National' },
  { name: 'Spar', type: 'Supermarket', chain: 'SPAR Group', tier: 'National' },
  { name: 'Makro', type: 'Warehouse', chain: 'Massmart Holdings', tier: 'National' },
  { name: 'Game', type: 'Department Store', chain: 'Massmart Holdings', tier: 'National' },
  { name: 'Boxer', type: 'Discount', chain: 'Shoprite Holdings', tier: 'National' },
  { name: 'Usave', type: 'Discount', chain: 'Shoprite Holdings', tier: 'Regional' },
  { name: 'Food Lover\'s Market', type: 'Fresh Market', chain: 'Independent', tier: 'Regional' },
];

// Mondelez Product Portfolio for South Africa
const MONDELEZ_PRODUCTS = [
  // Cadbury Chocolate
  { name: 'Cadbury Dairy Milk 80g', category: 'Chocolate', brand: 'Cadbury', sku: 'CDM-80G-001', price: 15.99, cost: 9.50 },
  { name: 'Cadbury Dairy Milk 150g', category: 'Chocolate', brand: 'Cadbury', sku: 'CDM-150G-001', price: 28.99, cost: 17.50 },
  { name: 'Cadbury Lunch Bar 48g', category: 'Chocolate', brand: 'Cadbury', sku: 'CLB-48G-001', price: 9.99, cost: 6.00 },
  { name: 'Cadbury PS 52g', category: 'Chocolate', brand: 'Cadbury', sku: 'CPS-52G-001', price: 10.99, cost: 6.50 },
  { name: 'Cadbury Top Deck 80g', category: 'Chocolate', brand: 'Cadbury', sku: 'CTD-80G-001', price: 15.99, cost: 9.50 },
  { name: 'Cadbury Chomp 25g', category: 'Chocolate', brand: 'Cadbury', sku: 'CCH-25G-001', price: 5.99, cost: 3.50 },
  { name: 'Cadbury Flake 32g', category: 'Chocolate', brand: 'Cadbury', sku: 'CFL-32G-001', price: 8.99, cost: 5.50 },
  { name: 'Cadbury Crunchie 40g', category: 'Chocolate', brand: 'Cadbury', sku: 'CCR-40G-001', price: 9.99, cost: 6.00 },
  
  // Biscuits
  { name: 'Oreo Original 128g', category: 'Biscuits', brand: 'Oreo', sku: 'ORE-128G-001', price: 18.99, cost: 11.50 },
  { name: 'Oreo Golden 154g', category: 'Biscuits', brand: 'Oreo', sku: 'ORG-154G-001', price: 20.99, cost: 12.50 },
  { name: 'Bakers Tennis 200g', category: 'Biscuits', brand: 'Bakers', sku: 'BTN-200G-001', price: 16.99, cost: 10.00 },
  { name: 'Bakers Eet-Sum-Mor 200g', category: 'Biscuits', brand: 'Bakers', sku: 'BES-200G-001', price: 16.99, cost: 10.00 },
  { name: 'Bakers Romany Creams 200g', category: 'Biscuits', brand: 'Bakers', sku: 'BRC-200G-001', price: 18.99, cost: 11.50 },
  
  // Beverages
  { name: 'Cadbury Hot Chocolate 250g', category: 'Beverages', brand: 'Cadbury', sku: 'CHC-250G-001', price: 32.99, cost: 20.00 },
  { name: 'Cadbury Drinking Chocolate 500g', category: 'Beverages', brand: 'Cadbury', sku: 'CDC-500G-001', price: 59.99, cost: 36.00 },
  
  // Gum & Candy
  { name: 'Halls Mentho-Lyptus', category: 'Candy', brand: 'Halls', sku: 'HML-001', price: 8.99, cost: 5.50 },
  { name: 'Trident White Gum', category: 'Gum', brand: 'Trident', sku: 'TWG-001', price: 12.99, cost: 8.00 },
  { name: 'Stimorol Ice', category: 'Gum', brand: 'Stimorol', sku: 'STI-001', price: 11.99, cost: 7.50 },
];

// South African cities for location data
const SA_CITIES = ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Polokwane', 'Nelspruit', 'Kimberley'];

// Helper functions
const getRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const getRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomFloat = (min, max, decimals = 2) => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
};

// Main seeding function
async function seedDatabase() {
  try {
    console.log('🚀 Starting TRADEAI Demo Data Seeder...\n');
    
    // Connect to database
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradeai';
    console.log(`📡 Connecting to MongoDB: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // ============================================
    // STEP 1: Clear all existing data
    // ============================================
    console.log('🗑️  STEP 1: Clearing all existing data...');
    
    const collections = [
      'users',
      'tenants',
      'companies',
      'customers',
      'products',
      'promotions',
      'budgets',
      'tradespends',
      'tradingterms',
      'transactions'
    ];

    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection).countDocuments();
      if (count > 0) {
        await mongoose.connection.db.collection(collection).deleteMany({});
        console.log(`   ✓ Cleared ${count} documents from ${collection}`);
      }
    }
    console.log('✅ All data cleared\n');

    // ============================================
    // STEP 2: Create Mondelez SA Tenant
    // ============================================
    console.log('🏢 STEP 2: Creating Mondelez South Africa tenant...');
    
    const tenant = await Tenant.create({
      name: 'Mondelez South Africa',
      slug: 'mondelez-sa',
      domain: 'mondelez.co.za',
      industry: 'FMCG',
      settings: {
        currency: 'ZAR',
        dateFormat: 'DD/MM/YYYY',
        timezone: 'Africa/Johannesburg',
        fiscalYearStart: '01-01',
        language: 'en'
      },
      features: {
        promotions: true,
        budgets: true,
        analytics: true,
        reporting: true,
        aiInsights: true
      },
      status: 'active',
      subscription: {
        plan: 'enterprise',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-12-31'),
        status: 'active'
      }
    });
    
    console.log(`   ✓ Created tenant: ${tenant.name} (${tenant.slug})`);
    console.log('✅ Tenant created\n');

    // ============================================
    // STEP 3: Create Users
    // ============================================
    console.log('👥 STEP 3: Creating users...');
    
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);
    
    // Super Admin
    const superAdmin = await User.create({
      email: 'admin@tradeai.gonxt.tech',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'superadmin',
      status: 'active',
      profile: {
        phone: '+27 11 123 4567',
        department: 'IT',
        jobTitle: 'System Administrator'
      }
    });
    console.log(`   ✓ Created Super Admin: ${superAdmin.email}`);

    // Tenant Admin
    const tenantAdmin = await User.create({
      email: 'admin@mondelez.co.za',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Mbeki',
      role: 'admin',
      tenant: tenant._id,
      status: 'active',
      profile: {
        phone: '+27 11 456 7890',
        department: 'Trade Marketing',
        jobTitle: 'Trade Marketing Director'
      }
    });
    console.log(`   ✓ Created Tenant Admin: ${tenantAdmin.email}`);

    // Trade Marketing Manager
    const tmManager = await User.create({
      email: 'sarah.botha@mondelez.co.za',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Botha',
      role: 'manager',
      tenant: tenant._id,
      status: 'active',
      profile: {
        phone: '+27 11 234 5678',
        department: 'Trade Marketing',
        jobTitle: 'Trade Marketing Manager'
      }
    });
    console.log(`   ✓ Created Manager: ${tmManager.email}`);

    // Sales Representatives
    const salesReps = [];
    const salesRepNames = [
      { firstName: 'Thabo', lastName: 'Nkosi' },
      { firstName: 'Zanele', lastName: 'Dlamini' },
      { firstName: 'Pieter', lastName: 'van der Merwe' },
      { firstName: 'Nomsa', lastName: 'Khumalo' },
      { firstName: 'David', lastName: 'Smith' }
    ];

    for (const rep of salesRepNames) {
      const user = await User.create({
        email: `${rep.firstName.toLowerCase()}.${rep.lastName.toLowerCase()}@mondelez.co.za`,
        password: hashedPassword,
        firstName: rep.firstName,
        lastName: rep.lastName,
        role: 'user',
        tenant: tenant._id,
        status: 'active',
        profile: {
          phone: `+27 ${getRandomNumber(10, 89)} ${getRandomNumber(100, 999)} ${getRandomNumber(1000, 9999)}`,
          department: 'Sales',
          jobTitle: 'Sales Representative'
        }
      });
      salesReps.push(user);
      console.log(`   ✓ Created Sales Rep: ${user.email}`);
    }

    console.log('✅ Users created\n');

    // ============================================
    // STEP 4: Create Company (Mondelez)
    // ============================================
    console.log('🏢 STEP 4: Creating company profile...');
    
    const company = await Company.create({
      name: 'Mondelez South Africa (Pty) Ltd',
      code: 'MDLZ-SA',
      type: 'manufacturer',
      industry: 'Food & Beverage',
      taxNumber: 'ZA9876543210',
      registrationNumber: '1998/012345/07',
      address: {
        street: '1 Woodmead Drive',
        city: 'Sandton',
        state: 'Gauteng',
        postalCode: '2196',
        country: 'South Africa'
      },
      contact: {
        phone: '+27 11 517 8000',
        email: 'info@mondelez.co.za',
        website: 'https://www.mondelezinternational.com/africa'
      },
      banking: {
        accountName: 'Mondelez South Africa (Pty) Ltd',
        accountNumber: '1234567890',
        bankName: 'Standard Bank',
        branchCode: '051001',
        swiftCode: 'SBZAZAJJ'
      },
      tenant: tenant._id,
      createdBy: tenantAdmin._id,
      status: 'active'
    });
    
    console.log(`   ✓ Created company: ${company.name}`);
    console.log('✅ Company created\n');

    // ============================================
    // STEP 5: Create Customers (Retailers)
    // ============================================
    console.log('🛒 STEP 5: Creating South African retailers...');
    
    const customers = [];
    for (const retailer of SA_RETAILERS) {
      const customer = await Customer.create({
        name: retailer.name,
        code: `RTL-${retailer.name.substring(0, 3).toUpperCase()}-${getRandomNumber(1000, 9999)}`,
        type: 'retailer',
        tier: retailer.tier,
        category: retailer.type,
        taxNumber: `ZA${getRandomNumber(1000000000, 9999999999)}`,
        address: {
          street: `${getRandomNumber(1, 999)} ${faker.location.street()}`,
          city: getRandomElement(SA_CITIES),
          state: getRandomElement(['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape']),
          postalCode: `${getRandomNumber(1000, 9999)}`,
          country: 'South Africa'
        },
        contact: {
          phone: `+27 ${getRandomNumber(10, 89)} ${getRandomNumber(100, 999)} ${getRandomNumber(1000, 9999)}`,
          email: `trade@${retailer.name.toLowerCase().replace(/\s+/g, '')}.co.za`,
          website: `https://www.${retailer.name.toLowerCase().replace(/\s+/g, '')}.co.za`
        },
        primaryContact: {
          name: `${faker.person.firstName()} ${faker.person.lastName()}`,
          email: `buyer@${retailer.name.toLowerCase().replace(/\s+/g, '')}.co.za`,
          phone: `+27 ${getRandomNumber(10, 89)} ${getRandomNumber(100, 999)} ${getRandomNumber(1000, 9999)}`,
          position: 'Category Manager'
        },
        paymentTerms: {
          method: 'eft',
          terms: getRandomElement(['Net 30', 'Net 45', 'Net 60']),
          creditLimit: getRandomNumber(500000, 2000000),
          currency: 'ZAR'
        },
        metadata: {
          chain: retailer.chain,
          storeCount: getRandomNumber(50, 500),
          region: 'South Africa'
        },
        tenant: tenant._id,
        createdBy: tenantAdmin._id,
        status: 'active'
      });
      customers.push(customer);
      console.log(`   ✓ Created retailer: ${customer.name}`);
    }
    
    console.log('✅ Retailers created\n');

    // ============================================
    // STEP 6: Create Products
    // ============================================
    console.log('📦 STEP 6: Creating Mondelez products...');
    
    const products = [];
    for (const prod of MONDELEZ_PRODUCTS) {
      const product = await Product.create({
        name: prod.name,
        sku: prod.sku,
        barcode: `600${getRandomNumber(1000000000, 9999999999)}`,
        category: prod.category,
        brand: prod.brand,
        description: `${prod.brand} ${prod.name} - Premium quality product from Mondelez International`,
        pricing: {
          cost: prod.cost,
          price: prod.price,
          currency: 'ZAR',
          margin: parseFloat((((prod.price - prod.cost) / prod.price) * 100).toFixed(2))
        },
        inventory: {
          unit: 'each',
          reorderLevel: getRandomNumber(100, 500),
          inStock: getRandomNumber(1000, 5000)
        },
        specifications: {
          weight: `${prod.name.match(/\d+g/) ? prod.name.match(/\d+g/)[0] : '100g'}`,
          dimensions: `${getRandomNumber(5, 15)}cm x ${getRandomNumber(3, 10)}cm x ${getRandomNumber(1, 5)}cm`,
          shelfLife: '12 months',
          storageConditions: 'Store in a cool, dry place'
        },
        manufacturer: {
          name: 'Mondelez South Africa',
          country: 'South Africa'
        },
        tenant: tenant._id,
        createdBy: tenantAdmin._id,
        status: 'active'
      });
      products.push(product);
      console.log(`   ✓ Created product: ${product.name}`);
    }
    
    console.log('✅ Products created\n');

    // ============================================
    // STEP 7: Create Trading Terms
    // ============================================
    console.log('📋 STEP 7: Creating trading terms...');
    
    const tradingTerms = [];
    for (const customer of customers) {
      const term = await TradingTerm.create({
        name: `${customer.name} - 2024/2025 Trading Terms`,
        customer: customer._id,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        terms: {
          paymentTerms: customer.paymentTerms.terms,
          creditLimit: customer.paymentTerms.creditLimit,
          discount: getRandomFloat(2, 8, 2),
          rebate: getRandomFloat(1, 5, 2)
        },
        promotions: {
          required: getRandomNumber(4, 12),
          funded: getRandomFloat(50, 100, 0)
        },
        listing: {
          newProducts: getRandomNumber(2, 8),
          delistings: getRandomNumber(0, 3)
        },
        tenant: tenant._id,
        createdBy: tenantAdmin._id,
        status: 'approved'
      });
      tradingTerms.push(term);
      console.log(`   ✓ Created trading terms for ${customer.name}`);
    }
    
    console.log('✅ Trading terms created\n');

    // ============================================
    // STEP 8: Create Budgets
    // ============================================
    console.log('💰 STEP 8: Creating budgets...');
    
    const budgets = [];
    const budgetCategories = ['Trade Marketing', 'Consumer Promotions', 'Listing Fees', 'Rebates', 'Advertising'];
    
    for (const category of budgetCategories) {
      const budget = await Budget.create({
        name: `${category} Budget 2024`,
        code: `BDG-2024-${category.substring(0, 3).toUpperCase()}-${getRandomNumber(100, 999)}`,
        type: 'annual',
        category: category.toLowerCase().replace(/\s+/g, '_'),
        fiscalYear: 2024,
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
        amount: {
          total: getRandomNumber(5000000, 20000000),
          allocated: 0,
          spent: 0,
          committed: 0,
          available: 0,
          currency: 'ZAR'
        },
        tenant: tenant._id,
        createdBy: tenantAdmin._id,
        approvedBy: tenantAdmin._id,
        approvedAt: new Date('2023-12-15'),
        status: 'approved'
      });
      
      // Calculate amounts
      budget.amount.allocated = Math.floor(budget.amount.total * getRandomFloat(0.7, 0.9));
      budget.amount.spent = Math.floor(budget.amount.allocated * getRandomFloat(0.5, 0.8));
      budget.amount.committed = Math.floor(budget.amount.allocated * getRandomFloat(0.1, 0.2));
      budget.amount.available = budget.amount.allocated - budget.amount.spent - budget.amount.committed;
      
      await budget.save();
      budgets.push(budget);
      console.log(`   ✓ Created budget: ${budget.name} (R${(budget.amount.total / 1000000).toFixed(1)}M)`);
    }
    
    console.log('✅ Budgets created\n');

    // ============================================
    // STEP 9: Create Promotions
    // ============================================
    console.log('🎯 STEP 9: Creating promotions...');
    
    const promotions = [];
    const promotionTypes = ['price_reduction', 'buy_one_get_one', 'multi_buy', 'combo_deal', 'coupon'];
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');
    
    // Create 100 promotions throughout the year
    for (let i = 0; i < 100; i++) {
      const promoStart = getRandomDate(startDate, new Date('2024-11-01'));
      const promoEnd = new Date(promoStart.getTime() + (getRandomNumber(7, 30) * 24 * 60 * 60 * 1000));
      const promoType = getRandomElement(promotionTypes);
      const selectedProducts = [];
      const numProducts = getRandomNumber(1, 5);
      
      for (let j = 0; j < numProducts; j++) {
        selectedProducts.push(getRandomElement(products)._id);
      }
      
      const promotion = await Promotion.create({
        name: `${getRandomElement(SA_RETAILERS).name} - ${promoType.replace(/_/g, ' ').toUpperCase()} - Week ${getRandomNumber(1, 52)}`,
        code: `PROMO-2024-${String(i + 1).padStart(4, '0')}`,
        type: promoType,
        status: promoEnd < new Date() ? 'completed' : (promoStart < new Date() ? 'active' : 'planned'),
        period: {
          start: promoStart,
          end: promoEnd
        },
        customers: [getRandomElement(customers)._id],
        products: selectedProducts,
        mechanics: {
          discount: getRandomFloat(10, 30, 2),
          threshold: promoType === 'multi_buy' ? getRandomNumber(2, 4) : undefined,
          reward: promoType === 'buy_one_get_one' ? 'Free product' : undefined
        },
        budget: {
          allocated: getRandomNumber(50000, 500000),
          spent: 0,
          currency: 'ZAR',
          budgetId: getRandomElement(budgets)._id
        },
        performance: {
          targetVolume: getRandomNumber(1000, 10000),
          actualVolume: 0,
          targetRevenue: getRandomNumber(100000, 1000000),
          actualRevenue: 0,
          roi: 0
        },
        tenant: tenant._id,
        createdBy: getRandomElement(salesReps)._id,
        approvedBy: tmManager._id,
        approvedAt: new Date(promoStart.getTime() - (7 * 24 * 60 * 60 * 1000)),
      });
      
      // Calculate actuals for completed promotions
      if (promotion.status === 'completed') {
        promotion.performance.actualVolume = Math.floor(promotion.performance.targetVolume * getRandomFloat(0.8, 1.3));
        promotion.performance.actualRevenue = Math.floor(promotion.performance.targetRevenue * getRandomFloat(0.8, 1.3));
        promotion.budget.spent = Math.floor(promotion.budget.allocated * getRandomFloat(0.7, 1.1));
        promotion.performance.roi = parseFloat((((promotion.performance.actualRevenue - promotion.budget.spent) / promotion.budget.spent) * 100).toFixed(2));
        await promotion.save();
      }
      
      promotions.push(promotion);
      
      if ((i + 1) % 20 === 0) {
        console.log(`   ✓ Created ${i + 1} promotions...`);
      }
    }
    
    console.log(`✅ ${promotions.length} promotions created\n`);

    // ============================================
    // STEP 10: Generate 50,000 Transactions
    // ============================================
    console.log('💳 STEP 10: Generating 50,000 transactions...');
    console.log('   (This may take a few minutes...)\n');
    
    const transactionTypes = ['order', 'trade_deal', 'settlement', 'payment', 'accrual', 'deduction'];
    const transactions = [];
    const batchSize = 1000;
    
    for (let batch = 0; batch < 50; batch++) {
      const batchTransactions = [];
      
      for (let i = 0; i < batchSize; i++) {
        const txDate = getRandomDate(startDate, endDate);
        const txType = getRandomElement(transactionTypes);
        const customer = getRandomElement(customers);
        const txProducts = [];
        const numItems = getRandomNumber(1, 10);
        let grossAmount = 0;
        
        // Generate transaction items
        for (let j = 0; j < numItems; j++) {
          const product = getRandomElement(products);
          const quantity = getRandomNumber(10, 500);
          const unitPrice = product.pricing.price;
          const total = quantity * unitPrice;
          
          txProducts.push({
            productId: product._id,
            productName: product.name,
            sku: product.sku,
            quantity: quantity,
            unitPrice: unitPrice,
            total: total,
            discount: getRandomFloat(0, 10, 2)
          });
          
          grossAmount += total;
        }
        
        const taxAmount = grossAmount * 0.15; // 15% VAT
        const discountAmount = grossAmount * getRandomFloat(0, 0.1, 4);
        const netAmount = grossAmount - discountAmount + taxAmount;
        
        // Create transaction
        const transaction = {
          transactionNumber: `TXN-2024-${String((batch * batchSize) + i + 1).padStart(6, '0')}`,
          transactionType: txType,
          transactionDate: txDate,
          customerId: customer._id,
          customerName: customer.name,
          items: txProducts,
          amount: {
            gross: parseFloat(grossAmount.toFixed(2)),
            net: parseFloat(netAmount.toFixed(2)),
            tax: parseFloat(taxAmount.toFixed(2)),
            discount: parseFloat(discountAmount.toFixed(2)),
            currency: 'ZAR'
          },
          payment: {
            terms: customer.paymentTerms.terms,
            dueDate: new Date(txDate.getTime() + (30 * 24 * 60 * 60 * 1000)),
            method: 'eft',
            status: txDate < new Date(Date.now() - (60 * 24 * 60 * 60 * 1000)) ? 'paid' : 'pending'
          },
          status: txDate < new Date() ? (Math.random() > 0.1 ? 'settled' : 'processing') : 'draft',
          approvalStatus: txDate < new Date() ? 'approved' : 'pending',
          approvalWorkflow: {
            required: netAmount > 100000,
            levels: netAmount > 100000 ? [
              {
                level: 1,
                approver: tmManager._id,
                status: 'approved',
                approvedAt: new Date(txDate.getTime() + (1 * 24 * 60 * 60 * 1000))
              }
            ] : []
          },
          tenant: tenant._id,
          createdBy: getRandomElement(salesReps)._id,
          createdAt: txDate,
          updatedAt: txDate
        };
        
        batchTransactions.push(transaction);
      }
      
      // Insert batch
      await Transaction.insertMany(batchTransactions);
      console.log(`   ✓ Created transactions ${(batch * batchSize) + 1} to ${(batch + 1) * batchSize}...`);
    }
    
    console.log('✅ 50,000 transactions created\n');

    // ============================================
    // STEP 11: Create Trade Spends
    // ============================================
    console.log('💸 STEP 11: Creating trade spends...');
    
    const tradeSpends = [];
    const spendCategories = ['listing_fee', 'promotional_support', 'rebate', 'marketing_contribution', 'volume_bonus'];
    
    // Create 500 trade spends
    for (let i = 0; i < 500; i++) {
      const spendDate = getRandomDate(startDate, endDate);
      const category = getRandomElement(spendCategories);
      const customer = getRandomElement(customers);
      const amount = getRandomNumber(5000, 500000);
      
      const tradeSpend = await TradeSpend.create({
        name: `${customer.name} - ${category.replace(/_/g, ' ').toUpperCase()}`,
        code: `TS-2024-${String(i + 1).padStart(4, '0')}`,
        type: category,
        customer: customer._id,
        date: spendDate,
        amount: {
          planned: amount,
          actual: spendDate < new Date() ? Math.floor(amount * getRandomFloat(0.9, 1.1)) : 0,
          currency: 'ZAR'
        },
        budget: {
          budgetId: getRandomElement(budgets)._id,
          allocated: amount
        },
        promotion: promotions.length > 0 ? (Math.random() > 0.5 ? getRandomElement(promotions)._id : undefined) : undefined,
        description: `${category.replace(/_/g, ' ')} for ${customer.name}`,
        tenant: tenant._id,
        createdBy: getRandomElement(salesReps)._id,
        approvedBy: tmManager._id,
        approvedAt: new Date(spendDate.getTime() - (3 * 24 * 60 * 60 * 1000)),
        status: spendDate < new Date() ? 'approved' : 'pending'
      });
      
      tradeSpends.push(tradeSpend);
      
      if ((i + 1) % 100 === 0) {
        console.log(`   ✓ Created ${i + 1} trade spends...`);
      }
    }
    
    console.log(`✅ ${tradeSpends.length} trade spends created\n`);

    // ============================================
    // FINAL SUMMARY
    // ============================================
    console.log('📊 SEEDING COMPLETE!\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📈 Database Summary:');
    console.log(`   • Tenant: ${tenant.name}`);
    console.log(`   • Users: ${await User.countDocuments()}`);
    console.log(`   • Customers: ${customers.length} (SA Retailers)`);
    console.log(`   • Products: ${products.length} (Mondelez Portfolio)`);
    console.log(`   • Trading Terms: ${tradingTerms.length}`);
    console.log(`   • Budgets: ${budgets.length}`);
    console.log(`   • Promotions: ${promotions.length}`);
    console.log(`   • Transactions: ${await Transaction.countDocuments()}`);
    console.log(`   • Trade Spends: ${tradeSpends.length}`);
    console.log('\n👤 Login Credentials:');
    console.log('   ┌─────────────────────────────────────────────────────┐');
    console.log('   │ SUPER ADMIN                                         │');
    console.log('   │ Email: admin@tradeai.gonxt.tech                     │');
    console.log('   │ Password: Admin@123456                              │');
    console.log('   ├─────────────────────────────────────────────────────┤');
    console.log('   │ TENANT ADMIN (Mondelez SA)                          │');
    console.log('   │ Email: admin@mondelez.co.za                         │');
    console.log('   │ Password: Admin@123456                              │');
    console.log('   ├─────────────────────────────────────────────────────┤');
    console.log('   │ MANAGER                                             │');
    console.log('   │ Email: sarah.botha@mondelez.co.za                   │');
    console.log('   │ Password: Admin@123456                              │');
    console.log('   ├─────────────────────────────────────────────────────┤');
    console.log('   │ SALES REP                                           │');
    console.log('   │ Email: thabo.nkosi@mondelez.co.za                   │');
    console.log('   │ Password: Admin@123456                              │');
    console.log('   └─────────────────────────────────────────────────────┘');
    console.log('\n🌍 Demo Tenant Details:');
    console.log(`   • Region: South Africa`);
    console.log(`   • Currency: ZAR (South African Rand)`);
    console.log(`   • Period: 1 Year (2024-01-01 to 2024-12-31)`);
    console.log(`   • Major Retailers: Shoprite, Pick n Pay, Woolworths, Spar, Makro`);
    console.log(`   • Product Range: Cadbury, Oreo, Bakers, Halls, Stimorol`);
    console.log('\n✅ Demo tenant is ready for use!');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seeder
seedDatabase();
