const mongoose = require('mongoose');

const approvalPolicySchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  policyId: {
    type: String,
    required: true,
    unique: true
  },

  name: {
    type: String,
    required: true
  },

  description: String,

  entityType: {
    type: String,
    enum: ['promotion', 'trade_spend', 'budget', 'trading_term', 'claim', 'deduction'],
    required: true
  },

  isActive: {
    type: Boolean,
    default: true
  },

  priority: {
    type: Number,
    default: 0
  },

  rules: [{
    ruleId: String,
    name: String,
    condition: {
      field: String,
      operator: {
        type: String,
        enum: ['gt', 'gte', 'lt', 'lte', 'eq', 'ne', 'in', 'nin', 'contains']
      },
      value: mongoose.Schema.Types.Mixed
    },
    approvalLevels: [{
      level: Number,
      approverRole: String,
      approverUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      slaDays: Number,
      escalationDays: Number,
      canDelegate: {
        type: Boolean,
        default: false
      }
    }]
  }],

  defaultApprovalChain: [{
    level: Number,
    approverRole: String,
    approverUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    slaDays: Number,
    escalationDays: Number
  }],

  exceptions: [{
    condition: String,
    action: {
      type: String,
      enum: ['skip_approval', 'auto_approve', 'require_additional_approval', 'escalate']
    },
    details: mongoose.Schema.Types.Mixed
  }],

  notifications: {
    onSubmit: {
      type: Boolean,
      default: true
    },
    onApproval: {
      type: Boolean,
      default: true
    },
    onRejection: {
      type: Boolean,
      default: true
    },
    onEscalation: {
      type: Boolean,
      default: true
    },
    reminderDays: [Number]
  },

  auditSettings: {
    requireComments: {
      type: Boolean,
      default: true
    },
    requireAttachments: {
      type: Boolean,
      default: false
    },
    retentionDays: {
      type: Number,
      default: 2555
    }
  }
}, {
  timestamps: true
});

approvalPolicySchema.index({ company: 1, entityType: 1, isActive: 1 });

approvalPolicySchema.methods.evaluateRules = function (entity) {
  const matchedRules = [];

  for (const rule of this.rules) {
    const fieldValue = this.getFieldValue(entity, rule.condition.field);
    const conditionMet = this.evaluateCondition(
      fieldValue,
      rule.condition.operator,
      rule.condition.value
    );

    if (conditionMet) {
      matchedRules.push(rule);
    }
  }

  return matchedRules.sort((a, b) => (b.approvalLevels?.length || 0) - (a.approvalLevels?.length || 0));
};

approvalPolicySchema.methods.getFieldValue = function (entity, fieldPath) {
  const parts = fieldPath.split('.');
  let value = entity;

  for (const part of parts) {
    if (value && typeof value === 'object') {
      value = value[part];
    } else {
      return undefined;
    }
  }

  return value;
};

approvalPolicySchema.methods.evaluateCondition = function (fieldValue, operator, targetValue) {
  switch (operator) {
    case 'gt':
      return fieldValue > targetValue;
    case 'gte':
      return fieldValue >= targetValue;
    case 'lt':
      return fieldValue < targetValue;
    case 'lte':
      return fieldValue <= targetValue;
    case 'eq':
      return fieldValue === targetValue;
    case 'ne':
      return fieldValue !== targetValue;
    case 'in':
      return Array.isArray(targetValue) && targetValue.includes(fieldValue);
    case 'nin':
      return Array.isArray(targetValue) && !targetValue.includes(fieldValue);
    case 'contains':
      return String(fieldValue).includes(String(targetValue));
    default:
      return false;
  }
};

approvalPolicySchema.methods.buildApprovalChain = function (entity) {
  const matchedRules = this.evaluateRules(entity);

  if (matchedRules.length > 0) {
    return matchedRules[0].approvalLevels.map((level, index) => ({
      level: index + 1,
      approver: level.approverUserId,
      approverRole: level.approverRole,
      requiredBy: new Date(Date.now() + level.slaDays * 24 * 60 * 60 * 1000),
      status: 'pending'
    }));
  }

  return this.defaultApprovalChain.map((level, index) => ({
    level: index + 1,
    approver: level.approverUserId,
    approverRole: level.approverRole,
    requiredBy: new Date(Date.now() + level.slaDays * 24 * 60 * 60 * 1000),
    status: 'pending'
  }));
};

approvalPolicySchema.statics.findApplicablePolicy = async function (tenantId, entityType, entity) {
  const policies = await this.find({
    company: tenantId,
    entityType,
    isActive: true
  }).sort({ priority: -1 });

  for (const policy of policies) {
    const matchedRules = policy.evaluateRules(entity);
    if (matchedRules.length > 0) {
      return policy;
    }
  }

  return policies.find((p) => p.defaultApprovalChain.length > 0);
};

module.exports = mongoose.model('ApprovalPolicy', approvalPolicySchema);
