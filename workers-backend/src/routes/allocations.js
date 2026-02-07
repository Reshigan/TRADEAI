import { Hono } from 'hono';
import { getMongoClient } from '../services/d1.js';
import { authMiddleware } from '../middleware/auth.js';

export const allocationRoutes = new Hono();

allocationRoutes.use('*', authMiddleware);

allocationRoutes.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const { page = 1, limit = 20, status, budgetId } = c.req.query();

    const filter = { companyId: tenantId };
    if (status) filter.status = status;
    if (budgetId) filter.budgetId = budgetId;

    const allocations = await mongodb.find('allocations', filter, {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    });

    const total = await mongodb.countDocuments('allocations', filter);

    return c.json({
      success: true,
      data: allocations,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get allocations', error: error.message }, 500);
  }
});

allocationRoutes.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const allocation = await mongodb.findOne('allocations', { _id: { $oid: id }, companyId: tenantId });
    if (!allocation) return c.json({ success: false, message: 'Allocation not found' }, 404);

    return c.json({ success: true, data: allocation });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get allocation', error: error.message }, 500);
  }
});

allocationRoutes.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const data = await c.req.json();
    const mongodb = getMongoClient(c);

    const allocationId = await mongodb.insertOne('allocations', {
      ...data,
      companyId: tenantId,
      createdBy: userId,
      status: data.status || 'draft'
    });

    return c.json({ success: true, data: { id: allocationId }, message: 'Allocation created successfully' }, 201);
  } catch (error) {
    return c.json({ success: false, message: 'Failed to create allocation', error: error.message }, 500);
  }
});

allocationRoutes.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const updates = await c.req.json();
    const mongodb = getMongoClient(c);

    await mongodb.updateOne('allocations', { _id: { $oid: id }, companyId: tenantId }, updates);

    return c.json({ success: true, message: 'Allocation updated successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to update allocation', error: error.message }, 500);
  }
});

allocationRoutes.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    await mongodb.deleteOne('allocations', { _id: { $oid: id }, companyId: tenantId });

    return c.json({ success: true, message: 'Allocation deleted successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to delete allocation', error: error.message }, 500);
  }
});
