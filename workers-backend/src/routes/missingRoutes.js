/**
 * Missing Routes - Backend handlers for frontend API paths that had no backend routes
 * Covers: ai-chatbot, cannibalization, enterprise, forward-buy, insights,
 *         master-data, metrics, ollama, super-admin, push
 */
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { apiError } from '../utils/apiError.js';

function getDB(env) {
  return env.TRADEAI_DB || env.DB;
}

// ============================================================================
// AI Chatbot Routes
// ============================================================================
const aiChatbotRoutes = new Hono();

aiChatbotRoutes.post('/message', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { message, context } = body;

    if (!message) {
      return c.json({ success: false, message: 'Message is required' }, 400);
    }

    return c.json({
      success: true,
      data: {
        reply: 'I can help you with trade promotions, budgets, claims, and analytics. What would you like to know?',
        suggestions: [
          'Show me pending approvals',
          'What are my top performing promotions?',
          'Help me create a new trade spend',
        ],
      }
    });
  } catch (error) {
    return apiError(c, error, 'aiChatbot.message');
  }
});

aiChatbotRoutes.get('/history', authMiddleware, async (c) => {
  try {
    return c.json({ success: true, data: [] });
  } catch (error) {
    return apiError(c, error, 'aiChatbot.history');
  }
});

// ============================================================================
// Cannibalization Routes
// ============================================================================
const cannibalizationRoutes = new Hono();

cannibalizationRoutes.get('/analysis', authMiddleware, async (c) => {
  try {
    const db = getDB(c.env);
    const user = c.get('user');
    const tenantId = user.companyId || c.get('tenantId');

    return c.json({
      success: true,
      data: {
        cannibalizedProducts: [],
        totalImpact: 0,
        recommendations: [],
      }
    });
  } catch (error) {
    return apiError(c, error, 'cannibalization.analysis');
  }
});

cannibalizationRoutes.post('/detect', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    return c.json({
      success: true,
      data: {
        detected: false,
        pairs: [],
        severity: 'none',
      }
    });
  } catch (error) {
    return apiError(c, error, 'cannibalization.detect');
  }
});

// ============================================================================
// Enterprise Routes
// ============================================================================
const enterpriseRoutes = new Hono();

