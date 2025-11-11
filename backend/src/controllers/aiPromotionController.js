/**
 * AI Promotion Controller
 * Handles AI-powered promotion validation and suggestions
 */

const AIPromotionValidationService = require('../services/aiPromotionValidationService');

class AIPromotionController {
    constructor() {
        this.aiService = new AIPromotionValidationService();
    }

    /**
     * Validate promotion uplift using ML
     */
    async validateUplift(req, res) {
        try {
            const promotionData = req.body;
            
            // Validate required fields
            const requiredFields = ['productId', 'currentPrice', 'proposedPrice', 'expectedUplift', 'category'];
            const missingFields = requiredFields.filter(field => !promotionData[field]);
            
            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    missingFields
                });
            }

            // Add default values
            promotionData.duration = promotionData.duration || 14;
            promotionData.historicalData = promotionData.historicalData || {
                averageUplift: 20,
                dataPoints: 10,
                promotions: []
            };

            const validationResult = await this.aiService.validatePromotionUplift(promotionData);

            res.json({
                success: true,
                data: {
                    validation: validationResult,
                    promotionData: promotionData,
                    timestamp: new Date().toISOString(),
                    modelVersion: '1.0'
                }
            });

        } catch (error) {
            console.error('Uplift validation error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to validate promotion uplift',
                details: error.message
            });
        }
    }

    /**
     * Generate AI-powered promotion suggestions
     */
    async generateSuggestions(req, res) {
        try {
            const promotionData = req.body;
            
            // Validate required fields
            const requiredFields = ['productId', 'currentPrice', 'proposedPrice', 'category'];
            const missingFields = requiredFields.filter(field => !promotionData[field]);
            
            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    missingFields
                });
            }

            // Add default values
            promotionData.duration = promotionData.duration || 14;
            promotionData.historicalData = promotionData.historicalData || {
                averageUplift: 20,
                dataPoints: 10,
                promotions: []
            };

            const suggestions = await this.aiService.generatePromotionSuggestions(promotionData);

            res.json({
                success: true,
                data: {
                    ...suggestions,
                    timestamp: new Date().toISOString(),
                    modelVersion: '1.0',
                    llmModel: 'mistral:7b'
                }
            });

        } catch (error) {
            console.error('AI suggestion generation error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate AI suggestions',
                details: error.message
            });
        }
    }

    /**
     * Run complete promotion simulation with AI
     */
    async runSimulation(req, res) {
        try {
            const simulationData = req.body;
            
            // Validate required fields
            const requiredFields = ['productId', 'currentPrice', 'proposedPrice', 'expectedUplift', 'category'];
            const missingFields = requiredFields.filter(field => !simulationData[field]);
            
            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    missingFields
                });
            }

            // Add simulation parameters
            simulationData.duration = simulationData.duration || 14;
            simulationData.historicalData = simulationData.historicalData || {
                averageUplift: 20,
                dataPoints: 10,
                promotions: []
            };

            // Run validation
            const validation = await this.aiService.validatePromotionUplift(simulationData);
            
            // Generate AI suggestions
            const suggestions = await this.aiService.generatePromotionSuggestions(simulationData);

            // Calculate financial projections
            const financialProjections = this.calculateFinancialProjections(simulationData, validation, suggestions);

            // Generate simulation report
            const simulationReport = {
                originalPromotion: {
                    ...simulationData,
                    validation: validation,
                    financialProjection: financialProjections.original
                },
                aiSuggestions: suggestions.aiSuggestions,
                comparison: {
                    bestSuggestion: suggestions.aiSuggestions.suggestions[suggestions.aiSuggestions.improvements.bestSuggestionIndex] || null,
                    improvementSummary: suggestions.aiSuggestions.improvements,
                    riskAssessment: suggestions.aiSuggestions.risks
                },
                financialImpact: financialProjections.comparison,
                recommendations: this.generateExecutiveRecommendations(validation, suggestions),
                metadata: {
                    timestamp: new Date().toISOString(),
                    modelVersion: '1.0',
                    llmModel: 'mistral:7b',
                    simulationId: this.generateSimulationId()
                }
            };

            res.json({
                success: true,
                data: simulationReport
            });

        } catch (error) {
            console.error('Simulation error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to run promotion simulation',
                details: error.message
            });
        }
    }

    /**
     * Get AI model status and capabilities
     */
    async getModelStatus(req, res) {
        try {
            // Check Ollama status
            const axios = require('axios');
            let ollamaStatus = 'unknown';
            let availableModels = [];

            try {
                const response = await axios.get('http://localhost:11434/api/tags');
                ollamaStatus = 'online';
                availableModels = response.data.models || [];
            } catch (error) {
                ollamaStatus = 'offline';
            }

            const status = {
                aiService: {
                    status: 'online',
                    capabilities: [
                        'promotion_uplift_validation',
                        'ai_suggestion_generation',
                        'price_elasticity_analysis',
                        'risk_assessment',
                        'financial_projections'
                    ]
                },
                llmService: {
                    status: ollamaStatus,
                    provider: 'ollama',
                    model: 'mistral:7b',
                    availableModels: availableModels.map(m => m.name)
                },
                mlModels: {
                    upliftValidation: { status: 'loaded', version: '1.0' },
                    priceElasticity: { status: 'loaded', version: '1.0' },
                    competitorAnalysis: { status: 'loaded', version: '1.0' }
                },
                lastUpdated: new Date().toISOString()
            };

            res.json({
                success: true,
                data: status
            });

        } catch (error) {
            console.error('Model status error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get model status',
                details: error.message
            });
        }
    }

    /**
     * Calculate financial projections
     */
    calculateFinancialProjections(promotionData, validation, suggestions) {
        const { currentPrice, proposedPrice, expectedUplift } = promotionData;
        const baseVolume = 1000; // Assume base volume for calculations
        
        // Original promotion projections
        const originalRevenue = baseVolume * (1 + expectedUplift / 100) * proposedPrice;
        const originalCost = baseVolume * (1 + expectedUplift / 100) * (proposedPrice * 0.6); // Assume 60% cost
        const originalProfit = originalRevenue - originalCost;

        // Best AI suggestion projections
        const bestSuggestion = suggestions.aiSuggestions?.suggestions?.[0];
        let aiRevenue = originalRevenue;
        let aiCost = originalCost;
        let aiProfit = originalProfit;

        if (bestSuggestion) {
            aiRevenue = baseVolume * (1 + bestSuggestion.expectedUplift / 100) * bestSuggestion.recommendedPrice;
            aiCost = baseVolume * (1 + bestSuggestion.expectedUplift / 100) * (bestSuggestion.recommendedPrice * 0.6);
            aiProfit = aiRevenue - aiCost;
        }

        return {
            original: {
                revenue: Math.round(originalRevenue),
                cost: Math.round(originalCost),
                profit: Math.round(originalProfit),
                margin: Math.round((originalProfit / originalRevenue) * 100)
            },
            comparison: {
                revenueImprovement: Math.round(aiRevenue - originalRevenue),
                profitImprovement: Math.round(aiProfit - originalProfit),
                marginImprovement: Math.round(((aiProfit / aiRevenue) - (originalProfit / originalRevenue)) * 100),
                roiImprovement: Math.round(((aiProfit - originalProfit) / originalProfit) * 100)
            }
        };
    }

    /**
     * Generate executive recommendations
     */
    generateExecutiveRecommendations(validation, suggestions) {
        const recommendations = [];

        if (validation.isUnrealistic) {
            recommendations.push({
                priority: 'high',
                category: 'validation',
                recommendation: 'Original promotion uplift appears unrealistic based on ML analysis',
                action: 'Consider implementing AI-suggested alternatives'
            });
        }

        if (validation.confidence < 0.7) {
            recommendations.push({
                priority: 'medium',
                category: 'data_quality',
                recommendation: 'Low confidence in predictions due to limited historical data',
                action: 'Collect more historical promotion data to improve accuracy'
            });
        }

        if (suggestions.aiSuggestions?.improvements?.averageRoiImprovement > 10) {
            recommendations.push({
                priority: 'high',
                category: 'optimization',
                recommendation: `AI suggestions show potential ${suggestions.aiSuggestions.improvements.averageRoiImprovement}% ROI improvement`,
                action: 'Implement top AI suggestion for better results'
            });
        }

        return recommendations;
    }

    /**
     * Generate unique simulation ID
     */
    generateSimulationId() {
        return 'sim_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

module.exports = new AIPromotionController();
