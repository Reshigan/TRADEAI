const mongoose = require('mongoose');
const { addTenantSupport } = require('./BaseTenantModel');

const dataLineageSchema = new mongoose.Schema({
  entityType: {
    type: String,
    required: true,
    enum: ['promotion', 'trade_spend', 'budget', 'claim', 'deduction', 'accrual', 'settlement', 'report'],
    index: true
  },

  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },

  metricType: {
    type: String,
    required: true,
    enum: [
      'baseline_volume',
      'baseline_revenue',
      'incremental_volume',
      'incremental_revenue',
      'uplift_percentage',
      'roi',
      'total_cost',
      'net_profit',
      'effectiveness_score',
      'accrual_amount',
      'claim_amount',
      'variance'
    ],
    index: true
  },

  calculatedValue: {
    type: Number,
    required: true
  },

  calculationVersion: {
    type: String,
    default: '1.0'
  },

  calculatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  calculatedBy: {
    type: String,
    enum: ['system', 'user', 'import', 'api'],
    default: 'system'
  },

  calculationMethod: {
    type: String,
    required: true
  },

  baselineConfig: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BaselineConfig'
  },

  inputs: [{
    sourceType: {
      type: String,
      required: true,
      enum: ['sales_transaction', 'trade_spend', 'promotion', 'budget', 'claim', 'deduction', 'manual', 'import']
    },
    sourceId: mongoose.Schema.Types.ObjectId,
    sourceCollection: String,
    field: String,
    value: mongoose.Schema.Types.Mixed,
    dateRange: {
      start: Date,
      end: Date
    },
    aggregation: {
      type: String,
      enum: ['sum', 'avg', 'count', 'min', 'max', 'median']
    },
    recordCount: Number
  }],

  formula: {
    expression: String,
    variables: mongoose.Schema.Types.Mixed,
    description: String
  },

  confidence: {
    score: {
      type: Number,
      min: 0,
      max: 1
    },
    factors: [{
      factor: String,
      impact: {
        type: String,
        enum: ['positive', 'negative', 'neutral']
      },
      weight: Number
    }]
  },

  validation: {
    isValid: {
      type: Boolean,
      default: true
    },
    warnings: [String],
    errors: [String],
    validatedAt: Date
  },

  previousCalculation: {
    value: Number,
    calculatedAt: Date,
    variance: Number,
    variancePercent: Number
  },

  manualOverride: {
    isOverridden: {
      type: Boolean,
      default: false
    },
    originalValue: Number,
    overriddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    overriddenAt: Date,
    reason: String,
    reasonCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VarianceReasonCode'
    }
  },

  auditTrail: [{
    action: {
      type: String,
      enum: ['created', 'recalculated', 'overridden', 'validated', 'invalidated']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    previousValue: Number,
    newValue: Number,
    reason: String
  }],

  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

addTenantSupport(dataLineageSchema);

dataLineageSchema.index({ tenantId: 1, entityType: 1, entityId: 1, metricType: 1 });
dataLineageSchema.index({ tenantId: 1, calculatedAt: -1 });
dataLineageSchema.index({ tenantId: 1, 'manualOverride.isOverridden': 1 });

dataLineageSchema.virtual('inputSummary').get(function () {
  return this.inputs.map((input) => ({
    source: input.sourceType,
    field: input.field,
    records: input.recordCount,
    dateRange: input.dateRange
  }));
});

dataLineageSchema.virtual('isStale').get(function () {
  const staleThreshold = 7 * 24 * 60 * 60 * 1000;
  return (Date.now() - this.calculatedAt) > staleThreshold;
});

dataLineageSchema.methods.override = function (newValue, userId, reason, reasonCodeId) {
  this.manualOverride = {
    isOverridden: true,
    originalValue: this.calculatedValue,
    overriddenBy: userId,
    overriddenAt: new Date(),
    reason,
    reasonCode: reasonCodeId
  };

  this.auditTrail.push({
    action: 'overridden',
    performedBy: userId,
    previousValue: this.calculatedValue,
    newValue,
    reason
  });

  this.calculatedValue = newValue;
  return this.save();
};

dataLineageSchema.methods.recalculate = function (newValue, inputs, formula, userId) {
  this.previousCalculation = {
    value: this.calculatedValue,
    calculatedAt: this.calculatedAt,
    variance: newValue - this.calculatedValue,
    variancePercent: this.calculatedValue !== 0
      ? ((newValue - this.calculatedValue) / this.calculatedValue) * 100
      : 0
  };

  this.calculatedValue = newValue;
  this.inputs = inputs;
  this.formula = formula;
  this.calculatedAt = new Date();
  this.manualOverride.isOverridden = false;

  this.auditTrail.push({
    action: 'recalculated',
    performedBy: userId,
    previousValue: this.previousCalculation.value,
    newValue,
    reason: 'System recalculation'
  });

  return this.save();
};

dataLineageSchema.statics.findForEntity = function (tenantId, entityType, entityId) {
  return this.find({ tenantId, entityType, entityId })
    .populate('baselineConfig', 'name methodology')
    .populate('manualOverride.overriddenBy', 'firstName lastName')
    .populate('manualOverride.reasonCode', 'code name')
    .sort({ metricType: 1 });
};

dataLineageSchema.statics.findOverridden = function (tenantId, options = {}) {
  const query = {
    tenantId,
    'manualOverride.isOverridden': true
  };

  if (options.entityType) query.entityType = options.entityType;
  if (options.startDate || options.endDate) {
    query['manualOverride.overriddenAt'] = {};
    if (options.startDate) query['manualOverride.overriddenAt'].$gte = options.startDate;
    if (options.endDate) query['manualOverride.overriddenAt'].$lte = options.endDate;
  }

  return this.find(query)
    .populate('manualOverride.overriddenBy', 'firstName lastName')
    .sort({ 'manualOverride.overriddenAt': -1 });
};

dataLineageSchema.statics.getCalculationSummary = function (tenantId, entityType, entityId) {
  return this.aggregate([
    {
      $match: { tenantId: mongoose.Types.ObjectId(tenantId), entityType, entityId: mongoose.Types.ObjectId(entityId) }
    },
    {
      $group: {
        _id: '$metricType',
        currentValue: { $last: '$calculatedValue' },
        calculatedAt: { $last: '$calculatedAt' },
        isOverridden: { $last: '$manualOverride.isOverridden' },
        inputCount: { $last: { $size: '$inputs' } },
        confidence: { $last: '$confidence.score' }
      }
    }
  ]);
};

module.exports = mongoose.model('DataLineage', dataLineageSchema);
