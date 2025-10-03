// Demo Data Seeding Script for TRADEAI
// This script creates demo users, companies, and tenants that match the actual schema

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/trade-ai', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Import models
const User = require('./src/models/User');
const Company = require('./src/models/Company');
const Tenant = require('./src/models/Tenant');

async function seedDemoData() {
  try {
    console.log('Starting demo data seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Company.deleteMany({});
    await Tenant.deleteMany({});
    console.log('Cleared existing data');

    // Create TRADEAI Tenant
    const tradeaiTenant = new Tenant({
      name: 'TRADEAI',
      slug: 'tradeai',
      domain: 'tradeai.com',
      companyInfo: {
        legalName: 'TRADEAI Inc.',
        industry: 'FMCG',
        companySize: 'enterprise'
      },
      contactInfo: {
        primaryContact: {
          name: 'Super Admin',
          email: 'admin@tradeai.com',
          phone: '+1 555 123 4567',
          position: 'Administrator'
        },
        address: {
          street: '123 Trade Street',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          postalCode: '10001'
        }
      },
      subscription: {
        plan: 'enterprise',
        status: 'active',
        startDate: new Date('2024-01-01')
      },
      limits: {
        maxUsers: 100,
        maxCustomers: 10000,
        maxProducts: 50000,
        maxPromotions: 1000
      },
      features: {
        multiCurrency: true,
        advancedAnalytics: true,
        aiPredictions: true,
        customReporting: true,
        apiAccess: true,
        sapIntegration: true,
        workflowApprovals: true,
        auditLogging: true,
        ssoIntegration: true
      },
      settings: {
        timezone: 'America/New_York',
        currency: 'USD',
        language: 'en'
      },
      isActive: true,
      isVerified: true
    });
    await tradeaiTenant.save();
    console.log('Created TRADEAI Tenant');

    // Create Test Company Tenant
    const testTenant = new Tenant({
      name: 'Test Company',
      slug: 'test-company',
      domain: 'testcompany.demo',
      companyInfo: {
        legalName: 'Test Company Ltd.',
        industry: 'Retail',
        companySize: 'medium'
      },
      contactInfo: {
        primaryContact: {
          name: 'Admin User',
          email: 'admin@testcompany.demo',
          phone: '+1 555 123 4567',
          position: 'Administrator'
        },
        address: {
          street: '456 Demo Street',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          postalCode: '10001'
        }
      },
      subscription: {
        plan: 'professional',
        status: 'active',
        startDate: new Date('2024-01-01')
      },
      limits: {
        maxUsers: 50,
        maxCustomers: 5000,
        maxProducts: 25000,
        maxPromotions: 500
      },
      features: {
        multiCurrency: true,
        advancedAnalytics: true,
        aiPredictions: true,
        customReporting: true,
        apiAccess: false,
        sapIntegration: false,
        workflowApprovals: true,
        auditLogging: true,
        ssoIntegration: false
      },
      settings: {
        timezone: 'America/New_York',
        currency: 'USD',
        language: 'en'
      },
      isActive: true,
      isVerified: true
    });
    await testTenant.save();
    console.log('Created Test Company Tenant');

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
        tenantId: tradeaiTenant._id,
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
        tenantId: tradeaiTenant._id,
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
        tenantId: tradeaiTenant._id,
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
        tenantId: testTenant._id,
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
        tenantId: testTenant._id,
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
        tenantId: testTenant._id,
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
        tenantId: testTenant._id,
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
        tenantId: testTenant._id,
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