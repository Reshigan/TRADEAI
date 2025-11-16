const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { monitoringEvents } = require('../controllers/monitoringController');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map of userId -> WebSocket connections
    this.rooms = new Map(); // Map of roomId -> Set of userIds
  }

  initialize(server) {
    this.wss = new WebSocket.Server({
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.setupMonitoringEventHandlers();

    console.log('WebSocket service initialized');
  }

  verifyClient(info) {
    try {
      const token = new URL(info.req.url, 'http://localhost').searchParams.get('token');
      if (!token) return false;

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      info.req.user = decoded;
      return true;
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      return false;
    }
  }

  handleConnection(ws, req) {
    const user = req.user;
    const userId = user.id;
    const companyId = user.companyId;

    console.log(`WebSocket connection established for user ${userId}`);

    // Store client connection
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(ws);

    // Join company room
    const companyRoom = `company_${companyId}`;
    this.joinRoom(userId, companyRoom);

    // Send welcome message
    this.sendToClient(ws, {
      type: 'connection',
      message: 'Connected to Trade AI monitoring',
      timestamp: new Date(),
      userId,
      companyId
    });

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleMessage(ws, user, message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Handle connection close
    ws.on('close', () => {
      console.log(`WebSocket connection closed for user ${userId}`);
      this.removeClient(userId, ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
      this.removeClient(userId, ws);
    });
  }

  handleMessage(ws, user, message) {
    const { type, data } = message;

    switch (type) {
      case 'subscribe':
        this.handleSubscription(user.id, data);
        break;
      case 'unsubscribe':
        this.handleUnsubscription(user.id, data);
        break;
      case 'ping':
        this.sendToClient(ws, { type: 'pong', timestamp: new Date() });
        break;
      case 'request_dashboard':
        this.sendDashboardUpdate(user.companyId);
        break;
      default:
        console.log(`Unknown message type: ${type}`);
    }
  }

  handleSubscription(userId, data) {
    const { channels } = data;

    channels.forEach((channel) => {
      this.joinRoom(userId, channel);
    });

    console.log(`User ${userId} subscribed to channels:`, channels);
  }

  handleUnsubscription(userId, data) {
    const { channels } = data;

    channels.forEach((channel) => {
      this.leaveRoom(userId, channel);
    });

    console.log(`User ${userId} unsubscribed from channels:`, channels);
  }

  joinRoom(userId, roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(userId);
  }

  leaveRoom(userId, roomId) {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(userId);
      if (this.rooms.get(roomId).size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  removeClient(userId, ws) {
    if (this.clients.has(userId)) {
      this.clients.get(userId).delete(ws);
      if (this.clients.get(userId).size === 0) {
        this.clients.delete(userId);

        // Remove user from all rooms
        this.rooms.forEach((users, roomId) => {
          users.delete(userId);
          if (users.size === 0) {
            this.rooms.delete(roomId);
          }
        });
      }
    }
  }

  sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  sendToUser(userId, message) {
    if (this.clients.has(userId)) {
      this.clients.get(userId).forEach((ws) => {
        this.sendToClient(ws, message);
      });
    }
  }

  sendToRoom(roomId, message) {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).forEach((userId) => {
        this.sendToUser(userId, message);
      });
    }
  }

  broadcastToCompany(companyId, message) {
    const roomId = `company_${companyId}`;
    this.sendToRoom(roomId, message);
  }

  setupMonitoringEventHandlers() {
    // Handle monitoring alerts
    monitoringEvents.on('alert', (data) => {
      this.broadcastToCompany(data.companyId, {
        type: 'alert',
        data: data.alert,
        timestamp: data.timestamp
      });
    });

    // Handle metric updates
    monitoringEvents.on('metric_update', (data) => {
      this.broadcastToCompany(data.companyId, {
        type: 'metric_update',
        data: data.metrics,
        timestamp: data.timestamp
      });
    });

    // Handle system events
    monitoringEvents.on('system_event', (data) => {
      this.sendToRoom('system_admins', {
        type: 'system_event',
        data: data.event,
        timestamp: data.timestamp
      });
    });

    // Handle promotion updates
    monitoringEvents.on('promotion_update', (data) => {
      this.broadcastToCompany(data.companyId, {
        type: 'promotion_update',
        data: data.promotion,
        timestamp: data.timestamp
      });
    });

    // Handle budget updates
    monitoringEvents.on('budget_update', (data) => {
      this.broadcastToCompany(data.companyId, {
        type: 'budget_update',
        data: data.budget,
        timestamp: data.timestamp
      });
    });
  }

  // Send dashboard updates
  async sendDashboardUpdate(companyId) {
    try {
      // This would typically fetch real-time dashboard data
      const dashboardData = {
        activePromotions: Math.floor(Math.random() * 50) + 10,
        todaySpend: Math.floor(Math.random() * 100000) + 50000,
        budgetUtilization: Math.floor(Math.random() * 100),
        alerts: Math.floor(Math.random() * 10),
        timestamp: new Date()
      };

      this.broadcastToCompany(companyId, {
        type: 'dashboard_update',
        data: dashboardData,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error sending dashboard update:', error);
    }
  }

  // Periodic health check
  startHealthCheck() {
    setInterval(() => {
      this.clients.forEach((connections, userId) => {
        connections.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            this.sendToClient(ws, {
              type: 'heartbeat',
              timestamp: new Date()
            });
          } else {
            this.removeClient(userId, ws);
          }
        });
      });
    }, 30000); // Every 30 seconds
  }

  // Get connection statistics
  getStats() {
    return {
      totalConnections: Array.from(this.clients.values())
        .reduce((total, connections) => total + connections.size, 0),
      totalUsers: this.clients.size,
      totalRooms: this.rooms.size,
      roomDetails: Array.from(this.rooms.entries()).map(([roomId, users]) => ({
        roomId,
        userCount: users.size
      }))
    };
  }

  // Send notification to specific users
  sendNotification(userIds, notification) {
    userIds.forEach((userId) => {
      this.sendToUser(userId, {
        type: 'notification',
        data: notification,
        timestamp: new Date()
      });
    });
  }

  // Broadcast system maintenance message
  broadcastMaintenance(message, scheduledTime) {
    const maintenanceMessage = {
      type: 'system_maintenance',
      data: {
        message,
        scheduledTime,
        severity: 'info'
      },
      timestamp: new Date()
    };

    // Send to all connected clients
    this.clients.forEach((connections, userId) => {
      connections.forEach((ws) => {
        this.sendToClient(ws, maintenanceMessage);
      });
    });
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

module.exports = websocketService;
