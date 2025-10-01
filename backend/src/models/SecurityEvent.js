const mongoose = require('mongoose');
const { BaseTenantModel } = require('./BaseTenantModel');

const securityEventSchema = new mongoose.Schema({
  // Event type
  type: {
    type: String,
    required: true,
    enum: [
      // Authentication events
      'AUTHENTICATION_SUCCESS', 'AUTHENTICATION_FAILED', 'AUTHENTICATION_BLOCKED',
      'PASSWORD_CHANGED', 'PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_COMPLETED',
      'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'SESSION_EXPIRED', 'SESSION_HIJACK_ATTEMPT',
      
      // Authorization events
      'UNAUTHORIZED_ACCESS_ATTEMPT', 'PRIVILEGE_ESCALATION_ATTEMPT',
      'PERMISSION_DENIED', 'ROLE_MANIPULATION_ATTEMPT',
      
      // Data access events
      'SENSITIVE_DATA_ACCESS', 'DATA_EXPORT_LARGE', 'BULK_DATA_DOWNLOAD',
      'UNAUTHORIZED_DATA_MODIFICATION', 'DATA_DELETION_ATTEMPT',
      
      // System events
      'SUSPICIOUS_API_USAGE', 'RATE_LIMIT_EXCEEDED', 'UNUSUAL_TRAFFIC_PATTERN',
      'SYSTEM_INTRUSION_ATTEMPT', 'MALWARE_DETECTED', 'VULNERABILITY_EXPLOIT_ATTEMPT',
      
      // Network events
      'SUSPICIOUS_IP_ACCESS', 'GEO_ANOMALY', 'VPN_USAGE_DETECTED',
      'TOR_USAGE_DETECTED', 'PROXY_USAGE_DETECTED',
      
      // Application events
      'SQL_INJECTION_ATTEMPT', 'XSS_ATTEMPT', 'CSRF_ATTEMPT',
      'FILE_UPLOAD_MALICIOUS', 'COMMAND_INJECTION_ATTEMPT',
      
      // Compliance events
      'GDPR_VIOLATION_DETECTED', 'DATA_RETENTION_VIOLATION',
      'AUDIT_LOG_TAMPERING', 'COMPLIANCE_POLICY_VIOLATION'
    ],
    index: true
  },
  
  // Severity level
  severity: {
    type: String,
    required: true,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    index: true
  },
  
  // User involved (if applicable)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Email address (for failed login attempts)
  email: {
    type: String,
    index: true
  },
  
  // Network information
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  
  userAgent: {
    type: String
  },
  
  // Geographic information
  geoLocation: {
    country: String,
    region: String,
    city: String,
    latitude: Number,
    longitude: Number,
    timezone: String
  },
  
  // Request information
  requestMethod: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']
  },
  
  requestUrl: String,
  
  requestHeaders: {
    type: mongoose.Schema.Types.Mixed
  },
  
  requestBody: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Response information
  responseStatus: Number,
  
  responseTime: Number, // milliseconds
  
  // Event details
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Risk assessment
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Threat indicators
  threatIndicators: [{
    type: {
      type: String,
      enum: [
        'BRUTE_FORCE', 'CREDENTIAL_STUFFING', 'ACCOUNT_TAKEOVER',
        'DATA_EXFILTRATION', 'PRIVILEGE_ESCALATION', 'LATERAL_MOVEMENT',
        'PERSISTENCE', 'COMMAND_CONTROL', 'RECONNAISSANCE',
        'MALWARE', 'PHISHING', 'SOCIAL_ENGINEERING'
      ]
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    description: String
  }],
  
  // Automated response
  automatedResponse: {
    action: {
      type: String,
      enum: [
        'NONE', 'LOG_ONLY', 'ALERT_ADMIN', 'BLOCK_IP',
        'LOCK_ACCOUNT', 'REQUIRE_MFA', 'FORCE_PASSWORD_RESET',
        'TERMINATE_SESSION', 'QUARANTINE_USER'
      ],
      default: 'NONE'
    },
    timestamp: Date,
    success: Boolean,
    details: String
  },
  
  // Investigation status
  investigationStatus: {
    type: String,
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'FALSE_POSITIVE', 'ESCALATED'],
    default: 'OPEN',
    index: true
  },
  
  // Assigned investigator
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Investigation notes
  investigationNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Related events
  relatedEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SecurityEvent'
  }],
  
  // Correlation ID for grouping related events
  correlationId: {
    type: String,
    index: true
  },
  
  // Alert status
  alertSent: {
    type: Boolean,
    default: false
  },
  
  alertRecipients: [String],
  
  // Resolution information
  resolution: {
    action: String,
    description: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  },
  
  // Compliance flags
  complianceImpact: [{
    regulation: {
      type: String,
      enum: ['GDPR', 'CCPA', 'HIPAA', 'SOX', 'PCI_DSS', 'SOC2']
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    },
    description: String
  }],
  
  // Archival information
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  
  archivedAt: Date,
  
  retentionDate: {
    type: Date,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Apply tenant isolation
securityEventSchema.plugin(BaseTenantModel);

// Indexes for performance
securityEventSchema.index({ tenantId: 1, createdAt: -1 });
securityEventSchema.index({ tenantId: 1, type: 1, createdAt: -1 });
securityEventSchema.index({ tenantId: 1, severity: 1, createdAt: -1 });
securityEventSchema.index({ tenantId: 1, investigationStatus: 1 });
securityEventSchema.index({ tenantId: 1, ipAddress: 1, createdAt: -1 });
securityEventSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });
securityEventSchema.index({ tenantId: 1, riskScore: -1, createdAt: -1 });
securityEventSchema.index({ correlationId: 1 });
securityEventSchema.index({ retentionDate: 1 }, { sparse: true });

