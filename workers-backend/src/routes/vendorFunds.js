import { Hono } from 'hono';
import {authMiddleware, requireMinRole } from '../middleware/auth.js';
import { apiError } from '../utils/apiError.js';
import { resolveBaselineScope } from '../services/hierarchyResolver.js';

export const vendorFundRoutes = new Hono();
vendorFundRoutes.use('*', authMiddleware);

const getId = () => crypto.randomUUID();
const getCompanyId = (c) => c.get('companyId') || c.get('tenantId') || c.req.header('X-Company-Code');

vendorFundRoutes.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { vendorId, status, limit = 50, offset = 0 } = c.req.query();
    let query = 'SELECT * FROM vendor_funds WHERE company_id = ?';
    const params = [companyId];
    if (vendorId) { query += ' AND vendor_id = ?'; params.push(vendorId); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM vendor_funds WHERE company_id = ?').bind(companyId).first();
    return c.json({ success: true, data: result.results || [], total: countResult?.total || 0 });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

vendorFundRoutes.get('/expiring', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const result = await db.prepare(
      "SELECT * FROM vendor_funds WHERE company_id = ? AND status = 'active' AND end_date <= date('now', '+30 days') ORDER BY end_date"
    ).bind(companyId).all();
    return c.json({ success: true, data: result.results || [] });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

vendorFundRoutes.get('/vendor/:vendorId', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { vendorId } = c.req.param();
    const result = await db.prepare(
      'SELECT * FROM vendor_funds WHERE company_id = ? AND vendor_id = ? ORDER BY created_at DESC'
    ).bind(companyId, vendorId).all();
    return c.json({ success: true, data: result.results || [] });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

vendorFundRoutes.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const fund = await db.prepare('SELECT * FROM vendor_funds WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!fund) return c.json({ success: false, message: 'Not found' }, 404);
    const usages = await db.prepare('SELECT * FROM vendor_fund_usages WHERE vendor_fund_id = ? ORDER BY created_at DESC').bind(id).all();
    return c.json({ success: true, data: { ...fund, usages: usages.results || [] } });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

vendorFundRoutes.get('/:id/usages', async (c) => {
  try {
    const db = c.env.DB;
    const { id } = c.req.param();
    const result = await db.prepare('SELECT * FROM vendor_fund_usages WHERE vendor_fund_id = ? ORDER BY created_at DESC').bind(id).all();
    return c.json({ success: true, data: result.results || [] });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

vendorFundRoutes.get('/:id/balance', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const fund = await db.prepare('SELECT total_amount, committed_amount, spent_amount, claimed_amount FROM vendor_funds WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!fund) return c.json({ success: false, message: 'Not found' }, 404);
    const available = (fund.total_amount || 0) - (fund.committed_amount || 0) - (fund.spent_amount || 0);
    return c.json({ success: true, data: { ...fund, available, utilizationPct: fund.total_amount > 0 ? Math.round(((fund.committed_amount + fund.spent_amount) / fund.total_amount) * 100) : 0 } });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

vendorFundRoutes.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const userId = c.get('userId');
    const data = await c.req.json();
    const id = getId();
    const available = data.total_amount || 0;
    await db.prepare(`
      INSERT INTO vendor_funds (id, company_id, vendor_id, name, description, fund_type, status, total_amount, available_amount, currency, start_date, end_date,
        customer_hierarchy_level, customer_hierarchy_id, customer_hierarchy_name, product_hierarchy_level, product_hierarchy_id, product_hierarchy_name,
        min_spend_pct, requires_proof_of_performance, proof_types, auto_renew, vendor_contact_name, vendor_contact_email, vendor_reference,
        payment_terms, invoice_frequency, created_by, notes, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      id, companyId, data.vendor_id, data.name, data.description || null, data.fund_type || 'marketing_coop',
      data.total_amount || 0, available, data.currency || 'ZAR', data.start_date, data.end_date,
      data.customer_hierarchy_level || null, data.customer_hierarchy_id || null, data.customer_hierarchy_name || null,
      data.product_hierarchy_level || null, data.product_hierarchy_id || null, data.product_hierarchy_name || null,
      data.min_spend_pct || 0, data.requires_proof_of_performance ? 1 : 0, JSON.stringify(data.proof_types || []),
      data.auto_renew ? 1 : 0, data.vendor_contact_name || null, data.vendor_contact_email || null, data.vendor_reference || null,
      data.payment_terms || null, data.invoice_frequency || null, userId, data.notes || null, JSON.stringify(data.data || {})
    ).run();
    return c.json({ success: true, data: { id }, message: 'Vendor fund created' }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

vendorFundRoutes.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const data = await c.req.json();
    const existing = await db.prepare('SELECT * FROM vendor_funds WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Not found' }, 404);
    await db.prepare(`
      UPDATE vendor_funds SET name = ?, description = ?, fund_type = ?, total_amount = ?, start_date = ?, end_date = ?,
        customer_hierarchy_level = ?, customer_hierarchy_id = ?, customer_hierarchy_name = ?,
        product_hierarchy_level = ?, product_hierarchy_id = ?, product_hierarchy_name = ?,
        min_spend_pct = ?, vendor_contact_name = ?, vendor_contact_email = ?, vendor_reference = ?,
        payment_terms = ?, invoice_frequency = ?, notes = ?, data = ?, updated_at = datetime('now')
      WHERE id = ? AND company_id = ?
    `).bind(
      data.name || existing.name, data.description || existing.description, data.fund_type || existing.fund_type,
      data.total_amount ?? existing.total_amount, data.start_date || existing.start_date, data.end_date || existing.end_date,
      data.customer_hierarchy_level ?? existing.customer_hierarchy_level, data.customer_hierarchy_id ?? existing.customer_hierarchy_id,
      data.customer_hierarchy_name ?? existing.customer_hierarchy_name, data.product_hierarchy_level ?? existing.product_hierarchy_level,
      data.product_hierarchy_id ?? existing.product_hierarchy_id, data.product_hierarchy_name ?? existing.product_hierarchy_name,
      data.min_spend_pct ?? existing.min_spend_pct, data.vendor_contact_name ?? existing.vendor_contact_name,
      data.vendor_contact_email ?? existing.vendor_contact_email, data.vendor_reference ?? existing.vendor_reference,
      data.payment_terms ?? existing.payment_terms, data.invoice_frequency ?? existing.invoice_frequency,
      data.notes ?? existing.notes, JSON.stringify(data.data || JSON.parse(existing.data || '{}')), id
    ).run();
    return c.json({ success: true, message: 'Updated' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

vendorFundRoutes.post('/:id/approve', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const userId = c.get('userId');
    const { id } = c.req.param();
    const fund = await db.prepare('SELECT * FROM vendor_funds WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!fund) return c.json({ success: false, message: 'Not found' }, 404);
    const available = (fund.total_amount || 0) - (fund.committed_amount || 0) - (fund.spent_amount || 0);
    await db.prepare(
      "UPDATE vendor_funds SET status = 'active', available_amount = ?, approved_by = ?, approved_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND company_id = ?"
    ).bind(available, userId, id, companyId).run();
    return c.json({ success: true, message: 'Fund activated' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

vendorFundRoutes.post('/:id/charge', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const { entityType, entityId, amount } = await c.req.json();
    const fund = await db.prepare('SELECT * FROM vendor_funds WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!fund) return c.json({ success: false, message: 'Not found' }, 404);
    if (fund.status !== 'active') return c.json({ success: false, message: 'Fund is not active' }, 400);
    const available = (fund.total_amount || 0) - (fund.committed_amount || 0) - (fund.spent_amount || 0);
    if (amount > available) return c.json({ success: false, message: `Insufficient fund balance. Available: R${available.toLocaleString()}` }, 400);
    const usageId = getId();
    await db.prepare(
      'INSERT INTO vendor_fund_usages (id, company_id, vendor_fund_id, entity_type, entity_id, amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))'
    ).bind(usageId, companyId, id, entityType, entityId, amount, 'committed').run();
    await db.prepare(
      'UPDATE vendor_funds SET committed_amount = committed_amount + ?, available_amount = MAX(0, available_amount - ?), updated_at = datetime("now") WHERE id = ? AND company_id = ?'
    ).bind(amount, amount, id, companyId).run();
    return c.json({ success: true, data: { usageId }, message: 'Fund charged' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

vendorFundRoutes.post('/:id/claim', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const { usageIds, proofOfPerformance } = await c.req.json();
    for (const usageId of (usageIds || [])) {
      await db.prepare(
        "UPDATE vendor_fund_usages SET status = 'claimed', proof_of_performance = ?, claimed_at = datetime('now') WHERE id = ? AND vendor_fund_id = ?"
      ).bind(proofOfPerformance || null, usageId, id).run();
    }
    const totalClaimed = await db.prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM vendor_fund_usages WHERE vendor_fund_id = ? AND status = 'claimed'"
    ).bind(id).first();
    await db.prepare(
      'UPDATE vendor_funds SET claimed_amount = ?, updated_at = datetime("now") WHERE id = ? AND company_id = ?'
    ).bind(totalClaimed?.total || 0, id, companyId).run();
    return c.json({ success: true, message: 'Claim submitted' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

vendorFundRoutes.post('/:id/renew', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const userId = c.get('userId');
    const { id } = c.req.param();
    const data = await c.req.json();
    const fund = await db.prepare('SELECT * FROM vendor_funds WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!fund) return c.json({ success: false, message: 'Not found' }, 404);
    const newId = getId();
    await db.prepare(`
      INSERT INTO vendor_funds (id, company_id, vendor_id, name, description, fund_type, status, total_amount, available_amount, currency, start_date, end_date,
        customer_hierarchy_level, customer_hierarchy_id, customer_hierarchy_name, product_hierarchy_level, product_hierarchy_id, product_hierarchy_name,
        min_spend_pct, requires_proof_of_performance, proof_types, vendor_contact_name, vendor_contact_email, vendor_reference,
        payment_terms, invoice_frequency, created_by, notes, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      newId, companyId, fund.vendor_id, data.name || fund.name + ' (Renewed)', fund.description, fund.fund_type,
      data.total_amount || fund.total_amount, data.total_amount || fund.total_amount, fund.currency,
      data.start_date, data.end_date,
      fund.customer_hierarchy_level, fund.customer_hierarchy_id, fund.customer_hierarchy_name,
      fund.product_hierarchy_level, fund.product_hierarchy_id, fund.product_hierarchy_name,
      fund.min_spend_pct, fund.requires_proof_of_performance, fund.proof_types,
      fund.vendor_contact_name, fund.vendor_contact_email, fund.vendor_reference,
      fund.payment_terms, fund.invoice_frequency, userId, data.notes || null,
      JSON.stringify({ renewedFrom: id })
    ).run();
    await db.prepare("UPDATE vendor_funds SET status = 'closed', updated_at = datetime('now') WHERE id = ? AND company_id = ?").bind(id, companyId).run();
    return c.json({ success: true, data: { id: newId }, message: 'Fund renewed' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

vendorFundRoutes.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    await db.prepare("UPDATE vendor_funds SET status = 'cancelled', updated_at = datetime('now') WHERE id = ? AND company_id = ?").bind(id, companyId).run();
    return c.json({ success: true, message: 'Fund cancelled' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

// GAP-13: Vendor Fund → Budget Engine - auto-create budget on approval
import { VendorFundEngine } from '../services/vendorFundEngine.js';

vendorFundRoutes.get('/utilization/report', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const engine = new VendorFundEngine(db);
    const report = await engine.getVendorUtilization(companyId);
    return c.json({ success: true, data: report });
  } catch (e) { return apiError(c, e, 'vendorFunds.utilization'); }
});

vendorFundRoutes.get('/:id/linked-budgets', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const budgets = await db.prepare(
      "SELECT * FROM budgets WHERE company_id = ? AND vendor_fund_id = ? ORDER BY created_at DESC"
    ).bind(companyId, id).all();
    return c.json({ success: true, data: budgets.results || [] });
  } catch (e) { return apiError(c, e, 'vendorFunds.linkedBudgets'); }
});
