#!/usr/bin/env node

/**
 * Activity Grid Historic Seed Data Generator
 * Creates comprehensive historic activity data for the past 12 months
 */

const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const ActivityGrid = require('../src/models/ActivityGrid');
const Customer = require('../src/models/Customer');
const Product = require('../src/models/Product');
const Company = require('../src/models/Company');
const User = require('../src/models/User');

// Configuration
const MONTHS_BACK = 12;
const ACTIVITIES_PER_MONTH = 25;
const ACTIVITY_TYPES = ['promotion', 'trade_spend', 'campaign', 'event', 'training', 'other'];
const STATUSES = ['planned', 'confirmed', 'active', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

// South African retail customers for realistic data
const SA_CUSTOMERS = [
  'Shoprite Holdings', 'Pick n Pay', 'Woolworths', 'Checkers', 'Spar Group',
  'Massmart', 'Game Stores', 'Makro', 'Cambridge Food', 'Boxer Superstores',
  'OK Foods', 'Food Lover\'s Market', 'Fruit & Veg City', 'Dis-Chem',
  'Clicks Group', 'PEP Stores', 'Mr Price Group', 'Foschini Group',
  'Truworths', 'Edgars', 'Jet Stores', 'Ackermans', 'Pep Home'
];

// Product categories for ChocolateCraft SA
const PRODUCT_CATEGORIES = [
  'Premium Dark Chocolate', 'Milk Chocolate Bars', 'White Chocolate',
  'Chocolate Truffles', 'Seasonal Chocolates', 'Gift Boxes',
  'Baking Chocolate', 'Chocolate Spreads', 'Hot Chocolate',
  'Chocolate Cookies', 'Chocolate Wafers', 'Artisan Collections'
];

async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradeai';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function getOrCreateCompany() {
  // Get the existing tenant
  const Tenant = require('../src/models/Tenant');
  const tenant = await Tenant.findOne({ name: 'ChocolateCraft SA' });
  
  if (!tenant) {
    throw new Error('ChocolateCraft SA tenant not found. Please ensure the tenant exists.');
  }
  
  let company = await Company.findOne({ name: 'ChocolateCraft SA' });
  
  if (!company) {
    company = await Company.create({
      tenantId: tenant._id,
      name: 'ChocolateCraft SA',
      code: 'CCSA',
      industry: 'Food & Beverage',
      country: 'South Africa',
      currency: 'ZAR',
      settings: {
        timezone: 'Africa/Johannesburg',
        dateFormat: 'DD/MM/YYYY',
        numberFormat: 'en-ZA'
      }
    });
    console.log('✅ Created ChocolateCraft SA company');
  }
  
  return { company, tenant };
}

async function getOrCreateCustomers(company, tenant) {
  const customers = [];
  
  for (let i = 0; i < SA_CUSTOMERS.slice(0, 15).length; i++) { // Use first 15 customers
    const customerName = SA_CUSTOMERS[i];
    let customer = await Customer.findOne({ name: customerName, company: company._id });
    
    if (!customer) {
      customer = await Customer.create({
        tenantId: tenant._id,
        company: company._id,
        sapCustomerId: `SAP${String(i + 1).padStart(6, '0')}`, // Unique SAP ID
        name: customerName,
        code: customerName.replace(/[^A-Z0-9]/g, '').substring(0, 6),
        type: 'retail',
        status: 'active',
        contact: {
          email: `${customerName.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`,
          phone: faker.phone.number('+27 ## ### ####'),
          address: {
            street: faker.location.streetAddress(),
            city: faker.helpers.arrayElement(['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth']),
            province: faker.helpers.arrayElement(['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape']),
            postalCode: faker.location.zipCode('####'),
            country: 'South Africa'
          }
        },
        financial: {
          creditLimit: faker.number.int({ min: 500000, max: 5000000 }),
          paymentTerms: faker.helpers.arrayElement(['30 days', '45 days', '60 days']),
          currency: 'ZAR'
        },
        classification: {
          tier: faker.helpers.arrayElement(['A', 'B', 'C']),
          segment: faker.helpers.arrayElement(['Premium', 'Standard', 'Value']),
          region: faker.helpers.arrayElement(['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape'])
        }
      });
    }
    
    customers.push(customer);
  }
  
  console.log(`✅ Created/found ${customers.length} customers`);
  return customers;
}

