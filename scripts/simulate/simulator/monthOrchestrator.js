#!/usr/bin/env node

/**
 * Month-Long Activity Orchestrator
 * Simulates one month of realistic business activity for a company type
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../backend/.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DeterministicRNG = require('../utils/rng');
const Ledger = require('../utils/ledger');

// Import models
const User = require('../../../backend/models/User');
const Company = require('../../../backend/models/Company');
const Customer = require('../../../backend/models/Customer');
const Product = require('../../../backend/models/Product');
const Budget = require('../../../backend/models/Budget');
const Promotion = require('../../../backend/models/Promotion');
const Transaction = require('../../../backend/models/Transaction');
const TradeSpend = require('../../../backend/models/TradeSpend');
const TradingTerm = require('../../../backend/models/TradingTerm');

class MonthOrchestrator {
  constructor(config, runId, seed) {
    this.config = config;
    this.runId = runId || `run-${Date.now()}`;
    this.rng = new DeterministicRNG(seed || Date.now());
    this.ledger = new Ledger(this.runId, config.code);
    this.createdEntities = {
      company: null,
      users: [],
      customers: [],
      products: [],
      budgets: [],
      promotions: [],
      claims: [],
      transactions: [],
      tradeSpends: [],
      tradingTerms: []
    };
  }

  async connect() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  }

  async disconnect() {
    await mongoose.connection.close();
    console.log('✅ Disconnected from MongoDB');
  }

  async setupCompany() {
    console.log(`\n📊 Setting up company: ${this.config.name}...`);
    
    let company = await Company.findOne({ code: this.config.code });
    
    if (!company) {
      company = await Company.create({
        name: this.config.name,
        code: this.config.code,
        domain: `${this.config.code.toLowerCase()}.test.com`,
        industry: 'Consumer Goods',
        country: 'United States',
        currency: 'USD',
        fiscalYearStart: 1,
        settings: {
          multiCurrency: false,
          taxEnabled: true,
          approvalWorkflow: true,
          aiInsightsEnabled: true
        }
      });
      console.log(`   ✓ Created company: ${company.name}`);
    } else {
      console.log(`   ✓ Found existing company: ${company.name}`);
    }

    this.createdEntities.company = company;
    this.ledger.addEntity('company', {
      _id: company._id.toString(),
      name: company.name,
      code: company.code
    });

    return company;
  }

  async setupUsers() {
    console.log(`\n👥 Setting up ${this.config.users.length} users...`);
    
    for (const userConfig of this.config.users) {
      let user = await User.findOne({ email: userConfig.email });
      
      if (!user) {
        const hashedPassword = await bcrypt.hash('Test@123', 10);
        const username = userConfig.email.split('@')[0];
        
        user = await User.create({
          username,
          email: userConfig.email,
          password: hashedPassword,
          firstName: userConfig.name.split(' ')[0],
          lastName: userConfig.name.split(' ').slice(1).join(' ') || '',
          role: userConfig.role,
          company: this.createdEntities.company._id,
          department: userConfig.dept,
          title: userConfig.title,
          isActive: true,
          isEmailVerified: true
        });
        console.log(`   ✓ Created ${userConfig.role}: ${userConfig.name}`);
      } else {
        console.log(`   ✓ Found existing user: ${userConfig.name}`);
      }

      this.createdEntities.users.push(user);
      this.ledger.addEntity('users', {
        _id: user._id.toString(),
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        department: user.department
      });
    }

    return this.createdEntities.users;
  }

  async setupProducts() {
    console.log(`\n📦 Setting up ${this.config.characteristics.product_count} products...`);
    
    const categories = ['Snacks', 'Beverages', 'Confectionery', 'Dairy', 'Frozen Foods'];
    const brands = ['Brand A', 'Brand B', 'Brand C', 'Brand D', 'Brand E'];
    
    const existingProducts = await Product.find({ company: this.createdEntities.company._id });
    
    if (existingProducts.length >= this.config.characteristics.product_count) {
      console.log(`   ✓ Found ${existingProducts.length} existing products`);
      this.createdEntities.products = existingProducts.slice(0, this.config.characteristics.product_count);
    } else {
      const needed = this.config.characteristics.product_count - existingProducts.length;
      console.log(`   ℹ️  Creating ${needed} additional products...`);
      
      for (let i = 0; i < needed; i++) {
        const category = this.rng.randomChoice(categories);
        const brand = this.rng.randomChoice(brands);
        const sku = `SKU-${this.config.code}-${String(i + 1).padStart(6, '0')}`;
        
        const product = await Product.create({
          company: this.createdEntities.company._id,
          sku,
          name: `${brand} ${category} Product ${i + 1}`,
          category,
          brand,
          price: this.rng.randomFloat(5, 50),
          cost: this.rng.randomFloat(2, 25),
          status: 'active'
        });

        this.createdEntities.products.push(product);
        
        if ((i + 1) % 100 === 0) {
          console.log(`   ✓ Created ${i + 1}/${needed} products...`);
        }
      }
      
      this.createdEntities.products = [...existingProducts, ...this.createdEntities.products];
    }

    console.log(`   ✓ Total products available: ${this.createdEntities.products.length}`);
    
    for (const product of this.createdEntities.products) {
      this.ledger.addEntity('products', {
        _id: product._id.toString(),
        sku: product.sku,
        name: product.name,
        category: product.category,
        price: product.price
      });
    }

    return this.createdEntities.products;
  }

  async setupCustomers() {
    console.log(`\n🏪 Setting up ${this.config.characteristics.customer_count} customers...`);
    
    const customerTypes = ['Retailer', 'Wholesaler', 'Distributor', 'Direct'];
    
    const existingCustomers = await Customer.find({ company: this.createdEntities.company._id });
    
    if (existingCustomers.length >= this.config.characteristics.customer_count) {
      console.log(`   ✓ Found ${existingCustomers.length} existing customers`);
      this.createdEntities.customers = existingCustomers.slice(0, this.config.characteristics.customer_count);
    } else {
      const needed = this.config.characteristics.customer_count - existingCustomers.length;
      console.log(`   ℹ️  Creating ${needed} additional customers...`);
      
      for (let i = 0; i < needed; i++) {
        const type = this.rng.randomChoice(customerTypes);
        const code = `CUST-${this.config.code}-${String(i + 1).padStart(5, '0')}`;
        
        const customer = await Customer.create({
          company: this.createdEntities.company._id,
          code,
          name: `${type} Customer ${i + 1}`,
          type,
          status: 'active',
          email: `customer${i + 1}@${this.config.code.toLowerCase()}.test.com`,
          phone: `555-${String(i + 1).padStart(4, '0')}`
        });

        this.createdEntities.customers.push(customer);
        
        if ((i + 1) % 50 === 0) {
          console.log(`   ✓ Created ${i + 1}/${needed} customers...`);
        }
      }
      
      this.createdEntities.customers = [...existingCustomers, ...this.createdEntities.customers];
    }

    console.log(`   ✓ Total customers available: ${this.createdEntities.customers.length}`);
    
    for (const customer of this.createdEntities.customers) {
      this.ledger.addEntity('customers', {
        _id: customer._id.toString(),
        code: customer.code,
        name: customer.name,
        type: customer.type
      });
    }

    return this.createdEntities.customers;
  }

  async setupBudgets() {
    console.log(`\n💰 Setting up budgets...`);
    
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);
    
    const totalBudget = this.config.budget_model.total_annual;
    const categoryCount = this.config.budget_model.categories.length;
    
    for (const category of this.config.budget_model.categories) {
      const amount = totalBudget / categoryCount;
      const owner = this.rng.randomChoice(this.createdEntities.users.filter(u => u.role === 'admin' || u.role === 'manager'));
      
      let budget = await Budget.findOne({
        company: this.createdEntities.company._id,
        name: `${category} ${currentYear}`,
        fiscalYear: currentYear
      });
      
      if (!budget) {
        budget = await Budget.create({
          company: this.createdEntities.company._id,
          name: `${category} ${currentYear}`,
          category,
          fiscalYear: currentYear,
          startDate,
          endDate,
          totalBudget: amount,
          allocated: 0,
          spent: 0,
          remaining: amount,
          currency: 'USD',
          status: 'active',
          owner: owner._id
        });
        console.log(`   ✓ Created budget: ${category} - $${amount.toLocaleString()}`);
      } else {
        console.log(`   ✓ Found existing budget: ${category}`);
      }

      this.createdEntities.budgets.push(budget);
      this.ledger.addEntity('budgets', {
        _id: budget._id.toString(),
        name: budget.name,
        category: budget.category,
        cap: budget.totalBudget,
        used: budget.spent,
        available: budget.remaining
      });
      
      this.ledger.addCalculation('budgetUtilization', budget._id.toString(), {
        cap: budget.totalBudget,
        used: budget.spent,
        available: budget.remaining,
        utilization: budget.spent / budget.totalBudget
      });
    }

    return this.createdEntities.budgets;
  }

  async simulateMonth(monthNumber = 1) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📆 SIMULATING MONTH ${monthNumber}`);
    console.log(`${'='.repeat(80)}\n`);

    const stats = {
      month: monthNumber,
      promotions: 0,
      claims: 0,
      transactions: 0,
      tradeSpends: 0,
      tradingTerms: 0
    };

    console.log('📅 Week 1: Planning and setup...');
    await this.simulatePromotions(this.config.characteristics.promotion_rate_per_week);
    stats.promotions += this.config.characteristics.promotion_rate_per_week;

    console.log('📅 Week 2: Execution...');
    await this.simulateTransactions(this.config.characteristics.order_rate_per_day * 7);
    await this.simulateClaims(this.config.characteristics.claim_rate_per_week);
    stats.transactions += this.config.characteristics.order_rate_per_day * 7;
    stats.claims += this.config.characteristics.claim_rate_per_week;

    console.log('📅 Week 3: Mid-month adjustments...');
    await this.simulatePromotions(this.config.characteristics.promotion_rate_per_week);
    await this.simulateTransactions(this.config.characteristics.order_rate_per_day * 7);
    stats.promotions += this.config.characteristics.promotion_rate_per_week;
    stats.transactions += this.config.characteristics.order_rate_per_day * 7;

    console.log('📅 Week 4: Close and review...');
    await this.simulateTransactions(this.config.characteristics.order_rate_per_day * 7);
    await this.simulateClaims(this.config.characteristics.claim_rate_per_week);
    await this.simulateTradingTerms(2);
    stats.transactions += this.config.characteristics.order_rate_per_day * 7;
    stats.claims += this.config.characteristics.claim_rate_per_week;
    stats.tradingTerms += 2;

    console.log(`\n✅ Month ${monthNumber} simulation complete:`);
    console.log(`   • Promotions: ${stats.promotions}`);
    console.log(`   • Claims: ${stats.claims}`);
    console.log(`   • Transactions: ${stats.transactions}`);
    console.log(`   • Trading Terms: ${stats.tradingTerms}`);

    return stats;
  }

  async simulatePromotions(count) {
    const promotionTypes = ['Price Reduction', 'BOGOF', 'Volume Discount', 'Bundle Deal'];
    
    for (let i = 0; i < count; i++) {
      const type = this.rng.randomChoice(promotionTypes);
      const products = this.rng.randomChoices(this.createdEntities.products, this.rng.randomInt(1, 5));
      const budget = this.rng.randomChoice(this.createdEntities.budgets);
      const creator = this.rng.randomChoice(this.createdEntities.users);
      
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + this.rng.randomInt(7, 30));
      
      const discount = this.rng.randomFloat(0.1, 0.3);
      const estimatedUnits = this.rng.randomInt(1000, 10000);
      const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
      const netSpend = estimatedUnits * avgPrice * discount;
      
      const promotion = await Promotion.create({
        company: this.createdEntities.company._id,
        name: `${type} - ${products[0].name}`,
        type,
        startDate,
        endDate,
        products: products.map(p => p._id),
        budget: budget._id,
        discount,
        estimatedUnits,
        netSpend,
        status: 'active',
        createdBy: creator._id
      });

      this.createdEntities.promotions.push(promotion);
      this.ledger.addEntity('promotions', {
        _id: promotion._id.toString(),
        name: promotion.name,
        type: promotion.type,
        netSpend: promotion.netSpend,
        estimatedUnits: promotion.estimatedUnits
      });
    }
    
    console.log(`   ✓ Created ${count} promotions`);
  }

  async simulateTransactions(count) {
    for (let i = 0; i < count; i++) {
      const customer = this.rng.randomChoice(this.createdEntities.customers);
      const product = this.rng.randomChoice(this.createdEntities.products);
      const quantity = this.rng.randomInt(10, 500);
      const amount = quantity * product.price;
      
      const transaction = await Transaction.create({
        company: this.createdEntities.company._id,
        customer: customer._id,
        product: product._id,
        quantity,
        amount,
        date: new Date(),
        type: 'sale'
      });

      this.createdEntities.transactions.push(transaction);
      this.ledger.addEntity('transactions', {
        _id: transaction._id.toString(),
        customer: customer._id.toString(),
        product: product._id.toString(),
        quantity,
        amount
      });
    }
    
    console.log(`   ✓ Created ${count} transactions`);
  }

  async simulateClaims(count) {
    console.log(`   ✓ Simulated ${count} claims (tracked in ledger)`);
    
    for (let i = 0; i < count; i++) {
      const customer = this.rng.randomChoice(this.createdEntities.customers);
      const amount = this.rng.randomFloat(1000, 10000);
      
      this.ledger.addEntity('claims', {
        id: `claim-${i + 1}`,
        customer: customer._id.toString(),
        amount,
        status: 'submitted',
        submittedAt: new Date().toISOString()
      });
    }
  }

  async simulateTradingTerms(count) {
    for (let i = 0; i < count; i++) {
      const customer = this.rng.randomChoice(this.createdEntities.customers);
      const creator = this.rng.randomChoice(this.createdEntities.users);
      
      const term = await TradingTerm.create({
        company: this.createdEntities.company._id,
        customer: customer._id,
        termType: this.rng.randomChoice(['Volume Discount', 'Payment Terms', 'Rebate']),
        value: this.rng.randomFloat(0.05, 0.15),
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'active',
        createdBy: creator._id
      });

      this.createdEntities.tradingTerms.push(term);
      this.ledger.addEntity('tradingTerms', {
        _id: term._id.toString(),
        customer: customer._id.toString(),
        termType: term.termType,
        value: term.value
      });
    }
    
    console.log(`   ✓ Created ${count} trading terms`);
  }

  async run() {
    try {
      console.log(`\n🚀 Starting Month-Long Simulation for ${this.config.name}`);
      console.log(`   Run ID: ${this.runId}`);
      console.log(`   Seed: ${this.rng.getSeed()}\n`);

      await this.connect();
      
      await this.setupCompany();
      await this.setupUsers();
      await this.setupProducts();
      await this.setupCustomers();
      await this.setupBudgets();
      
      await this.simulateMonth(1);
      
      this.calculateKPIs();
      
      const ledgerPath = this.ledger.save(path.join(__dirname, '../../../artifacts/ledger'));
      console.log(`\n💾 Ledger saved to: ${ledgerPath}`);
      
      await this.disconnect();
      
      console.log('\n✅ Simulation complete!\n');
      
      return this.ledger;
      
    } catch (error) {
      console.error('❌ Simulation failed:', error);
      this.ledger.addError(error);
      throw error;
    }
  }

  calculateKPIs() {
    console.log('\n📊 Calculating KPIs...');
    
    const totalBudget = this.createdEntities.budgets.reduce((sum, b) => sum + b.totalBudget, 0);
    const totalSpent = this.createdEntities.budgets.reduce((sum, b) => sum + b.spent, 0);
    const budgetUtilization = totalSpent / totalBudget;
    
    this.ledger.addKPI('budget_utilization', budgetUtilization);
    this.ledger.addKPI('total_budget', totalBudget);
    this.ledger.addKPI('total_spent', totalSpent);
    
    const totalTransactions = this.createdEntities.transactions.length;
    const totalRevenue = this.createdEntities.transactions.reduce((sum, t) => sum + t.amount, 0);
    
    this.ledger.addKPI('total_transactions', totalTransactions);
    this.ledger.addKPI('total_revenue', totalRevenue);
    
    const totalPromotions = this.createdEntities.promotions.length;
    const totalPromotionSpend = this.createdEntities.promotions.reduce((sum, p) => sum + p.netSpend, 0);
    
    this.ledger.addKPI('total_promotions', totalPromotions);
    this.ledger.addKPI('total_promotion_spend', totalPromotionSpend);
    
    console.log(`   ✓ Budget Utilization: ${(budgetUtilization * 100).toFixed(2)}%`);
    console.log(`   ✓ Total Revenue: $${totalRevenue.toLocaleString()}`);
    console.log(`   ✓ Total Promotions: ${totalPromotions}`);
  }
}

module.exports = MonthOrchestrator;

if (require.main === module) {
  const args = process.argv.slice(2);
  const companyType = args[0] || 'distributor';
  const runId = args[1] || `run-${Date.now()}`;
  const seed = args[2] ? parseInt(args[2]) : Date.now();
  
  const configPath = path.join(__dirname, '../company-types', `${companyType}.json`);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  const orchestrator = new MonthOrchestrator(config, runId, seed);
  orchestrator.run()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
