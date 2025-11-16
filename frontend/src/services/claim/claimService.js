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

class ClaimService {
  async createClaim(claimData) {
    const response = await axios.post(
      `${API_BASE_URL}/api/claims`,
      claimData,
      getAuthHeaders()
    );
    return response.data;
  }

  async submitClaim(claimId) {
    const response = await axios.post(
      `${API_BASE_URL}/api/claims/${claimId}/submit`,
      {},
      getAuthHeaders()
    );
    return response.data;
  }

  async approveClaim(claimId, approvedAmount) {
    const response = await axios.post(
      `${API_BASE_URL}/api/claims/${claimId}/approve`,
      { approvedAmount },
      getAuthHeaders()
    );
    return response.data;
  }

  async rejectClaim(claimId, reason) {
    const response = await axios.post(
      `${API_BASE_URL}/api/claims/${claimId}/reject`,
      { reason },
      getAuthHeaders()
    );
    return response.data;
  }

  async matchClaimToInvoice(claimId, invoiceId, invoiceNumber, matchedAmount) {
    const response = await axios.post(
      `${API_BASE_URL}/api/claims/${claimId}/match-invoice`,
      { invoiceId, invoiceNumber, matchedAmount },
      getAuthHeaders()
    );
    return response.data;
  }

  async autoMatchClaims() {
    const response = await axios.post(
      `${API_BASE_URL}/api/claims/auto-match`,
      {},
      getAuthHeaders()
    );
    return response.data;
  }

  async getUnmatchedClaims() {
    const response = await axios.get(
      `${API_BASE_URL}/api/claims/unmatched`,
      getAuthHeaders()
    );
    return response.data;
  }

  async getPendingApprovalClaims() {
    const response = await axios.get(
      `${API_BASE_URL}/api/claims/pending-approval`,
      getAuthHeaders()
    );
    return response.data;
  }

  async getClaimsByCustomer(customerId, startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await axios.get(
      `${API_BASE_URL}/api/claims/customer/${customerId}?${params.toString()}`,
      getAuthHeaders()
    );
    return response.data;
  }

  async getClaimStatistics(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await axios.get(
      `${API_BASE_URL}/api/claims/statistics?${params.toString()}`,
      getAuthHeaders()
    );
    return response.data;
  }
}

const claimService = new ClaimService();
export default claimService;
