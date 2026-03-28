/**
 * WebSocket Service for Real-time Process Updates
 * World-class real-time communication with automatic reconnection,
 * message queuing, and event streaming
 */

import type { ProcessUpdateEvent, StepChangeEvent } from '../components/common/ProcessUI.types';

// ============================================================================
// Configuration
// ============================================================================

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8080/ws';
const RECONNECT_INTERVAL = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 10;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const MESSAGE_QUEUE_SIZE = 100;

// ============================================================================
// Types
// ============================================================================

type MessageHandler = (data: any) => void;

interface WSMessage {
  type: string;
  payload: any;
  timestamp: number;
  processId?: string;
  stepId?: string;
}

interface Subscription {
  processId: string;
  handler: MessageHandler;
  id: string;
}

// ============================================================================
// WebSocket Service Class
// ============================================================================

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageQueue: WSMessage[] = [];
  private subscriptions: Map<string, Subscription> = new Map();
  private eventHandlers: Map<string, MessageHandler[]> = new Map();
  private isConnected = false;
  private isConnecting = false;

  // ============================================================================
  // Connection Management
  // ============================================================================

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected || this.isConnecting) {
        resolve();
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket(WS_URL);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushMessageQueue();
          this.resubscribe();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('[WebSocket] Closed:', event.code, event.reason);
          this.isConnected = false;
          this.stopHeartbeat();
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          this.isConnecting = false;
          reject(error);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[WebSocket] Max reconnection attempts reached');
      this.emit('connection-lost', { attempts: this.reconnectAttempts });
      return;
    }

    this.reconnectAttempts++;
    const delay = RECONNECT_INTERVAL * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('[WebSocket] Reconnection failed:', error);
      }
    }, delay);
  }

  // ============================================================================
  // Heartbeat
  // ============================================================================

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.ws) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // ============================================================================
  // Message Handling
  // ============================================================================

  private handleMessage(message: WSMessage): void {
    // Handle pong responses
    if (message.type === 'pong') {
      return;
    }

    // Emit to specific process subscribers
    if (message.processId) {
      const subscription = this.subscriptions.get(message.processId);
      if (subscription) {
        subscription.handler(message.payload);
      }
    }

    // Emit to event handlers
    this.emit(message.type, message.payload);

    // Special handling for process updates
    if (message.type === 'process-update') {
      this.emit(`process:${message.processId}`, message.payload);
    }

    if (message.type === 'step-change') {
      this.emit(`step:${message.stepId}`, message.payload);
    }
  }

  send(message: WSMessage): void {
    const messageWithTimestamp = {
      ...message,
      timestamp: message.timestamp || Date.now(),
    };

    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(messageWithTimestamp));
      } catch (error) {
        console.error('[WebSocket] Failed to send message:', error);
        this.queueMessage(messageWithTimestamp);
      }
    } else {
      this.queueMessage(messageWithTimestamp);
    }
  }

  private queueMessage(message: WSMessage): void {
    if (this.messageQueue.length >= MESSAGE_QUEUE_SIZE) {
      this.messageQueue.shift(); // Remove oldest message
    }
    this.messageQueue.push(message);
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      if (message && this.ws) {
        try {
          this.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('[WebSocket] Failed to flush message:', error);
          this.messageQueue.unshift(message); // Put it back
          break;
        }
      }
    }
  }

  // ============================================================================
  // Subscription Management
  // ============================================================================

  subscribe(processId: string, handler: MessageHandler): () => void {
    const subscriptionId = `${processId}:${Date.now()}`;
    
    const subscription: Subscription = {
      processId,
      handler,
      id: subscriptionId,
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Subscribe on server side
    this.send({
      type: 'subscribe',
      payload: { processId },
      processId,
    });

    // Return unsubscribe function
    return () => {
      this.subscriptions.delete(subscriptionId);
      
      this.send({
        type: 'unsubscribe',
        payload: { processId, subscriptionId },
        processId,
      });
    };
  }

  private resubscribe(): void {
    for (const [_, subscription] of this.subscriptions) {
      this.send({
        type: 'subscribe',
        payload: { processId: subscription.processId },
        processId: subscription.processId,
      });
    }
  }

  // ============================================================================
  // Event System
  // ============================================================================

  on(event: string, handler: MessageHandler): () => void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);

    return () => {
      const currentHandlers = this.eventHandlers.get(event) || [];
      const index = currentHandlers.indexOf(handler);
      if (index > -1) {
        currentHandlers.splice(index, 1);
        this.eventHandlers.set(event, currentHandlers);
      }
    };
  }

  off(event: string, handler?: MessageHandler): void {
    if (!handler) {
      this.eventHandlers.delete(event);
      return;
    }

    const handlers = this.eventHandlers.get(event) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
      this.eventHandlers.set(event, handlers);
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`[WebSocket] Error in event handler for '${event}':`, error);
      }
    });
  }

  // ============================================================================
  // Process-Specific Methods
  // ============================================================================

  updateStep(processId: string, stepId: string, updates: Partial<StepChangeEvent>): void {
    this.send({
      type: 'step-update',
      payload: { stepId, updates },
      processId,
      stepId,
    });
  }

  advanceStep(processId: string, stepId: string): void {
    this.send({
      type: 'step-advance',
      payload: { stepId },
      processId,
      stepId,
    });
  }

  completeProcess(processId: string): void {
    this.send({
      type: 'process-complete',
      payload: { processId },
      processId,
    });
  }

  // ============================================================================
  // Status & Utilities
  // ============================================================================

  getStatus(): 'connecting' | 'connected' | 'disconnected' {
    if (this.isConnecting) return 'connecting';
    if (this.isConnected) return 'connected';
    return 'disconnected';
  }

  getConnectionInfo(): {
    connected: boolean;
    reconnectAttempts: number;
    queuedMessages: number;
    subscriptions: number;
  } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      subscriptions: this.subscriptions.size,
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

const wsService = new WebSocketService();

export default wsService;

// ============================================================================
// React Hook
// ============================================================================

import { useEffect, useState, useCallback } from 'react';

export function useWebSocket(processId: string, enabled = true) {
  const [isConnected, setIsConnected] = useState(wsService.getStatus() === 'connected');
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    wsService.on('connection-open', handleConnect);
    wsService.on('connection-closed', handleDisconnect);

    return () => {
      wsService.off('connection-open', handleConnect);
      wsService.off('connection-closed', handleDisconnect);
    };
  }, [enabled]);

  const handleMessage = useCallback((data: any) => {
    setLastMessage(data);
  }, []);

  useEffect(() => {
    if (!enabled || !processId) return;

    const unsubscribe = wsService.subscribe(processId, handleMessage);

    return () => {
      unsubscribe();
    };
  }, [processId, enabled, handleMessage]);

  const sendMessage = useCallback((message: Omit<WSMessage, 'timestamp'>) => {
    wsService.send(message as WSMessage);
  }, []);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    status: wsService.getStatus(),
  };
}

// ============================================================================
// Export Types
// ============================================================================

export type { WSMessage, Subscription, MessageHandler };
