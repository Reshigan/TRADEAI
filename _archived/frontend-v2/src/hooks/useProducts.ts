import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService } from '../api/services/products';

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => productsService.getAll(),
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productsService.getById(id),
    enabled: !!id,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: productsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
