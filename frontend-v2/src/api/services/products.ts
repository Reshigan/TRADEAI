import apiClient from '../../lib/axios';
import { ApiResponse, Product, PaginatedResponse } from '../../types/api';

export const productsService = {
  async getAll(params?: any): Promise<PaginatedResponse<Product>> {
    const response = await apiClient.get('/products', { params });
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

  async getById(id: string): Promise<Product> {
    const response = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data;
  },

  async create(data: Partial<Product>): Promise<Product> {
    const response = await apiClient.post<ApiResponse<Product>>('/products', data);
    return response.data.data;
  },

  async update(id: string, data: Partial<Product>): Promise<Product> {
    const response = await apiClient.put<ApiResponse<Product>>(`/products/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },
};
