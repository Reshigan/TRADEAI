const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-]+$/,
    maxlength: 100
  },
  domain: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },

  // Company Details
  companyInfo: {
    legalName: String,
    registrationNumber: String,
    taxId: String,
    industry: {
      type: String,
      enum: ['FMCG', 'Retail', 'Manufacturing', 'Distribution', 'Other'],
      default: 'FMCG'
    },
    companySize: {
      type: String,
      enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
      default: 'small'
    }
  },

  // Contact Information
  contactInfo: {
    primaryContact: {
      name: String,
      email: String,
      phone: String,
      position: String
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    }
  },

  // Subscription Management
  subscription: {
    plan: {
      type: String,
      enum: ['trial', 'basic', 'professional', 'enterprise', 'custom'],
      default: 'trial'
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'cancelled', 'expired'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    trialEndDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days trial
    },
    autoRenew: {
      type: Boolean,
      default: true
    }
  },

  // Resource Limits
  limits: {
    maxUsers: {
      type: Number,
      default: 5
    },
    maxStorageGB: {
      type: Number,
      default: 10
    },
    maxCustomers: {
      type: Number,
      default: 1000
    },
    maxProducts: {
      type: Number,
      default: 5000
    },
    maxPromotions: {
      type: Number,
      default: 100
    },
    maxAPICallsPerMonth: {
      type: Number,
      default: 10000
    }
  },

  // Current Usage
  usage: {
    users: {
      type: Number,
      default: 0
    },
    storageUsedGB: {
      type: Number,
      default: 0
    },
    customers: {
      type: Number,
      default: 0
    },
    products: {
      type: Number,
      default: 0
    },
    promotions: {
      type: Number,
      default: 0
    },
    apiCallsThisMonth: {
      type: Number,
      default: 0
    },
    lastUsageUpdate: {
      type: Date,
      default: Date.now
    }
  },

  // Feature Configuration
  features: {
    // Core Features
    multiCurrency: {
      type: Boolean,
      default: false
    },
    advancedAnalytics: {
      type: Boolean,
      default: false
    },
    aiPredictions: {
      type: Boolean,
      default: false
    },
    customReporting: {
      type: Boolean,
      default: false
    },
    apiAccess: {
      type: Boolean,
      default: false
    },

    // Integration Features
    sapIntegration: {
      type: Boolean,
      default: false
    },
    excelImportExport: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },

    // Advanced Features
    workflowApprovals: {
      type: Boolean,
      default: false
    },
    auditLogging: {
      type: Boolean,
      default: false
    },
    dataBackup: {
      type: Boolean,
      default: true
    },
    ssoIntegration: {
      type: Boolean,
      default: false
    }
  },

  // Configuration Settings
  settings: {
    // Localization
    timezone: {
      type: String,
      default: 'UTC'
    },
    dateFormat: {
      type: String,
      default: 'YYYY-MM-DD'
    },
    currency: {
      type: String,
      default: 'USD'
    },
    language: {
      type: String,
      default: 'en'
    },

    // Business Settings
    fiscalYearStart: {
      type: String,
      default: '01-01' // MM-DD format
    },
    defaultPaymentTerms: {
      type: Number,
      default: 30
    },

    // System Settings
    sessionTimeout: {
      type: Number,
      default: 30 // minutes
    },
    passwordPolicy: {
      minLength: {
        type: Number,
        default: 8
      },
      requireUppercase: {
        type: Boolean,
        default: true
      },
      requireNumbers: {
        type: Boolean,
        default: true
      },
      requireSpecialChars: {
        type: Boolean,
        default: true
      }
    },

    // Notification Settings
    notifications: {
      email: {
        enabled: {
          type: Boolean,
          default: true
        },
        frequency: {
          type: String,
          enum: ['immediate', 'daily', 'weekly'],
          default: 'immediate'
        }
      },
      inApp: {
        enabled: {
          type: Boolean,
          default: true
        }
      }
    }
  },

  // Billing Information
  billing: {
    email: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    },
    paymentMethod: {
      type: {
        type: String,
        enum: ['credit_card', 'bank_transfer', 'invoice'],
        default: 'credit_card'
      },
      details: mongoose.Schema.Types.Mixed // Encrypted payment details
    },
    invoiceSettings: {
      frequency: {
        type: String,
        enum: ['monthly', 'quarterly', 'annually'],
        default: 'monthly'
      },
      nextBillingDate: Date,
      lastBillingDate: Date
    }
  },

  // Status and Flags
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isSuspended: {
    type: Boolean,
    default: false
  },

  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['web_signup', 'admin_created', 'api', 'migration'],
      default: 'web_signup'
    },
    referrer: String,
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    notes: String
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: Date,
  lastActivityAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
