import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const demandSignals = new Hono();

demandSignals.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
};

const getUserId = (c) => {
  return c.get('userId') || null;
};

// ═══════════════════════════════════════════════════════════════════════
// DEMAND SIGNALS
// ═══════════════════════════════════════════════════════════════════════

// ── GET /  List demand signals ──────────────────────────────────────────
demandSignals.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { signal_type, source_id, customer_id, product_id, category, brand, channel, region, promotion_id, anomaly_flag, start_date, end_date, granularity, limit = 200, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM demand_signals WHERE company_id = ?';
    const params = [companyId];

    if (signal_type) { query += ' AND signal_type = ?'; params.push(signal_type); }
    if (source_id) { query += ' AND source_id = ?'; params.push(source_id); }
    if (customer_id) { query += ' AND customer_id = ?'; params.push(customer_id); }
    if (product_id) { query += ' AND product_id = ?'; params.push(product_id); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (brand) { query += ' AND brand = ?'; params.push(brand); }
    if (channel) { query += ' AND channel = ?'; params.push(channel); }
    if (region) { query += ' AND region = ?'; params.push(region); }
    if (promotion_id) { query += ' AND promotion_id = ?'; params.push(promotion_id); }
    if (anomaly_flag) { query += ' AND anomaly_flag = ?'; params.push(parseInt(anomaly_flag)); }
    if (granularity) { query += ' AND granularity = ?'; params.push(granularity); }
    if (start_date) { query += ' AND signal_date >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND signal_date <= ?'; params.push(end_date); }

    query += ' ORDER BY signal_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();

    const countQuery = 'SELECT COUNT(*) as total FROM demand_signals WHERE company_id = ?';
    const countResult = await db.prepare(countQuery).bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching demand signals:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /options  Configuration options ─────────────────────────────────
demandSignals.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      signalTypes: [
        { value: 'pos_sales', label: 'POS / Retail Sales' },
        { value: 'syndicated', label: 'Syndicated Data (Nielsen/IRI)' },
        { value: 'ecommerce', label: 'E-Commerce Sales' },
        { value: 'distributor', label: 'Distributor Shipments' },
        { value: 'warehouse', label: 'Warehouse Withdrawals' },
        { value: 'inventory', label: 'Inventory Levels' },
        { value: 'weather', label: 'Weather Data' },
        { value: 'social', label: 'Social Media Sentiment' },
        { value: 'search_trend', label: 'Search Trends' },
        { value: 'market_price', label: 'Market / Competitor Pricing' },
        { value: 'event', label: 'External Event (Holiday, Sports)' },
        { value: 'promotion_lift', label: 'Promotion Lift Measurement' },
        { value: 'forecast', label: 'Demand Forecast' },
        { value: 'other', label: 'Other' }
      ],
      sourceTypes: [
        { value: 'pos', label: 'POS System' },
        { value: 'syndicated', label: 'Syndicated Data Provider' },
        { value: 'erp', label: 'ERP System' },
        { value: 'ecommerce', label: 'E-Commerce Platform' },
        { value: 'weather_api', label: 'Weather API' },
        { value: 'social_api', label: 'Social Media API' },
        { value: 'manual', label: 'Manual Upload' },
        { value: 'api', label: 'External API' },
        { value: 'other', label: 'Other' }
      ],
      frequencies: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'biweekly', label: 'Bi-Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'on_demand', label: 'On Demand' }
      ],
      granularities: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' }
      ],
      trendDirections: [
        { value: 'up', label: 'Trending Up' },
        { value: 'down', label: 'Trending Down' },
        { value: 'stable', label: 'Stable' },
        { value: 'volatile', label: 'Volatile' }
      ],
      anomalyTypes: [
        { value: 'spike', label: 'Sales Spike' },
        { value: 'drop', label: 'Sales Drop' },
        { value: 'stockout', label: 'Stock-Out' },
        { value: 'price_change', label: 'Price Change' },
        { value: 'competitor', label: 'Competitor Activity' },
        { value: 'seasonal', label: 'Seasonal Anomaly' },
        { value: 'other', label: 'Other' }
      ]
    }
  });
});

