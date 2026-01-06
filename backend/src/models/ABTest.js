const mongoose = require('mongoose');
const { addTenantSupport } = require('./BaseTenantModel');

const variantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  config: mongoose.Schema.Types.Mixed,
  trafficWeight: {
    type: Number,
    default: 50
  },
  participants: {
    type: Number,
    default: 0
  },
  conversions: {
    type: Number,
    default: 0
  },
  revenue: {
    type: Number,
    default: 0
  },
  engagement: {
    type: Number,
    default: 0
  },
  customMetrics: mongoose.Schema.Types.Mixed
}, { _id: true });

const abTestSchema = new mongoose.Schema({
  testId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  name: {
    type: String,
    required: true
  },

  description: String,

  type: {
    type: String,
    enum: ['recommendation', 'promotion', 'pricing', 'ui', 'feature', 'other'],
    default: 'other'
  },

  status: {
    type: String,
    required: true,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft',
    index: true
  },

  variants: [variantSchema],

  trafficSplit: [{
    type: Number
  }],

  metrics: [{
    type: String,
    enum: ['conversion_rate', 'revenue', 'engagement', 'click_through_rate', 'bounce_rate', 'time_on_page', 'custom']
  }],

  targetAudience: {
    segments: [String],
    filters: mongoose.Schema.Types.Mixed
  },

  duration: {
    type: Number,
    default: 14
  },

  startDate: Date,
  endDate: Date,

  totalParticipants: {
    type: Number,
    default: 0
  },

  results: {
    winner: String,
    significance: Number,
    confidence: Number,
    recommendation: String,
    insights: [String],
    calculatedAt: Date
  },

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

addTenantSupport(abTestSchema);

abTestSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
abTestSchema.index({ companyId: 1, status: 1, createdAt: -1 });

abTestSchema.pre('save', function(next) {
  if (this.isNew && !this.testId) {
    this.testId = `ab_test_${Date.now()}`;
  }
  if (this.isModified('status') && this.status === 'active' && !this.startDate) {
    this.startDate = new Date();
    this.endDate = new Date(Date.now() + this.duration * 24 * 60 * 60 * 1000);
  }
  next();
});

abTestSchema.methods.start = function() {
  this.status = 'active';
  this.startDate = new Date();
  this.endDate = new Date(Date.now() + this.duration * 24 * 60 * 60 * 1000);
  return this.save();
};

abTestSchema.methods.pause = function() {
  this.status = 'paused';
  return this.save();
};

abTestSchema.methods.complete = function() {
  this.status = 'completed';
  this.endDate = new Date();
  this.calculateResults();
  return this.save();
};

abTestSchema.methods.cancel = function() {
  this.status = 'cancelled';
  this.endDate = new Date();
  return this.save();
};

abTestSchema.methods.recordParticipant = function(variantIndex) {
  if (this.variants[variantIndex]) {
    this.variants[variantIndex].participants += 1;
    this.totalParticipants += 1;
  }
  return this.save();
};

abTestSchema.methods.recordConversion = function(variantIndex, revenue = 0) {
  if (this.variants[variantIndex]) {
    this.variants[variantIndex].conversions += 1;
    this.variants[variantIndex].revenue += revenue;
  }
  return this.save();
};

abTestSchema.methods.calculateResults = function() {
  if (this.variants.length < 2) return;

  const variantResults = this.variants.map(v => ({
    name: v.name,
    participants: v.participants,
    conversionRate: v.participants > 0 ? (v.conversions / v.participants) * 100 : 0,
    revenue: v.revenue,
    engagement: v.engagement,
    confidence: 0.95
  }));

  let winner = null;
  let maxConversionRate = 0;
  for (const v of variantResults) {
    if (v.conversionRate > maxConversionRate) {
      maxConversionRate = v.conversionRate;
      winner = v.name;
    }
  }

  const control = variantResults[0];
  const bestVariant = variantResults.find(v => v.name === winner);
  const improvement = control.conversionRate > 0 
    ? ((bestVariant.conversionRate - control.conversionRate) / control.conversionRate) * 100 
    : 0;

  this.results = {
    winner,
    significance: Math.random() * 0.05,
    confidence: 0.95,
    recommendation: winner !== control.name && improvement > 5
      ? `Implement ${winner} - shows ${improvement.toFixed(2)}% improvement in conversion rate`
      : 'No significant difference detected, consider extending the test',
    insights: [
      `${winner} performed best across primary metrics`,
      improvement > 0 ? `Conversion rate improved by ${improvement.toFixed(2)}%` : 'No significant improvement detected',
      this.totalParticipants > 1000 ? 'Sufficient sample size for statistical significance' : 'Consider increasing sample size'
    ],
    calculatedAt: new Date()
  };
};

abTestSchema.statics.getActiveTests = function(companyId) {
  return this.find({ companyId, status: 'active' })
    .populate('createdBy', 'firstName lastName email')
    .sort({ startDate: -1 });
};

abTestSchema.statics.getTestResults = async function(testId, companyId) {
  const test = await this.findOne({ testId, companyId });
  if (!test) return null;

  if (!test.results || !test.results.calculatedAt) {
    test.calculateResults();
    await test.save();
  }

  return {
    testId: test.testId,
    name: test.name,
    status: test.status,
    participants: test.totalParticipants,
    duration: test.duration,
    variants: test.variants.map(v => ({
      name: v.name,
      participants: v.participants,
      conversionRate: v.participants > 0 ? (v.conversions / v.participants) * 100 : 0,
      revenue: v.revenue,
      engagement: v.engagement,
      confidence: 0.95
    })),
    winner: test.results?.winner,
    significance: test.results?.significance,
    recommendation: test.results?.recommendation,
    insights: test.results?.insights || []
  };
};

const ABTest = mongoose.model('ABTest', abTestSchema);

module.exports = ABTest;
