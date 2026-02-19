import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const customerAssignment = new Hono();
customerAssignment.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();
const getCompanyId = (c) => {
  const id = c.get('companyId') || c.get('tenantId') || c.req.header('X-Company-Code');
  if (!id) throw new Error('TENANT_REQUIRED');
  return id;
};

customerAssignment.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const result = await db.prepare(`
      SELECT ca.*, c.name as customer_name, c.code as customer_code, u.first_name, u.last_name, u.email as user_email
      FROM customer_assignments ca
      LEFT JOIN customers c ON c.id = ca.customer_id
      LEFT JOIN users u ON u.id = ca.user_id
      WHERE ca.company_id = ?
      ORDER BY ca.created_at DESC
    `).bind(companyId).all();
    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

customerAssignment.get('/unassigned', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const result = await db.prepare(`
      SELECT c.* FROM customers c
      WHERE c.company_id = ? AND c.id NOT IN (SELECT customer_id FROM customer_assignments WHERE company_id = ?)
      ORDER BY c.name ASC
    `).bind(companyId, companyId).all();
    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

customerAssignment.post('/assign', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO customer_assignments (id, company_id, customer_id, user_id, role, status, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)
    `).bind(
      id, companyId,
      body.customerId || body.customer_id || (() => { throw new Error('customerId is required'); })(),
      body.userId || body.user_id || (() => { throw new Error('userId is required'); })(),
      body.role || 'kam',
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM customer_assignments WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

customerAssignment.post('/unassign', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();

    await db.prepare(`
      DELETE FROM customer_assignments WHERE company_id = ? AND customer_id = ? AND user_id = ?
    `).bind(companyId, body.customerId || body.customer_id, body.userId || body.user_id).run();

    return c.json({ success: true, message: 'Customer unassigned' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

customerAssignment.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    await db.prepare('DELETE FROM customer_assignments WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Assignment deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export const customerAssignmentRoutes = customerAssignment;
