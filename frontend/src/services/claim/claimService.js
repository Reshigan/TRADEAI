import apiClient from '../apiClient';

class ClaimService {
  async getClaims(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.customerId) params.append('customerId', filters.customerId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await apiClient.get(
      `/api/claims?${params.toString()}`
    );
    return response.data;
  }

  async createClaim(claimData) {
    const response = await apiClient.post(
      `/api/claims`,
      claimData,
      
    );
    return response.data;
  }

  async submitClaim(claimId) {
    const response = await apiClient.post(
      `/api/claims/${claimId}/submit`,
      {},
      
    );
    return response.data;
  }

  async approveClaim(claimId, approvedAmount) {
    const response = await apiClient.post(
      `/api/claims/${claimId}/approve`,
      { approvedAmount },
      
    );
    return response.data;
  }

  async rejectClaim(claimId, reason) {
    const response = await apiClient.post(
      `/api/claims/${claimId}/reject`,
      { reason },
      
    );
    return response.data;
  }

  async matchClaimToInvoice(claimId, invoiceId, invoiceNumber, matchedAmount) {
    const response = await apiClient.post(
      `/api/claims/${claimId}/match-invoice`,
      { invoiceId, invoiceNumber, matchedAmount },
      
    );
    return response.data;
  }

  async autoMatchClaims() {
    const response = await apiClient.post(
      `/api/claims/auto-match`,
      {},
      
    );
    return response.data;
  }

  async getUnmatchedClaims() {
    const response = await apiClient.get(
      `/api/claims/unmatched`,
      
    );
    return response.data;
  }

  async getPendingApprovalClaims() {
    const response = await apiClient.get(
      `/api/claims/pending-approval`,
      
    );
    return response.data;
  }

  async getClaimsByCustomer(customerId, startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get(
      `/api/claims/customer/${customerId}?${params.toString()}`,
      
    );
    return response.data;
  }

  async getClaimStatistics(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get(
      `/api/claims/statistics?${params.toString()}`,
      
    );
    return response.data;
  }
}

const claimService = new ClaimService();
export default claimService;
