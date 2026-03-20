import { Hono } from 'hono';
import {authMiddleware, requireMinRole } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';
import { apiError } from '../utils/apiError.js';
import { EntityLifecycleService } from '../services/entityLifecycleService.js';
import { createNotification } from '../services/notifications.js';
import { recordSpend } from '../services/budgetEnforcement.js';

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
      data: (result.results || []).map(rowToDocument),
      total: result.results?.length || 0
    });
  } catch (error) {
    console.error('Error fetching deductions:', error);
    return apiError(c, error, 'deductions');
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
      data: (result.results || []).map(rowToDocument)
    });
  } catch (error) {
    console.error('Error fetching unmatched deductions:', error);
    return apiError(c, error, 'deductions');
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
      data: (result.results || []).map(rowToDocument)
    });
  } catch (error) {
    console.error('Error fetching disputed deductions:', error);
    return apiError(c, error, 'deductions');
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
    return apiError(c, error, 'deductions');
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
    return apiError(c, error, 'deductions');
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
    
    return c.json({ success: true, data: rowToDocument(result) });
  } catch (error) {
    console.error('Error fetching deduction:', error);
    return apiError(c, error, 'deductions');
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
    const amount = body.deductionAmount || body.deduction_amount || body.amount || 0;
    
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
      body.customerId || body.customer_id || body.customer || null,
      body.invoiceNumber || body.invoice_number || null,
      body.invoiceDate || body.invoice_date || null,
      amount, amount,
      body.deductionDate || body.deduction_date || now,
      body.dueDate || body.due_date || null,
      body.reasonCode || body.reason_code || body.reason || null,
      body.reasonDescription || body.reason_description || body.description || '',
      userId, JSON.stringify(body.data || {}), now, now
    ).run();
    
    const created = await db.prepare('SELECT * FROM deductions WHERE id = ? AND company_id = ?').bind(id, companyId).first();

    let autoMatch = null;
    try {
      const claims = await db.prepare(`
        SELECT id, claimed_amount FROM claims
        WHERE company_id = ? AND customer_id = ? AND status IN ('submitted','approved')
      `).bind(companyId, body.customerId || body.customer_id || body.customer).all();

      for (const claim of claims.results || []) {
        const tolerance = Math.abs(amount - claim.claimed_amount) / Math.max(amount, 1);
        if (tolerance < 0.05) {
          await db.prepare(`
            UPDATE deductions SET status = 'matched', matched_to = ?, updated_at = ? WHERE id = ? AND company_id = ?
          `).bind(JSON.stringify([{ entityType: 'claim', entityId: claim.id, amount }], companyId), now, id).run();
          await db.prepare(`
            UPDATE claims SET status = 'matched', data = json_set(COALESCE(data,'{}'), '$.matchedDeductionId', ?) WHERE id = ? AND company_id = ?
          `).bind(id, claim.id, companyId).run();
          autoMatch = { claimId: claim.id, claimAmount: claim.claimed_amount, deductionAmount: amount, tolerance: Math.round(tolerance * 100) + '%' };
          break;
        }
      }
    } catch (e) { console.log('Auto-match error:', e.message); }

    return c.json({ success: true, data: rowToDocument(created), autoMatch }, 201);
  } catch (error) {
    console.error('Error creating deduction:', error);
    return apiError(c, error, 'deductions');
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
    
    const amount = body.deductionAmount || body.deduction_amount || body.amount || existing.deduction_amount;
    const matchedAmount = body.matchedAmount || body.matched_amount || existing.matched_amount;
    
    await db.prepare(`
      UPDATE deductions SET
        deduction_type = ?, customer_id = ?, invoice_number = ?, invoice_date = ?,
        deduction_amount = ?, matched_amount = ?, remaining_amount = ?,
        deduction_date = ?, due_date = ?, reason_code = ?, reason_description = ?,
        data = ?, updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(
      body.deductionType || body.deduction_type || existing.deduction_type,
      body.customerId || body.customer_id || body.customer || existing.customer_id,
      body.invoiceNumber || body.invoice_number || existing.invoice_number,
      body.invoiceDate || body.invoice_date || existing.invoice_date,
      amount, matchedAmount, amount - matchedAmount,
      body.deductionDate || body.deduction_date || existing.deduction_date,
      body.dueDate || body.due_date || existing.due_date,
      body.reasonCode || body.reason_code || body.reason || existing.reason_code,
      body.reasonDescription || body.reason_description || body.description || existing.reason_description,
      JSON.stringify(body.data || {}),
      now, id
    ).run();
    
    const updated = await db.prepare('SELECT * FROM deductions WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error updating deduction:', error);
    return apiError(c, error, 'deductions');
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
    
    await db.prepare('DELETE FROM deductions WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    
    return c.json({ success: true, message: 'Deduction deleted' });
  } catch (error) {
    console.error('Error deleting deduction:', error);
    return apiError(c, error, 'deductions');
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
    
    const updated = await db.prepare('SELECT * FROM deductions WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error starting review:', error);
    return apiError(c, error, 'deductions');
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
      WHERE id = ? AND company_id = ?
    `).bind(newMatchedAmount, newRemainingAmount, newStatus, JSON.stringify(matchedTo, companyId), now, id).run();
    
    const updated = await db.prepare('SELECT * FROM deductions WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error matching deduction:', error);
    return apiError(c, error, 'deductions');
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
    
    const updated = await db.prepare('SELECT * FROM deductions WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error disputing deduction:', error);
    return apiError(c, error, 'deductions');
  }
});

