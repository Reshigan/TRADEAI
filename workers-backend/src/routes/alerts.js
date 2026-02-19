import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const alerts = new Hono();
alerts.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();
const getCompanyId = (c) => {
  const id = c.get('companyId') || c.get('tenantId') || c.req.header('X-Company-Code');
  if (!id) throw new Error('TENANT_REQUIRED');
  return id;
};

alerts.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { type, severity, status, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM alerts WHERE company_id = ?';
    const params = [companyId];

    if (type) { query += ' AND alert_type = ?'; params.push(type); }
    if (severity) { query += ' AND severity = ?'; params.push(severity); }
    if (status) { query += ' AND status = ?'; params.push(status); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM alerts WHERE company_id = ?').bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0
    });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

alerts.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const result = await db.prepare('SELECT * FROM alerts WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!result) return c.json({ success: false, message: 'Alert not found' }, 404);
    return c.json({ success: true, data: rowToDocument(result) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

alerts.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    if (!body.title) return c.json({ success: false, message: 'title is required' }, 400);

    await db.prepare(`
      INSERT INTO alerts (id, company_id, alert_type, severity, status, title, message, entity_type, entity_id, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId,
      body.alertType || body.alert_type || 'system',
      body.severity || 'medium',
      body.title,
      body.message || '',
      body.entityType || body.entity_type || null,
      body.entityId || body.entity_id || null,
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM alerts WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

alerts.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    await db.prepare(`UPDATE alerts SET status = ?, updated_at = ? WHERE id = ? AND company_id = ?`).bind(body.status || 'active', now, id, companyId).run();
    const updated = await db.prepare('SELECT * FROM alerts WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

alerts.post('/:id/dismiss', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();

    await db.prepare(`UPDATE alerts SET status = 'dismissed', dismissed_at = ?, updated_at = ? WHERE id = ? AND company_id = ?`).bind(now, now, id, companyId).run();
    const updated = await db.prepare('SELECT * FROM alerts WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

alerts.post('/:id/acknowledge', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const userId = c.get('userId') || 'system';
    const now = new Date().toISOString();

    await db.prepare(`UPDATE alerts SET status = 'acknowledged', acknowledged_by = ?, acknowledged_at = ?, updated_at = ? WHERE id = ? AND company_id = ?`).bind(userId, now, now, id, companyId).run();
    const updated = await db.prepare('SELECT * FROM alerts WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

alerts.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    await db.prepare('DELETE FROM alerts WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Alert deleted' });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export const alertRoutes = alerts;
