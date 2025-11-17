const Tenant = require('../models/Tenant');
const User = require('../models/User');
const License = require('../models/License');
const Company = require('../models/Company');
const Budget = require('../models/Budget');
const Promotion = require('../models/Promotion');
const TradeSpend = require('../models/TradeSpend');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const bcrypt = require('bcryptjs');

/**
 * Super Admin Service
 * System-wide administration including tenant and license management
 */
class SuperAdminService {
  /**
   * Create New Tenant with License
   */
  async createTenant(tenantData, adminData, licenseType = 'trial') {
    try {
      const {
        companyName,
        domain,
        subdomain,
        industry,
        country,
        timezone
      } = tenantData;

      // Check if tenant already exists
      const existingTenant = await Tenant.findOne({
        $or: [{ domain }, { subdomain }]
      });

      if (existingTenant) {
        throw new AppError('Tenant with this domain or subdomain already exists', 400);
      }

      // Create tenant
      const tenant = await Tenant.create({
        name: companyName,
        domain,
        subdomain,
        industry,
        country,
        timezone,
        status: 'active',
        settings: {
          currency: 'USD',
          dateFormat: 'MM/DD/YYYY',
          timezone: timezone || 'UTC'
        }
      });

      // Create company for tenant
      const company = await Company.create({
        name: companyName,
        tenantId: tenant._id,
        industry,
        country,
        status: 'active'
      });

      // Create admin user
      const hashedPassword = await bcrypt.hash(adminData.password, 10);
      const adminUser = await User.create({
        email: adminData.email,
        password: hashedPassword,
        name: adminData.name,
        role: 'admin',
        tenantId: tenant._id,
        companyId: company._id,
        status: 'active',
        isVerified: true
      });

      // Create license
      const licenseConfig = License.getLicensePlans()[licenseType];
      const expiryDate = new Date();

      if (licenseType === 'trial') {
        expiryDate.setDate(expiryDate.getDate() + 30); // 30 days trial
      } else {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year for paid plans
      }

      const license = await License.create({
        tenantId: tenant._id,
        licenseType,
        status: 'active',
        features: licenseConfig.features,
        billing: {
          plan: 'monthly',
          amount: licenseConfig.price,
          currency: 'USD',
          billingCycle: 'monthly',
          nextBillingDate: expiryDate
        },
        dates: {
          startDate: new Date(),
          expiryDate,
          trialEndsAt: licenseType === 'trial' ? expiryDate : null
        },
        usage: {
          currentUsers: 1,
          currentBudgets: 0,
          currentPromotions: 0,
          currentTradeSpend: 0
        },
        createdBy: adminUser._id
      });

      // Update tenant with license reference
      tenant.licenseId = license._id;
      await tenant.save();

      logger.info('Tenant created successfully', {
        tenantId: tenant._id,
        licenseType,
        adminEmail: adminData.email
      });

      return {
        tenant,
        company,
        adminUser: {
          _id: adminUser._id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role
        },
        license
      };
    } catch (error) {
      logger.error('Error creating tenant', error);
      throw new AppError('Failed to create tenant', 500);
    }
  }

