#!/usr/bin/env node

/**
 * Generate Secure Secrets for TRADEAI Production
 * 
 * This script generates cryptographically secure random strings
 * for use in production environment configuration.
 * 
 * Usage:
 *   node scripts/generate-secrets.js
 */

const crypto = require('crypto');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

function generatePassword(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  
  return password;
}

function printHeader(text) {
  console.log(`\n${colors.blue}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.blue}${colors.bright}${text}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(70)}${colors.reset}\n`);
}

function printSecret(name, value, description) {
  console.log(`${colors.cyan}${name}:${colors.reset}`);
  console.log(`${colors.green}${value}${colors.reset}`);
  if (description) {
    console.log(`${colors.yellow}└─ ${description}${colors.reset}`);
  }
  console.log();
}

function printWarning(text) {
  console.log(`${colors.red}⚠  ${text}${colors.reset}\n`);
}

function printInfo(text) {
  console.log(`${colors.yellow}ℹ  ${text}${colors.reset}\n`);
}

// Main script
console.clear();

printHeader('TRADEAI Security Secrets Generator');

printWarning('CRITICAL: Never commit these secrets to version control!');
printWarning('CRITICAL: Store these secrets securely (password manager, vault, etc.)');

printInfo('Generating cryptographically secure random secrets...');

// Generate all secrets
const secrets = {
  jwtSecret: generateSecret(64),
  jwtRefreshSecret: generateSecret(64),
  sessionSecret: generateSecret(64),
  encryptionKey: generateSecret(16).substring(0, 32), // Exactly 32 characters
  mongoPassword: generatePassword(32),
  redisPassword: generatePassword(32),
  adminPassword: generatePassword(16)
};

// Display secrets organized by category
printHeader('JWT & Authentication Secrets');

printSecret(
  'JWT_SECRET',
  secrets.jwtSecret,
  'Used to sign access tokens (24h expiry)'
);

printSecret(
  'JWT_REFRESH_SECRET',
  secrets.jwtRefreshSecret,
  'Used to sign refresh tokens (30d expiry)'
);

printSecret(
  'SESSION_SECRET',
  secrets.sessionSecret,
  'Used for session cookie signing'
);

printHeader('Database Passwords');

printSecret(
  'MONGO_ROOT_PASSWORD',
  secrets.mongoPassword,
  'MongoDB root user password'
);

printSecret(
  'REDIS_PASSWORD',
  secrets.redisPassword,
  'Redis server password'
);

printHeader('Application Secrets');

printSecret(
  'ENCRYPTION_KEY',
  secrets.encryptionKey,
  'Exactly 32 characters for AES-256 encryption'
);

printSecret(
  'ADMIN_PASSWORD',
  secrets.adminPassword,
  'Initial admin user password (change after first login!)'
);

// Generate ready-to-use .env snippet
printHeader('Ready-to-Use Environment Variables');

console.log(`${colors.cyan}Copy these lines to your .env file:${colors.reset}\n`);

const envSnippet = `# JWT & Authentication (Generated: ${new Date().toISOString()})
JWT_SECRET=${secrets.jwtSecret}
JWT_REFRESH_SECRET=${secrets.jwtRefreshSecret}
SESSION_SECRET=${secrets.sessionSecret}

# Database Passwords
MONGO_ROOT_PASSWORD=${secrets.mongoPassword}
REDIS_PASSWORD=${secrets.redisPassword}

# Encryption
ENCRYPTION_KEY=${secrets.encryptionKey}

# Initial Admin Password (change after first login!)
ADMIN_PASSWORD=${secrets.adminPassword}`;

console.log(`${colors.green}${envSnippet}${colors.reset}\n`);

// Save to file option
printHeader('Save to File');

const fs = require('fs');
const path = require('path');

const secretsDir = path.join(__dirname, '../.secrets');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const filename = path.join(secretsDir, `secrets-${timestamp}.txt`);

