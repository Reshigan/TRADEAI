const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Company, User, Customer, Product, Campaign } = require('../models');

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trade_ai_production';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clean and seed production data
const cleanAndSeedProductionData = async () => {
  try {
    console.log('Starting clean production data seeding...');

    // Clear existing data
    console.log('Clearing existing data...');
    await Company.deleteMany({});
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Product.deleteMany({});
    await Campaign.deleteMany({});
    console.log('Existing data cleared');

    // 1. Create Companies
    console.log('Creating companies...');

    // GONXT Company
    const gonxtCompany = new Company({
      name: 'GONXT',
      code: 'GONXT',
      domain: 'gonxt.tech',
      industry: 'fmcg',
      country: 'Australia',
      timezone: 'Australia/Sydney',
      currency: 'AUD',
      subscription: {
        plan: 'enterprise',
        status: 'active',
        maxUsers: 100,
        maxCustomers: 10000,
        maxProducts: 50000
      },
      enabledModules: [
        { module: 'customers', enabled: true },
        { module: 'products', enabled: true },
        { module: 'campaigns', enabled: true },
        { module: 'budgets', enabled: true },
        { module: 'analytics', enabled: true },
        { module: 'ai_insights', enabled: true },
        { module: 'reporting', enabled: true },
        { module: 'integrations', enabled: true }
      ]
    });
    await gonxtCompany.save();
    console.log('✓ GONXT company created');

    // Test Company
    const testCompany = new Company({
      name: 'Test Company',
      code: 'TESTCO',
      domain: 'test.demo',
      industry: 'retail',
      country: 'Australia',
      timezone: 'Australia/Sydney',
      currency: 'AUD',
      subscription: {
        plan: 'professional',
        status: 'active',
        maxUsers: 50,
        maxCustomers: 5000,
        maxProducts: 25000
      },
      enabledModules: [
        { module: 'customers', enabled: true },
        { module: 'products', enabled: true },
        { module: 'campaigns', enabled: true },
        { module: 'budgets', enabled: true },
        { module: 'analytics', enabled: true },
        { module: 'reporting', enabled: true }
      ]
    });
    await testCompany.save();
    console.log('✓ Test company created');

    // 2. Create Admin Users
    console.log('Creating admin users...');

    const hashedPassword = await bcrypt.hash('admin123', 12);

    // GONXT Admin
    const gonxtAdmin = new User({
      name: 'GONXT Admin',
      email: 'admin@tradeai.com',
      password: hashedPassword,
      role: 'admin',
      company: gonxtCompany._id,
      isActive: true,
      permissions: ['all']
    });
    await gonxtAdmin.save();
    console.log('✓ GONXT admin user created');

    // Test Admin
    const testAdmin = new User({
      name: 'Test Admin',
      email: 'test@tradeai.com',
      password: hashedPassword,
      role: 'admin',
      company: testCompany._id,
      isActive: true,
      permissions: ['all']
    });
    await testAdmin.save();
    console.log('✓ Test admin user created');

    // 3. Create Sample Customers
    console.log('Creating sample customers...');

    const sampleCustomers = [
      {
        name: 'Woolworths Group',
        code: 'WOW',
        company: gonxtCompany._id,
        contactInfo: {
          email: 'procurement@woolworths.com.au',
          phone: '+61-2-8885-0000'
        },
        businessDetails: {
          abn: '88 000 014 675',
          industry: 'Retail',
          annualRevenue: 60000000000,
          employeeCount: 200000
        },
        status: 'active',
        createdBy: gonxtAdmin._id
      },
      {
        name: 'Coles Group',
        code: 'COL',
        company: gonxtCompany._id,
        contactInfo: {
          email: 'suppliers@coles.com.au',
          phone: '+61-3-9829-5111'
        },
        businessDetails: {
          abn: '11 004 089 936',
          industry: 'Retail',
          annualRevenue: 40000000000,
          employeeCount: 120000
        },
        status: 'active',
        createdBy: gonxtAdmin._id
      },
      {
        name: 'IGA (Metcash)',
        code: 'IGA',
        company: gonxtCompany._id,
        contactInfo: {
          email: 'trading@metcash.com',
          phone: '+61-2-9741-3000'
        },
        businessDetails: {
          abn: '32 112 073 480',
          industry: 'Retail',
          annualRevenue: 15000000000,
          employeeCount: 25000
        },
        status: 'active',
        createdBy: gonxtAdmin._id
      }
    ];

    const customers = [];
    for (const customerData of sampleCustomers) {
      const customer = new Customer(customerData);
      await customer.save();
      customers.push(customer);
    }
    console.log(`✓ ${customers.length} customers created`);

    // 4. Create Sample Products
    console.log('Creating sample products...');

    const sampleProducts = [
      {
        name: 'Premium Breakfast Cereal',
        code: 'PBC001',
        sku: 'CEREAL-PBC-001',
        category: 'Breakfast Cereals',
        brand: 'Premium Brand',
        company: gonxtCompany._id,
        pricing: {
          costPrice: 2.50,
          wholesalePrice: 3.75,
          retailPrice: 5.99,
          currency: 'AUD'
        },
        specifications: {
          weight: '500g',
          dimensions: '25x15x8cm',
          shelfLife: '12 months'
        },
        status: 'active',
        createdBy: gonxtAdmin._id
      },
      {
        name: 'Organic Pasta Sauce',
        code: 'OPS001',
        sku: 'SAUCE-OPS-001',
        category: 'Sauces & Condiments',
        brand: 'Organic Choice',
        company: gonxtCompany._id,
        pricing: {
          costPrice: 1.80,
          wholesalePrice: 2.70,
          retailPrice: 4.49,
          currency: 'AUD'
        },
        specifications: {
          weight: '400g',
          dimensions: '12x8x8cm',
          shelfLife: '24 months'
        },
        status: 'active',
        createdBy: gonxtAdmin._id
      },
      {
        name: 'Premium Coffee Beans',
        code: 'PCB001',
        sku: 'COFFEE-PCB-001',
        category: 'Coffee & Tea',
        brand: 'Artisan Roast',
        company: gonxtCompany._id,
        pricing: {
          costPrice: 8.50,
          wholesalePrice: 12.75,
          retailPrice: 19.99,
          currency: 'AUD'
        },
        specifications: {
          weight: '1kg',
          dimensions: '20x15x10cm',
          shelfLife: '18 months'
        },
        status: 'active',
        createdBy: gonxtAdmin._id
      }
    ];

    const products = [];
    for (const productData of sampleProducts) {
      const product = new Product(productData);
      await product.save();
      products.push(product);
    }
    console.log(`✓ ${products.length} products created`);

    // 5. Create Sample Campaigns
    console.log('Creating sample campaigns...');

    const sampleCampaigns = [
      {
        name: 'Q1 2024 Breakfast Promotion',
        code: 'Q1-BREAKFAST-2024',
        type: 'promotion',
        company: gonxtCompany._id,
        customer: customers[0]._id, // Woolworths
        products: [products[0]._id], // Premium Breakfast Cereal
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        budget: {
          total: 50000,
          allocated: 45000,
          spent: 42000,
          currency: 'AUD'
        },
        objectives: ['Increase market share', 'Drive volume growth'],
        status: 'active',
        createdBy: gonxtAdmin._id
      },
      {
        name: 'Organic Range Launch',
        code: 'ORGANIC-LAUNCH-2024',
        type: 'launch',
        company: gonxtCompany._id,
        customer: customers[1]._id, // Coles
        products: [products[1]._id], // Organic Pasta Sauce
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-05-31'),
        budget: {
          total: 75000,
          allocated: 70000,
          spent: 35000,
          currency: 'AUD'
        },
        objectives: ['New product introduction', 'Build brand awareness'],
        status: 'active',
        createdBy: gonxtAdmin._id
      }
    ];

    const campaigns = [];
    for (const campaignData of sampleCampaigns) {
      const campaign = new Campaign(campaignData);
      await campaign.save();
      campaigns.push(campaign);
    }
    console.log(`✓ ${campaigns.length} campaigns created`);

    console.log(`\nProduction data seeding completed successfully!`);
    console.log(`Created/Verified:
    - 2 Companies (GONXT, Test Company)
    - 2 Admin Users
    - ${customers.length} Customers
    - ${products.length} Products
    - ${campaigns.length} Campaigns`);

  } catch (error) {
    console.error('Error seeding production data:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await cleanAndSeedProductionData();
    console.log('Clean production seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Clean production seeding failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { cleanAndSeedProductionData };