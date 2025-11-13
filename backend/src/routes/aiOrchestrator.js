/**
 * AI Orchestrator Routes
 * Endpoints for Ollama-powered AI orchestration with ML service integration
 */

const express = require('express');
const router = express.Router();
const aiOrchestratorService = require('../services/aiOrchestratorService');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

router.use(authenticate);

/**
 * POST /api/ai-orchestrator/orchestrate
 * Main orchestration endpoint - routes user intent to appropriate ML tool
 */
router.post('/orchestrate', async (req, res) => {
  try {
    const { intent, context } = req.body;
    
    if (!intent) {
      return res.status(400).json({
        success: false,
        error: 'Intent is required'
      });
    }

    const fullContext = {
      ...context,
      tenantId: req.user.tenantId,
      userId: req.user._id,
      userRole: req.user.role
    };

    const result = await aiOrchestratorService.orchestrate(intent, fullContext);
    
    logger.logAudit({
      action: 'ai_orchestration',
      userId: req.user._id,
      tenantId: req.user.tenantId,
      details: {
        intent,
        tool: result.tool,
        success: result.success
      }
    });

    res.json(result);
  } catch (error) {
    logger.error('AI orchestration endpoint error', {
      error: error.message,
      userId: req.user._id
    });
    
    res.status(500).json({
      success: false,
      error: 'AI orchestration failed',
      message: error.message
    });
  }
});

/**
 * POST /api/ai-orchestrator/explain
 * Generate natural language explanation for ML results
 */
router.post('/explain', async (req, res) => {
  try {
    const { data, context } = req.body;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Data is required'
      });
    }

    const fullContext = {
      ...context,
      tenantId: req.user.tenantId,
      userId: req.user._id
    };

    const explanation = await aiOrchestratorService.generateExplanation(
      context?.userIntent || 'Explain this data',
      context?.toolName || 'general',
      data,
      fullContext
    );

    res.json({
      success: true,
      explanation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('AI explanation endpoint error', {
      error: error.message,
      userId: req.user._id
    });
    
    res.status(500).json({
      success: false,
      error: 'Explanation generation failed',
      message: error.message
    });
  }
});

/**
 * GET /api/ai-orchestrator/tools
 * List available AI tools
 */
router.get('/tools', async (req, res) => {
  try {
    const tools = aiOrchestratorService.tools;
    
    res.json({
      success: true,
      tools,
      count: tools.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to list tools',
      message: error.message
    });
  }
});

/**
 * GET /api/ai-orchestrator/health
 * Health check for AI orchestrator and dependencies
 */
router.get('/health', async (req, res) => {
  try {
    const ollamaAvailable = await aiOrchestratorService.isOllamaAvailable();
    
    let mlServiceAvailable = false;
    try {
      const mlServiceURL = process.env.ML_SERVICE_URL || 'http://localhost:8001';
      const axios = require('axios');
      const mlResponse = await axios.get(`${mlServiceURL}/health`, { timeout: 5000 });
      mlServiceAvailable = mlResponse.status === 200;
    } catch (error) {
      mlServiceAvailable = false;
    }

    const status = {
      orchestrator: 'operational',
      ollama: {
        available: ollamaAvailable,
        status: ollamaAvailable ? 'operational' : 'degraded',
        model: process.env.OLLAMA_MODEL || 'phi3:mini'
      },
      mlService: {
        available: mlServiceAvailable,
        status: mlServiceAvailable ? 'operational' : 'degraded'
      },
      fallback: {
        enabled: true,
        status: 'operational'
      },
      timestamp: new Date().toISOString()
    };

    const httpStatus = 200;

    res.status(httpStatus).json(status);
  } catch (error) {
    res.status(500).json({
      orchestrator: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/ai-orchestrator/cache/clear
 * Clear AI orchestrator cache (admin only)
 */
router.post('/cache/clear', async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    aiOrchestratorService.cache.clear();
    
    logger.logAudit({
      action: 'ai_cache_cleared',
      userId: req.user._id,
      tenantId: req.user.tenantId
    });

    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

module.exports = router;
