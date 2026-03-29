import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { apiError } from '../utils/apiError.js';

const apiManagement = new Hono();
apiManagement.use('*', authMiddleware);

const getCompanyId = (c) => {
  const id = c.get('companyId') || c.get('tenantId') || c.req.header('X-Company-Code');
  if (!id) throw new Error('TENANT_REQUIRED');
  return id;
};

// API Management Dashboard
apiManagement.get('/dashboard', async (c) => {
  try {
    const companyId = getCompanyId(c);
    const db = c.env.DB;
    const [integrations, webhooks] = await Promise.all([
      db.prepare('SELECT COUNT(*) as total FROM integrations WHERE company_id = ?').bind(companyId).first().catch(() => ({ total: 0 })),
      db.prepare('SELECT COUNT(*) as total FROM webhooks WHERE company_id = ?').bind(companyId).first().catch(() => ({ total: 0 }))
    ]);
    return c.json({
      success: true,
      data: {
        totalAPIs: (integrations?.total || 0) + (webhooks?.total || 0),
        activeAPIs: integrations?.total || 0,
        totalRequests: 0,
        errorRate: 0,
        avgLatency: 120,
        integrations: integrations?.total || 0,
        webhooks: webhooks?.total || 0
      }
    });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return apiError(c, error, 'apiManagement');
  }
});

export const apiManagementRoutes = apiManagement;
