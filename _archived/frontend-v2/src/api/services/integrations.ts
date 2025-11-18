import apiClient from '../../lib/axios';

export interface Integration {
  id: string;
  name: string;
  type: 'api' | 'webhook' | 'database' | 'file' | 'custom';
  provider: string;
  status: 'active' | 'inactive' | 'error' | 'configuring';
  config: {
    apiKey?: string;
    endpoint?: string;
    webhookUrl?: string;
    syncFrequency?: 'realtime' | 'hourly' | 'daily' | 'weekly';
    dataMapping?: any;
  };
  lastSync?: string;
  nextSync?: string;
  syncStatus?: 'success' | 'failed' | 'in_progress';
  errorCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEvent {
  id: string;
  integrationId: string;
  event: string;
  payload: any;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  lastAttempt?: string;
  nextRetry?: string;
  createdAt: string;
}

class IntegrationsService {
  private baseUrl = '/integrations';

  async getIntegrations() {
    const response = await apiClient.get<{ data: Integration[] }>(this.baseUrl);
    return response.data;
  }

  async getIntegration(id: string) {
    const response = await apiClient.get<{ data: Integration }>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createIntegration(integration: Omit<Integration, 'id' | 'createdAt' | 'updatedAt' | 'errorCount'>) {
    const response = await apiClient.post<{ data: Integration }>(this.baseUrl, integration);
    return response.data;
  }

  async updateIntegration(id: string, data: Partial<Integration>) {
    const response = await apiClient.put<{ data: Integration }>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async deleteIntegration(id: string) {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  async testIntegration(id: string) {
    const response = await apiClient.post(`${this.baseUrl}/${id}/test`);
    return response.data;
  }

  async syncIntegration(id: string) {
    const response = await apiClient.post(`${this.baseUrl}/${id}/sync`);
    return response.data;
  }

  async getWebhookEvents(integrationId?: string) {
    const response = await apiClient.get<{ data: WebhookEvent[] }>(`${this.baseUrl}/webhooks`, {
      params: { integrationId },
    });
    return response.data;
  }

  async retryWebhook(eventId: string) {
    const response = await apiClient.post(`${this.baseUrl}/webhooks/${eventId}/retry`);
    return response.data;
  }

  async getAvailableProviders() {
    const response = await apiClient.get(`${this.baseUrl}/providers`);
    return response.data;
  }
}

export const integrationsService = new IntegrationsService();
export default integrationsService;
