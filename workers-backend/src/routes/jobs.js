import { Hono } from 'hono';
import {authMiddleware, requireMinRole } from '../middleware/auth.js';
import { runPromotionLifecycle, detectPromotionConflicts, calculateBaseline, runSimulation } from '../services/promotionLifecycle.js';
import { calculateAccruals, autoMatchDeductions, generateMonthlySettlement, calculatePnL } from '../services/settlementReconciliation.js';
import { checkEscalation } from '../services/approvalRouting.js';
import { checkBudgetAlerts } from '../services/budgetEnforcement.js';
import { apiError } from '../utils/apiError.js';
import { acquireJobLock, completeJob, failJob } from '../utils/jobGuard.js';

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
    return apiError(c, error, 'jobs');
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
    return apiError(c, error, 'jobs');
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
    return apiError(c, error, 'jobs');
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
    return apiError(c, error, 'jobs');
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
    return apiError(c, error, 'jobs');
  }
});

jobs.post('/auto-match-deductions', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const result = await autoMatchDeductions(db, companyId);
    return c.json({ success: true, data: result });
  } catch (error) {
    return apiError(c, error, 'jobs');
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
    return apiError(c, error, 'jobs');
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
    return apiError(c, error, 'jobs');
  }
});

jobs.post('/check-escalations', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const result = await checkEscalation(db, companyId);
    return c.json({ success: true, data: result });
  } catch (error) {
    return apiError(c, error, 'jobs');
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
    return apiError(c, error, 'jobs');
  }
});

jobs.post('/run-all', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);

    // D-13: Idempotency guard - prevent duplicate execution
    const jobRunId = await acquireJobLock(db, 'run-all');
    if (!jobRunId) {
      return c.json({ success: false, message: 'Job already running' }, 409);
    }

    const results = {};
    let totalProcessed = 0;

    try {
      try { results.lifecycle = await runPromotionLifecycle(db, companyId); totalProcessed++; } catch (e) { results.lifecycle = { error: e.message }; }
      try { results.accruals = await calculateAccruals(db, companyId, {}); totalProcessed++; } catch (e) { results.accruals = { error: e.message }; }
      try { results.deductionMatching = await autoMatchDeductions(db, companyId); totalProcessed++; } catch (e) { results.deductionMatching = { error: e.message }; }
      try { results.escalations = await checkEscalation(db, companyId); totalProcessed++; } catch (e) { results.escalations = { error: e.message }; }

      await completeJob(db, jobRunId, totalProcessed);
    } catch (e) {
      await failJob(db, jobRunId, e.message);
      throw e;
    }

    return c.json({ success: true, data: results, jobRunId });
  } catch (error) {
    return apiError(c, error, 'jobs');
  }
});

export const jobRoutes = jobs;
