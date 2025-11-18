require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const Budget = require('../models/Budget');
const TradeSpend = require('../models/TradeSpend');
const ActivityGrid = require('../models/ActivityGrid');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trade-ai', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const clearDatabase = async () => {
  console.log('Clearing existing data...');
  await User.deleteMany({});
  await Customer.deleteMany({});
  await Product.deleteMany({});
  await Promotion.deleteMany({});
  await Budget.deleteMany({});
  await TradeSpend.deleteMany({});
  await ActivityGrid.deleteMany({});
  console.log('Data cleared successfully');
};

const seedDatabase = async () => {
  try {
    await connectDB();
    await clearDatabase();

    // Create users
    console.log('Creating users...');
    const password = await bcrypt.hash('Vantax1234#', 10);

    const users = await User.insertMany([
      {
        email: 'info@vantax.co.za',
        password,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true,
        department: 'admin',
        employeeId: 'EMP001'
      },
      {
        email: 'manager@testco.com',
        password,
        firstName: 'Sarah',
        lastName: 'Manager',
        role: 'manager',
        isActive: true,
        department: 'marketing',
        employeeId: 'EMP002'
      },
      {
        email: 'kam1@testco.com',
        password,
        firstName: 'Michael',
        lastName: 'Johnson',
        role: 'kam',
        isActive: true,
        department: 'sales',
        employeeId: 'EMP003'
      }
    ]);
    console.log(`Created ${users.length} users`);

    // Create customers
    console.log('Creating customers...');
    const customers = await Customer.insertMany([
      {
        sapCustomerId: 'SAP-PICK001',
        code: 'PICK001',
        name: 'Pick n Pay',
        customerType: 'retailer',
        channel: 'modern_trade',
        creditLimit: 5000000,
        paymentTerms: 'NET30',
        currency: 'ZAR',
        tier: 'platinum',
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
          position: 'Buyer',
          email: 'james@pnp.co.za',
          phone: '+27 21 658 1000',
          isPrimary: true
        }]
      },
      {
        sapCustomerId: 'SAP-SHOP001',
        code: 'SHOP001',
        name: 'Shoprite',
        customerType: 'retailer',
        channel: 'modern_trade',
        creditLimit: 8000000,
        paymentTerms: 'NET45',
        currency: 'ZAR',
        tier: 'platinum',
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
          position: 'Category Manager',
          email: 'peter@shoprite.co.za',
          phone: '+27 21 980 4000',
          isPrimary: true
        }]
      },
      {
        sapCustomerId: 'SAP-SPAR001',
        code: 'SPAR001',
        name: 'SPAR',
        customerType: 'retailer',
        channel: 'modern_trade',
        creditLimit: 3000000,
        paymentTerms: 'NET30',
        currency: 'ZAR',
        tier: 'gold',
        addresses: [{
          type: 'both',
          street: '22 Chancery Lane',
          city: 'Durban',
          state: 'KwaZulu-Natal',
          country: 'South Africa',
          postalCode: '4001'
        }],
        contacts: [{
          name: 'David Smith',
          position: 'Procurement',
          email: 'david@spar.co.za',
          phone: '+27 31 719 1900',
          isPrimary: true
        }]
      }
    ]);
    console.log(`Created ${customers.length} customers`);

    // Create products
    console.log('Creating products...');
    const products = await Product.insertMany([
      {
        sapMaterialId: 'SAP-MAT-001',
        sku: 'SUPER001',
        name: 'Super Glue 3g',
        description: 'Fast-acting super glue',
        productType: 'own_brand',
        category: {
          primary: 'Adhesives',
          secondary: ['Instant Adhesives']
        },
        brand: {
          id: 'BRAND001',
          name: 'SuperBond'
        },
        pricing: {
          listPrice: 25.99,
          currency: 'ZAR',
          costPrice: 15.00,
          marginPercentage: 40
        },
        uom: 'EA',
        status: 'active',
        attributes: {
          size: '3g',
          unitsPerCase: 12,
          casesPerPallet: 100
        }
      },
      {
        sapMaterialId: 'SAP-MAT-002',
        sku: 'WOOD001',
        name: 'Wood Glue 125ml',
        description: 'Professional wood adhesive',
        productType: 'own_brand',
        category: {
          primary: 'Adhesives',
          secondary: ['Wood Adhesives']
        },
        brand: {
          id: 'BRAND002',
          name: 'WoodMaster'
        },
        pricing: {
          listPrice: 45.99,
          currency: 'ZAR',
          costPrice: 28.00,
          marginPercentage: 39
        },
        uom: 'EA',
        status: 'active',
        attributes: {
          size: '125ml',
          unitsPerCase: 6,
          casesPerPallet: 80
        }
      },
      {
        sapMaterialId: 'SAP-MAT-003',
        sku: 'TAPE001',
        name: 'Clear Tape 48mm',
        description: 'Heavy duty packaging tape',
        productType: 'own_brand',
        category: {
          primary: 'Tapes',
          secondary: ['Packaging Tapes']
        },
        brand: {
          id: 'BRAND003',
          name: 'TapePro'
        },
        pricing: {
          listPrice: 35.50,
          currency: 'ZAR',
          costPrice: 22.00,
          marginPercentage: 38
        },
        uom: 'EA',
        status: 'active',
        attributes: {
          size: '48mm x 50m',
          unitsPerCase: 24,
          casesPerPallet: 50
        }
      }
    ]);
    console.log(`Created ${products.length} products`);

    // Create a simple promotion
    console.log('Creating promotions...');
    const promotions = await Promotion.insertMany([
      {
        promotionId: 'PROMO-2024-001',
        name: 'Q1 Volume Discount',
        description: 'First quarter volume discount promotion',
        promotionType: 'volume_discount',
        status: 'active',
        period: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-03-31')
        },
        scope: {
          customers: [{
            customer: customers[0]._id,
            includeChildren: true
          }],
          products: [{
            product: products[0]._id,
            includeVariants: true
          }]
        },
        mechanics: {
          discountType: 'percentage',
          discountValue: 10,
          buyQuantity: 100,
          minimumPurchase: 1000
        },
        budget: {
          allocated: 50000,
          spent: 15000,
          currency: 'ZAR'
        },
        createdBy: users[1]._id
      }
    ]);
    console.log(`Created ${promotions.length} promotions`);

    // Create budgets
    console.log('Creating budgets...');
    const currentYear = new Date().getFullYear();
    const budgets = await Budget.insertMany([
      {
        name: `${customers[0].name} Marketing Budget ${currentYear}`,
        code: `BUD-${customers[0].code}-${currentYear}`,
        year: currentYear,
        budgetType: 'budget',
        scope: {
          level: 'customer',
          customers: [customers[0]._id]
        },
        status: 'approved',
        budgetLines: [
          {
            month: 1,
            sales: { units: 10000, value: 250000 },
            tradeSpend: {
              marketing: { amount: 25000 },
              cashCoop: { amount: 10000 },
              tradingTerms: { amount: 15000 },
              promotions: { amount: 20000 }
            }
          },
          {
            month: 2,
            sales: { units: 12000, value: 300000 },
            tradeSpend: {
              marketing: { amount: 30000 },
              cashCoop: { amount: 12000 },
              tradingTerms: { amount: 18000 },
              promotions: { amount: 25000 }
            }
          }
        ],
        currency: 'ZAR',
        createdBy: users[1]._id
      },
      {
        name: `${customers[1].name} Marketing Budget ${currentYear}`,
        code: `BUD-${customers[1].code}-${currentYear}`,
        year: currentYear,
        budgetType: 'budget',
        scope: {
          level: 'customer',
          customers: [customers[1]._id]
        },
        status: 'approved',
        budgetLines: [
          {
            month: 1,
            sales: { units: 15000, value: 400000 },
            tradeSpend: {
              marketing: { amount: 35000 },
              cashCoop: { amount: 15000 },
              tradingTerms: { amount: 20000 },
              promotions: { amount: 30000 }
            }
          }
        ],
        currency: 'ZAR',
        createdBy: users[1]._id
      }
    ]);
    console.log(`Created ${budgets.length} budgets`);

    // Create some trade spend records
    console.log('Creating trade spend records...');
    const tradeSpends = await TradeSpend.insertMany([
      {
        spendId: `SPEND-${Date.now()}-1`,
        spendType: 'promotion',
        category: 'volume_discount',
        customer: customers[0]._id,
        promotion: promotions[0]._id,
        products: [products[0]._id],
        budget: budgets[0]._id,
        amount: 15000,
        currency: 'ZAR',
        period: {
          year: currentYear,
          quarter: 'Q1',
          month: 'January'
        },
        status: 'approved',
        description: 'Q1 Volume discount payment',
        approvals: [{
          level: 'manager',
          approver: users[1]._id,
          status: 'approved',
          date: new Date(),
          amount: 15000,
          comments: 'Approved for Q1 promotion'
        }],
        financial: {
          glAccount: '5100-001',
          costCenter: 'CC-SALES-001'
        },
        createdBy: users[1]._id,
        approvedBy: users[1]._id,
        approvalDate: new Date()
      }
    ]);
    console.log(`Created ${tradeSpends.length} trade spend records`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: info@vantax.co.za / Vantax1234#');
    console.log('Manager: manager@testco.com / Vantax1234#');
    console.log('KAM: kam1@testco.com / Vantax1234#');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
