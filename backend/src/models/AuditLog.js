const mongoose = require('mongoose');
const { BaseTenantModel } = require('./BaseTenantModel');

const auditLogSchema = new mongoose.Schema({
  // User who performed the action
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Action performed
  action: {
    type: String,
    required: true,
    enum: [
      // Authentication actions
      'USER_LOGIN', 'USER_LOGOUT', 'PASSWORD_CHANGE', 'PASSWORD_RESET',
      'MFA_ENABLED', 'MFA_DISABLED', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED',
      
      // User management
      'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_ACTIVATED', 'USER_DEACTIVATED',
      
      // Role and permission management
      'ROLE_CREATED', 'ROLE_UPDATED', 'ROLE_DELETED', 'ROLE_ASSIGNED', 'ROLE_REMOVED',
      'PERMISSION_GRANTED', 'PERMISSION_REVOKED', 'PERMISSION_CHECK',
      
      // Data operations
      'RECORD_CREATED', 'RECORD_UPDATED', 'RECORD_DELETED', 'RECORD_VIEWED',
      'BULK_IMPORT', 'BULK_EXPORT', 'DATA_MIGRATION',
      
      // System operations
      'SYSTEM_CONFIG_CHANGED', 'BACKUP_CREATED', 'BACKUP_RESTORED',
      'INTEGRATION_CONFIGURED', 'API_KEY_GENERATED', 'API_KEY_REVOKED',
      
      // Security events
      'SECURITY_POLICY_CHANGED', 'ENCRYPTION_KEY_ROTATED', 'AUDIT_LOG_ACCESSED',
      
      // Business operations
      'PROMOTION_CREATED', 'PROMOTION_UPDATED', 'PROMOTION_DELETED',
      'TRADE_SPEND_CREATED', 'TRADE_SPEND_UPDATED', 'TRADE_SPEND_APPROVED',
      'REPORT_GENERATED', 'REPORT_SHARED', 'REPORT_DOWNLOADED',
      'ANALYTICS_CALCULATED', 'FORECAST_GENERATED'
    ],
    index: true
  },
  
  // Resource type being acted upon
  resource: {
    type: String,
    required: true,
    enum: [
      'user', 'role', 'permission', 'tenant', 'company',
      'customer', 'product', 'promotion', 'campaign',
      'trade_spend', 'budget', 'report', 'analytics',
      'integration', 'system', 'authentication', 'rbac'
    ],
    index: true
  },
  
  // Specific resource ID
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  
  // Previous state (for updates/deletes)
  previousState: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // New state (for creates/updates)
  newState: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Additional details about the action
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Request metadata
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  
  userAgent: {
    type: String
  },
  
  // Session information
  sessionId: {
    type: String,
    index: true
  },
  
  // Request ID for tracing
  requestId: {
    type: String,
    index: true
  },
  
  // Severity level
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW',
    index: true
  },
  
  // Success/failure status
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE', 'PARTIAL'],
    default: 'SUCCESS',
    index: true
  },
  
  // Error information (if applicable)
  error: {
    message: String,
    code: String,
    stack: String
  },
  
  // Performance metrics
  duration: {
    type: Number, // milliseconds
    min: 0
  },
  
  // Data size (for bulk operations)
  recordCount: {
    type: Number,
    min: 0
  },
  
  // Compliance and regulatory fields
  complianceFlags: [{
    type: String,
    enum: ['GDPR', 'SOX', 'HIPAA', 'PCI_DSS', 'SOC2']
  }],
  
  // Retention policy
  retentionDate: {
    type: Date,
    index: true
  },
  
  // Archival status
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Apply tenant isolation
auditLogSchema.plugin(BaseTenantModel);

// Indexes for performance and querying
auditLogSchema.index({ tenantId: 1, createdAt: -1 });
auditLogSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });
auditLogSchema.index({ tenantId: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ tenantId: 1, resource: 1, createdAt: -1 });
auditLogSchema.index({ tenantId: 1, severity: 1, createdAt: -1 });
auditLogSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
auditLogSchema.index({ tenantId: 1, ipAddress: 1, createdAt: -1 });
auditLogSchema.index({ retentionDate: 1 }, { sparse: true });

