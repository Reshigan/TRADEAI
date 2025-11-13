import apiClient from '../../lib/axios';

export interface Budget {
  _id: string;
  name: string;
  totalAmount: number;
  allocated: number;
  spent: number;
  remaining: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive' | 'completed';
  category: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export const budgetService = {
  getAll: async (): Promise<Budget[]> => {
    const response = await apiClient.get('/budgets');
    return response.data;
  },

  getById: async (id: string): Promise<Budget> => {
    const response = await apiClient.get(`/budgets/${id}`);
    return response.data;
  },

  create: async (data: Partial<Budget>): Promise<Budget> => {
    const response = await apiClient.post('/budgets', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Budget>): Promise<Budget> => {
    const response = await apiClient.put(`/budgets/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/budgets/${id}`);
  },

  getAllocation: async (id: string) => {
    const response = await apiClient.get(`/budgets/${id}/allocation`);
    return response.data;
  },
};
