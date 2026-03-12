import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { runPromotionLifecycle, detectPromotionConflicts, calculateBaseline, runSimulation } from '../services/promotionLifecycle.js';
import { calculateAccruals, autoMatchDeductions, generateMonthlySettlement, calculatePnL } from '../services/settlementReconciliation.js';
import { checkEscalation } from '../services/approvalRouting.js';
import { checkBudgetAlerts } from '../services/budgetEnforcement.js';

const jobs = new Hono();
jobs.use('*', authMiddleware);

const getCompanyId = (c) => c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';

jobs.post('/promotion-lifecycle', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const result = await runPromotionLifecycle(db, companyId);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

jobs.post('/promotion-conflicts', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const result = await detectPromotionConflicts(db, companyId, body);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

jobs.post('/calculate-baseline', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { customerId, productId, weeks } = await c.req.json();
    const result = await calculateBaseline(db, companyId, customerId, productId, weeks || 12);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

jobs.post('/run-simulation', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const params = await c.req.json();
    const result = await runSimulation(db, companyId, params);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

jobs.post('/calculate-accruals', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json().catch(() => ({}));
    const result = await calculateAccruals(db, companyId, body);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

jobs.post('/auto-match-deductions', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const result = await autoMatchDeductions(db, companyId);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

jobs.post('/generate-settlement', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { customerId, month, year } = await c.req.json();
    if (!customerId) return c.json({ success: false, message: 'customerId required' }, 400);
    const result = await generateMonthlySettlement(db, companyId, customerId, { month, year });
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

jobs.post('/calculate-pnl', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { customerId, year } = await c.req.json();
    if (!customerId) return c.json({ success: false, message: 'customerId required' }, 400);
    const result = await calculatePnL(db, companyId, customerId, { year });
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

jobs.post('/check-escalations', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const result = await checkEscalation(db, companyId);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

jobs.post('/check-budget-alerts', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const budgets = await db.prepare('SELECT id FROM budgets WHERE company_id = ? AND status IN (?, ?)').bind(companyId, 'approved', 'active').all();
    const allAlerts = [];
    for (const b of (budgets.results || [])) {
      const alerts = await checkBudgetAlerts(db, b.id, companyId);
      allAlerts.push(...alerts);
    }
    return c.json({ success: true, data: { alerts: allAlerts, count: allAlerts.length } });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

jobs.post('/run-all', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const results = {};

    try { results.lifecycle = await runPromotionLifecycle(db, companyId); } catch (e) { results.lifecycle = { error: e.message }; }
    try { results.accruals = await calculateAccruals(db, companyId, {}); } catch (e) { results.accruals = { error: e.message }; }
    try { results.deductionMatching = await autoMatchDeductions(db, companyId); } catch (e) { results.deductionMatching = { error: e.message }; }
    try { results.escalations = await checkEscalation(db, companyId); } catch (e) { results.escalations = { error: e.message }; }

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export const jobRoutes = jobs;
