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
const Promotion = require('./src/models/Promotion');
const TradeSpend = require('./src/models/TradeSpend');
const TradingTerm = require('./src/models/TradingTerm');

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
  { category: 'Biscuits', brand: 'Bakers', name: 'Bakers Marie Biscuits 200g', sku: 'BAK-003', price: 16.99, cost: 10.19 },
  
  // Chocolate & Confectionery
  { category: 'Chocolate', brand: 'Cadbury', name: 'Cadbury Dairy Milk 80g', sku: 'CAD-001', price: 22.99, cost: 13.79 },
  { category: 'Chocolate', brand: 'Cadbury', name: 'Cadbury Dairy Milk Fruit & Nut 80g', sku: 'CAD-002', price: 24.99, cost: 14.99 },
  { category: 'Chocolate', brand: 'Cadbury', name: 'Cadbury Dairy Milk Whole Nut 80g', sku: 'CAD-003', price: 24.99, cost: 14.99 },
  { category: 'Chocolate', brand: 'Cadbury', name: 'Cadbury Lunch Bar 48g', sku: 'CAD-004', price: 12.99, cost: 7.79 },
  { category: 'Chocolate', brand: 'Cadbury', name: 'Cadbury PS Bar 52g', sku: 'CAD-005', price: 12.99, cost: 7.79 },
  { category: 'Chocolate', brand: 'Cadbury', name: 'Cadbury Top Deck 80g', sku: 'CAD-006', price: 22.99, cost: 13.79 },
  { category: 'Chocolate', brand: 'Toblerone', name: 'Toblerone Milk Chocolate 100g', sku: 'TOB-001', price: 45.99, cost: 27.59 },
  { category: 'Chocolate', brand: 'Milka', name: 'Milka Alpine Milk 100g', sku: 'MIL-001', price: 28.99, cost: 17.39 },
  
  // Gum & Mints
  { category: 'Gum', brand: 'Trident', name: 'Trident Spearmint Gum 14s', sku: 'TRI-001', price: 8.99, cost: 5.39 },
  { category: 'Gum', brand: 'Trident', name: 'Trident Peppermint Gum 14s', sku: 'TRI-002', price: 8.99, cost: 5.39 },
  { category: 'Gum', brand: 'Halls', name: 'Halls Mentho-Lyptus 33.5g', sku: 'HAL-001', price: 12.99, cost: 7.79 },
  { category: 'Gum', brand: 'Halls', name: 'Halls Extra Strong 33.5g', sku: 'HAL-002', price: 12.99, cost: 7.79 },
  
  // Beverages
  { category: 'Beverages', brand: 'Tang', name: 'Tang Orange 500g', sku: 'TAN-001', price: 35.99, cost: 21.59 },
  { category: 'Beverages', brand: 'Tang', name: 'Tang Tropical 500g', sku: 'TAN-002', price: 35.99, cost: 21.59 },
  { category: 'Beverages', brand: 'Jacobs', name: 'Jacobs Kronung Coffee 200g', sku: 'JAC-001', price: 89.99, cost: 53.99 },
  { category: 'Beverages', brand: 'Jacobs', name: 'Jacobs Millicano Coffee 90g', sku: 'JAC-002', price: 65.99, cost: 39.59 },
  
  // Cheese & Dairy
  { category: 'Cheese', brand: 'Philadelphia', name: 'Philadelphia Original Cream Cheese 230g', sku: 'PHI-001', price: 42.99, cost: 25.79 },
  { category: 'Cheese', brand: 'Philadelphia', name: 'Philadelphia Light Cream Cheese 230g', sku: 'PHI-002', price: 42.99, cost: 25.79 },
  { category: 'Cheese', brand: 'Laughing Cow', name: 'Laughing Cow Original 120g', sku: 'LAU-001', price: 28.99, cost: 17.39 },
];

