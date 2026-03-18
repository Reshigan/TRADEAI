import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Alert } from '@mui/material';
import { Plus } from 'lucide-react';
import api from '../../services/api';
import { SmartTable, PageHeader, SmartField } from '../../components/shared';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e6 ? `R ${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function VendorFundList() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ vendor_name: '', fund_name: '', total_amount: '', fund_type: 'marketing_development', start_date: '', end_date: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/vendor-funds');
      const data = res.data?.data || res.data || [];
      setFunds(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    setSaving(true); setError('');
    try {
      await api.post('/vendor-funds', { ...form, total_amount: Number(form.total_amount) });
      setShowCreate(false);
      setForm({ vendor_name: '', fund_name: '', total_amount: '', fund_type: 'marketing_development', start_date: '', end_date: '' });
      load();
    } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  const columns = [
    { field: 'vendor_name', headerName: 'Vendor' },
    { field: 'fund_name', headerName: 'Fund Name' },
    { field: 'fund_type', headerName: 'Type', renderCell: ({ row }) => (row.fund_type || '').replace(/_/g, ' ') },
    { field: 'total_amount', headerName: 'Total', align: 'right', renderCell: ({ row }) => fmt(row.total_amount) },
    { field: 'used_amount', headerName: 'Used', align: 'right', renderCell: ({ row }) => fmt(row.used_amount) },
    { field: 'status', headerName: 'Status', type: 'status' },
  ];

  return (
    <Box>
      <PageHeader
        title="Vendor Funds"
        subtitle="Manage vendor-funded trade programs"
        actions={<Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>New Fund</Button>}
      />
      <SmartTable
        columns={columns}
        data={funds}
        loading={loading}
        searchPlaceholder="Search funds..."
        emptyMessage="No vendor funds found"
      />

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Vendor Fund</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <SmartField name="vendor_name" label="Vendor Name" value={form.vendor_name} onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} required />
            </Grid>
            <Grid item xs={6}>
              <SmartField name="fund_name" label="Fund Name" value={form.fund_name} onChange={(e) => setForm({ ...form, fund_name: e.target.value })} required />
            </Grid>
            <Grid item xs={6}>
              <SmartField name="total_amount" label="Total Amount" type="currency" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} required />
            </Grid>
            <Grid item xs={6}>
              <SmartField name="fund_type" label="Fund Type" type="select" value={form.fund_type} onChange={(e) => setForm({ ...form, fund_type: e.target.value })}
                options={[{ value: 'marketing_development', label: 'Marketing Development' }, { value: 'trade_allowance', label: 'Trade Allowance' }, { value: 'volume_rebate', label: 'Volume Rebate' }]} />
            </Grid>
            <Grid item xs={6}>
              <SmartField name="start_date" label="Start Date" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <SmartField name="end_date" label="End Date" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
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
