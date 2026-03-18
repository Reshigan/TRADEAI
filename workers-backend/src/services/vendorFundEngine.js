// GAP-13: Vendor Fund → Budget Engine

export class VendorFundEngine {
  constructor(db) {
    this.db = db;
  }

  // When a vendor fund is approved, auto-create or increment a budget
  async linkFundToBudget(vendorFund, companyId) {
    // Check for existing linked budget
    const existing = await this.db.prepare(
      "SELECT * FROM budgets WHERE company_id = ? AND vendor_fund_id = ?"
    ).bind(companyId, vendorFund.id).first();

    if (existing) {
      // Increment existing budget
      const newAmount = (existing.amount || 0) + (vendorFund.amount || 0);
      const newAvailable = (existing.available || 0) + (vendorFund.amount || 0);
      await this.db.prepare(
        "UPDATE budgets SET amount = ?, available = ?, updated_at = datetime('now') WHERE id = ?"
      ).bind(newAmount, newAvailable, existing.id).run();
      return { action: 'incremented', budgetId: existing.id, newAmount };
    }

    // Create new budget linked to vendor fund
    const budgetId = crypto.randomUUID();
    await this.db.prepare(`
      INSERT INTO budgets (id, company_id, name, year, amount, committed, spent, available, status, budget_type, vendor_fund_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, 0, ?, 'approved', 'vendor_funded', ?, datetime('now'), datetime('now'))
    `).bind(
      budgetId, companyId,
      `Vendor Fund: ${vendorFund.vendor_name || vendorFund.name || 'Unknown'}`,
      new Date().getFullYear(),
      vendorFund.amount || 0,
      vendorFund.amount || 0,
      vendorFund.id
    ).run();

    return { action: 'created', budgetId, amount: vendorFund.amount };
  }

  // Get vendor fund utilization report
  async getVendorUtilization(companyId) {
    const funds = await this.db.prepare(`
      SELECT vf.*, 
        b.amount as budget_amount, b.committed as budget_committed, b.spent as budget_spent, b.available as budget_available,
        b.id as linked_budget_id
      FROM vendor_funds vf
      LEFT JOIN budgets b ON b.vendor_fund_id = vf.id AND b.company_id = vf.company_id
      WHERE vf.company_id = ?
      ORDER BY vf.created_at DESC
    `).bind(companyId).all();

    const results = (funds.results || []).map(f => ({
      ...f,
      utilization_pct: f.budget_amount > 0 ? Math.round((f.budget_spent || 0) / f.budget_amount * 100) : 0,
      roi: f.budget_spent > 0 ? ((f.budget_amount - f.budget_spent) / f.budget_spent * 100).toFixed(1) : 0
    }));

    return {
      funds: results,
      summary: {
        totalContributions: results.reduce((s, f) => s + (f.amount || 0), 0),
        totalUtilized: results.reduce((s, f) => s + (f.budget_spent || 0), 0),
        avgUtilization: results.length > 0 ? Math.round(results.reduce((s, f) => s + f.utilization_pct, 0) / results.length) : 0
      }
    };
  }
}
