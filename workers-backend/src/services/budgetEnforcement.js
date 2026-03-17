export class BudgetEnforcementService {
  constructor(db) { this.db = db; }

  async checkAvailability(budgetId, requestedAmount) {
    const budget = await this.db.prepare(
      'SELECT amount, committed, spent FROM budgets WHERE id = ?'
    ).bind(budgetId).first();
    if (!budget) throw new Error('Budget not found');
    const available = budget.amount - (budget.committed || 0) - (budget.spent || 0);
    if (requestedAmount > available) {
      throw new Error(`Insufficient budget. Available: R${available.toLocaleString()}. Required: R${requestedAmount.toLocaleString()}.`);
    }
    return { available, sufficient: true };
  }

  async commitFunds(budgetId, amount) {
    await this.db.prepare(
      'UPDATE budgets SET committed = committed + ?, updated_at = datetime("now") WHERE id = ?'
    ).bind(amount, budgetId).run();
  }

  async releaseFunds(budgetId, amount) {
    await this.db.prepare(
      'UPDATE budgets SET committed = MAX(0, committed - ?), updated_at = datetime("now") WHERE id = ?'
    ).bind(amount, budgetId).run();
  }

  async recordSpend(budgetId, committedAmount, actualAmount) {
    await this.db.prepare(
      `UPDATE budgets SET
        committed = MAX(0, committed - ?),
        spent = spent + ?,
        updated_at = datetime("now")
      WHERE id = ?`
    ).bind(committedAmount, actualAmount, budgetId).run();
  }
}

const generateId = () => crypto.randomUUID();

export async function checkBudgetAvailability(db, budgetId, amount, companyId) {
  const budget = await db.prepare(
    'SELECT * FROM budgets WHERE id = ? AND company_id = ?'
  ).bind(budgetId, companyId).first();

  if (!budget) {
    return { available: false, reason: 'Budget not found', budget: null };
  }

  if (budget.status !== 'approved' && budget.status !== 'active') {
    return { available: false, reason: `Budget status is "${budget.status}" — must be approved or active`, budget };
  }

  const totalBudget = budget.amount || 0;
  const committed = budget.total_committed || 0;
  const spent = budget.total_spent || 0;
  const available = totalBudget - committed - spent;

  if (amount > available) {
    return {
      available: false,
      reason: `Insufficient budget: requested R${amount.toLocaleString()}, available R${available.toLocaleString()}`,
      budget,
      totalBudget,
      committed,
      spent,
      availableAmount: available
    };
  }

  return {
    available: true,
    budget,
    totalBudget,
    committed,
    spent,
    availableAmount: available
  };
}

