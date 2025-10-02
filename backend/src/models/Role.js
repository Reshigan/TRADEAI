const mongoose = require('mongoose');
const { addTenantSupport } = require('./BaseTenantModel');

const roleSchema = new mongoose.Schema({
  // Role name (unique within tenant)
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // Display name for UI
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Role description
  description: {
    type: String,
    trim: true
  },
  
  // Role type/category
  type: {
    type: String,
    enum: ['SYSTEM', 'CUSTOM', 'DEPARTMENT', 'PROJECT'],
    default: 'CUSTOM',
    index: true
  },
  
  // Role level/hierarchy
  level: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  
  // Permissions associated with this role
  permissions: [{
    type: String,
    required: true
  }],
  
  // Parent role (for role hierarchy)
  parentRole: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  },
  
  // Child roles
  childRoles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  }],
  
  // Role constraints
  constraints: {
    // Maximum number of users that can have this role
    maxUsers: {
      type: Number,
      min: 1
    },
    
    // IP address restrictions
    allowedIpRanges: [String],
    
    // Time-based restrictions
    timeRestrictions: {
      allowedHours: {
        start: String, // HH:MM format
        end: String    // HH:MM format
      },
      allowedDays: [{
        type: String,
        enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
      }],
      timezone: String
    },
    
    // Session restrictions
    maxConcurrentSessions: {
      type: Number,
      min: 1,
      default: 5
    },
    
    // Data access restrictions
    dataAccessLevel: {
      type: String,
      enum: ['NONE', 'OWN', 'DEPARTMENT', 'COMPANY', 'ALL'],
      default: 'OWN'
    }
  },
  
  // Role metadata
  metadata: {
    // Department association
    department: String,
    
    // Cost center
    costCenter: String,
    
    // Approval workflow
    requiresApproval: {
      type: Boolean,
      default: false
    },
    
    // Auto-assignment rules
    autoAssignmentRules: [{
      condition: String, // e.g., "department === 'Sales'"
      priority: Number
    }],
    
    // Role tags for categorization
    tags: [String]
  },
  
  // Status and lifecycle
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  isSystem: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Usage statistics
  statistics: {
    userCount: {
      type: Number,
      default: 0
    },
    lastAssigned: Date,
    lastUsed: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Apply tenant isolation
addTenantSupport(roleSchema);

// Indexes
roleSchema.index({ tenantId: 1, name: 1 }, { unique: true });
roleSchema.index({ tenantId: 1, type: 1, isActive: 1 });
roleSchema.index({ tenantId: 1, level: 1 });
roleSchema.index({ tenantId: 1, isSystem: 1 });
roleSchema.index({ tenantId: 1, 'metadata.department': 1 });

// Virtual for full hierarchy path
roleSchema.virtual('hierarchyPath').get(function() {
  // This would be populated by a separate method that traverses the hierarchy
  return this._hierarchyPath || [this.name];
});

// Virtual for permission count
roleSchema.virtual('permissionCount').get(function() {
  return this.permissions ? this.permissions.length : 0;
});

// Virtual for effective permissions (including inherited)
roleSchema.virtual('effectivePermissions').get(function() {
  // This would be calculated by traversing parent roles
  return this._effectivePermissions || this.permissions;
});

// Static methods
roleSchema.statics.findByPermission = function(tenantId, permission) {
  return this.find({
    tenantId,
    permissions: permission,
    isActive: true
  });
};

roleSchema.statics.findSystemRoles = function(tenantId) {
  return this.find({
    tenantId,
    isSystem: true,
    isActive: true
  }).sort({ level: 1, name: 1 });
};

roleSchema.statics.findCustomRoles = function(tenantId) {
  return this.find({
    tenantId,
    isSystem: false,
    isActive: true
  }).sort({ name: 1 });
};

roleSchema.statics.findByDepartment = function(tenantId, department) {
  return this.find({
    tenantId,
    'metadata.department': department,
    isActive: true
  });
};

roleSchema.statics.getRoleHierarchy = function(tenantId) {
  return this.aggregate([
    { $match: { tenantId, isActive: true } },
    {
      $graphLookup: {
        from: 'roles',
        startWith: '$_id',
        connectFromField: '_id',
        connectToField: 'parentRole',
        as: 'children',
        maxDepth: 5
      }
    },
    { $match: { parentRole: { $exists: false } } }, // Root roles only
    { $sort: { level: 1, name: 1 } }
  ]);
};

// Instance methods
roleSchema.methods.addPermission = function(permission) {
  if (!this.permissions.includes(permission)) {
    this.permissions.push(permission);
  }
  return this.save();
};

roleSchema.methods.removePermission = function(permission) {
  this.permissions = this.permissions.filter(p => p !== permission);
  return this.save();
};

roleSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission) || 
         this.permissions.some(p => p.endsWith(':*') && permission.startsWith(p.split(':')[0] + ':'));
};

