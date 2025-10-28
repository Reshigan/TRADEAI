/**
 * Notification API Routes
 * Phase 3 - Real-time Notifications
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const { catchAsync } = require('../../middleware/errorHandler');
const notificationService = require('../services/notificationService');

/**
 * @route   GET /api/notifications/stream
 * @desc    Server-Sent Events stream for real-time notifications
 * @access  Private
 */
router.get('/stream',
  protect,
  (req, res) => {
    notificationService.registerClient(req.user._id, res);
  }
);

/**
 * @route   GET /api/notifications
 * @desc    Get user's notification history
 * @access  Private
 */
router.get('/',
  protect,
  catchAsync(async (req, res) => {
    const { unreadOnly, limit } = req.query;
    
    const notifications = notificationService.getNotifications(req.user._id, {
      unreadOnly: unreadOnly === 'true',
      limit: parseInt(limit) || 50
    });
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  })
);

/**
 * @route   POST /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.post('/:id/read',
  protect,
  catchAsync(async (req, res) => {
    const notification = notificationService.markAsRead(
      req.user._id,
      parseInt(req.params.id)
    );
    
    res.status(200).json({
      success: true,
      data: notification
    });
  })
);

/**
 * @route   POST /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.post('/read-all',
  protect,
  catchAsync(async (req, res) => {
    const result = notificationService.markAllAsRead(req.user._id);
    
    res.status(200).json({
      success: true,
      data: result
    });
  })
);

/**
 * @route   DELETE /api/notifications
 * @desc    Clear notification history
 * @access  Private
 */
router.delete('/',
  protect,
  catchAsync(async (req, res) => {
    const result = notificationService.clearNotifications(req.user._id);
    
    res.status(200).json({
      success: true,
      data: result
    });
  })
);

/**
 * @route   GET /api/notifications/stats
 * @desc    Get notification statistics (Admin only)
 * @access  Private (Admin)
 */
router.get('/stats',
  protect,
  catchAsync(async (req, res) => {
    // Only admin can see global stats
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const stats = notificationService.getStatistics();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  })
);

module.exports = router;