// South African Retail Customers
const southAfricanCustomers = [
  // Major Retail Chains
  { name: 'Shoprite Holdings', code: 'SHP001', type: 'chain', channel: 'modern_trade', tier: 'platinum', creditLimit: 50000000, region: 'National' },
  { name: 'Pick n Pay', code: 'PNP001', type: 'chain', channel: 'modern_trade', tier: 'platinum', creditLimit: 45000000, region: 'National' },
  { name: 'Woolworths', code: 'WOL001', type: 'chain', channel: 'modern_trade', tier: 'gold', creditLimit: 30000000, region: 'National' },
  { name: 'SPAR Group', code: 'SPA001', type: 'chain', channel: 'modern_trade', tier: 'gold', creditLimit: 35000000, region: 'National' },
  { name: 'Massmart (Game, Makro)', code: 'MAS001', type: 'chain', channel: 'modern_trade', tier: 'gold', creditLimit: 40000000, region: 'National' },
  { name: 'Checkers', code: 'CHE001', type: 'chain', channel: 'modern_trade', tier: 'platinum', creditLimit: 42000000, region: 'National' },
  
  // Regional Chains
  { name: 'Food Lover\'s Market', code: 'FLM001', type: 'chain', channel: 'modern_trade', tier: 'silver', creditLimit: 15000000, region: 'Western Cape' },
  { name: 'Fruit & Veg City', code: 'FVC001', type: 'chain', channel: 'modern_trade', tier: 'silver', creditLimit: 12000000, region: 'Gauteng' },
  { name: 'Cambridge Food', code: 'CAM001', type: 'chain', channel: 'modern_trade', tier: 'silver', creditLimit: 8000000, region: 'KwaZulu-Natal' },
  
  // Wholesalers
  { name: 'Makro', code: 'MAK001', type: 'wholesaler', channel: 'b2b', tier: 'platinum', creditLimit: 60000000, region: 'National' },
  { name: 'Cash & Carry', code: 'CNC001', type: 'wholesaler', channel: 'b2b', tier: 'gold', creditLimit: 25000000, region: 'National' },
  { name: 'Jumbo Cash & Carry', code: 'JUM001', type: 'wholesaler', channel: 'b2b', tier: 'silver', creditLimit: 15000000, region: 'Gauteng' },
  
  // Independent Retailers
  { name: 'Spaza Shops Network', code: 'SPN001', type: 'independent', channel: 'traditional_trade', tier: 'bronze', creditLimit: 2000000, region: 'National' },
  { name: 'Corner Cafe Group', code: 'CCG001', type: 'independent', channel: 'traditional_trade', tier: 'bronze', creditLimit: 1500000, region: 'National' },
  { name: 'Township Retailers', code: 'TWR001', type: 'independent', channel: 'traditional_trade', tier: 'standard', creditLimit: 3000000, region: 'National' },
  
  // Online & E-commerce
  { name: 'Takealot', code: 'TAK001', type: 'online', channel: 'ecommerce', tier: 'gold', creditLimit: 20000000, region: 'National' },
  { name: 'Checkers Sixty60', code: 'C60001', type: 'online', channel: 'ecommerce', tier: 'silver', creditLimit: 10000000, region: 'National' },
  
  // HORECA (Hotels, Restaurants, Cafes)
  { name: 'Tsogo Sun Hotels', code: 'TSH001', type: 'chain', channel: 'horeca', tier: 'gold', creditLimit: 8000000, region: 'National' },
  { name: 'Ocean Basket', code: 'OCB001', type: 'chain', channel: 'horeca', tier: 'silver', creditLimit: 5000000, region: 'National' },
  { name: 'Steers Holdings', code: 'STE001', type: 'chain', channel: 'horeca', tier: 'silver', creditLimit: 6000000, region: 'National' },
];

