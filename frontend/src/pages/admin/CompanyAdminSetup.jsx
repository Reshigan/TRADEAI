/**
 * Company Admin Setup Page
 * Company Admin UI for managing permissions, roles, and system configuration within their company
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid,
  Button, Tabs, Tab, CircularProgress, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Switch, FormControlLabel, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Checkbox, Alert
} from '@mui/material';
import {
  People, Settings, Save, Add, Edit, Delete,
  AdminPanelSettings,
  VpnKey
} from '@mui/icons-material';
import api from '../../services/api';

const PERMISSION_MODULES = [
  { module: 'promotions', label: 'Promotions', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
  { module: 'budgets', label: 'Budgets', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
  { module: 'trade_spends', label: 'Trade Spends', actions: ['view', 'create', 'edit', 'delete'] },
  { module: 'claims', label: 'Claims', actions: ['view', 'create', 'edit', 'approve', 'settle'] },
  { module: 'deductions', label: 'Deductions', actions: ['view', 'create', 'edit', 'reconcile'] },
  { module: 'customers', label: 'Customers', actions: ['view', 'create', 'edit', 'delete', 'import'] },
  { module: 'products', label: 'Products', actions: ['view', 'create', 'edit', 'delete', 'import'] },
  { module: 'reports', label: 'Reports', actions: ['view', 'create', 'export'] },
  { module: 'admin', label: 'Administration', actions: ['view', 'manage_users', 'manage_roles', 'system_config'] },
];

const CompanyAdminSetup = () => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [systemConfig, setSystemConfig] = useState({});
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [roleForm, setRoleForm] = useState({
    name: '', description: '', role_type: 'custom', level: 0,
    permissions: [], max_approval_amount: ''
  });

  const fetchRoles = useCallback(async () => {
    try {
      const response = await api.get('/role-management');
      setRoles(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles([]);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/users');
      const data = response.data?.data || response.data || [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  }, []);

  const fetchSystemConfig = useCallback(async () => {
    try {
      const response = await api.get('/system-config');
      setSystemConfig(response.data?.data || {});
    } catch (error) {
      console.error('Error fetching system config:', error);
      setSystemConfig({});
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchRoles(), fetchUsers(), fetchSystemConfig()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchRoles, fetchUsers, fetchSystemConfig]);

  const handleOpenRoleDialog = (role = null) => {
    if (role) {
      setEditingRole(role);
      let perms = role.permissions || [];
      if (typeof perms === 'string') {
        try { perms = JSON.parse(perms); } catch (e) { perms = []; }
      }
      setRoleForm({
        name: role.name || '',
        description: role.description || '',
        role_type: role.role_type || 'custom',
        level: role.level || 0,
        permissions: perms,
        max_approval_amount: role.max_approval_amount || ''
      });
    } else {
      setEditingRole(null);
      setRoleForm({ name: '', description: '', role_type: 'custom', level: 0, permissions: [], max_approval_amount: '' });
    }
    setRoleDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!roleForm.name) return;
    setSaving(true);
    try {
      if (editingRole) {
        await api.put(`/role-management/${editingRole.id}`, roleForm);
      } else {
        await api.post('/role-management', roleForm);
      }
      setRoleDialogOpen(false);
      fetchRoles();
      setSnackbar({ open: true, message: 'Role saved successfully', severity: 'success' });
    } catch (error) {
      console.error('Error saving role:', error);
      setSnackbar({ open: true, message: 'Failed to save role', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Delete this role? All user assignments will be removed.')) return;
    try {
      await api.delete(`/role-management/${roleId}`);
      fetchRoles();
      setSnackbar({ open: true, message: 'Role deleted', severity: 'success' });
    } catch (error) {
      console.error('Error deleting role:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to delete role', severity: 'error' });
    }
  };

  const handleTogglePermission = (permKey) => {
    setRoleForm(prev => {
      const perms = [...prev.permissions];
      const idx = perms.indexOf(permKey);
      if (idx >= 0) perms.splice(idx, 1);
      else perms.push(permKey);
      return { ...prev, permissions: perms };
    });
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await api.put('/system-config', systemConfig);
      setSnackbar({ open: true, message: 'System configuration saved', severity: 'success' });
    } catch (error) {
      console.error('Error saving config:', error);
      setSnackbar({ open: true, message: 'Failed to save config', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAssignRole = async (userId, roleId) => {
    try {
      await api.post('/role-management/assignments', { user_id: userId, role_id: roleId });
      setSnackbar({ open: true, message: 'Role assigned', severity: 'success' });
    } catch (error) {
      console.error('Error assigning role:', error);
      setSnackbar({ open: true, message: 'Failed to assign role', severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AdminPanelSettings sx={{ mr: 1, fontSize: 28, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight={700}>Company Administration</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage roles, permissions, user assignments, and system configuration for your company.
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<VpnKey />} iconPosition="start" label="Roles & Permissions" />
          <Tab icon={<People />} iconPosition="start" label="User Assignments" />
          <Tab icon={<Settings />} iconPosition="start" label="System Config" />
        </Tabs>
      </Paper>

      {/* Tab 0: Roles & Permissions */}
      {tab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Roles</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenRoleDialog()}>
              Create Role
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Role Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Level</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Permissions</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map(role => {
                  let perms = role.permissions || [];
                  if (typeof perms === 'string') { try { perms = JSON.parse(perms); } catch (e) { perms = []; } }
                  return (
                    <TableRow key={role.id} hover>
                      <TableCell>
                        <Typography fontWeight={600}>{role.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{role.description}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={role.role_type || 'custom'} size="small" color={role.is_system ? 'primary' : 'default'} />
                      </TableCell>
                      <TableCell>{role.level}</TableCell>
                      <TableCell>{Array.isArray(perms) ? perms.length : 0} permissions</TableCell>
                      <TableCell>
                        <Chip label={role.is_active !== 0 ? 'Active' : 'Inactive'} size="small" color={role.is_active !== 0 ? 'success' : 'default'} />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleOpenRoleDialog(role)}><Edit fontSize="small" /></IconButton>
                        {!role.is_system && (
                          <IconButton size="small" color="error" onClick={() => handleDeleteRole(role.id)}><Delete fontSize="small" /></IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {roles.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center">No roles defined. Create one to get started.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Tab 1: User Assignments */}
      {tab === 1 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>User Role Assignments</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Current Role</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Assign Role</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map(user => {
                  const userId = user.id || user._id;
                  return (
                    <TableRow key={userId} hover>
                      <TableCell>
                        <Typography fontWeight={600}>
                          {user.firstName || user.first_name} {user.lastName || user.last_name}
                        </Typography>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip label={user.role || 'user'} size="small" color="primary" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.isActive || user.is_active ? 'Active' : 'Inactive'}
                          size="small"
                          color={user.isActive || user.is_active ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          value=""
                          onChange={(e) => handleAssignRole(userId, e.target.value)}
                          sx={{ minWidth: 150 }}
                          label="Assign"
                        >
                          {roles.map(r => (
                            <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {users.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center">No users found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Tab 2: System Config */}
      {tab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">System Configuration</Typography>
            <Button variant="contained" startIcon={<Save />} onClick={handleSaveConfig} disabled={saving}>
              {saving ? 'Saving...' : 'Save Config'}
            </Button>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>General Settings</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth label="Company Name" value={systemConfig.companyName || ''}
                      onChange={(e) => setSystemConfig(prev => ({ ...prev, companyName: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select fullWidth label="Currency" value={systemConfig.currency || 'ZAR'}
                      onChange={(e) => setSystemConfig(prev => ({ ...prev, currency: e.target.value }))}
                    >
                      <MenuItem value="ZAR">ZAR - South African Rand</MenuItem>
                      <MenuItem value="USD">USD - US Dollar</MenuItem>
                      <MenuItem value="EUR">EUR - Euro</MenuItem>
                      <MenuItem value="GBP">GBP - British Pound</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select fullWidth label="Fiscal Year Start" value={systemConfig.fiscalYearStart || 'January'}
                      onChange={(e) => setSystemConfig(prev => ({ ...prev, fiscalYearStart: e.target.value }))}
                    >
                      {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
                        <MenuItem key={m} value={m}>{m}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Approval Settings</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch checked={!!systemConfig.requireApproval} onChange={(e) => setSystemConfig(prev => ({ ...prev, requireApproval: e.target.checked }))} />}
                      label="Require approvals for promotions"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch checked={!!systemConfig.requireBudgetApproval} onChange={(e) => setSystemConfig(prev => ({ ...prev, requireBudgetApproval: e.target.checked }))} />}
                      label="Require approvals for budgets"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth label="Auto-approve threshold (amount)" type="number"
                      value={systemConfig.autoApproveThreshold || ''}
                      onChange={(e) => setSystemConfig(prev => ({ ...prev, autoApproveThreshold: parseFloat(e.target.value) || 0 }))}
                      helperText="Amounts below this are auto-approved"
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Notification Settings</Typography>
                <FormControlLabel
                  control={<Switch checked={!!systemConfig.emailNotifications} onChange={(e) => setSystemConfig(prev => ({ ...prev, emailNotifications: e.target.checked }))} />}
                  label="Enable email notifications"
                />
                <FormControlLabel
                  control={<Switch checked={!!systemConfig.approvalNotifications} onChange={(e) => setSystemConfig(prev => ({ ...prev, approvalNotifications: e.target.checked }))} />}
                  label="Notify on pending approvals"
                />
                <FormControlLabel
                  control={<Switch checked={!!systemConfig.budgetAlerts} onChange={(e) => setSystemConfig(prev => ({ ...prev, budgetAlerts: e.target.checked }))} />}
                  label="Budget threshold alerts"
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Data Settings</Typography>
                <FormControlLabel
                  control={<Switch checked={!!systemConfig.allowBulkImport} onChange={(e) => setSystemConfig(prev => ({ ...prev, allowBulkImport: e.target.checked }))} />}
                  label="Allow bulk data import"
                />
                <FormControlLabel
                  control={<Switch checked={!!systemConfig.allowDataExport} onChange={(e) => setSystemConfig(prev => ({ ...prev, allowDataExport: e.target.checked }))} />}
                  label="Allow data export"
                />
                <FormControlLabel
                  control={<Switch checked={!!systemConfig.auditLogging} onChange={(e) => setSystemConfig(prev => ({ ...prev, auditLogging: e.target.checked }))} />}
                  label="Enable audit logging"
                />
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Role Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Role Name" required value={roleForm.name}
                onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Role Type" value={roleForm.role_type}
                onChange={(e) => setRoleForm(prev => ({ ...prev, role_type: e.target.value }))}>
                <MenuItem value="system">System</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={2} value={roleForm.description}
                onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Level (hierarchy)" type="number" value={roleForm.level}
                onChange={(e) => setRoleForm(prev => ({ ...prev, level: parseInt(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Max Approval Amount" type="number" value={roleForm.max_approval_amount}
                onChange={(e) => setRoleForm(prev => ({ ...prev, max_approval_amount: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Permissions</Typography>
              {PERMISSION_MODULES.map(mod => (
                <Box key={mod.module} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>{mod.label}</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {mod.actions.map(action => {
                      const permKey = `${mod.module}:${action}`;
                      const checked = roleForm.permissions.includes(permKey);
                      return (
                        <FormControlLabel
                          key={permKey}
                          control={<Checkbox size="small" checked={checked} onChange={() => handleTogglePermission(permKey)} />}
                          label={action}
                          sx={{ mr: 2 }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveRole} disabled={saving || !roleForm.name}>
            {saving ? 'Saving...' : editingRole ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {snackbar.open && (
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}
        >
          {snackbar.message}
        </Alert>
      )}
    </Box>
  );
};

export default CompanyAdminSetup;
