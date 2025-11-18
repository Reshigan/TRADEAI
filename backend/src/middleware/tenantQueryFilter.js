const mongoose = require('mongoose');

/**
 * Tenant Query Filtering Middleware
 * Automatically applies tenant isolation to all database queries
 */

class TenantQueryFilter {
  constructor() {
    this.originalMethods = {};
    this.isActive = false;
  }

  /**
   * Activate tenant filtering for the current request
   */
  activate(tenantId) {
    if (this.isActive) return;

    this.tenantId = tenantId;
    this.isActive = true;

    // Store original methods
    this.originalMethods = {
      find: mongoose.Query.prototype.find,
      findOne: mongoose.Query.prototype.findOne,
      findOneAndUpdate: mongoose.Query.prototype.findOneAndUpdate,
      findOneAndDelete: mongoose.Query.prototype.findOneAndDelete,
      updateOne: mongoose.Query.prototype.updateOne,
      updateMany: mongoose.Query.prototype.updateMany,
      deleteOne: mongoose.Query.prototype.deleteOne,
      deleteMany: mongoose.Query.prototype.deleteMany,
      countDocuments: mongoose.Query.prototype.countDocuments,
      distinct: mongoose.Query.prototype.distinct
    };

    // Override query methods
    this.overrideQueryMethods();
  }

  /**
   * Deactivate tenant filtering
   */
  deactivate() {
    if (!this.isActive) return;

    // Restore original methods
    Object.assign(mongoose.Query.prototype, this.originalMethods);

    this.isActive = false;
    this.tenantId = null;
    this.originalMethods = {};
  }

  /**
   * Override mongoose query methods to include tenant filtering
   */
  overrideQueryMethods() {
    const self = this;

    // Find operations
    mongoose.Query.prototype.find = function (filter) {
      if (!this.getOptions().skipTenantFilter && self.shouldApplyTenantFilter(this)) {
        this.where({ tenantId: self.tenantId });
      }
      return self.originalMethods.find.call(this, filter);
    };

    mongoose.Query.prototype.findOne = function (filter) {
      if (!this.getOptions().skipTenantFilter && self.shouldApplyTenantFilter(this)) {
        this.where({ tenantId: self.tenantId });
      }
      return self.originalMethods.findOne.call(this, filter);
    };

    // Update operations
    mongoose.Query.prototype.findOneAndUpdate = function (filter, update, options) {
      if (!this.getOptions().skipTenantFilter && self.shouldApplyTenantFilter(this)) {
        this.where({ tenantId: self.tenantId });
      }
      return self.originalMethods.findOneAndUpdate.call(this, filter, update, options);
    };

    mongoose.Query.prototype.updateOne = function (filter, update, options) {
      if (!this.getOptions().skipTenantFilter && self.shouldApplyTenantFilter(this)) {
        this.where({ tenantId: self.tenantId });
      }
      return self.originalMethods.updateOne.call(this, filter, update, options);
    };

    mongoose.Query.prototype.updateMany = function (filter, update, options) {
      if (!this.getOptions().skipTenantFilter && self.shouldApplyTenantFilter(this)) {
        this.where({ tenantId: self.tenantId });
      }
      return self.originalMethods.updateMany.call(this, filter, update, options);
    };

    // Delete operations
    mongoose.Query.prototype.findOneAndDelete = function (filter, options) {
      if (!this.getOptions().skipTenantFilter && self.shouldApplyTenantFilter(this)) {
        this.where({ tenantId: self.tenantId });
      }
      return self.originalMethods.findOneAndDelete.call(this, filter, options);
    };

    mongoose.Query.prototype.deleteOne = function (filter, options) {
      if (!this.getOptions().skipTenantFilter && self.shouldApplyTenantFilter(this)) {
        this.where({ tenantId: self.tenantId });
      }
      return self.originalMethods.deleteOne.call(this, filter, options);
    };

    mongoose.Query.prototype.deleteMany = function (filter, options) {
      if (!this.getOptions().skipTenantFilter && self.shouldApplyTenantFilter(this)) {
        this.where({ tenantId: self.tenantId });
      }
      return self.originalMethods.deleteMany.call(this, filter, options);
    };

    // Count operations
    mongoose.Query.prototype.countDocuments = function (filter, options) {
      if (!this.getOptions().skipTenantFilter && self.shouldApplyTenantFilter(this)) {
        this.where({ tenantId: self.tenantId });
      }
      return self.originalMethods.countDocuments.call(this, filter, options);
    };

    mongoose.Query.prototype.distinct = function (field, filter, options) {
      if (!this.getOptions().skipTenantFilter && self.shouldApplyTenantFilter(this)) {
        this.where({ tenantId: self.tenantId });
      }
      return self.originalMethods.distinct.call(this, field, filter, options);
    };
  }

