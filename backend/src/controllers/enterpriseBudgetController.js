const { asyncHandler, AppError } = require('../middleware/errorHandler');
const enterpriseBudgetService = require('../services/enterpriseBudgetService');
const Budget = require('../models/Budget');
const logger = require('../utils/logger');

/**
 * Enterprise Budget Controller
 * Advanced budget management endpoints with full CRUD, simulations, and workflow
 */

// Create Budget Scenario
exports.createScenario = asyncHandler(async (req, res) => {
  const { baseBudgetId, scenarioParams } = req.body;

  let baseData = {};
  if (baseBudgetId) {
    const baseBudget = await Budget.findById(baseBudgetId);
    if (!baseBudget) throw new AppError('Base budget not found', 404);
    baseData = baseBudget.toObject();
  }

  const scenario = await enterpriseBudgetService.createBudgetScenario(
    baseData,
    scenarioParams
  );

  logger.logAudit('budget_scenario_created', req.user._id, {
    baseBudgetId,
    scenarioName: scenarioParams.name
  });

  res.status(201).json({
    success: true,
    data: scenario
  });
});

// Compare Multiple Scenarios
exports.compareScenarios = asyncHandler(async (req, res) => {
  const { scenarioIds } = req.body;

  const scenarios = await Budget.find({
    _id: { $in: scenarioIds },
    type: 'scenario',
    companyId: req.user.companyId
  });

  if (scenarios.length === 0) {
    throw new AppError('No scenarios found', 404);
  }

  const comparison = await enterpriseBudgetService.compareScenarios(scenarios);

  res.json({
    success: true,
    data: comparison
  });
});

// Analyze Budget Variance
exports.analyzeVariance = asyncHandler(async (req, res) => {
  const { budgetId } = req.params;
  const { actualData, period } = req.body;

  const variance = await enterpriseBudgetService.analyzeVariance(
    budgetId,
    actualData,
    period
  );

  res.json({
    success: true,
    data: variance
  });
});

// Create Multi-Year Plan
exports.createMultiYearPlan = asyncHandler(async (req, res) => {
  const planParams = req.body;

  const plan = await enterpriseBudgetService.createMultiYearPlan(planParams);

  logger.logAudit('multi_year_plan_created', req.user._id, {
    startYear: planParams.startYear,
    years: planParams.years
  });

  res.status(201).json({
    success: true,
    data: plan
  });
});

// Optimize Budget Allocation
exports.optimizeBudgetAllocation = asyncHandler(async (req, res) => {
  const { budgetData, constraints, objectives } = req.body;

  const optimization = await enterpriseBudgetService.optimizeBudgetAllocation(
    budgetData,
    constraints,
    objectives
  );

  res.json({
    success: true,
    data: optimization
  });
});

// Process Budget Workflow
exports.processWorkflow = asyncHandler(async (req, res) => {
  const { budgetId } = req.params;
  const { action, comments } = req.body;

  const workflow = await enterpriseBudgetService.processBudgetWorkflow(
    budgetId,
    action,
    req.user._id,
    comments
  );

  logger.logAudit('budget_workflow_action', req.user._id, {
    budgetId,
    action,
    newStatus: workflow.newStatus
  });

  res.json({
    success: true,
    data: workflow
  });
});

// Consolidate Budgets
exports.consolidateBudgets = asyncHandler(async (req, res) => {
  const { budgetIds, consolidationParams } = req.body;

  const consolidation = await enterpriseBudgetService.consolidateBudgets(
    budgetIds,
    consolidationParams
  );

  logger.logAudit('budgets_consolidated', req.user._id, {
    budgetCount: budgetIds.length,
    type: consolidationParams.type
  });

  res.json({
    success: true,
    data: consolidation
  });
});

// Get Budget Performance Dashboard
exports.getPerformanceDashboard = asyncHandler(async (req, res) => {
  const filters = {
    companyId: req.user.companyId,
    ...req.query
  };

  const dashboard = await enterpriseBudgetService.getBudgetPerformanceDashboard(filters);

  res.json({
    success: true,
    data: dashboard
  });
});

