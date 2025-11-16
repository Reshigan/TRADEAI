const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const Budget = require('../models/Budget');
const Promotion = require('../models/Promotion');
const TradeSpend = require('../models/TradeSpend');
const SalesHistory = require('../models/SalesHistory');
const Campaign = require('../models/Campaign');
const ActivityGrid = require('../models/ActivityGrid');
const MasterData = require('../models/MasterData');
const config = require('../config');
const logger = require('../utils/logger');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearData = async () => {
  console.log('Clearing existing data...');
  await User.deleteMany({});
  await Customer.deleteMany({});
  await Product.deleteMany({});
  await Vendor.deleteMany({});
  await Budget.deleteMany({});
  await Promotion.deleteMany({});
  await TradeSpend.deleteMany({});
  await SalesHistory.deleteMany({});
  await Campaign.deleteMany({});
  await ActivityGrid.deleteMany({});
  await MasterData.deleteMany({});
  console.log('Data cleared successfully');
};

// Create users
const createUsers = async () => {
  console.log('Creating users...');

  const password = await bcrypt.hash('Vantax1234#', 10);

  const users = [
    {
      email: 'info@vantax.co.za',
      password,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      twoFactorEnabled: false,
      department: 'admin',
      employeeId: 'EMP001'
    },
    {
      email: 'director@testco.com',
      password,
      firstName: 'John',
      lastName: 'Director',
      role: 'director',
      isActive: true,
      department: 'operations',
      employeeId: 'EMP002'
    },
    {
      email: 'manager@testco.com',
      password,
      firstName: 'Sarah',
      lastName: 'Manager',
      role: 'manager',
      isActive: true,
      department: 'marketing',
      employeeId: 'EMP003'
    },
    {
      email: 'kam1@testco.com',
      password,
      firstName: 'Michael',
      lastName: 'Johnson',
      role: 'kam',
      isActive: true,
      department: 'sales',
      employeeId: 'EMP004'
    },
    {
      email: 'kam2@testco.com',
      password,
      firstName: 'Lisa',
      lastName: 'Williams',
      role: 'kam',
      isActive: true,
      department: 'sales',
      employeeId: 'EMP005'
    },
    {
      email: 'analyst@testco.com',
      password,
      firstName: 'David',
      lastName: 'Brown',
      role: 'analyst',
      isActive: true,
      department: 'finance',
      employeeId: 'EMP006'
    },
    {
      email: 'finance@testco.com',
      password,
      firstName: 'Emma',
      lastName: 'Davis',
      role: 'analyst',
      isActive: true,
      department: 'finance',
      employeeId: 'EMP007'
    }
  ];

  const createdUsers = await User.insertMany(users);
  console.log(`Created ${createdUsers.length} users`);
  return createdUsers;
};

