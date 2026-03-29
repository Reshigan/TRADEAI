/**
 * Trade Spend Analytics Routes
 * Analytics endpoints for trade spend data analysis
 */
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { apiError } from '../utils/apiError.js';

const tradeSpendAnalyticsRoutes = new Hono();

function getDB(env) {
  return env.TRADEAI_DB || env.DB;
}

// GET /trade-spend-analytics/dashboard
tradeSpendAnalyticsRoutes.get('/dashboard', authMiddleware, async (c) => {
  try {
    const db = getDB(c.env);
    const user = c.get('user');
    const tenantId = user.companyId || c.get('tenantId');

    const spends = await db.prepare(`
      SELECT 
        COUNT(*) as total_spends,
        SUM(amount) as total_amount,
        SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_amount,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        AVG(amount) as avg_spend
      FROM trade_spends
      WHERE tenant_id = ?
    `).bind(tenantId).first();

    return c.json({
      success: true,
      data: {
        totalSpends: spends?.total_spends || 0,
        totalAmount: spends?.total_amount || 0,
        approvedAmount: spends?.approved_amount || 0,
        pendingAmount: spends?.pending_amount || 0,
        avgSpend: spends?.avg_spend || 0,
        spendByCategory: [],
        spendTrend: [],
        topCustomers: [],
      }
    });
  } catch (error) {
    return apiError(c, error, 'tradeSpendAnalytics.dashboard');
  }
});

// GET /trade-spend-analytics/spend-analysis
tradeSpendAnalyticsRoutes.get('/spend-analysis', authMiddleware, async (c) => {
  try {
    const db = getDB(c.env);
    const user = c.get('user');
    const tenantId = user.companyId || c.get('tenantId');

    const analysis = await db.prepare(`
      SELECT type, status, COUNT(*) as count, SUM(amount) as total
      FROM trade_spends
      WHERE tenant_id = ?
      GROUP BY type, status
    `).bind(tenantId).all();

    return c.json({ success: true, data: analysis.results || [] });
  } catch (error) {
    return apiError(c, error, 'tradeSpendAnalytics.spendAnalysis');
  }
});

// GET /trade-spend-analytics/campaign-performance
tradeSpendAnalyticsRoutes.get('/campaign-performance', authMiddleware, async (c) => {
  try {
    const db = getDB(c.env);
    const user = c.get('user');
    const tenantId = user.companyId || c.get('tenantId');

    const campaigns = await db.prepare(`
      SELECT c.campaign_id, c.name, COUNT(p.promotion_id) as promotions,
             SUM(p.budget) as total_budget, SUM(p.actual_spend) as actual_spend
      FROM campaigns c
      LEFT JOIN promotions p ON c.campaign_id = p.campaign_id
      WHERE c.tenant_id = ?
      GROUP BY c.campaign_id
      ORDER BY total_budget DESC
      LIMIT 20
    `).bind(tenantId).all();

    return c.json({ success: true, data: campaigns.results || [] });
  } catch (error) {
    return apiError(c, error, 'tradeSpendAnalytics.campaignPerformance');
  }
});

// GET /trade-spend-analytics/customer-analytics
tradeSpendAnalyticsRoutes.get('/customer-analytics', authMiddleware, async (c) => {
  try {
    const db = getDB(c.env);
    const user = c.get('user');
    const tenantId = user.companyId || c.get('tenantId');

    const customers = await db.prepare(`
      SELECT ts.customer_id, cu.name as customer_name,
             COUNT(*) as spend_count, SUM(ts.amount) as total_spend
      FROM trade_spends ts
      LEFT JOIN customers cu ON ts.customer_id = cu.customer_id
      WHERE ts.tenant_id = ?
      GROUP BY ts.customer_id
      ORDER BY total_spend DESC
      LIMIT 20
    `).bind(tenantId).all();

    return c.json({ success: true, data: customers.results || [] });
  } catch (error) {
    return apiError(c, error, 'tradeSpendAnalytics.customerAnalytics');
  }
});

// GET /trade-spend-analytics/product-performance
tradeSpendAnalyticsRoutes.get('/product-performance', authMiddleware, async (c) => {
  try {
    const db = getDB(c.env);
    const user = c.get('user');
    const tenantId = user.companyId || c.get('tenantId');

    const products = await db.prepare(`
      SELECT p.product_id, p.name as product_name,
             COUNT(ts.trade_spend_id) as spend_count, SUM(ts.amount) as total_spend
      FROM products p
      LEFT JOIN trade_spends ts ON p.product_id = ts.product_id
      WHERE p.tenant_id = ?
      GROUP BY p.product_id
      ORDER BY total_spend DESC
      LIMIT 20
    `).bind(tenantId).all();

    return c.json({ success: true, data: products.results || [] });
  } catch (error) {
    return apiError(c, error, 'tradeSpendAnalytics.productPerformance');
  }
});

// GET /trade-spend-analytics/rebate-effectiveness
tradeSpendAnalyticsRoutes.get('/rebate-effectiveness', authMiddleware, async (c) => {
  try {
    const db = getDB(c.env);
    const user = c.get('user');
    const tenantId = user.companyId || c.get('tenantId');

    const rebates = await db.prepare(`
      SELECT r.rebate_id, r.name, r.target_amount, r.actual_amount,
             CASE WHEN r.target_amount > 0 THEN ROUND((r.actual_amount * 100.0 / r.target_amount), 2) ELSE 0 END as effectiveness
      FROM rebates r
      WHERE r.tenant_id = ?
      ORDER BY effectiveness DESC
      LIMIT 20
    `).bind(tenantId).all();

    return c.json({ success: true, data: rebates.results || [] });
  } catch (error) {
    return apiError(c, error, 'tradeSpendAnalytics.rebateEffectiveness');
  }
});

// GET /trade-spend-analytics/forecast
tradeSpendAnalyticsRoutes.get('/forecast', authMiddleware, async (c) => {
  try {
    const months = parseInt(c.req.query('months') || '6');
    const db = getDB(c.env);
    const user = c.get('user');
    const tenantId = user.companyId || c.get('tenantId');

    const historical = await db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month, SUM(amount) as total
      FROM trade_spends
      WHERE tenant_id = ?
      GROUP BY month
      ORDER BY month DESC
      LIMIT ?
    `).bind(tenantId, months).all();

    return c.json({
      success: true,
      data: {
        historical: historical.results || [],
        forecast: [],
        confidence: 0.75,
      }
    });
  } catch (error) {
    return apiError(c, error, 'tradeSpendAnalytics.forecast');
  }
});

export { tradeSpendAnalyticsRoutes };
