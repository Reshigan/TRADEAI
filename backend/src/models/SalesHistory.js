const mongoose = require('mongoose');

const salesHistorySchema = new mongoose.Schema({
  // Transaction Identification

  // Company Association - CRITICAL for multi-tenant isolation
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  sapDocumentNumber: String,

  // Date and Time
  date: {
    type: Date,
    required: true,
    index: true
  },
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true
  },
  week: {
    type: Number,
    required: true
  },
  dayOfWeek: {
    type: Number,
    required: true
  },
  quarter: {
    type: Number,
    required: true
  },

  // Customer Information
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerHierarchy: {
    level1: { id: String, name: String },
    level2: { id: String, name: String },
    level3: { id: String, name: String },
    level4: { id: String, name: String },
    level5: { id: String, name: String }
  },
  customerGroup: String,
  channel: String,
  region: String,

  // Product Information
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productHierarchy: {
    level1: { id: String, name: String },
    level2: { id: String, name: String },
    level3: { id: String, name: String },
    level4: { id: String, name: String },
    level5: { id: String, name: String }
  },
  brand: String,
  category: String,

  // Sales Data
  quantity: {
    type: Number,
    required: true
  },
  unitOfMeasure: String,

  revenue: {
    gross: {
      type: Number,
      required: true
    },
    net: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },

  // Pricing
  pricing: {
    listPrice: Number,
    invoicePrice: Number,
    netPrice: Number,
    discount: Number,
    discountPercentage: Number
  },

  // Costs and Margins
  costs: {
    productCost: Number,
    logisticsCost: Number,
    totalCost: Number
  },

  margins: {
    grossMargin: Number,
    grossMarginPercentage: Number,
    netMargin: Number,
    netMarginPercentage: Number
  },

  // Promotions and Campaigns
  promotions: [{
    promotion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Promotion'
    },
    discountApplied: Number,
    liftFactor: Number
  }],

  campaigns: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  }],

  // Trade Spend Applied
  tradeSpend: {
    marketing: Number,
    cashCoop: Number,
    tradingTerms: Number,
    rebates: Number,
    total: Number
  },

  // External Factors (for ML)
  externalFactors: {
    weather: {
      temperature: Number,
      precipitation: Number,
      condition: String
    },
    holiday: String,
    event: String,
    competitorActivity: String,
    economicIndicator: Number,
    seasonalityIndex: Number
  },

  // ML Features (pre-calculated)
  mlFeatures: {
    // Temporal features
    daysSinceLastPurchase: Number,
    purchaseFrequency: Number,
    averageOrderValue: Number,

    // Customer features
    customerLifetimeValue: Number,
    customerSegment: String,
    customerLoyaltyScore: Number,

    // Product features
    productLifecycleDays: Number,
    productPopularityScore: Number,
    productSeasonality: Number,

    // Price elasticity
    priceElasticity: Number,
    optimalPrice: Number,

    // Promotional effectiveness
    promotionResponseRate: Number,
    promotionROI: Number,

    // Trend indicators
    salesTrend: Number,
    growthRate: Number,
    volatility: Number
  },

  // Anomaly Detection
  anomaly: {
    isAnomaly: {
      type: Boolean,
      default: false
    },
    anomalyScore: Number,
    anomalyType: String,
    anomalyReason: String
  },

  // Data Quality
  dataQuality: {
    isComplete: {
      type: Boolean,
      default: true
    },
    missingFields: [String],
    validationErrors: [String],
    confidence: {
      type: Number,
      default: 100
    }
  },

  // Import Information
  importBatch: String,
  importDate: Date,
  source: {
    type: String,
    enum: ['sap', 'manual', 'integration', 'correction'],
    default: 'sap'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
salesHistorySchema.index({ date: 1 });
salesHistorySchema.index({ customer: 1, date: 1 });
salesHistorySchema.index({ product: 1, date: 1 });
salesHistorySchema.index({ year: 1, month: 1 });
salesHistorySchema.index({ year: 1, week: 1 });

// Compound indexes for common queries
salesHistorySchema.index({ customer: 1, product: 1, date: 1 });
salesHistorySchema.index({ 'customerHierarchy.level1.id': 1, date: 1 });
salesHistorySchema.index({ 'productHierarchy.level1.id': 1, date: 1 });
salesHistorySchema.index({ brand: 1, date: 1 });
salesHistorySchema.index({ channel: 1, date: 1 });

// Index for ML queries
salesHistorySchema.index({ 'anomaly.isAnomaly': 1 });
salesHistorySchema.index({ importBatch: 1 });

// Pre-save middleware
salesHistorySchema.pre('save', function (next) {
  // Calculate margins
  if (this.revenue.gross && this.costs.totalCost) {
    this.margins.grossMargin = this.revenue.gross - this.costs.totalCost;
    this.margins.grossMarginPercentage = (this.margins.grossMargin / this.revenue.gross) * 100;

    if (this.revenue.net) {
      this.margins.netMargin = this.revenue.net - this.costs.totalCost - (this.tradeSpend.total || 0);
      this.margins.netMarginPercentage = (this.margins.netMargin / this.revenue.net) * 100;
    }
  }

  // Calculate total trade spend
  this.tradeSpend.total =
    (this.tradeSpend.marketing || 0) +
    (this.tradeSpend.cashCoop || 0) +
    (this.tradeSpend.tradingTerms || 0) +
    (this.tradeSpend.rebates || 0);

  // Extract date components
  this.year = this.date.getFullYear();
  this.month = this.date.getMonth() + 1;
  this.dayOfWeek = this.date.getDay();
  this.quarter = Math.ceil(this.month / 3);

  // Calculate week number
  const startOfYear = new Date(this.year, 0, 1);
  const days = Math.floor((this.date - startOfYear) / (24 * 60 * 60 * 1000));
  this.week = Math.ceil((days + startOfYear.getDay() + 1) / 7);

  next();
});

// Methods
salesHistorySchema.methods.calculateMLFeatures = async function () {
  // This would be called to calculate/update ML features
  // Implementation would involve complex calculations based on historical data

  // Example: Calculate days since last purchase
  const lastPurchase = await this.constructor.findOne({
    customer: this.customer,
    product: this.product,
    date: { $lt: this.date }
  }).sort({ date: -1 });

  if (lastPurchase) {
    this.mlFeatures.daysSinceLastPurchase =
      Math.floor((this.date - lastPurchase.date) / (1000 * 60 * 60 * 24));
  }

  // More feature calculations would go here...

  await this.save();
};

// Statics for aggregation
salesHistorySchema.statics.aggregateSales = async function (filters, groupBy, metrics) {
  const match = {};

  // Build match conditions
  if (filters.startDate && filters.endDate) {
    match.date = { $gte: new Date(filters.startDate), $lte: new Date(filters.endDate) };
  }
  if (filters.customer) match.customer = filters.customer;
  if (filters.product) match.product = filters.product;
  if (filters.brand) match.brand = filters.brand;
  if (filters.channel) match.channel = filters.channel;

  // Build group stage
  const groupStage = { _id: {} };

  if (groupBy.includes('date')) groupStage._id.date = '$date';
  if (groupBy.includes('month')) {
    groupStage._id.year = '$year';
    groupStage._id.month = '$month';
  }
  if (groupBy.includes('customer')) groupStage._id.customer = '$customer';
  if (groupBy.includes('product')) groupStage._id.product = '$product';
  if (groupBy.includes('customerLevel1')) groupStage._id.customerLevel1 = '$customerHierarchy.level1.id';
  if (groupBy.includes('productLevel1')) groupStage._id.productLevel1 = '$productHierarchy.level1.id';

  // Add metrics
  if (metrics.includes('revenue')) {
    groupStage.totalRevenue = { $sum: '$revenue.gross' };
    groupStage.netRevenue = { $sum: '$revenue.net' };
  }
  if (metrics.includes('quantity')) {
    groupStage.totalQuantity = { $sum: '$quantity' };
  }
  if (metrics.includes('margin')) {
    groupStage.totalMargin = { $sum: '$margins.grossMargin' };
    groupStage.avgMarginPercentage = { $avg: '$margins.grossMarginPercentage' };
  }
  if (metrics.includes('tradeSpend')) {
    groupStage.totalTradeSpend = { $sum: '$tradeSpend.total' };
  }

  groupStage.transactionCount = { $sum: 1 };

  const pipeline = [
    { $match: match },
    { $group: groupStage },
    { $sort: { '_id.date': -1 } }
  ];

  return this.aggregate(pipeline);
};

salesHistorySchema.statics.calculateBaseline = async function (customer, product, startDate, endDate) {
  // Calculate baseline sales excluding promotional periods
  const sales = await this.find({
    customer,
    product,
    date: { $gte: startDate, $lte: endDate },
    'promotions.0': { $exists: false } // No promotions
  });

  if (sales.length === 0) return null;

  const totalQuantity = sales.reduce((sum, sale) => sum + sale.quantity, 0);
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.revenue.gross, 0);
  const avgPrice = totalRevenue / totalQuantity;

  return {
    avgDailyQuantity: totalQuantity / sales.length,
    avgDailyRevenue: totalRevenue / sales.length,
    avgPrice,
    dataPoints: sales.length
  };
};

