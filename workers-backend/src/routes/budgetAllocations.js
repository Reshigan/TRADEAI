import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const budgetAllocations = new Hono();

budgetAllocations.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
};

const getUserId = (c) => {
  return c.get('userId') || null;
};

// ── GET /  List all budget allocations ──────────────────────────────────
budgetAllocations.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, budget_id, fiscal_year, dimension, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM budget_allocations WHERE company_id = ?';
    const params = [companyId];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (budget_id) { query += ' AND budget_id = ?'; params.push(budget_id); }
    if (fiscal_year) { query += ' AND fiscal_year = ?'; params.push(parseInt(fiscal_year)); }
    if (dimension) { query += ' AND dimension = ?'; params.push(dimension); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();

    const countResult = await db.prepare(
      'SELECT COUNT(*) as total FROM budget_allocations WHERE company_id = ?'
    ).bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching budget allocations:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /options  Configuration options ─────────────────────────────────
budgetAllocations.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      allocationMethods: [
        { value: 'top_down', label: 'Top-Down (Waterfall)' },
        { value: 'bottom_up', label: 'Bottom-Up (Roll-Up)' },
        { value: 'hybrid', label: 'Hybrid (Top-Down + Adjustment)' },
        { value: 'equal_split', label: 'Equal Split' },
        { value: 'proportional', label: 'Proportional (by Prior Year)' },
        { value: 'weighted', label: 'Weighted (Custom Weights)' }
      ],
      dimensions: [
        { value: 'customer', label: 'By Customer' },
        { value: 'channel', label: 'By Channel' },
        { value: 'product', label: 'By Product' },
        { value: 'category', label: 'By Category' },
        { value: 'region', label: 'By Region' },
        { value: 'brand', label: 'By Brand' }
      ],
      periodTypes: [
        { value: 'annual', label: 'Annual' },
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'monthly', label: 'Monthly' }
      ],
      statuses: [
        { value: 'draft', label: 'Draft' },
        { value: 'pending_approval', label: 'Pending Approval' },
        { value: 'approved', label: 'Approved' },
        { value: 'active', label: 'Active' },
        { value: 'locked', label: 'Locked' },
        { value: 'archived', label: 'Archived' }
      ]
    }
  });
});

