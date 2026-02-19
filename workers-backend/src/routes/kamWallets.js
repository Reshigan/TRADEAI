import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const kamWallets = new Hono();
kamWallets.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();
const getCompanyId = (c) => {
  const id = c.get('companyId') || c.get('tenantId') || c.req.header('X-Company-Code');
  if (!id) throw new Error('TENANT_REQUIRED');
  return id;
};

kamWallets.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { userId, year, status, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM kam_wallets WHERE company_id = ?';
    const params = [companyId];

    if (userId) { query += ' AND user_id = ?'; params.push(userId); }
    if (year) { query += ' AND year = ?'; params.push(parseInt(year)); }
    if (status) { query += ' AND status = ?'; params.push(status); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM kam_wallets WHERE company_id = ?').bind(companyId).first();

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

kamWallets.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const result = await db.prepare('SELECT * FROM kam_wallets WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!result) return c.json({ success: false, message: 'KAM Wallet not found' }, 404);
    return c.json({ success: true, data: rowToDocument(result) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

kamWallets.get('/:id/balance',async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const result = await db.prepare('SELECT * FROM kam_wallets WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!result) return c.json({ success: false, message: 'KAM Wallet not found' }, 404);
    return c.json({
      success: true,
      data: {
        walletId: id,
        allocatedAmount: result.allocated_amount || 0,
        utilizedAmount: result.utilized_amount || 0,
        committedAmount: result.committed_amount || 0,
        availableAmount: result.available_amount || (result.allocated_amount || 0) - (result.utilized_amount || 0) - (result.committed_amount || 0)
      }
    });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

kamWallets.get('/customer/:customerId/allocations', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { customerId } = c.req.param();
    const result = await db.prepare(`
      SELECT kw.*, a.amount as allocation_amount, a.customer_id
      FROM kam_wallets kw
      LEFT JOIN allocations a ON a.company_id = kw.company_id
      WHERE kw.company_id = ? AND a.customer_id = ?
      ORDER BY kw.created_at DESC
    `).bind(companyId, customerId).all();
    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

kamWallets.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();
    const allocated = body.totalAllocation || body.allocatedAmount || body.allocated_amount || 0;

    await db.prepare(`
      INSERT INTO kam_wallets (id, company_id, user_id, year, quarter, month, allocated_amount, utilized_amount, committed_amount, available_amount, status, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, 'active', ?, ?, ?)
    `).bind(
      id, companyId,
      body.userId || body.user_id || null,
      body.year || new Date().getFullYear(),
      body.quarter || null,
      body.month || null,
      allocated, allocated,
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM kam_wallets WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

kamWallets.post('/:id/allocate', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const wallet = await db.prepare('SELECT * FROM kam_wallets WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!wallet) return c.json({ success: false, message: 'KAM Wallet not found' }, 404);

    const amount = body.amount || 0;
    const newCommitted = (wallet.committed_amount || 0) + amount;
    const newAvailable = (wallet.allocated_amount || 0) - (wallet.utilized_amount || 0) - newCommitted;

    await db.prepare(`UPDATE kam_wallets SET committed_amount = ?, available_amount = ?, updated_at = ? WHERE id = ?`).bind(newCommitted, newAvailable, now, id).run();

    const updated = await db.prepare('SELECT * FROM kam_wallets WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

kamWallets.post('/:id/record-usage', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const wallet = await db.prepare('SELECT * FROM kam_wallets WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!wallet) return c.json({ success: false, message: 'KAM Wallet not found' }, 404);

    const amount = body.amount || 0;
    const newUtilized = (wallet.utilized_amount || 0) + amount;
    const newAvailable = (wallet.allocated_amount || 0) - newUtilized - (wallet.committed_amount || 0);

    await db.prepare(`UPDATE kam_wallets SET utilized_amount = ?, available_amount = ?, updated_at = ? WHERE id = ?`).bind(newUtilized, newAvailable, now, id).run();

    const updated = await db.prepare('SELECT * FROM kam_wallets WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

kamWallets.patch('/:id/status', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    await db.prepare(`UPDATE kam_wallets SET status = ?, updated_at = ? WHERE id = ? AND company_id = ?`).bind(body.status, now, id, companyId).run();
    const updated = await db.prepare('SELECT * FROM kam_wallets WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

kamWallets.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const existing = await db.prepare('SELECT * FROM kam_wallets WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'KAM Wallet not found' }, 404);
    await db.prepare('DELETE FROM kam_wallets WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'KAM Wallet deleted' });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export const kamWalletRoutes = kamWallets;
