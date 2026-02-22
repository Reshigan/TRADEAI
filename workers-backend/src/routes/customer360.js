import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const customer360 = new Hono();

customer360.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
};

const getUserId = (c) => {
  return c.get('userId') || null;
};

customer360.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      tiers: [
        { value: 'platinum', label: 'Platinum' },
        { value: 'gold', label: 'Gold' },
        { value: 'silver', label: 'Silver' },
        { value: 'bronze', label: 'Bronze' }
      ],
      segments: [
        { value: 'strategic', label: 'Strategic' },
        { value: 'key_account', label: 'Key Account' },
        { value: 'growth', label: 'Growth' },
        { value: 'maintain', label: 'Maintain' },
        { value: 'at_risk', label: 'At Risk' }
      ],
      insightTypes: [
        { value: 'revenue_trend', label: 'Revenue Trend' },
        { value: 'churn_alert', label: 'Churn Alert' },
        { value: 'opportunity', label: 'Opportunity' },
        { value: 'performance', label: 'Performance' },
        { value: 'recommendation', label: 'Recommendation' },
        { value: 'anomaly', label: 'Anomaly' }
      ],
      severities: [
        { value: 'critical', label: 'Critical' },
        { value: 'warning', label: 'Warning' },
        { value: 'info', label: 'Info' },
        { value: 'success', label: 'Success' }
      ],
      healthScoreRanges: [
        { min: 80, max: 100, label: 'Excellent', color: '#10B981' },
        { min: 60, max: 79, label: 'Good', color: '#3B82F6' },
        { min: 40, max: 59, label: 'Fair', color: '#F59E0B' },
        { min: 0, max: 39, label: 'Poor', color: '#EF4444' }
      ]
    }
  });
});

