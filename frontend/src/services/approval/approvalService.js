import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

class ApprovalService {
  async createApproval(entityType, entityId, amount, metadata = {}) {
    const response = await axios.post(
      `${API_BASE_URL}/api/approvals`,
      { entityType, entityId, amount, metadata },
      getAuthHeaders()
    );
    return response.data;
  }

  async getPendingApprovals() {
    const response = await axios.get(
      `${API_BASE_URL}/api/approvals/pending`,
      getAuthHeaders()
    );
    return response.data;
  }

  async getOverdueApprovals() {
    const response = await axios.get(
      `${API_BASE_URL}/api/approvals/overdue`,
      getAuthHeaders()
    );
    return response.data;
  }

  async getApprovalsByEntity(entityType, entityId) {
    const response = await axios.get(
      `${API_BASE_URL}/api/approvals/entity/${entityType}/${entityId}`,
      getAuthHeaders()
    );
    return response.data;
  }

  async approveApproval(approvalId, comments) {
    const response = await axios.post(
      `${API_BASE_URL}/api/approvals/${approvalId}/approve`,
      { comments },
      getAuthHeaders()
    );
    return response.data;
  }

  async rejectApproval(approvalId, reason) {
    const response = await axios.post(
      `${API_BASE_URL}/api/approvals/${approvalId}/reject`,
      { reason },
      getAuthHeaders()
    );
    return response.data;
  }

  async cancelApproval(approvalId, reason) {
    const response = await axios.post(
      `${API_BASE_URL}/api/approvals/${approvalId}/cancel`,
      { reason },
      getAuthHeaders()
    );
    return response.data;
  }

  async checkSLA(approvalId) {
    const response = await axios.get(
      `${API_BASE_URL}/api/approvals/${approvalId}/sla`,
      getAuthHeaders()
    );
    return response.data;
  }
}

export default new ApprovalService();
