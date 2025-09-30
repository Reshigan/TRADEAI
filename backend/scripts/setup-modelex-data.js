#!/usr/bin/env node

/**
 * MODELEX SOUTH AFRICA - FMCG DATA SETUP
 * Creates comprehensive 2-year FMCG dataset for R5 billion annual sales
 * Based on realistic South African retail market patterns
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/trade-ai', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Import models
const Company = require('../src/models/Company');
const User = require('../src/models/User');
const Customer = require('../src/models/Customer');
const Product = require('../src/models/Product');
const Budget = require('../src/models/Budget');

class ModelexDataGenerator {
  constructor() {
    this.company = null;
    this.users = [];
    this.customers = [];
    this.products = [];
    this.categories = [
      'Beverages', 'Dairy', 'Bakery', 'Snacks', 'Frozen Foods',
      'Personal Care', 'Household', 'Health & Wellness', 'Baby Care', 'Pet Food'
    ];
    this.retailers = [
      'Shoprite', 'Pick n Pay', 'Spar', 'Woolworths', 'Checkers',
      'OK Foods', 'Food Lover\'s Market', 'Makro', 'Game', 'Cambridge Food'
    ];
    this.regions = [
      'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
      'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'
    ];
  }

  async setupModelexCompany() {
    console.log('🏢 Creating Modelex South Africa company...');
    
    this.company = await Company.create({
      name: 'Modelex South Africa (Pty) Ltd',
      code: 'MODELEX_SA',
      domain: 'modelex.co.za',
      industry: 'fmcg',
      country: 'ZA',
      currency: 'ZAR',
      timezone: 'Africa/Johannesburg',
      fiscalYearStart: new Date('2023-01-01'),
      
      address: {
        street: '123 Sandton Drive',
        city: 'Sandton',
        state: 'Gauteng',
        postalCode: '2196',
        country: 'South Africa'
      },
      
      contact: {
        phone: '+27 11 123 4567',
        email: 'info@modelex.co.za',
        website: 'https://www.modelex.co.za'
      },
      
      settings: {
        language: 'en-ZA',
        dateFormat: 'DD/MM/YYYY',
        numberFormat: 'en-ZA',
        features: {
          aiPredictions: true,
          advancedAnalytics: true,
          multiCurrency: false,
          auditTrail: true
        }
      },
      
      businessMetrics: {
        annualRevenue: 5000000000, // R5 billion
        employeeCount: 2500,
        marketShare: 12.5,
        growthRate: 8.2
      }
    });

    console.log(`✅ Company created: ${this.company.name} (ID: ${this.company._id})`);
    return this.company;
  }

  async createUsers() {
    console.log('👥 Creating user accounts...');
    
    const userProfiles = [
      {
        firstName: 'Thabo',
        lastName: 'Mthembu',
        email: 'thabo.mthembu@modelex.co.za',
        employeeId: 'EMP001',
        role: 'admin',
        department: 'admin',
        title: 'Managing Director',
        phone: '+27 82 123 4567'
      },
      {
        firstName: 'Sarah',
        lastName: 'van der Merwe',
        email: 'sarah.vandermerwe@modelex.co.za',
        employeeId: 'EMP002',
        role: 'manager',
        department: 'marketing',
        title: 'Trade Marketing Director',
        phone: '+27 83 234 5678'
      },
      {
        firstName: 'Nomsa',
        lastName: 'Dlamini',
        email: 'nomsa.dlamini@modelex.co.za',
        employeeId: 'EMP003',
        role: 'manager',
        department: 'sales',
        title: 'National Sales Manager',
        phone: '+27 84 345 6789'
      },
      {
        firstName: 'Johan',
        lastName: 'Pretorius',
        email: 'johan.pretorius@modelex.co.za',
        employeeId: 'EMP004',
        role: 'kam',
        department: 'sales',
        title: 'Key Account Manager - Shoprite',
        phone: '+27 85 456 7890'
      },
      {
        firstName: 'Lerato',
        lastName: 'Mokwena',
        email: 'lerato.mokwena@modelex.co.za',
        employeeId: 'EMP005',
        role: 'kam',
        department: 'sales',
        title: 'Key Account Manager - Pick n Pay',
        phone: '+27 86 567 8901'
      },
      {
        firstName: 'David',
        lastName: 'Chen',
        email: 'david.chen@modelex.co.za',
        employeeId: 'EMP006',
        role: 'analyst',
        department: 'marketing',
        title: 'Senior Data Analyst',
        phone: '+27 87 678 9012'
      },
      {
        firstName: 'Zanele',
        lastName: 'Ndaba',
        email: 'zanele.ndaba@modelex.co.za',
        employeeId: 'EMP007',
        role: 'user',
        department: 'sales',
        title: 'Regional Sales Representative - Gauteng',
        phone: '+27 88 789 0123'
      },
      {
        firstName: 'Michael',
        lastName: 'O\'Brien',
        email: 'michael.obrien@modelex.co.za',
        employeeId: 'EMP008',
        role: 'user',
        department: 'sales',
        title: 'Regional Sales Representative - Western Cape',
        phone: '+27 89 890 1234'
      }
    ];

    for (const profile of userProfiles) {
      const hashedPassword = await bcrypt.hash('Modelex2024!', 10);
      
      const user = await User.create({
        ...profile,
        companyId: this.company._id,
        password: hashedPassword,
        isActive: true,
        lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        preferences: {
          theme: 'light',
          language: 'en-ZA',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        },
        permissions: this.getUserPermissions(profile.role)
      });

      this.users.push(user);
      console.log(`✅ User created: ${user.firstName} ${user.lastName} (${user.role})`);
    }

    return this.users;
  }

  getUserPermissions(role) {
    const permissions = {
      admin: {
        dashboard: ['read', 'write', 'delete'],
        budget: ['read', 'write', 'delete', 'approve'],
        promotion: ['read', 'write', 'delete', 'approve'],
        customer: ['read', 'write', 'delete'],
        product: ['read', 'write', 'delete'],
        user: ['read', 'write', 'delete'],
        report: ['read', 'write', 'export'],
        analytics: ['read', 'write']
      },
      manager: {
        dashboard: ['read', 'write'],
        budget: ['read', 'write', 'approve'],
        promotion: ['read', 'write', 'approve'],
        customer: ['read', 'write'],
        product: ['read', 'write'],
        user: ['read'],
        report: ['read', 'write', 'export'],
        analytics: ['read', 'write']
      },
      kam: {
        dashboard: ['read'],
        budget: ['read'],
        promotion: ['read', 'write'],
        customer: ['read', 'write'],
        product: ['read'],
        user: ['read'],
        report: ['read', 'export'],
        analytics: ['read']
      },
      analyst: {
        dashboard: ['read', 'write'],
        budget: ['read'],
        promotion: ['read'],
        customer: ['read'],
        product: ['read'],
        user: ['read'],
        report: ['read', 'write', 'export'],
        analytics: ['read', 'write']
      },
      field_rep: {
        dashboard: ['read'],
        budget: ['read'],
        promotion: ['read'],
        customer: ['read'],
        product: ['read'],
        user: ['read'],
        report: ['read'],
        analytics: ['read']
      }
    };

    return permissions[role] || permissions.field_rep;
  }

  async createCustomers() {
    console.log('🏪 Creating customer accounts...');
    
    const customerData = [
      {
        name: 'Shoprite Holdings Ltd',
        code: 'SHOPRITE',
        sapCustomerId: 'SAP001',
        customerType: 'chain',
        channel: 'modern_trade',
        tier: 'platinum',
        stores: 2800,
        annualVolume: 1200000000, // R1.2B
        regions: ['National']
      },
      {
        name: 'Pick n Pay Stores Ltd',
        code: 'PNP',
        sapCustomerId: 'SAP002',
        customerType: 'chain',
        channel: 'modern_trade',
        tier: 'platinum',
        stores: 1900,
        annualVolume: 950000000, // R950M
        regions: ['National']
      },
      {
        name: 'SPAR Group Ltd',
        code: 'SPAR',
        sapCustomerId: 'SAP003',
        customerType: 'chain',
        channel: 'modern_trade',
        tier: 'gold',
        stores: 900,
        annualVolume: 800000000, // R800M
        regions: ['National']
      },
      {
        name: 'Woolworths Holdings Ltd',
        code: 'WOOLWORTHS',
        sapCustomerId: 'SAP004',
        customerType: 'chain',
        channel: 'modern_trade',
        tier: 'gold',
        stores: 400,
        annualVolume: 650000000, // R650M
        regions: ['National']
      },
      {
        name: 'Checkers (Shoprite)',
        code: 'CHECKERS',
        sapCustomerId: 'SAP005',
        customerType: 'chain',
        channel: 'modern_trade',
        tier: 'gold',
        stores: 240,
        annualVolume: 580000000, // R580M
        regions: ['National']
      },
      {
        name: 'OK Foods',
        code: 'OK_FOODS',
        sapCustomerId: 'SAP006',
        customerType: 'retailer',
        channel: 'traditional_trade',
        tier: 'silver',
        stores: 400,
        annualVolume: 320000000, // R320M
        regions: ['Gauteng', 'Free State', 'North West']
      },
      {
        name: 'Food Lover\'s Market',
        code: 'FLM',
        sapCustomerId: 'SAP007',
        customerType: 'retailer',
        channel: 'modern_trade',
        tier: 'silver',
        stores: 180,
        annualVolume: 280000000, // R280M
        regions: ['Western Cape', 'Gauteng', 'KwaZulu-Natal']
      },
      {
        name: 'Makro (Massmart)',
        code: 'MAKRO',
        sapCustomerId: 'SAP008',
        customerType: 'wholesaler',
        channel: 'b2b',
        tier: 'silver',
        stores: 22,
        annualVolume: 220000000, // R220M
        regions: ['National']
      }
    ];

    for (const customerInfo of customerData) {
      const customer = await Customer.create({
        company: this.company._id,
        sapCustomerId: customerInfo.sapCustomerId,
        name: customerInfo.name,
        code: customerInfo.code,
        customerType: customerInfo.customerType,
        channel: customerInfo.channel,
        tier: customerInfo.tier,
        status: 'active',
        
        hierarchy: {
          level1: {
            id: 'L1_001',
            name: 'National Accounts',
            code: 'NAT'
          },
          level2: {
            id: 'L2_001',
            name: customerInfo.tier === 'platinum' ? 'Major Chains' : 'Regional Chains',
            code: customerInfo.tier === 'platinum' ? 'MAJ' : 'REG'
          },
          level3: {
            id: 'L3_001',
            name: customerInfo.customerType === 'wholesaler' ? 'Wholesale' : 'Retail',
            code: customerInfo.customerType === 'wholesaler' ? 'WHO' : 'RET'
          }
        },

        contacts: [{
          name: this.generateRandomName(),
          position: 'Buyer',
          email: this.generateRandomEmail(),
          phone: this.generateRandomPhone(),
          isPrimary: true
        }],

        addresses: [{
          type: 'both',
          street: this.generateRandomAddress(),
          city: this.generateRandomCity(),
          state: this.regions[Math.floor(Math.random() * this.regions.length)],
          postalCode: (Math.floor(Math.random() * 9000) + 1000).toString(),
          country: 'South Africa'
        }],

        businessInfo: {
          industry: 'Retail',
          annualRevenue: customerInfo.annualVolume,
          employeeCount: customerInfo.stores * 25,
          storeCount: customerInfo.stores,
          regions: customerInfo.regions
        },

        tradingTerms: {
          paymentTerms: ['30 days', '45 days', '60 days'][Math.floor(Math.random() * 3)],
          creditLimit: customerInfo.annualVolume * 0.1,
          discount: Math.round((Math.random() * 6 + 2) * 10) / 10,
          rebate: Math.round((Math.random() * 4 + 1) * 10) / 10
        },

        performance: {
          lastOrderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          totalOrders: Math.floor(Math.random() * 400) + 100,
          averageOrderValue: customerInfo.annualVolume / 365,
          lifetimeValue: customerInfo.annualVolume * 2
        }
      });

      this.customers.push(customer);
      console.log(`✅ Customer created: ${customer.name} (${customer.code})`);
    }

    return this.customers;
  }

  generateRandomName() {
    const firstNames = ['John', 'Sarah', 'Michael', 'Lisa', 'David', 'Emma', 'James', 'Sophie', 'Robert', 'Anna'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  }

  generateRandomEmail() {
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.co.za'];
    const username = Math.random().toString(36).substring(2, 8);
    return `${username}@${domains[Math.floor(Math.random() * domains.length)]}`;
  }

  generateRandomPhone() {
    return `+27 ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`;
  }

  generateRandomAddress() {
    const streets = ['Main Road', 'Church Street', 'Market Street', 'Oak Avenue', 'Park Lane'];
    const number = Math.floor(Math.random() * 999) + 1;
    return `${number} ${streets[Math.floor(Math.random() * streets.length)]}`;
  }

  generateRandomCity() {
    const cities = ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein'];
    return cities[Math.floor(Math.random() * cities.length)];
  }

  async createProducts() {
    console.log('📦 Creating product catalog...');
    
    const productsByCategory = {
      'Beverages': [
        { name: 'Premium Cola 330ml', brand: 'Modelex Cola', price: 12.99, cost: 6.50 },
        { name: 'Orange Juice 1L', brand: 'Fresh Valley', price: 24.99, cost: 15.00 },
        { name: 'Energy Drink 250ml', brand: 'Power Boost', price: 18.99, cost: 9.50 },
        { name: 'Sparkling Water 500ml', brand: 'Crystal Springs', price: 8.99, cost: 4.50 },
        { name: 'Iced Tea 500ml', brand: 'Garden Fresh', price: 14.99, cost: 8.00 }
      ],
      'Dairy': [
        { name: 'Full Cream Milk 1L', brand: 'Farm Fresh', price: 16.99, cost: 12.00 },
        { name: 'Greek Yogurt 500g', brand: 'Creamy Delight', price: 32.99, cost: 18.00 },
        { name: 'Cheddar Cheese 200g', brand: 'Golden Valley', price: 45.99, cost: 28.00 },
        { name: 'Butter 500g', brand: 'Country Fresh', price: 52.99, cost: 35.00 },
        { name: 'Cream Cheese 230g', brand: 'Smooth & Rich', price: 28.99, cost: 16.00 }
      ],
      'Snacks': [
        { name: 'Potato Chips 150g', brand: 'Crispy Crunch', price: 22.99, cost: 12.00 },
        { name: 'Chocolate Bar 80g', brand: 'Sweet Dreams', price: 15.99, cost: 8.00 },
        { name: 'Nuts Mix 200g', brand: 'Healthy Bites', price: 35.99, cost: 20.00 },
        { name: 'Biscuits 200g', brand: 'Tea Time', price: 18.99, cost: 10.00 },
        { name: 'Popcorn 100g', brand: 'Movie Night', price: 12.99, cost: 6.50 }
      ],
      'Personal Care': [
        { name: 'Shampoo 400ml', brand: 'Silky Hair', price: 45.99, cost: 25.00 },
        { name: 'Body Wash 500ml', brand: 'Fresh Clean', price: 38.99, cost: 22.00 },
        { name: 'Toothpaste 100ml', brand: 'Bright Smile', price: 24.99, cost: 14.00 },
        { name: 'Deodorant 150ml', brand: 'All Day Fresh', price: 32.99, cost: 18.00 },
        { name: 'Hand Cream 75ml', brand: 'Soft Touch', price: 28.99, cost: 16.00 }
      ],
      'Household': [
        { name: 'Dish Soap 500ml', brand: 'Clean Master', price: 19.99, cost: 11.00 },
        { name: 'Laundry Powder 2kg', brand: 'White Bright', price: 65.99, cost: 38.00 },
        { name: 'Toilet Paper 9 Pack', brand: 'Soft Plus', price: 42.99, cost: 25.00 },
        { name: 'Kitchen Towels 2 Pack', brand: 'Absorb All', price: 28.99, cost: 16.00 },
        { name: 'Floor Cleaner 750ml', brand: 'Shine Bright', price: 24.99, cost: 14.00 }
      ]
    };

    for (const [category, items] of Object.entries(productsByCategory)) {
      for (const item of items) {
        const product = await Product.create({
          company: this.company._id,
          name: item.name,
          sku: Math.random().toString(36).substring(2, 14).toUpperCase(),
          barcode: '6' + Math.floor(Math.random() * 900000000000) + 100000000000, // Generate EAN-13 barcode
          sapMaterialId: (Math.floor(Math.random() * 9000000000) + 1000000000).toString(),
          
          productType: 'own_brand',
          category: {
            primary: category,
            secondary: [item.brand]
          },
          brand: item.brand,
          description: `Premium ${item.name.toLowerCase()} from ${item.brand}`,
          
          hierarchy: {
            level1: {
              id: 'L1_' + category.substring(0, 3).toUpperCase(),
              name: category,
              code: category.substring(0, 3).toUpperCase(),
              description: `${category} category`
            },
            level2: {
              id: 'L2_' + item.brand.replace(/\s+/g, '').substring(0, 3).toUpperCase(),
              name: item.brand,
              code: item.brand.replace(/\s+/g, '').substring(0, 3).toUpperCase(),
              description: `${item.brand} brand`
            },
            level3: {
              id: 'L3_' + item.name.replace(/\s+/g, '').substring(0, 3).toUpperCase(),
              name: item.name,
              code: item.name.replace(/\s+/g, '').substring(0, 3).toUpperCase(),
              description: `${item.name} product`
            }
          },
          
          pricing: {
            listPrice: item.price,
            costPrice: item.cost,
            currency: 'ZAR',
            priceUnit: 'each'
          },
          
          specifications: {
            weight: Math.round((Math.random() * 2.4 + 0.1) * 10) / 10,
            dimensions: {
              length: Math.round((Math.random() * 25 + 5) * 10) / 10,
              width: Math.round((Math.random() * 15 + 5) * 10) / 10,
              height: Math.round((Math.random() * 20 + 5) * 10) / 10
            },
            shelfLife: Math.floor(Math.random() * 700) + 30
          },
          
          inventory: {
            currentStock: Math.floor(Math.random() * 49000) + 1000,
            minimumStock: Math.floor(Math.random() * 900) + 100,
            maximumStock: Math.floor(Math.random() * 90000) + 10000
          },
          
          status: 'active',
          launchDate: new Date(Date.now() - Math.random() * 2 * 365 * 24 * 60 * 60 * 1000),
          
          performance: {
            salesVelocity: Math.round((Math.random() * 9900 + 100) * 10) / 10,
            marginPercentage: ((item.price - item.cost) / item.price * 100),
            competitorCount: Math.floor(Math.random() * 6) + 2
          }
        });

        this.products.push(product);
      }
    }

    console.log(`✅ Created ${this.products.length} products across ${Object.keys(productsByCategory).length} categories`);
    return this.products;
  }

  async createBudgets() {
    console.log('💰 Creating annual budgets...');
    
    const budgets = [
      {
        name: '2024 Annual Trade Marketing Budget',
        year: 2024,
        totalAmount: 250000000, // R250M
        categories: {
          'Promotions': 120000000,
          'Display & Merchandising': 50000000,
          'Customer Development': 40000000,
          'Market Development': 25000000,
          'Digital Marketing': 15000000
        }
      },
      {
        name: '2025 Annual Trade Marketing Budget',
        year: 2025,
        totalAmount: 275000000, // R275M (10% increase)
        categories: {
          'Promotions': 135000000,
          'Display & Merchandising': 55000000,
          'Customer Development': 45000000,
          'Market Development': 25000000,
          'Digital Marketing': 15000000
        }
      }
    ];

    for (const budgetData of budgets) {
      const budget = await Budget.create({
        company: this.company._id,
        name: budgetData.name,
        code: `BUD${budgetData.year}`,
        year: budgetData.year,
        budgetType: 'budget',
        status: budgetData.year === 2024 ? 'approved' : 'approved',
        
        scope: {
          level: 'company'
        },
        
        // Create monthly budget lines
        budgetLines: Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          sales: {
            units: Math.floor(budgetData.totalAmount / 12 / 15), // Assuming R15 average price
            value: budgetData.totalAmount / 12
          },
          tradeSpend: {
            marketing: {
              budget: budgetData.categories['Promotions'] / 12,
              allocated: budgetData.categories['Promotions'] / 12 * 0.85,
              spent: budgetData.year === 2024 ? budgetData.categories['Promotions'] / 12 * 0.72 : 0
            },
            cashCoop: {
              budget: budgetData.categories['Customer Development'] / 12,
              allocated: budgetData.categories['Customer Development'] / 12 * 0.85,
              spent: budgetData.year === 2024 ? budgetData.categories['Customer Development'] / 12 * 0.72 : 0
            },
            promotions: {
              budget: budgetData.categories['Display & Merchandising'] / 12,
              allocated: budgetData.categories['Display & Merchandising'] / 12 * 0.85,
              spent: budgetData.year === 2024 ? budgetData.categories['Display & Merchandising'] / 12 * 0.72 : 0
            }
          },
          profitability: {
            grossMargin: 35.5,
            netMargin: 12.8,
            roi: 18.2
          }
        })),
        
        // Annual totals
        annualTotals: {
          sales: {
            units: Math.floor(budgetData.totalAmount / 15), // Assuming R15 average price
            value: budgetData.totalAmount
          },
          tradeSpend: {
            marketing: budgetData.categories['Promotions'],
            cashCoop: budgetData.categories['Customer Development'],
            promotions: budgetData.categories['Display & Merchandising'],
            tradingTerms: budgetData.categories['Market Development'],
            total: budgetData.totalAmount
          },
          profitability: {
            grossMargin: 35.5,
            netMargin: 12.8,
            roi: 18.2
          }
        },
        
        createdBy: this.users.find(u => u.role === 'admin')._id,
        approvedBy: this.users.find(u => u.role === 'admin')._id,
        approvalDate: new Date(`${budgetData.year - 1}-12-15`)
      });

      console.log(`✅ Budget created: ${budget.name} - R${(budget.annualTotals.sales.value / 1000000).toFixed(0)}M`);
    }
  }

  async run() {
    try {
      console.log('🚀 Starting Modelex South Africa data setup...\n');
      
      // Clear existing data
      await this.clearExistingData();
      
      // Create company
      await this.setupModelexCompany();
      
      // Create users
      await this.createUsers();
      
      // Create customers
      await this.createCustomers();
      
      // Create products
      await this.createProducts();
      
      // Create budgets
      await this.createBudgets();
      
      console.log('\n🎉 Modelex South Africa setup completed successfully!');
      console.log(`📊 Summary:`);
      console.log(`   Company: ${this.company.name}`);
      console.log(`   Users: ${this.users.length}`);
      console.log(`   Customers: ${this.customers.length}`);
      console.log(`   Products: ${this.products.length}`);
      console.log(`   Annual Revenue: R5.0B`);
      
    } catch (error) {
      console.error('❌ Error during setup:', error);
      throw error;
    } finally {
      mongoose.connection.close();
    }
  }

  async clearExistingData() {
    console.log('🧹 Clearing existing data...');
    
    await Promise.all([
      Company.deleteMany({}),
      User.deleteMany({}),
      Customer.deleteMany({}),
      Product.deleteMany({}),
      Budget.deleteMany({})
    ]);
    
    console.log('✅ Existing data cleared');
  }
}

// Run the setup
if (require.main === module) {
  const generator = new ModelexDataGenerator();
  generator.run().catch(console.error);
}

module.exports = ModelexDataGenerator;