// Compound indexes for complex queries
securityEventSchema.index({
  tenantId: 1,
  type: 1,
  severity: 1,
  createdAt: -1
});

securityEventSchema.index({
  tenantId: 1,
  investigationStatus: 1,
  severity: 1,
  createdAt: -1
});

// Virtual for formatted timestamp
securityEventSchema.virtual('formattedTimestamp').get(function() {
  return this.createdAt.toISOString();
});

// Virtual for event description
securityEventSchema.virtual('eventDescription').get(function() {
  const descriptions = {
    'AUTHENTICATION_FAILED': 'Failed login attempt',
    'AUTHENTICATION_BLOCKED': 'Login blocked due to security policy',
    'UNAUTHORIZED_ACCESS_ATTEMPT': 'Attempted to access restricted resource',
    'SUSPICIOUS_API_USAGE': 'Unusual API usage pattern detected',
    'RATE_LIMIT_EXCEEDED': 'API rate limit exceeded',
    'SUSPICIOUS_IP_ACCESS': 'Access from suspicious IP address',
    'SQL_INJECTION_ATTEMPT': 'SQL injection attack attempt',
    'XSS_ATTEMPT': 'Cross-site scripting attack attempt'
  };
  
  return descriptions[this.type] || this.type.replace(/_/g, ' ').toLowerCase();
});

// Virtual for risk level
securityEventSchema.virtual('riskLevel').get(function() {
  if (this.riskScore >= 80) return 'CRITICAL';
  if (this.riskScore >= 60) return 'HIGH';
  if (this.riskScore >= 40) return 'MEDIUM';
  return 'LOW';
});

// Static methods
securityEventSchema.statics.findByThreatType = function(tenantId, threatType, options = {}) {
  const { startDate, endDate, limit = 100 } = options;
  
  const query = {
    tenantId,
    'threatIndicators.type': threatType
  };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .populate('userId', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

securityEventSchema.statics.getSecurityDashboard = function(tenantId, options = {}) {
  const { startDate, endDate } = options;
  
  const matchStage = { tenantId };
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          type: '$type',
          severity: '$severity'
        },
        count: { $sum: 1 },
        avgRiskScore: { $avg: '$riskScore' },
        maxRiskScore: { $max: '$riskScore' },
        lastOccurrence: { $max: '$createdAt' }
      }
    },
    {
      $group: {
        _id: '$_id.type',
        totalCount: { $sum: '$count' },
        severityBreakdown: {
          $push: {
            severity: '$_id.severity',
            count: '$count',
            avgRiskScore: '$avgRiskScore',
            maxRiskScore: '$maxRiskScore',
            lastOccurrence: '$lastOccurrence'
          }
        }
      }
    },
    { $sort: { totalCount: -1 } }
  ]);
};

