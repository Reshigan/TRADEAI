import apiClient from './client'

export interface Budget {
  id: string
  name: string
  year: number
  totalAmount: number
  allocatedAmount: number
  spentAmount: number
  remainingAmount: number
  status: 'draft' | 'active' | 'closed'
  department: string
  createdAt: string
  updatedAt: string
}

export interface BudgetLine {
  id: string
  budgetId: string
  category: string
  allocatedAmount: number
  spentAmount: number
  remainingAmount: number
}

export const budgetsApi = {
  getAll: (params?: any) =>
    apiClient.get('/budgets', { params }),

  getById: (id: string) =>
    apiClient.get(`/budgets/${id}`),

  create: (data: Partial<Budget>) =>
    apiClient.post('/budgets', data),

  update: (id: string, data: Partial<Budget>) =>
    apiClient.put(`/budgets/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/budgets/${id}`),

  getLines: (budgetId: string) =>
    apiClient.get(`/budgets/${budgetId}/lines`),

  createLine: (budgetId: string, data: Partial<BudgetLine>) =>
    apiClient.post(`/budgets/${budgetId}/lines`, data),

  updateLine: (budgetId: string, lineId: string, data: Partial<BudgetLine>) =>
    apiClient.put(`/budgets/${budgetId}/lines/${lineId}`, data),

  deleteLine: (budgetId: string, lineId: string) =>
    apiClient.delete(`/budgets/${budgetId}/lines/${lineId}`),

  getUtilization: (budgetId: string) =>
    apiClient.get(`/budgets/${budgetId}/utilization`),

  allocate: (budgetId: string, data: any) =>
    apiClient.post(`/budgets/${budgetId}/allocate`, data),

  approve: (budgetId: string) =>
    apiClient.post(`/budgets/${budgetId}/approve`),

  reject: (budgetId: string, reason: string) =>
    apiClient.post(`/budgets/${budgetId}/reject`, { reason }),
}
