#!/usr/bin/env node

/**
 * Historical Sales Data Generator for Modelex South Africa
 * Generates 2 years of realistic FMCG sales transactions with:
 * - Seasonal patterns
 * - Customer-specific buying behaviors
 * - Product category trends
 * - Promotional impacts
 * - South African market dynamics
 */

const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/trade-ai', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const Customer = require('../src/models/Customer');
const Product = require('../src/models/Product');
const SalesTransaction = require('../models/SalesTransaction');
const Promotion = require('../models/Promotion');
const Budget = require('../models/Budget');

// Configuration
const COMPANY_ID = '68db5a83a039604f03af95f3'; // Modelex SA
const START_DATE = new Date('2023-01-01');
const END_DATE = new Date('2024-12-31');
const TOTAL_MONTHS = 24;

// South African seasonal patterns (Southern Hemisphere)
const SEASONAL_MULTIPLIERS = {
  1: 0.85,  // January - Post-holiday slowdown
  2: 0.90,  // February - Back to school
  3: 0.95,  // March - Autumn
  4: 1.00,  // April - Stable
  5: 0.95,  // May - Autumn
  6: 0.90,  // June - Winter
  7: 0.85,  // July - Winter
  8: 0.90,  // August - Winter
  9: 1.05,  // September - Spring
  10: 1.10, // October - Spring
  11: 1.20, // November - Pre-holiday
  12: 1.35, // December - Holiday season
};

// Customer tier multipliers (based on store size and reach)
const CUSTOMER_TIER_MULTIPLIERS = {
  'Tier 1': 2.5,  // Large chains (Shoprite, Pick n Pay, Woolworths)
  'Tier 2': 1.0,  // Medium chains (SPAR, Food Lover's Market)
};

// Product category patterns
const CATEGORY_PATTERNS = {
  'Snacks': {
    baseVolume: 1000,
    seasonality: 1.2,
    promotionLift: 1.8,
    priceElasticity: -1.5,
  },
  'Dairy': {
    baseVolume: 1500,
    seasonality: 0.8,
    promotionLift: 1.3,
    priceElasticity: -0.8,
  },
  'Personal Care': {
    baseVolume: 800,
    seasonality: 1.0,
    promotionLift: 1.6,
    priceElasticity: -1.2,
  },
  'Household': {
    baseVolume: 600,
    seasonality: 0.9,
    promotionLift: 1.4,
    priceElasticity: -1.0,
  },
  'Beverages': {
    baseVolume: 1200,
    seasonality: 1.3,
    promotionLift: 1.7,
    priceElasticity: -1.3,
  },
};

// Helper functions
function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getSeasonalMultiplier(date) {
  const month = date.getMonth() + 1;
  return SEASONAL_MULTIPLIERS[month] || 1.0;
}

function generatePromotionalCampaigns(customers, products) {
  const campaigns = [];
  const campaignTypes = [
    'Volume Discount',
    'BOGOF',
    'Price Reduction',
    'Bundle Deal',
    'Loyalty Bonus',
    'New Product Launch',
    'Seasonal Special',
    'Clearance Sale'
  ];

  // Generate 50 promotional campaigns over 2 years
  for (let i = 0; i < 50; i++) {
    const startDate = getRandomDate(START_DATE, END_DATE);
    const endDate = new Date(startDate.getTime() + (Math.random() * 30 + 7) * 24 * 60 * 60 * 1000); // 7-37 days
    
    const campaign = {
      company: COMPANY_ID,
      name: `${faker.commerce.productAdjective()} ${faker.helpers.arrayElement(campaignTypes)} Campaign`,
      description: faker.lorem.sentence(),
      type: faker.helpers.arrayElement(campaignTypes),
      status: endDate < new Date() ? 'completed' : 'active',
      startDate,
      endDate,
      customers: faker.helpers.arrayElements(customers, faker.datatype.number({ min: 1, max: 4 })),
      products: faker.helpers.arrayElements(products, faker.datatype.number({ min: 1, max: 8 })),
      budget: {
        allocated: faker.datatype.number({ min: 50000, max: 500000 }),
        spent: 0,
        currency: 'ZAR'
      },
      metrics: {
        impressions: faker.datatype.number({ min: 10000, max: 100000 }),
        clicks: faker.datatype.number({ min: 500, max: 5000 }),
        conversions: faker.datatype.number({ min: 50, max: 1000 }),
        revenue: faker.datatype.number({ min: 100000, max: 2000000 }),
        roi: faker.datatype.float({ min: 1.2, max: 8.5, precision: 0.1 })
      },
      createdBy: 'thabo.mthembu@modelex.co.za', // CEO creates campaigns
      createdAt: new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000), // Created 1 week before start
      updatedAt: new Date()
    };

    campaigns.push(campaign);
  }

  return campaigns;
}

