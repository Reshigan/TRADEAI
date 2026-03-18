// GAP-12: Audit Trail Service - Auto-capture mutations

export class AuditService {
  constructor(db) {
    this.db = db;
  }

  async recordChange({ companyId, entityType, entityId, fieldName, oldValue, newValue, changeType, userId, source }) {
    const id = crypto.randomUUID();
    await this.db.prepare(`
      INSERT INTO data_lineage (id, company_id, entity_type, entity_id, field_name, old_value, new_value, change_type, changed_by, source, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(id, companyId, entityType, entityId, fieldName,
      typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue ?? ''),
      typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue ?? ''),
      changeType || 'update', userId, source || 'api'
    ).run();
    return id;
  }

  async recordBulkChanges(changes) {
    if (!changes.length) return [];
    const ids = [];
    const stmts = [];
    for (const c of changes) {
      const id = crypto.randomUUID();
      ids.push(id);
      stmts.push(this.db.prepare(`
        INSERT INTO data_lineage (id, company_id, entity_type, entity_id, field_name, old_value, new_value, change_type, changed_by, source, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(id, c.companyId, c.entityType, c.entityId, c.fieldName,
        typeof c.oldValue === 'object' ? JSON.stringify(c.oldValue) : String(c.oldValue ?? ''),
        typeof c.newValue === 'object' ? JSON.stringify(c.newValue) : String(c.newValue ?? ''),
        c.changeType || 'update', c.userId, c.source || 'api'
      ));
    }
    // Batch in chunks of 50
    for (let i = 0; i < stmts.length; i += 50) {
      await this.db.batch(stmts.slice(i, i + 50));
    }
    return ids;
  }

  async recordCreation(db, companyId, entityType, entityId, data, userId) {
    return this.recordChange({
      companyId, entityType, entityId,
      fieldName: '*', oldValue: null, newValue: data,
      changeType: 'create', userId, source: 'api'
    });
  }

  async recordDeletion(companyId, entityType, entityId, oldData, userId) {
    return this.recordChange({
      companyId, entityType, entityId,
      fieldName: '*', oldValue: oldData, newValue: null,
      changeType: 'delete', userId, source: 'api'
    });
  }

  async recordStatusChange(companyId, entityType, entityId, oldStatus, newStatus, userId) {
    return this.recordChange({
      companyId, entityType, entityId,
      fieldName: 'status', oldValue: oldStatus, newValue: newStatus,
      changeType: 'status_change', userId, source: 'api'
    });
  }

  async getEntityHistory(companyId, entityType, entityId) {
    const result = await this.db.prepare(`
      SELECT * FROM data_lineage
      WHERE company_id = ? AND entity_type = ? AND entity_id = ?
      ORDER BY created_at DESC LIMIT 100
    `).bind(companyId, entityType, entityId).all();
    return result.results || [];
  }
}

// Middleware factory for auto-audit on financial entities
export function auditMiddleware(entityType) {
  return async (c, next) => {
    const method = c.req.method;
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next();
    }
    // Store pre-update state for PUT/PATCH/DELETE
    if (['PUT', 'PATCH', 'DELETE'].includes(method)) {
      const id = c.req.param('id');
      if (id && c.env.DB) {
        try {
          const tableName = entityType === 'promotion' ? 'promotions' :
                           entityType === 'budget' ? 'budgets' :
                           entityType === 'claim' ? 'claims' :
                           entityType === 'deduction' ? 'deductions' :
                           entityType === 'settlement' ? 'settlements' :
                           entityType === 'accrual' ? 'accruals' :
                           entityType === 'approval' ? 'approvals' : null;
          if (tableName) {
            const existing = await c.env.DB.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).bind(id).first();
            c.set('auditPrevState', existing);
          }
        } catch { /* ignore - best effort */ }
      }
    }

    await next();

    // After response, record changes
    try {
      const status = c.res.status;
      if (status >= 200 && status < 300) {
        const db = c.env.DB;
        const user = c.get('user');
        const companyId = c.get('tenantId') || c.get('companyId') || 'default';
        const userId = user?._id?.$oid || user?._id || 'system';
        const audit = new AuditService(db);
        const id = c.req.param('id');

        if (method === 'POST') {
          await audit.recordChange({
            companyId, entityType, entityId: id || 'new',
            fieldName: '*', oldValue: null, newValue: 'created',
            changeType: 'create', userId, source: 'api'
          });
        } else if (['PUT', 'PATCH'].includes(method)) {
          const prev = c.get('auditPrevState');
          if (prev) {
            await audit.recordChange({
              companyId, entityType, entityId: id,
              fieldName: '*', oldValue: prev, newValue: 'updated',
              changeType: 'update', userId, source: 'api'
            });
          }
        } else if (method === 'DELETE') {
          const prev = c.get('auditPrevState');
          await audit.recordDeletion(companyId, entityType, id, prev, userId);
        }
      }
    } catch { /* audit is best-effort, never block the response */ }
  };
}
