const express = require('express');
const router = express.Router();
const aiChatbotController = require('../controllers/aiChatbotController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

/**
 * @route   GET /api/ai/chatbot/initialize
 * @desc    Initialize AI chatbot with user context
 * @access  Private
 */
router.get('/initialize', aiChatbotController.initialize);

/**
 * @route   POST /api/ai/chatbot/message
 * @desc    Send message to AI chatbot
 * @access  Private
 */
router.post('/message', aiChatbotController.processMessage);

/**
 * @route   POST /api/ai/chatbot/data-query
 * @desc    Query specific data using AI
 * @access  Private
 */
router.post('/data-query', aiChatbotController.handleDataQuery);

/**
 * @route   POST /api/ai/chatbot/insights
 * @desc    Generate AI insights and recommendations
 * @access  Private
 */
router.post('/insights', aiChatbotController.generateInsights);

/**
 * @route   POST /api/ai/chatbot/generate-report
 * @desc    Generate reports using AI
 * @access  Private
 */
router.post('/generate-report', aiChatbotController.generateReport);

/**
 * @route   POST /api/ai/chatbot/suggested-questions
 * @desc    Get suggested questions based on context
 * @access  Private
 */
router.post('/suggested-questions', aiChatbotController.getSuggestedQuestions);

/**
 * @route   POST /api/ai/chatbot/search
 * @desc    Search data using natural language
 * @access  Private
 */
router.post('/search', aiChatbotController.searchData);

module.exports = router;