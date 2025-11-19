const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema({
  insightId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  ruleId: {
    type: String,
    required: true,
    index: true
  },

  module: {
    type: String,
    required: true,
    enum: ['budget', 'promotion', 'tradeSpend', 'tradingTerm', 'activityGrid', 'claim', 'deduction', 'kamWallet', 'campaign', 'customer', 'product'],
    index: true
  },
  entityType: {
    type: String,
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  entityName: {
    type: String
  },

  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    required: true,
    enum: ['info', 'warning', 'critical', 'success'],
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['performance', 'financial', 'compliance', 'operational', 'anomaly'],
    index: true
  },

  metricId: {
    type: String
  },
  actualValue: {
    type: mongoose.Schema.Types.Mixed
  },
  expectedValue: {
    type: mongoose.Schema.Types.Mixed
  },
  threshold: {
    type: mongoose.Schema.Types.Mixed
  },
  variance: {
    type: Number
  },

  recommendedActions: [{
    action: String,
    description: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    }
  }],

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  status: {
    type: String,
    enum: ['new', 'acknowledged', 'in_progress', 'resolved', 'dismissed'],
    default: 'new',
    index: true
  },

  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolutionNotes: {
    type: String
  },

  fingerprint: {
    type: String,
    required: true,
    index: true
  },
  firstSeenAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastSeenAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  occurrenceCount: {
    type: Number,
    default: 1
  },

  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  tags: [{
    type: String,
    index: true
  }],

  mlScore: {
    type: Number,
    min: 0,
    max: 1
  },
  llmSummary: {
    type: String
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for performance
insightSchema.index({ module: 1, entityId: 1, status: 1 });
insightSchema.index({ severity: 1, status: 1, createdAt: -1 });
insightSchema.index({ fingerprint: 1, status: 1 });
insightSchema.index({ owner: 1, status: 1, createdAt: -1 });
insightSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });

insightSchema.virtual('ageInDays').get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

insightSchema.virtual('isStale').get(function () {
  return this.status !== 'resolved' && this.ageInDays > 7;
});

insightSchema.methods.acknowledge = function (userId) {
  this.status = 'acknowledged';
  this.updatedBy = userId;
  return this.save();
};

insightSchema.methods.assign = function (userId, assignedToId) {
  this.assignedTo = assignedToId;
  this.status = 'in_progress';
  this.updatedBy = userId;
  return this.save();
};

insightSchema.methods.resolve = function (userId, notes) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolvedBy = userId;
  this.resolutionNotes = notes;
  this.updatedBy = userId;
  return this.save();
};

insightSchema.methods.dismiss = function (userId, notes) {
  this.status = 'dismissed';
  this.resolvedAt = new Date();
  this.resolvedBy = userId;
  this.resolutionNotes = notes;
  this.updatedBy = userId;
  return this.save();
};

insightSchema.statics.findOrUpdateByFingerprint = async function (fingerprint, insightData) {
  const existing = await this.findOne({
    fingerprint,
    status: { $in: ['new', 'acknowledged', 'in_progress'] }
  });

  if (existing) {
    existing.lastSeenAt = new Date();
    existing.occurrenceCount += 1;
    existing.actualValue = insightData.actualValue;
    existing.variance = insightData.variance;
    await existing.save();
    return { insight: existing, isNew: false };
  } else {
    const insight = await this.create(insightData);
    return { insight, isNew: true };
  }
};

insightSchema.statics.getSummary = async function (filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: {
          severity: '$severity',
          status: '$status'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.severity',
        total: { $sum: '$count' },
        byStatus: {
          $push: {
            status: '$_id.status',
            count: '$count'
          }
        }
      }
    }
  ];

  return this.aggregate(pipeline);
};

insightSchema.statics.getTopByModule = async function (module, limit = 10) {
  return this.find({
    module,
    status: { $in: ['new', 'acknowledged', 'in_progress'] }
  })
    .sort({ severity: -1, createdAt: -1 })
    .limit(limit)
    .populate('owner', 'name email')
    .populate('assignedTo', 'name email');
};

const Insight = mongoose.model('Insight', insightSchema);

module.exports = Insight;
