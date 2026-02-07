const mongoose = require('mongoose');
const { addTenantSupport } = require('./BaseTenantModel');

const policySchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  category: {
    type: String,
    enum: ['hr', 'compliance', 'security', 'operations', 'sales', 'finance', 'it', 'general'],
    required: true
  },
  content: {
    type: String,
    required: true // HTML/Markdown content
  },
  version: {
    type: String,
    required: true,
    default: '1.0'
  },
  previousVersions: [{
    version: String,
    content: String,
    effectiveDate: Date,
    archivedAt: Date,
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  effectiveDate: {
    type: Date,
    required: true
  },
  expiryDate: Date,
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'published', 'archived', 'superseded'],
    default: 'draft'
  },
  approvalWorkflow: {
    required: { type: Boolean, default: false },
    approvers: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      approvedAt: Date,
      comments: String
    }],
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  applicableTo: {
    type: String,
    enum: ['all', 'department', 'role', 'specific'],
    default: 'all'
  },
  targetDepartments: [String],
  targetRoles: [String],
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  requiresAcknowledgment: { type: Boolean, default: true },
  acknowledgmentDeadline: Date,
  acknowledgments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acknowledgedAt: Date,
    ipAddress: String,
    userAgent: String
  }],
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  tags: [String],
  relatedPolicies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Policy'
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewSchedule: {
    frequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'semi-annually', 'annually', 'custom'],
      default: 'annually'
    },
    nextReviewDate: Date,
    lastReviewedAt: Date,
    lastReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  publishedAt: Date,
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
policySchema.index({ companyId: 1, status: 1 });
policySchema.index({ companyId: 1, category: 1 });
policySchema.index({ companyId: 1, effectiveDate: 1 });

// Virtual for acknowledgment rate
policySchema.virtual('acknowledgmentRate').get(function () {
  // This would need to be calculated based on target audience
  return this.acknowledgments ? this.acknowledgments.length : 0;
});

// Method to publish policy
policySchema.methods.publish = async function (userId) {
  this.status = 'published';
  this.publishedAt = new Date();
  this.publishedBy = userId;
  const saved = await this.save();
  return saved;
};

// Method to create new version
policySchema.methods.createNewVersion = async function (newContent, newVersion, userId) {
  this.previousVersions.push({
    version: this.version,
    content: this.content,
    effectiveDate: this.effectiveDate,
    archivedAt: new Date(),
    archivedBy: userId
  });

  this.version = newVersion;
  this.content = newContent;
  this.status = 'draft';
  this.updatedBy = userId;
  this.acknowledgments = [];

  const saved = await this.save();
  return saved;
};

// Method to acknowledge
policySchema.methods.acknowledge = async function (userId, ipAddress, userAgent) {
  const existing = this.acknowledgments.find((a) => a.userId.toString() === userId.toString());
  if (!existing) {
    this.acknowledgments.push({
      userId,
      acknowledgedAt: new Date(),
      ipAddress,
      userAgent
    });
    const saved = await this.save();
    return saved;
  }
  return this;
};

addTenantSupport(policySchema);

const Policy = mongoose.models.Policy || mongoose.model('Policy', policySchema);

module.exports = Policy;
