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
        const paymentTermsMap = {
          30: 'NET30',
          45: 'NET45',
          60: 'NET60',
          90: 'NET90'
        };
        
        const customerTypeMap = {
          'Retail Chain': 'chain',
          'Distributor': 'distributor',
          'Wholesaler': 'wholesaler'
        };
        
        const customer = new Customer({
          tenantId: this.tenant._id,
          name: names[i],
          code: `CUST-${customerType.type.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
          sapCustomerId: `SAP-CUST-${customerType.type.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(6, '0')}`,
          customerType: customerTypeMap[customerType.type] || 'retailer',
          tier: this.rng.choice(['platinum', 'gold', 'silver', 'bronze']),
          paymentTerms: paymentTermsMap[customerType.paymentTerms] || 'NET30',
          creditLimit: this.rng.nextInt(500000, 2000000),
          currency: 'ZAR',
          status: 'active',
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

          const promoTypeMap = {
            'Volume Discount': 'volume_discount',
            'Trade Allowance': 'price_discount',
            'Co-op Marketing': 'feature',
            'Display Fee': 'display',
            'BOGO': 'bogo'
          };

          const promotion = new Promotion({
            tenantId: this.tenant._id,
            promotionId: `PROMO-${Date.now()}-${promotionCount}`,
            name: `${promoType.type} - ${formatDate(promoStart)}`,
            promotionType: promoTypeMap[promoType.type] || 'price_discount',
            period: {
              startDate: promoStart,
              endDate: promoEnd
            },
            products: selectedProducts.map(p => ({ product: p._id })),
            scope: {
              customers: selectedCustomers.map(c => ({ customer: c._id }))
            },
            mechanics: {
              discountType: 'percentage',
              discountValue: promoType.avgDiscount * 100 * this.rng.nextFloat(0.8, 1.2)
            },
            financial: {
              planned: {
                volumeLift: promoType.avgLift
              },
              costs: {
                totalCost: this.rng.nextInt(50000, 200000)
              }
            },
            status: promoEnd < new Date() ? 'completed' : 'active',
            createdBy: this.users[0]._id,
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

        const totalBudget = categoryBudget * monthlyAllocation;
        const allocated = totalBudget * this.rng.nextFloat(0.7, 0.95);
        const spent = totalBudget * this.rng.nextFloat(0.6, 0.9);
        
        const budget = new Budget({
          tenantId: this.tenant._id,
          company: this.tenant._id,
          name: `${category} - ${monthStart.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
          code: `BUD-${category.substring(0, 3).toUpperCase()}-${2025}-${String(month + 1).padStart(2, '0')}-${Date.now()}`,
          year: 2025,
          budgetType: 'budget',
          budgetCategory: category === 'Marketing' ? 'marketing' : 'trade_marketing',
          scope: {
            level: 'company'
          },
          allocated: allocated,
          spent: spent,
          remaining: allocated - spent,
          status: monthEnd < new Date() ? 'locked' : 'draft',
          createdBy: this.users[0]._id,
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
        const customerTypeMap = {
          'chain': 'Retail Chain',
          'distributor': 'Distributor',
          'wholesaler': 'Wholesaler'
        };
        const configType = customerTypeMap[customer.customerType] || 'Retail Chain';
        const customerType = this.config.customerTypes.find(ct => ct.type === configType);
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
            if (currentDate >= promo.period.startDate && currentDate <= promo.period.endDate &&
                promo.products.some(p => p.product && p.product.toString() === product._id.toString()) &&
                promo.scope.customers.some(c => c.customer && c.customer.toString() === customer._id.toString())) {
              promotionalLift = promo.financial.planned.volumeLift || 1.2;
              activePromotion = promo;
              break;
            }
          }

          const volume = Math.round(baseVolume * promotionalLift);
          if (volume === 0) continue;

          const unitPrice = activePromotion 
            ? product.pricing.listPrice * (1 - (activePromotion.mechanics.discountValue || 0) / 100)
            : product.pricing.listPrice;

          const revenue = volume * unitPrice;
          const cost = volume * product.pricing.costPrice;

          const saleDate = new Date(currentDate);
          const year = saleDate.getFullYear();
          const month = saleDate.getMonth() + 1;
          const dayOfWeek = saleDate.getDay();
          const quarter = Math.ceil(month / 3);
          const startOfYear = new Date(year, 0, 1);
          const days = Math.floor((saleDate - startOfYear) / (24 * 60 * 60 * 1000));
          const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);

          const sale = {
            tenantId: this.tenant._id,
            company: this.tenant._id,
            transactionId: `TXN-${Date.now()}-${transactionCount}`,
            date: saleDate,
            year: year,
            month: month,
            week: week,
            dayOfWeek: dayOfWeek,
            quarter: quarter,
            customer: customer._id,
            product: product._id,
            quantity: volume,
            revenue: {
              gross: revenue,
              net: revenue,
              currency: 'ZAR'
            },
            pricing: {
              listPrice: product.pricing.listPrice,
              invoicePrice: unitPrice,
              netPrice: unitPrice
            },
            costs: {
              productCost: cost,
              totalCost: cost
            },
            promotions: activePromotion ? [{
              promotion: activePromotion._id,
              discountApplied: product.pricing.listPrice - unitPrice,
              liftFactor: promotionalLift
            }] : [],
            channel: customer.customerType || 'retailer',
            importBatch: this.simTag,
            source: 'manual'
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
        company: this.tenant._id,
        importBatch: this.simTag,
        'promotions.promotion': promotion._id,
        date: { $gte: promotion.period.startDate, $lte: promotion.period.endDate }
      });

      const totalRevenue = promoSales.reduce((sum, sale) => sum + (sale.revenue?.gross || 0), 0);
      const totalVolume = promoSales.reduce((sum, sale) => sum + sale.quantity, 0);
      
      const actualSpend = totalRevenue * ((promotion.mechanics.discountValue || 0) / 100);

      const tradeSpend = new TradeSpend({
        tenantId: this.tenant._id,
        company: this.tenant._id,
        spendId: `SPEND-${Date.now()}-${promotion._id}`,
        spendType: 'promotion',
        activityType: 'trade_marketing',
        category: 'Promotional Discount',
        amount: {
          requested: promotion.financial.costs.totalCost || actualSpend,
          approved: actualSpend > 0 ? actualSpend : promotion.financial.costs.totalCost || 10000,
          spent: promotion.status === 'completed' ? actualSpend : 0,
          currency: 'ZAR'
        },
        period: {
          startDate: promotion.period.startDate,
          endDate: promotion.period.endDate
        },
        customer: promotion.scope.customers[0]?.customer,
        promotion: promotion._id,
        status: promotion.status === 'completed' ? 'completed' : 'active',
        notes: `Trade spend for ${promotion.name} (${totalVolume} units, R${totalRevenue.toFixed(2)} revenue)`,
        createdBy: this.users[0]._id,
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
    
    const salesCount = await SalesHistory.countDocuments({ importBatch: this.simTag });
    const totalRevenue = await SalesHistory.aggregate([
      { $match: { importBatch: this.simTag } },
      { $group: { _id: null, total: { $sum: '$revenue.gross' } } }
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
