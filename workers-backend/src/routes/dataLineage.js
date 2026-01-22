import { Hono } from 'hono';

const dataLineage = new Hono();

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('companyId') || c.req.header('X-Company-Code') || 'default';
};

// Get data lineage records
dataLineage.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { entity_type, entity_id, change_type, startDate, endDate, limit = 100, offset = 0 } = c.req.query();
    
    let query = `
      SELECT dl.*, u.first_name, u.last_name, u.email as user_email
      FROM data_lineage dl 
      LEFT JOIN users u ON dl.changed_by = u.id 
      WHERE dl.company_id = ?
    `;
    const params = [companyId];
    
    if (entity_type) {
      query += ' AND dl.entity_type = ?';
      params.push(entity_type);
    }
    if (entity_id) {
      query += ' AND dl.entity_id = ?';
      params.push(entity_id);
    }
    if (change_type) {
      query += ' AND dl.change_type = ?';
      params.push(change_type);
    }
    if (startDate) {
      query += ' AND dl.changed_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND dl.changed_at <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY dl.changed_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.prepare(query).bind(...params).all();
    
    const formattedRecords = (result.results || []).map(record => ({
      ...record,
      changedByName: record.first_name && record.last_name 
        ? `${record.first_name} ${record.last_name}` 
        : record.user_email || 'System'
    }));
    
    return c.json({
      success: true,
      data: formattedRecords,
      total: formattedRecords.length
    });
  } catch (error) {
    console.error('Error fetching data lineage:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get lineage for specific entity
dataLineage.get('/entity/:entityType/:entityId', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { entityType, entityId } = c.req.param();
    
    const result = await db.prepare(`
      SELECT dl.*, u.first_name, u.last_name, u.email as user_email
      FROM data_lineage dl 
      LEFT JOIN users u ON dl.changed_by = u.id 
      WHERE dl.company_id = ? AND dl.entity_type = ? AND dl.entity_id = ?
      ORDER BY dl.changed_at DESC
    `).bind(companyId, entityType, entityId).all();
    
    const formattedRecords = (result.results || []).map(record => ({
      ...record,
      changedByName: record.first_name && record.last_name 
        ? `${record.first_name} ${record.last_name}` 
        : record.user_email || 'System'
    }));
    
    return c.json({
      success: true,
      data: formattedRecords
    });
  } catch (error) {
    console.error('Error fetching entity lineage:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get lineage summary/stats
dataLineage.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { days = 30 } = c.req.query();
    
    const cutoffDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString();
    
    const byEntityType = await db.prepare(`
      SELECT entity_type, COUNT(*) as count
      FROM data_lineage 
      WHERE company_id = ? AND changed_at >= ?
      GROUP BY entity_type
      ORDER BY count DESC
    `).bind(companyId, cutoffDate).all();
    
    const byChangeType = await db.prepare(`
      SELECT change_type, COUNT(*) as count
      FROM data_lineage 
      WHERE company_id = ? AND changed_at >= ?
      GROUP BY change_type
      ORDER BY count DESC
    `).bind(companyId, cutoffDate).all();
    
    const bySource = await db.prepare(`
      SELECT source, COUNT(*) as count
      FROM data_lineage 
      WHERE company_id = ? AND changed_at >= ?
      GROUP BY source
      ORDER BY count DESC
    `).bind(companyId, cutoffDate).all();
    
    const dailyTrend = await db.prepare(`
      SELECT date(changed_at) as date, COUNT(*) as count
      FROM data_lineage 
      WHERE company_id = ? AND changed_at >= ?
      GROUP BY date(changed_at)
      ORDER BY date ASC
    `).bind(companyId, cutoffDate).all();
    
    return c.json({
      success: true,
      data: {
        byEntityType: byEntityType.results || [],
        byChangeType: byChangeType.results || [],
        bySource: bySource.results || [],
        dailyTrend: dailyTrend.results || []
      }
    });
  } catch (error) {
    console.error('Error fetching lineage summary:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Record data lineage (create audit trail entry)
dataLineage.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = c.get('userId') || body.changedBy || 'system';
    
    const id = generateId();
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO data_lineage (
        id, company_id, entity_type, entity_id, field_name,
        old_value, new_value, change_type, source, source_details,
        changed_by, changed_at, data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId,
      body.entityType || body.entity_type,
      body.entityId || body.entity_id,
      body.fieldName || body.field_name || null,
      body.oldValue || body.old_value || null,
      body.newValue || body.new_value || null,
      body.changeType || body.change_type || 'update',
      body.source || 'manual',
      JSON.stringify(body.sourceDetails || body.source_details || {}),
      userId, now,
      JSON.stringify(body.data || {})
    ).run();
    
    const created = await db.prepare('SELECT * FROM data_lineage WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: created }, 201);
  } catch (error) {
    console.error('Error recording lineage:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Bulk record lineage
dataLineage.post('/bulk', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = c.get('userId') || 'system';
    const now = new Date().toISOString();
    
    const records = body.records || [];
    const created = [];
    
    for (const record of records) {
      const id = generateId();
      
      await db.prepare(`
        INSERT INTO data_lineage (
          id, company_id, entity_type, entity_id, field_name,
          old_value, new_value, change_type, source, source_details,
          changed_by, changed_at, data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, companyId,
        record.entityType || record.entity_type,
        record.entityId || record.entity_id,
        record.fieldName || record.field_name || null,
        record.oldValue || record.old_value || null,
        record.newValue || record.new_value || null,
        record.changeType || record.change_type || 'update',
        record.source || 'manual',
        JSON.stringify(record.sourceDetails || record.source_details || {}),
        record.changedBy || userId,
        record.changedAt || now,
        JSON.stringify(record.data || {})
      ).run();
      
      created.push({ id, ...record });
    }
    
    return c.json({ 
      success: true, 
      data: created,
      count: created.length
    }, 201);
  } catch (error) {
    console.error('Error bulk recording lineage:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get baseline configurations
dataLineage.get('/baselines', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    
    // Get baseline configs from company settings or return defaults
    const company = await db.prepare(`
      SELECT settings FROM companies WHERE id = ?
    `).bind(companyId).first();
    
    let baselines = {
      promotionBaseline: {
        method: 'historical_average',
        lookbackPeriods: 12,
        excludeOutliers: true,
        outlierThreshold: 2.5
      },
      budgetBaseline: {
        method: 'previous_year',
        growthRate: 0.05,
        adjustForInflation: true
      },
      forecastBaseline: {
        method: 'weighted_moving_average',
        weights: [0.5, 0.3, 0.2],
        seasonalityAdjustment: true
      }
    };
    
    if (company?.settings) {
      try {
        const settings = JSON.parse(company.settings);
        if (settings.baselines) {
          baselines = { ...baselines, ...settings.baselines };
        }
      } catch (e) {}
    }
    
    return c.json({
      success: true,
      data: baselines
    });
  } catch (error) {
    console.error('Error fetching baselines:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Update baseline configuration
dataLineage.put('/baselines', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const now = new Date().toISOString();
    
    // Get current settings
    const company = await db.prepare(`
      SELECT settings FROM companies WHERE id = ?
    `).bind(companyId).first();
    
    let settings = {};
    if (company?.settings) {
      try {
        settings = JSON.parse(company.settings);
      } catch (e) {}
    }
    
    settings.baselines = body;
    
    await db.prepare(`
      UPDATE companies SET settings = ?, updated_at = ? WHERE id = ?
    `).bind(JSON.stringify(settings), now, companyId).run();
    
    return c.json({
      success: true,
      data: body
    });
  } catch (error) {
    console.error('Error updating baselines:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get variance analysis
dataLineage.get('/variance/:entityType', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { entityType } = c.req.param();
    const { period, startDate, endDate } = c.req.query();
    
    let varianceData = [];
    
    if (entityType === 'budget') {
      const result = await db.prepare(`
        SELECT 
          id, name, amount as planned, utilized as actual,
          (utilized - amount) as variance,
          CASE WHEN amount > 0 THEN ((utilized - amount) / amount * 100) ELSE 0 END as variance_percent
        FROM budgets 
        WHERE company_id = ?
        ORDER BY variance_percent DESC
      `).bind(companyId).all();
      varianceData = result.results || [];
    } else if (entityType === 'promotion') {
      const result = await db.prepare(`
        SELECT 
          id, name, 
          json_extract(data, '$.financial.plannedSpend') as planned,
          json_extract(data, '$.financial.actualSpend') as actual,
          (json_extract(data, '$.financial.actualSpend') - json_extract(data, '$.financial.plannedSpend')) as variance
        FROM promotions 
        WHERE company_id = ?
      `).bind(companyId).all();
      varianceData = result.results || [];
    } else if (entityType === 'campaign') {
      const result = await db.prepare(`
        SELECT 
          id, name, 
          budget_amount as planned, spent_amount as actual,
          (spent_amount - budget_amount) as variance,
          CASE WHEN budget_amount > 0 THEN ((spent_amount - budget_amount) / budget_amount * 100) ELSE 0 END as variance_percent
        FROM campaigns 
        WHERE company_id = ?
        ORDER BY variance_percent DESC
      `).bind(companyId).all();
      varianceData = result.results || [];
    }
    
    // Calculate summary stats
    const totalPlanned = varianceData.reduce((sum, item) => sum + (parseFloat(item.planned) || 0), 0);
    const totalActual = varianceData.reduce((sum, item) => sum + (parseFloat(item.actual) || 0), 0);
    const totalVariance = totalActual - totalPlanned;
    const variancePercent = totalPlanned > 0 ? (totalVariance / totalPlanned * 100) : 0;
    
    return c.json({
      success: true,
      data: {
        entityType,
        items: varianceData,
        summary: {
          totalPlanned,
          totalActual,
          totalVariance,
          variancePercent: Math.round(variancePercent * 100) / 100,
          itemCount: varianceData.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching variance:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get reconciliation status
dataLineage.get('/reconciliation', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    
    // Get claims vs deductions reconciliation
    const claimsSummary = await db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(claimed_amount) as total_claimed,
        SUM(approved_amount) as total_approved,
        SUM(settled_amount) as total_settled,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'settled' THEN 1 END) as settled
      FROM claims WHERE company_id = ?
    `).bind(companyId).first();
    
    const deductionsSummary = await db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(deduction_amount) as total_amount,
        SUM(matched_amount) as total_matched,
        SUM(remaining_amount) as total_remaining,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open,
        COUNT(CASE WHEN status = 'matched' THEN 1 END) as matched
      FROM deductions WHERE company_id = ?
    `).bind(companyId).first();
    
    // Get budget utilization
    const budgetSummary = await db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(amount) as total_budget,
        SUM(utilized) as total_utilized,
        SUM(amount - utilized) as total_remaining
      FROM budgets WHERE company_id = ? AND status = 'active'
    `).bind(companyId).first();
    
    // Get rebate accruals
    const rebateSummary = await db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(accrued_amount) as total_accrued,
        SUM(settled_amount) as total_settled,
        SUM(accrued_amount - settled_amount) as outstanding
      FROM rebates WHERE company_id = ?
    `).bind(companyId).first();
    
    return c.json({
      success: true,
      data: {
        claims: claimsSummary || {},
        deductions: deductionsSummary || {},
        budgets: budgetSummary || {},
        rebates: rebateSummary || {},
        reconciliationStatus: {
          claimsVsDeductions: {
            claimsTotal: claimsSummary?.total_claimed || 0,
            deductionsTotal: deductionsSummary?.total_amount || 0,
            difference: (claimsSummary?.total_claimed || 0) - (deductionsSummary?.total_amount || 0),
            matchRate: deductionsSummary?.total_amount > 0 
              ? ((deductionsSummary?.total_matched || 0) / deductionsSummary?.total_amount * 100) 
              : 0
          },
          budgetUtilization: budgetSummary?.total_budget > 0
            ? ((budgetSummary?.total_utilized || 0) / budgetSummary?.total_budget * 100)
            : 0,
          rebateSettlementRate: rebateSummary?.total_accrued > 0
            ? ((rebateSummary?.total_settled || 0) / rebateSummary?.total_accrued * 100)
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching reconciliation:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export const dataLineageRoutes = dataLineage;
