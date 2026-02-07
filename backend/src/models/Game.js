const mongoose = require('mongoose');
const { addTenantSupport } = require('./BaseTenantModel');

const gameSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  type: {
    type: String,
    enum: ['leaderboard', 'challenge', 'quiz', 'achievement', 'points_race', 'team_competition'],
    required: true
  },
  category: {
    type: String,
    enum: ['sales', 'learning', 'engagement', 'performance', 'custom'],
    default: 'engagement'
  },
  config: {
    // Points configuration
    pointsPerAction: {
      login: { type: Number, default: 5 },
      courseComplete: { type: Number, default: 50 },
      quizPass: { type: Number, default: 25 },
      promotionCreated: { type: Number, default: 30 },
      budgetApproved: { type: Number, default: 20 },
      customerVisit: { type: Number, default: 15 }
    },
    // Leaderboard settings
    leaderboardSize: { type: Number, default: 10 },
    resetPeriod: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'never'],
      default: 'monthly'
    },
    // Challenge settings
    targetMetric: String,
    targetValue: Number,
    // Team settings
    teamBased: { type: Boolean, default: false },
    maxTeamSize: Number
  },
  rewards: [{
    rank: Number,
    title: String,
    description: String,
    badgeIcon: String,
    points: Number,
    prize: String
  }],
  badges: [{
    name: String,
    description: String,
    icon: String,
    criteria: String,
    pointsRequired: Number
  }],
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    points: { type: Number, default: 0 },
    rank: Number,
    badges: [String],
    joinedAt: { type: Date, default: Date.now },
    lastActivityAt: Date
  }],
  teams: [{
    name: String,
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    totalPoints: { type: Number, default: 0 },
    rank: Number
  }],
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'archived'],
    default: 'draft'
  },
  startDate: Date,
  endDate: Date,
  isPublic: { type: Boolean, default: true },
  eligibleDepartments: [String],
  eligibleRoles: [String],
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
gameSchema.index({ companyId: 1, status: 1 });
gameSchema.index({ companyId: 1, type: 1 });
gameSchema.index({ companyId: 1, 'participants.userId': 1 });

// Virtual for participant count
gameSchema.virtual('participantCount').get(function () {
  return this.participants ? this.participants.length : 0;
});

// Method to add points to a participant
gameSchema.methods.addPoints = async function (userId, points, _action) {
  const participant = this.participants.find((p) => p.userId.toString() === userId.toString());
  if (participant) {
    participant.points += points;
    participant.lastActivityAt = new Date();
  } else {
    this.participants.push({
      userId,
      points,
      lastActivityAt: new Date()
    });
  }
  // Recalculate ranks
  this.participants.sort((a, b) => b.points - a.points);
  this.participants.forEach((p, index) => {
    p.rank = index + 1;
  });
  const saved = await this.save();
  return saved;
};

addTenantSupport(gameSchema);

const Game = mongoose.models.Game || mongoose.model('Game', gameSchema);

module.exports = Game;
