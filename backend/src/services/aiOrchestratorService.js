/**
 * AI Orchestrator Service
 * Uses Ollama LLM to route requests to appropriate ML endpoints and generate explanations
 *
 * Architecture: Ollama (routing + explanation) → ML Service (predictions) → Rule-based fallback
 */

const axios = require('axios');
const ollamaService = require('../../services/ollamaService');
const mlIntegrationService = require('./mlIntegrationService');
const revenueImpactService = require('./revenueImpactService');
const logger = require('../utils/logger');

class AIOrchestratorService {
  constructor() {
    this.ollamaURL = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.ollamaModel = process.env.OLLAMA_MODEL || 'phi3:mini';
    this.ollamaTimeout = parseInt(process.env.OLLAMA_TIMEOUT) || 60000;
    this.mlServiceURL = process.env.ML_SERVICE_URL || 'http://localhost:8001';

    this.tools = this.defineTools();

    this.cache = new Map();
    this.cacheTTL = 30 * 60 * 1000;
  }

  /**
   * Define available tools that map to ML service endpoints
   */
  defineTools() {
    return [
      {
        name: 'forecast_demand',
        description: 'Forecast future demand for products based on historical data',
        parameters: {
          type: 'object',
          properties: {
            tenantId: { type: 'string', description: 'Tenant identifier' },
            productId: { type: 'string', description: 'Product identifier' },
            forecastDays: { type: 'number', description: 'Number of days to forecast (default: 30)' }
          },
          required: ['tenantId', 'productId']
        }
      },
      {
        name: 'optimize_price',
        description: 'Optimize product pricing based on elasticity and constraints',
        parameters: {
          type: 'object',
          properties: {
            tenantId: { type: 'string', description: 'Tenant identifier' },
            productId: { type: 'string', description: 'Product identifier' },
            constraints: { type: 'object', description: 'Pricing constraints (min, max, target margin)' }
          },
          required: ['tenantId', 'productId']
        }
      },
      {
        name: 'analyze_promotion_lift',
        description: 'Analyze promotion effectiveness and calculate incremental lift',
        parameters: {
          type: 'object',
          properties: {
            tenantId: { type: 'string', description: 'Tenant identifier' },
            promotionId: { type: 'string', description: 'Promotion identifier' }
          },
          required: ['tenantId', 'promotionId']
        }
      },
      {
        name: 'segment_customers',
        description: 'Segment customers using RFM analysis or ML clustering',
        parameters: {
          type: 'object',
          properties: {
            tenantId: { type: 'string', description: 'Tenant identifier' },
            method: { type: 'string', enum: ['rfm', 'kmeans'], description: 'Segmentation method' }
          },
          required: ['tenantId']
        }
      },
      {
        name: 'recommend_products',
        description: 'Recommend products for a customer based on hierarchy and performance',
        parameters: {
          type: 'object',
          properties: {
            tenantId: { type: 'string', description: 'Tenant identifier' },
            customerId: { type: 'string', description: 'Customer identifier' },
            limit: { type: 'number', description: 'Maximum number of recommendations (default: 10)' }
          },
          required: ['tenantId', 'customerId']
        }
      },
      {
        name: 'detect_anomalies',
        description: 'Detect anomalies in sales, spend, or performance metrics',
        parameters: {
          type: 'object',
          properties: {
            tenantId: { type: 'string', description: 'Tenant identifier' },
            dataType: { type: 'string', description: 'Type of data to analyze' },
            threshold: { type: 'number', description: 'Anomaly detection threshold' }
          },
          required: ['tenantId', 'dataType']
        }
      }
    ];
  }

