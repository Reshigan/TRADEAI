// Cloudflare D1 Database client for Workers
// Replaces MongoDB Atlas Data API with native Cloudflare D1 (SQLite)

// Table name mapping (collection name -> table name)
const TABLE_MAP = {
  users: 'users',
  companies: 'companies',
  customers: 'customers',
  products: 'products',
  promotions: 'promotions',
  budgets: 'budgets',
  tradespends: 'trade_spends',
  trade_spends: 'trade_spends',
  activities: 'activities',
  notifications: 'notifications',
  reportruns: 'report_runs',
  report_runs: 'report_runs',
  vendors: 'vendors',
  campaigns: 'campaigns',
  trading_terms: 'trading_terms',
  tradingterms: 'trading_terms',
  rebates: 'rebates',
  claims: 'claims',
  deductions: 'deductions',
  approvals: 'approvals',
  data_lineage: 'data_lineage',
  forecasts: 'forecasts',
  kam_wallets: 'kam_wallets',
  import_jobs: 'import_jobs',
  simulations: 'simulations',
  business_rules_config: 'business_rules_config',
  allocations: 'allocations',
  activity_grid: 'activity_grid',
  settings: 'settings'
};

// Column mapping for common fields (MongoDB field -> D1 column)
const COLUMN_MAP = {
  _id: 'id',
  companyId: 'company_id',
  customerId: 'customer_id',
  productId: 'product_id',
  promotionId: 'promotion_id',
  budgetId: 'budget_id',
  userId: 'user_id',
  createdBy: 'created_by',
  approvedBy: 'approved_by',
  rejectedBy: 'rejected_by',
  firstName: 'first_name',
  lastName: 'last_name',
  isActive: 'is_active',
  loginAttempts: 'login_attempts',
  lockUntil: 'lock_until',
  lastLogin: 'last_login',
  refreshToken: 'refresh_token',
  refreshTokenExpiry: 'refresh_token_expiry',
  passwordChangedAt: 'password_changed_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  startDate: 'start_date',
  endDate: 'end_date',
  sellInStartDate: 'sell_in_start_date',
  sellInEndDate: 'sell_in_end_date',
  promotionType: 'promotion_type',
  spendType: 'spend_type',
  activityType: 'activity_type',
  spendId: 'spend_id',
  approvedAt: 'approved_at',
  rejectedAt: 'rejected_at',
  rejectionReason: 'rejection_reason',
  budgetType: 'budget_type',
  customerType: 'customer_type',
  unitPrice: 'unit_price',
  costPrice: 'cost_price',
  sapCustomerId: 'sap_customer_id',
  entityType: 'entity_type',
  entityId: 'entity_id',
  entityName: 'entity_name',
  requestedBy: 'requested_by',
  requestedAt: 'requested_at',
  assignedTo: 'assigned_to',
  dueDate: 'due_date',
  slaHours: 'sla_hours',
  escalatedTo: 'escalated_to',
  escalatedAt: 'escalated_at',
  rebateType: 'rebate_type',
  tradingTermId: 'trading_term_id',
  rateType: 'rate_type',
  accruedAmount: 'accrued_amount',
  settledAmount: 'settled_amount',
  calculationBasis: 'calculation_basis',
  settlementFrequency: 'settlement_frequency',
  lastCalculatedAt: 'last_calculated_at',
  claimNumber: 'claim_number',
  claimType: 'claim_type',
  rebateId: 'rebate_id',
  claimedAmount: 'claimed_amount',
  approvedAmount: 'approved_amount',
  claimDate: 'claim_date',
  settlementDate: 'settlement_date',
  supportingDocuments: 'supporting_documents',
  reviewedBy: 'reviewed_by',
  reviewedAt: 'reviewed_at',
  reviewNotes: 'review_notes',
  deductionNumber: 'deduction_number',
  deductionType: 'deduction_type',
  invoiceNumber: 'invoice_number',
  invoiceDate: 'invoice_date',
  deductionAmount: 'deduction_amount',
  matchedAmount: 'matched_amount',
  remainingAmount: 'remaining_amount',
  deductionDate: 'deduction_date',
  reasonCode: 'reason_code',
  reasonDescription: 'reason_description',
  matchedTo: 'matched_to',
  vendorType: 'vendor_type',
  paymentTerms: 'payment_terms',
  taxNumber: 'tax_number',
  bankDetails: 'bank_details',
  campaignType: 'campaign_type',
  budgetAmount: 'budget_amount',
  spentAmount: 'spent_amount',
  targetRevenue: 'target_revenue',
  actualRevenue: 'actual_revenue',
  targetVolume: 'target_volume',
  actualVolume: 'actual_volume',
  termType: 'term_type',
  paymentFrequency: 'payment_frequency',
  budgetCategory: 'budget_category',
  scopeType: 'scope_type',
  dealType: 'deal_type',
  productVendor: 'product_vendor',
  productCategory: 'product_category',
  productBrand: 'product_brand',
  productSubBrand: 'product_sub_brand',
  customerChannel: 'customer_channel',
  customerSubChannel: 'customer_sub_channel',
  customerSegmentation: 'customer_segmentation',
  customerHierarchy1: 'customer_hierarchy_1',
  customerHierarchy2: 'customer_hierarchy_2',
  customerHierarchy3: 'customer_hierarchy_3',
  customerHeadOffice: 'customer_head_office',
  subChannel: 'sub_channel',
  headOffice: 'head_office',
  subBrand: 'sub_brand',
  forecastType: 'forecast_type',
  periodType: 'period_type',
  startPeriod: 'start_period',
  endPeriod: 'end_period',
  baseYear: 'base_year',
  forecastYear: 'forecast_year',
  totalForecast: 'total_forecast',
  totalActual: 'total_actual',
  variancePercent: 'variance_percent',
  confidenceLevel: 'confidence_level',
  simulationType: 'simulation_type',
  allocationType: 'allocation_type',
  updatedBy: 'updated_by',
  contactName: 'contact_name',
  contactEmail: 'contact_email',
  contactPhone: 'contact_phone',
  customerName: 'customer_name',
  productName: 'product_name',
  activityName: 'activity_name',
  budgetAllocated: 'budget_allocated',
  budgetSpent: 'budget_spent',
  claimId: 'claim_id'
};