function generateSalesTransactions(customers, products, promotions) {
  const transactions = [];
  const transactionId = 1000000; // Starting transaction ID

  // Generate daily transactions for each customer-product combination
  for (let date = new Date(START_DATE); date <= END_DATE; date.setDate(date.getDate() + 1)) {
    const currentDate = new Date(date);
    const seasonalMultiplier = getSeasonalMultiplier(currentDate);
    
    customers.forEach(customer => {
      const customerMultiplier = CUSTOMER_TIER_MULTIPLIERS[customer.tier] || 1.0;
      
      products.forEach(product => {
        // Skip some combinations randomly to create realistic patterns
        if (Math.random() < 0.3) return; // 30% chance to skip
        
        const categoryPattern = CATEGORY_PATTERNS[product.category?.primary] || CATEGORY_PATTERNS['Snacks'];
        
        // Check if there's an active promotion
        const activePromotion = promotions.find(promo => 
          promo.startDate <= currentDate && 
          promo.endDate >= currentDate &&
          promo.customers.some(c => c.toString() === customer._id.toString()) &&
          promo.products.some(p => p.toString() === product._id.toString())
        );
        
        const promotionMultiplier = activePromotion ? categoryPattern.promotionLift : 1.0;
        
        // Calculate base volume with all multipliers
        const baseVolume = categoryPattern.baseVolume * 
                          customerMultiplier * 
                          seasonalMultiplier * 
                          promotionMultiplier *
                          (0.8 + Math.random() * 0.4); // Random variation ±20%
        
        // Generate 1-3 transactions per day for this customer-product combo
        const numTransactions = Math.floor(Math.random() * 3) + 1;
        
        for (let t = 0; t < numTransactions; t++) {
          const quantity = Math.max(1, Math.floor(baseVolume / numTransactions * (0.5 + Math.random())));
          const unitPrice = product.pricing?.listPrice || 50;
          const totalAmount = quantity * unitPrice;
          
          // Apply promotional discount if applicable
          let discountAmount = 0;
          if (activePromotion) {
            discountAmount = totalAmount * faker.datatype.float({ min: 0.05, max: 0.25 });
          }
          
          const transaction = {
            company: COMPANY_ID,
            transactionId: `TXN${transactionId + transactions.length}`,
            customer: customer._id,
            product: product._id,
            date: new Date(currentDate.getTime() + Math.random() * 24 * 60 * 60 * 1000), // Random time during day
            quantity,
            unitPrice,
            totalAmount,
            discountAmount,
            netAmount: totalAmount - discountAmount,
            currency: 'ZAR',
            promotion: activePromotion ? activePromotion._id : null,
            salesRep: customer.primaryContact?.name || 'System',
            channel: faker.helpers.arrayElement(['Direct', 'Distributor', 'Online', 'Retail']),
            region: 'Gauteng', // Primary region for Modelex SA
            metadata: {
              orderNumber: `ORD${faker.datatype.number({ min: 100000, max: 999999 })}`,
              invoiceNumber: `INV${faker.datatype.number({ min: 100000, max: 999999 })}`,
              paymentTerms: faker.helpers.arrayElement(['30 days', '60 days', '90 days', 'COD']),
              deliveryDate: new Date(currentDate.getTime() + faker.datatype.number({ min: 1, max: 7 }) * 24 * 60 * 60 * 1000)
            },
            createdAt: currentDate,
            updatedAt: currentDate
          };
          
          transactions.push(transaction);
        }
      });
    });
    
    // Progress indicator
    if (currentDate.getDate() === 1) {
      console.log(`Generated transactions for ${currentDate.toISOString().substring(0, 7)}`);
    }
  }
  
  return transactions;
}

function generateBudgets() {
  const budgets = [];
  
  // Generate annual budgets for 2023 and 2024
  for (let year = 2023; year <= 2024; year++) {
    const categories = ['Marketing', 'Trade Spend', 'Promotions', 'Digital', 'Events'];
    
    categories.forEach(category => {
      const budget = {
        company: COMPANY_ID,
        name: `${category} Budget ${year}`,
        category,
        fiscalYear: year,
        startDate: new Date(`${year}-01-01`),
        endDate: new Date(`${year}-12-31`),
        totalBudget: faker.datatype.number({ min: 5000000, max: 20000000 }), // R5M - R20M
        allocated: 0,
        spent: 0,
        remaining: 0,
        currency: 'ZAR',
        status: year < 2025 ? 'completed' : 'active',
        approvals: [
          {
            approver: 'thabo.mthembu@modelex.co.za',
            approvedAmount: faker.datatype.number({ min: 1000000, max: 5000000 }),
            approvedDate: new Date(`${year}-01-15`),
            status: 'approved'
          }
        ],
        createdBy: 'thabo.mthembu@modelex.co.za', // CEO creates budgets
        createdAt: new Date(`${year - 1}-12-01`),
        updatedAt: new Date()
      };
      
      budgets.push(budget);
    });
  }
  
  return budgets;
}

