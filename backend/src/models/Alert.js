const mongoose = require('mongoose');
const { addTenantSupport } = require('./BaseTenantModel');

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'budget_threshold',
      'promotion_performance',
      'system_health',
      'performance',
      'spend_variance',
      'approval_pending',
      'rebate_threshold',
      'forecast_deviation',
      'custom'
    ],
    index: true
  },

  priority: {
    type: String,
    required: true,
    enum: ['critical', 'warning', 'info'],
    default: 'info',
    index: true
  },

  status: {
    type: String,
    required: true,
    enum: ['active', 'acknowledged', 'resolved', 'dismissed'],
    default: 'active',
    index: true
  },

  message: {
    type: String,
    required: true
  },

  details: {
    threshold: Number,
    currentValue: Number,
    entityType: String,
    entityId: mongoose.Schema.Types.ObjectId,
    entityName: String,
    metadata: mongoose.Schema.Types.Mixed
  },

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },

  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  acknowledgedAt: Date,

  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  resolvedAt: Date,

  resolution: {
    action: String,
    notes: String
  },

  notificationsSent: [{
    channel: {
      type: String,
      enum: ['email', 'sms', 'push', 'in_app']
    },
    sentAt: Date,
    recipient: String
  }],

  expiresAt: {
    type: Date,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

addTenantSupport(alertSchema);

alertSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
alertSchema.index({ tenantId: 1, type: 1, status: 1 });
alertSchema.index({ tenantId: 1, priority: 1, status: 1 });
alertSchema.index({ companyId: 1, status: 1, createdAt: -1 });

alertSchema.statics.getActiveAlerts = function (companyId, options = {}) {
  const { type, priority, limit = 50 } = options;

  const query = {
    companyId,
    status: 'active'
  };

  if (type) query.type = type;
  if (priority) query.priority = priority;

  return this.find(query)
    .sort({ priority: 1, createdAt: -1 })
    .limit(limit);
};

alertSchema.statics.getAlertSummary = function (companyId) {
  return this.aggregate([
    { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
    {
      $group: {
        _id: { status: '$status', priority: '$priority' },
        count: { $sum: 1 }
      }
    }
  ]);
};

alertSchema.methods.acknowledge = function (userId) {
  this.status = 'acknowledged';
  this.acknowledgedBy = userId;
  this.acknowledgedAt = new Date();
  return this.save();
};

alertSchema.methods.resolve = function (userId, resolution) {
  this.status = 'resolved';
  this.resolvedBy = userId;
  this.resolvedAt = new Date();
  this.resolution = resolution;
  return this.save();
};

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;
