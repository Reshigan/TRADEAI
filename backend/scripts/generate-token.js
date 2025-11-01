#!/usr/bin/env node
/**
 * Generate JWT token for admin user bypassing rate limits
 * For emergency access only - DO NOT USE IN PRODUCTION
 * 
 * Usage: node generate-token.js <email>
 */

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const email = process.argv[2] || 'admin@mondelez.com';

async function generateToken() {
    try {
        // Connect to MongoDB
        console.log('📡 Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to database');

        // Find user
        const User = require('../src/models/User');
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.error(`❌ User not found: ${email}`);
            process.exit(1);
        }

        // Generate JWT token (use userId to match auth middleware expectations)
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                _id: user._id.toString(),
                email: user.email,
                role: user.role,
                tenantId: user.tenantId,
                companyId: user.companyId
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION || '7d' }
        );

        console.log('\n✅ JWT Token generated successfully!\n');
        console.log('User:', user.email);
        console.log('Role:', user.role);
        console.log('\n--- COPY THE TOKEN BELOW ---\n');
        console.log(token);
        console.log('\n--- END OF TOKEN ---\n');
        console.log('\nTo use this token:');
        console.log('1. Open browser console on https://tradeai.gonxt.tech');
        console.log('2. Run: localStorage.setItem("token", "<paste-token-here>")');
        console.log('3. Refresh the page');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

generateToken();
