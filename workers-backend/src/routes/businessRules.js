import { Hono } from 'hono';
import { getMongoClient } from '../services/d1.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

export const businessRulesRoutes = new Hono();

businessRulesRoutes.use('*', authMiddleware);

businessRulesRoutes.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const configs = await mongodb.find('business_rules_config', { companyId: tenantId });

    const result = {};
    for (const config of configs) {
      const category = config.category || 'general';
      let rules = config.rules;
      if (typeof rules === 'string') {
        try { rules = JSON.parse(rules); } catch (e) { rules = {}; }
      }
      result[category] = rules || {};
    }

    if (Object.keys(result).length === 0) {
      return c.json({
        success: true,
        data: getDefaultRules()
      });
    }

    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get business rules', error: error.message }, 500);
  }
});

businessRulesRoutes.get('/:category', async (c) => {
  try {
    const { category } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const config = await mongodb.findOne('business_rules_config', { companyId: tenantId, category });

    if (!config) {
      const defaults = getDefaultRules();
      return c.json({ success: true, data: defaults[category] || {} });
    }

    let rules = config.rules;
    if (typeof rules === 'string') {
      try { rules = JSON.parse(rules); } catch (e) { rules = {}; }
    }

    return c.json({ success: true, data: rules });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get business rules', error: error.message }, 500);
  }
});

businessRulesRoutes.put('/:category', requireRole('admin', 'superadmin'), async (c) => {
  try {
    const { category } = c.req.param();
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const rules = await c.req.json();
    const mongodb = getMongoClient(c);

    const existing = await mongodb.findOne('business_rules_config', { companyId: tenantId, category });

    if (existing) {
      await mongodb.updateOne('business_rules_config', { _id: existing._id }, {
        rules: JSON.stringify(rules),
        updatedBy: userId
      });
    } else {
      await mongodb.insertOne('business_rules_config', {
        companyId: tenantId,
        category,
        rules: JSON.stringify(rules),
        updatedBy: userId
      });
    }

    return c.json({ success: true, message: 'Business rules updated successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to update business rules', error: error.message }, 500);
  }
});

businessRulesRoutes.post('/reset/:category', requireRole('admin', 'superadmin'), async (c) => {
  try {
    const { category } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    await mongodb.deleteMany('business_rules_config', { companyId: tenantId, category });

    const defaults = getDefaultRules();
    return c.json({ success: true, data: defaults[category] || {}, message: 'Business rules reset to defaults' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to reset business rules', error: error.message }, 500);
  }
});

function getDefaultRules() {
  return {
    promotions: {
      minDurationDays: 1,
      maxDurationDays: 365,
      maxDiscountPercent: 50,
      maxDiscountAbsolute: 1000000,
      stackingPolicy: 'no_stacking',
      overlapPolicy: 'warn'
    },
    budgets: {
      minROIPercent: 5,
      maxBudgetPercentOfRevenue: 15,
      categoryCaps: {}
    },
    rebates: {
      maxAccrualRateByType: {
        volume: 15,
        growth: 20,
        loyalty: 10
      },
      allowedSettlementCycles: ['monthly', 'quarterly', 'annually']
    },
    claims: {
      maxWriteoffPercent: 10,
      autoMatchEnabled: true
    },
    tradeSpend: {
      approvalThresholds: [
        { maxAmount: 50000, role: 'manager' },
        { maxAmount: 200000, role: 'director' },
        { maxAmount: Infinity, role: 'admin' }
      ],
      minROIPercent: 3
    },
    allocations: {
      maxPercentOfRevenue: 20
    }
  };
}
