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
  report_runs: 'report_runs'
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
  entityId: 'entity_id'
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
  'contactName', 'contactEmail', 'contactPhone'
];

// Known columns per table (to avoid inserting unknown columns)
const TABLE_COLUMNS = {
  customers: ['id', 'company_id', 'name', 'code', 'sap_customer_id', 'customer_type', 'channel', 'tier', 'status', 'region', 'city', 'data', 'created_at', 'updated_at', 'sub_channel', 'segmentation', 'hierarchy_1', 'hierarchy_2', 'hierarchy_3', 'head_office'],
  products: ['id', 'company_id', 'name', 'code', 'sku', 'category', 'brand', 'unit_price', 'cost_price', 'status', 'data', 'created_at', 'updated_at', 'vendor', 'sub_brand'],
  budgets: ['id', 'company_id', 'name', 'year', 'amount', 'utilized', 'budget_type', 'status', 'created_by', 'data', 'created_at', 'updated_at', 'budget_category', 'scope_type', 'deal_type', 'claim_type', 'product_vendor', 'product_category', 'product_brand', 'product_sub_brand', 'product_id', 'customer_channel', 'customer_sub_channel', 'customer_segmentation', 'customer_hierarchy_1', 'customer_hierarchy_2', 'customer_hierarchy_3', 'customer_head_office', 'customer_id'],
  promotions: ['id', 'company_id', 'name', 'description', 'promotion_type', 'status', 'start_date', 'end_date', 'sell_in_start_date', 'sell_in_end_date', 'budget_id', 'created_by', 'approved_by', 'approved_at', 'rejected_by', 'rejected_at', 'rejection_reason', 'data', 'created_at', 'updated_at'],
  trade_spends: ['id', 'company_id', 'budget_id', 'promotion_id', 'customer_id', 'product_id', 'amount', 'spend_type', 'status', 'description', 'created_by', 'data', 'created_at', 'updated_at'],
  users: ['id', 'company_id', 'email', 'password', 'first_name', 'last_name', 'role', 'permissions', 'is_active', 'login_attempts', 'lock_until', 'last_login', 'refresh_token', 'refresh_token_expiry', 'password_changed_at', 'created_at', 'updated_at'],
  companies: ['id', 'name', 'code', 'status', 'subscription_plan', 'data', 'created_at', 'updated_at']
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
    
    // Handle special fields
    if (field === 'id') {
      doc._id = value;
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
    // Skip internal fields
    if (field === '_id' || field === 'createdAt' || field === 'updatedAt') continue;
    
    // Check if this field should go in JSON data column
    if (JSON_FIELDS.includes(field)) {
      jsonData[field] = value;
      continue;
    }
    
    // Map field name to column
    const column = COLUMN_MAP[field] || field;
    
    // If we know the valid columns for this table, check if this column exists
    // If not, store it in the JSON data column
    if (validColumns && !validColumns.includes(column)) {
      jsonData[field] = value;
      continue;
    }
    
    // Handle special types
    if (typeof value === 'boolean') {
      row[column] = value ? 1 : 0;
    } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
      // Store complex objects in JSON data
      jsonData[field] = value;
    } else {
      row[column] = value;
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
    
    const sql = `DELETE FROM ${table} WHERE ${where} LIMIT 1`;
    const result = await this.db.prepare(sql).bind(...params).run();
    
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
        // Basic group support - return empty for complex aggregations
        console.warn('Complex $group aggregations not fully supported in D1');
        return [];
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

// Alias for backward compatibility during migration
export { getD1Client as getMongoClient };
