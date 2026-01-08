const mongoose = require('mongoose');
const { addTenantSupport } = require('./BaseTenantModel');

const varianceReasonCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    uppercase: true,
    index: true
  },

  name: {
    type: String,
    required: true
  },

  description: String,

  category: {
    type: String,
    required: true,
    enum: [
      'spend_variance',
      'volume_variance',
      'revenue_variance',
      'roi_variance',
      'timing_variance',
      'execution_variance',
      'external_factor'
    ],
    index: true
  },

  subcategory: {
    type: String,
    enum: [
      'overspend',
      'underspend',
      'overperformance',
      'underperformance',
      'stock_out',
      'compliance_issue',
      'execution_failure',
      'price_realization',
      'mix_shift',
      'cannibalization',
      'competitive_action',
      'weather_impact',
      'economic_factor',
      'delayed_claim',
      'early_claim',
      'data_quality',
      'calculation_error',
      'other'
    ]
  },

  varianceDirection: {
    type: String,
    enum: ['positive', 'negative', 'both'],
    default: 'both'
  },

  applicableTo: [{
    type: String,
    enum: ['promotion', 'trade_spend', 'budget', 'claim', 'deduction', 'accrual']
  }],

  requiresEvidence: {
    type: Boolean,
    default: false
  },

  evidenceTypes: [{
    type: String,
    enum: ['photo', 'document', 'report', 'email', 'invoice', 'pos_data', 'other']
  }],

  suggestedActions: [{
    action: String,
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    assignTo: {
      type: String,
      enum: ['kam', 'manager', 'finance', 'trade_marketing', 'operations']
    }
  }],

  impactAssessment: {
    financialImpact: {
      type: String,
      enum: ['high', 'medium', 'low', 'none'],
      default: 'medium'
    },
    operationalImpact: {
      type: String,
      enum: ['high', 'medium', 'low', 'none'],
      default: 'low'
    },
    customerImpact: {
      type: String,
      enum: ['high', 'medium', 'low', 'none'],
      default: 'low'
    }
  },

  preventionStrategies: [String],

  isSystemDefined: {
    type: Boolean,
    default: false
  },

  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  sortOrder: {
    type: Number,
    default: 0
  },

  usageCount: {
    type: Number,
    default: 0
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

addTenantSupport(varianceReasonCodeSchema);

varianceReasonCodeSchema.index({ tenantId: 1, code: 1 }, { unique: true });
varianceReasonCodeSchema.index({ tenantId: 1, category: 1, isActive: 1 });
varianceReasonCodeSchema.index({ tenantId: 1, 'applicableTo': 1 });

varianceReasonCodeSchema.methods.incrementUsage = function () {
  this.usageCount += 1;
  return this.save();
};

varianceReasonCodeSchema.statics.findByCategory = function (tenantId, category) {
  return this.find({ tenantId, category, isActive: true }).sort({ sortOrder: 1, name: 1 });
};

varianceReasonCodeSchema.statics.findForEntity = function (tenantId, entityType) {
  return this.find({
    tenantId,
    applicableTo: entityType,
    isActive: true
  }).sort({ sortOrder: 1, name: 1 });
};

varianceReasonCodeSchema.statics.getTopUsed = function (tenantId, limit = 10) {
  return this.find({ tenantId, isActive: true })
    .sort({ usageCount: -1 })
    .limit(limit);
};

varianceReasonCodeSchema.statics.seedDefaults = function (tenantId, userId) {
  const defaults = [
    {
      code: 'OVERSPEND_BUDGET',
      name: 'Budget Overspend',
      description: 'Actual spend exceeded planned budget',
      category: 'spend_variance',
      subcategory: 'overspend',
      varianceDirection: 'negative',
      applicableTo: ['promotion', 'trade_spend', 'budget'],
      suggestedActions: [
        { action: 'Review approval process', priority: 'high', assignTo: 'manager' },
        { action: 'Adjust future budget allocations', priority: 'medium', assignTo: 'finance' }
      ],
      impactAssessment: { financialImpact: 'high', operationalImpact: 'low', customerImpact: 'none' },
      isSystemDefined: true
    },
    {
      code: 'UNDERSPEND_BUDGET',
      name: 'Budget Underspend',
      description: 'Actual spend was below planned budget',
      category: 'spend_variance',
      subcategory: 'underspend',
      varianceDirection: 'positive',
      applicableTo: ['promotion', 'trade_spend', 'budget'],
      suggestedActions: [
        { action: 'Reallocate unused funds', priority: 'medium', assignTo: 'finance' },
        { action: 'Review execution effectiveness', priority: 'low', assignTo: 'kam' }
      ],
      impactAssessment: { financialImpact: 'medium', operationalImpact: 'low', customerImpact: 'none' },
      isSystemDefined: true
    },
    {
      code: 'STOCK_OUT',
      name: 'Stock Out',
      description: 'Product unavailability during promotion period',
      category: 'volume_variance',
      subcategory: 'stock_out',
      varianceDirection: 'negative',
      applicableTo: ['promotion'],
      requiresEvidence: true,
      evidenceTypes: ['report', 'email'],
      suggestedActions: [
        { action: 'Coordinate with supply chain', priority: 'high', assignTo: 'operations' },
        { action: 'Adjust forecast for future promotions', priority: 'medium', assignTo: 'trade_marketing' }
      ],
      impactAssessment: { financialImpact: 'high', operationalImpact: 'high', customerImpact: 'high' },
      preventionStrategies: ['Increase safety stock during promotions', 'Improve demand forecasting'],
      isSystemDefined: true
    },
    {
      code: 'COMPLIANCE_FAIL',
      name: 'Compliance Failure',
      description: 'Retailer did not execute promotion as agreed',
      category: 'execution_variance',
      subcategory: 'compliance_issue',
      varianceDirection: 'negative',
      applicableTo: ['promotion', 'trade_spend'],
      requiresEvidence: true,
      evidenceTypes: ['photo', 'report'],
      suggestedActions: [
        { action: 'Document non-compliance', priority: 'high', assignTo: 'kam' },
        { action: 'Negotiate claim adjustment', priority: 'high', assignTo: 'finance' },
        { action: 'Review retailer performance', priority: 'medium', assignTo: 'manager' }
      ],
      impactAssessment: { financialImpact: 'high', operationalImpact: 'medium', customerImpact: 'medium' },
      isSystemDefined: true
    },
    {
      code: 'PRICE_REALIZATION',
      name: 'Price Realization Issue',
      description: 'Actual selling price differed from planned price',
      category: 'revenue_variance',
      subcategory: 'price_realization',
      varianceDirection: 'both',
      applicableTo: ['promotion'],
      suggestedActions: [
        { action: 'Review pricing execution', priority: 'medium', assignTo: 'kam' },
        { action: 'Verify POS data accuracy', priority: 'low', assignTo: 'finance' }
      ],
      impactAssessment: { financialImpact: 'medium', operationalImpact: 'low', customerImpact: 'low' },
      isSystemDefined: true
    },
    {
      code: 'CANNIBALIZATION',
      name: 'Cannibalization Effect',
      description: 'Promotion cannibalized sales from other products',
      category: 'roi_variance',
      subcategory: 'cannibalization',
      varianceDirection: 'negative',
      applicableTo: ['promotion'],
      suggestedActions: [
        { action: 'Analyze portfolio impact', priority: 'medium', assignTo: 'trade_marketing' },
        { action: 'Adjust future promotion mix', priority: 'low', assignTo: 'manager' }
      ],
      impactAssessment: { financialImpact: 'medium', operationalImpact: 'low', customerImpact: 'none' },
      isSystemDefined: true
    },
    {
      code: 'COMPETITIVE_ACTION',
      name: 'Competitive Action',
      description: 'Competitor activity impacted promotion performance',
      category: 'external_factor',
      subcategory: 'competitive_action',
      varianceDirection: 'negative',
      applicableTo: ['promotion'],
      requiresEvidence: true,
      evidenceTypes: ['report', 'photo'],
      suggestedActions: [
        { action: 'Document competitive activity', priority: 'medium', assignTo: 'kam' },
        { action: 'Adjust competitive response strategy', priority: 'low', assignTo: 'trade_marketing' }
      ],
      impactAssessment: { financialImpact: 'medium', operationalImpact: 'low', customerImpact: 'low' },
      isSystemDefined: true
    },
    {
      code: 'DELAYED_CLAIM',
      name: 'Delayed Claim Submission',
      description: 'Claim was submitted later than expected',
      category: 'timing_variance',
      subcategory: 'delayed_claim',
      varianceDirection: 'negative',
      applicableTo: ['claim', 'accrual'],
      suggestedActions: [
        { action: 'Follow up with retailer', priority: 'high', assignTo: 'finance' },
        { action: 'Review claim submission process', priority: 'medium', assignTo: 'manager' }
      ],
      impactAssessment: { financialImpact: 'low', operationalImpact: 'medium', customerImpact: 'none' },
      isSystemDefined: true
    },
    {
      code: 'OVERPERFORMANCE',
      name: 'Promotion Overperformance',
      description: 'Promotion exceeded expected sales targets',
      category: 'volume_variance',
      subcategory: 'overperformance',
      varianceDirection: 'positive',
      applicableTo: ['promotion'],
      suggestedActions: [
        { action: 'Document success factors', priority: 'medium', assignTo: 'trade_marketing' },
        { action: 'Consider replication', priority: 'low', assignTo: 'manager' }
      ],
      impactAssessment: { financialImpact: 'high', operationalImpact: 'low', customerImpact: 'low' },
      isSystemDefined: true
    },
    {
      code: 'DATA_QUALITY',
      name: 'Data Quality Issue',
      description: 'Variance due to data quality or reporting issues',
      category: 'execution_variance',
      subcategory: 'data_quality',
      varianceDirection: 'both',
      applicableTo: ['promotion', 'trade_spend', 'claim', 'deduction'],
      suggestedActions: [
        { action: 'Investigate data source', priority: 'high', assignTo: 'finance' },
        { action: 'Correct data if possible', priority: 'high', assignTo: 'finance' }
      ],
      impactAssessment: { financialImpact: 'low', operationalImpact: 'high', customerImpact: 'none' },
      isSystemDefined: true
    }
  ];

  const operations = defaults.map((def) => ({
    updateOne: {
      filter: { tenantId, code: def.code },
      update: { $setOnInsert: { ...def, tenantId, createdBy: userId } },
      upsert: true
    }
  }));

  return this.bulkWrite(operations);
};

module.exports = mongoose.model('VarianceReasonCode', varianceReasonCodeSchema);