// Reverse column mapping (D1 column -> MongoDB field)
const REVERSE_COLUMN_MAP = Object.fromEntries(
  Object.entries(COLUMN_MAP).map(([k, v]) => [v, k])
);

// Fields that should be stored in the JSON 'data' column
const JSON_FIELDS = [
  'mechanics', 'financial', 'period', 'products', 'customers', 'approvals',
  'performance', 'metrics', 'settings', 'permissions', 'hierarchy',
  'contacts', 'address', 'allocations', 'details', 'lineItems',
  // Additional fields that don't have dedicated columns
  'email', 'phone', 'company', 'notes', 'description', 'tags', 'metadata',
  'notes'
];

// Known columns per table (to avoid inserting unknown columns)
const TABLE_COLUMNS = {
  customers: ['id', 'company_id', 'name', 'code', 'sap_customer_id', 'customer_type', 'channel', 'tier', 'status', 'region', 'city', 'data', 'created_at', 'updated_at', 'sub_channel', 'segmentation', 'hierarchy_1', 'hierarchy_2', 'hierarchy_3', 'head_office'],
  products: ['id', 'company_id', 'name', 'code', 'sku', 'barcode', 'category', 'subcategory', 'brand', 'unit_price', 'cost_price', 'status', 'data', 'created_at', 'updated_at', 'vendor', 'sub_brand'],
  budgets: ['id', 'company_id', 'name', 'year', 'amount', 'utilized', 'budget_type', 'status', 'created_by', 'data', 'created_at', 'updated_at', 'budget_category', 'scope_type', 'deal_type', 'claim_type', 'product_vendor', 'product_category', 'product_brand', 'product_sub_brand', 'product_id', 'customer_channel', 'customer_sub_channel', 'customer_segmentation', 'customer_hierarchy_1', 'customer_hierarchy_2', 'customer_hierarchy_3', 'customer_head_office', 'customer_id'],
  promotions: ['id', 'company_id', 'name', 'description', 'promotion_type', 'status', 'start_date', 'end_date', 'sell_in_start_date', 'sell_in_end_date', 'budget_id', 'created_by', 'approved_by', 'approved_at', 'rejected_by', 'rejected_at', 'rejection_reason', 'data', 'created_at', 'updated_at'],
  trade_spends: ['id', 'company_id', 'spend_id', 'budget_id', 'promotion_id', 'customer_id', 'product_id', 'amount', 'spend_type', 'activity_type', 'status', 'description', 'created_by', 'approved_by', 'approved_at', 'rejected_by', 'rejected_at', 'rejection_reason', 'data', 'created_at', 'updated_at'],
  users: ['id', 'company_id', 'email', 'password', 'first_name', 'last_name', 'role', 'department', 'permissions', 'is_active', 'login_attempts', 'lock_until', 'last_login', 'refresh_token', 'refresh_token_expiry', 'password_changed_at', 'data', 'created_at', 'updated_at'],
  companies: ['id', 'name', 'code', 'type', 'country', 'currency', 'timezone', 'status', 'subscription_plan', 'settings', 'data', 'created_at', 'updated_at'],
  vendors: ['id', 'company_id', 'name', 'code', 'vendor_type', 'status', 'contact_name', 'contact_email', 'contact_phone', 'address', 'city', 'region', 'country', 'payment_terms', 'tax_number', 'bank_details', 'data', 'created_at', 'updated_at'],
  campaigns: ['id', 'company_id', 'name', 'description', 'campaign_type', 'status', 'start_date', 'end_date', 'budget_amount', 'spent_amount', 'target_revenue', 'actual_revenue', 'target_volume', 'actual_volume', 'created_by', 'approved_by', 'approved_at', 'data', 'created_at', 'updated_at'],
  trading_terms: ['id', 'company_id', 'name', 'description', 'term_type', 'status', 'customer_id', 'start_date', 'end_date', 'rate', 'rate_type', 'threshold', 'cap', 'payment_frequency', 'calculation_basis', 'created_by', 'approved_by', 'approved_at', 'data', 'created_at', 'updated_at'],
  rebates: ['id', 'company_id', 'name', 'description', 'rebate_type', 'status', 'customer_id', 'trading_term_id', 'start_date', 'end_date', 'rate', 'rate_type', 'threshold', 'cap', 'accrued_amount', 'settled_amount', 'calculation_basis', 'settlement_frequency', 'last_calculated_at', 'created_by', 'approved_by', 'approved_at', 'data', 'created_at', 'updated_at'],
  claims: ['id', 'company_id', 'claim_number', 'claim_type', 'status', 'customer_id', 'promotion_id', 'rebate_id', 'claimed_amount', 'approved_amount', 'settled_amount', 'claim_date', 'due_date', 'settlement_date', 'reason', 'supporting_documents', 'reviewed_by', 'reviewed_at', 'review_notes', 'created_by', 'data', 'created_at', 'updated_at'],
  deductions: ['id', 'company_id', 'deduction_number', 'deduction_type', 'status', 'customer_id', 'invoice_number', 'invoice_date', 'deduction_amount', 'matched_amount', 'remaining_amount', 'deduction_date', 'due_date', 'reason_code', 'reason_description', 'matched_to', 'reviewed_by', 'reviewed_at', 'review_notes', 'created_by', 'data', 'created_at', 'updated_at'],
  approvals: ['id', 'company_id', 'entity_type', 'entity_id', 'entity_name', 'amount', 'status', 'priority', 'requested_by', 'requested_at', 'assigned_to', 'approved_by', 'approved_at', 'rejected_by', 'rejected_at', 'rejection_reason', 'comments', 'due_date', 'sla_hours', 'escalated_to', 'escalated_at', 'data', 'created_at', 'updated_at'],
  activities: ['id', 'company_id', 'user_id', 'action', 'entity_type', 'entity_id', 'description', 'data', 'created_at'],
  notifications: ['id', 'company_id', 'user_id', 'title', 'message', 'type', 'read', 'data', 'created_at'],
  business_rules_config: ['id', 'company_id', 'category', 'rules', 'updated_by', 'data', 'created_at', 'updated_at'],
  allocations: ['id', 'company_id', 'name', 'budget_id', 'customer_id', 'product_id', 'amount', 'status', 'allocation_type', 'created_by', 'data', 'created_at', 'updated_at'],
  settings: ['id', 'company_id', 'key', 'value', 'data', 'created_at', 'updated_at'],
  simulations: ['id', 'company_id', 'name', 'description', 'simulation_type', 'status', 'config', 'results', 'scenarios', 'constraints', 'created_by', 'applied_to', 'parameters', 'data', 'created_at', 'updated_at'],
  forecasts: ['id', 'company_id', 'name', 'forecast_type', 'status', 'period_type', 'start_period', 'end_period', 'base_year', 'forecast_year', 'total_forecast', 'total_actual', 'variance', 'variance_percent', 'method', 'confidence_level', 'created_by', 'data', 'created_at', 'updated_at'],
  activity_grid: ['id', 'company_id', 'activity_name', 'activity_type', 'status', 'start_date', 'end_date', 'customer_id', 'product_id', 'vendor_id', 'budget_allocated', 'budget_spent', 'performance', 'notes', 'source_type', 'source_id', 'created_by', 'created_at', 'updated_at'],
  data_lineage: ['id', 'company_id', 'entity_type', 'entity_id', 'field_name', 'old_value', 'new_value', 'change_type', 'source', 'source_details', 'changed_by', 'changed_at', 'data'],
  report_runs: ['id', 'company_id', 'report_type', 'status', 'date_range', 'filters', 'data', 'created_by', 'completed_at', 'created_at', 'updated_at'],
  saved_views: ['id', 'company_id', 'user_id', 'name', 'entity_type', 'filters', 'columns', 'sort_by', 'sort_order', 'is_default', 'created_at', 'updated_at'],
  data_quality_issues: ['id', 'company_id', 'entity_type', 'entity_id', 'field_name', 'issue_type', 'severity', 'message', 'resolved', 'resolved_at', 'resolved_by', 'created_at'],
  kam_wallets: ['id', 'company_id', 'user_id', 'year', 'quarter', 'month', 'allocated_amount', 'utilized_amount', 'committed_amount', 'available_amount', 'status', 'data', 'created_at', 'updated_at'],
  import_jobs: ['id', 'company_id', 'import_type', 'status', 'file_name', 'file_url', 'total_rows', 'processed_rows', 'success_rows', 'error_rows', 'errors', 'mapping', 'options', 'started_at', 'completed_at', 'created_by', 'created_at', 'updated_at'],
  transactions: ['id', 'company_id', 'transaction_number', 'transaction_type', 'status', 'customer_id', 'product_id', 'amount', 'description', 'reference', 'payment_reference', 'created_by', 'approved_by', 'approved_at', 'rejected_by', 'rejected_at', 'rejection_reason', 'settled_at', 'data', 'created_at', 'updated_at'],
  alerts: ['id', 'company_id', 'alert_type', 'severity', 'status', 'title', 'message', 'entity_type', 'entity_id', 'acknowledged_by', 'acknowledged_at', 'dismissed_at', 'data', 'created_at', 'updated_at'],
  customer_assignments: ['id', 'company_id', 'customer_id', 'user_id', 'role', 'status', 'data', 'created_at', 'updated_at'],
  announcements: ['id', 'company_id', 'title', 'content', 'category', 'priority', 'status', 'target_audience', 'published_at', 'created_by', 'data', 'created_at', 'updated_at'],
  policies: ['id', 'company_id', 'title', 'content', 'category', 'version', 'status', 'effective_date', 'published_at', 'created_by', 'data', 'created_at', 'updated_at'],
  courses: ['id', 'company_id', 'title', 'description', 'category', 'difficulty', 'duration_minutes', 'status', 'content_url', 'created_by', 'data', 'created_at', 'updated_at'],
  games: ['id', 'company_id', 'title', 'description', 'game_type', 'difficulty', 'points', 'status', 'created_by', 'data', 'created_at', 'updated_at'],
  regions: ['id', 'company_id', 'name', 'code', 'status', 'data', 'created_at', 'updated_at'],
  districts: ['id', 'company_id', 'name', 'region_id', 'region_name', 'code', 'status', 'data', 'created_at', 'updated_at']
};

