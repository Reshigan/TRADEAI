const Dispute = require('../models/Dispute');
const Deduction = require('../models/Deduction');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');

/**
 * DISPUTE MANAGEMENT SERVICE
 * Complete dispute workflow from creation to resolution
 */
class DisputeManagementService {
  /**
   * Create dispute from deduction
   */
  async createDisputeFromDeduction(deductionId, disputeData, userId) {
    const deduction = await Deduction.findById(deductionId);
    if (!deduction) throw new Error('Deduction not found');

    const disputeNumber = await this._generateDisputeNumber();

    const dispute = new Dispute({
      disputeNumber,
      customerId: deduction.customerId,
      disputeType: 'deduction',
      category: disputeData.category || 'other',
      deductionId: deduction._id,
      title: disputeData.title || `Deduction Dispute - ${deduction.deductionNumber}`,
      description: disputeData.description || deduction.reason,
      amount: deduction.amount,
      currency: deduction.currency,
      status: 'open',
      priority: this._calculatePriority(deduction.amount),
      createdBy: userId,
      activities: [{
        date: new Date(),
        action: 'created',
        performedBy: userId,
        comment: 'Dispute created from deduction'
      }]
    });

    await dispute.save();

    // Update deduction status
    deduction.status = 'disputed';
    deduction.disputeId = dispute._id;
    await deduction.save();

    return dispute;
  }

  /**
   * Create dispute from invoice
   */
  async createDisputeFromInvoice(invoiceId, disputeData, userId) {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const disputeNumber = await this._generateDisputeNumber();

    const dispute = new Dispute({
      disputeNumber,
      customerId: invoice.customerId,
      disputeType: disputeData.disputeType || 'invoice',
      category: disputeData.category,
      invoiceId: invoice._id,
      title: disputeData.title,
      description: disputeData.description,
      amount: disputeData.amount || invoice.total,
      currency: invoice.currency,
      status: 'open',
      priority: this._calculatePriority(disputeData.amount || invoice.total),
      createdBy: userId,
      activities: [{
        date: new Date(),
        action: 'created',
        performedBy: userId,
        comment: 'Dispute created from invoice'
      }]
    });

    await dispute.save();

    // Update invoice status
    await invoice.dispute(disputeData.description);

    return dispute;
  }

  /**
   * Assign dispute to user
   */
  async assignDispute(disputeId, assignedToUserId, _assignedByUserId) {
    const dispute = await Dispute.findById(disputeId);
    if (!dispute) throw new Error('Dispute not found');

    await dispute.assign(assignedToUserId);

    // Send notification
    await this._sendNotification(dispute, assignedToUserId, 'assigned');

    return dispute;
  }

  /**
   * Add comment to dispute
   */
  async addComment(disputeId, userId, comment, internal = false) {
    const dispute = await Dispute.findById(disputeId);
    if (!dispute) throw new Error('Dispute not found');

    await dispute.addComment(userId, comment, internal);

    // Send notification to assigned user
    if (dispute.assignedTo && dispute.assignedTo.toString() !== userId.toString()) {
      await this._sendNotification(dispute, dispute.assignedTo, 'comment');
    }

    return dispute;
  }

  /**
   * Escalate dispute
   */
  async escalateDispute(disputeId, userId, escalateToUserId, reason) {
    const dispute = await Dispute.findById(disputeId);
    if (!dispute) throw new Error('Dispute not found');

    await dispute.escalate(userId, escalateToUserId, reason);

    // Send notification to escalation target
    await this._sendNotification(dispute, escalateToUserId, 'escalated');

    return dispute;
  }

  /**
   * Resolve dispute
   */
  async resolveDispute(disputeId, userId, resolutionData) {
    const dispute = await Dispute.findById(disputeId)
      .populate('deductionId')
      .populate('invoiceId');

    if (!dispute) throw new Error('Dispute not found');

    await dispute.resolve(
      userId,
      resolutionData.resolution,
      resolutionData.approvedAmount,
      resolutionData.notes
    );

    // Update related documents
    if (dispute.deductionId) {
      const deduction = dispute.deductionId;

      if (resolutionData.resolution === 'approved') {
        deduction.status = 'approved';
        deduction.approvedAmount = resolutionData.approvedAmount;
      } else if (resolutionData.resolution === 'rejected') {
        deduction.status = 'rejected';
      } else if (resolutionData.resolution === 'partially_approved') {
        deduction.status = 'partially_approved';
        deduction.approvedAmount = resolutionData.approvedAmount;
      }

      await deduction.save();
    }

    // Send notification
    await this._sendNotification(dispute, dispute.createdBy, 'resolved');

    return dispute;
  }

  /**
   * Close dispute
   */
  async closeDispute(disputeId, userId) {
    const dispute = await Dispute.findById(disputeId);
    if (!dispute) throw new Error('Dispute not found');

    await dispute.close(userId);

    return dispute;
  }

  /**
   * Reopen dispute
   */
  async reopenDispute(disputeId, userId, reason) {
    const dispute = await Dispute.findById(disputeId);
    if (!dispute) throw new Error('Dispute not found');

    await dispute.reopen(userId, reason);

    // Reassign if previously assigned
    if (dispute.assignedTo) {
      await this._sendNotification(dispute, dispute.assignedTo, 'reopened');
    }

    return dispute;
  }

  /**
   * Initiate chargeback
   */
  async initiateChargeback(disputeId, userId, chargebackData) {
    const dispute = await Dispute.findById(disputeId);
    if (!dispute) throw new Error('Dispute not found');

    await dispute.initiateChargeback(chargebackData.reference);

    this.addComment(
      disputeId,
      userId,
      `Chargeback initiated: ${chargebackData.reference}`,
      false
    );

    return dispute;
  }