salesHistorySchema.statics.detectAnomalies = async function (threshold = 2) {
  // Simple anomaly detection based on standard deviation
  // In production, this would use more sophisticated ML algorithms

  const recentSales = await this.find({
    date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
  });

  // Group by customer-product
  const groups = {};
  recentSales.forEach((sale) => {
    const key = `${sale.customer}_${sale.product}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(sale);
  });

  // Detect anomalies in each group
  for (const [key, sales] of Object.entries(groups)) {
    if (sales.length < 10) continue; // Need enough data

    const quantities = sales.map((s) => s.quantity);
    const mean = quantities.reduce((a, b) => a + b) / quantities.length;
    const stdDev = Math.sqrt(
      quantities.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / quantities.length
    );

    sales.forEach((sale) => {
      const zScore = Math.abs((sale.quantity - mean) / stdDev);
      if (zScore > threshold) {
        sale.anomaly.isAnomaly = true;
        sale.anomaly.anomalyScore = zScore;
        sale.anomaly.anomalyType = sale.quantity > mean ? 'spike' : 'drop';
        sale.anomaly.anomalyReason = `Quantity ${zScore.toFixed(1)} standard deviations from mean`;
        sale.save();
      }
    });
  }
};

const SalesHistory = mongoose.model('SalesHistory', salesHistorySchema);

module.exports = SalesHistory;
