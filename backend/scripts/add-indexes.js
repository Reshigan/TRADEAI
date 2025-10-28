#!/usr/bin/env node

/**
 * Add Database Indexes for Production Performance
 * 
 * This script adds critical indexes to improve query performance.
 * Run this before deploying to production.
 * 
 * Usage: node scripts/add-indexes.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradeai';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`)
};

// Index definitions for each collection
const indexDefinitions = {
  users: [
    { fields: { email: 1 }, options: { unique: true } },
    { fields: { username: 1 }, options: { unique: true } },
    { fields: { tenant: 1, role: 1 }, options: {} },
    { fields: { isActive: 1, tenant: 1 }, options: {} },
    { fields: { resetPasswordToken: 1 }, options: { sparse: true } },
    { fields: { createdAt: -1 }, options: {} }
  ],
  
  tradespends: [
    { fields: { tenant: 1, createdAt: -1 }, options: {} },
    { fields: { category: 1, tenant: 1 }, options: {} },
    { fields: { status: 1, tenant: 1 }, options: {} },
    { fields: { customerId: 1, tenant: 1 }, options: {} },
    { fields: { startDate: 1, endDate: 1 }, options: {} }
  ],
  
  budgets: [
    { fields: { tenant: 1, year: 1, month: 1 }, options: {} },
    { fields: { category: 1, tenant: 1 }, options: {} },
    { fields: { status: 1, tenant: 1 }, options: {} },
    { fields: { createdAt: -1 }, options: {} }
  ],
  
  promotions: [
    { fields: { tenant: 1, status: 1 }, options: {} },
    { fields: { startDate: 1, endDate: 1 }, options: {} },
    { fields: { customerId: 1, tenant: 1 }, options: {} },
    { fields: { promotionType: 1, tenant: 1 }, options: {} },
    { fields: { createdAt: -1 }, options: {} }
  ],
  
  salestransactions: [
    { fields: { tenant: 1, transactionDate: -1 }, options: {} },
    { fields: { customerId: 1, tenant: 1 }, options: {} },
    { fields: { productId: 1, tenant: 1 }, options: {} },
    { fields: { invoiceNumber: 1 }, options: { unique: true, sparse: true } },
    { fields: { status: 1, tenant: 1 }, options: {} }
  ],
  
  activities: [
    { fields: { tenant: 1, createdAt: -1 }, options: {} },
    { fields: { userId: 1, tenant: 1 }, options: {} },
    { fields: { activityType: 1, tenant: 1 }, options: {} },
    { fields: { entityType: 1, entityId: 1 }, options: {} }
  ],
  
  customers: [
    { fields: { tenant: 1, customerCode: 1 }, options: {} },
    { fields: { name: 1, tenant: 1 }, options: {} },
    { fields: { isActive: 1, tenant: 1 }, options: {} },
    { fields: { tier: 1, tenant: 1 }, options: {} }
  ],
  
  products: [
    { fields: { tenant: 1, sku: 1 }, options: {} },
    { fields: { name: 1, tenant: 1 }, options: {} },
    { fields: { category: 1, tenant: 1 }, options: {} },
    { fields: { isActive: 1, tenant: 1 }, options: {} }
  ],
  
  invoices: [
    { fields: { tenant: 1, invoiceDate: -1 }, options: {} },
    { fields: { invoiceNumber: 1 }, options: { unique: true } },
    { fields: { customerId: 1, tenant: 1 }, options: {} },
    { fields: { status: 1, tenant: 1 }, options: {} },
    { fields: { dueDate: 1, tenant: 1 }, options: {} }
  ],
  
  accruals: [
    { fields: { tenant: 1, period: 1 }, options: {} },
    { fields: { promotionId: 1, tenant: 1 }, options: {} },
    { fields: { customerId: 1, tenant: 1 }, options: {} },
    { fields: { status: 1, tenant: 1 }, options: {} }
  ],
  
  campaigns: [
    { fields: { tenant: 1, status: 1 }, options: {} },
    { fields: { startDate: 1, endDate: 1 }, options: {} },
    { fields: { campaignType: 1, tenant: 1 }, options: {} }
  ],
  
  auditlogs: [
    { fields: { tenant: 1, timestamp: -1 }, options: {} },
    { fields: { userId: 1, tenant: 1, timestamp: -1 }, options: {} },
    { fields: { action: 1, tenant: 1 }, options: {} },
    { fields: { entityType: 1, entityId: 1 }, options: {} }
  ]
};

async function createIndexes() {
  log.info(`Connecting to MongoDB: ${MONGODB_URI.replace(/\/\/.*:.*@/, '//<credentials>@')}`);
  
  try {
    await mongoose.connect(MONGODB_URI);
    log.success('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    let totalIndexes = 0;
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const [collectionName, indexes] of Object.entries(indexDefinitions)) {
      log.info(`\nProcessing collection: ${collectionName}`);
      
      // Check if collection exists
      const collections = await db.listCollections({ name: collectionName }).toArray();
      if (collections.length === 0) {
        log.warning(`  Collection '${collectionName}' does not exist, skipping...`);
        continue;
      }
      
      const collection = db.collection(collectionName);
      
      // Get existing indexes
      const existingIndexes = await collection.indexes();
      const existingIndexNames = new Set(existingIndexes.map(idx => idx.name));
      
      for (const indexDef of indexes) {
        totalIndexes++;
        const indexName = Object.keys(indexDef.fields)
          .map(field => `${field}_${indexDef.fields[field]}`)
          .join('_');
        
        try {
          // Check if index already exists
          if (existingIndexNames.has(indexName)) {
            log.warning(`  Index '${indexName}' already exists, skipping...`);
            skipCount++;
            continue;
          }
          
          // Create the index
          await collection.createIndex(indexDef.fields, {
            ...indexDef.options,
            name: indexName,
            background: true // Create index in background to avoid blocking
          });
          
          log.success(`  Created index: ${indexName}`);
          successCount++;
        } catch (error) {
          if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
            log.warning(`  Index '${indexName}' exists with different options, skipping...`);
            skipCount++;
          } else if (error.code === 11000) {
            log.warning(`  Duplicate key error for '${indexName}', data cleanup may be needed`);
            errorCount++;
          } else {
            log.error(`  Failed to create index '${indexName}': ${error.message}`);
            errorCount++;
          }
        }
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    log.info('Index Creation Summary:');
    log.success(`  Created: ${successCount} indexes`);
    if (skipCount > 0) log.warning(`  Skipped: ${skipCount} indexes (already exist)`);
    if (errorCount > 0) log.error(`  Failed: ${errorCount} indexes`);
    log.info(`  Total: ${totalIndexes} indexes processed`);
    console.log('='.repeat(60) + '\n');
    
    if (errorCount > 0) {
      log.warning('Some indexes failed to create. Please review the errors above.');
      log.info('Common issues:');
      log.info('  - Duplicate data: Clean up duplicate records before creating unique indexes');
      log.info('  - Invalid field names: Ensure field names match your schema');
      process.exit(1);
    } else {
      log.success('All indexes created successfully!');
      log.info('Database is optimized for production queries.');
    }
    
  } catch (error) {
    log.error(`Failed to connect or create indexes: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    log.info('Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  createIndexes()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      log.error(`Unhandled error: ${error.message}`);
      console.error(error);
      process.exit(1);
    });
}

module.exports = { createIndexes, indexDefinitions };
