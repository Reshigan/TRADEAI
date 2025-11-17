const mongoose = require('mongoose');

const masterDataSchema = new mongoose.Schema({
  // Master Data Type

  // Company Association - CRITICAL for multi-tenant isolation
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  dataType: {
    type: String,
    enum: [
      'cash_coop_reason',
      'promotion_type',
      'campaign_type',
      'customer_group',
      'product_category',
      'brand',
      'channel',
      'region',
      'cost_center',
      'gl_account',
      'approval_level',
      'kpi_metric',
      'external_factor',
      'holiday',
      'currency',
      'unit_of_measure'
    ],
    required: true
  },

  // Basic Information
  code: {
    type: String,
    required: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,

  // Category-specific fields
  category: String,
  parentCode: String,

  // Hierarchical Data
  hierarchy: {
    level: Number,
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MasterData'
    },
    children: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MasterData'
    }],
    path: String
  },

  // Attributes (flexible for different data types)
  attributes: {
    // For cash co-op reasons
    requiresApproval: Boolean,
    approvalThreshold: Number,
    requiredDocuments: [String],
    validityPeriod: Number,

    // For channels/regions
    priority: Number,
    targetPercentage: Number,

    // For GL accounts
    accountType: String,
    costElement: String,
    profitCenter: String,

    // For currencies
    symbol: String,
    exchangeRate: Number,
    decimalPlaces: Number,

    // For units of measure
    baseUnit: String,
    conversionFactor: Number,

    // Generic attributes
    sortOrder: Number,
    color: String,
    icon: String,
    isDefault: Boolean
  },

  // Validation Rules
  validationRules: [{
    field: String,
    rule: String,
    value: mongoose.Schema.Types.Mixed,
    errorMessage: String
  }],

  // Mappings (for integration)
  mappings: {
    sap: {
      code: String,
      description: String,
      table: String,
      field: String
    },
    external: [{
      system: String,
      code: String,
      description: String
    }]
  },

  // Localization
  translations: [{
    language: String,
    name: String,
    description: String
  }],

  // Status and Validity
  status: {
    type: String,
    enum: ['active', 'inactive', 'deprecated'],
    default: 'active'
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validTo: Date,

  // Usage Statistics
  usage: {
    count: {
      type: Number,
      default: 0
    },
    lastUsed: Date,
    usedBy: [{
      entityType: String,
      entityId: mongoose.Schema.Types.ObjectId,
      date: Date
    }]
  },

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: Date,

  // Change History
  changeHistory: [{
    action: String,
    changes: mongoose.Schema.Types.Mixed,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedDate: Date,
    reason: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
masterDataSchema.index({ dataType: 1, code: 1 }, { unique: true });
masterDataSchema.index({ dataType: 1, status: 1 });
masterDataSchema.index({ 'hierarchy.parent': 1 });
masterDataSchema.index({ 'mappings.sap.code': 1 });

// Virtual for full path
masterDataSchema.virtual('fullPath').get(function () {
  if (this.hierarchy && this.hierarchy.path) {
    return this.hierarchy.path.split('/').filter((p) => p).join(' > ');
  }
  return this.name;
});

// Pre-save middleware
masterDataSchema.pre('save', async function (next) {
  // Build hierarchy path
  if (this.hierarchy && this.hierarchy.parent) {
    const parent = await this.constructor.findById(this.hierarchy.parent);
    if (parent) {
      this.hierarchy.path = `${parent.hierarchy.path}/${this.code}`;
      this.hierarchy.level = parent.hierarchy.level + 1;
    }
  } else {
    this.hierarchy.path = `/${this.code}`;
    this.hierarchy.level = 1;
  }

  // Track changes
  if (!this.isNew && this.isModified()) {
    const changes = {};
    this.modifiedPaths().forEach((path) => {
      changes[path] = {
        old: this._original[path],
        new: this[path]
      };
    });

    this.changeHistory.push({
      action: 'updated',
      changes,
      changedBy: this.lastModifiedBy,
      changedDate: new Date()
    });
  }

  next();
});

// Post-save middleware to update parent's children
masterDataSchema.post('save', async (doc) => {
  if (doc.hierarchy && doc.hierarchy.parent) {
    await doc.constructor.findByIdAndUpdate(
      doc.hierarchy.parent,
      { $addToSet: { 'hierarchy.children': doc._id } }
    );
  }
});

// Methods
masterDataSchema.methods.activate = async function (userId) {
  this.status = 'active';
  this.lastModifiedBy = userId;
  this.changeHistory.push({
    action: 'activated',
    changedBy: userId,
    changedDate: new Date()
  });
  await this.save();
};

masterDataSchema.methods.deactivate = async function (userId, reason) {
  this.status = 'inactive';
  this.lastModifiedBy = userId;
  this.changeHistory.push({
    action: 'deactivated',
    changedBy: userId,
    changedDate: new Date(),
    reason
  });
  await this.save();
};

masterDataSchema.methods.incrementUsage = async function (entityType, entityId) {
  this.usage.count++;
  this.usage.lastUsed = new Date();
  this.usage.usedBy.push({
    entityType,
    entityId,
    date: new Date()
  });

  // Keep only last 100 usage records
  if (this.usage.usedBy.length > 100) {
    this.usage.usedBy = this.usage.usedBy.slice(-100);
  }

  await this.save();
};

// Statics
masterDataSchema.statics.findByType = function (dataType, activeOnly = true) {
  const query = { dataType };
  if (activeOnly) {
    query.status = 'active';
    query.$or = [
      { validTo: { $exists: false } },
      { validTo: { $gte: new Date() } }
    ];
  }
  return this.find(query).sort('attributes.sortOrder name');
};

masterDataSchema.statics.findByTypeAndCode = function (dataType, code) {
  return this.findOne({ dataType, code, status: 'active' });
};

masterDataSchema.statics.getHierarchy = async function (dataType, parentCode = null) {
  const query = { dataType, status: 'active' };

  if (parentCode) {
    const parent = await this.findOne({ dataType, code: parentCode });
    if (parent) {
      query['hierarchy.parent'] = parent._id;
    }
  } else {
    query['hierarchy.parent'] = { $exists: false };
  }

  return this.find(query).sort('attributes.sortOrder name');
};

masterDataSchema.statics.importFromSAP = async function (dataType, sapData, userId) {
  const results = {
    created: 0,
    updated: 0,
    errors: []
  };

  for (const item of sapData) {
    try {
      const existing = await this.findOne({
        dataType,
        'mappings.sap.code': item.sapCode
      });

      if (existing) {
        // Update existing
        existing.name = item.name || existing.name;
        existing.description = item.description || existing.description;
        existing.lastModifiedBy = userId;
        await existing.save();
        results.updated++;
      } else {
        // Create new
        await this.create({
          dataType,
          code: item.code,
          name: item.name,
          description: item.description,
          mappings: {
            sap: {
              code: item.sapCode,
              description: item.sapDescription
            }
          },
          createdBy: userId
        });
        results.created++;
      }
    } catch (error) {
      results.errors.push({
        sapCode: item.sapCode,
        error: error.message
      });
    }
  }

  return results;
};

// Default master data seeder
masterDataSchema.statics.seedDefaults = async function (userId) {
  const defaults = [
    // Cash Co-op Reasons
    {
      dataType: 'cash_coop_reason',
      items: [
        { code: 'SHELF', name: 'Shelf Space', attributes: { requiresApproval: true, approvalThreshold: 5000 } },
        { code: 'ENDCAP', name: 'End Cap Display', attributes: { requiresApproval: true, approvalThreshold: 10000 } },
        { code: 'FLYER', name: 'Flyer Participation', attributes: { requiresApproval: false } },
        { code: 'DEMO', name: 'In-Store Demo', attributes: { requiresApproval: false } },
        { code: 'OPENING', name: 'New Store Opening', attributes: { requiresApproval: true, approvalThreshold: 20000 } }
      ]
    },
    // Channels
    {
      dataType: 'channel',
      items: [
        { code: 'MT', name: 'Modern Trade', attributes: { priority: 1 } },
        { code: 'TT', name: 'Traditional Trade', attributes: { priority: 2 } },
        { code: 'HORECA', name: 'Hotels/Restaurants/Cafes', attributes: { priority: 3 } },
        { code: 'ECOM', name: 'E-Commerce', attributes: { priority: 4 } },
        { code: 'B2B', name: 'Business to Business', attributes: { priority: 5 } }
      ]
    },
    // KPI Metrics
    {
      dataType: 'kpi_metric',
      items: [
        { code: 'SALES_VALUE', name: 'Sales Value', attributes: { unit: 'currency' } },
        { code: 'SALES_VOLUME', name: 'Sales Volume', attributes: { unit: 'units' } },
        { code: 'MARKET_SHARE', name: 'Market Share', attributes: { unit: 'percentage' } },
        { code: 'ROI', name: 'Return on Investment', attributes: { unit: 'percentage' } },
        { code: 'LIFT', name: 'Promotional Lift', attributes: { unit: 'percentage' } }
      ]
    }
  ];

  for (const group of defaults) {
    for (const item of group.items) {
      await this.findOneAndUpdate(
        { dataType: group.dataType, code: item.code },
        {
          ...item,
          dataType: group.dataType,
          createdBy: userId,
          status: 'active'
        },
        { upsert: true, new: true }
      );
    }
  }
};

const MasterData = mongoose.model('MasterData', masterDataSchema);

module.exports = MasterData;
