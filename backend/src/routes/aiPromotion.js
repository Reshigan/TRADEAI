/**
 * AI Promotion Routes
 * Routes for AI-powered promotion validation and suggestions
 */

const express = require('express');
const router = express.Router();
const aiPromotionController = require('../controllers/aiPromotionController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth.authenticate);

/**
 * @route POST /api/ai-promotion/validate-uplift
 * @desc Validate promotion uplift using ML models
 * @access Private
 */
router.post('/validate-uplift', aiPromotionController.validateUplift);

/**
 * @route POST /api/ai-promotion/generate-suggestions
 * @desc Generate AI-powered promotion suggestions
 * @access Private
 */
router.post('/generate-suggestions', aiPromotionController.generateSuggestions);

/**
 * @route POST /api/ai-promotion/run-simulation
 * @desc Run complete promotion simulation with AI analysis
 * @access Private
 */
router.post('/run-simulation', aiPromotionController.runSimulation);

/**
 * @route GET /api/ai-promotion/model-status
 * @desc Get AI model status and capabilities
 * @access Private
 */
router.get('/model-status', aiPromotionController.getModelStatus);

/**
 * @route POST /api/ai-promotion/batch-validate
 * @desc Validate multiple promotions in batch
 * @access Private
 */
router.post('/batch-validate', async (req, res) => {
    try {
        const { promotions } = req.body;
        
        if (!Array.isArray(promotions)) {
            return res.status(400).json({
                success: false,
                error: 'Promotions must be an array'
            });
        }

        const results = [];
        for (const promotion of promotions) {
            try {
                const validation = await aiPromotionController.aiService.validatePromotionUplift(promotion);
                results.push({
                    promotionId: promotion.productId,
                    validation: validation,
                    success: true
                });
            } catch (error) {
                results.push({
                    promotionId: promotion.productId,
                    error: error.message,
                    success: false
                });
            }
        }

        res.json({
            success: true,
            data: {
                results: results,
                summary: {
                    total: promotions.length,
                    successful: results.filter(r => r.success).length,
                }
            }
        });

    } catch (error) {
        console.error('Batch validation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to run batch validation',
            details: error.message
        });
    }
});

module.exports = router;
