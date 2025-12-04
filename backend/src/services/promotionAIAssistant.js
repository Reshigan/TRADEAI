/**
 * Promotion AI Assistant Service
 * Conversational AI that explains gross benefit, volume uplift, and price optimization
 * Integrates with PriceElasticityService for data-driven predictions
 */

const priceElasticityService = require('./priceElasticityService');
const promotionSimulationService = require('./promotionSimulationService');
const Promotion = require('../models/Promotion');
const Product = require('../models/Product');
const SalesHistory = require('../models/SalesHistory');
const logger = require('../utils/logger');

class PromotionAIAssistant {
  constructor() {
    this.conversationHistory = new Map();
  }

  /**
   * Main entry point - process user question and generate response
   */
  async chat(tenantId, userId, message, context = {}) {
    try {
      // Analyze the intent of the message
      const intent = this.analyzePromotionIntent(message);
      
      // Store conversation context
      const conversationKey = `${tenantId}_${userId}`;
      const history = this.conversationHistory.get(conversationKey) || [];
      history.push({ role: 'user', message, timestamp: new Date() });

      let response;

      switch (intent.type) {
        case 'gross_benefit':
          response = await this.explainGrossBenefit(tenantId, intent.params, context);
          break;
        case 'volume_uplift':
          response = await this.explainVolumeUplift(tenantId, intent.params, context);
          break;
        case 'price_optimization':
          response = await this.suggestOptimalPrice(tenantId, intent.params, context);
          break;
        case 'promotion_roi':
          response = await this.explainPromotionROI(tenantId, intent.params, context);
          break;
        case 'elasticity':
          response = await this.explainElasticity(tenantId, intent.params, context);
          break;
        case 'comparison':
          response = await this.compareScenarios(tenantId, intent.params, context);
          break;
        default:
          response = await this.handleGeneralPromotionQuery(tenantId, message, context);
      }

      // Store assistant response
      history.push({ role: 'assistant', message: response.message, data: response.data, timestamp: new Date() });
      this.conversationHistory.set(conversationKey, history.slice(-20)); // Keep last 20 messages

      return response;
    } catch (error) {
      logger.error('Promotion AI Assistant error:', error);
      return {
        message: `I encountered an error while analyzing your request: ${error.message}. Please try rephrasing your question.`,
        error: true
      };
    }
  }

  /**
   * Analyze user message to determine promotion-related intent
   */
  analyzePromotionIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    // Extract product/promotion IDs if mentioned
    const productIdMatch = message.match(/product[:\s]+([a-f0-9]{24})/i);
    const promotionIdMatch = message.match(/promotion[:\s]+([a-f0-9]{24})/i);
    const priceMatch = message.match(/(?:price|R|r)\s*(\d+(?:\.\d{2})?)/);
    
    const params = {
      productId: productIdMatch ? productIdMatch[1] : null,
      promotionId: promotionIdMatch ? promotionIdMatch[1] : null,
      price: priceMatch ? parseFloat(priceMatch[1]) : null
    };

    // Gross benefit intent
    if (lowerMessage.includes('gross benefit') || 
        lowerMessage.includes('incremental revenue') ||
        lowerMessage.includes('profit from promotion') ||
        lowerMessage.includes('how much will i make')) {
      return { type: 'gross_benefit', params, confidence: 0.9 };
    }

    // Volume uplift intent
    if (lowerMessage.includes('volume uplift') || 
        lowerMessage.includes('volume change') ||
        lowerMessage.includes('how many more') ||
        lowerMessage.includes('sales increase') ||
        lowerMessage.includes('unit increase') ||
        (lowerMessage.includes('volume') && lowerMessage.includes('price'))) {
      return { type: 'volume_uplift', params, confidence: 0.9 };
    }

    // Price optimization intent
    if (lowerMessage.includes('optimal price') || 
        lowerMessage.includes('best price') ||
        lowerMessage.includes('price suggestion') ||
        lowerMessage.includes('what price should') ||
        lowerMessage.includes('recommend price')) {
      return { type: 'price_optimization', params, confidence: 0.85 };
    }

    // ROI intent
    if (lowerMessage.includes('roi') || 
        lowerMessage.includes('return on investment') ||
        lowerMessage.includes('promotion performance') ||
        lowerMessage.includes('is it worth')) {
      return { type: 'promotion_roi', params, confidence: 0.85 };
    }

