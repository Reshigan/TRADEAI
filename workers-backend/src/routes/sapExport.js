import { Hono } from 'hono';
import {authMiddleware, requireMinRole } from '../middleware/auth.js';
import { apiError } from '../utils/apiError.js';

export const sapExportRoutes = new Hono();
sapExportRoutes.use('*', authMiddleware);

const getCompanyId = (c) => c.get('companyId') || c.get('tenantId') || c.req.header('X-Company-Code');
const escCsv = (v) => `"${String(v || '').replace(/"/g, '""')}"`;
const toSapDate = (d) => d ? d.replace(/-/g, '').substring(0, 8) : '';

const csvResponse = (csv, filename) => new Response(csv, {
  headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename=${filename}` }
});

sapExportRoutes.get('/templates', async (c) => {
  return c.json({
    success: true,
    data: [
      { id: 'material-master', name: 'Material Master', sapTransaction: 'MM01/MM02', description: 'Product data for SAP Material Master', direction: 'export' },
      { id: 'customer-master', name: 'Customer Master', sapTransaction: 'XD01/XD02', description: 'Customer data for SAP Customer Master', direction: 'export' },
      { id: 'vendor-master', name: 'Vendor Master', sapTransaction: 'FK01/FK02', description: 'Vendor data for SAP Vendor Master', direction: 'export' },
      { id: 'condition-records', name: 'Condition Records', sapTransaction: 'VK11/VK12', description: 'Pricing conditions for SAP SD', direction: 'export' },
      { id: 'sales-orders', name: 'Sales Orders', sapTransaction: 'VA01', description: 'Sales transaction data', direction: 'export' },
      { id: 'vendor-invoices', name: 'Vendor Invoices', sapTransaction: 'MIRO/FB60', description: 'Settlement invoices for SAP FI', direction: 'export' },
      { id: 'accruals', name: 'Accrual Postings', sapTransaction: 'FBS1', description: 'Accrual journal entries for SAP FI', direction: 'export' },
      { id: 'copa', name: 'CO-PA Line Items', sapTransaction: 'KE24', description: 'Profitability analysis data', direction: 'export' },
      { id: 'deductions', name: 'AR Deductions', sapTransaction: 'FBL5N', description: 'Accounts receivable deductions for SAP FI-AR', direction: 'export' },
      { id: 'claims', name: 'Credit Memos', sapTransaction: 'FB65/MIRO', description: 'Credit memo requests and claims for SAP FI', direction: 'export' },
      { id: 'rebates', name: 'Rebate Settlements', sapTransaction: 'VBO3/VBOF', description: 'Rebate agreement settlements for SAP SD', direction: 'export' },
      { id: 'trade-spends', name: 'Trade Spend Postings', sapTransaction: 'F-02/FB50', description: 'Trade spend GL postings for SAP FI', direction: 'export' },
      { id: 'budgets', name: 'Fund Management', sapTransaction: 'FMBB/FM5I', description: 'Budget and fund data for SAP Funds Management', direction: 'export' },
      { id: 'promotions', name: 'Trade Promotions', sapTransaction: 'TPM', description: 'Trade promotion data for SAP TPM', direction: 'export' },
    ]
  });
});

sapExportRoutes.get('/material-master', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const products = await db.prepare('SELECT * FROM products WHERE company_id = ?').bind(companyId).all();
    const headers = ['MATNR', 'MAKTX', 'MATKL', 'MEINS', 'BRGEW', 'NTGEW', 'MTART', 'SPART'];
    const rows = (products.results || []).map(p => {
      const data = JSON.parse(p.data || '{}');
      return [p.sku || (p.id || '').substring(0, 18), (p.name || '').substring(0, 40), p.category || '', data.unitOfMeasure || 'EA', data.grossWeight || '', data.netWeight || '', 'FERT', data.division || '00'].map(escCsv).join(',');
    });
    return csvResponse([headers.join(','), ...rows].join('\n'), 'SAP_Material_Master_MM01.csv');
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

sapExportRoutes.get('/customer-master', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const customers = await db.prepare('SELECT * FROM customers WHERE company_id = ?').bind(companyId).all();
    const headers = ['KUNNR', 'NAME1', 'STRAS', 'ORT01', 'PSTLZ', 'LAND1', 'KTOKD', 'VKORG', 'VTWEG'];
    const rows = (customers.results || []).map(cu => {
      const data = JSON.parse(cu.data || '{}');
      return [(cu.code || cu.id || '').substring(0, 10), (cu.name || '').substring(0, 35), data.street || cu.address || '', data.city || cu.city || '', data.postalCode || '', data.country || 'ZA', 'ZTRA', data.salesOrg || '1000', data.distChannel || '10'].map(escCsv).join(',');
    });
    return csvResponse([headers.join(','), ...rows].join('\n'), 'SAP_Customer_Master_XD01.csv');
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

sapExportRoutes.get('/vendor-master', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const vendors = await db.prepare('SELECT * FROM vendors WHERE company_id = ?').bind(companyId).all();
    const headers = ['LIFNR', 'NAME1', 'STRAS', 'ORT01', 'PSTLZ', 'LAND1', 'KTOKK', 'BUKRS'];
    const rows = (vendors.results || []).map(v => {
      const data = JSON.parse(v.data || '{}');
      return [(v.code || v.id || '').substring(0, 10), (v.name || '').substring(0, 35), data.street || v.address || '', data.city || '', data.postalCode || '', data.country || 'ZA', 'ZKRE', data.companyCode || '1000'].map(escCsv).join(',');
    });
    return csvResponse([headers.join(','), ...rows].join('\n'), 'SAP_Vendor_Master_FK01.csv');
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

sapExportRoutes.get('/condition-records', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { startDate, endDate } = c.req.query();
    const terms = await db.prepare('SELECT * FROM trading_terms WHERE company_id = ?').bind(companyId).all();
    const promos = await db.prepare(
      "SELECT * FROM promotions WHERE company_id = ? AND status IN ('approved','active','completed')"
    ).bind(companyId).all();
    const headers = ['KSCHL', 'VKORG', 'VTWEG', 'MATNR', 'KUNNR', 'KBETR', 'KONWA', 'DATAB', 'DATBI'];
    const rows = [];
    for (const t of (terms.results || [])) {
      const data = JSON.parse(t.data || '{}');
      rows.push(['ZTR0', '1000', '10', data.productId || '', data.customerId || t.customer_id || '', t.rate || t.discount_rate || 0, 'ZAR', toSapDate(t.start_date), toSapDate(t.end_date)].map(escCsv).join(','));
    }
    for (const p of (promos.results || [])) {
      const data = JSON.parse(p.data || '{}');
      rows.push(['ZPR0', '1000', '10', '', '', p.expected_spend || 0, 'ZAR', toSapDate(p.start_date), toSapDate(p.end_date)].map(escCsv).join(','));
    }
    return csvResponse([headers.join(','), ...rows].join('\n'), 'SAP_Condition_Records_VK11.csv');
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

sapExportRoutes.get('/sales-orders', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { startDate, endDate } = c.req.query();
    let query = 'SELECT * FROM sales_transactions WHERE company_id = ?';
    const params = [companyId];
    if (startDate) { query += ' AND transaction_date >= ?'; params.push(startDate); }
    if (endDate) { query += ' AND transaction_date <= ?'; params.push(endDate); }
    query += ' ORDER BY transaction_date DESC LIMIT 10000';
    const txns = await db.prepare(query).bind(...params).all();
    const headers = ['AUART', 'VKORG', 'VTWEG', 'KUNNR', 'MATNR', 'KWMENG', 'VRKME', 'NETPR', 'WAERK'];
    const rows = (txns.results || []).map(t => ['ZOR', '1000', '10', (t.customer_id || '').substring(0, 10), (t.product_id || '').substring(0, 18), t.quantity || 0, 'EA', t.unit_price || 0, 'ZAR'].map(escCsv).join(','));
    return csvResponse([headers.join(','), ...rows].join('\n'), 'SAP_Sales_Orders_VA01.csv');
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

sapExportRoutes.get('/vendor-invoices', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const settlements = await db.prepare(
      "SELECT * FROM settlements WHERE company_id = ? AND status IN ('approved','completed','paid') ORDER BY created_at DESC"
    ).bind(companyId).all();
    const headers = ['BELNR', 'BUKRS', 'LIFNR', 'BLDAT', 'BUDAT', 'XBLNR', 'WRBTR', 'WAERS', 'MWSKZ'];
    const rows = (settlements.results || []).map(s => [(s.id || '').substring(0, 10), '1000', (s.customer_id || '').substring(0, 10), toSapDate(s.created_at), toSapDate(s.created_at), s.id || '', s.net_amount || 0, 'ZAR', 'V0'].map(escCsv).join(','));
    return csvResponse([headers.join(','), ...rows].join('\n'), 'SAP_Vendor_Invoices_MIRO.csv');
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

sapExportRoutes.get('/accruals', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const accruals = await db.prepare('SELECT * FROM accruals WHERE company_id = ? ORDER BY created_at DESC').bind(companyId).all();
    const headers = ['BUKRS', 'BELNR', 'BLART', 'BLDAT', 'BUDAT', 'HKONT', 'WRBTR', 'WAERS', 'SGTXT'];
    const rows = (accruals.results || []).map(a => ['1000', (a.id || '').substring(0, 10), 'SA', toSapDate(a.created_at), toSapDate(a.created_at), '4100000', a.amount || 0, 'ZAR', (a.name || '').substring(0, 50)].map(escCsv).join(','));
    return csvResponse([headers.join(','), ...rows].join('\n'), 'SAP_Accrual_Postings_FBS1.csv');
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

sapExportRoutes.get('/copa', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const sales = await db.prepare(
      "SELECT customer_id, product_id, SUM(gross_amount) as gross, SUM(net_amount) as net, SUM(discount_amount) as disc, strftime('%Y%m', transaction_date) as period FROM sales_transactions WHERE company_id = ? GROUP BY customer_id, product_id, strftime('%Y%m', transaction_date) ORDER BY period DESC LIMIT 5000"
    ).bind(companyId).all();
    const headers = ['VKORG', 'KNDNR', 'MATNR', 'PERDE', 'ERLOS', 'ERLOE'];
    const rows = (sales.results || []).map(s => ['1000', (s.customer_id || '').substring(0, 10), (s.product_id || '').substring(0, 18), s.period || '', s.gross || 0, s.net || 0].map(escCsv).join(','));
    return csvResponse([headers.join(','), ...rows].join('\n'), 'SAP_COPA_KE24.csv');
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

// Export: AR Deductions -> SAP FBL5N format
sapExportRoutes.get('/deductions', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const deductions = await db.prepare('SELECT * FROM deductions WHERE company_id = ? ORDER BY created_at DESC').bind(companyId).all();
    const headers = ['BELNR', 'BUKRS', 'GJAHR', 'KUNNR', 'BLDAT', 'BUDAT', 'DMBTR', 'WAERS', 'SGTXT', 'RSTGR', 'SHKZG'];
    const rows = (deductions.results || []).map(d => [
      (d.deduction_number || d.id || '').substring(0, 10), '1000', new Date().getFullYear(),
      (d.customer_id || '').substring(0, 10), toSapDate(d.deduction_date || d.created_at), toSapDate(d.deduction_date || d.created_at),
      d.deduction_amount || 0, 'ZAR', (d.reason_description || '').substring(0, 50), d.reason_code || '', 'H'
    ].map(escCsv).join(','));
    return csvResponse([headers.join(','), ...rows].join('\n'), 'SAP_Deductions_FBL5N.csv');
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

// Export: Claims -> SAP Credit Memo format (FB65/MIRO)
sapExportRoutes.get('/claims', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const claims = await db.prepare('SELECT * FROM claims WHERE company_id = ? ORDER BY created_at DESC').bind(companyId).all();
    const headers = ['BELNR', 'BUKRS', 'BLART', 'LIFNR', 'BLDAT', 'BUDAT', 'DMBTR', 'WAERS', 'SGTXT', 'XBLNR'];
    const rows = (claims.results || []).map(cl => [
      (cl.claim_number || cl.id || '').substring(0, 10), '1000', 'KG',
      (cl.customer_id || '').substring(0, 10), toSapDate(cl.claim_date || cl.created_at), toSapDate(cl.claim_date || cl.created_at),
      cl.claimed_amount || 0, 'ZAR', (cl.reason || cl.claim_type || '').substring(0, 50), cl.claim_number || ''
    ].map(escCsv).join(','));
    return csvResponse([headers.join(','), ...rows].join('\n'), 'SAP_Credit_Memos_FB65.csv');
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

// Export: Rebate Settlements -> SAP VBO3/VBOF format
sapExportRoutes.get('/rebates', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const rebates = await db.prepare('SELECT * FROM rebates WHERE company_id = ? ORDER BY created_at DESC').bind(companyId).all();
    const headers = ['KNUMA', 'KUNNR', 'KSCHL', 'KBETR', 'DATAB', 'DATBI', 'BOSTA', 'BOTEFM', 'BONBA', 'WAERS'];
    const rows = (rebates.results || []).map(r => {
      const statusMap = { active: 'B', draft: 'A', completed: 'C', cancelled: 'D' };
      return [
        (r.id || '').substring(0, 10), (r.customer_id || '').substring(0, 10), 'ZRB0',
        r.rate || 0, toSapDate(r.start_date), toSapDate(r.end_date),
        statusMap[r.status] || 'A', '04', r.accrued_amount || 0, 'ZAR'
      ].map(escCsv).join(',');
    });
    return csvResponse([headers.join(','), ...rows].join('\n'), 'SAP_Rebate_Settlements_VBO3.csv');
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

// Export: Trade Spend GL Postings -> SAP F-02/FB50 format
sapExportRoutes.get('/trade-spends', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const spends = await db.prepare(
      "SELECT * FROM trade_spends WHERE company_id = ? AND status IN ('approved','completed') ORDER BY created_at DESC"
    ).bind(companyId).all();
    const headers = ['BUKRS', 'BELNR', 'BLART', 'BLDAT', 'BUDAT', 'HKONT', 'KOSTL', 'DMBTR', 'WAERS', 'SGTXT', 'ZUONR'];
    const rows = (spends.results || []).map(s => [
      '1000', (s.spend_id || s.id || '').substring(0, 10), 'SA',
      toSapDate(s.period_start || s.created_at), toSapDate(s.period_start || s.created_at),
      '6100000', '', s.amount_actual || s.amount_approved || 0, 'ZAR',
      (s.notes || s.spend_type || '').substring(0, 50), s.customer_id || ''
    ].map(escCsv).join(','));
    return csvResponse([headers.join(','), ...rows].join('\n'), 'SAP_Trade_Spend_Postings_FB50.csv');
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

// Export: Budget/Fund Management -> SAP FMBB format
sapExportRoutes.get('/budgets', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const budgets = await db.prepare('SELECT * FROM budgets WHERE company_id = ? ORDER BY year DESC, created_at DESC').bind(companyId).all();
    const headers = ['FINCODE', 'FICTR', 'FIPEX', 'GJAHR', 'BUDGET', 'OBLIGO', 'ACTUAL', 'AVAILABLE', 'BEZEICH', 'WAERS'];
    const rows = (budgets.results || []).map(b => [
      (b.id || '').substring(0, 16), 'TRD01', 'TP001',
      b.year || new Date().getFullYear(), b.amount || 0,
      b.allocated || 0, b.spent || 0, b.remaining || 0,
      (b.name || '').substring(0, 40), 'ZAR'
    ].map(escCsv).join(','));
    return csvResponse([headers.join(','), ...rows].join('\n'), 'SAP_Fund_Management_FMBB.csv');
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

// Export: Trade Promotions -> SAP TPM format
sapExportRoutes.get('/promotions', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const promos = await db.prepare('SELECT * FROM promotions WHERE company_id = ? ORDER BY created_at DESC').bind(companyId).all();
    const headers = ['PROMO_ID', 'NAME', 'DESCRIPTION', 'PROMO_TYPE', 'STATUS', 'KUNNR', 'START_DATE', 'END_DATE', 'PLANNED_SPEND', 'ACTUAL_SPEND', 'EXPECTED_LIFT', 'WAERS'];
    const rows = (promos.results || []).map(p => [
      (p.id || '').substring(0, 20), (p.name || '').substring(0, 40), (p.description || '').substring(0, 80),
      p.promotion_type || '', p.status || '', (p.customer_id || '').substring(0, 10),
      toSapDate(p.start_date), toSapDate(p.end_date),
      p.planned_spend || 0, p.actual_spend || 0, p.expected_lift || 0, 'ZAR'
    ].map(escCsv).join(','));
    return csvResponse([headers.join(','), ...rows].join('\n'), 'SAP_Trade_Promotions_TPM.csv');
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});
