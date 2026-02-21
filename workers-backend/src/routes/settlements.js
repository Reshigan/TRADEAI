import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const settlements = new Hono();

settlements.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
};

const getUserId = (c) => {
  return c.get('userId') || null;
};

const generateSettlementNumber = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `STL-${ts}-${rand}`;
};

// ── GET /  List all settlements ──────────────────────────────────────
settlements.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, settlement_type, customer_id, promotion_id, accrual_id, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM settlements WHERE company_id = ?';
    const params = [companyId];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (settlement_type) { query += ' AND settlement_type = ?'; params.push(settlement_type); }
    if (customer_id) { query += ' AND customer_id = ?'; params.push(customer_id); }
    if (promotion_id) { query += ' AND promotion_id = ?'; params.push(promotion_id); }
    if (accrual_id) { query += ' AND accrual_id = ?'; params.push(accrual_id); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();

    const countQuery = 'SELECT COUNT(*) as total FROM settlements WHERE company_id = ?';
    const countResult = await db.prepare(countQuery).bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching settlements:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /options  Settlement configuration options ────────────────────
settlements.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      settlementTypes: [
        { value: 'claim', label: 'Claim Settlement' },
        { value: 'deduction', label: 'Deduction Settlement' },
        { value: 'rebate', label: 'Rebate Settlement' },
        { value: 'accrual', label: 'Accrual Settlement' },
        { value: 'credit_note', label: 'Credit Note' },
        { value: 'offset', label: 'Offset/Netting' }
      ],
      paymentMethods: [
        { value: 'credit_note', label: 'Credit Note' },
        { value: 'eft', label: 'EFT / Bank Transfer' },
        { value: 'cheque', label: 'Cheque' },
        { value: 'offset', label: 'Offset Against Invoice' },
        { value: 'debit_note', label: 'Debit Note' }
      ],
      statuses: [
        { value: 'draft', label: 'Draft' },
        { value: 'pending_approval', label: 'Pending Approval' },
        { value: 'approved', label: 'Approved' },
        { value: 'processing', label: 'Processing Payment' },
        { value: 'partially_paid', label: 'Partially Paid' },
        { value: 'paid', label: 'Paid / Settled' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'disputed', label: 'Disputed' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
    }
  });
});

