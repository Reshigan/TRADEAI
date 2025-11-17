/**
 * Ollama AI Routes
 * Real LLM-powered AI features using Ollama + Llama3
 */

const express = require('express');
const router = express.Router();
const ollamaService = require('../../services/ollamaService');
const { authenticate } = require('../middleware/auth');

// Public health check (no auth required)
router.get('/status', async (req, res) => {
  try {
    const isAvailable = await ollamaService.isAvailable();
    const models = isAvailable ? await ollamaService.listModels() : [];

    res.json({
      status: isAvailable ? 'operational' : 'unavailable',
      service: 'Ollama',
      model: ollamaService.model,
      available: isAvailable,
      models: models.map((m) => m.name),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      fallbackMode: true
    });
  }
});

// Protected routes (require authentication)
router.use(authenticate);

/**
 * POST /api/ollama/query
 * Natural language query processing
 */
router.post('/query', async (req, res) => {
  try {
    const { query, context } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const response = await ollamaService.processQuery(query, context);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: 'Query processing failed',
      message: error.message
    });
  }
});

/**
 * POST /api/ollama/optimize-budget
 * AI-powered budget optimization
 */
router.post('/optimize-budget', async (req, res) => {
  try {
    const { budget } = req.body;

    if (!budget || !budget.totalAmount) {
      return res.status(400).json({ error: 'Budget data with totalAmount is required' });
    }

    const optimization = await ollamaService.optimizeBudget(budget);
    res.json(optimization);
  } catch (error) {
    res.status(500).json({
      error: 'Budget optimization failed',
      message: error.message
    });
  }
});

/**
 * POST /api/ollama/analyze-promotion
 * AI-powered promotion analysis
 */
router.post('/analyze-promotion', async (req, res) => {
  try {
    const { promotion } = req.body;

    if (!promotion) {
      return res.status(400).json({ error: 'Promotion data is required' });
    }

    const analysis = await ollamaService.analyzePromotion(promotion);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({
      error: 'Promotion analysis failed',
      message: error.message
    });
  }
});

/**
 * POST /api/ollama/generate-insights
 * AI-powered insights generation
 */
router.post('/generate-insights', async (req, res) => {
  try {
    const { entity, data } = req.body;

    if (!entity || !data) {
      return res.status(400).json({ error: 'Entity and data are required' });
    }

    const insights = await ollamaService.generateInsights(entity, data);
    res.json({ insights });
  } catch (error) {
    res.status(500).json({
      error: 'Insight generation failed',
      message: error.message
    });
  }
});

/**
 * POST /api/ollama/forecast-demand
 * AI-powered demand forecasting
 */
router.post('/forecast-demand', async (req, res) => {
  try {
    const params = req.body;

    if (!params.productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    const forecast = await ollamaService.forecastDemand(params);
    res.json(forecast);
  } catch (error) {
    res.status(500).json({
      error: 'Demand forecast failed',
      message: error.message
    });
  }
});

/**
 * POST /api/ollama/chat
 * Conversational AI interface
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build context from conversation history
    let prompt = message;
    if (history && history.length > 0) {
      const contextMessages = history.slice(-5); // Last 5 messages
      const contextStr = contextMessages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n');
      prompt = `Previous conversation:\n${contextStr}\n\nUser: ${message}`;
    }

    const response = await ollamaService.generate(prompt);

    res.json({
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Chat failed',
      message: error.message
    });
  }
});

/**
 * GET /api/ollama/models
 * List available AI models
 */
router.get('/models', async (req, res) => {
  try {
    const models = await ollamaService.listModels();
    res.json({ models });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list models',
      message: error.message
    });
  }
});

module.exports = router;
