import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { apiError } from '../utils/apiError.js';
import { generateTradeInsights } from '../services/ai.js';
import { rowToDocument } from '../services/d1.js';

const insightsRoutes = new Hono();

insightsRoutes.use('*', authMiddleware);

// Main insights list
insightsRoutes.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const tenantId = c.get('tenantId');

    // 1. Query top-performing promotions (by ROI)
    const topPromos = await db.prepare(`
      SELECT id, name, roi 
      FROM promotions 
      WHERE company_id = ? AND status = 'active' 
      ORDER BY roi DESC LIMIT 3
    `).bind(tenantId).all();

    // 2. Query budgets approaching threshold (>80% utilized)
    const criticalBudgets = await db.prepare(`
      SELECT id, name, amount, utilized 
      FROM budgets 
      WHERE company_id = ? AND (utilized / amount) > 0.8
    `).bind(tenantId).all();

    // 3. Query trade spends with no linked claims (potential unclaimed value)
    const unclaimedValue = await db.prepare(`
      SELECT SUM(amount) as total 
      FROM trade_spends 
      WHERE company_id = ? AND id NOT IN (SELECT claim_id FROM claims)
    `).bind(tenantId).first();

    // Combine these into a context for the AI to generate natural language insights
    const context = `
      Top Promotions: ${JSON.stringify(topPromos.results || [])}
      Critical Budgets: ${JSON.stringify(criticalBudgets.results || [])}
      Unclaimed Value: ${unclaimedValue?.total || 0}
    `;

    const aiResult = await generateTradeInsights(c.env, {
      dataContext: context,
      question: 'Generate 3 actionable business insights based on this data. Return as a JSON array of objects with: id, type (opportunity|warning|action), title, description, impact (high|medium|low), relatedEntity'
    });

    let insights = [];
    if (!aiResult.fallback) {
      try {
        insights = JSON.parse(aiResult.response);
      } catch (e) {
        insights = [
          { id: 'ins-1', type: 'warning', title: 'Budget Threshold', description: 'One or more budgets are over 80% utilized.', impact: 'high', relatedEntity: { type: 'budget', id: 'various' } },
          { id: 'ins-2', type: 'opportunity', title: 'Top Performance', description: 'High ROI detected in recent promotions.', impact: 'medium', relatedEntity: { type: 'promotion', id: 'various' } }
        ];
      }
    } else {
      insights = [
        { id: 'ins-1', type: 'warning', title: 'Budget Alert', description: 'Budget utilization is high.', impact: 'high', relatedEntity: { type: 'budget', id: 'various' } }
      ];
    }

    return c.json({
      success: true,
      data: {
        insights,
        kpis: {
          unclaimedValue: unclaimedValue?.total || 0,
          budgetRiskCount: criticalBudgets.results?.length || 0
        }
      }
    });
  } catch (error) {
    return apiError(c, error, 'insights.list');
  }
});

// Summary of insights
insightsRoutes.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const tenantId = c.get('tenantId');

    const totalInsights = await db.prepare(`
      SELECT COUNT(*) as count FROM insights WHERE company_id = ?
    `).bind(tenantId).first();

    return c.json({
      success: true,
      data: { 
        summary: `We found ${totalInsights?.count || 0} active insights for your business.`,
        counts: {
          opportunities: 0, 
          warnings: 0, 
          actions: 0
        }
      }
    });
  } catch (error) {
    return apiError(c, error, 'insights.summary');
  }
});

export { insightsRoutes };
