import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

class DeductionService {
  async createDeduction(deductionData) {
    const response = await axios.post(
      `${API_BASE_URL}/api/deductions`,
      deductionData,
      getAuthHeaders()
    );
    return response.data;
  }

  async validateDeduction(deductionId, validatedAmount) {
    const response = await axios.post(
      `${API_BASE_URL}/api/deductions/${deductionId}/validate`,
      { validatedAmount },
      getAuthHeaders()
    );
    return response.data;
  }

  async disputeDeduction(deductionId, reason) {
    const response = await axios.post(
      `${API_BASE_URL}/api/deductions/${deductionId}/dispute`,
      { reason },
      getAuthHeaders()
    );
    return response.data;
  }

  async resolveDeduction(deductionId, resolutionType, finalAmount, notes) {
    const response = await axios.post(
      `${API_BASE_URL}/api/deductions/${deductionId}/resolve`,
      { resolutionType, finalAmount, notes },
      getAuthHeaders()
    );
    return response.data;
  }

  async matchDeductionToClaim(deductionId, claimId, matchedAmount) {
    const response = await axios.post(
      `${API_BASE_URL}/api/deductions/${deductionId}/match-claim`,
      { claimId, matchedAmount },
      getAuthHeaders()
    );
    return response.data;
  }

  async autoMatchDeductions() {
    const response = await axios.post(
      `${API_BASE_URL}/api/deductions/auto-match`,
      {},
      getAuthHeaders()
    );
    return response.data;
  }

  async getUnmatchedDeductions() {
    const response = await axios.get(
      `${API_BASE_URL}/api/deductions/unmatched`,
      getAuthHeaders()
    );
    return response.data;
  }

  async getDisputedDeductions() {
    const response = await axios.get(
      `${API_BASE_URL}/api/deductions/disputed`,
      getAuthHeaders()
    );
    return response.data;
  }

  async getDeductionsByCustomer(customerId, startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await axios.get(
      `${API_BASE_URL}/api/deductions/customer/${customerId}?${params.toString()}`,
      getAuthHeaders()
    );
    return response.data;
  }

  async getDeductionStatistics(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await axios.get(
      `${API_BASE_URL}/api/deductions/statistics?${params.toString()}`,
      getAuthHeaders()
    );
    return response.data;
  }

  async reconcileDeductionsWithClaims(customerId, startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await axios.get(
      `${API_BASE_URL}/api/deductions/reconcile/${customerId}?${params.toString()}`,
      getAuthHeaders()
    );
    return response.data;
  }
}

export default new DeductionService();
