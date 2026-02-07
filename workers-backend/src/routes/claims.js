import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const claims = new Hono();

// Apply auth middleware to all routes
claims.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
};

const getUserId = (c) => {
  return c.get('userId') || null;
};

// Get all claims
claims.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, type, customer_id, startDate, endDate, limit = 50, offset = 0 } = c.req.query();
    
    let query = 'SELECT cl.*, cu.name as customer_name FROM claims cl LEFT JOIN customers cu ON cl.customer_id = cu.id WHERE cl.company_id = ?';
    const params = [companyId];
    
    if (status) {
      query += ' AND cl.status = ?';
      params.push(status);
    }
    if (type) {
      query += ' AND cl.claim_type = ?';
      params.push(type);
    }
    if (customer_id) {
      query += ' AND cl.customer_id = ?';
      params.push(customer_id);
    }
    if (startDate) {
      query += ' AND cl.claim_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND cl.claim_date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY cl.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.prepare(query).bind(...params).all();
    
    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: result.results?.length || 0
    });
  } catch (error) {
    console.error('Error fetching claims:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get claims summary/analytics
claims.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    
    const summary = await db.prepare(`
      SELECT 
        COUNT(*) as total_claims,
        SUM(claimed_amount) as total_claimed,
        SUM(approved_amount) as total_approved,
        SUM(settled_amount) as total_settled,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review_count,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN status = 'settled' THEN 1 END) as settled_count
      FROM claims WHERE company_id = ?
    `).bind(companyId).first();
    
    const byType = await db.prepare(`
      SELECT 
        claim_type,
        COUNT(*) as count,
        SUM(claimed_amount) as claimed,
        SUM(approved_amount) as approved
      FROM claims WHERE company_id = ?
      GROUP BY claim_type
    `).bind(companyId).all();
    
    return c.json({
      success: true,
      data: {
        summary,
        byType: byType.results || []
      }
    });
  } catch (error) {
    console.error('Error fetching claims summary:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get claims statistics (frontend expects this endpoint)
claims.get('/statistics', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { startDate, endDate } = c.req.query();
    
    let dateFilter = '';
    const params = [companyId];
    if (startDate) {
      dateFilter += ' AND claim_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      dateFilter += ' AND claim_date <= ?';
      params.push(endDate);
    }
    
    const byStatus = await db.prepare(`
      SELECT 
        status as _id,
        COUNT(*) as count,
        SUM(claimed_amount) as totalAmount
      FROM claims WHERE company_id = ?${dateFilter}
      GROUP BY status
    `).bind(...params).all();
    
    return c.json({
      success: true,
      data: {
        byStatus: byStatus.results || []
      }
    });
  } catch (error) {
    console.error('Error fetching claims statistics:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get unmatched claims (frontend expects this endpoint)
claims.get('/unmatched', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    
    const result = await db.prepare(`
      SELECT cl.*, cu.name as customer_name,
        cl.id as _id,
        cl.claim_number as claimId,
        cl.claim_type as claimType,
        cl.claimed_amount as claimAmount,
        cl.claim_date as claimDate,
        cl.approved_amount as approvedAmount
      FROM claims cl 
      LEFT JOIN customers cu ON cl.customer_id = cu.id 
      WHERE cl.company_id = ? 
      ORDER BY cl.created_at DESC
    `).bind(companyId).all();
    
    // Transform to match frontend expected format
    const claims = (result.results || []).map(claim => ({
      ...claim,
      customer: { name: claim.customer_name },
      matching: { matchStatus: 'unmatched' }
    }));
    
    return c.json({
      success: true,
      data: claims
    });
  } catch (error) {
    console.error('Error fetching unmatched claims:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get pending approval claims (frontend expects this endpoint)
claims.get('/pending-approval', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    
    const result = await db.prepare(`
      SELECT cl.*, cu.name as customer_name,
        cl.id as _id,
        cl.claim_number as claimId,
        cl.claim_type as claimType,
        cl.claimed_amount as claimAmount,
        cl.claim_date as claimDate,
        cl.approved_amount as approvedAmount
      FROM claims cl 
      LEFT JOIN customers cu ON cl.customer_id = cu.id 
      WHERE cl.company_id = ? AND cl.status IN ('pending', 'under_review')
      ORDER BY cl.created_at DESC
    `).bind(companyId).all();
    
    // Transform to match frontend expected format
    const claims = (result.results || []).map(claim => ({
      ...claim,
      customer: { name: claim.customer_name },
      matching: { matchStatus: 'unmatched' }
    }));
    
    return c.json({
      success: true,
      data: claims
    });
  } catch (error) {
    console.error('Error fetching pending approval claims:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Auto-match claims (frontend expects this endpoint)
claims.post('/auto-match', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    
    // Get unmatched claims and deductions
    const claims = await db.prepare(`
      SELECT * FROM claims WHERE company_id = ? AND status IN ('pending', 'approved')
    `).bind(companyId).all();
    
    const deductions = await db.prepare(`
      SELECT * FROM deductions WHERE company_id = ? AND status = 'open'
    `).bind(companyId).all();
    
    const matched = [];
    const now = new Date().toISOString();
    
    // Simple matching by customer and amount
    for (const claim of (claims.results || [])) {
      for (const deduction of (deductions.results || [])) {
        if (claim.customer_id === deduction.customer_id && 
            Math.abs(claim.claimed_amount - deduction.deduction_amount) < 0.01) {
          // Match found
          await db.prepare(`
            UPDATE claims SET data = ?, updated_at = ? WHERE id = ?
          `).bind(JSON.stringify({ matchedDeductions: [deduction.id] }), now, claim.id).run();
          
          await db.prepare(`
            UPDATE deductions SET status = 'matched', matched_to = ?, updated_at = ? WHERE id = ?
          `).bind(JSON.stringify([claim.id]), now, deduction.id).run();
          
          matched.push({ claimId: claim.id, deductionId: deduction.id });
        }
      }
    }
    
    return c.json({
      success: true,
      data: matched,
      message: `Matched ${matched.length} claims to deductions`
    });
  } catch (error) {
    console.error('Error auto-matching claims:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get claims by customer (frontend expects this endpoint)
claims.get('/customer/:customerId', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { customerId } = c.req.param();
    const { startDate, endDate } = c.req.query();
    
    let query = `
      SELECT cl.*, cu.name as customer_name,
        cl.id as _id,
        cl.claim_number as claimId,
        cl.claim_type as claimType,
        cl.claimed_amount as claimAmount,
        cl.claim_date as claimDate
      FROM claims cl 
      LEFT JOIN customers cu ON cl.customer_id = cu.id 
      WHERE cl.company_id = ? AND cl.customer_id = ?
    `;
    const params = [companyId, customerId];
    
    if (startDate) {
      query += ' AND cl.claim_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND cl.claim_date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY cl.created_at DESC';
    
    const result = await db.prepare(query).bind(...params).all();
    
    const claims = (result.results || []).map(claim => ({
      ...claim,
      customer: { name: claim.customer_name }
    }));
    
    return c.json({
      success: true,
      data: claims
    });
  } catch (error) {
    console.error('Error fetching claims by customer:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get claim by ID
claims.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    
    const result = await db.prepare(`
      SELECT cl.*, cu.name as customer_name 
      FROM claims cl 
      LEFT JOIN customers cu ON cl.customer_id = cu.id 
      WHERE cl.id = ? AND cl.company_id = ?
    `).bind(id, companyId).first();
    
    if (!result) {
      return c.json({ success: false, message: 'Claim not found' }, 404);
    }
    
    return c.json({ success: true, data: rowToDocument(result) });
  } catch (error) {
    console.error('Error fetching claim:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Create claim
claims.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = getUserId(c);
    
    const id = generateId();
    const claimNumber = `CLM-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO claims (
        id, company_id, claim_number, claim_type, status,
        customer_id, promotion_id, rebate_id,
        claimed_amount, claim_date, due_date, reason,
        supporting_documents, created_by, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId, claimNumber,
      body.claimType || body.claim_type || 'promotion',
      body.customerId || body.customer_id || null,
      body.promotionId || body.promotion_id || null,
      body.rebateId || body.rebate_id || null,
      body.claimedAmount || body.claimed_amount || 0,
      body.claimDate || body.claim_date || now,
      body.dueDate || body.due_date || null,
      body.reason || '',
      JSON.stringify(body.supportingDocuments || body.supporting_documents || []),
      userId, JSON.stringify(body.data || {}), now, now
    ).run();
    
    const created = await db.prepare('SELECT * FROM claims WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    console.error('Error creating claim:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Update claim
claims.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    
    const existing = await db.prepare(`
      SELECT * FROM claims WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!existing) {
      return c.json({ success: false, message: 'Claim not found' }, 404);
    }
    
    await db.prepare(`
      UPDATE claims SET
        claim_type = ?, customer_id = ?, promotion_id = ?, rebate_id = ?,
        claimed_amount = ?, claim_date = ?, due_date = ?, reason = ?,
        supporting_documents = ?, data = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.claimType || body.claim_type || existing.claim_type,
      body.customerId || body.customer_id || existing.customer_id,
      body.promotionId || body.promotion_id || existing.promotion_id,
      body.rebateId || body.rebate_id || existing.rebate_id,
      body.claimedAmount || body.claimed_amount || existing.claimed_amount,
      body.claimDate || body.claim_date || existing.claim_date,
      body.dueDate || body.due_date || existing.due_date,
      body.reason || existing.reason,
      JSON.stringify(body.supportingDocuments || body.supporting_documents || []),
      JSON.stringify(body.data || {}),
      now, id
    ).run();
    
    const updated = await db.prepare('SELECT * FROM claims WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error updating claim:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Delete claim
claims.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    
    const existing = await db.prepare(`
      SELECT * FROM claims WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!existing) {
      return c.json({ success: false, message: 'Claim not found' }, 404);
    }
    
    await db.prepare('DELETE FROM claims WHERE id = ?').bind(id).run();
    
    return c.json({ success: true, message: 'Claim deleted' });
  } catch (error) {
    console.error('Error deleting claim:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Submit for review
claims.post('/:id/submit', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE claims SET status = 'under_review', updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(now, id, companyId).run();
    
    const updated = await db.prepare('SELECT * FROM claims WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error submitting claim:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Approve claim
claims.post('/:id/approve', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const userId = getUserId(c);
    const now = new Date().toISOString();
    
    const claim = await db.prepare(`
      SELECT * FROM claims WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!claim) {
      return c.json({ success: false, message: 'Claim not found' }, 404);
    }
    
    const approvedAmount = body.approvedAmount || body.approved_amount || claim.claimed_amount;
    const status = approvedAmount < claim.claimed_amount ? 'partially_approved' : 'approved';
    
    await db.prepare(`
      UPDATE claims SET 
        status = ?, approved_amount = ?, 
        reviewed_by = ?, reviewed_at = ?, review_notes = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(status, approvedAmount, userId, now, body.notes || '', now, id).run();
    
    const updated = await db.prepare('SELECT * FROM claims WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error approving claim:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Reject claim
claims.post('/:id/reject', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const userId = getUserId(c);
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE claims SET 
        status = 'rejected', approved_amount = 0,
        reviewed_by = ?, reviewed_at = ?, review_notes = ?,
        updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(userId, now, body.reason || '', now, id, companyId).run();
    
    const updated = await db.prepare('SELECT * FROM claims WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error rejecting claim:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Settle claim
claims.post('/:id/settle', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    
    const claim = await db.prepare(`
      SELECT * FROM claims WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!claim) {
      return c.json({ success: false, message: 'Claim not found' }, 404);
    }
    
    const settledAmount = body.settledAmount || body.settled_amount || claim.approved_amount;
    
    await db.prepare(`
      UPDATE claims SET 
        status = 'settled', settled_amount = ?, settlement_date = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(settledAmount, now, now, id).run();
    
    const updated = await db.prepare('SELECT * FROM claims WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error settling claim:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Match claim to deduction
claims.post('/:id/match', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    
    const claim = await db.prepare(`
      SELECT * FROM claims WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!claim) {
      return c.json({ success: false, message: 'Claim not found' }, 404);
    }
    
    // Update claim data with matched deduction
    let data = {};
    try {
      data = JSON.parse(claim.data || '{}');
    } catch (e) {}
    
    data.matchedDeductions = data.matchedDeductions || [];
    data.matchedDeductions.push({
      deductionId: body.deductionId,
      matchedAmount: body.matchedAmount,
      matchedAt: now
    });
    
    await db.prepare(`
      UPDATE claims SET data = ?, updated_at = ? WHERE id = ?
    `).bind(JSON.stringify(data), now, id).run();
    
    // Update deduction if provided
    if (body.deductionId) {
      try {
        await db.prepare(`
          UPDATE deductions SET 
            matched_amount = matched_amount + ?,
            remaining_amount = deduction_amount - matched_amount - ?,
            status = CASE WHEN deduction_amount <= matched_amount + ? THEN 'matched' ELSE status END,
            matched_to = ?,
            updated_at = ?
          WHERE id = ?
        `).bind(
          body.matchedAmount || 0,
          body.matchedAmount || 0,
          body.matchedAmount || 0,
          JSON.stringify([id]),
          now,
          body.deductionId
        ).run();
      } catch (e) {
        console.log('Could not update deduction:', e.message);
      }
    }
    
    const updated = await db.prepare('SELECT * FROM claims WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error matching claim:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export const claimsRoutes = claims;