async function generateHistoricalData() {
  try {
    console.log('🚀 Starting historical data generation for Modelex South Africa...');
    
    // Fetch existing data
    console.log('📊 Fetching existing customers and products...');
    const customers = await Customer.find({ company: COMPANY_ID });
    const products = await Product.find({ company: COMPANY_ID });
    
    console.log(`Found ${customers.length} customers and ${products.length} products`);
    
    if (customers.length === 0 || products.length === 0) {
      throw new Error('No customers or products found. Please run the setup script first.');
    }
    
    // Clear existing historical data
    console.log('🧹 Clearing existing historical data...');
    await SalesTransaction.deleteMany({ company: COMPANY_ID });
    await Promotion.deleteMany({ company: COMPANY_ID });
    await Budget.deleteMany({ company: COMPANY_ID });
    
    // Generate promotional campaigns
    console.log('🎯 Generating promotional campaigns...');
    const campaigns = generatePromotionalCampaigns(customers, products);
    const savedPromotions = await Promotion.insertMany(campaigns);
    console.log(`Generated ${savedPromotions.length} promotional campaigns`);
    
    // Generate budgets
    console.log('💰 Generating budget allocations...');
    const budgets = generateBudgets();
    const savedBudgets = await Budget.insertMany(budgets);
    console.log(`Generated ${savedBudgets.length} budget allocations`);
    
    // Generate sales transactions
    console.log('📈 Generating sales transactions (this may take a while)...');
    const transactions = generateSalesTransactions(customers, products, savedPromotions);
    
    // Insert transactions in batches to avoid memory issues
    const batchSize = 1000;
    let insertedCount = 0;
    
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      await SalesTransaction.insertMany(batch);
      insertedCount += batch.length;
      console.log(`Inserted ${insertedCount}/${transactions.length} transactions`);
    }
    
    // Calculate summary statistics
    console.log('📊 Calculating summary statistics...');
    const totalRevenue = transactions.reduce((sum, t) => sum + t.netAmount, 0);
    const avgTransactionValue = totalRevenue / transactions.length;
    const totalQuantity = transactions.reduce((sum, t) => sum + t.quantity, 0);
    
    console.log('\n🎉 Historical data generation completed!');
    console.log('=' .repeat(50));
    console.log(`📅 Period: ${START_DATE.toISOString().substring(0, 10)} to ${END_DATE.toISOString().substring(0, 10)}`);
    console.log(`🏢 Customers: ${customers.length}`);
    console.log(`📦 Products: ${products.length}`);
    console.log(`🎯 Promotions: ${savedPromotions.length}`);
    console.log(`💰 Budgets: ${savedBudgets.length}`);
    console.log(`📈 Transactions: ${transactions.length.toLocaleString()}`);
    console.log(`💵 Total Revenue: R${totalRevenue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
    console.log(`📊 Avg Transaction: R${avgTransactionValue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
    console.log(`📦 Total Units Sold: ${totalQuantity.toLocaleString()}`);
    console.log('=' .repeat(50));
    
    // Update budget spent amounts based on actual transactions
    console.log('🔄 Updating budget utilization...');
    for (const budget of savedBudgets) {
      const budgetTransactions = transactions.filter(t => 
        t.date >= budget.startDate && t.date <= budget.endDate
      );
      const spent = budgetTransactions.reduce((sum, t) => sum + (t.discountAmount || 0), 0);
      
      await Budget.findByIdAndUpdate(budget._id, {
        spent: spent,
        remaining: budget.totalBudget - spent,
        allocated: Math.min(budget.totalBudget, spent * 1.2) // Assume 120% of spent was allocated
      });
    }
    
    console.log('✅ Budget utilization updated');
    console.log('🏁 All historical data generation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error generating historical data:', error);
    throw error;
  }
}

// Run the data generation
if (require.main === module) {
  generateHistoricalData()
    .then(() => {
      console.log('🎯 Historical data generation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { generateHistoricalData };