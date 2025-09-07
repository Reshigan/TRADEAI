const mongoose = require('mongoose');
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

const productSchema = new mongoose.Schema({
  // SAP Integration
  sapMaterialId: {
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
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  description: String,
  
  // 5-Level Product Hierarchy
  hierarchy: {
    level1: {
      id: String,
      name: String,
      code: String,
      description: String
    },
    level2: {
      id: String,
      name: String,
      code: String,
      description: String
    },
    level3: {
      id: String,
      name: String,
      code: String,
      description: String
    },
    level4: {
      id: String,
      name: String,
      code: String,
      description: String
    },
    level5: {
      id: String,
      name: String,
      code: String,
      description: String
    }
  },
  
  // Product Classification
  productType: {
    type: String,
    enum: ['own_brand', 'distributed', 'private_label', 'consignment'],
    required: true
  },
  category: {
    primary: String,
    secondary: [String]
  },
  brand: {
    id: String,
    name: String,
    owner: {
      type: String,
      enum: ['company', 'principal', 'customer']
    }
  },
  
  // Vendor/Principal Information
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  principalId: String,
  
  // Product Attributes
  attributes: {
    size: String,
    weight: Number,
    weightUnit: String,
    volume: Number,
    volumeUnit: String,
    color: String,
    flavor: String,
    variant: String,
    packaging: String,
    unitsPerCase: Number,
    casesPerPallet: Number
  },
  
  // Pricing Information
  pricing: {
    listPrice: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    costPrice: Number,
    marginPercentage: Number,
    priceHistory: [{
      price: Number,
      effectiveDate: Date,
      endDate: Date,
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },
  
  // Inventory and Supply
  inventory: {
    minStock: Number,
    maxStock: Number,
    reorderPoint: Number,
    reorderQuantity: Number,
    leadTimeDays: Number,
    safetyStock: Number
  },
  
  // Performance Metrics
  performance: {
    lastYearSales: {
      units: { type: Number, default: 0 },
      value: { type: Number, default: 0 }
    },
    currentYearTarget: {
      units: { type: Number, default: 0 },
      value: { type: Number, default: 0 }
    },
    currentYearActual: {
      units: { type: Number, default: 0 },
      value: { type: Number, default: 0 }
    },
    averageSellingPrice: { type: Number, default: 0 },
    marginContribution: { type: Number, default: 0 }
  },
  
  // Promotion Eligibility
  promotionSettings: {
    isPromotable: {
      type: Boolean,
      default: true
    },
    maxDiscountPercentage: {
      type: Number,
      default: 30
    },
    blackoutPeriods: [{
      startDate: Date,
      endDate: Date,
      reason: String
    }],
    allowedPromotionTypes: [{
      type: String,
      enum: ['price_discount', 'volume_discount', 'bogo', 'bundle', 'gift', 'loyalty']
    }]
  },
  
  // Budget Allocation Rules
  budgetAllocation: {
    marketingPercentage: {
      type: Number,
      default: 0
    },
    cashCoopPercentage: {
      type: Number,
      default: 0
    },
    maxTradeSpendPercentage: {
      type: Number,
      default: 15
    }
  },
  
  // Status and Lifecycle
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued', 'new', 'seasonal'],
    default: 'active'
  },
  lifecycle: {
    launchDate: Date,
    discontinuedDate: Date,
    seasonalPeriod: {
      start: String,
      end: String
    }
  },
  
  // Compliance and Regulations
  compliance: {
    certifications: [String],
    allergens: [String],
    nutritionalInfo: mongoose.Schema.Types.Mixed,
    warnings: [String],
    countryRestrictions: [String]
  },
  
  // Images and Media
  media: {
    primaryImage: String,
    images: [String],
    documents: [{
      name: String,
      url: String,
      type: String
    }]
  },
  
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
  
  // Analytics Configuration
  analyticsConfig: {
    trackingEnabled: {
      type: Boolean,
      default: true
    },
    kpis: [{
      name: String,
      target: Number,
      unit: String
    }],
    benchmarkCategory: String
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
productSchema.index({ sapMaterialId: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ barcode: 1 });
productSchema.index({ 'hierarchy.level1.id': 1 });
productSchema.index({ 'hierarchy.level2.id': 1 });
productSchema.index({ 'hierarchy.level3.id': 1 });
productSchema.index({ productType: 1 });
productSchema.index({ 'brand.name': 1 });
productSchema.index({ vendor: 1 });
productSchema.index({ status: 1 });

// Compound indexes
productSchema.index({ 
  'hierarchy.level1.id': 1, 
  'hierarchy.level2.id': 1, 
  'hierarchy.level3.id': 1 
});
productSchema.index({ productType: 1, status: 1 });

// Virtual for hierarchy path
productSchema.virtual('hierarchyPath').get(function() {
  const path = [];
  if (this.hierarchy.level1.name) path.push(this.hierarchy.level1.name);
  if (this.hierarchy.level2.name) path.push(this.hierarchy.level2.name);
  if (this.hierarchy.level3.name) path.push(this.hierarchy.level3.name);
  if (this.hierarchy.level4.name) path.push(this.hierarchy.level4.name);
  if (this.hierarchy.level5.name) path.push(this.hierarchy.level5.name);
  return path.join(' > ');
});

// Virtual for margin calculation
productSchema.virtual('margin').get(function() {
  if (this.pricing.listPrice && this.pricing.costPrice) {
    return this.pricing.listPrice - this.pricing.costPrice;
  }
  return 0;
});

// Methods
productSchema.methods.calculateTradeSpendLimit = function(salesValue) {
  const maxPercentage = this.budgetAllocation.maxTradeSpendPercentage || 15;
  return salesValue * (maxPercentage / 100);
};

productSchema.methods.isPromotableInPeriod = function(startDate, endDate) {
  if (!this.promotionSettings.isPromotable) return false;
  
  // Check blackout periods
  const hasBlackout = this.promotionSettings.blackoutPeriods.some(period => {
    return (startDate >= period.startDate && startDate <= period.endDate) ||
           (endDate >= period.startDate && endDate <= period.endDate);
  });
  
  return !hasBlackout;
};

productSchema.methods.updatePerformance = async function(period, units, value) {
  if (period === 'actual') {
    this.performance.currentYearActual.units += units;
    this.performance.currentYearActual.value += value;
    
    // Update average selling price
    if (this.performance.currentYearActual.units > 0) {
      this.performance.averageSellingPrice = 
        this.performance.currentYearActual.value / this.performance.currentYearActual.units;
    }
  }
  
  await this.save();
};

// Statics
productSchema.statics.findByHierarchy = function(level, value) {
  const query = {};
  query[`hierarchy.${level}.id`] = value;
  return this.find(query);
};

// Plugins
productSchema.plugin(mongooseAggregatePaginate);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;