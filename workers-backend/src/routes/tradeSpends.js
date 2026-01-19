import { Hono } from 'hono';
import { getMongoClient } from '../services/d1.js';
import { authMiddleware } from '../middleware/auth.js';

export const tradeSpendRoutes = new Hono();

tradeSpendRoutes.use('*', authMiddleware);

// Get all trade spends
tradeSpendRoutes.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const { page = 1, limit = 20, status, customerId, promotionId } = c.req.query();

    const filter = { companyId: tenantId };
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (promotionId) filter.promotionId = promotionId;

    const tradeSpends = await mongodb.find('tradespends', filter, {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    });

    // Enrich trade spends with customer names and promotion details
    // Note: D1 service's rowToDocument already merges JSON data column into the document at top level
    const enrichedTradeSpends = await Promise.all(tradeSpends.map(async (ts) => {
      let customerName = null;
      let startDate = null;
      
      // Get customer name if customer_id exists
      if (ts.customerId || ts.customer_id) {
        const customer = await mongodb.findOne('customers', { 
          id: ts.customerId || ts.customer_id,
          companyId: tenantId 
        });
        if (customer) {
          customerName = customer.name;
        }
      }
      
      // First check if startDate is already at top level (merged from JSON data column by D1 service)
      if (ts.startDate) {
        startDate = ts.startDate;
      }
      // Fallback: Get promotion start date if promotion_id exists
      else if (ts.promotionId || ts.promotion_id) {
        const promotion = await mongodb.findOne('promotions', { 
          id: ts.promotionId || ts.promotion_id,
          companyId: tenantId 
        });
        if (promotion) {
          startDate = promotion.startDate || promotion.start_date;
        }
      }
      
      return {
        ...ts,
        customerName,
        startDate
      };
    }));

    const total = await mongodb.countDocuments('tradespends', filter);

    return c.json({
      success: true,
      data: enrichedTradeSpends,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get trade spends', error: error.message }, 500);
  }
});

// Get trade spend by ID
tradeSpendRoutes.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const tradeSpend = await mongodb.findOne('tradespends', { _id: { $oid: id }, companyId: tenantId });
    if (!tradeSpend) return c.json({ success: false, message: 'Trade spend not found' }, 404);

    return c.json({ success: true, data: tradeSpend });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get trade spend', error: error.message }, 500);
  }
});

// Create trade spend
tradeSpendRoutes.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const data = await c.req.json();
    const mongodb = getMongoClient(c);

    const tradeSpendId = await mongodb.insertOne('tradespends', {
      ...data,
      companyId: tenantId,
      createdBy: userId,
      status: 'pending'
    });

    return c.json({ success: true, data: { id: tradeSpendId }, message: 'Trade spend created successfully' }, 201);
  } catch (error) {
    return c.json({ success: false, message: 'Failed to create trade spend', error: error.message }, 500);
  }
});

// Update trade spend
tradeSpendRoutes.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const updates = await c.req.json();
    const mongodb = getMongoClient(c);

    await mongodb.updateOne('tradespends', { _id: { $oid: id }, companyId: tenantId }, updates);

    return c.json({ success: true, message: 'Trade spend updated successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to update trade spend', error: error.message }, 500);
  }
});

// Delete trade spend
tradeSpendRoutes.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    await mongodb.deleteOne('tradespends', { _id: { $oid: id }, companyId: tenantId });

    return c.json({ success: true, message: 'Trade spend deleted successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to delete trade spend', error: error.message }, 500);
  }
});

// Approve trade spend
tradeSpendRoutes.post('/:id/approve', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const mongodb = getMongoClient(c);

    await mongodb.updateOne('tradespends', { _id: { $oid: id }, companyId: tenantId }, {
      status: 'approved',
      approvedBy: userId,
      approvedAt: new Date().toISOString()
    });

    return c.json({ success: true, message: 'Trade spend approved successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to approve trade spend', error: error.message }, 500);
  }
});

// Reject trade spend
tradeSpendRoutes.post('/:id/reject', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const { reason } = await c.req.json();
    const mongodb = getMongoClient(c);

    await mongodb.updateOne('tradespends', { _id: { $oid: id }, companyId: tenantId }, {
      status: 'rejected',
      rejectedBy: userId,
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason
    });

    return c.json({ success: true, message: 'Trade spend rejected successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to reject trade spend', error: error.message }, 500);
  }
});