// Create customers (South African retailers)
const createCustomers = async () => {
  console.log('Creating customers...');

  const customers = [
    // Level 1: National Chains
    {
      sapCustomerId: 'SAP-PICK001',
      code: 'PICK001',
      name: 'Pick n Pay Group',
      customerType: 'retailer',
      channel: 'modern_trade',
      taxId: '1968/008034/06',
      addresses: [{
        type: 'both',
        street: '101 Rosmead Avenue',
        city: 'Cape Town',
        state: 'Western Cape',
        country: 'South Africa',
        postalCode: '7708'
      }],
      contacts: [{
        name: 'James Mitchell',
        position: 'Procurement Manager',
        phone: '+27 21 658 1000',
        email: 'procurement@pnp.co.za',
        isPrimary: true
      }],
      creditLimit: 5000000,
      currency: 'ZAR',
      paymentTerms: 'NET30',
      hierarchy: {
        level1: {
          id: 'L1-001',
          name: 'National Chains',
          code: 'NC'
        }
      },
      tier: 'platinum'
    },
    {
      sapCustomerId: 'SAP-SHOP001',
      code: 'SHOP001',
      name: 'Shoprite Holdings',
      customerType: 'retailer',
      channel: 'modern_trade',
      taxId: '1979/004197/06',
      addresses: [{
        type: 'both',
        street: 'Cnr William Dabs & Old Paarl Roads',
        city: 'Cape Town',
        state: 'Western Cape',
        country: 'South Africa',
        postalCode: '7460'
      }],
      contacts: [{
        name: 'Peter Van Der Merwe',
        position: 'Category Buyer',
        phone: '+27 21 980 4000',
        email: 'buyers@shoprite.co.za',
        isPrimary: true
      }],
      creditLimit: 8000000,
      currency: 'ZAR',
      paymentTerms: 'NET45',
      hierarchy: {
        level1: {
          id: 'L1-001',
          name: 'National Chains',
          code: 'NC'
        }
      },
      tier: 'platinum'
    },
    {
      code: 'SPAR001',
      name: 'SPAR Group',
      legalName: 'The SPAR Group Ltd',
      type: 'retailer',
      channel: 'modern_trade',
      taxId: '1967/001572/06',
      address: {
        street: '22 Chancery Lane',
        city: 'Durban',
        state: 'KwaZulu-Natal',
        country: 'South Africa',
        postalCode: '4001'
      },
      contact: {
        phone: '+27 31 719 1900',
        email: 'trading@spar.co.za',
        contactPerson: 'Thabo Molefe'
      },
      creditLimit: {
        amount: 4000000,
        currency: 'ZAR'
      },
      paymentTerms: 30,
      status: 'active',
      hierarchy: {
        level1: 'National Chains'
      }
    },
    {
      code: 'WOOL001',
      name: 'Woolworths',
      legalName: 'Woolworths Holdings Limited',
      type: 'retailer',
      channel: 'premium',
      taxId: '1929/001986/06',
      address: {
        street: '1 Woolworths Way',
        city: 'Cape Town',
        state: 'Western Cape',
        country: 'South Africa',
        postalCode: '7700'
      },
      contact: {
        phone: '+27 21 407 9111',
        email: 'suppliers@woolworths.co.za',
        contactPerson: 'Amanda Chen'
      },
      creditLimit: {
        amount: 3000000,
        currency: 'ZAR'
      },
      paymentTerms: 30,
      status: 'active',
      hierarchy: {
        level1: 'Premium Retail'
      }
    },
    {
      code: 'MAKR001',
      name: 'Makro',
      legalName: 'Massmart Holdings Limited',
      type: 'wholesaler',
      channel: 'wholesale',
      taxId: '1990/007302/06',
      address: {
        street: '16 Peltier Drive',
        city: 'Johannesburg',
        state: 'Gauteng',
        country: 'South Africa',
        postalCode: '2090'
      },
      contact: {
        phone: '+27 11 797 0000',
        email: 'buyers@makro.co.za',
        contactPerson: 'Johan Kruger'
      },
      creditLimit: {
        amount: 6000000,
        currency: 'ZAR'
      },
      paymentTerms: 60,
      status: 'active',
      hierarchy: {
        level1: 'Wholesale'
      }
    },
    // Level 2: Regional/Convenience
    {
      code: 'CHOP001',
      name: 'Choppies Supermarkets',
      legalName: 'Choppies Enterprises Limited',
      type: 'retailer',
      channel: 'convenience',
      taxId: '2012/123456/07',
      address: {
        street: '123 Main Road',
        city: 'Johannesburg',
        state: 'Gauteng',
        country: 'South Africa',
        postalCode: '2001'
      },
      contact: {
        phone: '+27 11 123 4567',
        email: 'orders@choppies.co.za',
        contactPerson: 'Samuel Ndlovu'
      },
      creditLimit: {
        amount: 1000000,
        currency: 'ZAR'
      },
      paymentTerms: 30,
      status: 'active',
      hierarchy: {
        level1: 'Regional Chains'
      }
    },
    // Traditional Trade
    {
      code: 'SPAZ001',
      name: 'Township Traders Association',
      legalName: 'Township Traders Association',
      type: 'distributor',
      channel: 'traditional_trade',
      taxId: '2015/789012/08',
      address: {
        street: '45 Vilakazi Street',
        city: 'Soweto',
        state: 'Gauteng',
        country: 'South Africa',
        postalCode: '1804'
      },
      contact: {
        phone: '+27 11 987 6543',
        email: 'info@townshiptraders.co.za',
        contactPerson: 'Sipho Dlamini'
      },
      creditLimit: {
        amount: 500000,
        currency: 'ZAR'
      },
      paymentTerms: 15,
      status: 'active',
      hierarchy: {
        level1: 'Traditional Trade'
      }
    }
  ];

  const createdCustomers = await Customer.insertMany(customers);
  console.log(`Created ${createdCustomers.length} customers`);
  return createdCustomers;
};

