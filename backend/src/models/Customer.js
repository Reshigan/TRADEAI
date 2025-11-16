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
    required: false,
    index: true,
    sparse: true
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
  
  // Enhanced Hierarchical Structure with Materialized Path
  // Traditional 5-Level Hierarchy (legacy support)
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
  
  // Modern Tree Structure with Materialized Path
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null,
    index: true
  },
  level: {
    type: Number,
    default: 0,
    min: 0,
    max: 10, // Reasonable depth limit
    index: true
  },
  path: {
    type: String,
    default: '',
    index: true
  },
  hasChildren: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Tree metadata
  childrenCount: {
    type: Number,
    default: 0
  },
  descendantsCount: {
    type: Number,
    default: 0
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
    required: false,
    default: 'retailer'
  },
  channel: {
    type: String,
    enum: ['modern_trade', 'traditional_trade', 'horeca', 'ecommerce', 'b2b', 'export'],
    required: false,
    default: 'modern_trade'
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
  
  aiInsights: {
    ltv: {
      predicted: Number,
      confidence: Number,
      range: {
        min: Number,
        max: Number
      },
      modelVersion: String,
      calculatedAt: Date,
      featureAttribution: [{
        feature: String,
        impact: Number
      }]
    },
    
    churnRisk: {
      score: Number,
      risk: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      factors: [{
        factor: String,
        impact: Number,
        description: String
      }],
      calculatedAt: Date,
      modelVersion: String
    },
    
    // Customer Segmentation
    segment: {
      current: {
        type: String,
        enum: ['Champions', 'Loyal', 'Potential Loyalists', 'At Risk', 'Need Attention', 'Lost', 'New']
      },
      rfm: {
        recency: Number,
        frequency: Number,
        monetary: Number,
        score: Number
      },
      updatedAt: Date,
      previousSegment: String,
      segmentChangedAt: Date
    },
    
    nextBestAction: {
      action: String,
      actionType: {
        type: String,
        enum: ['promotion', 'discount', 'engagement', 'retention', 'cross_sell', 'upsell']
      },
      description: String,
      expectedRevenue: Number,
      confidence: Number,
      priority: {
        type: Number,
        min: 1,
        max: 10
      },
      validUntil: Date,
      createdAt: Date,
      executed: Boolean,
      executedAt: Date,
      executedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      outcome: {
        success: Boolean,
        actualRevenue: Number,
        notes: String
      }
    },
    
    priceSensitivity: {
      elasticity: Number,
      optimalDiscountRange: {
        min: Number,
        max: Number
      },
      calculatedAt: Date
    },
    
    promotionResponsiveness: {
      score: Number,
      preferredMechanics: [String],
      avgUplift: Number,
      calculatedAt: Date
    }
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

// Hierarchical indexes for tree operations
customerSchema.index({ tenantId: 1, parentId: 1 });
customerSchema.index({ tenantId: 1, path: 1 });
customerSchema.index({ tenantId: 1, level: 1 });
customerSchema.index({ tenantId: 1, hasChildren: 1 });

// Geographic index for location-based queries
customerSchema.index({ 'address.location': '2dsphere' });
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

// Hierarchical Methods
customerSchema.methods.getAncestors = async function() {
  const HierarchyManager = require('../utils/hierarchyManager');
  const hierarchyManager = new HierarchyManager(this.constructor);
  return await hierarchyManager.getAncestors(this.tenantId, this._id);
};

customerSchema.methods.getDescendants = async function(maxDepth = null) {
  const HierarchyManager = require('../utils/hierarchyManager');
  const hierarchyManager = new HierarchyManager(this.constructor);
  return await hierarchyManager.getDescendants(this.tenantId, this._id, maxDepth);
};

customerSchema.methods.getChildren = async function() {
  const HierarchyManager = require('../utils/hierarchyManager');
  const hierarchyManager = new HierarchyManager(this.constructor);
  return await hierarchyManager.getDirectChildren(this.tenantId, this._id);
};

customerSchema.methods.getSiblings = async function(includeSelf = false) {
  const HierarchyManager = require('../utils/hierarchyManager');
  const hierarchyManager = new HierarchyManager(this.constructor);
  return await hierarchyManager.getSiblings(this.tenantId, this._id, includeSelf);
};

customerSchema.methods.getPathToRoot = async function() {
  const HierarchyManager = require('../utils/hierarchyManager');
  const hierarchyManager = new HierarchyManager(this.constructor);
  return await hierarchyManager.getPathToRoot(this.tenantId, this._id);
};

customerSchema.methods.moveTo = async function(newParentId) {
  const HierarchyManager = require('../utils/hierarchyManager');
  const hierarchyManager = new HierarchyManager(this.constructor);
  return await hierarchyManager.moveNode(this.tenantId, this._id, newParentId);
};

// Static Methods for Hierarchy Management
customerSchema.statics.createHierarchyNode = async function(tenantId, customerData, parentId = null) {
  const HierarchyManager = require('../utils/hierarchyManager');
  const hierarchyManager = new HierarchyManager(this);
  return await hierarchyManager.createNode(tenantId, customerData, parentId);
};

customerSchema.statics.getTree = async function(tenantId, rootId = null, maxDepth = null) {
  const HierarchyManager = require('../utils/hierarchyManager');
  const hierarchyManager = new HierarchyManager(this);
  return await hierarchyManager.getTree(tenantId, rootId, maxDepth);
};

customerSchema.statics.searchInHierarchy = async function(tenantId, searchTerm, rootId = null) {
  const HierarchyManager = require('../utils/hierarchyManager');
  const hierarchyManager = new HierarchyManager(this);
  return await hierarchyManager.searchInHierarchy(tenantId, searchTerm, rootId);
};

customerSchema.statics.validateHierarchy = async function(tenantId) {
  const HierarchyManager = require('../utils/hierarchyManager');
  const hierarchyManager = new HierarchyManager(this);
  return await hierarchyManager.validateHierarchy(tenantId);
};

customerSchema.statics.repairHierarchy = async function(tenantId) {
  const HierarchyManager = require('../utils/hierarchyManager');
  const hierarchyManager = new HierarchyManager(this);
  return await hierarchyManager.repairHierarchy(tenantId);
};

customerSchema.statics.getHierarchyStats = async function(tenantId) {
  const HierarchyManager = require('../utils/hierarchyManager');
  const hierarchyManager = new HierarchyManager(this);
  return await hierarchyManager.getHierarchyStats(tenantId);
};

// Geographic Methods
customerSchema.methods.findNearby = async function(maxDistance = 10000) {
  if (!this.address || !this.address.location || !this.address.location.coordinates) {
    return [];
  }
  
  return await this.constructor.find({
    tenantId: this.tenantId,
    _id: { $ne: this._id },
    'address.location': {
      $near: {
        $geometry: this.address.location,
        $maxDistance: maxDistance
      }
    }
  });
};

customerSchema.statics.findByLocation = async function(tenantId, longitude, latitude, maxDistance = 10000) {
  return await this.find({
    tenantId,
    'address.location': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    }
  });
};

// Plugins
customerSchema.plugin(mongooseAggregatePaginate);

// Add tenant support to the schema
addTenantSupport(customerSchema);

const Customer = mongoose.model('Customer', customerSchema);

// Use mock in development mode if USE_MOCK_DB is enabled
if (process.env.USE_MOCK_DB === 'true') {
  const { MockCustomer } = require('../services/mockDatabase');
  module.exports = MockCustomer;
} else {
  module.exports = Customer;
}
