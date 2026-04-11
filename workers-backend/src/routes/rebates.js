import { Hono } from 'hono';
import {authMiddleware, requireMinRole } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';
import { checkBudgetAvailability } from '../services/budgetEnforcement.js';
import { apiError } from '../utils/apiError.js';
import { validateBody, schemas } from '../validators/schemas.js';
import { EntityLifecycleService } from '../services/entityLifecycleService.js';
import { createNotification } from '../services/notifications.js';
import { resolveBaselineScope } from '../services/hierarchyResolver.js';

const rebates = new Hono();

// Apply auth middleware to all routes
rebates.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
};

const getUserId = (c) => {
  return c.get('userId') || null;
};

// Get all rebates
rebates.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, type, startDate, endDate, customer_id, limit = 50, offset = 0 } = c.req.query();
    
    let query = 'SELECT r.*, c.name as customer_name FROM rebates r LEFT JOIN customers c ON r.customer_id = c.id WHERE r.company_id = ?';
    const params = [companyId];
    
    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }
    if (type) {
      query += ' AND r.rebate_type = ?';
      params.push(type);
    }
    if (customer_id) {
      query += ' AND r.customer_id = ?';
      params.push(customer_id);
    }
    if (startDate) {
      query += ' AND r.start_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND r.end_date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.prepare(query).bind(...params).all();
    
    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: result.results?.length || 0
    });
  } catch (error) {
    console.error('Error fetching rebates:', error);
    return apiError(c, error, 'rebates');
  }
});

// Get rebate analytics
rebates.get('/analytics', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { startDate, endDate } = c.req.query();
    
    let dateFilter = '';
    const params = [companyId];
    
    if (startDate && endDate) {
      dateFilter = ' AND start_date >= ? AND end_date <= ?';
      params.push(startDate, endDate);
    }
    
    const summary = await db.prepare(`
      SELECT 
        COUNT(*) as total_rebates,
        SUM(accrued_amount) as total_accrued,
        SUM(settled_amount) as total_settled,
        SUM(accrued_amount - settled_amount) as outstanding,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
        COUNT(CASE WHEN status = 'calculating' THEN 1 END) as calculating_count,
        COUNT(CASE WHEN status = 'settled' THEN 1 END) as settled_count
      FROM rebates 
      WHERE company_id = ?${dateFilter}
    `).bind(...params).first();
    
    const byType = await db.prepare(`
      SELECT 
        rebate_type,
        COUNT(*) as count,
        SUM(accrued_amount) as accrued,
        SUM(settled_amount) as settled
      FROM rebates 
      WHERE company_id = ?${dateFilter}
      GROUP BY rebate_type
    `).bind(...params).all();
    
    return c.json({
      success: true,
      data: {
        summary,
        byType: byType.results || []
      }
    });
  } catch (error) {
    console.error('Error fetching rebate analytics:', error);
    return apiError(c, error, 'rebates');
  }
});

// Get rebate by ID
rebates.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    
    const result = await db.prepare(`
      SELECT r.*, c.name as customer_name 
      FROM rebates r 
      LEFT JOIN customers c ON r.customer_id = c.id 
      WHERE r.id = ? AND r.company_id = ?
    `).bind(id, companyId).first();
    
    if (!result) {
      return apiError(c, { status: 404, message: 'Rebate not found' }, 'rebates');
    }

    // Hierarchy-aware baseline resolution for rebate context
    let baselineData = null;
    if (result.customer_id) {
      try {
        const resolved = await resolveBaselineScope(db, companyId, {
          customerId: result.customer_id
        });
        if (resolved && resolved.baseline) {
          baselineData = {
            baseVolume: resolved.baseline.total_base_volume || 0,
            baseRevenue: resolved.baseline.total_base_revenue || 0,
            avgWeeklyVolume: resolved.baseline.avg_weekly_volume || 0,
            source: resolved.source
          };
        }
      } catch (e) { /* no baseline available */ }
    }
    
    return c.json({ success: true, data: { ...rowToDocument(result), baseline: baselineData } });
  } catch (error) {
    console.error('Error fetching rebate:', error);
    return apiError(c, error, 'rebates');
  }
});