// Compound indexes for complex queries
auditLogSchema.index({ 
  tenantId: 1, 
  userId: 1, 
  action: 1, 
  createdAt: -1 
});

auditLogSchema.index({ 
  tenantId: 1, 
  resource: 1, 
  resourceId: 1, 
  createdAt: -1 
});

// Virtual for formatted timestamp
auditLogSchema.virtual('formattedTimestamp').get(function() {
  return this.createdAt.toISOString();
});

// Virtual for user display name
auditLogSchema.virtual('userDisplayName').get(function() {
  if (this.populated('userId') && this.userId) {
    return `${this.userId.firstName} ${this.userId.lastName}`;
  }
  return 'Unknown User';
});

// Virtual for action description
auditLogSchema.virtual('actionDescription').get(function() {
  const descriptions = {
    'USER_LOGIN': 'User logged in',
    'USER_LOGOUT': 'User logged out',
    'RECORD_CREATED': 'Record created',
    'RECORD_UPDATED': 'Record updated',
    'RECORD_DELETED': 'Record deleted',
    'ROLE_ASSIGNED': 'Role assigned to user',
    'PERMISSION_CHECK': 'Permission checked',
    'REPORT_GENERATED': 'Report generated'
  };
  
  return descriptions[this.action] || this.action.replace(/_/g, ' ').toLowerCase();
});

// Static methods for querying
auditLogSchema.statics.findByUser = function(tenantId, userId, options = {}) {
  const { startDate, endDate, actions, limit = 100 } = options;
  
  const query = { tenantId, userId };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  if (actions && actions.length > 0) {
    query.action = { $in: actions };
  }
  
  return this.find(query)
    .populate('userId', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

auditLogSchema.statics.findByResource = function(tenantId, resource, resourceId, options = {}) {
  const { startDate, endDate, limit = 100 } = options;
  
  const query = { tenantId, resource };
  if (resourceId) query.resourceId = resourceId;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .populate('userId', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

auditLogSchema.statics.getActivitySummary = function(tenantId, options = {}) {
  const { startDate, endDate } = options;
  
  const matchStage = { tenantId };
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          action: '$action',
          resource: '$resource',
          status: '$status'
        },
        count: { $sum: 1 },
        avgDuration: { $avg: '$duration' },
        lastOccurrence: { $max: '$createdAt' }
      }
    },
    {
      $group: {
        _id: '$_id.action',
        totalCount: { $sum: '$count' },
        resources: {
          $push: {
            resource: '$_id.resource',
            status: '$_id.status',
            count: '$count',
            avgDuration: '$avgDuration',
            lastOccurrence: '$lastOccurrence'
          }
        }
      }
    },
    { $sort: { totalCount: -1 } }
  ]);
};

auditLogSchema.statics.getSecurityEvents = function(tenantId, options = {}) {
  const { severity, startDate, endDate, limit = 100 } = options;
  
  const query = { 
    tenantId,
    severity: { $in: severity || ['HIGH', 'CRITICAL'] }
  };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .populate('userId', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Pre-save middleware
auditLogSchema.pre('save', function(next) {
  // Set retention date based on compliance requirements
  if (!this.retentionDate) {
    const retentionPeriods = {
      'GDPR': 6 * 365, // 6 years
      'SOX': 7 * 365,  // 7 years
      'HIPAA': 6 * 365, // 6 years
      'PCI_DSS': 1 * 365, // 1 year
      'SOC2': 1 * 365  // 1 year
    };
    
    let maxRetentionDays = 365; // Default 1 year
    
    if (this.complianceFlags && this.complianceFlags.length > 0) {
      maxRetentionDays = Math.max(
        ...this.complianceFlags.map(flag => retentionPeriods[flag] || 365)
      );
    }
    
    this.retentionDate = new Date(Date.now() + maxRetentionDays * 24 * 60 * 60 * 1000);
  }
  
  next();
});

// Instance methods
auditLogSchema.methods.archive = function() {
  this.isArchived = true;
  return this.save();
};

auditLogSchema.methods.shouldBeRetained = function() {
  return new Date() < this.retentionDate;
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;