require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Set environment to avoid mock database
process.env.USE_MOCK_DB = 'false';
process.env.NODE_ENV = 'production';

const User = require('../models/User');
const Company = require('../models/Company');

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

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Company.deleteMany({});

    // Create companies
    console.log('Creating companies...');
    const companies = await Company.insertMany([
      {
        name: 'GONXT',
        code: 'GONXT',
        domain: 'gonxt.com',
        industry: 'manufacturing',
        country: 'ZA',
        currency: 'ZAR',
        timezone: 'Africa/Johannesburg',
        isActive: true
      },
      {
        name: 'Test Company',
        code: 'TEST',
        domain: 'test.com',
        industry: 'distribution',
        country: 'ZA',
        currency: 'ZAR',
        timezone: 'Africa/Johannesburg',
        isActive: true
      }
    ]);

    const gonxtCompany = companies.find((c) => c.code === 'GONXT');
    const testCompany = companies.find((c) => c.code === 'TEST');

    // Create users
    console.log('Creating users...');
    const password = await bcrypt.hash('Vantax1234#', 10);

    const users = await User.insertMany([
      {
        company: gonxtCompany._id,
        email: 'admin@gonxt.com',
        password,
        firstName: 'GONXT',
        lastName: 'Admin',
        role: 'admin',
        isActive: true,
        department: 'admin',
        employeeId: 'GONXT001'
      },
      {
        company: testCompany._id,
        email: 'admin@test.com',
        password,
        firstName: 'Test',
        lastName: 'Admin',
        role: 'admin',
        isActive: true,
        department: 'admin',
        employeeId: 'TEST001'
      }
    ]);

    console.log(`Created ${companies.length} companies`);
    console.log(`Created ${users.length} users`);
    console.log('\n✅ Basic database seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('GONXT Admin: admin@gonxt.com / Vantax1234#');
    console.log('Test Admin: admin@test.com / Vantax1234#');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
