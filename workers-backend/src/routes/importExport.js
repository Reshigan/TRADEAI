import { Hono } from 'hono';
import {authMiddleware, requireMinRole } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';
import { apiError } from '../utils/apiError.js';

const importExport = new Hono();
importExport.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();
const getCompanyId = (c) => {
  const id = c.get('companyId') || c.get('tenantId') || c.req.header('X-Company-Code');
  if (!id) throw new Error('TENANT_REQUIRED');
  return id;
};

const TEMPLATE_COLUMNS = {
  customers: ['name', 'code', 'customer_type', 'channel', 'tier', 'status', 'region', 'city'],
  products: ['name', 'code', 'sku', 'barcode', 'category', 'subcategory', 'brand', 'unit_price', 'cost_price', 'status'],
  promotions: ['name', 'description', 'promotion_type', 'status', 'start_date', 'end_date'],
  budgets: ['name', 'year', 'amount', 'budget_type', 'status'],
  'trade-spends': ['spend_id', 'spend_type', 'activity_type', 'amount', 'status', 'customer_id', 'budget_id', 'product_id', 'description'],
  claims: ['claim_number', 'claim_type', 'status', 'customer_id', 'claimed_amount', 'reason'],
  deductions: ['deduction_number', 'deduction_type', 'status', 'customer_id', 'invoice_number', 'deduction_amount', 'reason_description'],
  vendors: ['name', 'code', 'vendor_type', 'status', 'contact_name', 'contact_email', 'city'],
  campaigns: ['name', 'description', 'campaign_type', 'status', 'start_date', 'end_date', 'budget_amount'],
  rebates: ['name', 'description', 'rebate_type', 'status', 'customer_id', 'rate', 'rate_type'],
  'trading-terms': ['name', 'description', 'term_type', 'status', 'customer_id', 'rate', 'rate_type']
};

const TABLE_MAP = {
  customers: 'customers',
  customer: 'customers',
  products: 'products',
  product: 'products',
  promotions: 'promotions',
  promotion: 'promotions',
  budgets: 'budgets',
  budget: 'budgets',
  'trade-spends': 'trade_spends',
  'trade-spend': 'trade_spends',
  claims: 'claims',
  claim: 'claims',
  deductions: 'deductions',
  deduction: 'deductions',
  vendors: 'vendors',
  vendor: 'vendors',
  campaigns: 'campaigns',
  campaign: 'campaigns',
  rebates: 'rebates',
  rebate: 'rebates',
  'trading-terms': 'trading_terms',
  'trading-term': 'trading_terms'
};

