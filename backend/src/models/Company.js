const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  domain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  // Company Details
  industry: {
    type: String,
    enum: ['fmcg', 'retail', 'manufacturing', 'distribution', 'other'],
    default: 'fmcg'
  },
  companyType: {
    type: String,
    enum: ['manufacturer', 'distributor', 'retailer'],
    required: true,
    default: 'manufacturer',
    index: true
  },
  vendorCompanies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }],
  country: {
    type: String,
    required: true,
    default: 'ZA'
  },
  currency: {
    type: String,
    required: true,
    default: 'ZAR'
  },
  timezone: {
    type: String,
    required: true,
    default: 'Africa/Johannesburg'
  },

  // Contact Information
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },

  // Subscription & Billing
  subscription: {
    plan: {
      type: String,
      enum: ['starter', 'professional', 'enterprise'],
      default: 'professional'
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'cancelled', 'trial'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    maxUsers: {
      type: Number,
      default: 50
    },
    maxCustomers: {
      type: Number,
      default: 1000
    },
    maxProducts: {
      type: Number,
      default: 5000
    }
  },

  // Configuration
  settings: {
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY'
    },
    numberFormat: {
      type: String,
      default: 'en-AU'
    },
    fiscalYearStart: {
      type: String,
      default: '01-01'
    },
    workingDays: {
      type: [String],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    },
    businessHours: {
      start: {
        type: String,
        default: '09:00'
      },
      end: {
        type: String,
        default: '17:00'
      }
    },
    // Company-type-specific UI customization
    uiCustomization: {
      navigationLabels: mongoose.Schema.Types.Mixed,
      processSteps: [String],
      featureToggles: mongoose.Schema.Types.Mixed
    }
  },

  // Features & Modules
  enabledModules: [{
    module: {
      type: String,
      enum: ['customers', 'products', 'campaigns', 'budgets', 'analytics', 'ai_insights', 'reporting', 'integrations']
    },
    enabled: {
      type: Boolean,
      default: true
    },
    permissions: [String]
  }],

  // Integration Settings
  integrations: {
    sap: {
      enabled: {
        type: Boolean,
        default: false
      },
      config: mongoose.Schema.Types.Mixed
    },
    erp: {
      enabled: {
        type: Boolean,
        default: false
      },
      config: mongoose.Schema.Types.Mixed
    },
    crm: {
      enabled: {
        type: Boolean,
        default: false
      },
      config: mongoose.Schema.Types.Mixed
    }
  },

  // Security Settings
  security: {
    passwordPolicy: {
      minLength: {
        type: Number,
        default: 8
      },
      requireUppercase: {
        type: Boolean,
        default: true
      },
      requireLowercase: {
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
    sessionTimeout: {
      type: Number,
      default: 3600000 // 1 hour in milliseconds
    },
    maxLoginAttempts: {
      type: Number,
      default: 5
    },
    lockoutDuration: {
      type: Number,
      default: 1800000 // 30 minutes in milliseconds
    },
    twoFactorRequired: {
      type: Boolean,
      default: false
    }
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Custom Fields
  customFields: mongoose.Schema.Types.Mixed,

  // Notes
  notes: [{
    note: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
companySchema.index({ code: 1 });
companySchema.index({ domain: 1 });
companySchema.index({ name: 1 });
companySchema.index({ 'subscription.status': 1 });
companySchema.index({ isActive: 1 });

// Virtual for active users count
companySchema.virtual('activeUsersCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'company',
  count: true,
  match: { isActive: true }
});

// Virtual for customers count
companySchema.virtual('customersCount', {
  ref: 'Customer',
  localField: '_id',
  foreignField: 'company',
  count: true
});

// Virtual for products count
companySchema.virtual('productsCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'company',
  count: true
});

// Methods
companySchema.methods.isWithinLimits = function (type) {
  const limits = this.subscription;
  switch (type) {
    case 'users':
      return this.activeUsersCount <= limits.maxUsers;
    case 'customers':
      return this.customersCount <= limits.maxCustomers;
    case 'products':
      return this.productsCount <= limits.maxProducts;
    default:
      return true;
  }
};

companySchema.methods.hasModule = function (moduleName) {
  const module = this.enabledModules.find((m) => m.module === moduleName);
  return module && module.enabled;
};

companySchema.methods.getModulePermissions = function (moduleName) {
  const module = this.enabledModules.find((m) => m.module === moduleName);
  return module ? module.permissions : [];
};

// Static methods
companySchema.statics.findByDomain = function (domain) {
  return this.findOne({ domain: domain.toLowerCase(), isActive: true });
};

companySchema.statics.findByCode = function (code) {
  return this.findOne({ code: code.toUpperCase(), isActive: true });
};

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
