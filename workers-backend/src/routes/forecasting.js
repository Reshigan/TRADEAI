import { Hono } from 'hono';

const forecasting = new Hono();

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('companyId') || c.req.header('X-Company-Code') || 'default';
};

// Get all forecasts
forecasting.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, type, year, limit = 50, offset = 0 } = c.req.query();
    
    let query = 'SELECT * FROM forecasts WHERE company_id = ?';
    const params = [companyId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (type) {
      query += ' AND forecast_type = ?';
      params.push(type);
    }
    if (year) {
      query += ' AND forecast_year = ?';
      params.push(parseInt(year));
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.prepare(query).bind(...params).all();
    
    return c.json({
      success: true,
      data: result.results || [],
      total: result.results?.length || 0
    });
  } catch (error) {
    console.error('Error fetching forecasts:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get forecast types/options
forecasting.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      forecastTypes: [
        { value: 'budget', label: 'Budget Forecast' },
        { value: 'demand', label: 'Demand Forecast' },
        { value: 'revenue', label: 'Revenue Forecast' },
        { value: 'volume', label: 'Volume Forecast' }
      ],
      periodTypes: [
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'annually', label: 'Annually' }
      ],
      methods: [
        { value: 'historical', label: 'Historical Average' },
        { value: 'growth_rate', label: 'Growth Rate' },
        { value: 'manual', label: 'Manual Entry' },
        { value: 'ml_predicted', label: 'ML Predicted' },
        { value: 'weighted_moving_average', label: 'Weighted Moving Average' }
      ]
    }
  });
});

