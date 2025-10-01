const mongoose = require('mongoose');
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');
const { addTenantSupport } = require('./BaseTenantModel');

const customerSchema = new mongoose.Schema({
  // Tenant Association - CRITICAL for multi-tenant isolation
  // Note: tenantId will be added by addTenantSupport()
  
  // Legacy company support (will be migrated to tenant)
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    index: true
  },
  
  // SAP Integration
  sapCustomerId: {
    type: String,
    required: true,
    index: true
  },
  
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true
  },
  
  // 5-Level Hierarchy
  hierarchy: {
    level1: {
      id: String,
      name: String,
      code: String
    },
    level2: {
      id: String,
      name: String,
      code: String
    },
    level3: {
      id: String,
      name: String,
      code: String
    },
    level4: {
      id: String,
      name: String,
      code: String
    },
    level5: {
      id: String,
      name: String,
      code: String
    }
  },
  
  // Customer Groups (5 groups)
  customerGroups: [{
    groupId: {
      type: String,
      enum: ['GROUP_A', 'GROUP_B', 'GROUP_C', 'GROUP_D', 'GROUP_E']
    },
    groupName: String,
    priority: Number
  }],
  
  // Classification
  customerType: {
    type: String,
    enum: ['retailer', 'wholesaler', 'distributor', 'chain', 'independent', 'online'],
    required: true
  },
  channel: {
    type: String,
    enum: ['modern_trade', 'traditional_trade', 'horeca', 'ecommerce', 'b2b', 'export'],
    required: true
  },
  tier: {
    type: String,
    enum: ['platinum', 'gold', 'silver', 'bronze', 'standard'],
    default: 'standard'
  },
  
  // Contact Information
  contacts: [{
    name: String,
    position: String,
    email: String,
    phone: String,
    isPrimary: Boolean
  }],
  
  // Address Information
  addresses: [{
    type: {
      type: String,
      enum: ['billing', 'shipping', 'both'],
      default: 'both'
    },
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  }],
  
  // Financial Information
  creditLimit: {
    type: Number,
    default: 0
  },
  paymentTerms: {
    type: String,
    enum: ['NET30', 'NET45', 'NET60', 'NET90', 'COD', 'PREPAID'],
    default: 'NET30'
  },
  currency: {
    type: String,
    default: 'USD'
  },
  taxId: String,
  
  // Trading Terms
  tradingTerms: {
    retroActive: {
      percentage: { type: Number, default: 0 },
      conditions: String,
      validFrom: Date,
      validTo: Date
    },
    promptPayment: {
      percentage: { type: Number, default: 0 },
      days: { type: Number, default: 0 },
      conditions: String
    },
    volumeRebate: [{
      tierName: String,
      minVolume: Number,
      maxVolume: Number,
      percentage: Number,
      productScope: {
        type: String,
        enum: ['all', 'category', 'brand', 'sku'],
        default: 'all'
      },
      products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }]
    }],
    listingFees: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      fee: Number,
      period: String,
      startDate: Date,
      endDate: Date
    }],
    additionalTerms: [{
      termType: String,
      description: String,
      value: mongoose.Schema.Types.Mixed,
      validFrom: Date,
      validTo: Date
    }]
  },
  
  // Budget Allocations
  budgetAllocations: {
    marketing: {
      annual: { type: Number, default: 0 },
      ytd: { type: Number, default: 0 },
      available: { type: Number, default: 0 }
    },
    cashCoop: {
      annual: { type: Number, default: 0 },
      ytd: { type: Number, default: 0 },
      available: { type: Number, default: 0 }
    },
    tradingTerms: {
      annual: { type: Number, default: 0 },
      ytd: { type: Number, default: 0 },
      available: { type: Number, default: 0 }
    }
  },
  
  // Performance Metrics
  performance: {
    lastYearSales: { type: Number, default: 0 },
    currentYearTarget: { type: Number, default: 0 },
    currentYearActual: { type: Number, default: 0 },
    growthRate: { type: Number, default: 0 },
    marketShare: { type: Number, default: 0 }
  },
  
  // Account Management
  accountManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  accountTeam: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: String
  }],
  
  // Status and Compliance
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked', 'pending'],
    default: 'active'
  },
  complianceStatus: {
    type: String,
    enum: ['compliant', 'warning', 'non_compliant'],
    default: 'compliant'
  },
  blockedReasons: [{
    reason: String,
    date: Date,
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Integration
  lastSyncDate: Date,
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'error'],
    default: 'pending'
  },
  syncErrors: [{
    error: String,
    date: Date
  }],
  
  // Custom Fields
  customFields: mongoose.Schema.Types.Mixed,
  
  // Metadata
  tags: [String],
  notes: [{
    note: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: Date
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes - Company-specific indexes for multi-tenant isolation
customerSchema.index({ company: 1, sapCustomerId: 1 }, { unique: true });
customerSchema.index({ company: 1, code: 1 }, { unique: true });
customerSchema.index({ company: 1, 'hierarchy.level1.id': 1 });
customerSchema.index({ company: 1, 'hierarchy.level2.id': 1 });
customerSchema.index({ company: 1, 'hierarchy.level3.id': 1 });
customerSchema.index({ company: 1, customerType: 1 });
customerSchema.index({ company: 1, channel: 1 });
customerSchema.index({ company: 1, status: 1 });
customerSchema.index({ company: 1, accountManager: 1 });
customerSchema.index({ sapCustomerId: 1 });
customerSchema.index({ code: 1 });
customerSchema.index({ 'hierarchy.level1.id': 1 });
customerSchema.index({ 'hierarchy.level2.id': 1 });
customerSchema.index({ 'hierarchy.level3.id': 1 });
customerSchema.index({ customerType: 1 });
customerSchema.index({ channel: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ accountManager: 1 });

// Compound indexes for hierarchy queries
customerSchema.index({ 
  company: 1,
  'hierarchy.level1.id': 1, 
  'hierarchy.level2.id': 1, 
  'hierarchy.level3.id': 1 
});
customerSchema.index({ 
  'hierarchy.level1.id': 1, 
  'hierarchy.level2.id': 1, 
  'hierarchy.level3.id': 1 
});

// Virtual for hierarchy path
customerSchema.virtual('hierarchyPath').get(function() {
  const path = [];
  if (this.hierarchy.level1.name) path.push(this.hierarchy.level1.name);
  if (this.hierarchy.level2.name) path.push(this.hierarchy.level2.name);
  if (this.hierarchy.level3.name) path.push(this.hierarchy.level3.name);
  if (this.hierarchy.level4.name) path.push(this.hierarchy.level4.name);
  if (this.hierarchy.level5.name) path.push(this.hierarchy.level5.name);
  return path.join(' > ');
});

// Methods
customerSchema.methods.updateBudgetSpend = async function(type, amount) {
  if (this.budgetAllocations[type]) {
    this.budgetAllocations[type].ytd += amount;
    this.budgetAllocations[type].available = 
      this.budgetAllocations[type].annual - this.budgetAllocations[type].ytd;
    await this.save();
  }
};

customerSchema.methods.calculateTradingTermsValue = function(salesAmount, termType) {
  let value = 0;
  
  switch(termType) {
    case 'retroActive':
      if (this.tradingTerms.retroActive.percentage) {
        value = salesAmount * (this.tradingTerms.retroActive.percentage / 100);
      }
      break;
    case 'volumeRebate':
      const applicableRebate = this.tradingTerms.volumeRebate.find(
        rebate => salesAmount >= rebate.minVolume && salesAmount <= rebate.maxVolume
      );
      if (applicableRebate) {
        value = salesAmount * (applicableRebate.percentage / 100);
      }
      break;
  }
  
  return value;
};

// Plugins
customerSchema.plugin(mongooseAggregatePaginate);

// Add tenant support to the schema
addTenantSupport(customerSchema);

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;