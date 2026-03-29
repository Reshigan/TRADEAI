import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Alert } from '@mui/material';
import { Plus, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tradeSpendService, customerService } from '../../services/api';
import { useTerminology } from '../../contexts/TerminologyContext';
import { SmartTable, PageHeader, SmartField } from '../../components/shared';
import { useToast } from '../../components/common/ToastNotification';
import useConfirmDialog from '../../hooks/useConfirmDialog';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e6 ? `R ${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function TradeSpendList() {
  const toast = useToast();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const navigate = useNavigate();
  const { t, tPlural } = useTerminology();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ notes: '', spendType: 'promotion', category: 'volume_discount', amountRequested: '', customer: '', startDate: new Date().toISOString().split('T')[0], endDate: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [res, cust] = await Promise.allSettled([tradeSpendService.getAll(), customerService.getAll()]);
      if (res.status === 'fulfilled') {
        const data = res.value?.data || res.value || [];
        setItems(Array.isArray(data) ? data : []);
      }
      if (cust.status === 'fulfilled') {
        const data = cust.value?.data || cust.value || [];
        setCustomers(Array.isArray(data) ? data : []);
      }
    } catch (e) { console.error(e); toast.error('An error occurred'); setFetchError(e.message || 'Failed to load data'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    setSaving(true); setError('');
    try {
      await tradeSpendService.create({ spendType: form.spendType, category: form.category, amount: { requested: Number(form.amountRequested) }, period: { startDate: form.startDate, endDate: form.endDate || form.startDate }, customer: form.customer, notes: form.notes });
      setShowCreate(false); load();
    } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!await confirm('Delete?', { severity: 'error' })) return;
    try { await tradeSpendService.delete(id); load(); } catch (e) { console.error(e); toast.error('An error occurred'); }
  };

  const columns = [
    { field: 'notes', headerName: 'Description', renderCell: ({ row }) => row.notes || row.category || row.spendId || '—' },
    { field: 'spendType', headerName: 'Type', renderCell: ({ row }) => (row.spendType || '').replace(/_/g, ' ') },
    { field: 'customer', headerName: 'Customer', renderCell: ({ row }) => row.customer?.name || row.customer_name || '—' },
    { field: 'amount', headerName: 'Amount', type: 'currency', align: 'right', renderCell: ({ row }) => fmt(row.amount?.requested || row.amount?.approved || row.amount?.spent || 0) },
    { field: 'period', headerName: 'Date', renderCell: ({ row }) => row.period?.startDate ? new Date(row.period.startDate).toLocaleDateString() : '—' },
    { field: 'status', headerName: 'Status', type: 'status' },
  ];

  const rowActions = [
    { label: 'View', icon: <Eye size={16} />, onClick: (row) => navigate(`/execute/trade-spends/${row._id || row.id}`) },
    { label: 'Delete', icon: <Trash2 size={16} />, onClick: (row) => handleDelete(row._id || row.id) },
  ];

  const customerOptions = customers.map(c => ({ value: c._id || c.id, label: c.name || c.customer_name }));

  return (
    <Box>
      {fetchError && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => { setFetchError(null); load(); }}>Retry</Button>}>
          {fetchError}
        </Alert>
      )}
      <PageHeader
        title={tPlural('trade_spend')}
        subtitle={`Track and manage ${tPlural('trade_spend').toLowerCase()}`}
        actions={
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
            New {t('trade_spend')}
          </Button>
        }
      />
      <SmartTable
        columns={columns}
        data={items}
        loading={loading}
        onRowClick={(row) => navigate(`/execute/trade-spends/${row._id || row.id}`)}
        rowActions={rowActions}
        searchPlaceholder={`Search ${tPlural('trade_spend').toLowerCase()}...`}
        emptyMessage={`No ${tPlural('trade_spend').toLowerCase()} found`}
      />

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create {t('trade_spend')}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <SmartField name="notes" label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <SmartField name="amountRequested" label="Amount" type="currency" value={form.amountRequested} onChange={(e) => setForm({ ...form, amountRequested: e.target.value })} required />
            </Grid>
            <Grid item xs={6}>
              <SmartField name="spendType" label="Type" type="select" value={form.spendType} onChange={(e) => setForm({ ...form, spendType: e.target.value })}
                options={[{ value: 'promotion', label: 'Promotion' }, { value: 'marketing', label: 'Marketing' }, { value: 'cash_coop', label: 'Cash Co-op' }, { value: 'trading_terms', label: 'Trading Terms' }, { value: 'rebate', label: 'Rebate' }]} />
            </Grid>
            <Grid item xs={6}>
              <SmartField name="category" label="Category" type="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                options={[{ value: 'volume_discount', label: 'Volume Discount' }, { value: 'display_allowance', label: 'Display Allowance' }, { value: 'promotional_support', label: 'Promotional Support' }, { value: 'listing_fee', label: 'Listing Fee' }, { value: 'slotting_fee', label: 'Slotting Fee' }]} />
            </Grid>
            <Grid item xs={6}>
              <SmartField name="customer" label="Customer" type="select" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} required
                options={customerOptions} />
            </Grid>
            <Grid item xs={6}>
              <SmartField name="startDate" label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            </Grid>
            <Grid item xs={6}>
              <SmartField name="endDate" label="End Date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    {ConfirmDialogComponent}
    </Box>
  );
}
