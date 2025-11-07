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
router.use('/activity-grid', activityGridRoutes);
router.use('/trading-terms', tradingTermsRoutes);
router.use('/enterprise', enterpriseRoutes);
router.use('/super-admin', superAdminRoutes);
router.use('/reports', reportRoutes);
router.use('/ml', mlRoutes);
router.use('/integrations', integrationRoutes);
router.use('/sap', sapRoutes);
router.use('/security', securityRoutes);

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