roleSchema.methods.getEffectivePermissions = async function() {
  const permissions = new Set(this.permissions);
  
  // Add permissions from parent roles
  if (this.parentRole) {
    const parentRole = await this.constructor.findById(this.parentRole);
    if (parentRole) {
      const parentPermissions = await parentRole.getEffectivePermissions();
      parentPermissions.forEach(p => permissions.add(p));
    }
  }
  
  return Array.from(permissions);
};

roleSchema.methods.canBeAssignedTo = function(user, context = {}) {
  // Check constraints
  if (this.constraints.maxUsers && this.statistics.userCount >= this.constraints.maxUsers) {
    return { allowed: false, reason: 'Maximum user limit reached' };
  }
  
  if (this.constraints.allowedIpRanges && this.constraints.allowedIpRanges.length > 0) {
    if (!context.ipAddress || !this.isIpAllowed(context.ipAddress)) {
      return { allowed: false, reason: 'IP address not in allowed ranges' };
    }
  }
  
  if (this.metadata.requiresApproval && !context.approved) {
    return { allowed: false, reason: 'Role assignment requires approval' };
  }
  
  return { allowed: true };
};

roleSchema.methods.isIpAllowed = function(ipAddress) {
  if (!this.constraints.allowedIpRanges || this.constraints.allowedIpRanges.length === 0) {
    return true;
  }
  
  return this.constraints.allowedIpRanges.some(range => {
    // Simple IP range check - in production, use a proper IP range library
    return ipAddress.startsWith(range.replace('*', ''));
  });
};

roleSchema.methods.updateStatistics = function(action) {
  switch (action) {
    case 'assigned':
      this.statistics.userCount += 1;
      this.statistics.lastAssigned = new Date();
      break;
    case 'unassigned':
      this.statistics.userCount = Math.max(0, this.statistics.userCount - 1);
      break;
    case 'used':
      this.statistics.lastUsed = new Date();
      break;
  }
  return this.save();
};

// Pre-save middleware
roleSchema.pre('save', function(next) {
  // Ensure system roles cannot be modified by non-system operations
  if (this.isSystem && this.isModified() && !this._allowSystemModification) {
    return next(new Error('System roles cannot be modified'));
  }
  
  // Validate permission format
  if (this.isModified('permissions')) {
    const invalidPermissions = this.permissions.filter(p => {
      return !/^[a-z_]+:[a-z_*]+(:own|:all)?$/.test(p);
    });
    
    if (invalidPermissions.length > 0) {
      return next(new Error(`Invalid permission format: ${invalidPermissions.join(', ')}`));
    }
  }
  
  next();
});

// Pre-remove middleware
roleSchema.pre('remove', async function(next) {
  // Check if role is assigned to any users
  const User = mongoose.model('User');
  const userCount = await User.countDocuments({
    tenantId: this.tenantId,
    roles: this._id
  });
  
  if (userCount > 0) {
    return next(new Error('Cannot delete role that is assigned to users'));
  }
  
  // Remove from child roles' parent references
  await this.constructor.updateMany(
    { parentRole: this._id },
    { $unset: { parentRole: 1 } }
  );
  
  next();
});

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;