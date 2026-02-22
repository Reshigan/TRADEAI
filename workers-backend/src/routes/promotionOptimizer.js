import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const promotionOptimizer = new Hono();

promotionOptimizer.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
};

const getUserId = (c) => {
  return c.get('userId') || null;
};

// ═══════════════════════════════════════════════════════════════════════
// OPTIONS
// ═══════════════════════════════════════════════════════════════════════

promotionOptimizer.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      optimizationTypes: [
        { value: 'roi_maximize', label: 'Maximize ROI' },
        { value: 'revenue_maximize', label: 'Maximize Revenue' },
        { value: 'profit_maximize', label: 'Maximize Net Profit' },
        { value: 'volume_maximize', label: 'Maximize Volume' },
        { value: 'budget_optimize', label: 'Optimize Budget Allocation' },
        { value: 'timing_optimize', label: 'Optimize Timing' },
        { value: 'mix_optimize', label: 'Optimize Promotion Mix' },
        { value: 'multi_objective', label: 'Multi-Objective Optimization' }
      ],
      objectives: [
        { value: 'maximize_roi', label: 'Maximize ROI' },
        { value: 'maximize_revenue', label: 'Maximize Revenue' },
        { value: 'maximize_profit', label: 'Maximize Net Profit' },
        { value: 'maximize_volume', label: 'Maximize Unit Volume' },
        { value: 'minimize_spend', label: 'Minimize Trade Spend' },
        { value: 'maximize_lift', label: 'Maximize Promotion Lift' }
      ],
      constraintTypes: [
        { value: 'budget', label: 'Budget Limit' },
        { value: 'roi', label: 'Minimum ROI' },
        { value: 'lift', label: 'Minimum Lift %' },
        { value: 'discount', label: 'Maximum Discount %' },
        { value: 'frequency', label: 'Promotion Frequency' },
        { value: 'margin', label: 'Minimum Margin %' },
        { value: 'duration', label: 'Duration Constraint' },
        { value: 'overlap', label: 'No Overlap Rule' }
      ],
      operators: [
        { value: 'lte', label: '<= (less than or equal)' },
        { value: 'gte', label: '>= (greater than or equal)' },
        { value: 'eq', label: '= (equal to)' },
        { value: 'between', label: 'Between' }
      ],
      recommendationTypes: [
        { value: 'promotion', label: 'Promotion Change' },
        { value: 'pricing', label: 'Pricing Adjustment' },
        { value: 'timing', label: 'Timing Shift' },
        { value: 'budget', label: 'Budget Reallocation' },
        { value: 'channel', label: 'Channel Strategy' },
        { value: 'product', label: 'Product Focus' },
        { value: 'mechanic', label: 'Mechanic Change' }
      ],
      riskLevels: [
        { value: 'low', label: 'Low Risk' },
        { value: 'medium', label: 'Medium Risk' },
        { value: 'high', label: 'High Risk' }
      ]
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════

