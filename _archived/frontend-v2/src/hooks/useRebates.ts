import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import rebatesService, { Rebate } from '../api/services/rebates';

export function useRebates(filters?: {
  status?: string;
  type?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['rebates', filters],
    queryFn: () => rebatesService.getAllRebates(filters),
  });
}

export function useRebate(id: string) {
  return useQuery({
    queryKey: ['rebates', id],
    queryFn: () => rebatesService.getRebateById(id),
    enabled: !!id,
  });
}

export function useCreateRebate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rebatesService.createRebate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rebates'] });
    },
  });
}

export function useUpdateRebate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Rebate> }) =>
      rebatesService.updateRebate(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rebates'] });
      queryClient.invalidateQueries({ queryKey: ['rebates', variables.id] });
    },
  });
}

export function useDeleteRebate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rebatesService.deleteRebate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rebates'] });
    },
  });
}

export function useCalculateRebate() {
  return useMutation({
    mutationFn: ({ rebateId, baseAmount }: { rebateId: string; baseAmount: number }) =>
      rebatesService.calculateRebate(rebateId, baseAmount),
  });
}

export function useProcessPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      rebateId,
      amount,
      paymentDate,
    }: {
      rebateId: string;
      amount: number;
      paymentDate: string;
    }) => rebatesService.processPayment(rebateId, amount, paymentDate),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rebates'] });
      queryClient.invalidateQueries({ queryKey: ['rebates', variables.rebateId] });
      queryClient.invalidateQueries({ queryKey: ['rebates-analytics'] });
    },
  });
}

export function useRebateAnalytics(filters?: {
  startDate?: string;
  endDate?: string;
  customerId?: string;
}) {
  return useQuery({
    queryKey: ['rebates-analytics', filters],
    queryFn: () => rebatesService.getAnalytics(filters),
  });
}

export function useApproveRebate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rebatesService.approveRebate,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['rebates'] });
      queryClient.invalidateQueries({ queryKey: ['rebates', id] });
    },
  });
}

export function useRejectRebate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rebatesService.rejectRebate(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rebates'] });
      queryClient.invalidateQueries({ queryKey: ['rebates', variables.id] });
    },
  });
}
