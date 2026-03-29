import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { apiError } from '../utils/apiError.js';

const salesTransactions = new Hono();
salesTransactions.use('*', authMiddleware);

const getCompanyId = (c) => {
  const id = c.get('companyId') || c.get('tenantId') || c.req.header('X-Company-Code');
  if (!id) throw new Error('TENANT_REQUIRED');
  return id;
};

// Revenue by period
salesTransactions.get('/revenue-by-period', async (c) => {
  try {
    const companyId = getCompanyId(c);
    const db = c.env.DB;
    const period = c.req.query('period') || 'month';

    const results = await db.prepare(
      "SELECT strftime('%Y-%m', created_at) as period, SUM(amount) as revenue, COUNT(*) as count FROM transactions WHERE company_id = ? GROUP BY strftime('%Y-%m', created_at) ORDER BY period DESC LIMIT 12"
    ).bind(companyId).all().catch(() => ({ results: [] }));

    return c.json({
      success: true,
      data: (results.results || []).map(r => ({
        period: r.period,
        revenue: r.revenue || 0,
        transactionCount: r.count || 0
      }))
    });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return apiError(c, error, 'salesTransactions');
  }
});

// Top customers
salesTransactions.get('/top-customers', async (c) => {
  try {
    const companyId = getCompanyId(c);
    const db = c.env.DB;
    const limit = parseInt(c.req.query('limit') || '10');

    const results = await db.prepare(
      'SELECT t.customer_id, c.name as customer_name, SUM(t.amount) as total_revenue, COUNT(*) as transaction_count FROM transactions t LEFT JOIN customers c ON t.customer_id = c.id WHERE t.company_id = ? GROUP BY t.customer_id ORDER BY total_revenue DESC LIMIT ?'
    ).bind(companyId, limit).all().catch(() => ({ results: [] }));

    return c.json({
      success: true,
      data: (results.results || []).map(r => ({
        customerId: r.customer_id,
        customerName: r.customer_name || 'Unknown',
        totalRevenue: r.total_revenue || 0,
        transactionCount: r.transaction_count || 0
      }))
    });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return apiError(c, error, 'salesTransactions');
  }
});

// Top products
salesTransactions.get('/top-products', async (c) => {
  try {
    const companyId = getCompanyId(c);
    const db = c.env.DB;
    const limit = parseInt(c.req.query('limit') || '10');

    const results = await db.prepare(
      'SELECT t.product_id, p.name as product_name, SUM(t.amount) as total_revenue, SUM(t.quantity) as total_quantity FROM transactions t LEFT JOIN products p ON t.product_id = p.id WHERE t.company_id = ? GROUP BY t.product_id ORDER BY total_revenue DESC LIMIT ?'
    ).bind(companyId, limit).all().catch(() => ({ results: [] }));

    return c.json({
      success: true,
      data: (results.results || []).map(r => ({
        productId: r.product_id,
        productName: r.product_name || 'Unknown',
        totalRevenue: r.total_revenue || 0,
        totalQuantity: r.total_quantity || 0
      }))
    });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return apiError(c, error, 'salesTransactions');
  }
});

export const salesTransactionsRoutes = salesTransactions;
