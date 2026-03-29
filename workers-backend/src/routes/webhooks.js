import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { apiError } from '../utils/apiError.js';

const webhooks = new Hono();
webhooks.use('*', authMiddleware);

const getCompanyId = (c) => {
  const id = c.get('companyId') || c.get('tenantId') || c.req.header('X-Company-Code');
  if (!id) throw new Error('TENANT_REQUIRED');
  return id;
};

// List webhooks
webhooks.get('/', async (c) => {
  try {
    const companyId = getCompanyId(c);
    const db = c.env.DB;
    const results = await db.prepare(
      'SELECT * FROM webhooks WHERE company_id = ? ORDER BY created_at DESC'
    ).bind(companyId).all().catch(() => ({ results: [] }));
    return c.json({ success: true, data: results.results || [] });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return apiError(c, error, 'webhooks');
  }
});

// Create webhook
webhooks.post('/', async (c) => {
  try {
    const companyId = getCompanyId(c);
    const db = c.env.DB;
    const body = await c.req.json();
    if (!body.url) return c.json({ success: false, message: 'url is required' }, 400);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.prepare(
      'INSERT INTO webhooks (id, company_id, name, url, events, status, secret, headers, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id, companyId, body.name || 'Webhook', body.url,
      JSON.stringify(body.events || []), 'active',
      body.secret || crypto.randomUUID(),
      JSON.stringify(body.headers || {}), now, now
    ).run().catch(() => {});
    return c.json({
      success: true,
      data: {
        id, name: body.name || 'Webhook', url: body.url,
        events: body.events || [], status: 'active',
        created_at: now
      }
    }, 201);
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return apiError(c, error, 'webhooks');
  }
});

// Update webhook
webhooks.put('/:id', async (c) => {
  try {
    const companyId = getCompanyId(c);
    const db = c.env.DB;
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    await db.prepare(
      'UPDATE webhooks SET name = COALESCE(?, name), url = COALESCE(?, url), events = COALESCE(?, events), status = COALESCE(?, status), updated_at = ? WHERE id = ? AND company_id = ?'
    ).bind(
      body.name || null, body.url || null,
      body.events ? JSON.stringify(body.events) : null,
      body.status || null, now, id, companyId
    ).run().catch(() => {});
    const updated = await db.prepare('SELECT * FROM webhooks WHERE id = ? AND company_id = ?').bind(id, companyId).first().catch(() => null);
    if (!updated) return c.json({ success: false, message: 'Webhook not found' }, 404);
    return c.json({ success: true, data: updated });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return apiError(c, error, 'webhooks');
  }
});

// Delete webhook
webhooks.delete('/:id', async (c) => {
  try {
    const companyId = getCompanyId(c);
    const db = c.env.DB;
    const { id } = c.req.param();
    await db.prepare('DELETE FROM webhooks WHERE id = ? AND company_id = ?').bind(id, companyId).run().catch(() => {});
    return c.json({ success: true, message: 'Webhook deleted' });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return apiError(c, error, 'webhooks');
  }
});

// Test webhook
webhooks.post('/:id/test', async (c) => {
  try {
    const companyId = getCompanyId(c);
    const db = c.env.DB;
    const { id } = c.req.param();
    const webhook = await db.prepare('SELECT * FROM webhooks WHERE id = ? AND company_id = ?').bind(id, companyId).first().catch(() => null);
    if (!webhook) return c.json({ success: false, message: 'Webhook not found' }, 404);

    // Send test payload to webhook URL
    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: { message: 'This is a test webhook delivery from TradeAI' }
    };
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Webhook-Secret': webhook.secret || '' },
        body: JSON.stringify(testPayload)
      });
      return c.json({
        success: true,
        data: {
          delivered: response.ok,
          statusCode: response.status,
          message: response.ok ? 'Test webhook delivered successfully' : `Webhook returned ${response.status}`
        }
      });
    } catch (fetchError) {
      return c.json({
        success: true,
        data: {
          delivered: false,
          statusCode: 0,
          message: `Failed to reach webhook URL: ${fetchError.message}`
        }
      });
    }
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return apiError(c, error, 'webhooks');
  }
});

export const webhookRoutes = webhooks;
