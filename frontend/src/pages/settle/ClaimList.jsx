import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Alert } from '@mui/material';
import { Plus, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { claimService, customerService } from '../../services/api';
import { useTerminology } from '../../contexts/TerminologyContext';
import { SmartTable, PageHeader, SmartField } from '../../components/shared';
import { useToast } from '../../components/common/ToastNotification';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function ClaimList() {
  const toast = useToast();
  const navigate = useNavigate();
  const { t, tPlural } = useTerminology();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ claim_type: 'promotion', amount: '', customer_id: '', description: '', promotion_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [res, cust] = await Promise.allSettled([claimService.getAll(), customerService.getAll()]);
      if (res.status === 'fulfilled') setClaims(res.value.data || res.value || []);
      if (cust.status === 'fulfilled') setCustomers(cust.value.data || cust.value || []);
    } catch (e) { console.error(e); toast.error('An error occurred'); setFetchError(e.message || 'Failed to load data'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    setSaving(true); setError('');
    try {
      await claimService.create({ ...form, amount: Number(form.amount) });
      setShowCreate(false); load();
    } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  const columns = [
    { field: 'description', headerName: 'Description', renderCell: ({ row }) => row.description || row.reason || row.claimType || row.claim_type || '—' },
    { field: 'claimType', headerName: 'Type', renderCell: ({ row }) => (row.claimType || row.claim_type || '').replace(/_/g, ' ') },
    { field: 'customerName', headerName: 'Customer', renderCell: ({ row }) => row.customerName || row.customer_name || '—' },
    { field: 'claimedAmount', headerName: 'Amount', type: 'currency', align: 'right', renderCell: ({ row }) => fmt(row.claimedAmount || row.claimed_amount || row.amount) },
    { field: 'status', headerName: 'Status', type: 'status' },
    { field: 'createdAt', headerName: 'Date', type: 'date', renderCell: ({ row }) => { const d = row.createdAt || row.created_at; return d ? new Date(d).toLocaleDateString() : '—'; } },
  ];

  const rowActions = [
    { label: 'View', icon: <Eye size={16} />, onClick: (row) => navigate(`/settle/claims/${row.id}`) },
  ];

  const customerOptions = customers.map(c => ({ value: c.id, label: c.name || c.customer_name }));

  return (
    <Box>
      {fetchError && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => { setFetchError(null); load(); }}>Retry</Button>}>
          {fetchError}
        </Alert>
      )}
      <PageHeader
        title={tPlural('claim')}
        subtitle={`Manage ${t('promotion').toLowerCase()} ${tPlural('claim').toLowerCase()} and reimbursements`}
        actions={
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
            New {t('claim')}
          </Button>
        }
      />
      <SmartTable
        columns={columns}
        data={claims}
        loading={loading}
        onRowClick={(row) => navigate(`/settle/claims/${row.id}`)}
        rowActions={rowActions}
        searchPlaceholder={`Search ${tPlural('claim').toLowerCase()}...`}
        emptyMessage={`No ${tPlural('claim').toLowerCase()} found`}
      />

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create {t('claim')}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <SmartField name="description" label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </Grid>
            <Grid item xs={6}>
              <SmartField name="amount" label="Amount" type="currency" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </Grid>
            <Grid item xs={6}>
              <SmartField name="claim_type" label="Type" type="select" value={form.claim_type} onChange={(e) => setForm({ ...form, claim_type: e.target.value })}
                options={[{ value: 'promotion', label: 'Promotion' }, { value: 'display', label: 'Display' }, { value: 'rebate', label: 'Rebate' }, { value: 'damage', label: 'Damage' }]} />
            </Grid>
            <Grid item xs={12}>
              <SmartField name="customer_id" label="Customer" type="select" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                options={customerOptions} />
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
