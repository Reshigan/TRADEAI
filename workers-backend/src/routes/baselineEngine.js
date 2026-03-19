/**
 * baselineEngine.js — ML-Powered Baseline Calculation Engine
 *
 * Endpoints:
 *   POST /calculate-ml         — Run ML baseline calculation from sales_history
 *   POST /rollup               — Roll up child baselines to parent level
 *   POST /drilldown             — Split a parent baseline into child proportions
 *   POST /resolve               — Resolve best baseline for a given scope (waterfall)
 *   POST /cascade-calculate     — Calculate baselines for an entire hierarchy branch
 *   GET  /sales-history         — List sales history records
 *   POST /sales-history/import  — Import sales history from CSV
 *   GET  /sales-history/imports — List import jobs
 *   GET  /calculation-logs      — List baseline calculation audit logs
 */

import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';
import { apiError } from '../utils/apiError.js';
import {
  resolveBaselineScope,
  getDescendants,
  getAncestors,
  getSiblings,
  getNodesAtLevel,
  HIERARCHY_CONSTANTS
} from '../services/hierarchyResolver.js';

const engine = new Hono();
engine.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();
const getCompanyId = (c) => c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
const getUserId = (c) => c.get('userId') || null;

// ══════════════════════════════════════════════════════════════════════════
// POST /calculate-ml — ML Baseline Calculation
// ══════════════════════════════════════════════════════════════════════════
engine.post('/calculate-ml', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const userId = getUserId(c);
    const body = await c.req.json();
    const now = new Date().toISOString();

    const {
      baselineId,
      method = 'seasonal_decomposition',
      customerHierarchyId,
      productHierarchyId,
      customerId,
      productId,
      startDate,
      endDate,
      granularity = 'weekly',
      options = {}
    } = body;

    // Create calculation log
    const logId = generateId();
    await db.prepare(`
      INSERT INTO baseline_calculation_logs
        (id, company_id, baseline_id, calculation_type, status, method, input_params, created_by, created_at)
      VALUES (?, ?, ?, 'ml_calculate', 'running', ?, ?, ?, ?)
    `).bind(logId, companyId, baselineId || 'new', method, JSON.stringify(body), userId, now).run();

    const startTime = Date.now();

    // Step 1: Gather sales history data
    let histQuery = 'SELECT * FROM sales_history WHERE company_id = ?';
    const histParams = [companyId];

    if (customerId) { histQuery += ' AND customer_id = ?'; histParams.push(customerId); }
    if (productId) { histQuery += ' AND product_id = ?'; histParams.push(productId); }
    if (startDate) { histQuery += ' AND period_start >= ?'; histParams.push(startDate); }
    if (endDate) { histQuery += ' AND period_end <= ?'; histParams.push(endDate); }

    // If hierarchy IDs given, expand to descendant customer/product IDs
    if (customerHierarchyId) {
      const descendants = await getDescendants(db, companyId, 'customer', customerHierarchyId);
      const custIds = descendants.filter(d => d.level === 'store').map(d => d.id);
      // Also look up linked customer_id from customer_hierarchy
      if (custIds.length > 0) {
        const placeholders = custIds.map(() => '?').join(',');
        const linkedResult = await db.prepare(
          `SELECT customer_id FROM customer_hierarchy WHERE id IN (${placeholders}) AND customer_id IS NOT NULL`
        ).bind(...custIds).all();
        const linkedIds = (linkedResult.results || []).map(r => r.customer_id);
        if (linkedIds.length > 0) {
          const ph = linkedIds.map(() => '?').join(',');
          histQuery += ` AND customer_id IN (${ph})`;
          histParams.push(...linkedIds);
        }
      }
    }

    if (productHierarchyId) {
      const descendants = await getDescendants(db, companyId, 'product', productHierarchyId);
      const prodIds = descendants.filter(d => d.level === 'sku').map(d => d.id);
      if (prodIds.length > 0) {
        const linkedResult = await db.prepare(
          `SELECT product_id FROM product_hierarchy WHERE id IN (${prodIds.map(() => '?').join(',')}) AND product_id IS NOT NULL`
        ).bind(...prodIds).all();
        const linkedIds = (linkedResult.results || []).map(r => r.product_id);
        if (linkedIds.length > 0) {
          const ph = linkedIds.map(() => '?').join(',');
          histQuery += ` AND product_id IN (${ph})`;
          histParams.push(...linkedIds);
        }
      }
    }

    histQuery += ' ORDER BY period_start ASC';
    const histResult = await db.prepare(histQuery).bind(...histParams).all();
    const salesRows = histResult.results || [];

    if (salesRows.length === 0) {
      await updateCalcLog(db, logId, 'failed', 0, 0, {}, Date.now() - startTime, 'No sales history data found for the given scope');
      return c.json({ success: false, message: 'No sales history data found for the given scope' }, 400);
    }

    // Step 2: Bucket data into periods
    const periods = bucketIntoPeriods(salesRows, granularity);

    // Step 3: Separate promoted vs non-promoted periods
    const nonPromoted = periods.filter(p => !p.isPromoted);
    const allPeriods = periods;

    // Step 4: Calculate baseline using selected method
    let baselineValues;
    switch (method) {
      case 'moving_average':
        baselineValues = calcMovingAverage(nonPromoted, allPeriods, options.windowSize || 12);
        break;
      case 'linear_regression':
        baselineValues = calcLinearRegression(nonPromoted, allPeriods);
        break;
      case 'seasonal_decomposition':
        baselineValues = calcSeasonalDecomposition(nonPromoted, allPeriods, granularity);
        break;
      case 'exponential_smoothing':
        baselineValues = calcExponentialSmoothing(nonPromoted, allPeriods, options.alpha || 0.3);
        break;
      default:
        baselineValues = calcHistoricalAverage(nonPromoted, allPeriods);
    }

    // Step 5: Calculate fit metrics
    const metrics = calculateFitMetrics(baselineValues, allPeriods);

    // Step 6: Create or update baseline record
    const blId = baselineId || generateId();
    const totalBaseVol = baselineValues.reduce((s, v) => s + v.baseVolume, 0);
    const totalBaseRev = baselineValues.reduce((s, v) => s + v.baseRevenue, 0);
    const periodsCount = baselineValues.length;
    const avgWeeklyVol = periodsCount > 0 ? totalBaseVol / periodsCount : 0;
    const avgWeeklyRev = periodsCount > 0 ? totalBaseRev / periodsCount : 0;

    if (baselineId) {
      // Update existing baseline
      await db.prepare(`
        UPDATE baselines SET
          status = 'active', calculation_method = ?, granularity = ?,
          total_base_volume = ?, total_base_revenue = ?,
          avg_weekly_volume = ?, avg_weekly_revenue = ?,
          seasonality_index = ?, trend_coefficient = ?,
          r_squared = ?, mape = ?, confidence_level = ?,
          customer_hierarchy_id = ?, customer_hierarchy_level = ?,
          product_hierarchy_id = ?, product_hierarchy_level = ?,
          updated_at = ?
        WHERE id = ? AND company_id = ?
      `).bind(
        method, granularity,
        totalBaseVol, totalBaseRev,
        avgWeeklyVol, avgWeeklyRev,
        JSON.stringify(metrics.seasonalityIndex || {}),
        metrics.trendCoefficient || 0,
        metrics.rSquared || 0,
        metrics.mape || 0,
        metrics.confidence || 0.85,
        customerHierarchyId || null,
        body.customerHierarchyLevel || null,
        productHierarchyId || null,
        body.productHierarchyLevel || null,
        now, blId, companyId
      ).run();
    } else {
      // Create new baseline
      await db.prepare(`
        INSERT INTO baselines (
          id, company_id, name, description, status, baseline_type,
          calculation_method, granularity, customer_id, product_id,
          start_date, end_date, periods_used,
          seasonality_enabled, trend_enabled, outlier_removal_enabled,
          outlier_threshold, confidence_level,
          total_base_volume, total_base_revenue,
          avg_weekly_volume, avg_weekly_revenue,
          seasonality_index, trend_coefficient, r_squared, mape,
          customer_hierarchy_id, customer_hierarchy_level,
          product_hierarchy_id, product_hierarchy_level,
          created_by, data, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'active', 'volume', ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, 2.0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        blId, companyId,
        body.name || `ML Baseline - ${method}`,
        body.description || `Auto-calculated using ${method}`,
        method, granularity,
        customerId || null, productId || null,
        startDate || null, endDate || null,
        periodsCount,
        metrics.confidence || 0.85,
        totalBaseVol, totalBaseRev,
        avgWeeklyVol, avgWeeklyRev,
        JSON.stringify(metrics.seasonalityIndex || {}),
        metrics.trendCoefficient || 0,
        metrics.rSquared || 0,
        metrics.mape || 0,
        customerHierarchyId || null,
        body.customerHierarchyLevel || null,
        productHierarchyId || null,
        body.productHierarchyLevel || null,
        userId, JSON.stringify(options), now, now
      ).run();
    }

    // Step 7: Write baseline_periods
    // Delete old periods first
    await db.prepare('DELETE FROM baseline_periods WHERE baseline_id = ? AND company_id = ?').bind(blId, companyId).run();

    // Insert new periods in batches of 20
    for (let i = 0; i < baselineValues.length; i += 20) {
      const batch = baselineValues.slice(i, i + 20);
      const stmts = batch.map((bv, idx) => {
        const periodId = generateId();
        return db.prepare(`
          INSERT INTO baseline_periods (
            id, company_id, baseline_id, period_start, period_end,
            period_number, period_label, base_volume, base_revenue,
            seasonality_factor, trend_adjustment,
            actual_volume, actual_revenue,
            variance_volume, variance_pct,
            is_promoted, incremental_volume, incremental_revenue,
            confidence_lower, confidence_upper,
            forecast_volume, forecast_revenue,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          periodId, companyId, blId,
          bv.periodStart, bv.periodEnd,
          i + idx + 1, bv.label || `P${i + idx + 1}`,
          bv.baseVolume, bv.baseRevenue,
          bv.seasonalityFactor || 1.0, bv.trendAdjustment || 0,
          bv.actualVolume, bv.actualRevenue,
          bv.varianceVolume || 0, bv.variancePct || 0,
          bv.isPromoted ? 1 : 0,
          bv.incrementalVolume || 0, bv.incrementalRevenue || 0,
          bv.confidenceLower || 0, bv.confidenceUpper || 0,
          bv.forecastVolume || bv.baseVolume, bv.forecastRevenue || bv.baseRevenue,
          now, now
        );
      });
      await db.batch(stmts);
    }

    // Update calc log
    await updateCalcLog(db, logId, 'completed', salesRows.length, baselineValues.length, metrics, Date.now() - startTime, null);

    return c.json({
      success: true,
      data: {
        baselineId: blId,
        method,
        periodsCalculated: baselineValues.length,
        inputRows: salesRows.length,
        metrics,
        totalBaseVolume: totalBaseVol,
        totalBaseRevenue: totalBaseRev
      }
    });
  } catch (error) {
    console.error('ML calculation error:', error);
    return apiError(c, error, 'baseline-engine');
  }
});

