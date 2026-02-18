import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const approvals = new Hono();

// Apply auth middleware to all routes
approvals.use('*', authMiddleware);

// Helper to generate UUID
const generateId = () => crypto.randomUUID();

// Helper to get company_id from auth context
const getCompanyId = (c) => {
  return c.get('companyId') || c.get('tenantId') || c.req.header('X-Company-Code') || 'default';
};

const getUserId = (c) => {
  return c.get('userId') || null;
};

// Get all approvals (with filters)
approvals.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, entity_type, assigned_to, limit = 50, offset = 0 } = c.req.query();
    
    let query = 'SELECT * FROM approvals WHERE company_id = ?';
    const params = [companyId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (entity_type) {
      query += ' AND entity_type = ?';
      params.push(entity_type);
    }
    if (assigned_to) {
      query += ' AND assigned_to = ?';
      params.push(assigned_to);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.prepare(query).bind(...params).all();
    
    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: result.results?.length || 0
    });
  } catch (error) {
    console.error('Error fetching approvals:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get pending approvals
approvals.get('/pending', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    
    const result = await db.prepare(`
      SELECT * FROM approvals 
      WHERE company_id = ? AND status = 'pending'
      ORDER BY 
        CASE priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'normal' THEN 3 
          ELSE 4 
        END,
        created_at ASC
    `).bind(companyId).all();
    
    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument)
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get overdue approvals
approvals.get('/overdue', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const now = new Date().toISOString();
    
    const result = await db.prepare(`
      SELECT * FROM approvals 
      WHERE company_id = ? 
        AND status = 'pending'
        AND due_date < ?
      ORDER BY due_date ASC
    `).bind(companyId, now).all();
    
    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument)
    });
  } catch (error) {
    console.error('Error fetching overdue approvals:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get approvals by entity
approvals.get('/entity/:entityType/:entityId', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { entityType, entityId } = c.req.param();
    
    const result = await db.prepare(`
      SELECT * FROM approvals 
      WHERE company_id = ? AND entity_type = ? AND entity_id = ?
      ORDER BY created_at DESC
    `).bind(companyId, entityType, entityId).all();
    
    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument)
    });
  } catch (error) {
    console.error('Error fetching entity approvals:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get approval by ID
approvals.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    
    const result = await db.prepare(`
      SELECT * FROM approvals WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!result) {
      return c.json({ success: false, message: 'Approval not found' }, 404);
    }
    
    return c.json({ success: true, data: rowToDocument(result) });
  } catch (error) {
    console.error('Error fetching approval:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Create approval request
approvals.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = getUserId(c);
    
    const id = generateId();
    const now = new Date().toISOString();
    const slaHours = body.slaHours || body.sla_hours || 48;
    const dueDate = body.dueDate || body.due_date || new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();
    
    await db.prepare(`
      INSERT INTO approvals (
        id, company_id, entity_type, entity_id, entity_name, amount,
        status, priority, requested_by, requested_at, assigned_to,
        due_date, sla_hours, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId,
      body.entityType || body.entity_type || 'promotion',
      body.entityId || body.entity_id || generateId(),
      body.entityName || body.entity_name || '',
      body.amount || 0,
      body.priority || 'normal',
      userId, now,
      body.assignedTo || body.assigned_to || null,
      dueDate, slaHours,
      JSON.stringify(body.metadata || body.data || {}), now, now
    ).run();
    
    const created = await db.prepare('SELECT * FROM approvals WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    console.error('Error creating approval:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Update approval
approvals.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare(`
      SELECT * FROM approvals WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'Approval not found' }, 404);
    }

    const fields = [];
    const values = [];

    if (body.status !== undefined) { fields.push('status = ?'); values.push(body.status); }
    if (body.priority !== undefined) { fields.push('priority = ?'); values.push(body.priority); }
    if (body.assignedTo !== undefined || body.assigned_to !== undefined) { fields.push('assigned_to = ?'); values.push(body.assignedTo || body.assigned_to); }
    if (body.entityName !== undefined || body.entity_name !== undefined) { fields.push('entity_name = ?'); values.push(body.entityName || body.entity_name); }
    if (body.amount !== undefined) { fields.push('amount = ?'); values.push(body.amount); }
    if (body.comments !== undefined) { fields.push('comments = ?'); values.push(body.comments); }
    if (body.dueDate !== undefined || body.due_date !== undefined) { fields.push('due_date = ?'); values.push(body.dueDate || body.due_date); }
    if (body.slaHours !== undefined || body.sla_hours !== undefined) { fields.push('sla_hours = ?'); values.push(body.slaHours || body.sla_hours); }

    if (fields.length === 0) {
      return c.json({ success: false, message: 'No fields to update' }, 400);
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);
    values.push(companyId);

    await db.prepare(`
      UPDATE approvals SET ${fields.join(', ')} WHERE id = ? AND company_id = ?
    `).bind(...values).run();

    const updated = await db.prepare('SELECT * FROM approvals WHERE id = ?').bind(id).first();

    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error updating approval:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Delete approval
approvals.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const existing = await db.prepare(`
      SELECT * FROM approvals WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'Approval not found' }, 404);
    }

    await db.prepare(`
      DELETE FROM approvals WHERE id = ? AND company_id = ?
    `).bind(id, companyId).run();

    return c.json({ success: true, message: 'Approval deleted successfully' });
  } catch (error) {
    console.error('Error deleting approval:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Approve
approvals.post('/:id/approve', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const userId = getUserId(c);
    const now = new Date().toISOString();
    
    // Get current approval
    const approval = await db.prepare(`
      SELECT * FROM approvals WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!approval) {
      return c.json({ success: false, message: 'Approval not found' }, 404);
    }
    
    if (approval.status !== 'pending') {
      return c.json({ success: false, message: 'Approval is not pending' }, 400);
    }
    
    // Update approval
    await db.prepare(`
      UPDATE approvals 
      SET status = 'approved', approved_by = ?, approved_at = ?, 
          comments = ?, updated_at = ?
      WHERE id = ?
    `).bind(userId, now, body.comments || '', now, id).run();
    
    // Update the underlying entity status if applicable
    if (approval.entity_type && approval.entity_id) {
      const tableMap = {
        promotion: 'promotions',
        budget: 'budgets',
        trade_spend: 'trade_spends',
        rebate: 'rebates',
        trading_term: 'trading_terms',
        claim: 'claims',
        campaign: 'campaigns'
      };
      
      const table = tableMap[approval.entity_type];
      if (table) {
        try {
          await db.prepare(`
            UPDATE ${table} SET status = 'approved', updated_at = ? WHERE id = ?
          `).bind(now, approval.entity_id).run();
        } catch (e) {
          console.log('Could not update entity status:', e.message);
        }
      }
    }
    
    const updated = await db.prepare('SELECT * FROM approvals WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error approving:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Reject
approvals.post('/:id/reject', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const userId = getUserId(c);
    const now = new Date().toISOString();
    
    const approval = await db.prepare(`
      SELECT * FROM approvals WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!approval) {
      return c.json({ success: false, message: 'Approval not found' }, 404);
    }
    
    if (approval.status !== 'pending') {
      return c.json({ success: false, message: 'Approval is not pending' }, 400);
    }
    
    await db.prepare(`
      UPDATE approvals 
      SET status = 'rejected', rejected_by = ?, rejected_at = ?, 
          rejection_reason = ?, updated_at = ?
      WHERE id = ?
    `).bind(userId, now, body.reason || '', now, id).run();
    
    // Update the underlying entity status
    if (approval.entity_type && approval.entity_id) {
      const tableMap = {
        promotion: 'promotions',
        budget: 'budgets',
        trade_spend: 'trade_spends',
        rebate: 'rebates',
        trading_term: 'trading_terms',
        claim: 'claims',
        campaign: 'campaigns'
      };
      
      const table = tableMap[approval.entity_type];
      if (table) {
        try {
          await db.prepare(`
            UPDATE ${table} SET status = 'rejected', updated_at = ? WHERE id = ?
          `).bind(now, approval.entity_id).run();
        } catch (e) {
          console.log('Could not update entity status:', e.message);
        }
      }
    }
    
    const updated = await db.prepare('SELECT * FROM approvals WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error rejecting:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Cancel
approvals.post('/:id/cancel', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE approvals 
      SET status = 'cancelled', comments = ?, updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(body.reason || '', now, id, companyId).run();
    
    const updated = await db.prepare('SELECT * FROM approvals WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error cancelling:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Check SLA
approvals.get('/:id/sla', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    
    const approval = await db.prepare(`
      SELECT * FROM approvals WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!approval) {
      return c.json({ success: false, message: 'Approval not found' }, 404);
    }
    
    const now = new Date();
    const dueDate = new Date(approval.due_date);
    const createdAt = new Date(approval.created_at);
    
    const totalHours = approval.sla_hours || 48;
    const elapsedHours = (now - createdAt) / (1000 * 60 * 60);
    const remainingHours = Math.max(0, (dueDate - now) / (1000 * 60 * 60));
    const isOverdue = now > dueDate;
    const percentComplete = Math.min(100, (elapsedHours / totalHours) * 100);
    
    return c.json({
      success: true,
      data: {
        approvalId: id,
        status: approval.status,
        slaHours: totalHours,
        elapsedHours: Math.round(elapsedHours * 10) / 10,
        remainingHours: Math.round(remainingHours * 10) / 10,
        isOverdue,
        percentComplete: Math.round(percentComplete),
        dueDate: approval.due_date
      }
    });
  } catch (error) {
    console.error('Error checking SLA:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export const approvalsRoutes = approvals;
