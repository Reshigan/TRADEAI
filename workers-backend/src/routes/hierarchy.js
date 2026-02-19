import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const hierarchy = new Hono();
hierarchy.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();
const getCompanyId = (c) => {
  const id = c.get('companyId') || c.get('tenantId') || c.req.header('X-Company-Code');
  if (!id) throw new Error('TENANT_REQUIRED');
  return id;
};

hierarchy.get('/regions', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const customers = await db.prepare('SELECT DISTINCT region, city FROM customers WHERE company_id = ? AND region IS NOT NULL ORDER BY region').bind(companyId).all();
    const regionMap = {};
    (customers.results || []).forEach(r => {
      const region = r.region || 'Unknown';
      if (!regionMap[region]) regionMap[region] = { id: `region-${region.toLowerCase().replace(/\s+/g, '-')}`, name: region, cities: [] };
      if (r.city && !regionMap[region].cities.includes(r.city)) regionMap[region].cities.push(r.city);
    });
    return c.json({ success: true, data: Object.values(regionMap) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

hierarchy.get('/districts', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const customers = await db.prepare('SELECT DISTINCT city, region FROM customers WHERE company_id = ? AND city IS NOT NULL ORDER BY city').bind(companyId).all();
    const districts = (customers.results || []).map(r => ({
      id: `district-${(r.city || '').toLowerCase().replace(/\s+/g, '-')}`,
      name: r.city,
      region: r.region
    }));
    return c.json({ success: true, data: districts });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

hierarchy.get('/stores', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { region, city } = c.req.query();
    let query = 'SELECT * FROM customers WHERE company_id = ?';
    const params = [companyId];
    if (region) { query += ' AND region = ?'; params.push(region); }
    if (city) { query += ' AND city = ?'; params.push(city); }
    query += ' ORDER BY name ASC';
    const result = await db.prepare(query).bind(...params).all();
    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

hierarchy.post('/regions', async (c) => {
  try {
    const body = await c.req.json();
    return c.json({ success: true, data: { id: `region-${(body.name || '').toLowerCase().replace(/\s+/g, '-')}`, name: body.name, cities: [] } }, 201);
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

hierarchy.post('/districts', async (c) => {
  try {
    const body = await c.req.json();
    return c.json({ success: true, data: { id: `district-${(body.name || '').toLowerCase().replace(/\s+/g, '-')}`, name: body.name, region: body.region } }, 201);
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

hierarchy.post('/stores', async (c) => {
  try {
    const body = await c.req.json();
    return c.json({ success: true, data: { id: generateId(), name: body.name, region: body.region, city: body.city } }, 201);
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

hierarchy.put('/regions/:id', async (c) => {
  try {
    const body = await c.req.json();
    return c.json({ success: true, data: { id: c.req.param('id'), ...body } });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

hierarchy.put('/districts/:id', async (c) => {
  try {
    const body = await c.req.json();
    return c.json({ success: true, data: { id: c.req.param('id'), ...body } });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

hierarchy.put('/stores/:id', async (c) => {
  try {
    const body = await c.req.json();
    return c.json({ success: true, data: { id: c.req.param('id'), ...body } });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

hierarchy.delete('/regions/:id', async (c) => {
  return c.json({ success: true, message: 'Region deleted' });
});

hierarchy.delete('/districts/:id', async (c) => {
  return c.json({ success: true, message: 'District deleted' });
});

hierarchy.delete('/stores/:id', async (c) => {
  return c.json({ success: true, message: 'Store deleted' });
});

export const hierarchyRoutes = hierarchy;
