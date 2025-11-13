const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'tradeai-ai-service',
    timestamp: new Date().toISOString(),
    ollama_url: OLLAMA_URL
  });
});

// Prompt library for TPM operations
const PROMPTS = {
  promotionAnalysis: (promotion) => `Analyze this trade promotion and provide insights:
Promotion: ${promotion.name}
Type: ${promotion.type}
Start Date: ${promotion.startDate}
End Date: ${promotion.endDate}
Budget: ${promotion.budget}

Provide a brief analysis of:
1. Timing effectiveness (2 sentences)
2. Budget appropriateness (1 sentence)
3. One actionable recommendation

Keep response under 100 words.`,

  customerInsight: (customer) => `Analyze this customer:
Customer: ${customer.name}
Revenue: ${customer.revenue || 'N/A'}
Location: ${customer.location || 'N/A'}
Status: ${customer.status || 'Active'}

Provide:
1. Customer segment classification (1 sentence)
2. Key opportunity (1 sentence)
3. Risk factor (1 sentence)

Keep response under 80 words.`,

  budgetOptimization: (budget) => `Analyze this marketing budget:
Budget Name: ${budget.name}
Total Amount: ${budget.totalAmount}
Allocated: ${budget.allocated || 0}
Remaining: ${budget.remaining || budget.totalAmount}

Provide:
1. Budget health assessment (1 sentence)
2. Allocation pattern insight (1 sentence)
3. One optimization recommendation (1 sentence)

Keep response under 70 words.`,

  generalQuery: (query) => `You are an AI assistant for TRADEAI, a Trade Promotion Management system. 
Answer this question concisely and professionally: ${query}

Keep response under 100 words.`
};

// Chat endpoint - conversational AI
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`[AI] Processing chat: ${message.substring(0, 50)}...`);

    // Generate response using Ollama
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: 'llama3.2:1b',
      prompt: PROMPTS.generalQuery(message),
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 200
      }
    });

    const aiResponse = response.data.response;

    res.json({
      success: true,
      response: aiResponse,
      model: 'llama3.2:1b',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI] Chat error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat request',
      details: error.message
    });
  }
});

// Analyze promotion
app.post('/api/analyze/promotion', async (req, res) => {
  try {
    const { promotion } = req.body;

    if (!promotion) {
      return res.status(400).json({ error: 'Promotion data is required' });
    }

    console.log(`[AI] Analyzing promotion: ${promotion.name || 'Unknown'}`);

    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: 'llama3.2:1b',
      prompt: PROMPTS.promotionAnalysis(promotion),
      stream: false,
      options: {
        temperature: 0.5,
        max_tokens: 150
      }
    });

    res.json({
      success: true,
      analysis: response.data.response,
      promotionId: promotion._id || promotion.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI] Promotion analysis error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze promotion',
      details: error.message
    });
  }
});

// Analyze customer
app.post('/api/analyze/customer', async (req, res) => {
  try {
    const { customer } = req.body;

    if (!customer) {
      return res.status(400).json({ error: 'Customer data is required' });
    }

    console.log(`[AI] Analyzing customer: ${customer.name || 'Unknown'}`);

    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: 'llama3.2:1b',
      prompt: PROMPTS.customerInsight(customer),
      stream: false,
      options: {
        temperature: 0.5,
        max_tokens: 120
      }
    });

    res.json({
      success: true,
      insight: response.data.response,
      customerId: customer._id || customer.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI] Customer analysis error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze customer',
      details: error.message
    });
  }
});

// Optimize budget
app.post('/api/analyze/budget', async (req, res) => {
  try {
    const { budget } = req.body;

    if (!budget) {
      return res.status(400).json({ error: 'Budget data is required' });
    }

    console.log(`[AI] Analyzing budget: ${budget.name || 'Unknown'}`);

    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: 'llama3.2:1b',
      prompt: PROMPTS.budgetOptimization(budget),
      stream: false,
      options: {
        temperature: 0.5,
        max_tokens: 100
      }
    });

    res.json({
      success: true,
      optimization: response.data.response,
      budgetId: budget._id || budget.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI] Budget analysis error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze budget',
      details: error.message
    });
  }
});

// Get available models
app.get('/api/models', async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_URL}/api/tags`);
    res.json({
      success: true,
      models: response.data.models.map(m => ({
        name: m.name,
        size: Math.round(m.size / (1024 * 1024 * 1024) * 100) / 100 + ' GB',
        modified: m.modified_at
      }))
    });
  } catch (error) {
    console.error('[AI] Models fetch error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch models',
      details: error.message
    });
  }
});

// NLP query processing - convert natural language to data queries
app.post('/api/nlp/query', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`[AI] Processing NLP query: ${query}`);

    // Simple intent detection (can be enhanced with ML model later)
    const lowerQuery = query.toLowerCase();
    let intent = 'general';
    let entity = null;

    if (lowerQuery.includes('promotion') || lowerQuery.includes('promo')) {
      intent = 'promotions';
    } else if (lowerQuery.includes('customer')) {
      intent = 'customers';
    } else if (lowerQuery.includes('budget')) {
      intent = 'budgets';
    } else if (lowerQuery.includes('product')) {
      intent = 'products';
    } else if (lowerQuery.includes('spend')) {
      intent = 'spends';
    }

    // Extract modifiers
    const modifiers = {
      top: lowerQuery.includes('top') || lowerQuery.includes('best'),
      active: lowerQuery.includes('active') || lowerQuery.includes('current'),
      recent: lowerQuery.includes('recent') || lowerQuery.includes('latest'),
      count: 5 // default
    };

    res.json({
      success: true,
      intent,
      entity,
      modifiers,
      originalQuery: query,
      suggestion: `Fetching ${intent} with filters: ${JSON.stringify(modifiers)}`
    });

  } catch (error) {
    console.error('[AI] NLP query error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to process NLP query',
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🤖 TRADEAI AI Service running on port ${PORT}`);
  console.log(`📡 Ollama URL: ${OLLAMA_URL}`);
  console.log(`🚀 Ready to process AI requests`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
