// GAP-10: Bulk Operations - approve, delete, status change with D1 batch()
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { apiError } from '../utils/apiError.js';
import { AuditService } from '../services/auditService.js';

export const bulkOperationsRoutes = new Hono();
bulkOperationsRoutes.use('*', authMiddleware);

const getCompanyId = (c) => c.get('companyId') || c.get('tenantId') || c.req.header('X-Company-Code');

const ENTITY_TABLES = {
  promotions: 'promotions', budgets: 'budgets', claims: 'claims',
  deductions: 'deductions', settlements: 'settlements', approvals: 'approvals',
  'trade-spends': 'trade_spends', 'vendor-funds': 'vendor_funds', accruals: 'accruals'
};

// POST /api/bulk/:entity/action - bulk status change
bulkOperationsRoutes.post('/:entity/action', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const userId = c.get('userId');
    const { entity } = c.req.param();
    const { ids, action, status: newStatus } = await c.req.json();
    
    const table = ENTITY_TABLES[entity];
    if (!table) return c.json({ success: false, message: `Unknown entity: ${entity}` }, 400);
    if (!ids || !Array.isArray(ids) || ids.length === 0) return c.json({ success: false, message: 'ids array is required' }, 400);
    if (!action && !newStatus) return c.json({ success: false, message: 'action or status is required' }, 400);

    const targetStatus = newStatus || action;
    const stmts = ids.map(id =>
      db.prepare(`UPDATE ${table} SET status = ?, updated_at = datetime('now') WHERE id = ? AND company_id = ?`)
        .bind(targetStatus, id, companyId)
    );

    // D1 batch for atomicity
    let processed = 0, failed = 0;
    const errors = [];
    for (let i = 0; i < stmts.length; i += 50) {
      try {
        const batch = stmts.slice(i, i + 50);
        const results = await db.batch(batch);
        results.forEach((r, idx) => {
          if (r.meta?.changes > 0) processed++;
          else { failed++; errors.push({ id: ids[i + idx], error: 'Not found or no change' }); }
        });
      } catch (e) {
        const batchIds = ids.slice(i, i + 50);
        failed += batchIds.length;
        errors.push({ ids: batchIds, error: e.message });
      }
    }

    // Audit trail
    try {
      const audit = new AuditService(db);
      await audit.recordBulkChanges(ids.map(id => ({
        companyId, entityType: entity, entityId: id,
        fieldName: 'status', oldValue: 'previous', newValue: targetStatus,
        changeType: 'bulk_update', userId, source: 'bulk_api'
      })));
    } catch { /* best effort */ }

    return c.json({ success: true, processed, failed, errors, total: ids.length });
  } catch (e) { return apiError(c, e, 'bulk.action'); }
});

// POST /api/bulk/:entity/approve - bulk approve
bulkOperationsRoutes.post('/:entity/approve', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const userId = c.get('userId');
    const { entity } = c.req.param();
    const { ids } = await c.req.json();
    
    const table = ENTITY_TABLES[entity];
    if (!table) return c.json({ success: false, message: `Unknown entity: ${entity}` }, 400);
    if (!ids || !Array.isArray(ids) || ids.length === 0) return c.json({ success: false, message: 'ids array is required' }, 400);

    const stmts = ids.map(id =>
      db.prepare(`UPDATE ${table} SET status = 'approved', approved_by = ?, approved_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND company_id = ?`)
        .bind(userId, id, companyId)
    );

    let processed = 0, failed = 0;
    const errors = [];
    for (let i = 0; i < stmts.length; i += 50) {
      try {
        const results = await db.batch(stmts.slice(i, i + 50));
        results.forEach((r, idx) => {
          if (r.meta?.changes > 0) processed++;
          else { failed++; errors.push({ id: ids[i + idx], error: 'Not found or already approved' }); }
        });
      } catch (e) { failed += ids.slice(i, i + 50).length; errors.push({ error: e.message }); }
    }

    return c.json({ success: true, processed, failed, errors, total: ids.length });
  } catch (e) { return apiError(c, e, 'bulk.approve'); }
});

// DELETE /api/bulk/:entity - bulk delete (soft)
bulkOperationsRoutes.delete('/:entity', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const userId = c.get('userId');
    const { entity } = c.req.param();
    const { ids } = await c.req.json();
    
    const table = ENTITY_TABLES[entity];
    if (!table) return c.json({ success: false, message: `Unknown entity: ${entity}` }, 400);
    if (!ids || !Array.isArray(ids) || ids.length === 0) return c.json({ success: false, message: 'ids array is required' }, 400);

    const stmts = ids.map(id =>
      db.prepare(`UPDATE ${table} SET status = 'deleted', updated_at = datetime('now') WHERE id = ? AND company_id = ?`)
        .bind(id, companyId)
    );

    let processed = 0, failed = 0;
    const errors = [];
    for (let i = 0; i < stmts.length; i += 50) {
      try {
        const results = await db.batch(stmts.slice(i, i + 50));
        results.forEach((r, idx) => {
          if (r.meta?.changes > 0) processed++;
          else { failed++; errors.push({ id: ids[i + idx], error: 'Not found' }); }
        });
      } catch (e) { failed += ids.slice(i, i + 50).length; errors.push({ error: e.message }); }
    }

    // Audit trail
    try {
      const audit = new AuditService(db);
      await audit.recordBulkChanges(ids.map(id => ({
        companyId, entityType: entity, entityId: id,
        fieldName: '*', oldValue: 'exists', newValue: 'deleted',
        changeType: 'bulk_delete', userId, source: 'bulk_api'
      })));
    } catch { /* best effort */ }

    return c.json({ success: true, processed, failed, errors, total: ids.length });
  } catch (e) { return apiError(c, e, 'bulk.delete'); }
});
