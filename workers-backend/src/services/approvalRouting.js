import { createNotification } from './notifications.js';

const generateId = () => crypto.randomUUID();

const THRESHOLDS = [
  { maxAmount: 50000, role: 'manager', label: 'Manager Approval' },
  { maxAmount: 200000, role: 'director', label: 'Director Approval' },
  { maxAmount: Infinity, role: 'executive', label: 'Executive Approval' }
];

export function getApprovalLevel(amount) {
  for (const t of THRESHOLDS) {
    if (amount <= t.maxAmount) return t;
  }
  return THRESHOLDS[THRESHOLDS.length - 1];
}

export async function routeApproval(db, companyId, { entityType, entityId, entityName, amount, requestedBy }) {
  const level = getApprovalLevel(amount);
  const now = new Date().toISOString();
  const slaHours = level.role === 'executive' ? 24 : level.role === 'director' ? 48 : 72;
  const dueDate = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();

  const approvers = await db.prepare(
    "SELECT id, first_name, last_name, role FROM users WHERE company_id = ? AND role = ? AND is_active = 1 LIMIT 5"
  ).bind(companyId, level.role).all();

  let assignedTo = null;
  if (approvers.results && approvers.results.length > 0) {
    assignedTo = approvers.results[0].id;
  } else {
    const fallback = await db.prepare(
      "SELECT id FROM users WHERE company_id = ? AND role IN ('admin', 'super_admin') AND is_active = 1 LIMIT 1"
    ).bind(companyId).first();
    if (fallback) assignedTo = fallback.id;
  }

  const id = generateId();
  await db.prepare(\`
    INSERT INTO approvals (id, company_id, entity_type, entity_id, entity_name, amount, status, priority, requested_by, requested_at, assigned_to, due_date, sla_hours, data, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?)
  \`).bind(
    id, companyId, entityType, entityId, entityName || '', amount,
    amount >= 200000 ? 'high' : 'normal',
    requestedBy, now, assignedTo, dueDate, slaHours,
    JSON.stringify({ approvalLevel: level.label, requiredRole: level.role }),
    now, now
  ).run();

  try {
    await createNotification(db, {
      companyId, userId: assignedTo,
      title: \`Approval Required: \${entityName}\`,
      message: \`R\${Math.round(amount).toLocaleString()} \${entityType} requires your approval.\`,
      type: 'warning', category: 'approval', priority: 'high',
      entityType: 'approval', entityId: id, actionUrl: \`/approve/\${id}\`
    });
  } catch (e) { console.log('Notification error:', e.message); }

  return {
    approvalId: id,
    level: level.label,
    requiredRole: level.role,
    assignedTo,
    slaHours,
    dueDate
  };
}

export async function checkEscalation(db, companyId) {
  const now = new Date().toISOString();
  const overdue = await db.prepare(\`
    SELECT * FROM approvals 
    WHERE company_id = ? AND status = 'pending' AND due_date < ? AND (escalated_to IS NULL OR escalated_to = '')
  \`).bind(companyId, now).all();

  const escalated = [];
  for (const approval of (overdue.results || [])) {
    const currentLevel = getApprovalLevel(approval.amount || 0);
    let nextRole = 'executive';
    if (currentLevel.role === 'manager') nextRole = 'director';

    const nextApprover = await db.prepare(
      "SELECT id FROM users WHERE company_id = ? AND role = ? AND is_active = 1 LIMIT 1"
    ).bind(companyId, nextRole).first();

    if (nextApprover) {
      await db.prepare(\`
        UPDATE approvals SET escalated_to = ?, escalated_at = ?, updated_at = ?, priority = 'urgent'
        WHERE id = ?
      \`).bind(nextApprover.id, now, now, approval.id).run();
      escalated.push({ approvalId: approval.id, escalatedTo: nextApprover.id, role: nextRole });
    }
  }

  return { escalated, count: escalated.length };
}