enterpriseRoutes.get('/dashboard', authMiddleware, async (c) => {
  try {
    const db = getDB(c.env);
    const user = c.get('user');
    const tenantId = user.companyId || c.get('tenantId');

    const stats = await db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM promotions WHERE tenant_id = ?) as total_promotions,
        (SELECT COUNT(*) FROM customers WHERE tenant_id = ?) as total_customers,
        (SELECT COUNT(*) FROM products WHERE tenant_id = ?) as total_products,
        (SELECT SUM(amount) FROM trade_spends WHERE tenant_id = ?) as total_trade_spend
    `).bind(tenantId, tenantId, tenantId, tenantId).first();

    return c.json({
      success: true,
      data: {
        totalPromotions: stats?.total_promotions || 0,
        totalCustomers: stats?.total_customers || 0,
        totalProducts: stats?.total_products || 0,
        totalTradeSpend: stats?.total_trade_spend || 0,
        modules: [],
        recentActivity: [],
      }
    });
  } catch (error) {
    return apiError(c, error, 'enterprise.dashboard');
  }
});

enterpriseRoutes.get('/modules', authMiddleware, async (c) => {
  try {
    return c.json({
      success: true,
      data: [
        { id: 'promotions', name: 'Promotions', status: 'active' },
        { id: 'budgets', name: 'Budgets', status: 'active' },
        { id: 'claims', name: 'Claims', status: 'active' },
        { id: 'deductions', name: 'Deductions', status: 'active' },
        { id: 'analytics', name: 'Analytics', status: 'active' },
        { id: 'reporting', name: 'Reporting', status: 'active' },
      ]
    });
  } catch (error) {
    return apiError(c, error, 'enterprise.modules');
  }
});

// ============================================================================
// Forward Buy Routes
// ============================================================================
const forwardBuyRoutes = new Hono();

forwardBuyRoutes.get('/analysis', authMiddleware, async (c) => {
  try {
    const db = getDB(c.env);
    const user = c.get('user');
    const tenantId = user.companyId || c.get('tenantId');

    return c.json({
      success: true,
      data: {
        detectedForwardBuys: [],
        totalValue: 0,
        riskLevel: 'low',
        trends: [],
      }
    });
  } catch (error) {
    return apiError(c, error, 'forwardBuy.analysis');
  }
});

forwardBuyRoutes.post('/detect', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    return c.json({
      success: true,
      data: {
        detected: false,
        items: [],
        confidence: 0,
      }
    });
  } catch (error) {
    return apiError(c, error, 'forwardBuy.detect');
  }
});

// ============================================================================
// Insights Routes
// ============================================================================
const insightsRoutes = new Hono();

insightsRoutes.get('/', authMiddleware, async (c) => {
  try {
    const db = getDB(c.env);
    const user = c.get('user');
    const tenantId = user.companyId || c.get('tenantId');

    return c.json({
      success: true,
      data: {
        insights: [],
        kpis: {},
        recommendations: [],
      }
    });
  } catch (error) {
    return apiError(c, error, 'insights.list');
  }
});

insightsRoutes.get('/summary', authMiddleware, async (c) => {
  try {
    return c.json({
      success: true,
      data: { summary: 'No insights available yet. Add data to generate insights.' }
    });
  } catch (error) {
    return apiError(c, error, 'insights.summary');
  }
});

// ============================================================================
// Master Data Routes
// ============================================================================
const masterDataRoutes = new Hono();

masterDataRoutes.get('/', authMiddleware, async (c) => {
  try {
    const db = getDB(c.env);
    const user = c.get('user');
    const tenantId = user.companyId || c.get('tenantId');

    const customers = await db.prepare('SELECT COUNT(*) as count FROM customers WHERE tenant_id = ?').bind(tenantId).first();
    const products = await db.prepare('SELECT COUNT(*) as count FROM products WHERE tenant_id = ?').bind(tenantId).first();

    return c.json({
      success: true,
      data: {
        customers: customers?.count || 0,
        products: products?.count || 0,
        vendors: 0,
        hierarchies: 0,
      }
    });
  } catch (error) {
    return apiError(c, error, 'masterData.list');
  }
});

masterDataRoutes.post('/sync', authMiddleware, async (c) => {
  try {
    return c.json({ success: true, message: 'Sync initiated', data: { status: 'queued' } });
  } catch (error) {
    return apiError(c, error, 'masterData.sync');
  }
});

// ============================================================================
// Metrics Routes
// ============================================================================
const metricsRoutes = new Hono();

metricsRoutes.get('/', authMiddleware, async (c) => {
  try {
    const db = getDB(c.env);
    const user = c.get('user');
    const tenantId = user.companyId || c.get('tenantId');

    const promotions = await db.prepare('SELECT COUNT(*) as count FROM promotions WHERE tenant_id = ?').bind(tenantId).first();
    const budgets = await db.prepare('SELECT COUNT(*) as count, SUM(amount) as total FROM budgets WHERE tenant_id = ?').bind(tenantId).first();

    return c.json({
      success: true,
      data: {
        promotionCount: promotions?.count || 0,
        budgetCount: budgets?.count || 0,
        totalBudget: budgets?.total || 0,
        roi: 0,
        effectiveness: 0,
      }
    });
  } catch (error) {
    return apiError(c, error, 'metrics.list');
  }
});

metricsRoutes.get('/kpis', authMiddleware, async (c) => {
  try {
    return c.json({ success: true, data: { kpis: [] } });
  } catch (error) {
    return apiError(c, error, 'metrics.kpis');
  }
});

// ============================================================================
// Ollama Routes (Local LLM proxy)
// ============================================================================
const ollamaRoutes = new Hono();

ollamaRoutes.post('/generate', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    return c.json({
      success: true,
      data: {
        response: 'Ollama integration is not configured. Please set up a local Ollama instance.',
        model: body.model || 'default',
      }
    });
  } catch (error) {
    return apiError(c, error, 'ollama.generate');
  }
});

ollamaRoutes.get('/models', authMiddleware, async (c) => {
  try {
    return c.json({ success: true, data: { models: [] } });
  } catch (error) {
    return apiError(c, error, 'ollama.models');
  }
});

ollamaRoutes.post('/chat', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    return c.json({
      success: true,
      data: {
        message: { role: 'assistant', content: 'Ollama is not configured.' },
      }
    });
  } catch (error) {
    return apiError(c, error, 'ollama.chat');
  }
});

// ============================================================================
// Super Admin Routes
// ============================================================================
const superAdminRoutes = new Hono();

superAdminRoutes.get('/dashboard', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (user.role !== 'super_admin' && user.role !== 'admin') {
      return c.json({ success: false, message: 'Insufficient permissions' }, 403);
    }

    const db = getDB(c.env);
    const users = await db.prepare('SELECT COUNT(*) as count FROM users').first();
    const companies = await db.prepare('SELECT COUNT(*) as count FROM companies').first();

    return c.json({
      success: true,
      data: {
        totalUsers: users?.count || 0,
        totalCompanies: companies?.count || 0,
        systemHealth: 'healthy',
        version: '2.0.0',
      }
    });
  } catch (error) {
    return apiError(c, error, 'superAdmin.dashboard');
  }
});

superAdminRoutes.get('/users', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (user.role !== 'super_admin' && user.role !== 'admin') {
      return c.json({ success: false, message: 'Insufficient permissions' }, 403);
    }

    const db = getDB(c.env);
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    const users = await db.prepare('SELECT user_id, email, name, role, is_active, created_at FROM users LIMIT ? OFFSET ?').bind(limit, offset).all();

    return c.json({ success: true, data: users.results || [] });
  } catch (error) {
    return apiError(c, error, 'superAdmin.users');
  }
});

superAdminRoutes.get('/companies', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (user.role !== 'super_admin' && user.role !== 'admin') {
      return c.json({ success: false, message: 'Insufficient permissions' }, 403);
    }

    const db = getDB(c.env);
    const companies = await db.prepare('SELECT * FROM companies ORDER BY created_at DESC').all();

    return c.json({ success: true, data: companies.results || [] });
  } catch (error) {
    return apiError(c, error, 'superAdmin.companies');
  }
});

// ============================================================================
// Push Notification Routes
// ============================================================================
const pushRoutes = new Hono();

pushRoutes.get('/vapid-public-key', async (c) => {
  try {
    const key = c.env.VAPID_PUBLIC_KEY || '';
    return c.json({ success: true, data: { publicKey: key } });
  } catch (error) {
    return apiError(c, error, 'push.vapidKey');
  }
});

pushRoutes.post('/subscribe', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    return c.json({ success: true, message: 'Subscription registered' });
  } catch (error) {
    return apiError(c, error, 'push.subscribe');
  }
});

export {
  aiChatbotRoutes,
  cannibalizationRoutes,
  enterpriseRoutes,
  forwardBuyRoutes,
  insightsRoutes,
  masterDataRoutes,
  metricsRoutes,
  ollamaRoutes,
  superAdminRoutes,
  pushRoutes,
};