export async function commitFunds(db, budgetId, amount, referenceType, referenceId, referenceName, userId, companyId) {
  const budget = await db.prepare(
    'SELECT * FROM budgets WHERE id = ? AND company_id = ?'
  ).bind(budgetId, companyId).first();

  if (!budget) throw new Error('Budget not found');

  const prevCommitted = budget.total_committed || 0;
  const newCommitted = prevCommitted + amount;
  const totalAvailable = (budget.amount || 0) - newCommitted - (budget.total_spent || 0);
  const now = new Date().toISOString();

  await db.prepare(`
    UPDATE budgets SET total_committed = ?, total_available = ?, updated_at = ? WHERE id = ?
  `).bind(newCommitted, totalAvailable, now, budgetId).run();

  const txnId = generateId();
  await db.prepare(`
    INSERT INTO budget_transactions (id, company_id, budget_id, transaction_type, amount, reference_type, reference_id, reference_name, previous_committed, new_committed, previous_spent, new_spent, created_by, created_at)
    VALUES (?, ?, ?, 'commit', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    txnId, companyId, budgetId, amount,
    referenceType, referenceId, referenceName || '',
    prevCommitted, newCommitted,
    budget.total_spent || 0, budget.total_spent || 0,
    userId, now
  ).run();

  return { budgetId, previousCommitted: prevCommitted, newCommitted, availableAmount: totalAvailable, transactionId: txnId };
}

export async function releaseFunds(db, budgetId, amount, referenceType, referenceId, referenceName, userId, companyId) {
  const budget = await db.prepare(
    'SELECT * FROM budgets WHERE id = ? AND company_id = ?'
  ).bind(budgetId, companyId).first();

  if (!budget) throw new Error('Budget not found');

  const prevCommitted = budget.total_committed || 0;
  const newCommitted = Math.max(0, prevCommitted - amount);
  const totalAvailable = (budget.amount || 0) - newCommitted - (budget.total_spent || 0);
  const now = new Date().toISOString();

  await db.prepare(`
    UPDATE budgets SET total_committed = ?, total_available = ?, updated_at = ? WHERE id = ?
  `).bind(newCommitted, totalAvailable, now, budgetId).run();

  const txnId = generateId();
  await db.prepare(`
    INSERT INTO budget_transactions (id, company_id, budget_id, transaction_type, amount, reference_type, reference_id, reference_name, previous_committed, new_committed, previous_spent, new_spent, created_by, created_at)
    VALUES (?, ?, ?, 'release', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    txnId, companyId, budgetId, amount,
    referenceType, referenceId, referenceName || '',
    prevCommitted, newCommitted,
    budget.total_spent || 0, budget.total_spent || 0,
    userId, now
  ).run();

  return { budgetId, previousCommitted: prevCommitted, newCommitted, availableAmount: totalAvailable, transactionId: txnId };
}

export async function recordSpend(db, budgetId, amount, referenceType, referenceId, referenceName, userId, companyId) {
  const budget = await db.prepare(
    'SELECT * FROM budgets WHERE id = ? AND company_id = ?'
  ).bind(budgetId, companyId).first();

  if (!budget) throw new Error('Budget not found');

  const prevSpent = budget.total_spent || 0;
  const prevCommitted = budget.total_committed || 0;
  const newSpent = prevSpent + amount;
  const newCommitted = Math.max(0, prevCommitted - amount);
  const totalAvailable = (budget.amount || 0) - newCommitted - newSpent;
  const now = new Date().toISOString();

  await db.prepare(`
    UPDATE budgets SET total_committed = ?, total_spent = ?, total_available = ?, utilized = ?, updated_at = ? WHERE id = ?
  `).bind(newCommitted, newSpent, totalAvailable, newSpent, now, budgetId).run();

  const txnId = generateId();
  await db.prepare(`
    INSERT INTO budget_transactions (id, company_id, budget_id, transaction_type, amount, reference_type, reference_id, reference_name, previous_committed, new_committed, previous_spent, new_spent, created_by, created_at)
    VALUES (?, ?, ?, 'spend', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    txnId, companyId, budgetId, amount,
    referenceType, referenceId, referenceName || '',
    prevCommitted, newCommitted,
    prevSpent, newSpent,
    userId, now
  ).run();

  await checkBudgetAlerts(db, budgetId, companyId);

  return { budgetId, previousSpent: prevSpent, newSpent, availableAmount: totalAvailable, transactionId: txnId };
}

export async function checkBudgetAlerts(db, budgetId, companyId) {
  const budget = await db.prepare(
    'SELECT * FROM budgets WHERE id = ? AND company_id = ?'
  ).bind(budgetId, companyId).first();

  if (!budget || !budget.amount) return [];

  const totalUsed = (budget.total_committed || 0) + (budget.total_spent || 0);
  const usagePct = (totalUsed / budget.amount) * 100;
  const alerts = [];
  const now = new Date().toISOString();

  const thresholds = [
    { pct: 80, type: 'threshold_80', msg: `Budget "${budget.name}" is ${usagePct.toFixed(1)}% utilized (80% threshold)` },
    { pct: 90, type: 'threshold_90', msg: `Budget "${budget.name}" is ${usagePct.toFixed(1)}% utilized (90% threshold)` },
    { pct: 100, type: 'threshold_100', msg: `Budget "${budget.name}" is fully utilized` },
  ];

  for (const t of thresholds) {
    if (usagePct >= t.pct) {
      const existing = await db.prepare(
        'SELECT id FROM budget_alerts WHERE budget_id = ? AND alert_type = ? AND acknowledged = 0'
      ).bind(budgetId, t.type).first();

      if (!existing) {
        const alertId = generateId();
        await db.prepare(`
          INSERT INTO budget_alerts (id, company_id, budget_id, alert_type, threshold_pct, current_pct, message, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(alertId, companyId, budgetId, t.type, t.pct, usagePct, t.msg, now).run();
        alerts.push({ id: alertId, type: t.type, message: t.msg });
      }
    }
  }

  if (usagePct > 100) {
    const alertId = generateId();
    await db.prepare(`
      INSERT INTO budget_alerts (id, company_id, budget_id, alert_type, threshold_pct, current_pct, message, created_at)
      VALUES (?, ?, ?, 'overspend', 100, ?, ?, ?)
    `).bind(alertId, companyId, budgetId, usagePct, `Budget "${budget.name}" is overspent by R${(totalUsed - budget.amount).toLocaleString()}`, now).run();
    alerts.push({ id: alertId, type: 'overspend' });
  }

  return alerts;
}

