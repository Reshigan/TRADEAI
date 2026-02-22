import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const complianceAudit = new Hono();

complianceAudit.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
};

const getUserId = (c) => {
  return c.get('userId') || null;
};

// ── COMPLIANCE RULES ─────────────────────────────────────────────────

complianceAudit.get('/rules', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, category, entity_type, severity, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM compliance_rules WHERE company_id = ?';
    const params = [companyId];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (entity_type) { query += ' AND entity_type = ?'; params.push(entity_type); }
    if (severity) { query += ' AND severity = ?'; params.push(severity); }

    query += ' ORDER BY severity DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM compliance_rules WHERE company_id = ?').bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching compliance rules:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

complianceAudit.get('/rules/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const rule = await db.prepare('SELECT * FROM compliance_rules WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!rule) return c.json({ success: false, message: 'Rule not found' }, 404);

    return c.json({ success: true, data: rowToDocument(rule) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

complianceAudit.post('/rules', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = getUserId(c);
    const id = generateId();
    const now = new Date().toISOString();

    if (!body.name || !body.entityType) {
      return c.json({ success: false, message: 'Name and entity type are required' }, 400);
    }

    await db.prepare(`
      INSERT INTO compliance_rules (
        id, company_id, name, description, rule_type, category, severity, status,
        entity_type, field_name, operator, threshold_value, threshold_min, threshold_max,
        action_on_violation, auto_enforce, notification_roles, escalation_hours,
        effective_date, expiry_date, is_active, created_by, notes, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId,
      body.name,
      body.description || null,
      body.ruleType || body.rule_type || 'threshold',
      body.category || 'general',
      body.severity || 'medium',
      body.entityType || body.entity_type,
      body.fieldName || body.field_name || null,
      body.operator || 'greater_than',
      body.thresholdValue || body.threshold_value || null,
      body.thresholdMin || body.threshold_min || null,
      body.thresholdMax || body.threshold_max || null,
      body.actionOnViolation || body.action_on_violation || 'flag',
      body.autoEnforce || body.auto_enforce ? 1 : 0,
      body.notificationRoles || body.notification_roles || null,
      parseInt(body.escalationHours || body.escalation_hours) || 24,
      body.effectiveDate || body.effective_date || null,
      body.expiryDate || body.expiry_date || null,
      userId,
      body.notes || null,
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM compliance_rules WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    console.error('Error creating compliance rule:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

complianceAudit.put('/rules/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM compliance_rules WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Rule not found' }, 404);

    await db.prepare(`
      UPDATE compliance_rules SET
        name = ?, description = ?, rule_type = ?, category = ?, severity = ?, status = ?,
        entity_type = ?, field_name = ?, operator = ?,
        threshold_value = ?, threshold_min = ?, threshold_max = ?,
        action_on_violation = ?, auto_enforce = ?, notification_roles = ?, escalation_hours = ?,
        effective_date = ?, expiry_date = ?, is_active = ?,
        notes = ?, data = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.name || existing.name,
      body.description ?? existing.description,
      body.ruleType || body.rule_type || existing.rule_type,
      body.category || existing.category,
      body.severity || existing.severity,
      body.status || existing.status,
      body.entityType || body.entity_type || existing.entity_type,
      body.fieldName || body.field_name ?? existing.field_name,
      body.operator || existing.operator,
      body.thresholdValue || body.threshold_value ?? existing.threshold_value,
      body.thresholdMin || body.threshold_min ?? existing.threshold_min,
      body.thresholdMax || body.threshold_max ?? existing.threshold_max,
      body.actionOnViolation || body.action_on_violation || existing.action_on_violation,
      (body.autoEnforce !== undefined ? body.autoEnforce : (body.auto_enforce !== undefined ? body.auto_enforce : existing.auto_enforce)) ? 1 : 0,
      body.notificationRoles || body.notification_roles ?? existing.notification_roles,
      parseInt(body.escalationHours || body.escalation_hours) || existing.escalation_hours,
      body.effectiveDate || body.effective_date ?? existing.effective_date,
      body.expiryDate || body.expiry_date ?? existing.expiry_date,
      (body.isActive !== undefined ? body.isActive : (body.is_active !== undefined ? body.is_active : existing.is_active)) ? 1 : 0,
      body.notes ?? existing.notes,
      JSON.stringify(body.data || JSON.parse(existing.data || '{}')),
      now, id
    ).run();

    const updated = await db.prepare('SELECT * FROM compliance_rules WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error updating compliance rule:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

complianceAudit.delete('/rules/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const existing = await db.prepare('SELECT * FROM compliance_rules WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Rule not found' }, 404);

    await db.prepare('DELETE FROM compliance_violations WHERE rule_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM compliance_rules WHERE id = ?').bind(id).run();

    return c.json({ success: true, message: 'Rule deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── AUDIT TRAILS ─────────────────────────────────────────────────────

complianceAudit.get('/audit-trails', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { entity_type, entity_id, user_id, action_type, flagged, start_date, end_date, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM audit_trails WHERE company_id = ?';
    const params = [companyId];

    if (entity_type) { query += ' AND entity_type = ?'; params.push(entity_type); }
    if (entity_id) { query += ' AND entity_id = ?'; params.push(entity_id); }
    if (user_id) { query += ' AND user_id = ?'; params.push(user_id); }
    if (action_type) { query += ' AND action_type = ?'; params.push(action_type); }
    if (flagged === '1') { query += ' AND flagged = 1'; }
    if (start_date) { query += ' AND created_at >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND created_at <= ?'; params.push(end_date); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM audit_trails WHERE company_id = ?').bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching audit trails:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

complianceAudit.get('/audit-trails/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const trail = await db.prepare('SELECT * FROM audit_trails WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!trail) return c.json({ success: false, message: 'Audit trail not found' }, 404);

    return c.json({ success: true, data: rowToDocument(trail) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

complianceAudit.post('/audit-trails', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = getUserId(c);
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO audit_trails (
        id, company_id, entity_type, entity_id, entity_name,
        action, action_type, field_name, old_value, new_value, change_reason,
        user_id, user_name, user_role, ip_address, session_id,
        approval_id, compliance_rule_id, risk_score, flagged, flag_reason,
        data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId,
      body.entityType || body.entity_type,
      body.entityId || body.entity_id,
      body.entityName || body.entity_name || null,
      body.action,
      body.actionType || body.action_type || 'update',
      body.fieldName || body.field_name || null,
      body.oldValue || body.old_value || null,
      body.newValue || body.new_value || null,
      body.changeReason || body.change_reason || null,
      body.userId || body.user_id || userId,
      body.userName || body.user_name || null,
      body.userRole || body.user_role || null,
      body.ipAddress || body.ip_address || null,
      body.sessionId || body.session_id || null,
      body.approvalId || body.approval_id || null,
      body.complianceRuleId || body.compliance_rule_id || null,
      parseInt(body.riskScore || body.risk_score) || 0,
      (body.flagged) ? 1 : 0,
      body.flagReason || body.flag_reason || null,
      JSON.stringify(body.data || {}),
      now
    ).run();

    const created = await db.prepare('SELECT * FROM audit_trails WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    console.error('Error creating audit trail:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

complianceAudit.post('/audit-trails/:id/review', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const userId = getUserId(c);
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM audit_trails WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Audit trail not found' }, 404);

    await db.prepare('UPDATE audit_trails SET reviewed = 1, reviewed_by = ?, reviewed_at = ? WHERE id = ?')
      .bind(userId, now, id).run();

    const updated = await db.prepare('SELECT * FROM audit_trails WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── COMPLIANCE VIOLATIONS ────────────────────────────────────────────

complianceAudit.get('/violations', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, severity, entity_type, rule_id, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM compliance_violations WHERE company_id = ?';
    const params = [companyId];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (severity) { query += ' AND severity = ?'; params.push(severity); }
    if (entity_type) { query += ' AND entity_type = ?'; params.push(entity_type); }
    if (rule_id) { query += ' AND rule_id = ?'; params.push(rule_id); }

    query += ' ORDER BY severity DESC, detected_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM compliance_violations WHERE company_id = ?').bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching violations:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

complianceAudit.get('/violations/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const violation = await db.prepare('SELECT * FROM compliance_violations WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!violation) return c.json({ success: false, message: 'Violation not found' }, 404);

    return c.json({ success: true, data: rowToDocument(violation) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

complianceAudit.post('/violations/:id/resolve', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const userId = getUserId(c);
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM compliance_violations WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Violation not found' }, 404);

    await db.prepare(`
      UPDATE compliance_violations SET
        status = 'resolved', resolved_by = ?, resolved_at = ?,
        resolution_notes = ?, resolution_action = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      userId, now,
      body.resolutionNotes || body.resolution_notes || null,
      body.resolutionAction || body.resolution_action || 'acknowledged',
      now, id
    ).run();

    const updated = await db.prepare('SELECT * FROM compliance_violations WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

complianceAudit.post('/violations/:id/escalate', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM compliance_violations WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Violation not found' }, 404);

    await db.prepare(`
      UPDATE compliance_violations SET
        status = 'escalated', escalated = 1, escalated_to = ?, escalated_at = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.escalatedTo || body.escalated_to || null,
      now, now, id
    ).run();

    const updated = await db.prepare('SELECT * FROM compliance_violations WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── COMPLIANCE CHECK ENGINE ──────────────────────────────────────────

complianceAudit.post('/check', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = getUserId(c);
    const now = new Date().toISOString();

    const entityType = body.entityType || body.entity_type;
    if (!entityType) {
      return c.json({ success: false, message: 'Entity type is required' }, 400);
    }

    const rulesResult = await db.prepare(
      'SELECT * FROM compliance_rules WHERE company_id = ? AND entity_type = ? AND is_active = 1 AND status = ?'
    ).bind(companyId, entityType, 'active').all();

    const rules = rulesResult.results || [];
    const violations = [];

    let entityQuery = '';
    if (entityType === 'promotion') entityQuery = 'SELECT * FROM promotions WHERE company_id = ? AND status != ?';
    else if (entityType === 'budget') entityQuery = 'SELECT * FROM budgets WHERE company_id = ? AND status != ?';
    else if (entityType === 'claim') entityQuery = 'SELECT * FROM claims WHERE company_id = ? AND status != ?';
    else if (entityType === 'deduction') entityQuery = 'SELECT * FROM deductions WHERE company_id = ? AND status != ?';
    else if (entityType === 'settlement') entityQuery = 'SELECT * FROM settlements WHERE company_id = ? AND status != ?';
    else if (entityType === 'trade_spend') entityQuery = 'SELECT * FROM trade_spends WHERE company_id = ? AND status != ?';

    if (!entityQuery) {
      return c.json({ success: true, data: { checked: 0, violations: 0 }, message: 'No entity query for type' });
    }

    const entitiesResult = await db.prepare(entityQuery).bind(companyId, 'cancelled').all();
    const entities = entitiesResult.results || [];

    for (const entity of entities) {
      for (const rule of rules) {
        const fieldValue = entity[rule.field_name];
        if (fieldValue === undefined || fieldValue === null) continue;

        let violated = false;
        const numValue = parseFloat(fieldValue) || 0;
        const thresholdNum = parseFloat(rule.threshold_value) || 0;
        const minNum = parseFloat(rule.threshold_min) || 0;
        const maxNum = parseFloat(rule.threshold_max) || 0;

        switch (rule.operator) {
          case 'greater_than':
            violated = numValue > thresholdNum;
            break;
          case 'less_than':
            violated = numValue < thresholdNum;
            break;
          case 'equals':
            violated = String(fieldValue) === String(rule.threshold_value);
            break;
          case 'not_equals':
            violated = String(fieldValue) !== String(rule.threshold_value);
            break;
          case 'between':
            violated = numValue < minNum || numValue > maxNum;
            break;
          case 'exceeds_pct':
            if (thresholdNum > 0) {
              const pctDiff = ((numValue - thresholdNum) / thresholdNum) * 100;
              violated = pctDiff > (parseFloat(rule.threshold_max) || 10);
            }
            break;
        }

        if (violated) {
          const violationId = generateId();
          const variance = numValue - thresholdNum;
          const variancePct = thresholdNum > 0 ? ((variance / thresholdNum) * 100) : 0;

          await db.prepare(`
            INSERT INTO compliance_violations (
              id, company_id, rule_id, rule_name, entity_type, entity_id, entity_name,
              violation_type, severity, status, description, field_name,
              expected_value, actual_value, variance_amount, variance_pct,
              detected_at, detected_by, risk_score, financial_impact,
              data, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'threshold_breach', ?, 'open', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            violationId, companyId, rule.id, rule.name,
            entityType, entity.id, entity.name || entity.claim_number || entity.deduction_number || 'Unknown',
            rule.severity,
            `${rule.field_name} ${rule.operator} threshold: expected ${rule.threshold_value}, actual ${fieldValue}`,
            rule.field_name,
            String(rule.threshold_value || ''),
            String(fieldValue),
            variance, variancePct,
            now, userId || 'system',
            rule.severity === 'critical' ? 90 : (rule.severity === 'high' ? 70 : (rule.severity === 'medium' ? 50 : 30)),
            Math.abs(variance),
            JSON.stringify({}), now, now
          ).run();

          violations.push({ ruleId: rule.id, ruleName: rule.name, entityId: entity.id, severity: rule.severity });

          await db.prepare('UPDATE compliance_rules SET violation_count = violation_count + 1, last_violation_at = ? WHERE id = ?')
            .bind(now, rule.id).run();
        }
      }
    }

    return c.json({
      success: true,
      data: {
        entityType,
        entitiesChecked: entities.length,
        rulesEvaluated: rules.length,
        violationsFound: violations.length,
        violations
      }
    });
  } catch (error) {
    console.error('Error running compliance check:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── COMPLIANCE REPORTS ───────────────────────────────────────────────

complianceAudit.get('/reports', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { report_type, status, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM compliance_reports WHERE company_id = ?';
    const params = [companyId];

    if (report_type) { query += ' AND report_type = ?'; params.push(report_type); }
    if (status) { query += ' AND status = ?'; params.push(status); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument)
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

complianceAudit.post('/reports/generate', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = getUserId(c);
    const id = generateId();
    const now = new Date().toISOString();

    const periodStart = body.periodStart || body.period_start || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const periodEnd = body.periodEnd || body.period_end || now.split('T')[0];

    const ruleStats = await db.prepare(`
      SELECT COUNT(*) as total, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
      FROM compliance_rules WHERE company_id = ?
    `).bind(companyId).first();

    const violationStats = await db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_count,
        AVG(risk_score) as avg_risk,
        SUM(financial_impact) as total_impact
      FROM compliance_violations WHERE company_id = ? AND detected_at >= ? AND detected_at <= ?
    `).bind(companyId, periodStart, periodEnd + 'T23:59:59').first();

    const auditStats = await db.prepare(`
      SELECT COUNT(*) as total, SUM(CASE WHEN flagged = 1 THEN 1 ELSE 0 END) as flagged_count
      FROM audit_trails WHERE company_id = ? AND created_at >= ? AND created_at <= ?
    `).bind(companyId, periodStart, periodEnd + 'T23:59:59').first();

    const totalViolations = violationStats?.total || 0;
    const resolvedViolations = violationStats?.resolved_count || 0;
    const complianceScore = totalViolations > 0 ? Math.round((resolvedViolations / totalViolations) * 100) : 100;

    await db.prepare(`
      INSERT INTO compliance_reports (
        id, company_id, name, description, report_type, status,
        period_start, period_end,
        total_rules, active_rules, total_violations, open_violations,
        resolved_violations, critical_violations, total_audits, flagged_audits,
        avg_risk_score, total_financial_impact, compliance_score,
        generated_at, generated_by, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'generated', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId,
      body.name || `Compliance Report ${periodStart} to ${periodEnd}`,
      body.description || null,
      body.reportType || body.report_type || 'summary',
      periodStart, periodEnd,
      ruleStats?.total || 0,
      ruleStats?.active || 0,
      totalViolations,
      violationStats?.open_count || 0,
      resolvedViolations,
      violationStats?.critical_count || 0,
      auditStats?.total || 0,
      auditStats?.flagged_count || 0,
      Math.round(violationStats?.avg_risk || 0),
      violationStats?.total_impact || 0,
      complianceScore,
      now, userId,
      JSON.stringify({}), now, now
    ).run();

    const created = await db.prepare('SELECT * FROM compliance_reports WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    console.error('Error generating compliance report:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── SUMMARY / DASHBOARD ─────────────────────────────────────────────

complianceAudit.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);

    const ruleStats = await db.prepare(`
      SELECT COUNT(*) as total, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
      FROM compliance_rules WHERE company_id = ?
    `).bind(companyId).first();

    const violationStats = await db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
        SUM(CASE WHEN status = 'escalated' THEN 1 ELSE 0 END) as escalated_count,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_count,
        SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high_count,
        AVG(risk_score) as avg_risk,
        SUM(financial_impact) as total_impact
      FROM compliance_violations WHERE company_id = ?
    `).bind(companyId).first();

    const auditStats = await db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN flagged = 1 THEN 1 ELSE 0 END) as flagged_count,
        SUM(CASE WHEN reviewed = 0 AND flagged = 1 THEN 1 ELSE 0 END) as pending_review
      FROM audit_trails WHERE company_id = ?
    `).bind(companyId).first();

    const totalV = violationStats?.total || 0;
    const resolvedV = violationStats?.resolved_count || 0;
    const complianceScore = totalV > 0 ? Math.round((resolvedV / totalV) * 100) : 100;

    return c.json({
      success: true,
      data: {
        rules: { total: ruleStats?.total || 0, active: ruleStats?.active || 0 },
        violations: {
          total: totalV,
          open: violationStats?.open_count || 0,
          resolved: resolvedV,
          escalated: violationStats?.escalated_count || 0,
          critical: violationStats?.critical_count || 0,
          high: violationStats?.high_count || 0,
          avgRiskScore: Math.round(violationStats?.avg_risk || 0),
          totalFinancialImpact: violationStats?.total_impact || 0
        },
        audits: {
          total: auditStats?.total || 0,
          flagged: auditStats?.flagged_count || 0,
          pendingReview: auditStats?.pending_review || 0
        },
        complianceScore
      }
    });
  } catch (error) {
    console.error('Error fetching compliance summary:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

complianceAudit.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      ruleTypes: [
        { value: 'threshold', label: 'Threshold Check' },
        { value: 'range', label: 'Range Validation' },
        { value: 'mandatory', label: 'Mandatory Field' },
        { value: 'approval', label: 'Approval Required' },
        { value: 'segregation', label: 'Segregation of Duties' },
        { value: 'duplicate', label: 'Duplicate Detection' }
      ],
      categories: [
        { value: 'general', label: 'General' },
        { value: 'financial', label: 'Financial Controls' },
        { value: 'approval', label: 'Approval Workflow' },
        { value: 'data_quality', label: 'Data Quality' },
        { value: 'regulatory', label: 'Regulatory' },
        { value: 'sod', label: 'Segregation of Duties' }
      ],
      severities: [
        { value: 'critical', label: 'Critical' },
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' }
      ],
      entityTypes: [
        { value: 'promotion', label: 'Promotion' },
        { value: 'budget', label: 'Budget' },
        { value: 'claim', label: 'Claim' },
        { value: 'deduction', label: 'Deduction' },
        { value: 'settlement', label: 'Settlement' },
        { value: 'trade_spend', label: 'Trade Spend' },
        { value: 'accrual', label: 'Accrual' }
      ],
      operators: [
        { value: 'greater_than', label: 'Greater Than' },
        { value: 'less_than', label: 'Less Than' },
        { value: 'equals', label: 'Equals' },
        { value: 'not_equals', label: 'Not Equals' },
        { value: 'between', label: 'Between (Range)' },
        { value: 'exceeds_pct', label: 'Exceeds by %' }
      ],
      actions: [
        { value: 'flag', label: 'Flag for Review' },
        { value: 'block', label: 'Block Transaction' },
        { value: 'notify', label: 'Send Notification' },
        { value: 'escalate', label: 'Auto-Escalate' },
        { value: 'require_approval', label: 'Require Approval' }
      ],
      violationStatuses: [
        { value: 'open', label: 'Open' },
        { value: 'in_review', label: 'In Review' },
        { value: 'escalated', label: 'Escalated' },
        { value: 'resolved', label: 'Resolved' },
        { value: 'waived', label: 'Waived' }
      ]
    }
  });
});

export const complianceAuditRoutes = complianceAudit;
