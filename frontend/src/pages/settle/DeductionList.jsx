import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Alert } from '@mui/material';
import { Plus, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { deductionService, customerService } from '../../services/api';
import { useTerminology } from '../../contexts/TerminologyContext';
import { SmartTable, PageHeader, SmartField } from '../../components/shared';
import { useToast } from '../../components/common/ToastNotification';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function DeductionList() {
  const toast = useToast();
  const navigate = useNavigate();
  const { t, tPlural } = useTerminology();
  const [deductions, setDeductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ deduction_type: 'trade_promotion', amount: '', customer_id: '', description: '', invoice_number: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [res, cust] = await Promise.allSettled([deductionService.getAll(), customerService.getAll()]);
      if (res.status === 'fulfilled') setDeductions(res.value.data || res.value || []);
      if (cust.status === 'fulfilled') setCustomers(cust.value.data || cust.value || []);
    } catch (e) { console.error(e); toast.error('An error occurred'); setFetchError(e.message || 'Failed to load data'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    setSaving(true); setError('');
    try {
      await deductionService.create({ ...form, amount: Number(form.amount) });
      setShowCreate(false); load();
    } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  const columns = [
    { field: 'description', headerName: 'Description', renderCell: ({ row }) => row.description || row.deduction_type || '—' },
    { field: 'invoice_number', headerName: 'Invoice' },
    { field: 'customer_name', headerName: 'Customer' },
    { field: 'amount', headerName: 'Amount', type: 'currency', align: 'right', renderCell: ({ row }) => fmt(row.amount) },
    { field: 'status', headerName: 'Status', type: 'status' },
    { field: 'created_at', headerName: 'Date', type: 'date' },
  ];

  const rowActions = [
    { label: 'View', icon: <Eye size={16} />, onClick: (row) => navigate(`/settle/deductions/${row.id}`) },
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
        title={tPlural('deduction')}
        subtitle={`Track and resolve ${t('customer').toLowerCase()} ${tPlural('deduction').toLowerCase()}`}
        actions={
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
            New {t('deduction')}
          </Button>
        }
      />
      <SmartTable
        columns={columns}
        data={deductions}
        loading={loading}
        onRowClick={(row) => navigate(`/settle/deductions/${row.id}`)}
        rowActions={rowActions}
        searchPlaceholder={`Search ${tPlural('deduction').toLowerCase()}...`}
        emptyMessage={`No ${tPlural('deduction').toLowerCase()} found`}
      />

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create {t('deduction')}</DialogTitle>
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
              <SmartField name="invoice_number" label="Invoice Number" value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <SmartField name="deduction_type" label="Type" type="select" value={form.deduction_type} onChange={(e) => setForm({ ...form, deduction_type: e.target.value })}
                options={[{ value: 'trade_promotion', label: 'Trade Promotion' }, { value: 'damage', label: 'Damage' }, { value: 'shortage', label: 'Shortage' }, { value: 'pricing', label: 'Pricing' }]} />
            </Grid>
            <Grid item xs={6}>
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
