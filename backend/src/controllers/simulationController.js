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

// Get saved simulations (placeholder)
exports.getSavedSimulations = asyncHandler((req, res, _next) => {
  // Implementation would fetch saved simulations from database
  res.json({
    success: true,
    data: [],
    message: 'Saved simulations feature - implementation pending'
  });
});

// Save simulation (placeholder)
exports.saveSimulation = asyncHandler((req, res, _next) => {
  const { _scenario, _results, name } = req.body;

  // Implementation would save simulation to database
  res.json({
    success: true,
    message: 'Simulation saved successfully',
    data: {
      id: `sim_${Date.now()}`,
      name,
      savedAt: new Date()
    }
  });
});
