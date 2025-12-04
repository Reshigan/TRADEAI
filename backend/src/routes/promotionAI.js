/**
 * Promotion AI Assistant Routes
 * API endpoints for conversational AI that explains gross benefit and volume uplift
 */

const express = require('express');
const router = express.Router();
const promotionAIAssistant = require('../services/promotionAIAssistant');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth.authenticate);

/**
 * @route POST /api/promotion-ai/chat
 * @desc Send a message to the Promotion AI Assistant
 * @access Private
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    // Handle companyId being either an object or string
    const tenantId = req.user.companyId?._id || req.user.companyId;
    const userId = req.user._id;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const response = await promotionAIAssistant.chat(
      tenantId,
      userId,
      message,
      context || {}
    );

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Promotion AI chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message',
      details: error.message
    });
  }
});

/**
 * @route POST /api/promotion-ai/gross-benefit
 * @desc Get gross benefit analysis for a product/price
 * @access Private
 */
router.post('/gross-benefit', async (req, res) => {
  try {
    const { productId, price } = req.body;
    // Handle companyId being either an object or string
    const tenantId = req.user.companyId?._id || req.user.companyId;
    const userId = req.user._id;

    const response = await promotionAIAssistant.chat(
      tenantId,
      userId,
      `What is the gross benefit for product ${productId} at price R${price}?`,
      { productId, proposedPrice: price }
    );

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Gross benefit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate gross benefit',
      details: error.message
    });
  }
});

/**
 * @route POST /api/promotion-ai/volume-uplift
 * @desc Get volume uplift prediction for a product/price
 * @access Private
 */
router.post('/volume-uplift', async (req, res) => {
  try {
    const { productId, price } = req.body;
    // Handle companyId being either an object or string
    const tenantId = req.user.companyId?._id || req.user.companyId;
    const userId = req.user._id;

    const response = await promotionAIAssistant.chat(
      tenantId,
      userId,
      `What is the volume uplift for product ${productId} at price R${price}?`,
      { productId, proposedPrice: price }
    );

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Volume uplift error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to predict volume uplift',
      details: error.message
    });
  }
});

/**
 * @route POST /api/promotion-ai/optimal-price
 * @desc Get optimal price recommendation for a product
 * @access Private
 */
router.post('/optimal-price', async (req, res) => {
  try {
    const { productId } = req.body;
    // Handle companyId being either an object or string
    const tenantId = req.user.companyId?._id || req.user.companyId;
    const userId = req.user._id;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'productId is required'
      });
    }

    const response = await promotionAIAssistant.chat(
      tenantId,
      userId,
      `What is the optimal price for product ${productId}?`,
      { productId }
    );

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Optimal price error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suggest optimal price',
      details: error.message
    });
  }
});

/**
 * @route GET /api/promotion-ai/history
 * @desc Get conversation history
 * @access Private
 */
router.get('/history', async (req, res) => {
  try {
    // Handle companyId being either an object or string
    const tenantId = req.user.companyId?._id || req.user.companyId;
    const userId = req.user._id;

    const history = promotionAIAssistant.getConversationHistory(tenantId, userId);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation history',
      details: error.message
    });
  }
});

/**
 * @route DELETE /api/promotion-ai/history
 * @desc Clear conversation history
 * @access Private
 */
router.delete('/history', async (req, res) => {
  try {
    // Handle companyId being either an object or string
    const tenantId = req.user.companyId?._id || req.user.companyId;
    const userId = req.user._id;

    const result = promotionAIAssistant.clearConversationHistory(tenantId, userId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear conversation history',
      details: error.message
    });
  }
});

module.exports = router;
