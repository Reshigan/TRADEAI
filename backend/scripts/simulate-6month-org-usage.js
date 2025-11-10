#!/usr/bin/env node

/**
 * 6-Month Organizational Simulation Script
 * 
 * This script simulates realistic usage of the Trade AI platform across 6 months
 * with multiple users, departments, and real-world scenarios including:
 * 
 * - Multi-role user interactions (Executives, Managers, Analysts, Sales Reps)
 * - Quarterly budget planning and approvals
 * - Promotion campaigns across different product categories
 * - Trade spend management and optimization
 * - Customer negotiations and trading terms
 * - ML/AI-driven insights and recommendations
 * - Approval workflows and escalations
 * - Analytics and reporting activities
 * 
 * The simulation will create realistic data patterns to evaluate:
 * 1. Frontend UX effectiveness
 * 2. AI flow integration points
 * 3. Workflow efficiency
 * 4. Navigation and discoverability
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Import models
const User = require('../models/User');
const Company = require('../models/Company');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Budget = require('../models/Budget');
const Promotion = require('../models/Promotion');
const Transaction = require('../models/Transaction');
const TradeSpend = require('../models/TradeSpend');
const TradingTerm = require('../models/TradingTerm');

// Simulation configuration
const SIMULATION_CONFIG = {
  companyName: 'Mondelez SA Simulation',
  companyCode: 'MDZ-SIM',
  currency: 'ZAR',
  startDate: new Date('2025-01-01'),
  months: 6,
  
  // Organizational structure
  departments: [
    { name: 'Sales', code: 'SALES' },
    { name: 'Marketing', code: 'MRKT' },
    { name: 'Trade Marketing', code: 'TRADE' },
    { name: 'Finance', code: 'FIN' },
    { name: 'Analytics', code: 'ANLYT' }
  ],
  
  // User roles and personas
  users: [
    // Executives
    { role: 'admin', name: 'Sarah Chen', email: 'sarah.chen@mondelez-sim.com', dept: 'Executive', title: 'VP Trade Marketing' },
    { role: 'admin', name: 'Michael Rodriguez', email: 'michael.rodriguez@mondelez-sim.com', dept: 'Finance', title: 'CFO' },
    
    // Managers
    { role: 'manager', name: 'Emma Thompson', email: 'emma.thompson@mondelez-sim.com', dept: 'Trade Marketing', title: 'Trade Marketing Manager' },
    { role: 'manager', name: 'David Kim', email: 'david.kim@mondelez-sim.com', dept: 'Sales', title: 'National Sales Manager' },
    { role: 'manager', name: 'Lisa Martinez', email: 'lisa.martinez@mondelez-sim.com', dept: 'Marketing', title: 'Brand Manager' },
    
    // Analysts
    { role: 'analyst', name: 'James Wilson', email: 'james.wilson@mondelez-sim.com', dept: 'Analytics', title: 'Senior Analyst' },
    { role: 'analyst', name: 'Priya Patel', email: 'priya.patel@mondelez-sim.com', dept: 'Trade Marketing', title: 'Trade Analyst' },
    { role: 'analyst', name: 'Tom Anderson', email: 'tom.anderson@mondelez-sim.com', dept: 'Finance', title: 'Financial Analyst' },
    
    // Sales Representatives
    { role: 'user', name: 'Rachel Green', email: 'rachel.green@mondelez-sim.com', dept: 'Sales', title: 'Key Account Manager' },
    { role: 'user', name: 'Chris Brown', email: 'chris.brown@mondelez-sim.com', dept: 'Sales', title: 'Regional Sales Rep' },
    { role: 'user', name: 'Amy Liu', email: 'amy.liu@mondelez-sim.com', dept: 'Sales', title: 'Account Executive' }
  ]
};

// Simulation scenarios by month
const MONTHLY_SCENARIOS = {
  1: { // January - Q1 Planning
    focus: 'Budget Planning & Goal Setting',
    activities: [
      'Review previous year performance',
      'Set Q1 budget allocations',
      'Plan promotional calendar',
      'Negotiate key customer terms',
      'Review AI forecasts for demand planning'
    ]
  },
  2: { // February - Valentine's & Chinese New Year Promotions
    focus: 'Seasonal Promotions Execution',
    activities: [
      'Launch Valentine\'s Day promotions',
      'Execute Chinese New Year campaigns',
      'Monitor promotion performance',
      'Adjust budgets based on early results',
      'Use AI insights for real-time optimization'
    ]
  },
  3: { // March - Q1 Review
    focus: 'Quarter End Review & Adjustments',
    activities: [
      'Q1 performance analysis',
      'Budget reallocation for Q2',
      'Customer performance reviews',
      'Trading terms negotiations',
      'ML-driven customer segmentation analysis'
    ]
  },
  4: { // April - Easter & Q2 Start
    focus: 'Easter Campaigns & New Initiatives',
    activities: [
      'Easter promotion execution',
      'Launch new product promotions',
      'Expand trading terms with growing accounts',
      'Test AI-recommended price optimizations',
      'Mid-year forecast updates'
    ]
  },
  5: { // May - Summer Planning
    focus: 'Summer Campaign Preparation',
    activities: [
      'Plan summer promotions',
      'Optimize inventory with demand forecasting',
      'Review and optimize trade spend ROI',
      'Implement AI anomaly detection insights',
      'Cross-functional analytics reviews'
    ]
  },
  6: { // June - Mid-Year Review
    focus: 'Mid-Year Review & H2 Planning',
    activities: [
      'Comprehensive H1 performance review',
      'H2 budget planning and approvals',
      'Strategic account reviews',
      'Update trading terms based on performance',
      'AI-driven recommendations for H2 strategy'
    ]
  }
};

// Helper function to get random date within a month
function getRandomDateInMonth(year, month, day = null) {
  if (day) return new Date(year, month - 1, day);
  const daysInMonth = new Date(year, month, 0).getDate();
  const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
  return new Date(year, month - 1, randomDay);
}

// Helper function to get random items from array
function getRandomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Main simulation function
async function runSimulation() {
  try {
    console.log('🚀 Starting 6-Month Organizational Simulation...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Step 1: Create or find simulation company
    console.log('📊 Step 1: Setting up simulation company...');
    let company = await Company.findOne({ code: SIMULATION_CONFIG.companyCode });
    
    if (!company) {
      company = await Company.create({
        name: SIMULATION_CONFIG.companyName,
        code: SIMULATION_CONFIG.companyCode,
        domain: 'gcgc.com',
        industry: 'Consumer Goods',
        country: 'United States',
        currency: SIMULATION_CONFIG.currency,
        fiscalYearStart: 1,
        settings: {
          multiCurrency: false,
          taxEnabled: true,
          approvalWorkflow: true,
          aiInsightsEnabled: true
        }
      });
      console.log(`✅ Created company: ${company.name} (${company.code})`);
    } else {
      console.log(`✅ Found existing company: ${company.name}`);
    }
    
    // Step 2: Create organizational users
    console.log('\n👥 Step 2: Creating organizational users...');
    const createdUsers = [];
    
    for (const userConfig of SIMULATION_CONFIG.users) {
      let user = await User.findOne({ email: userConfig.email });
      
      if (!user) {
        const hashedPassword = await bcrypt.hash('Simulation2025!', 10);
        const username = userConfig.email.split('@')[0];
        user = await User.create({
          username,
          email: userConfig.email,
          password: hashedPassword,
          firstName: userConfig.name.split(' ')[0],
          lastName: userConfig.name.split(' ')[1] || '',
          role: userConfig.role,
          company: company._id,
          department: userConfig.dept,
          title: userConfig.title,
          isActive: true,
          permissions: getPermissionsByRole(userConfig.role)
        });
        console.log(`   ✓ Created ${userConfig.role}: ${userConfig.name} (${userConfig.dept})`);
      } else {
        console.log(`   ✓ Found existing user: ${userConfig.name}`);
      }
      
      createdUsers.push({ ...userConfig, userId: user._id, userDoc: user });
    }
    
    // Step 3: Get existing customers and products
    console.log('\n🏪 Step 3: Loading customers and products...');
    // Try company field first, fallback to tenant field for legacy data
    let customers = await Customer.find({ company: company._id }).limit(20);
    let products = await Product.find({ company: company._id });
    
    if (customers.length === 0) {
      console.log('   ℹ️  No customers found with company field, trying tenant field...');
      customers = await Customer.find({ tenant: 'mondelez' }).limit(20);
      products = await Product.find({ tenant: 'mondelez' });
    }
    
    console.log(`   ✓ Found ${customers.length} customers`);
    console.log(`   ✓ Found ${products.length} products`);
    
    if (customers.length === 0 || products.length === 0) {
      console.log('❌ Error: Need existing customers and products. Run seed-12week-simulation.js first.');
      process.exit(1);
    }
    
    // Step 4: Create realistic budgets for 2025
    console.log('\n💰 Step 4: Setting up 2025 budgets...');
    const budgetCategories = [
      { name: 'Trade Promotions 2025', category: 'Promotions', amount: 2500000, owner: 'emma.thompson@mondelez-sim.com' },
      { name: 'Trade Spend 2025', category: 'Trade Spend', amount: 1800000, owner: 'david.kim@mondelez-sim.com' },
      { name: 'Brand Marketing 2025', category: 'Marketing', amount: 1200000, owner: 'lisa.martinez@mondelez-sim.com' },
      { name: 'Digital Marketing 2025', category: 'Digital', amount: 1500000, owner: 'sarah.chen@mondelez-sim.com' }
    ];
    
    const budgets = [];
    const startDate = new Date(2025, 0, 1); // Jan 1, 2025
    const endDate = new Date(2025, 11, 31); // Dec 31, 2025
    
    for (const budgetConfig of budgetCategories) {
      const owner = createdUsers.find(u => u.email === budgetConfig.owner);
      
      let budget = await Budget.findOne({
        company: company._id,
        name: budgetConfig.name,
        fiscalYear: 2025
      });
      
      if (!budget) {
        budget = await Budget.create({
          company: company._id,
          name: budgetConfig.name,
          category: budgetConfig.category,
          fiscalYear: 2025,
          startDate,
          endDate,
          totalBudget: budgetConfig.amount,
          allocated: 0,
          spent: 0,
          remaining: budgetConfig.amount,
          currency: company.currency,
          status: 'active',
          owner: owner.userId,
          createdBy: owner.email
        });
        console.log(`   ✓ Created ${budgetConfig.name}: ${formatCurrency(budgetConfig.amount)}`);
      }
      
      budgets.push(budget);
    }
    
    // Step 5: Simulate 6 months of organizational activities
    console.log('\n📅 Step 5: Simulating 6 months of activities...\n');
    
    const simulationResults = {
      totalTransactions: 0,
      totalPromotions: 0,
      totalTradeSpends: 0,
      totalTradingTerms: 0,
      totalRevenue: 0,
      aiInteractions: 0,
      monthlyStats: []
    };
    
    for (let month = 1; month <= SIMULATION_CONFIG.months; month++) {
      const monthDate = new Date(2025, month - 1, 1);
      const scenario = MONTHLY_SCENARIOS[month];
      
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📆 MONTH ${month}: ${monthDate.toLocaleString('default', { month: 'long' })} 2025`);
      console.log(`🎯 Focus: ${scenario.focus}`);
      console.log(`${'='.repeat(80)}\n`);
      
      const monthStats = await simulateMonth(
        month,
        company,
        createdUsers,
        customers,
        products,
        budgets,
        scenario
      );
      
      simulationResults.totalTransactions += monthStats.transactions;
      simulationResults.totalPromotions += monthStats.promotions;
      simulationResults.totalTradeSpends += monthStats.tradeSpends;
      simulationResults.totalTradingTerms += monthStats.tradingTerms;
      simulationResults.totalRevenue += monthStats.revenue;
      simulationResults.aiInteractions += monthStats.aiInteractions;
      simulationResults.monthlyStats.push(monthStats);
    }
    
    // Step 6: Save simulation results
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 SIMULATION COMPLETE - SUMMARY');
    console.log('='.repeat(80));
    console.log(`\n✅ 6-Month Simulation Results:`);
    console.log(`   • Total Transactions: ${simulationResults.totalTransactions}`);
    console.log(`   • Total Promotions: ${simulationResults.totalPromotions}`);
    console.log(`   • Trade Spends Created: ${simulationResults.totalTradeSpends}`);
    console.log(`   • Trading Terms: ${simulationResults.totalTradingTerms}`);
    console.log(`   • Total Revenue: ${formatCurrency(simulationResults.totalRevenue)}`);
    console.log(`   • AI Interactions: ${simulationResults.aiInteractions}`);
    
    const resultsPath = path.join(__dirname, 'simulation-6month-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify({
      ...simulationResults,
      company: company.name,
      users: createdUsers.length,
      startDate: SIMULATION_CONFIG.startDate,
      endDate: new Date(2025, 5, 30),
      completedAt: new Date()
    }, null, 2));
    
    console.log(`\n💾 Results saved to: ${resultsPath}`);
    console.log('\n✅ Simulation data ready for frontend testing!\n');
    
    return simulationResults;
    
  } catch (error) {
    console.error('❌ Simulation failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
}

// Simulate activities for a single month
async function simulateMonth(month, company, users, customers, products, budgets, scenario) {
  const stats = {
    month,
    transactions: 0,
    promotions: 0,
    tradeSpends: 0,
    tradingTerms: 0,
    revenue: 0,
    aiInteractions: 0,
    activities: []
  };
  
  // Simulate different activity types based on month and scenario
  
  // 1. Promotions (2-5 per month)
  const promotionCount = Math.floor(Math.random() * 4) + 2;
  for (let i = 0; i < promotionCount; i++) {
    await simulatePromotion(month, company, users, customers, products, budgets, stats);
  }
  
  // 2. Trade Spends (3-8 per month)
  const tradeSpendCount = Math.floor(Math.random() * 6) + 3;
  for (let i = 0; i < tradeSpendCount; i++) {
    await simulateTradeSpend(month, company, users, customers, budgets, stats);
  }
  
  // 3. Trading Terms (1-3 per month for key accounts)
  if (month % 3 === 0) { // Quarterly reviews
    const termCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < termCount; i++) {
      await simulateTradingTerm(month, company, users, customers, stats);
    }
  }
  
  // 4. Transactions (50-150 per month)
  const transactionCount = Math.floor(Math.random() * 100) + 50;
  for (let i = 0; i < transactionCount; i++) {
    await simulateTransaction(month, company, customers, products, stats);
  }
  
  // 5. AI/ML Interactions (simulated)
  stats.aiInteractions = Math.floor(Math.random() * 50) + 30;
  
  console.log(`\n   Month ${month} Summary:`);
  console.log(`   • Transactions: ${stats.transactions}`);
  console.log(`   • Promotions: ${stats.promotions}`);
  console.log(`   • Trade Spends: ${stats.tradeSpends}`);
  console.log(`   • Trading Terms: ${stats.tradingTerms}`);
  console.log(`   • Revenue: ${formatCurrency(stats.revenue)}`);
  console.log(`   • AI Interactions: ${stats.aiInteractions}`);
  
  return stats;
}

// Simulate a promotion
async function simulatePromotion(month, company, users, customers, products, budgets, stats) {
  const promotionTypes = ['Price Reduction', 'BOGOF', 'Volume Discount', 'Bundle Deal', 'Seasonal Special'];
  const type = promotionTypes[Math.floor(Math.random() * promotionTypes.length)];
  
  const startDate = getRandomDateInMonth(2025, month, 1);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + (Math.floor(Math.random() * 21) + 7)); // 7-28 days
  
  const promoProducts = getRandomItems(products, Math.floor(Math.random() * 5) + 2);
  const budget = budgets[Math.floor(Math.random() * budgets.length)];
  const creator = getRandomItems(users.filter(u => ['manager', 'admin'].includes(u.role)), 1)[0];
  
  const allocated = (Math.random() * 50000) + 10000;
  
  try {
    const promotion = await Promotion.create({
      name: `${type} - ${startDate.toLocaleDateString('default', { month: 'short' })} 2025`,
      type,
      company: company._id,
      status: 'active',
      startDate,
      endDate,
      products: promoProducts.map(p => p._id),
      budget: {
        allocated,
        spent: 0,
        currency: company.currency
      },
      terms: {
        discountPercentage: type === 'Price Reduction' ? 15 : type === 'BOGOF' ? 50 : 10
      },
      metrics: {
        revenue: 0,
        roi: 0,
        baselineSales: 0,
        incrementalSales: 0
      },
      createdBy: creator.email
    });
    
    stats.promotions++;
    stats.activities.push(`Promotion created: ${promotion.name} by ${creator.name}`);
  } catch (error) {
    console.error(`   ⚠️  Failed to create promotion: ${error.message}`);
  }
}

// Simulate a trade spend
async function simulateTradeSpend(month, company, users, customers, budgets, stats) {
  // Match actual enum values from TradeSpend model
  const spendTypes = ['Trade Promotion', 'Volume Discount', 'Slotting Fee', 'Display Allowance', 'Marketing Co-op', 'Rebate'];
  const spendType = spendTypes[Math.floor(Math.random() * spendTypes.length)];
  
  const customer = customers[Math.floor(Math.random() * customers.length)];
  const budget = budgets[Math.floor(Math.random() * budgets.length)];
  const creator = getRandomItems(users.filter(u => u.dept === 'Trade Marketing' || u.dept === 'Sales'), 1)[0];
  
  const amount = (Math.random() * 20000) + 5000;
  const spendDate = getRandomDateInMonth(2025, month);
  
  // Generate unique spendId
  const spendId = `TS-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  
  try {
    const tradeSpend = await TradeSpend.create({
      spendId,
      customer: customer._id,
      customerName: customer.name,
      spendType,
      amount,
      currency: company.currency,
      spendDate,
      status: 'Approved', // Capitalized to match enum
      budget: budget._id,
      description: `${spendType} for ${customer.name}`,
      createdBy: creator.email,
      approvedBy: users.find(u => u.role === 'admin')?.email
    });
    
    // Update budget
    await Budget.findByIdAndUpdate(budget._id, {
      $inc: { spent: amount, remaining: -amount }
    });
    
    stats.tradeSpends++;
    stats.activities.push(`Trade Spend: ${spendType} - ${formatCurrency(amount)} for ${customer.name}`);
  } catch (error) {
    console.error(`   ⚠️  Failed to create trade spend: ${error.message}`);
  }
}

// Simulate a trading term
async function simulateTradingTerm(month, company, users, customers, stats) {
  const customer = getRandomItems(customers, 1)[0];
  const creator = getRandomItems(users.filter(u => u.role === 'manager' || u.role === 'admin'), 1)[0];
  
  // Match actual enum values from TradingTerm model
  const termTypes = ['Volume Discount', 'Growth Incentive', 'Annual Rebate', 'Promotional Support', 'Marketing Fund'];
  const termType = termTypes[Math.floor(Math.random() * termTypes.length)];
  
  const startDate = getRandomDateInMonth(2025, month, 1);
  const endDate = new Date(2025, 11, 31); // End of year
  
  // Generate unique termId
  const termId = `TT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  
  // Calculate value based on term type
  const value = termType === 'Volume Discount' || termType === 'Growth Incentive' 
    ? Math.floor(Math.random() * 5) + 2  // 2-7%
    : Math.floor(Math.random() * 50000) + 10000; // $10k-$60k
  
  const valueType = termType === 'Volume Discount' || termType === 'Growth Incentive' 
    ? 'Percentage' 
    : 'Fixed Amount';
  
  try {
    const term = await TradingTerm.create({
      termId,
      customer: customer._id,
      customerName: customer.name,
      termType,
      value,
      valueType,
      startDate,
      endDate,
      status: 'Active', // Capitalized to match enum
      currency: company.currency,
      description: `${termType} for ${customer.name}`,
      createdBy: creator.email,
      approvedBy: users.find(u => u.role === 'admin')?.email
    });
    
    stats.tradingTerms++;
    stats.activities.push(`Trading Term: ${termType} for ${customer.name}`);
  } catch (error) {
    console.error(`   ⚠️  Failed to create trading term: ${error.message}`);
  }
}

// Simulate a transaction
async function simulateTransaction(month, company, customers, products, stats) {
  const customer = customers[Math.floor(Math.random() * customers.length)];
  
  // Select 1-3 products for this transaction
  const numProducts = Math.floor(Math.random() * 3) + 1;
  const transactionProducts = [];
  let subtotal = 0;
  
  for (let i = 0; i < numProducts; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const quantity = Math.floor(Math.random() * 50) + 5;
    const unitPrice = product.price || (Math.random() * 20 + 5);
    const totalPrice = quantity * unitPrice;
    
    transactionProducts.push({
      product: product._id,
      productName: product.name,
      sku: product.sku || `SKU-${product.productCode}`,
      quantity,
      unitPrice,
      totalPrice
    });
    
    subtotal += totalPrice;
  }
  
  const tax = subtotal * 0.15; // 15% tax
  const total = subtotal + tax;
  
  const date = getRandomDateInMonth(2025, month);
  
  // Generate unique transactionId
  const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  
  try {
    await Transaction.create({
      transactionId,
      companyId: company._id,
      customerId: customer._id,
      customerName: customer.name,
      date,
      products: transactionProducts,
      totals: {
        subtotal,
        tax,
        total
      },
      currency: company.currency,
      type: 'sale',
      status: 'completed',
      paymentMethod: ['invoice', 'cash', 'card'][Math.floor(Math.random() * 3)]
    });
    
    stats.transactions++;
    stats.revenue += total;
  } catch (error) {
    console.error(`   ⚠️  Failed to create transaction: ${error.message}`);
  }
}

// Helper functions
function getPermissionsByRole(role) {
  const permissionSets = {
    admin: ['view_all', 'create_all', 'edit_all', 'delete_all', 'approve_all'],
    manager: ['view_all', 'create_all', 'edit_own', 'approve_own_dept'],
    analyst: ['view_all', 'create_reports', 'edit_own'],
    user: ['view_own', 'create_own', 'edit_own']
  };
  return permissionSets[role] || permissionSets.user;
}

function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Run the simulation
if (require.main === module) {
  runSimulation()
    .then(() => {
      console.log('✅ Simulation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Simulation failed:', error);
      process.exit(1);
    });
}

module.exports = { runSimulation };