// ══════════════════════════════════════════════════════════════════════════
// POST /rollup — Roll up child baselines to parent hierarchy level
// ══════════════════════════════════════════════════════════════════════════
engine.post('/rollup', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const { parentNodeId, hierarchyType = 'customer', productHierarchyId, customerHierarchyId } = body;

    if (!parentNodeId) {
      return c.json({ success: false, message: 'parentNodeId is required' }, 400);
    }

    // Get all descendants
    const descendants = await getDescendants(db, companyId, hierarchyType, parentNodeId);
    if (descendants.length === 0) {
      return c.json({ success: false, message: 'No descendants found for this node' }, 400);
    }

    // Find baselines for each descendant
    const childBaselines = [];
    for (const desc of descendants) {
      const scope = hierarchyType === 'customer'
        ? { customerHierarchyId: desc.id, productHierarchyId }
        : { customerHierarchyId, productHierarchyId: desc.id };

      const result = await resolveBaselineScope(db, companyId, scope);
      if (result.baseline) {
        childBaselines.push({ nodeId: desc.id, ...result });
      }
    }

    if (childBaselines.length === 0) {
      return c.json({ success: false, message: 'No child baselines found to roll up' }, 400);
    }

    // Aggregate: sum volumes, average seasonality, widen confidence
    const allPeriods = {};
    let totalVol = 0, totalRev = 0;

    for (const child of childBaselines) {
      totalVol += (child.baseline.total_base_volume || child.baseline.totalBaseVolume || 0);
      totalRev += (child.baseline.total_base_revenue || child.baseline.totalBaseRevenue || 0);

      for (const period of child.periods) {
        const pNum = period.period_number || period.periodNumber;
        if (!allPeriods[pNum]) {
          allPeriods[pNum] = {
            periodStart: period.period_start || period.periodStart,
            periodEnd: period.period_end || period.periodEnd,
            baseVolume: 0, baseRevenue: 0,
            actualVolume: 0, actualRevenue: 0,
            seasonalityFactors: [], trendAdjustments: [],
            sourceCount: 0
          };
        }
        allPeriods[pNum].baseVolume += (period.base_volume || period.baseVolume || 0);
        allPeriods[pNum].baseRevenue += (period.base_revenue || period.baseRevenue || 0);
        allPeriods[pNum].actualVolume += (period.actual_volume || period.actualVolume || 0);
        allPeriods[pNum].actualRevenue += (period.actual_revenue || period.actualRevenue || 0);
        allPeriods[pNum].seasonalityFactors.push(period.seasonality_factor || period.seasonalityFactor || 1.0);
        allPeriods[pNum].trendAdjustments.push(period.trend_adjustment || period.trendAdjustment || 0);
        allPeriods[pNum].sourceCount++;
      }
    }

    // Compute rollup periods
    const rollupPeriods = Object.entries(allPeriods)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([pNum, p]) => ({
        periodNumber: parseInt(pNum),
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        baseVolume: p.baseVolume,
        baseRevenue: p.baseRevenue,
        actualVolume: p.actualVolume,
        actualRevenue: p.actualRevenue,
        seasonalityFactor: average(p.seasonalityFactors),
        trendAdjustment: average(p.trendAdjustments),
        sourceCount: p.sourceCount
      }));

    // Widen confidence by 5% for rollup
    const avgConfidence = average(childBaselines.map(cb =>
      cb.baseline.confidence_level || cb.baseline.confidenceLevel || 0.85
    ));

    return c.json({
      success: true,
      data: {
        parentNodeId,
        hierarchyType,
        childCount: childBaselines.length,
        totalBaseVolume: totalVol,
        totalBaseRevenue: totalRev,
        confidence: Math.max(0, avgConfidence - 0.05),
        periods: rollupPeriods
      }
    });
  } catch (error) {
    console.error('Rollup error:', error);
    return apiError(c, error, 'baseline-engine');
  }
});

