const mongoose = require('mongoose');
const { addTenantSupport } = require('./BaseTenantModel');

const vendorSchema = new mongoose.Schema({
  // Tenant Association - CRITICAL for multi-tenant isolation
  // Note: tenantId will be added by addTenantSupport()
  
  // Legacy company support (will be migrated to tenant)
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    index: true
  },
  sapVendorId: {
    type: String,
    required: true,
    unique: true,
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
    unique: true,
    uppercase: true
  },
  legalName: String,
  taxId: String,
  
  // Vendor Type
  vendorType: {
    type: String,
    enum: ['principal', 'manufacturer', 'distributor', 'importer', 'agent'],
    required: true
  },
  
  // Contact Information
  contacts: [{
    name: String,
    position: String,
    department: String,
    email: String,
    phone: String,
    mobile: String,
    isPrimary: Boolean
  }],
  
  // Address
  addresses: [{
    type: {
      type: String,
      enum: ['headquarters', 'warehouse', 'billing', 'other'],
      default: 'headquarters'
    },
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  }],
  
  // Financial Information
  bankDetails: {
    bankName: String,
    accountNumber: String,
    routingNumber: String,
    swift: String,
    iban: String
  },
  paymentTerms: {
    type: String,
    enum: ['NET30', 'NET45', 'NET60', 'NET90', 'PREPAID'],
    default: 'NET30'
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Contract Information
  contracts: [{
    contractNumber: String,
    startDate: Date,
    endDate: Date,
    type: {
      type: String,
      enum: ['distribution', 'agency', 'exclusive', 'non_exclusive']
    },
    terms: mongoose.Schema.Types.Mixed,
    documents: [{
      name: String,
      url: String,
      uploadedDate: Date
    }],
    status: {
      type: String,
      enum: ['active', 'expired', 'pending', 'terminated'],
      default: 'active'
    }
  }],
  
  // Budget Allocations by Vendor
  budgetAllocations: {
    marketing: {
      annual: { type: Number, default: 0 },
      allocated: { type: Number, default: 0 },
      spent: { type: Number, default: 0 },
      available: { type: Number, default: 0 }
    },
    cashCoop: {
      annual: { type: Number, default: 0 },
      allocated: { type: Number, default: 0 },
      spent: { type: Number, default: 0 },
      available: { type: Number, default: 0 }
    },
    rebates: {
      annual: { type: Number, default: 0 },
      allocated: { type: Number, default: 0 },
      spent: { type: Number, default: 0 },
      available: { type: Number, default: 0 }
    }
  },
  
  // Trading Terms with Vendor
  tradingTerms: {
    purchaseRebate: {
      percentage: Number,
      conditions: String,
      tiers: [{
        minPurchase: Number,
        maxPurchase: Number,
        percentage: Number
      }]
    },
    marketingContribution: {
      percentage: Number,
      conditions: String,
      calculationBasis: {
        type: String,
        enum: ['gross_purchases', 'net_purchases', 'sales_value']
      }
    },
    paymentDiscount: {
      percentage: Number,
      days: Number
    },
    additionalTerms: [{
      termType: String,
      description: String,
      value: mongoose.Schema.Types.Mixed
    }]
  },
  
  // Products
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  productCategories: [String],
  brands: [{
    name: String,
    isExclusive: Boolean
  }],
  
  // Performance Metrics
  performance: {
    lastYearPurchases: { type: Number, default: 0 },
    lastYearSales: { type: Number, default: 0 },
    currentYearPurchases: { type: Number, default: 0 },
    currentYearSales: { type: Number, default: 0 },
    marginContribution: { type: Number, default: 0 },
    marketShare: { type: Number, default: 0 }
  },
  
  // Compliance and Quality
  compliance: {
    certifications: [{
      name: String,
      issuedBy: String,
      validUntil: Date,
      documentUrl: String
    }],
    qualityRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    lastAuditDate: Date,
    auditScore: Number
  },
  
  // Account Management
  accountManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked', 'pending_approval'],
    default: 'active'
  },
  onboardingStatus: {
    type: String,
    enum: ['completed', 'in_progress', 'pending'],
    default: 'pending'
  },
  
  // Integration
  lastSyncDate: Date,
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'error'],
    default: 'pending'
  },
  
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

// Indexes
vendorSchema.index({ sapVendorId: 1 });
vendorSchema.index({ code: 1 });
vendorSchema.index({ vendorType: 1 });
vendorSchema.index({ status: 1 });
vendorSchema.index({ 'brands.name': 1 });

// Pre-save middleware to calculate available budgets
vendorSchema.pre('save', function(next) {
  // Update available budgets
  const budgetTypes = ['marketing', 'cashCoop', 'rebates'];
  
  budgetTypes.forEach(type => {
    if (this.budgetAllocations[type]) {
      this.budgetAllocations[type].available = 
        this.budgetAllocations[type].allocated - this.budgetAllocations[type].spent;
    }
  });
  
  next();
});

// Methods
vendorSchema.methods.allocateBudget = async function(type, amount) {
  if (this.budgetAllocations[type]) {
    this.budgetAllocations[type].allocated += amount;
    this.budgetAllocations[type].available = 
      this.budgetAllocations[type].allocated - this.budgetAllocations[type].spent;
    await this.save();
  }
};

vendorSchema.methods.spendBudget = async function(type, amount) {
  if (this.budgetAllocations[type] && this.budgetAllocations[type].available >= amount) {
    this.budgetAllocations[type].spent += amount;
    this.budgetAllocations[type].available -= amount;
    await this.save();
    return true;
  }
  return false;
};

vendorSchema.methods.calculateRebate = function(purchaseAmount) {
  if (!this.tradingTerms.purchaseRebate) return 0;
  
  // Check if tiered rebate applies
  if (this.tradingTerms.purchaseRebate.tiers && this.tradingTerms.purchaseRebate.tiers.length > 0) {
    const applicableTier = this.tradingTerms.purchaseRebate.tiers.find(
      tier => purchaseAmount >= tier.minPurchase && purchaseAmount <= tier.maxPurchase
    );
    
    if (applicableTier) {
      return purchaseAmount * (applicableTier.percentage / 100);
    }
  }
  
  // Use flat percentage if no tiers
  if (this.tradingTerms.purchaseRebate.percentage) {
    return purchaseAmount * (this.tradingTerms.purchaseRebate.percentage / 100);
  }
  
  return 0;
};

// Add tenant support for multi-tenant isolation
addTenantSupport(vendorSchema);

const Vendor = mongoose.model('Vendor', vendorSchema);

module.exports = Vendor;