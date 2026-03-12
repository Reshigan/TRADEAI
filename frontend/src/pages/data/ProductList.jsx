import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, LinearProgress, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Grid, MenuItem, Alert } from '@mui/material';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { productService } from '../../services/api';

export default function ProductList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', category: '', brand: '', unit_price: '', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);

  const load = useCallback(async () => {
    try { const res = await productService.getAll(); setItems(res.data || res || []); } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(i => (i.name || i.product_name || i.sku || '').toLowerCase().includes(search.toLowerCase()));

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const payload = { ...form, unit_price: Number(form.unit_price) || 0 };
      if (editId) { await productService.update(editId, payload); }
      else { await productService.create(payload); }
      setShowCreate(false); setEditId(null); load();
    } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    try { await productService.delete(id); load(); } catch (e) { console.error(e); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h1">Products</Typography><Typography variant="body2" color="text.secondary">Manage product master data</Typography></Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => { setEditId(null); setForm({ name: '', sku: '', category: '', brand: '', unit_price: '', status: 'active' }); setShowCreate(true); }}>Add Product</Button>
      </Box>
      <Card>
        <CardContent>
          <TextField placeholder="Search products..." size="small" value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} /> }} sx={{ mb: 2, maxWidth: 360, width: '100%' }} />
          {loading ? <LinearProgress /> : (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Name</TableCell><TableCell>SKU</TableCell><TableCell>Category</TableCell><TableCell>Brand</TableCell><TableCell align="right">Unit Price</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No products found</Typography></TableCell></TableRow>
                  ) : filtered.map(i => (
                    <TableRow key={i.id}>
                      <TableCell><Typography variant="body2" fontWeight={500}>{i.name || i.product_name}</Typography></TableCell>
                      <TableCell>{i.sku || '-'}</TableCell>
                      <TableCell>{i.category || '-'}</TableCell>
                      <TableCell>{i.brand || '-'}</TableCell>
                      <TableCell align="right">R {Number(i.unit_price || 0).toFixed(2)}</TableCell>
                      <TableCell><Chip label={i.status || 'active'} size="small" color={i.status === 'active' ? 'success' : 'default'} /></TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => { setForm({ name: i.name || i.product_name || '', sku: i.sku || '', category: i.category || '', brand: i.brand || '', unit_price: i.unit_price || '', status: i.status || 'active' }); setEditId(i.id); setShowCreate(true); }}><Edit2 size={16} /></IconButton>
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
        <DialogTitle>{editId ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><TextField fullWidth label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Unit Price" type="number" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} /></Grid>
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
