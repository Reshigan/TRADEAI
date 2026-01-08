const mongoose = require('mongoose');
const { addTenantSupport } = require('./BaseTenantModel');

const baselineConfigSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  description: String,

  isDefault: {
    type: Boolean,
    default: false,
    index: true
  },

  methodology: {
    type: String,
    required: true,
    enum: [
      'pre_period_average',
      'pre_period_median',
      'moving_average',
      'weighted_average',
      'linear_regression',
      'seasonal_adjusted',
      'year_over_year',
      'custom'
    ],
    default: 'pre_period_average'
  },

  prePeriod: {
    weeks: {
      type: Number,
      default: 4,
      min: 1,
      max: 52
    },
    excludePromotions: {
      type: Boolean,
      default: true
    },
    excludeOutliers: {
      type: Boolean,
      default: true
    },
    outlierThreshold: {
      type: Number,
      default: 2.0,
      min: 1.0,
      max: 5.0
    }
  },

  postPeriod: {
    weeks: {
      type: Number,
      default: 2,
      min: 0,
      max: 12
    },
    includeInAnalysis: {
      type: Boolean,
      default: true
    }
  },

  aggregation: {
    grain: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    level: {
      type: String,
      enum: ['sku', 'brand', 'category', 'customer', 'customer_sku'],
      default: 'customer_sku'
    }
  },

  seasonalityAdjustment: {
    enabled: {
      type: Boolean,
      default: false
    },
    method: {
      type: String,
      enum: ['multiplicative', 'additive', 'stl_decomposition'],
      default: 'multiplicative'
    },
    seasonalPeriod: {
      type: Number,
      default: 52
    }
  },

  trendAdjustment: {
    enabled: {
      type: Boolean,
      default: false
    },
    method: {
      type: String,
      enum: ['linear', 'exponential', 'polynomial'],
      default: 'linear'
    }
  },

  minimumDataPoints: {
    type: Number,
    default: 4,
    min: 2
  },

  confidenceLevel: {
    type: Number,
    default: 0.95,
    min: 0.8,
    max: 0.99
  },

  validationRules: [{
    rule: {
      type: String,
      enum: [
        'min_data_points',
        'max_variance',
        'no_negative_baseline',
        'reasonable_uplift_range',
        'statistical_significance'
      ]
    },
    threshold: Number,
    action: {
      type: String,
      enum: ['warn', 'fail', 'flag_for_review'],
      default: 'warn'
    }
  }],

  upliftCalculation: {
    method: {
      type: String,
      enum: ['absolute', 'percentage', 'both'],
      default: 'both'
    },
    includePostPeriodDecay: {
      type: Boolean,
      default: false
    },
    cannibalizationFactor: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    }
  },

  roiCalculation: {
    revenueSource: {
      type: String,
      enum: ['net_sales', 'gross_sales', 'margin'],
      default: 'net_sales'
    },
    costComponents: [{
      type: String,
      enum: ['discount_cost', 'marketing_cost', 'display_cost', 'logistics_cost', 'cash_coop_cost']
    }],
    includeOpportunityCost: {
      type: Boolean,
      default: false
    }
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

  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

addTenantSupport(baselineConfigSchema);

baselineConfigSchema.index({ tenantId: 1, isDefault: 1 });
baselineConfigSchema.index({ tenantId: 1, methodology: 1 });

baselineConfigSchema.virtual('methodologyDescription').get(function () {
  const descriptions = {
    pre_period_average: `Average of ${this.prePeriod.weeks} weeks before promotion`,
    pre_period_median: `Median of ${this.prePeriod.weeks} weeks before promotion`,
    moving_average: `${this.prePeriod.weeks}-week moving average`,
    weighted_average: 'Weighted average with recent weeks weighted higher',
    linear_regression: `Linear trend projection from ${this.prePeriod.weeks} weeks`,
    seasonal_adjusted: `Seasonally adjusted baseline using ${this.seasonalityAdjustment.method} method`,
    year_over_year: 'Same period last year comparison',
    custom: 'Custom calculation method'
  };
  return descriptions[this.methodology] || this.methodology;
});

baselineConfigSchema.methods.validate = function (dataPoints) {
  const errors = [];
  const warnings = [];

  if (dataPoints < this.minimumDataPoints) {
    errors.push({
      rule: 'min_data_points',
      message: `Insufficient data points: ${dataPoints} < ${this.minimumDataPoints} required`
    });
  }

  this.validationRules.forEach((rule) => {
    switch (rule.rule) {
      case 'min_data_points':
        if (dataPoints < rule.threshold) {
          const item = { rule: rule.rule, message: `Data points ${dataPoints} below threshold ${rule.threshold}` };
          if (rule.action === 'fail') errors.push(item);
          else warnings.push(item);
        }
        break;
    }
  });

  return { valid: errors.length === 0, errors, warnings };
};

baselineConfigSchema.statics.getDefault = function (tenantId) {
  return this.findOne({ tenantId, isDefault: true, isActive: true });
};

baselineConfigSchema.statics.setDefault = async function (tenantId, configId) {
  await this.updateMany(
    { tenantId, isDefault: true },
    { isDefault: false }
  );
  return this.findByIdAndUpdate(configId, { isDefault: true }, { new: true });
};

module.exports = mongoose.model('BaselineConfig', baselineConfigSchema);