// ══════════════════════════════════════════════════════════════════════════
// POST /drilldown — Split parent baseline into child proportions
// ══════════════════════════════════════════════════════════════════════════
engine.post('/drilldown', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const { parentBaselineId, hierarchyType = 'customer', targetLevel } = body;

    if (!parentBaselineId) {
      return c.json({ success: false, message: 'parentBaselineId is required' }, 400);
    }

    // Get parent baseline
    const parentBaseline = await db.prepare(
      'SELECT * FROM baselines WHERE id = ? AND company_id = ?'
    ).bind(parentBaselineId, companyId).first();

    if (!parentBaseline) {
      return c.json({ success: false, message: 'Parent baseline not found' }, 404);
    }

    // Determine the hierarchy node and get children
    const hierIdCol = hierarchyType === 'customer' ? 'customer_hierarchy_id' : 'product_hierarchy_id';
    const parentHierarchyId = parentBaseline[hierIdCol];

    if (!parentHierarchyId) {
      return c.json({ success: false, message: 'Parent baseline has no hierarchy scope' }, 400);
    }

    const children = await getDescendants(db, companyId, hierarchyType, parentHierarchyId);

    // Filter to target level if specified
    const targetChildren = targetLevel
      ? children.filter(ch => ch.level === targetLevel)
      : children.filter(ch => ch.levelDepth === (children[0]?.levelDepth || 0));

    if (targetChildren.length === 0) {
      return c.json({ success: false, message: 'No child nodes found for drilldown' }, 400);
    }

    // Get volume shares from sales_history to determine split proportions
    const childNodeIds = targetChildren.map(ch => ch.id);
    const table = hierarchyType === 'customer' ? 'customer_hierarchy' : 'product_hierarchy';
    const linkCol = hierarchyType === 'customer' ? 'customer_id' : 'product_id';

    // Look up linked entity IDs
    const placeholders = childNodeIds.map(() => '?').join(',');
    const linkedResult = await db.prepare(
      `SELECT id, ${linkCol} FROM ${table} WHERE id IN (${placeholders}) AND ${linkCol} IS NOT NULL`
    ).bind(...childNodeIds).all();

    const nodeToEntity = {};
    for (const row of (linkedResult.results || [])) {
      nodeToEntity[row.id] = row[linkCol];
    }

    // Get sales volume per entity
    const entityIds = Object.values(nodeToEntity);
    let volumeShares = {};

    if (entityIds.length > 0) {
      const entityCol = hierarchyType === 'customer' ? 'customer_id' : 'product_id';
      const ePlaceholders = entityIds.map(() => '?').join(',');
      const salesResult = await db.prepare(
        `SELECT ${entityCol}, SUM(volume) as total_volume FROM sales_history
         WHERE company_id = ? AND ${entityCol} IN (${ePlaceholders})
         GROUP BY ${entityCol}`
      ).bind(companyId, ...entityIds).all();

      for (const row of (salesResult.results || [])) {
        volumeShares[row[entityCol]] = row.total_volume || 0;
      }
    }

    // Calculate total volume for proportional split
    const totalChildVolume = Object.values(volumeShares).reduce((s, v) => s + v, 0);

    // Get parent periods
    const parentPeriods = await db.prepare(
      'SELECT * FROM baseline_periods WHERE baseline_id = ? AND company_id = ? ORDER BY period_number ASC'
    ).bind(parentBaselineId, companyId).all();
    const parentPeriodsArr = parentPeriods.results || [];

    // Compute drilldown for each child
    const childResults = targetChildren.map(child => {
      const entityId = nodeToEntity[child.id];
      const childVolume = entityId ? (volumeShares[entityId] || 0) : 0;
      const proportion = totalChildVolume > 0 ? childVolume / totalChildVolume : 1 / targetChildren.length;

      const childPeriods = parentPeriodsArr.map(pp => ({
        periodNumber: pp.period_number,
        periodStart: pp.period_start,
        periodEnd: pp.period_end,
        baseVolume: (pp.base_volume || 0) * proportion,
        baseRevenue: (pp.base_revenue || 0) * proportion,
        seasonalityFactor: pp.seasonality_factor || 1.0,
        trendAdjustment: pp.trend_adjustment || 0,
        proportion
      }));

      return {
        nodeId: child.id,
        nodeName: child.name,
        nodeLevel: child.level,
        entityId,
        proportion: Math.round(proportion * 10000) / 10000,
        totalBaseVolume: (parentBaseline.total_base_volume || 0) * proportion,
        totalBaseRevenue: (parentBaseline.total_base_revenue || 0) * proportion,
        periods: childPeriods
      };
    });

    return c.json({
      success: true,
      data: {
        parentBaselineId,
        hierarchyType,
        childCount: childResults.length,
        children: childResults
      }
    });
  } catch (error) {
    console.error('Drilldown error:', error);
    return apiError(c, error, 'baseline-engine');
  }
});