// Bulk Budget Operations
exports.bulkCreate = asyncHandler(async (req, res) => {
  const { budgets } = req.body;

  if (!Array.isArray(budgets) || budgets.length === 0) {
    throw new AppError('Invalid budgets array', 400);
  }

  const results = {
    created: [],
    failed: []
  };

  for (const budgetData of budgets) {
    try {
      const budget = await Budget.create({
        ...budgetData,
        companyId: req.user.companyId,
        createdBy: req.user._id,
        status: 'draft'
      });
      results.created.push({ id: budget._id, name: budget.name });
    } catch (error) {
      results.failed.push({
        data: budgetData,
        error: error.message
      });
    }
  }

  logger.logAudit('bulk_budget_create', req.user._id, {
    total: budgets.length,
    created: results.created.length,
    failed: results.failed.length
  });

  res.status(201).json({
    success: true,
    data: results
  });
});

// Bulk Budget Update
exports.bulkUpdate = asyncHandler(async (req, res) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    throw new AppError('Invalid updates array', 400);
  }

  const results = {
    updated: [],
    failed: []
  };

  for (const update of updates) {
    try {
      const budget = await Budget.findOneAndUpdate(
        {
          _id: update.budgetId,
          companyId: req.user.companyId
        },
        update.data,
        { new: true, runValidators: true }
      );

      if (budget) {
        results.updated.push({ id: budget._id, name: budget.name });
      } else {
        results.failed.push({
          budgetId: update.budgetId,
          error: 'Budget not found'
        });
      }
    } catch (error) {
      results.failed.push({
        budgetId: update.budgetId,
        error: error.message
      });
    }
  }

  logger.logAudit('bulk_budget_update', req.user._id, {
    total: updates.length,
    updated: results.updated.length,
    failed: results.failed.length
  });

  res.json({
    success: true,
    data: results
  });
});

// Bulk Budget Delete
exports.bulkDelete = asyncHandler(async (req, res) => {
  const { budgetIds } = req.body;

  if (!Array.isArray(budgetIds) || budgetIds.length === 0) {
    throw new AppError('Invalid budgetIds array', 400);
  }

  const result = await Budget.deleteMany({
    _id: { $in: budgetIds },
    companyId: req.user.companyId,
    status: { $in: ['draft', 'rejected'] } // Only allow deletion of draft/rejected budgets
  });

  logger.logAudit('bulk_budget_delete', req.user._id, {
    requested: budgetIds.length,
    deleted: result.deletedCount
  });

  res.json({
    success: true,
    data: {
      requested: budgetIds.length,
      deleted: result.deletedCount
    }
  });
});

// Export Budgets
exports.exportBudgets = asyncHandler(async (req, res) => {
  const { budgetIds, format } = req.query;

  const query = { companyId: req.user.companyId };
  if (budgetIds) {
    query._id = { $in: budgetIds.split(',') };
  }

  const budgets = await Budget.find(query)
    .populate('createdBy', 'name email')
    .lean();

  let exportData;

  switch (format) {
    case 'csv':
      exportData = this.convertToCSV(budgets);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=budgets.csv');
      break;

    case 'excel':
      exportData = await this.convertToExcel(budgets);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=budgets.xlsx');
      break;

    default:
      exportData = JSON.stringify(budgets, null, 2);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=budgets.json');
  }

  logger.logAudit('budget_export', req.user._id, {
    format,
    count: budgets.length
  });

  res.send(exportData);
});

