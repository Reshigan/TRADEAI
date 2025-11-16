#!/usr/bin/env node

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Import models
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const Company = require('../models/Company');

/**
 * Data Migration Script for Multi-tenancy
 * Migrates existing company-based data to tenant-based structure
 */

class TenantDataMigration {
  constructor() {
    this.dryRun = process.argv.includes('--dry-run');
    this.verbose = process.argv.includes('--verbose');
    this.stats = {
      tenantsCreated: 0,
      usersUpdated: 0,
      customersUpdated: 0,
      productsUpdated: 0,
      promotionsUpdated: 0,
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
   * Step 1: Create tenants from existing companies
   */
  async createTenantsFromCompanies() {
    this.log('Step 1: Creating tenants from companies...');

    try {
      // Get all companies
      const companies = await Company.find({}).lean();
      this.log(`Found ${companies.length} companies to migrate`);

      for (const company of companies) {
        try {
          // Check if tenant already exists
          const existingTenant = await Tenant.findOne({
            $or: [
              { legacyCompanyId: company._id },
              { name: company.name }
            ]
          });

          if (existingTenant) {
            this.log(`Tenant already exists for company: ${company.name}`, 'verbose');
            continue;
          }

          // Create tenant data
          const tenantData = {
            name: company.name,
            domain: company.domain || `${company.name.toLowerCase().replace(/\s+/g, '-')}.tradeai.com`,
            status: company.isActive ? 'active' : 'suspended',

            // Contact information
            contactInfo: {
              email: company.contactEmail || `admin@${company.domain || 'example.com'}`,
              phone: company.contactPhone || '',
              address: {
                street: company.address?.street || '',
                city: company.address?.city || '',
                state: company.address?.state || '',
                country: company.address?.country || '',
                zipCode: company.address?.zipCode || ''
              }
            },

            // Subscription (default to trial)
            subscription: {
              tier: 'trial',
              status: 'active',
              startDate: company.createdAt || new Date(),
              features: ['basic_analytics', 'user_management']
            },

            // Resource limits (trial limits)
            limits: {
              maxUsers: 10,
              maxStorage: 1024 * 1024 * 1024, // 1GB
              maxApiCalls: 1000
            },

            // Usage tracking
            usage: {
              users: 0,
              storage: 0,
              apiCalls: 0
            },

            // Feature flags
            features: {
              advancedAnalytics: false,
              customReports: false,
              apiAccess: true,
              multiUser: true,
              dataExport: false
            },

            // Legacy reference
            legacyCompanyId: company._id,

            // Audit fields
            createdAt: company.createdAt || new Date(),
            updatedAt: new Date(),
            isActive: company.isActive !== false
          };

          if (!this.dryRun) {
            const tenant = await Tenant.create(tenantData);
            this.log(`Created tenant: ${tenant.name} (${tenant._id})`, 'verbose');
            this.stats.tenantsCreated++;
          } else {
            this.log(`[DRY RUN] Would create tenant: ${tenantData.name}`, 'verbose');
          }

        } catch (error) {
          const errorMsg = `Failed to create tenant for company ${company.name}: ${error.message}`;
          this.log(errorMsg, 'error');
          this.stats.errors.push(errorMsg);
        }
      }

      this.log(`Step 1 completed. Tenants created: ${this.stats.tenantsCreated}`);

    } catch (error) {
      this.log(`Step 1 failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Step 2: Update users with tenant references
   */
  async updateUsersWithTenants() {
    this.log('Step 2: Updating users with tenant references...');

    try {
      // Get all users with company references
      const users = await User.find({ companyId: { $exists: true } }).lean();
      this.log(`Found ${users.length} users to update`);

      for (const user of users) {
        try {
          // Find corresponding tenant
          const tenant = await Tenant.findOne({ legacyCompanyId: user.companyId });

          if (!tenant) {
            const errorMsg = `No tenant found for user ${user.email} with companyId ${user.companyId}`;
            this.log(errorMsg, 'error');
            this.stats.errors.push(errorMsg);
            continue;
          }

          if (!this.dryRun) {
            await User.updateOne(
              { _id: user._id },
              {
                $set: {
                  tenantId: tenant._id,
                  updatedAt: new Date()
                }
              }
            );
            this.log(`Updated user: ${user.email} -> tenant: ${tenant.name}`, 'verbose');
            this.stats.usersUpdated++;
          } else {
            this.log(`[DRY RUN] Would update user: ${user.email} -> tenant: ${tenant.name}`, 'verbose');
          }

        } catch (error) {
          const errorMsg = `Failed to update user ${user.email}: ${error.message}`;
          this.log(errorMsg, 'error');
          this.stats.errors.push(errorMsg);
        }
      }

      this.log(`Step 2 completed. Users updated: ${this.stats.usersUpdated}`);

    } catch (error) {
      this.log(`Step 2 failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Step 3: Update customers with tenant references
   */
  async updateCustomersWithTenants() {
    this.log('Step 3: Updating customers with tenant references...');

    try {
      const customers = await Customer.find({ company: { $exists: true } }).lean();
      this.log(`Found ${customers.length} customers to update`);

      for (const customer of customers) {
        try {
          const tenant = await Tenant.findOne({ legacyCompanyId: customer.company });

          if (!tenant) {
            const errorMsg = `No tenant found for customer ${customer.name} with companyId ${customer.company}`;
            this.log(errorMsg, 'error');
            this.stats.errors.push(errorMsg);
            continue;
          }

          if (!this.dryRun) {
            await Customer.updateOne(
              { _id: customer._id },
              {
                $set: {
                  tenantId: tenant._id,
                  updatedAt: new Date()
                }
              }
            );
            this.log(`Updated customer: ${customer.name} -> tenant: ${tenant.name}`, 'verbose');
            this.stats.customersUpdated++;
          } else {
            this.log(`[DRY RUN] Would update customer: ${customer.name} -> tenant: ${tenant.name}`, 'verbose');
          }

        } catch (error) {
          const errorMsg = `Failed to update customer ${customer.name}: ${error.message}`;
          this.log(errorMsg, 'error');
          this.stats.errors.push(errorMsg);
        }
      }

      this.log(`Step 3 completed. Customers updated: ${this.stats.customersUpdated}`);

    } catch (error) {
      this.log(`Step 3 failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Step 4: Update products with tenant references
   */
  async updateProductsWithTenants() {
    this.log('Step 4: Updating products with tenant references...');

    try {
      const products = await Product.find({ company: { $exists: true } }).lean();
      this.log(`Found ${products.length} products to update`);

      for (const product of products) {
        try {
          const tenant = await Tenant.findOne({ legacyCompanyId: product.company });

          if (!tenant) {
            const errorMsg = `No tenant found for product ${product.name} with companyId ${product.company}`;
            this.log(errorMsg, 'error');
            this.stats.errors.push(errorMsg);
            continue;
          }

          if (!this.dryRun) {
            await Product.updateOne(
              { _id: product._id },
              {
                $set: {
                  tenantId: tenant._id,
                  updatedAt: new Date()
                }
              }
            );
            this.log(`Updated product: ${product.name} -> tenant: ${tenant.name}`, 'verbose');
            this.stats.productsUpdated++;
          } else {
            this.log(`[DRY RUN] Would update product: ${product.name} -> tenant: ${tenant.name}`, 'verbose');
          }

        } catch (error) {
          const errorMsg = `Failed to update product ${product.name}: ${error.message}`;
          this.log(errorMsg, 'error');
          this.stats.errors.push(errorMsg);
        }
      }

      this.log(`Step 4 completed. Products updated: ${this.stats.productsUpdated}`);

    } catch (error) {
      this.log(`Step 4 failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Step 5: Update promotions with tenant references
   */
  async updatePromotionsWithTenants() {
    this.log('Step 5: Updating promotions with tenant references...');

    try {
      const promotions = await Promotion.find({ company: { $exists: true } }).lean();
      this.log(`Found ${promotions.length} promotions to update`);

      for (const promotion of promotions) {
        try {
          const tenant = await Tenant.findOne({ legacyCompanyId: promotion.company });

          if (!tenant) {
            const errorMsg = `No tenant found for promotion ${promotion.name} with companyId ${promotion.company}`;
            this.log(errorMsg, 'error');
            this.stats.errors.push(errorMsg);
            continue;
          }

          if (!this.dryRun) {
            await Promotion.updateOne(
              { _id: promotion._id },
              {
                $set: {
                  tenantId: tenant._id,
                  updatedAt: new Date()
                }
              }
            );
            this.log(`Updated promotion: ${promotion.name} -> tenant: ${tenant.name}`, 'verbose');
            this.stats.promotionsUpdated++;
          } else {
            this.log(`[DRY RUN] Would update promotion: ${promotion.name} -> tenant: ${tenant.name}`, 'verbose');
          }

        } catch (error) {
          const errorMsg = `Failed to update promotion ${promotion.name}: ${error.message}`;
          this.log(errorMsg, 'error');
          this.stats.errors.push(errorMsg);
        }
      }

      this.log(`Step 5 completed. Promotions updated: ${this.stats.promotionsUpdated}`);

    } catch (error) {
      this.log(`Step 5 failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Step 6: Update tenant usage statistics
   */
  async updateTenantUsageStats() {
    this.log('Step 6: Updating tenant usage statistics...');

    try {
      const tenants = await Tenant.find({});

      for (const tenant of tenants) {
        try {
          // Count users
          const userCount = await User.countDocuments({ tenantId: tenant._id });

          // Count other resources
          const customerCount = await Customer.countDocuments({ tenantId: tenant._id });
          const productCount = await Product.countDocuments({ tenantId: tenant._id });
          const promotionCount = await Promotion.countDocuments({ tenantId: tenant._id });

          if (!this.dryRun) {
            await Tenant.updateOne(
              { _id: tenant._id },
              {
                $set: {
                  'usage.users': userCount,
                  'usage.customers': customerCount,
                  'usage.products': productCount,
                  'usage.promotions': promotionCount,
                  updatedAt: new Date()
                }
              }
            );
            this.log(`Updated usage stats for tenant: ${tenant.name} (${userCount} users)`, 'verbose');
          } else {
            this.log(`[DRY RUN] Would update usage stats for tenant: ${tenant.name} (${userCount} users)`, 'verbose');
          }

        } catch (error) {
          const errorMsg = `Failed to update usage stats for tenant ${tenant.name}: ${error.message}`;
          this.log(errorMsg, 'error');
          this.stats.errors.push(errorMsg);
        }
      }

      this.log('Step 6 completed. Tenant usage statistics updated');

    } catch (error) {
      this.log(`Step 6 failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Run the complete migration
   */
  async run() {
    const startTime = Date.now();

    this.log(`Starting tenant data migration${this.dryRun ? ' (DRY RUN)' : ''}...`);

    try {
      await this.connectDatabase();

      await this.createTenantsFromCompanies();
      await this.updateUsersWithTenants();
      await this.updateCustomersWithTenants();
      await this.updateProductsWithTenants();
      await this.updatePromotionsWithTenants();
      await this.updateTenantUsageStats();

      const duration = (Date.now() - startTime) / 1000;

      this.log('\n=== MIGRATION COMPLETED ===');
      this.log(`Duration: ${duration}s`);
      this.log(`Tenants created: ${this.stats.tenantsCreated}`);
      this.log(`Users updated: ${this.stats.usersUpdated}`);
      this.log(`Customers updated: ${this.stats.customersUpdated}`);
      this.log(`Products updated: ${this.stats.productsUpdated}`);
      this.log(`Promotions updated: ${this.stats.promotionsUpdated}`);
      this.log(`Errors: ${this.stats.errors.length}`);

      if (this.stats.errors.length > 0) {
        this.log('\n=== ERRORS ===');
        this.stats.errors.forEach((error) => this.log(error, 'error'));
      }

    } catch (error) {
      this.log(`Migration failed: ${error.message}`, 'error');
      throw error;
    } finally {
      await this.disconnectDatabase();
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migration = new TenantDataMigration();

  migration.run()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = TenantDataMigration;
