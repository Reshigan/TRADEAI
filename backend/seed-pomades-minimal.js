const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Tenant = require('./src/models/Tenant');
const Company = require('./src/models/Company');
const Product = require('./src/models/Product');
const Customer = require('./src/models/Customer');
const Promotion = require('./src/models/Promotion');
const Budget = require('./src/models/Budget');

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

const findPomadesTenant = async () => {
  console.log('\n🔍 Finding Pomades Confectionary tenant...');
  
  const company = await Company.findOne({ 
    $or: [
      { code: 'POMADES' },
      { name: /Pomades/i }
    ]
  });
  
  if (!company) {
    console.error('❌ Pomades Confectionary company not found!');
    return null;
  }
  
  const tenant = await Tenant.findOne({ 
    $or: [
      { slug: 'pomades' },
      { name: /Pomades/i }
    ]
  });
  
  if (!tenant) {
    console.error('❌ Pomades Confectionary tenant not found!');
    return null;
  }
  
  const User = require('./src/models/User');
  const adminUser = await User.findOne({ email: 'admin@pomades.demo' });
  if (!adminUser) {
    console.error('❌ Admin user admin@pomades.demo not found!');
    return null;
  }
  
  console.log(`✅ Found tenant: ${tenant.name} (${tenant._id})`);
  console.log(`✅ Found company: ${company.name} (${company._id})`);
  console.log(`✅ Found admin user: ${adminUser.email} (${adminUser._id})`);
  
  return { tenant, company, adminUser };
};

const seedProducts = async (tenantId, companyId) => {
  console.log('\n📦 Seeding products...');
  
  const products = [
    { name: 'Dairy Delight Milk Chocolate 80g', sku: 'DD-CHO-001', price: 22.99, cost: 13.79, category: 'Chocolate', brand: 'Dairy Delight' },
    { name: 'Dairy Delight Fruit & Nut 80g', sku: 'DD-CHO-002', price: 24.99, cost: 14.99, category: 'Chocolate', brand: 'Dairy Delight' },
    { name: 'Lunch Time Bar 48g', sku: 'LT-BAR-001', price: 12.99, cost: 7.79, category: 'Chocolate', brand: 'Lunch Time' },
    { name: 'Snack Time Wafer 40g', sku: 'ST-WAF-001', price: 10.99, cost: 6.59, category: 'Chocolate', brand: 'Snack Time' },
    { name: 'Premium Gold 70% Dark 100g', sku: 'PG-DRK-001', price: 45.99, cost: 27.59, category: 'Chocolate', brand: 'Premium Gold' },
    { name: 'Fruity Bites Gummies 125g', sku: 'FB-GUM-001', price: 22.99, cost: 13.79, category: 'Gummies', brand: 'Fruity Bites' },
    { name: 'Jelly Joy Babies 150g', sku: 'JJ-BAB-001', price: 18.99, cost: 11.39, category: 'Gummies', brand: 'Jelly Joy' },
    { name: 'Sweet Treats Toffees 250g', sku: 'SW-TOF-001', price: 28.99, cost: 17.39, category: 'Candy', brand: 'Sweet Treats' },
    { name: 'Fresh Mint Spearmint 14s', sku: 'FM-SPE-001', price: 8.99, cost: 5.39, category: 'Gum', brand: 'Fresh Mint' },
    { name: 'Bubble Fun Original 50g', sku: 'BF-ORI-001', price: 12.99, cost: 7.79, category: 'Gum', brand: 'Bubble Fun' },
    { name: 'Dairy Delight Top Layer 80g', sku: 'DD-CHO-003', price: 24.99, cost: 14.99, category: 'Chocolate', brand: 'Dairy Delight' },
    { name: 'Lunch Time Peanut Bar 52g', sku: 'LT-BAR-002', price: 12.99, cost: 7.79, category: 'Chocolate', brand: 'Lunch Time' },
    { name: 'Premium Gold Hazelnut 100g', sku: 'PG-HAZ-001', price: 48.99, cost: 29.39, category: 'Chocolate', brand: 'Premium Gold' },
    { name: 'Fruity Bites Wine Gums 125g', sku: 'FB-WIN-001', price: 22.99, cost: 13.79, category: 'Gummies', brand: 'Fruity Bites' },
    { name: 'Sweet Treats Mints 200g', sku: 'SW-MIN-001', price: 24.99, cost: 14.99, category: 'Candy', brand: 'Sweet Treats' },
  ];
  
  const createdProducts = [];
  
  for (let i = 0; i < products.length; i++) {
    const prod = products[i];
    const result = await Product.findOneAndUpdate(
      { tenantId, sku: prod.sku },
      {
        $set: {
          tenantId,
          company: companyId,
          companyId,
          name: prod.name,
          sku: prod.sku,
          sapMaterialId: `MAT-POMADES-${String(i + 1).padStart(4, '0')}`,
          barcode: `600123400${String(i + 1).padStart(4, '0')}`,
          category: prod.category,
          brand: prod.brand,
          productType: 'own_brand',
          description: `${prod.brand} ${prod.name}`,
          pricing: {
            listPrice: prod.price,
            costPrice: prod.cost,
            currency: 'ZAR'
          },
          inventory: {
            stockLevel: 1000,
            reorderLevel: 200,
            unit: 'units'
          },
          isActive: true,
          status: 'active'
        }
      },
      { upsert: true, new: true }
    );
    createdProducts.push(result);
  }
  
  console.log(`✅ Upserted ${createdProducts.length} products`);
  return createdProducts;
};