try {
  if (!fs.existsSync(secretsDir)) {
    fs.mkdirSync(secretsDir, { recursive: true });
  }
  
  const fileContent = `TRADEAI Production Secrets
Generated: ${new Date().toISOString()}

${envSnippet}

⚠️  SECURITY WARNINGS:
1. Never commit this file to version control!
2. Store these secrets securely (password manager, vault, etc.)
3. Use different secrets for each environment (dev, staging, prod)
4. Rotate secrets periodically (every 90 days recommended)
5. Change ADMIN_PASSWORD immediately after first login
6. Keep backup of these secrets in secure location

📖 Next Steps:
1. Copy the environment variables above to your .env file
2. Update MONGODB_URI with the MONGO_ROOT_PASSWORD
3. Update REDIS_URL with the REDIS_PASSWORD
4. Run: node scripts/seed-production-users.js
5. Start the application and login
6. Change admin password immediately
7. Delete or secure this file

🔒 MongoDB Connection String:
mongodb://admin:${secrets.mongoPassword}@localhost:27017/tradeai?authSource=admin

🔒 Redis Connection String:
redis://:${secrets.redisPassword}@localhost:6379
`;

  fs.writeFileSync(filename, fileContent);
  
  console.log(`${colors.green}✓ Secrets saved to: ${filename}${colors.reset}\n`);
  printWarning(`Secure this file immediately! It contains sensitive credentials.`);
  
  // Check if .gitignore exists and includes .secrets
  const gitignorePath = path.join(__dirname, '../.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignoreContent.includes('.secrets')) {
      console.log(`${colors.yellow}Adding .secrets/ to .gitignore...${colors.reset}`);
      fs.appendFileSync(gitignorePath, '\n# Secret files\n.secrets/\n');
      console.log(`${colors.green}✓ Updated .gitignore${colors.reset}\n`);
    }
  }
  
} catch (error) {
  printWarning(`Could not save to file: ${error.message}`);
}

// Usage instructions
printHeader('Next Steps');

console.log(`${colors.cyan}1. Copy the environment variables above${colors.reset}`);
console.log(`   ${colors.yellow}└─ Add them to your .env file${colors.reset}\n`);

console.log(`${colors.cyan}2. Update database connection strings${colors.reset}`);
console.log(`   ${colors.yellow}└─ Use the generated passwords in MONGODB_URI and REDIS_URL${colors.reset}\n`);

console.log(`${colors.cyan}3. Seed initial users${colors.reset}`);
console.log(`   ${colors.yellow}└─ Run: node scripts/seed-production-users.js${colors.reset}\n`);

console.log(`${colors.cyan}4. Start the application${colors.reset}`);
console.log(`   ${colors.yellow}└─ Run: ./scripts/start-production.sh${colors.reset}\n`);

console.log(`${colors.cyan}5. Change admin password${colors.reset}`);
console.log(`   ${colors.yellow}└─ Login and immediately change the default password${colors.reset}\n`);

console.log(`${colors.cyan}6. Secure the secrets file${colors.reset}`);
console.log(`   ${colors.yellow}└─ Move ${filename} to a secure location or delete it${colors.reset}\n`);

// Security reminders
printHeader('Security Reminders');

const reminders = [
  'Never commit secrets to version control',
  'Use different secrets for each environment',
  'Store secrets in a password manager or vault',
  'Rotate secrets every 90 days',
  'Limit access to secrets (need-to-know basis)',
  'Monitor for unauthorized access attempts',
  'Enable 2FA for admin accounts',
  'Keep backups of secrets in secure location',
  'Use environment variables in production',
  'Never log or display secrets in application'
];

reminders.forEach((reminder, index) => {
  console.log(`${colors.yellow}${index + 1}. ${reminder}${colors.reset}`);
});

console.log();
printHeader('Generation Complete');

console.log(`${colors.green}✓ All secrets generated successfully!${colors.reset}\n`);
console.log(`${colors.cyan}Questions? See docs/AUTHENTICATION_SETUP_GUIDE.md${colors.reset}\n`);