// Get forecast by ID
forecasting.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    
    const result = await db.prepare(`
      SELECT * FROM forecasts WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!result) {
      return c.json({ success: false, message: 'Forecast not found' }, 404);
    }
    
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching forecast:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Create forecast
forecasting.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = c.get('userId') || 'system';
    
    const id = generateId();
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO forecasts (
        id, company_id, name, forecast_type, status, period_type,
        start_period, end_period, base_year, forecast_year,
        total_forecast, method, confidence_level, created_by, data,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId, body.name,
      body.forecastType || body.forecast_type || 'budget',
      body.periodType || body.period_type || 'monthly',
      body.startPeriod || body.start_period || null,
      body.endPeriod || body.end_period || null,
      body.baseYear || body.base_year || new Date().getFullYear() - 1,
      body.forecastYear || body.forecast_year || new Date().getFullYear(),
      body.totalForecast || body.total_forecast || 0,
      body.method || 'historical',
      body.confidenceLevel || body.confidence_level || null,
      userId,
      JSON.stringify(body.data || {}),
      now, now
    ).run();
    
    const created = await db.prepare('SELECT * FROM forecasts WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: created }, 201);
  } catch (error) {
    console.error('Error creating forecast:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Update forecast
forecasting.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    
    const existing = await db.prepare(`
      SELECT * FROM forecasts WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!existing) {
      return c.json({ success: false, message: 'Forecast not found' }, 404);
    }
    
    await db.prepare(`
      UPDATE forecasts SET
        name = ?, forecast_type = ?, status = ?, period_type = ?,
        start_period = ?, end_period = ?, base_year = ?, forecast_year = ?,
        total_forecast = ?, total_actual = ?, variance = ?, variance_percent = ?,
        method = ?, confidence_level = ?, data = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.name || existing.name,
      body.forecastType || body.forecast_type || existing.forecast_type,
      body.status || existing.status,
      body.periodType || body.period_type || existing.period_type,
      body.startPeriod || body.start_period || existing.start_period,
      body.endPeriod || body.end_period || existing.end_period,
      body.baseYear || body.base_year || existing.base_year,
      body.forecastYear || body.forecast_year || existing.forecast_year,
      body.totalForecast || body.total_forecast || existing.total_forecast,
      body.totalActual || body.total_actual || existing.total_actual,
      body.variance ?? existing.variance,
      body.variancePercent || body.variance_percent || existing.variance_percent,
      body.method || existing.method,
      body.confidenceLevel || body.confidence_level || existing.confidence_level,
      JSON.stringify(body.data || {}),
      now, id
    ).run();
    
    const updated = await db.prepare('SELECT * FROM forecasts WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating forecast:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Delete forecast
forecasting.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    
    const existing = await db.prepare(`
      SELECT * FROM forecasts WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!existing) {
      return c.json({ success: false, message: 'Forecast not found' }, 404);
    }
    
    await db.prepare('DELETE FROM forecasts WHERE id = ?').bind(id).run();
    
    return c.json({ success: true, message: 'Forecast deleted' });
  } catch (error) {
    console.error('Error deleting forecast:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Generate forecast based on historical data
forecasting.post('/generate', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = c.get('userId') || 'system';
    
    const forecastType = body.forecastType || body.forecast_type || 'budget';
    const method = body.method || 'historical';
    const forecastYear = body.forecastYear || body.forecast_year || new Date().getFullYear();
    const baseYear = body.baseYear || body.base_year || forecastYear - 1;
    const growthRate = body.growthRate || body.growth_rate || 0.05;
    
    let baseValue = 0;
    let forecastValue = 0;
    
    // Get historical data based on forecast type
    if (forecastType === 'budget') {
      const historical = await db.prepare(`
        SELECT SUM(amount) as total FROM budgets 
        WHERE company_id = ? AND year = ?
      `).bind(companyId, baseYear).first();
      baseValue = historical?.total || 0;
    } else if (forecastType === 'revenue') {
      const historical = await db.prepare(`
        SELECT SUM(json_extract(data, '$.financial.actualRevenue')) as total 
        FROM promotions 
        WHERE company_id = ? AND strftime('%Y', start_date) = ?
      `).bind(companyId, baseYear.toString()).first();
      baseValue = historical?.total || 0;
    }
    
    // Calculate forecast based on method
    if (method === 'growth_rate') {
      forecastValue = baseValue * (1 + growthRate);
    } else if (method === 'historical') {
      forecastValue = baseValue; // Same as last year
    } else if (method === 'weighted_moving_average') {
      // Simple weighted average (would need more historical data in real implementation)
      forecastValue = baseValue * 1.03; // 3% default growth
    } else {
      forecastValue = body.totalForecast || body.total_forecast || baseValue;
    }
    
    // Create the forecast record
    const id = generateId();
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO forecasts (
        id, company_id, name, forecast_type, status, period_type,
        base_year, forecast_year, total_forecast, method, 
        confidence_level, created_by, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'draft', 'annually', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId,
      `${forecastType.charAt(0).toUpperCase() + forecastType.slice(1)} Forecast ${forecastYear}`,
      forecastType, baseYear, forecastYear,
      Math.round(forecastValue * 100) / 100,
      method, 0.8, userId,
      JSON.stringify({
        baseValue,
        growthRate,
        generatedAt: now,
        assumptions: body.assumptions || []
      }),
      now, now
    ).run();
    
    const created = await db.prepare('SELECT * FROM forecasts WHERE id = ?').bind(id).first();
    
    return c.json({
      success: true,
      data: created,
      calculation: {
        baseYear,
        baseValue,
        forecastYear,
        forecastValue: Math.round(forecastValue * 100) / 100,
        method,
        growthRate
      }
    });
  } catch (error) {
    console.error('Error generating forecast:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Activate forecast
forecasting.post('/:id/activate', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE forecasts SET status = 'active', updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(now, id, companyId).run();
    
    const updated = await db.prepare('SELECT * FROM forecasts WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error activating forecast:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Archive forecast
forecasting.post('/:id/archive', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE forecasts SET status = 'archived', updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(now, id, companyId).run();
    
    const updated = await db.prepare('SELECT * FROM forecasts WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error archiving forecast:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Update actuals and calculate variance
forecasting.post('/:id/update-actuals', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    
    const forecast = await db.prepare(`
      SELECT * FROM forecasts WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!forecast) {
      return c.json({ success: false, message: 'Forecast not found' }, 404);
    }
    
    const totalActual = body.totalActual || body.total_actual || 0;
    const variance = totalActual - forecast.total_forecast;
    const variancePercent = forecast.total_forecast > 0 
      ? (variance / forecast.total_forecast * 100) 
      : 0;
    
    await db.prepare(`
      UPDATE forecasts SET 
        total_actual = ?, variance = ?, variance_percent = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      totalActual,
      Math.round(variance * 100) / 100,
      Math.round(variancePercent * 100) / 100,
      now, id
    ).run();
    
    const updated = await db.prepare('SELECT * FROM forecasts WHERE id = ?').bind(id).first();
    
    return c.json({
      success: true,
      data: updated,
      analysis: {
        forecast: forecast.total_forecast,
        actual: totalActual,
        variance: Math.round(variance * 100) / 100,
        variancePercent: Math.round(variancePercent * 100) / 100,
        status: variancePercent > 10 ? 'over_budget' : variancePercent < -10 ? 'under_budget' : 'on_track'
      }
    });
  } catch (error) {
    console.error('Error updating actuals:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get forecast comparison (multiple forecasts)
forecasting.get('/compare', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { ids, type } = c.req.query();
    
    let query = 'SELECT * FROM forecasts WHERE company_id = ?';
    const params = [companyId];
    
    if (ids) {
      const idList = ids.split(',');
      query += ` AND id IN (${idList.map(() => '?').join(',')})`;
      params.push(...idList);
    } else if (type) {
      query += ' AND forecast_type = ? ORDER BY forecast_year DESC LIMIT 5';
      params.push(type);
    }
    
    const result = await db.prepare(query).bind(...params).all();
    
    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    console.error('Error comparing forecasts:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export const forecastingRoutes = forecasting;
