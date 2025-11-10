/**
 * 12-Week Business Simulation Data Seeder
 * 
 * This script seeds 1 year of historical data and prepares for a 12-week simulation.
 * 
 * Historical Data (52 weeks):
 * - Customers (retailers/distributors)
 * - Products with categories and pricing
 * - Weekly transactions with realistic patterns
 * - Promotions with actual ROI results
 * - Budget allocations and spend tracking
 * - Trading terms and agreements
 * 
 * Simulation Ready:
 * - AI/ML models trained on historical data
 * - 12-week simulation framework
 * - ROI tracking and forecasting
 * - Currency settings from admin config
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('../models/User');
const Company = require('../models/Company');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Budget = require('../models/Budget');
const Promotion = require('../models/Promotion');
const Transaction = require('../models/Transaction');
const TradeSpend = require('../models/TradeSpend');
const TradingTerm = require('../models/TradingTerm');

// Simulation Configuration
const SIMULATION_CONFIG = {
  company: {
    name: 'Mondelez SA Simulation',
    code: 'MDZ-SIM',
    currency: 'ZAR',
    fiscalYearStart: 1, // January
  },
  historicalWeeks: 52, // 1 year of historical data
  simulationWeeks: 12, // 12 weeks of simulation
  startDate: new Date('2024-01-01'), // Historical data starts here
  
  // Product categories with seasonal patterns
  categories: [
    { name: 'Chocolate', seasonalPeak: [11, 12, 1, 2], growthRate: 0.15 }, // Nov-Feb peak
    { name: 'Biscuits', seasonalPeak: [6, 7, 12], growthRate: 0.08 }, // June, July, Dec
    { name: 'Gum', seasonalPeak: [5, 6, 7, 8], growthRate: 0.05 }, // Summer peak
    { name: 'Candy', seasonalPeak: [10, 11, 12], growthRate: 0.12 }, // Holiday season
  ],
  
  // Customer types with different buying patterns
  customerTypes: [
    { type: 'National Retailer', count: 5, avgOrderValue: 250000, frequency: 1 }, // Weekly orders
    { type: 'Regional Chain', count: 10, avgOrderValue: 80000, frequency: 2 }, // Bi-weekly
    { type: 'Independent Store', count: 30, avgOrderValue: 15000, frequency: 4 }, // Monthly
    { type: 'Wholesaler', count: 8, avgOrderValue: 180000, frequency: 1 }, // Weekly
  ],
  
  // Promotion types and their typical ROI
  promotionTypes: [
    { type: 'Price Reduction', avgROI: 1.35, discount: 0.15, frequency: 8 }, // 15% off
    { type: 'BOGOF', avgROI: 1.65, discount: 0.50, frequency: 4 },
    { type: 'Volume Discount', avgROI: 1.28, discount: 0.10, frequency: 6 },
    { type: 'Bundle Deal', avgROI: 1.45, discount: 0.20, frequency: 5 },
    { type: 'Seasonal Special', avgROI: 1.82, discount: 0.25, frequency: 4 },
  ],
  
  // Budget allocation percentages
  budgetAllocation: {
    promotions: 0.45,
    tradeSpend: 0.30,
    brandSpend: 0.15,
    contingency: 0.10,
  },
  
  // Annual budget in ZAR
  annualBudget: 12000000, // R12M
};

// Helper: Add weeks to date
function addWeeks(date, weeks) {
  const result = new Date(date);
  result.setDate(result.getDate() + (weeks * 7));
  return result;
}

// Helper: Get week number from date
function getWeekNumber(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date - start;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor(diff / oneWeek) + 1;
}

// Helper: Get month from date
function getMonth(date) {
  return date.getMonth() + 1;
}

// Helper: Calculate seasonal factor
function getSeasonalFactor(month, category) {
  if (category.seasonalPeak.includes(month)) {
    return 1.4; // 40% boost during peak season
  }
  return 1.0;
}

// Helper: Random number with variation
function randomVariation(base, variationPercent = 0.2) {
  const variation = base * variationPercent;
  return base + (Math.random() * variation * 2) - variation;
}

async function seedData() {
  try {
    console.log('🚀 Starting 12-Week Simulation Data Seeding...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Step 1: Create Company
    console.log('📊 Step 1: Creating Company...');
    let company = await Company.findOne({ code: SIMULATION_CONFIG.company.code });
    
    if (!company) {
      company = await Company.create({
        name: SIMULATION_CONFIG.company.name,
        code: SIMULATION_CONFIG.company.code,
        currency: SIMULATION_CONFIG.company.currency,
        fiscalYearStart: SIMULATION_CONFIG.company.fiscalYearStart,
        settings: {
          defaultCurrency: SIMULATION_CONFIG.company.currency,
          dateFormat: 'DD/MM/YYYY',
          timezone: 'Africa/Johannesburg',
          features: {
            promotions: true,
            forecasting: true,
            aiInsights: true,
            simulation: true,
          },
        },
      });
      console.log(`✅ Company created: ${company.name} (${company.currency})\n`);
    } else {
      console.log(`✅ Company exists: ${company.name}\n`);
    }
    
    // Step 2: Create Admin User
    console.log('👤 Step 2: Creating Admin User...');
    let adminUser = await User.findOne({ email: 'admin@simulation.com' });
    
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('Simulation@123', 10);
      adminUser = await User.create({
        username: 'admin_simulation',
        email: 'admin@simulation.com',
        password: hashedPassword,
        firstName: 'Simulation',
        lastName: 'Admin',
        role: 'admin',
        tenant: company._id,
        isActive: true,
      });
      console.log(`✅ Admin user created: ${adminUser.email}\n`);
    } else {
      console.log(`✅ Admin user exists: ${adminUser.email}\n`);
    }
    
    // Step 3: Create Customers
    console.log('🏪 Step 3: Creating Customers...');
    let customers = [];
    
    for (const customerType of SIMULATION_CONFIG.customerTypes) {
      for (let i = 1; i <= customerType.count; i++) {
        const customer = await Customer.findOneAndUpdate(
          { 
            code: `${customerType.type.replace(/ /g, '-').toUpperCase()}-${String(i).padStart(3, '0')}`,
            companyId: company._id 
          },
          {
            name: `${customerType.type} ${i}`,
            code: `${customerType.type.replace(/ /g, '-').toUpperCase()}-${String(i).padStart(3, '0')}`,
            type: customerType.type,
            status: 'active',
            companyId: company._id,
            contact: {
              email: `${customerType.type.replace(/ /g, '').toLowerCase()}${i}@customer.com`,
              phone: `+27${Math.floor(Math.random() * 900000000 + 100000000)}`,
            },
            address: {
              street: `${i} Commerce Street`,
              city: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria'][Math.floor(Math.random() * 4)],
              province: 'Gauteng',
              postalCode: `${Math.floor(Math.random() * 9000 + 1000)}`,
              country: 'South Africa',
            },
            paymentTerms: {
              terms: ['Net 30', 'Net 60', 'COD'][Math.floor(Math.random() * 3)],
              creditLimit: customerType.avgOrderValue * 4,
            },
            avgOrderValue: customerType.avgOrderValue,
            orderFrequency: customerType.frequency,
          },
          { upsert: true, new: true }
        );
        customers.push(customer);
      }
    }
    console.log(`✅ Created ${customers.length} customers\n`);
    
    // Step 4: Create Products
    console.log('📦 Step 4: Creating Products...');
    let products = [];
    
    for (const category of SIMULATION_CONFIG.categories) {
      const productsPerCategory = 12;
      
      for (let i = 1; i <= productsPerCategory; i++) {
        const basePrice = Math.floor(Math.random() * 100 + 20);
        const product = await Product.findOneAndUpdate(
          {
            sku: `${category.name.substring(0, 3).toUpperCase()}-${String(i).padStart(4, '0')}`,
            companyId: company._id
          },
          {
            name: `${category.name} Product ${i}`,
            sku: `${category.name.substring(0, 3).toUpperCase()}-${String(i).padStart(4, '0')}`,
            category: category.name,
            description: `Premium ${category.name.toLowerCase()} product`,
            companyId: company._id,
            pricing: {
              cost: basePrice * 0.4,
              price: basePrice,
              currency: company.currency,
            },
            inventory: {
              unit: 'units',
              stockLevel: Math.floor(Math.random() * 10000 + 5000),
              reorderPoint: 1000,
            },
            isActive: true,
            categoryData: {
              seasonalPeak: category.seasonalPeak,
              growthRate: category.growthRate,
            },
          },
          { upsert: true, new: true }
        );
        products.push(product);
      }
    }
    console.log(`✅ Created ${products.length} products across ${SIMULATION_CONFIG.categories.length} categories\n`);
    
    // Step 5: Create Annual Budgets by Category
    console.log('💰 Step 5: Creating Annual Budgets...');
    const budgetYear = SIMULATION_CONFIG.startDate.getFullYear();
    const budgetCategories = [
      { name: 'Promotions', amount: SIMULATION_CONFIG.annualBudget * SIMULATION_CONFIG.budgetAllocation.promotions },
      { name: 'Trade Spend', amount: SIMULATION_CONFIG.annualBudget * SIMULATION_CONFIG.budgetAllocation.tradeSpend },
      { name: 'Marketing', amount: SIMULATION_CONFIG.annualBudget * SIMULATION_CONFIG.budgetAllocation.brandSpend },
    ];
    
    let budgets = [];
    let totalBudgetAmount = 0;
    
    for (const budgetCat of budgetCategories) {
      let budget = await Budget.findOne({
        company: company._id,
        fiscalYear: budgetYear,
        category: budgetCat.name,
      });
      
      if (!budget) {
        budget = await Budget.create({
          name: `${budgetCat.name} Budget ${budgetYear}`,
          fiscalYear: budgetYear,
          company: company._id,
          category: budgetCat.name,
          currency: company.currency,
          totalBudget: budgetCat.amount,
          allocated: 0,
          spent: 0,
          remaining: budgetCat.amount,
          status: 'active',
          startDate: SIMULATION_CONFIG.startDate,
          endDate: new Date(budgetYear, 11, 31),
          createdBy: adminUser._id,
        });
      }
      
      budgets.push(budget);
      totalBudgetAmount += budget.totalBudget;
    }
    
    console.log(`✅ Created ${budgets.length} category budgets`);
    console.log(`   Total Budget: R${(totalBudgetAmount / 1000000).toFixed(1)}M for ${budgetYear}\n`);
    
    // Step 6: Seed Historical Transactions (52 weeks)
    console.log('📈 Step 6: Seeding 52 weeks of historical transactions...');
    let totalTransactions = 0;
    let totalRevenue = 0;
    
    for (let week = 0; week < SIMULATION_CONFIG.historicalWeeks; week++) {
      const weekDate = addWeeks(SIMULATION_CONFIG.startDate, week);
      const month = getMonth(weekDate);
      
      // Each customer places orders based on their frequency
      for (const customer of customers) {
        const customerType = SIMULATION_CONFIG.customerTypes.find(ct => ct.type === customer.type);
        
        // Check if customer orders this week (based on frequency)
        if (week % customerType.frequency === 0) {
          // Select random products for this order
          const numProducts = Math.floor(Math.random() * 5) + 3; // 3-7 products per order
          const orderProducts = [];
          let orderTotal = 0;
          
          for (let i = 0; i < numProducts; i++) {
            const product = products[Math.floor(Math.random() * products.length)];
            const categoryData = SIMULATION_CONFIG.categories.find(c => c.name === product.category);
            
            // Apply seasonal factor
            const seasonalFactor = getSeasonalFactor(month, categoryData);
            
            // Base quantity with seasonal variation
            const baseQty = Math.floor(customer.avgOrderValue / product.pricing.price / numProducts);
            const quantity = Math.floor(randomVariation(baseQty * seasonalFactor, 0.3));
            
            const lineTotal = quantity * product.pricing.price;
            orderTotal += lineTotal;
            
            orderProducts.push({
              product: product._id,
              productName: product.name,
              sku: product.sku,
              quantity,
              unitPrice: product.pricing.price,
              totalPrice: lineTotal,
            });
          }
          
          // Create transaction
          await Transaction.create({
            transactionId: `TXN-${budgetYear}-${String(week + 1).padStart(2, '0')}-${String(totalTransactions + 1).padStart(5, '0')}`,
            companyId: company._id,
            customerId: customer._id,
            customerName: customer.name,
            type: 'sale',
            status: 'completed',
            date: weekDate,
            products: orderProducts,
            totals: {
              subtotal: orderTotal,
              tax: orderTotal * 0.15, // 15% VAT
              total: orderTotal * 1.15,
            },
            currency: company.currency,
            paymentMethod: 'invoice',
            createdBy: adminUser._id,
          });
          
          totalTransactions++;
          totalRevenue += orderTotal * 1.15;
        }
      }
      
      if ((week + 1) % 10 === 0) {
        console.log(`   Week ${week + 1}/${SIMULATION_CONFIG.historicalWeeks} completed`);
      }
    }
    
    console.log(`✅ Created ${totalTransactions} transactions over 52 weeks`);
    console.log(`   Total Revenue: R${(totalRevenue / 1000000).toFixed(2)}M\n`);
    
    // Step 7: Seed Historical Promotions
    console.log('🎯 Step 7: Seeding historical promotions...');
    let totalPromotions = 0;
    let totalPromotionSpend = 0;
    let totalPromotionReturn = 0;
    
    const promotionsBudget = budgets.find(b => b.category === 'Promotions');
    
    for (const promoType of SIMULATION_CONFIG.promotionTypes) {
      for (let i = 0; i < promoType.frequency; i++) {
        // Random week in the past year
        const weekOffset = Math.floor(Math.random() * (SIMULATION_CONFIG.historicalWeeks - 4));
        const startDate = addWeeks(SIMULATION_CONFIG.startDate, weekOffset);
        const endDate = addWeeks(startDate, 3); // 3-week promotions
        
        // Random products from same category
        const category = SIMULATION_CONFIG.categories[Math.floor(Math.random() * SIMULATION_CONFIG.categories.length)];
        const promoProducts = products
          .filter(p => p.category === category.name)
          .slice(0, 3)
          .map(p => p._id);
        
        // Calculate spend and expected return
        const spend = Math.floor(randomVariation(100000, 0.4)); // Average R100k per promo
        const actualROI = randomVariation(promoType.avgROI, 0.3);
        const returnAmount = spend * actualROI;
        
        const promotion = await Promotion.create({
          name: `${promoType.type} - ${category.name} - Week ${weekOffset + 1}`,
          type: promoType.type,
          description: `Historical ${promoType.type.toLowerCase()} for ${category.name}`,
          company: company._id,
          status: 'completed',
          startDate,
          endDate,
          products: promoProducts,
          budget: {
            allocated: spend,
            spent: spend,
            currency: company.currency,
          },
          terms: {
            discountPercentage: promoType.discount * 100,
          },
          metrics: {
            revenue: returnAmount,
            roi: actualROI,
            baselineSales: returnAmount * 0.7,
            incrementalSales: returnAmount * 0.3,
          },
          createdBy: adminUser.email,
        });
        
        totalPromotions++;
        totalPromotionSpend += spend;
        totalPromotionReturn += returnAmount;
      }
    }
    
    const avgROI = totalPromotionReturn / totalPromotionSpend;
    console.log(`✅ Created ${totalPromotions} historical promotions`);
    console.log(`   Total Spend: R${(totalPromotionSpend / 1000000).toFixed(2)}M`);
    console.log(`   Total Return: R${(totalPromotionReturn / 1000000).toFixed(2)}M`);
    console.log(`   Average ROI: ${avgROI.toFixed(2)}x\n`);
    
    // Step 8: Update Budget with historical spend
    console.log('💵 Step 8: Updating budget with historical spend...');
    promotionsBudget.spent = totalPromotionSpend;
    promotionsBudget.allocated = totalPromotionSpend;
    promotionsBudget.remaining = promotionsBudget.totalBudget - totalPromotionSpend;
    await promotionsBudget.save();
    console.log(`✅ Promotions budget updated: R${(promotionsBudget.spent / 1000000).toFixed(2)}M spent of R${(promotionsBudget.totalBudget / 1000000).toFixed(1)}M\n`);
    
    // Step 9: Create Simulation Metadata
    console.log('🎮 Step 9: Creating simulation metadata...');
    const simulationData = {
      company: company._id,
      budgets: budgets.map(b => ({ id: b._id, category: b.category, total: b.totalBudget })),
      adminUser: adminUser._id,
      historicalData: {
        customers: customers.length,
        products: products.length,
        transactions: totalTransactions,
        promotions: totalPromotions,
        revenue: totalRevenue,
        weeks: SIMULATION_CONFIG.historicalWeeks,
      },
      simulation: {
        weeks: SIMULATION_CONFIG.simulationWeeks,
        startDate: addWeeks(SIMULATION_CONFIG.startDate, SIMULATION_CONFIG.historicalWeeks),
        endDate: addWeeks(SIMULATION_CONFIG.startDate, SIMULATION_CONFIG.historicalWeeks + SIMULATION_CONFIG.simulationWeeks),
        status: 'ready',
      },
      currency: company.currency,
      averageROI: avgROI,
    };
    
    // Save to file for simulation script
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, 'simulation-metadata.json');
    fs.writeFileSync(outputPath, JSON.stringify(simulationData, null, 2));
    console.log(`✅ Simulation metadata saved to: ${outputPath}\n`);
    
    // Summary Report
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                  SIMULATION DATA SEEDING COMPLETE');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📊 Company Configuration:');
    console.log(`   Company: ${company.name}`);
    console.log(`   Currency: ${company.currency}`);
    console.log(`   Total Budget: R${(totalBudgetAmount / 1000000).toFixed(1)}M\n`);
    
    console.log('📈 Historical Data (52 weeks):');
    console.log(`   Customers: ${customers.length}`);
    console.log(`   Products: ${products.length} (${SIMULATION_CONFIG.categories.length} categories)`);
    console.log(`   Transactions: ${totalTransactions}`);
    console.log(`   Revenue: R${(totalRevenue / 1000000).toFixed(2)}M`);
    console.log(`   Promotions: ${totalPromotions}`);
    console.log(`   Promotion Spend: R${(totalPromotionSpend / 1000000).toFixed(2)}M`);
    console.log(`   Promotion Return: R${(totalPromotionReturn / 1000000).toFixed(2)}M`);
    console.log(`   Average ROI: ${avgROI.toFixed(2)}x\n`);
    
    console.log('🎮 Simulation Ready:');
    console.log(`   Duration: ${SIMULATION_CONFIG.simulationWeeks} weeks`);
    console.log(`   Start Date: ${simulationData.simulation.startDate.toISOString().split('T')[0]}`);
    console.log(`   End Date: ${simulationData.simulation.endDate.toISOString().split('T')[0]}\n`);
    
    console.log('🔐 Admin Access:');
    console.log(`   Email: admin@simulation.com`);
    console.log(`   Password: Simulation@123\n`);
    
    console.log('✅ Data seeding complete! Ready for 12-week simulation.');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeding
seedData()
  .then(() => {
    console.log('\n✅ Seeding script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Seeding script failed:', error);
    process.exit(1);
  });