TenantSchema.index({ slug: 1 });
TenantSchema.index({ domain: 1 });
TenantSchema.index({ 'subscription.status': 1 });
TenantSchema.index({ isActive: 1, isSuspended: 1 });
TenantSchema.index({ createdAt: -1 });

// Virtual fields
TenantSchema.virtual('isTrialExpired').get(function () {
  return this.subscription.plan === 'trial' &&
         this.subscription.trialEndDate < new Date();
});

TenantSchema.virtual('daysUntilTrialExpiry').get(function () {
  if (this.subscription.plan !== 'trial') return null;
  const now = new Date();
  const trialEnd = this.subscription.trialEndDate;
  const diffTime = trialEnd - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

TenantSchema.virtual('usagePercentages').get(function () {
  return {
    users: this.limits.maxUsers > 0 ? (this.usage.users / this.limits.maxUsers) * 100 : 0,
    storage: this.limits.maxStorageGB > 0 ? (this.usage.storageUsedGB / this.limits.maxStorageGB) * 100 : 0,
    customers: this.limits.maxCustomers > 0 ? (this.usage.customers / this.limits.maxCustomers) * 100 : 0,
    products: this.limits.maxProducts > 0 ? (this.usage.products / this.limits.maxProducts) * 100 : 0,
    promotions: this.limits.maxPromotions > 0 ? (this.usage.promotions / this.limits.maxPromotions) * 100 : 0,
    apiCalls: this.limits.maxAPICallsPerMonth > 0 ? (this.usage.apiCallsThisMonth / this.limits.maxAPICallsPerMonth) * 100 : 0
  };
});

// Instance methods
TenantSchema.methods.canAddUser = function () {
  return this.usage.users < this.limits.maxUsers;
};

TenantSchema.methods.canAddCustomer = function () {
  return this.usage.customers < this.limits.maxCustomers;
};

TenantSchema.methods.canAddProduct = function () {
  return this.usage.products < this.limits.maxProducts;
};

TenantSchema.methods.canAddPromotion = function () {
  return this.usage.promotions < this.limits.maxPromotions;
};

TenantSchema.methods.hasFeature = function (featureName) {
  return this.features[featureName] === true;
};

TenantSchema.methods.updateUsage = async function (type, increment = 1) {
  if (this.usage[type] !== undefined) {
    this.usage[type] += increment;
    this.usage.lastUsageUpdate = new Date();
    await this.save();
  }
};

TenantSchema.methods.resetMonthlyUsage = async function () {
  this.usage.apiCallsThisMonth = 0;
  this.usage.lastUsageUpdate = new Date();
  await this.save();
};

TenantSchema.methods.suspend = async function (reason) {
  this.isSuspended = true;
  this.subscription.status = 'suspended';
  this.metadata.notes = `Suspended: ${reason}`;
  await this.save();
};

TenantSchema.methods.reactivate = async function () {
  this.isSuspended = false;
  this.subscription.status = 'active';
  await this.save();
};

// Static methods
TenantSchema.statics.findBySlug = function (slug) {
  return this.findOne({ slug, isActive: true });
};

TenantSchema.statics.findByDomain = function (domain) {
  return this.findOne({ domain, isActive: true });
};

TenantSchema.statics.findExpiredTrials = function () {
  return this.find({
    'subscription.plan': 'trial',
    'subscription.trialEndDate': { $lt: new Date() },
    isActive: true
  });
};

TenantSchema.statics.getUsageStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$subscription.plan',
        count: { $sum: 1 },
        totalUsers: { $sum: '$usage.users' },
        totalStorage: { $sum: '$usage.storageUsedGB' },
        totalCustomers: { $sum: '$usage.customers' },
        totalProducts: { $sum: '$usage.products' },
        totalPromotions: { $sum: '$usage.promotions' }
      }
    }
  ]);

  return stats;
};

// Pre-save middleware
TenantSchema.pre('save', function (next) {
  if (this.isModified()) {
    this.updatedAt = new Date();
  }

  // Generate slug from name if not provided
  if (this.isNew && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  next();
});

// Post-save middleware for logging
TenantSchema.post('save', (doc) => {
  console.log(`Tenant ${doc.name} (${doc.slug}) saved`);
});

module.exports = mongoose.model('Tenant', TenantSchema);
