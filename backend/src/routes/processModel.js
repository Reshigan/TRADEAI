const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getProcessModel,
  getCurrentStage,
  validateStage,
  getAllowedActions,
  getNextBestAction,
  getStageToTabsMapping
} = require('../config/registries/processModel');

/**
 * GET /api/process-model/:module/:companyType
 * Get the process model for a specific module and company type
 */
router.get('/:module/:companyType', protect, (req, res) => {
  try {
    const { module, companyType } = req.params;

    const processModel = getProcessModel(module, companyType);

    if (!processModel) {
      return res.status(404).json({
        success: false,
        message: `No process model found for module: ${module}, companyType: ${companyType}`
      });
    }

    res.json({
      success: true,
      data: processModel
    });
  } catch (error) {
    console.error('Error fetching process model:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching process model',
      error: error.message
    });
  }
});

/**
 * GET /api/process-model/:module/:companyType/stage/:entityId
 * Get the current stage for a specific entity
 */
router.get('/:module/:companyType/stage/:entityId', protect, async (req, res) => {
  try {
    const { module, companyType, entityId } = req.params;

    const modelMap = {
      budget: require('../models/Budget'),
      promotion: require('../models/Promotion'),
      tradeSpend: require('../models/TradeSpend'),
      tradingTerm: require('../models/TradingTerm'),
      activityGrid: require('../models/ActivityGrid'),
      claim: require('../models/Claim'),
      deduction: require('../models/Deduction'),
      kamWallet: require('../models/KAMWallet'),
      campaign: require('../models/Campaign')
    };

    const Model = modelMap[module];
    if (!Model) {
      return res.status(400).json({
        success: false,
        message: `Invalid module: ${module}`
      });
    }

    const entity = await Model.findById(entityId);
    if (!entity) {
      return res.status(404).json({
        success: false,
        message: 'Entity not found'
      });
    }

    const currentStage = getCurrentStage(module, companyType, entity);
    const allowedActions = getAllowedActions(module, companyType, currentStage);
    const nextBestAction = getNextBestAction(module, companyType, currentStage, entity);

    res.json({
      success: true,
      data: {
        currentStage,
        allowedActions,
        nextBestAction
      }
    });
  } catch (error) {
    console.error('Error fetching current stage:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching current stage',
      error: error.message
    });
  }
});

/**
 * POST /api/process-model/:module/:companyType/validate
 * Validate an entity against a specific stage
 */
router.post('/:module/:companyType/validate', protect, async (req, res) => {
  try {
    const { module, companyType } = req.params;
    const { entityId, stageId } = req.body;

    const modelMap = {
      budget: require('../models/Budget'),
      promotion: require('../models/Promotion'),
      tradeSpend: require('../models/TradeSpend'),
      tradingTerm: require('../models/TradingTerm'),
      activityGrid: require('../models/ActivityGrid'),
      claim: require('../models/Claim'),
      deduction: require('../models/Deduction'),
      kamWallet: require('../models/KAMWallet'),
      campaign: require('../models/Campaign')
    };

    const Model = modelMap[module];
    if (!Model) {
      return res.status(400).json({
        success: false,
        message: `Invalid module: ${module}`
      });
    }

    const entity = await Model.findById(entityId);
    if (!entity) {
      return res.status(404).json({
        success: false,
        message: 'Entity not found'
      });
    }

    const validation = validateStage(module, companyType, stageId, entity);

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validating stage:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating stage',
      error: error.message
    });
  }
});

/**
 * GET /api/process-model/:module/tabs
 * Get the stage-to-tabs mapping for a specific module
 */
router.get('/:module/tabs', protect, (req, res) => {
  try {
    const { module } = req.params;

    const tabsMapping = getStageToTabsMapping(module);

    res.json({
      success: true,
      data: tabsMapping
    });
  } catch (error) {
    console.error('Error fetching tabs mapping:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tabs mapping',
      error: error.message
    });
  }
});

module.exports = router;
