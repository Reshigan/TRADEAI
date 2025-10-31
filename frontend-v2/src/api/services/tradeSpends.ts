import axios from '../axios';

export interface TradeSpend {
  _id: string;
  promotionId: string;
  customerId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export const tradeSpendService = {
  getAll: async (): Promise<TradeSpend[]> => {
    const response = await axios.get('/trade-spends');
    return response.data;
  },

  getById: async (id: string): Promise<TradeSpend> => {
    const response = await axios.get(`/trade-spends/${id}`);
    return response.data;
  },

  create: async (data: Partial<TradeSpend>): Promise<TradeSpend> => {
    const response = await axios.post('/trade-spends', data);
    return response.data;
  },

  update: async (id: string, data: Partial<TradeSpend>): Promise<TradeSpend> => {
    const response = await axios.put(`/trade-spends/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axios.delete(`/trade-spends/${id}`);
  },

  approve: async (id: string): Promise<TradeSpend> => {
    const response = await axios.post(`/trade-spends/${id}/approve`);
    return response.data;
  },

  reject: async (id: string, reason: string): Promise<TradeSpend> => {
    const response = await axios.post(`/trade-spends/${id}/reject`, { reason });
    return response.data;
  },
};