securityEventSchema.statics.getThreatTrends = function(tenantId, options = {}) {
  const { days = 30 } = options;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        tenantId,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          severity: '$severity'
        },
        count: { $sum: 1 },
        avgRiskScore: { $avg: '$riskScore' }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        totalEvents: { $sum: '$count' },
        severityBreakdown: {
          $push: {
            severity: '$_id.severity',
            count: '$count',
            avgRiskScore: '$avgRiskScore'
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

securityEventSchema.statics.getTopThreats = function(tenantId, options = {}) {
  const { limit = 10, startDate, endDate } = options;
  
  const matchStage = { tenantId };
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: matchStage },
    { $unwind: '$threatIndicators' },
    {
      $group: {
        _id: '$threatIndicators.type',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$threatIndicators.confidence' },
        avgRiskScore: { $avg: '$riskScore' },
        maxRiskScore: { $max: '$riskScore' },
        lastSeen: { $max: '$createdAt' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
};

// Instance methods
securityEventSchema.methods.assignInvestigator = function(userId) {
  this.assignedTo = userId;
  this.investigationStatus = 'IN_PROGRESS';
  return this.save();
};

securityEventSchema.methods.addInvestigationNote = function(note, userId) {
  this.investigationNotes.push({
    note,
    addedBy: userId,
    addedAt: new Date()
  });
  return this.save();
};

securityEventSchema.methods.resolve = function(resolution, userId) {
  this.investigationStatus = 'RESOLVED';
  this.resolution = {
    ...resolution,
    resolvedBy: userId,
    resolvedAt: new Date()
  };
  return this.save();
};

securityEventSchema.methods.escalate = function() {
  this.investigationStatus = 'ESCALATED';
  this.severity = this.severity === 'HIGH' ? 'CRITICAL' : 'HIGH';
  return this.save();
};

securityEventSchema.methods.correlateWith = function(eventIds) {
  if (!Array.isArray(eventIds)) eventIds = [eventIds];
  this.relatedEvents = [...new Set([...this.relatedEvents, ...eventIds])];
  return this.save();
};

// Pre-save middleware
securityEventSchema.pre('save', function(next) {
  // Calculate risk score if not set
  if (this.riskScore === 0) {
    this.riskScore = this.calculateRiskScore();
  }
  
  // Set retention date
  if (!this.retentionDate) {
    const retentionDays = this.severity === 'CRITICAL' ? 2555 : // 7 years
                         this.severity === 'HIGH' ? 1825 : // 5 years
                         this.severity === 'MEDIUM' ? 1095 : // 3 years
                         365; // 1 year for LOW
    
    this.retentionDate = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);
  }
  
  // Generate correlation ID if not set
  if (!this.correlationId) {
    this.correlationId = `${this.tenantId}_${this.type}_${Date.now()}`;
  }
  
  next();
});

// Instance method to calculate risk score
securityEventSchema.methods.calculateRiskScore = function() {
  let score = 0;
  
  // Base score by severity
  const severityScores = { LOW: 10, MEDIUM: 30, HIGH: 60, CRITICAL: 80 };
  score += severityScores[this.severity] || 0;
  
  // Add score for threat indicators
  if (this.threatIndicators && this.threatIndicators.length > 0) {
    const avgConfidence = this.threatIndicators.reduce((sum, ti) => sum + (ti.confidence || 0), 0) / this.threatIndicators.length;
    score += avgConfidence * 20;
  }
  
  // Add score for failed authentication attempts
  if (this.type.includes('AUTHENTICATION_FAILED')) {
    score += 15;
  }
  
  // Add score for suspicious IP patterns
  if (this.type.includes('SUSPICIOUS_IP')) {
    score += 10;
  }
  
  return Math.min(score, 100);
};

const SecurityEvent = mongoose.model('SecurityEvent', securityEventSchema);

module.exports = SecurityEvent;