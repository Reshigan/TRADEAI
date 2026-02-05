import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';

const vendors = new Hono();

// Apply auth middleware to all routes
vendors.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('companyId') || c.get('tenantId') || c.req.header('X-Company-Code') || 'default';
};

// Get all vendors
vendors.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, type, search, limit = 50, offset = 0 } = c.req.query();
    
    let query = 'SELECT * FROM vendors WHERE company_id = ?';
    const params = [companyId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (type) {
      query += ' AND vendor_type = ?';
      params.push(type);
    }
    if (search) {
      query += ' AND (name LIKE ? OR code LIKE ? OR contact_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.prepare(query).bind(...params).all();
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM vendors WHERE company_id = ?';
    const countParams = [companyId];
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    const countResult = await db.prepare(countQuery).bind(...countParams).first();
    
    return c.json({
      success: true,
      data: result.results || [],
      total: countResult?.total || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get vendor options (for dropdowns)
vendors.get('/options', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    
    const result = await db.prepare(`
      SELECT id, name, code, vendor_type FROM vendors 
      WHERE company_id = ? AND status = 'active'
      ORDER BY name ASC
    `).bind(companyId).all();
    
    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    console.error('Error fetching vendor options:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get vendor by ID
vendors.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    
    const result = await db.prepare(`
      SELECT * FROM vendors WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!result) {
      return c.json({ success: false, message: 'Vendor not found' }, 404);
    }
    
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Create vendor
vendors.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    
    const id = generateId();
    const code = body.code || `VND-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO vendors (
        id, company_id, name, code, vendor_type, status,
        contact_name, contact_email, contact_phone,
        address, city, region, country, payment_terms, tax_number,
        bank_details, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId, body.name, code,
      body.vendorType || body.vendor_type || 'supplier',
      body.contactName || body.contact_name || null,
      body.contactEmail || body.contact_email || null,
      body.contactPhone || body.contact_phone || null,
      body.address || null,
      body.city || null,
      body.region || null,
      body.country || 'ZA',
      body.paymentTerms || body.payment_terms || null,
      body.taxNumber || body.tax_number || null,
      JSON.stringify(body.bankDetails || body.bank_details || {}),
      JSON.stringify(body.data || {}),
      now, now
    ).run();
    
    const created = await db.prepare('SELECT * FROM vendors WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: created }, 201);
  } catch (error) {
    console.error('Error creating vendor:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Update vendor
vendors.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    
    const existing = await db.prepare(`
      SELECT * FROM vendors WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!existing) {
      return c.json({ success: false, message: 'Vendor not found' }, 404);
    }
    
    await db.prepare(`
      UPDATE vendors SET
        name = ?, code = ?, vendor_type = ?, status = ?,
        contact_name = ?, contact_email = ?, contact_phone = ?,
        address = ?, city = ?, region = ?, country = ?,
        payment_terms = ?, tax_number = ?, bank_details = ?,
        data = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.name || existing.name,
      body.code || existing.code,
      body.vendorType || body.vendor_type || existing.vendor_type,
      body.status || existing.status,
      body.contactName || body.contact_name || existing.contact_name,
      body.contactEmail || body.contact_email || existing.contact_email,
      body.contactPhone || body.contact_phone || existing.contact_phone,
      body.address || existing.address,
      body.city || existing.city,
      body.region || existing.region,
      body.country || existing.country,
      body.paymentTerms || body.payment_terms || existing.payment_terms,
      body.taxNumber || body.tax_number || existing.tax_number,
      JSON.stringify(body.bankDetails || body.bank_details || {}),
      JSON.stringify(body.data || {}),
      now, id
    ).run();
    
    const updated = await db.prepare('SELECT * FROM vendors WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating vendor:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Delete vendor
vendors.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    
    const existing = await db.prepare(`
      SELECT * FROM vendors WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!existing) {
      return c.json({ success: false, message: 'Vendor not found' }, 404);
    }
    
    await db.prepare('DELETE FROM vendors WHERE id = ?').bind(id).run();
    
    return c.json({ success: true, message: 'Vendor deleted' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Activate vendor
vendors.post('/:id/activate', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE vendors SET status = 'active', updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(now, id, companyId).run();
    
    const updated = await db.prepare('SELECT * FROM vendors WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error activating vendor:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Deactivate vendor
vendors.post('/:id/deactivate', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE vendors SET status = 'inactive', updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(now, id, companyId).run();
    
    const updated = await db.prepare('SELECT * FROM vendors WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error deactivating vendor:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export const vendorsRoutes = vendors;
