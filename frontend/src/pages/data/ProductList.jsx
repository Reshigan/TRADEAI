import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Alert } from '@mui/material';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { productService } from '../../services/api';
import { SmartTable, PageHeader, SmartField } from '../../components/shared';
import { useToast } from '../../components/common/ToastNotification';
import useConfirmDialog from '../../hooks/useConfirmDialog';

export default function ProductList() {
  const toast = useToast();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', category: '', brand: '', unit_price: '', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await productService.getAll();
      const data = res?.data || res || [];
      setItems(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); toast.error('An error occurred'); setFetchError(e.message || 'Failed to load data'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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
    if (!await confirm('Delete?', { severity: 'error' })) return;
    try { await productService.delete(id); load(); } catch (e) { console.error(e); toast.error('An error occurred'); }
  };

  const columns = [
    { field: 'name', headerName: 'Name', renderCell: ({ row }) => row.name || row.product_name || '—' },
    { field: 'sku', headerName: 'SKU' },
    { field: 'category', headerName: 'Category' },
    { field: 'brand', headerName: 'Brand' },
    { field: 'unit_price', headerName: 'Unit Price', align: 'right', renderCell: ({ row }) => `R ${Number(row.unit_price || 0).toFixed(2)}` },
    { field: 'status', headerName: 'Status', type: 'status' },
  ];

  const rowActions = [
    { label: 'Edit', icon: <Edit2 size={16} />, onClick: (row) => { setForm({ name: row.name || row.product_name || '', sku: row.sku || '', category: row.category || '', brand: row.brand || '', unit_price: row.unit_price || '', status: row.status || 'active' }); setEditId(row.id); setShowCreate(true); } },
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
        title="Products"
        subtitle="Manage product master data"
        actions={
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => { setEditId(null); setForm({ name: '', sku: '', category: '', brand: '', unit_price: '', status: 'active' }); setShowCreate(true); }}>
            Add Product
          </Button>
        }
      />
      <SmartTable
        columns={columns}
        data={items}
        loading={loading}
        rowActions={rowActions}
        searchPlaceholder="Search products..."
        emptyMessage="No products found"
      />

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><SmartField name="name" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Grid>
            <Grid item xs={6}><SmartField name="sku" label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></Grid>
            <Grid item xs={6}><SmartField name="category" label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Grid>
            <Grid item xs={6}><SmartField name="brand" label="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></Grid>
            <Grid item xs={6}><SmartField name="unit_price" label="Unit Price" type="currency" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <SmartField name="status" label="Status" type="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
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