  /**
   * Get dispute workload by user
   */
  async getUserWorkload(userId) {
    const disputes = await Dispute.find({
      assignedTo: userId,
      status: { $nin: ['resolved', 'closed'] }
    }).populate('customerId');

    const workload = {
      total: disputes.length,
      byStatus: {},
      byPriority: {},
      overdue: 0,
      totalAmount: 0,
      disputes
    };

    for (const dispute of disputes) {
      // By status
      workload.byStatus[dispute.status] = (workload.byStatus[dispute.status] || 0) + 1;

      // By priority
      workload.byPriority[dispute.priority] = (workload.byPriority[dispute.priority] || 0) + 1;

      // Overdue
      if (dispute.sla.resolutionOverdue) {
        workload.overdue++;
      }

      // Total amount
      workload.totalAmount += dispute.amount;
    }

    return workload;
  }

  /**
   * Get overdue disputes
   */
  getOverdueDisputes() {
    return Dispute.getOverdueDisputes();
  }

  /**
   * Get dispute analytics
   */
  async getDisputeAnalytics(options = {}) {
    const query = {};

    if (options.customerId) {
      query.customerId = options.customerId;
    }

    if (options.startDate || options.endDate) {
      query.createdAt = {};
      if (options.startDate) query.createdAt.$gte = options.startDate;
      if (options.endDate) query.createdAt.$lte = options.endDate;
    }

    const disputes = await Dispute.find(query)
      .populate('customerId')
      .populate('assignedTo');

    const analytics = {
      total: disputes.length,
      byStatus: {},
      byType: {},
      byCategory: {},
      byPriority: {},
      byResolution: {},
      totalAmount: 0,
      approvedAmount: 0,
      rejectedAmount: 0,
      averageResolutionTime: 0,
      slaCompliance: 0,
      topCustomers: {},
      trends: {
        created: 0,
        resolved: 0,
        closed: 0
      }
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;
    let slaCompliant = 0;

    for (const dispute of disputes) {
      // Status
      analytics.byStatus[dispute.status] = (analytics.byStatus[dispute.status] || 0) + 1;

      // Type
      analytics.byType[dispute.disputeType] = (analytics.byType[dispute.disputeType] || 0) + 1;

      // Category
      analytics.byCategory[dispute.category] = (analytics.byCategory[dispute.category] || 0) + 1;

      // Priority
      analytics.byPriority[dispute.priority] = (analytics.byPriority[dispute.priority] || 0) + 1;

      // Resolution
      if (dispute.resolution) {
        analytics.byResolution[dispute.resolution] = (analytics.byResolution[dispute.resolution] || 0) + 1;
      }

      // Amounts
      analytics.totalAmount += dispute.amount;
      analytics.approvedAmount += dispute.approvedAmount;
      analytics.rejectedAmount += dispute.rejectedAmount;

      // Resolution time
      if (dispute.resolutionDate) {
        const resolutionTime = (dispute.resolutionDate - dispute.createdAt) / (1000 * 60 * 60); // hours
        totalResolutionTime += resolutionTime;
        resolvedCount++;

        // SLA compliance
        if (!dispute.sla.resolutionOverdue) {
          slaCompliant++;
        }
      }

      // Top customers
      if (dispute.customerId) {
        const customerId = dispute.customerId._id.toString();
        if (!analytics.topCustomers[customerId]) {
          analytics.topCustomers[customerId] = {
            name: dispute.customerId.name,
            count: 0,
            amount: 0
          };
        }
        analytics.topCustomers[customerId].count++;
        analytics.topCustomers[customerId].amount += dispute.amount;
      }

      // Trends
      if (dispute.status === 'open' || dispute.status === 'in_review') {
        analytics.trends.created++;
      } else if (dispute.status === 'resolved') {
        analytics.trends.resolved++;
      } else if (dispute.status === 'closed') {
        analytics.trends.closed++;
      }
    }

    // Calculate averages
    if (resolvedCount > 0) {
      analytics.averageResolutionTime = Math.round(totalResolutionTime / resolvedCount);
      analytics.slaCompliance = Math.round((slaCompliant / resolvedCount) * 100);
    }

    // Sort top customers
    analytics.topCustomers = Object.values(analytics.topCustomers)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return analytics;
  }

  /**
   * Auto-escalate overdue disputes
   */
  async autoEscalateOverdueDisputes(escalateToUserId) {
    const overdueDisputes = await Dispute.find({
      'sla.resolutionOverdue': true,
      status: { $nin: ['resolved', 'closed', 'escalated'] }
    });

    const results = {
      total: overdueDisputes.length,
      escalated: 0,
      failed: []
    };

    for (const dispute of overdueDisputes) {
      try {
        await this.escalateDispute(
          dispute._id,
          dispute.assignedTo || dispute.createdBy,
          escalateToUserId,
          'Auto-escalation: SLA resolution time exceeded'
        );
        results.escalated++;
      } catch (error) {
        results.failed.push({
          disputeNumber: dispute.disputeNumber,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Calculate priority based on amount
   */
  _calculatePriority(amount) {
    if (amount >= 10000) return 'critical';
    if (amount >= 5000) return 'high';
    if (amount >= 1000) return 'medium';
    return 'low';
  }

  /**
   * Generate dispute number
   */
  async _generateDisputeNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    const count = await Dispute.countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), 1),
        $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
      }
    });

    return `DSP-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
  }

  /**
   * Send notification (placeholder)
   */
  async _sendNotification(dispute, userId, type) {
    // In production, integrate with email/notification service
    dispute.notifications.push({
      date: new Date(),
      type,
      recipient: userId,
      sent: true
    });

    await dispute.save();
  }
}

module.exports = new DisputeManagementService();
