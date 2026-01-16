import { Hono } from 'hono';
import { getMongoClient } from '../services/d1.js';
import { authMiddleware } from '../middleware/auth.js';

export const productRoutes = new Hono();

productRoutes.use('*', authMiddleware);

// Get all products
productRoutes.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const { page = 1, limit = 20, search, category, brand } = c.req.query();

    const filter = { companyId: tenantId };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) filter.category = category;
    if (brand) filter.brand = brand;

    const products = await mongodb.find('products', filter, {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
      sort: { name: 1 }
    });

    const total = await mongodb.countDocuments('products', filter);

    return c.json({
      success: true,
      data: products,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get products', error: error.message }, 500);
  }
});

// Get product by ID
productRoutes.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const product = await mongodb.findOne('products', { _id: { $oid: id }, companyId: tenantId });
    if (!product) return c.json({ success: false, message: 'Product not found' }, 404);

    return c.json({ success: true, data: product });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get product', error: error.message }, 500);
  }
});

// Create product
productRoutes.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const data = await c.req.json();
    const mongodb = getMongoClient(c);

    const productId = await mongodb.insertOne('products', { ...data, companyId: tenantId, status: 'active' });

    return c.json({ success: true, data: { id: productId }, message: 'Product created successfully' }, 201);
  } catch (error) {
    return c.json({ success: false, message: 'Failed to create product', error: error.message }, 500);
  }
});

// Update product
productRoutes.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const updates = await c.req.json();
    const mongodb = getMongoClient(c);

    await mongodb.updateOne('products', { _id: { $oid: id }, companyId: tenantId }, updates);

    return c.json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to update product', error: error.message }, 500);
  }
});

// Delete product
productRoutes.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    await mongodb.deleteOne('products', { _id: { $oid: id }, companyId: tenantId });

    return c.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to delete product', error: error.message }, 500);
  }
});
