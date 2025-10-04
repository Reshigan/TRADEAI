import React from 'react';
import { Navigate } from 'react-router-dom';
import { Alert, Box } from '@mui/material';
import roleService from '../../services/auth/roleService';

/**
 * ProtectedRoute component for role-based access control
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if access is granted
 * @param {string|string[]} props.requiredRole - Required role(s) to access the route
 * @param {string|string[]} props.requiredPermission - Required permission(s) to access the route
 * @param {string} props.redirectTo - Path to redirect to if access is denied (default: '/dashboard')
 * @param {boolean} props.showError - Whether to show error message instead of redirecting
 */
const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  requiredPermission, 
  redirectTo = '/dashboard',
  showError = false 
}) => {
  // Check if user is authenticated
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Initialize role service if not already done
  if (!roleService.getCurrentUser()) {
    roleService.initializeFromToken(token);
  }

  let hasAccess = true;

  // Check role-based access
  if (requiredRole) {
    if (Array.isArray(requiredRole)) {
      hasAccess = roleService.hasAnyRole(requiredRole);
    } else {
      hasAccess = roleService.hasRole(requiredRole);
    }
  }

  // Check permission-based access
  if (hasAccess && requiredPermission) {
    if (Array.isArray(requiredPermission)) {
      hasAccess = roleService.hasAnyPermission(requiredPermission);
    } else {
      hasAccess = roleService.hasPermission(requiredPermission);
    }
  }

  // Handle access denied
  if (!hasAccess) {
    if (showError) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            Access Denied: You don't have permission to view this page.
            <br />
            Required role: {Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole}
            <br />
            Your role: {roleService.getRoleDisplayName()}
          </Alert>
        </Box>
      );
    }
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

/**
 * ConditionalRender component for conditional rendering based on roles/permissions
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if access is granted
 * @param {string|string[]} props.requiredRole - Required role(s) to render the component
 * @param {string|string[]} props.requiredPermission - Required permission(s) to render the component
 * @param {React.ReactNode} props.fallback - Component to render if access is denied
 */
export const ConditionalRender = ({ 
  children, 
  requiredRole, 
  requiredPermission, 
  fallback = null 
}) => {
  // Check if user is authenticated
  const token = localStorage.getItem('token');
  if (!token) {
    return fallback;
  }

  // Initialize role service if not already done
  if (!roleService.getCurrentUser()) {
    roleService.initializeFromToken(token);
  }

  let hasAccess = true;

  // Check role-based access
  if (requiredRole) {
    if (Array.isArray(requiredRole)) {
      hasAccess = roleService.hasAnyRole(requiredRole);
    } else {
      hasAccess = roleService.hasRole(requiredRole);
    }
  }

  // Check permission-based access
  if (hasAccess && requiredPermission) {
    if (Array.isArray(requiredPermission)) {
      hasAccess = roleService.hasAnyPermission(requiredPermission);
    } else {
      hasAccess = roleService.hasPermission(requiredPermission);
    }
  }

  return hasAccess ? children : fallback;
};

/**
 * RoleBasedButton component that shows/hides based on user role
 */
export const RoleBasedButton = ({ 
  children, 
  requiredRole, 
  requiredPermission, 
  ...buttonProps 
}) => {
  return (
    <ConditionalRender 
      requiredRole={requiredRole} 
      requiredPermission={requiredPermission}
    >
      <button {...buttonProps}>
        {children}
      </button>
    </ConditionalRender>
  );
};

/**
 * Hook for role-based access control
 */
export const useRoleAccess = () => {
  const token = localStorage.getItem('token');
  
  if (token && !roleService.getCurrentUser()) {
    roleService.initializeFromToken(token);
  }

  return {
    user: roleService.getCurrentUser(),
    role: roleService.getCurrentRole(),
    hasRole: (role) => roleService.hasRole(role),
    hasAnyRole: (roles) => roleService.hasAnyRole(roles),
    hasPermission: (permission) => roleService.hasPermission(permission),
    hasAnyPermission: (permissions) => roleService.hasAnyPermission(permissions),
    isSuperAdmin: () => roleService.isSuperAdmin(),
    isAdmin: () => roleService.isAdmin(),
    isManager: () => roleService.isManager(),
    canManageCompanies: () => roleService.canManageCompanies(),
    canCreateUsers: () => roleService.canCreateUsers(),
    canViewAllData: () => roleService.canViewAllData(),
    canEditData: () => roleService.canEditData(),
    canSetupSSO: () => roleService.canSetupSSO(),
    getCompanyId: () => roleService.getCompanyId(),
    getRoleDisplayName: () => roleService.getRoleDisplayName()
  };
};

export default ProtectedRoute;