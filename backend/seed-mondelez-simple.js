const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./src/models/User');
const Company = require('./src/models/Company');
const Tenant = require('./src/models/Tenant');
const Product = require('./src/models/Product');
const Customer = require('./src/models/Customer');
const Budget = require('./src/models/Budget');
const SalesHistory = require('./src/models/SalesHistory');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trade-ai');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Mondelez South Africa Products Data
const mondelezProducts = [
  // Biscuits & Cookies
  { category: 'Biscuits', brand: 'Oreo', name: 'Oreo Original Cookies 154g', sku: 'ORE-001', price: 25.99, cost: 15.59 },
  { category: 'Biscuits', brand: 'Oreo', name: 'Oreo Golden Cookies 154g', sku: 'ORE-002', price: 25.99, cost: 15.59 },
  { category: 'Biscuits', brand: 'Oreo', name: 'Oreo Thins Original 95g', sku: 'ORE-003', price: 19.99, cost: 11.99 },
  { category: 'Biscuits', brand: 'Bakers', name: 'Bakers Tennis Biscuits 200g', sku: 'BAK-001', price: 18.99, cost: 11.39 },
  { category: 'Biscuits', brand: 'Bakers', name: 'Bakers Eet-Sum-Mor 200g', sku: 'BAK-002', price: 18.99, cost: 11.39 },
  
  // Chocolate & Confectionery
  { category: 'Chocolate', brand: 'Cadbury', name: 'Cadbury Dairy Milk 80g', sku: 'CAD-001', price: 22.99, cost: 13.79 },
  { category: 'Chocolate', brand: 'Cadbury', name: 'Cadbury Dairy Milk Fruit & Nut 80g', sku: 'CAD-002', price: 24.99, cost: 14.99 },
  { category: 'Chocolate', brand: 'Cadbury', name: 'Cadbury Lunch Bar 48g', sku: 'CAD-004', price: 12.99, cost: 7.79 },
  { category: 'Chocolate', brand: 'Toblerone', name: 'Toblerone Milk Chocolate 100g', sku: 'TOB-001', price: 45.99, cost: 27.59 },
  { category: 'Chocolate', brand: 'Milka', name: 'Milka Alpine Milk 100g', sku: 'MIL-001', price: 28.99, cost: 17.39 },
  
  // Gum & Mints
  { category: 'Gum', brand: 'Trident', name: 'Trident Spearmint Gum 14s', sku: 'TRI-001', price: 8.99, cost: 5.39 },
  { category: 'Gum', brand: 'Halls', name: 'Halls Mentho-Lyptus 33.5g', sku: 'HAL-001', price: 12.99, cost: 7.79 },
  
  // Beverages
  { category: 'Beverages', brand: 'Tang', name: 'Tang Orange 500g', sku: 'TAN-001', price: 35.99, cost: 21.59 },
  { category: 'Beverages', brand: 'Jacobs', name: 'Jacobs Kronung Coffee 200g', sku: 'JAC-001', price: 89.99, cost: 53.99 },
  
  // Cheese & Dairy
  { category: 'Cheese', brand: 'Philadelphia', name: 'Philadelphia Original Cream Cheese 230g', sku: 'PHI-001', price: 42.99, cost: 25.79 },
];

// South African Retail Customers
const southAfricanCustomers = [
  // Major Retail Chains
  { name: 'Shoprite Holdings', code: 'SHP001', type: 'chain', channel: 'modern_trade', tier: 'platinum', creditLimit: 50000000, region: 'National' },
  { name: 'Pick n Pay', code: 'PNP001', type: 'chain', channel: 'modern_trade', tier: 'platinum', creditLimit: 45000000, region: 'National' },
  { name: 'Woolworths', code: 'WOL001', type: 'chain', channel: 'modern_trade', tier: 'gold', creditLimit: 30000000, region: 'National' },
  { name: 'SPAR Group', code: 'SPA001', type: 'chain', channel: 'modern_trade', tier: 'gold', creditLimit: 35000000, region: 'National' },
  { name: 'Checkers', code: 'CHE001', type: 'chain', channel: 'modern_trade', tier: 'platinum', creditLimit: 42000000, region: 'National' },
  
  // Regional Chains
  { name: 'Food Lover\'s Market', code: 'FLM001', type: 'chain', channel: 'modern_trade', tier: 'silver', creditLimit: 15000000, region: 'Western Cape' },
  { name: 'Fruit & Veg City', code: 'FVC001', type: 'chain', channel: 'modern_trade', tier: 'silver', creditLimit: 12000000, region: 'Gauteng' },
  
  // Wholesalers
  { name: 'Makro', code: 'MAK001', type: 'wholesaler', channel: 'b2b', tier: 'platinum', creditLimit: 60000000, region: 'National' },
  { name: 'Cash & Carry', code: 'CNC001', type: 'wholesaler', channel: 'b2b', tier: 'gold', creditLimit: 25000000, region: 'National' },
  
  // Online & E-commerce
  { name: 'Takealot', code: 'TAK001', type: 'online', channel: 'ecommerce', tier: 'gold', creditLimit: 20000000, region: 'National' },
];