async function getOrCreateProducts(company, tenant) {
  const products = [];
  
  for (let i = 0; i < PRODUCT_CATEGORIES.length; i++) {
    const category = PRODUCT_CATEGORIES[i];
    
    // Create 2-3 products per category
    for (let j = 1; j <= faker.number.int({ min: 2, max: 3 }); j++) {
      const productName = `${category} ${j}`;
      let product = await Product.findOne({ name: productName, company: company._id });
      
      if (!product) {
        const costPrice = faker.number.float({ min: 15, max: 45, fractionDigits: 2 });
        const sellingPrice = faker.number.float({ min: 25, max: 85, fractionDigits: 2 });
        
        product = await Product.create({
          tenantId: tenant._id,
          company: company._id,
          sapMaterialId: `MAT${String(i + 1).padStart(3, '0')}${String(j).padStart(3, '0')}`,
          name: productName,
          sku: `CC${String(i + 1).padStart(2, '0')}${String(j).padStart(2, '0')}`,
          barcode: `60${String(i + 1).padStart(2, '0')}${String(j).padStart(2, '0')}${faker.number.int({ min: 100000, max: 999999 })}`,
          category: category,
          productType: 'own_brand',
          description: `Premium ${category.toLowerCase()} from ChocolateCraft SA`,
          status: 'active',
          pricing: {
            costPrice: costPrice,
            listPrice: sellingPrice,
            sellingPrice: sellingPrice,
            currency: 'ZAR'
          },
          inventory: {
            unit: 'unit',
            weight: faker.number.float({ min: 50, max: 500, fractionDigits: 0 }),
            dimensions: {
              length: faker.number.float({ min: 5, max: 25, fractionDigits: 1 }),
              width: faker.number.float({ min: 5, max: 15, fractionDigits: 1 }),
              height: faker.number.float({ min: 1, max: 5, fractionDigits: 1 })
            }
          },
          attributes: {
            brand: 'ChocolateCraft',
            origin: 'South Africa',
            certifications: ['Fairtrade', 'Organic'],
            shelfLife: faker.number.int({ min: 180, max: 365 })
          }
        });
      }
      
      products.push(product);
    }
  }
  
  console.log(`✅ Created/found ${products.length} products`);
  return products;
}

async function getOrCreateUser(company, tenant) {
  let user = await User.findOne({ email: 'system@chocolatecraft.co.za' });
  
  if (!user) {
    user = await User.create({
      tenantId: tenant._id,
      company: company._id,
      employeeId: 'SYS001',
      firstName: 'System',
      lastName: 'Administrator',
      email: 'system@chocolatecraft.co.za',
      password: 'TempPassword123!',
      role: 'admin',
      department: 'admin',
      status: 'active',
      profile: {
        department: 'admin',
        position: 'System Administrator'
      }
    });
    console.log('✅ Created system user');
  }
  
  return user;
}

