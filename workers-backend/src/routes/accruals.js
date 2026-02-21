import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const accruals = new Hono();

accruals.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
};

const getUserId = (c) => {
  return c.get('userId') || null;
};

// ── GET /  List all accruals ───────────────────────────────────────────
accruals.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, accrual_type, customer_id, promotion_id, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM accruals WHERE company_id = ?';
    const params = [companyId];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (accrual_type) { query += ' AND accrual_type = ?'; params.push(accrual_type); }
    if (customer_id) { query += ' AND customer_id = ?'; params.push(customer_id); }
    if (promotion_id) { query += ' AND promotion_id = ?'; params.push(promotion_id); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();

    const countQuery = 'SELECT COUNT(*) as total FROM accruals WHERE company_id = ?';
    const countResult = await db.prepare(countQuery).bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching accruals:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /options  Accrual configuration options ─────────────────────────
accruals.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      accrualTypes: [
        { value: 'promotion', label: 'Promotion Accrual' },
        { value: 'rebate', label: 'Rebate Accrual' },
        { value: 'trading_term', label: 'Trading Term Accrual' },
        { value: 'off_invoice', label: 'Off-Invoice Accrual' },
        { value: 'scan_back', label: 'Scan-Back Accrual' },
        { value: 'lump_sum', label: 'Lump Sum Accrual' }
      ],
      calculationMethods: [
        { value: 'percentage_of_sales', label: 'Percentage of Sales' },
        { value: 'per_unit', label: 'Per Unit' },
        { value: 'lump_sum', label: 'Lump Sum' },
        { value: 'tiered', label: 'Tiered (Volume-based)' },
        { value: 'baseline_lift', label: 'Baseline Lift (Incremental)' }
      ],
      frequencies: [
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'annually', label: 'Annually' },
        { value: 'on_demand', label: 'On Demand' }
      ],
      rateTypes: [
        { value: 'percentage', label: 'Percentage (%)' },
        { value: 'fixed', label: 'Fixed Amount (R)' },
        { value: 'per_unit', label: 'Per Unit (R/unit)' }
      ],
      statuses: [
        { value: 'draft', label: 'Draft' },
        { value: 'active', label: 'Active' },
        { value: 'calculating', label: 'Calculating' },
        { value: 'posted', label: 'Posted to GL' },
        { value: 'partially_settled', label: 'Partially Settled' },
        { value: 'fully_settled', label: 'Fully Settled' },
        { value: 'reversed', label: 'Reversed' },
        { value: 'closed', label: 'Closed' }
      ]
    }
  });
});

