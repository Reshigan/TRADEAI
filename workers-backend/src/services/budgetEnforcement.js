export class BudgetEnforcementService {
  constructor(db) { this.db = db; }

  async checkAvailability(budgetId, requestedAmount) {
    const budget = await this.db.prepare(
      'SELECT amount, committed, spent FROM budgets WHERE id = ?'
    ).bind(budgetId).first();
    if (!budget) throw new Error('Budget not found');
    const available = budget.amount - budget.committed - budget.spent;
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
