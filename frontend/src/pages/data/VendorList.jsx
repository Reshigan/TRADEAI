import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Alert } from '@mui/material';
import { Plus } from 'lucide-react';
import api from '../../services/api';
import { SmartTable, PageHeader, SmartField } from '../../components/shared';
import { useToast } from '../../components/common/ToastNotification';

export default function VendorList() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', contact_email: '', payment_terms: 'net_30', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await api.get('/vendors');
      const data = res.data?.data || res.data || [];
      setItems(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); setFetchError(e.message || 'Failed to load data'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    setSaving(true); setError('');
    try { await api.post('/vendors', form); setShowCreate(false); load(); } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  const columns = [
    { field: 'name', headerName: 'Name' },
    { field: 'code', headerName: 'Code' },
    { field: 'contact_email', headerName: 'Contact' },
    { field: 'payment_terms', headerName: 'Payment Terms', renderCell: ({ row }) => (row.payment_terms || '').replace(/_/g, ' ') },
    { field: 'status', headerName: 'Status', type: 'status' },
  ];

  return (
    <Box>
      {fetchError && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => { setFetchError(null); load(); }}>Retry</Button>}>
          {fetchError}
        </Alert>
      )}
      <PageHeader
        title="Vendors"
        subtitle="Manage vendor/supplier master data"
        actions={<Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>Add Vendor</Button>}
      />
      <SmartTable
        columns={columns}
        data={items}
        loading={loading}
        searchPlaceholder="Search vendors..."
        emptyMessage="No vendors found"
      />

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Vendor</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><SmartField name="name" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Grid>
            <Grid item xs={6}><SmartField name="code" label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Grid>
            <Grid item xs={6}><SmartField name="contact_email" label="Contact Email" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <SmartField name="payment_terms" label="Payment Terms" type="select" value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                options={[{ value: 'net_30', label: 'Net 30' }, { value: 'net_60', label: 'Net 60' }, { value: 'net_90', label: 'Net 90' }]} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
