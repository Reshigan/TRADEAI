#!/usr/bin/env node
/**
 * DATABASE OPTIMIZATION SCRIPT
 * 
 * Creates indices and optimizes MongoDB for production performance
 * 
 * Run: node backend/scripts/optimize-database.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradeai';

// Index definitions for optimal performance
const indices = [
  // SalesHistory - Most queried collection
  {
    collection: 'saleshistories',
    indices: [
      { fields: { tenantId: 1, date: -1 }, options: { name: 'tenant_date_idx' } },
      { fields: { productId: 1, date: -1 }, options: { name: 'product_date_idx' } },
      { fields: { customerId: 1, date: -1 }, options: { name: 'customer_date_idx' } },
      { fields: { tenantId: 1, productId: 1, customerId: 1, date: -1 }, options: { name: 'composite_query_idx' } },
      { fields: { storeId: 1, date: -1 }, options: { name: 'store_date_idx' } },
      { fields: { promotionId: 1 }, options: { name: 'promotion_idx', sparse: true } },
      { fields: { date: 1 }, options: { name: 'date_idx' } }
    ]
  },
  
  // Transactions
  {
    collection: 'transactions',
    indices: [
      { fields: { tenantId: 1, status: 1, createdAt: -1 }, options: { name: 'tenant_status_date_idx' } },
      { fields: { customerId: 1, createdAt: -1 }, options: { name: 'customer_date_idx' } },
      { fields: { productId: 1, createdAt: -1 }, options: { name: 'product_date_idx' } },
      { fields: { promotionId: 1 }, options: { name: 'promotion_idx', sparse: true } },
      { fields: { status: 1, createdAt: -1 }, options: { name: 'status_date_idx' } },
      { fields: { createdBy: 1 }, options: { name: 'created_by_idx' } },
      { fields: { approvedBy: 1 }, options: { name: 'approved_by_idx', sparse: true } }
    ]
  },
  
  // Products
  {
    collection: 'products',
    indices: [
      { fields: { tenantId: 1, sku: 1 }, options: { name: 'tenant_sku_idx', unique: true } },
      { fields: { category: 1 }, options: { name: 'category_idx' } },
      { fields: { brand: 1 }, options: { name: 'brand_idx' } },
      { fields: { tenantId: 1, category: 1 }, options: { name: 'tenant_category_idx' } }
    ]
  },
  
  // Customers
  {
    collection: 'customers',
    indices: [
      { fields: { tenantId: 1, code: 1 }, options: { name: 'tenant_code_idx', unique: true } },
      { fields: { type: 1 }, options: { name: 'type_idx' } },
      { fields: { parentId: 1 }, options: { name: 'parent_idx', sparse: true } },
      { fields: { regionId: 1 }, options: { name: 'region_idx', sparse: true } }
    ]
  },
  
  // Stores
  {
    collection: 'stores',
    indices: [
      { fields: { tenantId: 1, storeCode: 1 }, options: { name: 'tenant_store_idx', unique: true } },
      { fields: { customerId: 1 }, options: { name: 'customer_idx' } },
      { fields: { regionId: 1 }, options: { name: 'region_idx' } },
      { fields: { districtId: 1 }, options: { name: 'district_idx' } }
    ]
  },
  
  // Users
  {
    collection: 'users',
    indices: [
      { fields: { email: 1 }, options: { name: 'email_idx', unique: true } },
      { fields: { tenantId: 1, role: 1 }, options: { name: 'tenant_role_idx' } }
    ]
  },
  
  // Promotions
  {
    collection: 'promotions',
    indices: [
      { fields: { tenantId: 1, startDate: -1 }, options: { name: 'tenant_start_idx' } },
      { fields: { productId: 1, startDate: -1 }, options: { name: 'product_start_idx' } },
      { fields: { customerId: 1, startDate: -1 }, options: { name: 'customer_start_idx' } },
      { fields: { status: 1 }, options: { name: 'status_idx' } }
    ]
  },
  
  // BaselineCalculations (cache)
  {
    collection: 'baselinecalculations',
    indices: [
      { fields: { tenantId: 1, productId: 1, customerId: 1, startDate: 1 }, options: { name: 'cache_key_idx', unique: true } },
      { fields: { createdAt: 1 }, options: { name: 'created_idx', expireAfterSeconds: 2592000 } } // 30 days TTL
    ]
  }
];

async function createIndices() {
  console.log('🔧 Database Optimization Script\n');
  console.log(`Connecting to: ${MONGODB_URI}\n`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    let totalIndices = 0;

    for (const collectionDef of indices) {
      const { collection, indices: collectionIndices } = collectionDef;
      
      console.log(`📊 Collection: ${collection}`);
      
      // Check if collection exists
      const collections = await db.listCollections({ name: collection }).toArray();
      if (collections.length === 0) {
        console.log(`  ⚠️  Collection does not exist yet, skipping\n`);
        continue;
      }

      const coll = db.collection(collection);

      // Get existing indices
      const existingIndices = await coll.indexes();
      const existingIndexNames = existingIndices.map(idx => idx.name);

      for (const indexDef of collectionIndices) {
        const { fields, options } = indexDef;
        const indexName = options.name;

        try {
          if (existingIndexNames.includes(indexName)) {
            console.log(`  ✓ Index "${indexName}" already exists`);
          } else {
            await coll.createIndex(fields, options);
            console.log(`  ✓ Created index "${indexName}"`);
            totalIndices++;
          }
        } catch (error) {
          console.log(`  ✗ Error creating index "${indexName}": ${error.message}`);
        }
      }

      console.log('');
    }

    console.log(`\n✅ Optimization complete!`);
    console.log(`   Created ${totalIndices} new indices\n`);

    // Print collection statistics
    console.log('📈 Collection Statistics:\n');
    
    for (const collectionDef of indices) {
      const { collection } = collectionDef;
      
      try {
        const coll = db.collection(collection);
        const stats = await coll.stats();
        const count = await coll.countDocuments();
        
        console.log(`${collection}:`);
        console.log(`  Documents: ${count.toLocaleString()}`);
        console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  Indices: ${stats.nindexes}`);
        console.log(`  Index Size: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB\n`);
      } catch (error) {
        // Collection doesn't exist yet
      }
    }

    // Analyze query performance suggestions
    console.log('💡 Performance Recommendations:\n');
    console.log('1. Enable MongoDB Profiling:');
    console.log('   db.setProfilingLevel(1, { slowms: 100 })');
    console.log('\n2. Monitor index usage:');
    console.log('   db.collection.aggregate([{ $indexStats: {} }])');
    console.log('\n3. Use explain() for query optimization:');
    console.log('   db.collection.find().explain("executionStats")');
    console.log('\n4. Consider sharding for large datasets (>100M docs)');
    console.log('\n5. Enable compression for storage optimization');
    console.log('\n6. Set up Redis caching for frequently accessed data\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Disconnected from MongoDB');
  }
}

// Analyze slow queries
async function analyzeSlowQueries() {
  console.log('\n🔍 Analyzing Slow Queries...\n');
  
  try {
    const db = mongoose.connection.db;
    
    // Get slow queries from system.profile
    const slowQueries = await db.collection('system.profile')
      .find({ millis: { $gt: 100 } })
      .sort({ millis: -1 })
      .limit(10)
      .toArray();

    if (slowQueries.length > 0) {
      console.log('Top 10 Slowest Queries:\n');
      slowQueries.forEach((query, idx) => {
        console.log(`${idx + 1}. ${query.ns} - ${query.millis}ms`);
        console.log(`   Query: ${JSON.stringify(query.command, null, 2)}\n`);
      });
    } else {
      console.log('No slow queries found. Enable profiling first:\n');
      console.log('db.setProfilingLevel(1, { slowms: 100 })\n');
    }
  } catch (error) {
    console.log('⚠️  Profiling not enabled or not available\n');
  }
}

// Run optimization
if (require.main === module) {
  createIndices()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { createIndices, analyzeSlowQueries };
