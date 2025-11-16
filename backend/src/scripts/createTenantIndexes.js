#!/usr/bin/env node

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

/**
 * Database Index Creation Script for Multi-tenant Performance Optimization
 * Creates optimized indexes for tenant-aware queries
 */

class TenantIndexManager {
  constructor() {
    this.dryRun = process.argv.includes('--dry-run');
    this.verbose = process.argv.includes('--verbose');
    this.stats = {
      indexesCreated: 0,
      indexesSkipped: 0,
      errors: []
    };
  }

  log(message, level = 'info') {
    if (level === 'error' || this.verbose) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    }
  }

  async connectDatabase() {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      this.log('Connected to MongoDB');
    } catch (error) {
      this.log(`Database connection failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async disconnectDatabase() {
    await mongoose.disconnect();
    this.log('Disconnected from MongoDB');
  }

  /**
   * Define tenant-optimized indexes
   */
  getTenantIndexes() {
    return {
      // Tenant collection indexes
      tenants: [
        { fields: { status: 1, isActive: 1 }, name: 'tenant_status_active' },
        { fields: { domain: 1 }, name: 'tenant_domain', unique: true },
        { fields: { 'subscription.tier': 1, 'subscription.status': 1 }, name: 'tenant_subscription' },
        { fields: { createdAt: -1 }, name: 'tenant_created_desc' },
        { fields: { legacyCompanyId: 1 }, name: 'tenant_legacy_company', sparse: true }
      ],

      // User collection indexes
      users: [
        { fields: { tenantId: 1, isActive: 1 }, name: 'user_tenant_active' },
        { fields: { tenantId: 1, email: 1 }, name: 'user_tenant_email', unique: true },
        { fields: { tenantId: 1, role: 1 }, name: 'user_tenant_role' },
        { fields: { tenantId: 1, createdAt: -1 }, name: 'user_tenant_created' },
        { fields: { tenantId: 1, isDeleted: 1, isActive: 1 }, name: 'user_tenant_status' },
        { fields: { email: 1 }, name: 'user_email_global' }, // For login
        { fields: { resetPasswordToken: 1 }, name: 'user_reset_token', sparse: true }
      ],

      // Customer collection indexes
      customers: [
        { fields: { tenantId: 1, isActive: 1 }, name: 'customer_tenant_active' },
        { fields: { tenantId: 1, code: 1 }, name: 'customer_tenant_code', unique: true },
        { fields: { tenantId: 1, name: 1 }, name: 'customer_tenant_name' },
        { fields: { tenantId: 1, createdAt: -1 }, name: 'customer_tenant_created' },
        { fields: { tenantId: 1, isDeleted: 1 }, name: 'customer_tenant_deleted' },
        { fields: { tenantId: 1, 'address.city': 1 }, name: 'customer_tenant_city' },
        { fields: { tenantId: 1, 'address.country': 1 }, name: 'customer_tenant_country' },
        // Hierarchical indexes (for future hierarchy implementation)
        { fields: { tenantId: 1, parentId: 1 }, name: 'customer_tenant_parent', sparse: true },
        { fields: { tenantId: 1, level: 1 }, name: 'customer_tenant_level', sparse: true },
        { fields: { tenantId: 1, path: 1 }, name: 'customer_tenant_path', sparse: true }
      ],

      // Product collection indexes
      products: [
        { fields: { tenantId: 1, isActive: 1 }, name: 'product_tenant_active' },
        { fields: { tenantId: 1, sku: 1 }, name: 'product_tenant_sku', unique: true },
        { fields: { tenantId: 1, name: 1 }, name: 'product_tenant_name' },
        { fields: { tenantId: 1, category: 1 }, name: 'product_tenant_category' },
        { fields: { tenantId: 1, createdAt: -1 }, name: 'product_tenant_created' },
        { fields: { tenantId: 1, isDeleted: 1 }, name: 'product_tenant_deleted' },
        { fields: { tenantId: 1, price: 1 }, name: 'product_tenant_price' },
        // Hierarchical indexes
        { fields: { tenantId: 1, parentId: 1 }, name: 'product_tenant_parent', sparse: true },
        { fields: { tenantId: 1, level: 1 }, name: 'product_tenant_level', sparse: true }
      ],

      // Promotion collection indexes
      promotions: [
        { fields: { tenantId: 1, status: 1 }, name: 'promotion_tenant_status' },
        { fields: { tenantId: 1, startDate: 1, endDate: 1 }, name: 'promotion_tenant_dates' },
        { fields: { tenantId: 1, type: 1 }, name: 'promotion_tenant_type' },
        { fields: { tenantId: 1, createdAt: -1 }, name: 'promotion_tenant_created' },
        { fields: { tenantId: 1, isDeleted: 1 }, name: 'promotion_tenant_deleted' },
        { fields: { tenantId: 1, 'products.productId': 1 }, name: 'promotion_tenant_products' },
        { fields: { tenantId: 1, 'customers.customerId': 1 }, name: 'promotion_tenant_customers' }
      ],

      // Company collection indexes (legacy support)
      companies: [
        { fields: { isActive: 1 }, name: 'company_active' },
        { fields: { name: 1 }, name: 'company_name' },
        { fields: { domain: 1 }, name: 'company_domain', unique: true, sparse: true },
        { fields: { createdAt: -1 }, name: 'company_created' }
      ]
    };
  }

  /**
   * Create index for a collection
   */
  async createIndex(collectionName, indexSpec) {
    try {
      const collection = mongoose.connection.db.collection(collectionName);

      // Check if index already exists
      const existingIndexes = await collection.indexes();
      const indexExists = existingIndexes.some((idx) => idx.name === indexSpec.name);

      if (indexExists) {
        this.log(`Index ${indexSpec.name} already exists on ${collectionName}`, 'verbose');
        this.stats.indexesSkipped++;
        return;
      }

      if (!this.dryRun) {
        const options = {
          name: indexSpec.name,
          background: true
        };

        if (indexSpec.unique) {
          options.unique = true;
        }

        if (indexSpec.sparse) {
          options.sparse = true;
        }

        await collection.createIndex(indexSpec.fields, options);
        this.log(`Created index: ${indexSpec.name} on ${collectionName}`, 'verbose');
        this.stats.indexesCreated++;
      } else {
        this.log(`[DRY RUN] Would create index: ${indexSpec.name} on ${collectionName}`, 'verbose');
      }

    } catch (error) {
      const errorMsg = `Failed to create index ${indexSpec.name} on ${collectionName}: ${error.message}`;
      this.log(errorMsg, 'error');
      this.stats.errors.push(errorMsg);
    }
  }

  /**
   * Create all tenant-optimized indexes
   */
  async createAllIndexes() {
    this.log('Creating tenant-optimized database indexes...');

    const indexes = this.getTenantIndexes();

    for (const [collectionName, collectionIndexes] of Object.entries(indexes)) {
      this.log(`Processing ${collectionName} collection...`);

      for (const indexSpec of collectionIndexes) {
        await this.createIndex(collectionName, indexSpec);
      }
    }
  }

  /**
   * Analyze query performance
   */
  async analyzeQueryPerformance() {
    this.log('Analyzing query performance...');

    try {
      const db = mongoose.connection.db;

      // Sample queries to analyze
      const queries = [
        {
          collection: 'users',
          query: { tenantId: new mongoose.Types.ObjectId(), isActive: true },
          description: 'Find active users by tenant'
        },
        {
          collection: 'customers',
          query: { tenantId: new mongoose.Types.ObjectId(), isDeleted: false },
          description: 'Find non-deleted customers by tenant'
        },
        {
          collection: 'products',
          query: { tenantId: new mongoose.Types.ObjectId(), category: 'electronics' },
          description: 'Find products by tenant and category'
        },
        {
          collection: 'promotions',
          query: {
            tenantId: new mongoose.Types.ObjectId(),
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
          },
          description: 'Find active promotions by tenant'
        }
      ];

      for (const querySpec of queries) {
        try {
          const collection = db.collection(querySpec.collection);
          const explain = await collection.find(querySpec.query).explain('executionStats');

          this.log(`\n--- Query Analysis: ${querySpec.description} ---`);
          this.log(`Collection: ${querySpec.collection}`);
          this.log(`Execution time: ${explain.executionStats.executionTimeMillis}ms`);
          this.log(`Documents examined: ${explain.executionStats.totalDocsExamined}`);
          this.log(`Documents returned: ${explain.executionStats.totalDocsReturned}`);
          this.log(`Index used: ${explain.executionStats.executionStages.indexName || 'COLLSCAN'}`);

          if (explain.executionStats.executionStages.stage === 'COLLSCAN') {
            this.log('⚠️  WARNING: Full collection scan detected!', 'error');
          }

        } catch (error) {
          this.log(`Failed to analyze query for ${querySpec.collection}: ${error.message}`, 'error');
        }
      }

    } catch (error) {
      this.log(`Query analysis failed: ${error.message}`, 'error');
    }
  }

  /**
   * Get index usage statistics
   */
  async getIndexStats() {
    this.log('Gathering index usage statistics...');

    try {
      const db = mongoose.connection.db;
      const collections = ['tenants', 'users', 'customers', 'products', 'promotions'];

      for (const collectionName of collections) {
        try {
          const collection = db.collection(collectionName);
          const stats = await collection.aggregate([
            { $indexStats: {} }
          ]).toArray();

          this.log(`\n--- Index Statistics: ${collectionName} ---`);

          for (const indexStat of stats) {
            this.log(`Index: ${indexStat.name}`);
            this.log(`  Accesses: ${indexStat.accesses.ops}`);
            this.log(`  Since: ${indexStat.accesses.since}`);
          }

        } catch (error) {
          this.log(`Failed to get stats for ${collectionName}: ${error.message}`, 'error');
        }
      }

    } catch (error) {
      this.log(`Index statistics failed: ${error.message}`, 'error');
    }
  }

  /**
   * Run the complete index optimization
   */
  async run() {
    const startTime = Date.now();

    this.log(`Starting database index optimization${this.dryRun ? ' (DRY RUN)' : ''}...`);

    try {
      await this.connectDatabase();

      await this.createAllIndexes();

      if (!this.dryRun) {
        await this.analyzeQueryPerformance();
        await this.getIndexStats();
      }

      const duration = (Date.now() - startTime) / 1000;

      this.log('\n=== INDEX OPTIMIZATION COMPLETED ===');
      this.log(`Duration: ${duration}s`);
      this.log(`Indexes created: ${this.stats.indexesCreated}`);
      this.log(`Indexes skipped: ${this.stats.indexesSkipped}`);
      this.log(`Errors: ${this.stats.errors.length}`);

      if (this.stats.errors.length > 0) {
        this.log('\n=== ERRORS ===');
        this.stats.errors.forEach((error) => this.log(error, 'error'));
      }

    } catch (error) {
      this.log(`Index optimization failed: ${error.message}`, 'error');
      throw error;
    } finally {
      await this.disconnectDatabase();
    }
  }
}

// Run optimization if called directly
if (require.main === module) {
  const indexManager = new TenantIndexManager();

  indexManager.run()
    .then(() => {
      console.log('Index optimization completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Index optimization failed:', error);
      process.exit(1);
    });
}

module.exports = TenantIndexManager;
