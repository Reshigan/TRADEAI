import apiClient from '../apiClient';

class DeductionService {
  async createDeduction(deductionData) {
    const response = await apiClient.post(`/api/deductions`, deductionData);
    return response.data;
  }

  async validateDeduction(deductionId, validatedAmount) {
    const response = await apiClient.post(`/api/deductions/${deductionId}/validate`, { validatedAmount });
    return response.data;
  }

  async disputeDeduction(deductionId, reason) {
    const response = await apiClient.post(`/api/deductions/${deductionId}/dispute`, { reason });
    return response.data;
  }

  async resolveDeduction(deductionId, resolutionType, finalAmount, notes) {
    const response = await apiClient.post(`/api/deductions/${deductionId}/resolve`, { resolutionType, finalAmount, notes });
    return response.data;
  }

  async matchDeductionToClaim(deductionId, claimId, matchedAmount) {
    const response = await apiClient.post(`/api/deductions/${deductionId}/match-claim`, { claimId, matchedAmount });
    return response.data;
  }

  async autoMatchDeductions() {
    const response = await apiClient.post(`/api/deductions/auto-match`, {});
    return response.data;
  }

  async getUnmatchedDeductions() {
    const response = await apiClient.get(`/api/deductions/unmatched`);
    return response.data;
  }

  async getDisputedDeductions() {
    const response = await apiClient.get(`/api/deductions/disputed`);
    return response.data;
  }

  async getDeductionsByCustomer(customerId, startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get(`/api/deductions/customer/${customerId}?${params.toString()}`);
    return response.data;
  }

  async getDeductionStatistics(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get(`/api/deductions/statistics?${params.toString()}`);
    return response.data;
  }

  async reconcileDeductionsWithClaims(customerId, startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get(`/api/deductions/reconcile/${customerId}?${params.toString()}`);
    return response.data;
  }
}

const deductionService = new DeductionService();
export default deductionService;
