#!/usr/bin/env node

/**
 * Simplified TRADEAI Demo Data Seeder
 * Uses minimal required fields to avoid validation errors
 */

const path = require('path');
const dotenv = require(path.join(__dirname, 'backend', 'node_modules', 'dotenv'));
const mongoose = require(path.join(__dirname, 'backend', 'node_modules', 'mongoose'));
const bcrypt = require(path.join(__dirname, 'backend', 'node_modules', 'bcryptjs'));
const { faker } = require(path.join(__dirname, 'backend', 'node_modules', '@faker-js', 'faker'));

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

// Helper functions
const getRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min, max, decimals = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

// Main seeding function
async function seedDatabase() {
  try {
    console.log('🚀 Starting TRADEAI Simplified Demo Seeder...\n');
    
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradeai';
    console.log(`📡 Connecting to MongoDB...`);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    // Clear data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Tenant.deleteMany({}),
      Company.deleteMany({}),
      Customer.deleteMany({}),
      Product.deleteMany({}),
      Promotion.deleteMany({}),
      Budget.deleteMany({}),
      TradeSpend.deleteMany({}),
      TradingTerm.deleteMany({}),
      Transaction.deleteMany({})
    ]);
    console.log('✅ Cleared\n');

    // Create Tenant
    console.log('🏢 Creating tenant...');
    const tenant = await Tenant.create({
      name: 'Mondelez South Africa',
      slug: 'mondelez-sa',
      domain: 'mondelez.co.za',
      industry: 'FMCG',
      status: 'active'
    });
    console.log(`✅ Tenant: ${tenant.name}\n`);

    // Create Users
    console.log('👥 Creating users...');
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);
    
    const superAdmin = await User.create({
      email: 'admin@tradeai.gonxt.tech',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'super_admin',
      department: 'admin',
      employeeId: 'SA-001',
      tenantId: tenant._id,
      isActive: true
    });
    
    const tenantAdmin = await User.create({
      email: 'admin@mondelez.co.za',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Mbeki',
      role: 'admin',
      department: 'admin',
      employeeId: 'MDLZ-001',
      tenantId: tenant._id,
      isActive: true
    });
    
    const manager = await User.create({
      email: 'sarah.botha@mondelez.co.za',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Botha',
      role: 'manager',
      department: 'marketing',
      employeeId: 'MDLZ-002',
      tenantId: tenant._id,
      isActive: true
    });
    
    const salesReps = [];
    const repNames = ['Thabo Nkosi', 'Zanele Dlamini', 'Pieter van der Merwe', 'Nomsa Khumalo', 'David Smith'];
    for (let i = 0; i < repNames.length; i++) {
      const [firstName, lastName] = repNames[i].split(' ');
      const rep = await User.create({
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}@mondelez.co.za`,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'kam',
        department: 'sales',
        employeeId: `MDLZ-${String(i + 3).padStart(3, '0')}`,
        tenantId: tenant._id,
        isActive: true
      });
      salesReps.push(rep);
    }
    console.log(`✅ Created ${salesReps.length + 3} users\n`);

    // Create Company
    console.log('🏢 Creating company...');
    const company = await Company.create({
      name: 'Mondelez South Africa',
      code: 'MDLZ-SA',
      domain: 'mondelez.co.za',
      industry: 'fmcg',
      country: 'ZA',
      currency: 'ZAR',
      timezone: 'Africa/Johannesburg',
      tenant: tenant._id
    });
    console.log(`✅ Company: ${company.name}\n`);

    // Create Customers (Retailers)
    console.log('🛒 Creating retailers...');
    const retailerNames = ['Shoprite', 'Pick n Pay', 'Woolworths', 'Spar', 'Makro', 'Checkers', 'Game', 'Boxer', 'Food Lovers Market', 'Usave'];
    const customers = [];
    
    for (let i = 0; i < retailerNames.length; i++) {
      const customer = await Customer.create({
        name: retailerNames[i],
        code: `RTL-${String(i + 1).padStart(4, '0')}`,
        sapCustomerId: `SAP-${String(i + 1).padStart(6, '0')}`,
        customerType: 'chain',
        channel: 'modern_trade',
        tenantId: tenant._id,
        company: company._id,
        status: 'active'
      });
      customers.push(customer);
    }
    console.log(`✅ Created ${customers.length} retailers\n`);

    // Create Products
    console.log('📦 Creating products...');
    const productData = [
      { name: 'Cadbury Dairy Milk 80g', price: 15.99, cost: 9.50 },
      { name: 'Cadbury Lunch Bar 48g', price: 9.99, cost: 6.00 },
      { name: 'Cadbury PS 52g', price: 10.99, cost: 6.50 },
      { name: 'Cadbury Top Deck 80g', price: 15.99, cost: 9.50 },
      { name: 'Oreo Original 128g', price: 18.99, cost: 11.50 },
      { name: 'Oreo Golden 154g', price: 20.99, cost: 12.50 },
      { name: 'Bakers Tennis 200g', price: 16.99, cost: 10.00 },
      { name: 'Bakers Romany Creams 200g', price: 18.99, cost: 11.50 },
      { name: 'Halls Mentho-Lyptus', price: 8.99, cost: 5.50 },
      { name: 'Stimorol Ice', price: 11.99, cost: 7.50 }
    ];
    
    const products = [];
    for (let i = 0; i < productData.length; i++) {
      const prod = productData[i];
      const product = await Product.create({
        name: prod.name,
        code: `PROD-${String(i + 1).padStart(4, '0')}`,
        sku: `SKU-${String(i + 1).padStart(4, '0')}`,
        sapMaterialId: `MAT-${String(i + 1).padStart(8, '0')}`,
        description: prod.name,
        productType: 'own_brand',
        pricing: {
          listPrice: prod.price,
          cost: prod.cost,
          currency: 'ZAR'
        },
        tenantId: tenant._id,
        company: company._id,
        status: 'active'
      });
      products.push(product);
    }
    console.log(`✅ Created ${products.length} products\n`);

    // Create Budgets
    console.log('💰 Creating budgets...');
    const budgetCategories = ['Trade Marketing', 'Promotions', 'Listing Fees', 'Rebates'];
    const budgets = [];
    
    for (const category of budgetCategories) {
      const budget = await Budget.create({
        name: `${category} 2024`,
        code: `BDG-2024-${category.substring(0, 3).toUpperCase()}`,
        fiscalYear: 2024,
        totalAmount: getRandomNumber(5000000, 15000000),
        allocatedAmount: 0,
        spentAmount: 0,
        tenant: tenant._id,
        status: 'active'
      });
      budgets.push(budget);
    }
    console.log(`✅ Created ${budgets.length} budgets\n`);

    // Generate Transactions
    console.log('💳 Generating 50,000 transactions...');
    console.log('   (This will take several minutes...)\n');
    
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');
    const batchSize = 1000;
    
    for (let batch = 0; batch < 50; batch++) {
      const batchTransactions = [];
      
      for (let i = 0; i < batchSize; i++) {
        const txDate = getRandomDate(startDate, endDate);
        const customer = getRandomElement(customers);
        const numItems = getRandomNumber(1, 5);
        let grossAmount = 0;
        
        const items = [];
        for (let j = 0; j < numItems; j++) {
          const product = getRandomElement(products);
          const quantity = getRandomNumber(10, 500);
          const unitPrice = product.pricing.listPrice;
          const total = quantity * unitPrice;
          
          items.push({
            productId: product._id,
            productName: product.name,
            sku: product.sku,
            quantity,
            unitPrice,
            total
          });
          
          grossAmount += total;
        }
        
        const taxAmount = grossAmount * 0.15;
        const discountAmount = grossAmount * getRandomFloat(0, 0.1, 4);
        const netAmount = grossAmount - discountAmount + taxAmount;
        
        batchTransactions.push({
          transactionNumber: `TXN-2024-${String((batch * batchSize) + i + 1).padStart(6, '0')}`,
          transactionType: 'order',
          transactionDate: txDate,
          customerId: customer._id,
          customerName: customer.name,
          items,
          amount: {
            gross: parseFloat(grossAmount.toFixed(2)),
            net: parseFloat(netAmount.toFixed(2)),
            tax: parseFloat(taxAmount.toFixed(2)),
            discount: parseFloat(discountAmount.toFixed(2)),
            currency: 'ZAR'
          },
          payment: {
            terms: 'Net 30',
            dueDate: new Date(txDate.getTime() + (30 * 24 * 60 * 60 * 1000)),
            method: 'eft',
            status: txDate < new Date(Date.now() - (60 * 24 * 60 * 60 * 1000)) ? 'paid' : 'pending'
          },
          status: 'settled',
          approvalStatus: 'approved',
          tenant: tenant._id,
          createdBy: getRandomElement(salesReps)._id,
          createdAt: txDate,
          updatedAt: txDate
        });
      }
      
      await Transaction.insertMany(batchTransactions);
      console.log(`   ✓ Progress: ${((batch + 1) * batchSize).toLocaleString()} transactions created`);
    }
    
    console.log('✅ All transactions created\n');

    // Create Promotions
    console.log('🎯 Creating promotions...');
    for (let i = 0; i < 100; i++) {
      const promoStart = getRandomDate(startDate, new Date('2024-11-01'));
      const promoEnd = new Date(promoStart.getTime() + (getRandomNumber(7, 30) * 24 * 60 * 60 * 1000));
      
      await Promotion.create({
        name: `Promotion ${i + 1} - ${getRandomElement(retailerNames)}`,
        code: `PROMO-${String(i + 1).padStart(4, '0')}`,
        startDate: promoStart,
        endDate: promoEnd,
        promotionType: getRandomElement(['temporary_price_reduction', 'multi_buy', 'bundle']),
        discountType: 'percentage',
        discountValue: getRandomFloat(10, 30),
        budget: getRandomNumber(50000, 500000),
        tenant: tenant._id,
        status: promoEnd < new Date() ? 'completed' : (promoStart < new Date() ? 'active' : 'planned')
      });
    }
    console.log('✅ Created 100 promotions\n');

    // Create Trade Spends
    console.log('💸 Creating trade spends...');
    for (let i = 0; i < 500; i++) {
      const spendDate = getRandomDate(startDate, endDate);
      await TradeSpend.create({
        name: `Trade Spend ${i + 1}`,
        code: `TS-${String(i + 1).padStart(4, '0')}`,
        customerId: getRandomElement(customers)._id,
        date: spendDate,
        amount: getRandomNumber(5000, 100000),
        category: getRandomElement(['promotional_support', 'listing_fee', 'rebate', 'marketing_contribution']),
        tenant: tenant._id,
        status: 'approved'
      });
    }
    console.log('✅ Created 500 trade spends\n');

    // Final Summary
    const stats = {
      users: await User.countDocuments(),
      customers: await Customer.countDocuments(),
      products: await Product.countDocuments(),
      transactions: await Transaction.countDocuments(),
      promotions: await Promotion.countDocuments(),
      tradeSpends: await TradeSpend.countDocuments(),
      budgets: await Budget.countDocuments()
    };

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ SEEDING COMPLETE!\n');
    console.log('📊 Database Summary:');
    console.log(`   • Tenant: ${tenant.name}`);
    console.log(`   • Users: ${stats.users}`);
    console.log(`   • Customers: ${stats.customers} (SA Retailers)`);
    console.log(`   • Products: ${stats.products} (Mondelez)`);
    console.log(`   • Budgets: ${stats.budgets}`);
    console.log(`   • Promotions: ${stats.promotions}`);
    console.log(`   • Trade Spends: ${stats.tradeSpends}`);
    console.log(`   • Transactions: ${stats.transactions.toLocaleString()}`);
    console.log('\n👤 Login Credentials:');
    console.log('   ┌─────────────────────────────────────────────────────┐');
    console.log('   │ SUPER ADMIN                                         │');
    console.log('   │ Email: admin@tradeai.gonxt.tech                     │');
    console.log('   │ Password: Admin@123456                              │');
    console.log('   ├─────────────────────────────────────────────────────┤');
    console.log('   │ TENANT ADMIN                                        │');
    console.log('   │ Email: admin@mondelez.co.za                         │');
    console.log('   │ Password: Admin@123456                              │');
    console.log('   ├─────────────────────────────────────────────────────┤');
    console.log('   │ MANAGER                                             │');
    console.log('   │ Email: sarah.botha@mondelez.co.za                   │');
    console.log('   │ Password: Admin@123456                              │');
    console.log('   └─────────────────────────────────────────────────────┘');
    console.log('\n🌍 Access at: https://tradeai.gonxt.tech');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`   - ${key}: ${error.errors[key].message}`);
      });
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedDatabase();