    // Elasticity intent
    if (lowerMessage.includes('elasticity') || 
        lowerMessage.includes('price sensitive') ||
        lowerMessage.includes('demand curve')) {
      return { type: 'elasticity', params, confidence: 0.9 };
    }

    // Comparison intent
    if (lowerMessage.includes('compare') || 
        lowerMessage.includes('which is better') ||
        lowerMessage.includes('difference between')) {
      return { type: 'comparison', params, confidence: 0.8 };
    }

    return { type: 'general', params, confidence: 0.5 };
  }

  /**
   * Explain gross benefit of a promotion or price change
   */
  async explainGrossBenefit(tenantId, params, context) {
    const productId = params.productId || context.productId;
    const newPrice = params.price || context.proposedPrice;

    if (!productId) {
      // Get top products and explain gross benefit concept
      const products = await Product.find({ company: tenantId }).limit(5);
      
      return {
        message: `**Understanding Gross Benefit**

Gross benefit is the incremental profit generated by a promotion or price change. It's calculated as:

**Gross Benefit = (New Revenue - Baseline Revenue) - Promotion Costs**

To calculate the gross benefit for a specific product, I need to know:
1. Which product you're interested in
2. The proposed price point or discount

${products.length > 0 ? `\nHere are some products I can analyze:\n${products.map(p => `- ${p.name} (ID: ${p._id})`).join('\n')}` : ''}

Ask me something like: "What's the gross benefit if I price Product X at R25?"`,
        data: { products: products.map(p => ({ id: p._id, name: p.name })) },
        suggestedQuestions: [
          'What is the gross benefit for my top product at R30?',
          'Show me the gross benefit analysis for all promotions',
          'Which price point maximizes gross benefit?'
        ]
      };
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return { message: 'I could not find that product. Please check the product ID and try again.' };
    }

    if (!newPrice) {
      // Show gross benefit at different price points
      const analysis = await priceElasticityService.suggestOptimalPrices(tenantId, productId, {
        steps: 5
      });

      const scenarios = analysis.scenarios || [];
      const currentRevenue = analysis.currentState?.revenue || 0;

      let responseMessage = `**Gross Benefit Analysis for ${product.name}**\n\n`;
      responseMessage += `Current State:\n`;
      responseMessage += `- Price: R${analysis.currentState?.price?.toFixed(2) || 'N/A'}\n`;
      responseMessage += `- Volume: ${analysis.currentState?.volume?.toFixed(0) || 'N/A'} units\n`;
      responseMessage += `- Revenue: R${currentRevenue.toLocaleString()}\n\n`;
      
      responseMessage += `**Gross Benefit at Different Price Points:**\n\n`;
      
      for (const scenario of scenarios.slice(0, 5)) {
        const grossBenefit = scenario.revenue - currentRevenue;
        const sign = grossBenefit >= 0 ? '+' : '';
        responseMessage += `At R${scenario.price}: Volume ${scenario.predictedVolume} units, Revenue R${scenario.revenue.toLocaleString()} (${sign}R${grossBenefit.toLocaleString()} gross benefit)\n`;
      }

      if (analysis.recommendations?.forMaxRevenue) {
        responseMessage += `\n**Recommendation:** For maximum revenue, price at R${analysis.recommendations.forMaxRevenue.price} for a gross benefit of R${analysis.recommendations.forMaxRevenue.revenueGain?.toLocaleString() || 0}`;
      }

      return {
        message: responseMessage,
        data: analysis,
        suggestedQuestions: [
          `What's the volume uplift at R${analysis.recommendations?.forMaxRevenue?.price || 30}?`,
          'How price sensitive is this product?',
          'Compare this with other products'
        ]
      };
    }

    // Calculate gross benefit at specific price
    const prediction = await priceElasticityService.predictVolumeAtPrice(tenantId, productId, newPrice);
    
    if (prediction.error) {
      return { message: `I couldn't calculate the gross benefit: ${prediction.error}` };
    }

    const grossBenefit = prediction.changes.grossBenefit;
    const sign = grossBenefit >= 0 ? '+' : '';

    let responseMessage = `**Gross Benefit Analysis for ${product.name} at R${newPrice}**\n\n`;
    responseMessage += `**Current State:**\n`;
    responseMessage += `- Price: R${prediction.currentState.price.toFixed(2)}\n`;
    responseMessage += `- Volume: ${prediction.currentState.volume.toFixed(0)} units\n`;
    responseMessage += `- Revenue: R${prediction.currentState.revenue.toLocaleString()}\n\n`;
    
    responseMessage += `**Predicted at R${newPrice}:**\n`;
    responseMessage += `- Volume: ${prediction.prediction.volume.toFixed(0)} units (${prediction.changes.volumeChange.toFixed(1)}% change)\n`;
    responseMessage += `- Revenue: R${prediction.prediction.revenue.toLocaleString()}\n`;
    responseMessage += `- **Gross Benefit: ${sign}R${Math.abs(grossBenefit).toLocaleString()}**\n\n`;
    
    responseMessage += `**Analysis:**\n`;
    responseMessage += `Based on learned price elasticity of ${prediction.elasticity.value.toFixed(2)} (${prediction.elasticity.confidence} confidence), `;
    
    if (grossBenefit > 0) {
      responseMessage += `this price change is expected to generate additional revenue of R${grossBenefit.toLocaleString()}. ${prediction.recommendation.reason}`;
    } else {
      responseMessage += `this price change may reduce revenue by R${Math.abs(grossBenefit).toLocaleString()}. ${prediction.recommendation.reason}`;
    }

    return {
      message: responseMessage,
      data: prediction,
      suggestedQuestions: [
        'What price maximizes gross benefit?',
        `What's the ROI if I run a promotion at R${newPrice}?`,
        'How confident is this prediction?'
      ]
    };
  }

  /**
   * Explain volume uplift at a price point
   */
  async explainVolumeUplift(tenantId, params, context) {
    const productId = params.productId || context.productId;
    const newPrice = params.price || context.proposedPrice;

    if (!productId) {
      return {
        message: `**Understanding Volume Uplift**

Volume uplift is the percentage increase (or decrease) in sales volume when you change the price or run a promotion.

**Volume Uplift = (New Volume - Baseline Volume) / Baseline Volume x 100%**

The uplift depends on **price elasticity** - how sensitive customers are to price changes. I've learned elasticity values from your actual sales history.

To predict volume uplift, tell me:
1. Which product you're interested in
2. The proposed price point

Example: "What's the volume uplift for Product X if I price it at R25?"`,
        suggestedQuestions: [
          'Show me volume uplift predictions for my top products',
          'Which products have the highest price sensitivity?',
          'What discount gives 20% volume uplift?'
        ]
      };
    }

    const product = await Product.findById(productId);
    if (!product) {
      return { message: 'Product not found. Please check the product ID.' };
    }

    if (!newPrice) {
      // Show volume uplift at different price points
      const analysis = await priceElasticityService.suggestOptimalPrices(tenantId, productId, {
        steps: 7
      });

      let responseMessage = `**Volume Uplift Analysis for ${product.name}**\n\n`;
      responseMessage += `Current baseline: ${analysis.currentState?.volume?.toFixed(0) || 'N/A'} units at R${analysis.currentState?.price?.toFixed(2) || 'N/A'}\n`;
      responseMessage += `Price Elasticity: ${analysis.elasticity?.value?.toFixed(2) || 'N/A'} (${analysis.elasticity?.interpretation?.type || 'unknown'})\n\n`;
      
      responseMessage += `**Volume Uplift at Different Price Points:**\n\n`;
      
      for (const scenario of analysis.scenarios || []) {
        const upliftSign = scenario.volumeChange >= 0 ? '+' : '';
        responseMessage += `R${scenario.price}: ${scenario.predictedVolume} units (${upliftSign}${scenario.volumeChange}% uplift)\n`;
      }

      responseMessage += `\n**Interpretation:** ${analysis.elasticity?.interpretation?.description || 'Analysis based on historical sales patterns.'}`;

      return {
        message: responseMessage,
        data: analysis,
        suggestedQuestions: [
          'What price gives me 15% volume uplift?',
          'What is the gross benefit at each price point?',
          'How was this elasticity calculated?'
        ]
      };
    }

    // Calculate volume uplift at specific price
    const prediction = await priceElasticityService.predictVolumeAtPrice(tenantId, productId, newPrice);
    
    if (prediction.error) {
      return { message: `I couldn't predict volume uplift: ${prediction.error}` };
    }

    const volumeUplift = prediction.changes.volumeChange;
    const upliftSign = volumeUplift >= 0 ? '+' : '';

    let responseMessage = `**Volume Uplift Prediction for ${product.name}**\n\n`;
    responseMessage += `**Price Change:** R${prediction.currentState.price.toFixed(2)} → R${newPrice} (${prediction.changes.priceChange.toFixed(1)}% change)\n\n`;
    responseMessage += `**Predicted Volume Uplift: ${upliftSign}${volumeUplift.toFixed(1)}%**\n`;
    responseMessage += `- Current volume: ${prediction.currentState.volume.toFixed(0)} units\n`;
    responseMessage += `- Predicted volume: ${prediction.prediction.volume.toFixed(0)} units\n`;
    responseMessage += `- Change: ${upliftSign}${(prediction.prediction.volume - prediction.currentState.volume).toFixed(0)} units\n\n`;
    
    responseMessage += `**How I calculated this:**\n`;
    responseMessage += `I used a learned price elasticity of ${prediction.elasticity.value.toFixed(2)} from your sales history. `;
    responseMessage += `This means for every 1% price ${prediction.changes.priceChange > 0 ? 'increase' : 'decrease'}, `;
    responseMessage += `volume ${prediction.elasticity.value < 0 ? 'decreases' : 'increases'} by ${Math.abs(prediction.elasticity.value).toFixed(2)}%.\n\n`;
    
    responseMessage += `**Confidence:** ${prediction.elasticity.confidence} (based on ${prediction.elasticity.method})`;

    return {
      message: responseMessage,
      data: prediction,
      suggestedQuestions: [
        `What's the gross benefit at R${newPrice}?`,
        'What price maximizes volume?',
        'Show me the elasticity calculation details'
      ]
    };
  }

  /**
   * Suggest optimal price for a product
   */
  async suggestOptimalPrice(tenantId, params, context) {
    const productId = params.productId || context.productId;

    if (!productId) {
      // Get products and ask which one to analyze
      const products = await Product.find({ company: tenantId }).limit(10);
      
      return {
        message: `I can suggest optimal prices based on learned demand patterns. Which product would you like me to analyze?\n\n${products.map(p => `- ${p.name} (ID: ${p._id})`).join('\n')}`,
        data: { products },
        suggestedQuestions: products.slice(0, 3).map(p => `What's the optimal price for ${p.name}?`)
      };
    }

    const product = await Product.findById(productId);
    if (!product) {
      return { message: 'Product not found.' };
    }

    const analysis = await priceElasticityService.suggestOptimalPrices(tenantId, productId, {
      steps: 10
    });

    let responseMessage = `**Optimal Price Recommendation for ${product.name}**\n\n`;
    
    responseMessage += `**Current State:**\n`;
    responseMessage += `- Price: R${analysis.currentState?.price?.toFixed(2)}\n`;
    responseMessage += `- Volume: ${analysis.currentState?.volume?.toFixed(0)} units\n`;
    responseMessage += `- Revenue: R${analysis.currentState?.revenue?.toLocaleString()}\n`;
    responseMessage += `- Profit: R${analysis.currentState?.profit?.toLocaleString()}\n\n`;

    responseMessage += `**Recommendations:**\n\n`;
    
    if (analysis.recommendations?.forMaxRevenue) {
      const rec = analysis.recommendations.forMaxRevenue;
      responseMessage += `**For Maximum Revenue:** R${rec.price}\n`;
      responseMessage += `- Expected volume: ${rec.predictedVolume} units\n`;
      responseMessage += `- Expected revenue: R${rec.revenue?.toLocaleString()}\n`;
      responseMessage += `- Revenue gain: +R${rec.revenueGain?.toLocaleString()}\n\n`;
    }

    if (analysis.recommendations?.forMaxProfit) {
      const rec = analysis.recommendations.forMaxProfit;
      responseMessage += `**For Maximum Profit:** R${rec.price}\n`;
      responseMessage += `- Expected volume: ${rec.predictedVolume} units\n`;
      responseMessage += `- Expected profit: R${rec.profit?.toLocaleString()}\n`;
      responseMessage += `- Profit gain: +R${rec.profitGain?.toLocaleString()}\n\n`;
    }

    responseMessage += `**Analysis:** ${analysis.analysis?.summary || 'Based on learned price elasticity patterns.'}`;

    return {
      message: responseMessage,
      data: analysis,
      suggestedQuestions: [
        `What's the volume uplift at R${analysis.recommendations?.forMaxRevenue?.price}?`,
        'Show me all price scenarios',
        'How confident is this recommendation?'
      ]
    };
  }

  /**
   * Explain promotion ROI
   */
  async explainPromotionROI(tenantId, params, context) {
    const promotionId = params.promotionId || context.promotionId;

    if (!promotionId) {
      // Get recent promotions and their ROI
      const promotions = await Promotion.find({ 
        tenantId,
        status: { $in: ['completed', 'active'] }
      }).limit(10).populate('product customer');

      let responseMessage = `**Promotion ROI Overview**\n\n`;
      responseMessage += `ROI (Return on Investment) measures how much profit a promotion generates relative to its cost:\n\n`;
      responseMessage += `**ROI = (Gross Profit - Promotion Cost) / Promotion Cost x 100%**\n\n`;

      if (promotions.length > 0) {
        responseMessage += `**Recent Promotions:**\n`;
        for (const promo of promotions.slice(0, 5)) {
          const roi = promo.actualROI || promo.targetROI || 0;
          responseMessage += `- ${promo.name || 'Unnamed'}: ${roi.toFixed(1)}% ROI\n`;
        }
      }

      return {
        message: responseMessage,
        data: { promotions },
        suggestedQuestions: [
          'Which promotion had the best ROI?',
          'How can I improve promotion ROI?',
          'What ROI should I target?'
        ]
      };
    }

    // Analyze specific promotion
    const promotion = await Promotion.findById(promotionId).populate('product customer');
    if (!promotion) {
      return { message: 'Promotion not found.' };
    }

    // Use simulation service for detailed analysis
    const analysis = await promotionSimulationService.analyzeEffectiveness(promotionId);

    let responseMessage = `**ROI Analysis for "${promotion.name || 'Promotion'}"**\n\n`;
    responseMessage += `**Performance:**\n`;
    responseMessage += `- Actual ROI: ${analysis.overall?.actualROI?.toFixed(1) || 'N/A'}%\n`;
    responseMessage += `- Target ROI: ${analysis.overall?.targetROI?.toFixed(1) || 'N/A'}%\n`;
    responseMessage += `- Achievement: ${analysis.overall?.roiAchievement?.toFixed(1) || 'N/A'}%\n\n`;
    
    responseMessage += `**Effectiveness Score:** ${analysis.overall?.effectivenessScore?.toFixed(0) || 'N/A'}/100\n\n`;

    if (analysis.insights && analysis.insights.length > 0) {
      responseMessage += `**Insights:**\n`;
      for (const insight of analysis.insights) {
        responseMessage += `- ${insight}\n`;
      }
    }

    return {
      message: responseMessage,
      data: analysis,
      suggestedQuestions: [
        'How can I improve this promotion?',
        'Compare with similar promotions',
        'What drove the ROI?'
      ]
    };
  }

  /**
   * Explain price elasticity for a product
   */
  async explainElasticity(tenantId, params, context) {
    const productId = params.productId || context.productId;

    if (!productId) {
      return {
        message: `**Understanding Price Elasticity**

Price elasticity measures how sensitive demand is to price changes:

- **Elasticity < -1 (Elastic):** Demand is sensitive. Price cuts boost revenue.
- **Elasticity = -1 (Unit Elastic):** Revenue stays constant regardless of price.
- **Elasticity > -1 (Inelastic):** Demand is insensitive. Price increases boost revenue.

I calculate elasticity from your actual sales history using log-log regression, which learns the relationship between price and quantity sold.

Tell me which product you'd like me to analyze, and I'll show you its learned elasticity.`,
        suggestedQuestions: [
          'Show me elasticity for my top products',
          'Which products are most price sensitive?',
          'How is elasticity calculated?'
        ]
      };
    }

    const product = await Product.findById(productId);
    if (!product) {
      return { message: 'Product not found.' };
    }

    const elasticity = await priceElasticityService.calculateProductElasticity(tenantId, productId);

    let responseMessage = `**Price Elasticity Analysis for ${product.name}**\n\n`;
    responseMessage += `**Elasticity Value:** ${elasticity.elasticity.toFixed(3)}\n`;
    responseMessage += `**Type:** ${elasticity.interpretation?.type || 'Unknown'}\n`;
    responseMessage += `**Confidence:** ${elasticity.confidence}\n`;
    responseMessage += `**Data Points:** ${elasticity.dataPoints}\n`;
    responseMessage += `**Method:** ${elasticity.method}\n\n`;
    
    responseMessage += `**What This Means:**\n`;
    responseMessage += `${elasticity.interpretation?.description || 'Analysis based on available data.'}\n\n`;
    
    responseMessage += `**Recommendation:**\n`;
    responseMessage += `${elasticity.interpretation?.recommendation || 'Consider the elasticity when setting prices.'}`;

    if (elasticity.rSquared) {
      responseMessage += `\n\n**Model Fit (R-squared):** ${(elasticity.rSquared * 100).toFixed(1)}%`;
    }

    return {
      message: responseMessage,
      data: elasticity,
      suggestedQuestions: [
        'What price maximizes revenue given this elasticity?',
        'Show me volume uplift predictions',
        'Compare elasticity across products'
      ]
    };
  }

  /**
   * Compare different scenarios
   */
  async compareScenarios(tenantId, params, context) {
    const productId = params.productId || context.productId;

    if (!productId) {
      return {
        message: 'To compare scenarios, please specify a product. I can then show you different price points and their expected outcomes side by side.',
        suggestedQuestions: [
          'Compare prices for my top product',
          'Which price point is best for Product X?'
        ]
      };
    }

    const product = await Product.findById(productId);
    if (!product) {
      return { message: 'Product not found.' };
    }

    const analysis = await priceElasticityService.suggestOptimalPrices(tenantId, productId, {
      steps: 5
    });

    let responseMessage = `**Scenario Comparison for ${product.name}**\n\n`;
    responseMessage += `| Price | Volume | Revenue | Profit | Margin |\n`;
    responseMessage += `|-------|--------|---------|--------|--------|\n`;

    for (const scenario of analysis.scenarios || []) {
      responseMessage += `| R${scenario.price} | ${scenario.predictedVolume} | R${scenario.revenue?.toLocaleString()} | R${scenario.profit?.toLocaleString()} | ${scenario.margin}% |\n`;
    }

    responseMessage += `\n**Best for Revenue:** R${analysis.recommendations?.forMaxRevenue?.price}\n`;
    responseMessage += `**Best for Profit:** R${analysis.recommendations?.forMaxProfit?.price}`;

    return {
      message: responseMessage,
      data: analysis,
      suggestedQuestions: [
        'Explain the trade-offs between these options',
        'What if I want to maximize volume instead?',
        'Show me the elasticity behind these predictions'
      ]
    };
  }

  /**
   * Handle general promotion-related queries
   */
  async handleGeneralPromotionQuery(tenantId, message, context) {
    const lowerMessage = message.toLowerCase();

    // Greeting
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return {
        message: `Hello! I'm your Promotion AI Assistant. I can help you with:

**Gross Benefit Analysis** - Calculate the incremental profit from promotions or price changes
**Volume Uplift Predictions** - Predict how volume changes at different price points
**Price Optimization** - Find the optimal price to maximize revenue or profit
**ROI Analysis** - Understand promotion return on investment
**Price Elasticity** - Learn how price-sensitive your products are

I use machine learning on your actual sales history to make these predictions. What would you like to know?`,
        suggestedQuestions: [
          'What is the gross benefit for my top product?',
          'Show me volume uplift predictions',
          'Which products are most price sensitive?'
        ]
      };
    }

    // Help
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return {
        message: `**I can help you with:**

1. **Gross Benefit** - "What's the gross benefit if I price Product X at R25?"
2. **Volume Uplift** - "What volume uplift can I expect at R30?"
3. **Optimal Pricing** - "What's the best price for maximum profit?"
4. **ROI Analysis** - "What's the ROI on my current promotions?"
5. **Elasticity** - "How price sensitive is Product X?"

Just ask me in natural language! I learn from your actual sales data to make predictions.`,
        suggestedQuestions: [
          'Analyze gross benefit for my products',
          'Show me price optimization suggestions',
          'Which promotions have the best ROI?'
        ]
      };
    }

    // Default response
    return {
      message: `I understand you're asking about promotions. I can help you analyze:

- **Gross benefit** of price changes or promotions
- **Volume uplift** predictions at different price points
- **Optimal pricing** recommendations
- **ROI** of your promotions
- **Price elasticity** of your products

Could you be more specific? For example: "What's the gross benefit if I reduce the price of Product X by 10%?"`,
      suggestedQuestions: [
        'What is gross benefit?',
        'Show me volume uplift for my products',
        'Recommend optimal prices'
      ]
    };
  }

  /**
   * Get conversation history for a user
   */
  getConversationHistory(tenantId, userId) {
    const conversationKey = `${tenantId}_${userId}`;
    return this.conversationHistory.get(conversationKey) || [];
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory(tenantId, userId) {
    const conversationKey = `${tenantId}_${userId}`;
    this.conversationHistory.delete(conversationKey);
    return { message: 'Conversation history cleared' };
  }
}

module.exports = new PromotionAIAssistant();
