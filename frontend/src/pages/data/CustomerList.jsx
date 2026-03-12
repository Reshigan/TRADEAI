import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, LinearProgress, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Grid, MenuItem, Alert } from '@mui/material';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { customerService } from '../../services/api';

export default function CustomerList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', channel: 'retail', region: '', tier: 'A', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);

  const load = useCallback(async () => {
    try { const res = await customerService.getAll(); setItems(res.data || res || []); } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(i => (i.name || i.customer_name || '').toLowerCase().includes(search.toLowerCase()));

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (editId) { await customerService.update(editId, form); }
      else { await customerService.create(form); }
      setShowCreate(false); setEditId(null); setForm({ name: '', code: '', channel: 'retail', region: '', tier: 'A', status: 'active' }); load();
    } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  const handleEdit = (item) => {
    setForm({ name: item.name || item.customer_name || '', code: item.code || item.customer_code || '', channel: item.channel || 'retail', region: item.region || '', tier: item.tier || 'A', status: item.status || 'active' });
    setEditId(item.id); setShowCreate(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try { await customerService.delete(id); load(); } catch (e) { console.error(e); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h1">Customers</Typography><Typography variant="body2" color="text.secondary">Manage customer master data</Typography></Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => { setEditId(null); setForm({ name: '', code: '', channel: 'retail', region: '', tier: 'A', status: 'active' }); setShowCreate(true); }}>Add Customer</Button>
      </Box>
      <Card>
        <CardContent>
          <TextField placeholder="Search customers..." size="small" value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} /> }} sx={{ mb: 2, maxWidth: 360, width: '100%' }} />
          {loading ? <LinearProgress /> : (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Code</TableCell><TableCell>Channel</TableCell><TableCell>Region</TableCell><TableCell>Tier</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No customers found</Typography></TableCell></TableRow>
                  ) : filtered.map(i => (
                    <TableRow key={i.id}>
                      <TableCell><Typography variant="body2" fontWeight={500}>{i.name || i.customer_name}</Typography></TableCell>
                      <TableCell>{i.code || i.customer_code || '-'}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{i.channel || '-'}</TableCell>
                      <TableCell>{i.region || '-'}</TableCell>
                      <TableCell><Chip label={i.tier || '-'} size="small" /></TableCell>
                      <TableCell><Chip label={i.status || 'active'} size="small" color={i.status === 'active' ? 'success' : 'default'} /></TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleEdit(i)}><Edit2 size={16} /></IconButton>
                        <IconButton size="small" onClick={() => handleDelete(i.id)}><Trash2 size={16} /></IconButton>
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
        <DialogTitle>{editId ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><TextField fullWidth label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth select label="Channel" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
              <MenuItem value="retail">Retail</MenuItem><MenuItem value="wholesale">Wholesale</MenuItem><MenuItem value="online">Online</MenuItem><MenuItem value="foodservice">Food Service</MenuItem>
            </TextField></Grid>
            <Grid item xs={6}><TextField fullWidth label="Region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth select label="Tier" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })}>
              <MenuItem value="A">A</MenuItem><MenuItem value="B">B</MenuItem><MenuItem value="C">C</MenuItem>
            </TextField></Grid>
            <Grid item xs={6}><TextField fullWidth select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem>
            </TextField></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setShowCreate(false)}>Cancel</Button><Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editId ? 'Update' : 'Create'}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