promotionOptimizer.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);

    const stats = await db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_count,
        SUM(CASE WHEN status = 'optimized' THEN 1 ELSE 0 END) as optimized_count,
        SUM(CASE WHEN status = 'applied' THEN 1 ELSE 0 END) as applied_count,
        AVG(optimized_roi) as avg_roi,
        AVG(optimized_lift_pct) as avg_lift,
        AVG(improvement_pct) as avg_improvement,
        SUM(optimized_spend) as total_spend,
        SUM(optimized_revenue) as total_revenue,
        SUM(optimized_incremental_revenue) as total_incremental,
        SUM(optimized_net_profit) as total_profit,
        AVG(confidence_score) as avg_confidence
      FROM promotion_optimizations WHERE company_id = ?
    `).bind(companyId).first();

    const recStats = await db.prepare(`
      SELECT
        COUNT(*) as total_recs,
        SUM(CASE WHEN action_taken = 'pending' THEN 1 ELSE 0 END) as pending_recs,
        SUM(CASE WHEN action_taken = 'applied' THEN 1 ELSE 0 END) as applied_recs,
        SUM(CASE WHEN action_taken = 'dismissed' THEN 1 ELSE 0 END) as dismissed_recs,
        SUM(expected_impact_revenue) as total_impact_revenue,
        AVG(confidence) as avg_rec_confidence
      FROM optimization_recommendations WHERE company_id = ?
    `).bind(companyId).first();

    return c.json({
      success: true,
      data: {
        total: stats?.total || 0,
        draftCount: stats?.draft_count || 0,
        optimizedCount: stats?.optimized_count || 0,
        appliedCount: stats?.applied_count || 0,
        avgRoi: Math.round((stats?.avg_roi || 0) * 100) / 100,
        avgLift: Math.round((stats?.avg_lift || 0) * 100) / 100,
        avgImprovement: Math.round((stats?.avg_improvement || 0) * 100) / 100,
        totalSpend: stats?.total_spend || 0,
        totalRevenue: stats?.total_revenue || 0,
        totalIncremental: stats?.total_incremental || 0,
        totalProfit: stats?.total_profit || 0,
        avgConfidence: Math.round((stats?.avg_confidence || 0) * 100) / 100,
        recommendations: {
          total: recStats?.total_recs || 0,
          pending: recStats?.pending_recs || 0,
          applied: recStats?.applied_recs || 0,
          dismissed: recStats?.dismissed_recs || 0,
          totalImpactRevenue: recStats?.total_impact_revenue || 0,
          avgConfidence: Math.round((recStats?.avg_rec_confidence || 0) * 100) / 100
        }
      }
    });
  } catch (error) {
    console.error('Error fetching optimization summary:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// OPTIMIZATIONS CRUD
// ═══════════════════════════════════════════════════════════════════════

promotionOptimizer.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { optimization_type, status, customer_id, product_id, limit = 200, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM promotion_optimizations WHERE company_id = ?';
    const params = [companyId];

    if (optimization_type) { query += ' AND optimization_type = ?'; params.push(optimization_type); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (customer_id) { query += ' AND customer_id = ?'; params.push(customer_id); }
    if (product_id) { query += ' AND product_id = ?'; params.push(product_id); }

    query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare(
      'SELECT COUNT(*) as total FROM promotion_optimizations WHERE company_id = ?'
    ).bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching optimizations:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

promotionOptimizer.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const opt = await db.prepare(
      'SELECT * FROM promotion_optimizations WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!opt) {
      return c.json({ success: false, message: 'Optimization not found' }, 404);
    }

    const [recs, constraints] = await Promise.all([
      db.prepare('SELECT * FROM optimization_recommendations WHERE optimization_id = ? ORDER BY priority, sort_order').bind(id).all(),
      db.prepare('SELECT * FROM optimization_constraints WHERE optimization_id = ? ORDER BY sort_order').bind(id).all()
    ]);

    return c.json({
      success: true,
      data: {
        ...rowToDocument(opt),
        recommendations: (recs.results || []).map(rowToDocument),
        constraints: (constraints.results || []).map(rowToDocument)
      }
    });
  } catch (error) {
    console.error('Error fetching optimization:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

promotionOptimizer.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const userId = getUserId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    if (!body.name) {
      return c.json({ success: false, message: 'Optimization name is required' }, 400);
    }

    await db.prepare(`
      INSERT INTO promotion_optimizations (
        id, company_id, name, description, optimization_type, status, objective,
        customer_id, customer_name, product_id, product_name,
        category, brand, channel, region, start_date, end_date,
        budget_limit, min_roi_threshold, min_lift_threshold, max_discount_pct,
        baseline_revenue, baseline_units, baseline_margin_pct,
        created_by, notes, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId,
      body.name,
      body.description || null,
      body.optimizationType || body.optimization_type || 'roi_maximize',
      'draft',
      body.objective || 'maximize_roi',
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
      body.budgetLimit || body.budget_limit || 0,
      body.minRoiThreshold || body.min_roi_threshold || 0,
      body.minLiftThreshold || body.min_lift_threshold || 0,
      body.maxDiscountPct || body.max_discount_pct || 50,
      body.baselineRevenue || body.baseline_revenue || 0,
      body.baselineUnits || body.baseline_units || 0,
      body.baselineMarginPct || body.baseline_margin_pct || 0,
      userId,
      body.notes || null,
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    if (body.constraints && Array.isArray(body.constraints)) {
      for (let i = 0; i < body.constraints.length; i++) {
        const con = body.constraints[i];
        await db.prepare(`
          INSERT INTO optimization_constraints (
            id, company_id, optimization_id, constraint_name, constraint_type,
            operator, threshold_value, severity, sort_order, notes, data, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          generateId(), companyId, id,
          con.constraintName || con.constraint_name || con.name || '',
          con.constraintType || con.constraint_type || 'budget',
          con.operator || 'lte',
          con.thresholdValue || con.threshold_value || 0,
          con.severity || 'warning',
          i, con.notes || null, JSON.stringify(con.data || {}), now, now
        ).run();
      }
    }

    const created = await db.prepare('SELECT * FROM promotion_optimizations WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created), message: 'Optimization created' }, 201);
  } catch (error) {
    console.error('Error creating optimization:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

promotionOptimizer.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare(
      'SELECT * FROM promotion_optimizations WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'Optimization not found' }, 404);
    }

    await db.prepare(`
      UPDATE promotion_optimizations SET
        name = ?, description = ?, optimization_type = ?, status = ?, objective = ?,
        customer_id = ?, customer_name = ?, product_id = ?, product_name = ?,
        category = ?, brand = ?, channel = ?, region = ?,
        start_date = ?, end_date = ?,
        budget_limit = ?, min_roi_threshold = ?, min_lift_threshold = ?, max_discount_pct = ?,
        baseline_revenue = ?, baseline_units = ?, baseline_margin_pct = ?,
        notes = ?, data = ?, updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(
      body.name || existing.name,
      body.description !== undefined ? body.description : existing.description,
      body.optimizationType || body.optimization_type || existing.optimization_type,
      body.status || existing.status,
      body.objective || existing.objective,
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
      body.budgetLimit !== undefined ? body.budgetLimit : (body.budget_limit !== undefined ? body.budget_limit : existing.budget_limit),
      body.minRoiThreshold !== undefined ? body.minRoiThreshold : (body.min_roi_threshold !== undefined ? body.min_roi_threshold : existing.min_roi_threshold),
      body.minLiftThreshold !== undefined ? body.minLiftThreshold : (body.min_lift_threshold !== undefined ? body.min_lift_threshold : existing.min_lift_threshold),
      body.maxDiscountPct !== undefined ? body.maxDiscountPct : (body.max_discount_pct !== undefined ? body.max_discount_pct : existing.max_discount_pct),
      body.baselineRevenue !== undefined ? body.baselineRevenue : (body.baseline_revenue !== undefined ? body.baseline_revenue : existing.baseline_revenue),
      body.baselineUnits !== undefined ? body.baselineUnits : (body.baseline_units !== undefined ? body.baseline_units : existing.baseline_units),
      body.baselineMarginPct !== undefined ? body.baselineMarginPct : (body.baseline_margin_pct !== undefined ? body.baseline_margin_pct : existing.baseline_margin_pct),
      body.notes !== undefined ? body.notes : existing.notes,
      JSON.stringify(body.data || (existing.data ? JSON.parse(existing.data) : {})),
      now, id, companyId
    ).run();

    const updated = await db.prepare('SELECT * FROM promotion_optimizations WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated), message: 'Optimization updated' });
  } catch (error) {
    console.error('Error updating optimization:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

promotionOptimizer.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const existing = await db.prepare(
      'SELECT * FROM promotion_optimizations WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'Optimization not found' }, 404);
    }

    await db.prepare('DELETE FROM optimization_constraints WHERE optimization_id = ?').bind(id).run();
    await db.prepare('DELETE FROM optimization_recommendations WHERE optimization_id = ?').bind(id).run();
    await db.prepare('DELETE FROM promotion_optimizations WHERE id = ? AND company_id = ?').bind(id, companyId).run();

    return c.json({ success: true, message: 'Optimization and related data deleted' });
  } catch (error) {
    console.error('Error deleting optimization:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// OPTIMIZE — Run the optimization engine
// ═══════════════════════════════════════════════════════════════════════

promotionOptimizer.post('/:id/optimize', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();

    const opt = await db.prepare(
      'SELECT * FROM promotion_optimizations WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!opt) {
      return c.json({ success: false, message: 'Optimization not found' }, 404);
    }

    const constraintsResult = await db.prepare(
      'SELECT * FROM optimization_constraints WHERE optimization_id = ? ORDER BY sort_order'
    ).bind(id).all();
    const constraints = constraintsResult.results || [];

    const baseRevenue = opt.baseline_revenue || 1000000;
    const baseUnits = opt.baseline_units || 10000;
    const baseMargin = opt.baseline_margin_pct || 25;
    const budgetLimit = opt.budget_limit || baseRevenue * 0.15;
    const objective = opt.objective || 'maximize_roi';

    let optimalSpend = budgetLimit * 0.7;
    let discountPct = Math.min(opt.max_discount_pct || 50, 20);
    let durationWeeks = 4;
    let distributionPct = 75;

    if (objective === 'maximize_roi') {
      optimalSpend = budgetLimit * 0.6;
      discountPct = 15;
      durationWeeks = 3;
    } else if (objective === 'maximize_revenue') {
      optimalSpend = budgetLimit * 0.85;
      discountPct = 25;
      durationWeeks = 5;
    } else if (objective === 'maximize_profit') {
      optimalSpend = budgetLimit * 0.5;
      discountPct = 12;
      durationWeeks = 3;
    } else if (objective === 'maximize_volume') {
      optimalSpend = budgetLimit * 0.8;
      discountPct = 30;
      durationWeeks = 4;
    }

    const liftPct = discountPct * 1.8 + (optimalSpend / baseRevenue) * 100 * 0.5 + durationWeeks * 1.5;
    const optimizedRevenue = baseRevenue * (1 + liftPct / 100);
    const incrementalRevenue = optimizedRevenue - baseRevenue;
    const roi = optimalSpend > 0 ? (incrementalRevenue / optimalSpend) * 100 : 0;
    const marginPct = baseMargin * (1 - discountPct / 100 * 0.4);
    const netProfit = optimizedRevenue * (marginPct / 100) - optimalSpend;
    const confidence = Math.min(95, 60 + (baseRevenue > 0 ? 15 : 0) + (baseUnits > 0 ? 10 : 0) + (budgetLimit > 0 ? 10 : 0));
    const prevRoi = opt.optimized_roi || 0;
    const improvementPct = prevRoi > 0 ? ((roi - prevRoi) / prevRoi) * 100 : 100;

    for (const con of constraints) {
      let violated = 0;
      let currentVal = 0;
      if (con.constraint_type === 'budget') { currentVal = optimalSpend; violated = optimalSpend > con.threshold_value ? 1 : 0; }
      else if (con.constraint_type === 'roi') { currentVal = roi; violated = roi < con.threshold_value ? 1 : 0; }
      else if (con.constraint_type === 'lift') { currentVal = liftPct; violated = liftPct < con.threshold_value ? 1 : 0; }
      else if (con.constraint_type === 'discount') { currentVal = discountPct; violated = discountPct > con.threshold_value ? 1 : 0; }
      else if (con.constraint_type === 'margin') { currentVal = marginPct; violated = marginPct < con.threshold_value ? 1 : 0; }

      await db.prepare(
        'UPDATE optimization_constraints SET current_value = ?, is_violated = ?, updated_at = ? WHERE id = ?'
      ).bind(Math.round(currentVal * 100) / 100, violated, now, con.id).run();
    }

    await db.prepare(`
      UPDATE promotion_optimizations SET
        status = 'optimized', optimized_spend = ?, optimized_revenue = ?,
        optimized_roi = ?, optimized_lift_pct = ?, optimized_margin_pct = ?,
        optimized_incremental_revenue = ?, optimized_net_profit = ?,
        improvement_pct = ?, confidence_score = ?, model_version = ?,
        run_count = run_count + 1, last_run_at = ?, updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(
      Math.round(optimalSpend * 100) / 100,
      Math.round(optimizedRevenue * 100) / 100,
      Math.round(roi * 100) / 100,
      Math.round(liftPct * 100) / 100,
      Math.round(marginPct * 100) / 100,
      Math.round(incrementalRevenue * 100) / 100,
      Math.round(netProfit * 100) / 100,
      Math.round(improvementPct * 100) / 100,
      Math.round(confidence * 100) / 100,
      'v1.0-engine',
      now, now, id, companyId
    ).run();

    await db.prepare('DELETE FROM optimization_recommendations WHERE optimization_id = ?').bind(id).run();

    const recommendations = [
      {
        type: 'pricing', title: 'Optimal Discount Level',
        desc: `Set discount at ${discountPct}% for maximum ${objective.replace('maximize_', '').replace('_', ' ')}`,
        current: opt.max_discount_pct || 50, recommended: discountPct,
        impactRev: incrementalRevenue * 0.4, impactRoi: roi * 0.35, impactUnits: baseUnits * liftPct / 100 * 0.4,
        impactMargin: marginPct - baseMargin, confidence: confidence, risk: discountPct > 25 ? 'high' : discountPct > 15 ? 'medium' : 'low',
        category: 'pricing', rationale: `Analysis of baseline data suggests ${discountPct}% discount optimizes ${objective.replace('maximize_', '').replace('_', ' ')} within budget constraints`
      },
      {
        type: 'budget', title: 'Recommended Trade Spend',
        desc: `Allocate R${Math.round(optimalSpend).toLocaleString()} for this promotion period`,
        current: budgetLimit, recommended: optimalSpend,
        impactRev: incrementalRevenue * 0.3, impactRoi: roi * 0.25, impactUnits: baseUnits * liftPct / 100 * 0.3,
        impactMargin: 0, confidence: confidence * 0.95, risk: optimalSpend > budgetLimit * 0.8 ? 'medium' : 'low',
        category: 'budget', rationale: `Optimal spend level of R${Math.round(optimalSpend).toLocaleString()} balances ROI with revenue goals`
      },
      {
        type: 'timing', title: 'Optimal Duration',
        desc: `Run promotion for ${durationWeeks} weeks for best results`,
        current: 4, recommended: durationWeeks,
        impactRev: incrementalRevenue * 0.15, impactRoi: roi * 0.2, impactUnits: baseUnits * liftPct / 100 * 0.15,
        impactMargin: 0, confidence: confidence * 0.9, risk: 'low',
        category: 'timing', rationale: `${durationWeeks}-week duration maximizes sustained lift while avoiding promotion fatigue`
      },
      {
        type: 'channel', title: 'Distribution Strategy',
        desc: `Target ${distributionPct}% store distribution for optimal reach`,
        current: 60, recommended: distributionPct,
        impactRev: incrementalRevenue * 0.1, impactRoi: roi * 0.15, impactUnits: baseUnits * liftPct / 100 * 0.1,
        impactMargin: 0, confidence: confidence * 0.85, risk: 'low',
        category: 'channel', rationale: `${distributionPct}% distribution provides best coverage-to-cost ratio`
      },
      {
        type: 'product', title: 'Product Focus Recommendation',
        desc: 'Focus on top-performing SKUs to maximize incremental lift',
        current: 0, recommended: 0,
        impactRev: incrementalRevenue * 0.05, impactRoi: roi * 0.05, impactUnits: baseUnits * liftPct / 100 * 0.05,
        impactMargin: marginPct * 0.02, confidence: confidence * 0.8, risk: 'low',
        category: 'product', rationale: 'Concentrating on high-velocity SKUs yields better per-unit economics'
      }
    ];

    for (let i = 0; i < recommendations.length; i++) {
      const r = recommendations[i];
      const changePct = r.current > 0 ? ((r.recommended - r.current) / r.current) * 100 : 0;
      await db.prepare(`
        INSERT INTO optimization_recommendations (
          id, company_id, optimization_id, recommendation_type, priority, title, description,
          current_value, recommended_value, change_pct,
          expected_impact_revenue, expected_impact_roi, expected_impact_units, expected_impact_margin,
          confidence, risk_level, category, metric_name, rationale,
          action_taken, sort_order, data, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        generateId(), companyId, id, r.type, i, r.title, r.desc,
        Math.round(r.current * 100) / 100, Math.round(r.recommended * 100) / 100,
        Math.round(changePct * 100) / 100,
        Math.round(r.impactRev * 100) / 100, Math.round(r.impactRoi * 100) / 100,
        Math.round(r.impactUnits), Math.round(r.impactMargin * 100) / 100,
        Math.round(r.confidence * 100) / 100, r.risk, r.category, r.title, r.rationale,
        'pending', i, '{}', now, now
      ).run();
    }

    const updated = await db.prepare('SELECT * FROM promotion_optimizations WHERE id = ?').bind(id).first();
    const updatedRecs = await db.prepare('SELECT * FROM optimization_recommendations WHERE optimization_id = ? ORDER BY priority, sort_order').bind(id).all();
    const updatedCons = await db.prepare('SELECT * FROM optimization_constraints WHERE optimization_id = ? ORDER BY sort_order').bind(id).all();

    return c.json({
      success: true,
      data: {
        ...rowToDocument(updated),
        recommendations: (updatedRecs.results || []).map(rowToDocument),
        constraints: (updatedCons.results || []).map(rowToDocument)
      },
      message: 'Optimization complete'
    });
  } catch (error) {
    console.error('Error running optimization:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════

promotionOptimizer.get('/:id/recommendations', async (c) => {
  try {
    const db = c.env.DB;
    const { id } = c.req.param();

    const result = await db.prepare(
      'SELECT * FROM optimization_recommendations WHERE optimization_id = ? ORDER BY priority, sort_order'
    ).bind(id).all();

    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

promotionOptimizer.put('/:id/recommendations/:recId/action', async (c) => {
  try {
    const db = c.env.DB;
    const { recId } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const action = body.action || body.actionTaken || body.action_taken || 'pending';

    await db.prepare(
      'UPDATE optimization_recommendations SET action_taken = ?, applied_at = ?, updated_at = ? WHERE id = ?'
    ).bind(action, action === 'applied' ? now : null, now, recId).run();

    const updated = await db.prepare('SELECT * FROM optimization_recommendations WHERE id = ?').bind(recId).first();
    return c.json({ success: true, data: rowToDocument(updated), message: `Recommendation ${action}` });
  } catch (error) {
    console.error('Error updating recommendation:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// CONSTRAINTS
// ═══════════════════════════════════════════════════════════════════════

promotionOptimizer.get('/:id/constraints', async (c) => {
  try {
    const db = c.env.DB;
    const { id } = c.req.param();

    const result = await db.prepare(
      'SELECT * FROM optimization_constraints WHERE optimization_id = ? ORDER BY sort_order'
    ).bind(id).all();

    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    console.error('Error fetching constraints:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

promotionOptimizer.post('/:id/constraints', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const cid = generateId();
    const now = new Date().toISOString();

    const countResult = await db.prepare(
      'SELECT COUNT(*) as count FROM optimization_constraints WHERE optimization_id = ?'
    ).bind(id).first();

    await db.prepare(`
      INSERT INTO optimization_constraints (
        id, company_id, optimization_id, constraint_name, constraint_type,
        operator, threshold_value, severity, sort_order, notes, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      cid, companyId, id,
      body.constraintName || body.constraint_name || body.name || '',
      body.constraintType || body.constraint_type || 'budget',
      body.operator || 'lte',
      body.thresholdValue || body.threshold_value || 0,
      body.severity || 'warning',
      countResult?.count || 0,
      body.notes || null,
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM optimization_constraints WHERE id = ?').bind(cid).first();
    return c.json({ success: true, data: rowToDocument(created), message: 'Constraint added' }, 201);
  } catch (error) {
    console.error('Error adding constraint:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

promotionOptimizer.delete('/:id/constraints/:conId', async (c) => {
  try {
    const db = c.env.DB;
    const { conId } = c.req.param();

    await db.prepare('DELETE FROM optimization_constraints WHERE id = ?').bind(conId).run();
    return c.json({ success: true, message: 'Constraint deleted' });
  } catch (error) {
    console.error('Error deleting constraint:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export { promotionOptimizer as promotionOptimizerRoutes };
