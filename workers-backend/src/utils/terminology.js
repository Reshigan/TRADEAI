// T-06: Terminology helper for backend API responses
// Resolves terminology labels for the current tenant and injects into responses

const DEFAULT_TERMINOLOGY = {
  budget: 'Budget',
  promotion: 'Promotion',
  trade_spend: 'Trade Spend',
  campaign: 'Campaign',
  rebate: 'Rebate',
  claim: 'Claim',
  deduction: 'Deduction',
  settlement: 'Settlement',
  accrual: 'Accrual',
  trading_term: 'Trading Term',
  vendor: 'Vendor',
  customer: 'Customer',
  product: 'Product',
  approval: 'Approval',
  notification: 'Notification',
  kam_wallet: 'KAM Wallet',
  vendor_fund: 'Vendor Fund',
  pnl: 'P&L',
  forecast: 'Forecast',
  baseline: 'Baseline',
  scenario: 'Scenario',
};

const COMPANY_TYPE_DEFAULTS = {
  distributor: {
    budget: 'AOP', promotion: 'Deal', trade_spend: 'Trade Investment',
    campaign: 'Program', rebate: 'Volume Incentive', trading_term: 'Trading Agreement',
    vendor: 'Supplier', customer: 'Account', product: 'SKU',
    approval: 'Authorization', notification: 'Alert', kam_wallet: 'Sales Rep Budget',
    vendor_fund: 'Supplier Fund', forecast: 'Projection', scenario: 'What-If',
  },
  retailer: {
    claim: 'Vendor Claim', deduction: 'Chargeback', settlement: 'Reconciliation',
    customer: 'Store', product: 'Item', kam_wallet: 'Buyer Wallet',
    vendor_fund: 'Co-op Fund', pnl: 'Margin Report',
  },
};

/**
 * Resolve terminology labels for a tenant.
 * Uses three-layer system: DEFAULT -> CompanyType -> Custom overrides
 */
export async function getTerminologyForTenant(db, companyId) {
  const merged = { ...DEFAULT_TERMINOLOGY };
  try {
    // Layer 2: company type defaults
    const ctResult = await db.prepare(
      "SELECT value FROM settings WHERE company_id = ? AND key = 'companyType'"
    ).bind(companyId).first();
    const companyType = ctResult?.value || 'distributor';
    const typeDefaults = COMPANY_TYPE_DEFAULTS[companyType];
    if (typeDefaults) Object.assign(merged, typeDefaults);

    // Layer 3: custom overrides
    const customResult = await db.prepare(
      "SELECT value FROM settings WHERE company_id = ? AND key = 'terminology'"
    ).bind(companyId).first();
    if (customResult?.value) {
      let custom = customResult.value;
      if (typeof custom === 'string') {
        try { custom = JSON.parse(custom); } catch (e) { custom = {}; }
      }
      Object.assign(merged, custom);
    }
  } catch (e) {
    // Fallback to defaults if settings table doesn't exist yet
  }
  return merged;
}

/**
 * Middleware that resolves and attaches terminology to the Hono context.
 * Usage: c.get('terminology') returns the labels object.
 */
export async function terminologyMiddleware(c, next) {
  try {
    const companyId = c.get('tenantId') || c.get('companyId') || 'default';
    const db = c.env.DB;
    if (db) {
      const labels = await getTerminologyForTenant(db, companyId);
      c.set('terminology', labels);
    }
  } catch (e) {
    c.set('terminology', DEFAULT_TERMINOLOGY);
  }
  await next();
}