// Generate realistic sales data for 2 years
const generateSalesData = (products, customers, startDate, endDate) => {
  const salesData = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // Generate 50-200 transactions per day
    const dailyTransactions = Math.floor(Math.random() * 150) + 50;
    
    for (let i = 0; i < dailyTransactions; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const customer = customers[Math.floor(Math.random() * customers.length)];
      
      // Seasonal and customer tier adjustments
      let baseQuantity = Math.floor(Math.random() * 100) + 10;
      let seasonalMultiplier = 1;
      
      // Holiday seasons boost
      const month = currentDate.getMonth() + 1;
      if (month === 12 || month === 4) seasonalMultiplier = 1.5; // December & Easter
      if (month === 6 || month === 7) seasonalMultiplier = 0.8; // Winter months
      
      // Customer tier adjustments
      const tierMultipliers = { platinum: 3, gold: 2, silver: 1.5, bronze: 1, standard: 0.8 };
      const tierMultiplier = tierMultipliers[customer.tier] || 1;
      
      const quantity = Math.max(1, Math.floor(baseQuantity * seasonalMultiplier * tierMultiplier));
      const unitPrice = Math.round((product.price * (0.9 + Math.random() * 0.2)) * 100) / 100; // ±10% price variation, rounded
      const grossRevenue = Math.round((quantity * unitPrice) * 100) / 100;
      const netRevenue = Math.round((grossRevenue * 0.95) * 100) / 100; // 5% trade discounts
      const discount = Math.round((product.price - unitPrice) * 100) / 100;
      
      // Validate numbers before adding
      if (isNaN(quantity) || isNaN(unitPrice) || isNaN(grossRevenue) || isNaN(netRevenue) || isNaN(discount)) {
        console.warn('Skipping invalid sales data:', { quantity, unitPrice, grossRevenue, netRevenue, discount });
        continue;
      }
      
      salesData.push({
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: new Date(currentDate),
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        week: Math.ceil(currentDate.getDate() / 7),
        dayOfWeek: currentDate.getDay(),
        quarter: Math.ceil((currentDate.getMonth() + 1) / 3),
        productId: product._id,
        customerId: customer._id,
        quantity,
        revenue: {
          gross: grossRevenue,
          net: netRevenue,
          currency: 'ZAR'
        },
        pricing: {
          unitPrice,
          listPrice: product.price,
          discount
        }
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return salesData;
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
          marginPercentage: ((productData.price - productData.cost) / productData.price * 100)
        },
        
        // Performance targets
        performance: {
          currentYearTarget: {
            units: Math.floor(Math.random() * 100000) + 50000,
            value: Math.floor(Math.random() * 5000000) + 2000000
          }
        },
        
        status: 'active',
        currency: 'ZAR'
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
        
        // Trading terms based on tier
        tradingTerms: {
          retroActive: {
            percentage: customerData.tier === 'platinum' ? 2.5 : customerData.tier === 'gold' ? 2.0 : 1.5,
            conditions: 'Annual volume achievement',
            validFrom: new Date('2023-01-01'),
            validTo: new Date('2024-12-31')
          },
          promptPayment: {
            percentage: 1.0,
            days: 10,
            conditions: 'Payment within 10 days'
          },
          volumeRebate: [{
            tierName: 'Tier 1',
            minVolume: 1000000,
            maxVolume: 5000000,
            percentage: 1.0,
            productScope: 'all'
          }, {
            tierName: 'Tier 2',
            minVolume: 5000001,
            maxVolume: 20000000,
            percentage: 1.5,
            productScope: 'all'
          }, {
            tierName: 'Tier 3',
            minVolume: 20000001,
            maxVolume: 999999999,
            percentage: 2.0,
            productScope: 'all'
          }]
        },
        
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
    
    // 3. Generate 2 years of sales history
    console.log('📊 Generating 2 years of sales history...');
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2024-12-31');
    
    const salesTransactions = generateSalesData(createdProducts, createdCustomers, startDate, endDate);
    
    // Batch insert sales data
    const batchSize = 1000;
    let totalInserted = 0;
    
    for (let i = 0; i < salesTransactions.length; i += batchSize) {
      const batch = salesTransactions.slice(i, i + batchSize).map(sale => ({
        tenantId: testCoTenant._id,
        company: testCoCompany._id,
        transactionId: sale.transactionId,
        date: sale.date,
        year: sale.year,
        month: sale.month,
        week: sale.week,
        dayOfWeek: sale.dayOfWeek,
        quarter: sale.quarter,
        customer: sale.customerId,
        product: sale.productId,
        quantity: sale.quantity,
        revenue: sale.revenue,
        pricing: sale.pricing
      }));
      
      await SalesHistory.insertMany(batch);
      totalInserted += batch.length;
      
      if (totalInserted % 10000 === 0) {
        console.log(`   📈 Inserted ${totalInserted} sales transactions...`);
      }
    }
    
    console.log(`✅ Generated ${totalInserted} sales transactions`);
    
    // 4. Create budgets for 2024 and 2025
    console.log('💰 Creating annual budgets...');
    
    for (const year of [2024, 2025]) {
      const budget = new Budget({
        tenantId: testCoTenant._id,
        company: testCoCompany._id,
        name: `Mondelez SA Budget ${year}`,
        code: `MDLZ-SA-${year}`,
        year,
        budgetType: 'budget',
        status: year === 2024 ? 'approved' : 'draft',
        
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
    }
    
    console.log('✅ Created annual budgets for 2024 and 2025');
    
    // 5. Create sample promotions
    console.log('🎯 Creating sample promotions...');
    
    const samplePromotions = [
      {
        name: 'Oreo Summer Promotion 2024',
        type: 'price_discount',
        products: createdProducts.filter(p => p.brand.name === 'Oreo').slice(0, 3),
        customers: createdCustomers.filter(c => c.tier === 'platinum').slice(0, 3),
        discount: 15,
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-31')
      },
      {
        name: 'Cadbury Easter Campaign 2024',
        type: 'volume_discount',
        products: createdProducts.filter(p => p.brand.name === 'Cadbury').slice(0, 5),
        customers: createdCustomers.filter(c => c.channel === 'modern_trade').slice(0, 5),
        discount: 20,
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-04-15')
      },
      {
        name: 'Back to School Biscuits 2024',
        type: 'bundle',
        products: createdProducts.filter(p => p.category.primary === 'Biscuits').slice(0, 4),
        customers: createdCustomers.filter(c => c.customerType === 'chain').slice(0, 6),
        discount: 12,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-02-28')
      }
    ];
    
    for (const promoData of samplePromotions) {
      const promotion = new Promotion({
        tenantId: testCoTenant._id,
        company: testCoCompany._id,
        name: promoData.name,
        code: `PROMO-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: promoData.type,
        
        scope: {
          products: promoData.products.map(p => p._id),
          customers: promoData.customers.map(c => c._id)
        },
        
        mechanics: {
          discountType: 'percentage',
          discountValue: promoData.discount,
          minQuantity: promoData.type === 'volume_discount' ? 100 : 1
        },
        
        period: {
          startDate: promoData.startDate,
          endDate: promoData.endDate
        },
        
        budget: {
          allocated: Math.floor(Math.random() * 5000000) + 1000000,
          currency: 'ZAR'
        },
        
        status: 'active'
      });
      
      await promotion.save();
    }
    
    console.log('✅ Created sample promotions');
    
    // 6. Calculate and update performance metrics
    console.log('📈 Updating performance metrics...');
    
    // Update product performance based on sales
    for (const product of createdProducts) {
      const productSales = await SalesHistory.aggregate([
        { $match: { product: product._id, year: 2024 } },
        { $group: {
          _id: null,
          totalUnits: { $sum: '$quantity' },
          totalValue: { $sum: '$revenue.net' }
        }}
      ]);
      
      if (productSales.length > 0) {
        product.performance.currentYearActual = {
          units: productSales[0].totalUnits,
          value: productSales[0].totalValue
        };
        product.performance.averageSellingPrice = productSales[0].totalValue / productSales[0].totalUnits;
        await product.save();
      }
    }
    
    // Update customer performance based on sales
    for (const customer of createdCustomers) {
      const customerSales = await SalesHistory.aggregate([
        { $match: { customer: customer._id, year: 2024 } },
        { $group: {
          _id: null,
          totalValue: { $sum: '$revenue.net' }
        }}
      ]);
      
      if (customerSales.length > 0) {
        customer.performance.currentYearActual = customerSales[0].totalValue;
        customer.performance.growthRate = customer.performance.lastYearSales > 0 ? 
          ((customerSales[0].totalValue - customer.performance.lastYearSales) / customer.performance.lastYearSales * 100) : 0;
        await customer.save();
      }
    }
    
    console.log('✅ Updated performance metrics');
    
    // Summary
    const summary = {
      tenant: testCoTenant.name,
      products: createdProducts.length,
      customers: createdCustomers.length,
      salesTransactions: totalInserted,
      budgets: 2,
      promotions: samplePromotions.length,
      totalSalesValue: await SalesHistory.aggregate([
        { $match: { tenantId: testCoTenant._id } },
        { $group: { _id: null, total: { $sum: '$revenue.net' } } }
      ]).then(result => result[0]?.total || 0),
      currency: 'ZAR'
    };
    
    console.log('\n🎉 Mondelez TestCo seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   • Tenant: ${summary.tenant}`);
    console.log(`   • Products: ${summary.products} Mondelez products`);
    console.log(`   • Customers: ${summary.customers} South African retailers`);
    console.log(`   • Sales Transactions: ${summary.salesTransactions.toLocaleString()}`);
    console.log(`   • Budgets: ${summary.budgets} annual budgets`);
    console.log(`   • Promotions: ${summary.promotions} sample promotions`);
    console.log(`   • Total Sales Value: R${(summary.totalSalesValue / 1000000).toFixed(1)}M`);
    console.log(`   • Period: 2023-2024 (2 years)`);
    
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