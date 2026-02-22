import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const workflowAutomation = new Hono();

workflowAutomation.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
};

const getUserId = (c) => {
  return c.get('userId') || null;
};

// ── WORKFLOW TEMPLATES ───────────────────────────────────────────────

workflowAutomation.get('/templates', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, workflow_type, trigger_entity, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM workflow_templates WHERE company_id = ?';
    const params = [companyId];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (workflow_type) { query += ' AND workflow_type = ?'; params.push(workflow_type); }
    if (trigger_entity) { query += ' AND trigger_entity = ?'; params.push(trigger_entity); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM workflow_templates WHERE company_id = ?').bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

workflowAutomation.get('/templates/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const template = await db.prepare('SELECT * FROM workflow_templates WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!template) return c.json({ success: false, message: 'Template not found' }, 404);

    return c.json({ success: true, data: rowToDocument(template) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

workflowAutomation.post('/templates', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = getUserId(c);
    const id = generateId();
    const now = new Date().toISOString();

    if (!body.name || !body.triggerEntity) {
      return c.json({ success: false, message: 'Name and trigger entity are required' }, 400);
    }

    await db.prepare(`
      INSERT INTO workflow_templates (
        id, company_id, name, description, workflow_type, category, status,
        trigger_entity, trigger_event, trigger_conditions, steps_json,
        sla_hours, escalation_enabled, escalation_after_hours, escalation_to,
        notification_enabled, auto_approve_below, require_all_approvers,
        max_retries, is_active, created_by, notes, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId,
      body.name,
      body.description || null,
      body.workflowType || body.workflow_type || 'approval',
      body.category || 'general',
      body.triggerEntity || body.trigger_entity,
      body.triggerEvent || body.trigger_event || 'created',
      body.triggerConditions || body.trigger_conditions || null,
      JSON.stringify(body.steps || body.stepsJson || []),
      parseInt(body.slaHours || body.sla_hours) || 24,
      (body.escalationEnabled || body.escalation_enabled) ? 1 : 0,
      parseInt(body.escalationAfterHours || body.escalation_after_hours) || 48,
      body.escalationTo || body.escalation_to || null,
      (body.notificationEnabled !== undefined ? body.notificationEnabled : (body.notification_enabled !== undefined ? body.notification_enabled : true)) ? 1 : 0,
      body.autoApproveBelow || body.auto_approve_below ? parseFloat(body.autoApproveBelow || body.auto_approve_below) : null,
      (body.requireAllApprovers || body.require_all_approvers) ? 1 : 0,
      parseInt(body.maxRetries || body.max_retries) || 3,
      userId,
      body.notes || null,
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM workflow_templates WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

workflowAutomation.put('/templates/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM workflow_templates WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Template not found' }, 404);

    await db.prepare(`
      UPDATE workflow_templates SET
        name = ?, description = ?, workflow_type = ?, category = ?, status = ?,
        trigger_entity = ?, trigger_event = ?, trigger_conditions = ?, steps_json = ?,
        sla_hours = ?, escalation_enabled = ?, escalation_after_hours = ?, escalation_to = ?,
        notification_enabled = ?, auto_approve_below = ?, require_all_approvers = ?,
        max_retries = ?, is_active = ?, notes = ?, data = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.name || existing.name,
      body.description ?? existing.description,
      body.workflowType || body.workflow_type || existing.workflow_type,
      body.category || existing.category,
      body.status || existing.status,
      body.triggerEntity || body.trigger_entity || existing.trigger_entity,
      body.triggerEvent || body.trigger_event || existing.trigger_event,
      body.triggerConditions || body.trigger_conditions ?? existing.trigger_conditions,
      body.steps ? JSON.stringify(body.steps) : (body.stepsJson ? JSON.stringify(body.stepsJson) : existing.steps_json),
      parseInt(body.slaHours || body.sla_hours) || existing.sla_hours,
      (body.escalationEnabled !== undefined ? body.escalationEnabled : (body.escalation_enabled !== undefined ? body.escalation_enabled : existing.escalation_enabled)) ? 1 : 0,
      parseInt(body.escalationAfterHours || body.escalation_after_hours) || existing.escalation_after_hours,
      body.escalationTo || body.escalation_to ?? existing.escalation_to,
      (body.notificationEnabled !== undefined ? body.notificationEnabled : (body.notification_enabled !== undefined ? body.notification_enabled : existing.notification_enabled)) ? 1 : 0,
      body.autoApproveBelow || body.auto_approve_below ?? existing.auto_approve_below,
      (body.requireAllApprovers !== undefined ? body.requireAllApprovers : (body.require_all_approvers !== undefined ? body.require_all_approvers : existing.require_all_approvers)) ? 1 : 0,
      parseInt(body.maxRetries || body.max_retries) || existing.max_retries,
      (body.isActive !== undefined ? body.isActive : (body.is_active !== undefined ? body.is_active : existing.is_active)) ? 1 : 0,
      body.notes ?? existing.notes,
      JSON.stringify(body.data || JSON.parse(existing.data || '{}')),
      now, id
    ).run();

    const updated = await db.prepare('SELECT * FROM workflow_templates WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

workflowAutomation.delete('/templates/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const existing = await db.prepare('SELECT * FROM workflow_templates WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Template not found' }, 404);

    await db.prepare('DELETE FROM workflow_steps WHERE instance_id IN (SELECT id FROM workflow_instances WHERE template_id = ? AND company_id = ?)').bind(id, companyId).run();
    await db.prepare('DELETE FROM workflow_instances WHERE template_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM workflow_templates WHERE id = ?').bind(id).run();

    return c.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── WORKFLOW INSTANCES ───────────────────────────────────────────────

workflowAutomation.get('/instances', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, entity_type, template_id, priority, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM workflow_instances WHERE company_id = ?';
    const params = [companyId];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (entity_type) { query += ' AND entity_type = ?'; params.push(entity_type); }
    if (template_id) { query += ' AND template_id = ?'; params.push(template_id); }
    if (priority) { query += ' AND priority = ?'; params.push(priority); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM workflow_instances WHERE company_id = ?').bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

workflowAutomation.get('/instances/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const instance = await db.prepare('SELECT * FROM workflow_instances WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!instance) return c.json({ success: false, message: 'Instance not found' }, 404);

    const stepsResult = await db.prepare('SELECT * FROM workflow_steps WHERE instance_id = ? ORDER BY step_number').bind(id).all();

    return c.json({
      success: true,
      data: {
        ...rowToDocument(instance),
        steps: (stepsResult.results || []).map(rowToDocument)
      }
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── TRIGGER WORKFLOW ─────────────────────────────────────────────────

workflowAutomation.post('/trigger', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = getUserId(c);
    const now = new Date().toISOString();

    const templateId = body.templateId || body.template_id;
    if (!templateId) {
      return c.json({ success: false, message: 'Template ID is required' }, 400);
    }

    const template = await db.prepare('SELECT * FROM workflow_templates WHERE id = ? AND company_id = ? AND is_active = 1').bind(templateId, companyId).first();
    if (!template) return c.json({ success: false, message: 'Template not found or inactive' }, 404);

    const instanceId = generateId();
    const steps = JSON.parse(template.steps_json || '[]');
    const slaDeadline = new Date(Date.now() + (template.sla_hours || 24) * 3600000).toISOString();

    await db.prepare(`
      INSERT INTO workflow_instances (
        id, company_id, template_id, template_name, workflow_type, status,
        entity_type, entity_id, entity_name, entity_amount, current_step, total_steps,
        priority, initiated_by, initiated_at, sla_deadline,
        data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      instanceId, companyId, templateId, template.name, template.workflow_type,
      body.entityType || body.entity_type || template.trigger_entity,
      body.entityId || body.entity_id,
      body.entityName || body.entity_name || null,
      parseFloat(body.entityAmount || body.entity_amount) || 0,
      steps.length,
      body.priority || 'normal',
      userId, now, slaDeadline,
      JSON.stringify(body.data || {}), now, now
    ).run();

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepId = generateId();
      const stepSlaDeadline = new Date(Date.now() + (step.slaHours || template.sla_hours || 24) * 3600000).toISOString();

      await db.prepare(`
        INSERT INTO workflow_steps (
          id, company_id, instance_id, template_id, step_number, step_type, step_name,
          status, assigned_to, assigned_role, assigned_at, condition_expression,
          sla_hours, sla_deadline, data, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        stepId, companyId, instanceId, templateId, i + 1,
        step.type || 'approval',
        step.name || `Step ${i + 1}`,
        i === 0 ? 'active' : 'pending',
        step.assignedTo || null,
        step.assignedRole || null,
        i === 0 ? now : null,
        step.condition || null,
        parseInt(step.slaHours) || template.sla_hours || 24,
        stepSlaDeadline,
        JSON.stringify(step.data || {}), now, now
      ).run();
    }

    await db.prepare('UPDATE workflow_templates SET usage_count = usage_count + 1, last_triggered_at = ? WHERE id = ?')
      .bind(now, templateId).run();

    const created = await db.prepare('SELECT * FROM workflow_instances WHERE id = ?').bind(instanceId).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── STEP ACTIONS ─────────────────────────────────────────────────────

workflowAutomation.post('/steps/:id/approve', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const userId = getUserId(c);
    const now = new Date().toISOString();

    const step = await db.prepare('SELECT * FROM workflow_steps WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!step) return c.json({ success: false, message: 'Step not found' }, 404);
    if (step.status !== 'active') return c.json({ success: false, message: 'Step is not active' }, 400);

    await db.prepare(`
      UPDATE workflow_steps SET status = 'approved', action_taken = 'approved',
      action_by = ?, action_at = ?, action_notes = ?, updated_at = ? WHERE id = ?
    `).bind(userId, now, body.notes || null, now, id).run();

    const nextStep = await db.prepare(
      'SELECT * FROM workflow_steps WHERE instance_id = ? AND step_number = ? AND company_id = ?'
    ).bind(step.instance_id, step.step_number + 1, companyId).first();

    if (nextStep) {
      await db.prepare('UPDATE workflow_steps SET status = ?, assigned_at = ?, updated_at = ? WHERE id = ?')
        .bind('active', now, now, nextStep.id).run();
      await db.prepare('UPDATE workflow_instances SET current_step = ?, updated_at = ? WHERE id = ?')
        .bind(step.step_number, now, step.instance_id).run();
    } else {
      const startTime = await db.prepare('SELECT initiated_at FROM workflow_instances WHERE id = ?').bind(step.instance_id).first();
      const processingTime = startTime ? Date.now() - new Date(startTime.initiated_at).getTime() : 0;

      await db.prepare(`
        UPDATE workflow_instances SET status = 'completed', current_step = total_steps,
        completed_at = ?, completed_by = ?, outcome = 'approved', processing_time_ms = ?, updated_at = ? WHERE id = ?
      `).bind(now, userId, processingTime, now, step.instance_id).run();
    }

    return c.json({ success: true, message: 'Step approved' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

workflowAutomation.post('/steps/:id/reject', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const userId = getUserId(c);
    const now = new Date().toISOString();

    const step = await db.prepare('SELECT * FROM workflow_steps WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!step) return c.json({ success: false, message: 'Step not found' }, 404);
    if (step.status !== 'active') return c.json({ success: false, message: 'Step is not active' }, 400);

    await db.prepare(`
      UPDATE workflow_steps SET status = 'rejected', action_taken = 'rejected',
      action_by = ?, action_at = ?, action_notes = ?, updated_at = ? WHERE id = ?
    `).bind(userId, now, body.notes || body.reason || null, now, id).run();

    const startTime = await db.prepare('SELECT initiated_at FROM workflow_instances WHERE id = ?').bind(step.instance_id).first();
    const processingTime = startTime ? Date.now() - new Date(startTime.initiated_at).getTime() : 0;

    await db.prepare(`
      UPDATE workflow_instances SET status = 'rejected', completed_at = ?, completed_by = ?,
      outcome = 'rejected', outcome_notes = ?, processing_time_ms = ?, updated_at = ? WHERE id = ?
    `).bind(now, userId, body.notes || body.reason || null, processingTime, now, step.instance_id).run();

    return c.json({ success: true, message: 'Step rejected' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

workflowAutomation.post('/instances/:id/cancel', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const userId = getUserId(c);
    const now = new Date().toISOString();

    const instance = await db.prepare('SELECT * FROM workflow_instances WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!instance) return c.json({ success: false, message: 'Instance not found' }, 404);

    await db.prepare(`
      UPDATE workflow_instances SET status = 'cancelled', cancelled_at = ?, cancelled_by = ?,
      cancellation_reason = ?, updated_at = ? WHERE id = ?
    `).bind(now, userId, body.reason || null, now, id).run();

    await db.prepare("UPDATE workflow_steps SET status = 'cancelled', updated_at = ? WHERE instance_id = ? AND status IN ('pending', 'active')")
      .bind(now, id).run();

    return c.json({ success: true, message: 'Workflow cancelled' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── AUTOMATION RULES ─────────────────────────────────────────────────

workflowAutomation.get('/rules', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, trigger_entity, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM automation_rules WHERE company_id = ?';
    const params = [companyId];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (trigger_entity) { query += ' AND trigger_entity = ?'; params.push(trigger_entity); }

    query += ' ORDER BY priority ASC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();

    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

workflowAutomation.post('/rules', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = getUserId(c);
    const id = generateId();
    const now = new Date().toISOString();

    if (!body.name || !body.triggerEntity) {
      return c.json({ success: false, message: 'Name and trigger entity are required' }, 400);
    }

    await db.prepare(`
      INSERT INTO automation_rules (
        id, company_id, name, description, rule_type, status,
        trigger_entity, trigger_event, trigger_field, trigger_operator, trigger_value,
        action_type, action_target, action_config, priority, is_active,
        created_by, notes, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId,
      body.name,
      body.description || null,
      body.ruleType || body.rule_type || 'trigger',
      body.triggerEntity || body.trigger_entity,
      body.triggerEvent || body.trigger_event || 'created',
      body.triggerField || body.trigger_field || null,
      body.triggerOperator || body.trigger_operator || 'equals',
      body.triggerValue || body.trigger_value || null,
      body.actionType || body.action_type || 'notify',
      body.actionTarget || body.action_target || null,
      JSON.stringify(body.actionConfig || body.action_config || {}),
      parseInt(body.priority) || 100,
      userId,
      body.notes || null,
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM automation_rules WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

workflowAutomation.put('/rules/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM automation_rules WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Rule not found' }, 404);

    await db.prepare(`
      UPDATE automation_rules SET
        name = ?, description = ?, rule_type = ?, status = ?,
        trigger_entity = ?, trigger_event = ?, trigger_field = ?, trigger_operator = ?, trigger_value = ?,
        action_type = ?, action_target = ?, action_config = ?, priority = ?, is_active = ?,
        notes = ?, data = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.name || existing.name,
      body.description ?? existing.description,
      body.ruleType || body.rule_type || existing.rule_type,
      body.status || existing.status,
      body.triggerEntity || body.trigger_entity || existing.trigger_entity,
      body.triggerEvent || body.trigger_event || existing.trigger_event,
      body.triggerField || body.trigger_field ?? existing.trigger_field,
      body.triggerOperator || body.trigger_operator || existing.trigger_operator,
      body.triggerValue || body.trigger_value ?? existing.trigger_value,
      body.actionType || body.action_type || existing.action_type,
      body.actionTarget || body.action_target ?? existing.action_target,
      JSON.stringify(body.actionConfig || body.action_config || JSON.parse(existing.action_config || '{}')),
      parseInt(body.priority) || existing.priority,
      (body.isActive !== undefined ? body.isActive : (body.is_active !== undefined ? body.is_active : existing.is_active)) ? 1 : 0,
      body.notes ?? existing.notes,
      JSON.stringify(body.data || JSON.parse(existing.data || '{}')),
      now, id
    ).run();

    const updated = await db.prepare('SELECT * FROM automation_rules WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

workflowAutomation.delete('/rules/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const existing = await db.prepare('SELECT * FROM automation_rules WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Rule not found' }, 404);

    await db.prepare('DELETE FROM automation_rules WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Rule deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── SUMMARY / DASHBOARD ─────────────────────────────────────────────

workflowAutomation.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);

    const templateStats = await db.prepare(`
      SELECT COUNT(*) as total, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
      FROM workflow_templates WHERE company_id = ?
    `).bind(companyId).first();

    const instanceStats = await db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN sla_breached = 1 THEN 1 ELSE 0 END) as sla_breached,
        AVG(processing_time_ms) as avg_processing_time
      FROM workflow_instances WHERE company_id = ?
    `).bind(companyId).first();

    const ruleStats = await db.prepare(`
      SELECT COUNT(*) as total, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
      SUM(execution_count) as total_executions
      FROM automation_rules WHERE company_id = ?
    `).bind(companyId).first();

    const pendingSteps = await db.prepare(`
      SELECT COUNT(*) as total FROM workflow_steps WHERE company_id = ? AND status = 'active'
    `).bind(companyId).first();

    return c.json({
      success: true,
      data: {
        templates: { total: templateStats?.total || 0, active: templateStats?.active || 0 },
        instances: {
          total: instanceStats?.total || 0,
          pending: instanceStats?.pending || 0,
          completed: instanceStats?.completed || 0,
          rejected: instanceStats?.rejected || 0,
          cancelled: instanceStats?.cancelled || 0,
          slaBreached: instanceStats?.sla_breached || 0,
          avgProcessingTimeMs: Math.round(instanceStats?.avg_processing_time || 0)
        },
        rules: {
          total: ruleStats?.total || 0,
          active: ruleStats?.active || 0,
          totalExecutions: ruleStats?.total_executions || 0
        },
        pendingActions: pendingSteps?.total || 0
      }
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

workflowAutomation.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      workflowTypes: [
        { value: 'approval', label: 'Approval Workflow' },
        { value: 'review', label: 'Review Workflow' },
        { value: 'notification', label: 'Notification Only' },
        { value: 'multi_step', label: 'Multi-Step Process' },
        { value: 'conditional', label: 'Conditional Routing' },
        { value: 'parallel', label: 'Parallel Approval' }
      ],
      categories: [
        { value: 'general', label: 'General' },
        { value: 'financial', label: 'Financial' },
        { value: 'promotion', label: 'Promotion' },
        { value: 'budget', label: 'Budget' },
        { value: 'claim', label: 'Claim' },
        { value: 'settlement', label: 'Settlement' }
      ],
      triggerEntities: [
        { value: 'promotion', label: 'Promotion' },
        { value: 'budget', label: 'Budget' },
        { value: 'claim', label: 'Claim' },
        { value: 'deduction', label: 'Deduction' },
        { value: 'settlement', label: 'Settlement' },
        { value: 'trade_spend', label: 'Trade Spend' },
        { value: 'accrual', label: 'Accrual' }
      ],
      triggerEvents: [
        { value: 'created', label: 'Created' },
        { value: 'updated', label: 'Updated' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'amount_changed', label: 'Amount Changed' },
        { value: 'status_changed', label: 'Status Changed' }
      ],
      stepTypes: [
        { value: 'approval', label: 'Approval Required' },
        { value: 'review', label: 'Review Only' },
        { value: 'notification', label: 'Send Notification' },
        { value: 'condition', label: 'Condition Check' },
        { value: 'action', label: 'Automated Action' }
      ],
      actionTypes: [
        { value: 'notify', label: 'Send Notification' },
        { value: 'assign', label: 'Assign to User' },
        { value: 'escalate', label: 'Escalate' },
        { value: 'auto_approve', label: 'Auto-Approve' },
        { value: 'block', label: 'Block Transaction' },
        { value: 'trigger_workflow', label: 'Trigger Another Workflow' }
      ],
      priorities: [
        { value: 'urgent', label: 'Urgent' },
        { value: 'high', label: 'High' },
        { value: 'normal', label: 'Normal' },
        { value: 'low', label: 'Low' }
      ]
    }
  });
});

export const workflowAutomationRoutes = workflowAutomation;
