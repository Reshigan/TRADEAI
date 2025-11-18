import apiClient from '../../lib/axios';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'system' | 'user' | 'promotion' | 'order' | 'alert';
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  read: boolean;
  userId: string;
  createdAt: string;
  readAt?: string;
  metadata?: any;
}

export interface NotificationPreferences {
  userId: string;
  email: {
    enabled: boolean;
    frequency: 'realtime' | 'daily' | 'weekly';
    categories: string[];
  };
  inApp: {
    enabled: boolean;
    categories: string[];
  };
  push: {
    enabled: boolean;
    categories: string[];
  };
}

class NotificationsService {
  private baseUrl = '/notifications';

  async getNotifications(filters?: {
    read?: boolean;
    category?: string;
    limit?: number;
  }) {
    const response = await apiClient.get<{ data: Notification[] }>(this.baseUrl, {
      params: filters,
    });
    return response.data;
  }

  async getUnreadCount() {
    const response = await apiClient.get<{ count: number }>(`${this.baseUrl}/unread/count`);
    return response.data.count;
  }

  async markAsRead(notificationId: string) {
    const response = await apiClient.put(`${this.baseUrl}/${notificationId}/read`);
    return response.data;
  }

  async markAllAsRead() {
    const response = await apiClient.put(`${this.baseUrl}/read-all`);
    return response.data;
  }

  async deleteNotification(notificationId: string) {
    await apiClient.delete(`${this.baseUrl}/${notificationId}`);
  }

  async getPreferences() {
    const response = await apiClient.get<{ data: NotificationPreferences }>(
      `${this.baseUrl}/preferences`
    );
    return response.data;
  }

  async updatePreferences(preferences: Partial<NotificationPreferences>) {
    const response = await apiClient.put(`${this.baseUrl}/preferences`, preferences);
    return response.data;
  }

  async sendNotification(notification: {
    userId: string;
    type: string;
    title: string;
    message: string;
    category?: string;
  }) {
    const response = await apiClient.post(this.baseUrl, notification);
    return response.data;
  }

  async subscribeToWebPush(subscription: PushSubscription) {
    const response = await apiClient.post(`${this.baseUrl}/push/subscribe`, subscription);
    return response.data;
  }

  async unsubscribeFromWebPush() {
    const response = await apiClient.post(`${this.baseUrl}/push/unsubscribe`);
    return response.data;
  }
}

export const notificationsService = new NotificationsService();
export default notificationsService;
