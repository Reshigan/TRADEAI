import { Hono } from 'hono';
import { getMongoClient } from '../services/d1.js';
import { authMiddleware } from '../middleware/auth.js';

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

// Generate report
reportingRoutes.post('/generate', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const { reportType, dateRange, filters } = await c.req.json();
    const mongodb = getMongoClient(c);

    // Create report run record
    const reportRunId = await mongodb.insertOne('reportruns', {
      companyId: tenantId,
      reportType,
      dateRange,
      filters,
      status: 'processing',
      createdBy: userId
    });

    // Generate report data based on type
    let reportData = {};
    
    switch (reportType) {
      case 'trade-spend-summary':
        const tradeSpends = await mongodb.find('tradespends', { 
          companyId: tenantId,
          ...(dateRange && { createdAt: { $gte: dateRange.start, $lte: dateRange.end } })
        });
        reportData = {
          totalSpend: tradeSpends.reduce((sum, ts) => sum + (ts.amount || 0), 0),
          count: tradeSpends.length,
          byStatus: tradeSpends.reduce((acc, ts) => {
            acc[ts.status] = (acc[ts.status] || 0) + 1;
            return acc;
          }, {})
        };
        break;

      case 'promotion-performance':
        const promotions = await mongodb.find('promotions', { companyId: tenantId });
        reportData = {
          totalPromotions: promotions.length,
          avgROI: promotions.reduce((sum, p) => sum + (p.performance?.roi || 0), 0) / (promotions.length || 1),
          byStatus: promotions.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
          }, {})
        };
        break;

      case 'budget-utilization':
        const budgets = await mongodb.find('budgets', { companyId: tenantId });
        reportData = {
          totalBudget: budgets.reduce((sum, b) => sum + (b.amount || 0), 0),
          totalUtilized: budgets.reduce((sum, b) => sum + (b.utilized || 0), 0),
          budgets: budgets.map(b => ({
            name: b.name,
            amount: b.amount,
            utilized: b.utilized,
            utilizationRate: b.amount ? ((b.utilized || 0) / b.amount * 100).toFixed(2) : 0
          }))
        };
        break;

      default:
        reportData = { message: 'Report type not implemented' };
    }

    // Update report run with results
    await mongodb.updateOne('reportruns', { _id: { $oid: reportRunId } }, {
      status: 'completed',
      data: reportData,
      completedAt: new Date().toISOString()
    });

    return c.json({
      success: true,
      data: {
        reportId: reportRunId,
        reportType,
        data: reportData
      },
      message: 'Report generated successfully'
    });
  } catch (error) {
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