// Create products (Diplomat products)
const createProducts = async () => {
  console.log('Creating products...');

  const products = [
    // Supermatch Matches
    {
      sku: 'SM001',
      name: 'Supermatch Safety Matches - 10s',
      description: 'Premium safety matches, 10 box pack',
      brand: {
        code: 'SUPERMATCH',
        name: 'Supermatch'
      },
      category: {
        primary: 'Household',
        secondary: 'Matches'
      },
      uom: {
        base: 'PACK',
        sales: 'CASE'
      },
      packaging: {
        unitsPerCase: 50,
        casesPerPallet: 100
      },
      pricing: {
        listPrice: 15.99,
        currency: 'ZAR'
      },
      weight: {
        gross: 0.5,
        net: 0.45,
        unit: 'KG'
      },
      status: 'active',
      hierarchy: {
        level1: 'Household Products',
        level2: 'Fire & Light',
        level3: 'Matches',
        level4: 'Safety Matches',
        level5: 'Supermatch'
      }
    },
    {
      sku: 'SM002',
      name: 'Supermatch Long Stem Matches',
      description: 'Extra long safety matches for braai and fireplace',
      brand: {
        code: 'SUPERMATCH',
        name: 'Supermatch'
      },
      category: {
        primary: 'Household',
        secondary: 'Matches'
      },
      uom: {
        base: 'BOX',
        sales: 'CASE'
      },
      packaging: {
        unitsPerCase: 24,
        casesPerPallet: 120
      },
      pricing: {
        listPrice: 29.99,
        currency: 'ZAR'
      },
      weight: {
        gross: 0.3,
        net: 0.25,
        unit: 'KG'
      },
      status: 'active'
    },
    // Bostik Adhesives
    {
      sku: 'BOS001',
      name: 'Bostik Clear Adhesive 25ml',
      description: 'Multi-purpose clear adhesive',
      brand: {
        code: 'BOSTIK',
        name: 'Bostik'
      },
      category: {
        primary: 'Stationery',
        secondary: 'Adhesives'
      },
      uom: {
        base: 'TUBE',
        sales: 'CASE'
      },
      packaging: {
        unitsPerCase: 48,
        casesPerPallet: 80
      },
      pricing: {
        listPrice: 12.99,
        currency: 'ZAR'
      },
      weight: {
        gross: 0.03,
        net: 0.025,
        unit: 'KG'
      },
      status: 'active'
    },
    {
      sku: 'BOS002',
      name: 'Bostik Prestik 100g',
      description: 'Reusable adhesive putty',
      brand: {
        code: 'BOSTIK',
        name: 'Bostik'
      },
      category: {
        primary: 'Stationery',
        secondary: 'Adhesives'
      },
      uom: {
        base: 'PACK',
        sales: 'CASE'
      },
      packaging: {
        unitsPerCase: 36,
        casesPerPallet: 100
      },
      pricing: {
        listPrice: 24.99,
        currency: 'ZAR'
      },
      weight: {
        gross: 0.12,
        net: 0.1,
        unit: 'KG'
      },
      status: 'active'
    },
    // Alcolin Products
    {
      sku: 'ALC001',
      name: 'Alcolin Wood Glue 250ml',
      description: 'Professional wood adhesive',
      brand: {
        code: 'ALCOLIN',
        name: 'Alcolin'
      },
      category: {
        primary: 'DIY',
        secondary: 'Adhesives'
      },
      uom: {
        base: 'BOTTLE',
        sales: 'CASE'
      },
      packaging: {
        unitsPerCase: 24,
        casesPerPallet: 60
      },
      pricing: {
        listPrice: 45.99,
        currency: 'ZAR'
      },
      weight: {
        gross: 0.3,
        net: 0.25,
        unit: 'KG'
      },
      status: 'active'
    },
    {
      sku: 'ALC002',
      name: 'Alcolin Silicone Sealant Clear 280ml',
      description: 'Waterproof silicone sealant',
      brand: {
        code: 'ALCOLIN',
        name: 'Alcolin'
      },
      category: {
        primary: 'DIY',
        secondary: 'Sealants'
      },
      uom: {
        base: 'TUBE',
        sales: 'CASE'
      },
      packaging: {
        unitsPerCase: 24,
        casesPerPallet: 50
      },
      pricing: {
        listPrice: 65.99,
        currency: 'ZAR'
      },
      weight: {
        gross: 0.35,
        net: 0.28,
        unit: 'KG'
      },
      status: 'active'
    },
    // Pritt Products
    {
      sku: 'PRT001',
      name: 'Pritt Glue Stick 22g',
      description: 'Original Pritt stick for paper',
      brand: {
        code: 'PRITT',
        name: 'Pritt'
      },
      category: {
        primary: 'Stationery',
        secondary: 'Adhesives'
      },
      uom: {
        base: 'STICK',
        sales: 'CASE'
      },
      packaging: {
        unitsPerCase: 48,
        casesPerPallet: 120
      },
      pricing: {
        listPrice: 18.99,
        currency: 'ZAR'
      },
      weight: {
        gross: 0.025,
        net: 0.022,
        unit: 'KG'
      },
      status: 'active'
    },
    {
      sku: 'PRT002',
      name: 'Pritt Correction Pen 8ml',
      description: 'Quick-dry correction fluid pen',
      brand: {
        code: 'PRITT',
        name: 'Pritt'
      },
      category: {
        primary: 'Stationery',
        secondary: 'Correction'
      },
      uom: {
        base: 'PEN',
        sales: 'CASE'
      },
      packaging: {
        unitsPerCase: 36,
        casesPerPallet: 100
      },
      pricing: {
        listPrice: 22.99,
        currency: 'ZAR'
      },
      weight: {
        gross: 0.015,
        net: 0.008,
        unit: 'KG'
      },
      status: 'active'
    }
  ];

  const createdProducts = await Product.insertMany(products);
  console.log(`Created ${createdProducts.length} products`);
  return createdProducts;
};