// Get rebate accruals
rebates.get('/:id/accruals', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    
    const rebate = await db.prepare(`
      SELECT * FROM rebates WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!rebate) {
      return apiError(c, { status: 404, message: 'Rebate not found' }, 'rebates');
    }
    
    // Parse accruals from data JSON if exists
    let accruals = [];
    if (rebate.data) {
      try {
        const data = JSON.parse(rebate.data);
        accruals = data.accruals || [];
      } catch (e) {}
    }
    
    return c.json({
      success: true,
      data: {
        rebateId: id,
        totalAccrued: rebate.accrued_amount,
        totalSettled: rebate.settled_amount,
        outstanding: rebate.accrued_amount - rebate.settled_amount,
        accruals
      }
    });
  } catch (error) {
    console.error('Error fetching accruals:', error);
    return apiError(c, error, 'rebates');
  }
});

// Create rebate
rebates.post('/', validateBody(schemas.rebate), async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = c.get('validatedBody');
    const userId = getUserId(c);
    
    const id = generateId();
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO rebates (
        id, company_id, name, description, rebate_type, status,
        customer_id, trading_term_id, start_date, end_date,
        rate, rate_type, threshold, cap, calculation_basis,
        settlement_frequency, created_by, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId, body.name, body.description || '',
      body.rebateType || body.rebate_type || 'volume',
      body.customerId || body.customer_id || null,
      body.tradingTermId || body.trading_term_id || null,
      body.startDate || body.start_date || null,
      body.endDate || body.end_date || null,
      body.rate || 0, body.rateType || body.rate_type || 'percentage',
      body.threshold || 0, body.cap || null,
      body.calculationBasis || body.calculation_basis || 'revenue',
      body.settlementFrequency || body.settlement_frequency || 'quarterly',
      userId, JSON.stringify(body.data || {}), now, now
    ).run();
    
    const created = await db.prepare('SELECT * FROM rebates WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    console.error('Error creating rebate:', error);
    return apiError(c, error, 'rebates');
  }
});

// Update rebate
rebates.put('/:id', validateBody(schemas.rebate), async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = c.get('validatedBody');
    const now = new Date().toISOString();
    
    const existing = await db.prepare(`
      SELECT * FROM rebates WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!existing) {
      return apiError(c, { status: 404, message: 'Rebate not found' }, 'rebates');
    }
    
    await db.prepare(`
      UPDATE rebates SET
        name = ?, description = ?, rebate_type = ?,
        customer_id = ?, start_date = ?, end_date = ?,
        rate = ?, rate_type = ?, threshold = ?, cap = ?,
        calculation_basis = ?, settlement_frequency = ?,
        data = ?, updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(
      body.name || existing.name,
      body.description || existing.description,
      body.rebateType || body.rebate_type || existing.rebate_type,
      body.customerId || body.customer_id || existing.customer_id,
      body.startDate || body.start_date || existing.start_date,
      body.endDate || body.end_date || existing.end_date,
      body.rate ?? existing.rate,
      body.rateType || body.rate_type || existing.rate_type,
      body.threshold ?? existing.threshold,
      body.cap ?? existing.cap,
      body.calculationBasis || body.calculation_basis || existing.calculation_basis,
      body.settlementFrequency || body.settlement_frequency || existing.settlement_frequency,
      JSON.stringify(body.data || {}),
      now, id
    ).run();
    
    const updated = await db.prepare('SELECT * FROM rebates WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error updating rebate:', error);
    return apiError(c, error, 'rebates');
  }
});

// Delete rebate
rebates.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    
    const existing = await db.prepare(`
      SELECT * FROM rebates WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!existing) {
      return apiError(c, { status: 404, message: 'Rebate not found' }, 'rebates');
    }
    
    await db.prepare('DELETE FROM rebates WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    
    return c.json({ success: true, message: 'Rebate deleted' });
  } catch (error) {
    console.error('Error deleting rebate:', error);
    return apiError(c, error, 'rebates');
  }
});

// Activate rebate
rebates.post('/:id/activate', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE rebates SET status = 'active', updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(now, id, companyId).run();
    
    const updated = await db.prepare('SELECT * FROM rebates WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error activating rebate:', error);
    return apiError(c, error, 'rebates');
  }
});

// Deactivate rebate
rebates.post('/:id/deactivate', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE rebates SET status = 'draft', updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(now, id, companyId).run();
    
    const updated = await db.prepare('SELECT * FROM rebates WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error deactivating rebate:', error);
    return apiError(c, error, 'rebates');
  }
});

