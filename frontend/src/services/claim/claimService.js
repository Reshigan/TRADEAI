import apiClient from '../apiClient';

class ClaimService {
  async getById(id) {
    const response = await apiClient.get(`/claims/${id}`);
    return response.data?.data || response.data;
  }

  async createClaim(claimData) {
    const payload = {
      claimType: claimData.claimType,
      customerId: claimData.customer || claimData.customerId,
      claimedAmount: claimData.claimAmount || claimData.claimedAmount || 0,
      claimDate: claimData.claimDate,
      reason: claimData.notes || claimData.reason || '',
      data: { lineItems: claimData.lineItems || [], currency: claimData.currency || 'ZAR' }
    };
    const response = await apiClient.post(`/claims`, payload);
    return response.data;
  }

  async submit(claimId) {
    const response = await apiClient.post(`/claims/${claimId}/submit`, {});
    return response.data;
  }

  async submitClaim(claimId) {
    return this.submit(claimId);
  }

  async approve(claimId, data) {
    const response = await apiClient.post(`/claims/${claimId}/approve`, data || {});
    return response.data;
  }

  async approveClaim(claimId, approvedAmount) {
    return this.approve(claimId, { approvedAmount });
  }

  async reject(claimId, data) {
    const response = await apiClient.post(`/claims/${claimId}/reject`, data || {});
    return response.data;
  }

  async rejectClaim(claimId, reason) {
    return this.reject(claimId, { reason });
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