// Generate a UUID for new records
function generateId() {
  return crypto.randomUUID();
}

// Convert MongoDB-style filter to SQL WHERE clause
function filterToWhere(filter, params = []) {
  const conditions = [];
  
  for (const [key, value] of Object.entries(filter)) {
    // Skip MongoDB-specific operators at top level
    if (key === '$or' || key === '$and') continue;
    
    // Handle ObjectId format
    if (key === '_id') {
      if (typeof value === 'object' && value.$oid) {
        params.push(value.$oid);
      } else {
        params.push(value);
      }
      conditions.push('id = ?');
      continue;
    }
    
    const column = COLUMN_MAP[key] || key;
    
    if (typeof value === 'object' && value !== null) {
      // Handle MongoDB operators
      if (value.$oid) {
        params.push(value.$oid);
        conditions.push(`${column} = ?`);
      } else if (value.$in) {
        const placeholders = value.$in.map(() => '?').join(', ');
        params.push(...value.$in);
        conditions.push(`${column} IN (${placeholders})`);
      } else if (value.$regex) {
        params.push(`%${value.$regex}%`);
        conditions.push(`${column} LIKE ?`);
      } else if (value.$gt) {
        params.push(value.$gt);
        conditions.push(`${column} > ?`);
      } else if (value.$gte) {
        params.push(value.$gte);
        conditions.push(`${column} >= ?`);
      } else if (value.$lt) {
        params.push(value.$lt);
        conditions.push(`${column} < ?`);
      } else if (value.$lte) {
        params.push(value.$lte);
        conditions.push(`${column} <= ?`);
      } else if (value.$ne) {
        params.push(value.$ne);
        conditions.push(`${column} != ?`);
      }
    } else if (value === null) {
      conditions.push(`${column} IS NULL`);
    } else {
      params.push(value);
      conditions.push(`${column} = ?`);
    }
  }
  
  // Handle $or operator
  if (filter.$or && Array.isArray(filter.$or)) {
    const orConditions = filter.$or.map(subFilter => {
      const subParams = [];
      const subWhere = filterToWhere(subFilter, subParams);
      params.push(...subParams);
      return `(${subWhere})`;
    });
    if (orConditions.length > 0) {
      conditions.push(`(${orConditions.join(' OR ')})`);
    }
  }
  
  return conditions.length > 0 ? conditions.join(' AND ') : '1=1';
}

