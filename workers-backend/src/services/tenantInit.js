// GAP-11: Tenant Initialization Service
// Seeds default config and optional sample data for new tenants

export class TenantInitService {
  constructor(db) {
    this.db = db;
  }

  async initializeTenant(companyId, options = {}) {
    const results = { steps: [] };

    // Step 1: Default business rules
    await this.seedBusinessRules(companyId);
    results.steps.push('business_rules');

    // Step 2: Default approval thresholds
    await this.seedApprovalConfig(companyId);
    results.steps.push('approval_config');

    // Step 3: Default workflow templates
    await this.seedWorkflowTemplates(companyId);
    results.steps.push('workflow_templates');

    // Step 4: Default KPI definitions
    await this.seedKPIDefinitions(companyId);
    results.steps.push('kpi_definitions');

    // Step 5: Default alert rules
    await this.seedAlertRules(companyId);
    results.steps.push('alert_rules');

    // Step 6: Default report templates
    await this.seedReportTemplates(companyId);
    results.steps.push('report_templates');

    // Step 7: Sample data (optional)
    if (options.includeSampleData) {
      await this.seedSampleData(companyId);
      results.steps.push('sample_data');
    }

    // Save onboarding progress
    await this.db.prepare(
      "INSERT OR REPLACE INTO system_config (id, company_id, config_key, config_value, created_at, updated_at) VALUES (?, ?, 'onboarding_progress', ?, datetime('now'), datetime('now'))"
    ).bind(crypto.randomUUID(), companyId, JSON.stringify({ completedSteps: results.steps, completedAt: new Date().toISOString() })).run();

    return results;
  }

  async seedBusinessRules(companyId) {
    const rules = [
      { name: 'Max Discount Rate', rule_type: 'promotion', condition: 'discount_rate', threshold: 50, action: 'require_approval' },
      { name: 'Min Promotion Duration', rule_type: 'promotion', condition: 'duration_days', threshold: 7, action: 'warning' },
      { name: 'Max Budget Overspend', rule_type: 'budget', condition: 'overspend_pct', threshold: 10, action: 'block' },
      { name: 'Claim Amount Threshold', rule_type: 'claim', condition: 'amount', threshold: 100000, action: 'require_approval' }
    ];
    for (const rule of rules) {
      await this.db.prepare(
        "INSERT INTO business_rules (id, company_id, name, rule_type, data, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))"
      ).bind(crypto.randomUUID(), companyId, rule.name, rule.rule_type, JSON.stringify(rule)).run();
    }
  }

  async seedApprovalConfig(companyId) {
    const configs = [
      { key: 'approval_threshold_low', value: '50000' },
      { key: 'approval_threshold_medium', value: '250000' },
      { key: 'approval_threshold_high', value: '1000000' },
      { key: 'approval_sla_hours', value: '48' },
      { key: 'auto_approve_below', value: '10000' }
    ];
    for (const c of configs) {
      await this.db.prepare(
        "INSERT OR REPLACE INTO system_config (id, company_id, config_key, config_value, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))"
      ).bind(crypto.randomUUID(), companyId, c.key, c.value).run();
    }
  }

  async seedWorkflowTemplates(companyId) {
    const templates = [
      { name: 'Promotion Approval', type: 'approval', steps: ['manager_review', 'finance_review', 'final_approval'] },
      { name: 'Claim Processing', type: 'claim', steps: ['validation', 'manager_approval', 'finance_processing'] },
      { name: 'Budget Request', type: 'budget', steps: ['department_review', 'finance_approval', 'executive_approval'] }
    ];
    for (const t of templates) {
      await this.db.prepare(
        "INSERT INTO workflow_templates (id, company_id, name, workflow_type, data, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))"
      ).bind(crypto.randomUUID(), companyId, t.name, t.type, JSON.stringify(t)).run();
    }
  }

