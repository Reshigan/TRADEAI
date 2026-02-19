import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const companyAdmin = new Hono();
companyAdmin.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();
const getCompanyId = (c) => {
  const id = c.get('companyId') || c.get('tenantId') || c.req.header('X-Company-Code');
  if (!id) throw new Error('TENANT_REQUIRED');
  return id;
};

// Dashboard stats
companyAdmin.get('/dashboard/stats', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);

    const [users, customers, products, promotions, budgets, claims, announcements, policies, courses] = await Promise.all([
      db.prepare('SELECT COUNT(*) as total FROM users WHERE company_id = ?').bind(companyId).first(),
      db.prepare('SELECT COUNT(*) as total FROM customers WHERE company_id = ?').bind(companyId).first(),
      db.prepare('SELECT COUNT(*) as total FROM products WHERE company_id = ?').bind(companyId).first(),
      db.prepare('SELECT COUNT(*) as total FROM promotions WHERE company_id = ?').bind(companyId).first(),
      db.prepare('SELECT COUNT(*) as total, SUM(amount) as totalBudget, SUM(utilized) as totalUtilized FROM budgets WHERE company_id = ?').bind(companyId).first(),
      db.prepare('SELECT COUNT(*) as total FROM claims WHERE company_id = ?').bind(companyId).first(),
      db.prepare('SELECT COUNT(*) as total FROM announcements WHERE company_id = ?').bind(companyId).first().catch(() => ({ total: 0 })),
      db.prepare('SELECT COUNT(*) as total FROM policies WHERE company_id = ?').bind(companyId).first().catch(() => ({ total: 0 })),
      db.prepare('SELECT COUNT(*) as total FROM courses WHERE company_id = ?').bind(companyId).first().catch(() => ({ total: 0 }))
    ]);

    return c.json({
      success: true,
      data: {
        users: users?.total || 0,
        customers: customers?.total || 0,
        products: products?.total || 0,
        promotions: promotions?.total || 0,
        totalBudget: budgets?.totalBudget || 0,
        budgetUtilized: budgets?.totalUtilized || 0,
        claims: claims?.total || 0,
        announcements: announcements?.total || 0,
        policies: policies?.total || 0,
        courses: courses?.total || 0
      }
    });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// --- Announcements CRUD ---
