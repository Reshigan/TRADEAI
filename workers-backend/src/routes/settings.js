import { Hono } from 'hono';
import { getMongoClient } from '../services/d1.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { apiError } from '../utils/apiError.js';

// T-01: Default terminology map
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

// T-07: CompanyType presets
const COMPANY_TYPE_DEFAULTS = {
  distributor: {
    budget: 'AOP',
    promotion: 'Deal',
    trade_spend: 'Trade Investment',
    campaign: 'Program',
    rebate: 'Volume Incentive',
    claim: 'Claim',
    deduction: 'Deduction',
    settlement: 'Settlement',
    accrual: 'Accrual',
    trading_term: 'Trading Agreement',
    vendor: 'Supplier',
    customer: 'Account',
    product: 'SKU',
    approval: 'Authorization',
    notification: 'Alert',
    kam_wallet: 'Sales Rep Budget',
    vendor_fund: 'Supplier Fund',
    pnl: 'P&L',
    forecast: 'Projection',
    baseline: 'Baseline',
    scenario: 'What-If',
  },
  retailer: {
    budget: 'Budget',
    promotion: 'Promotion',
    trade_spend: 'Trade Spend',
    campaign: 'Campaign',
    rebate: 'Rebate',
    claim: 'Vendor Claim',
    deduction: 'Chargeback',
    settlement: 'Reconciliation',
    accrual: 'Accrual',
    trading_term: 'Trading Term',
    vendor: 'Vendor',
    customer: 'Store',
    product: 'Item',
    approval: 'Approval',
    notification: 'Notification',
    kam_wallet: 'Buyer Wallet',
    vendor_fund: 'Co-op Fund',
    pnl: 'Margin Report',
    forecast: 'Forecast',
    baseline: 'Baseline',
    scenario: 'Scenario',
  },
};

export const settingsRoutes = new Hono();

settingsRoutes.use('*', authMiddleware);

settingsRoutes.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const settings = await mongodb.find('settings', { companyId: tenantId });

    const result = {};
    for (const setting of settings) {
      let value = setting.value;
      if (typeof value === 'string') {
        try { value = JSON.parse(value); } catch (e) { /* keep as string */ }
      }
      result[setting.key] = value;
    }

    if (Object.keys(result).length === 0) {
      return c.json({
        success: true,
        data: {
          currency: 'ZAR',
          currencySymbol: 'R',
          dateFormat: 'DD/MM/YYYY',
          fiscalYearStart: 'January',
          timezone: 'Africa/Johannesburg',
          language: 'en'
        }
      });
    }

    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get settings', error: error.message }, 500);
  }
});

settingsRoutes.put('/', requireRole('admin', 'superadmin'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const data = await c.req.json();
    const mongodb = getMongoClient(c);

    for (const [key, value] of Object.entries(data)) {
      const existing = await mongodb.findOne('settings', { companyId: tenantId, key });
      const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);

      if (existing) {
        await mongodb.updateOne('settings', { _id: existing._id }, { value: serialized });
      } else {
        await mongodb.insertOne('settings', { companyId: tenantId, key, value: serialized });
      }
    }

    return c.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to update settings', error: error.message }, 500);
  }
});

// T-01: GET /terminology - Get terminology labels for current tenant
settingsRoutes.get('/terminology', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    // Get company type for defaults
    const companyTypeSetting = await mongodb.findOne('settings', { companyId: tenantId, key: 'companyType' });
    const companyType = companyTypeSetting?.value || 'distributor';

    // Layer 1: hardcoded defaults
    const merged = { ...DEFAULT_TERMINOLOGY };

    // Layer 2: company type defaults
    const typeDefaults = COMPANY_TYPE_DEFAULTS[companyType];
    if (typeDefaults) {
      Object.assign(merged, typeDefaults);
    }

    // Layer 3: tenant custom overrides
    const customSetting = await mongodb.findOne('settings', { companyId: tenantId, key: 'terminology' });
    if (customSetting?.value) {
      let custom = customSetting.value;
      if (typeof custom === 'string') {
        try { custom = JSON.parse(custom); } catch (e) { custom = {}; }
      }
      Object.assign(merged, custom);
    }

    return c.json({
      success: true,
      data: {
        labels: merged,
        companyType,
        defaults: DEFAULT_TERMINOLOGY,
        companyTypeDefaults: typeDefaults || {},
      }
    });
  } catch (error) {
    return apiError(c, error, 'settings');
  }
});

// T-01: PUT /terminology - Update terminology labels (admin only)
settingsRoutes.put('/terminology', requireRole('admin', 'superadmin'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const data = await c.req.json();
    const mongodb = getMongoClient(c);

    // Validate: only allow known keys
    const validKeys = Object.keys(DEFAULT_TERMINOLOGY);
    const filtered = {};
    for (const [key, value] of Object.entries(data)) {
      if (validKeys.includes(key) && typeof value === 'string' && value.trim().length > 0) {
        filtered[key] = value.trim();
      }
    }

    const serialized = JSON.stringify(filtered);

    const existing = await mongodb.findOne('settings', { companyId: tenantId, key: 'terminology' });
    if (existing) {
      await mongodb.updateOne('settings', { _id: existing._id }, { value: serialized });
    } else {
      await mongodb.insertOne('settings', { companyId: tenantId, key: 'terminology', value: serialized });
    }

    return c.json({ success: true, message: 'Terminology updated successfully', data: filtered });
  } catch (error) {
    return apiError(c, error, 'settings');
  }
});

// T-01: DELETE /terminology - Reset terminology to defaults (admin only)
settingsRoutes.delete('/terminology', requireRole('admin', 'superadmin'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const existing = await mongodb.findOne('settings', { companyId: tenantId, key: 'terminology' });
    if (existing) {
      await mongodb.deleteOne('settings', { _id: existing._id });
    }

    return c.json({ success: true, message: 'Terminology reset to defaults' });
  } catch (error) {
    return apiError(c, error, 'settings');
  }
});

// T-07: PUT /company-type - Set company type (updates terminology defaults)
settingsRoutes.put('/company-type', requireRole('admin', 'superadmin'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const { companyType } = await c.req.json();
    const mongodb = getMongoClient(c);

    if (!['distributor', 'retailer', 'custom'].includes(companyType)) {
      return c.json({ success: false, message: 'Invalid company type. Must be "distributor", "retailer", or "custom".' }, 400);
    }

    const existing = await mongodb.findOne('settings', { companyId: tenantId, key: 'companyType' });
    if (existing) {
      await mongodb.updateOne('settings', { _id: existing._id }, { value: companyType });
    } else {
      await mongodb.insertOne('settings', { companyId: tenantId, key: 'companyType', value: companyType });
    }

    return c.json({
      success: true,
      message: `Company type set to ${companyType}`,
      data: { companyType, defaults: COMPANY_TYPE_DEFAULTS[companyType] }
    });
  } catch (error) {
    return apiError(c, error, 'settings');
  }
});
