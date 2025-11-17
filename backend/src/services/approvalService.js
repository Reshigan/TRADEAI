const Approval = require('../models/Approval');
const ApprovalPolicy = require('../models/ApprovalPolicy');
const Promotion = require('../models/Promotion');
const TradeSpend = require('../models/TradeSpend');
const Budget = require('../models/Budget');

class ApprovalService {
  async createApproval(tenantId, entityType, entityId, requestedBy, amount, metadata = {}) {
    const policy = await ApprovalPolicy.findApplicablePolicy(tenantId, entityType, { amount });

    if (!policy) {
      throw new Error(`No approval policy found for ${entityType}`);
    }

    const entity = await this.getEntity(entityType, entityId);
    const approvalChain = policy.buildApprovalChain(entity);

    const approvalId = `APR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const slaDays = approvalChain[0]?.requiredBy
      ? Math.ceil((approvalChain[0].requiredBy - new Date()) / (1000 * 60 * 60 * 24))
      : 3;

    const approval = new Approval({
      company: tenantId,
      approvalId,
      entityType,
      entityId,
      requestedBy,
      amount,
      currency: metadata.currency || 'ZAR',
      approvalChain,
      policyRules: policy.rules.map((r) => ({
        ruleId: r.ruleId,
        ruleName: r.name,
        threshold: r.condition.value,
        condition: `${r.condition.field} ${r.condition.operator} ${r.condition.value}`,
        result: 'matched'
      })),
      sla: {
        dueDate: new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000),
        escalationDate: new Date(Date.now() + (slaDays - 1) * 24 * 60 * 60 * 1000)
      },
      metadata: {
        description: metadata.description,
        justification: metadata.justification,
        attachments: metadata.attachments || [],
        tags: metadata.tags || []
      },
      auditTrail: [{
        action: 'created',
        performedBy: requestedBy,
        details: { amount, entityType, entityId }
      }]
    });

    await approval.save();

    await this.updateEntityStatus(entityType, entityId, 'pending_approval', approval._id);

    return approval;
  }

  async getEntity(entityType, entityId) {
    switch (entityType) {
      case 'promotion':
        return Promotion.findById(entityId);
      case 'trade_spend':
        return TradeSpend.findById(entityId);
      case 'budget':
        return Budget.findById(entityId);
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  async updateEntityStatus(entityType, entityId, status, approvalId) {
    let Model;
    switch (entityType) {
      case 'promotion':
        Model = Promotion;
        break;
      case 'trade_spend':
        Model = TradeSpend;
        break;
      case 'budget':
        Model = Budget;
        break;
      default:
        return;
    }

    await Model.findByIdAndUpdate(entityId, {
      status,
      approvalId,
      updatedAt: new Date()
    });
  }

  async approveApproval(approvalId, approverId, comments) {
    const approval = await Approval.findById(approvalId);

    if (!approval) {
      throw new Error('Approval not found');
    }

    await approval.approve(approverId, comments);

    if (approval.status === 'approved') {
      await this.updateEntityStatus(approval.entityType, approval.entityId, 'approved', approval._id);
    }

    return approval;
  }

  async rejectApproval(approvalId, approverId, reason) {
    const approval = await Approval.findById(approvalId);

    if (!approval) {
      throw new Error('Approval not found');
    }

    await approval.reject(approverId, reason);
    await this.updateEntityStatus(approval.entityType, approval.entityId, 'rejected', approval._id);

    return approval;
  }

  async cancelApproval(approvalId, userId, reason) {
    const approval = await Approval.findById(approvalId);

    if (!approval) {
      throw new Error('Approval not found');
    }

    await approval.cancel(userId, reason);
    await this.updateEntityStatus(approval.entityType, approval.entityId, 'draft', null);

    return approval;
  }

  async getPendingApprovalsForUser(userId) {
    return Approval.findPendingForApprover(userId);
  }

  async getOverdueApprovals(tenantId) {
    return Approval.findOverdue(tenantId);
  }

  async getApprovalsByEntity(entityType, entityId) {
    return await Approval.find({ entityType, entityId })
      .populate('requestedBy', 'name email')
      .populate('approvalChain.approver', 'name email role')
      .sort({ createdAt: -1 });
  }

  async checkSLA(approvalId) {
    const approval = await Approval.findById(approvalId);

    if (!approval) {
      throw new Error('Approval not found');
    }

    return approval.checkSLA();
  }
}

module.exports = new ApprovalService();