const seedCustomers = async (tenantId, companyId) => {
  console.log('\n👥 Seeding customers...');
  
  const customers = [
    { name: 'Pick n Pay', code: 'PNP-001', type: 'Supermarket', tier: 'National' },
    { name: 'Shoprite', code: 'SHP-001', type: 'Supermarket', tier: 'National' },
    { name: 'Checkers', code: 'CHK-001', type: 'Supermarket', tier: 'National' },
    { name: 'Spar', code: 'SPR-001', type: 'Supermarket', tier: 'Regional' },
    { name: 'Woolworths', code: 'WOL-001', type: 'Supermarket', tier: 'Premium' },
    { name: 'OK Foods', code: 'OKF-001', type: 'Supermarket', tier: 'Regional' },
    { name: 'Food Lovers Market', code: 'FLM-001', type: 'Supermarket', tier: 'Regional' },
    { name: 'Cambridge Food', code: 'CAM-001', type: 'Convenience Store', tier: 'Regional' },
    { name: 'Boxer', code: 'BOX-001', type: 'Supermarket', tier: 'Discount' },
    { name: 'Makro', code: 'MAK-001', type: 'Wholesale', tier: 'National' },
    { name: 'Pick n Pay Hyper', code: 'PNP-002', type: 'Hypermarket', tier: 'National' },
    { name: 'Shoprite Checkers', code: 'SHP-002', type: 'Supermarket', tier: 'National' },
    { name: 'Spar Express', code: 'SPR-002', type: 'Convenience Store', tier: 'Regional' },
    { name: 'Woolworths Food', code: 'WOL-002', type: 'Supermarket', tier: 'Premium' },
    { name: 'Food Lovers Deli', code: 'FLM-002', type: 'Specialty Store', tier: 'Regional' },
  ];
  
  const createdCustomers = [];
  
  for (const cust of customers) {
    const result = await Customer.findOneAndUpdate(
      { tenantId, code: cust.code },
      {
        $set: {
          tenantId,
          company: companyId,
          companyId,
          name: cust.name,
          code: cust.code,
          sapCustomerId: `SAP-${cust.code}`,
          customerType: cust.type,
          tier: cust.tier,
          status: 'active',
          paymentTerms: 'NET30',
          currency: 'ZAR',
          addresses: [{
            type: 'billing',
            city: 'Johannesburg',
            state: 'Gauteng',
            country: 'South Africa'
          }]
        }
      },
      { upsert: true, new: true }
    );
    createdCustomers.push(result);
  }
  
  console.log(`✅ Upserted ${createdCustomers.length} customers`);
  return createdCustomers;
};