// ══════════════════════════════════════════════════════════════════════════
// POST /resolve — Resolve best baseline for a given scope (waterfall)
// ══════════════════════════════════════════════════════════════════════════
engine.post('/resolve', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();

    const result = await resolveBaselineScope(db, companyId, body);

    if (!result.baseline) {
      return c.json({
        success: true,
        data: { baseline: null, periods: [], source: null, message: 'No baseline found for this scope' }
      });
    }

    return c.json({
      success: true,
      data: {
        baseline: typeof result.baseline === 'object' && result.baseline.id
          ? rowToDocument(result.baseline)
          : result.baseline,
        periods: result.periods.map(p => typeof p === 'object' && p.id ? rowToDocument(p) : p),
        source: result.source
      }
    });
  } catch (error) {
    console.error('Resolve error:', error);
    return apiError(c, error, 'baseline-engine');
  }
});

// ══════════════════════════════════════════════════════════════════════════
// POST /cascade-calculate — Calculate baselines for entire hierarchy branch
// ══════════════════════════════════════════════════════════════════════════
engine.post('/cascade-calculate', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const { rootNodeId, hierarchyType = 'customer', method = 'seasonal_decomposition', startDate, endDate, granularity = 'weekly' } = body;

    if (!rootNodeId) {
      return c.json({ success: false, message: 'rootNodeId is required' }, 400);
    }

    // Get all descendants
    const descendants = await getDescendants(db, companyId, hierarchyType, rootNodeId);
    const leafNodes = descendants.filter(d => d.levelDepth === Math.max(...descendants.map(x => x.levelDepth)));

    const results = { calculated: 0, failed: 0, errors: [] };

    // Calculate baseline for each leaf node
    for (const leaf of leafNodes) {
      try {
        const table = hierarchyType === 'customer' ? 'customer_hierarchy' : 'product_hierarchy';
        const linkCol = hierarchyType === 'customer' ? 'customer_id' : 'product_id';
        const node = await db.prepare(`SELECT ${linkCol} FROM ${table} WHERE id = ? AND company_id = ?`).bind(leaf.id, companyId).first();

        if (!node || !node[linkCol]) continue;

        // Check if sales history exists for this entity
        const entityCol = hierarchyType === 'customer' ? 'customer_id' : 'product_id';
        const histCount = await db.prepare(
          `SELECT COUNT(*) as cnt FROM sales_history WHERE company_id = ? AND ${entityCol} = ?`
        ).bind(companyId, node[linkCol]).first();

        if (!histCount || histCount.cnt === 0) continue;

        // Create a baseline for this leaf
        const blId = generateId();
        const now = new Date().toISOString();
        await db.prepare(`
          INSERT INTO baselines (id, company_id, name, status, baseline_type, calculation_method, granularity,
            customer_id, product_id, customer_hierarchy_id, customer_hierarchy_level,
            product_hierarchy_id, product_hierarchy_level,
            start_date, end_date, created_at, updated_at)
          VALUES (?, ?, ?, 'draft', 'volume', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          blId, companyId, `Auto: ${leaf.name}`, method, granularity,
          hierarchyType === 'customer' ? node[linkCol] : null,
          hierarchyType === 'product' ? node[linkCol] : null,
          hierarchyType === 'customer' ? leaf.id : null,
          hierarchyType === 'customer' ? leaf.level : null,
          hierarchyType === 'product' ? leaf.id : null,
          hierarchyType === 'product' ? leaf.level : null,
          startDate || null, endDate || null, now, now
        ).run();

        results.calculated++;
      } catch (leafError) {
        results.failed++;
        results.errors.push({ nodeId: leaf.id, error: leafError.message });
      }
    }

    return c.json({
      success: true,
      data: {
        rootNodeId,
        hierarchyType,
        totalLeafNodes: leafNodes.length,
        ...results
      }
    });
  } catch (error) {
    console.error('Cascade calculate error:', error);
    return apiError(c, error, 'baseline-engine');
  }
});

// ══════════════════════════════════════════════════════════════════════════
// GET /sales-history — List sales history records
// ══════════════════════════════════════════════════════════════════════════
engine.get('/sales-history', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { customer_id, product_id, start_date, end_date, import_batch_id, limit = 100, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM sales_history WHERE company_id = ?';
    const params = [companyId];

    if (customer_id) { query += ' AND customer_id = ?'; params.push(customer_id); }
    if (product_id) { query += ' AND product_id = ?'; params.push(product_id); }
    if (start_date) { query += ' AND period_start >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND period_end <= ?'; params.push(end_date); }
    if (import_batch_id) { query += ' AND import_batch_id = ?'; params.push(import_batch_id); }

    query += ' ORDER BY period_start DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM sales_history WHERE company_id = ?').bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Sales history list error:', error);
    return apiError(c, error, 'baseline-engine');
  }
});

// ══════════════════════════════════════════════════════════════════════════
// POST /sales-history/import — Import sales history from CSV body
// ══════════════════════════════════════════════════════════════════════════
engine.post('/sales-history/import', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const userId = getUserId(c);
    const body = await c.req.json();
    const now = new Date().toISOString();

    const { rows, columnMapping = {}, filename = 'upload.csv', granularity = 'weekly' } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return c.json({ success: false, message: 'rows array is required' }, 400);
    }

    // Create import job
    const importId = generateId();
    const batchId = generateId();
    await db.prepare(`
      INSERT INTO sales_history_imports (id, company_id, filename, status, total_rows, column_mapping, created_by, created_at)
      VALUES (?, ?, ?, 'importing', ?, ?, ?, ?)
    `).bind(importId, companyId, filename, rows.length, JSON.stringify(columnMapping), userId, now).run();

    let imported = 0, skipped = 0, errors = 0;
    const validationErrors = [];

    // Process in batches of 50
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const stmts = [];

      for (const row of batch) {
        const customerId = row[columnMapping.customer_id || 'customer_id'] || row.customerId || row.customer_id;
        const productId = row[columnMapping.product_id || 'product_id'] || row.productId || row.product_id;
        const periodStart = row[columnMapping.period_start || 'period_start'] || row.periodStart || row.period_start;
        const periodEnd = row[columnMapping.period_end || 'period_end'] || row.periodEnd || row.period_end;
        const volume = parseFloat(row[columnMapping.volume || 'volume'] || row.volume || 0);
        const revenue = parseFloat(row[columnMapping.revenue || 'revenue'] || row.revenue || 0);

        if (!periodStart || !periodEnd) {
          skipped++;
          validationErrors.push({ row: i + batch.indexOf(row), error: 'Missing period_start or period_end' });
          continue;
        }

        const id = generateId();
        stmts.push(
          db.prepare(`
            INSERT INTO sales_history (id, company_id, import_batch_id, customer_id, product_id,
              period_start, period_end, granularity, volume, revenue,
              units, cost, is_promoted, promotion_id, channel, region, source, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'import', ?, ?)
          `).bind(
            id, companyId, batchId,
            customerId || null, productId || null,
            periodStart, periodEnd,
            row.granularity || granularity,
            volume, revenue,
            parseFloat(row.units || 0), parseFloat(row.cost || 0),
            row.is_promoted || row.isPromoted ? 1 : 0,
            row.promotion_id || row.promotionId || null,
            row.channel || null, row.region || null,
            now, now
          )
        );
        imported++;
      }

      if (stmts.length > 0) {
        await db.batch(stmts);
      }
    }

    // Update import job
    await db.prepare(`
      UPDATE sales_history_imports SET
        status = 'completed', imported_rows = ?, skipped_rows = ?, error_rows = ?,
        validation_errors = ?, completed_at = ?
      WHERE id = ?
    `).bind(imported, skipped, errors, JSON.stringify(validationErrors), now, importId).run();

    return c.json({
      success: true,
      data: {
        importId,
        batchId,
        totalRows: rows.length,
        imported,
        skipped,
        errors,
        validationErrors: validationErrors.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Sales history import error:', error);
    return apiError(c, error, 'baseline-engine');
  }
});

// ══════════════════════════════════════════════════════════════════════════
// GET /sales-history/imports — List import jobs
// ══════════════════════════════════════════════════════════════════════════
engine.get('/sales-history/imports', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const result = await db.prepare(
      'SELECT * FROM sales_history_imports WHERE company_id = ? ORDER BY created_at DESC LIMIT 50'
    ).bind(companyId).all();

    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    return apiError(c, error, 'baseline-engine');
  }
});

// ══════════════════════════════════════════════════════════════════════════
// GET /calculation-logs — List calculation audit logs
// ══════════════════════════════════════════════════════════════════════════
engine.get('/calculation-logs', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { baseline_id, limit = 50 } = c.req.query();

    let query = 'SELECT * FROM baseline_calculation_logs WHERE company_id = ?';
    const params = [companyId];
    if (baseline_id) { query += ' AND baseline_id = ?'; params.push(baseline_id); }
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const result = await db.prepare(query).bind(...params).all();
    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    return apiError(c, error, 'baseline-engine');
  }
});

// ══════════════════════════════════════════════════════════════════════════
// GET /hierarchy-tree/:type — Get full hierarchy tree for customer or product
// ══════════════════════════════════════════════════════════════════════════
engine.get('/hierarchy-tree/:type', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { type } = c.req.param();

    if (type !== 'customer' && type !== 'product') {
      return c.json({ success: false, message: 'type must be "customer" or "product"' }, 400);
    }

    const table = type === 'customer' ? 'customer_hierarchy' : 'product_hierarchy';
    const result = await db.prepare(
      `SELECT * FROM ${table} WHERE company_id = ? ORDER BY level_depth ASC, name ASC`
    ).bind(companyId).all();

    const nodes = (result.results || []).map(rowToDocument);

    // Build tree structure
    const nodeMap = {};
    const roots = [];

    for (const node of nodes) {
      nodeMap[node.id] = { ...node, children: [] };
    }

    for (const node of nodes) {
      if (node.parentId && nodeMap[node.parentId]) {
        nodeMap[node.parentId].children.push(nodeMap[node.id]);
      } else {
        roots.push(nodeMap[node.id]);
      }
    }

    return c.json({
      success: true,
      data: {
        type,
        levels: type === 'customer' ? HIERARCHY_CONSTANTS.CUSTOMER_LEVELS : HIERARCHY_CONSTANTS.PRODUCT_LEVELS,
        totalNodes: nodes.length,
        tree: roots
      }
    });
  } catch (error) {
    console.error('Hierarchy tree error:', error);
    return apiError(c, error, 'baseline-engine');
  }
});

// ══════════════════════════════════════════════════════════════════════════
// ML Calculation Methods (internal)
// ══════════════════════════════════════════════════════════════════════════

function bucketIntoPeriods(salesRows, granularity) {
  const periodMap = {};

  for (const row of salesRows) {
    const key = `${row.period_start}_${row.period_end}`;
    if (!periodMap[key]) {
      periodMap[key] = {
        periodStart: row.period_start,
        periodEnd: row.period_end,
        volume: 0, revenue: 0, units: 0, cost: 0,
        isPromoted: false, count: 0
      };
    }
    periodMap[key].volume += (row.volume || 0);
    periodMap[key].revenue += (row.revenue || 0);
    periodMap[key].units += (row.units || 0);
    periodMap[key].cost += (row.cost || 0);
    if (row.is_promoted) periodMap[key].isPromoted = true;
    periodMap[key].count++;
  }

  return Object.values(periodMap).sort((a, b) => a.periodStart.localeCompare(b.periodStart));
}

function calcHistoricalAverage(nonPromoted, allPeriods) {
  const avgVol = nonPromoted.length > 0
    ? nonPromoted.reduce((s, p) => s + p.volume, 0) / nonPromoted.length
    : 0;
  const avgRev = nonPromoted.length > 0
    ? nonPromoted.reduce((s, p) => s + p.revenue, 0) / nonPromoted.length
    : 0;

  return allPeriods.map(p => ({
    periodStart: p.periodStart,
    periodEnd: p.periodEnd,
    baseVolume: avgVol,
    baseRevenue: avgRev,
    actualVolume: p.volume,
    actualRevenue: p.revenue,
    isPromoted: p.isPromoted,
    incrementalVolume: p.isPromoted ? Math.max(0, p.volume - avgVol) : 0,
    incrementalRevenue: p.isPromoted ? Math.max(0, p.revenue - avgRev) : 0,
    varianceVolume: p.volume - avgVol,
    variancePct: avgVol > 0 ? ((p.volume - avgVol) / avgVol) * 100 : 0,
    seasonalityFactor: 1.0,
    trendAdjustment: 0
  }));
}

function calcMovingAverage(nonPromoted, allPeriods, windowSize) {
  const values = nonPromoted.map(p => p.volume);
  const revValues = nonPromoted.map(p => p.revenue);

  return allPeriods.map((p, idx) => {
    const start = Math.max(0, idx - windowSize);
    const end = idx;
    const windowVols = values.slice(start, end + 1);
    const windowRevs = revValues.slice(start, end + 1);
    const baseVol = windowVols.length > 0 ? average(windowVols) : 0;
    const baseRev = windowRevs.length > 0 ? average(windowRevs) : 0;

    return {
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      baseVolume: baseVol,
      baseRevenue: baseRev,
      actualVolume: p.volume,
      actualRevenue: p.revenue,
      isPromoted: p.isPromoted,
      incrementalVolume: p.isPromoted ? Math.max(0, p.volume - baseVol) : 0,
      incrementalRevenue: p.isPromoted ? Math.max(0, p.revenue - baseRev) : 0,
      varianceVolume: p.volume - baseVol,
      variancePct: baseVol > 0 ? ((p.volume - baseVol) / baseVol) * 100 : 0,
      seasonalityFactor: 1.0,
      trendAdjustment: 0
    };
  });
}

function calcLinearRegression(nonPromoted, allPeriods) {
  const n = nonPromoted.length;
  if (n < 2) return calcHistoricalAverage(nonPromoted, allPeriods);

  // Simple linear regression: y = mx + b
  const xs = nonPromoted.map((_, i) => i);
  const ys = nonPromoted.map(p => p.volume);
  const rys = nonPromoted.map(p => p.revenue);

  const { slope: mVol, intercept: bVol } = linearReg(xs, ys);
  const { slope: mRev, intercept: bRev } = linearReg(xs, rys);

  return allPeriods.map((p, idx) => {
    const baseVol = Math.max(0, mVol * idx + bVol);
    const baseRev = Math.max(0, mRev * idx + bRev);

    return {
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      baseVolume: baseVol,
      baseRevenue: baseRev,
      actualVolume: p.volume,
      actualRevenue: p.revenue,
      isPromoted: p.isPromoted,
      incrementalVolume: p.isPromoted ? Math.max(0, p.volume - baseVol) : 0,
      incrementalRevenue: p.isPromoted ? Math.max(0, p.revenue - baseRev) : 0,
      varianceVolume: p.volume - baseVol,
      variancePct: baseVol > 0 ? ((p.volume - baseVol) / baseVol) * 100 : 0,
      seasonalityFactor: 1.0,
      trendAdjustment: mVol
    };
  });
}

function calcSeasonalDecomposition(nonPromoted, allPeriods, granularity) {
  const periodsPerCycle = granularity === 'weekly' ? 52 : granularity === 'monthly' ? 12 : 4;
  const n = nonPromoted.length;

  if (n < periodsPerCycle) return calcHistoricalAverage(nonPromoted, allPeriods);

  // Step 1: Compute trend via centered moving average
  const volValues = nonPromoted.map(p => p.volume);
  const revValues = nonPromoted.map(p => p.revenue);

  const trendVol = centeredMovingAverage(volValues, periodsPerCycle);
  const trendRev = centeredMovingAverage(revValues, periodsPerCycle);

  // Step 2: Compute seasonal indices
  const seasonalVol = new Array(periodsPerCycle).fill(0);
  const seasonalRev = new Array(periodsPerCycle).fill(0);
  const seasonalCount = new Array(periodsPerCycle).fill(0);

  for (let i = 0; i < n; i++) {
    const seasonIdx = i % periodsPerCycle;
    if (trendVol[i] > 0) {
      seasonalVol[seasonIdx] += volValues[i] / trendVol[i];
      seasonalRev[seasonIdx] += revValues[i] / (trendRev[i] || 1);
      seasonalCount[seasonIdx]++;
    }
  }

  for (let i = 0; i < periodsPerCycle; i++) {
    seasonalVol[i] = seasonalCount[i] > 0 ? seasonalVol[i] / seasonalCount[i] : 1.0;
    seasonalRev[i] = seasonalCount[i] > 0 ? seasonalRev[i] / seasonalCount[i] : 1.0;
  }

  // Step 3: Compute overall trend (linear regression on deseasonalized data)
  const deseasonVol = volValues.map((v, i) => v / (seasonalVol[i % periodsPerCycle] || 1));
  const xs = deseasonVol.map((_, i) => i);
  const { slope: trendSlope, intercept: trendIntercept } = linearReg(xs, deseasonVol);

  // Step 4: Reconstruct baseline for all periods
  return allPeriods.map((p, idx) => {
    const seasonIdx = idx % periodsPerCycle;
    const trendValue = Math.max(0, trendSlope * idx + trendIntercept);
    const baseVol = trendValue * (seasonalVol[seasonIdx] || 1);
    const baseRev = trendValue * (seasonalRev[seasonIdx] || 1);

    // Confidence band: +/- 1.96 * std of residuals
    const residualStd = calcResidualStd(nonPromoted, allPeriods, seasonalVol, trendSlope, trendIntercept, periodsPerCycle);
    const margin = 1.96 * residualStd;

    return {
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      baseVolume: baseVol,
      baseRevenue: baseRev,
      actualVolume: p.volume,
      actualRevenue: p.revenue,
      isPromoted: p.isPromoted,
      incrementalVolume: p.isPromoted ? Math.max(0, p.volume - baseVol) : 0,
      incrementalRevenue: p.isPromoted ? Math.max(0, p.revenue - baseRev) : 0,
      varianceVolume: p.volume - baseVol,
      variancePct: baseVol > 0 ? ((p.volume - baseVol) / baseVol) * 100 : 0,
      seasonalityFactor: seasonalVol[seasonIdx] || 1.0,
      trendAdjustment: trendSlope,
      confidenceLower: Math.max(0, baseVol - margin),
      confidenceUpper: baseVol + margin,
      forecastVolume: baseVol,
      forecastRevenue: baseRev
    };
  });
}

function calcExponentialSmoothing(nonPromoted, allPeriods, alpha) {
  if (nonPromoted.length === 0) return calcHistoricalAverage(nonPromoted, allPeriods);

  let smoothedVol = nonPromoted[0].volume;
  let smoothedRev = nonPromoted[0].revenue;

  const smoothedValues = [{ vol: smoothedVol, rev: smoothedRev }];

  for (let i = 1; i < nonPromoted.length; i++) {
    smoothedVol = alpha * nonPromoted[i].volume + (1 - alpha) * smoothedVol;
    smoothedRev = alpha * nonPromoted[i].revenue + (1 - alpha) * smoothedRev;
    smoothedValues.push({ vol: smoothedVol, rev: smoothedRev });
  }

  return allPeriods.map((p, idx) => {
    const svIdx = Math.min(idx, smoothedValues.length - 1);
    const baseVol = smoothedValues[svIdx].vol;
    const baseRev = smoothedValues[svIdx].rev;

    return {
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      baseVolume: baseVol,
      baseRevenue: baseRev,
      actualVolume: p.volume,
      actualRevenue: p.revenue,
      isPromoted: p.isPromoted,
      incrementalVolume: p.isPromoted ? Math.max(0, p.volume - baseVol) : 0,
      incrementalRevenue: p.isPromoted ? Math.max(0, p.revenue - baseRev) : 0,
      varianceVolume: p.volume - baseVol,
      variancePct: baseVol > 0 ? ((p.volume - baseVol) / baseVol) * 100 : 0,
      seasonalityFactor: 1.0,
      trendAdjustment: 0
    };
  });
}

// ── Math helpers ─────────────────────────────────────────────────────────

function average(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function linearReg(xs, ys) {
  const n = xs.length;
  if (n < 2) return { slope: 0, intercept: ys[0] || 0 };

  const sumX = xs.reduce((s, x) => s + x, 0);
  const sumY = ys.reduce((s, y) => s + y, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
  const sumXX = xs.reduce((s, x) => s + x * x, 0);

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

function centeredMovingAverage(values, window) {
  const result = new Array(values.length).fill(0);
  const half = Math.floor(window / 2);

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - half);
    const end = Math.min(values.length - 1, i + half);
    let sum = 0, cnt = 0;
    for (let j = start; j <= end; j++) {
      sum += values[j]; cnt++;
    }
    result[i] = cnt > 0 ? sum / cnt : values[i];
  }

  return result;
}

function calcResidualStd(nonPromoted, allPeriods, seasonalVol, trendSlope, trendIntercept, periodsPerCycle) {
  const residuals = [];
  for (let i = 0; i < nonPromoted.length; i++) {
    const seasonIdx = i % periodsPerCycle;
    const predicted = Math.max(0, (trendSlope * i + trendIntercept) * (seasonalVol[seasonIdx] || 1));
    residuals.push(nonPromoted[i].volume - predicted);
  }

  if (residuals.length < 2) return 0;

  const mean = average(residuals);
  const variance = residuals.reduce((s, r) => s + (r - mean) ** 2, 0) / (residuals.length - 1);
  return Math.sqrt(variance);
}

function calculateFitMetrics(baselineValues, allPeriods) {
  const predicted = baselineValues.map(b => b.baseVolume);
  const actual = allPeriods.map(p => p.volume);

  // MAPE (Mean Absolute Percentage Error)
  let mapeSum = 0, mapeCount = 0;
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] > 0) {
      mapeSum += Math.abs((actual[i] - predicted[i]) / actual[i]);
      mapeCount++;
    }
  }
  const mape = mapeCount > 0 ? (mapeSum / mapeCount) * 100 : 0;

  // R-squared
  const meanActual = average(actual);
  const ssRes = actual.reduce((s, a, i) => s + (a - predicted[i]) ** 2, 0);
  const ssTot = actual.reduce((s, a) => s + (a - meanActual) ** 2, 0);
  const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;

  // Trend coefficient
  const xs = actual.map((_, i) => i);
  const { slope: trendCoefficient } = linearReg(xs, actual);

  // Confidence level based on MAPE
  const confidence = Math.max(0.5, Math.min(0.99, 1 - mape / 100));

  // Seasonality index (period-wise ratios)
  const seasonalityIndex = {};
  for (let i = 0; i < baselineValues.length; i++) {
    const avgBase = average(predicted);
    if (avgBase > 0) {
      seasonalityIndex[`P${i + 1}`] = Math.round((predicted[i] / avgBase) * 1000) / 1000;
    }
  }

  return {
    mape: Math.round(mape * 100) / 100,
    rSquared: Math.round(rSquared * 10000) / 10000,
    trendCoefficient: Math.round(trendCoefficient * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    seasonalityIndex,
    sampleSize: actual.length,
    nonPromotedPeriods: baselineValues.filter(b => !b.isPromoted).length
  };
}

async function updateCalcLog(db, logId, status, inputRows, outputPeriods, metrics, durationMs, errorMessage) {
  await db.prepare(`
    UPDATE baseline_calculation_logs SET
      status = ?, input_row_count = ?, output_period_count = ?,
      metrics = ?, duration_ms = ?, error_message = ?, completed_at = ?
    WHERE id = ?
  `).bind(
    status, inputRows, outputPeriods,
    JSON.stringify(metrics), durationMs,
    errorMessage, new Date().toISOString(), logId
  ).run();
}

export const baselineEngineRoutes = engine;
