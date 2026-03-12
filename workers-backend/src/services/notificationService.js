const generateId = () => crypto.randomUUID();

export async function createNotification(db, companyId, { userId, type, title, message, entityType, entityId, priority }) {
  const id = generateId();
  const now = new Date().toISOString();

  try {
    await db.prepare(`
      INSERT INTO notifications (id, company_id, user_id, type, title, message, entity_type, entity_id, priority, read, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).bind(id, companyId, userId || null, type || 'info', title, message, entityType || null, entityId || null, priority || 'normal', now, now).run();
  } catch (e) {
    console.log('Notification insert error:', e.message);
  }

  return { id, type, title, message };
}

export async function notifyApprovalCreated(db, companyId, approval) {
  const notifications = [];

  if (approval.assigned_to) {
    notifications.push(await createNotification(db, companyId, {
      userId: approval.assigned_to,
      type: 'approval_request',
      title: 'New Approval Request',
      message: `${approval.entity_name || 'Item'} (R${(approval.amount || 0).toLocaleString()}) requires your approval`,
      entityType: 'approval',
      entityId: approval.id,
      priority: approval.priority || 'normal'
    }));
  }

  return notifications;
}

export async function notifyApprovalDecision(db, companyId, approval, decision, userId) {
  if (approval.requested_by) {
    return createNotification(db, companyId, {
      userId: approval.requested_by,
      type: `approval_${decision}`,
      title: `Approval ${decision === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `${approval.entity_name || 'Item'} has been ${decision}`,
      entityType: 'approval',
      entityId: approval.id,
      priority: 'high'
    });
  }
}

export async function notifyBudgetAlert(db, companyId, alert) {
  const admins = await db.prepare(
    "SELECT id FROM users WHERE company_id = ? AND role IN ('admin', 'super_admin', 'finance_manager') AND is_active = 1"
  ).bind(companyId).all();

  const notifications = [];
  for (const admin of (admins.results || [])) {
    notifications.push(await createNotification(db, companyId, {
      userId: admin.id,
      type: 'budget_alert',
      title: 'Budget Alert',
      message: alert.message,
      entityType: 'budget',
      entityId: alert.budget_id,
      priority: 'high'
    }));
  }
  return notifications;
}

export async function notifyPromotionStatusChange(db, companyId, promotion, newStatus) {
  if (promotion.created_by) {
    return createNotification(db, companyId, {
      userId: promotion.created_by,
      type: 'promotion_status',
      title: `Promotion ${newStatus}`,
      message: `"${promotion.name}" is now ${newStatus}`,
      entityType: 'promotion',
      entityId: promotion.id,
      priority: 'normal'
    });
  }
}
