#!/usr/bin/env node

/**
 * Create Super Admin User
 * Run this script to create the initial super admin account
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/tradeai';

// Super Admin credentials
const SUPER_ADMIN = {
  email: process.env.SUPERADMIN_EMAIL || 'admin@tradeai.com',
  password: process.env.SUPERADMIN_PASSWORD || 'admin123',
  name: 'Super Administrator'
};

async function createSuperAdmin() {
  try {
    console.log('🚀 Creating Super Admin User...\n');
    console.log('Connecting to MongoDB:', MONGODB_URI.replace(/:[^:]*@/, ':****@'));
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✓ Connected to database\n');

    // Define User schema inline to avoid model loading issues
    const userSchema = new mongoose.Schema({
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
      status: { type: String, default: 'active' },
      isVerified: { type: Boolean, default: false },
      tenantId: mongoose.Schema.Types.ObjectId,
      companyId: mongoose.Schema.Types.ObjectId,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });

    const User = mongoose.models.User || mongoose.model('User', userSchema);

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    
    if (existingSuperAdmin) {
      console.log('⚠️  Super admin already exists:');
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log(`   Name: ${existingSuperAdmin.name}`);
      console.log(`   Status: ${existingSuperAdmin.status}`);
      console.log('\nTo create a new super admin, delete the existing one first.');
      
      await mongoose.disconnect();
      process.exit(0);
    }

    // Hash password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(SUPER_ADMIN.password, 10);
    console.log('✓ Password hashed\n');

    // Create super admin user
    console.log('Creating super admin user...');
    const superAdmin = await User.create({
      email: SUPER_ADMIN.email,
      password: hashedPassword,
      name: SUPER_ADMIN.name,
      role: 'superadmin',
      status: 'active',
      isVerified: true
    });

    console.log('✓ Super admin created successfully!\n');

    // Display credentials
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║                                                        ║');
    console.log('║            Super Admin Created Successfully            ║');
    console.log('║                                                        ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('Super Admin Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email:    ${SUPER_ADMIN.email}`);
    console.log(`Password: ${SUPER_ADMIN.password}`);
    console.log(`Name:     ${SUPER_ADMIN.name}`);
    console.log(`Role:     superadmin`);
    console.log(`Status:   active`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🔐 IMPORTANT SECURITY NOTICE:');
    console.log('   1. Change this password immediately after first login');
    console.log('   2. Enable two-factor authentication');
    console.log('   3. Store credentials securely');
    console.log('   4. Do not share these credentials');
    console.log('');
    console.log('Access the system at:');
    console.log('   http://localhost:3000/login');
    console.log('');

    await mongoose.disconnect();
    console.log('✓ Disconnected from database');
    console.log('');
    console.log('✅ Setup complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    
    if (error.code === 11000) {
      console.error('\n⚠️  Duplicate key error: A user with this email already exists');
    }
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Process interrupted. Cleaning up...');
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  process.exit(1);
});

// Run the script
createSuperAdmin();