  /**
   * Orchestrate AI request - route to appropriate tool and generate explanation
   * @param {string} userIntent - Natural language description of what user wants
   * @param {object} context - Context information (tenantId, user, etc.)
   * @returns {Promise<object>} ML results with natural language explanation
   */
  async orchestrate(userIntent, context = {}) {
    try {
      const startTime = Date.now();

      const toolSelection = await this.selectTool(userIntent, context);

      if (!toolSelection.tool) {
        return {
          success: false,
          error: 'Could not determine appropriate action',
          explanation: 'I\'m not sure how to help with that request. Please try rephrasing or provide more details.',
          fallback: true
        };
      }

      const mlResult = await this.executeTool(
        toolSelection.tool,
        toolSelection.parameters,
        context
      );

      const explanation = await this.generateExplanation(
        userIntent,
        toolSelection.tool,
        mlResult,
        context
      );

      const duration = Date.now() - startTime;

      logger.info('AI orchestration completed', {
        tool: toolSelection.tool,
        duration,
        tenantId: context.tenantId
      });

      return {
        success: true,
        tool: toolSelection.tool,
        data: mlResult,
        explanation,
        confidence: toolSelection.confidence || 0.85,
        duration,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('AI orchestration failed', { error: error.message, context });

      return {
        success: false,
        error: error.message,
        explanation: 'I encountered an error processing your request. Please try again.',
        fallback: true
      };
    }
  }

  /**
   * Select appropriate tool based on user intent using Ollama
   * @param {string} userIntent - User's natural language request
   * @param {object} context - Context information
   * @returns {Promise<object>} Selected tool and parameters
   */
  async selectTool(userIntent, context) {
    const ollamaAvailable = await this.isOllamaAvailable();

    if (!ollamaAvailable) {
      throw new Error('Ollama service is not available. Please ensure Ollama is running.');
    }

    const prompt = this.buildToolSelectionPrompt(userIntent, context);

    const response = await this.callOllama(prompt, { temperature: 0.1 });

    const toolSelection = this.parseToolSelection(response);

    return toolSelection;
  }

  /**
   * Build prompt for tool selection
   */
  buildToolSelectionPrompt(userIntent, context) {
    const toolsJSON = JSON.stringify(this.tools, null, 2);

    return `You are an AI assistant for a trade promotions management platform. Your task is to select the most appropriate tool to fulfill the user's request.

Available Tools:
${toolsJSON}

User Request: "${userIntent}"

Context:
- Tenant ID: ${context.tenantId || 'unknown'}
- User Role: ${context.userRole || 'unknown'}

Analyze the user's request and respond with ONLY a JSON object in this exact format:
{
  "tool": "tool_name",
  "parameters": {
    "param1": "value1",
    "param2": "value2"
  },
  "confidence": 0.95,
  "reasoning": "Brief explanation of why this tool was selected"
}

If no tool matches, respond with:
{
  "tool": null,
  "confidence": 0,
  "reasoning": "No appropriate tool found"
}

Respond with ONLY valid JSON, no other text.`;
  }

  /**
   * Parse tool selection response from Ollama
   */
  parseToolSelection(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.tool && parsed.tool !== null) {
        throw new Error('Missing tool field in response');
      }

      return {
        tool: parsed.tool,
        parameters: parsed.parameters || {},
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || ''
      };

    } catch (error) {
      logger.error('Failed to parse tool selection', { error: error.message, response });
      return { tool: null, confidence: 0, reasoning: 'Parse error' };
    }
  }

  /**
   * Rule-based fallback for tool selection when Ollama is unavailable
   */
  selectToolFallback(userIntent, context) {
    const intent = userIntent.toLowerCase();

    if (intent.includes('forecast') || intent.includes('demand') || intent.includes('predict sales')) {
      return {
        tool: 'forecast_demand',
        parameters: { tenantId: context.tenantId },
        confidence: 0.7,
        reasoning: 'Keyword match: forecast/demand'
      };
    }

    if (intent.includes('price') || intent.includes('pricing') || intent.includes('optimize price')) {
      return {
        tool: 'optimize_price',
        parameters: { tenantId: context.tenantId },
        confidence: 0.7,
        reasoning: 'Keyword match: price/pricing'
      };
    }

    if (intent.includes('promotion') || intent.includes('uplift') || intent.includes('lift')) {
      return {
        tool: 'analyze_promotion_lift',
        parameters: { tenantId: context.tenantId },
        confidence: 0.7,
        reasoning: 'Keyword match: promotion/uplift'
      };
    }

    if (intent.includes('segment') || intent.includes('rfm') || intent.includes('customer groups')) {
      return {
        tool: 'segment_customers',
        parameters: { tenantId: context.tenantId, method: 'rfm' },
        confidence: 0.7,
        reasoning: 'Keyword match: segment'
      };
    }

    if (intent.includes('recommend') || intent.includes('suggest products') || intent.includes('product recommendations')) {
      return {
        tool: 'recommend_products',
        parameters: { tenantId: context.tenantId },
        confidence: 0.7,
        reasoning: 'Keyword match: recommend/suggest'
      };
    }

    if (intent.includes('anomaly') || intent.includes('unusual') || intent.includes('outlier')) {
      return {
        tool: 'detect_anomalies',
        parameters: { tenantId: context.tenantId },
        confidence: 0.7,
        reasoning: 'Keyword match: anomaly'
      };
    }

    return {
      tool: null,
      confidence: 0,
      reasoning: 'No keyword match found'
    };
  }

  /**
   * Execute selected tool by calling ML service
   */
  async executeTool(toolName, parameters, context) {
    try {
      const cacheKey = `${toolName}_${JSON.stringify(parameters)}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        logger.info('Returning cached ML result', { tool: toolName });
        return cached;
      }

      const fullParams = {
        ...parameters,
        tenantId: context.tenantId || parameters.tenantId
      };

      let result;

      switch (toolName) {
        case 'forecast_demand':
          result = await mlIntegrationService.forecastDemand(
            fullParams.tenantId,
            fullParams.productId,
            fullParams.forecastDays || 30
          );
          break;

        case 'optimize_price':
          result = await mlIntegrationService.optimizePrice(
            fullParams.tenantId,
            fullParams.productId,
            fullParams.constraints || {}
          );
          break;

        case 'analyze_promotion_lift':
          result = await revenueImpactService.calculatePromotionImpact(
            fullParams.tenantId,
            {
              customers: fullParams.customers || [],
              products: fullParams.products || [],
              discountPercentage: fullParams.discountPercentage || 10,
              startDate: fullParams.startDate || new Date(),
              endDate: fullParams.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              promotionType: fullParams.promotionType || 'price_discount'
            }
          );
          break;


        case 'segment_customers':
          result = await revenueImpactService.segmentCustomers(
            fullParams.tenantId,
            fullParams.method || 'rfm',
            fullParams.rootCustomerId || null
          );
          break;

        case 'recommend_products':
          result = await revenueImpactService.recommendProducts(
            fullParams.tenantId,
            fullParams.customerId,
            {
              limit: fullParams.limit || 10,
              excludeCurrentProducts: fullParams.excludeCurrentProducts !== false
            }
          );
          break;

        case 'detect_anomalies':
          result = await mlIntegrationService.detectAnomalies(
            fullParams.tenantId,
            fullParams.dataType,
            fullParams.data || []
          );
          break;

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }

      this.setCache(cacheKey, result);

      return result;

    } catch (error) {
      logger.error('Tool execution failed', { tool: toolName, error: error.message });
      throw error;
    }
  }

  /**
   * Generate natural language explanation of ML results using Ollama
   */
  async generateExplanation(userIntent, toolName, mlResult, context) {
    try {
      const ollamaAvailable = await this.isOllamaAvailable();

      if (!ollamaAvailable) {
        throw new Error('Ollama service is not available. Please ensure Ollama is running.');
      }

      const prompt = this.buildExplanationPrompt(userIntent, toolName, mlResult, context);

      const explanation = await this.callOllama(prompt, { temperature: 0.3 });

      return explanation;

    } catch (error) {
      logger.error('Ollama explanation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Build prompt for generating explanation
   */
  buildExplanationPrompt(userIntent, toolName, mlResult, _context) {
    return `You are an AI assistant for trade promotions management. Explain the following ML prediction results to a business user in clear, actionable language.

User's Original Request: "${userIntent}"

Tool Used: ${toolName}

ML Results:
${JSON.stringify(mlResult, null, 2)}

Generate a concise explanation (2-4 sentences) that:
1. Summarizes the key findings
2. Highlights the most important numbers/insights
3. Suggests one actionable next step
4. Uses business language (avoid technical jargon)

Respond with ONLY the explanation text, no JSON or formatting.`;
  }

  /**
   * Fallback explanation generator (rule-based)
   */
  generateExplanationFallback(toolName, mlResult) {
    switch (toolName) {
      case 'forecast_demand':
        return `Based on historical data, we predict demand will be ${mlResult.predictions?.[0]?.value || 'N/A'} units. This forecast has ${Math.round((mlResult.confidence || 0.85) * 100)}% confidence.`;

      case 'optimize_price':
        return `The optimal price is $${mlResult.optimalPrice || 'N/A'}, which should generate ${mlResult.expectedImpact?.revenueChange || 'N/A'} in additional revenue.`;

      case 'predict_customer_ltv':
        return `This customer's predicted lifetime value is $${mlResult.predictedCLV || 'N/A'} with ${Math.round((mlResult.confidence || 0.85) * 100)}% confidence.`;

      case 'predict_churn':
        return `Churn risk is ${mlResult.riskLevel || 'medium'} with a ${Math.round((mlResult.churnProbability || 0.5) * 100)}% probability. Consider retention strategies.`;

      default:
        return 'Analysis complete. Review the detailed results for insights.';
    }
  }

  /**
   * Call Ollama API
   */
  async callOllama(prompt, options = {}) {
    try {
      const response = await axios.post(
        `${this.ollamaURL}/api/generate`,
        {
          model: this.ollamaModel,
          prompt,
          stream: false,
          options: {
            temperature: options.temperature || 0.3,
            top_p: options.top_p || 0.9,
            num_predict: options.num_predict || 500
          }
        },
        { timeout: this.ollamaTimeout }
      );

      return response.data.response;
    } catch (error) {
      throw new Error(`Ollama API call failed: ${error.message}`);
    }
  }

  /**
   * Check if Ollama service is available
   */
  async isOllamaAvailable() {
    try {
      const response = await axios.get(`${this.ollamaURL}/api/tags`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cache management
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const { data, timestamp } = cached;
    const age = Date.now() - timestamp;

    if (age > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return data;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    if (this.cache.size > 1000) {
      this.cleanCache();
    }
  }

  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        this.cache.delete(key);
      }
    }
  }
}

module.exports = new AIOrchestratorService();
