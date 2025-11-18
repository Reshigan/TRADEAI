const User = require('../models/User');
const emailService = require('./emailService');
const logger = require('../utils/logger');
const { addJob } = require('../jobs');

class ApprovalWorkflowService {
  constructor() {
    this.workflows = {
      budget: {
        levels: ['kam', 'manager', 'director', 'finance', 'board'],
        thresholds: {
          kam: 50000,
          manager: 200000,
          director: 500000,
          finance: 1000000,
          board: Infinity
        }
      },
      promotion: {
        levels: ['kam', 'manager', 'trade_marketing', 'finance', 'director'],
        thresholds: {
          kam: 10000,
          manager: 50000,
          trade_marketing: 100000,
          finance: 200000,
          director: Infinity
        }
      },
      trade_spend: {
        levels: ['kam', 'manager', 'director', 'finance', 'board'],
        thresholds: {
          kam: 5000,
          manager: 20000,
          director: 50000,
          finance: 100000,
          board: Infinity
        }
      }
    };
  }

  // Get required approval levels based on amount and type
  getRequiredApprovals(type, amount, additionalCriteria = {}) {
    const workflow = this.workflows[type];
    if (!workflow) {
      throw new Error(`Unknown workflow type: ${type}`);
    }

    const requiredLevels = [];

    for (const level of workflow.levels) {
      if (amount <= workflow.thresholds[level]) {
        requiredLevels.push(level);
        break;
      }
      requiredLevels.push(level);
    }

    // Apply additional criteria
    if (type === 'trade_spend' && additionalCriteria.spendType === 'cash_coop') {
      // Cash co-op always needs finance approval
      if (!requiredLevels.includes('finance')) {
        requiredLevels.push('finance');
      }
    }

    if (type === 'promotion' && additionalCriteria.discountPercentage > 40) {
      // Deep discounts need director approval
      if (!requiredLevels.includes('director')) {
        requiredLevels.push('director');
      }
    }

    return requiredLevels.map((level) => ({
      level,
      status: 'pending',
      sequence: workflow.levels.indexOf(level)
    })).sort((a, b) => a.sequence - b.sequence);
  }

  // Process approval
  async processApproval(document, approverUserId, decision, comments) {
    const approver = await User.findById(approverUserId);
    if (!approver) {
      throw new Error('Approver not found');
    }

    // Find the approval level for this user
    const approvalLevel = this.getUserApprovalLevel(approver.role);
    const approval = document.approvals.find((a) => a.level === approvalLevel);

    if (!approval) {
      throw new Error('No pending approval found for this user level');
    }

    if (approval.status !== 'pending') {
      throw new Error('This approval has already been processed');
    }

    // Update approval
    approval.status = decision;
    approval.approver = approverUserId;
    approval.comments = comments;
    approval.date = new Date();

    // Log the approval
    logger.logAudit('approval_processed', approverUserId, {
      documentType: document.constructor.modelName,
      documentId: document._id,
      decision,
      level: approvalLevel
    });

    // Check if we need to notify next approver
    if (decision === 'approved') {
      const nextPendingApproval = document.approvals.find(
        (a) => a.status === 'pending' && a.sequence > approval.sequence
      );

      if (nextPendingApproval) {
        // Notify next approver
        await this.notifyApprovers(document, nextPendingApproval.level);
      } else {
        // All approvals complete
        document.status = 'approved';
        await this.notifyRequester(document, 'approved');
      }
    } else if (decision === 'rejected') {
      // Rejection stops the workflow
      document.status = 'rejected';
      await this.notifyRequester(document, 'rejected', comments);
    }

    await document.save();

    return document;
  }

  // Notify approvers
  async notifyApprovers(document, level) {
    const approvers = await User.find({
      role: level,
      isActive: true
    });

    const documentType = document.constructor.modelName.toLowerCase();
    const documentInfo = this.getDocumentInfo(document);

    for (const approver of approvers) {
      // Email notification
      await emailService.sendApprovalRequestEmail(approver, documentInfo, documentType);

      // In-app notification (would be implemented with a notification system)
      await this.createNotification(approver._id, {
        type: 'approval_required',
        title: `${documentType} Approval Required`,
        message: `${documentInfo.name} requires your approval`,
        documentType,
        documentId: document._id,
        priority: 'high'
      });
    }

    // Queue reminder job
    await addJob('approvalReminder', 'send-reminder', {
      documentType,
      documentId: document._id,
      level,
      reminderCount: 1
    }, {
      delay: 24 * 60 * 60 * 1000 // 24 hours
    });
  }

  // Notify requester
  async notifyRequester(document, status, reason = null) {
    const requester = await User.findById(document.createdBy);
    if (!requester) return;

    const documentType = document.constructor.modelName.toLowerCase();
    const documentInfo = this.getDocumentInfo(document);

    await emailService.sendApprovalNotificationEmail(
      requester,
      { ...documentInfo, rejectionReason: reason },
      documentType,
      status
    );

    await this.createNotification(requester._id, {
      type: `approval_${status}`,
      title: `${documentType} ${status}`,
      message: `Your ${documentType} "${documentInfo.name}" has been ${status}`,
      documentType,
      documentId: document._id,
      priority: status === 'rejected' ? 'high' : 'medium'
    });
  }

