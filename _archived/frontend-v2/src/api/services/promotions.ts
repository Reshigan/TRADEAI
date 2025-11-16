import apiClient from '../../lib/axios';
import { ApiResponse, PaginatedResponse, Promotion } from '../../types/api';

export const promotionsService = {
  async getAll(params?: any): Promise<PaginatedResponse<Promotion>> {
    const response = await apiClient.get('/promotions', { params });
    // Backend returns: {success, data: [...], total, totalPages, currentPage}
    // We need to return: {data: [...], total, page, limit, totalPages}
    const { data, total, totalPages, currentPage } = response.data;
    return {
      data,
      total,
      totalPages,
      page: parseInt(currentPage) || 1,
      limit: params?.limit || 20
    };
  },

  async getById(id: string): Promise<Promotion> {
    const response = await apiClient.get<ApiResponse<Promotion>>(`/promotions/${id}`);
    return response.data.data;
  },

  async create(data: Partial<Promotion>): Promise<Promotion> {
    const response = await apiClient.post<ApiResponse<Promotion>>('/promotions', data);
    return response.data.data;
  },

  async update(id: string, data: Partial<Promotion>): Promise<Promotion> {
    const response = await apiClient.put<ApiResponse<Promotion>>(`/promotions/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/promotions/${id}`);
  },
};
