/**
 * Seed script to create test users for each role
 * Usage: node scripts/seedRoleUsers.js
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcrypt');

const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradeai';

const testUsers = [
    {
        email: 'admin@trade-ai.com',
        username: 'admin',
        password: 'Admin@123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'super_admin',
        tenant: 'mondelez',
        isActive: true,
        isEmailVerified: true
    },
    {
        email: 'salesmanager@trade-ai.com',
        username: 'salesmanager',
        password: 'Sales@123',
        firstName: 'Sales',
        lastName: 'Manager',
        role: 'sales_manager',
        tenant: 'mondelez',
        isActive: true,
        isEmailVerified: true
    },
    {
        email: 'kam@trade-ai.com',
        username: 'kam',
        password: 'KAM@1234',
        firstName: 'Key Account',
        lastName: 'Manager',
        role: 'kam',
        tenant: 'mondelez',
        isActive: true,
        isEmailVerified: true
    },
    {
        email: 'finance@trade-ai.com',
        username: 'finance',
        password: 'Finance@123',
        firstName: 'Finance',
        lastName: 'Manager',
        role: 'finance_manager',
        tenant: 'mondelez',
        isActive: true,
        isEmailVerified: true
    },
    {
        email: 'inventory@trade-ai.com',
        username: 'inventory',
        password: 'Inventory@123',
        firstName: 'Inventory',
        lastName: 'Manager',
        role: 'inventory_manager',
        tenant: 'mondelez',
        isActive: true,
        isEmailVerified: true
    },
    {
        email: 'analyst@trade-ai.com',
        username: 'analyst',
        password: 'Analyst@123',
        firstName: 'Data',
        lastName: 'Analyst',
        role: 'analyst',
        tenant: 'mondelez',
        isActive: true,
        isEmailVerified: true
    }
];

async function seedUsers() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(DB_URI);
        console.log('Connected to MongoDB');

        console.log('Seeding role-based users...');
        
        for (const userData of testUsers) {
            // Check if user already exists
            const existingUser = await User.findOne({ email: userData.email });
            
            if (existingUser) {
                console.log(`User ${userData.email} already exists. Updating role and resetting password...`);
                existingUser.role = userData.role;
                // Password will be hashed by User model's pre-save hook
                existingUser.password = userData.password;
                await existingUser.save();
                console.log(`✅ Updated: ${userData.email} (${userData.role})`);
            } else {
                // DON'T hash password here - User model's pre-save hook will do it
                const user = new User(userData);
                await user.save();
                console.log(`✅ Created: ${userData.email} (${userData.role})`);
            }
        }

        console.log('\n✅ All users seeded successfully!');
        console.log('\n📋 Test Users Credentials:');
        console.log('================================');
        testUsers.forEach(user => {
            console.log(`${user.role.toUpperCase().padEnd(20)} | ${user.email.padEnd(30)} | Password: ${user.password.split('').slice(0, -3).join('') + '***'}`);
        });
        console.log('================================\n');

    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit(0);
    }
}

seedUsers();
