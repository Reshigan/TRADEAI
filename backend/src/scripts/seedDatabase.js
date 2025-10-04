require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Budget = require('../models/Budget');
const Customer = require('../models/Customer');
const Tenant = require('../models/Tenant');
const logger = require('../utils/logger');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trade-ai';
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('MongoDB connected for seeding');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearData = async () => {
  try {
    await Promise.all([
      User.deleteMany({}),
      Budget.deleteMany({}),
      Customer.deleteMany({})
    ]);
    logger.info('Existing data cleared');
  } catch (error) {
    logger.error('Error clearing data:', error);
    throw error;
  }
};

// Seed users
const seedUsers = async () => {
  try {
    // Get existing tenant or create a new one
    let tenant = await Tenant.findOne({});
    if (!tenant) {
      logger.info('No tenant found, creating default tenant...');
      tenant = await Tenant.create({
        name: 'TradeAI Demo Company',
        slug: 'tradeai-demo',
        isActive: true,
        subscription: {
          plan: 'enterprise',
          status: 'active'
        }
      });
      logger.info(`Created tenant with ID: ${tenant._id}`);
    } else {
      logger.info(`Using existing tenant: ${tenant._id}`);
    }
    
    const tenantId = tenant._id;
    const users = [
      {
        email: 'admin@tradeai.com',
        password: 'Admin@123', // Will be hashed by pre-save hook
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true,
        tenantId,
        employeeId: 'EMP001',
        department: 'admin'
      },
      {
        email: 'john.doe@example.com',
        password: 'User@123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        isActive: true,
        department: 'sales',
        tenantId,
        employeeId: 'EMP002'
      },
      {
        email: 'jane.smith@example.com',
        password: 'User@123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'user',
        isActive: true,
        department: 'finance',
        tenantId,
        employeeId: 'EMP003'
      },
      {
        email: 'bob.wilson@example.com',
        password: 'User@123',
        firstName: 'Bob',
        lastName: 'Wilson',
        role: 'analyst',
        isActive: true,
        department: 'operations',
        tenantId,
        employeeId: 'EMP004'
      },
      {
        email: 'inactive@example.com',
        password: 'User@123',
        firstName: 'Inactive',
        lastName: 'User',
        role: 'user',
        isActive: false,
        department: 'sales',
        tenantId,
        employeeId: 'EMP005'
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save(); // This will trigger the pre-save hook to hash password
      createdUsers.push(user);
    }
    
    logger.info(`Seeded ${createdUsers.length} users`);
    return createdUsers;
  } catch (error) {
    logger.error('Error seeding users:', error);
    throw error;
  }
};

// Seed budgets
const seedBudgets = async (users) => {
  try {
    const john = users.find(u => u.email === 'john.doe@example.com');
    const jane = users.find(u => u.email === 'jane.smith@example.com');

    const currentYear = new Date().getFullYear();
    const budgets = [
      {
        name: 'Q1 Marketing Budget',
        description: 'Marketing expenses for Q1',
        totalAmount: 50000,
        spentAmount: 35000,
        currency: 'USD',
        startDate: new Date(currentYear, 0, 1),
        endDate: new Date(currentYear, 2, 31),
        department: 'Marketing',
        status: 'active',
        userId: john._id,
        threshold: {
          warning: 80,
          critical: 95
        }
      },
      {
        name: 'Q2 Marketing Budget',
        description: 'Marketing expenses for Q2',
        totalAmount: 60000,
        spentAmount: 15000,
        currency: 'USD',
        startDate: new Date(currentYear, 3, 1),
        endDate: new Date(currentYear, 5, 30),
        department: 'Marketing',
        status: 'active',
        userId: john._id,
        threshold: {
          warning: 80,
          critical: 95
        }
      },
      {
        name: 'IT Infrastructure Budget',
        description: 'IT infrastructure and maintenance',
        totalAmount: 100000,
        spentAmount: 95000,
        currency: 'USD',
        startDate: new Date(currentYear, 0, 1),
        endDate: new Date(currentYear, 11, 31),
        department: 'IT',
        status: 'active',
        userId: jane._id,
        threshold: {
          warning: 75,
          critical: 90
        }
      },
      {
        name: 'Sales Travel Budget',
        description: 'Travel expenses for sales team',
        totalAmount: 30000,
        spentAmount: 28500,
        currency: 'USD',
        startDate: new Date(currentYear, 0, 1),
        endDate: new Date(currentYear, 5, 30),
        department: 'Sales',
        status: 'active',
        userId: john._id,
        threshold: {
          warning: 80,
          critical: 95
        }
      },
      {
        name: 'Past Budget (Closed)',
        description: 'Previous year budget',
        totalAmount: 40000,
        spentAmount: 40000,
        currency: 'USD',
        startDate: new Date(currentYear - 1, 0, 1),
        endDate: new Date(currentYear - 1, 11, 31),
        department: 'Operations',
        status: 'closed',
        userId: jane._id,
        threshold: {
          warning: 80,
          critical: 95
        }
      }
    ];

    const createdBudgets = await Budget.insertMany(budgets);
    logger.info(`Seeded ${createdBudgets.length} budgets`);
    return createdBudgets;
  } catch (error) {
    logger.error('Error seeding budgets:', error);
    throw error;
  }
};

// Seed customers
const seedCustomers = async (users) => {
  try {
    const john = users.find(u => u.email === 'john.doe@example.com');
    
    const customers = [
      {
        sapId: 'CUST001',
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '+1-555-0101',
        address: {
          street: '123 Business St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        segment: 'Enterprise',
        totalRevenue: 500000,
        lastPurchaseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        creditLimit: 100000,
        paymentTerms: 'Net 30',
        status: 'active',
        riskScore: 0.15,
        churnProbability: 0.08,
        userId: john._id
      },
      {
        sapId: 'CUST002',
        name: 'TechStart Inc',
        email: 'info@techstart.com',
        phone: '+1-555-0102',
        address: {
          street: '456 Innovation Ave',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          country: 'USA'
        },
        segment: 'SMB',
        totalRevenue: 75000,
        lastPurchaseDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        creditLimit: 25000,
        paymentTerms: 'Net 15',
        status: 'active',
        riskScore: 0.25,
        churnProbability: 0.12,
        userId: john._id
      },
      {
        sapId: 'CUST003',
        name: 'Global Solutions Ltd',
        email: 'hello@globalsolutions.com',
        phone: '+44-20-5550-1234',
        address: {
          street: '789 Commerce Rd',
          city: 'London',
          state: '',
          zipCode: 'EC1A 1BB',
          country: 'UK'
        },
        segment: 'Enterprise',
        totalRevenue: 1200000,
        lastPurchaseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        creditLimit: 250000,
        paymentTerms: 'Net 45',
        status: 'active',
        riskScore: 0.10,
        churnProbability: 0.05,
        userId: john._id
      },
      {
        sapId: 'CUST004',
        name: 'Risky Business Co',
        email: 'admin@riskybiz.com',
        phone: '+1-555-0103',
        address: {
          street: '321 Danger Ln',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'USA'
        },
        segment: 'SMB',
        totalRevenue: 25000,
        lastPurchaseDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        creditLimit: 10000,
        paymentTerms: 'Net 15',
        status: 'active',
        riskScore: 0.85,
        churnProbability: 0.75,
        userId: john._id
      },
      {
        sapId: 'CUST005',
        name: 'Inactive Corp',
        email: 'contact@inactive.com',
        phone: '+1-555-0104',
        address: {
          street: '999 Dormant St',
          city: 'Boston',
          state: 'MA',
          zipCode: '02101',
          country: 'USA'
        },
        segment: 'Enterprise',
        totalRevenue: 300000,
        lastPurchaseDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
        creditLimit: 50000,
        paymentTerms: 'Net 30',
        status: 'inactive',
        riskScore: 0.60,
        churnProbability: 0.90,
        userId: john._id
      }
    ];

    const createdCustomers = await Customer.insertMany(customers);
    logger.info(`Seeded ${createdCustomers.length} customers`);
    return createdCustomers;
  } catch (error) {
    logger.error('Error seeding customers:', error);
    throw error;
  }
};

// Note: Prediction model not available in current schema

// Main seed function
const seedDatabase = async () => {
  try {
    logger.info('Starting database seeding...');
    
    await connectDB();
    await clearData();
    
    const users = await seedUsers();
    const budgets = await seedBudgets(users);
    const customers = await seedCustomers(users);
    
    logger.info('✅ Database seeding completed successfully!');
    logger.info(`Summary:
      - Users: ${users.length}
      - Budgets: ${budgets.length}
      - Customers: ${customers.length}
    `);
    
    logger.info('\n📝 Test Credentials:');
    logger.info('Admin: admin@tradeai.com / Admin@123');
    logger.info('User 1: john.doe@example.com / User@123');
    logger.info('User 2: jane.smith@example.com / User@123');
    logger.info('Analyst: bob.wilson@example.com / User@123');
    
  } catch (error) {
    logger.error('Error during seeding:', error);
  } finally {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  }
};

// Run seeding
seedDatabase();