// Sprint 5: Predictive budget alerts — burn rate and days until exhausted
export async function predictiveBudgetAlerts(db, companyId) {
  const budgets = await db.prepare(
    "SELECT * FROM budgets WHERE company_id = ? AND status IN ('approved', 'active') AND amount > 0"
  ).bind(companyId).all();

  const alerts = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

  for (const budget of (budgets.results || [])) {
    const total = budget.amount || 0;
    const utilized = (budget.total_committed || 0) + (budget.total_spent || 0);
    const remaining = total - utilized;
    if (remaining <= 0) continue;

    // Calculate burn rate from last 30 days of promotions against this budget
    const recentSpend = await db.prepare(
      "SELECT COALESCE(SUM(expected_spend), 0) as total FROM promotions WHERE budget_id = ? AND created_at > ?"
    ).bind(budget.id, thirtyDaysAgo).first();

    const burnRate = (recentSpend?.total || 0) / 30; // per day
    const daysUntilExhausted = burnRate > 0 ? Math.round(remaining / burnRate) : 999;

    const alertsSent = JSON.parse(budget.alerts_sent || '[]');

    if (daysUntilExhausted <= 14 && !alertsSent.includes('predicted_exhaustion')) {
      const alertId = crypto.randomUUID();
      await db.prepare(`
        INSERT INTO budget_alerts (id, company_id, budget_id, alert_type, threshold_pct, current_pct, message, created_at)
        VALUES (?, ?, ?, 'predicted_exhaustion', 0, ?, ?, datetime('now'))
      `).bind(alertId, companyId, budget.id, Math.round((utilized / total) * 100),
        `Budget "${budget.name}" predicted to be exhausted in ${daysUntilExhausted} days at current burn rate of R${Math.round(burnRate).toLocaleString()}/day`
      ).run();

      alertsSent.push('predicted_exhaustion');
      await db.prepare(
        "UPDATE budgets SET alerts_sent = ? WHERE id = ?"
      ).bind(JSON.stringify(alertsSent), budget.id).run();

      alerts.push({ budgetId: budget.id, budgetName: budget.name, daysUntilExhausted, burnRate: Math.round(burnRate), remaining: Math.round(remaining) });
    }
  }

  return alerts;
}

export async function fundKamWallets(db, budgetId, companyId, userId) {
  const budget = await db.prepare(
    'SELECT * FROM budgets WHERE id = ? AND company_id = ?'
  ).bind(budgetId, companyId).first();

  if (!budget) throw new Error('Budget not found');

  const users = await db.prepare(
    "SELECT * FROM users WHERE company_id = ? AND role IN ('kam', 'key_account_manager', 'sales_rep') AND is_active = 1"
  ).bind(companyId).all();

  const kamUsers = users.results || [];
  if (kamUsers.length === 0) return { funded: 0, wallets: [] };

  const perKam = Math.floor((budget.amount || 0) / kamUsers.length);
  const now = new Date().toISOString();
  const wallets = [];

  for (const kam of kamUsers) {
    const existing = await db.prepare(
      'SELECT * FROM kam_wallets WHERE company_id = ? AND user_id = ? AND year = ?'
    ).bind(companyId, kam.id, budget.year || new Date().getFullYear()).first();

    if (existing) {
      const newAllocated = (existing.allocated_amount || 0) + perKam;
      const newAvailable = newAllocated - (existing.utilized_amount || 0) - (existing.committed_amount || 0);
      await db.prepare(`
        UPDATE kam_wallets SET allocated_amount = ?, available_amount = ?, updated_at = ? WHERE id = ?
      `).bind(newAllocated, newAvailable, now, existing.id).run();
      wallets.push({ walletId: existing.id, userId: kam.id, allocated: newAllocated });
    } else {
      const walletId = generateId();
      await db.prepare(`
        INSERT INTO kam_wallets (id, company_id, user_id, year, allocated_amount, utilized_amount, committed_amount, available_amount, status, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 0, 0, ?, 'active', '{}', ?, ?)
      `).bind(walletId, companyId, kam.id, budget.year || new Date().getFullYear(), perKam, perKam, now, now).run();
      wallets.push({ walletId, userId: kam.id, allocated: perKam });
    }
  }

  const totalAllocated = perKam * kamUsers.length;
  await db.prepare(`
    UPDATE budgets SET total_allocated = ?, updated_at = ? WHERE id = ?
  `).bind(totalAllocated, now, budgetId).run();

  return { funded: kamUsers.length, perKam, totalAllocated, wallets };
}
