const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const config = require('../config');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }

  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: config.cors.origin,
        credentials: true
      }
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user || !user.isActive) {
          return next(new Error('Invalid user'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    // Connection handling
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    logger.info('Socket.IO service initialized');
  }

  handleConnection(socket) {
    const userId = socket.userId;

    // Store connection
    this.connectedUsers.set(userId, socket.id);

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Join role-based room
    socket.join(`role:${socket.user.role}`);

    // Join customer rooms if KAM
    if (socket.user.assignedCustomers && socket.user.assignedCustomers.length > 0) {
      socket.user.assignedCustomers.forEach((customerId) => {
        socket.join(`customer:${customerId}`);
      });
    }

    logger.info(`User ${socket.user.email} connected`, { socketId: socket.id });

    // Handle events
    this.setupEventHandlers(socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.connectedUsers.delete(userId);
      logger.info(`User ${socket.user.email} disconnected`, { socketId: socket.id });
    });
  }

  setupEventHandlers(socket) {
    // Dashboard subscription
    socket.on('subscribe:dashboard', (data) => {
      const { dashboardType } = data;
      socket.join(`dashboard:${dashboardType}`);
      socket.emit('subscribed', { dashboardType });
    });

    // Notification acknowledgment
    socket.on('notification:ack', async (data) => {
      const { notificationId } = data;
      // Mark notification as read in database
      logger.info(`Notification ${notificationId} acknowledged by user ${socket.userId}`);
    });

    // Real-time collaboration
    socket.on('document:lock', async (data) => {
      const { documentType, documentId } = data;
      const room = `document:${documentType}:${documentId}`;

      // Check if document is already locked
      const rooms = this.io.sockets.adapter.rooms.get(room);
      if (rooms && rooms.size > 0) {
        socket.emit('document:lock:failed', {
          documentType,
          documentId,
          reason: 'Document is already being edited'
        });
        return;
      }

      socket.join(room);
      socket.emit('document:lock:success', { documentType, documentId });

      // Notify others
      socket.broadcast.emit('document:locked', {
        documentType,
        documentId,
        lockedBy: `${socket.user.firstName} ${socket.user.lastName}`
      });
    });

    socket.on('document:unlock', (data) => {
      const { documentType, documentId } = data;
      const room = `document:${documentType}:${documentId}`;

      socket.leave(room);

      // Notify others
      socket.broadcast.emit('document:unlocked', {
        documentType,
        documentId
      });
    });

    // Activity tracking
    socket.on('activity:track', (data) => {
      const { action, resource } = data;
      logger.info('User activity', {
        userId: socket.userId,
        action,
        resource,
        timestamp: new Date()
      });
    });
  }

  // Emit events to specific users/rooms
  emitToUser(userId, event, data) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  emitToRole(role, event, data) {
    this.io.to(`role:${role}`).emit(event, data);
  }

  emitToCustomer(customerId, event, data) {
    this.io.to(`customer:${customerId}`).emit(event, data);
  }

  emitToDashboard(dashboardType, event, data) {
    this.io.to(`dashboard:${dashboardType}`).emit(event, data);
  }

  // Broadcast events
  broadcastDashboardUpdate(dashboardType, updateData) {
    this.emitToDashboard(dashboardType, 'dashboard:update', updateData);
  }

  broadcastApprovalNotification(approvalData) {
    const { level, documentType, documentId, documentName } = approvalData;

    this.emitToRole(level, 'approval:new', {
      type: documentType,
      id: documentId,
      name: documentName,
      timestamp: new Date()
    });
  }

  broadcastPromotionUpdate(promotionData) {
    const { customerId, promotionId, status } = promotionData;

    this.emitToCustomer(customerId, 'promotion:update', {
      promotionId,
      status,
      timestamp: new Date()
    });
  }

  broadcastBudgetAlert(alertData) {
    const { budgetId, alertType, message, severity } = alertData;

    // Emit to finance and management
    ['finance', 'director', 'board'].forEach((role) => {
      this.emitToRole(role, 'budget:alert', {
        budgetId,
        alertType,
        message,
        severity,
        timestamp: new Date()
      });
    });
  }

  // Get connection stats
  getConnectionStats() {
    return {
      totalConnections: this.connectedUsers.size,
      connectedUsers: Array.from(this.connectedUsers.keys()),
      rooms: this.io.sockets.adapter.rooms
    };
  }

  // Cleanup
  disconnect() {
    if (this.io) {
      this.io.close();
      logger.info('Socket.IO service disconnected');
    }
  }
}

module.exports = new SocketService();
