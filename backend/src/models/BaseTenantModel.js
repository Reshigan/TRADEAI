const mongoose = require('mongoose');

/**
 * Base schema mixin for tenant-aware models
 * Provides common fields and functionality for multi-tenant architecture
 */
const BaseTenantSchema = {
  // Tenant isolation
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
};

/**
 * Add tenant-aware functionality to a schema
 */
function addTenantSupport(schema) {
  // Add base fields
  schema.add(BaseTenantSchema);
  
  // Add compound indexes for tenant isolation
  schema.index({ tenantId: 1, isDeleted: 1 });
  schema.index({ tenantId: 1, isActive: 1 });
  schema.index({ tenantId: 1, createdAt: -1 });
  
  // Pre-find middleware to automatically filter by tenant and exclude deleted
  schema.pre(/^find/, function() {
    // Skip if explicitly disabled
    if (this.getOptions().skipTenantFilter) return;
    
    // Get tenant ID from options or query
    const tenantId = this.getOptions().tenantId;
    if (tenantId) {
      this.where({ tenantId });
    }
    
    // Exclude soft-deleted records unless explicitly included
    if (!this.getOptions().includeDeleted) {
      this.where({ isDeleted: { $ne: true } });
    }
  });
  
  // Pre-aggregate middleware
  schema.pre('aggregate', function() {
    if (this.options.skipTenantFilter) return;
    
    const tenantId = this.options.tenantId;
    if (tenantId) {
      this.pipeline().unshift({
        $match: {
          tenantId: new mongoose.Types.ObjectId(tenantId),
          isDeleted: { $ne: true }
        }
      });
    }
  });
  
  // Instance methods
  schema.methods.softDelete = function(userId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = userId;
    this.isActive = false;
    return this.save();
  };
  
  schema.methods.restore = function() {
    this.isDeleted = false;
    this.deletedAt = undefined;
    this.deletedBy = undefined;
    this.isActive = true;
    return this.save();
  };
  
  schema.methods.belongsToTenant = function(tenantId) {
    return this.tenantId.toString() === tenantId.toString();
  };
  
  // Static methods
  schema.statics.findByTenant = function(tenantId, conditions = {}) {
    return this.find({ tenantId, ...conditions });
  };
  
  schema.statics.findOneByTenant = function(tenantId, conditions = {}) {
    return this.findOne({ tenantId, ...conditions });
  };
  
  schema.statics.countByTenant = function(tenantId, conditions = {}) {
    return this.countDocuments({ tenantId, ...conditions });
  };
  
  schema.statics.findDeleted = function(tenantId, conditions = {}) {
    return this.find({ tenantId, isDeleted: true, ...conditions });
  };
  
  schema.statics.createForTenant = function(tenantId, data, userId) {
    return this.create({
      ...data,
      tenantId,
      createdBy: userId,
      updatedBy: userId
    });
  };
  
  schema.statics.updateByTenant = function(tenantId, conditions, update, userId) {
    return this.updateMany(
      { tenantId, ...conditions },
      { ...update, updatedBy: userId, updatedAt: new Date() }
    );
  };
  
  schema.statics.deleteByTenant = function(tenantId, conditions, userId) {
    return this.updateMany(
      { tenantId, ...conditions },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        isActive: false
      }
    );
  };
  
  // Virtual for checking if record is deleted
  schema.virtual('deleted').get(function() {
    return this.isDeleted === true;
  });
  
  // Transform function to exclude sensitive fields
  schema.methods.toJSON = function() {
    const obj = this.toObject();
    
    // Remove internal fields from JSON output
    delete obj.__v;
    
    // Convert ObjectIds to strings for frontend
    if (obj._id) obj.id = obj._id.toString();
    if (obj.tenantId) obj.tenantId = obj.tenantId.toString();
    if (obj.createdBy) obj.createdBy = obj.createdBy.toString();
    if (obj.updatedBy) obj.updatedBy = obj.updatedBy.toString();
    
    return obj;
  };
}

/**
 * Query helper to add tenant context to mongoose queries
 */
function withTenant(tenantId) {
  return {
    setOptions: function(options = {}) {
      return { ...options, tenantId };
    }
  };
}

/**
 * Middleware to automatically set tenant context from request
 */
function tenantQueryMiddleware(req, res, next) {
  if (req.tenant && req.tenant.id) {
    // Override mongoose query options to include tenant
    const originalFind = mongoose.Query.prototype.find;
    const originalFindOne = mongoose.Query.prototype.findOne;
    const originalFindOneAndUpdate = mongoose.Query.prototype.findOneAndUpdate;
    const originalUpdateOne = mongoose.Query.prototype.updateOne;
    const originalUpdateMany = mongoose.Query.prototype.updateMany;
    const originalDeleteOne = mongoose.Query.prototype.deleteOne;
    const originalDeleteMany = mongoose.Query.prototype.deleteMany;
    
    // Store original request for cleanup
    req._originalQueryMethods = {
      find: originalFind,
      findOne: originalFindOne,
      findOneAndUpdate: originalFindOneAndUpdate,
      updateOne: originalUpdateOne,
      updateMany: originalUpdateMany,
      deleteOne: originalDeleteOne,
      deleteMany: originalDeleteMany
    };
    
    // Override methods to include tenant context
    mongoose.Query.prototype.find = function(filter) {
      if (!this.getOptions().skipTenantFilter) {
        this.setOptions({ tenantId: req.tenant.id });
      }
      return originalFind.call(this, filter);
    };
    
    mongoose.Query.prototype.findOne = function(filter) {
      if (!this.getOptions().skipTenantFilter) {
        this.setOptions({ tenantId: req.tenant.id });
      }
      return originalFindOne.call(this, filter);
    };
    
    // Add cleanup on response finish
    res.on('finish', () => {
      if (req._originalQueryMethods) {
        Object.assign(mongoose.Query.prototype, req._originalQueryMethods);
        delete req._originalQueryMethods;
      }
    });
  }
  
  next();
}

/**
 * Create a tenant-aware model
 */
function createTenantModel(name, schema, options = {}) {
  addTenantSupport(schema);
  return mongoose.model(name, schema, options.collection);
}

module.exports = {
  BaseTenantSchema,
  addTenantSupport,
  withTenant,
  tenantQueryMiddleware,
  createTenantModel
};