// W-03: Submit rebate for approval
rebates.post('/:id/submit', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const userId = getUserId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();

    const rebate = await db.prepare('SELECT * FROM rebates WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!rebate) return apiError(c, { status: 404, message: 'Rebate not found' }, 'rebates');

    const lifecycle = new EntityLifecycleService(db, companyId, userId);
    const result = await lifecycle.onEntitySubmit({
      entityType: 'rebate', entityId: id,
      entityName: rebate.name || 'Rebate',
      amount: rebate.estimated_amount || rebate.rate || 0
    });

    if (!result.success) {
      return c.json({ success: false, message: result.reason }, 400);
    }

    await db.prepare(`
      UPDATE rebates SET status = 'pending_approval', updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(now, id, companyId).run();
    
    const updated = await db.prepare('SELECT * FROM rebates WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error submitting rebate:', error);
    return apiError(c, error, 'rebates');
  }
});

// W-03: Approve rebate + auto-create accrual
rebates.post('/:id/approve', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const userId = getUserId(c);
    const now = new Date().toISOString();

    const rebate = await db.prepare('SELECT * FROM rebates WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!rebate) return apiError(c, { status: 404, message: 'Rebate not found' }, 'rebates');

    const lifecycle = new EntityLifecycleService(db, companyId, userId);
    await lifecycle.onEntityApprove({
      entityType: 'rebate', entityId: id,
      entityName: rebate.name || 'Rebate',
      amount: rebate.estimated_amount || rebate.rate || 0,
      requesterId: rebate.created_by
    });

    await db.prepare(`
      UPDATE rebates SET status = 'approved', approved_by = ?, approved_at = ?, updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(userId, now, now, id, companyId).run();

    // W-03: Auto-create accrual on rebate approval
    let accrualId = null;
    try {
      accrualId = crypto.randomUUID();
      const accrualAmount = rebate.estimated_amount || rebate.accrued_amount || 0;
      await db.prepare(`
        INSERT INTO accruals (id, company_id, customer_id, promotion_id, rebate_id, accrual_type, period, accrued_amount, settled_amount, remaining_amount, status, gl_account, cost_center, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'rebate', ?, ?, 0, ?, 'pending', '4200-Rebate Accrual', '', '{}', ?, ?)
      `).bind(
        accrualId, companyId, rebate.customer_id || null, rebate.promotion_id || null, id,
        now.substring(0, 7), accrualAmount, accrualAmount, now, now
      ).run();

      await createNotification(db, {
        companyId, userId: rebate.created_by || userId,
        title: 'Accrual Auto-Created',
        message: `Accrual of R${Math.round(accrualAmount).toLocaleString()} auto-created from approved rebate "${rebate.name}".`,
        type: 'info', category: 'accrual', priority: 'normal',
        entityType: 'accrual', entityId: accrualId, entityName: `Rebate Accrual - ${rebate.name}`
      });
    } catch (e) {
      console.error('Failed to auto-create accrual:', e.message);
    }

    const updated = await db.prepare('SELECT * FROM rebates WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    
    return c.json({ success: true, data: rowToDocument(updated), accrualId });
  } catch (error) {
    console.error('Error approving rebate:', error);
    return apiError(c, error, 'rebates');
  }
});

// W-03: Reject rebate with notification
rebates.post('/:id/reject', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const userId = getUserId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const rebate = await db.prepare('SELECT * FROM rebates WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!rebate) return apiError(c, { status: 404, message: 'Rebate not found' }, 'rebates');

    const lifecycle = new EntityLifecycleService(db, companyId, userId);
    await lifecycle.onEntityReject({
      entityType: 'rebate', entityId: id,
      entityName: rebate.name || 'Rebate',
      amount: rebate.estimated_amount || rebate.rate || 0,
      requesterId: rebate.created_by, reason: body.reason
    });

    await db.prepare(`
      UPDATE rebates SET status = 'rejected', updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(now, id, companyId).run();
    
    const updated = await db.prepare('SELECT * FROM rebates WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    
    return c.json({ success: true, data: rowToDocument(updated), reason: body.reason });
  } catch (error) {
    console.error('Error rejecting rebate:', error);
    return apiError(c, error, 'rebates');
  }
});

// Calculate rebate
rebates.post('/:id/calculate', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    
    const rebate = await db.prepare(`
      SELECT * FROM rebates WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!rebate) {
      return apiError(c, { status: 404, message: 'Rebate not found' }, 'rebates');
    }
    
    // Simple calculation based on provided sales data
    const salesAmount = body.salesAmount || 0;
    const salesVolume = body.salesVolume || 0;
    
    let calculatedAmount = 0;
    const basis = rebate.calculation_basis || 'revenue';
    const baseValue = basis === 'volume' ? salesVolume : salesAmount;
    
    if (baseValue >= (rebate.threshold || 0)) {
      if (rebate.rate_type === 'percentage') {
        calculatedAmount = baseValue * (rebate.rate / 100);
      } else {
        calculatedAmount = rebate.rate;
      }
      
      if (rebate.cap && calculatedAmount > rebate.cap) {
        calculatedAmount = rebate.cap;
      }
    }
    
    const newAccrued = (rebate.accrued_amount || 0) + calculatedAmount;
    
    await db.prepare(`
      UPDATE rebates SET 
        accrued_amount = ?, 
        last_calculated_at = ?,
        status = 'calculating',
        updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(newAccrued, now, now, id, companyId).run();
    
    const updated = await db.prepare('SELECT * FROM rebates WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    
    return c.json({
      success: true,
      data: rowToDocument(updated),
      calculation: {
        baseValue,
        rate: rebate.rate,
        rateType: rebate.rate_type,
        calculatedAmount,
        newAccruedTotal: newAccrued
      }
    });
  } catch (error) {
    console.error('Error calculating rebate:', error);
    return apiError(c, error, 'rebates');
  }
});

export const rebatesRoutes = rebates;
