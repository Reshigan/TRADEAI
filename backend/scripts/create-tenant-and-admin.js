/**
 * Production Database Initialization Script
 * Creates tenant and admin user for fresh deployment
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Tenant = require('../src/models/Tenant');
const User = require('../src/models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradeai_production';

async function initializeDatabase() {
  console.log('='.repeat(50));
  console.log('TRADEAI DATABASE INITIALIZATION');
  console.log('='.repeat(50));
  console.log('');

  try {
    // Connect to MongoDB
    console.log(`Connecting to MongoDB: ${MONGODB_URI.replace(/:[^:@]*@/, ':****@')}`);
    await mongoose.connect(MONGODB_URI);
    console.log('✓ MongoDB connected');
    console.log('');

    // Check if tenant already exists
    let tenant = await Tenant.findOne({});
    if (tenant) {
      console.log(`⚠  Tenant already exists: ${tenant.name}`);
      console.log(`   ID: ${tenant._id}`);
      console.log('');
      
      // Check for admin user and delete if exists (for re-initialization)
      const existingAdmin = await User.findOne({ tenantId: tenant._id, role: 'super_admin' });
      if (existingAdmin) {
        console.log(`⚠  Admin user already exists: ${existingAdmin.email}`);
        console.log('   Deleting old admin user for re-initialization...');
        await User.deleteOne({ _id: existingAdmin._id });
        console.log('   ✓ Old admin user deleted');
        console.log('');
      }
    } else {
      // Create tenant
      console.log('Creating tenant...');
      tenant = await Tenant.create({
        name: 'Demo Company',
        slug: 'demo-company',
        status: 'active',
        settings: {
          currency: 'USD',
          timezone: 'America/New_York',
          dateFormat: 'MM/DD/YYYY',
          fiscalYearStart: '01-01',
          language: 'en'
        },
        billing: {
          plan: 'enterprise',
          status: 'active',
          billingCycle: 'annual'
        },
        features: {
          aiRecommendations: true,
          advancedAnalytics: true,
          multiCurrency: true,
          customReports: true,
          apiAccess: true,
          ssoEnabled: false
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✓ Tenant created: ${tenant.name}`);
      console.log(`  ID: ${tenant._id}`);
      console.log('');
    }

    // Create admin user
    console.log('Creating admin user...');
    
    const admin = await User.create({
      tenantId: tenant._id,
      email: 'admin@demo.com',
      password: 'Admin@123', // Model will hash this automatically via pre-save hook
      firstName: 'Admin',
      lastName: 'User',
      department: 'admin',
      employeeId: 'ADMIN001',
      role: 'super_admin',
      isActive: true,
      isDeleted: false,
      permissions: [],
      approvalLimits: {
        cashCoop: 0,
        marketing: 0,
        promotions: 0,
        tradingTerms: 0
      },
      assignedCustomers: [],
      assignedProducts: [],
      assignedVendors: [],
      cashCoopWallet: {
        allocated: 0,
        available: 0,
        spent: 0
      },
      integrationTokens: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`✓ Admin user created: ${admin.email}`);
    console.log(`  ID: ${admin._id}`);
    console.log(`  Password: Admin@123`);
    console.log('');

    console.log('='.repeat(50));
    console.log('✓ DATABASE INITIALIZATION COMPLETE');
    console.log('='.repeat(50));
    console.log('');
    console.log('Login Credentials:');
    console.log('  Email:    admin@demo.com');
    console.log('  Password: Admin@123');
    console.log('');
    console.log('Please change the password after first login!');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('✗ Error initializing database:');
    console.error(error);
    console.error('');
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase();
