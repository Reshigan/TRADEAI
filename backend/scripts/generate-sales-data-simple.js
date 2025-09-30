#!/usr/bin/env node

/**
 * Simplified Historical Sales Data Generator for Modelex South Africa
 * Generates realistic FMCG sales transactions with seasonal patterns
 */

const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/trade-ai', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const Customer = require('../src/models/Customer');
const Product = require('../src/models/Product');
const SalesTransaction = require('../models/SalesTransaction');

// Configuration
const COMPANY_ID = '68db5a83a039604f03af95f3'; // Modelex SA
const START_DATE = new Date('2023-01-01');
const END_DATE = new Date('2024-12-31');

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

// Customer tier multipliers
const CUSTOMER_TIER_MULTIPLIERS = {
  'Tier 1': 2.5,  // Large chains
  'Tier 2': 1.0,  // Medium chains
};

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getSeasonalMultiplier(date) {
  const month = date.getMonth() + 1;
  return SEASONAL_MULTIPLIERS[month] || 1.0;
}

function generateSalesTransactions(customers, products) {
  const transactions = [];
  let transactionId = 1000000;

  console.log('📈 Generating sales transactions...');
  
  // Generate transactions for each month
  for (let year = 2023; year <= 2024; year++) {
    for (let month = 1; month <= 12; month++) {
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);
      
      console.log(`Processing ${year}-${month.toString().padStart(2, '0')}`);
      
      customers.forEach(customer => {
        const customerMultiplier = CUSTOMER_TIER_MULTIPLIERS[customer.tier] || 1.0;
        
        products.forEach(product => {
          // Skip some combinations randomly
          if (Math.random() < 0.4) return; // 40% chance to skip
          
          const seasonalMultiplier = getSeasonalMultiplier(monthStart);
          
          // Generate 5-15 transactions per month for this customer-product combo
          const numTransactions = Math.floor(Math.random() * 11) + 5;
          
          for (let t = 0; t < numTransactions; t++) {
            const transactionDate = getRandomDate(monthStart, monthEnd);
            
            // Calculate quantity based on multipliers
            const baseQuantity = 50 + Math.random() * 200; // 50-250 units
            const quantity = Math.max(1, Math.floor(
              baseQuantity * customerMultiplier * seasonalMultiplier * (0.7 + Math.random() * 0.6)
            ));
            
            const unitPrice = product.pricing?.listPrice || 50;
            const totalAmount = quantity * unitPrice;
            
            // Random discount 0-15%
            const discountAmount = totalAmount * (Math.random() * 0.15);
            const netAmount = totalAmount - discountAmount;
            
            const transaction = {
              company: COMPANY_ID,
              transactionId: `TXN${transactionId++}`,
              customer: customer._id,
              product: product._id,
              date: transactionDate,
              quantity,
              unitPrice,
              totalAmount,
              discountAmount,
              netAmount,
              currency: 'ZAR',
              promotion: null,
              salesRep: customer.primaryContact?.name || 'System',
              channel: ['Direct', 'Distributor', 'Online', 'Retail'][Math.floor(Math.random() * 4)],
              region: 'Gauteng',
              status: 'completed',
              metadata: {
                orderNumber: `ORD${Math.floor(Math.random() * 900000) + 100000}`,
                invoiceNumber: `INV${Math.floor(Math.random() * 900000) + 100000}`,
                paymentTerms: ['30 days', '60 days', '90 days', 'COD'][Math.floor(Math.random() * 4)],
                deliveryDate: new Date(transactionDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
              },
              createdAt: transactionDate,
              updatedAt: transactionDate
            };
            
            transactions.push(transaction);
          }
        });
      });
    }
  }
  
  return transactions;
}

async function generateHistoricalData() {
  try {
    console.log('🚀 Starting simplified historical data generation for Modelex South Africa...');
    
    // Fetch existing data
    console.log('📊 Fetching existing customers and products...');
    const customers = await Customer.find({ company: COMPANY_ID });
    const products = await Product.find({ company: COMPANY_ID });
    
    console.log(`Found ${customers.length} customers and ${products.length} products`);
    
    if (customers.length === 0 || products.length === 0) {
      throw new Error('No customers or products found. Please run the setup script first.');
    }
    
    // Clear existing sales data
    console.log('🧹 Clearing existing sales transactions...');
    await SalesTransaction.deleteMany({ company: COMPANY_ID });
    
    // Generate sales transactions
    const transactions = generateSalesTransactions(customers, products);
    
    // Insert transactions in batches
    console.log(`💾 Inserting ${transactions.length.toLocaleString()} transactions...`);
    const batchSize = 1000;
    let insertedCount = 0;
    
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      await SalesTransaction.insertMany(batch);
      insertedCount += batch.length;
      console.log(`Inserted ${insertedCount.toLocaleString()}/${transactions.length.toLocaleString()} transactions`);
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
    console.log(`📈 Transactions: ${transactions.length.toLocaleString()}`);
    console.log(`💵 Total Revenue: R${totalRevenue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
    console.log(`📊 Avg Transaction: R${avgTransactionValue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
    console.log(`📦 Total Units Sold: ${totalQuantity.toLocaleString()}`);
    console.log('=' .repeat(50));
    
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