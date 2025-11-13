import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promotionsService } from '../api/services/promotions';

export const usePromotions = () => {
  return useQuery({
    queryKey: ['promotions'],
    queryFn: () => promotionsService.getAll(),
  });
};

export const usePromotion = (id: string) => {
  return useQuery({
    queryKey: ['promotions', id],
    queryFn: () => promotionsService.getById(id),
    enabled: !!id,
  });
};

export const useCreatePromotion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: promotionsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
  });
};

export const useUpdatePromotion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      promotionsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
  });
};
