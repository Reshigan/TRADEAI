#!/usr/bin/env node
/**
 * Admin utility to unlock user accounts
 * Usage: node admin-unlock.js <email>
 */

const mongoose = require('mongoose');
const config = require('../src/config');

// Get email from command line
const email = process.argv[2];

if (!email) {
    console.error('❌ Usage: node admin-unlock.js <email>');
    process.exit(1);
}

async function unlockUser() {
    try {
        // Connect to MongoDB
        console.log('📡 Connecting to database...');
        await mongoose.connect(config.database.url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to database');

        // Find and unlock user
        const User = require('../src/models/User');
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.error(`❌ User not found: ${email}`);
            process.exit(1);
        }

        // Reset failed login attempts
        user.failedLoginAttempts = 0;
        user.accountLockedUntil = null;
        await user.save();

        console.log(`✅ User account unlocked: ${email}`);
        console.log(`   - Failed login attempts reset to 0`);
        console.log(`   - Account lock removed`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

unlockUser();