function generateActivityData(date, customers, products, user, company) {
  const activityType = faker.helpers.arrayElement(ACTIVITY_TYPES);
  const customer = faker.helpers.arrayElement(customers);
  const selectedProducts = faker.helpers.arrayElements(products, { min: 1, max: 3 });
  const priority = faker.helpers.arrayElement(PRIORITIES);
  const status = faker.helpers.arrayElement(STATUSES);
  
  // Generate realistic spend amounts based on activity type
  let baseSpend = 0;
  switch (activityType) {
    case 'promotion':
      baseSpend = faker.number.int({ min: 15000, max: 150000 });
      break;
    case 'trade_spend':
      baseSpend = faker.number.int({ min: 5000, max: 75000 });
      break;
    case 'campaign':
      baseSpend = faker.number.int({ min: 25000, max: 200000 });
      break;
    case 'event':
      baseSpend = faker.number.int({ min: 10000, max: 50000 });
      break;
    case 'training':
      baseSpend = faker.number.int({ min: 2000, max: 15000 });
      break;
    default:
      baseSpend = faker.number.int({ min: 1000, max: 25000 });
  }
  
  // Distribute spend across categories
  const marketingSpend = Math.floor(baseSpend * faker.number.float({ min: 0.3, max: 0.6 }));
  const cashCoopSpend = Math.floor(baseSpend * faker.number.float({ min: 0.2, max: 0.4 }));
  const tradingTermsSpend = baseSpend - marketingSpend - cashCoopSpend;
  
  // Add some variance for actual vs planned
  const variance = faker.number.float({ min: 0.85, max: 1.15 });
  
  return {
    tenantId: company.tenantId,
    company: company._id,
    gridId: `month_${date.getFullYear()}_${date.getMonth() + 1}_company_${company._id}`,
    viewType: 'month',
    period: {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      startDate: new Date(date.getFullYear(), date.getMonth(), 1),
      endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0)
    },
    scope: {
      level: 'company',
      entityId: company._id,
      entityName: company.name
    },
    activities: [{
      date: date,
      dayOfWeek: date.getDay(),
      weekNumber: Math.ceil(date.getDate() / 7),
      activityType: activityType,
      name: generateActivityName(activityType, customer.name),
      description: generateActivityDescription(activityType, customer.name, selectedProducts),
      status: status,
      spend: {
        marketing: {
          planned: marketingSpend,
          actual: Math.floor(marketingSpend * variance)
        },
        cashCoop: {
          planned: cashCoopSpend,
          actual: Math.floor(cashCoopSpend * variance)
        },
        tradingTerms: {
          planned: tradingTermsSpend,
          actual: Math.floor(tradingTermsSpend * variance)
        },
        total: {
          planned: baseSpend,
          actual: Math.floor(baseSpend * variance)
        }
      },
      customers: [{
        customer: customer._id,
        stores: faker.number.int({ min: 1, max: 50 })
      }],
      products: selectedProducts.map(product => ({
        product: product._id,
        quantity: faker.number.int({ min: 100, max: 5000 })
      })),
      performance: {
        targetMetric: 'sales_increase',
        targetValue: faker.number.float({ min: 5, max: 25, fractionDigits: 1 }),
        actualValue: faker.number.float({ min: 3, max: 30, fractionDigits: 1 }),
        achievement: faker.number.float({ min: 0.7, max: 1.3, fractionDigits: 2 })
      },
      indicators: {
        color: getActivityColor(activityType),
        icon: getActivityIcon(activityType),
        priority: priority,
        conflicts: []
      }
    }],
    createdBy: user._id
  };
}

function generateActivityName(type, customerName) {
  const templates = {
    promotion: [
      `${customerName} Monthly Promotion`,
      `Special Offer - ${customerName}`,
      `${customerName} Seasonal Campaign`,
      `Flash Sale - ${customerName}`
    ],
    trade_spend: [
      `${customerName} Listing Fee`,
      `Marketing Support - ${customerName}`,
      `Trade Investment - ${customerName}`,
      `Promotional Support - ${customerName}`
    ],
    campaign: [
      `${customerName} Brand Campaign`,
      `Digital Marketing - ${customerName}`,
      `In-Store Campaign - ${customerName}`,
      `Multi-Channel Campaign - ${customerName}`
    ],
    event: [
      `${customerName} Product Launch`,
      `Store Opening - ${customerName}`,
      `Trade Show - ${customerName}`,
      `Customer Event - ${customerName}`
    ],
    training: [
      `${customerName} Staff Training`,
      `Product Training - ${customerName}`,
      `Sales Training - ${customerName}`,
      `Category Training - ${customerName}`
    ],
    other: [
      `${customerName} Special Project`,
      `Custom Initiative - ${customerName}`,
      `Strategic Project - ${customerName}`,
      `Partnership Activity - ${customerName}`
    ]
  };
  
  return faker.helpers.arrayElement(templates[type] || templates.other);
}

function generateActivityDescription(type, customerName, products) {
  const productNames = products.map(p => p.name).join(', ');
  
  const templates = {
    promotion: `Promotional campaign for ${productNames} at ${customerName} stores. Includes in-store displays, price promotions, and marketing support.`,
    trade_spend: `Trade marketing investment for ${productNames} at ${customerName}. Covers listing fees, promotional support, and category management.`,
    campaign: `Integrated marketing campaign for ${productNames} targeting ${customerName} customers. Multi-channel approach including digital and in-store.`,
    event: `Special event featuring ${productNames} at ${customerName} locations. Includes product demonstrations and customer engagement activities.`,
    training: `Training program for ${customerName} staff on ${productNames}. Covers product knowledge, selling techniques, and category insights.`,
    other: `Strategic initiative involving ${productNames} and ${customerName}. Custom project designed to drive mutual business growth.`
  };
  
  return templates[type] || templates.other;
}

