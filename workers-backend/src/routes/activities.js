import { Hono } from 'hono';

const activities = new Hono();

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('companyId') || c.req.header('X-Company-Code') || 'default';
};

// Get all activities (activity feed)
activities.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { entity_type, user_id, action, startDate, endDate, limit = 50, offset = 0 } = c.req.query();
    
    let query = `
      SELECT a.*, u.first_name, u.last_name, u.email as user_email
      FROM activities a 
      LEFT JOIN users u ON a.user_id = u.id 
      WHERE a.company_id = ?
    `;
    const params = [companyId];
    
    if (entity_type) {
      query += ' AND a.entity_type = ?';
      params.push(entity_type);
    }
    if (user_id) {
      query += ' AND a.user_id = ?';
      params.push(user_id);
    }
    if (action) {
      query += ' AND a.action = ?';
      params.push(action);
    }
    if (startDate) {
      query += ' AND a.created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND a.created_at <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.prepare(query).bind(...params).all();
    
    // Format activities with user names
    const formattedActivities = (result.results || []).map(activity => ({
      ...activity,
      userName: activity.first_name && activity.last_name 
        ? `${activity.first_name} ${activity.last_name}` 
        : activity.user_email || 'System'
    }));
    
    return c.json({
      success: true,
      data: formattedActivities,
      total: formattedActivities.length
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get recent activities (for dashboard)
activities.get('/recent', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { limit = 10 } = c.req.query();
    
    const result = await db.prepare(`
      SELECT a.*, u.first_name, u.last_name, u.email as user_email
      FROM activities a 
      LEFT JOIN users u ON a.user_id = u.id 
      WHERE a.company_id = ?
      ORDER BY a.created_at DESC 
      LIMIT ?
    `).bind(companyId, parseInt(limit)).all();
    
    const formattedActivities = (result.results || []).map(activity => ({
      ...activity,
      userName: activity.first_name && activity.last_name 
        ? `${activity.first_name} ${activity.last_name}` 
        : activity.user_email || 'System'
    }));
    
    return c.json({
      success: true,
      data: formattedActivities
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get activities by entity
activities.get('/entity/:entityType/:entityId', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { entityType, entityId } = c.req.param();
    
    const result = await db.prepare(`
      SELECT a.*, u.first_name, u.last_name, u.email as user_email
      FROM activities a 
      LEFT JOIN users u ON a.user_id = u.id 
      WHERE a.company_id = ? AND a.entity_type = ? AND a.entity_id = ?
      ORDER BY a.created_at DESC
    `).bind(companyId, entityType, entityId).all();
    
    const formattedActivities = (result.results || []).map(activity => ({
      ...activity,
      userName: activity.first_name && activity.last_name 
        ? `${activity.first_name} ${activity.last_name}` 
        : activity.user_email || 'System'
    }));
    
    return c.json({
      success: true,
      data: formattedActivities
    });
  } catch (error) {
    console.error('Error fetching entity activities:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get activities by user
activities.get('/user/:userId', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { userId } = c.req.param();
    const { limit = 50 } = c.req.query();
    
    const result = await db.prepare(`
      SELECT a.*, u.first_name, u.last_name, u.email as user_email
      FROM activities a 
      LEFT JOIN users u ON a.user_id = u.id 
      WHERE a.company_id = ? AND a.user_id = ?
      ORDER BY a.created_at DESC
      LIMIT ?
    `).bind(companyId, userId, parseInt(limit)).all();
    
    const formattedActivities = (result.results || []).map(activity => ({
      ...activity,
      userName: activity.first_name && activity.last_name 
        ? `${activity.first_name} ${activity.last_name}` 
        : activity.user_email || 'System'
    }));
    
    return c.json({
      success: true,
      data: formattedActivities
    });
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get activity summary/stats
activities.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { days = 30 } = c.req.query();
    
    const cutoffDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString();
    
    const byAction = await db.prepare(`
      SELECT action, COUNT(*) as count
      FROM activities 
      WHERE company_id = ? AND created_at >= ?
      GROUP BY action
      ORDER BY count DESC
    `).bind(companyId, cutoffDate).all();
    
    const byEntityType = await db.prepare(`
      SELECT entity_type, COUNT(*) as count
      FROM activities 
      WHERE company_id = ? AND created_at >= ?
      GROUP BY entity_type
      ORDER BY count DESC
    `).bind(companyId, cutoffDate).all();
    
    const byUser = await db.prepare(`
      SELECT a.user_id, u.first_name, u.last_name, COUNT(*) as count
      FROM activities a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.company_id = ? AND a.created_at >= ?
      GROUP BY a.user_id
      ORDER BY count DESC
      LIMIT 10
    `).bind(companyId, cutoffDate).all();
    
    const dailyTrend = await db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count
      FROM activities 
      WHERE company_id = ? AND created_at >= ?
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).bind(companyId, cutoffDate).all();
    
    return c.json({
      success: true,
      data: {
        byAction: byAction.results || [],
        byEntityType: byEntityType.results || [],
        byUser: (byUser.results || []).map(u => ({
          ...u,
          userName: u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : 'Unknown'
        })),
        dailyTrend: dailyTrend.results || []
      }
    });
  } catch (error) {
    console.error('Error fetching activity summary:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Create activity (log an action)
activities.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = c.get('userId') || body.userId || 'system';
    
    const id = generateId();
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO activities (
        id, company_id, user_id, action, entity_type, entity_id,
        description, data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId, userId,
      body.action || 'unknown',
      body.entityType || body.entity_type || null,
      body.entityId || body.entity_id || null,
      body.description || '',
      JSON.stringify(body.data || {}),
      now
    ).run();
    
    const created = await db.prepare('SELECT * FROM activities WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: created }, 201);
  } catch (error) {
    console.error('Error creating activity:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Bulk create activities
activities.post('/bulk', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = c.get('userId') || 'system';
    const now = new Date().toISOString();
    
    const activitiesData = body.activities || [];
    const created = [];
    
    for (const activity of activitiesData) {
      const id = generateId();
      
      await db.prepare(`
        INSERT INTO activities (
          id, company_id, user_id, action, entity_type, entity_id,
          description, data, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, companyId, activity.userId || userId,
        activity.action || 'unknown',
        activity.entityType || activity.entity_type || null,
        activity.entityId || activity.entity_id || null,
        activity.description || '',
        JSON.stringify(activity.data || {}),
        activity.createdAt || now
      ).run();
      
      created.push({ id, ...activity });
    }
    
    return c.json({ 
      success: true, 
      data: created,
      count: created.length
    }, 201);
  } catch (error) {
    console.error('Error bulk creating activities:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export const activitiesRoutes = activities;
