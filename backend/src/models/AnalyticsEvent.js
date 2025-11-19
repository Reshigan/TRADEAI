const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'page_view',
      'action',
      'api_call',
      'error',
      'performance',
      'user_interaction',
      'business_event'
    ],
    index: true
  },
  eventName: {
    type: String,
    required: true,
    index: true
  },

  module: {
    type: String,
    enum: ['budget', 'promotion', 'tradeSpend', 'tradingTerm', 'activityGrid', 'claim', 'deduction', 'kamWallet', 'campaign', 'customer', 'product', 'system'],
    index: true
  },
  entityType: {
    type: String
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userRole: {
    type: String
  },
  userDepartment: {
    type: String
  },

  sessionId: {
    type: String,
    index: true
  },

  properties: {
    type: mongoose.Schema.Types.Mixed
  },

  // Performance metrics
  duration: {
    type: Number
  },

  error: {
    message: String,
    stack: String,
    code: String
  },

  // Metadata
  metadata: {
    userAgent: String,
    ipAddress: String,
    referrer: String,
    url: String,
    method: String,
    statusCode: Number
  },

  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  timeseries: {
    timeField: 'timestamp',
    metaField: 'metadata',
    granularity: 'hours'
  }
});

// Indexes for performance
analyticsEventSchema.index({ userId: 1, timestamp: -1 });
analyticsEventSchema.index({ module: 1, eventType: 1, timestamp: -1 });
analyticsEventSchema.index({ eventName: 1, timestamp: -1 });
analyticsEventSchema.index({ sessionId: 1, timestamp: -1 });

analyticsEventSchema.statics.logEvent = async function (eventData) {
  try {
    const event = await this.create({
      eventId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...eventData,
      timestamp: new Date()
    });
    return event;
  } catch (error) {
    console.error('Error logging analytics event:', error);
    return null;
  }
};

analyticsEventSchema.statics.getSummary = function (filters = {}, startDate, endDate) {
  const matchStage = {
    ...filters,
    timestamp: {
      $gte: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      $lte: endDate || new Date()
    }
  };

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: {
          eventType: '$eventType',
          eventName: '$eventName'
        },
        count: { $sum: 1 },
        avgDuration: { $avg: '$duration' },
        errorCount: {
          $sum: { $cond: [{ $ne: ['$error', null] }, 1, 0] }
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ];

  return this.aggregate(pipeline);
};

analyticsEventSchema.statics.getUserActivity = function (userId, startDate, endDate) {
  return this.find({
    userId,
    timestamp: {
      $gte: startDate || new Date(Date.now() - 24 * 60 * 60 * 1000),
      $lte: endDate || new Date()
    }
  })
    .sort({ timestamp: -1 })
    .limit(100);
};

const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);

module.exports = AnalyticsEvent;
