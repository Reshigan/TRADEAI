import { Hono } from 'hono';
import { getMongoClient } from '../services/d1.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

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
