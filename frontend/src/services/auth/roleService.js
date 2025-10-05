// Role-based access control service
import { jwtDecode } from 'jwt-decode';

// Role hierarchy and permissions
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin', 
  MANAGER: 'manager',
  KAM: 'kam',
  USER: 'user'
};

const PERMISSIONS = {
  // Company management
  CREATE_COMPANY: 'create_company',
  MANAGE_COMPANIES: 'manage_companies',
  VIEW_ALL_COMPANIES: 'view_all_companies',
  
  // User management
  CREATE_USERS: 'create_users',
  MANAGE_USERS: 'manage_users',
  VIEW_ALL_USERS: 'view_all_users',
  
  // Data access
  VIEW_ALL_DATA: 'view_all_data',
  EDIT_ALL_DATA: 'edit_all_data',
  DELETE_DATA: 'delete_data',
  
  // System settings
  MANAGE_SYSTEM_SETTINGS: 'manage_system_settings',
  SETUP_SSO: 'setup_sso',
  MANAGE_INTEGRATIONS: 'manage_integrations',
  
  // Analytics and reports
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_DATA: 'export_data',
  
  // Promotions and campaigns
  CREATE_PROMOTIONS: 'create_promotions',
  MANAGE_PROMOTIONS: 'manage_promotions',
  APPROVE_PROMOTIONS: 'approve_promotions'
};

// Role permissions mapping
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    PERMISSIONS.CREATE_COMPANY,
    PERMISSIONS.MANAGE_COMPANIES,
    PERMISSIONS.VIEW_ALL_COMPANIES,
    PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
    PERMISSIONS.VIEW_ALL_DATA,
    PERMISSIONS.EDIT_ALL_DATA,
    PERMISSIONS.DELETE_DATA
  ],
  
  [ROLES.ADMIN]: [
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_ALL_USERS,
    PERMISSIONS.SETUP_SSO,
    PERMISSIONS.MANAGE_INTEGRATIONS,
    PERMISSIONS.VIEW_ALL_DATA,
    PERMISSIONS.EDIT_ALL_DATA,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.APPROVE_PROMOTIONS
  ],
  
  [ROLES.MANAGER]: [
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.CREATE_PROMOTIONS,
    PERMISSIONS.MANAGE_PROMOTIONS,
    PERMISSIONS.VIEW_ALL_DATA
  ],
  
  [ROLES.KAM]: [
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.CREATE_PROMOTIONS,
    PERMISSIONS.MANAGE_PROMOTIONS
  ],
  
  [ROLES.USER]: [
    PERMISSIONS.VIEW_ANALYTICS
  ]
};

class RoleService {
  constructor() {
    this.currentUser = null;
    this.currentRole = null;
    this.permissions = [];
  }

  // Initialize user role from token
  initializeFromToken(token) {
    try {
      const decoded = jwtDecode(token);
      this.currentUser = decoded;
      this.currentRole = decoded.role || ROLES.USER;
      this.permissions = ROLE_PERMISSIONS[this.currentRole] || [];
      return true;
    } catch (error) {
      console.error('Error decoding token:', error);
      return false;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Get current role
  getCurrentRole() {
    return this.currentRole;
  }

  // Check if user has specific permission
  hasPermission(permission) {
    return this.permissions.includes(permission);
  }

  // Check if user has any of the specified permissions
  hasAnyPermission(permissions) {
    return permissions.some(permission => this.hasPermission(permission));
  }

  // Check if user has all specified permissions
  hasAllPermissions(permissions) {
    return permissions.every(permission => this.hasPermission(permission));
  }

  // Check if user has specific role
  hasRole(role) {
    return this.currentRole === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles) {
    return roles.includes(this.currentRole);
  }

  // Check if user is super admin
  isSuperAdmin() {
    return this.hasRole(ROLES.SUPER_ADMIN);
  }

  // Check if user is admin (company admin)
  isAdmin() {
    return this.hasRole(ROLES.ADMIN);
  }

  // Check if user is manager
  isManager() {
    return this.hasRole(ROLES.MANAGER);
  }

  // Check if user can manage companies
  canManageCompanies() {
    return this.hasPermission(PERMISSIONS.MANAGE_COMPANIES);
  }

  // Check if user can create users
  canCreateUsers() {
    return this.hasPermission(PERMISSIONS.CREATE_USERS);
  }

  // Check if user can view all data
  canViewAllData() {
    return this.hasPermission(PERMISSIONS.VIEW_ALL_DATA);
  }

  // Check if user can edit data
  canEditData() {
    return this.hasPermission(PERMISSIONS.EDIT_ALL_DATA);
  }

  // Check if user can setup SSO
  canSetupSSO() {
    return this.hasPermission(PERMISSIONS.SETUP_SSO);
  }

  // Get user's company ID (for data filtering)
  getCompanyId() {
    return this.currentUser?.companyId || null;
  }

  // Clear role data (on logout)
  clear() {
    this.currentUser = null;
    this.currentRole = null;
    this.permissions = [];
  }

  // Get role display name
  getRoleDisplayName(role = this.currentRole) {
    const roleNames = {
      [ROLES.SUPER_ADMIN]: 'Super Administrator',
      [ROLES.ADMIN]: 'Company Administrator',
      [ROLES.MANAGER]: 'Manager',
      [ROLES.KAM]: 'Key Account Manager',
      [ROLES.USER]: 'User'
    };
    return roleNames[role] || 'Unknown Role';
  }

  // Get available roles for user creation (based on current user's role)
  getAvailableRoles() {
    if (this.isSuperAdmin()) {
      return [
        { value: ROLES.ADMIN, label: 'Company Administrator' },
        { value: ROLES.MANAGER, label: 'Manager' },
        { value: ROLES.KAM, label: 'Key Account Manager' },
        { value: ROLES.USER, label: 'User' }
      ];
    } else if (this.isAdmin()) {
      return [
        { value: ROLES.MANAGER, label: 'Manager' },
        { value: ROLES.KAM, label: 'Key Account Manager' },
        { value: ROLES.USER, label: 'User' }
      ];
    } else {
      return [];
    }
  }
}

// Create singleton instance
const roleService = new RoleService();

// Initialize from stored token on app start
const token = localStorage.getItem('token');
if (token) {
  roleService.initializeFromToken(token);
}

export { ROLES, PERMISSIONS, roleService };
export default roleService;