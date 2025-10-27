#!/usr/bin/env node

/**
 * Production User Seeding Script
 * Creates initial users for production deployment with proper authentication
 * 
 * Usage:
 *   node scripts/seed-production-users.js
 * 
 * Environment Variables Required:
 *   MONGODB_URI - MongoDB connection string
 *   ADMIN_EMAIL - Email for admin user (default: admin@tradeai.com)
 *   ADMIN_PASSWORD - Password for admin user (will prompt if not provided)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

// User Schema (simplified version - adjust to match your actual schema)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, required: true },
  department: String,
  employeeId: String,
  isActive: { type: Boolean, default: true },
  tenantId: String,
  companyId: mongoose.Schema.Types.ObjectId,
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

// Company Schema (simplified)
const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  currency: { type: String, default: 'USD' },
  country: String,
  timezone: { type: String, default: 'UTC' },
  settings: {
    allowMultiCurrency: { type: Boolean, default: false },
    fiscalYearStart: { type: Number, default: 1 }
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Company = mongoose.model('Company', companySchema);

// Helper function to prompt for password
function promptPassword(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Hide password input
    const stdin = process.openStdin();
    process.stdin.on('data', char => {
      char = char.toString();
      switch (char) {
        case "\n":
        case "\r":
        case "\u0004":
          stdin.pause();
          break;
        default:
          process.stdout.clearLine();
          process.stdout.cursorTo(0);
          process.stdout.write(prompt + Array(rl.line.length + 1).join('*'));
          break;
      }
    });

    rl.question(prompt, (password) => {
      rl.close();
      console.log(); // New line after password
      resolve(password);
    });
  });
}

// Helper function to generate employee ID
function generateEmployeeId(role) {
  const prefix = {
    admin: 'ADM',
    board: 'BRD',
    director: 'DIR',
    manager: 'MGR',
    kam: 'KAM',
    sales_rep: 'SLS',
    analyst: 'ANL'
  }[role] || 'USR';
  
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}${timestamp}`;
}

// Default users to seed
const defaultUsers = [
  {
    email: 'admin@tradeai.com',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'admin',
    department: 'IT',
    defaultPassword: 'Admin@123'
  },
  {
    email: 'director@tradeai.com',
    firstName: 'John',
    lastName: 'Director',
    role: 'director',
    department: 'Sales',
    defaultPassword: 'Director@123'
  },
  {
    email: 'manager@tradeai.com',
    firstName: 'Jane',
    lastName: 'Manager',
    role: 'manager',
    department: 'Sales',
    defaultPassword: 'Manager@123'
  },
  {
    email: 'kam@tradeai.com',
    firstName: 'Bob',
    lastName: 'KAM',
    role: 'kam',
    department: 'Sales',
    defaultPassword: 'KAM@123'
  }
];

async function seedUsers() {
  try {
    console.log('='.repeat(60));
    console.log('TRADEAI Production User Seeding Script');
    console.log('='.repeat(60));
    console.log();

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradeai';
    console.log(`Connecting to MongoDB: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✓ Connected to MongoDB successfully');
    console.log();

    // Create default company if it doesn't exist
    let company = await Company.findOne({ code: 'TRADEAI' });
    if (!company) {
      console.log('Creating default company...');
      company = await Company.create({
        name: 'TRADEAI Corporation',
        code: 'TRADEAI',
        currency: 'USD',
        country: 'United States',
        timezone: 'America/New_York',
        settings: {
          allowMultiCurrency: true,
          fiscalYearStart: 1
        }
      });
      console.log(`✓ Created company: ${company.name} (ID: ${company._id})`);
    } else {
      console.log(`✓ Using existing company: ${company.name} (ID: ${company._id})`);
    }
    console.log();

    // Check if any users already exist
    const existingUserCount = await User.countDocuments();
    if (existingUserCount > 0) {
      console.log(`⚠ Warning: ${existingUserCount} user(s) already exist in the database`);
      console.log();
      
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise((resolve) => {
        rl.question('Do you want to continue and create additional users? (yes/no): ', resolve);
      });
      rl.close();
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('Seeding cancelled by user');
        await mongoose.connection.close();
        process.exit(0);
      }
      console.log();
    }

    // Determine if we should use environment password or prompt
    const useCustomPassword = process.env.ADMIN_PASSWORD ? true : false;
    let adminPassword = process.env.ADMIN_PASSWORD;

    if (!useCustomPassword) {
      console.log('No ADMIN_PASSWORD environment variable found.');
      console.log('Default passwords will be used for all users.');
      console.log();
      console.log('Default passwords:');
      defaultUsers.forEach(user => {
        console.log(`  ${user.email}: ${user.defaultPassword}`);
      });
      console.log();
      console.log('⚠ IMPORTANT: Change these passwords immediately after first login!');
      console.log();
    }

    // Create users
    console.log('Creating users...');
    console.log('-'.repeat(60));

    const createdUsers = [];
    for (const userData of defaultUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          console.log(`⚠ User already exists: ${userData.email} (skipping)`);
          continue;
        }

        // Use custom password for admin if provided, otherwise use default
        const password = (userData.role === 'admin' && adminPassword) 
          ? adminPassword 
          : userData.defaultPassword;

        // Create user
        const user = await User.create({
          email: userData.email,
          password: password, // Will be hashed by pre-save middleware
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          department: userData.department,
          employeeId: generateEmployeeId(userData.role),
          companyId: company._id,
          tenantId: company.code,
          isActive: true
        });

        createdUsers.push(user);
        console.log(`✓ Created user: ${user.email} (${user.role}) - ID: ${user._id}`);
      } catch (error) {
        console.error(`✗ Failed to create user ${userData.email}:`, error.message);
      }
    }

    console.log('-'.repeat(60));
    console.log();
    console.log(`✓ Successfully created ${createdUsers.length} user(s)`);
    console.log();

    // Display login credentials
    if (createdUsers.length > 0) {
      console.log('='.repeat(60));
      console.log('LOGIN CREDENTIALS');
      console.log('='.repeat(60));
      console.log();
      
      createdUsers.forEach(user => {
        const defaultUser = defaultUsers.find(u => u.email === user.email);
        const password = (user.role === 'admin' && adminPassword) 
          ? adminPassword 
          : defaultUser.defaultPassword;
        
        console.log(`Email: ${user.email}`);
        console.log(`Password: ${password}`);
        console.log(`Role: ${user.role}`);
        console.log(`Employee ID: ${user.employeeId}`);
        console.log();
      });
      
      console.log('='.repeat(60));
      console.log();
      console.log('⚠ SECURITY REMINDER:');
      console.log('  1. Change all default passwords immediately');
      console.log('  2. Enable 2FA for admin accounts');
      console.log('  3. Store these credentials securely');
      console.log('  4. Never commit passwords to version control');
      console.log('='.repeat(60));
    }

    // Close connection
    await mongoose.connection.close();
    console.log();
    console.log('✓ Database connection closed');
    console.log('✓ Seeding completed successfully');
    
  } catch (error) {
    console.error();
    console.error('✗ ERROR:', error.message);
    console.error();
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the seeding script
if (require.main === module) {
  seedUsers().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { seedUsers };