// Columns that actually exist in each D1 table (used for INSERT validation)
const TABLE_COLUMNS = {
  customers: ['id', 'company_id', 'name', 'code', 'sap_customer_id', 'customer_type', 'channel', 'tier', 'status', 'region', 'city', 'sub_channel', 'segmentation', 'hierarchy_1', 'hierarchy_2', 'hierarchy_3', 'head_office', 'data', 'created_at', 'updated_at'],
  products: ['id', 'company_id', 'name', 'sku', 'barcode', 'category', 'subcategory', 'brand', 'unit_price', 'cost_price', 'status', 'vendor', 'sub_brand', 'code', 'data', 'created_at', 'updated_at'],
  promotions: ['id', 'company_id', 'name', 'description', 'promotion_type', 'status', 'start_date', 'end_date', 'sell_in_start_date', 'sell_in_end_date', 'created_by', 'budget_id', 'expected_spend', 'actual_spend', 'data', 'created_at', 'updated_at'],
  budgets: ['id', 'company_id', 'name', 'year', 'amount', 'utilized', 'status', 'budget_type', 'created_by', 'committed', 'spent', 'data', 'created_at', 'updated_at'],
  trade_spends: ['id', 'company_id', 'spend_id', 'spend_type', 'activity_type', 'amount', 'status', 'customer_id', 'promotion_id', 'budget_id', 'created_by', 'product_id', 'description', 'data', 'created_at', 'updated_at'],
  claims: ['id', 'company_id', 'claim_number', 'claim_type', 'status', 'customer_id', 'promotion_id', 'rebate_id', 'claimed_amount', 'approved_amount', 'settled_amount', 'claim_date', 'due_date', 'reason', 'created_by', 'data', 'created_at', 'updated_at'],
  deductions: ['id', 'company_id', 'deduction_number', 'deduction_type', 'status', 'customer_id', 'invoice_number', 'invoice_date', 'deduction_amount', 'matched_amount', 'remaining_amount', 'deduction_date', 'reason_code', 'reason_description', 'created_by', 'data', 'created_at', 'updated_at'],
  vendors: ['id', 'company_id', 'name', 'code', 'vendor_type', 'status', 'contact_name', 'contact_email', 'contact_phone', 'address', 'city', 'region', 'country', 'payment_terms', 'tax_number', 'data', 'created_at', 'updated_at'],
  campaigns: ['id', 'company_id', 'name', 'description', 'campaign_type', 'status', 'start_date', 'end_date', 'budget_amount', 'spent_amount', 'created_by', 'data', 'created_at', 'updated_at'],
  rebates: ['id', 'company_id', 'name', 'description', 'rebate_type', 'status', 'customer_id', 'start_date', 'end_date', 'rate', 'rate_type', 'threshold', 'accrued_amount', 'settled_amount', 'created_by', 'data', 'created_at', 'updated_at'],
  trading_terms: ['id', 'company_id', 'name', 'description', 'term_type', 'status', 'customer_id', 'start_date', 'end_date', 'rate', 'rate_type', 'threshold', 'created_by', 'data', 'created_at', 'updated_at'],
};

const NUMERIC_COLS = new Set([
  'amount', 'unit_price', 'cost_price', 'rate', 'threshold', 'claimed_amount',
  'approved_amount', 'settled_amount', 'deduction_amount', 'matched_amount', 'remaining_amount',
  'budget_amount', 'spent_amount', 'accrued_amount', 'expected_spend', 'actual_spend',
  'utilized', 'committed', 'spent'
]);

function parseCsv(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === 0) continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || '').trim();
    });
    rows.push(row);
  }
  return rows;
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = '';
    } else { current += ch; }
  }
  result.push(current);
  return result;
}

function buildInsert(tableName, row, companyId, userId) {
  const validColumns = TABLE_COLUMNS[tableName];
  if (!validColumns) return null;
  const id = generateId();
  const ts = new Date().toISOString();
  const insertCols = ['id', 'company_id', 'created_at', 'updated_at'];
  const insertVals = [id, companyId, ts, ts];
  const extraData = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === undefined || value === null || value === '') continue;
    if (['id', 'company_id', 'created_at', 'updated_at', 'data'].includes(key)) continue;
    if (validColumns.includes(key)) {
      if (NUMERIC_COLS.has(key)) { insertCols.push(key); insertVals.push(parseFloat(value) || 0); }
      else if (key === 'year') { insertCols.push(key); insertVals.push(parseInt(value) || new Date().getFullYear()); }
      else { insertCols.push(key); insertVals.push(value); }
    } else { extraData[key] = value; }
  }
  if (validColumns.includes('created_by') && !insertCols.includes('created_by')) {
    insertCols.push('created_by'); insertVals.push(userId);
  }
  if (validColumns.includes('data') && !insertCols.includes('data')) {
    insertCols.push('data'); insertVals.push(JSON.stringify(extraData));
  }
  const placeholders = insertCols.map(() => '?').join(', ');
  const sql = `INSERT INTO ${tableName} (${insertCols.join(', ')}) VALUES (${placeholders})`;
  return { sql, values: insertVals, id };
}

importExport.get('/formats', async (c) => {
  return c.json({
    success: true,
    data: {
      importFormats: ['csv', 'json', 'xlsx'],
      exportFormats: ['csv', 'json', 'xlsx'],
      modules: Object.keys(TEMPLATE_COLUMNS)
    }
  });
});