// W-12: Approve deduction → auto-create settlement
deductions.post('/:id/approve', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const userId = getUserId(c);
    const now = new Date().toISOString();

    const deduction = await db.prepare('SELECT * FROM deductions WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!deduction) return c.json({ success: false, message: 'Deduction not found' }, 404);

    await db.prepare(`
      UPDATE deductions SET 
        status = 'approved', reviewed_by = ?, reviewed_at = ?, updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(userId, now, now, id, companyId).run();

    // W-12: Auto-create settlement from approved deduction
    let settlementId = null;
    try {
      settlementId = crypto.randomUUID();
      const stlNum = `STL-${Date.now().toString(36).toUpperCase()}`;
      const amount = deduction.deduction_amount || 0;
      await db.prepare(`
        INSERT INTO settlements (
          id, company_id, settlement_number, name, description, status,
          settlement_type, customer_id, deduction_id,
          accrued_amount, claimed_amount, approved_amount, settled_amount,
          variance_amount, variance_pct, payment_method, currency,
          created_by, data, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'draft', 'deduction', ?, ?, 0, ?, ?, 0, 0, 0, 'credit_note', 'ZAR', ?, '{}', ?, ?)
      `).bind(
        settlementId, companyId, stlNum,
        `Settlement for deduction ${deduction.deduction_number}`,
        `Auto-created from approved deduction ${deduction.deduction_number}`,
        deduction.customer_id, id,
        amount, amount,
        userId, now, now
      ).run();

      await createNotification(db, {
        companyId, userId: deduction.created_by || userId,
        title: 'Settlement Auto-Created from Deduction',
        message: `Settlement ${stlNum} (R${Math.round(amount).toLocaleString()}) auto-created from approved deduction "${deduction.deduction_number}".`,
        type: 'info', category: 'settlement', priority: 'normal',
        entityType: 'settlement', entityId: settlementId, entityName: stlNum
      });
    } catch (e) {
      console.error('Failed to auto-create settlement from deduction:', e.message);
    }

    const updated = await db.prepare('SELECT * FROM deductions WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    
    return c.json({ success: true, data: rowToDocument(updated), settlementId });
  } catch (error) {
    console.error('Error approving deduction:', error);
    return apiError(c, error, 'deductions');
  }
});

// POST /auto-match — Bulk auto-match open deductions against claims
deductions.post('/auto-match', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const now = new Date().toISOString();

    // Get all open/under_review deductions
    const openDeductions = await db.prepare(`
      SELECT * FROM deductions 
      WHERE company_id = ? AND status IN ('open', 'under_review')
      ORDER BY deduction_date ASC
    `).bind(companyId).all();

    // Get all submitted/approved claims
    const openClaims = await db.prepare(`
      SELECT * FROM claims 
      WHERE company_id = ? AND status IN ('submitted', 'approved')
      ORDER BY created_at ASC
    `).bind(companyId).all();

    const matches = [];
    const usedClaims = new Set();

    for (const ded of (openDeductions.results || [])) {
      const dedAmount = ded.deduction_amount || 0;
      if (dedAmount <= 0) continue;

      for (const claim of (openClaims.results || [])) {
        if (usedClaims.has(claim.id)) continue;
        const claimAmount = claim.claimed_amount || claim.amount || 0;
        if (claimAmount <= 0) continue;

        // Match if same customer and amount within 5% tolerance
        const sameCustomer = ded.customer_id && claim.customer_id && ded.customer_id === claim.customer_id;
        const tolerance = Math.abs(dedAmount - claimAmount) / Math.max(dedAmount, 1);

        if (sameCustomer && tolerance < 0.05) {
          // Update deduction to matched
          await db.prepare(`
            UPDATE deductions SET status = 'matched', matched_amount = ?, remaining_amount = 0, 
              matched_to = ?, updated_at = ?
            WHERE id = ? AND company_id = ?
          `).bind(dedAmount, JSON.stringify([{ entityType: 'claim', entityId: claim.id, amount: dedAmount }]), now, ded.id, companyId).run();

          // Update claim to matched
          await db.prepare(`
            UPDATE claims SET status = 'matched', updated_at = ?
            WHERE id = ? AND company_id = ?
          `).bind(now, claim.id, companyId).run();

          matches.push({
            deductionId: ded.id,
            deductionNumber: ded.deduction_number,
            claimId: claim.id,
            amount: dedAmount,
            tolerance: Math.round(tolerance * 100) + '%'
          });

          usedClaims.add(claim.id);
          break;
        }
      }
    }

    return c.json({
      success: true,
      data: matches,
      message: matches.length > 0
        ? `Auto-match complete: ${matches.length} match${matches.length !== 1 ? 'es' : ''} found`
        : 'Auto-match complete: no new matches found'
    });
  } catch (error) {
    console.error('Error running auto-match:', error);
    return apiError(c, error, 'deductions');
  }
});

// W-12: Write off deduction → budget.spent update
deductions.post('/:id/write-off', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const userId = getUserId(c);
    const now = new Date().toISOString();

    const deduction = await db.prepare('SELECT * FROM deductions WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!deduction) return c.json({ success: false, message: 'Deduction not found' }, 404);

    // W-12: Record spend on write-off if budget is linked
    if (deduction.budget_id) {
      try {
        await recordSpend(db, deduction.budget_id, deduction.deduction_amount || 0, 'deduction', id, deduction.deduction_number || id, userId, companyId);
      } catch (e) {
        console.log('Budget spend recording skipped:', e.message);
      }
    }

    await db.prepare(`
      UPDATE deductions SET 
        status = 'written_off', reviewed_by = ?, reviewed_at = ?, 
        review_notes = ?, updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(userId, now, body.reason || 'Written off', now, id, companyId).run();

    await createNotification(db, {
      companyId, userId: deduction.created_by || userId,
      title: 'Deduction Written Off',
      message: `Deduction "${deduction.deduction_number}" (R${Math.round(deduction.deduction_amount || 0).toLocaleString()}) has been written off.`,
      type: 'warning', category: 'deduction', priority: 'normal',
      entityType: 'deduction', entityId: id, entityName: deduction.deduction_number
    });

    const updated = await db.prepare('SELECT * FROM deductions WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error writing off deduction:', error);
    return apiError(c, error, 'deductions');
  }
});

export const deductionsRoutes = deductions;
