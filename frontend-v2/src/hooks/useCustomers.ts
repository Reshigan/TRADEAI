import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersService } from '../api/services/customers';

export const useCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: () => customersService.getAll(),
  });
};

export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => customersService.getById(id),
    enabled: !!id,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: customersService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};
