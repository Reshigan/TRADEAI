import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Avatar, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Alert } from '@mui/material';
import { Plus, Edit2, Trash2, Shield } from 'lucide-react';
import { userService } from '../../services/api';
import { SmartTable, PageHeader, SmartField } from '../../components/shared';
import { useToast } from '../../components/common/ToastNotification';
import useConfirmDialog from '../../hooks/useConfirmDialog';

export default function UserList() {
  const toast = useToast();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'kam', password: '', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try { const res = await userService.getAll(); setUsers(res.data || res || []); } catch (e) { console.error(e); toast.error('An error occurred'); setFetchError(e.message || 'Failed to load data'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (editId) { await userService.update(editId, form); }
      else { await userService.create(form); }
      setShowCreate(false); setEditId(null); setForm({ name: '', email: '', role: 'kam', password: '', status: 'active' }); load();
    } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!await confirm('Delete this user?', { severity: 'error' })) return;
    try { await userService.delete(id); load(); } catch (e) { console.error(e); toast.error('An error occurred'); }
  };

  const roleColor = (r) => ({ super_admin: '#DC2626', admin: '#7C3AED', manager: '#2563EB', kam: '#059669', finance: '#F59E0B', viewer: '#94A3B8' }[r] || '#94A3B8');

  const columns = [
    { field: 'name', headerName: 'User', renderCell: ({ row }) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: roleColor(row.role) }}>{(row.name || row.email || '?')[0].toUpperCase()}</Avatar>
        {row.name || row.email}
      </Box>
    )},
    { field: 'email', headerName: 'Email' },
    { field: 'role', headerName: 'Role', renderCell: ({ row }) => (
      <Chip icon={<Shield size={12} />} label={(row.role || 'user').replace('_', ' ')} size="small"
        sx={{ bgcolor: `${roleColor(row.role)}15`, color: roleColor(row.role), fontWeight: 600, textTransform: 'capitalize', '& .MuiChip-icon': { color: roleColor(row.role) } }} />
    )},
    { field: 'status', headerName: 'Status', type: 'status' },
    { field: 'last_login', headerName: 'Last Login', renderCell: ({ row }) => row.last_login ? new Date(row.last_login).toLocaleDateString() : 'Never' },
  ];

  const rowActions = [
    { label: 'Edit', icon: <Edit2 size={16} />, onClick: (row) => { setForm({ name: row.name || '', email: row.email || '', role: row.role || 'kam', password: '', status: row.status || 'active' }); setEditId(row.id); setShowCreate(true); } },
    { label: 'Delete', icon: <Trash2 size={16} />, onClick: (row) => handleDelete(row.id) },
  ];

  return (
    <Box>
      {fetchError && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => { setFetchError(null); load(); }}>Retry</Button>}>
          {fetchError}
        </Alert>
      )}
      <PageHeader
        title="Users"
        subtitle="Manage system users and access"
        actions={
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => { setEditId(null); setForm({ name: '', email: '', role: 'kam', password: '', status: 'active' }); setShowCreate(true); }}>
            Add User
          </Button>
        }
      />
      <SmartTable
        columns={columns}
        data={users}
        loading={loading}
        rowActions={rowActions}
        searchPlaceholder="Search users..."
        emptyMessage="No users found"
      />

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <SmartField name="name" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Grid>
            <Grid item xs={6}>
              <SmartField name="email" label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </Grid>
            <Grid item xs={6}>
              <SmartField name="role" label="Role" type="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                options={[{ value: 'super_admin', label: 'Super Admin' }, { value: 'admin', label: 'Admin' }, { value: 'manager', label: 'Manager' }, { value: 'kam', label: 'KAM' }, { value: 'finance', label: 'Finance' }, { value: 'viewer', label: 'Viewer' }]} />
            </Grid>
            <Grid item xs={6}>
              <SmartField name="password" label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editId} helperText={editId ? 'Leave blank to keep current' : ''} />
            </Grid>
            <Grid item xs={6}>
              <SmartField name="status" label="Status" type="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'suspended', label: 'Suspended' }]} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    {ConfirmDialogComponent}
    </Box>
  );
}
