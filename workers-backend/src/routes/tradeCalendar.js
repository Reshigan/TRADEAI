import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const tradeCalendar = new Hono();

tradeCalendar.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
};

const getUserId = (c) => {
  return c.get('userId') || null;
};

// ── GET /  List all calendar events ─────────────────────────────────────
tradeCalendar.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, event_type, customer_id, product_id, promotion_id, channel, region, category, brand, start_date, end_date, priority, limit = 200, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM trade_calendar_events WHERE company_id = ?';
    const params = [companyId];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (event_type) { query += ' AND event_type = ?'; params.push(event_type); }
    if (customer_id) { query += ' AND customer_id = ?'; params.push(customer_id); }
    if (product_id) { query += ' AND product_id = ?'; params.push(product_id); }
    if (promotion_id) { query += ' AND promotion_id = ?'; params.push(promotion_id); }
    if (channel) { query += ' AND channel = ?'; params.push(channel); }
    if (region) { query += ' AND region = ?'; params.push(region); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (brand) { query += ' AND brand = ?'; params.push(brand); }
    if (priority) { query += ' AND priority = ?'; params.push(priority); }
    if (start_date) { query += ' AND end_date >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND start_date <= ?'; params.push(end_date); }

    query += ' ORDER BY start_date ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();

    const countQuery = 'SELECT COUNT(*) as total FROM trade_calendar_events WHERE company_id = ?';
    const countResult = await db.prepare(countQuery).bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /options  Calendar configuration options ────────────────────────
tradeCalendar.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      eventTypes: [
        { value: 'promotion', label: 'Promotion', color: '#7C3AED' },
        { value: 'campaign', label: 'Campaign', color: '#2563EB' },
        { value: 'seasonal', label: 'Seasonal Event', color: '#059669' },
        { value: 'holiday', label: 'Holiday / Public Holiday', color: '#DC2626' },
        { value: 'trade_show', label: 'Trade Show / Expo', color: '#D97706' },
        { value: 'product_launch', label: 'Product Launch', color: '#EC4899' },
        { value: 'price_change', label: 'Price Change', color: '#8B5CF6' },
        { value: 'listing', label: 'New Listing', color: '#14B8A6' },
        { value: 'delisting', label: 'Delisting', color: '#6B7280' },
        { value: 'review', label: 'Business Review', color: '#F59E0B' },
        { value: 'deadline', label: 'Deadline / Cutoff', color: '#EF4444' },
        { value: 'other', label: 'Other', color: '#6B7280' }
      ],
      constraintTypes: [
        { value: 'blackout', label: 'Blackout Period (No Promotions)' },
        { value: 'max_concurrent', label: 'Max Concurrent Promotions' },
        { value: 'max_spend', label: 'Maximum Spend Cap' },
        { value: 'min_gap', label: 'Minimum Gap Between Promotions' },
        { value: 'max_discount', label: 'Maximum Discount Percentage' },
        { value: 'lead_time', label: 'Minimum Lead Time' },
        { value: 'approval_required', label: 'Approval Required' },
        { value: 'channel_exclusion', label: 'Channel Exclusion' },
        { value: 'product_exclusion', label: 'Product Exclusion' }
      ],
      scopes: [
        { value: 'global', label: 'Global (All)' },
        { value: 'customer', label: 'Customer-Specific' },
        { value: 'channel', label: 'Channel-Specific' },
        { value: 'product', label: 'Product-Specific' },
        { value: 'category', label: 'Category-Specific' },
        { value: 'region', label: 'Region-Specific' },
        { value: 'brand', label: 'Brand-Specific' }
      ],
      priorities: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' }
      ],
      violationActions: [
        { value: 'warn', label: 'Warn Only' },
        { value: 'block', label: 'Block / Prevent' },
        { value: 'require_approval', label: 'Require Approval Override' }
      ],
      statuses: [
        { value: 'draft', label: 'Draft' },
        { value: 'planned', label: 'Planned' },
        { value: 'approved', label: 'Approved' },
        { value: 'active', label: 'Active' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
    }
  });
});

