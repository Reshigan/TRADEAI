import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { apiError } from '../utils/apiError.js';
import { rowToDocument } from '../services/d1.js';

const myWorkRoutes = new Hono();

myWorkRoutes.use('*', authMiddleware);

// Get my filtered view of promotions
myWorkRoutes.get('/promotions', async (c) => {
  try {
    const db = c.env.DB;
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const { status, search } = c.req.query();

    let query = 'SELECT * FROM promotions WHERE company_id = ? AND created_by = ?';
    const params = [tenantId, userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';
    const result = await db.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument)
    });
  } catch (error) {
    return apiError(c, error, 'myWork.promotions');
  }
});

// Get my pending approval queue
myWorkRoutes.get('/approvals', async (c) => {
  try {
    const db = c.env.DB;
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');

    const result = await db.prepare(`
      SELECT a.*, e.name as entity_name 
      FROM approvals a
      JOIN (
        SELECT id, name, 'promotion' as type FROM promotions
        UNION ALL
        SELECT id, name, 'budget' as type FROM budgets
        UNION ALL
        SELECT id, name, 'claim' as type FROM claims
      ) e ON a.entity_id = e.id
      WHERE a.company_id = ? AND a.assigned_to = ? AND a.status = 'pending'
      ORDER BY a.priority ASC, a.due_date ASC
    `).bind(tenantId, userId).all();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument)
    });
  } catch (error) {
    return apiError(c, error, 'myWork.approvals');
  }
});

// Get my assigned customers
myWorkRoutes.get('/customers', async (c) => {
  try {
    const db = c.env.DB;
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');

    const result = await db.prepare(`
      SELECT cu.* 
      FROM customers cu
      JOIN customer_assignments ca ON cu.id = ca.customer_id
      WHERE cu.company_id = ? AND ca.user_id = ?
    `).bind(tenantId, userId).all();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument)
    });
  } catch (error) {
    return apiError(c, error, 'myWork.customers');
  }
});

// Get my claims submissions status
myWorkRoutes.get('/claims', async (c) => {
  try {
    const db = c.env.DB;
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');

    const result = await db.prepare(`
      SELECT * FROM claims 
      WHERE company_id = ? AND created_by = ? 
      ORDER BY created_at DESC
    `).bind(tenantId, userId).all();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument)
    });
  } catch (error) {
    return apiError(c, error, 'myWork.claims');
  }
});

export { myWorkRoutes };
