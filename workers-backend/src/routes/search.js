import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const searchRoutes = new Hono();

searchRoutes.use('*', authMiddleware);

const getCompanyId = (c) => c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';

searchRoutes.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { q } = c.req.query();

    if (!q || q.length < 2) {
      return c.json({ success: true, data: { customers: [], products: [], promotions: [] } });
    }

    const term = `%${q}%`;

    const [customerResults, productResults, promotionResults] = await Promise.all([
      db.prepare(
        'SELECT id, name, code, channel FROM customers WHERE company_id = ? AND (name LIKE ? OR code LIKE ?) LIMIT 5'
      ).bind(companyId, term, term).all(),
      db.prepare(
        'SELECT id, name, sku, category FROM products WHERE company_id = ? AND (name LIKE ? OR sku LIKE ?) LIMIT 5'
      ).bind(companyId, term, term).all(),
      db.prepare(
        'SELECT id, name, promotion_type, status FROM promotions WHERE company_id = ? AND name LIKE ? LIMIT 5'
      ).bind(companyId, term).all(),
    ]);

    return c.json({
      success: true,
      data: {
        customers: (customerResults.results || []).map(rowToDocument),
        products: (productResults.results || []).map(rowToDocument),
        promotions: (promotionResults.results || []).map(rowToDocument)
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export { searchRoutes };
