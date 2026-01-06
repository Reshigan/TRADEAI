const simulationEngine = require('../services/simulationEngine');
const { _AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * SIMULATION CONTROLLER
 * Trading simulations and scenario modeling
 */

// Simulate promotion impact
exports.simulatePromotionImpact = asyncHandler(async (req, res, _next) => {
  console.log('[SimulationController] simulatePromotionImpact called');
  const scenario = {
    type: 'promotion_impact',
    ...req.body,
    tenantId: req.tenant._id,
    userId: req.user._id
  };

  console.log('[SimulationController] Calling simulationEngine');
  const result = await simulationEngine.simulatePromotionImpact(scenario);
  console.log('[SimulationController] SimulationEngine returned, result length:', JSON.stringify(result).length);

  console.log('[SimulationController] Sending response');
  res.json({
    success: true,
    data: result
  });
  console.log('[SimulationController] Response sent');
});

// Simulate budget allocation
exports.simulateBudgetAllocation = asyncHandler(async (req, res, _next) => {
  const scenario = {
    type: 'budget_allocation',
    ...req.body,
    tenantId: req.tenant._id,
    userId: req.user._id
  };

  const result = await simulationEngine.simulateBudgetAllocation(scenario);

  res.json({
    success: true,
    data: result
  });
});

// Simulate pricing strategy
exports.simulatePricingStrategy = asyncHandler(async (req, res, _next) => {
  const scenario = {
    type: 'pricing_strategy',
    ...req.body,
    tenantId: req.tenant._id,
    userId: req.user._id
  };

  const result = await simulationEngine.simulatePricingStrategy(scenario);

  res.json({
    success: true,
    data: result
  });
});

// Simulate volume projection
exports.simulateVolumeProjection = asyncHandler(async (req, res, _next) => {
  const scenario = {
    type: 'volume_projection',
    ...req.body,
    tenantId: req.tenant._id,
    userId: req.user._id
  };

  const result = await simulationEngine.simulateVolumeProjection(scenario);

  res.json({
    success: true,
    data: result
  });
});

// Simulate market share
exports.simulateMarketShare = asyncHandler(async (req, res, _next) => {
  const scenario = {
    type: 'market_share',
    ...req.body,
    tenantId: req.tenant._id,
    userId: req.user._id
  };

  const result = await simulationEngine.simulateMarketShare(scenario);

  res.json({
    success: true,
    data: result
  });
});

// Simulate ROI optimization
exports.simulateROIOptimization = asyncHandler(async (req, res, _next) => {
  const scenario = {
    type: 'roi_optimization',
    ...req.body,
    tenantId: req.tenant._id,
    userId: req.user._id
  };

  const result = await simulationEngine.simulateROIOptimization(scenario);

  res.json({
    success: true,
    data: result
  });
});

// What-if analysis
exports.whatIfAnalysis = asyncHandler(async (req, res, _next) => {
  const { baseScenario, variations } = req.body;

  baseScenario.tenantId = req.tenant._id;
  baseScenario.userId = req.user._id;

  const result = await simulationEngine.whatIfAnalysis(baseScenario, variations);

  res.json({
    success: true,
    data: result
  });
});

// Compare scenarios
exports.compareScenarios = asyncHandler(async (req, res, _next) => {
  const { scenarios } = req.body;

  // Add tenant and user info to all scenarios
  scenarios.forEach((scenario) => {
    scenario.tenantId = req.tenant._id;
    scenario.userId = req.user._id;
  });

  const result = await simulationEngine.compareScenarios(scenarios);

  res.json({
    success: true,
    data: result
  });
});

// Get saved simulations
exports.getSavedSimulations = asyncHandler(async (req, res, _next) => {
  const Simulation = require('../models/Simulation');
  const { type, status, page = 1, limit = 20 } = req.query;

  const query = {
    companyId: req.tenant._id,
    $or: [
      { createdBy: req.user._id },
      { 'sharedWith.user': req.user._id }
    ]
  };

  if (type) query.type = type;
  if (status) query.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [simulations, total] = await Promise.all([
    Simulation.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Simulation.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: simulations,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// Save simulation
exports.saveSimulation = asyncHandler(async (req, res, _next) => {
  const Simulation = require('../models/Simulation');
  const { scenario, results, name, description, type, tags } = req.body;

  const startTime = Date.now();

  const simulation = new Simulation({
    name,
    description,
    type: type || scenario?.type || 'promotion_impact',
    scenario,
    results,
    parameters: {
      dateRange: scenario?.dateRange,
      products: scenario?.products,
      customers: scenario?.customers,
      promotions: scenario?.promotions,
      budgets: scenario?.budgets,
      customParameters: scenario?.customParameters
    },
    metrics: {
      roi: results?.roi,
      revenue: results?.revenue,
      cost: results?.cost,
      profit: results?.profit,
      volume: results?.volume,
      marketShare: results?.marketShare,
      uplift: results?.uplift,
      confidence: results?.confidence
    },
    status: 'completed',
    tags: tags || [],
    companyId: req.tenant._id,
    tenantId: req.tenant._id,
    createdBy: req.user._id,
    executionTime: Date.now() - startTime
  });

  await simulation.save();

  res.json({
    success: true,
    message: 'Simulation saved successfully',
    data: {
      id: simulation._id,
      name: simulation.name,
      type: simulation.type,
      savedAt: simulation.createdAt
    }
  });
});

// Get simulation by ID
exports.getSimulationById = asyncHandler(async (req, res, _next) => {
  const Simulation = require('../models/Simulation');
  const { id } = req.params;

  const simulation = await Simulation.findOne({
    _id: id,
    companyId: req.tenant._id
  })
    .populate('createdBy', 'firstName lastName email')
    .populate('parameters.products', 'name sku')
    .populate('parameters.customers', 'name code');

  if (!simulation) {
    return res.status(404).json({
      success: false,
      error: 'Simulation not found'
    });
  }

  if (!simulation.canUserAccess(req.user._id)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: simulation
  });
});

// Delete simulation
exports.deleteSimulation = asyncHandler(async (req, res, _next) => {
  const Simulation = require('../models/Simulation');
  const { id } = req.params;

  const simulation = await Simulation.findOne({
    _id: id,
    companyId: req.tenant._id
  });

  if (!simulation) {
    return res.status(404).json({
      success: false,
      error: 'Simulation not found'
    });
  }

  if (!simulation.canUserEdit(req.user._id)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  await Simulation.deleteOne({ _id: id });

  res.json({
    success: true,
    message: 'Simulation deleted successfully'
  });
});
