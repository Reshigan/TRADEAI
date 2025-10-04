const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    unique: true
  },
  licenseType: {
    type: String,
    enum: ['trial', 'starter', 'professional', 'enterprise', 'unlimited'],
    default: 'trial'
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'expired', 'cancelled'],
    default: 'active'
  },
  features: {
    maxUsers: {
      type: Number,
      default: 5
    },
    maxBudgets: {
      type: Number,
      default: 10
    },
    maxPromotions: {
      type: Number,
      default: 20
    },
    maxTradeSpend: {
      type: Number,
      default: 50
    },
    enterpriseFeatures: {
      type: Boolean,
      default: false
    },
    advancedAnalytics: {
      type: Boolean,
      default: false
    },
    apiAccess: {
      type: Boolean,
      default: false
    },
    customReports: {
      type: Boolean,
      default: false
    },
    multiYearPlanning: {
      type: Boolean,
      default: false
    },
    aiOptimization: {
      type: Boolean,
      default: false
    },
    whiteLabel: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    }
  },
  billing: {
    plan: {
      type: String,
      default: 'monthly'
    },
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'annual'],
      default: 'monthly'
    },
    nextBillingDate: Date,
    paymentMethod: String
  },
  dates: {
    startDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date,
      required: true
    },
    trialEndsAt: Date,
    lastRenewalDate: Date,
    cancellationDate: Date
  },
  usage: {
    currentUsers: {
      type: Number,
      default: 0
    },
    currentBudgets: {
      type: Number,
      default: 0
    },
    currentPromotions: {
      type: Number,
      default: 0
    },
    currentTradeSpend: {
      type: Number,
      default: 0
    },
    apiCalls: {
      type: Number,
      default: 0
    },
    storageUsed: {
      type: Number,
      default: 0
    }
  },
  restrictions: {
    ipWhitelist: [String],
    countryRestrictions: [String],
    timeRestrictions: {
      enabled: {
        type: Boolean,
        default: false
      },
      allowedHours: {
        start: String,
        end: String
      }
    }
  },
  notes: String,
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

// Indexes
licenseSchema.index({ tenantId: 1 });
licenseSchema.index({ status: 1 });
licenseSchema.index({ 'dates.expiryDate': 1 });

// Methods
licenseSchema.methods.isExpired = function() {
  return this.dates.expiryDate < new Date();
};

licenseSchema.methods.isActive = function() {
  return this.status === 'active' && !this.isExpired();
};

licenseSchema.methods.canAccessFeature = function(featureName) {
  return this.features[featureName] === true;
};

licenseSchema.methods.hasCapacity = function(resource) {
  const usageMap = {
    users: { current: this.usage.currentUsers, max: this.features.maxUsers },
    budgets: { current: this.usage.currentBudgets, max: this.features.maxBudgets },
    promotions: { current: this.usage.currentPromotions, max: this.features.maxPromotions },
    tradeSpend: { current: this.usage.currentTradeSpend, max: this.features.maxTradeSpend }
  };

  const usage = usageMap[resource];
  if (!usage) return true;
  
  return usage.current < usage.max;
};

// Static methods
licenseSchema.statics.getLicensePlans = function() {
  return {
    trial: {
      name: 'Trial',
      price: 0,
      duration: 30,
      features: {
        maxUsers: 5,
        maxBudgets: 10,
        maxPromotions: 20,
        maxTradeSpend: 50,
        enterpriseFeatures: false,
        advancedAnalytics: false
      }
    },
    starter: {
      name: 'Starter',
      price: 99,
      features: {
        maxUsers: 10,
        maxBudgets: 50,
        maxPromotions: 100,
        maxTradeSpend: 500,
        enterpriseFeatures: false,
        advancedAnalytics: true
      }
    },
    professional: {
      name: 'Professional',
      price: 299,
      features: {
        maxUsers: 50,
        maxBudgets: 200,
        maxPromotions: 500,
        maxTradeSpend: 2000,
        enterpriseFeatures: true,
        advancedAnalytics: true,
        apiAccess: true,
        customReports: true
      }
    },
    enterprise: {
      name: 'Enterprise',
      price: 999,
      features: {
        maxUsers: 200,
        maxBudgets: 1000,
        maxPromotions: 5000,
        maxTradeSpend: 10000,
        enterpriseFeatures: true,
        advancedAnalytics: true,
        apiAccess: true,
        customReports: true,
        multiYearPlanning: true,
        aiOptimization: true,
        prioritySupport: true
      }
    },
    unlimited: {
      name: 'Unlimited',
      price: 'Custom',
      features: {
        maxUsers: 999999,
        maxBudgets: 999999,
        maxPromotions: 999999,
        maxTradeSpend: 999999,
        enterpriseFeatures: true,
        advancedAnalytics: true,
        apiAccess: true,
        customReports: true,
        multiYearPlanning: true,
        aiOptimization: true,
        whiteLabel: true,
        prioritySupport: true
      }
    }
  };
};

module.exports = mongoose.model('License', licenseSchema);
