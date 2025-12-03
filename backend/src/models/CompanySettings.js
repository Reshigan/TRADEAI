const mongoose = require('mongoose');
const { addTenantSupport } = require('./BaseTenantModel');

const companySettingsSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    unique: true,
    index: true
  },
  
  // Branding
  branding: {
    logoUrl: String,
    logoLight: String, // For dark backgrounds
    logoDark: String, // For light backgrounds
    favicon: String,
    primaryColor: { type: String, default: '#1E40AF' },
    secondaryColor: { type: String, default: '#059669' },
    accentColor: { type: String, default: '#3B82F6' },
    headerStyle: {
      type: String,
      enum: ['default', 'branded', 'minimal'],
      default: 'default'
    },
    showCompanyLogo: { type: Boolean, default: true }
  },
  
  // General Settings
  general: {
    companyDisplayName: String,
    tagline: String,
    supportEmail: String,
    supportPhone: String,
    defaultLanguage: { type: String, default: 'en' },
    defaultTimezone: { type: String, default: 'Africa/Johannesburg' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    timeFormat: { type: String, default: '24h' },
    currency: { type: String, default: 'ZAR' },
    currencySymbol: { type: String, default: 'R' }
  },
  
  // Feature Toggles
  features: {
    aiInsights: { type: Boolean, default: true },
    gamification: { type: Boolean, default: true },
    learningManagement: { type: Boolean, default: true },
    announcements: { type: Boolean, default: true },
    policies: { type: Boolean, default: true },
    azureAdIntegration: { type: Boolean, default: false },
    ssoEnabled: { type: Boolean, default: false },
    twoFactorRequired: { type: Boolean, default: false },
    selfRegistration: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false }
  },
  
  // Notification Settings
  notifications: {
    emailNotifications: { type: Boolean, default: true },
    inAppNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    pushNotifications: { type: Boolean, default: false },
    digestFrequency: {
      type: String,
      enum: ['realtime', 'hourly', 'daily', 'weekly'],
      default: 'daily'
    },
    notifyOnNewAnnouncement: { type: Boolean, default: true },
    notifyOnPolicyUpdate: { type: Boolean, default: true },
    notifyOnCourseAssignment: { type: Boolean, default: true },
    notifyOnGameActivity: { type: Boolean, default: true }
  },
  
  // Learning Settings
  learning: {
    autoAssignOnboarding: { type: Boolean, default: true },
    onboardingCourseId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningCourse' },
    certificatesEnabled: { type: Boolean, default: true },
    quizPassingScore: { type: Number, default: 70 },
    allowRetakes: { type: Boolean, default: true },
    maxRetakes: { type: Number, default: 3 },
    trackProgress: { type: Boolean, default: true }
  },
  
  // Gamification Settings
  gamification: {
    enabled: { type: Boolean, default: true },
    showLeaderboard: { type: Boolean, default: true },
    leaderboardVisibility: {
      type: String,
      enum: ['all', 'department', 'role', 'none'],
      default: 'all'
    },
    pointsForLogin: { type: Number, default: 5 },
    pointsForCourseCompletion: { type: Number, default: 50 },
    pointsForPolicyAcknowledgment: { type: Number, default: 10 },
    badgesEnabled: { type: Boolean, default: true }
  },
  
  // Security Settings
  security: {
    passwordMinLength: { type: Number, default: 8 },
    passwordRequireUppercase: { type: Boolean, default: true },
    passwordRequireLowercase: { type: Boolean, default: true },
    passwordRequireNumbers: { type: Boolean, default: true },
    passwordRequireSpecial: { type: Boolean, default: true },
    passwordExpiryDays: { type: Number, default: 90 },
    sessionTimeoutMinutes: { type: Number, default: 60 },
    maxLoginAttempts: { type: Number, default: 5 },
    lockoutDurationMinutes: { type: Number, default: 30 },
    ipWhitelist: [String],
    allowedDomains: [String]
  },
  
  // Integration Settings
  integrations: {
    sapEnabled: { type: Boolean, default: false },
    sapConfig: mongoose.Schema.Types.Mixed,
    salesforceEnabled: { type: Boolean, default: false },
    salesforceConfig: mongoose.Schema.Types.Mixed,
    slackEnabled: { type: Boolean, default: false },
    slackWebhook: String,
    teamsEnabled: { type: Boolean, default: false },
    teamsWebhook: String
  },
  
  // Workflow Settings
  workflows: {
    requireApprovalForBudgets: { type: Boolean, default: true },
    requireApprovalForPromotions: { type: Boolean, default: true },
    requireApprovalForTradeSpends: { type: Boolean, default: true },
    autoApproveBelow: { type: Number, default: 0 },
    escalationEnabled: { type: Boolean, default: true },
    escalationAfterHours: { type: Number, default: 48 }
  },
  
  // Custom Fields
  customFields: mongoose.Schema.Types.Mixed,
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure one settings document per company
companySettingsSchema.index({ companyId: 1 }, { unique: true });

// Static method to get or create settings for a company
companySettingsSchema.statics.getOrCreate = async function(companyId) {
  let settings = await this.findOne({ companyId });
  if (!settings) {
    settings = await this.create({ companyId });
  }
  return settings;
};

addTenantSupport(companySettingsSchema);

const CompanySettings = mongoose.models.CompanySettings || mongoose.model('CompanySettings', companySettingsSchema);

module.exports = CompanySettings;
