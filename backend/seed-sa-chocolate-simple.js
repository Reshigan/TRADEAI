/**
 * Simple South African Chocolate Sales Seed Data
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradeai';

async function seedDatabase() {
  try {
    console.log('🌍 Starting South African Chocolate Sales Seed...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const User = require('./src/models/User');
    const Product = require('./src/models/Product');
    const Customer = require('./src/models/Customer');
    const SalesTransaction = require('./src/models/SalesTransaction');
    const Tenant = require('./src/models/Tenant');
    const Company = require('./src/models/Company');
    
    // Get or create tenant
    console.log('🏢 Setting up tenant...');
    let tenant = await Tenant.findOne({ name: 'Mondelez SA' });
    if (!tenant) {
      tenant = await Tenant.create({
        name: 'Mondelez SA',
        subdomain: 'mondelez',
        status: 'active',
        settings: { currency: 'ZAR', timezone: 'Africa/Johannesburg' }
      });
    }
    const tenantId = tenant._id;
    
    // Get or create company
    let company = await Company.findOne({ name: 'Mondelez SA', tenantId });
    if (!company) {
      company = await Company.create({
        name: 'Mondelez SA',
        code: 'MDZ-SA',
        tenantId,
        status: 'active'
      });
    }
    const companyId = company._id;
    console.log('✅ Tenant and company ready\n');
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({ tenantId });
    await Product.deleteMany({ tenantId });
    await Customer.deleteMany({ tenantId });
    await SalesTransaction.deleteMany({ tenantId });
    console.log('✅ Data cleared\n');
    
    // Create users
    console.log('👥 Creating users...');
    const users = [];
    const usersData = [
      { firstName: 'Admin', lastName: 'User', email: 'admin@trade-ai.com', password: 'Admin@123456', role: 'admin', employeeId: 'EMP-001', department: 'admin' },
      { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@mondelez.com', password: 'Sarah@123456', role: 'manager', employeeId: 'EMP-002', department: 'sales' },
      { firstName: 'Thabo', lastName: 'Mbeki', email: 'thabo.mbeki@mondelez.com', password: 'Thabo@123456', role: 'kam', employeeId: 'EMP-003', department: 'sales' },
      { firstName: 'Zanele', lastName: 'Dlamini', email: 'zanele.dlamini@mondelez.com', password: 'Zanele@123456', role: 'kam', employeeId: 'EMP-004', department: 'sales' },
      { firstName: 'Pieter', lastName: 'van der Merwe', email: 'pieter.vandermerwe@mondelez.com', password: 'Pieter@123456', role: 'kam', employeeId: 'EMP-005', department: 'sales' },
      { firstName: 'Demo', lastName: 'User', email: 'demo@trade-ai.com', password: 'Demo@123456', role: 'user', employeeId: 'EMP-006', department: 'sales' }
    ];
    
    for (const userData of usersData) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = await User.create({ ...userData, password: hashedPassword, tenantId, companyId, isActive: true, permissions: [] });
      users.push(user);
    }
    console.log(`✅ Created ${users.length} users\n`);
    
    // Create products
    console.log('📦 Creating products...');
    const productsData = [
      { name: 'Cadbury Dairy Milk 80g', category: 'Chocolate', brand: 'Cadbury', sku: 'CDM-080', barcode: '6001045001001', unitPrice: 18.95, unitCost: 9.50, stockLevel: 5000, reorderLevel: 500, unit: 'bar' },
      { name: 'Cadbury Dairy Milk 150g', category: 'Chocolate', brand: 'Cadbury', sku: 'CDM-150', barcode: '6001045001002', unitPrice: 32.95, unitCost: 16.50, stockLevel: 3500, reorderLevel: 400, unit: 'bar' },
      { name: 'Cadbury Dairy Milk Caramel 80g', category: 'Chocolate', brand: 'Cadbury', sku: 'CDMC-080', barcode: '6001045001003', unitPrice: 19.95, unitCost: 10.00, stockLevel: 2800, reorderLevel: 300, unit: 'bar' },
      { name: 'Cadbury Lunch Bar 48g', category: 'Chocolate', brand: 'Cadbury', sku: 'CLB-048', barcode: '6001045001006', unitPrice: 12.95, unitCost: 6.50, stockLevel: 4500, reorderLevel: 500, unit: 'bar' },
      { name: 'Cadbury PS 52g', category: 'Chocolate', brand: 'Cadbury', sku: 'CPS-052', barcode: '6001045001007', unitPrice: 13.95, unitCost: 7.00, stockLevel: 4000, reorderLevel: 450, unit: 'bar' },
      { name: 'Cadbury Roses 225g', category: 'Chocolate', brand: 'Cadbury', sku: 'CR-225', barcode: '6001045002001', unitPrice: 89.95, unitCost: 45.00, stockLevel: 1500, reorderLevel: 200, unit: 'box' },
      { name: 'Oreo Original 133g', category: 'Biscuits', brand: 'Oreo', sku: 'ORO-133', barcode: '6001045003001', unitPrice: 24.95, unitCost: 12.50, stockLevel: 4200, reorderLevel: 450, unit: 'pack' },
      { name: 'Oreo Golden 154g', category: 'Biscuits', brand: 'Oreo', sku: 'ORG-154', barcode: '6001045003002', unitPrice: 26.95, unitCost: 13.50, stockLevel: 3500, reorderLevel: 400, unit: 'pack' },
      { name: 'Bakers Tennis 200g', category: 'Biscuits', brand: 'Bakers', sku: 'BTN-200', barcode: '6001045004001', unitPrice: 18.95, unitCost: 9.50, stockLevel: 4500, reorderLevel: 500, unit: 'pack' },
      { name: 'Stimorol Spearmint 14g', category: 'Confectionery', brand: 'Stimorol', sku: 'STM-014', barcode: '6001045005001', unitPrice: 7.95, unitCost: 4.00, stockLevel: 6000, reorderLevel: 600, unit: 'pack' }
    ];
    const products = await Product.insertMany(productsData.map(p => ({ ...p, tenantId, companyId })));
    console.log(`✅ Created ${products.length} products\n`);
    
    // Create customers
    console.log('🏪 Creating customers...');
    const customersData = [
      { name: 'Pick n Pay Sandton', code: 'PNP-001', sapCustomerId: 'SAP-PNP-001', city: 'Johannesburg', province: 'Gauteng', tier: 'Premium', type: 'Hypermarket' },
      { name: 'Checkers Menlyn', code: 'CHK-001', sapCustomerId: 'SAP-CHK-001', city: 'Pretoria', province: 'Gauteng', tier: 'Premium', type: 'Supermarket' },
      { name: 'Woolworths V&A', code: 'WOL-002', sapCustomerId: 'SAP-WOL-002', city: 'Cape Town', province: 'Western Cape', tier: 'Premium', type: 'Supermarket' },
      { name: 'Shoprite Gateway', code: 'SHP-003', sapCustomerId: 'SAP-SHP-003', city: 'Durban', province: 'KwaZulu-Natal', tier: 'Standard', type: 'Supermarket' },
      { name: 'Spar Centurion', code: 'SPR-001', sapCustomerId: 'SAP-SPR-001', city: 'Pretoria', province: 'Gauteng', tier: 'Basic', type: 'Supermarket' }
    ];
    const customers = await Customer.insertMany(customersData.map(c => ({ ...c, tenantId, companyId })));
    console.log(`✅ Created ${customers.length} customers\n`);
    
    // Create sales transactions
    console.log('💰 Creating sales transactions...');
    const salesData = [];
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2025-10-27');
    
    for (let i = 0; i < 150; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const quantity = Math.floor(Math.random() * 100) + 20;
      const unitPrice = product.unitPrice;
      const totalValue = quantity * unitPrice;
      const transactionDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
      
      salesData.push({
        transactionId: `TXN-SA-${String(i + 1).padStart(5, '0')}`,
        date: transactionDate,
        customer: customer._id,
        customerName: customer.name,
        customerCode: customer.code,
        product: product._id,
        productName: product.name,
        productSku: product.sku,
        quantity,
        unitPrice,
        totalValue,
        currency: 'ZAR',
        status: 'completed',
        paymentStatus: 'paid',
        tenantId,
        companyId
      });
    }
    
    const sales = await SalesTransaction.insertMany(salesData);
    console.log(`✅ Created ${sales.length} sales transactions\n`);
    
    console.log('\n🎉 ============================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('🎉 ============================================\n');
    console.log('📊 Summary:');
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   📦 Products: ${products.length}`);
    console.log(`   🏪 Customers: ${customers.length}`);
    console.log(`   💰 Sales Transactions: ${sales.length}`);
    console.log('\n🔐 Login Credentials:');
    console.log('   Admin: admin@trade-ai.com / Admin@123456');
    console.log('   Manager: sarah.johnson@mondelez.com / Sarah@123456');
    console.log('   KAM: thabo.mbeki@mondelez.com / Thabo@123456');
    console.log('   Demo: demo@trade-ai.com / Demo@123456');
    console.log('\n💵 Currency: South African Rand (ZAR)');
    console.log('🌍 Focus: South African Chocolate Sales\n');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  }
}

seedDatabase();