  async seedKPIDefinitions(companyId) {
    const kpis = [
      { name: 'Trade Spend ROI', metric: 'trade_spend_roi', target: 150, unit: '%' },
      { name: 'Budget Utilization', metric: 'budget_utilization', target: 85, unit: '%' },
      { name: 'Promotion Effectiveness', metric: 'promo_lift', target: 20, unit: '%' },
      { name: 'Claim Resolution Time', metric: 'claim_resolution_days', target: 14, unit: 'days' },
      { name: 'Deduction Match Rate', metric: 'deduction_match_rate', target: 90, unit: '%' }
    ];
    for (const k of kpis) {
      await this.db.prepare(
        "INSERT INTO executive_kpis (id, company_id, name, data, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))"
      ).bind(crypto.randomUUID(), companyId, k.name, JSON.stringify(k)).run();
    }
  }

  async seedAlertRules(companyId) {
    const rules = [
      { name: 'Budget 75% Alert', alert_type: 'budget_threshold', condition: { threshold: 75 }, severity: 'warning' },
      { name: 'Budget 90% Alert', alert_type: 'budget_threshold', condition: { threshold: 90 }, severity: 'high' },
      { name: 'Approval SLA Breach', alert_type: 'sla_breach', condition: { hours: 48 }, severity: 'critical' },
      { name: 'Unmatched Deduction Alert', alert_type: 'unmatched_deduction', condition: { days: 30 }, severity: 'warning' }
    ];
    for (const r of rules) {
      await this.db.prepare(
        "INSERT INTO alert_rules (id, company_id, name, alert_type, data, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))"
      ).bind(crypto.randomUUID(), companyId, r.name, r.alert_type, JSON.stringify(r)).run();
    }
  }

  async seedReportTemplates(companyId) {
    const templates = [
      { name: 'Monthly P&L Report', report_type: 'pnl', schedule: 'monthly', format: 'excel' },
      { name: 'Budget Utilization Report', report_type: 'budget', schedule: 'weekly', format: 'excel' },
      { name: 'Promotion Performance', report_type: 'promotion', schedule: 'monthly', format: 'excel' },
      { name: 'Claim Status Report', report_type: 'claims', schedule: 'weekly', format: 'csv' }
    ];
    for (const t of templates) {
      await this.db.prepare(
        "INSERT INTO report_templates (id, company_id, name, report_type, data, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))"
      ).bind(crypto.randomUUID(), companyId, t.name, t.report_type, JSON.stringify(t)).run();
    }
  }

  async seedSampleData(companyId) {
    // 5 sample customers
    const customers = ['Acme Retail', 'Global Foods', 'Metro Mart', 'Fresh Chain', 'Value Store'];
    for (const name of customers) {
      await this.db.prepare(
        "INSERT INTO customers (id, company_id, name, customer_type, status, channel, created_at, updated_at) VALUES (?, ?, ?, 'retailer', 'active', 'modern_trade', datetime('now'), datetime('now'))"
      ).bind(crypto.randomUUID(), companyId, name).run();
    }

    // 10 sample products
    const products = ['Premium Cola 500ml', 'Diet Cola 330ml', 'Energy Drink 250ml', 'Sparkling Water 1L',
      'Fruit Juice 1L', 'Iced Tea 500ml', 'Sports Drink 750ml', 'Coffee RTD 250ml', 'Mineral Water 500ml', 'Tonic Water 200ml'];
    for (const name of products) {
      await this.db.prepare(
        "INSERT INTO products (id, company_id, name, category, status, data, created_at, updated_at) VALUES (?, ?, ?, 'beverages', 'active', '{}', datetime('now'), datetime('now'))"
      ).bind(crypto.randomUUID(), companyId, name).run();
    }

    // 2 sample budgets
    const year = new Date().getFullYear();
    for (const budgetName of [`Annual Trade Budget ${year}`, `Q1 Marketing Budget ${year}`]) {
      await this.db.prepare(
        "INSERT INTO budgets (id, company_id, name, year, amount, committed, spent, available, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, 0, ?, 'approved', datetime('now'), datetime('now'))"
      ).bind(crypto.randomUUID(), companyId, budgetName, year, budgetName.includes('Annual') ? 5000000 : 1000000, budgetName.includes('Annual') ? 5000000 : 1000000).run();
    }
  }
}
