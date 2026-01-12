const mongoose = require('mongoose');

/**
 * Allocation Model
 * Persists proportional allocation results for promotions, budgets, trade spends, etc.
 * Enables audit trails, recalculation, and variance analysis
 */

const allocationLineSchema = new mongoose.Schema({
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  entityName: {
    type: String,
    required: true
  },
  entityCode: {
    type: String
  },
  weight: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  actualAmount: {
    type: Number,
    default: null
  },
  variance: {
    type: Number,
    default: null
  },
  variancePercentage: {
    type: Number,
    default: null
  }
}, { _id: false });

const allocationSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  sourceType: {
    type: String,
    required: true,
    enum: ['promotion', 'budget', 'trade_spend', 'claim', 'deduction', 'settlement', 'rebate'],
    index: true
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  sourceName: {
    type: String
  },
  allocationDimension: {
    type: String,
    required: true,
    enum: ['product', 'customer', 'product_customer'],
    default: 'product'
  },
  selector: {
    type: {
      type: String,
      enum: ['leaf', 'hierarchy', 'all'],
      required: true
    },
    ids: [{
      type: mongoose.Schema.Types.ObjectId
    }],
    level: {
      type: Number,
      min: 1,
      max: 5
    },
    value: {
      type: String
    }
  },
  basisMetric: {
    type: String,
    required: true,
    enum: ['volume', 'revenue'],
    default: 'revenue'
  },
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  totalAllocated: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'ZAR'
  },
  allocations: [allocationLineSchema],
  statistics: {
    entityCount: { type: Number, default: 0 },
    minAllocation: { type: Number, default: 0 },
    maxAllocation: { type: Number, default: 0 },
    meanAllocation: { type: Number, default: 0 },
    medianAllocation: { type: Number, default: 0 },
    stdDevAllocation: { type: Number, default: 0 }
  },
  hasHistoricalData: {
    type: Boolean,
    default: false
  },
  fallbackUsed: {
    type: String,
    enum: ['none', 'equal_split', 'prior_period', 'plan_mix'],
    default: 'none'
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'superseded', 'archived'],
    default: 'active',
    index: true
  },
  version: {
    type: Number,
    default: 1
  },
  parentAllocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Allocation',
    default: null
  },
  notes: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  auditTrail: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'recalculated', 'superseded', 'archived']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    changes: {
      type: mongoose.Schema.Types.Mixed
    },
    notes: {
      type: String
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

allocationSchema.index({ company: 1, sourceType: 1, sourceId: 1 });
allocationSchema.index({ company: 1, status: 1 });
allocationSchema.index({ company: 1, allocationDimension: 1 });
allocationSchema.index({ 'allocations.entityId': 1 });

allocationSchema.virtual('varianceTotal').get(function () {
  if (!this.allocations || this.allocations.length === 0) return 0;
  return this.allocations.reduce((sum, a) => sum + (a.variance || 0), 0);
});

allocationSchema.virtual('utilizationPercentage').get(function () {
  if (!this.totalAmount || this.totalAmount === 0) return 0;
  const actualTotal = this.allocations.reduce((sum, a) => sum + (a.actualAmount || 0), 0);
  return (actualTotal / this.totalAmount) * 100;
});

allocationSchema.pre('save', function (next) {
  if (this.allocations && this.allocations.length > 0) {
    const amounts = this.allocations.map((a) => a.amount);
    const sorted = [...amounts].sort((a, b) => a - b);
    const sum = amounts.reduce((s, v) => s + v, 0);
    const mean = sum / amounts.length;

    const squaredDiffs = amounts.map((v) => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((s, v) => s + v, 0) / amounts.length;
    const stdDev = Math.sqrt(avgSquaredDiff);

    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;

    this.statistics = {
      entityCount: amounts.length,
      minAllocation: sorted[0],
      maxAllocation: sorted[sorted.length - 1],
      meanAllocation: Math.round(mean * 100) / 100,
      medianAllocation: Math.round(median * 100) / 100,
      stdDevAllocation: Math.round(stdDev * 100) / 100
    };

    this.totalAllocated = sum;
  }

  next();
});

allocationSchema.methods.updateActuals = async function (actuals) {
  for (const actual of actuals) {
    const allocation = this.allocations.find(
      (a) => a.entityId.toString() === actual.entityId.toString()
    );
    if (allocation) {
      allocation.actualAmount = actual.amount;
      allocation.variance = actual.amount - allocation.amount;
      allocation.variancePercentage = allocation.amount > 0
        ? ((allocation.variance / allocation.amount) * 100)
        : 0;
    }
  }

  this.auditTrail.push({
    action: 'updated',
    performedAt: new Date(),
    changes: { actualsUpdated: actuals.length },
    notes: 'Actuals updated'
  });

  await this.save();
};

allocationSchema.methods.supersede = async function (newAllocationId, userId, reason) {
  this.status = 'superseded';
  this.updatedBy = userId;

  this.auditTrail.push({
    action: 'superseded',
    performedBy: userId,
    performedAt: new Date(),
    changes: { supersededBy: newAllocationId },
    notes: reason || 'Superseded by new allocation'
  });

  await this.save();
};

allocationSchema.statics.findBySource = function (companyId, sourceType, sourceId) {
  return this.findOne({
    company: companyId,
    sourceType,
    sourceId,
    status: 'active'
  }).sort({ version: -1 });
};

allocationSchema.statics.findAllBySource = function (companyId, sourceType, sourceId) {
  return this.find({
    company: companyId,
    sourceType,
    sourceId
  }).sort({ version: -1 });
};

allocationSchema.statics.findByEntity = function (companyId, entityType, entityId) {
  const dimension = entityType === 'product' ? 'product' : 'customer';
  return this.find({
    company: companyId,
    allocationDimension: dimension,
    'allocations.entityId': entityId,
    status: 'active'
  });
};

const Allocation = mongoose.model('Allocation', allocationSchema);

module.exports = Allocation;
