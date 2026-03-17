import { createNotification } from './notifications.js';

const generateId = () => crypto.randomUUID();

const DEFAULT_THRESHOLDS = [
  { maxAmount: 50000, role: 'manager', slaHours: 24 },
  { maxAmount: 200000, role: 'admin', slaHours: 48 },
  { maxAmount: Infinity, role: 'super_admin', slaHours: 72 }
];

export function getApprovalLevel(amount, thresholds) {
  const levels = thresholds || DEFAULT_THRESHOLDS;
  for (const t of levels) {
    if (amount <= t.maxAmount) return t;
  }
  return levels[levels.length - 1];
}

export async function routeApproval(db, entityType, entityId, amount, companyId, requesterId) {
  // Support legacy call signature: routeApproval(db, companyId, { entityType, ... })
  if (typeof entityType === 'string' && entityType.startsWith('comp')) {
    const legacyCompanyId = entityType;
    const opts = entityId;
    return routeApproval(db, opts.entityType, opts.entityId, opts.amount, legacyCompanyId, opts.requestedBy);
  }

  // Load company approval rules from system_config
  let thresholds = null;
  try {
    const rules = await db.prepare(
      "SELECT data FROM system_config WHERE company_id = ? AND config_key = 'approval_thresholds'"
    ).bind(companyId).first();
    if (rules?.data) {
      const parsed = JSON.parse(rules.data);
      thresholds = parsed[entityType] || null;
    }
  } catch (e) { /* use defaults */ }

  const level = getApprovalLevel(amount, thresholds);
  const now = new Date().toISOString();
  const slaDeadline = new Date(Date.now() + level.slaHours * 3600000).toISOString();

  // Find approver by role
  const approver = await db.prepare(
    'SELECT id, first_name, last_name FROM users WHERE company_id = ? AND role = ? AND is_active = 1 ORDER BY RANDOM() LIMIT 1'
  ).bind(companyId, level.role).first();

  let assignedTo = approver?.id || null;
  if (!assignedTo) {
    // Fallback to admin
    const fallback = await db.prepare(
      "SELECT id FROM users WHERE company_id = ? AND role IN ('admin', 'super_admin') AND is_active = 1 LIMIT 1"
    ).bind(companyId).first();
    if (fallback) assignedTo = fallback.id;
  }

  if (!assignedTo) throw new Error(`No active ${level.role} found for approval`);

  const approvalId = generateId();
  await db.prepare(`
    INSERT INTO approvals (id, company_id, entity_type, entity_id, entity_name, status, current_level, assigned_to, requested_by, amount, sla_deadline, data, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(approvalId, companyId, entityType, entityId, '', level.role, assignedTo, requesterId, amount, slaDeadline, JSON.stringify({ thresholdRule: level })).run();

  try {
    await createNotification(db, {
      companyId, userId: assignedTo,
      title: `Approval Required`,
      message: `R${Math.round(amount).toLocaleString()} ${entityType} requires your approval.`,
      type: 'warning', category: 'approval', priority: 'high',
      entityType: 'approval', entityId: approvalId, actionUrl: `/approve/${approvalId}`
    });
  } catch (e) { /* notification optional */ }

  return { approvalId, assignedTo, level: level.role, slaDeadline };
}

export async function checkEscalation(db, companyId) {
  const now = new Date().toISOString();
  const overdue = await db.prepare(`
    SELECT * FROM approvals 
    WHERE company_id = ? AND status = 'pending' AND due_date < ? AND (escalated_to IS NULL OR escalated_to = '')
  `).bind(companyId, now).all();

  const escalated = [];
  for (const approval of (overdue.results || [])) {
    const currentLevel = getApprovalLevel(approval.amount || 0);
    let nextRole = 'executive';
    if (currentLevel.role === 'manager') nextRole = 'director';

    const nextApprover = await db.prepare(
      "SELECT id FROM users WHERE company_id = ? AND role = ? AND is_active = 1 LIMIT 1"
    ).bind(companyId, nextRole).first();

    if (nextApprover) {
      await db.prepare(`
        UPDATE approvals SET escalated_to = ?, escalated_at = ?, updated_at = ?, priority = 'urgent'
        WHERE id = ?
      `).bind(nextApprover.id, now, now, approval.id).run();
      escalated.push({ approvalId: approval.id, escalatedTo: nextApprover.id, role: nextRole });
    }
  }

  return { escalated, count: escalated.length };
}
