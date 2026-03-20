/**
 * Main Routes Index
 * Centralized route management for TRADEAI API
 */

const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./auth');
const userRoutes = require('./user');
const dashboardRoutes = require('./dashboard');
const analyticsRoutes = require('./analytics');
const budgetRoutes = require('./budget');
const tradeSpendRoutes = require('./tradeSpend');
const promotionRoutes = require('./promotion');
const productRoutes = require('./product');
const customerRoutes = require('./customer');
const activityGridRoutes = require('./activityGrid');
const tradingTermsRoutes = require('./tradingTermsRoutes');
const enterpriseRoutes = require('./enterprise');
const superAdminRoutes = require('./superAdmin');
const reportRoutes = require('./report');
const mlRoutes = require('./ml');
const healthRoutes = require('./health');
const integrationRoutes = require('./integration');
const sapRoutes = require('./sap');
const securityRoutes = require('./security');

// Company Admin Routes
const companyAdminRoutes = require('./companyAdmin');

// Claims & Deductions Routes
const claimsRoutes = require('./claims');
const deductionsRoutes = require('./deductions');

// NEW: AI Promotion Routes
const aiPromotionRoutes = require('./aiPromotion');

// AI Chatbot Routes
const aiChatbotRoutes = require('./aiChatbot');

// NEW: Production ML AI Routes
const aiRoutes = require('./ai');

// Transaction Routes
const transactionRoutes = require('./transaction');

// POS Import Routes
const posImportRoutes = require('./posImport');

// Baseline Calculation Routes
const baselineRoutes = require('./baseline');

// Cannibalization Analysis Routes
const cannibalizationRoutes = require('./cannibalization');

// Forward Buy Detection Routes
const forwardBuyRoutes = require('./forwardBuy');

// Rebate Routes
const rebateRoutes = require('./rebate');

// Trade Spend Analytics Routes
const tradeSpendAnalyticsRoutes = require('./tradeSpendAnalytics');

// Data Lineage and Governance Routes
const dataLineageRoutes = require('./dataLineageRoutes');

// Webhook Routes
const webhookRoutes = require('./webhookRoutes');

// SSO Routes
const ssoRoutes = require('./ssoRoutes');

// Allocation Routes
const allocationRoutes = require('./allocationRoutes');

// Health check (no auth required)
router.use('/health', healthRoutes);

// Authentication routes (no auth required for login/register)
router.use('/auth', authRoutes);

// Protected routes (require authentication)
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/budgets', budgetRoutes);
router.use('/trade-spend', tradeSpendRoutes);
router.use('/promotions', promotionRoutes);
router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/activity-grid', activityGridRoutes);
router.use('/trading-terms', tradingTermsRoutes);
router.use('/enterprise', enterpriseRoutes);
router.use('/super-admin', superAdminRoutes);
router.use('/reports', reportRoutes);
router.use('/reporting', reportRoutes);
router.use('/ml', mlRoutes);
router.use('/integrations', integrationRoutes);
router.use('/sap', sapRoutes);
router.use('/security', securityRoutes);

// Company Admin Routes
router.use('/company-admin', companyAdminRoutes);

// Claims & Deductions Routes
router.use('/claims', claimsRoutes);
router.use('/deductions', deductionsRoutes);

// Settlements reconciliation endpoint (used by frontend Reconciliation page)
router.get('/settlements/reconciliation', require('../middleware/auth').authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.company;
    const db = req.env?.DB;
    if (!db) {
      return res.json({ success: true, data: { total_claims: 0, total_deductions: 0, matched_amount: 0, unmatched_amount: 0, match_rate: 0 } });
    }
    const claimsResult = await db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM claims WHERE company_id = ?').bind(tenantId).first();
    const deductionsResult = await db.prepare('SELECT COALESCE(SUM(amount), 0) as total, COALESCE(SUM(CASE WHEN matched_status = ? THEN amount ELSE 0 END), 0) as matched FROM deductions WHERE company_id = ?').bind('Matched', tenantId).first();
    const totalClaims = claimsResult?.total || 0;
    const totalDeductions = deductionsResult?.total || 0;
    const matched = deductionsResult?.matched || 0;
    const unmatched = totalDeductions - matched;
    res.json({ success: true, data: { total_claims: totalClaims, total_deductions: totalDeductions, matched_amount: matched, unmatched_amount: unmatched, match_rate: totalDeductions > 0 ? ((matched / totalDeductions) * 100) : 0 } });
  } catch (error) {
    console.error('Error fetching reconciliation data:', error);
    res.json({ success: true, data: { total_claims: 0, total_deductions: 0, matched_amount: 0, unmatched_amount: 0, match_rate: 0 } });
  }
});

// NEW: AI-Powered Promotion Routes
router.use('/ai-promotion', aiPromotionRoutes);

// AI Chatbot Routes
router.use('/ai-chatbot', aiChatbotRoutes);

// Production ML AI Routes (demand forecasting, price optimization, etc.)
router.use('/ai', aiRoutes);

// Transaction Routes
router.use('/transactions', transactionRoutes);

// POS Import Routes
router.use('/pos-import', posImportRoutes);

// Baseline Calculation Routes
router.use('/baseline', baselineRoutes);

// Cannibalization Analysis Routes
router.use('/cannibalization', cannibalizationRoutes);

// Forward Buy Detection Routes
router.use('/forward-buy', forwardBuyRoutes);

// Rebate Routes
router.use('/rebates', rebateRoutes);

// Trade Spend Analytics Routes
router.use('/trade-spend-analytics', tradeSpendAnalyticsRoutes);

// Data Lineage and Governance Routes
router.use('/data-lineage', dataLineageRoutes);

// Webhook Routes
router.use('/webhooks', webhookRoutes);

// SSO Routes (no auth required for login/callback)
router.use('/sso', ssoRoutes);

// Allocation Routes (hierarchy-based proportional allocation)
router.use('/allocations', allocationRoutes);

// API documentation endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'TRADEAI API v2.1.3',
    status: 'operational',
    features: {
      core: [
        'authentication',
        'dashboard',
        'analytics',
        'budgets',
        'trade-spend',
        'promotions',
        'activity-grid',
        'trading-terms'
      ],
      advanced: [
        'ai-promotion-validation',
        'ai-suggestion-generation',
        'ml-predictions',
        'real-time-analytics'
      ],
      enterprise: [
        'multi-tenant',
        'super-admin',
        'advanced-security',
        'enterprise-reporting'
      ],
      governance: [
        'data-lineage',
        'baseline-methodology',
        'variance-reason-codes',
        'reconciliation'
      ]
    },
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      dashboard: '/api/dashboard',
      analytics: '/api/analytics',
      aiPromotion: '/api/ai-promotion',
      ml: '/api/ml',
      enterprise: '/api/enterprise'
    },
    aiCapabilities: {
      promotionValidation: '/api/ai-promotion/validate-uplift',
      aiSuggestions: '/api/ai-promotion/generate-suggestions',
      fullSimulation: '/api/ai-promotion/run-simulation',
      modelStatus: '/api/ai-promotion/model-status'
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    availableEndpoints: [
      '/api/health',
      '/api/auth',
      '/api/dashboard',
      '/api/analytics',
      '/api/ai-promotion',
      '/api/ml',
      '/api/enterprise'
    ]
  });
});

module.exports = router;
