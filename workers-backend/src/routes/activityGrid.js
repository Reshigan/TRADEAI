import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';

const activityGrid = new Hono();

// Apply auth middleware to all routes
activityGrid.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('companyId') || c.get('tenantId') || c.req.header('X-Company-Code') || 'default';
};

// Get activity grid data (calendar view)
activityGrid.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { view = 'month', startDate, endDate, page = 1, limit = 100 } = c.req.query();
    
    let query = `
      SELECT ag.*, c.name as customer_name, p.name as product_name
      FROM activity_grid ag
      LEFT JOIN customers c ON ag.customer_id = c.id
      LEFT JOIN products p ON ag.product_id = p.id
      WHERE ag.company_id = ?
    `;
    const params = [companyId];
    
    if (startDate) {
      query += ' AND ag.start_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND ag.end_date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY ag.start_date ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const result = await db.prepare(query).bind(...params).all();
    
    // Format activities for calendar view
    const activities = (result.results || []).map(activity => ({
      id: activity.id,
      title: activity.title || activity.activity_name,
      activityName: activity.activity_name,
      activityType: activity.activity_type,
      status: activity.status,
      startDate: activity.start_date,
      endDate: activity.end_date,
      customerId: activity.customer_id,
      customerName: activity.customer_name,
      productId: activity.product_id,
      productName: activity.product_name,
      budget: {
        allocated: activity.budget_allocated || 0,
        spent: activity.budget_spent || 0
      },
      performance: activity.performance,
      notes: activity.notes,
      createdAt: activity.created_at,
      updatedAt: activity.updated_at
    }));
    
    return c.json({
      success: true,
      data: {
        activities,
        view,
        startDate,
        endDate,
        total: activities.length
      }
    });
  } catch (error) {
    console.error('Error fetching activity grid:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get heat map data
activityGrid.get('/heat-map', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { year, month, groupBy = 'customer' } = c.req.query();
    
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;
    
    // Get activity counts grouped by date
    const result = await db.prepare(`
      SELECT 
        date(start_date) as date,
        COUNT(*) as activity_count,
        SUM(budget_allocated) as total_budget,
        ${groupBy === 'customer' ? 'customer_id' : groupBy === 'product' ? 'product_id' : 'vendor_id'} as group_id
      FROM activity_grid
      WHERE company_id = ?
        AND strftime('%Y', start_date) = ?
        AND strftime('%m', start_date) = ?
      GROUP BY date(start_date), ${groupBy === 'customer' ? 'customer_id' : groupBy === 'product' ? 'product_id' : 'vendor_id'}
      ORDER BY date ASC
    `).bind(companyId, String(currentYear), String(currentMonth).padStart(2, '0')).all();
    
    return c.json({
      success: true,
      data: {
        heatMap: result.results || [],
        year: currentYear,
        month: currentMonth,
        groupBy
      }
    });
  } catch (error) {
    console.error('Error fetching heat map:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get conflicts (overlapping activities)
activityGrid.get('/conflicts', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { startDate, endDate, severity } = c.req.query();
    
    // Find overlapping activities for the same customer
    let query = `
      SELECT 
        a1.id as activity1_id,
        a1.activity_name as activity1_name,
        a1.activity_type as activity1_type,
        a1.start_date as activity1_start,
        a1.end_date as activity1_end,
        a1.customer_id,
        a2.id as activity2_id,
        a2.activity_name as activity2_name,
        a2.activity_type as activity2_type,
        a2.start_date as activity2_start,
        a2.end_date as activity2_end
      FROM activity_grid a1
      JOIN activity_grid a2 ON a1.customer_id = a2.customer_id 
        AND a1.id < a2.id
        AND a1.start_date <= a2.end_date 
        AND a1.end_date >= a2.start_date
      WHERE a1.company_id = ?
    `;
    const params = [companyId];
    
    if (startDate) {
      query += ' AND a1.start_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND a1.end_date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY a1.start_date ASC LIMIT 50';
    
    const result = await db.prepare(query).bind(...params).all();
    
    // Format conflicts
    const conflicts = (result.results || []).map(row => ({
      activity: {
        id: row.activity1_id,
        type: row.activity1_type,
        name: row.activity1_name,
        customer: row.customer_id,
        date: row.activity1_start
      },
      conflicts: [{
        conflictingActivity: {
          id: row.activity2_id,
          type: row.activity2_type,
          name: row.activity2_name,
          startDate: row.activity2_start,
          endDate: row.activity2_end
        },
        severity: 'medium',
        reason: 'Overlapping dates for same customer'
      }]
    }));
    
    return c.json({
      success: true,
      data: conflicts
    });
  } catch (error) {
    console.error('Error fetching conflicts:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Create activity
activityGrid.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = c.get('userId') || 'system';
    
    const id = generateId();
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO activity_grid (
        id, company_id, activity_name, activity_type, status,
        start_date, end_date, customer_id, product_id, vendor_id,
        budget_allocated, budget_spent, performance, notes,
        created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId,
      body.activityName || body.activity_name || body.title,
      body.activityType || body.activity_type || 'Promotion',
      body.status || 'Planned',
      body.startDate || body.start_date,
      body.endDate || body.end_date,
      body.customerId || body.customer_id || null,
      body.productId || body.product_id || null,
      body.vendorId || body.vendor_id || null,
      body.budget?.allocated || body.budgetAllocated || body.budget_allocated || 0,
      body.budget?.spent || body.budgetSpent || body.budget_spent || 0,
      body.performance || null,
      body.notes || '',
      userId, now, now
    ).run();
    
    const created = await db.prepare('SELECT * FROM activity_grid WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: created }, 201);
  } catch (error) {
    console.error('Error creating activity:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get single activity
activityGrid.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    
    const activity = await db.prepare(`
      SELECT ag.*, c.name as customer_name, p.name as product_name
      FROM activity_grid ag
      LEFT JOIN customers c ON ag.customer_id = c.id
      LEFT JOIN products p ON ag.product_id = p.id
      WHERE ag.id = ? AND ag.company_id = ?
    `).bind(id, companyId).first();
    
    if (!activity) {
      return c.json({ success: false, message: 'Activity not found' }, 404);
    }
    
    return c.json({ success: true, data: activity });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Update activity
activityGrid.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    
    // Check if activity exists
    const existing = await db.prepare(
      'SELECT id FROM activity_grid WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();
    
    if (!existing) {
      return c.json({ success: false, message: 'Activity not found' }, 404);
    }
    
    await db.prepare(`
      UPDATE activity_grid SET
        activity_name = COALESCE(?, activity_name),
        activity_type = COALESCE(?, activity_type),
        status = COALESCE(?, status),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        customer_id = COALESCE(?, customer_id),
        product_id = COALESCE(?, product_id),
        vendor_id = COALESCE(?, vendor_id),
        budget_allocated = COALESCE(?, budget_allocated),
        budget_spent = COALESCE(?, budget_spent),
        performance = COALESCE(?, performance),
        notes = COALESCE(?, notes),
        updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(
      body.activityName || body.activity_name || body.title || null,
      body.activityType || body.activity_type || null,
      body.status || null,
      body.startDate || body.start_date || null,
      body.endDate || body.end_date || null,
      body.customerId || body.customer_id || null,
      body.productId || body.product_id || null,
      body.vendorId || body.vendor_id || null,
      body.budget?.allocated || body.budgetAllocated || body.budget_allocated || null,
      body.budget?.spent || body.budgetSpent || body.budget_spent || null,
      body.performance || null,
      body.notes || null,
      now, id, companyId
    ).run();
    
    const updated = await db.prepare('SELECT * FROM activity_grid WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating activity:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Delete activity
activityGrid.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    
    const existing = await db.prepare(
      'SELECT id FROM activity_grid WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();
    
    if (!existing) {
      return c.json({ success: false, message: 'Activity not found' }, 404);
    }
    
    await db.prepare('DELETE FROM activity_grid WHERE id = ? AND company_id = ?')
      .bind(id, companyId).run();
    
    return c.json({ success: true, message: 'Activity deleted' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Sync activities from other modules (promotions, trade spends, campaigns)
activityGrid.post('/sync', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const { source = 'all', startDate, endDate } = body;
    const userId = c.get('userId') || 'system';
    const now = new Date().toISOString();
    
    let synced = 0;
    
    // Sync from promotions
    if (source === 'promotions' || source === 'all') {
      let promoQuery = `
        SELECT id, name, status, start_date, end_date, customer_id, product_id, budget
        FROM promotions WHERE company_id = ?
      `;
      const promoParams = [companyId];
      
      if (startDate) {
        promoQuery += ' AND start_date >= ?';
        promoParams.push(startDate);
      }
      if (endDate) {
        promoQuery += ' AND end_date <= ?';
        promoParams.push(endDate);
      }
      
      const promotions = await db.prepare(promoQuery).bind(...promoParams).all();
      
      for (const promo of (promotions.results || [])) {
        const existingId = `promo-${promo.id}`;
        const existing = await db.prepare(
          'SELECT id FROM activity_grid WHERE id = ?'
        ).bind(existingId).first();
        
        if (!existing) {
          await db.prepare(`
            INSERT INTO activity_grid (
              id, company_id, activity_name, activity_type, status,
              start_date, end_date, customer_id, product_id,
              budget_allocated, source_type, source_id,
              created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            existingId, companyId, promo.name, 'Promotion', promo.status,
            promo.start_date, promo.end_date, promo.customer_id, promo.product_id,
            promo.budget || 0, 'promotion', promo.id,
            userId, now, now
          ).run();
          synced++;
        }
      }
    }
    
    // Sync from trade spends
    if (source === 'tradespends' || source === 'all') {
      let tsQuery = `
        SELECT id, name, status, start_date, end_date, customer_id, product_id, amount
        FROM trade_spends WHERE company_id = ?
      `;
      const tsParams = [companyId];
      
      if (startDate) {
        tsQuery += ' AND start_date >= ?';
        tsParams.push(startDate);
      }
      if (endDate) {
        tsQuery += ' AND end_date <= ?';
        tsParams.push(endDate);
      }
      
      const tradeSpends = await db.prepare(tsQuery).bind(...tsParams).all();
      
      for (const ts of (tradeSpends.results || [])) {
        const existingId = `ts-${ts.id}`;
        const existing = await db.prepare(
          'SELECT id FROM activity_grid WHERE id = ?'
        ).bind(existingId).first();
        
        if (!existing) {
          await db.prepare(`
            INSERT INTO activity_grid (
              id, company_id, activity_name, activity_type, status,
              start_date, end_date, customer_id, product_id,
              budget_allocated, source_type, source_id,
              created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            existingId, companyId, ts.name, 'Trade Spend', ts.status,
            ts.start_date, ts.end_date, ts.customer_id, ts.product_id,
            ts.amount || 0, 'trade_spend', ts.id,
            userId, now, now
          ).run();
          synced++;
        }
      }
    }
    
    // Sync from campaigns
    if (source === 'campaigns' || source === 'all') {
      let campQuery = `
        SELECT id, name, status, start_date, end_date, budget
        FROM campaigns WHERE company_id = ?
      `;
      const campParams = [companyId];
      
      if (startDate) {
        campQuery += ' AND start_date >= ?';
        campParams.push(startDate);
      }
      if (endDate) {
        campQuery += ' AND end_date <= ?';
        campParams.push(endDate);
      }
      
      const campaigns = await db.prepare(campQuery).bind(...campParams).all();
      
      for (const camp of (campaigns.results || [])) {
        const existingId = `camp-${camp.id}`;
        const existing = await db.prepare(
          'SELECT id FROM activity_grid WHERE id = ?'
        ).bind(existingId).first();
        
        if (!existing) {
          await db.prepare(`
            INSERT INTO activity_grid (
              id, company_id, activity_name, activity_type, status,
              start_date, end_date, budget_allocated, source_type, source_id,
              created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            existingId, companyId, camp.name, 'Campaign', camp.status,
            camp.start_date, camp.end_date, camp.budget || 0, 'campaign', camp.id,
            userId, now, now
          ).run();
          synced++;
        }
      }
    }
    
    return c.json({
      success: true,
      message: `Synced ${synced} activities from ${source}`,
      data: { synced, source }
    });
  } catch (error) {
    console.error('Error syncing activities:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export const activityGridRoutes = activityGrid;
