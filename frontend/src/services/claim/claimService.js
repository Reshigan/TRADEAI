import apiClient from '../apiClient';

class ClaimService {
  async createClaim(claimData) {
    const response = await apiClient.post(
      `/claims`,
      claimData,
      
    );
    return response.data;
  }

  async submitClaim(claimId) {
    const response = await apiClient.post(
      `/claims/${claimId}/submit`,
      {},
      
    );
    return response.data;
  }

  async approveClaim(claimId, approvedAmount) {
    const response = await apiClient.post(
      `/claims/${claimId}/approve`,
      { approvedAmount },
      
    );
    return response.data;
  }

  async rejectClaim(claimId, reason) {
    const response = await apiClient.post(
      `/claims/${claimId}/reject`,
      { reason },
      
    );
    return response.data;
  }

  async matchClaimToInvoice(claimId, invoiceId, invoiceNumber, matchedAmount) {
    const response = await apiClient.post(
      `/claims/${claimId}/match-invoice`,
      { invoiceId, invoiceNumber, matchedAmount },
      
    );
    return response.data;
  }

  async autoMatchClaims() {
    const response = await apiClient.post(
      `/claims/auto-match`,
      {},
      
    );
    return response.data;
  }

  async getUnmatchedClaims() {
    const response = await apiClient.get(
      `/claims/unmatched`,
      
    );
    return response.data;
  }

  async getPendingApprovalClaims() {
    const response = await apiClient.get(
      `/claims/pending-approval`,
      
    );
    return response.data;
  }

  async getClaimsByCustomer(customerId, startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get(
      `/claims/customer/${customerId}?${params.toString()}`,
      
    );
    return response.data;
  }

  async getClaimStatistics(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get(
      `/claims/statistics?${params.toString()}`,
      
    );
    return response.data;
  }
}

const claimService = new ClaimService();
export default claimService;
