import { BudgetEnforcementService } from '../services/budgetEnforcement.js';
import { createNotification } from '../services/notifications.js';
import { acquireJobLock, completeJob, failJob } from '../utils/jobGuard.js';

export async function scheduledJobs(event, env) {
  const db = env.DB;
  const cron = event.cron;

  switch (cron) {
    case '0 1 * * *': return runWithGuard(db, 'promotionLifecycle', () => promotionLifecycle(db, env));
    case '0 2 * * *': return runWithGuard(db, 'accrualCalculation', () => accrualCalculation(db, env));
    case '0 */4 * * *': return runWithGuard(db, 'approvalEscalation', () => approvalEscalation(db, env));
    case '0 * * * *': return runWithGuard(db, 'budgetAlerts', () => budgetAlerts(db, env));
    case '0 4 1 * *': return runWithGuard(db, 'settlementGeneration', () => settlementGeneration(db, env));
  }
}

// D-13: Idempotency wrapper for all scheduled jobs
async function runWithGuard(db, jobName, fn) {
  const jobRunId = await acquireJobLock(db, jobName);
  if (!jobRunId) {
    console.log(JSON.stringify({ level: 'warn', job: jobName, message: 'Skipped - already running' }));
    return;
  }
  try {
    await fn();
    await completeJob(db, jobRunId);
  } catch (error) {
    await failJob(db, jobRunId, error.message);
    throw error;
  }
}

async function promotionLifecycle(db, env) {
  const today = new Date().toISOString().split('T')[0];

  const toActivate = await db.prepare(
    "SELECT id, company_id, created_by, name, budget_id FROM promotions WHERE status = 'approved' AND start_date <= ?"
  ).bind(today).all();

  for (const p of toActivate.results || []) {
    await db.prepare("UPDATE promotions SET status = 'active', updated_at = datetime('now') WHERE id = ?").bind(p.id).run();
    await createNotification(db, {
      companyId: p.company_id, userId: p.created_by,
      title: 'Promotion Activated', message: `"${p.name}" is now live.`,
      type: 'success', category: 'promotion', entityType: 'promotion', entityId: p.id
    });
  }

  const toComplete = await db.prepare(
    "SELECT id, company_id, created_by, name, budget_id, expected_spend, actual_spend FROM promotions WHERE status = 'active' AND end_date < ?"
  ).bind(today).all();

  for (const p of toComplete.results || []) {
    await db.prepare("UPDATE promotions SET status = 'completed', updated_at = datetime('now') WHERE id = ?").bind(p.id).run();

    if (p.budget_id) {
      const enforcement = new BudgetEnforcementService(db);
      const actualSpend = p.actual_spend || p.expected_spend || 0;
      await enforcement.recordSpend(p.budget_id, p.expected_spend || 0, actualSpend);
    }

    await createNotification(db, {
      companyId: p.company_id, userId: p.created_by,
      title: 'Promotion Completed', message: `"${p.name}" has completed. Post-event analysis is available.`,
      type: 'info', category: 'promotion', entityType: 'promotion', entityId: p.id
    });
  }

  console.log(`Lifecycle: activated ${(toActivate.results||[]).length}, completed ${(toComplete.results||[]).length}`);
}

