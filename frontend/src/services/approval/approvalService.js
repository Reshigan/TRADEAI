import apiClient from '../apiClient';

class ApprovalService {
  async createApproval(entityType, entityId, amount, metadata = {}) {
    const response = await apiClient.post('/approvals', { entityType, entityId, amount, metadata });
    return response.data;
  }

  async getPendingApprovals() {
    const response = await apiClient.get('/approvals/pending');
    return response.data;
  }

  async getOverdueApprovals() {
    const response = await apiClient.get('/approvals/overdue');
    return response.data;
  }

  async getApprovalsByEntity(entityType, entityId) {
    const response = await apiClient.get(`/approvals/entity/${entityType}/${entityId}`);
    return response.data;
  }

  async approveApproval(approvalId, comments) {
    const response = await apiClient.post(`/approvals/${approvalId}/approve`, { comments });
    return response.data;
  }

  async rejectApproval(approvalId, reason) {
    const response = await apiClient.post(`/approvals/${approvalId}/reject`, { reason });
    return response.data;
  }

  async cancelApproval(approvalId, reason) {
    const response = await apiClient.post(`/approvals/${approvalId}/cancel`, { reason });
    return response.data;
  }

  async checkSLA(approvalId) {
    const response = await apiClient.get(`/approvals/${approvalId}/sla`);
    return response.data;
  }
}

const approvalService = new ApprovalService();
export default approvalService;
