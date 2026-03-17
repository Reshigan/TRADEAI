import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';

export const sapImportRoutes = new Hono();
sapImportRoutes.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();
const getCompanyId = (c) => {
  const id = c.get('companyId') || c.get('tenantId') || c.req.header('X-Company-Code');
  if (!id) throw new Error('TENANT_REQUIRED');
  return id;
};
const getUserId = (c) => c.get('userId') || 'system';
const now = () => new Date().toISOString();

// Parse CSV text into array of objects using header row
function parseCsv(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === 0) continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || '').trim().replace(/^"|"$/g, '');
    });
    rows.push(row);
  }
  return rows;
}

// Handle quoted CSV fields correctly
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ============================================
// SAP IMPORT FIELD MAPPINGS
// Maps SAP field names to TradeAI DB columns
// ============================================

const SAP_IMPORT_CONFIGS = {
  // SAP Customer Master (KNA1/KNVV) -> customers table
  'customer-master': {
    table: 'customers',
    sapTransaction: 'XD01/XD02',
    description: 'Import customer master data from SAP KNA1/KNVV',
    requiredFields: ['KUNNR', 'NAME1'],
    fieldMap: {
      'KUNNR': 'code',
      'NAME1': 'name',
      'STRAS': '_address',
      'ORT01': '_city',
      'PSTLZ': '_postalCode',
      'LAND1': '_country',
      'REGIO': '_region',
      'KTOKD': '_accountGroup',
      'VKORG': '_salesOrg',
      'VTWEG': '_distChannel',
      'SPART': '_division',
      'KATR1': 'channel',
      'KATR2': 'tier',
      'KATR3': '_subChannel',
      'BRSCH': '_industry',
      'KUKLA': 'customer_type',
      'WAERS': '_currency',
      'ZTERM': '_paymentTerms',
    },
    transform: (row, companyId, userId) => {
      const id = generateId();
      const ts = now();
      const data = {};
      Object.entries(row).forEach(([k, v]) => {
        if (k.startsWith('_') && v) data[k.substring(1)] = v;
      });
      return {
        id,
        company_id: companyId,
        name: row.name || '',
        code: row.code || '',
        customer_type: row.customer_type || 'retailer',
        channel: row.channel || 'modern_trade',
        tier: row.tier || 'standard',
        status: 'active',
        region: row._region || '',
        city: row._city || '',
        address: row._address || '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        credit_limit: 0,
        payment_terms: row._paymentTerms || 'net30',
        data: JSON.stringify(data),
        created_at: ts,
        updated_at: ts,
      };
    },
    insertSql: `INSERT OR REPLACE INTO customers (id, company_id, name, code, customer_type, channel, tier, status, region, city, address, contact_name, contact_email, contact_phone, credit_limit, payment_terms, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    bindRow: (r) => [r.id, r.company_id, r.name, r.code, r.customer_type, r.channel, r.tier, r.status, r.region, r.city, r.address, r.contact_name, r.contact_email, r.contact_phone, r.credit_limit, r.payment_terms, r.data, r.created_at, r.updated_at],
  },

  // SAP Material Master (MARA/MARC) -> products table
  'material-master': {
    table: 'products',
    sapTransaction: 'MM01/MM02',
    description: 'Import material master data from SAP MARA/MARC',
    requiredFields: ['MATNR', 'MAKTX'],
    fieldMap: {
      'MATNR': 'sku',
      'MAKTX': 'name',
      'MATKL': 'category',
      'MEINS': '_unitOfMeasure',
      'BRGEW': '_grossWeight',
      'NTGEW': '_netWeight',
      'MTART': '_materialType',
      'SPART': '_division',
      'BISMT': '_oldMaterialNumber',
      'EAN11': 'barcode',
      'PRDHA': '_productHierarchy',
      'BRAND_ID': 'brand',
      'VERPR': 'cost_price',
      'STPRS': 'unit_price',
      'WAERS': '_currency',
    },
    transform: (row, companyId, userId) => {
      const id = generateId();
      const ts = now();
      const data = {};
      Object.entries(row).forEach(([k, v]) => {
        if (k.startsWith('_') && v) data[k.substring(1)] = v;
      });
      return {
        id,
        company_id: companyId,
        name: row.name || '',
        sku: row.sku || '',
        barcode: row.barcode || '',
        category: row.category || '',
        subcategory: '',
        brand: row.brand || '',
        unit_price: parseFloat(row.unit_price) || 0,
        cost_price: parseFloat(row.cost_price) || 0,
        status: 'active',
        data: JSON.stringify(data),
        created_at: ts,
        updated_at: ts,
      };
    },
    insertSql: `INSERT OR REPLACE INTO products (id, company_id, name, sku, barcode, category, subcategory, brand, unit_price, cost_price, status, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    bindRow: (r) => [r.id, r.company_id, r.name, r.sku, r.barcode, r.category, r.subcategory, r.brand, r.unit_price, r.cost_price, r.status, r.data, r.created_at, r.updated_at],
  },

  // SAP Vendor Master (LFB1/LFA1) -> vendors table
  'vendor-master': {
    table: 'vendors',
    sapTransaction: 'FK01/FK02',
    description: 'Import vendor master data from SAP LFA1/LFB1',
    requiredFields: ['LIFNR', 'NAME1'],
    fieldMap: {
      'LIFNR': 'code',
      'NAME1': 'name',
      'STRAS': '_address',
      'ORT01': '_city',
      'PSTLZ': '_postalCode',
      'LAND1': '_country',
      'KTOKK': '_accountGroup',
      'BUKRS': '_companyCode',
      'ZTERM': '_paymentTerms',
      'BRSCH': '_industry',
    },
    transform: (row, companyId, userId) => {
      const id = generateId();
      const ts = now();
      const data = {};
      Object.entries(row).forEach(([k, v]) => {
        if (k.startsWith('_') && v) data[k.substring(1)] = v;
      });
      return {
        id,
        company_id: companyId,
        name: row.name || '',
        code: row.code || '',
        vendor_type: 'supplier',
        status: 'active',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        city: row._city || '',
        data: JSON.stringify(data),
        created_at: ts,
        updated_at: ts,
      };
    },
    insertSql: `INSERT OR REPLACE INTO vendors (id, company_id, name, code, vendor_type, status, contact_name, contact_email, contact_phone, city, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    bindRow: (r) => [r.id, r.company_id, r.name, r.code, r.vendor_type, r.status, r.contact_name, r.contact_email, r.contact_phone, r.city, r.data, r.created_at, r.updated_at],
  },

  // SAP Condition Records (KONH/KONP) -> trading_terms table
  'condition-records': {
    table: 'trading_terms',
    sapTransaction: 'VK11/VK12',
    description: 'Import pricing condition records from SAP SD (KONH/KONP)',
    requiredFields: ['KSCHL', 'KBETR'],
    fieldMap: {
      'KSCHL': '_conditionType',
      'VKORG': '_salesOrg',
      'VTWEG': '_distChannel',
      'KUNNR': 'customer_id',
      'MATNR': '_productId',
      'KBETR': 'rate',
      'KONWA': '_currency',
      'DATAB': 'start_date',
      'DATBI': 'end_date',
      'MENGE': '_scaleQuantity',
      'KSTBM': '_scaleBase',
    },
    transform: (row, companyId, userId) => {
      const id = generateId();
      const ts = now();
      const condType = row._conditionType || 'ZTR0';
      const termTypeMap = { 'ZTR0': 'volume_rebate', 'ZPR0': 'price_discount', 'ZBN0': 'bonus', 'ZRB0': 'rebate', 'ZMK0': 'marketing_contribution', 'ZLF0': 'listing_fee' };
      const data = {};
      Object.entries(row).forEach(([k, v]) => {
        if (k.startsWith('_') && v) data[k.substring(1)] = v;
      });
      return {
        id,
        company_id: companyId,
        name: `${condType} - ${row.customer_id || 'All'}`,
        description: `SAP condition ${condType}`,
        term_type: termTypeMap[condType] || 'volume_rebate',
        status: 'active',
        customer_id: row.customer_id || null,
        rate: parseFloat(row.rate) || 0,
        rate_type: 'percentage',
        start_date: formatSapDate(row.start_date),
        end_date: formatSapDate(row.end_date),
        data: JSON.stringify(data),
        created_at: ts,
        updated_at: ts,
      };
    },
    insertSql: `INSERT OR REPLACE INTO trading_terms (id, company_id, name, description, term_type, status, customer_id, rate, rate_type, start_date, end_date, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    bindRow: (r) => [r.id, r.company_id, r.name, r.description, r.term_type, r.status, r.customer_id, r.rate, r.rate_type, r.start_date, r.end_date, r.data, r.created_at, r.updated_at],
  },

  // SAP Billing Documents (VBRK/VBRP) -> sales_actuals / trade_spends
  'billing-documents': {
    table: 'trade_spends',
    sapTransaction: 'VF03/VBRK',
    description: 'Import billing documents from SAP SD (VBRK/VBRP)',
    requiredFields: ['VBELN', 'FKDAT', 'NETWR'],
    fieldMap: {
      'VBELN': '_billingDoc',
      'FKDAT': '_billingDate',
      'KUNAG': 'customer_id',
      'MATNR': 'product_id',
      'FKIMG': '_quantity',
      'NETWR': '_netValue',
      'MWSBP': '_taxAmount',
      'WAERK': '_currency',
      'AUBEL': '_salesOrder',
      'VKORG': '_salesOrg',
    },
    transform: (row, companyId, userId) => {
      const id = generateId();
      const ts = now();
      const data = {};
      Object.entries(row).forEach(([k, v]) => {
        if (k.startsWith('_') && v) data[k.substring(1)] = v;
      });
      const billingDate = formatSapDate(row._billingDate) || ts.split('T')[0];
      return {
        id,
        company_id: companyId,
        spend_id: `SAP-${row._billingDoc || id.substring(0, 8)}`,
        budget_id: null,
        customer_id: row.customer_id || null,
        product_id: row.product_id || null,
        amount_requested: parseFloat(row._netValue) || 0,
        amount_approved: parseFloat(row._netValue) || 0,
        amount_actual: parseFloat(row._netValue) || 0,
        spend_type: 'promotional',
        category: 'billing',
        status: 'completed',
        notes: `SAP Billing Doc ${row._billingDoc || ''}`,
        period_start: billingDate,
        period_end: billingDate,
        created_by: userId,
        data: JSON.stringify(data),
        created_at: ts,
        updated_at: ts,
      };
    },
    insertSql: `INSERT OR REPLACE INTO trade_spends (id, company_id, spend_id, budget_id, customer_id, product_id, amount_requested, amount_approved, amount_actual, spend_type, category, status, notes, period_start, period_end, created_by, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    bindRow: (r) => [r.id, r.company_id, r.spend_id, r.budget_id, r.customer_id, r.product_id, r.amount_requested, r.amount_approved, r.amount_actual, r.spend_type, r.category, r.status, r.notes, r.period_start, r.period_end, r.created_by, r.data, r.created_at, r.updated_at],
  },

  // SAP AR Deductions (FI-AR) -> deductions table
  'deductions': {
    table: 'deductions',
    sapTransaction: 'FBL5N/F-28',
    description: 'Import AR deductions from SAP FI-AR open items',
    requiredFields: ['BELNR', 'DMBTR'],
    fieldMap: {
      'BELNR': '_documentNumber',
      'BUKRS': '_companyCode',
      'GJAHR': '_fiscalYear',
      'BLDAT': '_documentDate',
      'BUDAT': '_postingDate',
      'KUNNR': 'customer_id',
      'DMBTR': 'deduction_amount',
      'WAERS': '_currency',
      'SGTXT': 'reason_description',
      'ZUONR': '_assignment',
      'REBZG': '_invoiceRef',
      'BSCHL': '_postingKey',
      'SHKZG': '_debitCredit',
      'RSTGR': 'reason_code',
    },
    transform: (row, companyId, userId) => {
      const id = generateId();
      const ts = now();
      const data = {};
      Object.entries(row).forEach(([k, v]) => {
        if (k.startsWith('_') && v) data[k.substring(1)] = v;
      });
      const reasonCodeMap = { '001': 'promotion', '002': 'rebate', '003': 'damage', '004': 'shortage', '005': 'pricing', '006': 'returns' };
      return {
        id,
        company_id: companyId,
        deduction_number: `DED-${row._documentNumber || id.substring(0, 8)}`,
        deduction_type: reasonCodeMap[row.reason_code] || 'promotion',
        status: 'open',
        customer_id: row.customer_id || null,
        invoice_number: row._invoiceRef || row._documentNumber || '',
        deduction_amount: parseFloat(row.deduction_amount) || 0,
        approved_amount: 0,
        remaining_amount: parseFloat(row.deduction_amount) || 0,
        deduction_date: formatSapDate(row._postingDate) || ts.split('T')[0],
        reason_code: row.reason_code || '',
        reason_description: row.reason_description || '',
        data: JSON.stringify(data),
        created_at: ts,
        updated_at: ts,
      };
    },
    insertSql: `INSERT OR REPLACE INTO deductions (id, company_id, deduction_number, deduction_type, status, customer_id, invoice_number, deduction_amount, approved_amount, remaining_amount, deduction_date, reason_code, reason_description, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    bindRow: (r) => [r.id, r.company_id, r.deduction_number, r.deduction_type, r.status, r.customer_id, r.invoice_number, r.deduction_amount, r.approved_amount, r.remaining_amount, r.deduction_date, r.reason_code, r.reason_description, r.data, r.created_at, r.updated_at],
  },

  // SAP GL Postings / Accruals (FI) -> accruals table
  'gl-postings': {
    table: 'accruals',
    sapTransaction: 'FBS1/F-02',
    description: 'Import GL accrual postings from SAP FI',
    requiredFields: ['BUKRS', 'HKONT', 'DMBTR'],
    fieldMap: {
      'BELNR': '_documentNumber',
      'BUKRS': '_companyCode',
      'BLART': '_documentType',
      'BLDAT': '_documentDate',
      'BUDAT': '_postingDate',
      'HKONT': 'gl_account',
      'KOSTL': 'cost_center',
      'DMBTR': '_amount',
      'WAERS': '_currency',
      'SGTXT': 'name',
      'ZUONR': '_assignment',
    },
    transform: (row, companyId, userId) => {
      const id = generateId();
      const ts = now();
      const data = {};
      Object.entries(row).forEach(([k, v]) => {
        if (k.startsWith('_') && v) data[k.substring(1)] = v;
      });
      return {
        id,
        company_id: companyId,
        name: row.name || `SAP GL Posting ${row._documentNumber || ''}`,
        description: `Imported from SAP doc ${row._documentNumber || ''}`,
        status: 'posted',
        accrual_type: 'promotion',
        calculation_method: 'fixed_amount',
        frequency: 'monthly',
        gl_account: row.gl_account || '',
        cost_center: row.cost_center || '',
        accrued_amount: parseFloat(row._amount) || 0,
        posted_amount: parseFloat(row._amount) || 0,
        currency: row._currency || 'ZAR',
        created_by: userId,
        data: JSON.stringify(data),
        created_at: ts,
        updated_at: ts,
      };
    },
    insertSql: `INSERT OR REPLACE INTO accruals (id, company_id, name, description, status, accrual_type, calculation_method, frequency, gl_account, cost_center, accrued_amount, posted_amount, currency, created_by, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    bindRow: (r) => [r.id, r.company_id, r.name, r.description, r.status, r.accrual_type, r.calculation_method, r.frequency, r.gl_account, r.cost_center, r.accrued_amount, r.posted_amount, r.currency, r.created_by, r.data, r.created_at, r.updated_at],
  },

  // SAP Fund Management (FMTT) -> budgets table
  'fund-management': {
    table: 'budgets',
    sapTransaction: 'FMBB/FM5I',
    description: 'Import fund/budget data from SAP Funds Management',
    requiredFields: ['FINCODE', 'BUDGET'],
    fieldMap: {
      'FINCODE': 'code',
      'FICTR': '_fundCenter',
      'FIPEX': '_commitmentItem',
      'BUDGET': 'amount',
      'OBLIGO': '_committed',
      'ACTUAL': '_spent',
      'AVAILABLE': '_available',
      'GJAHR': 'year',
      'BEZEICH': 'name',
      'WAERS': '_currency',
    },
    transform: (row, companyId, userId) => {
      const id = generateId();
      const ts = now();
      const data = {};
      Object.entries(row).forEach(([k, v]) => {
        if (k.startsWith('_') && v) data[k.substring(1)] = v;
      });
      return {
        id,
        company_id: companyId,
        name: row.name || `Fund ${row.code || ''}`,
        year: parseInt(row.year) || new Date().getFullYear(),
        amount: parseFloat(row.amount) || 0,
        allocated: parseFloat(row._committed) || 0,
        spent: parseFloat(row._spent) || 0,
        remaining: parseFloat(row._available) || parseFloat(row.amount) || 0,
        budget_type: 'trade',
        status: 'active',
        data: JSON.stringify(data),
        created_at: ts,
        updated_at: ts,
      };
    },
    insertSql: `INSERT OR REPLACE INTO budgets (id, company_id, name, year, amount, allocated, spent, remaining, budget_type, status, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    bindRow: (r) => [r.id, r.company_id, r.name, r.year, r.amount, r.allocated, r.spent, r.remaining, r.budget_type, r.status, r.data, r.created_at, r.updated_at],
  },

  // SAP Rebate Agreements (VBO1/VBO2) -> rebates table
  'rebate-agreements': {
    table: 'rebates',
    sapTransaction: 'VBO1/VBO2',
    description: 'Import rebate agreements from SAP SD',
    requiredFields: ['KNUMA', 'KUNNR'],
    fieldMap: {
      'KNUMA': '_agreementNumber',
      'KUNNR': 'customer_id',
      'BOTEFM': '_settlementFreq',
      'BODO1': 'start_date',
      'BODO2': 'end_date',
      'BOSTA': '_status',
      'KSCHL': '_conditionType',
      'KBETR': 'rate',
      'KNUMA_AG': '_refAgreement',
    },
    transform: (row, companyId, userId) => {
      const id = generateId();
      const ts = now();
      const data = {};
      Object.entries(row).forEach(([k, v]) => {
        if (k.startsWith('_') && v) data[k.substring(1)] = v;
      });
      return {
        id,
        company_id: companyId,
        name: `Rebate Agreement ${row._agreementNumber || ''}`,
        description: `SAP rebate agreement ${row._agreementNumber || ''}`,
        rebate_type: 'volume',
        status: row._status === 'B' ? 'active' : 'draft',
        customer_id: row.customer_id || null,
        rate: parseFloat(row.rate) || 0,
        rate_type: 'percentage',
        start_date: formatSapDate(row.start_date),
        end_date: formatSapDate(row.end_date),
        accrued_amount: 0,
        settled_amount: 0,
        data: JSON.stringify(data),
        created_at: ts,
        updated_at: ts,
      };
    },
    insertSql: `INSERT OR REPLACE INTO rebates (id, company_id, name, description, rebate_type, status, customer_id, rate, rate_type, start_date, end_date, accrued_amount, settled_amount, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    bindRow: (r) => [r.id, r.company_id, r.name, r.description, r.rebate_type, r.status, r.customer_id, r.rate, r.rate_type, r.start_date, r.end_date, r.accrued_amount, r.settled_amount, r.data, r.created_at, r.updated_at],
  },

  // SAP Promotions (Trade Promotion) -> promotions table
  'promotions': {
    table: 'promotions',
    sapTransaction: 'TPM/CRM',
    description: 'Import trade promotions from SAP TPM or CRM',
    requiredFields: ['PROMO_ID', 'NAME'],
    fieldMap: {
      'PROMO_ID': '_promoId',
      'NAME': 'name',
      'DESCRIPTION': 'description',
      'PROMO_TYPE': 'promotion_type',
      'STATUS': 'status',
      'KUNNR': 'customer_id',
      'START_DATE': 'start_date',
      'END_DATE': 'end_date',
      'PLANNED_SPEND': 'planned_spend',
      'EXPECTED_LIFT': '_expectedLift',
    },
    transform: (row, companyId, userId) => {
      const id = generateId();
      const ts = now();
      const data = {};
      Object.entries(row).forEach(([k, v]) => {
        if (k.startsWith('_') && v) data[k.substring(1)] = v;
      });
      return {
        id,
        company_id: companyId,
        name: row.name || `Promotion ${row._promoId || ''}`,
        description: row.description || '',
        promotion_type: row.promotion_type || 'price_discount',
        status: row.status || 'draft',
        customer_id: row.customer_id || null,
        start_date: formatSapDate(row.start_date) || ts.split('T')[0],
        end_date: formatSapDate(row.end_date) || ts.split('T')[0],
        planned_spend: parseFloat(row.planned_spend) || 0,
        actual_spend: 0,
        expected_lift: parseFloat(row._expectedLift) || 0,
        data: JSON.stringify(data),
        created_by: userId,
        created_at: ts,
        updated_at: ts,
      };
    },
    insertSql: `INSERT OR REPLACE INTO promotions (id, company_id, name, description, promotion_type, status, customer_id, start_date, end_date, planned_spend, actual_spend, expected_lift, data, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    bindRow: (r) => [r.id, r.company_id, r.name, r.description, r.promotion_type, r.status, r.customer_id, r.start_date, r.end_date, r.planned_spend, r.actual_spend, r.expected_lift, r.data, r.created_by, r.created_at, r.updated_at],
  },

  // SAP Claims (MIRO credits) -> claims table
  'claims': {
    table: 'claims',
    sapTransaction: 'MIRO/FB60',
    description: 'Import credit memo / claim documents from SAP FI',
    requiredFields: ['BELNR', 'DMBTR'],
    fieldMap: {
      'BELNR': '_documentNumber',
      'BUKRS': '_companyCode',
      'LIFNR': 'customer_id',
      'BLDAT': '_documentDate',
      'BUDAT': '_postingDate',
      'DMBTR': 'claimed_amount',
      'WAERS': '_currency',
      'SGTXT': 'reason',
      'XBLNR': '_reference',
    },
    transform: (row, companyId, userId) => {
      const id = generateId();
      const ts = now();
      const data = {};
      Object.entries(row).forEach(([k, v]) => {
        if (k.startsWith('_') && v) data[k.substring(1)] = v;
      });
      return {
        id,
        company_id: companyId,
        claim_number: `CLM-${row._documentNumber || id.substring(0, 8)}`,
        claim_type: 'promotion',
        status: 'submitted',
        customer_id: row.customer_id || null,
        claimed_amount: parseFloat(row.claimed_amount) || 0,
        approved_amount: 0,
        claim_date: formatSapDate(row._postingDate) || ts.split('T')[0],
        reason: row.reason || '',
        data: JSON.stringify(data),
        created_by: userId,
        created_at: ts,
        updated_at: ts,
      };
    },
    insertSql: `INSERT OR REPLACE INTO claims (id, company_id, claim_number, claim_type, status, customer_id, claimed_amount, approved_amount, claim_date, reason, data, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    bindRow: (r) => [r.id, r.company_id, r.claim_number, r.claim_type, r.status, r.customer_id, r.claimed_amount, r.approved_amount, r.claim_date, r.reason, r.data, r.created_by, r.created_at, r.updated_at],
  },
};

// Convert SAP date format (YYYYMMDD) to ISO date (YYYY-MM-DD)
function formatSapDate(d) {
  if (!d) return null;
  const s = String(d).replace(/-/g, '').trim();
  if (s.length === 8) {
    return `${s.substring(0, 4)}-${s.substring(4, 6)}-${s.substring(6, 8)}`;
  }
  if (s.includes('-') || s.includes('/')) return s;
  return null;
}

// ============================================
// ROUTES
// ============================================

// GET /api/sap-import/templates - list all import templates
sapImportRoutes.get('/templates', async (c) => {
  const templates = Object.entries(SAP_IMPORT_CONFIGS).map(([id, cfg]) => ({
    id,
    name: cfg.table.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    sapTransaction: cfg.sapTransaction,
    description: cfg.description,
    requiredFields: cfg.requiredFields,
    targetTable: cfg.table,
    allFields: Object.keys(cfg.fieldMap),
  }));
  return c.json({ success: true, data: templates });
});

// GET /api/sap-import/template/:templateId - download CSV template
sapImportRoutes.get('/template/:templateId', async (c) => {
  const { templateId } = c.req.param();
  const config = SAP_IMPORT_CONFIGS[templateId];
  if (!config) return c.json({ success: false, message: `Unknown template: ${templateId}` }, 400);

  const headers = Object.keys(config.fieldMap);
  const sampleRow = headers.map(h => {
    if (h === 'KUNNR') return '0000100001';
    if (h === 'MATNR') return '000000000100000001';
    if (h === 'LIFNR') return '0000200001';
    if (h === 'NAME1' || h === 'MAKTX') return 'Sample Name';
    if (h.includes('DAT')) return '20260101';
    if (h.includes('DMBTR') || h.includes('KBETR') || h.includes('NETWR') || h.includes('BUDGET')) return '10000.00';
    return '';
  });

  const csv = headers.join(',') + '\n' + sampleRow.join(',');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename=SAP_${templateId.replace(/-/g, '_')}_template.csv`,
    },
  });
});

// POST /api/sap-import/:templateId - import CSV data
sapImportRoutes.post('/:templateId', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const userId = getUserId(c);
    const { templateId } = c.req.param();
    const config = SAP_IMPORT_CONFIGS[templateId];
    if (!config) return c.json({ success: false, message: `Unknown template: ${templateId}` }, 400);

    let csvText = '';
    const contentType = c.req.header('Content-Type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData();
      const file = formData.get('file');
      if (!file) return c.json({ success: false, message: 'No file provided' }, 400);
      csvText = await file.text();
    } else {
      const body = await c.req.json();
      csvText = body.csv || body.data || '';
      if (Array.isArray(csvText)) {
        // JSON array of objects - convert to processable format
        const jsonRows = csvText;
        const results = { created: 0, updated: 0, failed: 0, errors: [] };
        const ts = now();

        for (const rawRow of jsonRows) {
          try {
            const mapped = {};
            for (const [sapField, dbField] of Object.entries(config.fieldMap)) {
              if (rawRow[sapField] !== undefined) mapped[dbField] = rawRow[sapField];
            }
            const transformed = config.transform(mapped, companyId, userId);
            const bindings = config.bindRow(transformed);
            await db.prepare(config.insertSql).bind(...bindings).run();
            results.created++;
          } catch (rowErr) {
            results.failed++;
            results.errors.push(rowErr.message);
          }
        }

        // Log import job
        await db.prepare(
          `INSERT INTO import_jobs (id, company_id, import_type, status, file_name, total_rows, processed_rows, success_rows, error_rows, errors, created_by, created_at, updated_at)
           VALUES (?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          generateId(), companyId, `sap-${templateId}`, `sap-${templateId}-import`,
          jsonRows.length, jsonRows.length, results.created, results.failed,
          JSON.stringify(results.errors.slice(0, 20)), userId, ts, ts
        ).run();

        return c.json({ success: true, data: results }, 201);
      }
    }

    if (!csvText || csvText.trim().length === 0) {
      return c.json({ success: false, message: 'Empty CSV data' }, 400);
    }

    // Parse CSV
    const rawRows = parseCsv(csvText);
    if (rawRows.length === 0) {
      return c.json({ success: false, message: 'No data rows found in CSV' }, 400);
    }

    // Validate required fields
    const csvHeaders = Object.keys(rawRows[0]);
    const missingRequired = config.requiredFields.filter(f => !csvHeaders.includes(f));
    if (missingRequired.length > 0) {
      return c.json({
        success: false,
        message: `Missing required SAP fields: ${missingRequired.join(', ')}`,
        requiredFields: config.requiredFields,
        providedFields: csvHeaders,
      }, 400);
    }

    // Process rows
    const results = { created: 0, updated: 0, failed: 0, errors: [] };
    const ts = now();

    for (let i = 0; i < rawRows.length; i++) {
      try {
        // Map SAP fields to internal fields
        const mapped = {};
        for (const [sapField, dbField] of Object.entries(config.fieldMap)) {
          if (rawRows[i][sapField] !== undefined) {
            mapped[dbField] = rawRows[i][sapField];
          }
        }

        // Transform to DB row
        const transformed = config.transform(mapped, companyId, userId);
        const bindings = config.bindRow(transformed);

        // Insert into DB
        await db.prepare(config.insertSql).bind(...bindings).run();
        results.created++;
      } catch (rowErr) {
        results.failed++;
        if (results.errors.length < 20) {
          results.errors.push(`Row ${i + 1}: ${rowErr.message}`);
        }
      }
    }

    // Log import job
    await db.prepare(
      `INSERT INTO import_jobs (id, company_id, import_type, status, file_name, total_rows, processed_rows, success_rows, error_rows, errors, created_by, created_at, updated_at)
       VALUES (?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      generateId(), companyId, `sap-${templateId}`, `sap-${templateId}-import`,
      rawRows.length, rawRows.length, results.created, results.failed,
      JSON.stringify(results.errors.slice(0, 20)), userId, ts, ts
    ).run();

    return c.json({ success: true, data: results }, 201);
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/sap-import/:templateId/validate - validate CSV without importing
sapImportRoutes.post('/:templateId/validate', async (c) => {
  try {
    const { templateId } = c.req.param();
    const config = SAP_IMPORT_CONFIGS[templateId];
    if (!config) return c.json({ success: false, message: `Unknown template: ${templateId}` }, 400);

    let csvText = '';
    const contentType = c.req.header('Content-Type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData();
      const file = formData.get('file');
      if (!file) return c.json({ success: false, message: 'No file provided' }, 400);
      csvText = await file.text();
    } else {
      const body = await c.req.json();
      csvText = body.csv || body.data || '';
    }

    const rawRows = parseCsv(csvText);
    const csvHeaders = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
    const missingRequired = config.requiredFields.filter(f => !csvHeaders.includes(f));
    const knownFields = Object.keys(config.fieldMap);
    const extraFields = csvHeaders.filter(h => !knownFields.includes(h));
    const mappedFields = csvHeaders.filter(h => knownFields.includes(h));

    return c.json({
      success: true,
      data: {
        totalRows: rawRows.length,
        headers: csvHeaders,
        requiredFields: config.requiredFields,
        missingRequired,
        mappedFields,
        extraFields,
        isValid: missingRequired.length === 0 && rawRows.length > 0,
        preview: rawRows.slice(0, 5),
        targetTable: config.table,
      },
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/sap-import/history - get import history
sapImportRoutes.get('/history', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const result = await db.prepare(
      "SELECT * FROM import_jobs WHERE company_id = ? AND import_type LIKE 'sap-%' ORDER BY created_at DESC LIMIT 50"
    ).bind(companyId).all();
    return c.json({ success: true, data: result.results || [] });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});
