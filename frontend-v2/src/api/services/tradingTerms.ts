import axios from '../axios';

export interface TradingTerm {
  _id: string;
  customerId: string;
  paymentTerms: string;
  creditLimit: number;
  discount: number;
  deliveryTerms: string;
  validFrom: string;
  validTo: string;
  status: 'active' | 'expired' | 'pending';
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export const tradingTermService = {
  getAll: async (): Promise<TradingTerm[]> => {
    const response = await axios.get('/trading-terms');
    return response.data;
  },

  getById: async (id: string): Promise<TradingTerm> => {
    const response = await axios.get(`/trading-terms/${id}`);
    return response.data;
  },

  getByCustomer: async (customerId: string): Promise<TradingTerm[]> => {
    const response = await axios.get(`/trading-terms/customer/${customerId}`);
    return response.data;
  },

  create: async (data: Partial<TradingTerm>): Promise<TradingTerm> => {
    const response = await axios.post('/trading-terms', data);
    return response.data;
  },

  update: async (id: string, data: Partial<TradingTerm>): Promise<TradingTerm> => {
    const response = await axios.put(`/trading-terms/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axios.delete(`/trading-terms/${id}`);
  },
};
