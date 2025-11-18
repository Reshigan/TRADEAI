import apiClient from '../../lib/axios';

export interface RealtimeEvent {
  id: string;
  type: 'update' | 'create' | 'delete' | 'notification';
  resource: string;
  resourceId: string;
  data: any;
  userId?: string;
  timestamp: string;
}

export interface CollaborationSession {
  id: string;
  resource: string;
  resourceId: string;
  participants: {
    userId: string;
    userName: string;
    joinedAt: string;
    isActive: boolean;
  }[];
  createdAt: string;
}

class RealtimeService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<(event: RealtimeEvent) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string) {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
    this.ws = new WebSocket(`${wsUrl}?token=${token}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const data: RealtimeEvent = JSON.parse(event.data);
      this.notifySubscribers(data);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.attemptReconnect(token);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscribers.clear();
  }

  private attemptReconnect(token: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
        this.connect(token);
      }, 1000 * Math.pow(2, this.reconnectAttempts));
    }
  }

  subscribe(channel: string, callback: (event: RealtimeEvent) => void) {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel)!.add(callback);

    // Send subscribe message to server
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'subscribe', channel }));
    }

    return () => this.unsubscribe(channel, callback);
  }

  unsubscribe(channel: string, callback: (event: RealtimeEvent) => void) {
    const channelSubs = this.subscribers.get(channel);
    if (channelSubs) {
      channelSubs.delete(callback);
      if (channelSubs.size === 0) {
        this.subscribers.delete(channel);
        // Send unsubscribe message to server
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ action: 'unsubscribe', channel }));
        }
      }
    }
  }

  private notifySubscribers(event: RealtimeEvent) {
    const channel = `${event.resource}:${event.type}`;
    const channelSubs = this.subscribers.get(channel);
    if (channelSubs) {
      channelSubs.forEach((callback) => callback(event));
    }

    // Also notify wildcard subscribers
    const wildcardSubs = this.subscribers.get(`${event.resource}:*`);
    if (wildcardSubs) {
      wildcardSubs.forEach((callback) => callback(event));
    }
  }

  async joinCollaboration(resource: string, resourceId: string) {
    const response = await apiClient.post('/realtime/collaborate/join', {
      resource,
      resourceId,
    });
    return response.data;
  }

  async leaveCollaboration(sessionId: string) {
    const response = await apiClient.post(`/realtime/collaborate/${sessionId}/leave`);
    return response.data;
  }

  async getActiveCollaborators(resource: string, resourceId: string) {
    const response = await apiClient.get('/realtime/collaborate/active', {
      params: { resource, resourceId },
    });
    return response.data;
  }

  broadcastPresence(resource: string, resourceId: string, action: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          action: 'presence',
          resource,
          resourceId,
          data: { action },
        })
      );
    }
  }
}

export const realtimeService = new RealtimeService();
export default realtimeService;