const seedPromotions = async (tenantId, companyId, userId, products, customers) => {
  console.log('\n🎯 Seeding promotions...');
  
  const promotions = [
    { 
      code: 'PROMO-001', 
      name: 'Summer Chocolate Sale',
      type: 'discount',
      discountType: 'percentage',
      discountValue: 15,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-03-31')
    },
    { 
      code: 'PROMO-002', 
      name: 'Gummies Buy 2 Get 1',
      type: 'bogo',
      discountType: 'percentage',
      discountValue: 33,
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-04-30')
    },
    { 
      code: 'PROMO-003', 
      name: 'Premium Gold Discount',
      type: 'discount',
      discountType: 'fixed',
      discountValue: 10,
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-06-30')
    },
    { 
      code: 'PROMO-004', 
      name: 'Candy Mix Special',
      type: 'discount',
      discountType: 'percentage',
      discountValue: 20,
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-05-31')
    },
    { 
      code: 'PROMO-005', 
      name: 'National Retailers Promo',
      type: 'volume',
      discountType: 'percentage',
      discountValue: 10,
      startDate: new Date('2025-02-15'),
      endDate: new Date('2025-12-31')
    },
  ];
  
  const createdPromotions = [];
  
  for (const promo of promotions) {
    const result = await Promotion.findOneAndUpdate(
      { tenantId, promotionId: promo.code },
      {
        $set: {
          tenantId,
          company: companyId,
          companyId,
          promotionId: promo.code,
          name: promo.name,
          description: `${promo.name} - Special promotion`,
          promotionType: promo.type,
          status: 'active',
          period: {
            startDate: promo.startDate,
            endDate: promo.endDate
          },
          mechanics: {
            discountType: promo.discountType,
            discountValue: promo.discountValue
          },
          scope: {
            customers: customers.slice(0, 5).map(c => ({ customer: c._id }))
          },
          products: products.slice(0, 5).map(p => ({ product: p._id })),
          createdBy: userId
        }
      },
      { upsert: true, new: true }
    );
    createdPromotions.push(result);
  }
  
  console.log(`✅ Upserted ${createdPromotions.length} promotions`);
  return createdPromotions;
};

const seedBudgets = async (tenantId, companyId, userId) => {
  console.log('\n💰 Seeding budgets...');
  
  const budgets = [
    { code: 'BUD-2025-Q1', name: '2025 Q1 Trade Marketing', quarter: 'Q1', amount: 500000 },
    { code: 'BUD-2025-Q2', name: '2025 Q2 Trade Marketing', quarter: 'Q2', amount: 600000 },
    { code: 'BUD-2025-Q3', name: '2025 Q3 Trade Marketing', quarter: 'Q3', amount: 550000 },
    { code: 'BUD-2025-Q4', name: '2025 Q4 Trade Marketing', quarter: 'Q4', amount: 700000 },
    { code: 'BUD-2025-ANN', name: '2025 Annual Marketing', quarter: 'Annual', amount: 2000000 },
  ];
  
  const createdBudgets = [];
  
  for (const bud of budgets) {
    const result = await Budget.findOneAndUpdate(
      { company: companyId, name: bud.name },
      {
        $set: {
          company: companyId,
          name: bud.name,
          year: 2025,
          budgetType: 'budget',
          budgetCategory: 'trade_marketing',
          status: 'draft',
          scope: {
            level: 'company'
          },
          allocated: bud.amount * 0.7,
          spent: bud.amount * 0.3,
          remaining: bud.amount * 0.4,
          currency: 'ZAR',
          createdBy: userId
        }
      },
      { upsert: true, new: true }
    );
    createdBudgets.push(result);
  }
  
  console.log(`✅ Upserted ${createdBudgets.length} budgets`);
  return createdBudgets;
};

const main = async () => {
  try {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║   🌱 POMADES CONFECTIONARY MINIMAL SEED (SAFE)           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    
    await connectDB();
    
    const pomades = await findPomadesTenant();
    if (!pomades) {
      console.error('\n❌ Cannot proceed without Pomades Confectionary tenant/company');
      process.exit(1);
    }
    
    const { tenant, company, adminUser } = pomades;
    
    console.log('\n📊 Seeding minimal data for E2E tests...');
    console.log(`   Tenant: ${tenant.name} (${tenant._id})`);
    console.log(`   Company: ${company.name} (${company._id})`);
    console.log(`   Admin User: ${adminUser.email} (${adminUser._id})`);
    
    const products = await seedProducts(tenant._id, company._id);
    const customers = await seedCustomers(tenant._id, company._id);
    const promotions = await seedPromotions(tenant._id, company._id, adminUser._id, products, customers);
    const budgets = await seedBudgets(tenant._id, company._id, adminUser._id);
    
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ SEED COMPLETE                       ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('\n📊 Summary:');
    console.log(`   • Products: ${products.length}`);
    console.log(`   • Customers: ${customers.length}`);
    console.log(`   • Promotions: ${promotions.length}`);
    console.log(`   • Budgets: ${budgets.length}`);
    console.log('\n✅ Data seeded successfully for Pomades Confectionary!');
    console.log('✅ Ready for E2E testing with admin@pomades.demo');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
};

main();
