import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const scenarios = new Hono();

scenarios.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
};

const getUserId = (c) => {
  return c.get('userId') || null;
};

// ═══════════════════════════════════════════════════════════════════════
// SCENARIOS
// ═══════════════════════════════════════════════════════════════════════

// ── GET /options  Configuration options ─────────────────────────────────
scenarios.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      scenarioTypes: [
        { value: 'promotion', label: 'Promotion What-If' },
        { value: 'pricing', label: 'Pricing Simulation' },
        { value: 'budget', label: 'Budget Reallocation' },
        { value: 'product_mix', label: 'Product Mix Optimization' },
        { value: 'channel', label: 'Channel Strategy' },
        { value: 'timing', label: 'Timing / Seasonality' },
        { value: 'competitive', label: 'Competitive Response' },
        { value: 'custom', label: 'Custom Scenario' }
      ],
      riskLevels: [
        { value: 'low', label: 'Low Risk' },
        { value: 'medium', label: 'Medium Risk' },
        { value: 'high', label: 'High Risk' }
      ],
      variableCategories: [
        { value: 'promotion', label: 'Promotion Parameters' },
        { value: 'pricing', label: 'Pricing' },
        { value: 'volume', label: 'Volume / Distribution' },
        { value: 'timing', label: 'Timing' },
        { value: 'market', label: 'Market Conditions' },
        { value: 'cost', label: 'Cost Structure' }
      ],
      variableTypes: [
        { value: 'numeric', label: 'Numeric' },
        { value: 'percentage', label: 'Percentage' },
        { value: 'currency', label: 'Currency' },
        { value: 'boolean', label: 'Yes/No' }
      ],
      commonVariables: [
        { name: 'Discount %', category: 'pricing', unit: '%', defaultBase: 15, min: 0, max: 50 },
        { name: 'Trade Spend', category: 'promotion', unit: 'R', defaultBase: 100000, min: 0, max: 5000000 },
        { name: 'Duration (weeks)', category: 'timing', unit: 'weeks', defaultBase: 4, min: 1, max: 52 },
        { name: 'Distribution %', category: 'volume', unit: '%', defaultBase: 70, min: 0, max: 100 },
        { name: 'Display Support', category: 'promotion', unit: 'stores', defaultBase: 50, min: 0, max: 500 },
        { name: 'Price Point', category: 'pricing', unit: 'R', defaultBase: 29.99, min: 0, max: 999 },
        { name: 'Competitor Price', category: 'market', unit: 'R', defaultBase: 32.99, min: 0, max: 999 },
        { name: 'COGS per Unit', category: 'cost', unit: 'R', defaultBase: 12, min: 0, max: 500 },
        { name: 'Media Spend', category: 'promotion', unit: 'R', defaultBase: 50000, min: 0, max: 2000000 },
        { name: 'Baseline Volume', category: 'volume', unit: 'units', defaultBase: 10000, min: 0, max: 1000000 }
      ]
    }
  });
});

