import apiClient from './apiClient';

const securityService = {
  // Authentication
  login: (credentials) => {
    return apiClient.post('/api/v1/auth/login', credentials);
  },

  logout: () => {
    return apiClient.post('/api/v1/auth/logout');
  },

  refreshToken: () => {
    return apiClient.post('/api/v1/auth/refresh');
  },

  // Multi-Factor Authentication
  setupMFA: () => {
    return apiClient.post('/api/v1/auth/mfa/setup');
  },

  enableMFA: (token) => {
    return apiClient.post('/api/v1/auth/mfa/enable', { token });
  },

  disableMFA: (token) => {
    return apiClient.post('/api/v1/auth/mfa/disable', { token });
  },

  verifyMFA: (userId, token, mfaToken) => {
    return apiClient.post('/api/v1/auth/mfa/verify', { userId, token, mfaToken });
  },

  // Security Overview
  getSecurityOverview: () => {
    return apiClient.get('/api/v1/security/overview');
  },

  // Security Events
  getSecurityEvents: (params = {}) => {
    return apiClient.get('/api/v1/security/events', { params });
  },

  getSecurityEvent: (eventId) => {
    return apiClient.get(`/api/v1/security/events/${eventId}`);
  },

  // Audit Logs
  getAuditLogs: (params = {}) => {
    return apiClient.get('/api/v1/security/audit-logs', { params });
  },

  exportAuditLogs: (params = {}) => {
    return apiClient.post('/api/v1/security/audit-logs/export', params, {
      responseType: 'blob'
    });
  },

  // User Sessions
  getActiveSessions: () => {
    return apiClient.get('/api/v1/security/sessions');
  },

  terminateSession: (sessionId) => {
    return apiClient.delete(`/api/v1/security/sessions/${sessionId}`);
  },

  terminateAllSessions: () => {
    return apiClient.delete('/api/v1/security/sessions');
  },

  // User Management
  getUsers: (params = {}) => {
    return apiClient.get('/api/v1/users', { params });
  },

  getUser: (userId) => {
    return apiClient.get(`/api/v1/users/${userId}`);
  },

  createUser: (userData) => {
    return apiClient.post('/api/v1/users', userData);
  },

  updateUser: (userId, userData) => {
    return apiClient.put(`/api/v1/users/${userId}`, userData);
  },

  deleteUser: (userId) => {
    return apiClient.delete(`/api/v1/users/${userId}`);
  },

  blockUser: (userId) => {
    return apiClient.post(`/api/v1/users/${userId}/block`);
  },

  unblockUser: (userId) => {
    return apiClient.post(`/api/v1/users/${userId}/unblock`);
  },

  resetUserPassword: (userId) => {
    return apiClient.post(`/api/v1/users/${userId}/reset-password`);
  },

  // Role Management
  getRoles: () => {
    return apiClient.get('/api/v1/roles');
  },

  getRole: (roleId) => {
    return apiClient.get(`/api/v1/roles/${roleId}`);
  },

  createRole: (roleData) => {
    return apiClient.post('/api/v1/roles', roleData);
  },

  updateRole: (roleId, roleData) => {
    return apiClient.put(`/api/v1/roles/${roleId}`, roleData);
  },

  deleteRole: (roleId) => {
    return apiClient.delete(`/api/v1/roles/${roleId}`);
  },

  // Permission Management
  getPermissions: () => {
    return apiClient.get('/api/v1/permissions');
  },

  getPermission: (permissionId) => {
    return apiClient.get(`/api/v1/permissions/${permissionId}`);
  },

  createPermission: (permissionData) => {
    return apiClient.post('/api/v1/permissions', permissionData);
  },

  updatePermission: (permissionId, permissionData) => {
    return apiClient.put(`/api/v1/permissions/${permissionId}`, permissionData);
  },

  deletePermission: (permissionId) => {
    return apiClient.delete(`/api/v1/permissions/${permissionId}`);
  },

  // Permission Checks
  checkPermission: (resource, action, context = {}) => {
    return apiClient.post('/api/v1/security/check-permission', {
      resource,
      action,
      context
    });
  },

  // Security Policies
  getSecurityPolicies: () => {
    return apiClient.get('/api/v1/security/policies');
  },

  updateSecurityPolicy: (policyType, policyData) => {
    return apiClient.put(`/api/v1/security/policies/${policyType}`, policyData);
  },

  // Password Management
  changePassword: (currentPassword, newPassword) => {
    return apiClient.post('/api/v1/auth/change-password', {
      currentPassword,
      newPassword
    });
  },

  validatePassword: (password) => {
    return apiClient.post('/api/v1/auth/validate-password', { password });
  },

  // Security Analytics
  getSecurityAnalytics: (params = {}) => {
    return apiClient.get('/api/v1/security/analytics', { params });
  },

  getSecurityTrends: (params = {}) => {
    return apiClient.get('/api/v1/security/trends', { params });
  },

  // Threat Detection
  getThreatAlerts: () => {
    return apiClient.get('/api/v1/security/threats');
  },

  acknowledgeThreat: (threatId) => {
    return apiClient.post(`/api/v1/security/threats/${threatId}/acknowledge`);
  },

  // IP Management
  getBlockedIPs: () => {
    return apiClient.get('/api/v1/security/blocked-ips');
  },

  blockIP: (ipAddress, reason) => {
    return apiClient.post('/api/v1/security/blocked-ips', { ipAddress, reason });
  },

  unblockIP: (ipAddress) => {
    return apiClient.delete(`/api/v1/security/blocked-ips/${ipAddress}`);
  },

  // Security Reports
  generateSecurityReport: (reportType, params = {}) => {
    return apiClient.post(`/api/v1/security/reports/${reportType}`, params, {
      responseType: 'blob'
    });
  },

  // Compliance
  getComplianceStatus: () => {
    return apiClient.get('/api/v1/security/compliance');
  },

  runComplianceCheck: () => {
    return apiClient.post('/api/v1/security/compliance/check');
  }
};

export default securityService;