import apiClient from './apiClient';

const workflowService = {
  // Workflow Overview
  getWorkflowOverview: () => {
    return apiClient.get('/api/v1/workflows/overview');
  },

  // Workflow Templates
  getWorkflowTemplates: () => {
    return apiClient.get('/api/v1/workflows/templates');
  },

  getWorkflowTemplate: (templateId) => {
    return apiClient.get(`/api/v1/workflows/templates/${templateId}`);
  },

  createWorkflowTemplate: (templateData) => {
    return apiClient.post('/api/v1/workflows/templates', templateData);
  },

  updateWorkflowTemplate: (templateId, templateData) => {
    return apiClient.put(`/api/v1/workflows/templates/${templateId}`, templateData);
  },

  deleteWorkflowTemplate: (templateId) => {
    return apiClient.delete(`/api/v1/workflows/templates/${templateId}`);
  },

  // Workflow Instances
  startWorkflow: (templateId, data, options = {}) => {
    return apiClient.post('/api/v1/workflows/start', {
      templateId,
      data,
      options
    });
  },

  getActiveWorkflows: (params = {}) => {
    return apiClient.get('/api/v1/workflows/active', { params });
  },

  getWorkflowHistory: (params = {}) => {
    return apiClient.get('/api/v1/workflows/history', { params });
  },

  getWorkflowStatus: (instanceId) => {
    return apiClient.get(`/api/v1/workflows/instances/${instanceId}`);
  },

  pauseWorkflow: (instanceId) => {
    return apiClient.post(`/api/v1/workflows/instances/${instanceId}/pause`);
  },

  resumeWorkflow: (instanceId) => {
    return apiClient.post(`/api/v1/workflows/instances/${instanceId}/resume`);
  },

  cancelWorkflow: (instanceId, reason) => {
    return apiClient.post(`/api/v1/workflows/instances/${instanceId}/cancel`, { reason });
  },

  // Workflow Steps
  executeStep: (instanceId, stepId, input = {}) => {
    return apiClient.post(`/api/v1/workflows/instances/${instanceId}/steps/${stepId}/execute`, input);
  },

  retryStep: (instanceId, stepId) => {
    return apiClient.post(`/api/v1/workflows/instances/${instanceId}/steps/${stepId}/retry`);
  },

  skipStep: (instanceId, stepId, reason) => {
    return apiClient.post(`/api/v1/workflows/instances/${instanceId}/steps/${stepId}/skip`, { reason });
  },

  // Approvals
  getPendingApprovals: (params = {}) => {
    return apiClient.get('/api/v1/workflows/approvals/pending', { params });
  },

  getMyApprovals: (params = {}) => {
    return apiClient.get('/api/v1/workflows/approvals/my', { params });
  },

  handleUserAction: (instanceId, stepId, action, data = {}) => {
    return apiClient.post(`/api/v1/workflows/instances/${instanceId}/steps/${stepId}/action`, {
      action,
      data
    });
  },

  approveStep: (instanceId, stepId, comment = '') => {
    return apiClient.post(`/api/v1/workflows/instances/${instanceId}/steps/${stepId}/approve`, {
      comment
    });
  },

  rejectStep: (instanceId, stepId, reason, comment = '') => {
    return apiClient.post(`/api/v1/workflows/instances/${instanceId}/steps/${stepId}/reject`, {
      reason,
      comment
    });
  },

  delegateApproval: (instanceId, stepId, userId, comment = '') => {
    return apiClient.post(`/api/v1/workflows/instances/${instanceId}/steps/${stepId}/delegate`, {
      userId,
      comment
    });
  },

  // Workflow Analytics
  getWorkflowAnalytics: (params = {}) => {
    return apiClient.get('/api/v1/workflows/analytics', { params });
  },

  getWorkflowPerformance: (params = {}) => {
    return apiClient.get('/api/v1/workflows/performance', { params });
  },

  getBottleneckAnalysis: (params = {}) => {
    return apiClient.get('/api/v1/workflows/bottlenecks', { params });
  },

  getSLACompliance: (params = {}) => {
    return apiClient.get('/api/v1/workflows/sla-compliance', { params });
  },

  // Workflow Rules
  getWorkflowRules: () => {
    return apiClient.get('/api/v1/workflows/rules');
  },

  createWorkflowRule: (ruleData) => {
    return apiClient.post('/api/v1/workflows/rules', ruleData);
  },

  updateWorkflowRule: (ruleId, ruleData) => {
    return apiClient.put(`/api/v1/workflows/rules/${ruleId}`, ruleData);
  },

  deleteWorkflowRule: (ruleId) => {
    return apiClient.delete(`/api/v1/workflows/rules/${ruleId}`);
  },

  testWorkflowRule: (ruleData, testData) => {
    return apiClient.post('/api/v1/workflows/rules/test', { ruleData, testData });
  },

  // Workflow Notifications
  getWorkflowNotifications: (params = {}) => {
    return apiClient.get('/api/v1/workflows/notifications', { params });
  },

  markNotificationRead: (notificationId) => {
    return apiClient.post(`/api/v1/workflows/notifications/${notificationId}/read`);
  },

  markAllNotificationsRead: () => {
    return apiClient.post('/api/v1/workflows/notifications/read-all');
  },

  // Workflow Configuration
  getWorkflowConfig: () => {
    return apiClient.get('/api/v1/workflows/config');
  },

  updateWorkflowConfig: (configData) => {
    return apiClient.put('/api/v1/workflows/config', configData);
  },

  // Workflow Import/Export
  exportWorkflow: (templateId) => {
    return apiClient.get(`/api/v1/workflows/templates/${templateId}/export`, {
      responseType: 'blob'
    });
  },

  importWorkflow: (workflowFile) => {
    const formData = new FormData();
    formData.append('workflow', workflowFile);
    return apiClient.post('/api/v1/workflows/templates/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Workflow Validation
  validateWorkflow: (workflowData) => {
    return apiClient.post('/api/v1/workflows/validate', workflowData);
  },

  // Workflow Scheduling
  scheduleWorkflow: (templateId, scheduleData) => {
    return apiClient.post('/api/v1/workflows/schedule', {
      templateId,
      ...scheduleData
    });
  },

  getScheduledWorkflows: () => {
    return apiClient.get('/api/v1/workflows/scheduled');
  },

  updateScheduledWorkflow: (scheduleId, scheduleData) => {
    return apiClient.put(`/api/v1/workflows/scheduled/${scheduleId}`, scheduleData);
  },

  deleteScheduledWorkflow: (scheduleId) => {
    return apiClient.delete(`/api/v1/workflows/scheduled/${scheduleId}`);
  },

  // Workflow Reports
  generateWorkflowReport: (reportType, params = {}) => {
    return apiClient.post(`/api/v1/workflows/reports/${reportType}`, params, {
      responseType: 'blob'
    });
  },

  // Workflow Monitoring
  getWorkflowMetrics: (params = {}) => {
    return apiClient.get('/api/v1/workflows/metrics', { params });
  },

  getWorkflowHealth: () => {
    return apiClient.get('/api/v1/workflows/health');
  },

  // Workflow Debugging
  getWorkflowLogs: (instanceId, params = {}) => {
    return apiClient.get(`/api/v1/workflows/instances/${instanceId}/logs`, { params });
  },

  getWorkflowTrace: (instanceId) => {
    return apiClient.get(`/api/v1/workflows/instances/${instanceId}/trace`);
  },

  // Workflow Variables
  getWorkflowVariables: (instanceId) => {
    return apiClient.get(`/api/v1/workflows/instances/${instanceId}/variables`);
  },

  setWorkflowVariable: (instanceId, variableName, value) => {
    return apiClient.post(`/api/v1/workflows/instances/${instanceId}/variables`, {
      name: variableName,
      value
    });
  },

  // Workflow Comments
  addWorkflowComment: (instanceId, comment) => {
    return apiClient.post(`/api/v1/workflows/instances/${instanceId}/comments`, { comment });
  },

  getWorkflowComments: (instanceId) => {
    return apiClient.get(`/api/v1/workflows/instances/${instanceId}/comments`);
  }
};

export default workflowService;