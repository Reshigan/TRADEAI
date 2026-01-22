import { Hono } from 'hono';

const tradingTerms = new Hono();

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('companyId') || c.req.header('X-Company-Code') || 'default';
};

// Get all trading terms
tradingTerms.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, type, customer_id, limit = 50, offset = 0 } = c.req.query();
    
    let query = 'SELECT t.*, c.name as customer_name FROM trading_terms t LEFT JOIN customers c ON t.customer_id = c.id WHERE t.company_id = ?';
    const params = [companyId];
    
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (type) {
      query += ' AND t.term_type = ?';
      params.push(type);
    }
    if (customer_id) {
      query += ' AND t.customer_id = ?';
      params.push(customer_id);
    }
    
    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.prepare(query).bind(...params).all();
    
    return c.json({
      success: true,
      data: result.results || [],
      total: result.results?.length || 0
    });
  } catch (error) {
    console.error('Error fetching trading terms:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get term type options
tradingTerms.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      termTypes: [
        { value: 'volume_rebate', label: 'Volume Rebate' },
        { value: 'growth_rebate', label: 'Growth Rebate' },
        { value: 'listing_fee', label: 'Listing Fee' },
        { value: 'marketing_contribution', label: 'Marketing Contribution' },
        { value: 'payment_terms', label: 'Payment Terms' },
        { value: 'promotional_allowance', label: 'Promotional Allowance' }
      ],
      rateTypes: [
        { value: 'percentage', label: 'Percentage' },
        { value: 'fixed', label: 'Fixed Amount' }
      ],
      paymentFrequencies: [
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'annually', label: 'Annually' }
      ],
      calculationBases: [
        { value: 'revenue', label: 'Revenue' },
        { value: 'volume', label: 'Volume' },
        { value: 'margin', label: 'Margin' }
      ]
    }
  });
});

// Get applicable terms for a customer
tradingTerms.get('/applicable/:customerId', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { customerId } = c.req.param();
    const now = new Date().toISOString();
    
    const result = await db.prepare(`
      SELECT * FROM trading_terms 
      WHERE company_id = ? 
        AND customer_id = ?
        AND status = 'active'
        AND start_date <= ?
        AND (end_date IS NULL OR end_date >= ?)
      ORDER BY term_type, created_at DESC
    `).bind(companyId, customerId, now, now).all();
    
    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    console.error('Error fetching applicable terms:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get trading term by ID
tradingTerms.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    
    const result = await db.prepare(`
      SELECT t.*, c.name as customer_name 
      FROM trading_terms t 
      LEFT JOIN customers c ON t.customer_id = c.id 
      WHERE t.id = ? AND t.company_id = ?
    `).bind(id, companyId).first();
    
    if (!result) {
      return c.json({ success: false, message: 'Trading term not found' }, 404);
    }
    
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching trading term:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Create trading term
tradingTerms.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = c.get('userId') || 'system';
    
    const id = generateId();
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO trading_terms (
        id, company_id, name, description, term_type, status,
        customer_id, start_date, end_date, rate, rate_type,
        threshold, cap, payment_frequency, calculation_basis,
        created_by, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId, body.name, body.description || '',
      body.termType || body.term_type || 'volume_rebate',
      body.customerId || body.customer_id || null,
      body.startDate || body.start_date || null,
      body.endDate || body.end_date || null,
      body.rate || 0, body.rateType || body.rate_type || 'percentage',
      body.threshold || 0, body.cap || null,
      body.paymentFrequency || body.payment_frequency || 'quarterly',
      body.calculationBasis || body.calculation_basis || 'revenue',
      userId, JSON.stringify(body.data || {}), now, now
    ).run();
    
    const created = await db.prepare('SELECT * FROM trading_terms WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: created }, 201);
  } catch (error) {
    console.error('Error creating trading term:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Update trading term
tradingTerms.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    
    const existing = await db.prepare(`
      SELECT * FROM trading_terms WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!existing) {
      return c.json({ success: false, message: 'Trading term not found' }, 404);
    }
    
    await db.prepare(`
      UPDATE trading_terms SET
        name = ?, description = ?, term_type = ?,
        customer_id = ?, start_date = ?, end_date = ?,
        rate = ?, rate_type = ?, threshold = ?, cap = ?,
        payment_frequency = ?, calculation_basis = ?,
        data = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.name || existing.name,
      body.description || existing.description,
      body.termType || body.term_type || existing.term_type,
      body.customerId || body.customer_id || existing.customer_id,
      body.startDate || body.start_date || existing.start_date,
      body.endDate || body.end_date || existing.end_date,
      body.rate ?? existing.rate,
      body.rateType || body.rate_type || existing.rate_type,
      body.threshold ?? existing.threshold,
      body.cap ?? existing.cap,
      body.paymentFrequency || body.payment_frequency || existing.payment_frequency,
      body.calculationBasis || body.calculation_basis || existing.calculation_basis,
      JSON.stringify(body.data || {}),
      now, id
    ).run();
    
    const updated = await db.prepare('SELECT * FROM trading_terms WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating trading term:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Delete trading term
tradingTerms.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    
    const existing = await db.prepare(`
      SELECT * FROM trading_terms WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!existing) {
      return c.json({ success: false, message: 'Trading term not found' }, 404);
    }
    
    await db.prepare('DELETE FROM trading_terms WHERE id = ?').bind(id).run();
    
    return c.json({ success: true, message: 'Trading term deleted' });
  } catch (error) {
    console.error('Error deleting trading term:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Submit for approval
tradingTerms.post('/:id/submit', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE trading_terms SET status = 'pending_approval', updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(now, id, companyId).run();
    
    const updated = await db.prepare('SELECT * FROM trading_terms WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error submitting trading term:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Approve trading term
tradingTerms.post('/:id/approve', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const userId = c.get('userId') || 'system';
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE trading_terms SET status = 'approved', approved_by = ?, approved_at = ?, updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(userId, now, now, id, companyId).run();
    
    const updated = await db.prepare('SELECT * FROM trading_terms WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error approving trading term:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Reject trading term
tradingTerms.post('/:id/reject', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE trading_terms SET status = 'draft', updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(now, id, companyId).run();
    
    const updated = await db.prepare('SELECT * FROM trading_terms WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error rejecting trading term:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Calculate trading term value
tradingTerms.post('/:id/calculate', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    
    const term = await db.prepare(`
      SELECT * FROM trading_terms WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!term) {
      return c.json({ success: false, message: 'Trading term not found' }, 404);
    }
    
    const baseValue = body.baseValue || 0;
    let calculatedAmount = 0;
    
    if (baseValue >= (term.threshold || 0)) {
      if (term.rate_type === 'percentage') {
        calculatedAmount = baseValue * (term.rate / 100);
      } else {
        calculatedAmount = term.rate;
      }
      
      if (term.cap && calculatedAmount > term.cap) {
        calculatedAmount = term.cap;
      }
    }
    
    return c.json({
      success: true,
      data: {
        termId: id,
        termName: term.name,
        baseValue,
        rate: term.rate,
        rateType: term.rate_type,
        threshold: term.threshold,
        cap: term.cap,
        calculatedAmount
      }
    });
  } catch (error) {
    console.error('Error calculating trading term:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export const tradingTermsRoutes = tradingTerms;