  /**
   * Determine if tenant filter should be applied to this query
   */
  shouldApplyTenantFilter(query) {
    const modelName = query.model.modelName;

    // Skip system models that don't need tenant filtering
    const systemModels = ['Tenant', 'User']; // User might need special handling
    if (systemModels.includes(modelName)) {
      return false;
    }

    // Check if model has tenantId field
    const schema = query.model.schema;
    return schema.paths.tenantId !== undefined;
  }
}

// Global instance
const tenantQueryFilter = new TenantQueryFilter();

/**
 * Express middleware to apply tenant filtering to all queries in a request
 */
function applyTenantQueryFilter(req, res, next) {
  // Skip if no tenant context
  if (!req.tenant || !req.tenant.id) {
    return next();
  }

  // Activate tenant filtering
  tenantQueryFilter.activate(req.tenant.id);

  // Deactivate on response finish
  res.on('finish', () => {
    tenantQueryFilter.deactivate();
  });

  // Deactivate on error
  res.on('error', () => {
    tenantQueryFilter.deactivate();
  });

  next();
}

/**
 * Utility function to execute queries without tenant filtering
 */
function withoutTenantFilter(callback) {
  const wasActive = tenantQueryFilter.isActive;
  const originalTenantId = tenantQueryFilter.tenantId;

  if (wasActive) {
    tenantQueryFilter.deactivate();
  }

  try {
    const result = callback();

    // Handle promises
    if (result && typeof result.then === 'function') {
      return result.finally(() => {
        if (wasActive) {
          tenantQueryFilter.activate(originalTenantId);
        }
      });
    }

    return result;
  } finally {
    if (wasActive) {
      tenantQueryFilter.activate(originalTenantId);
    }
  }
}

/**
 * Utility function to execute queries with specific tenant context
 */
function withTenantContext(tenantId, callback) {
  const wasActive = tenantQueryFilter.isActive;
  const originalTenantId = tenantQueryFilter.tenantId;

  if (wasActive) {
    tenantQueryFilter.deactivate();
  }

  tenantQueryFilter.activate(tenantId);

  try {
    const result = callback();

    // Handle promises
    if (result && typeof result.then === 'function') {
      return result.finally(() => {
        tenantQueryFilter.deactivate();
        if (wasActive) {
          tenantQueryFilter.activate(originalTenantId);
        }
      });
    }

    return result;
  } finally {
    tenantQueryFilter.deactivate();
    if (wasActive) {
      tenantQueryFilter.activate(originalTenantId);
    }
  }
}

/**
 * Mongoose plugin to add tenant-aware static methods
 */
function tenantAwarePlugin(schema, _options = {}) {
  // Add static methods for tenant-aware operations
  schema.statics.findByTenant = function (tenantId, filter = {}) {
    return this.find({ tenantId, ...filter });
  };

  schema.statics.findOneByTenant = function (tenantId, filter = {}) {
    return this.findOne({ tenantId, ...filter });
  };

  schema.statics.createForTenant = function (tenantId, data) {
    return this.create({ ...data, tenantId });
  };

  schema.statics.updateByTenant = function (tenantId, filter, update, options) {
    return this.updateMany({ tenantId, ...filter }, update, options);
  };

  schema.statics.deleteByTenant = function (tenantId, filter, options) {
    return this.deleteMany({ tenantId, ...filter }, options);
  };

  schema.statics.countByTenant = function (tenantId, filter = {}) {
    return this.countDocuments({ tenantId, ...filter });
  };

  // Add instance methods
  schema.methods.belongsToTenant = function (tenantId) {
    return this.tenantId && this.tenantId.toString() === tenantId.toString();
  };
}

/**
 * Aggregate pipeline helper for tenant filtering
 */
function addTenantMatchStage(pipeline, tenantId) {
  // Add tenant match at the beginning of pipeline
  pipeline.unshift({
    $match: {
      tenantId: new mongoose.Types.ObjectId(tenantId)
    }
  });

  return pipeline;
}

/**
 * Validation middleware to ensure tenant consistency
 */
function validateTenantConsistency(req, res, next) {
  // Skip for system operations
  if (!req.tenant) {
    return next();
  }

  // Validate that any tenantId in request body matches current tenant
  if (req.body && req.body.tenantId) {
    if (req.body.tenantId !== req.tenant.id) {
      return res.status(403).json({
        error: 'Tenant ID mismatch',
        message: 'Cannot create/update resources for different tenant'
      });
    }
  }

  // Auto-set tenantId for create operations
  if (req.method === 'POST' && req.body && !req.body.tenantId) {
    req.body.tenantId = req.tenant.id;
  }

  next();
}

module.exports = {
  applyTenantQueryFilter,
  withoutTenantFilter,
  withTenantContext,
  tenantAwarePlugin,
  addTenantMatchStage,
  validateTenantConsistency,
  TenantQueryFilter
};