async function accrualCalculation(db, env) {
  const period = new Date().toISOString().slice(0, 7);

  const promos = await db.prepare(
    "SELECT id, company_id, data, budget_id FROM promotions WHERE status = 'active'"
  ).all();

  for (const promo of promos.results || []) {
    const promoData = JSON.parse(promo.data || '{}');
    const discountRate = (promoData.mechanics?.discountValue || 10) / 100;
    const customers = promoData.customers || [];

    for (const cust of customers) {
      const custId = cust.customerId || cust.id || cust;
      const sales = await db.prepare(`
        SELECT SUM(net_amount) as total_sales, SUM(quantity) as total_qty
        FROM sales_transactions
        WHERE company_id = ? AND customer_id = ? AND is_promotional = 1
        AND transaction_date LIKE ?
      `).bind(promo.company_id, custId, period + '%').first();

      const salesAmount = sales?.total_sales || 0;
      if (salesAmount <= 0) continue;

      const accrualAmount = salesAmount * discountRate;

      const existing = await db.prepare(
        "SELECT id FROM accruals WHERE company_id = ? AND promotion_id = ? AND customer_id = ? AND data LIKE ?"
      ).bind(promo.company_id, promo.id, custId, `%"period":"${period}"%`).first();

      if (existing) {
        await db.prepare(`
          UPDATE accruals SET amount = ?, sales_volume = ?, trade_rate = ?, updated_at = datetime('now') WHERE id = ?
        `).bind(accrualAmount, sales.total_qty || 0, discountRate, existing.id).run();
      } else {
        await db.prepare(`
          INSERT INTO accruals (id, company_id, name, accrual_type, status, promotion_id, customer_id, amount, trade_rate, data, created_at, updated_at)
          VALUES (?, ?, ?, 'promotion', 'calculated', ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          crypto.randomUUID(), promo.company_id, `Accrual ${period} - ${promo.id}`,
          promo.id, custId, accrualAmount, discountRate,
          JSON.stringify({ period, salesAmount, quantity: sales.total_qty })
        ).run();
      }
    }
  }
}

async function approvalEscalation(db, env) {
  const overdue = await db.prepare(`
    SELECT * FROM approvals WHERE status = 'pending' AND sla_deadline < datetime('now')
  `).all();

  for (const approval of overdue.results || []) {
    const nextLevel = approval.current_level === 'manager' ? 'admin' :
                      approval.current_level === 'admin' ? 'super_admin' : null;
    if (!nextLevel) continue;

    const nextApprover = await db.prepare(
      "SELECT id FROM users WHERE company_id = ? AND role = ? AND is_active = 1 LIMIT 1"
    ).bind(approval.company_id, nextLevel).first();

    if (nextApprover) {
      await db.prepare(`
        UPDATE approvals SET assigned_to = ?, current_level = ?, sla_deadline = ?, updated_at = datetime('now') WHERE id = ?
      `).bind(nextApprover.id, nextLevel, new Date(Date.now() + 48*3600*1000).toISOString(), approval.id).run();

      await createNotification(db, {
        companyId: approval.company_id, userId: nextApprover.id,
        title: 'Escalated Approval', message: `Approval for "${approval.entity_name}" escalated due to SLA breach.`,
        type: 'warning', category: 'approval', priority: 'critical',
        entityType: 'approval', entityId: approval.id
      });
    }
  }
}

async function budgetAlerts(db, env) {
  const budgets = await db.prepare(
    "SELECT * FROM budgets WHERE status IN ('approved', 'active')"
  ).all();

  for (const budget of budgets.results || []) {
    const total = budget.amount || 0;
    if (total <= 0) continue;
    const utilized = (budget.committed || 0) + (budget.spent || 0);
    const pct = (utilized / total) * 100;
    const alertsSent = JSON.parse(budget.alerts_sent || '[]');

    for (const threshold of [75, 90, 100]) {
      if (pct >= threshold && !alertsSent.includes(threshold)) {
        await db.prepare(`
          INSERT INTO notifications (id, company_id, user_id, title, message, notification_type, category, priority, source_entity_type, source_entity_id, created_at)
          VALUES (?, ?, ?, ?, ?, 'warning', 'budget', ?, 'budget', ?, datetime('now'))
        `).bind(
          crypto.randomUUID(), budget.company_id, budget.created_by,
          `Budget ${threshold}% Utilized`,
          `Budget "${budget.name}" has reached ${Math.round(pct)}% utilization (R${Math.round(utilized).toLocaleString()} of R${Math.round(total).toLocaleString()}).`,
          threshold >= 100 ? 'critical' : 'high',
          budget.id
        ).run();

        alertsSent.push(threshold);
        await db.prepare(
          'UPDATE budgets SET alerts_sent = ? WHERE id = ?'
        ).bind(JSON.stringify(alertsSent), budget.id).run();
      }
    }
  }
}

async function settlementGeneration(db, env) {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const period = lastMonth.toISOString().slice(0, 7);

  const accrualGroups = await db.prepare(`
    SELECT customer_id, company_id, SUM(amount) as total_accrual
    FROM accruals WHERE data LIKE ? AND status IN ('calculated', 'approved')
    GROUP BY customer_id, company_id
  `).bind(`%"period":"${period}"%`).all();

  for (const group of accrualGroups.results || []) {
    const deductions = await db.prepare(`
      SELECT SUM(amount) as total_deductions FROM deductions
      WHERE company_id = ? AND customer_id = ? AND status = 'matched'
      AND created_at LIKE ?
    `).bind(group.company_id, group.customer_id, period + '%').first();

    const netAmount = group.total_accrual - (deductions?.total_deductions || 0);

    if (netAmount > 0) {
      const id = crypto.randomUUID();
      await db.prepare(`
        INSERT INTO settlements (id, company_id, customer_id, settlement_type, status, gross_amount, deductions_amount, net_amount, data, created_at, updated_at)
        VALUES (?, ?, ?, 'monthly', 'pending_approval', ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(id, group.company_id, group.customer_id, group.total_accrual, deductions?.total_deductions || 0, netAmount, JSON.stringify({ period })).run();
    }
  }
}
