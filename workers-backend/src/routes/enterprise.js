import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { apiError } from '../utils/apiError.js';
import { rowToDocument } from '../services/d1.js';

const enterpriseRoutes = new Hono();

enterpriseRoutes.use('*', authMiddleware);

// Enterprise Dashboard Aggregations
enterpriseRoutes.get('/dashboard', async (c) => {
  try {
    const db = c.env.DB;
    const tenantId = c.get('tenantId');

    const stats = await db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM promotions WHERE company_id = ? AND status = 'active') as active_promotions,
        (SELECT COUNT(*) FROM customers WHERE company_id = ?) as total_customers,
        (SELECT COUNT(*) FROM products WHERE company_id = ?) as total_products,
        (SELECT SUM(amount) FROM trade_spends WHERE company_id = ?) as total_trade_spend,
        (SELECT COUNT(*) FROM claims WHERE company_id = ? AND status = 'pending') as pending_claims,
        (SELECT COUNT(*) FROM approvals WHERE company_id = ? AND status = 'pending') as pending_approvals
      FROM (SELECT 1)
    `).bind(tenantId, tenantId, tenantId, tenantId, tenantId, tenantId).first();

    const kpis = [
      { label: 'Active Promotions', value: stats?.active_promotions || 0, format: 'number' },
      { label: 'Total Customers', value: stats?.total_customers || 0, format: 'number' },
      { label: 'Total Products', value: stats?.total_products || 0, format: 'number' },
      { label: 'Total Trade Spend', value: stats?.total_trade_spend || 0, format: 'currency' },
      { label: 'Pending Claims', value: stats?.pending_claims || 0, format: 'number' },
      { label: 'Pending Approvals', value: stats?.pending_approvals || 0, format: 'number' },
    ];

    // Recent Activity from activities table
    const activity = await db.prepare(`
      SELECT * FROM activities 
      WHERE company_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `).bind(tenantId).all();

    return c.json({
      success: true,
      data: {
        kpis,
        recentActivity: (activity.results || []).map(rowToDocument),
        alerts: [
          { type: 'info', message: 'System is running optimally' }
        ]
      }
    });
  } catch (error) {
    return apiError(c, error, 'enterprise.dashboard');
  }
});

// Enabled Modules for Tenant
enterpriseRoutes.get('/modules', async (c) => {
  try {
    const db = c.env.DB;
    const tenantId = c.get('tenantId');

    const settings = await db.prepare(`
      SELECT modules FROM company_settings 
      WHERE company_id = ?
    `).bind(tenantId).first();

    const modules = settings?.modules 
      ? JSON.parse(settings.modules) 
      : [
          { id: 'promotions', name: 'Promotions', status: 'active' },
          { id: 'budgets', name: 'Budgets', status: 'active' },
          { id: 'claims', name: 'Claims', status: 'active' },
          { id: 'deductions', name: 'Deductions', status: 'active' },
          { id: 'analytics', name: 'Analytics', status: 'active' },
          { id: 'reporting', name: 'Reporting', status: 'active' },
        ];

    return c.json({
      success: true,
      data: modules
    });
  } catch (error) {
    return apiError(c, error, 'enterprise.modules');
  }
});

export { enterpriseRoutes };
