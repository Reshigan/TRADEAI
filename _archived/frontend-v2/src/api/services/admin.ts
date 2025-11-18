import apiClient from '../../lib/axios';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  tenantId: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Role {
  _id: string;
  name: string;
  permissions: string[];
  description: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  memory: { used: number; total: number };
  cpu: number;
  database: { status: string; latency: number };
  services: { name: string; status: string }[];
}

export interface AuditLog {
  _id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  status: 'success' | 'failure';
}

export interface SystemSettings {
  maintenance: {
    enabled: boolean;
    message?: string;
    scheduledStart?: string;
    scheduledEnd?: string;
  };
  security: {
    passwordMinLength: number;
    passwordRequireSpecialChar: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    mfaEnabled: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    slackEnabled: boolean;
    webhookUrl?: string;
  };
  features: {
    aiInsights: boolean;
    mlPredictions: boolean;
    realTimeSync: boolean;
    advancedAnalytics: boolean;
  };
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'users' | 'roles' | 'data' | 'system' | 'reports';
}

export const adminService = {
  // User Management
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get('/admin/users');
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data;
  },

  createUser: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.post('/admin/users', data);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await apiClient.put(`/admin/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${id}`);
  },

  // Role Management
  getRoles: async (): Promise<Role[]> => {
    const response = await apiClient.get('/admin/roles');
    return response.data;
  },

  createRole: async (data: Partial<Role>): Promise<Role> => {
    const response = await apiClient.post('/admin/roles', data);
    return response.data;
  },

  updateRole: async (id: string, data: Partial<Role>): Promise<Role> => {
    const response = await apiClient.put(`/admin/roles/${id}`, data);
    return response.data;
  },

  deleteRole: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/roles/${id}`);
  },

  // System Monitoring
  getSystemHealth: async (): Promise<SystemHealth> => {
    const response = await apiClient.get('/admin/system/health');
    return response.data;
  },

  getAuditLogs: async (filters?: any) => {
    const response = await apiClient.get('/admin/audit-logs', { params: filters });
    return response.data;
  },

  getSystemSettings: async () => {
    const response = await apiClient.get('/admin/settings');
    return response.data;
  },

  updateSystemSettings: async (settings: any) => {
    const response = await apiClient.put('/admin/settings', settings);
    return response.data;
  },

  // Permission Management
  getPermissions: async (): Promise<Permission[]> => {
    const response = await apiClient.get('/admin/permissions');
    return response.data;
  },

  // User Actions
  activateUser: async (id: string): Promise<User> => {
    const response = await apiClient.post(`/admin/users/${id}/activate`);
    return response.data;
  },

  deactivateUser: async (id: string): Promise<User> => {
    const response = await apiClient.post(`/admin/users/${id}/deactivate`);
    return response.data;
  },

  resetUserPassword: async (id: string): Promise<{ temporaryPassword: string }> => {
    const response = await apiClient.post(`/admin/users/${id}/reset-password`);
    return response.data;
  },

  // Analytics
  getUserStats: async () => {
    const response = await apiClient.get('/admin/stats/users');
    return response.data;
  },

  getActivityStats: async (period: 'day' | 'week' | 'month' | 'year') => {
    const response = await apiClient.get('/admin/stats/activity', { params: { period } });
    return response.data;
  },
};
