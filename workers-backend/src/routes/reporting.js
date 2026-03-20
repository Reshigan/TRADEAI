import { Hono } from 'hono';
import { getMongoClient } from '../services/d1.js';
import {authMiddleware, requireMinRole } from '../middleware/auth.js';
import { apiError } from '../utils/apiError.js';

export const reportingRoutes = new Hono();

reportingRoutes.use('*', authMiddleware);

reportingRoutes.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const reports = await mongodb.find('reportruns', { companyId: tenantId }, { sort: { createdAt: -1 }, limit: 20 });
    return c.json({ success: true, data: reports });
  } catch (error) {
    return c.json({ success: true, data: [] });
  }
});

reportingRoutes.get('/templates', async (c) => {
  try {
    return c.json({
      success: true,
      data: [
        { id: 'trade-spend-summary', name: 'Trade Spend Summary', description: 'Summary of all trade spend activities' },
        { id: 'promotion-performance', name: 'Promotion Performance', description: 'ROI and performance metrics for promotions' },
        { id: 'budget-utilization', name: 'Budget Utilization', description: 'Budget allocation and utilization report' },
        { id: 'customer-analysis', name: 'Customer Analysis', description: 'Customer-level trade spend analysis' },
        { id: 'product-performance', name: 'Product Performance', description: 'Product-level promotion performance' }
      ]
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get report templates', error: error.message }, 500);
  }
});

// Generate report — accepts both { reportType } and { template_id } from frontend
reportingRoutes.post('/generate', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const body = await c.req.json();
    const db = c.env.DB;

    // Accept both reportType (legacy) and template_id (new frontend)
    const templateId = body.template_id || body.reportType || 'promotion_summary';
    const filters = body.filters || body.dateRange || {};

    // Template ID to human-readable name mapping
    const templateNames = {
      'promotion_summary': 'Promotion Summary',
      'budget_utilization': 'Budget Utilization',
      'roi_analysis': 'ROI Analysis',
      'trade_spend_by_customer': 'Trade Spend by Customer',
      'deduction_aging': 'Deduction Aging',
      'claim_status': 'Claim Status',
      'pnl_by_promotion': 'P&L by Promotion',
      'accrual_report': 'Accrual Report',
      'trade-spend-summary': 'Trade Spend Summary',
      'promotion-performance': 'Promotion Performance',
      'budget-utilization': 'Budget Utilization',
      'customer-analysis': 'Customer Analysis',
      'product-performance': 'Product Performance'
    };

    // Generate report data from D1 based on template
    let reportData = {};

    try {
      switch (templateId) {
        case 'promotion_summary':
        case 'promotion-performance':
        case 'pnl_by_promotion': {
          const promos = await db.prepare(
            'SELECT status, COUNT(*) as count, SUM(budget) as total_budget FROM promotions WHERE company_id = ? GROUP BY status'
          ).bind(tenantId).all();
          reportData = { byStatus: promos.results || [], totalPromotions: (promos.results || []).reduce((s, r) => s + r.count, 0) };
          break;
        }
        case 'budget_utilization':
        case 'budget-utilization':
        case 'accrual_report': {
          const budgets = await db.prepare(
            'SELECT name, total_amount, spent, committed FROM budgets WHERE company_id = ? LIMIT 50'
          ).bind(tenantId).all();
          const rows = budgets.results || [];
          reportData = {
            totalBudget: rows.reduce((s, b) => s + (b.total_amount || 0), 0),
            totalSpent: rows.reduce((s, b) => s + (b.spent || 0), 0),
            budgets: rows.map(b => ({ name: b.name, amount: b.total_amount, spent: b.spent, utilizationRate: b.total_amount ? ((b.spent || 0) / b.total_amount * 100).toFixed(1) : 0 }))
          };
          break;
        }
        case 'roi_analysis':
        case 'trade_spend_by_customer':
        case 'trade-spend-summary': {
          const spends = await db.prepare(
            'SELECT status, COUNT(*) as count, SUM(amount) as total FROM trade_spends WHERE company_id = ? GROUP BY status'
          ).bind(tenantId).all();
          reportData = { byStatus: spends.results || [], totalSpend: (spends.results || []).reduce((s, r) => s + (r.total || 0), 0) };
          break;
        }
        case 'deduction_aging':
        case 'claim_status': {
          const claims = await db.prepare(
            'SELECT status, COUNT(*) as count, SUM(claimed_amount) as total FROM claims WHERE company_id = ? GROUP BY status'
          ).bind(tenantId).all();
          const deds = await db.prepare(
            'SELECT status, COUNT(*) as count, SUM(deduction_amount) as total FROM deductions WHERE company_id = ? GROUP BY status'
          ).bind(tenantId).all();
          reportData = { claimsByStatus: claims.results || [], deductionsByStatus: deds.results || [] };
          break;
        }
        default:
          reportData = { message: 'Report generated', template: templateId };
      }
    } catch (dbErr) {
      console.error('Report query error:', dbErr.message);
      reportData = { message: 'Report generated with limited data', error: dbErr.message };
    }

    return c.json({
      success: true,
      data: {
        id: `rpt-${Date.now()}`,
        template_id: templateId,
        name: templateNames[templateId] || templateId.replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase()),
        created_at: new Date().toISOString(),
        status: 'completed',
        report: reportData
      },
      message: 'Report generated successfully'
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return c.json({ success: false, message: 'Failed to generate report', error: error.message }, 500);
  }
});

// Get report history
reportingRoutes.get('/history', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const { page = 1, limit = 20 } = c.req.query();

    const reports = await mongodb.find('reportruns', 
      { companyId: tenantId }, 
      { 
        skip: (parseInt(page) - 1) * parseInt(limit),
        limit: parseInt(limit),
        sort: { createdAt: -1 }
      }
    );

    const total = await mongodb.countDocuments('reportruns', { companyId: tenantId });

    return c.json({
      success: true,
      data: reports,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get report history', error: error.message }, 500);
  }
});

// Get report by ID
reportingRoutes.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const report = await mongodb.findOne('reportruns', { _id: { $oid: id }, companyId: tenantId });
    if (!report) return c.json({ success: false, message: 'Report not found' }, 404);

    return c.json({ success: true, data: report });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get report', error: error.message }, 500);
  }
});
