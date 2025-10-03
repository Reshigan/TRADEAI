const mongoose = require('mongoose');
const { addTenantSupport } = require('./BaseTenantModel');

const permissionSchema = new mongoose.Schema({
  // Permission identifier (e.g., "users:create", "reports:read")
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // Human-readable display name
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Permission description
  description: {
    type: String,
    trim: true
  },
  
  // Resource this permission applies to
  resource: {
    type: String,
    required: true,
    enum: [
      'users', 'roles', 'permissions', 'tenants', 'companies',
      'customers', 'products', 'promotions', 'campaigns',
      'trade_spend', 'budgets', 'reports', 'analytics',
      'integrations', 'system', 'audit_logs', 'security_events',
      'master_data', 'sales_history', 'trading_terms'
    ],
    index: true
  },
  
  // Action this permission allows
  action: {
    type: String,
    required: true,
    enum: [
      'create', 'read', 'update', 'delete', 'list',
      'approve', 'reject', 'publish', 'archive',
      'import', 'export', 'share', 'download',
      'execute', 'configure', 'manage', 'admin',
      '*' // Wildcard for all actions
    ],
    index: true
  },
  
  // Scope of the permission
  scope: {
    type: String,
    enum: ['own', 'department', 'company', 'all'],
    default: 'own',
    index: true
  },
  
  // Permission category for organization
  category: {
    type: String,
    enum: [
      'USER_MANAGEMENT', 'DATA_MANAGEMENT', 'REPORTING',
      'ANALYTICS', 'SYSTEM_ADMIN', 'SECURITY',
      'BUSINESS_OPERATIONS', 'INTEGRATION'
    ],
    index: true
  },
  
  // Permission level/hierarchy
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  
  // Dependencies - permissions that must also be granted
  dependencies: [{
    type: String,
    ref: 'Permission'
  }],
  
  // Conflicts - permissions that cannot be granted together
  conflicts: [{
    type: String,
    ref: 'Permission'
  }],
  
  // Conditions for this permission
  conditions: {
    // Time-based conditions
    timeRestrictions: {
      allowedHours: {
        start: String, // HH:MM format
        end: String    // HH:MM format
      },
      allowedDays: [{
        type: String,
        enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
      }]
    },
    
    // IP-based conditions
    ipRestrictions: {
      allowedRanges: [String],
      blockedRanges: [String]
    },
    
    // Data-based conditions
    dataConditions: [{
      field: String,
      operator: {
        type: String,
        enum: ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than']
      },
      value: mongoose.Schema.Types.Mixed
    }]
  },
  
  // Risk assessment
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW',
    index: true
  },
  
  // Compliance requirements
  complianceRequirements: [{
    regulation: {
      type: String,
      enum: ['GDPR', 'CCPA', 'HIPAA', 'SOX', 'PCI_DSS', 'SOC2']
    },
    requirement: String,
    mandatory: {
      type: Boolean,
      default: false
    }
  }],
  
  // Permission metadata
  metadata: {
    // Business justification
    businessJustification: String,
    
    // Approval requirements
    requiresApproval: {
      type: Boolean,
      default: false
    },
    
    approvalWorkflow: [{
      level: Number,
      approverRole: String,
      required: Boolean
    }],
    
    // Audit requirements
    auditRequired: {
      type: Boolean,
      default: false
    },
    
    // Usage tracking
    trackUsage: {
      type: Boolean,
      default: false
    },
    
    // Tags for categorization
    tags: [String]
  },
  
  // Status
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
  
  // Deprecation info
  isDeprecated: {
    type: Boolean,
    default: false
  },
  
  deprecationDate: Date,
  
  replacedBy: {
    type: String,
    ref: 'Permission'
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
    assignmentCount: {
      type: Number,
      default: 0
    },
    usageCount: {
      type: Number,
      default: 0
    },
    lastUsed: Date,
    lastAssigned: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Apply tenant isolation
addTenantSupport(permissionSchema);

// Indexes
permissionSchema.index({ tenantId: 1, name: 1 }, { unique: true });
permissionSchema.index({ tenantId: 1, resource: 1, action: 1 });
permissionSchema.index({ tenantId: 1, category: 1, isActive: 1 });
permissionSchema.index({ tenantId: 1, riskLevel: 1 });
permissionSchema.index({ tenantId: 1, isSystem: 1 });
permissionSchema.index({ tenantId: 1, level: 1 });

// Virtual for full permission string
permissionSchema.virtual('fullPermission').get(function() {
  let permission = `${this.resource}:${this.action}`;
  if (this.scope && this.scope !== 'own') {
    permission += `:${this.scope}`;
  }
  return permission;
});

// Virtual for risk score
permissionSchema.virtual('riskScore').get(function() {
  const riskScores = { LOW: 1, MEDIUM: 3, HIGH: 7, CRITICAL: 10 };
  return riskScores[this.riskLevel] || 1;
});

// Static methods
permissionSchema.statics.findByResource = function(tenantId, resource) {
  return this.find({
    tenantId,
    resource,
    isActive: true
  }).sort({ level: 1, name: 1 });
};

permissionSchema.statics.findByCategory = function(tenantId, category) {
  return this.find({
    tenantId,
    category,
    isActive: true
  }).sort({ level: 1, name: 1 });
};

permissionSchema.statics.findByRiskLevel = function(tenantId, riskLevel) {
  return this.find({
    tenantId,
    riskLevel,
    isActive: true
  }).sort({ name: 1 });
};

permissionSchema.statics.findSystemPermissions = function(tenantId) {
  return this.find({
    tenantId,
    isSystem: true,
    isActive: true
  }).sort({ category: 1, level: 1, name: 1 });
};

permissionSchema.statics.findCustomPermissions = function(tenantId) {
  return this.find({
    tenantId,
    isSystem: false,
    isActive: true
  }).sort({ category: 1, name: 1 });
};

permissionSchema.statics.getPermissionMatrix = function(tenantId) {
  return this.aggregate([
    { $match: { tenantId, isActive: true } },
    {
      $group: {
        _id: {
          resource: '$resource',
          action: '$action'
        },
        permissions: {
          $push: {
            name: '$name',
            displayName: '$displayName',
            scope: '$scope',
            riskLevel: '$riskLevel',
            level: '$level'
          }
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.resource',
        actions: {
          $push: {
            action: '$_id.action',
            permissions: '$permissions',
            count: '$count'
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Instance methods
permissionSchema.methods.checkDependencies = async function(grantedPermissions) {
  if (!this.dependencies || this.dependencies.length === 0) {
    return { satisfied: true, missing: [] };
  }
  
  const missing = this.dependencies.filter(dep => !grantedPermissions.includes(dep));
  
  return {
    satisfied: missing.length === 0,
    missing
  };
};

permissionSchema.methods.checkConflicts = function(grantedPermissions) {
  if (!this.conflicts || this.conflicts.length === 0) {
    return { hasConflicts: false, conflicts: [] };
  }
  
  const conflicts = this.conflicts.filter(conflict => grantedPermissions.includes(conflict));
  
  return {
    hasConflicts: conflicts.length > 0,
    conflicts
  };
};

permissionSchema.methods.evaluateConditions = function(context = {}) {
  if (!this.conditions) {
    return { allowed: true };
  }
  
  // Check time restrictions
  if (this.conditions.timeRestrictions) {
    const timeCheck = this.checkTimeRestrictions(context.currentTime);
    if (!timeCheck.allowed) {
      return timeCheck;
    }
  }
  
  // Check IP restrictions
  if (this.conditions.ipRestrictions && context.ipAddress) {
    const ipCheck = this.checkIpRestrictions(context.ipAddress);
    if (!ipCheck.allowed) {
      return ipCheck;
    }
  }
  
  // Check data conditions
  if (this.conditions.dataConditions && context.data) {
    const dataCheck = this.checkDataConditions(context.data);
    if (!dataCheck.allowed) {
      return dataCheck;
    }
  }
  
  return { allowed: true };
};

permissionSchema.methods.checkTimeRestrictions = function(currentTime = new Date()) {
  const restrictions = this.conditions.timeRestrictions;
  
  if (restrictions.allowedDays && restrictions.allowedDays.length > 0) {
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const currentDay = dayNames[currentTime.getDay()];
    
    if (!restrictions.allowedDays.includes(currentDay)) {
      return { allowed: false, reason: 'Access not allowed on this day' };
    }
  }
  
  if (restrictions.allowedHours) {
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    
    const [startHour, startMinute] = restrictions.allowedHours.start.split(':').map(Number);
    const [endHour, endMinute] = restrictions.allowedHours.end.split(':').map(Number);
    
    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;
    
    if (currentTimeMinutes < startTimeMinutes || currentTimeMinutes > endTimeMinutes) {
      return { allowed: false, reason: 'Access not allowed at this time' };
    }
  }
  
  return { allowed: true };
};

permissionSchema.methods.checkIpRestrictions = function(ipAddress) {
  const restrictions = this.conditions.ipRestrictions;
  
  if (restrictions.blockedRanges && restrictions.blockedRanges.length > 0) {
    const isBlocked = restrictions.blockedRanges.some(range => 
      ipAddress.startsWith(range.replace('*', ''))
    );
    
    if (isBlocked) {
      return { allowed: false, reason: 'Access blocked from this IP address' };
    }
  }
  
  if (restrictions.allowedRanges && restrictions.allowedRanges.length > 0) {
    const isAllowed = restrictions.allowedRanges.some(range => 
      ipAddress.startsWith(range.replace('*', ''))
    );
    
    if (!isAllowed) {
      return { allowed: false, reason: 'IP address not in allowed ranges' };
    }
  }
  
  return { allowed: true };
};

permissionSchema.methods.checkDataConditions = function(data) {
  for (const condition of this.conditions.dataConditions) {
    const fieldValue = this.getNestedValue(data, condition.field);
    const conditionValue = condition.value;
    
    let conditionMet = false;
    
    switch (condition.operator) {
      case 'equals':
        conditionMet = fieldValue === conditionValue;
        break;
      case 'not_equals':
        conditionMet = fieldValue !== conditionValue;
        break;
      case 'contains':
        conditionMet = String(fieldValue).includes(String(conditionValue));
        break;
      case 'not_contains':
        conditionMet = !String(fieldValue).includes(String(conditionValue));
        break;
      case 'greater_than':
        conditionMet = Number(fieldValue) > Number(conditionValue);
        break;
      case 'less_than':
        conditionMet = Number(fieldValue) < Number(conditionValue);
        break;
    }
    
    if (!conditionMet) {
      return { 
        allowed: false, 
        reason: `Data condition not met: ${condition.field} ${condition.operator} ${conditionValue}` 
      };
    }
  }
  
  return { allowed: true };
};

permissionSchema.methods.getNestedValue = function(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

permissionSchema.methods.updateStatistics = function(action) {
  switch (action) {
    case 'assigned':
      this.statistics.assignmentCount += 1;
      this.statistics.lastAssigned = new Date();
      break;
    case 'used':
      this.statistics.usageCount += 1;
      this.statistics.lastUsed = new Date();
      break;
  }
  return this.save();
};

// Pre-save middleware
permissionSchema.pre('save', function(next) {
  // Generate full permission name if not set
  if (!this.name || this.isModified('resource') || this.isModified('action') || this.isModified('scope')) {
    this.name = this.fullPermission;
  }
  
  // Validate permission name format
  if (!/^[a-z_]+:[a-z_*]+(:own|:department|:company|:all)?$/.test(this.name)) {
    return next(new Error('Invalid permission name format'));
  }
  
  // Ensure system permissions cannot be modified
  if (this.isSystem && this.isModified() && !this._allowSystemModification) {
    return next(new Error('System permissions cannot be modified'));
  }
  
  next();
});

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;