  /**
   * Get All Tenants with Pagination
   */
  async getAllTenants(filters = {}, pagination = {}) {
    try {
      const {
        status,
        licenseType,
        search,
        industry
      } = filters;

      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = pagination;

      const query = {};
      if (status) query.status = status;
      if (industry) query.industry = industry;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { domain: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [tenants, total] = await Promise.all([
        Tenant.find(query)
          .populate('licenseId')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Tenant.countDocuments(query)
      ]);

      // Enrich with usage statistics
      const enrichedTenants = await Promise.all(
        tenants.map(async (tenant) => {
          const [userCount, budgetCount, promotionCount, tradeSpendCount] = await Promise.all([
            User.countDocuments({ tenantId: tenant._id, status: 'active' }),
            Budget.countDocuments({ companyId: tenant._id }),
            Promotion.countDocuments({ companyId: tenant._id }),
            TradeSpend.countDocuments({ companyId: tenant._id })
          ]);

          return {
            ...tenant,
            statistics: {
              users: userCount,
              budgets: budgetCount,
              promotions: promotionCount,
              tradeSpends: tradeSpendCount
            }
          };
        })
      );

      return {
        tenants: enrichedTenants,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting tenants', error);
      throw new AppError('Failed to get tenants', 500);
    }
  }

  /**
   * Update Tenant Status
   */
  async updateTenantStatus(tenantId, status, reason) {
    try {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) throw new AppError('Tenant not found', 404);

      tenant.status = status;
      await tenant.save();

      // If suspending, also suspend license
      if (status === 'suspended' || status === 'inactive') {
        await License.findOneAndUpdate(
          { tenantId },
          { status: 'suspended' }
        );
      }

      logger.info('Tenant status updated', { tenantId, status, reason });

      return tenant;
    } catch (error) {
      logger.error('Error updating tenant status', error);
      throw new AppError('Failed to update tenant status', 500);
    }
  }

  /**
   * Manage License
   */
  async manageLicense(tenantId, action, data) {
    try {
      const license = await License.findOne({ tenantId });
      if (!license) throw new AppError('License not found', 404);

      switch (action) {
        case 'upgrade':
          return this.upgradeLicense(license, data.newPlan);

        case 'downgrade':
          return this.downgradeLicense(license, data.newPlan);

        case 'renew':
          return this.renewLicense(license, data.duration);

        case 'suspend':
          return this.suspendLicense(license, data.reason);

        case 'reactivate':
          return this.reactivateLicense(license);

        case 'cancel':
          return this.cancelLicense(license, data.reason);

        default:
          throw new AppError('Invalid license action', 400);
      }
    } catch (error) {
      logger.error('Error managing license', error);
      throw new AppError('Failed to manage license', 500);
    }
  }

  async upgradeLicense(license, newPlan) {
    const planConfig = License.getLicensePlans()[newPlan];
    if (!planConfig) throw new AppError('Invalid plan', 400);

    license.licenseType = newPlan;
    license.features = { ...license.features, ...planConfig.features };
    license.billing.amount = planConfig.price;
    license.dates.lastRenewalDate = new Date();

    await license.save();

    logger.info('License upgraded', {
      tenantId: license.tenantId,
      newPlan
    });

    return license;
  }

  async downgradeLicense(license, newPlan) {
    const planConfig = License.getLicensePlans()[newPlan];
    if (!planConfig) throw new AppError('Invalid plan', 400);

    // Check if current usage fits within new plan limits
    if (license.usage.currentUsers > planConfig.features.maxUsers) {
      throw new AppError('Current user count exceeds new plan limit', 400);
    }

    license.licenseType = newPlan;
    license.features = { ...license.features, ...planConfig.features };
    license.billing.amount = planConfig.price;

    await license.save();

    logger.info('License downgraded', {
      tenantId: license.tenantId,
      newPlan
    });

    return license;
  }

  async renewLicense(license, duration = 365) {
    const newExpiryDate = new Date(license.dates.expiryDate);
    newExpiryDate.setDate(newExpiryDate.getDate() + duration);

    license.dates.expiryDate = newExpiryDate;
    license.dates.lastRenewalDate = new Date();
    license.status = 'active';

    await license.save();

    logger.info('License renewed', {
      tenantId: license.tenantId,
      newExpiryDate
    });

    return license;
  }

  async suspendLicense(license, reason) {
    license.status = 'suspended';
    license.notes = `Suspended: ${reason}`;

    await license.save();

    // Also suspend tenant
    await Tenant.findByIdAndUpdate(license.tenantId, {
      status: 'suspended'
    });

    logger.info('License suspended', {
      tenantId: license.tenantId,
      reason
    });

    return license;
  }

  async reactivateLicense(license) {
    if (license.isExpired()) {
      throw new AppError('Cannot reactivate expired license. Please renew first.', 400);
    }

    license.status = 'active';

    await license.save();

    // Also reactivate tenant
    await Tenant.findByIdAndUpdate(license.tenantId, {
      status: 'active'
    });

    logger.info('License reactivated', {
      tenantId: license.tenantId
    });

    return license;
  }

  async cancelLicense(license, reason) {
    license.status = 'cancelled';
    license.dates.cancellationDate = new Date();
    license.notes = `Cancelled: ${reason}`;

    await license.save();

    logger.info('License cancelled', {
      tenantId: license.tenantId,
      reason
    });

    return license;
  }

  /**
   * Get System Statistics
   */
  async getSystemStatistics() {
    try {
      const [
        totalTenants,
        activeTenants,
        suspendedTenants,
        totalUsers,
        activeUsers,
        totalBudgets,
        totalPromotions,
        totalTradeSpends,
        licenseStats
      ] = await Promise.all([
        Tenant.countDocuments(),
        Tenant.countDocuments({ status: 'active' }),
        Tenant.countDocuments({ status: 'suspended' }),
        User.countDocuments(),
        User.countDocuments({ status: 'active' }),
        Budget.countDocuments(),
        Promotion.countDocuments(),
        TradeSpend.countDocuments(),
        License.aggregate([
          {
            $group: {
              _id: '$licenseType',
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      return {
        tenants: {
          total: totalTenants,
          active: activeTenants,
          suspended: suspendedTenants,
          inactive: totalTenants - activeTenants - suspendedTenants
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        data: {
          budgets: totalBudgets,
          promotions: totalPromotions,
          tradeSpends: totalTradeSpends
        },
        licenses: licenseStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error('Error getting system statistics', error);
      throw new AppError('Failed to get system statistics', 500);
    }
  }

  /**
   * Get License Usage Report
   */
  async getLicenseUsageReport(tenantId) {
    try {
      const license = await License.findOne({ tenantId }).populate('tenantId');
      if (!license) throw new AppError('License not found', 404);

      const [
        currentUsers,
        currentBudgets,
        currentPromotions,
        currentTradeSpends
      ] = await Promise.all([
        User.countDocuments({ tenantId, status: 'active' }),
        Budget.countDocuments({ companyId: tenantId }),
        Promotion.countDocuments({ companyId: tenantId }),
        TradeSpend.countDocuments({ companyId: tenantId })
      ]);

      // Update usage in license
      license.usage = {
        currentUsers,
        currentBudgets,
        currentPromotions,
        currentTradeSpend: currentTradeSpends
      };
      await license.save();

      return {
        license: {
          type: license.licenseType,
          status: license.status,
          expiryDate: license.dates.expiryDate,
          daysRemaining: Math.ceil((license.dates.expiryDate - new Date()) / (1000 * 60 * 60 * 24))
        },
        limits: {
          users: {
            current: currentUsers,
            max: license.features.maxUsers,
            percentage: (currentUsers / license.features.maxUsers) * 100,
            remaining: license.features.maxUsers - currentUsers
          },
          budgets: {
            current: currentBudgets,
            max: license.features.maxBudgets,
            percentage: (currentBudgets / license.features.maxBudgets) * 100,
            remaining: license.features.maxBudgets - currentBudgets
          },
          promotions: {
            current: currentPromotions,
            max: license.features.maxPromotions,
            percentage: (currentPromotions / license.features.maxPromotions) * 100,
            remaining: license.features.maxPromotions - currentPromotions
          },
          tradeSpends: {
            current: currentTradeSpends,
            max: license.features.maxTradeSpend,
            percentage: (currentTradeSpends / license.features.maxTradeSpend) * 100,
            remaining: license.features.maxTradeSpend - currentTradeSpends
          }
        },
        features: license.features,
        warnings: this.generateUsageWarnings(license, {
          currentUsers,
          currentBudgets,
          currentPromotions,
          currentTradeSpends
        })
      };
    } catch (error) {
      logger.error('Error getting license usage report', error);
      throw new AppError('Failed to get license usage report', 500);
    }
  }

  generateUsageWarnings(license, usage) {
    const warnings = [];

    if (usage.currentUsers >= license.features.maxUsers * 0.9) {
      warnings.push({
        type: 'users',
        severity: 'high',
        message: 'User limit nearly reached (90%+)'
      });
    }

    if (usage.currentBudgets >= license.features.maxBudgets * 0.9) {
      warnings.push({
        type: 'budgets',
        severity: 'high',
        message: 'Budget limit nearly reached (90%+)'
      });
    }

    const daysRemaining = Math.ceil((license.dates.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    if (daysRemaining <= 30) {
      warnings.push({
        type: 'expiry',
        severity: 'high',
        message: `License expires in ${daysRemaining} days`
      });
    }

    return warnings;
  }

  /**
   * Delete Tenant (Soft Delete)
   */
  async deleteTenant(tenantId, reason) {
    try {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) throw new AppError('Tenant not found', 404);

      // Soft delete - mark as deleted
      tenant.status = 'deleted';
      tenant.deletedAt = new Date();
      tenant.deletionReason = reason;
      await tenant.save();

      // Cancel license
      await License.findOneAndUpdate(
        { tenantId },
        {
          status: 'cancelled',
          'dates.cancellationDate': new Date(),
          notes: `Tenant deleted: ${reason}`
        }
      );

      // Disable all users
      await User.updateMany(
        { tenantId },
        { status: 'inactive' }
      );

      logger.info('Tenant deleted', { tenantId, reason });

      return { success: true, message: 'Tenant deleted successfully' };
    } catch (error) {
      logger.error('Error deleting tenant', error);
      throw new AppError('Failed to delete tenant', 500);
    }
  }
}

module.exports = new SuperAdminService();
