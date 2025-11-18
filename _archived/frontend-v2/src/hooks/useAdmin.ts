import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, User, Role } from '../api/services/admin';

export function useUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminService.getUsers,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => adminService.getUser(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      adminService.updateUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', variables.id] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminService.activateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminService.deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: adminService.resetUserPassword,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: adminService.getRoles,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminService.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Role> }) =>
      adminService.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminService.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
    },
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ['admin', 'permissions'],
    queryFn: adminService.getPermissions,
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['admin', 'system', 'health'],
    queryFn: adminService.getSystemHealth,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useAuditLogs(filters?: any) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', filters],
    queryFn: () => adminService.getAuditLogs(filters),
  });
}

export function useSystemSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: adminService.getSystemSettings,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminService.updateSystemSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: ['admin', 'stats', 'users'],
    queryFn: adminService.getUserStats,
  });
}

export function useActivityStats(period: 'day' | 'week' | 'month' | 'year' = 'week') {
  return useQuery({
    queryKey: ['admin', 'stats', 'activity', period],
    queryFn: () => adminService.getActivityStats(period),
  });
}