customer360.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);

    const totalResult = await db.prepare('SELECT COUNT(*) as total FROM customer_360_profiles WHERE company_id = ?').bind(companyId).first();
    const activeResult = await db.prepare("SELECT COUNT(*) as total FROM customer_360_profiles WHERE company_id = ? AND status = 'active'").bind(companyId).first();
    const atRiskResult = await db.prepare("SELECT COUNT(*) as total FROM customer_360_profiles WHERE company_id = ? AND churn_risk > 0.5").bind(companyId).first();
    const avgHealthResult = await db.prepare('SELECT AVG(health_score) as avg_health FROM customer_360_profiles WHERE company_id = ?').bind(companyId).first();
    const revenueResult = await db.prepare('SELECT SUM(total_revenue) as total_rev, SUM(total_spend) as total_spend FROM customer_360_profiles WHERE company_id = ?').bind(companyId).first();
    const segmentResult = await db.prepare('SELECT segment, COUNT(*) as count FROM customer_360_profiles WHERE company_id = ? GROUP BY segment').bind(companyId).all();
    const tierResult = await db.prepare('SELECT tier, COUNT(*) as count FROM customer_360_profiles WHERE company_id = ? GROUP BY tier').bind(companyId).all();

    return c.json({
      success: true,
      data: {
        totalCustomers: totalResult?.total || 0,
        activeCustomers: activeResult?.total || 0,
        atRiskCustomers: atRiskResult?.total || 0,
        avgHealthScore: Math.round((avgHealthResult?.avg_health || 0) * 10) / 10,
        totalRevenue: revenueResult?.total_rev || 0,
        totalSpend: revenueResult?.total_spend || 0,
        bySegment: (segmentResult.results || []).map(r => ({ segment: r.segment, count: r.count })),
        byTier: (tierResult.results || []).map(r => ({ tier: r.tier, count: r.count }))
      }
    });
  } catch (error) {
    console.error('Error fetching customer 360 summary:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

customer360.get('/profiles', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, tier, segment, search, sort_by = 'total_revenue', sort_order = 'desc', limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM customer_360_profiles WHERE company_id = ?';
    const params = [companyId];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (tier) { query += ' AND tier = ?'; params.push(tier); }
    if (segment) { query += ' AND segment = ?'; params.push(segment); }
    if (search) { query += ' AND (customer_name LIKE ? OR customer_code LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const allowedSorts = ['total_revenue', 'health_score', 'churn_risk', 'ltv_score', 'trade_spend_pct', 'revenue_growth_pct', 'created_at'];
    const sortCol = allowedSorts.includes(sort_by) ? sort_by : 'total_revenue';
    const sortDir = sort_order === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortCol} ${sortDir} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();

    const countQuery = 'SELECT COUNT(*) as total FROM customer_360_profiles WHERE company_id = ?';
    const countResult = await db.prepare(countQuery).bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching customer 360 profiles:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

customer360.get('/profiles/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const profile = await db.prepare('SELECT * FROM customer_360_profiles WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!profile) {
      const profileByCustomer = await db.prepare('SELECT * FROM customer_360_profiles WHERE customer_id = ? AND company_id = ?').bind(id, companyId).first();
      if (!profileByCustomer) {
        return c.json({ success: false, message: 'Customer 360 profile not found' }, 404);
      }
      return c.json({ success: true, data: rowToDocument(profileByCustomer) });
    }

    return c.json({ success: true, data: rowToDocument(profile) });
  } catch (error) {
    console.error('Error fetching customer 360 profile:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

customer360.post('/profiles', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO customer_360_profiles (id, company_id, customer_id, customer_name, customer_code, channel, sub_channel, tier, region, status, total_revenue, total_spend, total_claims, total_deductions, net_revenue, gross_margin_pct, trade_spend_pct, revenue_growth_pct, avg_order_value, order_frequency, last_order_date, active_promotions, completed_promotions, active_claims, pending_deductions, ltv_score, churn_risk, churn_reason, segment, price_sensitivity, promo_responsiveness, next_best_action, health_score, satisfaction_score, engagement_score, payment_reliability, top_products, top_categories, monthly_revenue, monthly_spend, last_calculated_at, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId,
      body.customerId || body.customer_id || '',
      body.customerName || body.customer_name || '',
      body.customerCode || body.customer_code || '',
      body.channel || '',
      body.subChannel || body.sub_channel || '',
      body.tier || 'bronze',
      body.region || '',
      body.status || 'active',
      body.totalRevenue || body.total_revenue || 0,
      body.totalSpend || body.total_spend || 0,
      body.totalClaims || body.total_claims || 0,
      body.totalDeductions || body.total_deductions || 0,
      body.netRevenue || body.net_revenue || 0,
      body.grossMarginPct || body.gross_margin_pct || 0,
      body.tradeSpendPct || body.trade_spend_pct || 0,
      body.revenueGrowthPct || body.revenue_growth_pct || 0,
      body.avgOrderValue || body.avg_order_value || 0,
      body.orderFrequency || body.order_frequency || 0,
      body.lastOrderDate || body.last_order_date || null,
      body.activePromotions || body.active_promotions || 0,
      body.completedPromotions || body.completed_promotions || 0,
      body.activeClaims || body.active_claims || 0,
      body.pendingDeductions || body.pending_deductions || 0,
      body.ltvScore || body.ltv_score || 0,
      body.churnRisk || body.churn_risk || 0,
      body.churnReason || body.churn_reason || '',
      body.segment || 'maintain',
      body.priceSensitivity || body.price_sensitivity || 0,
      body.promoResponsiveness || body.promo_responsiveness || 0,
      body.nextBestAction || body.next_best_action || '',
      body.healthScore || body.health_score || 50,
      body.satisfactionScore || body.satisfaction_score || 0,
      body.engagementScore || body.engagement_score || 0,
      body.paymentReliability || body.payment_reliability || 0,
      JSON.stringify(body.topProducts || body.top_products || []),
      JSON.stringify(body.topCategories || body.top_categories || []),
      JSON.stringify(body.monthlyRevenue || body.monthly_revenue || []),
      JSON.stringify(body.monthlySpend || body.monthly_spend || []),
      now,
      body.notes || '',
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM customer_360_profiles WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    console.error('Error creating customer 360 profile:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

customer360.put('/profiles/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM customer_360_profiles WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) {
      return c.json({ success: false, message: 'Customer 360 profile not found' }, 404);
    }

    const fields = [];
    const params = [];

    const fieldMap = {
      customerName: 'customer_name', customerCode: 'customer_code', channel: 'channel',
      subChannel: 'sub_channel', tier: 'tier', region: 'region', status: 'status',
      totalRevenue: 'total_revenue', totalSpend: 'total_spend', totalClaims: 'total_claims',
      totalDeductions: 'total_deductions', netRevenue: 'net_revenue', grossMarginPct: 'gross_margin_pct',
      tradeSpendPct: 'trade_spend_pct', revenueGrowthPct: 'revenue_growth_pct',
      avgOrderValue: 'avg_order_value', orderFrequency: 'order_frequency', lastOrderDate: 'last_order_date',
      activePromotions: 'active_promotions', completedPromotions: 'completed_promotions',
      activeClaims: 'active_claims', pendingDeductions: 'pending_deductions',
      ltvScore: 'ltv_score', churnRisk: 'churn_risk', churnReason: 'churn_reason',
      segment: 'segment', priceSensitivity: 'price_sensitivity', promoResponsiveness: 'promo_responsiveness',
      nextBestAction: 'next_best_action', healthScore: 'health_score', satisfactionScore: 'satisfaction_score',
      engagementScore: 'engagement_score', paymentReliability: 'payment_reliability', notes: 'notes'
    };

    for (const [camel, col] of Object.entries(fieldMap)) {
      if (body[camel] !== undefined) { fields.push(`${col} = ?`); params.push(body[camel]); }
      if (body[col] !== undefined && body[camel] === undefined) { fields.push(`${col} = ?`); params.push(body[col]); }
    }

    const jsonFields = { topProducts: 'top_products', topCategories: 'top_categories', monthlyRevenue: 'monthly_revenue', monthlySpend: 'monthly_spend', data: 'data' };
    for (const [camel, col] of Object.entries(jsonFields)) {
      if (body[camel] !== undefined) { fields.push(`${col} = ?`); params.push(JSON.stringify(body[camel])); }
      if (body[col] !== undefined && body[camel] === undefined) { fields.push(`${col} = ?`); params.push(JSON.stringify(body[col])); }
    }

    fields.push('updated_at = ?');
    params.push(now);
    params.push(id, companyId);

    await db.prepare(`UPDATE customer_360_profiles SET ${fields.join(', ')} WHERE id = ? AND company_id = ?`).bind(...params).run();

    const updated = await db.prepare('SELECT * FROM customer_360_profiles WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error updating customer 360 profile:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

customer360.delete('/profiles/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    await db.prepare('DELETE FROM customer_360_insights WHERE customer_id = (SELECT customer_id FROM customer_360_profiles WHERE id = ? AND company_id = ?)').bind(id, companyId).run();
    await db.prepare('DELETE FROM customer_360_profiles WHERE id = ? AND company_id = ?').bind(id, companyId).run();

    return c.json({ success: true, message: 'Customer 360 profile deleted' });
  } catch (error) {
    console.error('Error deleting customer 360 profile:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

customer360.get('/profiles/:id/insights', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const { insight_type, severity, limit = 20, offset = 0 } = c.req.query();

    const profile = await db.prepare('SELECT customer_id FROM customer_360_profiles WHERE (id = ? OR customer_id = ?) AND company_id = ?').bind(id, id, companyId).first();
    const customerId = profile?.customer_id || id;

    let query = 'SELECT * FROM customer_360_insights WHERE company_id = ? AND customer_id = ?';
    const params = [companyId, customerId];

    if (insight_type) { query += ' AND insight_type = ?'; params.push(insight_type); }
    if (severity) { query += ' AND severity = ?'; params.push(severity); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument)
    });
  } catch (error) {
    console.error('Error fetching customer 360 insights:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

customer360.post('/insights', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO customer_360_insights (id, company_id, customer_id, insight_type, category, severity, title, description, metric_name, metric_value, metric_unit, benchmark_value, variance_pct, trend_direction, recommendation, action_taken, action_date, action_by, valid_from, valid_until, confidence, source, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId,
      body.customerId || body.customer_id || '',
      body.insightType || body.insight_type || 'general',
      body.category || 'general',
      body.severity || 'info',
      body.title || '',
      body.description || '',
      body.metricName || body.metric_name || '',
      body.metricValue || body.metric_value || 0,
      body.metricUnit || body.metric_unit || '',
      body.benchmarkValue || body.benchmark_value || 0,
      body.variancePct || body.variance_pct || 0,
      body.trendDirection || body.trend_direction || '',
      body.recommendation || '',
      body.actionTaken || body.action_taken || 0,
      body.actionDate || body.action_date || null,
      body.actionBy || body.action_by || null,
      body.validFrom || body.valid_from || now,
      body.validUntil || body.valid_until || null,
      body.confidence || 0,
      body.source || 'manual',
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM customer_360_insights WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    console.error('Error creating customer 360 insight:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

customer360.delete('/insights/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    await db.prepare('DELETE FROM customer_360_insights WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Insight deleted' });
  } catch (error) {
    console.error('Error deleting customer 360 insight:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

customer360.post('/profiles/:id/recalculate', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();

    const profile = await db.prepare('SELECT * FROM customer_360_profiles WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!profile) {
      return c.json({ success: false, message: 'Profile not found' }, 404);
    }

    const customerId = profile.customer_id;

    const revenueResult = await db.prepare("SELECT SUM(amount) as total FROM trade_spends WHERE company_id = ? AND customer_id = ? AND status != 'cancelled'").bind(companyId, customerId).first();
    const claimsResult = await db.prepare("SELECT SUM(claimed_amount) as total, COUNT(*) as count FROM claims WHERE company_id = ? AND customer_id = ? AND status = 'pending'").bind(companyId, customerId).first();
    const deductionsResult = await db.prepare("SELECT SUM(deduction_amount) as total, COUNT(*) as count FROM deductions WHERE company_id = ? AND customer_id = ? AND status = 'open'").bind(companyId, customerId).first();
    const activePromosResult = await db.prepare("SELECT COUNT(*) as count FROM promotions WHERE company_id = ? AND status = 'active' AND data LIKE ?").bind(companyId, `%${customerId}%`).first();
    const completedPromosResult = await db.prepare("SELECT COUNT(*) as count FROM promotions WHERE company_id = ? AND status = 'completed' AND data LIKE ?").bind(companyId, `%${customerId}%`).first();

    const totalSpend = revenueResult?.total || profile.total_spend || 0;
    const totalRevenue = profile.total_revenue || 0;
    const tradeSpendPct = totalRevenue > 0 ? (totalSpend / totalRevenue) * 100 : 0;
    const netRevenue = totalRevenue - totalSpend;

    const healthComponents = [
      profile.payment_reliability || 50,
      profile.satisfaction_score || 50,
      profile.engagement_score || 50,
      Math.min(100, (profile.revenue_growth_pct || 0) + 50)
    ];
    const healthScore = healthComponents.reduce((a, b) => a + b, 0) / healthComponents.length;

    await db.prepare(`UPDATE customer_360_profiles SET total_spend = ?, total_claims = ?, total_deductions = ?, net_revenue = ?, trade_spend_pct = ?, active_promotions = ?, completed_promotions = ?, active_claims = ?, pending_deductions = ?, health_score = ?, last_calculated_at = ?, updated_at = ? WHERE id = ? AND company_id = ?`).bind(
      totalSpend,
      claimsResult?.total || 0,
      deductionsResult?.total || 0,
      netRevenue,
      Math.round(tradeSpendPct * 100) / 100,
      activePromosResult?.count || 0,
      completedPromosResult?.count || 0,
      claimsResult?.count || 0,
      deductionsResult?.count || 0,
      Math.round(healthScore * 10) / 10,
      now, now,
      id, companyId
    ).run();

    const updated = await db.prepare('SELECT * FROM customer_360_profiles WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error recalculating customer 360 profile:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

customer360.get('/leaderboard', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { metric = 'total_revenue', limit = 10 } = c.req.query();

    const allowedMetrics = ['total_revenue', 'health_score', 'ltv_score', 'revenue_growth_pct', 'trade_spend_pct'];
    const sortMetric = allowedMetrics.includes(metric) ? metric : 'total_revenue';

    const result = await db.prepare(`SELECT * FROM customer_360_profiles WHERE company_id = ? ORDER BY ${sortMetric} DESC LIMIT ?`).bind(companyId, parseInt(limit)).all();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      metric: sortMetric
    });
  } catch (error) {
    console.error('Error fetching customer 360 leaderboard:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

customer360.get('/at-risk', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { threshold = 0.5 } = c.req.query();

    const result = await db.prepare('SELECT * FROM customer_360_profiles WHERE company_id = ? AND churn_risk >= ? ORDER BY churn_risk DESC').bind(companyId, parseFloat(threshold)).all();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      threshold: parseFloat(threshold)
    });
  } catch (error) {
    console.error('Error fetching at-risk customers:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export const customer360Routes = customer360;
