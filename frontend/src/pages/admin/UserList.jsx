import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, LinearProgress, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Grid, MenuItem, Alert, Avatar } from '@mui/material';
import { Plus, Search, Edit2, Trash2, Shield } from 'lucide-react';
import { userService } from '../../services/api';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'kam', password: '', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);

  const load = useCallback(async () => {
    try { const res = await userService.getAll(); setUsers(res.data || res || []); } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u => (u.name || u.email || '').toLowerCase().includes(search.toLowerCase()));

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (editId) { await userService.update(editId, form); }
      else { await userService.create(form); }
      setShowCreate(false); setEditId(null); load();
    } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try { await userService.delete(id); load(); } catch (e) { console.error(e); }
  };

  const roleColor = (r) => ({ super_admin: '#DC2626', admin: '#7C3AED', manager: '#2563EB', kam: '#059669', finance: '#F59E0B', viewer: '#94A3B8' }[r] || '#94A3B8');

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h1">Users</Typography><Typography variant="body2" color="text.secondary">Manage system users and access</Typography></Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => { setEditId(null); setForm({ name: '', email: '', role: 'kam', password: '', status: 'active' }); setShowCreate(true); }}>Add User</Button>
      </Box>
      <Card>
        <CardContent>
          <TextField placeholder="Search users..." size="small" value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} /> }} sx={{ mb: 2, maxWidth: 360, width: '100%' }} />
          {loading ? <LinearProgress /> : (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>User</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell><TableCell>Status</TableCell><TableCell>Last Login</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No users found</Typography></TableCell></TableRow>
                  ) : filtered.map(u => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: roleColor(u.role) }}>{(u.name || u.email || '?')[0].toUpperCase()}</Avatar>
                          <Typography variant="body2" fontWeight={500}>{u.name || u.email}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell><Chip icon={<Shield size={12} />} label={(u.role || 'user').replace('_', ' ')} size="small" sx={{ bgcolor: `${roleColor(u.role)}15`, color: roleColor(u.role), fontWeight: 600, textTransform: 'capitalize', '& .MuiChip-icon': { color: roleColor(u.role) } }} /></TableCell>
                      <TableCell><Chip label={u.status || 'active'} size="small" color={u.status === 'active' ? 'success' : 'default'} /></TableCell>
                      <TableCell>{u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => { setForm({ name: u.name || '', email: u.email || '', role: u.role || 'kam', password: '', status: u.status || 'active' }); setEditId(u.id); setShowCreate(true); }}><Edit2 size={16} /></IconButton>
                        <IconButton size="small" onClick={() => handleDelete(u.id)}><Trash2 size={16} /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><TextField fullWidth label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <MenuItem value="super_admin">Super Admin</MenuItem><MenuItem value="admin">Admin</MenuItem><MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="kam">KAM</MenuItem><MenuItem value="finance">Finance</MenuItem><MenuItem value="viewer">Viewer</MenuItem>
            </TextField></Grid>
            <Grid item xs={6}><TextField fullWidth label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editId} helperText={editId ? 'Leave blank to keep current' : ''} /></Grid>
            <Grid item xs={6}><TextField fullWidth select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem><MenuItem value="suspended">Suspended</MenuItem>
            </TextField></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setShowCreate(false)}>Cancel</Button><Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editId ? 'Update' : 'Create'}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