// Generate sample sales data
const generateSampleSalesData = async (products, customers, tenantId, companyId) => {
  console.log('📊 Generating sample sales data...');
  
  const salesData = [];
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-12-31');
  
  // Generate 1000 sample transactions
  for (let i = 0; i < 1000; i++) {
    const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
    const product = products[Math.floor(Math.random() * products.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    
    const quantity = Math.floor(Math.random() * 100) + 10;
    const unitPrice = product.pricing.listPrice * (0.9 + Math.random() * 0.2); // ±10% variation
    const grossRevenue = quantity * unitPrice;
    const netRevenue = grossRevenue * 0.95; // 5% discount
    
    const salesRecord = new SalesHistory({
      tenantId,
      company: companyId,
      transactionId: `TXN-${Date.now()}-${i}`,
      date: randomDate,
      year: randomDate.getFullYear(),
      month: randomDate.getMonth() + 1,
      week: Math.ceil(randomDate.getDate() / 7),
      dayOfWeek: randomDate.getDay(),
      quarter: Math.ceil((randomDate.getMonth() + 1) / 3),
      customer: customer._id,
      product: product._id,
      quantity,
      revenue: {
        gross: Math.round(grossRevenue * 100) / 100,
        net: Math.round(netRevenue * 100) / 100,
        currency: 'ZAR'
      },
      pricing: {
        unitPrice: Math.round(unitPrice * 100) / 100,
        listPrice: product.pricing.listPrice,
        discount: Math.round((product.pricing.listPrice - unitPrice) * 100) / 100
      }
    });
    
    salesData.push(salesRecord);
  }
  
  // Batch insert
  await SalesHistory.insertMany(salesData);
  console.log(`✅ Generated ${salesData.length} sales transactions`);
  
  return salesData.length;
};

// Main seeding function
const seedMondelezTestCo = async () => {
  try {
    console.log('🌱 Starting Mondelez TestCo seeding process...');
    
    // Find TestCo tenant and company
    const testCoTenant = await Tenant.findOne({ name: 'Test Company' });
    if (!testCoTenant) {
      throw new Error('TestCo tenant not found. Please run basic seed first.');
    }
    
    let testCoCompany = await Company.findOne({ name: 'Test Company' });
    if (!testCoCompany) {
      throw new Error('TestCo company not found.');
    }
    
    // Update company with tenantId if not set
    if (!testCoCompany.tenantId) {
      testCoCompany.tenantId = testCoTenant._id;
      await testCoCompany.save();
      console.log('✅ Updated TestCo company with tenantId');
    }
    
    console.log(`✅ Found TestCo tenant: ${testCoTenant._id}`);
    
    // 1. Create Mondelez Products
    console.log('📦 Creating Mondelez products...');
    const createdProducts = [];
    
    for (const productData of mondelezProducts) {
      const product = new Product({
        tenantId: testCoTenant._id,
        company: testCoCompany._id,
        sapMaterialId: `SAP-${productData.sku}`,
        name: productData.name,
        sku: productData.sku,
        barcode: `${Math.random().toString().substr(2, 13)}`,
        description: `${productData.brand} ${productData.name} - Premium quality`,
        
        // Product hierarchy
        hierarchy: {
          level1: { id: 'FMCG', name: 'Fast Moving Consumer Goods', code: 'FMCG' },
          level2: { id: productData.category.toUpperCase(), name: productData.category, code: productData.category.substr(0, 3).toUpperCase() },
          level3: { id: productData.brand.toUpperCase(), name: productData.brand, code: productData.brand.substr(0, 3).toUpperCase() }
        },
        
        productType: 'own_brand',
        category: {
          primary: productData.category,
          secondary: [productData.brand]
        },
        brand: {
          id: productData.brand.toLowerCase(),
          name: productData.brand,
          owner: 'company'
        },
        
        // Pricing in ZAR
        pricing: {
          listPrice: productData.price,
          currency: 'ZAR',
          costPrice: productData.cost,
          marginPercentage: Math.round(((productData.price - productData.cost) / productData.price * 100) * 100) / 100
        },
        
        // Performance targets
        performance: {
          currentYearTarget: {
            units: Math.floor(Math.random() * 100000) + 50000,
            value: Math.floor(Math.random() * 5000000) + 2000000
          }
        },
        
        status: 'active'
      });
      
      await product.save();
      createdProducts.push(product);
    }
    
    console.log(`✅ Created ${createdProducts.length} Mondelez products`);
    
    // 2. Create South African Customers
    console.log('🏪 Creating South African retail customers...');
    const createdCustomers = [];
    
    for (const customerData of southAfricanCustomers) {
      const customer = new Customer({
        tenantId: testCoTenant._id,
        company: testCoCompany._id,
        sapCustomerId: `SAP-${customerData.code}`,
        name: customerData.name,
        code: customerData.code,
        
        // Customer hierarchy by region and type
        hierarchy: {
          level1: { id: 'ZA', name: 'South Africa', code: 'ZA' },
          level2: { id: customerData.region.replace(/\s+/g, ''), name: customerData.region, code: customerData.region.substr(0, 3).toUpperCase() },
          level3: { id: customerData.type.toUpperCase(), name: customerData.type, code: customerData.type.substr(0, 3).toUpperCase() }
        },
        
        customerType: customerData.type,
        channel: customerData.channel,
        tier: customerData.tier,
        
        // Contact info
        contacts: [{
          name: `${customerData.name} Buyer`,
          position: 'Category Manager',
          email: `buyer@${customerData.code.toLowerCase()}.co.za`,
          phone: `+27${Math.floor(Math.random() * 900000000) + 100000000}`,
          isPrimary: true
        }],
        
        // Address
        addresses: [{
          type: 'both',
          street: `${Math.floor(Math.random() * 999) + 1} ${customerData.name} Street`,
          city: customerData.region === 'National' ? 'Johannesburg' : customerData.region.split(' ')[0],
          state: customerData.region === 'National' ? 'Gauteng' : customerData.region,
          country: 'South Africa',
          postalCode: `${Math.floor(Math.random() * 9000) + 1000}`
        }],
        
        // Financial terms
        creditLimit: customerData.creditLimit,
        paymentTerms: customerData.tier === 'platinum' ? 'NET30' : customerData.tier === 'gold' ? 'NET45' : 'NET60',
        currency: 'ZAR',
        
        // Budget allocations based on tier and size
        budgetAllocations: {
          marketing: {
            annual: customerData.creditLimit * 0.02, // 2% of credit limit
            available: customerData.creditLimit * 0.02
          },
          cashCoop: {
            annual: customerData.creditLimit * 0.015, // 1.5% of credit limit
            available: customerData.creditLimit * 0.015
          },
          tradingTerms: {
            annual: customerData.creditLimit * 0.025, // 2.5% of credit limit
            available: customerData.creditLimit * 0.025
          }
        },
        
        // Performance targets
        performance: {
          currentYearTarget: customerData.creditLimit * 0.8, // 80% of credit limit as sales target
          lastYearSales: customerData.creditLimit * 0.75 // 75% achievement last year
        },
        
        status: 'active'
      });
      
      await customer.save();
      createdCustomers.push(customer);
    }
    
    console.log(`✅ Created ${createdCustomers.length} South African customers`);
    
    // 3. Generate sample sales data
    const salesCount = await generateSampleSalesData(createdProducts, createdCustomers, testCoTenant._id, testCoCompany._id);
    
    // 4. Create a budget for 2024
    console.log('💰 Creating 2024 budget...');
    
    const budget = new Budget({
      tenantId: testCoTenant._id,
      company: testCoCompany._id,
      name: 'Mondelez SA Budget 2024',
      code: 'MDLZ-SA-2024',
      year: 2024,
      budgetType: 'budget',
      status: 'approved',
      
      scope: {
        level: 'company'
      },
      
      // Monthly budget lines
      budgetLines: Array.from({ length: 12 }, (_, month) => ({
        month: month + 1,
        salesTarget: {
          units: Math.floor(Math.random() * 500000) + 200000,
          value: Math.floor(Math.random() * 50000000) + 20000000,
          currency: 'ZAR'
        },
        tradeSpend: {
          marketing: Math.floor(Math.random() * 2000000) + 500000,
          cashCoop: Math.floor(Math.random() * 1500000) + 300000,
          tradingTerms: Math.floor(Math.random() * 2500000) + 800000,
          total: 0 // Will be calculated
        }
      }))
    });
    
    // Calculate totals
    budget.budgetLines.forEach(line => {
      line.tradeSpend.total = line.tradeSpend.marketing + line.tradeSpend.cashCoop + line.tradeSpend.tradingTerms;
    });
    
    await budget.save();
    console.log('✅ Created 2024 budget');
    
    // Summary
    const totalSalesValue = await SalesHistory.aggregate([
      { $match: { tenantId: testCoTenant._id } },
      { $group: { _id: null, total: { $sum: '$revenue.net' } } }
    ]).then(result => result[0]?.total || 0);
    
    const summary = {
      tenant: testCoTenant.name,
      products: createdProducts.length,
      customers: createdCustomers.length,
      salesTransactions: salesCount,
      budgets: 1,
      totalSalesValue: Math.round(totalSalesValue),
      currency: 'ZAR'
    };
    
    console.log('\n🎉 Mondelez TestCo seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   • Tenant: ${summary.tenant}`);
    console.log(`   • Products: ${summary.products} Mondelez products`);
    console.log(`   • Customers: ${summary.customers} South African retailers`);
    console.log(`   • Sales Transactions: ${summary.salesTransactions.toLocaleString()}`);
    console.log(`   • Budgets: ${summary.budgets} annual budget`);
    console.log(`   • Total Sales Value: R${(summary.totalSalesValue / 1000000).toFixed(1)}M`);
    
    return summary;
    
  } catch (error) {
    console.error('❌ Error seeding Mondelez TestCo data:', error);
    throw error;
  }
};

// Run the seeding
const main = async () => {
  await connectDB();
  await seedMondelezTestCo();
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
  process.exit(0);
};

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { seedMondelezTestCo };