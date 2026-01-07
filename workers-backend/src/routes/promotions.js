import { Hono } from 'hono';
import { getMongoClient } from '../services/mongodb.js';
import { authMiddleware } from '../middleware/auth.js';

export const promotionRoutes = new Hono();

promotionRoutes.use('*', authMiddleware);

// Get all promotions
promotionRoutes.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const { page = 1, limit = 20, search, status, type } = c.req.query();

    const filter = { companyId: tenantId };
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const promotions = await mongodb.find('promotions', filter, {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    });

    const total = await mongodb.countDocuments('promotions', filter);

    return c.json({
      success: true,
      data: promotions,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get promotions', error: error.message }, 500);
  }
});

// Get promotion by ID
promotionRoutes.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const promotion = await mongodb.findOne('promotions', { _id: { $oid: id }, companyId: tenantId });
    if (!promotion) return c.json({ success: false, message: 'Promotion not found' }, 404);

    return c.json({ success: true, data: promotion });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get promotion', error: error.message }, 500);
  }
});

// Create promotion
promotionRoutes.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const data = await c.req.json();
    const mongodb = getMongoClient(c);

    const promotionId = await mongodb.insertOne('promotions', {
      ...data,
      companyId: tenantId,
      createdBy: userId,
      status: data.status || 'draft'
    });

    return c.json({ success: true, data: { id: promotionId }, message: 'Promotion created successfully' }, 201);
  } catch (error) {
    return c.json({ success: false, message: 'Failed to create promotion', error: error.message }, 500);
  }
});

// Update promotion
promotionRoutes.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const updates = await c.req.json();
    const mongodb = getMongoClient(c);

    await mongodb.updateOne('promotions', { _id: { $oid: id }, companyId: tenantId }, updates);

    return c.json({ success: true, message: 'Promotion updated successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to update promotion', error: error.message }, 500);
  }
});

// Delete promotion
promotionRoutes.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    await mongodb.deleteOne('promotions', { _id: { $oid: id }, companyId: tenantId });

    return c.json({ success: true, message: 'Promotion deleted successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to delete promotion', error: error.message }, 500);
  }
});

// Get promotion performance
promotionRoutes.get('/:id/performance', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const promotion = await mongodb.findOne('promotions', { _id: { $oid: id }, companyId: tenantId });
    if (!promotion) return c.json({ success: false, message: 'Promotion not found' }, 404);

    // Get related trade spends
    const tradeSpends = await mongodb.find('tradespends', { promotionId: id, companyId: tenantId });
    
    const totalSpend = tradeSpends.reduce((sum, ts) => sum + (ts.amount || 0), 0);
    const roi = promotion.performance?.roi || ((promotion.revenue || 0) - totalSpend) / (totalSpend || 1) * 100;

    return c.json({
      success: true,
      data: {
        promotionId: id,
        totalSpend,
        revenue: promotion.revenue || 0,
        roi,
        uplift: promotion.performance?.uplift || 0,
        status: promotion.status
      }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get promotion performance', error: error.message }, 500);
  }
});
