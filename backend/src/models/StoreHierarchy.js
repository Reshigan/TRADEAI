/**
 * Store Hierarchy Model
 * Defines organizational structure: Region → District → Store
 * Enables rollup analytics and territory management
 */

const mongoose = require('mongoose');

// Region Schema (Top level - e.g., "KwaZulu-Natal", "Gauteng")
const regionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    default: 'ZA' // South Africa
  },
  regionalManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    population: Number,
    area: Number,
    targetRevenue: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// District Schema (Mid level - e.g., "Durban North", "Johannesburg CBD")
const districtSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  region: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region',
    required: true
  },
  districtManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    storeCount: {
      type: Number,
      default: 0
    },
    targetRevenue: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Store Schema (Bottom level - individual store location)
const storeSchema = new mongoose.Schema({
  storeCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
    required: true
  },
  region: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region',
    required: true
  },
  storeManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  // Store Details
  address: {
    street: String,
    city: String,
    province: String,
    postalCode: String,
    country: {
      type: String,
      default: 'ZA'
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  // Store Classification
  storeType: {
    type: String,
    enum: ['hypermarket', 'supermarket', 'convenience', 'wholesale', 'other'],
    default: 'supermarket'
  },
  storeFormat: {
    type: String,
    enum: ['corporate', 'franchise', 'independent'],
    default: 'corporate'
  },
  // Store Size & Capacity
  squareMeters: Number,
  aisleCount: Number,
  checkoutCount: Number,
  // Operating Details
  openingDate: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  // Performance Metrics
  metrics: {
    averageDailySales: {
      type: Number,
      default: 0
    },
    averageTransactionValue: {
      type: Number,
      default: 0
    },
    footTraffic: {
      type: Number,
      default: 0
    },
    employeeCount: {
      type: Number,
      default: 0
    }
  },
  // Promotion Settings
  promotionSettings: {
    allowsPromotions: {
      type: Boolean,
      default: true
    },
    maxDiscountPercent: {
      type: Number,
      default: 50
    },
    requiresApproval: {
      type: Boolean,
      default: true
    }
  },
  // Control Store Settings (for baseline calculations)
  isControlStore: {
    type: Boolean,
    default: false
  },
  controlStoreFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  }],
  // Tags for grouping
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
regionSchema.index({ code: 1, tenantId: 1 });
regionSchema.index({ tenantId: 1, isActive: 1 });

districtSchema.index({ code: 1, tenantId: 1 });
districtSchema.index({ region: 1, tenantId: 1 });
districtSchema.index({ tenantId: 1, isActive: 1 });

storeSchema.index({ storeCode: 1, tenantId: 1 });
storeSchema.index({ district: 1, tenantId: 1 });
storeSchema.index({ region: 1, tenantId: 1 });
storeSchema.index({ tenantId: 1, isActive: 1 });
storeSchema.index({ location: '2dsphere' }); // For geo queries

// Virtual for full hierarchy
storeSchema.virtual('fullHierarchy').get(function() {
  return `${this.region?.name || 'N/A'} > ${this.district?.name || 'N/A'} > ${this.name}`;
});

// Pre-save middleware
regionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

districtSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

storeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Methods
regionSchema.methods.getDistrictCount = async function() {
  const District = mongoose.model('District');
  return await District.countDocuments({ region: this._id, isActive: true });
};

regionSchema.methods.getStoreCount = async function() {
  const Store = mongoose.model('Store');
  return await Store.countDocuments({ region: this._id, isActive: true });
};

districtSchema.methods.getStoreCount = async function() {
  const Store = mongoose.model('Store');
  return await Store.countDocuments({ district: this._id, isActive: true });
};

storeSchema.methods.getHierarchy = async function() {
  await this.populate(['region', 'district']);
  return {
    region: this.region,
    district: this.district,
    store: this
  };
};

// Models
const Region = mongoose.model('Region', regionSchema);
const District = mongoose.model('District', districtSchema);
const Store = mongoose.model('Store', storeSchema);

module.exports = {
  Region,
  District,
  Store
};
