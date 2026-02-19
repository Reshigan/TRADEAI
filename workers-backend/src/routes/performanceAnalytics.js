import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const perfAnalytics = new Hono();
perfAnalytics.use('*', authMiddleware);

const getCompanyId = (c) => {
  const id = c.get('companyId') || c.get('tenantId') || c.req.header('X-Company-Code');
  if (!id) throw new Error('TENANT_REQUIRED');
  return id;
};

perfAnalytics.get('/promotion-effectiveness', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);

    const promotions = await db.prepare('SELECT * FROM promotions WHERE company_id = ? LIMIT 500').bind(companyId).all();
    const tradeSpends = await db.prepare('SELECT * FROM trade_spends WHERE company_id = ? LIMIT 500').bind(companyId).all();

    const promoList = (promotions.results || []).map(rowToDocument);
    const spendList = (tradeSpends.results || []).map(rowToDocument);

    const promoSpendMap = {};
    spendList.forEach(s => {
      const pid = s.promotionId || s.promotion_id;
      if (pid) {
        if (!promoSpendMap[pid]) promoSpendMap[pid] = 0;
        promoSpendMap[pid] += s.amount || 0;
      }
    });

    const effectiveness = promoList.map(p => {
      const spend = promoSpendMap[p.id] || 0;
      const perf = p.performance || {};
      const roi = perf.roi || (spend > 0 ? ((perf.incrementalRevenue || 0) / spend * 100) : 0);
      return {
        id: p.id,
        name: p.name,
        type: p.promotionType || p.promotion_type,
        status: p.status,
        spend,
        roi: parseFloat(roi.toFixed(2)),
        incrementalRevenue: perf.incrementalRevenue || 0,
        liftPercent: perf.liftPercent || 0,
        startDate: p.startDate || p.start_date,
        endDate: p.endDate || p.end_date
      };
    });

    const totalSpend = effectiveness.reduce((s, e) => s + e.spend, 0);
    const avgROI = effectiveness.length > 0 ? effectiveness.reduce((s, e) => s + e.roi, 0) / effectiveness.length : 0;
    const activeCount = effectiveness.filter(e => e.status === 'active').length;

    return c.json({
      success: true,
      data: {
        promotions: effectiveness,
        summary: {
          totalPromotions: effectiveness.length,
          activePromotions: activeCount,
          totalSpend,
          averageROI: parseFloat(avgROI.toFixed(2)),
          topPerformers: [...effectiveness].sort((a, b) => b.roi - a.roi).slice(0, 5),
          bottomPerformers: [...effectiveness].sort((a, b) => a.roi - b.roi).slice(0, 5)
        }
      }
    });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

perfAnalytics.get('/budget-variance', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { year } = c.req.query();
    const targetYear = year || new Date().getFullYear();

    const budgets = await db.prepare('SELECT * FROM budgets WHERE company_id = ? AND year = ? LIMIT 500').bind(companyId, targetYear).all();
    const tradeSpends = await db.prepare('SELECT * FROM trade_spends WHERE company_id = ? LIMIT 500').bind(companyId).all();

    const budgetList = (budgets.results || []).map(rowToDocument);
    const spendList = (tradeSpends.results || []).map(rowToDocument);

    const budgetSpendMap = {};
    spendList.forEach(s => {
      const bid = s.budgetId || s.budget_id;
      if (bid) {
        if (!budgetSpendMap[bid]) budgetSpendMap[bid] = 0;
        budgetSpendMap[bid] += s.amount || 0;
      }
    });

    const variance = budgetList.map(b => {
      const planned = b.amount || 0;
      const actual = budgetSpendMap[b.id] || b.utilized || 0;
      const diff = actual - planned;
      const variancePercent = planned > 0 ? parseFloat(((diff / planned) * 100).toFixed(2)) : 0;
      return {
        id: b.id,
        name: b.name,
        budgetType: b.budgetType || b.budget_type,
        status: b.status,
        planned,
        actual,
        variance: diff,
        variancePercent,
        isOverBudget: diff > 0
      };
    });

    const totalPlanned = variance.reduce((s, v) => s + v.planned, 0);
    const totalActual = variance.reduce((s, v) => s + v.actual, 0);

    return c.json({
      success: true,
      data: {
        budgets: variance,
        summary: {
          year: targetYear,
          totalBudgets: variance.length,
          totalPlanned,
          totalActual,
          totalVariance: totalActual - totalPlanned,
          totalVariancePercent: totalPlanned > 0 ? parseFloat((((totalActual - totalPlanned) / totalPlanned) * 100).toFixed(2)) : 0,
          overBudgetCount: variance.filter(v => v.isOverBudget).length,
          underBudgetCount: variance.filter(v => !v.isOverBudget).length
        }
      }
    });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

perfAnalytics.get('/customer-segmentation', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);

    const customers = await db.prepare('SELECT * FROM customers WHERE company_id = ? LIMIT 500').bind(companyId).all();
    const tradeSpends = await db.prepare('SELECT * FROM trade_spends WHERE company_id = ? LIMIT 500').bind(companyId).all();
    const claims = await db.prepare('SELECT * FROM claims WHERE company_id = ? LIMIT 500').bind(companyId).all();

    const customerList = (customers.results || []).map(rowToDocument);
    const spendList = (tradeSpends.results || []).map(rowToDocument);
    const claimList = (claims.results || []).map(rowToDocument);

    const custSpend = {};
    const custClaims = {};
    spendList.forEach(s => {
      const cid = s.customerId || s.customer_id;
      if (cid) { custSpend[cid] = (custSpend[cid] || 0) + (s.amount || 0); }
    });
    claimList.forEach(cl => {
      const cid = cl.customerId || cl.customer_id;
      if (cid) { custClaims[cid] = (custClaims[cid] || 0) + (cl.claimedAmount || cl.claimed_amount || 0); }
    });

    const segments = {};
    const segmented = customerList.map(cu => {
      const spend = custSpend[cu.id] || 0;
      const claimsTotal = custClaims[cu.id] || 0;
      const tier = cu.tier || (spend > 500000 ? 'platinum' : spend > 200000 ? 'gold' : spend > 50000 ? 'silver' : 'bronze');
      const channel = cu.channel || 'Other';

      if (!segments[tier]) segments[tier] = { count: 0, totalSpend: 0, totalClaims: 0 };
      segments[tier].count++;
      segments[tier].totalSpend += spend;
      segments[tier].totalClaims += claimsTotal;

      return {
        id: cu.id,
        name: cu.name,
        code: cu.code,
        channel,
        tier,
        totalSpend: spend,
        totalClaims: claimsTotal,
        region: cu.region || cu.city
      };
    });

    return c.json({
      success: true,
      data: {
        customers: segmented,
        segments: Object.entries(segments).map(([tier, data]) => ({ tier, ...data, avgSpend: data.count > 0 ? parseFloat((data.totalSpend / data.count).toFixed(2)) : 0 })),
        summary: {
          totalCustomers: customerList.length,
          totalSpend: Object.values(custSpend).reduce((s, v) => s + v, 0),
          totalClaims: Object.values(custClaims).reduce((s, v) => s + v, 0),
          segmentCount: Object.keys(segments).length
        }
      }
    });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export const performanceAnalyticsRoutes = perfAnalytics;
