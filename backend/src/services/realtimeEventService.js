/**
 * REAL-TIME EVENT PROCESSING SERVICE
 * Event-driven architecture for transaction processing
 *
 * Features:
 * - WebSocket connections for real-time updates
 * - Event streaming and pub/sub
 * - Event sourcing for transactions
 * - Real-time notifications
 * - Event replay and debugging
 */

const EventEmitter = require('events');
const WebSocket = require('ws');

class RealtimeEventService extends EventEmitter {
  constructor() {
    super();
    this.clients = new Map(); // userId -> WebSocket connection
    this.eventStore = []; // Event sourcing store
    this.maxEventStoreSize = 10000;
    this.subscriptions = new Map(); // userId -> Set of event types
    this.eventHandlers = new Map();

    this.initializeEventHandlers();
  }

  /**
   * Initialize WebSocket server
   */
  initializeWebSocket(server) {
    this.wss = new WebSocket.Server({ server, path: '/ws' });

    this.wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection');

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('Invalid message:', error);
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        // Remove client from registry
        for (const [userId, client] of this.clients.entries()) {
          if (client === ws) {
            this.clients.delete(userId);
            console.log(`Client ${userId} disconnected`);
            break;
          }
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to TRADEAI real-time service',
        timestamp: new Date().toISOString()
      }));
    });

    console.log('WebSocket server initialized');
  }

  /**
   * Handle client messages
   */
  handleClientMessage(ws, data) {
    switch (data.type) {
      case 'authenticate':
        this.authenticateClient(ws, data.userId, data.token);
        break;

      case 'subscribe':
        this.subscribeClient(data.userId, data.events);
        break;

      case 'unsubscribe':
        this.unsubscribeClient(data.userId, data.events);
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;

      default:
        ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
  }

  /**
   * Authenticate WebSocket client
   */
  async authenticateClient(ws, userId, token) {
    try {
      // Validate token with JWT service
      const jwt = require('jsonwebtoken');
      const config = require('../config');
      const User = require('../models/User');

      const decoded = jwt.verify(token, config.jwt.secret, {
        algorithms: ['HS256']
      });

      const user = await User.findById(decoded.userId || decoded._id);
      if (!user || !user.isActive) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Authentication failed',
          timestamp: new Date().toISOString()
        }));
        ws.close();
        return;
      }

      this.clients.set(userId, ws);
      this.subscriptions.set(userId, new Set());

      ws.send(JSON.stringify({
        type: 'authenticated',
        userId,
        timestamp: new Date().toISOString()
      }));

      console.log(`Client ${userId} authenticated`);
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Authentication failed',
        timestamp: new Date().toISOString()
      }));
      ws.close();
    }
  }

  /**
   * Subscribe client to events
   */
  subscribeClient(userId, eventTypes) {
    const userSubs = this.subscriptions.get(userId) || new Set();

    eventTypes.forEach((eventType) => {
      userSubs.add(eventType);
    });

    this.subscriptions.set(userId, userSubs);

    const ws = this.clients.get(userId);
    if (ws) {
      ws.send(JSON.stringify({
        type: 'subscribed',
        events: eventTypes,
        timestamp: new Date().toISOString()
      }));
    }
  }

  /**
   * Unsubscribe client from events
   */
  unsubscribeClient(userId, eventTypes) {
    const userSubs = this.subscriptions.get(userId);
    if (!userSubs) return;

    eventTypes.forEach((eventType) => {
      userSubs.delete(eventType);
    });

    const ws = this.clients.get(userId);
    if (ws) {
      ws.send(JSON.stringify({
        type: 'unsubscribed',
        events: eventTypes,
        timestamp: new Date().toISOString()
      }));
    }
  }

  /**
   * Initialize event handlers
   */
  initializeEventHandlers() {
    // Transaction events
    this.registerEventHandler('transaction.po.created', this.handlePOCreated.bind(this));
    this.registerEventHandler('transaction.po.updated', this.handlePOUpdated.bind(this));
    this.registerEventHandler('transaction.po.approved', this.handlePOApproved.bind(this));

    this.registerEventHandler('transaction.invoice.created', this.handleInvoiceCreated.bind(this));
    this.registerEventHandler('transaction.invoice.matched', this.handleInvoiceMatched.bind(this));
    this.registerEventHandler('transaction.invoice.approved', this.handleInvoiceApproved.bind(this));

    this.registerEventHandler('transaction.payment.created', this.handlePaymentCreated.bind(this));
    this.registerEventHandler('transaction.payment.applied', this.handlePaymentApplied.bind(this));

    // Matching events
    this.registerEventHandler('matching.completed', this.handleMatchingCompleted.bind(this));
    this.registerEventHandler('matching.failed', this.handleMatchingFailed.bind(this));
    this.registerEventHandler('matching.exception', this.handleMatchingException.bind(this));

    // Dispute events
    this.registerEventHandler('dispute.created', this.handleDisputeCreated.bind(this));
    this.registerEventHandler('dispute.assigned', this.handleDisputeAssigned.bind(this));
    this.registerEventHandler('dispute.escalated', this.handleDisputeEscalated.bind(this));
    this.registerEventHandler('dispute.resolved', this.handleDisputeResolved.bind(this));

    // Accrual events
    this.registerEventHandler('accrual.calculated', this.handleAccrualCalculated.bind(this));
    this.registerEventHandler('accrual.variance', this.handleAccrualVariance.bind(this));
    this.registerEventHandler('accrual.reconciled', this.handleAccrualReconciled.bind(this));

    // Settlement events
    this.registerEventHandler('settlement.created', this.handleSettlementCreated.bind(this));
    this.registerEventHandler('settlement.approved', this.handleSettlementApproved.bind(this));
    this.registerEventHandler('settlement.reconciled', this.handleSettlementReconciled.bind(this));
  }

  /**
   * Register event handler
   */
  registerEventHandler(eventType, handler) {
    this.eventHandlers.set(eventType, handler);
    this.on(eventType, handler);
  }

  /**
   * Publish event to all subscribers
   */
  publishEvent(eventType, eventData) {
    // Store event for sourcing
    const event = {
      id: this.generateEventId(),
      type: eventType,
      data: eventData,
      timestamp: new Date().toISOString(),
      version: 1
    };

    this.storeEvent(event);

    // Emit event internally
    this.emit(eventType, event);

    // Broadcast to subscribed WebSocket clients
    this.broadcastToSubscribers(eventType, event);

    return event;
  }

  /**
   * Broadcast event to subscribed clients
   */
  broadcastToSubscribers(eventType, event) {
    for (const [userId, subscriptions] of this.subscriptions.entries()) {
      if (subscriptions.has(eventType) || subscriptions.has('*')) {
        const ws = this.clients.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'event',
            event: eventType,
            data: event.data,
            timestamp: event.timestamp
          }));
        }
      }
    }
  }

  /**
   * Store event in event store
   */
  storeEvent(event) {
    this.eventStore.push(event);

    // Trim event store if too large
    if (this.eventStore.length > this.maxEventStoreSize) {
      this.eventStore.shift();
    }
  }

  /**
   * Get event history
   */
  getEventHistory(filters = {}) {
    let events = [...this.eventStore];

    if (filters.type) {
      events = events.filter((e) => e.type === filters.type);
    }

    if (filters.since) {
      const since = new Date(filters.since);
      events = events.filter((e) => new Date(e.timestamp) >= since);
    }

    if (filters.entityId) {
      events = events.filter((e) => e.data.entityId === filters.entityId);
    }

    return events;
  }

  /**
   * Replay events
   */
  async replayEvents(eventIds, handler) {
    const events = this.eventStore.filter((e) => eventIds.includes(e.id));

    for (const event of events) {
      await handler(event);
    }
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Event Handlers

  async handlePOCreated(event) {
    console.log('PO Created:', event.data);
    // Send notification, trigger workflows, etc.
  }

  async handlePOUpdated(event) {
    console.log('PO Updated:', event.data);
  }

  async handlePOApproved(event) {
    console.log('PO Approved:', event.data);
    // Trigger accrual calculation
    this.publishEvent('accrual.trigger', {
      poId: event.data.entityId,
      reason: 'po_approved'
    });
  }

  async handleInvoiceCreated(event) {
    console.log('Invoice Created:', event.data);
    // Trigger auto-matching
    this.publishEvent('matching.trigger', {
      invoiceId: event.data.entityId,
      reason: 'invoice_created'
    });
  }

  async handleInvoiceMatched(event) {
    console.log('Invoice Matched:', event.data);
  }

  async handleInvoiceApproved(event) {
    console.log('Invoice Approved:', event.data);
    // Update accruals
    this.publishEvent('accrual.update', {
      invoiceId: event.data.entityId,
      reason: 'invoice_approved'
    });
  }

  async handlePaymentCreated(event) {
    console.log('Payment Created:', event.data);
    // Trigger auto-application
    this.publishEvent('payment.auto_apply', {
      paymentId: event.data.entityId
    });
  }

  async handlePaymentApplied(event) {
    console.log('Payment Applied:', event.data);
    // Check if settlement needed
    this.publishEvent('settlement.check', {
      customerId: event.data.customerId
    });
  }

  async handleMatchingCompleted(event) {
    console.log('Matching Completed:', event.data);
    // Send notification
  }

  async handleMatchingFailed(event) {
    console.log('Matching Failed:', event.data);
    // Create dispute or alert
    if (event.data.autoCreateDispute) {
      this.publishEvent('dispute.create', {
        source: 'matching_failure',
        data: event.data
      });
    }
  }

  async handleMatchingException(event) {
    console.log('Matching Exception:', event.data);
    // Alert user
  }

  async handleDisputeCreated(event) {
    console.log('Dispute Created:', event.data);
    // Assign to analyst
    this.publishEvent('dispute.assign', {
      disputeId: event.data.entityId
    });
  }

  async handleDisputeAssigned(event) {
    console.log('Dispute Assigned:', event.data);
    // Notify assignee
  }

  async handleDisputeEscalated(event) {
    console.log('Dispute Escalated:', event.data);
    // Notify manager
  }

  async handleDisputeResolved(event) {
    console.log('Dispute Resolved:', event.data);
    // Update related transactions
  }

  async handleAccrualCalculated(event) {
    console.log('Accrual Calculated:', event.data);
  }

  async handleAccrualVariance(event) {
    console.log('Accrual Variance Detected:', event.data);
    // Alert if variance > threshold
    if (Math.abs(event.data.variance) > 0.1) { // 10%
      this.publishEvent('alert.high_variance', event.data);
    }
  }

  async handleAccrualReconciled(event) {
    console.log('Accrual Reconciled:', event.data);
  }

  async handleSettlementCreated(event) {
    console.log('Settlement Created:', event.data);
  }

  async handleSettlementApproved(event) {
    console.log('Settlement Approved:', event.data);
    // Trigger bank reconciliation
    this.publishEvent('reconciliation.trigger', {
      settlementId: event.data.entityId
    });
  }

  async handleSettlementReconciled(event) {
    console.log('Settlement Reconciled:', event.data);
  }

  /**
   * Send notification to specific user
   */
  sendNotification(userId, notification) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'notification',
        data: notification,
        timestamp: new Date().toISOString()
      }));
    }
  }

  /**
   * Broadcast notification to all users
   */
  broadcastNotification(notification, filter = null) {
    for (const [userId, ws] of this.clients.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        if (!filter || filter(userId)) {
          ws.send(JSON.stringify({
            type: 'notification',
            data: notification,
            timestamp: new Date().toISOString()
          }));
        }
      }
    }
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount() {
    return this.clients.size;
  }

  /**
   * Get event statistics
   */
  getEventStatistics() {
    const stats = {
      totalEvents: this.eventStore.length,
      eventsByType: {},
      recentEvents: this.eventStore.slice(-10)
    };

    this.eventStore.forEach((event) => {
      stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;
    });

    return stats;
  }
}

module.exports = new RealtimeEventService();
