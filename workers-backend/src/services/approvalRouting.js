import { createNotification } from './notifications.js';

export function getApprovalLevel(amount) {
  if (amount < 50000) return { level: 'manager', role: 'manager' };
  if (amount < 200000) return { level: 'director', role: 'admin' };
  return { level: 'executive', role: 'super_admin' };
}

export async function routeApproval(db, { companyId, entityType, entityId, entityName, amount, createdBy }) {
  const { level, role } = getApprovalLevel(amount);

  const approver = await db.prepare(
    "SELECT id FROM users WHERE company_id = ? AND role = ? AND is_active = 1 LIMIT 1"
  ).bind(companyId, role).first();

  const approverId = approver?.id || createdBy;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const slaDeadline = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

  await db.prepare(`
    INSERT INTO approvals (id, company_id, entity_type, entity_id, entity_name, amount, status, current_level, assigned_to, sla_deadline, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)
  `).bind(id, companyId, entityType, entityId, entityName, amount, level, approverId, slaDeadline, createdBy, now, now).run();

  await createNotification(db, {
    companyId, userId: approverId,
    title: `Approval Required: ${entityName}`,
    message: `R${Math.round(amount).toLocaleString()} ${entityType} requires your approval.`,
    type: 'warning', category: 'approval', priority: 'high',
    entityType: 'approval', entityId: id, actionUrl: `/approve/${id}`
  });

  return id;
}
