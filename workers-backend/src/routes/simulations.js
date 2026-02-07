import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { getD1Client } from '../services/d1.js';

const simulationsRoutes = new Hono();

simulationsRoutes.use('*', authMiddleware);

simulationsRoutes.get('/', async (c) => {
  try {
    const user = c.get('user');
    const db = getD1Client(c);
    const simulations = await db.find('simulations', { company_id: user.companyId }, { sort: { created_at: -1 }, limit: 20 });
    return c.json({ success: true, data: simulations });
  } catch (error) {
    return c.json({ success: true, data: [] });
  }
});

simulationsRoutes.post('/promotion', async (c) => {
  try {
    const user = c.get('user');
    const db = getD1Client(c);
    const body = await c.req.json();
    
    const { customers, products, discountPercent, duration, budget, lockRatios } = body;
    
    const salesHistory = await db.find('promotions', {
      company_id: user.companyId,
      status: 'completed'
    });
    
    const avgROI = salesHistory.length > 0 
      ? salesHistory.reduce((sum, p) => sum + (p.data?.roi || 1.5), 0) / salesHistory.length 
      : 1.5;
    
    const avgUplift = salesHistory.length > 0
      ? salesHistory.reduce((sum, p) => sum + (p.data?.uplift || 15), 0) / salesHistory.length
      : 15;
    
    const baselineRevenue = budget * 2;
    const upliftPercent = avgUplift * (1 + (discountPercent / 100));
    const upliftRevenue = baselineRevenue * (upliftPercent / 100);
    const netRevenue = upliftRevenue - budget;
    const roi = budget > 0 ? (netRevenue / budget) : 0;
    const confidence = Math.min(0.95, 0.6 + (salesHistory.length * 0.05));
    
    const hierarchyBreakdown = [];
    if (customers && customers.length > 0) {
      const allocation = 100 / customers.length;
      customers.forEach((customerId, idx) => {
        hierarchyBreakdown.push({
          name: `Customer ${idx + 1}`,
          entityId: customerId,
          allocation,
          netRevenue: netRevenue * (allocation / 100)
        });
      });
    }
    
    const simulation = {
      id: `sim-${Date.now()}`,
      timestamp: new Date().toISOString(),
      config: { customers, products, discountPercent, duration, budget, lockRatios },
      baselineRevenue,
      upliftRevenue,
      uplift: upliftPercent,
      netRevenue,
      roi,
      confidence,
      hierarchyBreakdown,
      breakEvenDays: Math.ceil(duration * (budget / (netRevenue + budget))),
      riskLevel: roi < 1 ? 'high' : roi < 1.5 ? 'medium' : 'low'
    };
    
    return c.json({ success: true, simulation });
  } catch (error) {
    console.error('Simulation error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

simulationsRoutes.post('/compare', async (c) => {
  try {
    const body = await c.req.json();
    const { scenarios, baseline } = body;
    
    if (!scenarios || scenarios.length < 2) {
      return c.json({ success: false, message: 'At least 2 scenarios required for comparison' }, 400);
    }
    
    const comparison = {
      id: `compare-${Date.now()}`,
      timestamp: new Date().toISOString(),
      scenarioCount: scenarios.length,
      scenarios: scenarios.map((s, idx) => ({
        rank: idx + 1,
        name: s.name,
        roi: s.results?.roi || 0,
        netRevenue: s.results?.netRevenue || 0,
        uplift: s.results?.uplift || 0,
        confidence: s.results?.confidence || 0.7
      })).sort((a, b) => b.roi - a.roi),
      recommendation: null
    };
    
    comparison.scenarios.forEach((s, idx) => s.rank = idx + 1);
    
    const best = comparison.scenarios[0];
    comparison.recommendation = {
      scenarioName: best.name,
      reason: `Highest ROI of ${best.roi.toFixed(2)}x with ${best.confidence * 100}% confidence`,
      action: 'Apply this scenario to create a promotion'
    };
    
    return c.json({ success: true, comparison });
  } catch (error) {
    console.error('Comparison error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

simulationsRoutes.post('/save', async (c) => {
  try {
    const user = c.get('user');
    const db = getD1Client(c);
    const body = await c.req.json();
    
    const simulationId = `sim-${Date.now()}`;
    const simulation = {
      id: simulationId,
      company_id: user.companyId,
      created_by: user.id,
      name: body.name || 'Untitled Simulation',
      description: body.description || '',
      simulation_type: body.simulationType || 'promotion',
      status: 'saved',
      config: JSON.stringify(body.config || {}),
      results: JSON.stringify(body.results || {}),
      scenarios: JSON.stringify(body.scenarios || []),
      constraints: JSON.stringify(body.constraints || {})
    };
    
    await db.insertOne('simulations', simulation);
    
    return c.json({ success: true, simulation: { ...simulation, id: simulationId } });
  } catch (error) {
    console.error('Save simulation error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

simulationsRoutes.get('/history', async (c) => {
  try {
    const user = c.get('user');
    const db = getD1Client(c);
    const { limit = 20, page = 1 } = c.req.query();
    
    const simulations = await db.find('simulations', {
      company_id: user.companyId
    }, {
      sort: { created_at: -1 },
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });
    
    const history = simulations.map(sim => {
      const scenarios = sim.scenarios ? JSON.parse(sim.scenarios) : [];
      const results = sim.results ? JSON.parse(sim.results) : {};
      return {
        id: sim.id,
        name: sim.name,
        description: sim.description,
        simulationType: sim.simulation_type,
        status: sim.status,
        createdAt: sim.created_at,
        updatedAt: sim.updated_at,
        scenarioCount: scenarios.length || 1,
        bestROI: results.roi || results.bestROI || 0,
        appliedTo: sim.applied_to
      };
    });
    
    const total = await db.countDocuments('simulations', { company_id: user.companyId });
    
    return c.json({ 
      success: true, 
      data: history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('History error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export { simulationsRoutes };