// ── GET /summary  Aggregated accrual statistics ─────────────────────────
accruals.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);

    const stats = await db.prepare(`
      SELECT
        COUNT(*) as total_accruals,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_accruals,
        SUM(CASE WHEN status = 'posted' THEN 1 ELSE 0 END) as posted_accruals,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_accruals,
        SUM(accrued_amount) as total_accrued,
        SUM(posted_amount) as total_posted,
        SUM(settled_amount) as total_settled,
        SUM(remaining_amount) as total_remaining,
        SUM(reversed_amount) as total_reversed
      FROM accruals WHERE company_id = ?
    `).bind(companyId).first();

    const journalStats = await db.prepare(`
      SELECT
        COUNT(*) as total_journals,
        SUM(CASE WHEN journal_type = 'accrual' THEN amount ELSE 0 END) as total_accrual_entries,
        SUM(CASE WHEN journal_type = 'reversal' THEN amount ELSE 0 END) as total_reversal_entries,
        SUM(CASE WHEN journal_type = 'settlement' THEN amount ELSE 0 END) as total_settlement_entries
      FROM accrual_journals WHERE company_id = ?
    `).bind(companyId).first();

    return c.json({
      success: true,
      data: {
        accruals: {
          total: stats?.total_accruals || 0,
          active: stats?.active_accruals || 0,
          posted: stats?.posted_accruals || 0,
          draft: stats?.draft_accruals || 0,
          totalAccrued: stats?.total_accrued || 0,
          totalPosted: stats?.total_posted || 0,
          totalSettled: stats?.total_settled || 0,
          totalRemaining: stats?.total_remaining || 0,
          totalReversed: stats?.total_reversed || 0
        },
        journals: {
          total: journalStats?.total_journals || 0,
          totalAccrualEntries: journalStats?.total_accrual_entries || 0,
          totalReversalEntries: journalStats?.total_reversal_entries || 0,
          totalSettlementEntries: journalStats?.total_settlement_entries || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching accrual summary:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /:id  Get accrual by ID with periods and journals ──────────────
accruals.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const accrual = await db.prepare(
      'SELECT * FROM accruals WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!accrual) {
      return c.json({ success: false, message: 'Accrual not found' }, 404);
    }

    const periods = await db.prepare(
      'SELECT * FROM accrual_periods WHERE accrual_id = ? AND company_id = ? ORDER BY period_number ASC'
    ).bind(id, companyId).all();

    const journals = await db.prepare(
      'SELECT * FROM accrual_journals WHERE accrual_id = ? AND company_id = ? ORDER BY journal_date DESC'
    ).bind(id, companyId).all();

    return c.json({
      success: true,
      data: {
        ...rowToDocument(accrual),
        periods: (periods.results || []).map(rowToDocument),
        journals: (journals.results || []).map(rowToDocument)
      }
    });
  } catch (error) {
    console.error('Error fetching accrual:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /  Create a new accrual ────────────────────────────────────────
accruals.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = getUserId(c);
    const id = generateId();
    const now = new Date().toISOString();

    if (!body.name) {
      return c.json({ success: false, message: 'Accrual name is required' }, 400);
    }

    const rate = parseFloat(body.rate) || 0;
    const baseAmount = parseFloat(body.baseAmount || body.base_amount) || 0;

    await db.prepare(`
      INSERT INTO accruals (
        id, company_id, name, description, status, accrual_type,
        calculation_method, frequency, customer_id, product_id,
        promotion_id, budget_id, trading_term_id, baseline_id,
        gl_account, cost_center, start_date, end_date,
        rate, rate_type, base_amount, accrued_amount, posted_amount,
        reversed_amount, settled_amount, remaining_amount,
        currency, auto_calculate, auto_post,
        created_by, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId,
      body.name,
      body.description || null,
      body.accrualType || body.accrual_type || 'promotion',
      body.calculationMethod || body.calculation_method || 'percentage_of_sales',
      body.frequency || 'monthly',
      body.customerId || body.customer_id || null,
      body.productId || body.product_id || null,
      body.promotionId || body.promotion_id || null,
      body.budgetId || body.budget_id || null,
      body.tradingTermId || body.trading_term_id || null,
      body.baselineId || body.baseline_id || null,
      body.glAccount || body.gl_account || null,
      body.costCenter || body.cost_center || null,
      body.startDate || body.start_date || null,
      body.endDate || body.end_date || null,
      rate,
      body.rateType || body.rate_type || 'percentage',
      baseAmount,
      body.currency || 'ZAR',
      body.autoCalculate !== undefined ? (body.autoCalculate ? 1 : 0) : 1,
      body.autoPost !== undefined ? (body.autoPost ? 1 : 0) : 0,
      userId,
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM accruals WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    console.error('Error creating accrual:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── PUT /:id  Update an accrual ─────────────────────────────────────────
accruals.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare(
      'SELECT * FROM accruals WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'Accrual not found' }, 404);
    }

    await db.prepare(`
      UPDATE accruals SET
        name = ?, description = ?, status = ?, accrual_type = ?,
        calculation_method = ?, frequency = ?,
        customer_id = ?, product_id = ?,
        promotion_id = ?, budget_id = ?, trading_term_id = ?, baseline_id = ?,
        gl_account = ?, cost_center = ?,
        start_date = ?, end_date = ?,
        rate = ?, rate_type = ?, base_amount = ?,
        currency = ?, auto_calculate = ?, auto_post = ?,
        data = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.name || existing.name,
      body.description ?? existing.description,
      body.status || existing.status,
      body.accrualType || body.accrual_type || existing.accrual_type,
      body.calculationMethod || body.calculation_method || existing.calculation_method,
      body.frequency || existing.frequency,
      body.customerId || body.customer_id || existing.customer_id,
      body.productId || body.product_id || existing.product_id,
      body.promotionId || body.promotion_id || existing.promotion_id,
      body.budgetId || body.budget_id || existing.budget_id,
      body.tradingTermId || body.trading_term_id || existing.trading_term_id,
      body.baselineId || body.baseline_id || existing.baseline_id,
      body.glAccount || body.gl_account || existing.gl_account,
      body.costCenter || body.cost_center || existing.cost_center,
      body.startDate || body.start_date || existing.start_date,
      body.endDate || body.end_date || existing.end_date,
      parseFloat(body.rate) || existing.rate,
      body.rateType || body.rate_type || existing.rate_type,
      parseFloat(body.baseAmount || body.base_amount) || existing.base_amount,
      body.currency || existing.currency,
      body.autoCalculate !== undefined ? (body.autoCalculate ? 1 : 0) : existing.auto_calculate,
      body.autoPost !== undefined ? (body.autoPost ? 1 : 0) : existing.auto_post,
      JSON.stringify(body.data || JSON.parse(existing.data || '{}')),
      now, id
    ).run();

    const updated = await db.prepare('SELECT * FROM accruals WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error updating accrual:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── DELETE /:id  Delete an accrual and its periods/journals ─────────────
accruals.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const existing = await db.prepare(
      'SELECT * FROM accruals WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'Accrual not found' }, 404);
    }

    if (existing.status === 'posted' || existing.status === 'partially_settled') {
      return c.json({ success: false, message: 'Cannot delete a posted or partially settled accrual. Reverse it first.' }, 400);
    }

    await db.prepare('DELETE FROM accrual_journals WHERE accrual_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM accrual_periods WHERE accrual_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM accruals WHERE id = ?').bind(id).run();

    return c.json({ success: true, message: 'Accrual deleted' });
  } catch (error) {
    console.error('Error deleting accrual:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /:id/calculate  Run accrual calculation ────────────────────────
// This is the core engine: takes the accrual definition (rate, method, dates)
// and calculates per-period accrual amounts based on actual sales/volumes
// from trade_spends, promotions, or baselines.
accruals.post('/:id/calculate', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();

    const accrual = await db.prepare(
      'SELECT * FROM accruals WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!accrual) {
      return c.json({ success: false, message: 'Accrual not found' }, 404);
    }

    await db.prepare(
      "UPDATE accruals SET status = 'calculating', updated_at = ? WHERE id = ?"
    ).bind(now, id).run();

    // Step 1: Determine the period boundaries based on frequency
    const startDate = accrual.start_date ? new Date(accrual.start_date) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = accrual.end_date ? new Date(accrual.end_date) : new Date(new Date().getFullYear(), 11, 31);
    const frequency = accrual.frequency || 'monthly';

    const periods = [];
    let currentStart = new Date(startDate);
    let periodNum = 1;

    while (currentStart < endDate) {
      const periodEnd = new Date(currentStart);
      if (frequency === 'weekly') {
        periodEnd.setDate(periodEnd.getDate() + 6);
      } else if (frequency === 'monthly') {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periodEnd.setDate(0);
      } else if (frequency === 'quarterly') {
        periodEnd.setMonth(periodEnd.getMonth() + 3);
        periodEnd.setDate(0);
      } else {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        periodEnd.setDate(0);
      }

      if (periodEnd > endDate) {
        periodEnd.setTime(endDate.getTime());
      }

      const pStart = currentStart.toISOString().split('T')[0];
      const pEnd = periodEnd.toISOString().split('T')[0];

      periods.push({
        periodNumber: periodNum,
        periodLabel: `${frequency === 'weekly' ? 'W' : frequency === 'monthly' ? 'M' : frequency === 'quarterly' ? 'Q' : 'Y'}${periodNum}`,
        periodStart: pStart,
        periodEnd: pEnd
      });

      periodNum++;
      if (frequency === 'weekly') {
        currentStart.setDate(currentStart.getDate() + 7);
      } else if (frequency === 'monthly') {
        currentStart.setMonth(currentStart.getMonth() + 1);
        currentStart.setDate(1);
      } else if (frequency === 'quarterly') {
        currentStart.setMonth(currentStart.getMonth() + 3);
        currentStart.setDate(1);
      } else {
        currentStart.setFullYear(currentStart.getFullYear() + 1);
        currentStart.setDate(1);
      }
    }

    // Step 2: For each period, query actual sales and calculate accrual
    await db.prepare(
      'DELETE FROM accrual_periods WHERE accrual_id = ? AND company_id = ?'
    ).bind(id, companyId).run();

    let totalAccrued = 0;
    const rate = accrual.rate || 0;
    const method = accrual.calculation_method || 'percentage_of_sales';

    for (const period of periods) {
      // Query actual trade spend / sales for this period
      let salesQuery = `
        SELECT COALESCE(SUM(amount), 0) as total_sales
        FROM trade_spends
        WHERE company_id = ? AND created_at >= ? AND created_at <= ?
      `;
      const salesParams = [companyId, period.periodStart, period.periodEnd + 'T23:59:59'];

      if (accrual.customer_id) {
        salesQuery += ' AND customer_id = ?';
        salesParams.push(accrual.customer_id);
      }
      if (accrual.product_id) {
        salesQuery += ' AND product_id = ?';
        salesParams.push(accrual.product_id);
      }
      if (accrual.promotion_id) {
        salesQuery += ' AND promotion_id = ?';
        salesParams.push(accrual.promotion_id);
      }

      const salesResult = await db.prepare(salesQuery).bind(...salesParams).first();
      const baseSales = salesResult?.total_sales || 0;

      // Calculate accrual amount based on method
      let calculatedAmount = 0;
      if (method === 'percentage_of_sales') {
        calculatedAmount = baseSales * (rate / 100);
      } else if (method === 'per_unit') {
        calculatedAmount = baseSales * rate;
      } else if (method === 'lump_sum') {
        calculatedAmount = (accrual.base_amount || 0) / periods.length;
      } else if (method === 'tiered') {
        // Tiered: rate increases with volume thresholds
        if (baseSales > 1000000) calculatedAmount = baseSales * (rate * 1.5 / 100);
        else if (baseSales > 500000) calculatedAmount = baseSales * (rate * 1.2 / 100);
        else calculatedAmount = baseSales * (rate / 100);
      } else if (method === 'baseline_lift') {
        // Only accrue on incremental volume above baseline
        if (accrual.baseline_id) {
          const baselinePeriod = await db.prepare(`
            SELECT base_volume, base_revenue FROM baseline_periods
            WHERE baseline_id = ? AND company_id = ? AND period_start <= ? AND period_end >= ?
            LIMIT 1
          `).bind(accrual.baseline_id, companyId, period.periodStart, period.periodStart).first();

          const baselineAmount = baselinePeriod?.base_revenue || 0;
          const incremental = Math.max(0, baseSales - baselineAmount);
          calculatedAmount = incremental * (rate / 100);
        } else {
          calculatedAmount = baseSales * (rate / 100);
        }
      }

      calculatedAmount = Math.round(calculatedAmount * 100) / 100;
      totalAccrued += calculatedAmount;

      const periodId = generateId();
      await db.prepare(`
        INSERT INTO accrual_periods (
          id, company_id, accrual_id, period_start, period_end,
          period_number, period_label, base_sales, accrual_rate,
          calculated_amount, adjusted_amount, posted_amount,
          variance_amount, variance_pct, status,
          data, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 'calculated', ?, ?, ?)
      `).bind(
        periodId, companyId, id,
        period.periodStart, period.periodEnd,
        period.periodNumber, period.periodLabel,
        baseSales, rate, calculatedAmount, calculatedAmount,
        JSON.stringify({}), now, now
      ).run();
    }

    totalAccrued = Math.round(totalAccrued * 100) / 100;
    const remaining = totalAccrued - (accrual.settled_amount || 0);

    await db.prepare(`
      UPDATE accruals SET
        status = 'active',
        accrued_amount = ?,
        remaining_amount = ?,
        last_calculated_at = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(totalAccrued, remaining, now, now, id).run();

    const updated = await db.prepare('SELECT * FROM accruals WHERE id = ?').bind(id).first();
    const updatedPeriods = await db.prepare(
      'SELECT * FROM accrual_periods WHERE accrual_id = ? ORDER BY period_number ASC'
    ).bind(id).all();

    return c.json({
      success: true,
      data: {
        ...rowToDocument(updated),
        periods: (updatedPeriods.results || []).map(rowToDocument)
      },
      message: `Calculated ${periods.length} periods. Total accrual: R${totalAccrued.toLocaleString()}`
    });
  } catch (error) {
    console.error('Error calculating accrual:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /:id/post  Post accrual to GL (create journal entries) ─────────
accruals.post('/:id/post', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const userId = getUserId(c);
    const now = new Date().toISOString();

    const accrual = await db.prepare(
      'SELECT * FROM accruals WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!accrual) {
      return c.json({ success: false, message: 'Accrual not found' }, 404);
    }

    if (accrual.accrued_amount <= 0) {
      return c.json({ success: false, message: 'No accrued amount to post. Calculate first.' }, 400);
    }

    // Get unposted periods
    const unpostedPeriods = await db.prepare(`
      SELECT * FROM accrual_periods
      WHERE accrual_id = ? AND company_id = ? AND status = 'calculated'
      ORDER BY period_number ASC
    `).bind(id, companyId).all();

    const periodsToPost = unpostedPeriods.results || [];
    if (periodsToPost.length === 0) {
      return c.json({ success: false, message: 'No unposted periods found. All periods already posted.' }, 400);
    }

    let totalPosted = 0;
    const debitAccount = accrual.gl_account || 'Trade Promotion Expense';
    const creditAccount = accrual.cost_center || 'Trade Accrual Liability';

    for (const period of periodsToPost) {
      const amount = period.calculated_amount || 0;
      if (amount <= 0) continue;

      const journalId = generateId();
      await db.prepare(`
        INSERT INTO accrual_journals (
          id, company_id, accrual_id, accrual_period_id,
          journal_type, journal_date, debit_account, credit_account,
          amount, currency, reference, narration, status,
          posted_by, data, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'accrual', ?, ?, ?, ?, ?, ?, ?, 'posted', ?, ?, ?, ?)
      `).bind(
        journalId, companyId, id, period.id,
        now, debitAccount, creditAccount,
        amount, accrual.currency || 'ZAR',
        `ACC-${accrual.name}-${period.period_label}`,
        `Accrual for ${accrual.name} - ${period.period_label} (${period.period_start} to ${period.period_end})`,
        userId,
        JSON.stringify({}), now, now
      ).run();

      await db.prepare(`
        UPDATE accrual_periods SET status = 'posted', posted_amount = ?, posted_at = ?, posted_by = ?, updated_at = ?
        WHERE id = ?
      `).bind(amount, now, userId, now, period.id).run();

      totalPosted += amount;
    }

    totalPosted = Math.round(totalPosted * 100) / 100;
    const newPostedTotal = (accrual.posted_amount || 0) + totalPosted;

    await db.prepare(`
      UPDATE accruals SET
        status = 'posted',
        posted_amount = ?,
        last_posted_at = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(newPostedTotal, now, now, id).run();

    return c.json({
      success: true,
      message: `Posted ${periodsToPost.length} periods totalling R${totalPosted.toLocaleString()} to GL`,
      data: { periodsPosted: periodsToPost.length, totalPosted, debitAccount, creditAccount }
    });
  } catch (error) {
    console.error('Error posting accrual:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /:id/reverse  Reverse an accrual (create reversal journal) ─────
accruals.post('/:id/reverse', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const userId = getUserId(c);
    const body = await c.req.json().catch(() => ({}));
    const now = new Date().toISOString();

    const accrual = await db.prepare(
      'SELECT * FROM accruals WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!accrual) {
      return c.json({ success: false, message: 'Accrual not found' }, 404);
    }

    if (accrual.posted_amount <= 0) {
      return c.json({ success: false, message: 'No posted amount to reverse.' }, 400);
    }

    const reverseAmount = parseFloat(body.amount) || accrual.posted_amount;
    const reason = body.reason || 'Full reversal';

    const journalId = generateId();
    await db.prepare(`
      INSERT INTO accrual_journals (
        id, company_id, accrual_id, accrual_period_id,
        journal_type, journal_date, debit_account, credit_account,
        amount, currency, reference, narration, status,
        posted_by, data, created_at, updated_at
      ) VALUES (?, ?, ?, NULL, 'reversal', ?, ?, ?, ?, ?, ?, ?, 'posted', ?, ?, ?, ?)
    `).bind(
      journalId, companyId, id,
      now,
      accrual.cost_center || 'Trade Accrual Liability',
      accrual.gl_account || 'Trade Promotion Expense',
      reverseAmount, accrual.currency || 'ZAR',
      `REV-${accrual.name}`,
      `Reversal: ${reason} - ${accrual.name}`,
      userId,
      JSON.stringify({ reason }), now, now
    ).run();

    const newReversed = (accrual.reversed_amount || 0) + reverseAmount;
    const newRemaining = (accrual.accrued_amount || 0) - (accrual.settled_amount || 0) - newReversed;

    await db.prepare(`
      UPDATE accruals SET
        status = 'reversed',
        reversed_amount = ?,
        remaining_amount = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(newReversed, Math.max(0, newRemaining), now, id).run();

    return c.json({
      success: true,
      message: `Reversed R${reverseAmount.toLocaleString()} for ${accrual.name}`,
      data: { reversedAmount: reverseAmount, reason, journalId }
    });
  } catch (error) {
    console.error('Error reversing accrual:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /:id/approve  Approve an accrual ───────────────────────────────
accruals.post('/:id/approve', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const userId = getUserId(c);
    const now = new Date().toISOString();

    const existing = await db.prepare(
      'SELECT * FROM accruals WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'Accrual not found' }, 404);
    }

    await db.prepare(`
      UPDATE accruals SET status = 'active', approved_by = ?, approved_at = ?, updated_at = ?
      WHERE id = ?
    `).bind(userId, now, now, id).run();

    const updated = await db.prepare('SELECT * FROM accruals WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error approving accrual:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /:id/journals  Get journal entries for an accrual ───────────────
accruals.get('/:id/journals', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const journals = await db.prepare(
      'SELECT * FROM accrual_journals WHERE accrual_id = ? AND company_id = ? ORDER BY journal_date DESC'
    ).bind(id, companyId).all();

    return c.json({
      success: true,
      data: (journals.results || []).map(rowToDocument)
    });
  } catch (error) {
    console.error('Error fetching accrual journals:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export { accruals as accrualRoutes };
