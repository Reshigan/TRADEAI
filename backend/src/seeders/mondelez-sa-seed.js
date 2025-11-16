/**
 * Mondelez South Africa - Comprehensive Seed Data
 *
 * This seed script creates a realistic dataset for Mondelez International (SA)
 * including products, customers, users, promotions, campaigns, and historical data.
 *
 * Usage:
 *   node backend/src/seeders/mondelez-sa-seed.js
 *
 * Or from within the app:
 *   npm run seed:mondelez
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Models
const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const Promotion = require('../models/Promotion');
const Campaign = require('../models/Campaign');
const Budget = require('../models/Budget');
const SalesHistory = require('../models/SalesHistory');
const TradeSpend = require('../models/TradeSpend');
const ActivityGrid = require('../models/ActivityGrid');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tradeai', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Tenant and Company IDs
const MONDELEZ_TENANT_ID = new mongoose.Types.ObjectId();
const MONDELEZ_COMPANY_ID = new mongoose.Types.ObjectId();

// ============================================================================
// USERS - Mondelez SA Team
// ============================================================================

const createUsers = async () => {
  console.log('\n📝 Creating Mondelez SA Users...');

  const hashedPassword = await bcrypt.hash('Mondelez@2024', 10);

  const users = [
    {
      firstName: 'Thabo',
      lastName: 'Mokoena',
      email: 'thabo.mokoena@mondelez.com',
      password: hashedPassword,
      role: 'admin',
      department: 'IT',
      position: 'System Administrator',
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID,
      phone: '+27 11 234 5678',
      isActive: true,
      permissions: ['all']
    },
    {
      firstName: 'Sarah',
      lastName: 'van der Merwe',
      email: 'sarah.vandermerwe@mondelez.com',
      password: hashedPassword,
      role: 'director',
      department: 'Sales',
      position: 'Sales Director',
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID,
      phone: '+27 11 234 5679',
      isActive: true
    },
    {
      firstName: 'Sipho',
      lastName: 'Dlamini',
      email: 'sipho.dlamini@mondelez.com',
      password: hashedPassword,
      role: 'kam',
      department: 'Sales',
      position: 'Key Account Manager - Pick n Pay',
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID,
      phone: '+27 11 234 5680',
      isActive: true
    },
    {
      firstName: 'Nomvula',
      lastName: 'Zulu',
      email: 'nomvula.zulu@mondelez.com',
      password: hashedPassword,
      role: 'kam',
      department: 'Sales',
      position: 'Key Account Manager - Shoprite',
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID,
      phone: '+27 11 234 5681',
      isActive: true
    },
    {
      firstName: 'Michael',
      lastName: 'Johnson',
      email: 'michael.johnson@mondelez.com',
      password: hashedPassword,
      role: 'manager',
      department: 'Trade Marketing',
      position: 'Trade Marketing Manager',
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID,
      phone: '+27 11 234 5682',
      isActive: true
    },
    {
      firstName: 'Lerato',
      lastName: 'Nkosi',
      email: 'lerato.nkosi@mondelez.com',
      password: hashedPassword,
      role: 'analyst',
      department: 'Analytics',
      position: 'Business Analyst',
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID,
      phone: '+27 11 234 5683',
      isActive: true
    }
  ];

  const createdUsers = await User.insertMany(users);
  console.log(`✅ Created ${createdUsers.length} users`);
  return createdUsers;
};

// ============================================================================
// PRODUCTS - Mondelez Portfolio
// ============================================================================

const createProducts = async () => {
  console.log('\n📦 Creating Mondelez Products...');

  const products = [
    // Cadbury Chocolate
    {
      name: 'Cadbury Dairy Milk 150g',
      sku: 'CDM-150',
      barcode: '6001087340311',
      category: {
        primary: 'Chocolate',
        secondary: 'Tablets',
        tertiary: 'Standard'
      },
      brand: 'Cadbury',
      description: 'Classic milk chocolate bar',
      unitOfMeasure: 'Unit',
      packaging: {
        type: 'Bar',
        unitsPerCase: 24,
        casesPerPallet: 80
      },
      pricing: {
        costPrice: 15.50,
        recommendedRetailPrice: 24.99,
        currentPrice: 24.99,
        currency: 'ZAR'
      },
      inventory: {
        currentStock: 5000,
        reorderPoint: 1000,
        leadTime: 7
      },
      dimensions: {
        weight: 150,
        weightUnit: 'g'
      },
      status: 'active',
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID
    },
    {
      name: 'Cadbury Dairy Milk 80g',
      sku: 'CDM-80',
      barcode: '6001087340304',
      category: {
        primary: 'Chocolate',
        secondary: 'Tablets',
        tertiary: 'Standard'
      },
      brand: 'Cadbury',
      description: 'Classic milk chocolate bar - Small',
      unitOfMeasure: 'Unit',
      packaging: {
        type: 'Bar',
        unitsPerCase: 48,
        casesPerPallet: 100
      },
      pricing: {
        costPrice: 8.50,
        recommendedRetailPrice: 14.99,
        currentPrice: 14.99,
        currency: 'ZAR'
      },
      inventory: {
        currentStock: 8000,
        reorderPoint: 1500,
        leadTime: 7
      },
      dimensions: {
        weight: 80,
        weightUnit: 'g'
      },
      status: 'active',
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID
    },
    // Oreo
    {
      name: 'Oreo Original 133g',
      sku: 'OREO-133',
      barcode: '6001087341011',
      category: {
        primary: 'Biscuits',
        secondary: 'Sandwich',
        tertiary: 'Cream'
      },
      brand: 'Oreo',
      description: 'Original cream sandwich cookies',
      unitOfMeasure: 'Unit',
      packaging: {
        type: 'Pack',
        unitsPerCase: 36,
        casesPerPallet: 90
      },
      pricing: {
        costPrice: 12.00,
        recommendedRetailPrice: 19.99,
        currentPrice: 19.99,
        currency: 'ZAR'
      },
      inventory: {
        currentStock: 6000,
        reorderPoint: 1200,
        leadTime: 10
      },
      dimensions: {
        weight: 133,
        weightUnit: 'g'
      },
      status: 'active',
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID
    },
    // Lunch Bar
    {
      name: 'Cadbury Lunch Bar 48g',
      sku: 'LB-48',
      barcode: '6001087342018',
      category: {
        primary: 'Chocolate',
        secondary: 'Countlines',
        tertiary: 'Wafer'
      },
      brand: 'Cadbury',
      description: 'Chocolate covered wafer bar',
      unitOfMeasure: 'Unit',
      packaging: {
        type: 'Bar',
        unitsPerCase: 60,
        casesPerPallet: 120
      },
      pricing: {
        costPrice: 5.50,
        recommendedRetailPrice: 9.99,
        currentPrice: 9.99,
        currency: 'ZAR'
      },
      inventory: {
        currentStock: 10000,
        reorderPoint: 2000,
        leadTime: 7
      },
      dimensions: {
        weight: 48,
        weightUnit: 'g'
      },
      status: 'active',
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID
    },
    // Cadbury PS
    {
      name: 'Cadbury PS 52g',
      sku: 'PS-52',
      barcode: '6001087342025',
      category: {
        primary: 'Chocolate',
        secondary: 'Countlines',
        tertiary: 'Caramel'
      },
      brand: 'Cadbury',
      description: 'Peanut and caramel chocolate bar',
      unitOfMeasure: 'Unit',
      packaging: {
        type: 'Bar',
        unitsPerCase: 48,
        casesPerPallet: 100
      },
      pricing: {
        costPrice: 6.00,
        recommendedRetailPrice: 10.99,
        currentPrice: 10.99,
        currency: 'ZAR'
      },
      inventory: {
        currentStock: 7500,
        reorderPoint: 1500,
        leadTime: 7
      },
      dimensions: {
        weight: 52,
        weightUnit: 'g'
      },
      status: 'active',
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID
    },
    // Bakers
    {
      name: 'Bakers Romany Creams 200g',
      sku: 'BRC-200',
      barcode: '6001087343015',
      category: {
        primary: 'Biscuits',
        secondary: 'Sandwich',
        tertiary: 'Cream'
      },
      brand: 'Bakers',
      description: 'Chocolate cream biscuits',
      unitOfMeasure: 'Unit',
      packaging: {
        type: 'Pack',
        unitsPerCase: 24,
        casesPerPallet: 80
      },
      pricing: {
        costPrice: 14.00,
        recommendedRetailPrice: 22.99,
        currentPrice: 22.99,
        currency: 'ZAR'
      },
      inventory: {
        currentStock: 5500,
        reorderPoint: 1000,
        leadTime: 10
      },
      dimensions: {
        weight: 200,
        weightUnit: 'g'
      },
      status: 'active',
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID
    },
    // Stimorol
    {
      name: 'Stimorol Original 14g',
      sku: 'STIM-14',
      barcode: '6001087344012',
      category: {
        primary: 'Gum',
        secondary: 'Chewing',
        tertiary: 'Mint'
      },
      brand: 'Stimorol',
      description: 'Chewing gum',
      unitOfMeasure: 'Unit',
      packaging: {
        type: 'Pack',
        unitsPerCase: 50,
        casesPerPallet: 150
      },
      pricing: {
        costPrice: 4.50,
        recommendedRetailPrice: 7.99,
        currentPrice: 7.99,
        currency: 'ZAR'
      },
      inventory: {
        currentStock: 12000,
        reorderPoint: 2500,
        leadTime: 14
      },
      dimensions: {
        weight: 14,
        weightUnit: 'g'
      },
      status: 'active',
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID
    },
    // Top Deck
    {
      name: 'Cadbury Top Deck 80g',
      sku: 'TD-80',
      barcode: '6001087345019',
      category: {
        primary: 'Chocolate',
        secondary: 'Tablets',
        tertiary: 'Speciality'
      },
      brand: 'Cadbury',
      description: 'Milk and white chocolate combination',
      unitOfMeasure: 'Unit',
      packaging: {
        type: 'Bar',
        unitsPerCase: 48,
        casesPerPallet: 100
      },
      pricing: {
        costPrice: 9.00,
        recommendedRetailPrice: 15.99,
        currentPrice: 15.99,
        currency: 'ZAR'
      },
      inventory: {
        currentStock: 4500,
        reorderPoint: 1000,
        leadTime: 7
      },
      dimensions: {
        weight: 80,
        weightUnit: 'g'
      },
      status: 'active',
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID
    }
  ];

  const createdProducts = await Product.insertMany(products);
  console.log(`✅ Created ${createdProducts.length} products`);
  return createdProducts;
};

// ============================================================================
// CUSTOMERS - Major South African Retailers
// ============================================================================

const createCustomers = async () => {
  console.log('\n🏢 Creating South African Retailers...');

  const customers = [
    {
      name: 'Pick n Pay',
      code: 'PNP',
      sapCustomerId: 'ZA-PNP-001',
      type: 'retail',
      status: 'active',
      contactPerson: {
        name: 'Johan Kruger',
        email: 'johan.kruger@pnp.co.za',
        phone: '+27 21 658 1000'
      },
      address: {
        street: '101 Rosmead Avenue',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '7700',
        country: 'South Africa'
      },
      channel: 'modern_trade',
      tier: 'A',
      region: 'National',
      creditLimit: 10000000,
      paymentTerms: 60,
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID
    },
    {
      name: 'Shoprite',
      code: 'SHP',
      sapCustomerId: 'ZA-SHP-001',
      type: 'retail',
      status: 'active',
      contactPerson: {
        name: 'Thembi Mthembu',
        email: 'thembi.mthembu@shoprite.co.za',
        phone: '+27 21 980 4000'
      },
      address: {
        street: 'Shoprite Centre, Brackenfell',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '7560',
        country: 'South Africa'
      },
      channel: 'modern_trade',
      tier: 'A',
      region: 'National',
      creditLimit: 12000000,
      paymentTerms: 60,
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID
    },
    {
      name: 'Checkers',
      code: 'CHK',
      sapCustomerId: 'ZA-CHK-001',
      type: 'retail',
      status: 'active',
      contactPerson: {
        name: 'David Cohen',
        email: 'david.cohen@checkers.co.za',
        phone: '+27 21 980 4100'
      },
      address: {
        street: 'Checkers Centre, Brackenfell',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '7560',
        country: 'South Africa'
      },
      channel: 'modern_trade',
      tier: 'A',
      region: 'National',
      creditLimit: 8000000,
      paymentTerms: 60,
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID
    },
    {
      name: 'Woolworths',
      code: 'WW',
      sapCustomerId: 'ZA-WW-001',
      type: 'retail',
      status: 'active',
      contactPerson: {
        name: 'Sarah Smith',
        email: 'sarah.smith@woolworths.co.za',
        phone: '+27 21 407 9111'
      },
      address: {
        street: '93 Longmarket Street',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        country: 'South Africa'
      },
      channel: 'modern_trade',
      tier: 'A',
      region: 'National',
      creditLimit: 6000000,
      paymentTerms: 45,
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID
    },
    {
      name: 'Spar',
      code: 'SPAR',
      sapCustomerId: 'ZA-SPAR-001',
      type: 'retail',
      status: 'active',
      contactPerson: {
        name: 'Pieter van Wyk',
        email: 'pieter.vanwyk@spar.co.za',
        phone: '+27 11 389 5000'
      },
      address: {
        street: '22 Chancery Lane',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2001',
        country: 'South Africa'
      },
      channel: 'modern_trade',
      tier: 'B',
      region: 'National',
      creditLimit: 5000000,
      paymentTerms: 60,
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID
    },
    {
      name: 'Makro',
      code: 'MAK',
      sapCustomerId: 'ZA-MAK-001',
      type: 'wholesale',
      status: 'active',
      contactPerson: {
        name: 'Ahmed Patel',
        email: 'ahmed.patel@makro.co.za',
        phone: '+27 11 971 1000'
      },
      address: {
        street: 'Makro Centre, Strubens Valley',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '1735',
        country: 'South Africa'
      },
      channel: 'wholesale',
      tier: 'A',
      region: 'National',
      creditLimit: 7000000,
      paymentTerms: 45,
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID
    }
  ];

  const createdCustomers = await Customer.insertMany(customers);
  console.log(`✅ Created ${createdCustomers.length} customers`);
  return createdCustomers;
};

// ============================================================================
// SALES HISTORY - Generate historical sales data
// ============================================================================

const createSalesHistory = async (products, customers) => {
  console.log('\n📊 Creating Historical Sales Data...');

  const salesHistory = [];
  const months = 12; // Last 12 months
  const currentDate = new Date();

  // Generate sales for each product-customer combination for past 12 months
  for (let monthsBack = 0; monthsBack < months; monthsBack++) {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() - monthsBack);

    for (const product of products.slice(0, 5)) { // Top 5 products
      for (const customer of customers.slice(0, 4)) { // Top 4 customers
        const baseVolume = Math.floor(Math.random() * 1000) + 500;
        const seasonalityFactor = 1 + (Math.sin(monthsBack * Math.PI / 6) * 0.2); // Seasonal variation
        const quantity = Math.floor(baseVolume * seasonalityFactor);
        const unitPrice = product.pricing.costPrice * 1.3; // 30% markup
        const grossRevenue = quantity * unitPrice;

        salesHistory.push({
          date,
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          week: Math.ceil(date.getDate() / 7),
          product: product._id,
          customer: customer._id,
          quantity,
          revenue: {
            gross: grossRevenue,
            net: grossRevenue * 0.92, // 8% trade spend
            discount: grossRevenue * 0.08
          },
          costs: {
            cogs: quantity * product.pricing.costPrice,
            distribution: quantity * 2,
            marketing: grossRevenue * 0.03
          },
          margins: {
            grossMargin: grossRevenue - (quantity * product.pricing.costPrice),
            netMargin: (grossRevenue * 0.92) - (quantity * product.pricing.costPrice) - (quantity * 2) - (grossRevenue * 0.03)
          },
          channel: customer.channel,
          region: customer.region,
          tenantId: MONDELEZ_TENANT_ID,
          company: MONDELEZ_COMPANY_ID
        });
      }
    }
  }

  const createdSales = await SalesHistory.insertMany(salesHistory);
  console.log(`✅ Created ${createdSales.length} sales history records`);
  return createdSales;
};

// ============================================================================
// BUDGETS - Annual budget
// ============================================================================

const createBudgets = async (products, customers) => {
  console.log('\n💰 Creating Annual Budget...');

  const currentYear = new Date().getFullYear();

  const budget = {
    year: currentYear,
    name: `Mondelez SA ${currentYear} Annual Budget`,
    budgetType: 'budget',
    status: 'approved',
    currency: 'ZAR',
    annualTotals: {
      sales: {
        value: 150000000,
        growth: 8.5
      },
      tradeSpend: {
        total: 18000000,
        percentage: 12,
        byType: {
          promotions: 8000000,
          listing_fees: 3000000,
          marketing_support: 4000000,
          rebates: 3000000
        }
      },
      netSales: 132000000,
      margin: {
        gross: 45000000,
        percentage: 30
      }
    },
    quarterly: [
      {
        quarter: 1,
        sales: 35000000,
        tradeSpend: 4200000,
        netSales: 30800000
      },
      {
        quarter: 2,
        sales: 38000000,
        tradeSpend: 4560000,
        netSales: 33440000
      },
      {
        quarter: 3,
        sales: 37000000,
        tradeSpend: 4440000,
        netSales: 32560000
      },
      {
        quarter: 4,
        sales: 40000000,
        tradeSpend: 4800000,
        netSales: 35200000
      }
    ],
    tenantId: MONDELEZ_TENANT_ID,
    company: MONDELEZ_COMPANY_ID
  };

  const createdBudget = await Budget.create(budget);
  console.log('✅ Created annual budget');
  return createdBudget;
};

// ============================================================================
// PROMOTIONS - Active and historical
// ============================================================================

const createPromotions = async (products, customers, users) => {
  console.log('\n🎯 Creating Promotions...');

  const promotions = [
    {
      promotionId: 'PROMO-2024-00001',
      name: 'Pick n Pay Easter Chocolate Promotion',
      description: 'Easter promotion featuring Cadbury chocolate range',
      promotionType: 'price_discount',
      status: 'completed',
      period: {
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-04-05')
      },
      scope: {
        customers: [{ customer: customers[0]._id, stores: 'all' }],
        region: 'National'
      },
      products: [
        {
          product: products[0]._id,
          included: true
        },
        {
          product: products[1]._id,
          included: true
        }
      ],
      mechanics: {
        type: 'percentage_off',
        discountValue: 20,
        conditions: {
          minimumPurchase: { quantity: 2 }
        }
      },
      investment: {
        total: 250000,
        breakdown: {
          discount: 180000,
          marketing: 50000,
          logistics: 20000
        }
      },
      performance: {
        volumeLift: 35,
        revenueLift: 28,
        roi: 2.1,
        incrementalVolume: 8500
      },
      createdBy: users[2]._id,
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID
    },
    {
      promotionId: 'PROMO-2024-00002',
      name: 'Shoprite Back to School Snack Attack',
      description: 'Back to school promotion on Oreo and Lunch Bar',
      promotionType: 'price_discount',
      status: 'active',
      period: {
        startDate: new Date('2024-10-15'),
        endDate: new Date('2024-11-15')
      },
      scope: {
        customers: [{ customer: customers[1]._id, stores: 'all' }],
        region: 'National'
      },
      products: [
        {
          product: products[2]._id, // Oreo
          included: true
        },
        {
          product: products[3]._id, // Lunch Bar
          included: true
        }
      ],
      mechanics: {
        type: 'percentage_off',
        discountValue: 15,
        conditions: {
          minimumPurchase: { quantity: 3 }
        }
      },
      investment: {
        total: 180000,
        breakdown: {
          discount: 140000,
          marketing: 30000,
          logistics: 10000
        }
      },
      performance: {
        volumeLift: 0,
        revenueLift: 0,
        roi: 0,
        incrementalVolume: 0
      },
      createdBy: users[3]._id,
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID
    },
    {
      promotionId: 'PROMO-2024-00003',
      name: 'Checkers Summer Treats',
      description: 'Summer promotion on Top Deck chocolate',
      promotionType: 'bundle',
      status: 'scheduled',
      period: {
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-31')
      },
      scope: {
        customers: [{ customer: customers[2]._id, stores: 'all' }],
        region: 'National'
      },
      products: [
        {
          product: products[7]._id, // Top Deck
          included: true
        }
      ],
      mechanics: {
        type: 'buy_x_get_y',
        discountValue: 0,
        conditions: {
          buy: { quantity: 3 },
          get: { quantity: 1, discountPercentage: 100 }
        }
      },
      investment: {
        total: 120000,
        breakdown: {
          discount: 90000,
          marketing: 25000,
          logistics: 5000
        }
      },
      createdBy: users[4]._id,
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID
    }
  ];

  const createdPromotions = await Promotion.insertMany(promotions);
  console.log(`✅ Created ${createdPromotions.length} promotions`);
  return createdPromotions;
};

// ============================================================================
// CAMPAIGNS - Marketing campaigns
// ============================================================================

const createCampaigns = async (products, customers, users) => {
  console.log('\n📢 Creating Marketing Campaigns...');

  const campaigns = [
    {
      campaignId: 'CAMP-2024-001',
      name: 'Cadbury Chocolate Love Campaign',
      description: 'National marketing campaign for Cadbury chocolate range',
      campaignType: 'brand_awareness',
      status: 'active',
      period: {
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-12-31')
      },
      scope: {
        customers: [customers[0]._id, customers[1]._id, customers[2]._id],
        region: 'National'
      },
      products: [products[0]._id, products[1]._id, products[7]._id],
      channels: ['social_media', 'tv', 'in_store', 'digital'],
      budget: {
        total: 2500000,
        allocated: {
          social_media: 800000,
          tv: 1000000,
          in_store: 500000,
          digital: 200000
        },
        spent: 1200000
      },
      performance: {
        reach: 5000000,
        impressions: 15000000,
        engagement: 250000,
        conversions: 50000
      },
      createdBy: users[4]._id,
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID
    },
    {
      campaignId: 'CAMP-2024-002',
      name: 'Oreo Twist Lick Dunk',
      description: 'Interactive campaign for Oreo cookies',
      campaignType: 'product_launch',
      status: 'active',
      period: {
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-11-30')
      },
      scope: {
        customers: [customers[0]._id, customers[3]._id],
        region: 'National'
      },
      products: [products[2]._id],
      channels: ['social_media', 'digital', 'in_store'],
      budget: {
        total: 1200000,
        allocated: {
          social_media: 500000,
          digital: 400000,
          in_store: 300000
        },
        spent: 900000
      },
      performance: {
        reach: 3000000,
        impressions: 9000000,
        engagement: 180000,
        conversions: 35000
      },
      createdBy: users[4]._id,
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID
    }
  ];

  const createdCampaigns = await Campaign.insertMany(campaigns);
  console.log(`✅ Created ${createdCampaigns.length} campaigns`);
  return createdCampaigns;
};

// ============================================================================
// TRADE SPEND - Accruals and payments
// ============================================================================

const createTradeSpend = async (customers, products) => {
  console.log('\n💸 Creating Trade Spend Records...');

  const tradeSpendRecords = [
    {
      spendId: 'TS-2024-001',
      spendType: 'listing_fee',
      description: 'Q4 Listing Fee - Pick n Pay',
      customer: customers[0]._id,
      product: products[0]._id,
      period: {
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-12-31')
      },
      amount: {
        budgeted: 500000,
        accrued: 500000,
        spent: 500000,
        currency: 'ZAR'
      },
      status: 'approved',
      paymentStatus: 'paid',
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID
    },
    {
      spendId: 'TS-2024-002',
      spendType: 'promotional_discount',
      description: 'Easter Promotion Discount - Pick n Pay',
      customer: customers[0]._id,
      period: {
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-04-05')
      },
      amount: {
        budgeted: 180000,
        accrued: 180000,
        spent: 180000,
        currency: 'ZAR'
      },
      status: 'completed',
      paymentStatus: 'paid',
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID
    },
    {
      spendId: 'TS-2024-003',
      spendType: 'marketing_support',
      description: 'Marketing Support - Shoprite',
      customer: customers[1]._id,
      period: {
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-09-30')
      },
      amount: {
        budgeted: 750000,
        accrued: 750000,
        spent: 750000,
        currency: 'ZAR'
      },
      status: 'approved',
      paymentStatus: 'paid',
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID
    }
  ];

  const createdTradeSpend = await TradeSpend.insertMany(tradeSpendRecords);
  console.log(`✅ Created ${createdTradeSpend.length} trade spend records`);
  return createdTradeSpend;
};

// ============================================================================
// ACTIVITY GRID - Calendar activities
// ============================================================================

const createActivityGrid = async (promotions, campaigns, customers, products, users) => {
  console.log('\n📅 Creating Activity Grid...');

  const activities = [
    {
      date: new Date('2024-11-01'),
      activityType: 'promotion',
      title: 'Shoprite Back to School - Launch',
      description: 'Promotion launch date',
      linkedPromotion: promotions[1]._id,
      customer: customers[1]._id,
      products: [products[2]._id, products[3]._id],
      status: 'scheduled',
      priority: 'high',
      createdBy: users[3]._id,
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID
    },
    {
      date: new Date('2024-12-01'),
      activityType: 'promotion',
      title: 'Checkers Summer Treats - Launch',
      description: 'Summer promotion start',
      linkedPromotion: promotions[2]._id,
      customer: customers[2]._id,
      products: [products[7]._id],
      status: 'scheduled',
      priority: 'high',
      createdBy: users[4]._id,
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID
    },
    {
      date: new Date('2024-11-15'),
      activityType: 'review',
      title: 'Q4 Performance Review',
      description: 'Quarterly business review with key accounts',
      customer: customers[0]._id,
      status: 'scheduled',
      priority: 'medium',
      createdBy: users[1]._id,
      tenantId: MONDELEZ_TENANT_ID,
      company: MONDELEZ_COMPANY_ID
    }
  ];

  const createdActivities = await ActivityGrid.insertMany(activities);
  console.log(`✅ Created ${createdActivities.length} activities`);
  return createdActivities;
};

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

const seedMondelezData = async () => {
  try {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                                                          ║');
    console.log('║        🍫 MONDELEZ SOUTH AFRICA SEED DATA 🍫           ║');
    console.log('║                                                          ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    await connectDB();

    // Clear existing Mondelez data
    console.log('\n🗑️  Clearing existing Mondelez data...');
    await User.deleteMany({ tenantId: MONDELEZ_TENANT_ID });
    await Customer.deleteMany({ tenantId: MONDELEZ_TENANT_ID });
    await Product.deleteMany({ tenantId: MONDELEZ_TENANT_ID });
    await Promotion.deleteMany({ tenantId: MONDELEZ_TENANT_ID });
    await Campaign.deleteMany({ tenantId: MONDELEZ_TENANT_ID });
    await Budget.deleteMany({ tenantId: MONDELEZ_TENANT_ID });
    await SalesHistory.deleteMany({ tenantId: MONDELEZ_TENANT_ID });
    await TradeSpend.deleteMany({ tenantId: MONDELEZ_TENANT_ID });
    await ActivityGrid.deleteMany({ tenantId: MONDELEZ_TENANT_ID });
    console.log('✅ Cleared existing data');

    // Create seed data
    const users = await createUsers();
    const products = await createProducts();
    const customers = await createCustomers();
    const salesHistory = await createSalesHistory(products, customers);
    const budget = await createBudgets(products, customers);
    const promotions = await createPromotions(products, customers, users);
    const campaigns = await createCampaigns(products, customers, users);
    const tradeSpend = await createTradeSpend(customers, products);
    const activities = await createActivityGrid(promotions, campaigns, customers, products, users);

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                                                          ║');
    console.log('║              ✅ SEED DATA COMPLETE! ✅                  ║');
    console.log('║                                                          ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    console.log('📊 Summary:');
    console.log(`   Users:          ${users.length}`);
    console.log(`   Products:       ${products.length}`);
    console.log(`   Customers:      ${customers.length}`);
    console.log(`   Sales Records:  ${salesHistory.length}`);
    console.log('   Budgets:        1');
    console.log(`   Promotions:     ${promotions.length}`);
    console.log(`   Campaigns:      ${campaigns.length}`);
    console.log(`   Trade Spend:    ${tradeSpend.length}`);
    console.log(`   Activities:     ${activities.length}`);

    console.log('\n🔐 Login Credentials:');
    console.log('   Email:    thabo.mokoena@mondelez.com');
    console.log('   Password: Mondelez@2024');
    console.log('   Role:     Admin\n');

    console.log('   Email:    sipho.dlamini@mondelez.com');
    console.log('   Password: Mondelez@2024');
    console.log('   Role:     KAM (Pick n Pay)\n');

    await mongoose.disconnect();
    console.log('✅ MongoDB Disconnected\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error seeding data:', error);
    process.exit(1);
  }
};

// Run the seeder
if (require.main === module) {
  seedMondelezData();
}

module.exports = { seedMondelezData };