// Import Budgets
exports.importBudgets = asyncHandler(async (req, res) => {
  const { format, data, validate } = req.body;

  let budgets = [];

  switch (format) {
    case 'csv':
      budgets = this.parseCSV(data);
      break;
    case 'excel':
      budgets = await this.parseExcel(data);
      break;
    default:
      budgets = JSON.parse(data);
  }

  const results = {
    total: budgets.length,
    imported: [],
    failed: [],
    validationErrors: []
  };

  for (const budgetData of budgets) {
    try {
      // Validate if requested
      if (validate) {
        const validation = this.validateBudgetData(budgetData);
        if (!validation.valid) {
          results.validationErrors.push({
            data: budgetData,
            errors: validation.errors
          });
          continue;
        }
      }

      const budget = await Budget.create({
        ...budgetData,
        companyId: req.user.companyId,
        createdBy: req.user._id,
        status: 'draft',
        importedAt: new Date()
      });

      results.imported.push({ id: budget._id, name: budget.name });
    } catch (error) {
      results.failed.push({
        data: budgetData,
        error: error.message
      });
    }
  }

  logger.logAudit('budget_import', req.user._id, {
    format,
    total: results.total,
    imported: results.imported.length,
    failed: results.failed.length
  });

  res.status(201).json({
    success: true,
    data: results
  });
});

// Budget Simulation
exports.runSimulation = asyncHandler(async (req, res) => {
  const { budgetId, simulationParams } = req.body;

  const budget = await Budget.findById(budgetId);
  if (!budget) throw new AppError('Budget not found', 404);

  const simulation = {
    budgetId,
    timestamp: new Date(),
    parameters: simulationParams,
    scenarios: []
  };

  // Run multiple scenarios
  const scenarioTypes = [
    { name: 'Optimistic', factor: 1.2 },
    { name: 'Realistic', factor: 1.0 },
    { name: 'Pessimistic', factor: 0.8 }
  ];

  for (const scenarioType of scenarioTypes) {
    const scenarioResult = {
      name: scenarioType.name,
      factor: scenarioType.factor,
      outcomes: {}
    };

    // Simulate outcomes
    const budgetTotal = budget.budgetLines.reduce((sum, line) => {
      if (line.tradeSpend) {
        return sum +
          (line.tradeSpend.marketing?.budget || 0) +
          (line.tradeSpend.cashCoop?.budget || 0) +
          (line.tradeSpend.tradingTerms?.budget || 0) +
          (line.tradeSpend.promotions?.budget || 0);
      }
      return sum;
    }, 0);

    scenarioResult.outcomes = {
      totalSpend: budgetTotal * scenarioType.factor,
      expectedRevenue: budgetTotal * scenarioType.factor * 2.5,
      expectedROI: ((budgetTotal * scenarioType.factor * 2.5 - budgetTotal * scenarioType.factor) /
                     (budgetTotal * scenarioType.factor)) * 100,
      marketShare: 15 * scenarioType.factor,
      customerReach: 100000 * scenarioType.factor
    };

    simulation.scenarios.push(scenarioResult);
  }

  // Add recommendations
  simulation.recommendations = [
    {
      type: 'budget_adjustment',
      message: 'Consider increasing marketing budget by 15% for optimal ROI',
      priority: 'high'
    },
    {
      type: 'timing',
      message: 'Shift 20% of Q4 budget to Q3 for better seasonal alignment',
      priority: 'medium'
    }
  ];

  logger.logAudit('budget_simulation', req.user._id, {
    budgetId,
    scenariosRun: simulation.scenarios.length
  });

  res.json({
    success: true,
    data: simulation
  });
});

// Helper methods
exports.convertToCSV = (budgets) => {
  const headers = ['ID', 'Name', 'Year', 'Status', 'Total Budget', 'Created By', 'Created At'];
  const rows = budgets.map((b) => [
    b._id,
    b.name,
    b.year,
    b.status,
    b.totals?.total || 0,
    b.createdBy?.name || 'N/A',
    b.createdAt
  ]);

  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n');
};

exports.parseCSV = (csvData) => {
  // Simplified CSV parsing - in production use a proper CSV library
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.replace(/"/g, '').trim());

  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.replace(/"/g, '').trim());
    const obj = {};
    headers.forEach((header, index) => {
      obj[header.toLowerCase().replace(/ /g, '_')] = values[index];
    });
    return obj;
  });
};

exports.validateBudgetData = (budgetData) => {
  const errors = [];

  if (!budgetData.name) errors.push('Name is required');
  if (!budgetData.year) errors.push('Year is required');
  if (budgetData.year && (budgetData.year < 2020 || budgetData.year > 2030)) {
    errors.push('Year must be between 2020 and 2030');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = exports;
