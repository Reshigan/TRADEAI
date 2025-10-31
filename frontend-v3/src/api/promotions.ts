import apiClient from './client'

export interface Promotion {
  id: string
  name: string
  type: string
  status: 'draft' | 'approved' | 'active' | 'completed' | 'cancelled'
  startDate: string
  endDate: string
  budget: number
  actualSpend: number
  expectedLift: number
  actualLift?: number
  roi?: number
  customerId: string
  customerName: string
  createdAt: string
}

export const promotionsApi = {
  getAll: (params?: any) =>
    apiClient.get('/promotions', { params }),

  getById: (id: string) =>
    apiClient.get(`/promotions/${id}`),

  create: (data: Partial<Promotion>) =>
    apiClient.post('/promotions', data),

  update: (id: string, data: Partial<Promotion>) =>
    apiClient.put(`/promotions/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/promotions/${id}`),

  getPerformance: (id: string) =>
    apiClient.get(`/promotions/${id}/performance`),

  approve: (id: string) =>
    apiClient.post(`/promotions/${id}/approve`),

  reject: (id: string, reason: string) =>
    apiClient.post(`/promotions/${id}/reject`, { reason }),

  activate: (id: string) =>
    apiClient.post(`/promotions/${id}/activate`),

  complete: (id: string) =>
    apiClient.post(`/promotions/${id}/complete`),

  cancel: (id: string, reason: string) =>
    apiClient.post(`/promotions/${id}/cancel`, { reason }),
}
