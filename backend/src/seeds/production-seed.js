const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Company = require('../models/Company');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Campaign = require('../models/Campaign');
const TradingTerm = require('../models/TradingTerm');
const Report = require('../models/Report');
const AIChat = require('../models/AIChat');
const PromotionAnalysis = require('../models/PromotionAnalysis');
const MarketingBudgetAllocation = require('../models/MarketingBudgetAllocation');
const CombinationAnalysis = require('../models/CombinationAnalysis');
const { connectDB } = require('../config/database');

// Helper function to generate random values
const generateRandomValue = (min, max, decimals = 0) => {
  const value = Math.random() * (max - min) + min;
  return decimals > 0 ? parseFloat(value.toFixed(decimals)) : Math.floor(value);
};

// Helper function to generate random date within range
const generateRandomDate = (startDate, endDate) => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return new Date(start + Math.random() * (end - start));
};

const seedProductionData = async () => {
  try {
    console.log('Starting production data seeding...');

    // 1. Create Companies
    console.log('Creating companies...');

    // GONXT Company
    let gonxtCompany = await Company.findOne({ name: 'GONXT' });
    if (!gonxtCompany) {
      gonxtCompany = new Company({
        name: 'GONXT',
        code: 'GONXT',
        domain: 'gonxt.tech',
        industry: 'fmcg',
        country: 'Australia',
        timezone: 'Australia/Sydney',
        currency: 'AUD',
        settings: {
          multiTenant: true,
          features: {
            analytics: true,
            aiChat: true,
            promotionAnalysis: true,
            tradingTerms: true,
            marketingBudget: true,
            combinationAnalysis: true,
            reporting: true
          },
          branding: {
            primaryColor: '#1976d2',
            secondaryColor: '#dc004e',
            logo: '/assets/logo/gonxt-logo.png'
          }
        },
        subscription: {
          plan: 'enterprise',
          status: 'active',
          startDate: new Date('2023-01-01'),
          endDate: new Date('2025-12-31'),
          features: ['all']
        }
      });
      await gonxtCompany.save();
      console.log('GONXT company created');
    } else {
      console.log('GONXT company already exists');
    }

    // Test Company
    let testCompany = await Company.findOne({ name: 'Test Company' });
    if (!testCompany) {
      testCompany = new Company({
        name: 'Test Company',
        code: 'TESTCO',
        domain: 'test.demo',
        industry: 'retail',
        country: 'Australia',
        timezone: 'Australia/Sydney',
        currency: 'AUD',
        settings: {
          multiTenant: true,
          features: {
            analytics: true,
            aiChat: true,
            promotionAnalysis: true,
            tradingTerms: true,
            marketingBudget: true,
            combinationAnalysis: true,
            reporting: true
          },
          branding: {
            primaryColor: '#2e7d32',
            secondaryColor: '#ff6f00',
            logo: '/assets/logo/test-logo.png'
          }
        },
        subscription: {
          plan: 'professional',
          status: 'active',
          startDate: new Date('2023-06-01'),
          endDate: new Date('2024-12-31'),
          features: ['analytics', 'reporting', 'aiChat']
        }
      });
      await testCompany.save();
      console.log('Test company created');
    } else {
      console.log('Test company already exists');
    }

    // 2. Create Users
    console.log('Creating users...');

    // GONXT Admin User
    let gonxtAdmin = await User.findOne({ email: 'admin@gonxt.tech' });
    if (!gonxtAdmin) {
      const hashedPassword = await bcrypt.hash('GonxtAdmin2024!', 12);
      gonxtAdmin = new User({
        employeeId: 'GONXT001',
        firstName: 'GONXT',
        lastName: 'Administrator',
        email: 'admin@gonxt.tech',
        password: hashedPassword,
        role: 'admin',
        department: 'admin',
        company: gonxtCompany._id,
        isActive: true,
        permissions: [
          { module: 'users', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'companies', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'analytics', actions: ['read'] },
          { module: 'reports', actions: ['create', 'read', 'update', 'delete'] }
        ],
        profile: {
          position: 'System Administrator',
          phone: '+61-2-9876-5432',
          timezone: 'Australia/Sydney'
        }
      });
      await gonxtAdmin.save();
      console.log('GONXT admin user created');
    } else {
      console.log('GONXT admin user already exists');
    }

    // Test Company Admin User
    let testAdmin = await User.findOne({ email: 'admin@test.demo' });
    if (!testAdmin) {
      const hashedPassword = await bcrypt.hash('TestAdmin2024!', 12);
      testAdmin = new User({
        employeeId: 'TEST001',
        firstName: 'Test',
        lastName: 'Administrator',
        email: 'admin@test.demo',
        password: hashedPassword,
        role: 'admin',
        department: 'admin',
        company: testCompany._id,
        isActive: true,
        permissions: [
          { module: 'analytics', actions: ['read'] },
          { module: 'reports', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'users', actions: ['create', 'read', 'update', 'delete'] }
        ],
        profile: {
          position: 'Administrator',
          phone: '+61-3-1234-5678',
          timezone: 'Australia/Sydney'
        }
      });
      await testAdmin.save();
      console.log('Test admin user created');
    } else {
      console.log('Test admin user already exists');
    }

    // 3. Create Customers for GONXT
    console.log('Creating customers for GONXT...');
    const gonxtCustomers = [];
    const customerNames = [
      'Woolworths Group', 'Coles Group', 'IGA Supermarkets', 'ALDI Australia', 'Metcash Trading',
      'Costco Wholesale', 'Harris Farm Markets', 'Foodland Supermarkets', 'Drakes Supermarkets', 'Ritchies Stores'
    ];

    for (let i = 0; i < customerNames.length; i++) {
      const existingCustomer = await Customer.findOne({
        name: customerNames[i],
        company: gonxtCompany._id
      });

      if (!existingCustomer) {
        const customer = new Customer({
          name: customerNames[i],
          code: customerNames[i].toUpperCase().replace(/\s+/g, '_').substring(0, 10),
          sapCustomerId: `SAP_CUST_${String(i + 1).padStart(6, '0')}`,
          company: gonxtCompany._id,
          customerType: i < 5 ? 'chain' : 'retailer',
          channel: i < 3 ? 'modern_trade' : i < 7 ? 'traditional_trade' : 'ecommerce',
          tier: i < 2 ? 'platinum' : i < 5 ? 'gold' : 'silver',
          contactInfo: {
            email: `contact@${customerNames[i].toLowerCase().replace(/\s+/g, '')}.com.au`,
            phone: `+61-${generateRandomValue(2, 8)}-${generateRandomValue(1000, 9999)}-${generateRandomValue(1000, 9999)}`,
            address: {
              street: `${generateRandomValue(1, 999)} ${['Collins', 'Bourke', 'Flinders', 'Elizabeth', 'King'][i % 5]} Street`,
              city: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'][i % 5],
              state: ['NSW', 'VIC', 'QLD', 'WA', 'SA'][i % 5],
              postcode: String(generateRandomValue(1000, 9999)),
              country: 'Australia'
            }
          },
          businessDetails: {
            abn: `${generateRandomValue(10, 99)} ${generateRandomValue(100, 999)} ${generateRandomValue(100, 999)} ${generateRandomValue(100, 999)}`,
            industry: 'Retail',
            annualRevenue: generateRandomValue(50000000, 500000000),
            employeeCount: generateRandomValue(100, 10000)
          },
          tradingTerms: {
            paymentTerms: ['NET30', 'NET45', 'NET60'][i % 3],
            creditLimit: generateRandomValue(100000, 1000000),
            discount: generateRandomValue(2, 15, 1)
          },
          status: 'active',
          createdBy: gonxtAdmin._id
        });
        await customer.save();
        gonxtCustomers.push(customer);
      } else {
        gonxtCustomers.push(existingCustomer);
      }
    }

    // 4. Create Products for GONXT
    console.log('Creating products for GONXT...');
    const gonxtProducts = [];
    const productCategories = [
      { name: 'Premium Beverages', prefix: 'PB' },
      { name: 'Snack Foods', prefix: 'SF' },
      { name: 'Dairy Products', prefix: 'DP' },
      { name: 'Frozen Foods', prefix: 'FF' },
      { name: 'Health & Wellness', prefix: 'HW' }
    ];

    for (let i = 0; i < 25; i++) {
      const category = productCategories[i % productCategories.length];
      const productName = `${category.name} Product ${Math.floor(i / productCategories.length) + 1}`;

      const existingProduct = await Product.findOne({
        name: productName,
        company: gonxtCompany._id
      });

      if (!existingProduct) {
        const product = new Product({
          name: productName,
          sku: `${category.prefix}_${String(i + 1).padStart(4, '0')}`,
          barcode: `${generateRandomValue(100000000000, 999999999999)}`,
          sapMaterialId: `SAP_MAT_${category.prefix}_${String(i + 1).padStart(4, '0')}`,
          company: gonxtCompany._id,
          category: category.name,
          brand: `Brand ${String.fromCharCode(65 + (i % 5))}`,
          productType: ['own_brand', 'distributed', 'private_label', 'consignment'][i % 4],
          description: `High-quality ${category.name.toLowerCase()} product designed for premium market segment`,
          specifications: {
            weight: generateRandomValue(100, 2000, 1),
            dimensions: {
              length: generateRandomValue(10, 50, 1),
              width: generateRandomValue(10, 50, 1),
              height: generateRandomValue(5, 30, 1)
            },
            shelfLife: generateRandomValue(30, 365),
            storageConditions: ['ambient', 'refrigerated', 'frozen'][i % 3]
          },
          pricing: {
            listPrice: generateRandomValue(5, 50, 2),
            costPrice: generateRandomValue(2, 25, 2),
            currency: 'AUD'
          },
          inventory: {
            currentStock: generateRandomValue(100, 10000),
            reorderLevel: generateRandomValue(50, 500),
            maxStock: generateRandomValue(5000, 20000)
          },
          status: 'active',
          createdBy: gonxtAdmin._id
        });
        await product.save();
        gonxtProducts.push(product);
      } else {
        gonxtProducts.push(existingProduct);
      }
    }

    // 5. Create Campaigns for GONXT
    console.log('Creating campaigns for GONXT...');
    const gonxtCampaigns = [];
    const campaignTypes = ['brand_awareness', 'product_launch', 'seasonal', 'clearance', 'loyalty'];

    for (let i = 0; i < 15; i++) {
      const startDate = new Date(2023, i % 12, 1);
      const endDate = new Date(startDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days later

      const existingCampaign = await Campaign.findOne({
        name: `GONXT Campaign ${i + 1}`,
        company: gonxtCompany._id
      });

      if (!existingCampaign) {
        const campaign = new Campaign({
          name: `GONXT Campaign ${i + 1}`,
          campaignId: `GONXT_CAMP_${String(i + 1).padStart(3, '0')}`,
          company: gonxtCompany._id,
          campaignType: campaignTypes[i % campaignTypes.length],
          description: `Strategic ${campaignTypes[i % campaignTypes.length]} campaign for Q${Math.floor(i / 3) + 1} 2023`,
          period: {
            startDate,
            endDate
          },
          budget: {
            total: generateRandomValue(50000, 500000),
            allocated: generateRandomValue(30000, 400000),
            spent: generateRandomValue(20000, 300000),
            currency: 'AUD'
          },
          targetMetrics: {
            reach: generateRandomValue(10000, 100000),
            impressions: generateRandomValue(50000, 500000),
            conversions: generateRandomValue(500, 5000),
            roi: generateRandomValue(150, 300, 1)
          },
          status: i < 10 ? 'completed' : i < 13 ? 'active' : 'planning',
          createdBy: gonxtAdmin._id
        });
        await campaign.save();
        gonxtCampaigns.push(campaign);
      } else {
        gonxtCampaigns.push(existingCampaign);
      }
    }

    console.log('Production data seeding completed successfully!');
    console.log(`Created/Verified:
    - 2 Companies (GONXT, Test Company)
    - 2 Admin Users
    - ${gonxtCustomers.length} Customers
    - ${gonxtProducts.length} Products
    - ${gonxtCampaigns.length} Campaigns`);

  } catch (error) {
    console.error('Error seeding production data:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await seedProductionData();
    console.log('Production seeding completed successfully!');
  } catch (error) {
    console.error('Production seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { seedProductionData };