// ── GET /summary  Aggregated settlement statistics ───────────────────
settlements.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);

    const stats = await db.prepare(`
      SELECT
        COUNT(*) as total_settlements,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN status = 'pending_approval' THEN 1 ELSE 0 END) as pending_approval,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(accrued_amount) as total_accrued,
        SUM(claimed_amount) as total_claimed,
        SUM(approved_amount) as total_approved,
        SUM(settled_amount) as total_settled,
        SUM(variance_amount) as total_variance
      FROM settlements WHERE company_id = ?
    `).bind(companyId).first();

    const paymentStats = await db.prepare(`
      SELECT
        COUNT(*) as total_payments,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending
      FROM settlement_payments WHERE company_id = ?
    `).bind(companyId).first();

    return c.json({
      success: true,
      data: {
        settlements: {
          total: stats?.total_settlements || 0,
          draft: stats?.draft || 0,
          pendingApproval: stats?.pending_approval || 0,
          approved: stats?.approved || 0,
          processing: stats?.processing || 0,
          paid: stats?.paid || 0,
          rejected: stats?.rejected || 0,
          totalAccrued: stats?.total_accrued || 0,
          totalClaimed: stats?.total_claimed || 0,
          totalApproved: stats?.total_approved || 0,
          totalSettled: stats?.total_settled || 0,
          totalVariance: stats?.total_variance || 0
        },
        payments: {
          total: paymentStats?.total_payments || 0,
          totalPaid: paymentStats?.total_paid || 0,
          totalPending: paymentStats?.total_pending || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching settlement summary:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /:id  Get settlement with lines and payments ─────────────────
settlements.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const settlement = await db.prepare(
      'SELECT * FROM settlements WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!settlement) {
      return c.json({ success: false, message: 'Settlement not found' }, 404);
    }

    const lines = await db.prepare(
      'SELECT * FROM settlement_lines WHERE settlement_id = ? AND company_id = ? ORDER BY line_number ASC'
    ).bind(id, companyId).all();

    const payments = await db.prepare(
      'SELECT * FROM settlement_payments WHERE settlement_id = ? AND company_id = ? ORDER BY payment_date DESC'
    ).bind(id, companyId).all();

    return c.json({
      success: true,
      data: {
        ...rowToDocument(settlement),
        lines: (lines.results || []).map(rowToDocument),
        payments: (payments.results || []).map(rowToDocument)
      }
    });
  } catch (error) {
    console.error('Error fetching settlement:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /  Create a new settlement ──────────────────────────────────
settlements.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = getUserId(c);
    const id = generateId();
    const now = new Date().toISOString();

    if (!body.name) {
      return c.json({ success: false, message: 'Settlement name is required' }, 400);
    }

    const settlementNumber = body.settlementNumber || generateSettlementNumber();
    const accruedAmount = parseFloat(body.accruedAmount || body.accrued_amount) || 0;
    const claimedAmount = parseFloat(body.claimedAmount || body.claimed_amount) || 0;
    const approvedAmount = parseFloat(body.approvedAmount || body.approved_amount) || 0;
    const varianceAmount = claimedAmount - accruedAmount;
    const variancePct = accruedAmount > 0 ? ((varianceAmount / accruedAmount) * 100) : 0;

    await db.prepare(`
      INSERT INTO settlements (
        id, company_id, settlement_number, name, description, status,
        settlement_type, customer_id, promotion_id, accrual_id,
        claim_id, deduction_id, budget_id,
        gl_account, cost_center, settlement_date, due_date,
        accrued_amount, claimed_amount, approved_amount, settled_amount,
        variance_amount, variance_pct,
        payment_method, payment_reference, currency, notes,
        created_by, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId, settlementNumber,
      body.name,
      body.description || null,
      body.settlementType || body.settlement_type || 'claim',
      body.customerId || body.customer_id || null,
      body.promotionId || body.promotion_id || null,
      body.accrualId || body.accrual_id || null,
      body.claimId || body.claim_id || null,
      body.deductionId || body.deduction_id || null,
      body.budgetId || body.budget_id || null,
      body.glAccount || body.gl_account || null,
      body.costCenter || body.cost_center || null,
      body.settlementDate || body.settlement_date || now.split('T')[0],
      body.dueDate || body.due_date || null,
      accruedAmount,
      claimedAmount,
      approvedAmount,
      varianceAmount,
      variancePct,
      body.paymentMethod || body.payment_method || 'credit_note',
      body.paymentReference || body.payment_reference || null,
      body.currency || 'ZAR',
      body.notes || null,
      userId,
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    // Create line items if provided
    if (body.lines && Array.isArray(body.lines)) {
      for (let i = 0; i < body.lines.length; i++) {
        const line = body.lines[i];
        const lineId = generateId();
        const lineSettled = parseFloat(line.approvedAmount || line.approved_amount || line.settledAmount || line.settled_amount) || 0;
        await db.prepare(`
          INSERT INTO settlement_lines (
            id, company_id, settlement_id, line_number,
            product_id, product_name, category, description,
            quantity, unit_price, accrued_amount, claimed_amount,
            approved_amount, adjustment_amount, adjustment_reason,
            settled_amount, status, data, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
        `).bind(
          lineId, companyId, id, i + 1,
          line.productId || line.product_id || null,
          line.productName || line.product_name || null,
          line.category || null,
          line.description || null,
          parseFloat(line.quantity) || 0,
          parseFloat(line.unitPrice || line.unit_price) || 0,
          parseFloat(line.accruedAmount || line.accrued_amount) || 0,
          parseFloat(line.claimedAmount || line.claimed_amount) || 0,
          parseFloat(line.approvedAmount || line.approved_amount) || 0,
          parseFloat(line.adjustmentAmount || line.adjustment_amount) || 0,
          line.adjustmentReason || line.adjustment_reason || null,
          lineSettled,
          JSON.stringify(line.data || {}),
          now, now
        ).run();
      }
    }

    const created = await db.prepare('SELECT * FROM settlements WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    console.error('Error creating settlement:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── PUT /:id  Update a settlement ────────────────────────────────────
settlements.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare(
      'SELECT * FROM settlements WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'Settlement not found' }, 404);
    }

    const accruedAmount = parseFloat(body.accruedAmount || body.accrued_amount) || existing.accrued_amount;
    const claimedAmount = parseFloat(body.claimedAmount || body.claimed_amount) || existing.claimed_amount;
    const approvedAmount = parseFloat(body.approvedAmount || body.approved_amount) || existing.approved_amount;
    const varianceAmount = claimedAmount - accruedAmount;
    const variancePct = accruedAmount > 0 ? ((varianceAmount / accruedAmount) * 100) : 0;

    await db.prepare(`
      UPDATE settlements SET
        name = ?, description = ?, status = ?, settlement_type = ?,
        customer_id = ?, promotion_id = ?, accrual_id = ?,
        claim_id = ?, deduction_id = ?, budget_id = ?,
        gl_account = ?, cost_center = ?,
        settlement_date = ?, due_date = ?,
        accrued_amount = ?, claimed_amount = ?, approved_amount = ?,
        variance_amount = ?, variance_pct = ?,
        payment_method = ?, payment_reference = ?,
        currency = ?, notes = ?,
        data = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.name || existing.name,
      body.description ?? existing.description,
      body.status || existing.status,
      body.settlementType || body.settlement_type || existing.settlement_type,
      body.customerId || body.customer_id || existing.customer_id,
      body.promotionId || body.promotion_id || existing.promotion_id,
      body.accrualId || body.accrual_id || existing.accrual_id,
      body.claimId || body.claim_id || existing.claim_id,
      body.deductionId || body.deduction_id || existing.deduction_id,
      body.budgetId || body.budget_id || existing.budget_id,
      body.glAccount || body.gl_account || existing.gl_account,
      body.costCenter || body.cost_center || existing.cost_center,
      body.settlementDate || body.settlement_date || existing.settlement_date,
      body.dueDate || body.due_date || existing.due_date,
      accruedAmount,
      claimedAmount,
      approvedAmount,
      varianceAmount,
      variancePct,
      body.paymentMethod || body.payment_method || existing.payment_method,
      body.paymentReference || body.payment_reference || existing.payment_reference,
      body.currency || existing.currency,
      body.notes ?? existing.notes,
      JSON.stringify(body.data || JSON.parse(existing.data || '{}')),
      now, id
    ).run();

    const updated = await db.prepare('SELECT * FROM settlements WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error updating settlement:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── DELETE /:id  Delete a settlement and its lines/payments ──────────
settlements.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const existing = await db.prepare(
      'SELECT * FROM settlements WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'Settlement not found' }, 404);
    }

    if (existing.status === 'paid' || existing.status === 'processing') {
      return c.json({ success: false, message: 'Cannot delete a paid or processing settlement.' }, 400);
    }

    await db.prepare('DELETE FROM settlement_payments WHERE settlement_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM settlement_lines WHERE settlement_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM settlements WHERE id = ?').bind(id).run();

    return c.json({ success: true, message: 'Settlement deleted' });
  } catch (error) {
    console.error('Error deleting settlement:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /:id/process  Process settlement — reconcile accrual vs claim ─
// This is the core engine: compares accrued amounts with claimed amounts,
// calculates variance, and prepares the settlement for approval.
settlements.post('/:id/process', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const userId = getUserId(c);
    const now = new Date().toISOString();

    const settlement = await db.prepare(
      'SELECT * FROM settlements WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!settlement) {
      return c.json({ success: false, message: 'Settlement not found' }, 404);
    }

    // Pull linked accrual data if available
    let accruedAmount = settlement.accrued_amount || 0;
    if (settlement.accrual_id) {
      const accrual = await db.prepare(
        'SELECT * FROM accruals WHERE id = ? AND company_id = ?'
      ).bind(settlement.accrual_id, companyId).first();
      if (accrual) {
        accruedAmount = accrual.accrued_amount || 0;
      }
    }

    // Pull linked claim data if available
    let claimedAmount = settlement.claimed_amount || 0;
    if (settlement.claim_id) {
      const claim = await db.prepare(
        'SELECT * FROM claims WHERE id = ? AND company_id = ?'
      ).bind(settlement.claim_id, companyId).first();
      if (claim) {
        claimedAmount = parseFloat(claim.amount || claim.claimed_amount) || 0;
      }
    }

    // Pull linked deduction data if available
    if (settlement.deduction_id && !settlement.claim_id) {
      const deduction = await db.prepare(
        'SELECT * FROM deductions WHERE id = ? AND company_id = ?'
      ).bind(settlement.deduction_id, companyId).first();
      if (deduction) {
        claimedAmount = parseFloat(deduction.amount || deduction.deduction_amount) || 0;
      }
    }

    // Calculate variance
    const varianceAmount = claimedAmount - accruedAmount;
    const variancePct = accruedAmount > 0 ? ((varianceAmount / accruedAmount) * 100) : 0;

    // Auto-approve if variance is within 5% tolerance
    const withinTolerance = Math.abs(variancePct) <= 5;
    const approvedAmount = withinTolerance ? claimedAmount : accruedAmount;
    const newStatus = withinTolerance ? 'approved' : 'pending_approval';

    await db.prepare(`
      UPDATE settlements SET
        status = ?, accrued_amount = ?, claimed_amount = ?,
        approved_amount = ?, variance_amount = ?, variance_pct = ?,
        processed_by = ?, processed_at = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      newStatus, accruedAmount, claimedAmount,
      approvedAmount, varianceAmount, variancePct,
      userId, now, now, id
    ).run();

    // Process line items — recalculate each line's settled amount
    const lines = await db.prepare(
      'SELECT * FROM settlement_lines WHERE settlement_id = ? AND company_id = ?'
    ).bind(id, companyId).all();

    let totalLineSettled = 0;
    for (const line of (lines.results || [])) {
      const lineApproved = line.approved_amount || line.claimed_amount || 0;
      const lineAdjustment = line.adjustment_amount || 0;
      const lineSettled = lineApproved + lineAdjustment;
      totalLineSettled += lineSettled;

      await db.prepare(`
        UPDATE settlement_lines SET
          settled_amount = ?, status = 'processed', updated_at = ?
        WHERE id = ?
      `).bind(lineSettled, now, line.id).run();
    }

    // If line items exist, update settlement settled_amount from lines
    if ((lines.results || []).length > 0) {
      await db.prepare(`
        UPDATE settlements SET settled_amount = ?, updated_at = ? WHERE id = ?
      `).bind(totalLineSettled, now, id).run();
    }

    // Update linked accrual's settled_amount if applicable
    if (settlement.accrual_id) {
      await db.prepare(`
        UPDATE accruals SET
          settled_amount = settled_amount + ?,
          remaining_amount = remaining_amount - ?,
          status = CASE
            WHEN remaining_amount - ? <= 0 THEN 'fully_settled'
            ELSE 'partially_settled'
          END,
          updated_at = ?
        WHERE id = ? AND company_id = ?
      `).bind(approvedAmount, approvedAmount, approvedAmount, now, settlement.accrual_id, companyId).run();
    }

    const updated = await db.prepare('SELECT * FROM settlements WHERE id = ?').bind(id).first();
    return c.json({
      success: true,
      data: rowToDocument(updated),
      message: withinTolerance
        ? `Auto-approved: variance ${variancePct.toFixed(1)}% within 5% tolerance`
        : `Requires manual approval: variance ${variancePct.toFixed(1)}% exceeds 5% tolerance`
    });
  } catch (error) {
    console.error('Error processing settlement:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /:id/approve  Approve a settlement ──────────────────────────
settlements.post('/:id/approve', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const userId = getUserId(c);
    const now = new Date().toISOString();
    const body = await c.req.json().catch(() => ({}));

    const settlement = await db.prepare(
      'SELECT * FROM settlements WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!settlement) {
      return c.json({ success: false, message: 'Settlement not found' }, 404);
    }

    const approvedAmount = parseFloat(body.approvedAmount || body.approved_amount) || settlement.approved_amount || settlement.claimed_amount;

    await db.prepare(`
      UPDATE settlements SET
        status = 'approved', approved_amount = ?,
        approved_by = ?, approved_at = ?, updated_at = ?
      WHERE id = ?
    `).bind(approvedAmount, userId, now, now, id).run();

    const updated = await db.prepare('SELECT * FROM settlements WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error approving settlement:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /:id/reject  Reject a settlement ────────────────────────────
settlements.post('/:id/reject', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const userId = getUserId(c);
    const now = new Date().toISOString();
    const body = await c.req.json().catch(() => ({}));

    const settlement = await db.prepare(
      'SELECT * FROM settlements WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!settlement) {
      return c.json({ success: false, message: 'Settlement not found' }, 404);
    }

    await db.prepare(`
      UPDATE settlements SET
        status = 'rejected', notes = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.reason || body.notes || settlement.notes || 'Rejected',
      now, id
    ).run();

    const updated = await db.prepare('SELECT * FROM settlements WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error rejecting settlement:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /:id/pay  Record a payment against a settlement ─────────────
settlements.post('/:id/pay', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const userId = getUserId(c);
    const now = new Date().toISOString();
    const body = await c.req.json();

    const settlement = await db.prepare(
      'SELECT * FROM settlements WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!settlement) {
      return c.json({ success: false, message: 'Settlement not found' }, 404);
    }

    if (settlement.status !== 'approved' && settlement.status !== 'partially_paid') {
      return c.json({ success: false, message: 'Settlement must be approved before payment' }, 400);
    }

    const paymentAmount = parseFloat(body.amount) || 0;
    if (paymentAmount <= 0) {
      return c.json({ success: false, message: 'Payment amount must be greater than 0' }, 400);
    }

    const paymentId = generateId();

    await db.prepare(`
      INSERT INTO settlement_payments (
        id, company_id, settlement_id, payment_type,
        payment_date, amount, currency, reference,
        bank_reference, erp_reference, status, notes,
        created_by, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?)
    `).bind(
      paymentId, companyId, id,
      body.paymentType || body.payment_type || settlement.payment_method || 'credit_note',
      body.paymentDate || body.payment_date || now.split('T')[0],
      paymentAmount,
      body.currency || settlement.currency || 'ZAR',
      body.reference || null,
      body.bankReference || body.bank_reference || null,
      body.erpReference || body.erp_reference || null,
      body.notes || null,
      userId,
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    // Update settlement totals
    const newSettledAmount = (settlement.settled_amount || 0) + paymentAmount;
    const approvedAmount = settlement.approved_amount || settlement.claimed_amount || 0;
    const isFullyPaid = newSettledAmount >= approvedAmount;

    await db.prepare(`
      UPDATE settlements SET
        settled_amount = ?, payment_date = ?,
        payment_reference = COALESCE(?, payment_reference),
        status = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      newSettledAmount,
      body.paymentDate || body.payment_date || now.split('T')[0],
      body.reference,
      isFullyPaid ? 'paid' : 'partially_paid',
      now, id
    ).run();

    // Create GL journal entry in accrual_journals if accrual linked
    if (settlement.accrual_id) {
      const journalId = generateId();
      await db.prepare(`
        INSERT INTO accrual_journals (
          id, company_id, accrual_id, journal_type, journal_date,
          debit_account, credit_account, amount, currency,
          reference, narration, status, posted_by,
          data, created_at, updated_at
        ) VALUES (?, ?, ?, 'settlement', ?, ?, ?, ?, ?, ?, ?, 'posted', ?, ?, ?, ?)
      `).bind(
        journalId, companyId, settlement.accrual_id,
        now.split('T')[0],
        settlement.cost_center || 'Trade Accrual Liability',
        'Bank / AP',
        paymentAmount,
        settlement.currency || 'ZAR',
        `STL-${settlement.settlement_number || id}`,
        `Settlement payment for ${settlement.name}`,
        userId,
        JSON.stringify({}),
        now, now
      ).run();
    }

    const updated = await db.prepare('SELECT * FROM settlements WHERE id = ?').bind(id).first();
    return c.json({
      success: true,
      data: rowToDocument(updated),
      payment: { id: paymentId, amount: paymentAmount, status: 'completed' },
      message: isFullyPaid ? 'Settlement fully paid' : 'Partial payment recorded'
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /:id/lines  Get settlement line items ────────────────────────
settlements.get('/:id/lines', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const lines = await db.prepare(
      'SELECT * FROM settlement_lines WHERE settlement_id = ? AND company_id = ? ORDER BY line_number ASC'
    ).bind(id, companyId).all();

    return c.json({
      success: true,
      data: (lines.results || []).map(rowToDocument)
    });
  } catch (error) {
    console.error('Error fetching settlement lines:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /:id/payments  Get settlement payments ───────────────────────
settlements.get('/:id/payments', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const payments = await db.prepare(
      'SELECT * FROM settlement_payments WHERE settlement_id = ? AND company_id = ? ORDER BY payment_date DESC'
    ).bind(id, companyId).all();

    return c.json({
      success: true,
      data: (payments.results || []).map(rowToDocument)
    });
  } catch (error) {
    console.error('Error fetching settlement payments:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export { settlements as settlementRoutes };
