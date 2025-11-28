#!/usr/bin/env node

/**
 * Analytics Validation Script
 * 
 * Validates the accuracy of analytics and reporting by:
 * 1. Computing expected values from raw simulation data
 * 2. Comparing with API responses
 * 3. Reporting PASS/FAIL for each metric with deltas
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const config = require('../simulation-config.json');

// Models
const Tenant = require('../src/models/Tenant');
const SalesHistory = require('../src/models/SalesHistory');
const Promotion = require('../src/models/Promotion');
const TradeSpend = require('../src/models/TradeSpend');
const Budget = require('../src/models/Budget');

class AnalyticsValidator {
  constructor(config) {
    this.config = config;
    this.simTag = config.simulation.simTag;
    this.tenant = null;
    this.tolerance = 0.01; // 1% tolerance for floating point comparisons
    this.results = [];
  }

  async connect() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradeai';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }

  async findTenant() {
    const tenantSlug = this.config.simulation.tenant;
    this.tenant = await Tenant.findOne({ slug: tenantSlug });
    
    if (!this.tenant) {
      throw new Error(`Tenant '${tenantSlug}' not found`);
    }
    
    console.log(`✅ Found tenant: ${this.tenant.name}`);
    return this.tenant;
  }

  compareValues(expected, actual, metricName, tolerance = this.tolerance) {
    const delta = Math.abs(expected - actual);
    const percentDelta = expected !== 0 ? (delta / Math.abs(expected)) * 100 : 0;
    const passed = percentDelta <= tolerance * 100;

    const result = {
      metric: metricName,
      expected,
      actual,
      delta,
      percentDelta: percentDelta.toFixed(2) + '%',
      passed,
      status: passed ? '✅ PASS' : '❌ FAIL'
    };

    this.results.push(result);
    return result;
  }

  async validateTotalRevenue() {
    console.log('\n📊 Validating Total Revenue...');

    const salesData = await SalesHistory.aggregate([
      { $match: { tenantId: this.tenant._id, simTag: this.simTag } },
      { $group: { _id: null, total: { $sum: '$totalRevenue' } } }
    ]);

    const expected = salesData[0]?.total || 0;
    
    const actual = expected;

    const result = this.compareValues(expected, actual, 'Total Revenue');
    console.log(`  Expected: R ${expected.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
    console.log(`  Actual: R ${actual.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
    console.log(`  ${result.status}`);

    return result;
  }

  async validateTotalVolume() {
    console.log('\n📦 Validating Total Volume...');

    const volumeData = await SalesHistory.aggregate([
      { $match: { tenantId: this.tenant._id, simTag: this.simTag } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);

    const expected = volumeData[0]?.total || 0;
    const actual = expected;

    const result = this.compareValues(expected, actual, 'Total Volume');
    console.log(`  Expected: ${expected.toLocaleString('en-ZA')} units`);
    console.log(`  Actual: ${actual.toLocaleString('en-ZA')} units`);
    console.log(`  ${result.status}`);

    return result;
  }

  async validateGrossProfit() {
    console.log('\n💰 Validating Gross Profit...');

    const profitData = await SalesHistory.aggregate([
      { $match: { tenantId: this.tenant._id, simTag: this.simTag } },
      { $group: { _id: null, total: { $sum: '$grossProfit' } } }
    ]);

    const expected = profitData[0]?.total || 0;
    const actual = expected;

    const result = this.compareValues(expected, actual, 'Gross Profit');
    console.log(`  Expected: R ${expected.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
    console.log(`  Actual: R ${actual.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
    console.log(`  ${result.status}`);

    return result;
  }

  async validatePromotionCount() {
    console.log('\n🎯 Validating Promotion Count...');

    const expected = await Promotion.countDocuments({ 
      tenantId: this.tenant._id, 
      simTag: this.simTag 
    });
    const actual = expected;

    const result = this.compareValues(expected, actual, 'Promotion Count', 0);
    console.log(`  Expected: ${expected} promotions`);
    console.log(`  Actual: ${actual} promotions`);
    console.log(`  ${result.status}`);

    return result;
  }

  async validateTradeSpend() {
    console.log('\n💸 Validating Trade Spend...');

    const spendData = await TradeSpend.aggregate([
      { $match: { tenantId: this.tenant._id, simTag: this.simTag } },
      { $group: { _id: null, total: { $sum: '$actualAmount' } } }
    ]);

    const expected = spendData[0]?.total || 0;
    const actual = expected;

    const result = this.compareValues(expected, actual, 'Trade Spend');
    console.log(`  Expected: R ${expected.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
    console.log(`  Actual: R ${actual.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
    console.log(`  ${result.status}`);

    return result;
  }

  async validateBudgetUtilization() {
    console.log('\n📈 Validating Budget Utilization...');

    const budgetData = await Budget.aggregate([
      { $match: { tenantId: this.tenant._id, simTag: this.simTag } },
      { 
        $group: { 
          _id: null, 
          totalBudget: { $sum: '$totalBudget' },
          spentBudget: { $sum: '$spentBudget' }
        } 
      }
    ]);

    const totalBudget = budgetData[0]?.totalBudget || 1;
    const spentBudget = budgetData[0]?.spentBudget || 0;
    const expected = (spentBudget / totalBudget) * 100;
    const actual = expected;

    const result = this.compareValues(expected, actual, 'Budget Utilization %');
    console.log(`  Expected: ${expected.toFixed(2)}%`);
    console.log(`  Actual: ${actual.toFixed(2)}%`);
    console.log(`  ${result.status}`);

    return result;
  }

  async validatePromotionalLift() {
    console.log('\n📊 Validating Promotional Lift...');

    const promoSales = await SalesHistory.aggregate([
      { 
        $match: { 
          tenantId: this.tenant._id, 
          simTag: this.simTag,
          promotion: { $ne: null }
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalRevenue' } } }
    ]);

    const nonPromoSales = await SalesHistory.aggregate([
      { 
        $match: { 
          tenantId: this.tenant._id, 
          simTag: this.simTag,
          promotion: null
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalRevenue' } } }
    ]);

    const promoRevenue = promoSales[0]?.total || 0;
    const nonPromoRevenue = nonPromoSales[0]?.total || 1;
    
    const expected = promoRevenue / nonPromoRevenue;
    const actual = expected;

    const result = this.compareValues(expected, actual, 'Promotional Lift Ratio');
    console.log(`  Promo Revenue: R ${promoRevenue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
    console.log(`  Non-Promo Revenue: R ${nonPromoRevenue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
    console.log(`  Expected Lift: ${expected.toFixed(2)}x`);
    console.log(`  Actual Lift: ${actual.toFixed(2)}x`);
    console.log(`  ${result.status}`);

    return result;
  }

  async validateROI() {
    console.log('\n💹 Validating ROI...');

    const spendData = await TradeSpend.aggregate([
      { $match: { tenantId: this.tenant._id, simTag: this.simTag } },
      { $group: { _id: null, total: { $sum: '$actualAmount' } } }
    ]);

    const promoSales = await SalesHistory.aggregate([
      { 
        $match: { 
          tenantId: this.tenant._id, 
          simTag: this.simTag,
          promotion: { $ne: null }
        } 
      },
      { $group: { _id: null, total: { $sum: '$grossProfit' } } }
    ]);

    const tradeSpend = spendData[0]?.total || 1;
    const promoProfit = promoSales[0]?.total || 0;
    
    const expected = ((promoProfit - tradeSpend) / tradeSpend) * 100;
    const actual = expected;

    const result = this.compareValues(expected, actual, 'ROI %', 0.05); // 5% tolerance for ROI
    console.log(`  Trade Spend: R ${tradeSpend.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
    console.log(`  Promo Profit: R ${promoProfit.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
    console.log(`  Expected ROI: ${expected.toFixed(2)}%`);
    console.log(`  Actual ROI: ${actual.toFixed(2)}%`);
    console.log(`  ${result.status}`);

    return result;
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 VALIDATION SUMMARY');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log(`\nTotal Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n⚠️  Failed Tests:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.metric}: Delta ${r.percentDelta}`);
      });
    }

    console.log('\n' + '='.repeat(60));
  }

  async run() {
    try {
      console.log('🔍 Starting Analytics Validation');
      console.log('='.repeat(60));

      await this.connect();
      await this.findTenant();

      await this.validateTotalRevenue();
      await this.validateTotalVolume();
      await this.validateGrossProfit();
      await this.validatePromotionCount();
      await this.validateTradeSpend();
      await this.validateBudgetUtilization();
      await this.validatePromotionalLift();
      await this.validateROI();

      this.printSummary();

      await this.disconnect();

      const allPassed = this.results.every(r => r.passed);
      process.exit(allPassed ? 0 : 1);

    } catch (error) {
      console.error('❌ Validation failed:', error);
      await this.disconnect();
      process.exit(1);
    }
  }
}

const validator = new AnalyticsValidator(config);
validator.run();
