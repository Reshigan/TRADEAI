const mongoose = require('mongoose');
const { addTenantSupport } = require('./BaseTenantModel');

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  content: String, // HTML/Markdown content
  videoUrl: String,
  duration: Number, // in minutes
  order: { type: Number, default: 0 },
  quiz: [{
    question: String,
    options: [String],
    correctAnswer: Number,
    points: { type: Number, default: 10 }
  }]
}, { _id: true });

const learningCourseSchema = new mongoose.Schema({
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
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['onboarding', 'product', 'sales', 'compliance', 'skills', 'leadership', 'other'],
    default: 'other'
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  modules: [moduleSchema],
  thumbnail: String,
  duration: { type: Number, default: 0 }, // Total duration in minutes
  tags: [String],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  isRequired: { type: Boolean, default: false },
  dueWithinDays: Number, // Days to complete after assignment
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  assignedDepartments: [String],
  assignedRoles: [String],
  completions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedAt: Date,
    score: Number,
    timeSpent: Number // in minutes
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
learningCourseSchema.index({ companyId: 1, status: 1 });
learningCourseSchema.index({ companyId: 1, category: 1 });
learningCourseSchema.index({ companyId: 1, 'assignedTo': 1 });

// Virtual for completion rate
learningCourseSchema.virtual('completionRate').get(function () {
  if (!this.assignedTo || this.assignedTo.length === 0) return 0;
  return Math.round((this.completions.length / this.assignedTo.length) * 100);
});

// Calculate total duration from modules
learningCourseSchema.pre('save', function (next) {
  if (this.modules && this.modules.length > 0) {
    this.duration = this.modules.reduce((total, mod) => total + (mod.duration || 0), 0);
  }
  next();
});

addTenantSupport(learningCourseSchema);

const LearningCourse = mongoose.models.LearningCourse || mongoose.model('LearningCourse', learningCourseSchema);

module.exports = LearningCourse;
