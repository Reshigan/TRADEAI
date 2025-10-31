import axios from '../axios';

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

export const adminService = {
  // User Management
  getUsers: async (): Promise<User[]> => {
    const response = await axios.get('/admin/users');
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await axios.get(`/admin/users/${id}`);
    return response.data;
  },

  createUser: async (data: Partial<User>): Promise<User> => {
    const response = await axios.post('/admin/users', data);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await axios.put(`/admin/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await axios.delete(`/admin/users/${id}`);
  },

  // Role Management
  getRoles: async (): Promise<Role[]> => {
    const response = await axios.get('/admin/roles');
    return response.data;
  },

  createRole: async (data: Partial<Role>): Promise<Role> => {
    const response = await axios.post('/admin/roles', data);
    return response.data;
  },

  updateRole: async (id: string, data: Partial<Role>): Promise<Role> => {
    const response = await axios.put(`/admin/roles/${id}`, data);
    return response.data;
  },

  deleteRole: async (id: string): Promise<void> => {
    await axios.delete(`/admin/roles/${id}`);
  },

  // System Monitoring
  getSystemHealth: async (): Promise<SystemHealth> => {
    const response = await axios.get('/admin/system/health');
    return response.data;
  },

  getAuditLogs: async (filters?: any) => {
    const response = await axios.get('/admin/audit-logs', { params: filters });
    return response.data;
  },

  getSystemSettings: async () => {
    const response = await axios.get('/admin/settings');
    return response.data;
  },

  updateSystemSettings: async (settings: any) => {
    const response = await axios.put('/admin/settings', settings);
    return response.data;
  },
};
