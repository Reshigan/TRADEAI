#!/usr/bin/env node

/**
 * Cleanup Simulation Data Script
 * 
 * Removes all data tagged with the simulation tag from the database.
 * This allows for clean re-runs of the simulation.
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const config = require('../simulation-config.json');

// Models
const Product = require('../src/models/Product');
const Customer = require('../src/models/Customer');
const Promotion = require('../src/models/Promotion');
const Budget = require('../src/models/Budget');
const TradeSpend = require('../src/models/TradeSpend');
const SalesHistory = require('../src/models/SalesHistory');

async function cleanup() {
  try {
    console.log('🧹 Starting simulation data cleanup');
    console.log('='.repeat(60));

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradeai';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    const simTag = config.simulation.simTag;
    console.log(`\nRemoving all data with simTag: ${simTag}`);

    const salesResult = await SalesHistory.deleteMany({ simTag });
    console.log(`  Deleted ${salesResult.deletedCount} sales transactions`);

    const tradeSpendResult = await TradeSpend.deleteMany({ simTag });
    console.log(`  Deleted ${tradeSpendResult.deletedCount} trade spend records`);

    const budgetResult = await Budget.deleteMany({ simTag });
    console.log(`  Deleted ${budgetResult.deletedCount} budgets`);

    const promotionResult = await Promotion.deleteMany({ simTag });
    console.log(`  Deleted ${promotionResult.deletedCount} promotions`);

    const customerResult = await Customer.deleteMany({ simTag });
    console.log(`  Deleted ${customerResult.deletedCount} customers`);

    const productResult = await Product.deleteMany({ simTag });
    console.log(`  Deleted ${productResult.deletedCount} products`);

    console.log('\n✅ Cleanup complete!');
    console.log('='.repeat(60));

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanup();
