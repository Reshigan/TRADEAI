const Tenant = require('../models/Tenant');
const User = require('../models/User');
const { withoutTenantFilter, withTenantContext } = require('../middleware/tenantQueryFilter');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Tenant Management Controller
 * Handles CRUD operations for tenant management
 */

class TenantController {
  /**
   * Get all tenants (Super Admin only)
   */
  async getAllTenants(req, res) {
    try {
      // Only super admins can view all tenants
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only super administrators can view all tenants'
        });
      }

      const {
        page = 1,
        limit = 10,
        search,
        status,
        subscriptionTier,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build filter
      const filter = {};

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { domain: { $regex: search, $options: 'i' } },
          { 'contactInfo.email': { $regex: search, $options: 'i' } }
        ];
      }

      if (status) {
        filter.status = status;
      }

      if (subscriptionTier) {
        filter['subscription.tier'] = subscriptionTier;
      }

      // Execute query without tenant filtering
      const result = await withoutTenantFilter(async () => {
        const tenants = await Tenant.find(filter)
          .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
          .limit(limit * 1)
          .skip((page - 1) * limit)
          .populate('createdBy', 'firstName lastName email')
          .populate('updatedBy', 'firstName lastName email');

        const total = await Tenant.countDocuments(filter);

        return {
          tenants,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
          }
        };
      });

      res.json({
        success: true,
        data: result.tenants,
        pagination: result.pagination
      });

    } catch (error) {
      logger.error('Get all tenants error', { error: error.message, stack: error.stack });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve tenants'
      });
    }
  }

  /**
   * Get current tenant details
   */
  async getCurrentTenant(req, res) {
    try {
      if (!req.tenant) {
        return res.status(400).json({
          error: 'No tenant context',
          message: 'Tenant information not available'
        });
      }

      const tenant = await withoutTenantFilter(async () => {
        return await Tenant.findById(req.tenant.id)
          .populate('createdBy', 'firstName lastName email')
          .populate('updatedBy', 'firstName lastName email');
      });

      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant not found',
          message: 'Current tenant not found'
        });
      }

      res.json({
        success: true,
        data: tenant
      });

    } catch (error) {
      logger.error('Get current tenant error', { error: error.message, stack: error.stack });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve tenant information'
      });
    }
  }

  /**
   * Create new tenant (Super Admin only)
   */
  async createTenant(req, res) {
    try {
      // Only super admins can create tenants
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only super administrators can create tenants'
        });
      }

      const tenantData = {
        ...req.body,
        createdBy: req.user._id,
        updatedBy: req.user._id
      };

      // Create tenant without tenant filtering
      const tenant = await withoutTenantFilter(async () => {
        return Tenant.create(tenantData);
      });

      // Populate references
      await tenant.populate('createdBy', 'firstName lastName email');

      res.status(201).json({
        success: true,
        data: tenant,
        message: 'Tenant created successfully'
      });

    } catch (error) {
      logger.error('Create tenant error', { error: error.message, stack: error.stack });

      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
          error: 'Duplicate value',
          message: `${field} already exists`
        });
      }

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          error: 'Validation error',
          message: error.message,
          details: error.errors
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create tenant'
      });
    }
  }

  /**
   * Update tenant (Super Admin or Tenant Admin)
   */
  async updateTenant(req, res) {
    try {
      const { id } = req.params;
      const updates = { ...req.body };

      // Remove fields that shouldn't be updated directly
      delete updates._id;
      delete updates.createdAt;
      delete updates.createdBy;

      // Set updatedBy
      updates.updatedBy = req.user._id;

      let tenant;

      if (req.user.role === 'super_admin') {
        // Super admin can update any tenant
        tenant = await withoutTenantFilter(async () => {
          return await Tenant.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
          ).populate('createdBy updatedBy', 'firstName lastName email');
        });
      } else {
        // Regular admin can only update their own tenant
        if (!req.tenant || req.tenant.id !== id) {
          return res.status(403).json({
            error: 'Access denied',
            message: 'You can only update your own tenant'
          });
        }

        tenant = await withoutTenantFilter(async () => {
          return await Tenant.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
          ).populate('createdBy updatedBy', 'firstName lastName email');
        });
      }

      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant not found',
          message: 'Tenant not found'
        });
      }

      res.json({
        success: true,
        data: tenant,
        message: 'Tenant updated successfully'
      });

    } catch (error) {
      console.error('Update tenant error:', error);

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          error: 'Validation error',
          message: error.message,
          details: error.errors
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update tenant'
      });
    }
  }

  /**
   * Delete/Deactivate tenant (Super Admin only)
   */
  async deleteTenant(req, res) {
    try {
      // Only super admins can delete tenants
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only super administrators can delete tenants'
        });
      }

      const { id } = req.params;
      const { permanent = false } = req.query;

      const tenant = await withoutTenantFilter(async () => {
        if (permanent === 'true') {
          // Permanent deletion (use with caution)
          return Tenant.findByIdAndDelete(id);
        } else {
          // Soft delete (deactivate)
          return await Tenant.findByIdAndUpdate(
            id,
            {
              status: 'suspended',
              isActive: false,
              updatedBy: req.user._id
            },
            { new: true }
          );
        }
      });

      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant not found',
          message: 'Tenant not found'
        });
      }

      res.json({
        success: true,
        data: tenant,
        message: permanent === 'true' ? 'Tenant deleted permanently' : 'Tenant deactivated'
      });

    } catch (error) {
      console.error('Delete tenant error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete tenant'
      });
    }
  }

  /**
   * Get tenant statistics (Super Admin only)
   */
  async getTenantStats(req, res) {
    try {
      // Only super admins can view tenant statistics
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only super administrators can view tenant statistics'
        });
      }

      const stats = await withoutTenantFilter(async () => {
        const [
          totalTenants,
          activeTenants,
          suspendedTenants,
          trialTenants,
          paidTenants,
          recentTenants
        ] = await Promise.all([
          Tenant.countDocuments(),
          Tenant.countDocuments({ status: 'active' }),
          Tenant.countDocuments({ status: 'suspended' }),
          Tenant.countDocuments({ 'subscription.tier': 'trial' }),
          Tenant.countDocuments({ 'subscription.tier': { $ne: 'trial' } }),
          Tenant.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name domain status subscription.tier createdAt')
        ]);

        return {
          overview: {
            total: totalTenants,
            active: activeTenants,
            suspended: suspendedTenants,
            trial: trialTenants,
            paid: paidTenants
          },
          recent: recentTenants
        };
      });

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Get tenant stats error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve tenant statistics'
      });
    }
  }

  /**
   * Get tenant users (Tenant Admin or Super Admin)
   */
  async getTenantUsers(req, res) {
    try {
      const { id } = req.params;
      const {
        page = 1,
        limit = 10,
        search,
        role,
        status = 'active'
      } = req.query;

      // Check permissions
      if (req.user.role !== 'super_admin' && (!req.tenant || req.tenant.id !== id)) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only view users from your own tenant'
        });
      }

      // Build filter
      const filter = { tenantId: id };

      if (search) {
        filter.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      if (role) {
        filter.role = role;
      }

      if (status) {
        filter.isActive = status === 'active';
      }

      const result = await withTenantContext(id, async () => {
        const users = await User.find(filter)
          .select('-password')
          .sort({ createdAt: -1 })
          .limit(limit * 1)
          .skip((page - 1) * limit);

        const total = await User.countDocuments(filter);

        return {
          users,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
          }
        };
      });

      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Get tenant users error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve tenant users'
      });
    }
  }

  /**
   * Update tenant subscription (Super Admin only)
   */
  async updateSubscription(req, res) {
    try {
      // Only super admins can update subscriptions
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only super administrators can update subscriptions'
        });
      }

      const { id } = req.params;
      const subscriptionUpdates = req.body;

      const tenant = await withoutTenantFilter(async () => {
        return await Tenant.findByIdAndUpdate(
          id,
          {
            subscription: subscriptionUpdates,
            updatedBy: req.user._id
          },
          { new: true, runValidators: true }
        );
      });

      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant not found',
          message: 'Tenant not found'
        });
      }

      res.json({
        success: true,
        data: tenant,
        message: 'Subscription updated successfully'
      });

    } catch (error) {
      console.error('Update subscription error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update subscription'
      });
    }
  }
}

module.exports = new TenantController();