// Convert MongoDB-style sort to SQL ORDER BY
function sortToOrderBy(sort) {
  if (!sort || Object.keys(sort).length === 0) {
    return 'created_at DESC';
  }
  
  return Object.entries(sort)
    .map(([key, direction]) => {
      const column = COLUMN_MAP[key] || key;
      return `${column} ${direction === -1 ? 'DESC' : 'ASC'}`;
    })
    .join(', ');
}

// Convert D1 row to MongoDB-style document
function rowToDocument(row) {
  if (!row) return null;
  
  const doc = {};
  
  for (const [column, value] of Object.entries(row)) {
    // Convert column name back to camelCase
    const field = REVERSE_COLUMN_MAP[column] || column;
    
    if (column === 'id') {
      doc._id = value;
      doc.id = value;
    } else if (column === 'data' && value) {
      // Merge JSON data into document
      try {
        const jsonData = JSON.parse(value);
        Object.assign(doc, jsonData);
      } catch (e) {
        doc.data = value;
      }
    } else if (column === 'permissions' && value) {
      try {
        doc.permissions = JSON.parse(value);
      } catch (e) {
        doc.permissions = [];
      }
    } else if (column === 'is_active') {
      doc.isActive = value === 1;
    } else {
      doc[field] = value;
    }
  }
  
  return doc;
}

