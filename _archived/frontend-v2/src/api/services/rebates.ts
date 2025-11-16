import apiClient from '../../lib/axios';

export interface Rebate {
  id: string;
  name: string;
  type: 'volume' | 'growth' | 'promotional' | 'early_payment';
  status: 'draft' | 'active' | 'pending' | 'expired' | 'cancelled';
  customerId?: string;
  customerName?: string;
  startDate: string;
  endDate: string;
  percentage?: number;
  flatAmount?: number;
  thresholdAmount?: number;
  currentAmount: number;
  projectedAmount: number;
  paidAmount: number;
  description?: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RebateCalculation {
  rebateId: string;
  baseAmount: number;
  rebatePercentage: number;
  rebateAmount: number;
  taxAmount?: number;
  totalAmount: number;
  breakdown: {
    item: string;
    amount: number;
  }[];
}

export interface RebateAnalytics {
  totalRebates: number;
  totalPaid: number;
  totalProjected: number;
  totalPending: number;
  byType: {
    type: string;
    count: number;
    amount: number;
  }[];
  byStatus: {
    status: string;
    count: number;
    amount: number;
  }[];
  trends: {
    month: string;
    paid: number;
    accrued: number;
  }[];
}

class RebatesService {
  private baseUrl = '/rebates';

  async getAllRebates(filters?: {
    status?: string;
    type?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const response = await apiClient.get<{ data: Rebate[] }>(this.baseUrl, {
      params: filters,
    });
    return response.data;
  }

  async getRebateById(id: string) {
    const response = await apiClient.get<{ data: Rebate }>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createRebate(rebate: Omit<Rebate, 'id' | 'createdAt' | 'updatedAt' | 'currentAmount' | 'paidAmount'>) {
    const response = await apiClient.post<{ data: Rebate }>(this.baseUrl, rebate);
    return response.data;
  }

  async updateRebate(id: string, rebate: Partial<Rebate>) {
    const response = await apiClient.put<{ data: Rebate }>(`${this.baseUrl}/${id}`, rebate);
    return response.data;
  }

  async deleteRebate(id: string) {
    const response = await apiClient.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async calculateRebate(rebateId: string, baseAmount: number) {
    const response = await apiClient.post<{ data: RebateCalculation }>(
      `${this.baseUrl}/${rebateId}/calculate`,
      { baseAmount }
    );
    return response.data;
  }

  async processPayment(rebateId: string, amount: number, paymentDate: string) {
    const response = await apiClient.post<{ data: Rebate }>(
      `${this.baseUrl}/${rebateId}/payment`,
      { amount, paymentDate }
    );
    return response.data;
  }

  async getAnalytics(filters?: {
    startDate?: string;
    endDate?: string;
    customerId?: string;
  }) {
    const response = await apiClient.get<{ data: RebateAnalytics }>(
      `${this.baseUrl}/analytics`,
      { params: filters }
    );
    return response.data;
  }

  async approveRebate(id: string) {
    const response = await apiClient.post<{ data: Rebate }>(`${this.baseUrl}/${id}/approve`);
    return response.data;
  }

  async rejectRebate(id: string, reason: string) {
    const response = await apiClient.post<{ data: Rebate }>(`${this.baseUrl}/${id}/reject`, {
      reason,
    });
    return response.data;
  }

  async expireRebate(id: string) {
    const response = await apiClient.post<{ data: Rebate }>(`${this.baseUrl}/${id}/expire`);
    return response.data;
  }
}

export const rebatesService = new RebatesService();
export default rebatesService;
