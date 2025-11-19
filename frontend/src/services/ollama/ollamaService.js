/**
 * Ollama AI Service - Lightweight LLM Integration for 8GB RAM
 * Uses tiny models optimized for low memory environments
 */

const OLLAMA_BASE_URL = process.env.REACT_APP_OLLAMA_URL || '/api/ollama';
// Use tinyllama - only ~600MB RAM, perfect for 8GB server
const DEFAULT_MODEL = 'tinyllama'; // Fallback: llama3.2:1b if tinyllama not available

class OllamaService {
  constructor() {
    this.model = DEFAULT_MODEL;
    this.conversationHistory = [];
    this.isAvailable = false;
    this.checkingAvailability = false;
  }

  /**
   * Check if Ollama is available and select best model for RAM
   */
  async checkAvailability() {
    if (this.checkingAvailability) return { available: this.isAvailable };
    
    this.checkingAvailability = true;
    
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        const models = data.models || [];
        
        // Prefer tinyllama (600MB) for 8GB RAM, fallback to llama3.2:1b (1.3GB)
        const availableModel = models.find(m => 
          m.name.includes('tinyllama') || 
          m.name.includes('llama3.2:1b') ||
          m.name.includes('phi3:mini')
        );
        
        if (availableModel) {
          this.model = availableModel.name;
          this.isAvailable = true;
        }
        
        this.checkingAvailability = false;
        return {
          available: this.isAvailable,
          models: models,
          selectedModel: this.model
        };
      }
      
      this.checkingAvailability = false;
      return { available: false, models: [] };
    } catch (error) {
      console.warn('Ollama not available, using fallback responses:', error.message);
      this.checkingAvailability = false;
      this.isAvailable = false;
      return { available: false, error: error.message };
    }
  }

  /**
   * Generate a response (uses fallback if Ollama unavailable)
   */
  async generate(prompt, context = {}) {
    // Check availability first
    if (!this.isAvailable) {
      const check = await this.checkAvailability();
      if (!check.available) {
        return {
          success: false,
          error: 'Ollama not available',
          fallback: this.getFallbackResponse(prompt, context),
          usingFallback: true
        };
      }
    }

    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}\n\nAssistant:`;
      
      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: fullPrompt,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 150, // Limit tokens for speed
            top_p: 0.9
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      this.conversationHistory.push(
        { role: 'user', content: prompt },
        { role: 'assistant', content: data.response }
      );

      return {
        success: true,
        response: data.response,
        model: this.model,
        usingFallback: false
      };
    } catch (error) {
      console.error('Ollama generation error:', error);
      this.isAvailable = false;
      
      return {
        success: false,
        error: error.message,
        fallback: this.getFallbackResponse(prompt, context),
        usingFallback: true
      };
    }
  }

  /**
   * Stream response (for typing effect)
   */
  async *generateStream(prompt, context = {}) {
    if (!this.isAvailable) {
      const check = await this.checkAvailability();
      if (!check.available) {
        yield this.getFallbackResponse(prompt, context);
        return;
      }
    }

    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}\n\nAssistant:`;
      
      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: fullPrompt,
          stream: true,
          options: {
            temperature: 0.7,
            num_predict: 150
          }
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.response) {
              yield json.response;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    } catch (error) {
      console.error('Ollama streaming error:', error);
      this.isAvailable = false;
      yield this.getFallbackResponse(prompt, context);
    }
  }

  /**
   * Build concise system prompt
   */
  buildSystemPrompt(context) {
    const { page, userData, dataContext } = context;
    
    return `You are TRADEAI Assistant. Help with trade spend, customers, products, promotions, budgets.
Page: ${page || 'dashboard'}
Role: ${userData?.role || 'user'}
${dataContext ? `Data: ${JSON.stringify(dataContext).substring(0, 200)}` : ''}
Be concise (2-3 sentences).`;
  }

  /**
   * Smart fallback responses (rule-based)
   */
  getFallbackResponse(prompt, context) {
    const lower = prompt.toLowerCase();
    const { dataContext, page } = context;
    
    // Context-aware responses
    if (dataContext) {
      if (lower.includes('insight') || lower.includes('analyze')) {
        return this.generateDataInsights(dataContext, page);
      }
      if (lower.includes('recommend') || lower.includes('suggest')) {
        return this.generateRecommendations(dataContext, page);
      }
    }
    
    // General help
    if (lower.includes('how') || lower.includes('help')) {
      const helps = {
        customers: 'View customer details, track revenue, identify high-value accounts, and segment by performance.',
        products: 'Manage pricing, monitor inventory, analyze margins, and identify trending items.',
        promotions: 'Create campaigns, track ROI, optimize discounts, and forecast impact.',
        budgets: 'Allocate funds, monitor utilization, track spend, and optimize allocation.',
        tradespends: 'Record expenses, analyze ROI, optimize spend, and forecast returns.'
      };
      return helps[page] || 'I can help with customers, products, promotions, budgets, and trade spend management.';
    }
    
    // Default helpful response
    return 'I\'m here to help! Ask me about your data, request insights, or get recommendations for optimization.';
  }

  /**
   * Generate insights from data
   */
  generateDataInsights(data, type) {
    if (!data) return 'No data available for analysis.';
    
    const insights = {
      customer: `Customer Analysis: ${data.totalRevenue ? `Revenue: $${data.totalRevenue.toLocaleString()}. ` : ''}${data.status === 'active' ? 'Active account - maintain engagement.' : 'Inactive - consider re-engagement campaign.'}`,
      product: `Product Insights: ${data.margin ? `Margin: ${data.margin}%. ` : ''}${data.salesGrowth > 0 ? `Growing ${data.salesGrowth}% - increase inventory.` : 'Consider price adjustment or promotion.'}`,
      promotion: `Promotion Analysis: ${data.roi ? `ROI: ${data.roi}%. ` : ''}${data.status === 'active' ? 'Currently active - monitor performance.' : 'Plan next campaign based on historical data.'}`,
      budget: `Budget Status: ${data.utilization ? `${data.utilization}% utilized. ` : ''}${data.utilization > 90 ? 'Near limit - request additional funds.' : 'Healthy allocation.'}`,
      tradespend: `Spend Analysis: ${data.roi ? `ROI: ${data.roi}%. ` : ''}${data.roi > 150 ? 'High performing - maintain strategy.' : 'Review effectiveness and optimize.'}`
    };
    
    return insights[type] || 'Data analyzed successfully.';
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(data, type) {
    const recs = {
      customer: `Recommendations: ${data.totalRevenue > 100000 ? 'VIP customer - offer exclusive benefits.' : 'Increase engagement with targeted promotions.'} Track purchase patterns for personalization.`,
      product: `Recommendations: ${data.margin < 20 ? 'Increase price 8-12%.' : 'Margin healthy.'} ${data.stock < 10 ? 'Reorder inventory.' : 'Stock adequate.'}`,
      promotion: `Recommendations: ${data.roi < 100 ? 'Adjust discount or targeting.' : 'Scale successful strategy.'} A/B test variations for optimization.`,
      budget: `Recommendations: ${data.utilization < 50 ? 'Reallocate unused funds to high-performing areas.' : 'Monitor spend closely.'} Review ROI per category.`,
      tradespend: `Recommendations: ${data.roi < 100 ? 'Redirect spend to better channels.' : 'Continue current strategy.'} Focus on high-ROI activities.`
    };
    
    return recs[type] || 'Review performance metrics and adjust strategy accordingly.';
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  getHistory() {
    return this.conversationHistory;
  }

  setModel(model) {
    this.model = model;
  }
}

export const ollamaService = new OllamaService();
export default ollamaService;