// ── GET /summary  Aggregated allocation statistics ──────────────────────
budgetAllocations.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);

    const stats = await db.prepare(`
      SELECT
        COUNT(*) as total_allocations,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_allocations,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_allocations,
        SUM(CASE WHEN status = 'locked' THEN 1 ELSE 0 END) as locked_allocations,
        SUM(source_amount) as total_source,
        SUM(allocated_amount) as total_allocated,
        SUM(utilized_amount) as total_utilized,
        SUM(remaining_amount) as total_remaining,
        AVG(utilization_pct) as avg_utilization
      FROM budget_allocations WHERE company_id = ?
    `).bind(companyId).first();

    const lineStats = await db.prepare(`
      SELECT
        COUNT(*) as total_lines,
        COUNT(DISTINCT dimension_id) as unique_dimensions,
        SUM(allocated_amount) as lines_allocated,
        SUM(utilized_amount) as lines_utilized,
        SUM(committed_amount) as lines_committed
      FROM budget_allocation_lines WHERE company_id = ?
    `).bind(companyId).first();

    return c.json({
      success: true,
      data: {
        allocations: {
          total: stats?.total_allocations || 0,
          active: stats?.active_allocations || 0,
          draft: stats?.draft_allocations || 0,
          locked: stats?.locked_allocations || 0,
          totalSource: stats?.total_source || 0,
          totalAllocated: stats?.total_allocated || 0,
          totalUtilized: stats?.total_utilized || 0,
          totalRemaining: stats?.total_remaining || 0,
          avgUtilization: Math.round((stats?.avg_utilization || 0) * 100) / 100
        },
        lines: {
          total: lineStats?.total_lines || 0,
          uniqueDimensions: lineStats?.unique_dimensions || 0,
          allocated: lineStats?.lines_allocated || 0,
          utilized: lineStats?.lines_utilized || 0,
          committed: lineStats?.lines_committed || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching allocation summary:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /waterfall  Live waterfall view of budget → allocation → spend ──
budgetAllocations.get('/waterfall', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { fiscal_year, budget_id } = c.req.query();

    let budgetQuery = 'SELECT id, name, amount, utilized FROM budgets WHERE company_id = ?';
    const budgetParams = [companyId];
    if (fiscal_year) { budgetQuery += ' AND year = ?'; budgetParams.push(parseInt(fiscal_year)); }
    if (budget_id) { budgetQuery += ' AND id = ?'; budgetParams.push(budget_id); }
    budgetQuery += ' ORDER BY name ASC';

    const budgets = await db.prepare(budgetQuery).bind(...budgetParams).all();

    const waterfallData = [];
    for (const budget of (budgets.results || [])) {
      const allocLines = await db.prepare(`
        SELECT bal.dimension_type, bal.dimension_name, bal.allocated_amount,
               bal.utilized_amount, bal.committed_amount, bal.remaining_amount
        FROM budget_allocation_lines bal
        JOIN budget_allocations ba ON bal.allocation_id = ba.id
        WHERE ba.company_id = ? AND ba.budget_id = ?
        ORDER BY bal.allocated_amount DESC
      `).bind(companyId, budget.id).all();

      const spendResult = await db.prepare(`
        SELECT SUM(amount) as total_spend
        FROM trade_spends WHERE company_id = ? AND budget_id = ?
      `).bind(companyId, budget.id).first();

      waterfallData.push({
        budgetId: budget.id,
        budgetName: budget.name,
        totalBudget: budget.amount || 0,
        budgetUtilized: budget.utilized || 0,
        totalSpend: spendResult?.total_spend || 0,
        allocations: (allocLines.results || []).map(rowToDocument)
      });
    }

    return c.json({ success: true, data: waterfallData });
  } catch (error) {
    console.error('Error fetching waterfall:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /:id  Get allocation by ID with lines ───────────────────────────
budgetAllocations.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const allocation = await db.prepare(
      'SELECT * FROM budget_allocations WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!allocation) {
      return c.json({ success: false, message: 'Budget allocation not found' }, 404);
    }

    const lines = await db.prepare(
      'SELECT * FROM budget_allocation_lines WHERE allocation_id = ? AND company_id = ? ORDER BY line_number ASC'
    ).bind(id, companyId).all();

    return c.json({
      success: true,
      data: {
        ...rowToDocument(allocation),
        lines: (lines.results || []).map(rowToDocument)
      }
    });
  } catch (error) {
    console.error('Error fetching budget allocation:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /  Create a new budget allocation ──────────────────────────────
budgetAllocations.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = getUserId(c);
    const id = generateId();
    const now = new Date().toISOString();

    if (!body.name) {
      return c.json({ success: false, message: 'Allocation name is required' }, 400);
    }

    let sourceAmount = body.sourceAmount || body.source_amount || 0;
    if (body.budgetId || body.budget_id) {
      const budget = await db.prepare(
        'SELECT amount FROM budgets WHERE id = ? AND company_id = ?'
      ).bind(body.budgetId || body.budget_id, companyId).first();
      if (budget) {
        sourceAmount = sourceAmount || budget.amount || 0;
      }
    }

    await db.prepare(`
      INSERT INTO budget_allocations (
        id, company_id, name, description, status, allocation_method,
        budget_id, source_amount, allocated_amount, remaining_amount,
        utilized_amount, utilization_pct,
        fiscal_year, period_type, start_date, end_date,
        dimension, currency, notes, created_by, data,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, 0, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId,
      body.name,
      body.description || null,
      body.allocationMethod || body.allocation_method || 'top_down',
      body.budgetId || body.budget_id || null,
      sourceAmount,
      sourceAmount,
      body.fiscalYear || body.fiscal_year || new Date().getFullYear(),
      body.periodType || body.period_type || 'annual',
      body.startDate || body.start_date || null,
      body.endDate || body.end_date || null,
      body.dimension || 'customer',
      body.currency || 'ZAR',
      body.notes || null,
      userId,
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM budget_allocations WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    console.error('Error creating budget allocation:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── PUT /:id  Update a budget allocation ────────────────────────────────
budgetAllocations.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare(
      'SELECT * FROM budget_allocations WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'Budget allocation not found' }, 404);
    }

    if (existing.locked) {
      return c.json({ success: false, message: 'Allocation is locked and cannot be edited' }, 400);
    }

    await db.prepare(`
      UPDATE budget_allocations SET
        name = ?, description = ?, status = ?, allocation_method = ?,
        budget_id = ?, source_amount = ?,
        fiscal_year = ?, period_type = ?, start_date = ?, end_date = ?,
        dimension = ?, currency = ?, notes = ?, data = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.name || existing.name,
      body.description ?? existing.description,
      body.status || existing.status,
      body.allocationMethod || body.allocation_method || existing.allocation_method,
      body.budgetId || body.budget_id || existing.budget_id,
      body.sourceAmount || body.source_amount || existing.source_amount,
      body.fiscalYear || body.fiscal_year || existing.fiscal_year,
      body.periodType || body.period_type || existing.period_type,
      body.startDate || body.start_date || existing.start_date,
      body.endDate || body.end_date || existing.end_date,
      body.dimension || existing.dimension,
      body.currency || existing.currency,
      body.notes ?? existing.notes,
      JSON.stringify(body.data || JSON.parse(existing.data || '{}')),
      now, id
    ).run();

    const updated = await db.prepare('SELECT * FROM budget_allocations WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error updating budget allocation:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── DELETE /:id  Delete allocation and all lines ────────────────────────
budgetAllocations.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const existing = await db.prepare(
      'SELECT * FROM budget_allocations WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'Budget allocation not found' }, 404);
    }

    if (existing.locked) {
      return c.json({ success: false, message: 'Cannot delete a locked allocation' }, 400);
    }

    await db.prepare('DELETE FROM budget_allocation_lines WHERE allocation_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM budget_allocations WHERE id = ?').bind(id).run();

    return c.json({ success: true, message: 'Budget allocation deleted' });
  } catch (error) {
    console.error('Error deleting budget allocation:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /:id/distribute  Run distribution algorithm ────────────────────
// Core algorithm: Takes the source amount and distributes it across
// dimension entities (customers, products, channels, etc.) using the
// selected allocation method.
budgetAllocations.post('/:id/distribute', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const allocation = await db.prepare(
      'SELECT * FROM budget_allocations WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!allocation) {
      return c.json({ success: false, message: 'Budget allocation not found' }, 404);
    }

    if (allocation.locked) {
      return c.json({ success: false, message: 'Allocation is locked' }, 400);
    }

    await db.prepare('DELETE FROM budget_allocation_lines WHERE allocation_id = ? AND company_id = ?').bind(id, companyId).run();

    const method = allocation.allocation_method || 'top_down';
    const dimension = allocation.dimension || 'customer';
    const sourceAmount = allocation.source_amount || 0;

    let entities = [];
    if (dimension === 'customer') {
      const result = await db.prepare(
        "SELECT id, name FROM customers WHERE company_id = ? AND status != 'inactive' ORDER BY name"
      ).bind(companyId).all();
      entities = (result.results || []).map(r => ({ id: r.id, name: r.name }));
    } else if (dimension === 'product') {
      const result = await db.prepare(
        "SELECT id, name FROM products WHERE company_id = ? AND status != 'inactive' ORDER BY name"
      ).bind(companyId).all();
      entities = (result.results || []).map(r => ({ id: r.id, name: r.name }));
    } else if (dimension === 'channel') {
      const result = await db.prepare(
        'SELECT DISTINCT channel as id, channel as name FROM customers WHERE company_id = ? AND channel IS NOT NULL ORDER BY channel'
      ).bind(companyId).all();
      entities = (result.results || []).map(r => ({ id: r.id, name: r.name }));
    } else if (dimension === 'category') {
      const result = await db.prepare(
        'SELECT DISTINCT category as id, category as name FROM products WHERE company_id = ? AND category IS NOT NULL ORDER BY category'
      ).bind(companyId).all();
      entities = (result.results || []).map(r => ({ id: r.id, name: r.name }));
    } else if (dimension === 'region') {
      const result = await db.prepare(
        'SELECT DISTINCT region as id, region as name FROM customers WHERE company_id = ? AND region IS NOT NULL ORDER BY region'
      ).bind(companyId).all();
      entities = (result.results || []).map(r => ({ id: r.id, name: r.name }));
    } else if (dimension === 'brand') {
      const result = await db.prepare(
        'SELECT DISTINCT brand as id, brand as name FROM products WHERE company_id = ? AND brand IS NOT NULL ORDER BY brand'
      ).bind(companyId).all();
      entities = (result.results || []).map(r => ({ id: r.id, name: r.name }));
    }

    if (entities.length === 0) {
      return c.json({ success: false, message: `No ${dimension} entities found to allocate to` }, 400);
    }

    const overrides = body.overrides || {};
    let totalAllocated = 0;
    const lines = [];

    if (method === 'equal_split') {
      const perEntity = Math.round((sourceAmount / entities.length) * 100) / 100;
      for (let i = 0; i < entities.length; i++) {
        const amt = overrides[entities[i].id] || perEntity;
        lines.push({ entity: entities[i], amount: amt, pct: (amt / sourceAmount) * 100 });
        totalAllocated += amt;
      }
    } else if (method === 'proportional') {
      const priorYearData = {};
      let totalPrior = 0;
      for (const entity of entities) {
        let priorQuery;
        const priorParams = [companyId];
        if (dimension === 'customer') {
          priorQuery = 'SELECT SUM(amount) as total FROM trade_spends WHERE company_id = ? AND customer_id = ?';
          priorParams.push(entity.id);
        } else if (dimension === 'product') {
          priorQuery = 'SELECT SUM(amount) as total FROM trade_spends WHERE company_id = ? AND product_id = ?';
          priorParams.push(entity.id);
        } else {
          priorQuery = 'SELECT 0 as total';
        }
        const prior = await db.prepare(priorQuery).bind(...priorParams).first();
        const priorAmt = prior?.total || 0;
        priorYearData[entity.id] = priorAmt;
        totalPrior += priorAmt;
      }

      for (let i = 0; i < entities.length; i++) {
        const priorAmt = priorYearData[entities[i].id] || 0;
        const pct = totalPrior > 0 ? (priorAmt / totalPrior) : (1 / entities.length);
        const amt = overrides[entities[i].id] || Math.round(sourceAmount * pct * 100) / 100;
        lines.push({
          entity: entities[i],
          amount: amt,
          pct: (amt / sourceAmount) * 100,
          priorYear: priorAmt,
          priorYearGrowthPct: priorAmt > 0 ? ((amt - priorAmt) / priorAmt) * 100 : 0
        });
        totalAllocated += amt;
      }
    } else {
      const perEntity = Math.round((sourceAmount / entities.length) * 100) / 100;
      for (let i = 0; i < entities.length; i++) {
        const amt = overrides[entities[i].id] || perEntity;
        lines.push({ entity: entities[i], amount: amt, pct: (amt / sourceAmount) * 100 });
        totalAllocated += amt;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineId = generateId();
      await db.prepare(`
        INSERT INTO budget_allocation_lines (
          id, company_id, allocation_id, line_number, dimension_type,
          dimension_id, dimension_name, level, source_amount,
          allocated_amount, allocated_pct, utilized_amount, committed_amount,
          remaining_amount, utilization_pct, prior_year_amount,
          prior_year_growth_pct, status, data, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 0, 0, ?, 0, ?, ?, 'draft', '{}', ?, ?)
      `).bind(
        lineId, companyId, id, i + 1, dimension,
        line.entity.id, line.entity.name,
        sourceAmount,
        Math.round(line.amount * 100) / 100,
        Math.round((line.pct || 0) * 100) / 100,
        Math.round(line.amount * 100) / 100,
        Math.round((line.priorYear || 0) * 100) / 100,
        Math.round((line.priorYearGrowthPct || 0) * 100) / 100,
        now, now
      ).run();
    }

    totalAllocated = Math.round(totalAllocated * 100) / 100;
    const remaining = Math.round((sourceAmount - totalAllocated) * 100) / 100;

    await db.prepare(`
      UPDATE budget_allocations SET
        allocated_amount = ?, remaining_amount = ?, updated_at = ?
      WHERE id = ?
    `).bind(totalAllocated, remaining, now, id).run();

    const updatedAllocation = await db.prepare('SELECT * FROM budget_allocations WHERE id = ?').bind(id).first();
    const updatedLines = await db.prepare(
      'SELECT * FROM budget_allocation_lines WHERE allocation_id = ? ORDER BY line_number ASC'
    ).bind(id).all();

    return c.json({
      success: true,
      data: {
        ...rowToDocument(updatedAllocation),
        lines: (updatedLines.results || []).map(rowToDocument)
      },
      distribution: {
        method,
        dimension,
        sourceAmount,
        totalAllocated,
        remaining,
        entityCount: entities.length
      }
    });
  } catch (error) {
    console.error('Error distributing allocation:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /:id/lock  Lock an allocation (prevent edits) ─────────────────
budgetAllocations.post('/:id/lock', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const userId = getUserId(c);
    const now = new Date().toISOString();

    const allocation = await db.prepare(
      'SELECT * FROM budget_allocations WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!allocation) {
      return c.json({ success: false, message: 'Budget allocation not found' }, 404);
    }

    await db.prepare(`
      UPDATE budget_allocations SET
        locked = 1, locked_by = ?, locked_at = ?, status = 'locked', updated_at = ?
      WHERE id = ?
    `).bind(userId, now, now, id).run();

    await db.prepare(`
      UPDATE budget_allocation_lines SET status = 'locked', updated_at = ?
      WHERE allocation_id = ? AND company_id = ?
    `).bind(now, id, companyId).run();

    const updated = await db.prepare('SELECT * FROM budget_allocations WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error locking allocation:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /:id/unlock  Unlock an allocation ──────────────────────────────
budgetAllocations.post('/:id/unlock', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();

    const allocation = await db.prepare(
      'SELECT * FROM budget_allocations WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!allocation) {
      return c.json({ success: false, message: 'Budget allocation not found' }, 404);
    }

    await db.prepare(`
      UPDATE budget_allocations SET
        locked = 0, locked_by = NULL, locked_at = NULL, status = 'active', updated_at = ?
      WHERE id = ?
    `).bind(now, id).run();

    await db.prepare(`
      UPDATE budget_allocation_lines SET status = 'active', updated_at = ?
      WHERE allocation_id = ? AND company_id = ?
    `).bind(now, id, companyId).run();

    const updated = await db.prepare('SELECT * FROM budget_allocations WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error unlocking allocation:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /:id/refresh-utilization  Recalculate utilization from trade spends
budgetAllocations.post('/:id/refresh-utilization', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();

    const allocation = await db.prepare(
      'SELECT * FROM budget_allocations WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!allocation) {
      return c.json({ success: false, message: 'Budget allocation not found' }, 404);
    }

    const lines = await db.prepare(
      'SELECT * FROM budget_allocation_lines WHERE allocation_id = ? AND company_id = ?'
    ).bind(id, companyId).all();

    let totalUtilized = 0;

    for (const line of (lines.results || [])) {
      let spendQuery;
      const spendParams = [companyId];

      if (line.dimension_type === 'customer') {
        spendQuery = 'SELECT SUM(amount) as total FROM trade_spends WHERE company_id = ? AND customer_id = ?';
        spendParams.push(line.dimension_id);
      } else if (line.dimension_type === 'product') {
        spendQuery = 'SELECT SUM(amount) as total FROM trade_spends WHERE company_id = ? AND product_id = ?';
        spendParams.push(line.dimension_id);
      } else {
        continue;
      }

      if (allocation.budget_id) {
        spendQuery += ' AND budget_id = ?';
        spendParams.push(allocation.budget_id);
      }

      const spend = await db.prepare(spendQuery).bind(...spendParams).first();
      const utilized = spend?.total || 0;
      const remaining = Math.max(0, line.allocated_amount - utilized);
      const utilizationPct = line.allocated_amount > 0 ? (utilized / line.allocated_amount) * 100 : 0;

      await db.prepare(`
        UPDATE budget_allocation_lines SET
          utilized_amount = ?, remaining_amount = ?, utilization_pct = ?,
          variance_amount = ?, variance_pct = ?, updated_at = ?
        WHERE id = ?
      `).bind(
        Math.round(utilized * 100) / 100,
        Math.round(remaining * 100) / 100,
        Math.round(utilizationPct * 100) / 100,
        Math.round((utilized - line.allocated_amount) * 100) / 100,
        Math.round((utilizationPct - 100) * 100) / 100,
        now, line.id
      ).run();

      totalUtilized += utilized;
    }

    const totalUtilizationPct = allocation.source_amount > 0
      ? (totalUtilized / allocation.source_amount) * 100 : 0;

    await db.prepare(`
      UPDATE budget_allocations SET
        utilized_amount = ?, utilization_pct = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      Math.round(totalUtilized * 100) / 100,
      Math.round(totalUtilizationPct * 100) / 100,
      now, id
    ).run();

    const updatedAllocation = await db.prepare('SELECT * FROM budget_allocations WHERE id = ?').bind(id).first();
    const updatedLines = await db.prepare(
      'SELECT * FROM budget_allocation_lines WHERE allocation_id = ? ORDER BY line_number ASC'
    ).bind(id).all();

    return c.json({
      success: true,
      data: {
        ...rowToDocument(updatedAllocation),
        lines: (updatedLines.results || []).map(rowToDocument)
      }
    });
  } catch (error) {
    console.error('Error refreshing utilization:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /:id/lines  Get allocation lines ────────────────────────────────
budgetAllocations.get('/:id/lines', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const lines = await db.prepare(
      'SELECT * FROM budget_allocation_lines WHERE allocation_id = ? AND company_id = ? ORDER BY line_number ASC'
    ).bind(id, companyId).all();

    return c.json({
      success: true,
      data: (lines.results || []).map(rowToDocument)
    });
  } catch (error) {
    console.error('Error fetching allocation lines:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── PUT /:id/lines/:lineId  Update individual allocation line ───────────
budgetAllocations.put('/:id/lines/:lineId', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id, lineId } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const allocation = await db.prepare(
      'SELECT * FROM budget_allocations WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!allocation) {
      return c.json({ success: false, message: 'Budget allocation not found' }, 404);
    }

    if (allocation.locked) {
      return c.json({ success: false, message: 'Allocation is locked' }, 400);
    }

    const line = await db.prepare(
      'SELECT * FROM budget_allocation_lines WHERE id = ? AND allocation_id = ?'
    ).bind(lineId, id).first();

    if (!line) {
      return c.json({ success: false, message: 'Allocation line not found' }, 404);
    }

    const newAmount = body.allocatedAmount || body.allocated_amount || line.allocated_amount;
    const newPct = allocation.source_amount > 0 ? (newAmount / allocation.source_amount) * 100 : 0;

    await db.prepare(`
      UPDATE budget_allocation_lines SET
        allocated_amount = ?, allocated_pct = ?,
        remaining_amount = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      Math.round(newAmount * 100) / 100,
      Math.round(newPct * 100) / 100,
      Math.round((newAmount - (line.utilized_amount || 0)) * 100) / 100,
      body.notes ?? line.notes,
      now, lineId
    ).run();

    const allLines = await db.prepare(
      'SELECT SUM(allocated_amount) as total FROM budget_allocation_lines WHERE allocation_id = ?'
    ).bind(id).first();

    const totalAllocated = allLines?.total || 0;
    await db.prepare(`
      UPDATE budget_allocations SET
        allocated_amount = ?, remaining_amount = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      Math.round(totalAllocated * 100) / 100,
      Math.round((allocation.source_amount - totalAllocated) * 100) / 100,
      now, id
    ).run();

    const updated = await db.prepare('SELECT * FROM budget_allocation_lines WHERE id = ?').bind(lineId).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error updating allocation line:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export const budgetAllocationRoutes = budgetAllocations;
