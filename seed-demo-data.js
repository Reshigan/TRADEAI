// Demo Data Seeding Script for TRADEAI
// This script creates demo users and companies that match the actual schema

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/trade-ai', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Import models
const User = require('./backend/src/models/User');
const Company = require('./backend/src/models/Company');

async function seedDemoData() {
  try {
    console.log('Starting demo data seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Company.deleteMany({});
    console.log('Cleared existing data');

    // Create TRADEAI Company
    const tradeaiCompany = new Company({
      name: 'TRADEAI',
      code: 'TRADEAI',
      domain: 'tradeai.com',
      industry: 'fmcg',
      country: 'US',
      currency: 'USD',
      timezone: 'America/New_York',
      address: {
        street: '123 Trade Street',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        postalCode: '10001'
      },
      contactInfo: {
        email: 'admin@tradeai.com',
        phone: '+1 555 123 4567',
        website: 'https://tradeai.com'
      },
      subscription: {
        plan: 'enterprise',
        status: 'active',
        maxUsers: 100,
        maxCustomers: 10000,
        maxProducts: 50000
      },
      enabledModules: [
        { module: 'customers', enabled: true, permissions: ['read', 'write', 'delete'] },
        { module: 'products', enabled: true, permissions: ['read', 'write', 'delete'] },
        { module: 'campaigns', enabled: true, permissions: ['read', 'write', 'delete'] },
        { module: 'budgets', enabled: true, permissions: ['read', 'write', 'delete'] },
        { module: 'analytics', enabled: true, permissions: ['read', 'write'] },
        { module: 'ai_insights', enabled: true, permissions: ['read'] },
        { module: 'reporting', enabled: true, permissions: ['read', 'write'] },
        { module: 'integrations', enabled: true, permissions: ['read', 'write'] }
      ],
      isActive: true
    });
    await tradeaiCompany.save();
    console.log('Created TRADEAI Company');

    // Create Test Company
    const testCompany = new Company({
      name: 'Test Company',
      code: 'TESTCO',
      domain: 'testcompany.demo',
      industry: 'retail',
      country: 'US',
      currency: 'USD',
      timezone: 'America/New_York',
      address: {
        street: '456 Demo Street',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        postalCode: '10001'
      },
      contactInfo: {
        email: 'admin@testcompany.demo',
        phone: '+1 555 123 4567',
        website: 'https://testcompany.demo'
      },
      subscription: {
        plan: 'professional',
        status: 'active',
        maxUsers: 50,
        maxCustomers: 5000,
        maxProducts: 25000
      },
      enabledModules: [
        { module: 'customers', enabled: true, permissions: ['read', 'write', 'delete'] },
        { module: 'products', enabled: true, permissions: ['read', 'write', 'delete'] },
        { module: 'campaigns', enabled: true, permissions: ['read', 'write', 'delete'] },
        { module: 'budgets', enabled: true, permissions: ['read', 'write', 'delete'] },
        { module: 'analytics', enabled: true, permissions: ['read', 'write'] },
        { module: 'ai_insights', enabled: true, permissions: ['read'] },
        { module: 'reporting', enabled: true, permissions: ['read', 'write'] }
      ],
      isActive: true
    });
    await testCompany.save();
    console.log('Created Test Company');

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create TRADEAI users
    const tradeaiUsers = [
      {
        companyId: tradeaiCompany._id,
        employeeId: 'EMP001',
        email: 'admin@tradeai.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        department: 'admin',
        isActive: true
      },
      {
        companyId: tradeaiCompany._id,
        employeeId: 'EMP002',
        email: 'manager@tradeai.com',
        password: hashedPassword,
        firstName: 'Trade',
        lastName: 'Manager',
        role: 'manager',
        department: 'sales',
        isActive: true
      },
      {
        companyId: tradeaiCompany._id,
        employeeId: 'EMP003',
        email: 'kam@tradeai.com',
        password: hashedPassword,
        firstName: 'Key Account',
        lastName: 'Manager',
        role: 'kam',
        department: 'sales',
        isActive: true
      }
    ];

    for (const userData of tradeaiUsers) {
      const user = new User(userData);
      await user.save();
    }
    console.log('Created TRADEAI users');

    // Create Test Company users
    const testUsers = [
      {
        companyId: testCompany._id,
        employeeId: 'TEST001',
        email: 'admin@testcompany.demo',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        department: 'admin',
        isActive: true
      },
      {
        companyId: testCompany._id,
        employeeId: 'TEST002',
        email: 'manager@testcompany.demo',
        password: hashedPassword,
        firstName: 'Manager',
        lastName: 'Smith',
        role: 'manager',
        department: 'sales',
        isActive: true
      },
      {
        companyId: testCompany._id,
        employeeId: 'TEST003',
        email: 'kam@testcompany.demo',
        password: hashedPassword,
        firstName: 'Key Account',
        lastName: 'Manager',
        role: 'kam',
        department: 'sales',
        isActive: true
      },
      {
        companyId: testCompany._id,
        employeeId: 'TEST004',
        email: 'analyst@testcompany.demo',
        password: hashedPassword,
        firstName: 'Data',
        lastName: 'Analyst',
        role: 'analyst',
        department: 'operations',
        isActive: true
      },
      {
        companyId: testCompany._id,
        employeeId: 'TEST005',
        email: 'sales@testcompany.demo',
        password: hashedPassword,
        firstName: 'Sales',
        lastName: 'Rep',
        role: 'user',
        department: 'sales',
        isActive: true
      }
    ];

    for (const userData of testUsers) {
      const user = new User(userData);
      await user.save();
    }
    console.log('Created Test Company users');

    console.log('\n=== DEMO DATA SEEDING COMPLETED ===');
    console.log('\nTRADEAI Company Users:');
    console.log('- admin@tradeai.com (Super Admin) - Password: admin123');
    console.log('- manager@tradeai.com (Manager) - Password: admin123');
    console.log('- kam@tradeai.com (Key Account Manager) - Password: admin123');
    console.log('\nTest Company Users:');
    console.log('- admin@testcompany.demo (Admin) - Password: admin123');
    console.log('- manager@testcompany.demo (Manager) - Password: admin123');
    console.log('- kam@testcompany.demo (Key Account Manager) - Password: admin123');
    console.log('- analyst@testcompany.demo (Analyst) - Password: admin123');
    console.log('- sales@testcompany.demo (Sales Rep) - Password: admin123');

  } catch (error) {
    console.error('Error seeding demo data:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seeding
seedDemoData();