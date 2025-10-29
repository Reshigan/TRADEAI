const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  activityId: {
    type: String,
    required: true,
    unique: true
  },
  activityName: {
    type: String,
    required: true
  },
  activityType: {
    type: String,
    enum: ['In-Store Promotion', 'Display', 'Sampling', 'Demo', 'Trade Show', 'Training', 'Joint Business Planning', 'Price Promotion', 'Volume Incentive', 'Other'],
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Planned', 'In Progress', 'Completed', 'Cancelled', 'On Hold'],
    default: 'Planned'
  },
  budget: {
    allocated: {
      type: Number,
      required: true
    },
    spent: {
      type: Number,
      default: 0
    },
    remaining: Number
  },
  location: {
    city: String,
    state: String,
    stores: [String]
  },
  objectives: String,
  expectedOutcome: {
    volumeIncrease: Number,
    revenueTarget: Number,
    roi: Number
  },
  actualOutcome: {
    volumeAchieved: Number,
    revenueAchieved: Number,
    roi: Number
  },
  performance: {
    type: String,
    enum: ['Not Started', 'On Track', 'At Risk', 'Delayed', 'Completed'],
    default: 'Not Started'
  },
  owner: String,
  team: [String],
  description: String,
  notes: String,
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  milestones: [{
    name: String,
    dueDate: Date,
    completed: Boolean,
    completedDate: Date
  }]
}, {
  timestamps: true
});

activitySchema.index({ customer: 1, status: 1 });
activitySchema.index({ startDate: 1, endDate: 1 });
activitySchema.index({ activityType: 1 });
activitySchema.index({ performance: 1 });

module.exports = mongoose.model('Activity', activitySchema);