  // Escalate approval
  async escalateApproval(document, currentLevel, reason) {
    const workflow = this.workflows[document.constructor.modelName.toLowerCase()];
    const currentIndex = workflow.levels.indexOf(currentLevel);

    if (currentIndex === -1 || currentIndex === workflow.levels.length - 1) {
      throw new Error('Cannot escalate further');
    }

    const nextLevel = workflow.levels[currentIndex + 1];

    // Add escalation to history
    document.history.push({
      action: 'escalated',
      performedDate: new Date(),
      comment: `Escalated from ${currentLevel} to ${nextLevel}: ${reason}`
    });

    // Update approval
    const approval = document.approvals.find((a) => a.level === currentLevel);
    if (approval) {
      approval.status = 'escalated';
      approval.date = new Date();
    }

    // Add new approval level
    document.approvals.push({
      level: nextLevel,
      status: 'pending',
      sequence: workflow.levels.indexOf(nextLevel)
    });

    await document.save();

    // Notify new approvers
    await this.notifyApprovers(document, nextLevel);

    logger.logAudit('approval_escalated', null, {
      documentType: document.constructor.modelName,
      documentId: document._id,
      fromLevel: currentLevel,
      toLevel: nextLevel,
      reason
    });
  }

  // Delegate approval
  async delegateApproval(document, fromUserId, toUserId, reason) {
    const fromUser = await User.findById(fromUserId);
    const toUser = await User.findById(toUserId);

    if (!fromUser || !toUser) {
      throw new Error('User not found');
    }

    // Check if users have same role/level
    if (fromUser.role !== toUser.role) {
      throw new Error('Can only delegate to users with same role');
    }

    const level = this.getUserApprovalLevel(fromUser.role);
    const approval = document.approvals.find((a) => a.level === level && a.status === 'pending');

    if (!approval) {
      throw new Error('No pending approval found for delegation');
    }

    // Add delegation to history
    document.history.push({
      action: 'delegated',
      performedBy: fromUserId,
      performedDate: new Date(),
      comment: `Delegated to ${toUser.firstName} ${toUser.lastName}: ${reason}`
    });

    await document.save();

    // Notify delegated user
    await this.createNotification(toUserId, {
      type: 'approval_delegated',
      title: 'Approval Delegated to You',
      message: `${fromUser.firstName} has delegated an approval to you`,
      documentType: document.constructor.modelName.toLowerCase(),
      documentId: document._id,
      priority: 'high'
    });
  }

  // Check SLA compliance
  checkSLACompliance(document) {
    const slaHours = {
      budget: 48,
      promotion: 24,
      trade_spend: 24
    };

    const documentType = document.constructor.modelName.toLowerCase();
    const sla = slaHours[documentType] || 48;

    const pendingApprovals = document.approvals.filter((a) => a.status === 'pending');
    const violations = [];

    for (const approval of pendingApprovals) {
      const submittedDate = document.history.find(
        (h) => h.action === 'submitted_for_approval'
      )?.performedDate;

      if (submittedDate) {
        const hoursElapsed = (new Date() - submittedDate) / (1000 * 60 * 60);

        if (hoursElapsed > sla) {
          violations.push({
            level: approval.level,
            hoursElapsed,
            sla,
            overdue: hoursElapsed - sla
          });
        }
      }
    }

    return violations;
  }

  // Auto-approve based on rules
  async autoApprove(document) {
    const rules = await this.getAutoApprovalRules(document);
    const autoApproved = [];

    for (const approval of document.approvals) {
      if (approval.status !== 'pending') continue;

      const rule = rules.find((r) => r.level === approval.level);
      if (rule && this.evaluateRule(rule, document)) {
        approval.status = 'approved';
        approval.approver = null; // System approval
        approval.comments = 'Auto-approved based on rules';
        approval.date = new Date();

        autoApproved.push(approval.level);

        logger.logAudit('auto_approval', null, {
          documentType: document.constructor.modelName,
          documentId: document._id,
          level: approval.level,
          rule: rule.name
        });
      }
    }

    if (autoApproved.length > 0) {
      await document.save();
    }

    return autoApproved;
  }

  // Helper methods
  getUserApprovalLevel(role) {
    const roleToLevel = {
      kam: 'kam',
      sales_rep: 'kam',
      manager: 'manager',
      director: 'director',
      board: 'board',
      admin: 'finance',
      analyst: 'finance'
    };

    return roleToLevel[role] || null;
  }

  getDocumentInfo(document) {
    const modelName = document.constructor.modelName;

    switch (modelName) {
      case 'Budget':
        return {
          id: document._id,
          name: document.name,
          amount: document.annualTotals.sales.value,
          requestedBy: document.createdBy
        };
      case 'Promotion':
        return {
          id: document._id,
          name: document.name,
          amount: document.financial.costs.totalCost,
          requestedBy: document.createdBy
        };
      case 'TradeSpend':
        return {
          id: document._id,
          name: `${document.spendType} - ${document.category}`,
          amount: document.amount.requested,
          requestedBy: document.createdBy
        };
      default:
        return {
          id: document._id,
          name: document.name || 'Document',
          amount: 0,
          requestedBy: document.createdBy
        };
    }
  }

  getAutoApprovalRules(_document) {
    // This would fetch from a rules configuration
    // For now, return sample rules
    return [
      {
        level: 'kam',
        name: 'Small amount auto-approval',
        conditions: {
          amount: { max: 1000 },
          documentType: 'trade_spend'
        }
      }
    ];
  }

  evaluateRule(rule, document) {
    // Simple rule evaluation
    if (rule.conditions.amount && document.amount) {
      if (rule.conditions.amount.max && document.amount.requested > rule.conditions.amount.max) {
        return false;
      }
    }

    return true;
  }

  createNotification(userId, notification) {
    // This would integrate with a notification service
    // For now, just log it
    logger.info('Notification created', { userId, notification });
  }
}

module.exports = new ApprovalWorkflowService();
