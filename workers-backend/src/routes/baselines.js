import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const baselines = new Hono();

baselines.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
};

const getUserId = (c) => {
  return c.get('userId') || null;
};

// ── GET /  List all baselines ──────────────────────────────────────────
baselines.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, baseline_type, customer_id, product_id, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM baselines WHERE company_id = ?';
    const params = [companyId];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (baseline_type) { query += ' AND baseline_type = ?'; params.push(baseline_type); }
    if (customer_id) { query += ' AND customer_id = ?'; params.push(customer_id); }
    if (product_id) { query += ' AND product_id = ?'; params.push(product_id); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();

    const countQuery = 'SELECT COUNT(*) as total FROM baselines WHERE company_id = ?';
    const countResult = await db.prepare(countQuery).bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching baselines:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /options  Baseline configuration options ───────────────────────
baselines.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      baselineTypes: [
        { value: 'volume', label: 'Volume Baseline' },
        { value: 'revenue', label: 'Revenue Baseline' },
        { value: 'units', label: 'Units Baseline' }
      ],
      calculationMethods: [
        { value: 'historical_average', label: 'Historical Average' },
        { value: 'moving_average', label: 'Moving Average (12-week)' },
        { value: 'weighted_moving_average', label: 'Weighted Moving Average' },
        { value: 'linear_regression', label: 'Linear Regression (Trend)' },
        { value: 'seasonal_decomposition', label: 'Seasonal Decomposition' },
        { value: 'exponential_smoothing', label: 'Exponential Smoothing' }
      ],
      granularities: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' }
      ],
      statuses: [
        { value: 'draft', label: 'Draft' },
        { value: 'calculating', label: 'Calculating' },
        { value: 'active', label: 'Active' },
        { value: 'approved', label: 'Approved' },
        { value: 'archived', label: 'Archived' }
      ]
    }
  });
});

