#!/usr/bin/env node

/**
 * Create Super Admin for TRADEAI
 * Creates admin@vantax.co.za with super_admin role
 * 
 * Usage: node scripts/setup-superadmin.js
 */

const crypto = require('crypto');

// Configuration
const SUPERADMIN_CONFIG = {
  email: 'admin@vantax.co.za',
  password: 'TradeAI@2026!Secure', // Change immediately after first login
  firstName: 'System',
  lastName: 'Administrator',
  role: 'super_admin',
  isActive: true,
  isVerified: true,
  companyCode: 'VANTAX',
  tenantId: 'tenant_vantax_001'
};

// Hash password using SHA-256 (matching Workers implementation)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Generate UUID
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function createSuperAdmin() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                                                        ║');
  console.log('║         TRADEAI Super Admin Setup                      ║');
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');

  const userId = generateId();
  const hashedPassword = hashPassword(SUPERADMIN_CONFIG.password);

  console.log('📝 Super Admin Configuration:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Email:        ${SUPERADMIN_CONFIG.email}`);
  console.log(`Password:     ${SUPERADMIN_CONFIG.password}`);
  console.log(`Name:         ${SUPERADMIN_CONFIG.firstName} ${SUPERADMIN_CONFIG.lastName}`);
  console.log(`Role:         ${SUPERADMIN_CONFIG.role}`);
  console.log(`Company:      ${SUPERADMIN_CONFIG.companyCode}`);
  console.log(`Tenant ID:    ${SUPERADMIN_CONFIG.tenantId}`);
  console.log(`User ID:      ${userId}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // SQL for D1 database
  const now = new Date().toISOString();
  
  const sql = `
-- Create Super Admin User
INSERT OR REPLACE INTO users (
  _id,
  email,
  password,
  firstName,
  lastName,
  role,
  isActive,
  isVerified,
  companyId,
  tenantId,
  createdAt,
  updatedAt,
  lastLoginAt
) VALUES (
  '${userId}',
  '${SUPERADMIN_CONFIG.email}',
  '${hashedPassword}',
  '${SUPERADMIN_CONFIG.firstName}',
  '${SUPERADMIN_CONFIG.lastName}',
  '${SUPERADMIN_CONFIG.role}',
  ${SUPERADMIN_CONFIG.isActive ? 1 : 0},
  ${SUPERADMIN_CONFIG.isVerified ? 1 : 0},
  '${SUPERADMIN_CONFIG.companyCode}',
  '${SUPERADMIN_CONFIG.tenantId}',
  '${now}',
  '${now}',
  NULL
);

-- Create Company if not exists
INSERT OR IGNORE INTO companies (
  _id,
  companyCode,
  companyName,
  isActive,
  createdAt
) VALUES (
  '${SUPERADMIN_CONFIG.companyCode}',
  '${SUPERADMIN_CONFIG.companyCode}',
  'Vantax Corporation',
  1,
  '${now}'
);

-- Create Tenant if not exists
INSERT OR IGNORE INTO tenants (
  _id,
  tenantCode,
  tenantName,
  companyId,
  isActive,
  createdAt
) VALUES (
  '${SUPERADMIN_CONFIG.tenantId}',
  '${SUPERADMIN_CONFIG.tenantId}',
  'Vantax Main Tenant',
  '${SUPERADMIN_CONFIG.companyCode}',
  1,
  '${now}'
);
`;

  console.log('💾 D1 Database SQL:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(sql);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  console.log('📋 Deployment Instructions:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Option 1: Using Wrangler CLI (Recommended)');
  console.log('');
  console.log('  cd workers-backend');
  console.log('  wrangler d1 execute tradeai --file=- <<EOF');
  console.log(sql);
  console.log('  EOF');
  console.log('');
  console.log('Option 2: Using Wrangler with file');
  console.log('');
  console.log('  1. Save SQL to: workers-backend/migrations/0071_create_superadmin.sql');
  console.log('  2. Run: wrangler d1 execute tradeai --local --file=workers-backend/migrations/0071_create_superadmin.sql');
  console.log('  3. Run: wrangler d1 execute tradeai --file=workers-backend/migrations/0071_create_superadmin.sql');
  console.log('');
  console.log('Option 3: Via API (After deployment)');
  console.log('');
  console.log('  curl -X POST https://tradeai-api.reshigan-085.workers.dev/api/tenants/setup-superadmin \\');
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -d \'{"email":"admin@vantax.co.za","password":"TradeAI@2026!Secure"}\'');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  console.log('🔐 SECURITY REMINDERS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  1. ⚠️  Change password immediately after first login');
  console.log('  2. ⚠️  Enable two-factor authentication');
  console.log('  3. ⚠️  Store credentials in a secure password manager');
  console.log('  4. ⚠️  Never commit this file with credentials to git');
  console.log('  5. ⚠️  Delete this script after creating the user');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  console.log('✅ Super Admin setup script generated successfully!');
  console.log('');

  // Write SQL file
  const fs = require('fs');
  const path = require('path');
  
  const sqlPath = path.join(__dirname, '../workers-backend/migrations/0071_create_superadmin.sql');
  fs.writeFileSync(sqlPath, sql);
  
  console.log(`📄 SQL migration saved to: ${sqlPath}`);
  console.log('');
  console.log('Run this command to create the super admin:');
  console.log('');
  console.log(`  wrangler d1 execute tradeai --file=${sqlPath}`);
  console.log('');
}

// Run
createSuperAdmin().catch(console.error);