function getActivityColor(type) {
  const colors = {
    promotion: '#FF6B6B',
    trade_spend: '#4ECDC4',
    campaign: '#45B7D1',
    event: '#96CEB4',
    training: '#FFEAA7',
    other: '#DDA0DD'
  };
  
  return colors[type] || colors.other;
}

function getActivityIcon(type) {
  const icons = {
    promotion: 'local_offer',
    trade_spend: 'account_balance',
    campaign: 'campaign',
    event: 'event',
    training: 'school',
    other: 'work'
  };
  
  return icons[type] || icons.other;
}

async function generateHistoricData(company, customers, products, user) {
  console.log('🔄 Generating historic activity data...');
  
  const activities = [];
  const now = new Date();
  
  for (let monthsBack = MONTHS_BACK; monthsBack >= 0; monthsBack--) {
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
    const daysInMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
    
    console.log(`📅 Processing ${targetMonth.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long' })}...`);
    
    // Generate activities for this month
    for (let i = 0; i < ACTIVITIES_PER_MONTH; i++) {
      const randomDay = faker.number.int({ min: 1, max: daysInMonth });
      const activityDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), randomDay);
      
      // Skip future dates
      if (activityDate > now) continue;
      
      const activityData = generateActivityData(activityDate, customers, products, user, company);
      activities.push(activityData);
    }
  }
  
  console.log(`✅ Generated ${activities.length} activities`);
  return activities;
}

async function saveActivities(activities) {
  console.log('💾 Saving activities to database...');
  
  let saved = 0;
  let skipped = 0;
  
  for (const activityData of activities) {
    try {
      // Check if activity grid for this period already exists
      const existing = await ActivityGrid.findOne({
        gridId: activityData.gridId,
        'activities.date': activityData.activities[0].date
      });
      
      if (existing) {
        // Add activity to existing grid
        existing.activities.push(activityData.activities[0]);
        await existing.save();
        saved++;
      } else {
        // Create new activity grid or find existing one for the period
        let grid = await ActivityGrid.findOne({ gridId: activityData.gridId });
        
        if (grid) {
          grid.activities.push(activityData.activities[0]);
          await grid.save();
        } else {
          await ActivityGrid.create(activityData);
        }
        saved++;
      }
    } catch (error) {
      if (error.code === 11000) {
        skipped++;
      } else {
        console.error('Error saving activity:', error.message);
      }
    }
  }
  
  console.log(`✅ Saved ${saved} activities, skipped ${skipped} duplicates`);
}

async function generateSummaryReport() {
  const totalActivities = await ActivityGrid.aggregate([
    { $unwind: '$activities' },
    { $count: 'total' }
  ]);
  
  const activitiesByType = await ActivityGrid.aggregate([
    { $unwind: '$activities' },
    { $group: { _id: '$activities.activityType', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  const activitiesByMonth = await ActivityGrid.aggregate([
    { $unwind: '$activities' },
    {
      $group: {
        _id: {
          year: { $year: '$activities.date' },
          month: { $month: '$activities.date' }
        },
        count: { $sum: 1 },
        totalSpend: { $sum: '$activities.spend.total.planned' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  
  console.log('\n📊 ACTIVITY GRID SUMMARY REPORT');
  console.log('================================');
  console.log(`Total Activities: ${totalActivities[0]?.total || 0}`);
  
  console.log('\nActivities by Type:');
  activitiesByType.forEach(item => {
    console.log(`  ${item._id}: ${item.count}`);
  });
  
  console.log('\nActivities by Month:');
  activitiesByMonth.forEach(item => {
    const monthName = new Date(item._id.year, item._id.month - 1).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long' });
    console.log(`  ${monthName}: ${item.count} activities, R${item.totalSpend.toLocaleString('en-ZA')} total spend`);
  });
}

async function main() {
  console.log('🚀 Starting Activity Grid Historic Data Seeding...\n');
  
  try {
    await connectDB();
    
    // Get or create base data
    const { company, tenant } = await getOrCreateCompany();
    const customers = await getOrCreateCustomers(company, tenant);
    const products = await getOrCreateProducts(company, tenant);
    const user = await getOrCreateUser(company, tenant);
    
    // Generate and save historic data
    const activities = await generateHistoricData(company, customers, products, user);
    await saveActivities(activities);
    
    // Generate summary report
    await generateSummaryReport();
    
    console.log('\n🎉 Activity Grid seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };