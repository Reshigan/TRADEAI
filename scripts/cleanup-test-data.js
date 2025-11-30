#!/usr/bin/env node

/**
 * Cleanup Test Data Script
 * Removes all test data created by regression testing
 */

require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const mongoose = require('mongoose');

// Import models
const User = require('../backend/models/User');
const Company = require('../backend/models/Company');
const Customer = require('../backend/models/Customer');
const Product = require('../backend/models/Product');
const Budget = require('../backend/models/Budget');
const Promotion = require('../backend/models/Promotion');
const Transaction = require('../backend/models/Transaction');
const TradeSpend = require('../backend/models/TradeSpend');
const TradingTerm = require('../backend/models/TradingTerm');

async function cleanupTestData(companyCode) {
  try {
    console.log(`\n🧹 Starting cleanup for company: ${companyCode}...`);
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const company = await Company.findOne({ code: companyCode });
    
    if (!company) {
      console.log(`⚠️  Company ${companyCode} not found. Nothing to clean up.`);
      await mongoose.connection.close();
      return;
    }
    
    console.log(`\n📊 Found company: ${company.name} (${company._id})`);
    
    console.log('\n🗑️  Deleting entities...');
    
    const transactionsDeleted = await Transaction.deleteMany({ company: company._id });
    console.log(`   ✓ Deleted ${transactionsDeleted.deletedCount} transactions`);
    
    const tradeSpendsDeleted = await TradeSpend.deleteMany({ company: company._id });
    console.log(`   ✓ Deleted ${tradeSpendsDeleted.deletedCount} trade spends`);
    
    const tradingTermsDeleted = await TradingTerm.deleteMany({ company: company._id });
    console.log(`   ✓ Deleted ${tradingTermsDeleted.deletedCount} trading terms`);
    
    const promotionsDeleted = await Promotion.deleteMany({ company: company._id });
    console.log(`   ✓ Deleted ${promotionsDeleted.deletedCount} promotions`);
    
    const budgetsDeleted = await Budget.deleteMany({ company: company._id });
    console.log(`   ✓ Deleted ${budgetsDeleted.deletedCount} budgets`);
    
    const productsDeleted = await Product.deleteMany({ company: company._id });
    console.log(`   ✓ Deleted ${productsDeleted.deletedCount} products`);
    
    const customersDeleted = await Customer.deleteMany({ company: company._id });
    console.log(`   ✓ Deleted ${customersDeleted.deletedCount} customers`);
    
    const usersDeleted = await User.deleteMany({ company: company._id });
    console.log(`   ✓ Deleted ${usersDeleted.deletedCount} users`);
    
    await Company.deleteOne({ _id: company._id });
    console.log(`   ✓ Deleted company: ${company.name}`);
    
    console.log('\n✅ Cleanup complete!');
    console.log('\n📊 Summary:');
    console.log(`   • Transactions: ${transactionsDeleted.deletedCount}`);
    console.log(`   • Trade Spends: ${tradeSpendsDeleted.deletedCount}`);
    console.log(`   • Trading Terms: ${tradingTermsDeleted.deletedCount}`);
    console.log(`   • Promotions: ${promotionsDeleted.deletedCount}`);
    console.log(`   • Budgets: ${budgetsDeleted.deletedCount}`);
    console.log(`   • Products: ${productsDeleted.deletedCount}`);
    console.log(`   • Customers: ${customersDeleted.deletedCount}`);
    console.log(`   • Users: ${usersDeleted.deletedCount}`);
    console.log(`   • Company: 1`);
    
    await mongoose.connection.close();
    console.log('\n✅ Disconnected from MongoDB\n');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}

if (require.main === module) {
  const companyCode = process.argv[2] || 'DIST-TEST';
  
  cleanupTestData(companyCode)
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { cleanupTestData };