importExport.get('/jobs', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const result = await db.prepare('SELECT * FROM import_jobs WHERE company_id = ? ORDER BY created_at DESC LIMIT 50').bind(companyId).all();
    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return apiError(c, error, 'importExport');
  }
});

importExport.get('/template/:module', async (c) => {
  try {
    const { module } = c.req.param();
    const columns = TEMPLATE_COLUMNS[module];
    if (!columns) return c.json({ success: false, message: `Unknown module: ${module}` }, 400);

    const csv = columns.join(',') + '\n' + columns.map(() => '').join(',');
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${module}-template.csv"`
      }
    });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return apiError(c, error, 'importExport');
  }
});

importExport.get('/:module', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { module } = c.req.param();
    const { format = 'json' } = c.req.query();

    const tableName = TABLE_MAP[module];
    if (!tableName) return c.json({ success: false, message: `Unknown module: ${module}` }, 400);

    const result = await db.prepare(`SELECT * FROM ${tableName} WHERE company_id = ? ORDER BY created_at DESC`).bind(companyId).all();
    const data = (result.results || []).map(rowToDocument);

    if (format === 'csv') {
      const columns = TEMPLATE_COLUMNS[module] || Object.keys(data[0] || {});
      const header = columns.join(',');
      const rows = data.map(row => columns.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(','));
      const csv = [header, ...rows].join('\n');
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${module}-export.csv"`
        }
      });
    }

    return c.json({ success: true, data, total: data.length });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return apiError(c, error, 'importExport');
  }
});