// Create vendors
const createVendors = async () => {
  console.log('Creating vendors...');

  const vendors = [
    {
      code: 'DIPL001',
      name: 'Diplomat South Africa',
      legalName: 'Diplomat Distributors SA (Pty) Ltd',
      type: 'manufacturer',
      taxId: '1995/123456/07',
      address: {
        street: '123 Industrial Road',
        city: 'Johannesburg',
        state: 'Gauteng',
        country: 'South Africa',
        postalCode: '2000'
      },
      contact: {
        phone: '+27 11 123 4567',
        email: 'info@diplomat.co.za',
        contactPerson: 'Mark Stevens',
        alternateContact: 'Sarah Johnson'
      },
      bankDetails: {
        bankName: 'Standard Bank',
        accountNumber: '123456789',
        branchCode: '051001',
        swiftCode: 'SBZAZAJJ'
      },
      paymentTerms: 30,
      status: 'active'
    },
    {
      code: 'MEDIA001',
      name: 'MediaCom SA',
      legalName: 'MediaCom South Africa (Pty) Ltd',
      type: 'agency',
      taxId: '2000/789012/07',
      address: {
        street: '456 Media House',
        city: 'Cape Town',
        state: 'Western Cape',
        country: 'South Africa',
        postalCode: '8001'
      },
      contact: {
        phone: '+27 21 987 6543',
        email: 'accounts@mediacom.co.za',
        contactPerson: 'Jennifer Adams'
      },
      paymentTerms: 45,
      status: 'active'
    },
    {
      code: 'PROMO001',
      name: 'PromoPlus Merchandising',
      legalName: 'PromoPlus (Pty) Ltd',
      type: 'merchandising',
      taxId: '2010/456789/07',
      address: {
        street: '789 Retail Park',
        city: 'Durban',
        state: 'KwaZulu-Natal',
        country: 'South Africa',
        postalCode: '4001'
      },
      contact: {
        phone: '+27 31 555 0123',
        email: 'services@promoplus.co.za',
        contactPerson: 'David Naidoo'
      },
      paymentTerms: 30,
      status: 'active'
    }
  ];

  const createdVendors = await Vendor.insertMany(vendors);
  console.log(`Created ${createdVendors.length} vendors`);
  return createdVendors;
};

