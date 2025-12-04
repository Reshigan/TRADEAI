/**
 * Seed Demo Tenants Script
 * Creates 5 demo companies with their tenants and users for testing
 * 
 * Companies:
 * 1. Pomades Confectionary (Manufacturer) - admin, manager, kam
 * 2. Sweet Dreams Manufacturing (Manufacturer) - admin, manager, kam
 * 3. Rainbow Distributors (Distributor) - admin, manager, kam
 * 4. Fresh Foods Retail (Retailer) - admin, manager, kam
 * 5. Metro Wholesale (Distributor - blank, no transactional data) - admin only
 * 
 * All users have password: Demo@123
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const Tenant = require('../src/models/Tenant');
const Company = require('../src/models/Company');
const User = require('../src/models/User');

// Demo companies configuration
const DEMO_COMPANIES = [
  {
    name: 'Pomades Confectionary',
    code: 'POMADES',
    domain: 'pomades.demo',
    companyType: 'manufacturer',
    industry: 'fmcg',
    users: [
      { email: 'admin@pomades.demo', firstName: 'Admin', lastName: 'User', role: 'admin', department: 'admin' },
      { email: 'manager@pomades.demo', firstName: 'Manager', lastName: 'User', role: 'manager', department: 'sales' },
      { email: 'kam@pomades.demo', firstName: 'KAM', lastName: 'User', role: 'kam', department: 'sales' }
    ],
    seedData: true
  },
  {
    name: 'Sweet Dreams Manufacturing',
    code: 'SWEETDREAMS',
    domain: 'sweetdreams.demo',
    companyType: 'manufacturer',
    industry: 'fmcg',
    users: [
      { email: 'admin@sweetdreams.demo', firstName: 'Admin', lastName: 'User', role: 'admin', department: 'admin' },
      { email: 'manager@sweetdreams.demo', firstName: 'Manager', lastName: 'User', role: 'manager', department: 'sales' },
      { email: 'kam@sweetdreams.demo', firstName: 'KAM', lastName: 'User', role: 'kam', department: 'sales' }
    ],
    seedData: true
  },
  {
    name: 'Rainbow Distributors',
    code: 'RAINBOW',
    domain: 'rainbow.demo',
    companyType: 'distributor',
    industry: 'distribution',
    users: [
      { email: 'admin@rainbow.demo', firstName: 'Admin', lastName: 'User', role: 'admin', department: 'admin' },
      { email: 'manager@rainbow.demo', firstName: 'Manager', lastName: 'User', role: 'manager', department: 'sales' },
      { email: 'kam@rainbow.demo', firstName: 'KAM', lastName: 'User', role: 'kam', department: 'sales' }
    ],
    seedData: true
  },
  {
    name: 'Fresh Foods Retail',
    code: 'FRESHFOODS',
    domain: 'freshfoods.demo',
    companyType: 'retailer',
    industry: 'retail',
    users: [
      { email: 'admin@freshfoods.demo', firstName: 'Admin', lastName: 'User', role: 'admin', department: 'admin' },
      { email: 'manager@freshfoods.demo', firstName: 'Manager', lastName: 'User', role: 'manager', department: 'sales' },
      { email: 'kam@freshfoods.demo', firstName: 'KAM', lastName: 'User', role: 'kam', department: 'sales' }
    ],
    seedData: true
  },
  {
    name: 'Metro Wholesale',
    code: 'METRO',
    domain: 'metro.demo',
    companyType: 'distributor',
    industry: 'distribution',
    users: [
      { email: 'admin@metro.demo', firstName: 'Admin', lastName: 'User', role: 'admin', department: 'admin' }
    ],
    seedData: false // Blank distributor - no transactional data
  }
];

const DEFAULT_PASSWORD = 'Demo@123';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradeai';
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create or update a tenant
const upsertTenant = async (companyConfig, companyId) => {
  const tenantData = {
    _id: companyId, // Use same ID as company for consistency
    name: companyConfig.name,
    slug: companyConfig.code.toLowerCase(),
    domain: companyConfig.domain,
      companyInfo: {
        legalName: companyConfig.name,
        // Use proper case for industry to match Tenant model enum: ['FMCG', 'Retail', 'Manufacturing', 'Distribution', 'Other']
        industry: companyConfig.industry === 'fmcg' ? 'FMCG' : 
                  companyConfig.industry.charAt(0).toUpperCase() + companyConfig.industry.slice(1).toLowerCase(),
        companySize: 'medium'
      },
    subscription: {
      plan: 'professional',
      status: 'active'
    },
    limits: {
      maxUsers: 50,
      maxCustomers: 1000,
      maxProducts: 5000,
      maxPromotions: 100
    },
    features: {
      multiCurrency: true,
      advancedAnalytics: true,
      aiPredictions: true,
      customReporting: true,
      apiAccess: true,
      excelImportExport: true,
      emailNotifications: true,
      workflowApprovals: true,
      auditLogging: true
    },
    settings: {
      timezone: 'Africa/Johannesburg',
      dateFormat: 'DD/MM/YYYY',
      currency: 'ZAR',
      language: 'en'
    },
    isActive: true,
    isVerified: true
  };

  const tenant = await Tenant.findOneAndUpdate(
    { slug: companyConfig.code.toLowerCase() },
    { $set: tenantData },
    { upsert: true, new: true }
  );

  console.log(`  Tenant: ${tenant.name} (${tenant._id})`);
  return tenant;
};

// Create or update a company
const upsertCompany = async (companyConfig) => {
  // Generate a consistent ObjectId based on company code
  const companyId = new mongoose.Types.ObjectId();

  const companyData = {
    name: companyConfig.name,
    code: companyConfig.code,
    domain: companyConfig.domain,
    companyType: companyConfig.companyType,
    industry: companyConfig.industry,
    country: 'ZA',
    currency: 'ZAR',
    timezone: 'Africa/Johannesburg',
    address: {
      city: 'Johannesburg',
      state: 'Gauteng',
      country: 'South Africa'
    },
    contactInfo: {
      email: `info@${companyConfig.domain}`,
      phone: '+27 11 000 0000'
    },
    subscription: {
      plan: 'professional',
      status: 'active',
      maxUsers: 50,
      maxCustomers: 1000,
      maxProducts: 5000
    },
    settings: {
      dateFormat: 'DD/MM/YYYY',
      numberFormat: 'en-ZA',
      fiscalYearStart: '01-01'
    },
    isActive: true
  };

  // Check if company exists
  let company = await Company.findOne({ code: companyConfig.code });
  
  if (company) {
    // Update existing company
    company = await Company.findOneAndUpdate(
      { code: companyConfig.code },
      { $set: companyData },
      { new: true }
    );
    console.log(`  Company (updated): ${company.name} (${company._id})`);
  } else {
    // Create new company with specific ID
    companyData._id = companyId;
    company = await Company.create(companyData);
    console.log(`  Company (created): ${company.name} (${company._id})`);
  }

  return company;
};

// Create or update a user
const upsertUser = async (userConfig, companyId, tenantId) => {
  // Hash password
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const userData = {
    email: userConfig.email.toLowerCase(),
    password: hashedPassword,
    firstName: userConfig.firstName,
    lastName: userConfig.lastName,
    role: userConfig.role,
    department: userConfig.department,
    companyId: companyId,
    tenantId: tenantId,
    employeeId: `EMP-${userConfig.email.split('@')[0].toUpperCase()}`,
    isActive: true,
    isDeleted: false,
    preferences: {
      notifications: {
        email: true,
        inApp: true,
        sms: false
      },
      language: 'en',
      timezone: 'Africa/Johannesburg',
      currency: 'ZAR',
      dateFormat: 'DD/MM/YYYY'
    }
  };

  const user = await User.findOneAndUpdate(
    { email: userConfig.email.toLowerCase() },
    { $set: userData },
    { upsert: true, new: true }
  );

  console.log(`    User: ${user.email} (${user.role})`);
  return user;
};

// Seed sample data for a company
const seedSampleData = async (companyId, tenantId, adminUserId, companyConfig) => {
  const Product = require('../src/models/Product');
  const Customer = require('../src/models/Customer');
  const Promotion = require('../src/models/Promotion');
  const Budget = require('../src/models/Budget');

  console.log(`  Seeding sample data for ${companyConfig.name}...`);

  // Sample products
  const products = [
    { name: 'Product A', sku: `${companyConfig.code}-001`, price: 25.99, cost: 15.00, category: 'Category 1' },
    { name: 'Product B', sku: `${companyConfig.code}-002`, price: 35.99, cost: 20.00, category: 'Category 1' },
    { name: 'Product C', sku: `${companyConfig.code}-003`, price: 45.99, cost: 25.00, category: 'Category 2' },
    { name: 'Product D', sku: `${companyConfig.code}-004`, price: 55.99, cost: 30.00, category: 'Category 2' },
    { name: 'Product E', sku: `${companyConfig.code}-005`, price: 65.99, cost: 35.00, category: 'Category 3' }
  ];

  for (let i = 0; i < products.length; i++) {
    const prod = products[i];
    await Product.findOneAndUpdate(
      { tenantId, sku: prod.sku },
      {
        $set: {
          tenantId,
          company: companyId,
          companyId,
          name: prod.name,
          sku: prod.sku,
          barcode: `${companyConfig.code}${String(i + 1).padStart(8, '0')}`,
          sapMaterialId: `MAT-${companyConfig.code}-${String(i + 1).padStart(4, '0')}`,
          category: prod.category,
          pricing: {
            listPrice: prod.price,
            costPrice: prod.cost,
            currency: 'ZAR'
          },
          isActive: true,
          status: 'active'
        }
      },
      { upsert: true }
    );
  }
  console.log(`    Products: ${products.length}`);

  // Sample customers
  const customers = [
    { name: 'Customer 1', code: `${companyConfig.code}-CUST-001`, type: 'Retailer' },
    { name: 'Customer 2', code: `${companyConfig.code}-CUST-002`, type: 'Wholesaler' },
    { name: 'Customer 3', code: `${companyConfig.code}-CUST-003`, type: 'Distributor' }
  ];

  for (let i = 0; i < customers.length; i++) {
    const cust = customers[i];
    await Customer.findOneAndUpdate(
      { tenantId, code: cust.code },
      {
        $set: {
          tenantId,
          company: companyId,
          companyId,
          name: cust.name,
          code: cust.code,
          sapCustomerId: `SAP-${companyConfig.code}-${String(i + 1).padStart(4, '0')}`,
          customerType: cust.type,
          status: 'active',
          currency: 'ZAR'
        }
      },
      { upsert: true }
    );
  }
  console.log(`    Customers: ${customers.length}`);

  // Sample promotions
  const promotions = [
    { code: `${companyConfig.code}-PROMO-001`, name: 'Summer Sale', discount: 15 },
    { code: `${companyConfig.code}-PROMO-002`, name: 'Winter Special', discount: 20 }
  ];

  for (const promo of promotions) {
    await Promotion.findOneAndUpdate(
      { tenantId, promotionId: promo.code },
      {
        $set: {
          tenantId,
          company: companyId,
          companyId,
          promotionId: promo.code,
          name: promo.name,
          promotionType: 'discount',
          status: 'active',
          period: {
            startDate: new Date('2025-01-01'),
            endDate: new Date('2025-12-31')
          },
          mechanics: {
            discountType: 'percentage',
            discountValue: promo.discount
          },
          createdBy: adminUserId
        }
      },
      { upsert: true }
    );
  }
  console.log(`    Promotions: ${promotions.length}`);

  // Sample budgets
  const budgets = [
    { name: '2025 Q1 Budget', amount: 500000 },
    { name: '2025 Q2 Budget', amount: 600000 }
  ];

  for (const bud of budgets) {
    await Budget.findOneAndUpdate(
      { company: companyId, name: bud.name },
      {
        $set: {
          company: companyId,
          name: bud.name,
          year: 2025,
          budgetType: 'budget',
          budgetCategory: 'trade_marketing',
          status: 'approved',
          allocated: bud.amount * 0.7,
          spent: bud.amount * 0.3,
          remaining: bud.amount * 0.4,
          currency: 'ZAR',
          createdBy: adminUserId
        }
      },
      { upsert: true }
    );
  }
  console.log(`    Budgets: ${budgets.length}`);
};

// Main function
const main = async () => {
  try {
    console.log('\n========================================');
    console.log('  DEMO TENANTS SEED SCRIPT');
    console.log('========================================\n');

    await connectDB();

    console.log('Creating demo companies and users...\n');

    for (const companyConfig of DEMO_COMPANIES) {
      console.log(`\nProcessing: ${companyConfig.name}`);
      console.log('-'.repeat(40));

      // Create company first
      const company = await upsertCompany(companyConfig);

      // Create tenant with same ID as company
      const tenant = await upsertTenant(companyConfig, company._id);

      // Create users
      console.log('  Users:');
      let adminUser = null;
      for (const userConfig of companyConfig.users) {
        const user = await upsertUser(userConfig, company._id, tenant._id);
        if (userConfig.role === 'admin') {
          adminUser = user;
        }
      }

      // Seed sample data if configured
      if (companyConfig.seedData && adminUser) {
        await seedSampleData(company._id, tenant._id, adminUser._id, companyConfig);
      } else if (!companyConfig.seedData) {
        console.log('  Sample data: Skipped (blank company)');
      }
    }

    console.log('\n========================================');
    console.log('  SEED COMPLETE');
    console.log('========================================');
    console.log('\nDemo Logins:');
    console.log('Password for all: Demo@123\n');
    
    for (const companyConfig of DEMO_COMPANIES) {
      console.log(`${companyConfig.name}:`);
      for (const user of companyConfig.users) {
        console.log(`  - ${user.email}`);
      }
    }

    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('\nSeed failed:', error);
    process.exit(1);
  }
};

main();
