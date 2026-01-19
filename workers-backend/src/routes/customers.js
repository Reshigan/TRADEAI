import { Hono } from 'hono';
import { getMongoClient } from '../services/d1.js';
import { authMiddleware } from '../middleware/auth.js';

export const customerRoutes = new Hono();

customerRoutes.use('*', authMiddleware);

// Get all customers
customerRoutes.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const { page = 1, limit = 20, search, status, tier } = c.req.query();

    const filter = { companyId: tenantId };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) filter.status = status;
    if (tier) filter.tier = tier;

    const customers = await mongodb.find('customers', filter, {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
      sort: { name: 1 }
    });

    // Enrich customers with contactName extracted from various possible locations
    // Note: D1 service's rowToDocument already merges JSON data column into the document at top level
    const enrichedCustomers = customers.map(customer => {
      let contactName = null;
      let contactEmail = null;
      let contactPhone = null;
      
      // First check if contactName is already at top level (merged from JSON data column by D1 service)
      if (customer.contactName) {
        contactName = customer.contactName;
        contactEmail = customer.contactEmail || null;
        contactPhone = customer.contactPhone || null;
      }
      // Fallback: Try to extract from nested data structure if it wasn't merged
      else if (customer.data) {
        const data = typeof customer.data === 'string' ? JSON.parse(customer.data) : customer.data;
        // Check for contactName directly
        if (data.contactName) {
          contactName = data.contactName;
          contactEmail = data.contactEmail || null;
          contactPhone = data.contactPhone || null;
        }
        // Check for contacts array
        else if (data.contacts && data.contacts.length > 0 && data.contacts[0].name) {
          contactName = data.contacts[0].name;
          contactEmail = data.contacts[0].email || null;
          contactPhone = data.contacts[0].phone || null;
        }
      }
      
      return {
        ...customer,
        contactName,
        contactEmail,
        contactPhone
      };
    });

    const total = await mongodb.countDocuments('customers', filter);

    return c.json({
      success: true,
      data: enrichedCustomers,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get customers', error: error.message }, 500);
  }
});

// Get customer by ID
customerRoutes.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const customer = await mongodb.findOne('customers', { _id: { $oid: id }, companyId: tenantId });
    if (!customer) return c.json({ success: false, message: 'Customer not found' }, 404);

    return c.json({ success: true, data: customer });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get customer', error: error.message }, 500);
  }
});

// Create customer
customerRoutes.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const data = await c.req.json();
    const mongodb = getMongoClient(c);

    const customerId = await mongodb.insertOne('customers', { ...data, companyId: tenantId, status: 'active' });

    return c.json({ success: true, data: { id: customerId }, message: 'Customer created successfully' }, 201);
  } catch (error) {
    return c.json({ success: false, message: 'Failed to create customer', error: error.message }, 500);
  }
});

// Update customer
customerRoutes.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const updates = await c.req.json();
    const mongodb = getMongoClient(c);

    await mongodb.updateOne('customers', { _id: { $oid: id }, companyId: tenantId }, updates);

    return c.json({ success: true, message: 'Customer updated successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to update customer', error: error.message }, 500);
  }
});

// Delete customer
customerRoutes.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    await mongodb.deleteOne('customers', { _id: { $oid: id }, companyId: tenantId });

    return c.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to delete customer', error: error.message }, 500);
  }
});
