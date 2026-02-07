const mongoose = require('mongoose');
const { addTenantSupport } = require('./BaseTenantModel');

const businessRulesConfigSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
    unique: true
  },
  promotions: {
    discountCaps: {
      maxPercent: { type: Number, default: 60 },
      maxAbsolute: { type: Number, default: 0 }, // 0 = unlimited
      requireJustificationOverPercent: { type: Number, default: 40 }
    },
    stacking: {
      allowStacking: { type: Boolean, default: false },
      maxStackedPromotions: { type: Number, default: 1 },
      overlapPolicy: { type: String, enum: ['disallow', 'allow_same_product', 'allow_all'], default: 'disallow' }
    },
    duration: {
      minDays: { type: Number, default: 1 },
      maxDays: { type: Number, default: 90 }
    },
    eligibility: {
      segmentsRequired: { type: Boolean, default: false },
      allowedSegments: { type: [String], default: [] }
    },
    roi: {
      minExpectedROI: { type: Number, default: 0 }, // %
      requireSimulation: { type: Boolean, default: false }
    },
    approvals: {
      thresholds: [{ amount: Number, approverRole: String }],
      requireMFAForHighRisk: { type: Boolean, default: false }
    }
  },
  budgets: {
    allocationCaps: {
      byCategoryPercent: { type: Map, of: Number, default: {} },
      overallPercentOfRevenue: { type: Number, default: 20 }
    },
    approvals: {
      thresholds: [{ amount: Number, approverRole: String }]
    },
    guardrails: {
      requireROIForSpendOverAmount: { type: Number, default: 0 }
    }
  },
  rebates: {
    accrualRates: { type: Map, of: Number, default: {} },
    settlement: {
      cycle: { type: String, enum: ['monthly', 'quarterly', 'annually'], default: 'quarterly' },
      settlementWindowDays: { type: Number, default: 30 }
    }
  },
  claims: {
    autoMatching: { type: Boolean, default: true },
    writeoffLimits: { type: Number, default: 0 }
  },
  calendars: {
    fiscalStartMonth: { type: Number, min: 1, max: 12, default: 1 },
    holidayCalendar: { type: String, default: 'none' }
  },
  localization: {
    defaultCurrency: { type: String, default: 'USD' },
    taxPolicy: { type: String, enum: ['exclusive', 'inclusive'], default: 'exclusive' }
  },
  glExport: {
    enabled: { type: Boolean, default: false },
    mappings: { type: Map, of: String, default: {} }
  },
  overrides: {
    allowManualOverrideWithAudit: { type: Boolean, default: true },
    requireReasonForOverride: { type: Boolean, default: true }
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

addTenantSupport(businessRulesConfigSchema);

businessRulesConfigSchema.statics.getOrCreate = async function (companyId) {
  const existing = await this.findOne({ companyId });
  if (existing) return existing;
  const defaults = new this({ companyId });
  return defaults.save();
};

const BusinessRulesConfig = mongoose.models.BusinessRulesConfig || mongoose.model('BusinessRulesConfig', businessRulesConfigSchema);
module.exports = BusinessRulesConfig;