// ── GET /summary  Aggregated calendar statistics ────────────────────────
tradeCalendar.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const now = new Date().toISOString().split('T')[0];

    const eventStats = await db.prepare(`
      SELECT
        COUNT(*) as total_events,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_events,
        SUM(CASE WHEN status = 'planned' THEN 1 ELSE 0 END) as planned_events,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_events,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_events,
        SUM(planned_spend) as total_planned_spend,
        SUM(actual_spend) as total_actual_spend,
        SUM(planned_revenue) as total_planned_revenue,
        SUM(actual_revenue) as total_actual_revenue,
        AVG(roi) as avg_roi,
        AVG(lift_pct) as avg_lift
      FROM trade_calendar_events WHERE company_id = ?
    `).bind(companyId).first();

    const upcoming = await db.prepare(`
      SELECT COUNT(*) as count FROM trade_calendar_events
      WHERE company_id = ? AND start_date > ? AND status IN ('planned', 'approved')
    `).bind(companyId, now).first();

    const constraintStats = await db.prepare(`
      SELECT
        COUNT(*) as total_constraints,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_constraints,
        SUM(CASE WHEN constraint_type = 'blackout' THEN 1 ELSE 0 END) as blackout_count,
        SUM(CASE WHEN constraint_type = 'max_concurrent' THEN 1 ELSE 0 END) as max_concurrent_count,
        SUM(CASE WHEN constraint_type = 'max_spend' THEN 1 ELSE 0 END) as max_spend_count
      FROM trade_calendar_constraints WHERE company_id = ?
    `).bind(companyId).first();

    return c.json({
      success: true,
      data: {
        events: {
          total: eventStats?.total_events || 0,
          active: eventStats?.active_events || 0,
          planned: eventStats?.planned_events || 0,
          completed: eventStats?.completed_events || 0,
          draft: eventStats?.draft_events || 0,
          upcoming: upcoming?.count || 0,
          totalPlannedSpend: eventStats?.total_planned_spend || 0,
          totalActualSpend: eventStats?.total_actual_spend || 0,
          totalPlannedRevenue: eventStats?.total_planned_revenue || 0,
          totalActualRevenue: eventStats?.total_actual_revenue || 0,
          avgROI: Math.round((eventStats?.avg_roi || 0) * 100) / 100,
          avgLift: Math.round((eventStats?.avg_lift || 0) * 100) / 100
        },
        constraints: {
          total: constraintStats?.total_constraints || 0,
          active: constraintStats?.active_constraints || 0,
          blackouts: constraintStats?.blackout_count || 0,
          maxConcurrent: constraintStats?.max_concurrent_count || 0,
          maxSpend: constraintStats?.max_spend_count || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching calendar summary:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /check-constraints  Validate an event against constraints ──────
tradeCalendar.post('/check-constraints', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const violations = [];

    const constraints = await db.prepare(
      "SELECT * FROM trade_calendar_constraints WHERE company_id = ? AND status = 'active'"
    ).bind(companyId).all();

    for (const constraint of (constraints.results || [])) {
      // Blackout check
      if (constraint.constraint_type === 'blackout') {
        if (constraint.start_date && constraint.end_date) {
          const eventStart = body.startDate || body.start_date;
          const eventEnd = body.endDate || body.end_date;
          if (eventStart <= constraint.end_date && eventEnd >= constraint.start_date) {
            const scopeMatch = checkScopeMatch(constraint, body);
            if (scopeMatch) {
              violations.push({
                constraintId: constraint.id,
                constraintName: constraint.name,
                type: 'blackout',
                severity: constraint.priority,
                action: constraint.violation_action,
                message: `Event overlaps with blackout period: ${constraint.name} (${constraint.start_date} to ${constraint.end_date})`
              });
            }
          }
        }
      }

      // Max concurrent check
      if (constraint.constraint_type === 'max_concurrent' && constraint.max_concurrent_promotions) {
        const eventStart = body.startDate || body.start_date;
        const eventEnd = body.endDate || body.end_date;
        const concurrent = await db.prepare(`
          SELECT COUNT(*) as count FROM trade_calendar_events
          WHERE company_id = ? AND status IN ('planned', 'approved', 'active')
            AND start_date <= ? AND end_date >= ?
            AND id != ?
        `).bind(companyId, eventEnd, eventStart, body.id || '').first();

        if ((concurrent?.count || 0) >= constraint.max_concurrent_promotions) {
          violations.push({
            constraintId: constraint.id,
            constraintName: constraint.name,
            type: 'max_concurrent',
            severity: constraint.priority,
            action: constraint.violation_action,
            message: `Maximum concurrent promotions exceeded: ${concurrent.count}/${constraint.max_concurrent_promotions}`
          });
        }
      }

      // Max spend check
      if (constraint.constraint_type === 'max_spend' && constraint.max_spend_amount) {
        const plannedSpend = body.plannedSpend || body.planned_spend || 0;
        if (plannedSpend > constraint.max_spend_amount) {
          violations.push({
            constraintId: constraint.id,
            constraintName: constraint.name,
            type: 'max_spend',
            severity: constraint.priority,
            action: constraint.violation_action,
            message: `Planned spend R${plannedSpend.toLocaleString()} exceeds maximum R${constraint.max_spend_amount.toLocaleString()}`
          });
        }
      }

      // Min gap check
      if (constraint.constraint_type === 'min_gap' && constraint.min_gap_days > 0) {
        const eventStart = body.startDate || body.start_date;
        const gapDays = constraint.min_gap_days;
        const gapDate = new Date(new Date(eventStart).getTime() - gapDays * 86400000).toISOString().split('T')[0];

        let gapQuery = `
          SELECT COUNT(*) as count FROM trade_calendar_events
          WHERE company_id = ? AND status IN ('planned', 'approved', 'active', 'completed')
            AND end_date >= ? AND end_date < ?
            AND id != ?
        `;
        const gapParams = [companyId, gapDate, eventStart, body.id || ''];

        if (body.customerId || body.customer_id) {
          gapQuery += ' AND customer_id = ?';
          gapParams.push(body.customerId || body.customer_id);
        }

        const nearby = await db.prepare(gapQuery).bind(...gapParams).first();
        if ((nearby?.count || 0) > 0) {
          violations.push({
            constraintId: constraint.id,
            constraintName: constraint.name,
            type: 'min_gap',
            severity: constraint.priority,
            action: constraint.violation_action,
            message: `Minimum ${gapDays}-day gap between promotions not met`
          });
        }
      }

      // Max discount check
      if (constraint.constraint_type === 'max_discount' && constraint.max_discount_pct) {
        const discount = body.discountPct || body.discount_pct || 0;
        if (discount > constraint.max_discount_pct) {
          violations.push({
            constraintId: constraint.id,
            constraintName: constraint.name,
            type: 'max_discount',
            severity: constraint.priority,
            action: constraint.violation_action,
            message: `Discount ${discount}% exceeds maximum ${constraint.max_discount_pct}%`
          });
        }
      }

      // Lead time check
      if (constraint.constraint_type === 'lead_time' && constraint.min_lead_time_days > 0) {
        const eventStart = body.startDate || body.start_date;
        const today = new Date().toISOString().split('T')[0];
        const diffDays = Math.ceil((new Date(eventStart) - new Date(today)) / 86400000);
        if (diffDays < constraint.min_lead_time_days) {
          violations.push({
            constraintId: constraint.id,
            constraintName: constraint.name,
            type: 'lead_time',
            severity: constraint.priority,
            action: constraint.violation_action,
            message: `Lead time ${diffDays} days is less than required ${constraint.min_lead_time_days} days`
          });
        }
      }
    }

    const hasBlockers = violations.some(v => v.action === 'block');

    return c.json({
      success: true,
      data: {
        valid: violations.length === 0,
        blocked: hasBlockers,
        violations,
        totalViolations: violations.length,
        blockers: violations.filter(v => v.action === 'block').length,
        warnings: violations.filter(v => v.action === 'warn').length
      }
    });
  } catch (error) {
    console.error('Error checking constraints:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

function checkScopeMatch(constraint, event) {
  if (constraint.scope === 'global') return true;
  if (constraint.scope === 'customer' && constraint.customer_id) {
    return (event.customerId || event.customer_id) === constraint.customer_id;
  }
  if (constraint.scope === 'channel' && constraint.channel) {
    return event.channel === constraint.channel;
  }
  if (constraint.scope === 'product' && constraint.product_id) {
    return (event.productId || event.product_id) === constraint.product_id;
  }
  if (constraint.scope === 'category' && constraint.category) {
    return event.category === constraint.category;
  }
  if (constraint.scope === 'region' && constraint.region) {
    return event.region === constraint.region;
  }
  if (constraint.scope === 'brand' && constraint.brand) {
    return event.brand === constraint.brand;
  }
  return true;
}

// ── GET /timeline  Get events in timeline format (grouped by month) ─────
tradeCalendar.get('/timeline', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { year, quarter } = c.req.query();

    let query = 'SELECT * FROM trade_calendar_events WHERE company_id = ?';
    const params = [companyId];

    if (year) {
      query += ' AND (start_date LIKE ? OR end_date LIKE ?)';
      params.push(`${year}%`, `${year}%`);
    }

    if (quarter) {
      const qNum = parseInt(quarter);
      const startMonth = String((qNum - 1) * 3 + 1).padStart(2, '0');
      const endMonth = String(qNum * 3).padStart(2, '0');
      const yr = year || new Date().getFullYear();
      query += ' AND start_date <= ? AND end_date >= ?';
      params.push(`${yr}-${endMonth}-31`, `${yr}-${startMonth}-01`);
    }

    query += ' ORDER BY start_date ASC';
    const result = await db.prepare(query).bind(...params).all();
    const events = (result.results || []).map(rowToDocument);

    const grouped = {};
    for (const ev of events) {
      const monthKey = (ev.startDate || ev.start_date || '').substring(0, 7);
      if (!grouped[monthKey]) grouped[monthKey] = [];
      grouped[monthKey].push(ev);
    }

    return c.json({
      success: true,
      data: {
        events,
        timeline: Object.entries(grouped).map(([month, evts]) => ({
          month,
          label: formatMonth(month),
          count: evts.length,
          totalPlannedSpend: evts.reduce((s, e) => s + (e.plannedSpend || e.planned_spend || 0), 0),
          events: evts
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

function formatMonth(ym) {
  const [y, m] = ym.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m) - 1] || m} ${y}`;
}

// ── GET /:id  Get event by ID ───────────────────────────────────────────
tradeCalendar.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const event = await db.prepare(
      'SELECT * FROM trade_calendar_events WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!event) {
      return c.json({ success: false, message: 'Calendar event not found' }, 404);
    }

    return c.json({ success: true, data: rowToDocument(event) });
  } catch (error) {
    console.error('Error fetching calendar event:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /  Create a new calendar event ─────────────────────────────────
tradeCalendar.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = getUserId(c);
    const id = generateId();
    const now = new Date().toISOString();

    if (!body.name) {
      return c.json({ success: false, message: 'Event name is required' }, 400);
    }
    if (!body.startDate && !body.start_date) {
      return c.json({ success: false, message: 'Start date is required' }, 400);
    }
    if (!body.endDate && !body.end_date) {
      return c.json({ success: false, message: 'End date is required' }, 400);
    }

    await db.prepare(`
      INSERT INTO trade_calendar_events (
        id, company_id, name, description, event_type, status,
        start_date, end_date, all_day, recurrence, color,
        customer_id, customer_name, product_id, product_name,
        promotion_id, budget_id, channel, region, category, brand,
        planned_spend, actual_spend, planned_volume, actual_volume,
        planned_revenue, actual_revenue, roi, lift_pct,
        priority, tags, notes, created_by, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId,
      body.name,
      body.description || null,
      body.eventType || body.event_type || 'promotion',
      body.status || 'draft',
      body.startDate || body.start_date,
      body.endDate || body.end_date,
      body.allDay !== undefined ? (body.allDay ? 1 : 0) : 1,
      body.recurrence || null,
      body.color || '#7C3AED',
      body.customerId || body.customer_id || null,
      body.customerName || body.customer_name || null,
      body.productId || body.product_id || null,
      body.productName || body.product_name || null,
      body.promotionId || body.promotion_id || null,
      body.budgetId || body.budget_id || null,
      body.channel || null,
      body.region || null,
      body.category || null,
      body.brand || null,
      body.plannedSpend || body.planned_spend || 0,
      body.actualSpend || body.actual_spend || 0,
      body.plannedVolume || body.planned_volume || 0,
      body.actualVolume || body.actual_volume || 0,
      body.plannedRevenue || body.planned_revenue || 0,
      body.actualRevenue || body.actual_revenue || 0,
      body.roi || 0,
      body.liftPct || body.lift_pct || 0,
      body.priority || 'medium',
      body.tags ? (Array.isArray(body.tags) ? body.tags.join(',') : body.tags) : null,
      body.notes || null,
      userId,
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM trade_calendar_events WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── PUT /:id  Update a calendar event ───────────────────────────────────
tradeCalendar.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare(
      'SELECT * FROM trade_calendar_events WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'Calendar event not found' }, 404);
    }

    await db.prepare(`
      UPDATE trade_calendar_events SET
        name = ?, description = ?, event_type = ?, status = ?,
        start_date = ?, end_date = ?, all_day = ?, recurrence = ?, color = ?,
        customer_id = ?, customer_name = ?, product_id = ?, product_name = ?,
        promotion_id = ?, budget_id = ?, channel = ?, region = ?, category = ?, brand = ?,
        planned_spend = ?, actual_spend = ?, planned_volume = ?, actual_volume = ?,
        planned_revenue = ?, actual_revenue = ?, roi = ?, lift_pct = ?,
        priority = ?, tags = ?, notes = ?, data = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.name || existing.name,
      body.description ?? existing.description,
      body.eventType || body.event_type || existing.event_type,
      body.status || existing.status,
      body.startDate || body.start_date || existing.start_date,
      body.endDate || body.end_date || existing.end_date,
      body.allDay !== undefined ? (body.allDay ? 1 : 0) : existing.all_day,
      body.recurrence ?? existing.recurrence,
      body.color || existing.color,
      (body.customerId || body.customer_id) ?? existing.customer_id,
      (body.customerName || body.customer_name) ?? existing.customer_name,
      (body.productId || body.product_id) ?? existing.product_id,
      (body.productName || body.product_name) ?? existing.product_name,
      (body.promotionId || body.promotion_id) ?? existing.promotion_id,
      (body.budgetId || body.budget_id) ?? existing.budget_id,
      body.channel ?? existing.channel,
      body.region ?? existing.region,
      body.category ?? existing.category,
      body.brand ?? existing.brand,
      body.plannedSpend ?? body.planned_spend ?? existing.planned_spend,
      body.actualSpend ?? body.actual_spend ?? existing.actual_spend,
      body.plannedVolume ?? body.planned_volume ?? existing.planned_volume,
      body.actualVolume ?? body.actual_volume ?? existing.actual_volume,
      body.plannedRevenue ?? body.planned_revenue ?? existing.planned_revenue,
      body.actualRevenue ?? body.actual_revenue ?? existing.actual_revenue,
      body.roi ?? existing.roi,
      body.liftPct ?? body.lift_pct ?? existing.lift_pct,
      body.priority || existing.priority,
      body.tags ? (Array.isArray(body.tags) ? body.tags.join(',') : body.tags) : existing.tags,
      body.notes ?? existing.notes,
      JSON.stringify(body.data || JSON.parse(existing.data || '{}')),
      now, id
    ).run();

    const updated = await db.prepare('SELECT * FROM trade_calendar_events WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── DELETE /:id  Delete a calendar event ────────────────────────────────
tradeCalendar.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const existing = await db.prepare(
      'SELECT * FROM trade_calendar_events WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'Calendar event not found' }, 404);
    }

    await db.prepare('DELETE FROM trade_calendar_events WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Calendar event deleted' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /:id/sync-promotion  Sync event from a promotion ──────────────
tradeCalendar.post('/:id/sync-promotion', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();

    const event = await db.prepare(
      'SELECT * FROM trade_calendar_events WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!event) {
      return c.json({ success: false, message: 'Calendar event not found' }, 404);
    }

    if (!event.promotion_id) {
      return c.json({ success: false, message: 'Event is not linked to a promotion' }, 400);
    }

    const promotion = await db.prepare(
      'SELECT * FROM promotions WHERE id = ? AND company_id = ?'
    ).bind(event.promotion_id, companyId).first();

    if (!promotion) {
      return c.json({ success: false, message: 'Linked promotion not found' }, 404);
    }

    const spendResult = await db.prepare(
      'SELECT SUM(amount) as total FROM trade_spends WHERE promotion_id = ? AND company_id = ?'
    ).bind(event.promotion_id, companyId).first();

    await db.prepare(`
      UPDATE trade_calendar_events SET
        name = ?, status = ?, start_date = ?, end_date = ?,
        actual_spend = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      promotion.name || event.name,
      promotion.status || event.status,
      promotion.start_date || event.start_date,
      promotion.end_date || event.end_date,
      spendResult?.total || 0,
      now, id
    ).run();

    const updated = await db.prepare('SELECT * FROM trade_calendar_events WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error syncing promotion:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// CONSTRAINTS CRUD
// ═══════════════════════════════════════════════════════════════════════

// ── GET /constraints  List all constraints ──────────────────────────────
tradeCalendar.get('/constraints/list', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, constraint_type, scope, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM trade_calendar_constraints WHERE company_id = ?';
    const params = [companyId];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (constraint_type) { query += ' AND constraint_type = ?'; params.push(constraint_type); }
    if (scope) { query += ' AND scope = ?'; params.push(scope); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();

    const countQuery = 'SELECT COUNT(*) as total FROM trade_calendar_constraints WHERE company_id = ?';
    const countResult = await db.prepare(countQuery).bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0
    });
  } catch (error) {
    console.error('Error fetching constraints:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /constraints/:id  Get constraint by ID ─────────────────────────
tradeCalendar.get('/constraints/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const constraint = await db.prepare(
      'SELECT * FROM trade_calendar_constraints WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!constraint) {
      return c.json({ success: false, message: 'Constraint not found' }, 404);
    }

    return c.json({ success: true, data: rowToDocument(constraint) });
  } catch (error) {
    console.error('Error fetching constraint:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /constraints  Create a new constraint ─────────────────────────
tradeCalendar.post('/constraints', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = getUserId(c);
    const id = generateId();
    const now = new Date().toISOString();

    if (!body.name) {
      return c.json({ success: false, message: 'Constraint name is required' }, 400);
    }

    await db.prepare(`
      INSERT INTO trade_calendar_constraints (
        id, company_id, name, description, constraint_type, status, scope,
        start_date, end_date, day_of_week,
        customer_id, customer_name, product_id, product_name,
        channel, region, category, brand,
        max_concurrent_promotions, max_spend_amount, min_gap_days,
        max_discount_pct, min_lead_time_days, require_approval,
        priority, violation_action, notes, created_by, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId,
      body.name,
      body.description || null,
      body.constraintType || body.constraint_type || 'blackout',
      body.status || 'active',
      body.scope || 'global',
      body.startDate || body.start_date || null,
      body.endDate || body.end_date || null,
      body.dayOfWeek || body.day_of_week || null,
      body.customerId || body.customer_id || null,
      body.customerName || body.customer_name || null,
      body.productId || body.product_id || null,
      body.productName || body.product_name || null,
      body.channel || null,
      body.region || null,
      body.category || null,
      body.brand || null,
      body.maxConcurrentPromotions || body.max_concurrent_promotions || null,
      body.maxSpendAmount || body.max_spend_amount || null,
      body.minGapDays || body.min_gap_days || 0,
      body.maxDiscountPct || body.max_discount_pct || null,
      body.minLeadTimeDays || body.min_lead_time_days || 0,
      body.requireApproval ? 1 : 0,
      body.priority || 'medium',
      body.violationAction || body.violation_action || 'warn',
      body.notes || null,
      userId,
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM trade_calendar_constraints WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    console.error('Error creating constraint:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── PUT /constraints/:id  Update a constraint ──────────────────────────
tradeCalendar.put('/constraints/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare(
      'SELECT * FROM trade_calendar_constraints WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'Constraint not found' }, 404);
    }

    await db.prepare(`
      UPDATE trade_calendar_constraints SET
        name = ?, description = ?, constraint_type = ?, status = ?, scope = ?,
        start_date = ?, end_date = ?, day_of_week = ?,
        customer_id = ?, customer_name = ?, product_id = ?, product_name = ?,
        channel = ?, region = ?, category = ?, brand = ?,
        max_concurrent_promotions = ?, max_spend_amount = ?, min_gap_days = ?,
        max_discount_pct = ?, min_lead_time_days = ?, require_approval = ?,
        priority = ?, violation_action = ?, notes = ?, data = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.name || existing.name,
      body.description ?? existing.description,
      body.constraintType || body.constraint_type || existing.constraint_type,
      body.status || existing.status,
      body.scope || existing.scope,
      (body.startDate || body.start_date) ?? existing.start_date,
      (body.endDate || body.end_date) ?? existing.end_date,
      (body.dayOfWeek || body.day_of_week) ?? existing.day_of_week,
      (body.customerId || body.customer_id) ?? existing.customer_id,
      (body.customerName || body.customer_name) ?? existing.customer_name,
      (body.productId || body.product_id) ?? existing.product_id,
      (body.productName || body.product_name) ?? existing.product_name,
      body.channel ?? existing.channel,
      body.region ?? existing.region,
      body.category ?? existing.category,
      body.brand ?? existing.brand,
      body.maxConcurrentPromotions ?? body.max_concurrent_promotions ?? existing.max_concurrent_promotions,
      body.maxSpendAmount ?? body.max_spend_amount ?? existing.max_spend_amount,
      body.minGapDays ?? body.min_gap_days ?? existing.min_gap_days,
      body.maxDiscountPct ?? body.max_discount_pct ?? existing.max_discount_pct,
      body.minLeadTimeDays ?? body.min_lead_time_days ?? existing.min_lead_time_days,
      body.requireApproval !== undefined ? (body.requireApproval ? 1 : 0) : existing.require_approval,
      body.priority || existing.priority,
      body.violationAction || body.violation_action || existing.violation_action,
      body.notes ?? existing.notes,
      JSON.stringify(body.data || JSON.parse(existing.data || '{}')),
      now, id
    ).run();

    const updated = await db.prepare('SELECT * FROM trade_calendar_constraints WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error updating constraint:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── DELETE /constraints/:id  Delete a constraint ────────────────────────
tradeCalendar.delete('/constraints/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const existing = await db.prepare(
      'SELECT * FROM trade_calendar_constraints WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'Constraint not found' }, 404);
    }

    await db.prepare('DELETE FROM trade_calendar_constraints WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Constraint deleted' });
  } catch (error) {
    console.error('Error deleting constraint:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export const tradeCalendarRoutes = tradeCalendar;
