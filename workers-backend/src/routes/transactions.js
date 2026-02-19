import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const transactions = new Hono();
transactions.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();
const getCompanyId = (c) => c.get('companyId') || c.get('tenantId') || c.req.header('X-Company-Code') || 'default';

transactions.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, type, customerId, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM transactions WHERE company_id = ?';
    const params = [companyId];

    if (status && status !== 'all') { query += ' AND status = ?'; params.push(status); }
    if (type) { query += ' AND transaction_type = ?'; params.push(type); }
    if (customerId) { query += ' AND customer_id = ?'; params.push(customerId); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM transactions WHERE company_id = ?').bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

transactions.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const result = await db.prepare('SELECT * FROM transactions WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!result) return c.json({ success: false, message: 'Transaction not found' }, 404);
    return c.json({ success: true, data: rowToDocument(result) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

transactions.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = c.get('userId') || 'system';
    const id = generateId();
    const now = new Date().toISOString();
    const txnNumber = `TXN-${Date.now().toString(36).toUpperCase()}`;

    await db.prepare(`
      INSERT INTO transactions (id, company_id, transaction_number, transaction_type, status, customer_id, product_id, amount, description, reference, created_by, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId, txnNumber,
      body.type || body.transactionType || 'accrual',
      body.customerId || body.customer_id || null,
      body.productId || body.product_id || null,
      body.amount || 0,
      body.description || null,
      body.reference || null,
      userId,
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM transactions WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

transactions.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM transactions WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Transaction not found' }, 404);

    await db.prepare(`
      UPDATE transactions SET amount = ?, description = ?, reference = ?, status = ?, data = ?, updated_at = ? WHERE id = ?
    `).bind(
      body.amount ?? existing.amount,
      body.description ?? existing.description,
      body.reference ?? existing.reference,
      body.status ?? existing.status,
      JSON.stringify(body.data || {}),
      now, id
    ).run();

    const updated = await db.prepare('SELECT * FROM transactions WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

transactions.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const existing = await db.prepare('SELECT * FROM transactions WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Transaction not found' }, 404);
    await db.prepare('DELETE FROM transactions WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

transactions.post('/:id/approve', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const userId = c.get('userId') || 'system';
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM transactions WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Transaction not found' }, 404);

    await db.prepare(`UPDATE transactions SET status = 'approved', approved_by = ?, approved_at = ?, updated_at = ? WHERE id = ?`).bind(userId, now, now, id).run();
    const updated = await db.prepare('SELECT * FROM transactions WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

transactions.post('/:id/reject', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const userId = c.get('userId') || 'system';
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM transactions WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Transaction not found' }, 404);

    await db.prepare(`UPDATE transactions SET status = 'rejected', rejected_by = ?, rejected_at = ?, rejection_reason = ?, updated_at = ? WHERE id = ?`).bind(userId, now, body.reason || null, now, id).run();
    const updated = await db.prepare('SELECT * FROM transactions WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

transactions.post('/:id/settle', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM transactions WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Transaction not found' }, 404);

    await db.prepare(`UPDATE transactions SET status = 'settled', payment_reference = ?, settled_at = ?, updated_at = ? WHERE id = ?`).bind(body.paymentReference || null, now, now, id).run();
    const updated = await db.prepare('SELECT * FROM transactions WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

transactions.post('/bulk-upload', async (c) => {
  try {
    return c.json({ success: true, message: 'Bulk upload endpoint ready. Submit CSV or JSON array of transactions.', data: { supportedFormats: ['csv', 'json'], maxRows: 1000 } });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export const transactionRoutes = transactions;
