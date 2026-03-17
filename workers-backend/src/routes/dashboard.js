import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

export const dashboardRoutes = new Hono();

dashboardRoutes.use('*', authMiddleware);

const getCompanyId = (c) => c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
const getUserId = (c) => c.get('userId') || null;
const getUserRole = (c) => c.get('role') || c.get('userRole') || 'user';

dashboardRoutes.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const role = getUserRole(c);
    const userId = getUserId(c);

    const [customers, products, promos, pendingApprovals, budgets, claimsData, deductionsData] = await Promise.all([
      db.prepare('SELECT COUNT(*) as cnt FROM customers WHERE company_id = ?').bind(companyId).first(),
      db.prepare('SELECT COUNT(*) as cnt FROM products WHERE company_id = ?').bind(companyId).first(),
      db.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed FROM promotions WHERE company_id = ?").bind(companyId).first(),
      db.prepare("SELECT COUNT(*) as cnt FROM approvals WHERE company_id = ? AND status = 'pending'").bind(companyId).first(),
      db.prepare("SELECT COALESCE(SUM(amount),0) as total_amount, COALESCE(SUM(committed),0) as committed, COALESCE(SUM(spent),0) as spent FROM budgets WHERE company_id = ? AND status IN ('approved','active')").bind(companyId).first(),
      db.prepare('SELECT COUNT(*) as cnt, COALESCE(SUM(claimed_amount),0) as total FROM claims WHERE company_id = ?').bind(companyId).first(),
      db.prepare("SELECT COUNT(*) as cnt, COUNT(CASE WHEN status='open' THEN 1 END) as open_cnt FROM deductions WHERE company_id = ?").bind(companyId).first(),
    ]);

    const totalBudget = budgets?.total_amount || 0;
    const budgetCommitted = budgets?.committed || 0;
    const budgetSpent = budgets?.spent || 0;
    const utilization = totalBudget > 0 ? ((budgetCommitted + budgetSpent) / totalBudget * 100) : 0;

    const base = {
      overview: {
        totalCustomers: customers?.cnt || 0,
        totalProducts: products?.cnt || 0,
        totalPromotions: promos?.total || 0,
        activePromotions: promos?.active || 0,
        completedPromotions: promos?.completed || 0,
        pendingApprovals: pendingApprovals?.cnt || 0,
      },
      budget: {
        total: totalBudget,
        committed: budgetCommitted,
        spent: budgetSpent,
        available: totalBudget - budgetCommitted - budgetSpent,
        utilizationRate: Math.round(utilization * 100) / 100
      }
    };

    if (role === 'kam' || role === 'user') {
      const wallet = await db.prepare(
        "SELECT COALESCE(SUM(available_amount),0) as balance FROM kam_wallets WHERE company_id = ? AND user_id = ? AND status = 'active'"
      ).bind(companyId, userId).first();
      const myPromos = await db.prepare(
        "SELECT COUNT(*) as cnt FROM promotions WHERE company_id = ? AND created_by = ? AND status = 'active'"
      ).bind(companyId, userId).first();
      base.kam = {
        walletBalance: wallet?.balance || 0,
        activePromos: myPromos?.cnt || 0,
        avgRoi: 0,
        openClaims: claimsData?.cnt || 0
      };
    }

    if (role === 'manager' || role === 'admin') {
      const spendYTD = await db.prepare(
        "SELECT COALESCE(SUM(amount),0) as total FROM trade_spends WHERE company_id = ? AND status = 'approved'"
      ).bind(companyId).first();
      base.manager = {
        totalSpendYTD: spendYTD?.total || 0,
        budgetUtilization: utilization,
        approvalQueue: pendingApprovals?.cnt || 0,
        pnlMargin: 0
      };
    }

    if (role === 'executive' || role === 'super_admin') {
      const salesResult = await db.prepare(
        'SELECT COALESCE(SUM(gross_amount),0) as revenue FROM sales_transactions WHERE company_id = ?'
      ).bind(companyId).first();
      const tradeRate = (salesResult?.revenue || 0) > 0 ? ((budgetSpent / salesResult.revenue) * 100) : 0;
      base.executive = {
        totalRevenue: salesResult?.revenue || 0,
        tradeRate: Math.round(tradeRate * 100) / 100,
        promoEffectiveness: promos?.completed || 0
      };
    }

    return c.json({ success: true, data: base });
  } catch (error) {
    console.error('Dashboard error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

dashboardRoutes.get('/kpis', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);

    const promos = await db.prepare(
      "SELECT COUNT(*) as total, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active FROM promotions WHERE company_id = ?"
    ).bind(companyId).first();

    const spendByMonth = await db.prepare(
      "SELECT strftime('%m', created_at) as month, SUM(amount) as total FROM trade_spends WHERE company_id = ? AND status = 'approved' GROUP BY month ORDER BY month"
    ).bind(companyId).all();

    return c.json({
      success: true,
      data: {
        monthlySpends: (spendByMonth.results || []).map(r => ({ month: r.month, total: r.total })),
        averageROI: 0,
        totalPromotions: promos?.total || 0,
        activePromotions: promos?.active || 0
      }
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

dashboardRoutes.get('/activity', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { limit = 20 } = c.req.query();

    const result = await db.prepare(
      'SELECT * FROM activities WHERE company_id = ? ORDER BY created_at DESC LIMIT ?'
    ).bind(companyId, parseInt(limit)).all();

    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

dashboardRoutes.get('/notifications', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const userId = getUserId(c);

    const result = await db.prepare(
      "SELECT * FROM notifications WHERE company_id = ? AND user_id = ? AND status = 'unread' ORDER BY created_at DESC LIMIT 10"
    ).bind(companyId, userId).all();

    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});