// Generate sales history for a year
const generateSalesHistory = async (customers, products) => {
  console.log('Generating sales history...');

  const salesData = [];
  const currentDate = new Date();
  const startDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1);

  // Generate daily sales for each customer-product combination
  for (const customer of customers) {
    for (const product of products) {
      const date = new Date(startDate);

      while (date <= currentDate) {
        // Skip some days randomly to simulate realistic patterns
        if (Math.random() > 0.3) {
          // Base volume varies by customer size
          let baseVolume = 100;
          if (customer.code.includes('SHOP')) baseVolume = 500;
          else if (customer.code.includes('PICK')) baseVolume = 400;
          else if (customer.code.includes('SPAR')) baseVolume = 300;
          else if (customer.code.includes('WOOL')) baseVolume = 200;
          else if (customer.code.includes('MAKR')) baseVolume = 600;
          else if (customer.code.includes('CHOP')) baseVolume = 150;
          else if (customer.code.includes('SPAZ')) baseVolume = 50;

          // Add seasonality
          const month = date.getMonth();
          let seasonalFactor = 1;
          if ([10, 11].includes(month)) seasonalFactor = 1.3; // Year-end peak
          if ([0, 1].includes(month)) seasonalFactor = 0.8; // January/February low
          if ([5, 6].includes(month)) seasonalFactor = 0.9; // Winter low

          // Add day of week variation
          const dayOfWeek = date.getDay();
          let dayFactor = 1;
          if (dayOfWeek === 0) dayFactor = 0.7; // Sunday
          if (dayOfWeek === 6) dayFactor = 1.2; // Saturday
          if (dayOfWeek === 5) dayFactor = 1.1; // Friday

          // Add random variation
          const randomFactor = 0.7 + Math.random() * 0.6;

          // Calculate final volume
          const volume = Math.round(baseVolume * seasonalFactor * dayFactor * randomFactor);

          // Calculate pricing with some variation
          const basePrice = product.pricing.listPrice;
          const discount = Math.random() * 0.15; // 0-15% discount
          const invoicePrice = basePrice * (1 - discount);

          // Calculate costs
          const cogs = basePrice * 0.65; // 65% cost
          const freight = volume * 0.5; // R0.50 per unit freight

          const revenue = volume * invoicePrice;
          const grossMargin = revenue - (volume * cogs);

          salesData.push({
            date: new Date(date),
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            week: getWeekNumber(date),
            customer: customer._id,
            product: product._id,
            channel: customer.channel,
            invoiceNumber: `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            quantity: volume,
            uom: product.uom.sales,
            pricing: {
              listPrice: basePrice,
              invoicePrice,
              discount: basePrice * discount
            },
            revenue: {
              gross: revenue,
              net: revenue * 0.86, // After VAT
              tax: revenue * 0.14
            },
            cost: {
              cogs: volume * cogs,
              freight
            },
            margins: {
              grossMargin,
              grossMarginPercentage: (grossMargin / revenue) * 100
            }
          });
        }

        date.setDate(date.getDate() + 1);
      }
    }
  }

  // Insert in batches
  const batchSize = 1000;
  for (let i = 0; i < salesData.length; i += batchSize) {
    const batch = salesData.slice(i, i + batchSize);
    await SalesHistory.insertMany(batch);
  }

  console.log(`Generated ${salesData.length} sales records`);
  return salesData;
};

// Create budgets
const createBudgets = async (users, customers, products) => {
  console.log('Creating budgets...');

  const currentYear = new Date().getFullYear();
  const budgets = [];

  // Create annual budget
  const annualBudget = {
    name: `FY${currentYear} Annual Trade Spend Budget`,
    year: currentYear,
    budgetType: 'annual',
    scope: {
      customers: customers.map((c) => c._id),
      products: products.map((p) => p._id),
      channels: ['modern_trade', 'wholesale', 'convenience', 'traditional_trade', 'premium']
    },
    budgetLines: [],
    status: 'approved',
    version: 1,
    createdBy: users.find((u) => u.role === 'finance')._id,
    approvedBy: users.find((u) => u.role === 'director')._id,
    approvedDate: new Date(currentYear, 0, 15)
  };

  // Generate monthly budget lines
  const monthlyBudgets = {};
  for (let month = 1; month <= 12; month++) {
    monthlyBudgets[month] = {
      marketing: 500000 + Math.random() * 200000,
      cashCoop: 300000 + Math.random() * 100000,
      tradingTerms: 400000 + Math.random() * 150000,
      rebates: 200000 + Math.random() * 50000,
      promotions: 600000 + Math.random() * 200000
    };

    annualBudget.budgetLines.push({
      month,
      allocations: monthlyBudgets[month],
      total: Object.values(monthlyBudgets[month]).reduce((a, b) => a + b, 0)
    });
  }

  // Calculate annual totals
  annualBudget.annualTotals = {
    marketing: annualBudget.budgetLines.reduce((sum, line) => sum + line.allocations.marketing, 0),
    cashCoop: annualBudget.budgetLines.reduce((sum, line) => sum + line.allocations.cashCoop, 0),
    tradingTerms: annualBudget.budgetLines.reduce((sum, line) => sum + line.allocations.tradingTerms, 0),
    rebates: annualBudget.budgetLines.reduce((sum, line) => sum + line.allocations.rebates, 0),
    promotions: annualBudget.budgetLines.reduce((sum, line) => sum + line.allocations.promotions, 0)
  };

  annualBudget.annualTotals.total = Object.values(annualBudget.annualTotals).reduce((a, b) => a + b, 0);

  budgets.push(annualBudget);

  // Create quarterly budgets
  for (let quarter = 1; quarter <= 4; quarter++) {
    const quarterBudget = {
      name: `FY${currentYear} Q${quarter} Trade Spend Budget`,
      year: currentYear,
      budgetType: 'quarterly',
      quarter,
      scope: annualBudget.scope,
      budgetLines: [],
      status: 'approved',
      version: 1,
      createdBy: users.find((u) => u.role === 'manager')._id,
      approvedBy: users.find((u) => u.role === 'director')._id,
      approvedDate: new Date(currentYear, (quarter - 1) * 3, 1)
    };

    // Add quarterly lines
    const startMonth = (quarter - 1) * 3 + 1;
    for (let i = 0; i < 3; i++) {
      const month = startMonth + i;
      quarterBudget.budgetLines.push(annualBudget.budgetLines[month - 1]);
    }

    budgets.push(quarterBudget);
  }

  const createdBudgets = await Budget.insertMany(budgets);
  console.log(`Created ${createdBudgets.length} budgets`);
  return createdBudgets;
};

// Create promotions with mixed results
const createPromotions = async (users, customers, products, vendors) => {
  console.log('Creating promotions...');

  const promotions = [];
  const currentDate = new Date();
  const yearStart = new Date(currentDate.getFullYear(), 0, 1);

  // Promotion templates
  const promotionTypes = [
    { type: 'tpr', name: 'Temporary Price Reduction', discount: 15, duration: 14 },
    { type: 'display', name: 'In-Store Display', discount: 10, duration: 7 },
    { type: 'feature', name: 'Feature Ad', discount: 20, duration: 7 },
    { type: 'bogo', name: 'Buy One Get One', discount: 50, duration: 3 },
    { type: 'combo', name: 'Combo Deal', discount: 25, duration: 14 }
  ];

  // Create promotions throughout the year
  let promotionDate = new Date(yearStart);
  let promotionCount = 0;

  while (promotionDate < currentDate) {
    // Select random customers and products
    const selectedCustomers = customers.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);
    const selectedProducts = products.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);
    const promotionType = promotionTypes[Math.floor(Math.random() * promotionTypes.length)];

    // Determine performance (70% successful, 30% underperforming)
    const isSuccessful = Math.random() > 0.3;

    const promotion = {
      promotionId: `PROMO-${currentDate.getFullYear()}-${String(++promotionCount).padStart(4, '0')}`,
      name: `${promotionType.name} - ${selectedProducts[0].name}`,
      promotionType: promotionType.type,
      status: promotionDate < new Date() ? 'completed' : 'approved',
      period: {
        startDate: new Date(promotionDate),
        endDate: new Date(promotionDate.getTime() + promotionType.duration * 24 * 60 * 60 * 1000)
      },
      products: selectedProducts.map((p) => ({
        product: p._id,
        discount: promotionType.discount + (Math.random() * 10 - 5),
        targetVolume: 1000 + Math.floor(Math.random() * 2000),
        minimumOrder: 100
      })),
      scope: {
        customers: selectedCustomers.map((c) => ({
          customer: c._id,
          stores: ['all']
        })),
        channels: [...new Set(selectedCustomers.map((c) => c.channel))]
      },
      mechanics: {
        displayType: promotionType.type === 'display' ? 'end-cap' : 'shelf',
        requiredFacings: Math.floor(Math.random() * 4) + 2,
        additionalRequirements: []
      },
      financial: {
        costs: {
          discount: 50000 + Math.random() * 100000,
          display: promotionType.type === 'display' ? 20000 : 0,
          advertising: promotionType.type === 'feature' ? 30000 : 0,
          other: Math.random() * 10000
        },
        revenue: {
          baseline: 200000 + Math.random() * 100000,
          incremental: isSuccessful ? (100000 + Math.random() * 200000) : (20000 + Math.random() * 30000)
        }
      },
      performance: {
        volumeAchievement: isSuccessful ? (90 + Math.random() * 30) : (40 + Math.random() * 30),
        roiActual: isSuccessful ? (2 + Math.random() * 3) : (0.5 + Math.random() * 0.8),
        effectiveness: isSuccessful ? 'high' : 'low'
      },
      createdBy: users.find((u) => u.role === 'kam')._id,
      approvedBy: users.find((u) => u.role === 'manager')._id,
      vendor: vendors[0]._id
    };

    // Calculate total cost
    promotion.financial.costs.totalCost = Object.values(promotion.financial.costs).reduce((a, b) => a + b, 0);

    promotions.push(promotion);

    // Move to next promotion date (7-21 days later)
    promotionDate = new Date(promotionDate.getTime() + (7 + Math.floor(Math.random() * 14)) * 24 * 60 * 60 * 1000);
  }

  const createdPromotions = await Promotion.insertMany(promotions);
  console.log(`Created ${createdPromotions.length} promotions`);
  return createdPromotions;
};

// Create trade spends
const createTradeSpends = async (users, customers, vendors, budgets) => {
  console.log('Creating trade spends...');

  const tradeSpends = [];
  const currentDate = new Date();
  const yearStart = new Date(currentDate.getFullYear(), 0, 1);

  const spendTypes = [
    { type: 'marketing', category: 'co_op_advertising' },
    { type: 'cash_coop', category: 'volume_incentive' },
    { type: 'trading_terms', category: 'listing_fee' },
    { type: 'rebate', category: 'growth_rebate' },
    { type: 'promotion', category: 'display' }
  ];

  let spendCount = 0;

  // Create spends for each customer
  for (const customer of customers) {
    // Create 5-15 spends per customer throughout the year
    const numSpends = 5 + Math.floor(Math.random() * 10);

    for (let i = 0; i < numSpends; i++) {
      const spendType = spendTypes[Math.floor(Math.random() * spendTypes.length)];
      const spendDate = new Date(yearStart.getTime() + Math.random() * (currentDate - yearStart));

      // Determine if spend is successful
      const isSuccessful = Math.random() > 0.2; // 80% success rate

      const requestedAmount = 10000 + Math.random() * 90000;
      const approvedAmount = isSuccessful ? requestedAmount * (0.8 + Math.random() * 0.2) : requestedAmount * (0.5 + Math.random() * 0.3);
      const spentAmount = spendDate < currentDate ? approvedAmount * (0.9 + Math.random() * 0.1) : 0;

      const tradeSpend = {
        spendId: `TS-${currentDate.getFullYear()}-${String(++spendCount).padStart(4, '0')}`,
        spendType: spendType.type,
        category: spendType.category,
        status: spendDate < currentDate ? 'completed' : 'approved',
        amount: {
          requested: requestedAmount,
          approved: approvedAmount,
          spent: spentAmount,
          balance: approvedAmount - spentAmount
        },
        period: {
          startDate: spendDate,
          endDate: new Date(spendDate.getTime() + 30 * 24 * 60 * 60 * 1000)
        },
        customer: customer._id,
        vendor: spendType.type === 'marketing' ? vendors[1]._id : vendors[0]._id,
        description: `${spendType.category.replace(/_/g, ' ')} for ${customer.name}`,
        documents: ['invoice.pdf', 'agreement.pdf'],
        performance: {
          kpi: isSuccessful ? 'achieved' : 'partial',
          notes: isSuccessful ? 'All KPIs met' : 'Partial achievement of targets'
        },
        createdBy: users.find((u) => u.role === 'kam')._id,
        approvedBy: users.find((u) => u.role === 'manager')._id,
        approvalDate: new Date(spendDate.getTime() + 2 * 24 * 60 * 60 * 1000),
        approvalComments: 'Approved as per trade agreement'
      };

      // Link to budget
      if (budgets.length > 0) {
        tradeSpend.linkedBudget = budgets[0]._id;
      }

      tradeSpends.push(tradeSpend);
    }
  }

  const createdTradeSpends = await TradeSpend.insertMany(tradeSpends);
  console.log(`Created ${createdTradeSpends.length} trade spends`);
  return createdTradeSpends;
};

// Create campaigns
const createCampaigns = async (users, customers, products) => {
  console.log('Creating campaigns...');

  const campaigns = [
    {
      campaignId: 'CAMP-2024-0001',
      name: 'Back to School 2024',
      type: 'seasonal',
      status: 'completed',
      period: {
        startDate: new Date(2024, 0, 15),
        endDate: new Date(2024, 1, 28)
      },
      objectives: ['Increase stationery sales by 30%', 'Build brand awareness'],
      scope: {
        customers: customers.filter((c) => ['modern_trade', 'wholesale'].includes(c.channel)).map((c) => c._id),
        products: products.filter((p) => p.category.primary === 'Stationery').map((p) => p._id),
        channels: ['modern_trade', 'wholesale']
      },
      budget: {
        allocated: 500000,
        spent: 485000
      },
      activities: [
        {
          type: 'in_store_display',
          description: 'End-cap displays in all major stores',
          cost: 150000
        },
        {
          type: 'digital_marketing',
          description: 'Social media and online advertising',
          cost: 200000
        },
        {
          type: 'promotions',
          description: 'Bundle deals and discounts',
          cost: 135000
        }
      ],
      performance: {
        salesUplift: 28,
        reachAchieved: 85,
        roiActual: 2.3
      },
      createdBy: users.find((u) => u.role === 'manager')._id
    },
    {
      campaignId: 'CAMP-2024-0002',
      name: 'Winter DIY Campaign',
      type: 'seasonal',
      status: 'active',
      period: {
        startDate: new Date(2024, 5, 1),
        endDate: new Date(2024, 7, 31)
      },
      objectives: ['Drive DIY product sales', 'Increase market share'],
      scope: {
        customers: customers.map((c) => c._id),
        products: products.filter((p) => p.category.primary === 'DIY').map((p) => p._id),
        channels: ['modern_trade', 'wholesale', 'traditional_trade']
      },
      budget: {
        allocated: 750000,
        spent: 320000
      },
      activities: [
        {
          type: 'tv_advertising',
          description: 'Regional TV campaign',
          cost: 300000
        },
        {
          type: 'in_store_demo',
          description: 'Product demonstrations',
          cost: 100000
        }
      ],
      createdBy: users.find((u) => u.role === 'manager')._id
    }
  ];

  const createdCampaigns = await Campaign.insertMany(campaigns);
  console.log(`Created ${createdCampaigns.length} campaigns`);
  return createdCampaigns;
};

// Create master data configurations
const createMasterData = async () => {
  console.log('Creating master data configurations...');

  const masterData = [
    {
      type: 'promotion_type',
      code: 'tpr',
      name: 'Temporary Price Reduction',
      description: 'Short-term price discount',
      isActive: true
    },
    {
      type: 'promotion_type',
      code: 'display',
      name: 'In-Store Display',
      description: 'Special product display',
      isActive: true
    },
    {
      type: 'promotion_type',
      code: 'feature',
      name: 'Feature Advertisement',
      description: 'Featured in retailer advertising',
      isActive: true
    },
    {
      type: 'spend_category',
      code: 'co_op_advertising',
      name: 'Co-op Advertising',
      description: 'Shared advertising costs',
      isActive: true
    },
    {
      type: 'spend_category',
      code: 'volume_incentive',
      name: 'Volume Incentive',
      description: 'Incentives based on volume targets',
      isActive: true
    },
    {
      type: 'channel',
      code: 'modern_trade',
      name: 'Modern Trade',
      description: 'Supermarkets and hypermarkets',
      isActive: true
    },
    {
      type: 'channel',
      code: 'traditional_trade',
      name: 'Traditional Trade',
      description: 'Small shops and spaza shops',
      isActive: true
    }
  ];

  const createdMasterData = await MasterData.insertMany(masterData);
  console.log(`Created ${createdMasterData.length} master data records`);
  return createdMasterData;
};

// Update user wallets
const updateUserWallets = async (users, customers) => {
  console.log('Updating user wallets...');

  const kams = users.filter((u) => u.role === 'kam');

  for (const kam of kams) {
    const wallet = {};

    // Assign random customers to KAMs
    const assignedCustomers = customers.sort(() => 0.5 - Math.random()).slice(0, 3);

    for (const customer of assignedCustomers) {
      wallet[customer._id.toString()] = 100000 + Math.random() * 400000; // R100k - R500k per customer
    }

    await User.findByIdAndUpdate(kam._id, {
      wallet,
      assignedCustomers: assignedCustomers.map((c) => c._id)
    });
  }

  console.log('User wallets updated');
};

// Helper function to get week number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Main seeding function
const seedDatabase = async () => {
  try {
    await connectDB();
    await clearData();

    // Create data in order
    const users = await createUsers();
    const customers = await createCustomers();
    const products = await createProducts();
    const vendors = await createVendors();
    const masterData = await createMasterData();

    // Generate transactional data
    await generateSalesHistory(customers, products);
    const budgets = await createBudgets(users, customers, products);
    const promotions = await createPromotions(users, customers, products, vendors);
    const tradeSpends = await createTradeSpends(users, customers, vendors, budgets);
    const campaigns = await createCampaigns(users, customers, products);

    // Update user wallets
    await updateUserWallets(users, customers);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Customers: ${customers.length}`);
    console.log(`- Products: ${products.length}`);
    console.log(`- Vendors: ${vendors.length}`);
    console.log(`- Budgets: ${budgets.length}`);
    console.log(`- Promotions: ${promotions.length}`);
    console.log(`- Trade Spends: ${tradeSpends.length}`);
    console.log(`- Campaigns: ${campaigns.length}`);
    console.log(`- Master Data: ${masterData.length}`);

    console.log('\n🔐 Login Credentials:');
    console.log('Admin: info@vantax.co.za / Vantax1234#');
    console.log('Director: director@testco.com / Vantax1234#');
    console.log('Manager: manager@testco.com / Vantax1234#');
    console.log('KAM: kam1@testco.com / Vantax1234#');
    console.log('Analyst: analyst@testco.com / Vantax1234#');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
