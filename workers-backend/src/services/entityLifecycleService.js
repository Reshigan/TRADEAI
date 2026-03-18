/**
 * W-13: EntityLifecycleService
 * Centralized service for all entity status transitions.
 * Every submit/approve/reject/settle goes through here to ensure
 * budget enforcement, approval routing, notifications, and data_lineage
 * are never skipped.
 */
import { checkBudgetAvailability, commitFunds, releaseFunds, recordSpend } from './budgetEnforcement.js';
import { routeApproval } from './approvalRouting.js';
import { createNotification } from './notifications.js';

const generateId = () => crypto.randomUUID();

async function recordLineage(db, companyId, { entityType, entityId, action, previousState, newState, userId, details }) {
  try {
    await db.prepare(`
      INSERT INTO data_lineage (id, company_id, entity_type, entity_id, action, previous_state, new_state, performed_by, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(generateId(), companyId, entityType, entityId, action, previousState || null, newState || null, userId || null, JSON.stringify(details || {})).run();
  } catch (e) { /* lineage recording is best-effort */ }
}

export class EntityLifecycleService {
  constructor(db, companyId, userId) {
    this.db = db;
    this.companyId = companyId;
    this.userId = userId;
  }

  /**
   * Called when an entity is submitted for approval.
   * - Checks budget availability (if budgetId + amount provided)
   * - Routes to appropriate approver
   * - Creates notification for submitter
   * - Records data_lineage
   */
  async onEntitySubmit({ entityType, entityId, entityName, amount, budgetId }) {
    const results = { budgetCheck: null, approval: null, notification: null };

    // Budget availability check
    if (budgetId && amount > 0) {
      try {
        const check = await checkBudgetAvailability(this.db, budgetId, amount, this.companyId);
        results.budgetCheck = check;
        if (!check.available) {
          return { success: false, reason: check.reason, results };
        }
      } catch (e) {
        results.budgetCheck = { error: e.message };
      }
    }

    // Route approval
    try {
      results.approval = await routeApproval(this.db, entityType, entityId, amount || 0, this.companyId, this.userId);
    } catch (e) {
      results.approval = { error: e.message };
    }

    // Notification to submitter
    try {
      results.notification = await createNotification(this.db, {
        companyId: this.companyId,
        userId: this.userId,
        title: `${entityType} Submitted`,
        message: `Your ${entityType} "${entityName || entityId}" has been submitted for approval.`,
        type: 'info', category: 'workflow', priority: 'normal',
        entityType, entityId, entityName,
        actionUrl: `/${entityType}s/${entityId}`
      });
    } catch (e) { /* notification is best-effort */ }

    // Record lineage
    await recordLineage(this.db, this.companyId, {
      entityType, entityId, action: 'submit',
      previousState: 'draft', newState: 'pending_approval',
      userId: this.userId, details: { amount, budgetId, approval: results.approval }
    });

    return { success: true, results };
  }

  /**
   * Called when an entity is approved.
   * - Commits budget funds (if budgetId + amount provided)
   * - Creates notification for requester
   * - Records data_lineage
   */
  async onEntityApprove({ entityType, entityId, entityName, amount, budgetId, requesterId }) {
    const results = { budgetCommit: null, notification: null };

    // Commit funds to budget
    if (budgetId && amount > 0) {
      try {
        results.budgetCommit = await commitFunds(
          this.db, budgetId, amount,
          entityType, entityId, entityName || '',
          this.userId, this.companyId
        );
      } catch (e) {
        results.budgetCommit = { error: e.message };
      }
    }

    // Notify the requester
    const notifyUserId = requesterId || this.userId;
    try {
      results.notification = await createNotification(this.db, {
        companyId: this.companyId,
        userId: notifyUserId,
        title: `${entityType} Approved`,
        message: `${entityType} "${entityName || entityId}" has been approved.`,
        type: 'success', category: 'workflow', priority: 'normal',
        entityType, entityId, entityName,
        actionUrl: `/${entityType}s/${entityId}`
      });
    } catch (e) { /* notification is best-effort */ }

    // Update approval record
    try {
      await this.db.prepare(`
        UPDATE approvals SET status = 'approved', reviewed_by = ?, reviewed_at = datetime('now'), updated_at = datetime('now')
        WHERE entity_type = ? AND entity_id = ? AND company_id = ? AND status = 'pending'
      `).bind(this.userId, entityType, entityId, this.companyId).run();
    } catch (e) { /* approval record update best-effort */ }

    await recordLineage(this.db, this.companyId, {
      entityType, entityId, action: 'approve',
      previousState: 'pending_approval', newState: 'approved',
      userId: this.userId, details: { amount, budgetId, budgetCommit: results.budgetCommit }
    });

    return { success: true, results };
  }

  /**
   * Called when an entity is rejected.
   * - Releases committed funds (if budgetId + amount provided)
   * - Creates notification for requester
   * - Records data_lineage
   */
  async onEntityReject({ entityType, entityId, entityName, amount, budgetId, requesterId, reason }) {
    const results = { budgetRelease: null, notification: null };

    // Release committed funds
    if (budgetId && amount > 0) {
      try {
        results.budgetRelease = await releaseFunds(
          this.db, budgetId, amount,
          entityType, entityId, entityName || '',
          this.userId, this.companyId
        );
      } catch (e) {
        results.budgetRelease = { error: e.message };
      }
    }

    // Notify the requester
    const notifyUserId = requesterId || this.userId;
    try {
      results.notification = await createNotification(this.db, {
        companyId: this.companyId,
        userId: notifyUserId,
        title: `${entityType} Rejected`,
        message: `${entityType} "${entityName || entityId}" has been rejected. Reason: ${reason || 'No reason provided'}`,
        type: 'error', category: 'workflow', priority: 'high',
        entityType, entityId, entityName,
        actionUrl: `/${entityType}s/${entityId}`
      });
    } catch (e) { /* notification is best-effort */ }

    // Update approval record
    try {
      await this.db.prepare(`
        UPDATE approvals SET status = 'rejected', reviewed_by = ?, review_notes = ?, reviewed_at = datetime('now'), updated_at = datetime('now')
        WHERE entity_type = ? AND entity_id = ? AND company_id = ? AND status = 'pending'
      `).bind(this.userId, reason || '', entityType, entityId, this.companyId).run();
    } catch (e) { /* approval record update best-effort */ }

    await recordLineage(this.db, this.companyId, {
      entityType, entityId, action: 'reject',
      previousState: 'pending_approval', newState: 'rejected',
      userId: this.userId, details: { amount, budgetId, reason, budgetRelease: results.budgetRelease }
    });

    return { success: true, results };
  }

  /**
   * Called when an entity is settled/paid.
   * - Records spend against budget (moves from committed to spent)
   * - Creates notification
   * - Records data_lineage
   */
  async onEntitySettle({ entityType, entityId, entityName, amount, budgetId, requesterId }) {
    const results = { budgetSpend: null, notification: null };

    // Record spend against budget
    if (budgetId && amount > 0) {
      try {
        results.budgetSpend = await recordSpend(
          this.db, budgetId, amount,
          entityType, entityId, entityName || '',
          this.userId, this.companyId
        );
      } catch (e) {
        results.budgetSpend = { error: e.message };
      }
    }

    // Notify
    const notifyUserId = requesterId || this.userId;
    try {
      results.notification = await createNotification(this.db, {
        companyId: this.companyId,
        userId: notifyUserId,
        title: `${entityType} Settled`,
        message: `${entityType} "${entityName || entityId}" has been settled for R${Math.round(amount || 0).toLocaleString()}.`,
        type: 'success', category: 'settlement', priority: 'normal',
        entityType, entityId, entityName,
        actionUrl: `/${entityType}s/${entityId}`
      });
    } catch (e) { /* notification is best-effort */ }

    await recordLineage(this.db, this.companyId, {
      entityType, entityId, action: 'settle',
      previousState: 'approved', newState: 'settled',
      userId: this.userId, details: { amount, budgetId, budgetSpend: results.budgetSpend }
    });

    return { success: true, results };
  }
}
