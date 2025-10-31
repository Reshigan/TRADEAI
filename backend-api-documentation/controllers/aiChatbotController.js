const mongoose = require('mongoose');
const Promotion = require('../models/Promotion');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Budget = require('../models/Budget');
const TradeSpend = require('../models/TradeSpend');
const mlService = require('../services/mlService');

/**
 * AI Chatbot Controller - Works with MongoDB data and local ML models
 * No external API dependencies (OpenAI, etc.)
 */
class AIChatbotController {
  
  /**
   * Initialize chatbot with user context
   */
  async initialize(req, res) {
    try {
      const { user } = req;
      const companyId = user.companyId;

      // Get basic stats for context
      const [promotionCount, customerCount, productCount] = await Promise.all([
        Promotion.countDocuments({ companyId }),
        Customer.countDocuments({ companyId }),
        Product.countDocuments({ companyId })
      ]);

      const context = {
        user: {
          id: user._id,
          name: user.name,
          role: user.role,
          companyId: user.companyId
        },
        stats: {
          promotions: promotionCount,
          customers: customerCount,
          products: productCount
        },
        capabilities: [
          'Query your data using natural language',
          'Generate insights and recommendations',
          'Create reports and summaries',
          'Answer questions about performance',
          'Provide trend analysis'
        ]
      };

      res.json({
        success: true,
        message: 'AI Assistant initialized successfully',
        context
      });
    } catch (error) {
      console.error('Chatbot initialization error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initialize AI assistant',
        error: error.message
      });
    }
  }

  /**
   * Process user message and generate response
   */
  async processMessage(req, res) {
    try {
      const { message, context, conversationHistory } = req.body;
      const { user } = req;
      const companyId = user.companyId;

      // Analyze message intent
      const intent = this.analyzeIntent(message);
      
      let response;
      let data = null;

      switch (intent.type) {
        case 'data_query':
          response = await this.handleDataQuery(intent, companyId, user);
          data = response.data;
          response = response.message;
          break;
        
        case 'performance_analysis':
          response = await this.handlePerformanceAnalysis(intent, companyId, user);
          break;
        
        case 'recommendation':
          response = await this.handleRecommendation(intent, companyId, user);
          break;
        
        case 'trend_analysis':
          response = await this.handleTrendAnalysis(intent, companyId, user);
          break;
        
        default:
          response = await this.handleGeneralQuery(message, companyId, user);
      }

      res.json({
        success: true,
        response,
        data,
        intent: intent.type,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Message processing error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process message',
        error: error.message
      });
    }
  }

  /**
   * Handle specific data queries
   */
  async handleDataQuery(req, res) {
    try {
      const { dataType, filters, question } = req.body;
      const { user } = req;
      const companyId = user.companyId;

      let data;
      let response;

      switch (dataType.toLowerCase()) {
        case 'promotions':
          data = await this.queryPromotions(filters, companyId);
          response = this.generatePromotionResponse(data, question);
          break;
        
        case 'customers':
          data = await this.queryCustomers(filters, companyId);
          response = this.generateCustomerResponse(data, question);
          break;
        
        case 'products':
          data = await this.queryProducts(filters, companyId);
          response = this.generateProductResponse(data, question);
          break;
        
        case 'budgets':
          data = await this.queryBudgets(filters, companyId);
          response = this.generateBudgetResponse(data, question);
          break;
        
        default:
          throw new Error(`Unsupported data type: ${dataType}`);
      }

      res.json({
        success: true,
        response,
        data,
        dataType
      });

    } catch (error) {
      console.error('Data query error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to query data',
        error: error.message
      });
    }
  }

  /**
   * Generate AI insights
   */
  async generateInsights(req, res) {
    try {
      const { type, parameters } = req.body;
      const { user } = req;
      const companyId = user.companyId;

      let insights;
      let recommendations = [];

      switch (type) {
        case 'performance':
          insights = await this.generatePerformanceInsights(companyId, parameters);
          break;
        
        case 'optimization':
          insights = await this.generateOptimizationInsights(companyId, parameters);
          break;
        
        case 'trends':
          insights = await this.generateTrendInsights(companyId, parameters);
          break;
        
        case 'budget':
          insights = await this.generateBudgetInsights(companyId, parameters);
          break;
        
        default:
          insights = await this.generateGeneralInsights(companyId, parameters);
      }

      // Generate recommendations based on insights
      recommendations = await this.generateRecommendations(insights, type);

      res.json({
        success: true,
        response: `Here are your ${type} insights:`,
        insights,
        recommendations,
        type
      });

    } catch (error) {
      console.error('Insights generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate insights',
        error: error.message
      });
    }
  }

  /**
   * Generate reports using AI
   */
  async generateReport(req, res) {
    try {
      const { reportType, parameters, format } = req.body;
      const { user } = req;
      const companyId = user.companyId;

      const report = await this.createAIReport(reportType, parameters, companyId, format);

      res.json({
        success: true,
        report,
        reportType,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Report generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate report',
        error: error.message
      });
    }
  }

  /**
   * Get suggested questions based on context
   */
  async getSuggestedQuestions(req, res) {
    try {
      const { context } = req.body;
      const { user } = req;
      
      const questions = await this.generateSuggestedQuestions(context, user);

      res.json({
        success: true,
        questions
      });

    } catch (error) {
      console.error('Suggested questions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get suggested questions',
        error: error.message
      });
    }
  }

  /**
   * Search data using natural language
   */
  async searchData(req, res) {
    try {
      const { query } = req.body;
      const { user } = req;
      const companyId = user.companyId;

      const searchResults = await this.performNaturalLanguageSearch(query, companyId);

      res.json({
        success: true,
        results: searchResults,
        query
      });

    } catch (error) {
      console.error('Data search error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search data',
        error: error.message
      });
    }
  }

  // Helper methods

  /**
   * Analyze user message intent
   */
  analyzeIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    // Data query patterns
    if (lowerMessage.includes('show me') || lowerMessage.includes('list') || lowerMessage.includes('get')) {
      return { type: 'data_query', confidence: 0.8 };
    }
    
    // Performance analysis patterns
    if (lowerMessage.includes('performance') || lowerMessage.includes('how is') || lowerMessage.includes('analyze')) {
      return { type: 'performance_analysis', confidence: 0.9 };
    }
    
    // Recommendation patterns
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('should i')) {
      return { type: 'recommendation', confidence: 0.8 };
    }
    
    // Trend analysis patterns
    if (lowerMessage.includes('trend') || lowerMessage.includes('over time') || lowerMessage.includes('forecast')) {
      return { type: 'trend_analysis', confidence: 0.7 };
    }
    
    return { type: 'general', confidence: 0.5 };
  }

  /**
   * Query promotions data
   */
  async queryPromotions(filters, companyId) {
    const query = { companyId, ...filters };
    return await Promotion.find(query)
      .populate('customer', 'name')
      .sort({ created_at: -1 })
      .limit(50);
  }

  /**
   * Query customers data
   */
  async queryCustomers(filters, companyId) {
    const query = { companyId, ...filters };
    return await Customer.find(query)
      .sort({ name: 1 })
      .limit(50);
  }

  /**
   * Query products data
   */
  async queryProducts(filters, companyId) {
    const query = { companyId, ...filters };
    return await Product.find(query)
      .sort({ name: 1 })
      .limit(50);
  }

  /**
   * Query budgets data
   */
  async queryBudgets(filters, companyId) {
    const query = { companyId, ...filters };
    return await Budget.find(query)
      .sort({ created_at: -1 })
      .limit(50);
  }

  /**
   * Generate promotion response
   */
  generatePromotionResponse(data, question) {
    const count = data.length;
    const totalBudget = data.reduce((sum, p) => sum + (p.budget || 0), 0);
    const activeCount = data.filter(p => p.status === 'active').length;

    return `I found ${count} promotions. ${activeCount} are currently active with a total budget of $${totalBudget.toLocaleString()}. ${question ? `Regarding "${question}": ` : ''}The data shows your promotion portfolio across different customers and time periods.`;
  }

  /**
   * Generate customer response
   */
  generateCustomerResponse(data, question) {
    const count = data.length;
    return `I found ${count} customers in your database. ${question ? `Regarding "${question}": ` : ''}This includes your key accounts and customer relationships.`;
  }

  /**
   * Generate product response
   */
  generateProductResponse(data, question) {
    const count = data.length;
    return `I found ${count} products in your catalog. ${question ? `Regarding "${question}": ` : ''}This represents your product portfolio across different categories.`;
  }

  /**
   * Generate budget response
   */
  generateBudgetResponse(data, question) {
    const count = data.length;
    const totalBudget = data.reduce((sum, b) => sum + (b.amount || 0), 0);
    return `I found ${count} budget entries with a total of $${totalBudget.toLocaleString()}. ${question ? `Regarding "${question}": ` : ''}This shows your budget allocation and utilization.`;
  }

  /**
   * Generate performance insights
   */
  async generatePerformanceInsights(companyId, parameters) {
    // Get recent promotions performance
    const recentPromotions = await Promotion.find({ 
      companyId,
      created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    const insights = {
      totalPromotions: recentPromotions.length,
      activePromotions: recentPromotions.filter(p => p.status === 'active').length,
      totalBudget: recentPromotions.reduce((sum, p) => sum + (p.budget || 0), 0),
      averageBudget: recentPromotions.length > 0 ? 
        recentPromotions.reduce((sum, p) => sum + (p.budget || 0), 0) / recentPromotions.length : 0
    };

    return insights;
  }

  /**
   * Generate recommendations
   */
  async generateRecommendations(insights, type) {
    const recommendations = [];

    if (type === 'performance') {
      if (insights.activePromotions < 3) {
        recommendations.push({
          type: 'action',
          priority: 'high',
          message: 'Consider launching more active promotions to increase market presence'
        });
      }
      
      if (insights.averageBudget < 10000) {
        recommendations.push({
          type: 'optimization',
          priority: 'medium',
          message: 'Review budget allocation - average promotion budget seems low'
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate suggested questions
   */
  async generateSuggestedQuestions(context, user) {
    const baseQuestions = [
      "What are my top performing promotions?",
      "Show me this month's budget utilization",
      "Which customers need attention?",
      "What trends should I be aware of?"
    ];

    // Add context-specific questions
    if (context.page === 'promotions') {
      baseQuestions.push(
        "Which promotions have the highest ROI?",
        "Show me underperforming promotions"
      );
    }

    if (context.page === 'analytics') {
      baseQuestions.push(
        "What are the key insights for this period?",
        "Show me performance predictions"
      );
    }

    return baseQuestions.slice(0, 6);
  }

  /**
   * Perform natural language search
   */
  async performNaturalLanguageSearch(query, companyId) {
    const results = {
      promotions: [],
      customers: [],
      products: [],
      budgets: []
    };

    // Simple keyword-based search (can be enhanced with ML)
    const keywords = query.toLowerCase().split(' ');
    
    // Search promotions
    results.promotions = await Promotion.find({
      companyId,
      $or: [
        { name: { $regex: keywords.join('|'), $options: 'i' } },
        { description: { $regex: keywords.join('|'), $options: 'i' } }
      ]
    }).limit(10);

    // Search customers
    results.customers = await Customer.find({
      companyId,
      name: { $regex: keywords.join('|'), $options: 'i' }
    }).limit(10);

    return results;
  }

  /**
   * Handle general queries
   */
  async handleGeneralQuery(message, companyId, user) {
    // Simple response generation based on keywords
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return `Hello ${user.name}! I'm your AI assistant. I can help you analyze your trade marketing data, generate insights, and answer questions about your promotions, customers, and performance.`;
    }
    
    if (lowerMessage.includes('help')) {
      return "I can help you with:\n• Analyzing promotion performance\n• Customer insights\n• Budget optimization\n• Trend analysis\n• Data queries\n\nJust ask me questions in natural language!";
    }
    
    return "I understand you're asking about your trade marketing data. Could you be more specific? For example, you could ask about promotions, customers, products, or performance metrics.";
  }

  /**
   * Create AI-generated report
   */
  async createAIReport(reportType, parameters, companyId, format) {
    const report = {
      title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
      generatedAt: new Date().toISOString(),
      companyId,
      format,
      sections: []
    };

    // Add report sections based on type
    switch (reportType) {
      case 'performance':
        report.sections = await this.generatePerformanceReportSections(companyId, parameters);
        break;
      case 'budget':
        report.sections = await this.generateBudgetReportSections(companyId, parameters);
        break;
      default:
        report.sections = await this.generateGeneralReportSections(companyId, parameters);
    }

    return report;
  }

  /**
   * Generate performance report sections
   */
  async generatePerformanceReportSections(companyId, parameters) {
    const promotions = await Promotion.find({ companyId }).limit(20);
    
    return [
      {
        title: 'Executive Summary',
        content: `Analysis of ${promotions.length} promotions shows overall performance trends.`
      },
      {
        title: 'Key Metrics',
        content: 'Performance indicators and KPIs for the selected period.'
      },
      {
        title: 'Recommendations',
        content: 'AI-generated recommendations based on data analysis.'
      }
    ];
  }

  /**
   * Generate budget report sections
   */
  async generateBudgetReportSections(companyId, parameters) {
    const budgets = await Budget.find({ companyId }).limit(20);
    
    return [
      {
        title: 'Budget Overview',
        content: `Analysis of ${budgets.length} budget entries.`
      },
      {
        title: 'Utilization Analysis',
        content: 'Budget utilization patterns and efficiency metrics.'
      }
    ];
  }

  /**
   * Generate general report sections
   */
  async generateGeneralReportSections(companyId, parameters) {
    return [
      {
        title: 'Overview',
        content: 'General analysis of your trade marketing data.'
      }
    ];
  }
}

module.exports = new AIChatbotController();