// Convert document to D1 row format
// tableName parameter is used to filter out columns that don't exist in the table
function documentToRow(document, tableName = null, isUpdate = false) {
  const row = {};
  const jsonData = {};
  
  // Get valid columns for this table (if known)
  const validColumns = tableName ? TABLE_COLUMNS[tableName] : null;
  
  for (const [field, value] of Object.entries(document)) {
    if (field === '_id' || field === 'id' || field === 'createdAt' || field === 'updatedAt') continue;
    
    const column = COLUMN_MAP[field] || field;
    
    const isValidColumn = validColumns && validColumns.includes(column);
    
    if (isValidColumn) {
      if (typeof value === 'boolean') {
        row[column] = value ? 1 : 0;
      } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        jsonData[field] = value;
      } else {
        row[column] = value;
      }
    } else if (JSON_FIELDS.includes(field)) {
      jsonData[field] = value;
    } else if (validColumns && !isValidColumn) {
      jsonData[field] = value;
    } else {
      if (typeof value === 'boolean') {
        row[column] = value ? 1 : 0;
      } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        jsonData[field] = value;
      } else {
        row[column] = value;
      }
    }
  }
  
  // Add JSON data if any
  if (Object.keys(jsonData).length > 0) {
    row.data = JSON.stringify(jsonData);
  }
  
  return row;
}