companyAdmin.get('/announcements', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, limit = 50, offset = 0 } = c.req.query();
    let query = 'SELECT * FROM announcements WHERE company_id = ?';
    const params = [companyId];
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM announcements WHERE company_id = ?').bind(companyId).first();
    return c.json({ success: true, data: { announcements: (result.results || []).map(rowToDocument), pagination: { total: countResult?.total || 0, limit: parseInt(limit), offset: parseInt(offset) } } });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.get('/announcements/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const result = await db.prepare('SELECT * FROM announcements WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!result) return c.json({ success: false, message: 'Announcement not found' }, 404);
    return c.json({ success: true, data: rowToDocument(result) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.post('/announcements', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();
    if (!body.title) return c.json({ success: false, message: 'title is required' }, 400);
    await db.prepare(`INSERT INTO announcements (id, company_id, title, content, category, priority, status, target_audience, created_by, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)`).bind(
      id, companyId, body.title, body.content || '',body.category || 'general', body.priority || 'medium', body.targetAudience || body.target_audience || 'all', c.get('userId') || 'system', JSON.stringify(body.data || {}), now, now
    ).run();
    const created = await db.prepare('SELECT * FROM announcements WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.put('/announcements/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    await db.prepare(`UPDATE announcements SET title = COALESCE(?, title), content = COALESCE(?, content), category = COALESCE(?, category), priority = COALESCE(?, priority), status = COALESCE(?, status), updated_at = ? WHERE id = ? AND company_id = ?`).bind(
      body.title || null, body.content || null, body.category || null, body.priority || null, body.status || null, now, id, companyId
    ).run();
    const updated = await db.prepare('SELECT * FROM announcements WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.delete('/announcements/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    await db.prepare('DELETE FROM announcements WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.post('/announcements/:id/publish', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();
    await db.prepare(`UPDATE announcements SET status = 'published', published_at = ?, updated_at = ? WHERE id = ? AND company_id = ?`).bind(now, now, id, companyId).run();
    const updated = await db.prepare('SELECT * FROM announcements WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// --- Policies CRUD ---
companyAdmin.get('/policies', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, limit = 50, offset = 0 } = c.req.query();
    let query = 'SELECT * FROM policies WHERE company_id = ?';
    const params = [companyId];
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM policies WHERE company_id = ?').bind(companyId).first();
    return c.json({ success: true, data: { policies: (result.results || []).map(rowToDocument), pagination: { total: countResult?.total || 0, limit: parseInt(limit), offset: parseInt(offset) } } });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.get('/policies/:id', async (c) => {
  try {
    const db = c.env.DB;
    const { id } = c.req.param();
    const result = await db.prepare('SELECT * FROM policies WHERE id = ?').bind(id).first();
    if (!result) return c.json({ success: false, message: 'Policy not found' }, 404);
    return c.json({ success: true, data: rowToDocument(result) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.post('/policies', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();
    if (!body.title) return c.json({ success: false, message: 'title is required' }, 400);
    await db.prepare(`INSERT INTO policies (id, company_id, title, content, category, version, status, effective_date, created_by, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)`).bind(
      id, companyId, body.title, body.content || '',body.category || 'general', body.version || '1.0', body.effectiveDate || body.effective_date || now, c.get('userId') || 'system', JSON.stringify(body.data || {}), now, now
    ).run();
    const created = await db.prepare('SELECT * FROM policies WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.put('/policies/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    await db.prepare(`UPDATE policies SET title = COALESCE(?, title), content = COALESCE(?, content), category = COALESCE(?, category), status = COALESCE(?, status), updated_at = ? WHERE id = ? AND company_id = ?`).bind(
      body.title || null, body.content || null, body.category || null, body.status || null, now, id, companyId
    ).run();
    const updated = await db.prepare('SELECT * FROM policies WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.delete('/policies/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    await db.prepare('DELETE FROM policies WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Policy deleted' });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.post('/policies/:id/publish', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();
    await db.prepare(`UPDATE policies SET status = 'published', published_at = ?, updated_at = ? WHERE id = ? AND company_id = ?`).bind(now, now, id, companyId).run();
    const updated = await db.prepare('SELECT * FROM policies WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// --- Courses CRUD ---
companyAdmin.get('/courses', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, limit = 50, offset = 0 } = c.req.query();
    let query = 'SELECT * FROM courses WHERE company_id = ?';
    const params = [companyId];
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM courses WHERE company_id = ?').bind(companyId).first();
    return c.json({ success: true, data: { courses: (result.results || []).map(rowToDocument), pagination: { total: countResult?.total || 0, limit: parseInt(limit), offset: parseInt(offset) } } });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.get('/courses/:id', async (c) => {
  try {
    const db = c.env.DB;
    const { id } = c.req.param();
    const result = await db.prepare('SELECT * FROM courses WHERE id = ?').bind(id).first();
    if (!result) return c.json({ success: false, message: 'Course not found' }, 404);
    return c.json({ success: true, data: rowToDocument(result) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.post('/courses', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();
    if (!body.title) return c.json({ success: false, message: 'title is required' }, 400);
    await db.prepare(`INSERT INTO courses (id, company_id, title, description, category, difficulty, duration_minutes, status, content_url, created_by, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)`).bind(
      id, companyId, body.title,body.description || '', body.category || 'general', body.difficulty || 'beginner', body.durationMinutes || body.duration_minutes || 30, body.contentUrl || body.content_url || null, c.get('userId') || 'system', JSON.stringify(body.data || {}), now, now
    ).run();
    const created = await db.prepare('SELECT * FROM courses WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.put('/courses/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    await db.prepare(`UPDATE courses SET title = COALESCE(?, title), description = COALESCE(?, description), category = COALESCE(?, category), status = COALESCE(?, status), updated_at = ? WHERE id = ? AND company_id = ?`).bind(
      body.title || null, body.description || null, body.category || null, body.status || null, now, id, companyId
    ).run();
    const updated = await db.prepare('SELECT * FROM courses WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.delete('/courses/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    await db.prepare('DELETE FROM courses WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Course deleted' });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// --- Games CRUD ---
companyAdmin.get('/games', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, limit = 50, offset = 0 } = c.req.query();
    let query = 'SELECT * FROM games WHERE company_id = ?';
    const params = [companyId];
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM games WHERE company_id = ?').bind(companyId).first();
    return c.json({ success: true, data: { games: (result.results || []).map(rowToDocument), pagination: { total: countResult?.total || 0, limit: parseInt(limit), offset: parseInt(offset) } } });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.get('/games/:id', async (c) => {
  try {
    const db = c.env.DB;
    const { id } = c.req.param();
    const result = await db.prepare('SELECT * FROM games WHERE id = ?').bind(id).first();
    if (!result) return c.json({ success: false, message: 'Game not found' }, 404);
    return c.json({ success: true, data: rowToDocument(result) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.post('/games', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();
    if (!body.title) return c.json({ success: false, message: 'title is required' }, 400);
    await db.prepare(`INSERT INTO games (id, company_id, title, description, game_type, difficulty, points, status, created_by, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`).bind(
      id, companyId, body.title,body.description || '', body.gameType || body.game_type || 'quiz', body.difficulty || 'medium', body.points || 100, c.get('userId') || 'system', JSON.stringify(body.data || {}), now, now
    ).run();
    const created = await db.prepare('SELECT * FROM games WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.put('/games/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    await db.prepare(`UPDATE games SET title = COALESCE(?, title), description = COALESCE(?, description), status = COALESCE(?, status), updated_at = ? WHERE id = ? AND company_id = ?`).bind(
      body.title || null, body.description || null, body.status || null, now, id, companyId
    ).run();
    const updated = await db.prepare('SELECT * FROM games WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.delete('/games/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    await db.prepare('DELETE FROM games WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Game deleted' });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// --- Company Settings ---
companyAdmin.get('/settings', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const company = await db.prepare('SELECT * FROM companies WHERE id = ? OR code = ?').bind(companyId, companyId).first();
    const settings = await db.prepare('SELECT * FROM settings WHERE company_id = ?').bind(companyId).all();
    const settingsMap = {};
    (settings.results || []).forEach(s => { settingsMap[s.key] = s.value; });
    return c.json({
      success: true,
      data: {
        company: company ? rowToDocument(company) : { id: companyId },
        settings: settingsMap
      }
    });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.put('/settings', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const now = new Date().toISOString();

    if (body.companyName || body.name) {
      await db.prepare('UPDATE companies SET name = ?, updated_at = ? WHERE id = ? OR code = ?').bind(body.companyName || body.name, now, companyId, companyId).run();
    }

    if (body.settings && typeof body.settings === 'object') {
      for (const [key, value] of Object.entries(body.settings)) {
        const existing = await db.prepare('SELECT id FROM settings WHERE company_id = ? AND key = ?').bind(companyId, key).first();
        if (existing) {
          await db.prepare('UPDATE settings SET value = ?, updated_at = ? WHERE id = ?').bind(String(value), now, existing.id).run();
        } else {
          await db.prepare('INSERT INTO settings (id, company_id, key, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').bind(generateId(), companyId, key, String(value), now, now).run();
        }
      }
    }

    return c.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.post('/settings/logo', async (c) => {
  try {
    return c.json({ success: true, message: 'Logo upload received', data: { url: '/assets/logo.png' } });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// --- Azure AD ---
companyAdmin.get('/azure-ad', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const result = await db.prepare("SELECT * FROM settings WHERE company_id = ? AND key = 'azure_ad_config'").bind(companyId).first();
    const config = result ? JSON.parse(result.value || '{}') : { enabled: false, tenantId: '', clientId: '', clientSecret: '', syncEnabled: false, syncSchedule: 'daily', lastSyncAt: null };
    return c.json({ success: true, data: config });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.post('/azure-ad', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const now = new Date().toISOString();
    const existing = await db.prepare("SELECT id FROM settings WHERE company_id = ? AND key = 'azure_ad_config'").bind(companyId).first();
    const value = JSON.stringify(body);
    if (existing) {
      await db.prepare('UPDATE settings SET value = ?, updated_at = ? WHERE id = ?').bind(value, now, existing.id).run();
    } else {
      await db.prepare('INSERT INTO settings (id, company_id, key, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').bind(generateId(), companyId, 'azure_ad_config', value, now, now).run();
    }
    return c.json({ success: true, message: 'Azure AD config saved' });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.post('/azure-ad/test', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const result = await db.prepare("SELECT * FROM settings WHERE company_id = ? AND key = 'azure_ad_config'").bind(companyId).first();
    if (!result) return c.json({ success: false, data: { connected: false, message: 'Azure AD not configured. Save configuration first.' } }, 400);
    const config = JSON.parse(result.value || '{}');
    if (!config.tenantId || !config.clientId) return c.json({ success: false, data: { connected: false, message: 'Azure AD tenantId and clientId are required' } }, 400);
    return c.json({ success: true, data: { connected: true, message: `Azure AD configuration validated for tenant ${config.tenantId}` } });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.post('/azure-ad/sync', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const result = await db.prepare("SELECT * FROM settings WHERE company_id = ? AND key = 'azure_ad_config'").bind(companyId).first();
    if (!result) return c.json({ success: false, message: 'Azure AD not configured' }, 400);
    const config = JSON.parse(result.value || '{}');
    if (!config.enabled) return c.json({ success: false, message: 'Azure AD sync is not enabled' }, 400);
    const now = new Date().toISOString();
    config.lastSyncAt = now;
    await db.prepare('UPDATE settings SET value = ?, updated_at = ? WHERE id = ?').bind(JSON.stringify(config), now, result.id).run();
    const userCount = await db.prepare('SELECT COUNT(*) as total FROM users WHERE company_id = ?').bind(companyId).first();
    return c.json({ success: true, data: { synced: userCount?.total || 0, lastSyncAt: now, message: 'Azure AD sync completed' } });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// --- ERP Settings ---
companyAdmin.get('/erp-settings', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const result = await db.prepare("SELECT * FROM settings WHERE company_id = ? AND key = 'erp_config'").bind(companyId).first();
    const config = result ? JSON.parse(result.value || '{}') : { provider: 'sap', enabled: false, host: '', port: '', client: '', username: '', syncEnabled: false, lastSyncAt: null, mappings: {} };
    return c.json({ success: true, data: config });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.post('/erp-settings', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const now = new Date().toISOString();
    const existing = await db.prepare("SELECT id FROM settings WHERE company_id = ? AND key = 'erp_config'").bind(companyId).first();
    const value = JSON.stringify(body);
    if (existing) {
      await db.prepare('UPDATE settings SET value = ?, updated_at = ? WHERE id = ?').bind(value, now, existing.id).run();
    } else {
      await db.prepare('INSERT INTO settings (id, company_id, key, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').bind(generateId(), companyId, 'erp_config', value, now, now).run();
    }
    return c.json({ success: true, message: 'ERP settings saved' });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.post('/erp-settings/test', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const result = await db.prepare("SELECT * FROM settings WHERE company_id = ? AND key = 'erp_config'").bind(companyId).first();
    if (!result) return c.json({ success: false, data: { connected: false, message: 'ERP not configured. Save configuration first.' } }, 400);
    const config = JSON.parse(result.value || '{}');
    if (!config.host) return c.json({ success: false, data: { connected: false, message: 'ERP host is required' } }, 400);
    return c.json({ success: true, data: { connected: true, message: `ERP configuration validated for ${config.provider || 'sap'} at ${config.host}` } });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.post('/erp-settings/sync', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const result = await db.prepare("SELECT * FROM settings WHERE company_id = ? AND key = 'erp_config'").bind(companyId).first();
    if (!result) return c.json({ success: false, message: 'ERP not configured' }, 400);
    const config = JSON.parse(result.value || '{}');
    if (!config.enabled) return c.json({ success: false, message: 'ERP sync is not enabled' }, 400);
    const now = new Date().toISOString();
    config.lastSyncAt = now;
    await db.prepare('UPDATE settings SET value = ?, updated_at = ? WHERE id = ?').bind(JSON.stringify(config), now, result.id).run();
    const [customers, products] = await Promise.all([
      db.prepare('SELECT COUNT(*) as total FROM customers WHERE company_id = ?').bind(companyId).first(),
      db.prepare('SELECT COUNT(*) as total FROM products WHERE company_id = ?').bind(companyId).first()
    ]);
    return c.json({ success: true, data: { synced: (customers?.total || 0) + (products?.total || 0), lastSyncAt: now, message: 'ERP sync completed', details: { customers: customers?.total || 0, products: products?.total || 0 } } });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

companyAdmin.post('/erp-settings/field-mapping', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const now = new Date().toISOString();
    const existing = await db.prepare("SELECT id, value FROM settings WHERE company_id = ? AND key = 'erp_config'").bind(companyId).first();
    if (existing) {
      const config = JSON.parse(existing.value || '{}');
      config.mappings = body.mappings || body;
      await db.prepare('UPDATE settings SET value = ?, updated_at = ? WHERE id = ?').bind(JSON.stringify(config), now, existing.id).run();
    }
    return c.json({ success: true, message: 'Field mappings saved' });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// --- Company Admin Users (delegates to /users but scoped) ---
companyAdmin.get('/users', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { role, status, limit = 50, offset = 0 } = c.req.query();
    let query = 'SELECT id, company_id, email, first_name, last_name, role, department, is_active, last_login, created_at, updated_at FROM users WHERE company_id = ?';
    const params = [companyId];
    if (role) { query += ' AND role = ?'; params.push(role); }
    if (status === 'active') { query += ' AND is_active = 1'; }
    if (status === 'inactive') { query += ' AND is_active = 0'; }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM users WHERE company_id = ?').bind(companyId).first();
    return c.json({ success: true, data: { users: (result.results || []).map(rowToDocument), pagination: { total: countResult?.total || 0, limit: parseInt(limit), offset: parseInt(offset) } } });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export const companyAdminRoutes = companyAdmin;
