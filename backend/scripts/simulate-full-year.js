#!/usr/bin/env node

/**
 * Comprehensive Full Year TPM Simulation Script
 * 
 * Generates realistic 12-month trade promotion management data including:
 * - Products and customers
 * - Promotions with seasonality
 * - Budgets and allocations
 * - Sales transactions with promotional lift
 * - Deductions, claims, and accruals
 * - Settlements and rebates
 * 
 * All generated data is tagged with simTag for easy cleanup.
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const config = require('../simulation-config.json');

// Models
const Tenant = require('../src/models/Tenant');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Customer = require('../src/models/Customer');
const Promotion = require('../src/models/Promotion');
const Budget = require('../src/models/Budget');
const TradeSpend = require('../src/models/TradeSpend');
const SalesHistory = require('../src/models/SalesHistory');

class SeededRandom {
  constructor(seed) {
    this.seed = seed;
  }

  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min, max) {
    return this.next() * (max - min) + min;
  }

  choice(array) {
    return array[Math.floor(this.next() * array.length)];
  }

  shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

// Utility functions
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function getMonthIndex(date) {
  return date.getMonth();
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

class TPMSimulation {
  constructor(config) {
    this.config = config;
    this.rng = new SeededRandom(config.simulation.rngSeed);
    this.simTag = config.simulation.simTag;
    this.tenant = null;
    this.users = [];
    this.products = [];
    this.customers = [];
    this.promotions = [];
    this.budgets = [];
    this.tradeSpends = [];
    this.salesHistory = [];
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
      throw new Error(`Tenant '${tenantSlug}' not found. Please run seeds first.`);
    }
    
    console.log(`✅ Found tenant: ${this.tenant.name} (${this.tenant._id})`);
    return this.tenant;
  }

  async findUsers() {
    this.users = await User.find({ tenantId: this.tenant._id }).limit(5);
    console.log(`✅ Found ${this.users.length} users for tenant`);
    return this.users;
  }

  async generateProducts() {
    console.log('\n📦 Generating products...');
    
    const productNames = {
      Chocolates: ['Premium Dark Chocolate Bar', 'Milk Chocolate Assortment', 'Chocolate Truffles Box', 'Chocolate Wafer Bars', 'Chocolate Coated Biscuits'],
      Biscuits: ['Cream Filled Biscuits', 'Shortbread Cookies', 'Digestive Biscuits', 'Chocolate Chip Cookies', 'Wafer Biscuits', 'Marie Biscuits'],
      Beverages: ['Orange Juice 1L', 'Apple Juice 1L', 'Mixed Fruit Juice 1L', 'Sparkling Water 500ml', 'Energy Drink 250ml', 'Iced Tea 500ml', 'Sports Drink 750ml']
    };

    for (const categoryConfig of this.config.categories) {
      const names = productNames[categoryConfig.name] || [];
      
      for (let i = 0; i < names.length; i++) {
        const listPrice = this.rng.nextFloat(categoryConfig.avgPrice * 0.8, categoryConfig.avgPrice * 1.2);
        const costPrice = categoryConfig.avgPrice * (1 - categoryConfig.margin);
        
        const product = new Product({
          tenantId: this.tenant._id,
          name: names[i],
          sku: `${categoryConfig.name.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(4, '0')}`,
          sapMaterialId: `SAP-${categoryConfig.name.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(6, '0')}`,
          category: categoryConfig.name,
          brand: `${categoryConfig.name} Brand`,
          productType: 'own_brand',
          pricing: {
            listPrice: listPrice,
            currency: 'ZAR',
            costPrice: costPrice,
            marginPercentage: categoryConfig.margin * 100
          },
          description: `Premium ${names[i]} for South African market`,
          status: 'active',
          simTag: this.simTag
        });

        await product.save();
        this.products.push(product);
      }
    }

    console.log(`✅ Created ${this.products.length} products`);
    return this.products;
  }

  async generateCustomers() {
    console.log('\n🏢 Generating customers...');

    const customerNames = {
      'Retail Chain': ['Pick n Pay', 'Shoprite', 'Checkers'],
      'Distributor': ['SA Distribution Co', 'National Wholesale Distributors'],
      'Wholesaler': ['Cash & Carry Wholesale', 'Metro Wholesale', 'Makro']
    };

    for (const customerType of this.config.customerTypes) {
      const names = customerNames[customerType.type] || [];
      
      for (let i = 0; i < Math.min(customerType.count, names.length); i++) {
        const customer = new Customer({
          tenantId: this.tenant._id,
          name: names[i],
          code: `CUST-${customerType.type.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
          type: customerType.type,
          tier: this.rng.choice(['Platinum', 'Gold', 'Silver']),
          region: this.rng.choice(['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape']),
          paymentTerms: customerType.paymentTerms,
          creditLimit: this.rng.nextInt(500000, 2000000),
          isActive: true,
          simTag: this.simTag
        });

        await customer.save();
        this.customers.push(customer);
      }
    }

    console.log(`✅ Created ${this.customers.length} customers`);
    return this.customers;
  }

  async generatePromotions() {
    console.log('\n🎯 Generating promotions...');

    const startDate = new Date(this.config.simulation.dateRange.start);
    const endDate = new Date(this.config.simulation.dateRange.end);
    
    let currentDate = new Date(startDate);
    let promotionCount = 0;

    while (currentDate < endDate) {
      for (const promoType of this.config.promotionTypes) {
        if (this.rng.next() < promoType.frequency) {
          const duration = promoType.duration + this.rng.nextInt(-7, 7);
          const promoStart = new Date(currentDate);
          const promoEnd = addDays(promoStart, duration);

          const selectedProducts = this.rng.shuffle(this.products).slice(0, this.rng.nextInt(2, 5));
          const selectedCustomers = this.rng.shuffle(this.customers).slice(0, this.rng.nextInt(1, 3));

          const promotion = new Promotion({
            tenantId: this.tenant._id,
            name: `${promoType.type} - ${formatDate(promoStart)}`,
            type: promoType.type,
            status: promoEnd < new Date() ? 'Completed' : 'Active',
            startDate: promoStart,
            endDate: promoEnd,
            products: selectedProducts.map(p => p._id),
            customers: selectedCustomers.map(c => c._id),
            discountType: 'percentage',
            discountValue: promoType.avgDiscount * 100 * this.rng.nextFloat(0.8, 1.2),
            budget: this.rng.nextInt(50000, 200000),
            expectedLift: promoType.avgLift,
            description: `${promoType.type} promotion for ${selectedProducts[0].category}`,
            simTag: this.simTag
          });

          await promotion.save();
          this.promotions.push(promotion);
          promotionCount++;
        }
      }

      currentDate = addDays(currentDate, 14);
    }

    console.log(`✅ Created ${promotionCount} promotions`);
    return this.promotions;
  }

  async generateBudgets() {
    console.log('\n💰 Generating budgets...');

    const startDate = new Date(this.config.simulation.dateRange.start);
    const totalBudget = this.config.budgets.totalAnnual;

    for (const [category, percentage] of Object.entries(this.config.budgets.categories)) {
      const categoryBudget = totalBudget * percentage;
      
      for (let month = 0; month < 12; month++) {
        const monthlyAllocation = this.config.budgets.monthlyAllocation[month];
        const monthStart = addMonths(startDate, month);
        const monthEnd = addMonths(monthStart, 1);

        const budget = new Budget({
          tenantId: this.tenant._id,
          name: `${category} - ${monthStart.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
          category: category,
          fiscalYear: 2025,
          period: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
          startDate: monthStart,
          endDate: monthEnd,
          totalBudget: categoryBudget * monthlyAllocation,
          allocatedBudget: categoryBudget * monthlyAllocation * this.rng.nextFloat(0.7, 0.95),
          spentBudget: categoryBudget * monthlyAllocation * this.rng.nextFloat(0.6, 0.9),
          status: monthEnd < new Date() ? 'Closed' : 'Active',
          simTag: this.simTag
        });

        await budget.save();
        this.budgets.push(budget);
      }
    }

    console.log(`✅ Created ${this.budgets.length} budgets`);
    return this.budgets;
  }

  async generateSalesTransactions() {
    console.log('\n💵 Generating sales transactions...');

    const startDate = new Date(this.config.simulation.dateRange.start);
    const endDate = new Date(this.config.simulation.dateRange.end);
    
    let currentDate = new Date(startDate);
    let transactionCount = 0;
    const batchSize = 100;
    let batch = [];

    while (currentDate < endDate) {
      const monthIndex = getMonthIndex(currentDate);
      const seasonalityFactor = this.config.seasonality.factors[monthIndex];
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      const weekendMultiplier = isWeekend ? this.config.salesPatterns.weekendMultiplier : 1.0;

      for (const customer of this.customers) {
        const customerType = this.config.customerTypes.find(ct => ct.type === customer.type);
        if (!customerType) continue;

        const numProducts = this.rng.nextInt(1, 3);
        const selectedProducts = this.rng.shuffle(this.products).slice(0, numProducts);

        for (const product of selectedProducts) {
          const categoryConfig = this.config.categories.find(c => c.name === product.category);
          if (!categoryConfig) continue;

          let baseVolume = categoryConfig.baseVolume / 365; // Daily base
          baseVolume *= customerType.volumeShare;
          baseVolume *= seasonalityFactor;
          baseVolume *= categoryConfig.seasonalityMultiplier;
          baseVolume *= weekendMultiplier;
          baseVolume *= this.rng.nextFloat(1 - this.config.salesPatterns.dailyVariation, 1 + this.config.salesPatterns.dailyVariation);

          // Check if there's an active promotion
          let promotionalLift = 1.0;
          let activePromotion = null;
          
          for (const promo of this.promotions) {
            if (currentDate >= promo.startDate && currentDate <= promo.endDate &&
                promo.products.some(p => p.toString() === product._id.toString()) &&
                promo.customers.some(c => c.toString() === customer._id.toString())) {
              promotionalLift = promo.expectedLift;
              activePromotion = promo;
              break;
            }
          }

          const volume = Math.round(baseVolume * promotionalLift);
          if (volume === 0) continue;

          const unitPrice = activePromotion 
            ? product.pricing.listPrice * (1 - activePromotion.discountValue / 100)
            : product.pricing.listPrice;

          const revenue = volume * unitPrice;
          const cost = volume * product.pricing.costPrice;

          const sale = {
            tenantId: this.tenant._id,
            date: new Date(currentDate),
            customer: customer._id,
            product: product._id,
            promotion: activePromotion ? activePromotion._id : null,
            quantity: volume,
            unitPrice: unitPrice,
            totalRevenue: revenue,
            totalCost: cost,
            grossProfit: revenue - cost,
            channel: customer.type,
            region: customer.region,
            simTag: this.simTag
          };

          batch.push(sale);
          transactionCount++;

          if (batch.length >= batchSize) {
            await SalesHistory.insertMany(batch);
            batch = [];
            process.stdout.write(`\r  Generated ${transactionCount} transactions...`);
          }
        }
      }

      currentDate = addDays(currentDate, 1);
    }

    if (batch.length > 0) {
      await SalesHistory.insertMany(batch);
    }

    console.log(`\n✅ Created ${transactionCount} sales transactions`);
    return transactionCount;
  }

  async generateTradeSpends() {
    console.log('\n💸 Generating trade spend records...');

    for (const promotion of this.promotions) {
      const promoSales = await SalesHistory.find({
        tenantId: this.tenant._id,
        promotion: promotion._id,
        date: { $gte: promotion.startDate, $lte: promotion.endDate }
      });

      const totalRevenue = promoSales.reduce((sum, sale) => sum + sale.totalRevenue, 0);
      const totalVolume = promoSales.reduce((sum, sale) => sum + sale.quantity, 0);
      
      const actualSpend = totalRevenue * (promotion.discountValue / 100);

      const tradeSpend = new TradeSpend({
        tenantId: this.tenant._id,
        promotion: promotion._id,
        customer: promotion.customers[0],
        type: promotion.type,
        amount: actualSpend,
        plannedAmount: promotion.budget,
        actualAmount: actualSpend,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        status: promotion.status === 'Completed' ? 'Settled' : 'Accrued',
        accrualAmount: actualSpend * 0.9,
        settledAmount: promotion.status === 'Completed' ? actualSpend : 0,
        description: `Trade spend for ${promotion.name}`,
        simTag: this.simTag
      });

      await tradeSpend.save();
      this.tradeSpends.push(tradeSpend);
    }

    console.log(`✅ Created ${this.tradeSpends.length} trade spend records`);
    return this.tradeSpends;
  }

  async generateSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SIMULATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Simulation Tag: ${this.simTag}`);
    console.log(`Tenant: ${this.tenant.name}`);
    console.log(`Date Range: ${this.config.simulation.dateRange.start} to ${this.config.simulation.dateRange.end}`);
    console.log('');
    console.log(`Products: ${this.products.length}`);
    console.log(`Customers: ${this.customers.length}`);
    console.log(`Promotions: ${this.promotions.length}`);
    console.log(`Budgets: ${this.budgets.length}`);
    console.log(`Trade Spends: ${this.tradeSpends.length}`);
    
    const salesCount = await SalesHistory.countDocuments({ simTag: this.simTag });
    const totalRevenue = await SalesHistory.aggregate([
      { $match: { simTag: this.simTag } },
      { $group: { _id: null, total: { $sum: '$totalRevenue' } } }
    ]);
    
    console.log(`Sales Transactions: ${salesCount}`);
    console.log(`Total Revenue: R ${(totalRevenue[0]?.total || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
    console.log('');
    console.log('✅ Simulation complete!');
    console.log('='.repeat(60));
  }

  async run() {
    try {
      console.log('🚀 Starting TPM Full Year Simulation');
      console.log('='.repeat(60));

      await this.connect();
      await this.findTenant();
      await this.findUsers();
      
      await this.generateProducts();
      await this.generateCustomers();
      await this.generatePromotions();
      await this.generateBudgets();
      await this.generateSalesTransactions();
      await this.generateTradeSpends();
      
      await this.generateSummary();
      
      await this.disconnect();
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Simulation failed:', error);
      await this.disconnect();
      process.exit(1);
    }
  }
}

// Run simulation
const simulation = new TPMSimulation(config);
simulation.run();