export class D1Client {
  constructor(env) {
    this.db = env.DB;
  }

  getTableName(collection) {
    return TABLE_MAP[collection] || collection;
  }

  // Find one document
  async findOne(collection, filter, projection = {}) {
    const table = this.getTableName(collection);
    const params = [];
    const where = filterToWhere(filter, params);
    
    const sql = `SELECT * FROM ${table} WHERE ${where} LIMIT 1`;
    const result = await this.db.prepare(sql).bind(...params).first();
    
    return rowToDocument(result);
  }

  // Find multiple documents
  async find(collection, filter = {}, options = {}) {
    const table = this.getTableName(collection);
    const params = [];
    const where = filterToWhere(filter, params);
    const orderBy = sortToOrderBy(options.sort);
    const limit = options.limit || 100;
    const offset = options.skip || 0;
    
    const sql = `SELECT * FROM ${table} WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const result = await this.db.prepare(sql).bind(...params).all();
    
    return (result.results || []).map(rowToDocument);
  }

  // Insert one document
  async insertOne(collection, document) {
    const table = this.getTableName(collection);
    const id = generateId();
    const now = new Date().toISOString();
    
    // Pass table name to documentToRow to filter out unknown columns
    const row = documentToRow(document, table);
    row.id = id;
    row.created_at = now;
    row.updated_at = now;
    
    const columns = Object.keys(row);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(row);
    
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    await this.db.prepare(sql).bind(...values).run();
    
    return id;
  }

  // Insert multiple documents
  async insertMany(collection, documents) {
    const ids = [];
    
    for (const doc of documents) {
      const id = await this.insertOne(collection, doc);
      ids.push(id);
    }
    
    return ids;
  }

  // Update one document
  async updateOne(collection, filter, update) {
    const table = this.getTableName(collection);
    const params = [];
    const where = filterToWhere(filter, params);
    
    // Get existing document to merge JSON data
    const existing = await this.findOne(collection, filter);
    
    // Pass table name to documentToRow to filter out unknown columns
    const row = documentToRow(update, table, true);
    row.updated_at = new Date().toISOString();
    
    // Merge JSON data if both exist
    if (existing && existing.data && row.data) {
      try {
        const existingData = typeof existing.data === 'string' ? JSON.parse(existing.data) : existing.data;
        const newData = JSON.parse(row.data);
        row.data = JSON.stringify({ ...existingData, ...newData });
      } catch (e) {
        // Keep new data as is
      }
    }
    
    const setClauses = Object.keys(row).map(col => `${col} = ?`).join(', ');
    const setValues = Object.values(row);
    
    const sql = `UPDATE ${table} SET ${setClauses} WHERE ${where}`;
    const result = await this.db.prepare(sql).bind(...setValues, ...params).run();
    
    return { modifiedCount: result.changes || 0 };
  }

  // Update multiple documents
  async updateMany(collection, filter, update) {
    const table = this.getTableName(collection);
    const params = [];
    const where = filterToWhere(filter, params);
    
    // Pass table name to documentToRow to filter out unknown columns
    const row = documentToRow(update, table, true);
    row.updated_at = new Date().toISOString();
    
    const setClauses = Object.keys(row).map(col => `${col} = ?`).join(', ');
    const setValues = Object.values(row);
    
    const sql = `UPDATE ${table} SET ${setClauses} WHERE ${where}`;
    const result = await this.db.prepare(sql).bind(...setValues, ...params).run();
    
    return { modifiedCount: result.changes || 0 };
  }

  // Delete one document
  async deleteOne(collection, filter) {
    const table = this.getTableName(collection);
    const params = [];
    const where = filterToWhere(filter, params);
    
    const existing = await this.db.prepare(`SELECT id FROM ${table} WHERE ${where} LIMIT 1`).bind(...params).first();
    if (!existing) return { deletedCount: 0 };
    const result = await this.db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(existing.id).run();
    
    return { deletedCount: result.changes || 0 };
  }

  // Delete multiple documents
  async deleteMany(collection, filter) {
    const table = this.getTableName(collection);
    const params = [];
    const where = filterToWhere(filter, params);
    
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    const result = await this.db.prepare(sql).bind(...params).run();
    
    return { deletedCount: result.changes || 0 };
  }

  // Count documents
  async countDocuments(collection, filter = {}) {
    const table = this.getTableName(collection);
    const params = [];
    const where = filterToWhere(filter, params);
    
    const sql = `SELECT COUNT(*) as count FROM ${table} WHERE ${where}`;
    const result = await this.db.prepare(sql).bind(...params).first();
    
    return result?.count || 0;
  }

  // Aggregate (simplified - supports basic grouping)
  async aggregate(collection, pipeline) {
    const table = this.getTableName(collection);
    
    // For now, handle simple aggregations
    // Complex aggregations would need to be rewritten as SQL
    let sql = `SELECT * FROM ${table}`;
    const params = [];
    
    for (const stage of pipeline) {
      if (stage.$match) {
        const where = filterToWhere(stage.$match, params);
        sql = `SELECT * FROM ${table} WHERE ${where}`;
      }
      if (stage.$count) {
        sql = `SELECT COUNT(*) as ${stage.$count} FROM ${table}`;
        if (params.length > 0) {
          sql = `SELECT COUNT(*) as ${stage.$count} FROM ${table} WHERE ${filterToWhere(pipeline[0].$match || {}, [])}`;
        }
      }
      if (stage.$group) {
        const group = stage.$group;
        const groupId = group._id;
        const selectParts = [];
        const groupByParts = [];

        if (groupId === null) {
          selectParts.push("'all' as _id");
        } else if (typeof groupId === 'string' && groupId.startsWith('$')) {
          const field = groupId.substring(1);
          const col = COLUMN_MAP[field] || field;
          selectParts.push(`${col} as _id`);
          groupByParts.push(col);
        } else if (typeof groupId === 'object' && groupId !== null) {
          const idParts = [];
          for (const [alias, expr] of Object.entries(groupId)) {
            if (typeof expr === 'string' && expr.startsWith('$')) {
              const col = COLUMN_MAP[expr.substring(1)] || expr.substring(1);
              idParts.push(`${col} as ${alias}`);
              groupByParts.push(col);
            }
          }
          if (idParts.length > 0) {
            selectParts.push(...idParts);
          } else {
            selectParts.push("'all' as _id");
          }
        }

        for (const [alias, expr] of Object.entries(group)) {
          if (alias === '_id') continue;
          if (typeof expr === 'object' && expr !== null) {
            if (expr.$sum !== undefined) {
              if (typeof expr.$sum === 'string' && expr.$sum.startsWith('$')) {
                const col = COLUMN_MAP[expr.$sum.substring(1)] || expr.$sum.substring(1);
                selectParts.push(`COALESCE(SUM(${col}), 0) as ${alias}`);
              } else if (expr.$sum === 1) {
                selectParts.push(`COUNT(*) as ${alias}`);
              } else {
                selectParts.push(`${expr.$sum} as ${alias}`);
              }
            } else if (expr.$avg !== undefined && typeof expr.$avg === 'string' && expr.$avg.startsWith('$')) {
              const col = COLUMN_MAP[expr.$avg.substring(1)] || expr.$avg.substring(1);
              selectParts.push(`COALESCE(AVG(${col}), 0) as ${alias}`);
            } else if (expr.$count !== undefined) {
              selectParts.push(`COUNT(*) as ${alias}`);
            } else if (expr.$min !== undefined && typeof expr.$min === 'string' && expr.$min.startsWith('$')) {
              const col = COLUMN_MAP[expr.$min.substring(1)] || expr.$min.substring(1);
              selectParts.push(`MIN(${col}) as ${alias}`);
            } else if (expr.$max !== undefined && typeof expr.$max === 'string' && expr.$max.startsWith('$')) {
              const col = COLUMN_MAP[expr.$max.substring(1)] || expr.$max.substring(1);
              selectParts.push(`MAX(${col}) as ${alias}`);
            }
          }
        }

        if (selectParts.length === 0) {
          selectParts.push('*');
        }

        let groupSql = `SELECT ${selectParts.join(', ')} FROM ${table}`;
        if (params.length > 0 && pipeline[0]?.$match) {
          const matchParams = [];
          const matchWhere = filterToWhere(pipeline[0].$match, matchParams);
          groupSql += ` WHERE ${matchWhere}`;
          params.length = 0;
          params.push(...matchParams);
        }
        if (groupByParts.length > 0) {
          groupSql += ` GROUP BY ${groupByParts.join(', ')}`;
        }

        const groupResult = await this.db.prepare(groupSql).bind(...params).all();
        return groupResult.results || [];
      }
    }
    
    const result = await this.db.prepare(sql).bind(...params).all();
    return result.results || [];
  }

  // Execute raw SQL (for complex queries)
  async rawQuery(sql, params = []) {
    const result = await this.db.prepare(sql).bind(...params).all();
    return result.results || [];
  }

  // Execute raw SQL that modifies data
  async rawExecute(sql, params = []) {
    const result = await this.db.prepare(sql).bind(...params).run();
    return result;
  }
}

// Helper to get D1 client from context
export function getD1Client(c) {
  if (!c.get('d1')) {
    c.set('d1', new D1Client(c.env));
  }
  return c.get('d1');
}

// Export rowToDocument for routes that use raw SQL
export { rowToDocument };

// Alias for backward compatibility during migration
export { getD1Client as getMongoClient };
