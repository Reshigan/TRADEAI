#!/usr/bin/env node

/**
 * Comprehensive South African Mondelez Data Seeding Script
 * 
 * This script creates a realistic South African market dataset for Mondelez
 * with complete customer and product hierarchies, transactions, promotions,
 * and trading terms for comprehensive testing of all system capabilities.
 * 
 * Usage:
 *   node scripts/seed-mondelez-sa-data.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../backend/src/models/User');
const Company = require('../backend/src/models/Company');
const Customer = require('../backend/src/models/Customer');
const Product = require('../backend/src/models/Product');
const Promotion = require('../backend/src/models/Promotion');
const TradingTerm = require('../backend/src/models/TradingTerm');
const Transaction = require('../backend/src/models/Transaction');
const SalesHistory = require('../backend/src/models/SalesHistory');
const Budget = require('../backend/src/models/Budget');
const TradeSpend = require('../backend/src/models/TradeSpend');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.cyan}${colors.bright}${msg}${colors.reset}\n`)
};

// Helper functions
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateSKU(brand, product, variant) {
  return `${brand.substring(0, 3).toUpperCase()}-${product.substring(0, 3).toUpperCase()}-${variant}`.replace(/\s/g, '');
}

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

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/tradeai?authSource=admin';
  
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    log.success('Connected to MongoDB');
  } catch (error) {
    log.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
}

async function seedCompany() {
  log.header('Creating Mondelez South Africa Company');
  
  const companyData = {
    name: 'Mondelez South Africa (Pty) Ltd',
    code: 'MDLZ-SA',
    country: 'South Africa',
    currency: 'ZAR',
    fiscalYearStart: new Date('2024-01-01'),
    fiscalYearEnd: new Date('2024-12-31'),
    industry: 'Food & Beverage',
    address: {
      street: '6th Floor, North Wing, 90 Rivonia Road',
      city: 'Sandton',
      state: 'Gauteng',
      postalCode: '2196',
      country: 'South Africa'
    },
    contact: {
      phone: '+27 11 517 8000',
      email: 'info@mdlz.co.za',
      website: 'www.mondelezinternational.com/africa'
    },
    settings: {
      defaultCurrency: 'ZAR',
      timezone: 'Africa/Johannesburg',
      fiscalYearType: 'calendar',
      enableMultiTenant: true
    },
    status: 'active'
  };
  
  let company = await Company.findOne({ code: 'MDLZ-SA' });
  if (!company) {
    company = await Company.create(companyData);
    log.success(`Created company: ${company.name}`);
  } else {
    log.info(`Company already exists: ${company.name}`);
  }
  
  return company;
}

async function seedUsers(company) {
  log.header('Creating Mondelez South Africa Users');
  
  const users = [
    {
      firstName: 'John',
      lastName: 'van der Merwe',
      email: 'john.vandermerwe@mdlz.co.za',
      password: 'Mondelez@2024',
      role: 'admin',
      company: company._id,
      employeeId: 'MDLZ-001',
      department: 'Executive',
      position: 'Managing Director - South Africa'
    },
    {
      firstName: 'Sarah',
      lastName: 'Naidoo',
      email: 'sarah.naidoo@mdlz.co.za',
      password: 'Mondelez@2024',
      role: 'director',
      company: company._id,
      employeeId: 'MDLZ-002',
      department: 'Sales',
      position: 'Sales Director'
    },
    {
      firstName: 'Michael',
      lastName: 'Botha',
      email: 'michael.botha@mdlz.co.za',
      password: 'Mondelez@2024',
      role: 'manager',
      company: company._id,
      employeeId: 'MDLZ-003',
      department: 'Trade Marketing',
      position: 'Trade Marketing Manager'
    },
    {
      firstName: 'Thandi',
      lastName: 'Khumalo',
      email: 'thandi.khumalo@mdlz.co.za',
      password: 'Mondelez@2024',
      role: 'kam',
      company: company._id,
      employeeId: 'MDLZ-004',
      department: 'Sales',
      position: 'Key Account Manager - Shoprite'
    },
    {
      firstName: 'David',
      lastName: 'Smith',
      email: 'david.smith@mdlz.co.za',
      password: 'Mondelez@2024',
      role: 'kam',
      company: company._id,
      employeeId: 'MDLZ-005',
      department: 'Sales',
      position: 'Key Account Manager - Pick n Pay'
    }
  ];
  
  const createdUsers = [];
  for (const userData of users) {
    let user = await User.findOne({ email: userData.email });
    if (!user) {
      userData.password = await bcrypt.hash(userData.password, 12);
      user = await User.create(userData);
      log.success(`Created user: ${user.email} (${user.position})`);
    } else {
      log.info(`User already exists: ${user.email}`);
    }
    createdUsers.push(user);
  }
  
  return createdUsers;
}

async function seedCustomerHierarchy(company) {
  log.header('Creating South African Retail Customer Hierarchy');
  
  const customers = [];
  
  // Level 1: National Retailers (Top Level)
  const nationalRetailers = [
    {
      name: 'Shoprite Holdings',
      code: 'SHOPRITE',
      type: 'National Chain',
      level: 1,
      description: 'Africa\'s largest food retailer'
    },
    {
      name: 'Pick n Pay',
      code: 'PNP',
      type: 'National Chain',
      level: 1,
      description: 'Leading SA retailer'
    },
    {
      name: 'Spar Group',
      code: 'SPAR',
      type: 'National Chain',
      level: 1,
      description: 'Voluntary trading company'
    },
    {
      name: 'Woolworths',
      code: 'WOOLWORTHS',
      type: 'National Chain',
      level: 1,
      description: 'Premium retailer'
    },
    {
      name: 'Massmart (Walmart)',
      code: 'MASSMART',
      type: 'National Chain',
      level: 1,
      description: 'Wholesale and retail'
    }
  ];
  
  for (const retailerData of nationalRetailers) {
    let retailer = await Customer.findOne({ code: retailerData.code, company: company._id });
    if (!retailer) {
      retailer = await Customer.create({
        ...retailerData,
        company: company._id,
        parentId: null,
        path: retailerData.code,
        hasChildren: true,
        hierarchy: {
          level1: {
            id: retailerData.code,
            name: retailerData.name,
            code: retailerData.code
          }
        },
        contact: {
          phone: `+27 ${randomBetween(10, 89)} ${randomBetween(100, 999)} ${randomBetween(1000, 9999)}`,
          email: `accounts@${retailerData.code.toLowerCase()}.co.za`
        },
        address: {
          city: 'Johannesburg',
          state: 'Gauteng',
          country: 'South Africa'
        },
        status: 'active'
      });
      log.success(`Created Level 1 customer: ${retailer.name}`);
    }
    customers.push(retailer);
  }
  
  // Level 2: Banners/Formats
  const bannerStructure = {
    'SHOPRITE': ['Shoprite', 'Checkers', 'Usave', 'LiquorShop'],
    'PNP': ['Pick n Pay Hypermarket', 'Pick n Pay Supermarket', 'Pick n Pay Express', 'Boxer'],
    'SPAR': ['SPAR', 'KWIKSPAR', 'SUPERSPAR', 'TOPS at SPAR'],
    'WOOLWORTHS': ['Woolworths Food', 'Woolworths'],
    'MASSMART': ['Makro', 'Game', 'Builders Warehouse', 'Cambridge Food']
  };
  
  for (const [parentCode, banners] of Object.entries(bannerStructure)) {
    const parent = customers.find(c => c.code === parentCode);
    if (!parent) continue;
    
    for (const bannerName of banners) {
      const bannerCode = `${parentCode}-${bannerName.replace(/\s/g, '').toUpperCase()}`;
      let banner = await Customer.findOne({ code: bannerCode, company: company._id });
      if (!banner) {
        banner = await Customer.create({
          name: bannerName,
          code: bannerCode,
          type: 'Banner',
          level: 2,
          company: company._id,
          parentId: parent._id,
          path: `${parent.path}/${bannerCode}`,
          hasChildren: true,
          hierarchy: {
            level1: parent.hierarchy.level1,
            level2: {
              id: bannerCode,
              name: bannerName,
              code: bannerCode
            }
          },
          contact: {
            email: `${bannerName.replace(/\s/g, '').toLowerCase()}@${parentCode.toLowerCase()}.co.za`
          },
          address: {
            city: 'Johannesburg',
            state: 'Gauteng',
            country: 'South Africa'
          },
          status: 'active'
        });
        log.success(`  Created Level 2 banner: ${banner.name}`);
      }
      customers.push(banner);
    }
  }
  
  // Level 3: Regions
  const regions = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape'];
  const level2Customers = customers.filter(c => c.level === 2);
  
  for (const banner of level2Customers) {
    for (const regionName of regions) {
      const regionCode = `${banner.code}-${regionName.replace(/\s/g, '').toUpperCase()}`;
      let region = await Customer.findOne({ code: regionCode, company: company._id });
      if (!region) {
        region = await Customer.create({
          name: `${banner.name} - ${regionName}`,
          code: regionCode,
          type: 'Region',
          level: 3,
          company: company._id,
          parentId: banner._id,
          path: `${banner.path}/${regionCode}`,
          hasChildren: true,
          hierarchy: {
            level1: banner.hierarchy.level1,
            level2: banner.hierarchy.level2,
            level3: {
              id: regionCode,
              name: regionName,
              code: regionCode
            }
          },
          address: {
            state: regionName,
            country: 'South Africa'
          },
          status: 'active'
        });
        log.success(`    Created Level 3 region: ${region.name}`);
      }
      customers.push(region);
    }
  }
  
  // Level 4: Stores (sample stores for each region)
  const level3Customers = customers.filter(c => c.level === 3);
  const storeCount = 3; // Create 3 stores per region for testing
  
  for (const region of level3Customers.slice(0, 20)) { // Limit to first 20 regions for speed
    for (let i = 1; i <= storeCount; i++) {
      const storeCode = `${region.code}-ST${String(i).padStart(3, '0')}`;
      let store = await Customer.findOne({ code: storeCode, company: company._id });
      if (!store) {
        store = await Customer.create({
          name: `${region.hierarchy.level2.name} Store ${i} - ${region.hierarchy.level3.name}`,
          code: storeCode,
          type: 'Store',
          level: 4,
          company: company._id,
          parentId: region._id,
          path: `${region.path}/${storeCode}`,
          hasChildren: false,
          hierarchy: {
            level1: region.hierarchy.level1,
            level2: region.hierarchy.level2,
            level3: region.hierarchy.level3,
            level4: {
              id: storeCode,
              name: `Store ${i}`,
              code: storeCode
            }
          },
          contact: {
            phone: `+27 ${randomBetween(10, 89)} ${randomBetween(100, 999)} ${randomBetween(1000, 9999)}`,
            email: `store${i}.${region.code.toLowerCase()}@retailer.co.za`
          },
          address: {
            street: `${randomBetween(1, 999)} Main Road`,
            city: region.hierarchy.level3.name,
            state: region.hierarchy.level3.name,
            postalCode: String(randomBetween(1000, 9999)),
            country: 'South Africa'
          },
          storeMetrics: {
            size: randomBetween(500, 5000),
            aisles: randomBetween(10, 40),
            checkouts: randomBetween(6, 24),
            footfallPerDay: randomBetween(1000, 15000)
          },
          status: 'active'
        });
        if (i === 1) log.success(`      Created Level 4 stores for: ${region.name}`);
      }
      customers.push(store);
    }
  }
  
  log.info(`Total customers created: ${customers.length}`);
  return customers;
}

async function seedProductHierarchy(company) {
  log.header('Creating Mondelez Product Hierarchy');
  
  const products = [];
  
  // Level 1: Category
  const categories = [
    { name: 'Biscuits', code: 'BISCUITS', description: 'Sweet and savoury biscuits' },
    { name: 'Chocolate', code: 'CHOCOLATE', description: 'Chocolate bars and tablets' },
    { name: 'Gum & Candy', code: 'GUMCANDY', description: 'Chewing gum and candy' }
  ];
  
  for (const catData of categories) {
    let category = await Product.findOne({ sku: catData.code, company: company._id });
    if (!category) {
      category = await Product.create({
        name: catData.name,
        sku: catData.code,
        sapMaterialId: `SAP-${catData.code}`,
        description: catData.description,
        type: 'Category',
        level: 1,
        company: company._id,
        parentId: null,
        path: catData.code,
        hasChildren: true,
        hierarchy: {
          level1: {
            id: catData.code,
            name: catData.name,
            code: catData.code,
            description: catData.description
          }
        },
        status: 'active'
      });
      log.success(`Created Level 1 category: ${category.name}`);
    }
    products.push(category);
  }
  
  // Level 2: Brands
  const brandStructure = {
    'BISCUITS': [
      { name: 'Oreo', code: 'OREO' },
      { name: 'Bakers', code: 'BAKERS' },
      { name: 'Provita', code: 'PROVITA' }
    ],
    'CHOCOLATE': [
      { name: 'Cadbury Dairy Milk', code: 'CDM' },
      { name: 'Lunch Bar', code: 'LUNCHBAR' },
      { name: 'PS', code: 'PS' }
    ],
    'GUMCANDY': [
      { name: 'Halls', code: 'HALLS' },
      { name: 'Stimorol', code: 'STIMOROL' },
      { name: 'Dentyne', code: 'DENTYNE' }
    ]
  };
  
  for (const [catCode, brands] of Object.entries(brandStructure)) {
    const category = products.find(p => p.sku === catCode);
    if (!category) continue;
    
    for (const brandData of brands) {
      const brandCode = `${catCode}-${brandData.code}`;
      let brand = await Product.findOne({ sku: brandCode, company: company._id });
      if (!brand) {
        brand = await Product.create({
          name: brandData.name,
          sku: brandCode,
          sapMaterialId: `SAP-${brandCode}`,
          description: `${brandData.name} brand`,
          type: 'Brand',
          level: 2,
          company: company._id,
          parentId: category._id,
          path: `${category.path}/${brandCode}`,
          hasChildren: true,
          hierarchy: {
            level1: category.hierarchy.level1,
            level2: {
              id: brandCode,
              name: brandData.name,
              code: brandData.code,
              description: `${brandData.name} brand`
            }
          },
          status: 'active'
        });
        log.success(`  Created Level 2 brand: ${brand.name}`);
      }
      products.push(brand);
    }
  }
  
  // Level 3: Product Lines / Variants
  const productLines = {
    'BISCUITS-OREO': [
      { name: 'Oreo Original', variants: ['Regular', 'Family Pack', 'Snack Pack'] },
      { name: 'Oreo Golden', variants: ['Regular', 'Family Pack'] },
      { name: 'Oreo Thin', variants: ['Original', 'Chocolate'] }
    ],
    'BISCUITS-BAKERS': [
      { name: 'Tennis Biscuits', variants: ['Regular', 'Chocolate', 'Coconut'] },
      { name: 'Romany Creams', variants: ['Original', 'Choc-Mint'] },
      { name: 'Eet-Sum-Mor', variants: ['Original', 'Lemon'] }
    ],
    'CHOCOLATE-CDM': [
      { name: 'Dairy Milk', variants: ['80g', '150g', '300g'] },
      { name: 'Dairy Milk Wholenut', variants: ['80g', '150g'] },
      { name: 'Dairy Milk Top Deck', variants: ['80g', '150g'] }
    ],
    'CHOCOLATE-LUNCHBAR': [
      { name: 'Lunch Bar Original', variants: ['48g', '62g'] },
      { name: 'Lunch Bar Peanut', variants: ['48g', '62g'] }
    ],
    'GUMCANDY-HALLS': [
      { name: 'Halls Mentho-Lyptus', variants: ['33.5g', '50g'] },
      { name: 'Halls Soothers', variants: ['33.5g'] }
    ]
  };
  
  for (const [brandCode, lines] of Object.entries(productLines)) {
    const brand = products.find(p => p.sku === brandCode);
    if (!brand) continue;
    
    for (const lineData of lines) {
      for (const variant of lineData.variants) {
        const sku = generateSKU(brand.name, lineData.name, variant);
        let product = await Product.findOne({ sku, company: company._id });
        if (!product) {
          const price = randomFloat(5, 50, 2);
          product = await Product.create({
            name: `${lineData.name} ${variant}`,
            sku,
            sapMaterialId: `SAP-${sku}`,
            barcode: `600${randomBetween(1000000, 9999999)}`,
            description: `${lineData.name} ${variant}`,
            type: 'SKU',
            level: 3,
            company: company._id,
            parentId: brand._id,
            path: `${brand.path}/${sku}`,
            hasChildren: false,
            hierarchy: {
              level1: brand.hierarchy.level1,
              level2: brand.hierarchy.level2,
              level3: {
                id: sku,
                name: `${lineData.name} ${variant}`,
                code: sku,
                description: `${lineData.name} ${variant}`
              }
            },
            pricing: {
              basePrice: price,
              currency: 'ZAR',
              unitOfMeasure: 'EA',
              costPrice: price * 0.6,
              recommendedRetailPrice: price * 1.3
            },
            packageInfo: {
              weight: randomFloat(50, 500, 0),
              dimensions: {
                length: randomFloat(10, 30, 1),
                width: randomFloat(5, 20, 1),
                height: randomFloat(2, 15, 1)
              },
              unitsPerCase: randomBetween(12, 48)
            },
            status: 'active'
          });
          if (lineData.variants.indexOf(variant) === 0) {
            log.success(`    Created Level 3 product: ${product.name}`);
          }
        }
        products.push(product);
      }
    }
  }
  
  log.info(`Total products created: ${products.length}`);
  return products;
}

async function seedPromotions(company, customers, products) {
  log.header('Creating Promotions with Hierarchy Assignments');
  
  const promotions = [];
  const startDate = new Date('2024-01-01');
  const skuProducts = products.filter(p => p.type === 'SKU');
  const level1Customers = customers.filter(c => c.level === 1);
  
  // Create 10 promotions across different hierarchy levels
  for (let i = 1; i <= 10; i++) {
    const promoStart = addMonths(startDate, i - 1);
    const promoEnd = addDays(promoStart, 28); // 4 weeks
    
    const selectedProducts = skuProducts.slice((i - 1) * 3, i * 3);
    const selectedCustomer = level1Customers[i % level1Customers.length];
    
    const promotionData = {
      company: company._id,
      promotionId: `PROMO-2024-${String(i).padStart(3, '0')}`,
      name: `Q${Math.ceil(i / 3)} Promotion ${i} - ${selectedProducts[0]?.hierarchy.level2.name}`,
      description: `Promotional campaign for ${selectedProducts[0]?.hierarchy.level2.name} products`,
      promotionType: i % 3 === 0 ? 'price_discount' : i % 3 === 1 ? 'volume_discount' : 'bogo',
      mechanics: {
        discountType: 'percentage',
        discountValue: randomFloat(10, 30, 0),
        minimumPurchase: randomBetween(5, 20)
      },
      period: {
        startDate: promoStart,
        endDate: promoEnd,
        sellInStartDate: addDays(promoStart, -14),
        sellInEndDate: addDays(promoStart, -1)
      },
      scope: {
        customers: [{ customer: selectedCustomer._id }],
        customerHierarchy: [{
          level: 1,
          value: selectedCustomer.code
        }]
      },
      products: selectedProducts.map(p => ({
        product: p._id,
        regularPrice: p.pricing.basePrice,
        promotionalPrice: p.pricing.basePrice * 0.8,
        expectedLift: randomFloat(20, 50, 1)
      })),
      productHierarchy: [{
        level: 2,
        value: selectedProducts[0]?.hierarchy.level2.code
      }],
      financial: {
        planned: {
          baselineVolume: randomBetween(10000, 50000),
          promotionalVolume: randomBetween(15000, 75000),
          incrementalVolume: randomBetween(5000, 25000),
          volumeLift: randomFloat(20, 50, 1),
          baselineRevenue: randomFloat(500000, 2500000, 2),
          promotionalRevenue: randomFloat(750000, 3750000, 2)
        },
        costs: {
          discountCost: randomFloat(50000, 250000, 2),
          marketingCost: randomFloat(20000, 100000, 2),
          cashCoopCost: randomFloat(10000, 50000, 2)
        }
      },
      status: 'active'
    };
    
    let promotion = await Promotion.findOne({ promotionId: promotionData.promotionId });
    if (!promotion) {
      promotion = await Promotion.create(promotionData);
      log.success(`Created promotion: ${promotion.name}`);
    }
    promotions.push(promotion);
  }
  
  log.info(`Total promotions created: ${promotions.length}`);
  return promotions;
}

async function seedTradingTerms(company, customers, products) {
  log.header('Creating Trading Terms with Volume/Revenue Allocation');
  
  const tradingTerms = [];
  const level1Customers = customers.filter(c => c.level === 1);
  const brands = products.filter(p => p.level === 2);
  
  // Create trading terms for each major customer at different levels
  for (const customer of level1Customers) {
    for (let i = 0; i < 3; i++) {
      const brand = brands[i % brands.length];
      
      const termData = {
        company: company._id,
        termId: `TERM-${customer.code}-${brand.sku}-${i + 1}`,
        name: `Annual Trading Terms - ${customer.name} - ${brand.name}`,
        description: `Trading terms and rebates for ${brand.name} products`,
        customer: customer._id,
        customerHierarchy: [{
          level: 1,
          value: customer.code
        }],
        products: [{
          product: brand._id,
          allocation: 'proportional'
        }],
        productHierarchy: [{
          level: 2,
          value: brand.sku
        }],
        terms: {
          paymentTerms: randomBetween(30, 90),
          discountPercentage: randomFloat(2, 8, 2),
          volumeRebate: {
            enabled: true,
            tiers: [
              { threshold: 100000, rebatePercentage: 2 },
              { threshold: 500000, rebatePercentage: 3.5 },
              { threshold: 1000000, rebatePercentage: 5 }
            ],
            allocationType: 'volume' // or 'revenue'
          },
          growthIncentive: {
            enabled: true,
            targetGrowth: randomFloat(5, 15, 1),
            bonusPercentage: randomFloat(1, 3, 1),
            allocationType: 'revenue'
          }
        },
        period: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31')
        },
        financial: {
          plannedVolume: randomBetween(100000, 1000000),
          plannedRevenue: randomFloat(5000000, 50000000, 2),
          actualVolume: randomBetween(90000, 1100000),
          actualRevenue: randomFloat(4500000, 55000000, 2)
        },
        status: 'active'
      };
      
      let term = await TradingTerm.findOne({ termId: termData.termId });
      if (!term) {
        term = await TradingTerm.create(termData);
        log.success(`Created trading term: ${term.name}`);
      }
      tradingTerms.push(term);
    }
  }
  
  log.info(`Total trading terms created: ${tradingTerms.length}`);
  return tradingTerms;
}

async function seedTransactions(company, customers, products, promotions) {
  log.header('Creating Sales Transactions for Testing');
  
  const transactions = [];
  const stores = customers.filter(c => c.level === 4);
  const skuProducts = products.filter(p => p.type === 'SKU');
  
  // Create 6 months of daily transactions for a subset of stores
  const testStores = stores.slice(0, 20); // Use first 20 stores
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-06-30');
  
  log.info(`Generating transactions from ${startDate.toDateString()} to ${endDate.toDateString()}`);
  log.info(`For ${testStores.length} stores with ${skuProducts.length} products`);
  
  let transactionCount = 0;
  const batchSize = 50;
  let batch = [];
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
    // Weekly transactions for performance
    for (const store of testStores) {
      // Each store sells 10-20 random products per week
      const productsToSell = randomBetween(10, 20);
      
      for (let p = 0; p < productsToSell; p++) {
        const product = skuProducts[randomBetween(0, skuProducts.length - 1)];
        const quantity = randomBetween(10, 200);
        const unitPrice = product.pricing.basePrice;
        const totalAmount = quantity * unitPrice;
        
        // Check if product is in active promotion
        const activePromo = promotions.find(promo => 
          promo.period.startDate <= d && 
          promo.period.endDate >= d &&
          promo.products.some(pp => pp.product.toString() === product._id.toString())
        );
        
        const discount = activePromo ? totalAmount * 0.15 : 0;
        
        const transactionData = {
          company: company._id,
          transactionId: `TXN-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${String(transactionCount).padStart(6, '0')}`,
          transactionDate: new Date(d),
          customer: store._id,
          customerHierarchy: store.hierarchy,
          product: product._id,
          productHierarchy: product.hierarchy,
          quantity,
          unitPrice,
          totalAmount,
          discount,
          netAmount: totalAmount - discount,
          promotion: activePromo?._id,
          type: 'sale',
          status: 'completed',
          metadata: {
            channel: 'POS',
            storeId: store.code,
            invoiceNumber: `INV-${transactionCount}`
          }
        };
        
        batch.push(transactionData);
        transactionCount++;
        
        // Insert in batches for performance
        if (batch.length >= batchSize) {
          await Transaction.insertMany(batch);
          batch = [];
          if (transactionCount % 500 === 0) {
            log.info(`  Generated ${transactionCount} transactions...`);
          }
        }
      }
    }
  }
  
  // Insert remaining batch
  if (batch.length > 0) {
    await Transaction.insertMany(batch);
  }
  
  log.success(`Total transactions created: ${transactionCount}`);
  return transactionCount;
}

async function seedSalesHistory(company, customers, products) {
  log.header('Creating Historical Sales Data for AI/Simulations');
  
  const stores = customers.filter(c => c.level === 4).slice(0, 20);
  const skuProducts = products.filter(p => p.type === 'SKU');
  
  log.info('Generating 12 months of aggregated sales history...');
  
  const startDate = new Date('2023-01-01');
  const endDate = new Date('2023-12-31');
  
  let historyCount = 0;
  const batch = [];
  
  for (const store of stores) {
    for (const product of skuProducts) {
      // Monthly aggregated data for each store-product combination
      for (let m = 0; m < 12; m++) {
        const monthDate = new Date(startDate);
        monthDate.setMonth(m);
        
        const baseVolume = randomBetween(100, 1000);
        const seasonalFactor = 1 + Math.sin(m * Math.PI / 6) * 0.3; // Seasonal variation
        const volume = Math.round(baseVolume * seasonalFactor);
        const revenue = volume * product.pricing.basePrice;
        
        const historyData = {
          company: company._id,
          period: {
            year: 2023,
            month: m + 1,
            week: null,
            startDate: monthDate,
            endDate: new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
          },
          customer: store._id,
          customerHierarchy: store.hierarchy,
          product: product._id,
          productHierarchy: product.hierarchy,
          metrics: {
            volume,
            revenue,
            averagePrice: product.pricing.basePrice,
            transactions: randomBetween(20, 100),
            uniqueCustomers: randomBetween(15, 80)
          },
          inventory: {
            openingStock: randomBetween(50, 500),
            closingStock: randomBetween(50, 500),
            receipts: randomBetween(100, 1000)
          }
        };
        
        batch.push(historyData);
        historyCount++;
      }
    }
  }
  
  // Insert all history records
  if (batch.length > 0) {
    await SalesHistory.insertMany(batch);
  }
  
  log.success(`Total sales history records created: ${historyCount}`);
  return historyCount;
}

async function seedBudgets(company, products) {
  log.header('Creating Marketing Budgets');
  
  const brands = products.filter(p => p.level === 2);
  const categories = products.filter(p => p.level === 1);
  
  const budgets = [];
  
  // Annual budgets for each category
  for (const category of categories) {
    const totalBudget = randomFloat(5000000, 20000000, 2);
    
    const budgetData = {
      company: company._id,
      name: `2024 Marketing Budget - ${category.name}`,
      description: `Annual marketing and trade spend budget for ${category.name}`,
      period: {
        year: 2024,
        quarter: null,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      },
      productHierarchy: [{
        level: 1,
        value: category.sku
      }],
      allocation: {
        total: totalBudget,
        promotions: totalBudget * 0.4,
        tradeMarketing: totalBudget * 0.3,
        brandSupport: totalBudget * 0.2,
        other: totalBudget * 0.1
      },
      spent: {
        promotions: totalBudget * 0.4 * randomFloat(0.5, 0.9, 2),
        tradeMarketing: totalBudget * 0.3 * randomFloat(0.5, 0.9, 2),
        brandSupport: totalBudget * 0.2 * randomFloat(0.5, 0.9, 2),
        other: totalBudget * 0.1 * randomFloat(0.5, 0.9, 2)
      },
      status: 'active'
    };
    
    let budget = await Budget.findOne({ 
      name: budgetData.name,
      company: company._id 
    });
    
    if (!budget) {
      budget = await Budget.create(budgetData);
      log.success(`Created budget: ${budget.name}`);
    }
    budgets.push(budget);
  }
  
  log.info(`Total budgets created: ${budgets.length}`);
  return budgets;
}

// Main seeding function
async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  Mondelez South Africa Comprehensive Data Seeding             ║
║  Creating realistic SA market data for full system testing    ║
╚════════════════════════════════════════════════════════════════╝
  `);
  
  try {
    await connectDB();
    
    const company = await seedCompany();
    const users = await seedUsers(company);
    const customers = await seedCustomerHierarchy(company);
    const products = await seedProductHierarchy(company);
    const promotions = await seedPromotions(company, customers, products);
    const tradingTerms = await seedTradingTerms(company, customers, products);
    const transactionCount = await seedTransactions(company, customers, products, promotions);
    const historyCount = await seedSalesHistory(company, customers, products);
    const budgets = await seedBudgets(company, products);
    
    log.header('╔════════════════════════════════════════════════════════════╗');
    log.header('║                    SEEDING SUMMARY                         ║');
    log.header('╚════════════════════════════════════════════════════════════╝');
    log.success(`Company: 1 (Mondelez SA)`);
    log.success(`Users: ${users.length}`);
    log.success(`Customers (all hierarchy levels): ${customers.length}`);
    log.success(`  - Level 1 (National): ${customers.filter(c => c.level === 1).length}`);
    log.success(`  - Level 2 (Banners): ${customers.filter(c => c.level === 2).length}`);
    log.success(`  - Level 3 (Regions): ${customers.filter(c => c.level === 3).length}`);
    log.success(`  - Level 4 (Stores): ${customers.filter(c => c.level === 4).length}`);
    log.success(`Products (all hierarchy levels): ${products.length}`);
    log.success(`  - Level 1 (Categories): ${products.filter(p => p.level === 1).length}`);
    log.success(`  - Level 2 (Brands): ${products.filter(p => p.level === 2).length}`);
    log.success(`  - Level 3 (SKUs): ${products.filter(p => p.level === 3).length}`);
    log.success(`Promotions: ${promotions.length}`);
    log.success(`Trading Terms: ${tradingTerms.length}`);
    log.success(`Transactions: ${transactionCount}`);
    log.success(`Sales History Records: ${historyCount}`);
    log.success(`Budgets: ${budgets.length}`);
    
    const totalRecords = 1 + users.length + customers.length + products.length + 
                         promotions.length + tradingTerms.length + transactionCount + 
                         historyCount + budgets.length;
    
    log.header(`\nTotal Records Created: ${totalRecords.toLocaleString()}`);
    
    log.header('╔════════════════════════════════════════════════════════════╗');
    log.header('║                    TESTING CAPABILITIES                    ║');
    log.header('╚════════════════════════════════════════════════════════════╝');
    log.info('✓ Customer Hierarchy: 4 levels with materialized paths');
    log.info('✓ Product Hierarchy: 3 levels (Category → Brand → SKU)');
    log.info('✓ Hierarchy-based Promotions: Assigned at brand/customer levels');
    log.info('✓ Trading Terms: Volume and revenue-based allocation');
    log.info('✓ Transactions: 6 months of sales data');
    log.info('✓ Historical Data: 12 months for AI/forecasting');
    log.info('✓ Budgets: Category-level marketing budgets');
    log.info('✓ Proportional Allocation: Ready for testing');
    
    log.header('Next Steps');
    log.info('1. Run comprehensive tests: npm test');
    log.info('2. Start the application: ./scripts/start-production.sh');
    log.info('3. Login with: john.vandermerwe@mdlz.co.za / Mondelez@2024');
    log.info('4. Test hierarchy selections in UI');
    log.info('5. Run AI simulations and calculations');
    
    log.success('\n✓ Mondelez SA data seeding completed successfully!\n');
    
  } catch (error) {
    log.error(`Seeding failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    log.info('Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };
