/**
 * WebSocket Service
 * Real-time communication and collaboration features
 */

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> WebSocket connection
    this.rooms = new Map(); // roomId -> Set of userIds
  }

  /**
   * Initialize WebSocket server
   * @param {object} server - HTTP server instance
   */
  initialize(server) {
    this.wss = new WebSocket.Server({ server, path: '/ws' });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    console.log('✓ WebSocket service initialized');
  }

  /**
   * Handle new WebSocket connection
   * @param {WebSocket} ws - WebSocket connection
   * @param {object} req - HTTP request
   */
  handleConnection(ws, req) {
    let userId = null;
    let authenticated = false;

    // Authentication handshake
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());

        // Handle authentication
        if (data.type === 'auth' && !authenticated) {
          const token = data.token;
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            userId = decoded.id;
            authenticated = true;

            // Store connection
            this.clients.set(userId, ws);

            // Send confirmation
            ws.send(JSON.stringify({
              type: 'auth_success',
              userId: userId,
              timestamp: new Date().toISOString()
            }));

            console.log(`WebSocket authenticated: User ${userId}`);
          } catch (error) {
            ws.send(JSON.stringify({
              type: 'auth_error',
              message: 'Invalid token'
            }));
            ws.close();
          }
          return;
        }

        // Require authentication for other messages
        if (!authenticated) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Authentication required'
          }));
          return;
        }

        // Handle different message types
        this.handleMessage(userId, ws, data);
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', () => {
      if (userId) {
        this.clients.delete(userId);
        this.leaveAllRooms(userId);
        console.log(`WebSocket disconnected: User ${userId}`);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  /**
   * Handle authenticated messages
   * @param {string} userId - User ID
   * @param {WebSocket} ws - WebSocket connection
   * @param {object} data - Message data
   */
  handleMessage(userId, ws, data) {
    switch (data.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;

      case 'join_room':
        this.joinRoom(userId, data.roomId);
        ws.send(JSON.stringify({
          type: 'room_joined',
          roomId: data.roomId
        }));
        break;

      case 'leave_room':
        this.leaveRoom(userId, data.roomId);
        ws.send(JSON.stringify({
          type: 'room_left',
          roomId: data.roomId
        }));
        break;

      case 'room_message':
        this.broadcastToRoom(data.roomId, {
          type: 'room_message',
          userId: userId,
          message: data.message,
          timestamp: new Date().toISOString()
        }, userId);
        break;

      case 'subscribe':
        // Subscribe to specific entity updates
        ws.send(JSON.stringify({
          type: 'subscribed',
          entity: data.entity,
          entityId: data.entityId
        }));
        break;

      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type'
        }));
    }
  }

  /**
   * Join a room (for collaboration)
   * @param {string} userId - User ID
   * @param {string} roomId - Room ID
   */
  joinRoom(userId, roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(userId);
  }

  /**
   * Leave a room
   * @param {string} userId - User ID
   * @param {string} roomId - Room ID
   */
  leaveRoom(userId, roomId) {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(userId);
      if (this.rooms.get(roomId).size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  /**
   * Leave all rooms
   * @param {string} userId - User ID
   */
  leaveAllRooms(userId) {
    this.rooms.forEach((users, roomId) => {
      users.delete(userId);
      if (users.size === 0) {
        this.rooms.delete(roomId);
      }
    });
  }

  /**
   * Send message to specific user
   * @param {string} userId - User ID
   * @param {object} message - Message data
   */
  sendToUser(userId, message) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  /**
   * Broadcast message to all users in a room
   * @param {string} roomId - Room ID
   * @param {object} message - Message data
   * @param {string} excludeUserId - User ID to exclude (optional)
   */
  broadcastToRoom(roomId, message, excludeUserId = null) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.forEach(userId => {
      if (userId !== excludeUserId) {
        this.sendToUser(userId, message);
      }
    });
  }

  /**
   * Broadcast to all connected users
   * @param {object} message - Message data
   */
  broadcast(message) {
    this.clients.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  /**
   * Notify about entity update
   * @param {string} entity - Entity type
   * @param {string} entityId - Entity ID
   * @param {string} action - Action type (created, updated, deleted)
   * @param {object} data - Entity data
   */
  notifyEntityUpdate(entity, entityId, action, data) {
    this.broadcast({
      type: 'entity_update',
      entity,
      entityId,
      action,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send real-time notification to user
   * @param {string} userId - User ID
   * @param {object} notification - Notification data
   */
  sendNotification(userId, notification) {
    this.sendToUser(userId, {
      type: 'notification',
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get connection status
   * @returns {object} Status information
   */
  getStatus() {
    return {
      connections: this.clients.size,
      rooms: this.rooms.size,
      status: 'operational'
    };
  }
}

module.exports = new WebSocketService();
