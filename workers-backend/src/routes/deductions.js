import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';

const deductions = new Hono();

// Apply auth middleware to all routes
deductions.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
};

const getUserId = (c) => {
  return c.get('userId') || null;
};

// Get all deductions
deductions.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, type, customer_id, startDate, endDate, limit = 50, offset = 0 } = c.req.query();
    
    let query = 'SELECT d.*, cu.name as customer_name FROM deductions d LEFT JOIN customers cu ON d.customer_id = cu.id WHERE d.company_id = ?';
    const params = [companyId];
    
    if (status) {
      query += ' AND d.status = ?';
      params.push(status);
    }
    if (type) {
      query += ' AND d.deduction_type = ?';
      params.push(type);
    }
    if (customer_id) {
      query += ' AND d.customer_id = ?';
      params.push(customer_id);
    }
    if (startDate) {
      query += ' AND d.deduction_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND d.deduction_date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.prepare(query).bind(...params).all();
    
    return c.json({
      success: true,
      data: result.results || [],
      total: result.results?.length || 0
    });
  } catch (error) {
    console.error('Error fetching deductions:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get unmatched deductions
deductions.get('/unmatched', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    
    const result = await db.prepare(`
      SELECT d.*, cu.name as customer_name 
      FROM deductions d 
      LEFT JOIN customers cu ON d.customer_id = cu.id 
      WHERE d.company_id = ? AND d.status IN ('open', 'under_review')
      ORDER BY d.created_at DESC
    `).bind(companyId).all();
    
    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    console.error('Error fetching unmatched deductions:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get disputed deductions
deductions.get('/disputed', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    
    const result = await db.prepare(`
      SELECT d.*, cu.name as customer_name 
      FROM deductions d 
      LEFT JOIN customers cu ON d.customer_id = cu.id 
      WHERE d.company_id = ? AND d.status = 'disputed'
      ORDER BY d.created_at DESC
    `).bind(companyId).all();
    
    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    console.error('Error fetching disputed deductions:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get deduction statistics
deductions.get('/statistics', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    
    const byStatus = await db.prepare(`
      SELECT 
        status as _id,
        COUNT(*) as count,
        SUM(deduction_amount) as totalAmount
      FROM deductions WHERE company_id = ?
      GROUP BY status
    `).bind(companyId).all();
    
    const disputes = await db.prepare(`
      SELECT 
        reason_code as _id,
        COUNT(*) as count,
        SUM(deduction_amount) as totalAmount
      FROM deductions WHERE company_id = ? AND status = 'disputed'
      GROUP BY reason_code
    `).bind(companyId).all();
    
    return c.json({
      success: true,
      data: {
        byStatus: byStatus.results || [],
        disputes: disputes.results || []
      }
    });
  } catch (error) {
    console.error('Error fetching deduction statistics:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get deductions summary/analytics
deductions.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    
    const summary = await db.prepare(`
      SELECT 
        COUNT(*) as total_deductions,
        SUM(deduction_amount) as total_amount,
        SUM(matched_amount) as total_matched,
        SUM(remaining_amount) as total_remaining,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_count,
        COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review_count,
        COUNT(CASE WHEN status = 'matched' THEN 1 END) as matched_count,
        COUNT(CASE WHEN status = 'disputed' THEN 1 END) as disputed_count,
        COUNT(CASE WHEN status = 'written_off' THEN 1 END) as written_off_count
      FROM deductions WHERE company_id = ?
    `).bind(companyId).first();
    
    const byType = await db.prepare(`
      SELECT 
        deduction_type,
        COUNT(*) as count,
        SUM(deduction_amount) as amount,
        SUM(matched_amount) as matched
      FROM deductions WHERE company_id = ?
      GROUP BY deduction_type
    `).bind(companyId).all();
    
    const aging = await db.prepare(`
      SELECT 
        CASE 
          WHEN julianday('now') - julianday(deduction_date) <= 30 THEN '0-30 days'
          WHEN julianday('now') - julianday(deduction_date) <= 60 THEN '31-60 days'
          WHEN julianday('now') - julianday(deduction_date) <= 90 THEN '61-90 days'
          ELSE '90+ days'
        END as age_bucket,
        COUNT(*) as count,
        SUM(remaining_amount) as amount
      FROM deductions 
      WHERE company_id = ? AND status IN ('open', 'under_review', 'disputed')
      GROUP BY age_bucket
    `).bind(companyId).all();
    
    return c.json({
      success: true,
      data: {
        summary,
        byType: byType.results || [],
        aging: aging.results || []
      }
    });
  } catch (error) {
    console.error('Error fetching deductions summary:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get deduction by ID
deductions.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    
    const result = await db.prepare(`
      SELECT d.*, cu.name as customer_name 
      FROM deductions d 
      LEFT JOIN customers cu ON d.customer_id = cu.id 
      WHERE d.id = ? AND d.company_id = ?
    `).bind(id, companyId).first();
    
    if (!result) {
      return c.json({ success: false, message: 'Deduction not found' }, 404);
    }
    
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching deduction:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Create deduction
deductions.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = getUserId(c);
    
    const id = generateId();
    const deductionNumber = `DED-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    const amount = body.deductionAmount || body.deduction_amount || 0;
    
    await db.prepare(`
      INSERT INTO deductions (
        id, company_id, deduction_number, deduction_type, status,
        customer_id, invoice_number, invoice_date,
        deduction_amount, matched_amount, remaining_amount,
        deduction_date, due_date, reason_code, reason_description,
        created_by, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'open', ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId, deductionNumber,
      body.deductionType || body.deduction_type || 'promotion',
      body.customerId || body.customer_id || null,
      body.invoiceNumber || body.invoice_number || null,
      body.invoiceDate || body.invoice_date || null,
      amount, amount,
      body.deductionDate || body.deduction_date || now,
      body.dueDate || body.due_date || null,
      body.reasonCode || body.reason_code || null,
      body.reasonDescription || body.reason_description || '',
      userId, JSON.stringify(body.data || {}), now, now
    ).run();
    
    const created = await db.prepare('SELECT * FROM deductions WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: created }, 201);
  } catch (error) {
    console.error('Error creating deduction:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Update deduction
deductions.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    
    const existing = await db.prepare(`
      SELECT * FROM deductions WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!existing) {
      return c.json({ success: false, message: 'Deduction not found' }, 404);
    }
    
    const amount = body.deductionAmount || body.deduction_amount || existing.deduction_amount;
    const matchedAmount = body.matchedAmount || body.matched_amount || existing.matched_amount;
    
    await db.prepare(`
      UPDATE deductions SET
        deduction_type = ?, customer_id = ?, invoice_number = ?, invoice_date = ?,
        deduction_amount = ?, matched_amount = ?, remaining_amount = ?,
        deduction_date = ?, due_date = ?, reason_code = ?, reason_description = ?,
        data = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.deductionType || body.deduction_type || existing.deduction_type,
      body.customerId || body.customer_id || existing.customer_id,
      body.invoiceNumber || body.invoice_number || existing.invoice_number,
      body.invoiceDate || body.invoice_date || existing.invoice_date,
      amount, matchedAmount, amount - matchedAmount,
      body.deductionDate || body.deduction_date || existing.deduction_date,
      body.dueDate || body.due_date || existing.due_date,
      body.reasonCode || body.reason_code || existing.reason_code,
      body.reasonDescription || body.reason_description || existing.reason_description,
      JSON.stringify(body.data || {}),
      now, id
    ).run();
    
    const updated = await db.prepare('SELECT * FROM deductions WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating deduction:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Delete deduction
deductions.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    
    const existing = await db.prepare(`
      SELECT * FROM deductions WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!existing) {
      return c.json({ success: false, message: 'Deduction not found' }, 404);
    }
    
    await db.prepare('DELETE FROM deductions WHERE id = ?').bind(id).run();
    
    return c.json({ success: true, message: 'Deduction deleted' });
  } catch (error) {
    console.error('Error deleting deduction:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Start review
deductions.post('/:id/review', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const userId = getUserId(c);
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE deductions SET status = 'under_review', reviewed_by = ?, updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(userId, now, id, companyId).run();
    
    const updated = await db.prepare('SELECT * FROM deductions WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error starting review:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Match deduction to claim/promotion
deductions.post('/:id/match', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    
    const deduction = await db.prepare(`
      SELECT * FROM deductions WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!deduction) {
      return c.json({ success: false, message: 'Deduction not found' }, 404);
    }
    
    const matchAmount = body.matchAmount || body.match_amount || 0;
    const newMatchedAmount = (deduction.matched_amount || 0) + matchAmount;
    const newRemainingAmount = deduction.deduction_amount - newMatchedAmount;
    const newStatus = newRemainingAmount <= 0 ? 'matched' : deduction.status;
    
    // Parse existing matched_to
    let matchedTo = [];
    try {
      matchedTo = JSON.parse(deduction.matched_to || '[]');
    } catch (e) {}
    
    matchedTo.push({
      entityType: body.entityType || 'claim',
      entityId: body.entityId,
      amount: matchAmount,
      matchedAt: now
    });
    
    await db.prepare(`
      UPDATE deductions SET 
        matched_amount = ?, remaining_amount = ?, status = ?,
        matched_to = ?, updated_at = ?
      WHERE id = ?
    `).bind(newMatchedAmount, newRemainingAmount, newStatus, JSON.stringify(matchedTo), now, id).run();
    
    const updated = await db.prepare('SELECT * FROM deductions WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error matching deduction:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Dispute deduction
deductions.post('/:id/dispute', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE deductions SET status = 'disputed', review_notes = ?, updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(body.reason || '', now, id, companyId).run();
    
    const updated = await db.prepare('SELECT * FROM deductions WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error disputing deduction:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Approve deduction
deductions.post('/:id/approve', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const userId = getUserId(c);
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE deductions SET 
        status = 'approved', reviewed_by = ?, reviewed_at = ?, updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(userId, now, now, id, companyId).run();
    
    const updated = await db.prepare('SELECT * FROM deductions WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error approving deduction:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Write off deduction
deductions.post('/:id/write-off', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const userId = getUserId(c);
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE deductions SET 
        status = 'written_off', reviewed_by = ?, reviewed_at = ?, 
        review_notes = ?, updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(userId, now, body.reason || 'Written off', now, id, companyId).run();
    
    const updated = await db.prepare('SELECT * FROM deductions WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error writing off deduction:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export const deductionsRoutes = deductions;