// ── GET /summary  Aggregated scenario statistics ──────────────────────────
scenarios.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);

    const stats = await db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_count,
        SUM(CASE WHEN status = 'simulated' THEN 1 ELSE 0 END) as simulated_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN is_favorite = 1 THEN 1 ELSE 0 END) as favorite_count,
        AVG(projected_roi) as avg_roi,
        AVG(projected_lift_pct) as avg_lift,
        SUM(projected_spend) as total_projected_spend,
        SUM(projected_revenue) as total_projected_revenue,
        SUM(projected_incremental_revenue) as total_incremental_revenue,
        SUM(projected_net_profit) as total_net_profit,
        AVG(confidence_score) as avg_confidence
      FROM scenarios WHERE company_id = ?
    `).bind(companyId).first();

    const byType = await db.prepare(`
      SELECT scenario_type, COUNT(*) as count, AVG(projected_roi) as avg_roi, AVG(projected_lift_pct) as avg_lift
      FROM scenarios WHERE company_id = ?
      GROUP BY scenario_type ORDER BY count DESC
    `).bind(companyId).all();

    const byRisk = await db.prepare(`
      SELECT risk_level, COUNT(*) as count
      FROM scenarios WHERE company_id = ?
      GROUP BY risk_level
    `).bind(companyId).all();

    return c.json({
      success: true,
      data: {
        total: stats?.total || 0,
        draftCount: stats?.draft_count || 0,
        simulatedCount: stats?.simulated_count || 0,
        approvedCount: stats?.approved_count || 0,
        rejectedCount: stats?.rejected_count || 0,
        favoriteCount: stats?.favorite_count || 0,
        avgRoi: Math.round((stats?.avg_roi || 0) * 100) / 100,
        avgLift: Math.round((stats?.avg_lift || 0) * 100) / 100,
        totalProjectedSpend: stats?.total_projected_spend || 0,
        totalProjectedRevenue: stats?.total_projected_revenue || 0,
        totalIncrementalRevenue: stats?.total_incremental_revenue || 0,
        totalNetProfit: stats?.total_net_profit || 0,
        avgConfidence: Math.round((stats?.avg_confidence || 0) * 100) / 100,
        byType: (byType.results || []).map(r => ({
          type: r.scenario_type,
          count: r.count,
          avgRoi: Math.round((r.avg_roi || 0) * 100) / 100,
          avgLift: Math.round((r.avg_lift || 0) * 100) / 100
        })),
        byRisk: (byRisk.results || []).map(r => ({
          level: r.risk_level,
          count: r.count
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching scenario summary:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /compare  Compare two scenarios ──────────────────────────────────
scenarios.get('/compare', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { scenario_a, scenario_b } = c.req.query();

    if (!scenario_a || !scenario_b) {
      return c.json({ success: false, message: 'Both scenario_a and scenario_b are required' }, 400);
    }

    const [a, b] = await Promise.all([
      db.prepare('SELECT * FROM scenarios WHERE id = ? AND company_id = ?').bind(scenario_a, companyId).first(),
      db.prepare('SELECT * FROM scenarios WHERE id = ? AND company_id = ?').bind(scenario_b, companyId).first()
    ]);

    if (!a || !b) {
      return c.json({ success: false, message: 'One or both scenarios not found' }, 404);
    }

    const [aVars, bVars, aResults, bResults] = await Promise.all([
      db.prepare('SELECT * FROM scenario_variables WHERE scenario_id = ? ORDER BY sort_order').bind(scenario_a).all(),
      db.prepare('SELECT * FROM scenario_variables WHERE scenario_id = ? ORDER BY sort_order').bind(scenario_b).all(),
      db.prepare('SELECT * FROM scenario_results WHERE scenario_id = ? ORDER BY sort_order').bind(scenario_a).all(),
      db.prepare('SELECT * FROM scenario_results WHERE scenario_id = ? ORDER BY sort_order').bind(scenario_b).all()
    ]);

    return c.json({
      success: true,
      data: {
        scenarioA: {
          ...rowToDocument(a),
          variables: (aVars.results || []).map(rowToDocument),
          results: (aResults.results || []).map(rowToDocument)
        },
        scenarioB: {
          ...rowToDocument(b),
          variables: (bVars.results || []).map(rowToDocument),
          results: (bResults.results || []).map(rowToDocument)
        },
        comparison: {
          revenueVariance: (b.projected_revenue || 0) - (a.projected_revenue || 0),
          roiVariance: (b.projected_roi || 0) - (a.projected_roi || 0),
          spendVariance: (b.projected_spend || 0) - (a.projected_spend || 0),
          liftVariance: (b.projected_lift_pct || 0) - (a.projected_lift_pct || 0),
          profitVariance: (b.projected_net_profit || 0) - (a.projected_net_profit || 0)
        }
      }
    });
  } catch (error) {
    console.error('Error comparing scenarios:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /  List scenarios ────────────────────────────────────────────────
scenarios.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { scenario_type, status, customer_id, product_id, risk_level, is_favorite, limit = 200, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM scenarios WHERE company_id = ?';
    const params = [companyId];

    if (scenario_type) { query += ' AND scenario_type = ?'; params.push(scenario_type); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (customer_id) { query += ' AND customer_id = ?'; params.push(customer_id); }
    if (product_id) { query += ' AND product_id = ?'; params.push(product_id); }
    if (risk_level) { query += ' AND risk_level = ?'; params.push(risk_level); }
    if (is_favorite) { query += ' AND is_favorite = ?'; params.push(parseInt(is_favorite)); }

    query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();

    const countResult = await db.prepare(
      'SELECT COUNT(*) as total FROM scenarios WHERE company_id = ?'
    ).bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /:id  Get scenario with variables and results ────────────────────
scenarios.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const scenario = await db.prepare(
      'SELECT * FROM scenarios WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!scenario) {
      return c.json({ success: false, message: 'Scenario not found' }, 404);
    }

    const [variables, results] = await Promise.all([
      db.prepare('SELECT * FROM scenario_variables WHERE scenario_id = ? ORDER BY sort_order').bind(id).all(),
      db.prepare('SELECT * FROM scenario_results WHERE scenario_id = ? ORDER BY sort_order').bind(id).all()
    ]);

    return c.json({
      success: true,
      data: {
        ...rowToDocument(scenario),
        variables: (variables.results || []).map(rowToDocument),
        results: (results.results || []).map(rowToDocument)
      }
    });
  } catch (error) {
    console.error('Error fetching scenario:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /  Create scenario ──────────────────────────────────────────────
scenarios.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const userId = getUserId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    if (!body.name) {
      return c.json({ success: false, message: 'Scenario name is required' }, 400);
    }

    await db.prepare(`
      INSERT INTO scenarios (
        id, company_id, name, description, scenario_type, status,
        base_promotion_id, base_promotion_name, base_budget_id, base_budget_name,
        customer_id, customer_name, product_id, product_name,
        category, brand, channel, region, start_date, end_date,
        baseline_revenue, baseline_units, baseline_margin_pct,
        projected_revenue, projected_units, projected_spend,
        projected_roi, projected_lift_pct, projected_margin_pct,
        projected_incremental_revenue, projected_incremental_units, projected_net_profit,
        confidence_score, risk_level, recommendation,
        comparison_scenario_id, is_favorite, tags, notes, created_by, data,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId,
      body.name,
      body.description || null,
      body.scenarioType || body.scenario_type || 'promotion',
      body.status || 'draft',
      body.basePromotionId || body.base_promotion_id || null,
      body.basePromotionName || body.base_promotion_name || null,
      body.baseBudgetId || body.base_budget_id || null,
      body.baseBudgetName || body.base_budget_name || null,
      body.customerId || body.customer_id || null,
      body.customerName || body.customer_name || null,
      body.productId || body.product_id || null,
      body.productName || body.product_name || null,
      body.category || null,
      body.brand || null,
      body.channel || null,
      body.region || null,
      body.startDate || body.start_date || null,
      body.endDate || body.end_date || null,
      body.baselineRevenue || body.baseline_revenue || 0,
      body.baselineUnits || body.baseline_units || 0,
      body.baselineMarginPct || body.baseline_margin_pct || 0,
      body.projectedRevenue || body.projected_revenue || 0,
      body.projectedUnits || body.projected_units || 0,
      body.projectedSpend || body.projected_spend || 0,
      body.projectedRoi || body.projected_roi || 0,
      body.projectedLiftPct || body.projected_lift_pct || 0,
      body.projectedMarginPct || body.projected_margin_pct || 0,
      body.projectedIncrementalRevenue || body.projected_incremental_revenue || 0,
      body.projectedIncrementalUnits || body.projected_incremental_units || 0,
      body.projectedNetProfit || body.projected_net_profit || 0,
      body.confidenceScore || body.confidence_score || 0,
      body.riskLevel || body.risk_level || 'medium',
      body.recommendation || null,
      body.comparisonScenarioId || body.comparison_scenario_id || null,
      body.isFavorite || body.is_favorite ? 1 : 0,
      body.tags || null,
      body.notes || null,
      userId,
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    if (body.variables && Array.isArray(body.variables)) {
      for (let i = 0; i < body.variables.length; i++) {
        const v = body.variables[i];
        const vid = generateId();
        await db.prepare(`
          INSERT INTO scenario_variables (
            id, company_id, scenario_id, variable_name, variable_type, category,
            base_value, adjusted_value, change_pct, min_value, max_value, step_size,
            unit, impact_on_revenue, impact_on_units, impact_on_roi, sensitivity,
            sort_order, notes, data, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          vid, companyId, id,
          v.variableName || v.variable_name || v.name || '',
          v.variableType || v.variable_type || 'numeric',
          v.category || 'promotion',
          v.baseValue || v.base_value || 0,
          v.adjustedValue || v.adjusted_value || 0,
          v.changePct || v.change_pct || 0,
          v.minValue || v.min_value || null,
          v.maxValue || v.max_value || null,
          v.stepSize || v.step_size || 1,
          v.unit || null,
          v.impactOnRevenue || v.impact_on_revenue || 0,
          v.impactOnUnits || v.impact_on_units || 0,
          v.impactOnRoi || v.impact_on_roi || 0,
          v.sensitivity || 0,
          i,
          v.notes || null,
          JSON.stringify(v.data || {}),
          now, now
        ).run();
      }
    }

    const created = await db.prepare(
      'SELECT * FROM scenarios WHERE id = ?'
    ).bind(id).first();

    return c.json({ success: true, data: rowToDocument(created), message: 'Scenario created' }, 201);
  } catch (error) {
    console.error('Error creating scenario:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── PUT /:id  Update scenario ────────────────────────────────────────────
scenarios.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare(
      'SELECT * FROM scenarios WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'Scenario not found' }, 404);
    }

    await db.prepare(`
      UPDATE scenarios SET
        name = ?, description = ?, scenario_type = ?, status = ?,
        base_promotion_id = ?, base_promotion_name = ?,
        base_budget_id = ?, base_budget_name = ?,
        customer_id = ?, customer_name = ?, product_id = ?, product_name = ?,
        category = ?, brand = ?, channel = ?, region = ?,
        start_date = ?, end_date = ?,
        baseline_revenue = ?, baseline_units = ?, baseline_margin_pct = ?,
        projected_revenue = ?, projected_units = ?, projected_spend = ?,
        projected_roi = ?, projected_lift_pct = ?, projected_margin_pct = ?,
        projected_incremental_revenue = ?, projected_incremental_units = ?, projected_net_profit = ?,
        confidence_score = ?, risk_level = ?, recommendation = ?,
        comparison_scenario_id = ?, is_favorite = ?, tags = ?, notes = ?,
        data = ?, updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(
      body.name || existing.name,
      body.description !== undefined ? body.description : existing.description,
      body.scenarioType || body.scenario_type || existing.scenario_type,
      body.status || existing.status,
      body.basePromotionId || body.base_promotion_id || existing.base_promotion_id,
      body.basePromotionName || body.base_promotion_name || existing.base_promotion_name,
      body.baseBudgetId || body.base_budget_id || existing.base_budget_id,
      body.baseBudgetName || body.base_budget_name || existing.base_budget_name,
      body.customerId || body.customer_id || existing.customer_id,
      body.customerName || body.customer_name || existing.customer_name,
      body.productId || body.product_id || existing.product_id,
      body.productName || body.product_name || existing.product_name,
      body.category !== undefined ? body.category : existing.category,
      body.brand !== undefined ? body.brand : existing.brand,
      body.channel !== undefined ? body.channel : existing.channel,
      body.region !== undefined ? body.region : existing.region,
      body.startDate || body.start_date || existing.start_date,
      body.endDate || body.end_date || existing.end_date,
      body.baselineRevenue !== undefined ? body.baselineRevenue : (body.baseline_revenue !== undefined ? body.baseline_revenue : existing.baseline_revenue),
      body.baselineUnits !== undefined ? body.baselineUnits : (body.baseline_units !== undefined ? body.baseline_units : existing.baseline_units),
      body.baselineMarginPct !== undefined ? body.baselineMarginPct : (body.baseline_margin_pct !== undefined ? body.baseline_margin_pct : existing.baseline_margin_pct),
      body.projectedRevenue !== undefined ? body.projectedRevenue : (body.projected_revenue !== undefined ? body.projected_revenue : existing.projected_revenue),
      body.projectedUnits !== undefined ? body.projectedUnits : (body.projected_units !== undefined ? body.projected_units : existing.projected_units),
      body.projectedSpend !== undefined ? body.projectedSpend : (body.projected_spend !== undefined ? body.projected_spend : existing.projected_spend),
      body.projectedRoi !== undefined ? body.projectedRoi : (body.projected_roi !== undefined ? body.projected_roi : existing.projected_roi),
      body.projectedLiftPct !== undefined ? body.projectedLiftPct : (body.projected_lift_pct !== undefined ? body.projected_lift_pct : existing.projected_lift_pct),
      body.projectedMarginPct !== undefined ? body.projectedMarginPct : (body.projected_margin_pct !== undefined ? body.projected_margin_pct : existing.projected_margin_pct),
      body.projectedIncrementalRevenue !== undefined ? body.projectedIncrementalRevenue : (body.projected_incremental_revenue !== undefined ? body.projected_incremental_revenue : existing.projected_incremental_revenue),
      body.projectedIncrementalUnits !== undefined ? body.projectedIncrementalUnits : (body.projected_incremental_units !== undefined ? body.projected_incremental_units : existing.projected_incremental_units),
      body.projectedNetProfit !== undefined ? body.projectedNetProfit : (body.projected_net_profit !== undefined ? body.projected_net_profit : existing.projected_net_profit),
      body.confidenceScore !== undefined ? body.confidenceScore : (body.confidence_score !== undefined ? body.confidence_score : existing.confidence_score),
      body.riskLevel || body.risk_level || existing.risk_level,
      body.recommendation !== undefined ? body.recommendation : existing.recommendation,
      body.comparisonScenarioId || body.comparison_scenario_id || existing.comparison_scenario_id,
      body.isFavorite !== undefined ? (body.isFavorite ? 1 : 0) : (body.is_favorite !== undefined ? (body.is_favorite ? 1 : 0) : existing.is_favorite),
      body.tags !== undefined ? body.tags : existing.tags,
      body.notes !== undefined ? body.notes : existing.notes,
      JSON.stringify(body.data || (existing.data ? JSON.parse(existing.data) : {})),
      now,
      id, companyId
    ).run();

    const updated = await db.prepare('SELECT * FROM scenarios WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated), message: 'Scenario updated' });
  } catch (error) {
    console.error('Error updating scenario:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── DELETE /:id  Delete scenario and related data ────────────────────────
scenarios.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const existing = await db.prepare(
      'SELECT * FROM scenarios WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'Scenario not found' }, 404);
    }

    await db.prepare('DELETE FROM scenario_results WHERE scenario_id = ?').bind(id).run();
    await db.prepare('DELETE FROM scenario_variables WHERE scenario_id = ?').bind(id).run();
    await db.prepare('DELETE FROM scenarios WHERE id = ? AND company_id = ?').bind(id, companyId).run();

    return c.json({ success: true, message: 'Scenario and related data deleted' });
  } catch (error) {
    console.error('Error deleting scenario:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// SIMULATE — Run what-if simulation
// ═══════════════════════════════════════════════════════════════════════

scenarios.post('/:id/simulate', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();

    const scenario = await db.prepare(
      'SELECT * FROM scenarios WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!scenario) {
      return c.json({ success: false, message: 'Scenario not found' }, 404);
    }

    const varsResult = await db.prepare(
      'SELECT * FROM scenario_variables WHERE scenario_id = ? ORDER BY sort_order'
    ).bind(id).all();
    const variables = varsResult.results || [];

    const baseRevenue = scenario.baseline_revenue || 1000000;
    const baseUnits = scenario.baseline_units || 10000;
    const baseMargin = scenario.baseline_margin_pct || 25;

    let revenueMultiplier = 1;
    let unitsMultiplier = 1;
    let spendTotal = scenario.projected_spend || 0;

    for (const v of variables) {
      const changePct = v.change_pct || 0;
      const cat = v.category || '';

      if (cat === 'pricing') {
        revenueMultiplier *= (1 + changePct / 100 * -0.8);
        unitsMultiplier *= (1 + changePct / 100 * 1.2);
      } else if (cat === 'promotion') {
        revenueMultiplier *= (1 + changePct / 100 * 0.6);
        unitsMultiplier *= (1 + changePct / 100 * 0.7);
        spendTotal += (v.adjusted_value || 0) - (v.base_value || 0);
      } else if (cat === 'volume') {
        unitsMultiplier *= (1 + changePct / 100 * 0.9);
        revenueMultiplier *= (1 + changePct / 100 * 0.5);
      } else if (cat === 'timing') {
        revenueMultiplier *= (1 + changePct / 100 * 0.3);
      } else if (cat === 'market') {
        revenueMultiplier *= (1 + changePct / 100 * -0.4);
      }
    }

    const projectedRevenue = baseRevenue * revenueMultiplier;
    const projectedUnits = baseUnits * unitsMultiplier;
    const incrementalRevenue = projectedRevenue - baseRevenue;
    const incrementalUnits = projectedUnits - baseUnits;
    const liftPct = baseRevenue > 0 ? (incrementalRevenue / baseRevenue) * 100 : 0;
    const roi = spendTotal > 0 ? (incrementalRevenue / spendTotal) * 100 : 0;
    const marginPct = projectedRevenue > 0 ? baseMargin * (1 - Math.abs(liftPct) / 200) : 0;
    const netProfit = projectedRevenue * (marginPct / 100) - spendTotal;
    const confidence = Math.max(20, 95 - variables.length * 5 - Math.abs(liftPct) * 0.5);
    const riskLevel = Math.abs(liftPct) > 30 ? 'high' : (Math.abs(liftPct) > 15 ? 'medium' : 'low');

    let recommendation = '';
    if (roi > 200 && liftPct > 10) recommendation = 'Strong positive scenario — recommend approval';
    else if (roi > 100 && liftPct > 5) recommendation = 'Positive outlook — proceed with caution';
    else if (roi > 50) recommendation = 'Moderate returns — consider alternative scenarios';
    else if (roi > 0) recommendation = 'Marginal returns — review variable assumptions';
    else recommendation = 'Negative ROI — not recommended in current form';

    await db.prepare(`
      UPDATE scenarios SET
        status = 'simulated',
        projected_revenue = ?, projected_units = ?, projected_spend = ?,
        projected_roi = ?, projected_lift_pct = ?, projected_margin_pct = ?,
        projected_incremental_revenue = ?, projected_incremental_units = ?,
        projected_net_profit = ?, confidence_score = ?, risk_level = ?,
        recommendation = ?, updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(
      Math.round(projectedRevenue * 100) / 100,
      Math.round(projectedUnits),
      Math.round(spendTotal * 100) / 100,
      Math.round(roi * 100) / 100,
      Math.round(liftPct * 100) / 100,
      Math.round(marginPct * 100) / 100,
      Math.round(incrementalRevenue * 100) / 100,
      Math.round(incrementalUnits),
      Math.round(netProfit * 100) / 100,
      Math.round(confidence * 100) / 100,
      riskLevel,
      recommendation,
      now,
      id, companyId
    ).run();

    await db.prepare('DELETE FROM scenario_results WHERE scenario_id = ?').bind(id).run();

    const metrics = [
      { name: 'Projected Revenue', value: projectedRevenue, baseline: baseRevenue, type: 'simulation' },
      { name: 'Projected Units', value: projectedUnits, baseline: baseUnits, type: 'simulation' },
      { name: 'Trade Spend', value: spendTotal, baseline: scenario.projected_spend || 0, type: 'simulation' },
      { name: 'ROI', value: roi, baseline: 0, type: 'simulation' },
      { name: 'Revenue Lift %', value: liftPct, baseline: 0, type: 'simulation' },
      { name: 'Margin %', value: marginPct, baseline: baseMargin, type: 'simulation' },
      { name: 'Incremental Revenue', value: incrementalRevenue, baseline: 0, type: 'simulation' },
      { name: 'Net Profit', value: netProfit, baseline: 0, type: 'simulation' },
      { name: 'Confidence Score', value: confidence, baseline: 0, type: 'confidence' }
    ];

    for (let i = 0; i < metrics.length; i++) {
      const m = metrics[i];
      const variance = m.value - m.baseline;
      const variancePct = m.baseline !== 0 ? (variance / Math.abs(m.baseline)) * 100 : 0;
      await db.prepare(`
        INSERT INTO scenario_results (
          id, company_id, scenario_id, result_type, metric_name, metric_value,
          baseline_value, variance, variance_pct, confidence_pct, sort_order,
          data, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        generateId(), companyId, id, m.type, m.name,
        Math.round(m.value * 100) / 100,
        Math.round(m.baseline * 100) / 100,
        Math.round(variance * 100) / 100,
        Math.round(variancePct * 100) / 100,
        Math.round(confidence * 100) / 100,
        i, '{}', now, now
      ).run();
    }

    for (const v of variables) {
      const changePct = v.change_pct || 0;
      let revImpact = 0;
      let unitImpact = 0;
      const cat = v.category || '';
      if (cat === 'pricing') { revImpact = baseRevenue * changePct / 100 * -0.8; unitImpact = baseUnits * changePct / 100 * 1.2; }
      else if (cat === 'promotion') { revImpact = baseRevenue * changePct / 100 * 0.6; unitImpact = baseUnits * changePct / 100 * 0.7; }
      else if (cat === 'volume') { revImpact = baseRevenue * changePct / 100 * 0.5; unitImpact = baseUnits * changePct / 100 * 0.9; }

      await db.prepare(`
        UPDATE scenario_variables SET
          impact_on_revenue = ?, impact_on_units = ?,
          impact_on_roi = ?, sensitivity = ?, updated_at = ?
        WHERE id = ?
      `).bind(
        Math.round(revImpact * 100) / 100,
        Math.round(unitImpact),
        spendTotal > 0 ? Math.round(revImpact / spendTotal * 10000) / 100 : 0,
        Math.abs(changePct) > 0 ? Math.round(Math.abs(revImpact / (changePct * baseRevenue / 100)) * 100) / 100 : 0,
        now, v.id
      ).run();
    }

    const updated = await db.prepare('SELECT * FROM scenarios WHERE id = ?').bind(id).first();
    const updatedVars = await db.prepare('SELECT * FROM scenario_variables WHERE scenario_id = ? ORDER BY sort_order').bind(id).all();
    const updatedResults = await db.prepare('SELECT * FROM scenario_results WHERE scenario_id = ? ORDER BY sort_order').bind(id).all();

    return c.json({
      success: true,
      data: {
        ...rowToDocument(updated),
        variables: (updatedVars.results || []).map(rowToDocument),
        results: (updatedResults.results || []).map(rowToDocument)
      },
      message: 'Simulation complete'
    });
  } catch (error) {
    console.error('Error running simulation:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// VARIABLES
// ═══════════════════════════════════════════════════════════════════════

// ── GET /:id/variables  List variables for a scenario ────────────────────
scenarios.get('/:id/variables', async (c) => {
  try {
    const db = c.env.DB;
    const { id } = c.req.param();

    const result = await db.prepare(
      'SELECT * FROM scenario_variables WHERE scenario_id = ? ORDER BY sort_order'
    ).bind(id).all();

    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    console.error('Error fetching variables:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /:id/variables  Add variable to scenario ───────────────────────
scenarios.post('/:id/variables', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const vid = generateId();
    const now = new Date().toISOString();

    const countResult = await db.prepare(
      'SELECT COUNT(*) as count FROM scenario_variables WHERE scenario_id = ?'
    ).bind(id).first();

    const baseVal = body.baseValue || body.base_value || 0;
    const adjVal = body.adjustedValue || body.adjusted_value || baseVal;
    const changePct = baseVal > 0 ? ((adjVal - baseVal) / baseVal) * 100 : 0;

    await db.prepare(`
      INSERT INTO scenario_variables (
        id, company_id, scenario_id, variable_name, variable_type, category,
        base_value, adjusted_value, change_pct, min_value, max_value, step_size,
        unit, sort_order, notes, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      vid, companyId, id,
      body.variableName || body.variable_name || body.name || '',
      body.variableType || body.variable_type || 'numeric',
      body.category || 'promotion',
      baseVal, adjVal,
      Math.round(changePct * 100) / 100,
      body.minValue || body.min_value || null,
      body.maxValue || body.max_value || null,
      body.stepSize || body.step_size || 1,
      body.unit || null,
      countResult?.count || 0,
      body.notes || null,
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM scenario_variables WHERE id = ?').bind(vid).first();
    return c.json({ success: true, data: rowToDocument(created), message: 'Variable added' }, 201);
  } catch (error) {
    console.error('Error adding variable:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── PUT /:id/variables/:varId  Update variable ──────────────────────────
scenarios.put('/:id/variables/:varId', async (c) => {
  try {
    const db = c.env.DB;
    const { varId } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare(
      'SELECT * FROM scenario_variables WHERE id = ?'
    ).bind(varId).first();

    if (!existing) {
      return c.json({ success: false, message: 'Variable not found' }, 404);
    }

    const baseVal = body.baseValue !== undefined ? body.baseValue : (body.base_value !== undefined ? body.base_value : existing.base_value);
    const adjVal = body.adjustedValue !== undefined ? body.adjustedValue : (body.adjusted_value !== undefined ? body.adjusted_value : existing.adjusted_value);
    const changePct = baseVal > 0 ? ((adjVal - baseVal) / baseVal) * 100 : 0;

    await db.prepare(`
      UPDATE scenario_variables SET
        variable_name = ?, variable_type = ?, category = ?,
        base_value = ?, adjusted_value = ?, change_pct = ?,
        min_value = ?, max_value = ?, step_size = ?,
        unit = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.variableName || body.variable_name || body.name || existing.variable_name,
      body.variableType || body.variable_type || existing.variable_type,
      body.category || existing.category,
      baseVal, adjVal,
      Math.round(changePct * 100) / 100,
      body.minValue || body.min_value || existing.min_value,
      body.maxValue || body.max_value || existing.max_value,
      body.stepSize || body.step_size || existing.step_size,
      body.unit || existing.unit,
      body.notes !== undefined ? body.notes : existing.notes,
      now, varId
    ).run();

    const updated = await db.prepare('SELECT * FROM scenario_variables WHERE id = ?').bind(varId).first();
    return c.json({ success: true, data: rowToDocument(updated), message: 'Variable updated' });
  } catch (error) {
    console.error('Error updating variable:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── DELETE /:id/variables/:varId  Delete variable ────────────────────────
scenarios.delete('/:id/variables/:varId', async (c) => {
  try {
    const db = c.env.DB;
    const { varId } = c.req.param();

    await db.prepare('DELETE FROM scenario_variables WHERE id = ?').bind(varId).run();
    return c.json({ success: true, message: 'Variable deleted' });
  } catch (error) {
    console.error('Error deleting variable:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════════════════════════════════════

scenarios.get('/:id/results', async (c) => {
  try {
    const db = c.env.DB;
    const { id } = c.req.param();

    const result = await db.prepare(
      'SELECT * FROM scenario_results WHERE scenario_id = ? ORDER BY sort_order'
    ).bind(id).all();

    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    console.error('Error fetching results:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export { scenarios as scenarioRoutes };