// ── GET /summary  Aggregated baseline statistics ──────────────────────
baselines.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);

    const stats = await db.prepare(`
      SELECT
        COUNT(*) as total_baselines,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_baselines,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_baselines,
        AVG(confidence_level) as avg_confidence,
        AVG(mape) as avg_mape,
        AVG(r_squared) as avg_r_squared,
        SUM(total_base_volume) as total_base_volume,
        SUM(total_base_revenue) as total_base_revenue
      FROM baselines WHERE company_id = ?
    `).bind(companyId).first();

    const decomp = await db.prepare(`
      SELECT
        COUNT(*) as total_decompositions,
        SUM(incremental_volume) as total_incremental_volume,
        SUM(incremental_revenue) as total_incremental_revenue,
        AVG(lift_pct) as avg_lift_pct,
        AVG(roi) as avg_roi,
        SUM(cannibalization_volume) as total_cannibalization,
        SUM(halo_volume) as total_halo
      FROM volume_decomposition WHERE company_id = ?
    `).bind(companyId).first();

    return c.json({
      success: true,
      data: {
        baselines: {
          total: stats?.total_baselines || 0,
          active: stats?.active_baselines || 0,
          draft: stats?.draft_baselines || 0,
          avgConfidence: Math.round((stats?.avg_confidence || 0) * 100) / 100,
          avgMAPE: Math.round((stats?.avg_mape || 0) * 100) / 100,
          avgRSquared: Math.round((stats?.avg_r_squared || 0) * 100) / 100,
          totalBaseVolume: stats?.total_base_volume || 0,
          totalBaseRevenue: stats?.total_base_revenue || 0
        },
        decomposition: {
          total: decomp?.total_decompositions || 0,
          totalIncrementalVolume: decomp?.total_incremental_volume || 0,
          totalIncrementalRevenue: decomp?.total_incremental_revenue || 0,
          avgLiftPct: Math.round((decomp?.avg_lift_pct || 0) * 100) / 100,
          avgROI: Math.round((decomp?.avg_roi || 0) * 100) / 100,
          totalCannibalization: decomp?.total_cannibalization || 0,
          totalHalo: decomp?.total_halo || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching baseline summary:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /:id  Get baseline by ID ──────────────────────────────────────
baselines.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const baseline = await db.prepare(
      'SELECT * FROM baselines WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!baseline) {
      return c.json({ success: false, message: 'Baseline not found' }, 404);
    }

    const periods = await db.prepare(
      'SELECT * FROM baseline_periods WHERE baseline_id = ? AND company_id = ? ORDER BY period_number ASC'
    ).bind(id, companyId).all();

    const decompositions = await db.prepare(
      'SELECT * FROM volume_decomposition WHERE baseline_id = ? AND company_id = ? ORDER BY period_start ASC'
    ).bind(id, companyId).all();

    return c.json({
      success: true,
      data: {
        ...rowToDocument(baseline),
        periods: (periods.results || []).map(rowToDocument),
        decompositions: (decompositions.results || []).map(rowToDocument)
      }
    });
  } catch (error) {
    console.error('Error fetching baseline:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /  Create a new baseline ─────────────────────────────────────
baselines.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = getUserId(c);
    const id = generateId();
    const now = new Date().toISOString();

    if (!body.name) {
      return c.json({ success: false, message: 'Baseline name is required' }, 400);
    }

    await db.prepare(`
      INSERT INTO baselines (
        id, company_id, name, description, status, baseline_type,
        calculation_method, granularity, customer_id, product_id,
        category, brand, channel, region,
        start_date, end_date, base_year, periods_used,
        seasonality_enabled, trend_enabled,
        outlier_removal_enabled, outlier_threshold,
        confidence_level, created_by, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId,
      body.name,
      body.description || null,
      body.baselineType || body.baseline_type || 'volume',
      body.calculationMethod || body.calculation_method || 'historical_average',
      body.granularity || 'weekly',
      body.customerId || body.customer_id || null,
      body.productId || body.product_id || null,
      body.category || null,
      body.brand || null,
      body.channel || null,
      body.region || null,
      body.startDate || body.start_date || null,
      body.endDate || body.end_date || null,
      body.baseYear || body.base_year || new Date().getFullYear() - 1,
      body.periodsUsed || body.periods_used || 52,
      body.seasonalityEnabled !== undefined ? (body.seasonalityEnabled ? 1 : 0) : 1,
      body.trendEnabled !== undefined ? (body.trendEnabled ? 1 : 0) : 1,
      body.outlierRemovalEnabled !== undefined ? (body.outlierRemovalEnabled ? 1 : 0) : 1,
      body.outlierThreshold || body.outlier_threshold || 2.0,
      body.confidenceLevel || body.confidence_level || 0.85,
      userId,
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM baselines WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    console.error('Error creating baseline:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── PUT /:id  Update a baseline ───────────────────────────────────────
baselines.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare(
      'SELECT * FROM baselines WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'Baseline not found' }, 404);
    }

    await db.prepare(`
      UPDATE baselines SET
        name = ?, description = ?, status = ?, baseline_type = ?,
        calculation_method = ?, granularity = ?,
        customer_id = ?, product_id = ?,
        category = ?, brand = ?, channel = ?, region = ?,
        start_date = ?, end_date = ?, base_year = ?, periods_used = ?,
        seasonality_enabled = ?, trend_enabled = ?,
        outlier_removal_enabled = ?, outlier_threshold = ?,
        confidence_level = ?, data = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.name || existing.name,
      body.description ?? existing.description,
      body.status || existing.status,
      body.baselineType || body.baseline_type || existing.baseline_type,
      body.calculationMethod || body.calculation_method || existing.calculation_method,
      body.granularity || existing.granularity,
      body.customerId || body.customer_id || existing.customer_id,
      body.productId || body.product_id || existing.product_id,
      body.category ?? existing.category,
      body.brand ?? existing.brand,
      body.channel ?? existing.channel,
      body.region ?? existing.region,
      body.startDate || body.start_date || existing.start_date,
      body.endDate || body.end_date || existing.end_date,
      body.baseYear || body.base_year || existing.base_year,
      body.periodsUsed || body.periods_used || existing.periods_used,
      body.seasonalityEnabled !== undefined ? (body.seasonalityEnabled ? 1 : 0) : existing.seasonality_enabled,
      body.trendEnabled !== undefined ? (body.trendEnabled ? 1 : 0) : existing.trend_enabled,
      body.outlierRemovalEnabled !== undefined ? (body.outlierRemovalEnabled ? 1 : 0) : existing.outlier_removal_enabled,
      body.outlierThreshold || body.outlier_threshold || existing.outlier_threshold,
      body.confidenceLevel || body.confidence_level || existing.confidence_level,
      JSON.stringify(body.data || JSON.parse(existing.data || '{}')),
      now, id
    ).run();

    const updated = await db.prepare('SELECT * FROM baselines WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error updating baseline:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── DELETE /:id  Delete a baseline and its periods/decompositions ─────
baselines.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const existing = await db.prepare(
      'SELECT * FROM baselines WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'Baseline not found' }, 404);
    }

    await db.prepare('DELETE FROM volume_decomposition WHERE baseline_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM baseline_periods WHERE baseline_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM baselines WHERE id = ?').bind(id).run();

    return c.json({ success: true, message: 'Baseline deleted' });
  } catch (error) {
    console.error('Error deleting baseline:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /:id/calculate  Run baseline calculation ─────────────────────
// This is the core algorithm: takes historical sales data, removes promoted
// periods, applies seasonality decomposition + trend, and produces a
// per-period baseline forecast.
baselines.post('/:id/calculate', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();

    const baseline = await db.prepare(
      'SELECT * FROM baselines WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!baseline) {
      return c.json({ success: false, message: 'Baseline not found' }, 404);
    }

    await db.prepare(
      "UPDATE baselines SET status = 'calculating', updated_at = ? WHERE id = ?"
    ).bind(now, id).run();

    // Step 1: Gather historical trade spend data for the base year
    let historicalQuery = `
      SELECT
        ts.amount, ts.created_at, ts.customer_id, ts.product_id,
        p.start_date as promo_start, p.end_date as promo_end
      FROM trade_spends ts
      LEFT JOIN promotions p ON ts.promotion_id = p.id
      WHERE ts.company_id = ?
    `;
    const histParams = [companyId];

    if (baseline.customer_id) {
      historicalQuery += ' AND ts.customer_id = ?';
      histParams.push(baseline.customer_id);
    }
    if (baseline.product_id) {
      historicalQuery += ' AND ts.product_id = ?';
      histParams.push(baseline.product_id);
    }

    historicalQuery += ' ORDER BY ts.created_at ASC';
    const historical = await db.prepare(historicalQuery).bind(...histParams).all();
    const rows = historical.results || [];

    // Step 2: Determine period boundaries based on granularity
    const granularity = baseline.granularity || 'weekly';
    const baseYear = baseline.base_year || new Date().getFullYear() - 1;
    const periodsCount = granularity === 'weekly' ? 52 : granularity === 'monthly' ? 12 : granularity === 'quarterly' ? 4 : 365;

    // Step 3: Bucket historical data into periods, flagging promoted periods
    const periodBuckets = [];
    for (let i = 0; i < periodsCount; i++) {
      const periodStart = new Date(baseYear, 0, 1);
      const periodEnd = new Date(baseYear, 0, 1);

      if (granularity === 'weekly') {
        periodStart.setDate(periodStart.getDate() + i * 7);
        periodEnd.setDate(periodStart.getDate() + 6);
      } else if (granularity === 'monthly') {
        periodStart.setMonth(i);
        periodEnd.setMonth(i + 1);
        periodEnd.setDate(0);
      } else if (granularity === 'quarterly') {
        periodStart.setMonth(i * 3);
        periodEnd.setMonth((i + 1) * 3);
        periodEnd.setDate(0);
      }

      const pStart = periodStart.toISOString().split('T')[0];
      const pEnd = periodEnd.toISOString().split('T')[0];

      const periodRows = rows.filter(r => {
        const d = (r.created_at || '').split('T')[0];
        return d >= pStart && d <= pEnd;
      });

      const isPromoted = periodRows.some(r => r.promo_start && r.promo_end);
      const totalAmount = periodRows.reduce((sum, r) => sum + (r.amount || 0), 0);

      periodBuckets.push({
        periodNumber: i + 1,
        periodStart: pStart,
        periodEnd: pEnd,
        totalAmount,
        isPromoted,
        rowCount: periodRows.length
      });
    }

    // Step 4: Calculate base volume using only non-promoted periods
    const nonPromotedPeriods = periodBuckets.filter(p => !p.isPromoted && p.totalAmount > 0);
    const allPeriods = periodBuckets.filter(p => p.totalAmount > 0);
    const sourceData = nonPromotedPeriods.length >= 4 ? nonPromotedPeriods : allPeriods;

    let avgBaseAmount = 0;
    if (sourceData.length > 0) {
      avgBaseAmount = sourceData.reduce((s, p) => s + p.totalAmount, 0) / sourceData.length;
    }

    // Step 5: Optional outlier removal (IQR method)
    let cleanedData = sourceData;
    if (baseline.outlier_removal_enabled && sourceData.length >= 8) {
      const sorted = [...sourceData].sort((a, b) => a.totalAmount - b.totalAmount);
      const q1Idx = Math.floor(sorted.length * 0.25);
      const q3Idx = Math.floor(sorted.length * 0.75);
      const q1 = sorted[q1Idx].totalAmount;
      const q3 = sorted[q3Idx].totalAmount;
      const iqr = q3 - q1;
      const threshold = baseline.outlier_threshold || 2.0;
      const lower = q1 - threshold * iqr;
      const upper = q3 + threshold * iqr;
      cleanedData = sourceData.filter(p => p.totalAmount >= lower && p.totalAmount <= upper);

      if (cleanedData.length > 0) {
        avgBaseAmount = cleanedData.reduce((s, p) => s + p.totalAmount, 0) / cleanedData.length;
      }
    }

    // Step 6: Seasonality index calculation
    const seasonalityIndex = {};
    if (baseline.seasonality_enabled && cleanedData.length >= periodsCount * 0.5) {
      for (const p of periodBuckets) {
        if (avgBaseAmount > 0 && p.totalAmount > 0 && !p.isPromoted) {
          seasonalityIndex[p.periodNumber] = Math.round((p.totalAmount / avgBaseAmount) * 100) / 100;
        } else {
          seasonalityIndex[p.periodNumber] = 1.0;
        }
      }
    } else {
      for (let i = 1; i <= periodsCount; i++) {
        seasonalityIndex[i] = 1.0;
      }
    }

    // Step 7: Trend coefficient (simple linear regression on non-promoted periods)
    let trendCoefficient = 0;
    let rSquared = 0;
    if (baseline.trend_enabled && cleanedData.length >= 4) {
      const n = cleanedData.length;
      const xVals = cleanedData.map((_, i) => i);
      const yVals = cleanedData.map(p => p.totalAmount);
      const xMean = xVals.reduce((s, x) => s + x, 0) / n;
      const yMean = yVals.reduce((s, y) => s + y, 0) / n;

      let ssXY = 0, ssXX = 0, ssTot = 0, ssRes = 0;
      for (let i = 0; i < n; i++) {
        ssXY += (xVals[i] - xMean) * (yVals[i] - yMean);
        ssXX += (xVals[i] - xMean) * (xVals[i] - xMean);
        ssTot += (yVals[i] - yMean) * (yVals[i] - yMean);
      }

      if (ssXX > 0) {
        trendCoefficient = ssXY / ssXX;
        const intercept = yMean - trendCoefficient * xMean;
        for (let i = 0; i < n; i++) {
          const predicted = intercept + trendCoefficient * xVals[i];
          ssRes += (yVals[i] - predicted) * (yVals[i] - predicted);
        }
        rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;
      }
    }

    // Step 8: Calculate MAPE (mean absolute percentage error) against actuals
    let mape = 0;
    const mapeCalcPeriods = periodBuckets.filter(p => p.totalAmount > 0);
    if (mapeCalcPeriods.length > 0) {
      let totalAPE = 0;
      for (const p of mapeCalcPeriods) {
        const predicted = avgBaseAmount * (seasonalityIndex[p.periodNumber] || 1.0) + trendCoefficient * (p.periodNumber - 1);
        if (p.totalAmount > 0) {
          totalAPE += Math.abs((p.totalAmount - predicted) / p.totalAmount);
        }
      }
      mape = (totalAPE / mapeCalcPeriods.length) * 100;
    }

    // Step 9: Store baseline period records
    await db.prepare('DELETE FROM baseline_periods WHERE baseline_id = ? AND company_id = ?').bind(id, companyId).run();

    const totalBaseVolume = periodBuckets.reduce((s, p) => {
      const factor = seasonalityIndex[p.periodNumber] || 1.0;
      return s + avgBaseAmount * factor;
    }, 0);

    for (const p of periodBuckets) {
      const factor = seasonalityIndex[p.periodNumber] || 1.0;
      const trendAdj = trendCoefficient * (p.periodNumber - 1);
      const baseVolume = avgBaseAmount * factor + trendAdj;
      const actualVolume = p.totalAmount;
      const varianceVolume = actualVolume - baseVolume;
      const variancePct = baseVolume > 0 ? (varianceVolume / baseVolume) * 100 : 0;
      const incrementalVolume = p.isPromoted ? Math.max(0, actualVolume - baseVolume) : 0;

      const periodId = generateId();
      await db.prepare(`
        INSERT INTO baseline_periods (
          id, company_id, baseline_id, period_start, period_end,
          period_number, period_label, base_volume, base_revenue,
          seasonality_factor, trend_adjustment,
          actual_volume, variance_volume, variance_pct,
          is_promoted, incremental_volume,
          data, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        periodId, companyId, id,
        p.periodStart, p.periodEnd,
        p.periodNumber,
        `${granularity === 'weekly' ? 'W' : granularity === 'monthly' ? 'M' : 'Q'}${p.periodNumber}`,
        Math.round(baseVolume * 100) / 100,
        Math.round(baseVolume * 100) / 100,
        factor,
        Math.round(trendAdj * 100) / 100,
        actualVolume,
        Math.round(varianceVolume * 100) / 100,
        Math.round(variancePct * 100) / 100,
        p.isPromoted ? 1 : 0,
        Math.round(incrementalVolume * 100) / 100,
        JSON.stringify({}),
        now, now
      ).run();
    }

    // Step 10: Update the baseline record with calculated values
    const confidenceLevel = Math.max(0, Math.min(1, 1 - (mape / 100)));

    await db.prepare(`
      UPDATE baselines SET
        status = 'active',
        total_base_volume = ?, total_base_revenue = ?,
        avg_weekly_volume = ?, avg_weekly_revenue = ?,
        seasonality_index = ?, trend_coefficient = ?,
        r_squared = ?, mape = ?, confidence_level = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      Math.round(totalBaseVolume * 100) / 100,
      Math.round(totalBaseVolume * 100) / 100,
      Math.round(avgBaseAmount * 100) / 100,
      Math.round(avgBaseAmount * 100) / 100,
      JSON.stringify(seasonalityIndex),
      Math.round(trendCoefficient * 1000) / 1000,
      Math.round(rSquared * 1000) / 1000,
      Math.round(mape * 100) / 100,
      Math.round(confidenceLevel * 1000) / 1000,
      now, id
    ).run();

    const updated = await db.prepare('SELECT * FROM baselines WHERE id = ?').bind(id).first();
    const periods = await db.prepare(
      'SELECT * FROM baseline_periods WHERE baseline_id = ? ORDER BY period_number ASC'
    ).bind(id).all();

    return c.json({
      success: true,
      data: {
        ...rowToDocument(updated),
        periods: (periods.results || []).map(rowToDocument)
      },
      calculation: {
        periodsAnalyzed: periodBuckets.length,
        nonPromotedPeriods: nonPromotedPeriods.length,
        outliersRemoved: sourceData.length - cleanedData.length,
        avgBaseAmount: Math.round(avgBaseAmount * 100) / 100,
        trendCoefficient: Math.round(trendCoefficient * 1000) / 1000,
        rSquared: Math.round(rSquared * 1000) / 1000,
        mape: Math.round(mape * 100) / 100,
        confidenceLevel: Math.round(confidenceLevel * 1000) / 1000
      }
    });
  } catch (error) {
    console.error('Error calculating baseline:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /:id/decompose  Volume decomposition for a promotion ─────────
// Given a baseline and a promotion, decompose actual sales into:
// base + incremental + cannibalization + pantry-loading + halo + pull-forward
baselines.post('/:id/decompose', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const baseline = await db.prepare(
      'SELECT * FROM baselines WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!baseline) {
      return c.json({ success: false, message: 'Baseline not found' }, 404);
    }

    const promotionId = body.promotionId || body.promotion_id;
    if (!promotionId) {
      return c.json({ success: false, message: 'promotionId is required' }, 400);
    }

    const promotion = await db.prepare(
      'SELECT * FROM promotions WHERE id = ? AND company_id = ?'
    ).bind(promotionId, companyId).first();

    if (!promotion) {
      return c.json({ success: false, message: 'Promotion not found' }, 404);
    }

    // Get baseline periods that overlap with promotion dates
    const promoStart = promotion.start_date;
    const promoEnd = promotion.end_date;

    const overlappingPeriods = await db.prepare(`
      SELECT * FROM baseline_periods
      WHERE baseline_id = ? AND company_id = ?
      AND period_start <= ? AND period_end >= ?
      ORDER BY period_number ASC
    `).bind(id, companyId, promoEnd, promoStart).all();

    const periods = overlappingPeriods.results || [];
    const totalBaseVolume = periods.reduce((s, p) => s + (p.base_volume || 0), 0);

    // Get actual trade spend for this promotion
    const spendResult = await db.prepare(
      'SELECT SUM(amount) as total FROM trade_spends WHERE promotion_id = ? AND company_id = ?'
    ).bind(promotionId, companyId).first();
    const totalTradeSpend = spendResult?.total || 0;

    // Get actual volume from promotion data
    const promoData = JSON.parse(promotion.data || '{}');
    const actualRevenue = promoData.financial?.actualRevenue || promoData.actualRevenue || 0;
    const totalActualVolume = actualRevenue || totalTradeSpend * 3;

    // Decompose the volume
    const incrementalVolume = Math.max(0, totalActualVolume - totalBaseVolume);
    const liftPct = totalBaseVolume > 0 ? (incrementalVolume / totalBaseVolume) * 100 : 0;

    // Heuristic decomposition ratios (based on industry benchmarks)
    // These can be calibrated with real data over time
    const cannibalizationRate = body.cannibalizationRate || 0.08;
    const pantryLoadingRate = body.pantryLoadingRate || 0.05;
    const haloRate = body.haloRate || 0.03;
    const pullForwardRate = body.pullForwardRate || 0.04;

    const cannibalizationVolume = incrementalVolume * cannibalizationRate;
    const pantryLoadingVolume = incrementalVolume * pantryLoadingRate;
    const haloVolume = incrementalVolume * haloRate;
    const pullForwardVolume = incrementalVolume * pullForwardRate;
    const trueIncrementalVolume = incrementalVolume - cannibalizationVolume - pantryLoadingVolume - pullForwardVolume + haloVolume;

    const incrementalRevenue = trueIncrementalVolume;
    const incrementalProfit = incrementalRevenue - totalTradeSpend;
    const roi = totalTradeSpend > 0 ? incrementalRevenue / totalTradeSpend : 0;
    const efficiencyScore = Math.min(100, Math.max(0, roi * 25 + (liftPct > 10 ? 20 : 0) + (cannibalizationRate < 0.1 ? 15 : 0)));

    // Delete any existing decomposition for this baseline+promotion
    await db.prepare(
      'DELETE FROM volume_decomposition WHERE baseline_id = ? AND promotion_id = ? AND company_id = ?'
    ).bind(id, promotionId, companyId).run();

    const decompId = generateId();
    await db.prepare(`
      INSERT INTO volume_decomposition (
        id, company_id, baseline_id, promotion_id,
        customer_id, product_id, period_start, period_end,
        total_volume, base_volume, incremental_volume,
        cannibalization_volume, pantry_loading_volume,
        halo_volume, pull_forward_volume, post_promo_dip_volume,
        total_revenue, base_revenue, incremental_revenue,
        trade_spend, incremental_profit, roi, lift_pct,
        efficiency_score, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      decompId, companyId, id, promotionId,
      baseline.customer_id, baseline.product_id,
      promoStart, promoEnd,
      Math.round(totalActualVolume * 100) / 100,
      Math.round(totalBaseVolume * 100) / 100,
      Math.round(trueIncrementalVolume * 100) / 100,
      Math.round(cannibalizationVolume * 100) / 100,
      Math.round(pantryLoadingVolume * 100) / 100,
      Math.round(haloVolume * 100) / 100,
      Math.round(pullForwardVolume * 100) / 100,
      0,
      Math.round(totalActualVolume * 100) / 100,
      Math.round(totalBaseVolume * 100) / 100,
      Math.round(incrementalRevenue * 100) / 100,
      Math.round(totalTradeSpend * 100) / 100,
      Math.round(incrementalProfit * 100) / 100,
      Math.round(roi * 100) / 100,
      Math.round(liftPct * 100) / 100,
      Math.round(efficiencyScore * 100) / 100,
      JSON.stringify({
        cannibalizationRate,
        pantryLoadingRate,
        haloRate,
        pullForwardRate,
        overlappingPeriods: periods.length
      }),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM volume_decomposition WHERE id = ?').bind(decompId).first();

    return c.json({
      success: true,
      data: rowToDocument(created),
      analysis: {
        baseVolume: Math.round(totalBaseVolume * 100) / 100,
        actualVolume: Math.round(totalActualVolume * 100) / 100,
        incrementalVolume: Math.round(trueIncrementalVolume * 100) / 100,
        liftPct: Math.round(liftPct * 100) / 100,
        roi: Math.round(roi * 100) / 100,
        efficiencyScore: Math.round(efficiencyScore * 100) / 100,
        breakdown: {
          cannibalization: Math.round(cannibalizationVolume * 100) / 100,
          pantryLoading: Math.round(pantryLoadingVolume * 100) / 100,
          halo: Math.round(haloVolume * 100) / 100,
          pullForward: Math.round(pullForwardVolume * 100) / 100
        }
      }
    });
  } catch (error) {
    console.error('Error decomposing volume:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /:id/approve  Approve a baseline ─────────────────────────────
baselines.post('/:id/approve', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const userId = getUserId(c);
    const now = new Date().toISOString();

    const existing = await db.prepare(
      'SELECT * FROM baselines WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'Baseline not found' }, 404);
    }

    await db.prepare(`
      UPDATE baselines SET status = 'approved', approved_by = ?, approved_at = ?, updated_at = ?
      WHERE id = ?
    `).bind(userId, now, now, id).run();

    const updated = await db.prepare('SELECT * FROM baselines WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error approving baseline:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /:id/decompositions  List all decompositions for a baseline ───
baselines.get('/:id/decompositions', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const result = await db.prepare(`
      SELECT vd.*, p.name as promotion_name
      FROM volume_decomposition vd
      LEFT JOIN promotions p ON vd.promotion_id = p.id
      WHERE vd.baseline_id = ? AND vd.company_id = ?
      ORDER BY vd.created_at DESC
    `).bind(id, companyId).all();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument)
    });
  } catch (error) {
    console.error('Error fetching decompositions:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export const baselineRoutes = baselines;