importExport.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const userId = c.get('userId') || 'system';
    const jobId = generateId();
    const ts = new Date().toISOString();
    const contentType = c.req.header('Content-Type') || '';
    let importType = 'unknown';
    let fileName = 'upload';
    let records = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData();
      const file = formData.get('file');
      importType = formData.get('entity') || formData.get('type') || formData.get('module') || 'unknown';
      fileName = file?.name || 'upload';
      if (file) { const csvText = await file.text(); records = parseCsv(csvText); }
    } else {
      const body = await c.req.json();
      importType = body.entity || body.type || body.module || 'unknown';
      fileName = body.fileName || 'api-upload';
      records = body.records || body.data || [];
    }

    const tableName = TABLE_MAP[importType];
    let successRows = 0;
    let errorRows = 0;
    const errors = [];

    if (tableName && records.length > 0) {
      // Build all insert statements first
      const stmts = [];
      const stmtIndexes = [];
      for (let i = 0; i < records.length; i++) {
        try {
          const insert = buildInsert(tableName, records[i], companyId, userId);
          if (insert) {
            stmts.push(db.prepare(insert.sql).bind(...insert.values));
            stmtIndexes.push(i);
          } else {
            errorRows++;
            errors.push(`Row ${i + 1}: Unknown table`);
          }
        } catch (buildErr) {
          errorRows++;
          if (errors.length < 50) errors.push(`Row ${i + 1}: ${buildErr.message}`);
        }
      }
      // Execute in batches of 100 (D1 batch limit is ~500 but keeping conservative)
      const BATCH_SIZE = 100;
      for (let b = 0; b < stmts.length; b += BATCH_SIZE) {
        const batch = stmts.slice(b, b + BATCH_SIZE);
        try {
          await db.batch(batch);
          successRows += batch.length;
        } catch (batchErr) {
          // If batch fails, try individual inserts for this batch to identify bad rows
          for (let j = 0; j < batch.length; j++) {
            try {
              await batch[j].run();
              successRows++;
            } catch (rowErr) {
              errorRows++;
              const origIdx = stmtIndexes[b + j];
              if (errors.length < 50) errors.push(`Row ${origIdx + 1}: ${rowErr.message}`);
            }
          }
        }
      }
    } else if (!tableName && records.length > 0) {
      errorRows = records.length;
      errors.push(`Unknown import type: ${importType}. Valid types: ${Object.keys(TEMPLATE_COLUMNS).join(', ')}`);
    }

    await db.prepare(`
      INSERT INTO import_jobs (id, company_id, import_type, status, file_name, total_rows, processed_rows, success_rows, error_rows, errors, created_by, created_at, updated_at)
      VALUES (?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(jobId, companyId, importType, fileName, records.length, records.length, successRows, errorRows, JSON.stringify(errors), userId, ts, ts).run();

    return c.json({
      success: true,
      data: {
        importId: jobId, status: 'completed', totalRows: records.length, processedRows: records.length,
        successRows, errorRows, created: successRows, updated: 0, failed: errorRows, errors,
        message: `Imported ${successRows} of ${records.length} records`
      }
    }, 201);
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return apiError(c, error, 'importExport');
  }
});

importExport.post('/:module', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const userId = c.get('userId') || 'system';
    const { module } = c.req.param();
    const jobId = generateId();
    const ts = new Date().toISOString();

    const tableName = TABLE_MAP[module];
    if (!tableName) return c.json({ success: false, message: `Unknown module: ${module}. Valid modules: ${Object.keys(TEMPLATE_COLUMNS).join(', ')}` }, 400);

    const contentType = c.req.header('Content-Type') || '';
    let records = [];
    let fileName = `${module}-import`;

    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData();
      const file = formData.get('file');
      fileName = file?.name || fileName;
      if (file) { const csvText = await file.text(); records = parseCsv(csvText); }
    } else {
      const body = await c.req.json();
      records = body.records || body.data || [];
    }

    if (records.length === 0) {
      return c.json({ success: false, message: 'No data rows found. Please upload a CSV file with headers and at least one data row.' }, 400);
    }

    let successRows = 0;
    let errorRows = 0;
    const errors = [];

    // Build all insert statements first
    const stmts = [];
    const stmtIndexes = [];
    for (let i = 0; i < records.length; i++) {
      try {
        const insert = buildInsert(tableName, records[i], companyId, userId);
        if (insert) {
          stmts.push(db.prepare(insert.sql).bind(...insert.values));
          stmtIndexes.push(i);
        } else {
          errorRows++;
          errors.push(`Row ${i + 1}: Failed to build insert`);
        }
      } catch (buildErr) {
        errorRows++;
        if (errors.length < 50) errors.push(`Row ${i + 1}: ${buildErr.message}`);
      }
    }
    // Execute in batches of 100
    const BATCH_SIZE = 100;
    for (let b = 0; b < stmts.length; b += BATCH_SIZE) {
      const batch = stmts.slice(b, b + BATCH_SIZE);
      try {
        await db.batch(batch);
        successRows += batch.length;
      } catch (batchErr) {
        // If batch fails, try individual inserts to identify bad rows
        for (let j = 0; j < batch.length; j++) {
          try {
            await batch[j].run();
            successRows++;
          } catch (rowErr) {
            errorRows++;
            const origIdx = stmtIndexes[b + j];
            if (errors.length < 50) errors.push(`Row ${origIdx + 1}: ${rowErr.message}`);
          }
        }
      }
    }

    await db.prepare(`
      INSERT INTO import_jobs (id, company_id, import_type, status, file_name, total_rows, processed_rows, success_rows, error_rows, errors, created_by, created_at, updated_at)
      VALUES (?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(jobId, companyId, module, fileName, records.length, records.length, successRows, errorRows, JSON.stringify(errors.slice(0, 20)), userId, ts, ts).run();

    return c.json({
      success: true,
      data: {
        importId: jobId, status: 'completed', totalRows: records.length, processedRows: records.length,
        successRows, errorRows, created: successRows, updated: 0, failed: errorRows, errors,
        message: `Imported ${successRows} of ${records.length} ${module} records`
      }
    }, 201);
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return apiError(c, error, 'importExport');
  }
});

export const importExportRoutes = importExport;