// ── GET /summary  Aggregated signal statistics ──────────────────────────
demandSignals.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);

    const signalStats = await db.prepare(`
      SELECT
        COUNT(*) as total_signals,
        COUNT(DISTINCT source_id) as source_count,
        COUNT(DISTINCT customer_id) as customer_count,
        COUNT(DISTINCT product_id) as product_count,
        SUM(units_sold) as total_units,
        SUM(revenue) as total_revenue,
        SUM(incremental_units) as total_incremental_units,
        SUM(incremental_revenue) as total_incremental_revenue,
        AVG(lift_pct) as avg_lift,
        AVG(market_share_pct) as avg_market_share,
        SUM(CASE WHEN anomaly_flag = 1 THEN 1 ELSE 0 END) as anomaly_count,
        SUM(CASE WHEN out_of_stock_flag = 1 THEN 1 ELSE 0 END) as oos_count,
        SUM(CASE WHEN promo_flag = 1 THEN 1 ELSE 0 END) as promo_signal_count,
        MIN(signal_date) as earliest_date,
        MAX(signal_date) as latest_date
      FROM demand_signals WHERE company_id = ?
    `).bind(companyId).first();

    const sourceStats = await db.prepare(`
      SELECT
        COUNT(*) as total_sources,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_sources,
        SUM(record_count) as total_records
      FROM demand_signal_sources WHERE company_id = ?
    `).bind(companyId).first();

    const byType = await db.prepare(`
      SELECT signal_type, COUNT(*) as count, SUM(revenue) as revenue, AVG(lift_pct) as avg_lift
      FROM demand_signals WHERE company_id = ?
      GROUP BY signal_type ORDER BY count DESC
    `).bind(companyId).all();

    return c.json({
      success: true,
      data: {
        signals: {
          total: signalStats?.total_signals || 0,
          sourceCount: signalStats?.source_count || 0,
          customerCount: signalStats?.customer_count || 0,
          productCount: signalStats?.product_count || 0,
          totalUnits: signalStats?.total_units || 0,
          totalRevenue: signalStats?.total_revenue || 0,
          totalIncrementalUnits: signalStats?.total_incremental_units || 0,
          totalIncrementalRevenue: signalStats?.total_incremental_revenue || 0,
          avgLift: Math.round((signalStats?.avg_lift || 0) * 100) / 100,
          avgMarketShare: Math.round((signalStats?.avg_market_share || 0) * 100) / 100,
          anomalyCount: signalStats?.anomaly_count || 0,
          oosCount: signalStats?.oos_count || 0,
          promoSignalCount: signalStats?.promo_signal_count || 0,
          earliestDate: signalStats?.earliest_date || null,
          latestDate: signalStats?.latest_date || null
        },
        sources: {
          total: sourceStats?.total_sources || 0,
          active: sourceStats?.active_sources || 0,
          totalRecords: sourceStats?.total_records || 0
        },
        byType: (byType.results || []).map(r => ({
          type: r.signal_type,
          count: r.count,
          revenue: r.revenue || 0,
          avgLift: Math.round((r.avg_lift || 0) * 100) / 100
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching demand signal summary:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /trends  Trend analysis over time ───────────────────────────────
demandSignals.get('/trends', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { customer_id, product_id, category, channel, granularity = 'weekly', start_date, end_date } = c.req.query();

    let groupBy = "substr(signal_date, 1, 7)";
    if (granularity === 'daily') groupBy = "signal_date";
    if (granularity === 'weekly') groupBy = "substr(signal_date, 1, 7)";
    if (granularity === 'quarterly') groupBy = "substr(signal_date, 1, 4) || '-Q' || ((CAST(substr(signal_date,6,2) AS INTEGER)-1)/3+1)";

    let query = `
      SELECT ${groupBy} as period,
        SUM(units_sold) as units, SUM(revenue) as revenue,
        SUM(baseline_units) as baseline_units, SUM(baseline_revenue) as baseline_revenue,
        SUM(incremental_units) as incr_units, SUM(incremental_revenue) as incr_revenue,
        AVG(lift_pct) as avg_lift, AVG(market_share_pct) as avg_share,
        SUM(CASE WHEN anomaly_flag = 1 THEN 1 ELSE 0 END) as anomalies,
        COUNT(*) as signal_count
      FROM demand_signals WHERE company_id = ?
    `;
    const params = [companyId];

    if (customer_id) { query += ' AND customer_id = ?'; params.push(customer_id); }
    if (product_id) { query += ' AND product_id = ?'; params.push(product_id); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (channel) { query += ' AND channel = ?'; params.push(channel); }
    if (start_date) { query += ' AND signal_date >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND signal_date <= ?'; params.push(end_date); }

    query += ` GROUP BY ${groupBy} ORDER BY period ASC`;

    const result = await db.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: (result.results || []).map(r => ({
        period: r.period,
        units: r.units || 0,
        revenue: r.revenue || 0,
        baselineUnits: r.baseline_units || 0,
        baselineRevenue: r.baseline_revenue || 0,
        incrementalUnits: r.incr_units || 0,
        incrementalRevenue: r.incr_revenue || 0,
        avgLift: Math.round((r.avg_lift || 0) * 100) / 100,
        avgMarketShare: Math.round((r.avg_share || 0) * 100) / 100,
        anomalies: r.anomalies || 0,
        signalCount: r.signal_count || 0
      }))
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /anomalies  List detected anomalies ─────────────────────────────
demandSignals.get('/anomalies', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { limit = 50, offset = 0 } = c.req.query();

    const result = await db.prepare(`
      SELECT * FROM demand_signals
      WHERE company_id = ? AND anomaly_flag = 1
      ORDER BY signal_date DESC LIMIT ? OFFSET ?
    `).bind(companyId, parseInt(limit), parseInt(offset)).all();

    const countResult = await db.prepare(
      'SELECT COUNT(*) as total FROM demand_signals WHERE company_id = ? AND anomaly_flag = 1'
    ).bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0
    });
  } catch (error) {
    console.error('Error fetching anomalies:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /:id  Get signal by ID ──────────────────────────────────────────
demandSignals.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const signal = await db.prepare(
      'SELECT * FROM demand_signals WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!signal) {
      return c.json({ success: false, message: 'Demand signal not found' }, 404);
    }

    return c.json({ success: true, data: rowToDocument(signal) });
  } catch (error) {
    console.error('Error fetching demand signal:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /  Create a demand signal ──────────────────────────────────────
demandSignals.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    if (!body.signalDate && !body.signal_date) {
      return c.json({ success: false, message: 'Signal date is required' }, 400);
    }

    await db.prepare(`
      INSERT INTO demand_signals (
        id, company_id, source_id, source_name, signal_type, signal_date,
        period_start, period_end, granularity,
        customer_id, customer_name, product_id, product_name,
        category, brand, channel, region, store_id, store_name,
        units_sold, revenue, volume, avg_price,
        baseline_units, baseline_revenue, incremental_units, incremental_revenue, lift_pct,
        promo_flag, promotion_id, inventory_level, out_of_stock_flag,
        distribution_pct, price_index, competitor_price, market_share_pct,
        weather_condition, temperature, sentiment_score,
        trend_direction, confidence, anomaly_flag, anomaly_type,
        notes, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId,
      body.sourceId || body.source_id || null,
      body.sourceName || body.source_name || null,
      body.signalType || body.signal_type || 'pos_sales',
      body.signalDate || body.signal_date,
      body.periodStart || body.period_start || null,
      body.periodEnd || body.period_end || null,
      body.granularity || 'weekly',
      body.customerId || body.customer_id || null,
      body.customerName || body.customer_name || null,
      body.productId || body.product_id || null,
      body.productName || body.product_name || null,
      body.category || null,
      body.brand || null,
      body.channel || null,
      body.region || null,
      body.storeId || body.store_id || null,
      body.storeName || body.store_name || null,
      body.unitsSold || body.units_sold || 0,
      body.revenue || 0,
      body.volume || 0,
      body.avgPrice || body.avg_price || 0,
      body.baselineUnits || body.baseline_units || 0,
      body.baselineRevenue || body.baseline_revenue || 0,
      body.incrementalUnits || body.incremental_units || 0,
      body.incrementalRevenue || body.incremental_revenue || 0,
      body.liftPct || body.lift_pct || 0,
      body.promoFlag || body.promo_flag ? 1 : 0,
      body.promotionId || body.promotion_id || null,
      body.inventoryLevel || body.inventory_level || 0,
      body.outOfStockFlag || body.out_of_stock_flag ? 1 : 0,
      body.distributionPct || body.distribution_pct || 0,
      body.priceIndex || body.price_index || 0,
      body.competitorPrice || body.competitor_price || 0,
      body.marketSharePct || body.market_share_pct || 0,
      body.weatherCondition || body.weather_condition || null,
      body.temperature || null,
      body.sentimentScore || body.sentiment_score || null,
      body.trendDirection || body.trend_direction || null,
      body.confidence || 0,
      body.anomalyFlag || body.anomaly_flag ? 1 : 0,
      body.anomalyType || body.anomaly_type || null,
      body.notes || null,
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM demand_signals WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    console.error('Error creating demand signal:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── PUT /:id  Update a demand signal ────────────────────────────────────
demandSignals.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare(
      'SELECT * FROM demand_signals WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'Demand signal not found' }, 404);
    }

    await db.prepare(`
      UPDATE demand_signals SET
        source_id = ?, source_name = ?, signal_type = ?, signal_date = ?,
        period_start = ?, period_end = ?, granularity = ?,
        customer_id = ?, customer_name = ?, product_id = ?, product_name = ?,
        category = ?, brand = ?, channel = ?, region = ?, store_id = ?, store_name = ?,
        units_sold = ?, revenue = ?, volume = ?, avg_price = ?,
        baseline_units = ?, baseline_revenue = ?, incremental_units = ?, incremental_revenue = ?, lift_pct = ?,
        promo_flag = ?, promotion_id = ?, inventory_level = ?, out_of_stock_flag = ?,
        distribution_pct = ?, price_index = ?, competitor_price = ?, market_share_pct = ?,
        weather_condition = ?, temperature = ?, sentiment_score = ?,
        trend_direction = ?, confidence = ?, anomaly_flag = ?, anomaly_type = ?,
        notes = ?, data = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      (body.sourceId || body.source_id) ?? existing.source_id,
      (body.sourceName || body.source_name) ?? existing.source_name,
      body.signalType || body.signal_type || existing.signal_type,
      body.signalDate || body.signal_date || existing.signal_date,
      (body.periodStart || body.period_start) ?? existing.period_start,
      (body.periodEnd || body.period_end) ?? existing.period_end,
      body.granularity || existing.granularity,
      (body.customerId || body.customer_id) ?? existing.customer_id,
      (body.customerName || body.customer_name) ?? existing.customer_name,
      (body.productId || body.product_id) ?? existing.product_id,
      (body.productName || body.product_name) ?? existing.product_name,
      body.category ?? existing.category,
      body.brand ?? existing.brand,
      body.channel ?? existing.channel,
      body.region ?? existing.region,
      (body.storeId || body.store_id) ?? existing.store_id,
      (body.storeName || body.store_name) ?? existing.store_name,
      body.unitsSold ?? body.units_sold ?? existing.units_sold,
      body.revenue ?? existing.revenue,
      body.volume ?? existing.volume,
      body.avgPrice ?? body.avg_price ?? existing.avg_price,
      body.baselineUnits ?? body.baseline_units ?? existing.baseline_units,
      body.baselineRevenue ?? body.baseline_revenue ?? existing.baseline_revenue,
      body.incrementalUnits ?? body.incremental_units ?? existing.incremental_units,
      body.incrementalRevenue ?? body.incremental_revenue ?? existing.incremental_revenue,
      body.liftPct ?? body.lift_pct ?? existing.lift_pct,
      body.promoFlag !== undefined ? (body.promoFlag ? 1 : 0) : existing.promo_flag,
      (body.promotionId || body.promotion_id) ?? existing.promotion_id,
      body.inventoryLevel ?? body.inventory_level ?? existing.inventory_level,
      body.outOfStockFlag !== undefined ? (body.outOfStockFlag ? 1 : 0) : existing.out_of_stock_flag,
      body.distributionPct ?? body.distribution_pct ?? existing.distribution_pct,
      body.priceIndex ?? body.price_index ?? existing.price_index,
      body.competitorPrice ?? body.competitor_price ?? existing.competitor_price,
      body.marketSharePct ?? body.market_share_pct ?? existing.market_share_pct,
      body.weatherCondition ?? body.weather_condition ?? existing.weather_condition,
      body.temperature ?? existing.temperature,
      body.sentimentScore ?? body.sentiment_score ?? existing.sentiment_score,
      body.trendDirection ?? body.trend_direction ?? existing.trend_direction,
      body.confidence ?? existing.confidence,
      body.anomalyFlag !== undefined ? (body.anomalyFlag ? 1 : 0) : existing.anomaly_flag,
      body.anomalyType ?? body.anomaly_type ?? existing.anomaly_type,
      body.notes ?? existing.notes,
      JSON.stringify(body.data || JSON.parse(existing.data || '{}')),
      now, id
    ).run();

    const updated = await db.prepare('SELECT * FROM demand_signals WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error updating demand signal:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── DELETE /:id  Delete a demand signal ─────────────────────────────────
demandSignals.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const existing = await db.prepare(
      'SELECT * FROM demand_signals WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'Demand signal not found' }, 404);
    }

    await db.prepare('DELETE FROM demand_signals WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Demand signal deleted' });
  } catch (error) {
    console.error('Error deleting demand signal:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// SOURCES CRUD
// ═══════════════════════════════════════════════════════════════════════

// ── GET /sources/list  List all sources ─────────────────────────────────
demandSignals.get('/sources/list', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, source_type, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM demand_signal_sources WHERE company_id = ?';
    const params = [companyId];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (source_type) { query += ' AND source_type = ?'; params.push(source_type); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();

    const countQuery = 'SELECT COUNT(*) as total FROM demand_signal_sources WHERE company_id = ?';
    const countResult = await db.prepare(countQuery).bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0
    });
  } catch (error) {
    console.error('Error fetching sources:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /sources/:id  Get source by ID ──────────────────────────────────
demandSignals.get('/sources/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const source = await db.prepare(
      'SELECT * FROM demand_signal_sources WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!source) {
      return c.json({ success: false, message: 'Source not found' }, 404);
    }

    return c.json({ success: true, data: rowToDocument(source) });
  } catch (error) {
    console.error('Error fetching source:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /sources  Create a new source ──────────────────────────────────
demandSignals.post('/sources', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = getUserId(c);
    const id = generateId();
    const now = new Date().toISOString();

    if (!body.name) {
      return c.json({ success: false, message: 'Source name is required' }, 400);
    }

    await db.prepare(`
      INSERT INTO demand_signal_sources (
        id, company_id, name, description, source_type, provider, frequency,
        status, record_count, config, created_by, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId,
      body.name,
      body.description || null,
      body.sourceType || body.source_type || 'pos',
      body.provider || null,
      body.frequency || 'weekly',
      body.status || 'active',
      body.recordCount || body.record_count || 0,
      JSON.stringify(body.config || {}),
      userId,
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM demand_signal_sources WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    console.error('Error creating source:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── PUT /sources/:id  Update a source ───────────────────────────────────
demandSignals.put('/sources/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare(
      'SELECT * FROM demand_signal_sources WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'Source not found' }, 404);
    }

    await db.prepare(`
      UPDATE demand_signal_sources SET
        name = ?, description = ?, source_type = ?, provider = ?, frequency = ?,
        status = ?, record_count = ?, config = ?, data = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.name || existing.name,
      body.description ?? existing.description,
      body.sourceType || body.source_type || existing.source_type,
      body.provider ?? existing.provider,
      body.frequency || existing.frequency,
      body.status || existing.status,
      body.recordCount ?? body.record_count ?? existing.record_count,
      JSON.stringify(body.config || JSON.parse(existing.config || '{}')),
      JSON.stringify(body.data || JSON.parse(existing.data || '{}')),
      now, id
    ).run();

    const updated = await db.prepare('SELECT * FROM demand_signal_sources WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error updating source:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── DELETE /sources/:id  Delete a source ────────────────────────────────
demandSignals.delete('/sources/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const existing = await db.prepare(
      'SELECT * FROM demand_signal_sources WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'Source not found' }, 404);
    }

    await db.prepare('DELETE FROM demand_signal_sources WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Source deleted' });
  } catch (error) {
    console.error('Error deleting source:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export const demandSignalRoutes = demandSignals;
