import apiClient from './apiClient';

const securityService = {
  // Authentication (align with backend /api/auth)
  login: (credentials) => apiClient.post('/auth/login', credentials),
  logout: () => apiClient.post('/auth/logout'),
  refreshToken: () => apiClient.post('/auth/refresh-token'),

  // Multi-Factor Authentication (align with backend)
  enableMFA: (token) => apiClient.post('/auth/enable-2fa', { token }),
  disableMFA: (password) => apiClient.post('/auth/disable-2fa', { password }),
  verifyMFA: (token) => apiClient.post('/auth/verify-2fa', { token }),

  // Security Dashboard & Events (mounted at /api/security)
  getSecurityDashboard: (params = {}) => apiClient.get('/security/dashboard', { params }),
  getSecurityEvents: (params = {}) => apiClient.get('/security/events', { params }),
  getAuditLogs: (params = {}) => apiClient.get('/security/audit-logs', { params }),

  // Roles & Permissions
  getRoles: () => apiClient.get('/security/roles'),
  getRole: (id) => apiClient.get(`/security/roles/${id}`),
  createRole: (data) => apiClient.post('/security/roles', data),
  updateRole: (id, data) => apiClient.put(`/security/roles/${id}`, data),
  deleteRole: (id) => apiClient.delete(`/security/roles/${id}`),

  getPermissions: () => apiClient.get('/security/permissions'),
  createPermission: (data) => apiClient.post('/security/permissions', data),
  updatePermission: (id, data) => apiClient.put(`/security/permissions/${id}`, data),
  deletePermission: (id) => apiClient.delete(`/security/permissions/${id}`),

  // Permission check
  checkPermission: (resource, action, context = {}) =>
    apiClient.post('/security/permissions/check', { resource, action, context }),

  // Policies and metrics
  getSecurityPolicies: () => apiClient.get('/security/policies'),
  updateSecurityPolicies: (data) => apiClient.put('/security/policies', data),
  getSecurityMetrics: () => apiClient.get('/security/metrics'),

  // Password validation
  validatePassword: (password) => apiClient.post('/security/password/validate', { password }),

  // Users (admin-protected)
  getUsers: (params = {}) => apiClient.get('/users', { params }),
  getUser: (id) => apiClient.get(`/users/${id}`),
  createUser: (data) => apiClient.post('/users', data),
  updateUser: (id, data) => apiClient.put(`/users/${id}`, data),
  deleteUser: (id) => apiClient.delete(`/users/${id}`),
};

export default securityService;