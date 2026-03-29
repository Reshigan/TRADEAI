import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Alert } from '@mui/material';
import { Plus } from 'lucide-react';
import { tradingTermsService } from '../../services/api';
import { SmartTable, PageHeader, SmartField } from '../../components/shared';
import { useToast } from '../../components/common/ToastNotification';

export default function TradingTermsList() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', term_type: 'rebate', rate: '', frequency: 'monthly', customer_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await tradingTermsService.getAll();
      const data = res?.data || res || [];
      setItems(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); toast.error('An error occurred'); setFetchError(e.message || 'Failed to load data'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    setSaving(true); setError('');
    try { await tradingTermsService.create({ ...form, rate: Number(form.rate) }); setShowCreate(false); load(); } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  const columns = [
    { field: 'name', headerName: 'Name' },
    { field: 'term_type', headerName: 'Type', renderCell: ({ row }) => (row.term_type || '').replace(/_/g, ' ') },
    { field: 'rate', headerName: 'Rate', align: 'right', renderCell: ({ row }) => row.rate ? `${Number(row.rate).toFixed(1)}%` : '—' },
    { field: 'frequency', headerName: 'Frequency' },
    { field: 'customer_name', headerName: 'Customer' },
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
        title="Trading Terms"
        subtitle="Manage customer trading terms and agreements"
        actions={<Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>New Term</Button>}
      />
      <SmartTable
        columns={columns}
        data={items}
        loading={loading}
        searchPlaceholder="Search terms..."
        emptyMessage="No trading terms found"
      />

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Trading Term</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><SmartField name="name" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Grid>
            <Grid item xs={6}>
              <SmartField name="term_type" label="Type" type="select" value={form.term_type} onChange={(e) => setForm({ ...form, term_type: e.target.value })}
                options={[{ value: 'rebate', label: 'Rebate' }, { value: 'discount', label: 'Discount' }, { value: 'allowance', label: 'Allowance' }, { value: 'listing_fee', label: 'Listing Fee' }]} />
            </Grid>
            <Grid item xs={6}><SmartField name="rate" label="Rate (%)" type="percent" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <SmartField name="frequency" label="Frequency" type="select" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                options={[{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'annual', label: 'Annual' }]} />
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
