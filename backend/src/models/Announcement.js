const mongoose = require('mongoose');
const { addTenantSupport } = require('./BaseTenantModel');

const announcementSchema = new mongoose.Schema({
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
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'urgent', 'celebration'],
    default: 'info'
  },
  category: {
    type: String,
    enum: ['general', 'policy', 'event', 'achievement', 'system', 'hr', 'sales'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  audience: {
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
  channels: [{
    type: String,
    enum: ['in_app', 'email', 'sms', 'push'],
    default: 'in_app'
  }],
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  actionButton: {
    enabled: { type: Boolean, default: false },
    text: String,
    url: String
  },
  scheduling: {
    publishAt: Date,
    expireAt: Date,
    isScheduled: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'expired', 'archived'],
    default: 'draft'
  },
  isPinned: { type: Boolean, default: false },
  requiresAcknowledgment: { type: Boolean, default: false },
  acknowledgments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acknowledgedAt: Date
  }],
  views: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    viewedAt: Date
  }],
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
announcementSchema.index({ companyId: 1, status: 1 });
announcementSchema.index({ companyId: 1, 'scheduling.publishAt': 1 });
announcementSchema.index({ companyId: 1, isPinned: -1, createdAt: -1 });

// Virtual for view count
announcementSchema.virtual('viewCount').get(function () {
  return this.views ? this.views.length : 0;
});

// Virtual for acknowledgment count
announcementSchema.virtual('acknowledgmentCount').get(function () {
  return this.acknowledgments ? this.acknowledgments.length : 0;
});

// Method to publish announcement
announcementSchema.methods.publish = async function (userId) {
  this.status = 'published';
  this.publishedAt = new Date();
  this.publishedBy = userId;
  const saved = await this.save();
  return saved;
};

// Method to record view
announcementSchema.methods.recordView = async function (userId) {
  const existingView = this.views.find((v) => v.userId.toString() === userId.toString());
  if (!existingView) {
    this.views.push({ userId, viewedAt: new Date() });
    const saved = await this.save();
    return saved;
  }
  return this;
};

// Method to acknowledge
announcementSchema.methods.acknowledge = async function (userId) {
  const existing = this.acknowledgments.find((a) => a.userId.toString() === userId.toString());
  if (!existing) {
    this.acknowledgments.push({ userId, acknowledgedAt: new Date() });
    const saved = await this.save();
    return saved;
  }
  return this;
};

addTenantSupport(announcementSchema);

const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
