import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Alert, Stepper, Step, StepLabel, Autocomplete, TextField } from '@mui/material';
import { Plus, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { budgetService, customerService } from '../../services/api';
import { useTerminology } from '../../contexts/TerminologyContext';
import { SmartTable, PageHeader, SmartField, FormSection } from '../../components/shared';
import { useToast } from '../../components/common/ToastNotification';
import useConfirmDialog from '../../hooks/useConfirmDialog';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e6 ? `R ${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

const BUDGET_TYPES = [
  { value: 'annual', label: 'Annual Budget' },
  { value: 'promotional', label: 'Promotional' },
  { value: 'listing', label: 'Listing Fees' },
  { value: 'rebate', label: 'Rebate Program' },
  { value: 'growth', label: 'Growth Initiative' },
  { value: 'marketing', label: 'Marketing' },
];
const BUDGET_CATEGORIES = [
  { value: 'trade_promotion', label: 'Trade Promotion' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'vendor_funded', label: 'Vendor Funded' },
  { value: 'co_op', label: 'Co-Op' },
  { value: 'listing_fee', label: 'Listing Fee' },
  { value: 'rebate', label: 'Rebate' },
];
const SCOPE_TYPES = [
  { value: 'company', label: 'Company-wide' },
  { value: 'channel', label: 'Channel' },
  { value: 'customer', label: 'Customer-specific' },
  { value: 'product', label: 'Product-specific' },
  { value: 'region', label: 'Region' },
];
const DEAL_TYPES = [
  { value: 'off_invoice', label: 'Off-Invoice' },
  { value: 'bill_back', label: 'Bill-Back' },
  { value: 'scan_back', label: 'Scan-Back' },
  { value: 'lump_sum', label: 'Lump Sum' },
  { value: 'accrual', label: 'Accrual' },
  { value: 'mixed', label: 'Mixed' },
];
const CUSTOMER_CHANNELS = [
  { value: 'retail', label: 'Retail' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'foodservice', label: 'Foodservice' },
  { value: 'convenience', label: 'Convenience' },
  { value: 'pharmacy', label: 'Pharmacy' },
];

const emptyForm = {
  name: '', amount: '', year: new Date().getFullYear(),
  budget_type: 'annual', budget_category: 'trade_promotion',
  scope_type: 'company', deal_type: 'off_invoice',
  customer_channel: '', customer_sub_channel: '', customer_segmentation: '',
  customer_id: '', product_vendor: '', product_category: '', product_brand: '',
  product_sub_brand: '', product_id: '', status: 'draft'
};

export default function BudgetList() {
  const toast = useToast();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const navigate = useNavigate();
  const { t, tPlural } = useTerminology();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [customers, setCustomers] = useState([]);

  const load = useCallback(async () => {
    try {
      const res = await budgetService.getAll();
      setBudgets(res.data || res || []);
    } catch (e) { console.error(e); toast.error('An error occurred'); setFetchError(e.message || 'Failed to load data'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (showCreate) {
      customerService.getAll().then(res => {
        const data = res.data || res || [];
        setCustomers(Array.isArray(data) ? data : []);
      }).catch((e) => { console.error('Failed to load customers:', e); toast.error('Failed to load customers'); });
    }
  }, [showCreate]);

  const handleCreate = async () => {
    setSaving(true); setError('');
    try {
      const payload = { ...form, amount: Number(form.amount), year: Number(form.year) };
      Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k]; });
      await budgetService.create(payload);
      setShowCreate(false); setForm({ ...emptyForm }); setActiveStep(0); load();
    } catch (e) { setError(e.response?.data?.message || 'Failed to create budget'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!await confirm('Delete this budget?', { severity: 'error' })) return;
    try { await budgetService.delete(id); load(); } catch (e) { console.error(e); toast.error('An error occurred'); }
  };

  const steps = ['Budget Details', 'Scope & Targeting', 'Review'];

  const columns = [
    { field: 'name', headerName: 'Budget Name' },
    { field: 'budget_type', headerName: 'Type', renderCell: ({ row }) => (row.budget_type || '').replace(/_/g, ' ') },
    { field: 'budget_category', headerName: 'Category', renderCell: ({ row }) => (row.budget_category || row.category || '').replace(/_/g, ' ') },
    { field: 'year', headerName: 'Year' },
    { field: 'amount', headerName: 'Amount', align: 'right', renderCell: ({ row }) => fmt(row.amount) },
    { field: 'committed', headerName: 'Committed', align: 'right', renderCell: ({ row }) => fmt(row.committed) },
    { field: 'spent', headerName: 'Spent', align: 'right', renderCell: ({ row }) => fmt(row.spent || row.utilized) },
    { field: 'status', headerName: 'Status', type: 'status' },
  ];

  const rowActions = [
    { label: 'View', icon: <Eye size={16} />, onClick: (row) => navigate(`/plan/budgets/${row.id}`) },
    { label: 'Delete', icon: <Trash2 size={16} />, onClick: (row) => handleDelete(row.id) },
  ];
  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spent || b.utilized || 0), 0);
  const totalCommitted = budgets.reduce((sum, b) => sum + Number(b.committed || 0), 0);

  return (
    <Box>
      {fetchError && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => { setFetchError(null); load(); }}>Retry</Button>}>
          {fetchError}
        </Alert>
      )}
      <PageHeader
        title={`${t('budget')} Management`}
        subtitle={`Plan, allocate, and track trade ${t('promotion').toLowerCase()} ${tPlural('budget').toLowerCase()}`}
        actions={<Button variant="contained" startIcon={<Plus size={16} />} onClick={() => { setForm({ ...emptyForm }); setError(''); setActiveStep(0); setShowCreate(true); }}>New Budget</Button>}
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Budget', value: fmt(totalBudget), color: undefined },
          { label: 'Committed', value: fmt(totalCommitted), color: 'warning.main' },
          { label: 'Spent', value: fmt(totalSpent), color: 'primary.main' },
          { label: 'Available', value: fmt(totalBudget - totalSpent - totalCommitted), color: 'success.main' },
        ].map(kpi => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
            <Card><CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">{kpi.label}</Typography>
              <Typography variant="h6" fontWeight={700} color={kpi.color}>{kpi.value}</Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>

      <SmartTable
        columns={columns}
        data={budgets}
        loading={loading}
        onRowClick={(row) => navigate(`/plan/budgets/${row.id}`)}
        rowActions={rowActions}
        searchPlaceholder="Search budgets..."
        emptyMessage="No budgets found"
      />

      <Dialog open={showCreate} onClose={() => { setShowCreate(false); setForm({ ...emptyForm }); setError(''); setActiveStep(0); }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>Create New Budget</Typography>
          <Typography variant="body2" color="text.secondary">Define budget parameters, scope, and targeting</Typography>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stepper activeStep={activeStep} sx={{ my: 2 }}>
            {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>

          {activeStep === 0 && (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <SmartField name="name" label="Budget Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </Grid>
              <Grid item xs={6}>
                <SmartField name="amount" label="Budget Amount" type="currency" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </Grid>
              <Grid item xs={6}>
                <SmartField name="year" label="Fiscal Year" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
              </Grid>
              <Grid item xs={6}>
                <SmartField name="budget_type" label="Budget Type" type="select" value={form.budget_type} onChange={(e) => setForm({ ...form, budget_type: e.target.value })} options={BUDGET_TYPES} />
              </Grid>
              <Grid item xs={6}>
                <SmartField name="budget_category" label="Budget Category" type="select" value={form.budget_category} onChange={(e) => setForm({ ...form, budget_category: e.target.value })} options={BUDGET_CATEGORIES} />
              </Grid>
              <Grid item xs={6}>
                <SmartField name="deal_type" label="Deal Type" type="select" value={form.deal_type} onChange={(e) => setForm({ ...form, deal_type: e.target.value })} options={DEAL_TYPES} />
              </Grid>
              <Grid item xs={6}>
                <SmartField name="status" label="Status" type="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                  options={[{ value: 'draft', label: 'Draft' }, { value: 'planned', label: 'Planned' }, { value: 'active', label: 'Active' }]} />
              </Grid>
            </Grid>
          )}

          {activeStep === 1 && (
            <Box sx={{ mt: 0.5 }}>
              <FormSection title="Scope & Targeting" defaultOpen>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <SmartField name="scope_type" label="Scope Type" type="select" value={form.scope_type} onChange={(e) => setForm({ ...form, scope_type: e.target.value })} options={SCOPE_TYPES} />
                  </Grid>
                  <Grid item xs={6}>
                    <SmartField name="customer_channel" label="Customer Channel" type="select" value={form.customer_channel} onChange={(e) => setForm({ ...form, customer_channel: e.target.value })}
                      options={[{ value: '', label: 'All Channels' }, ...CUSTOMER_CHANNELS]} />
                  </Grid>
                  <Grid item xs={6}>
                    <SmartField name="customer_sub_channel" label="Customer Sub-Channel" value={form.customer_sub_channel} onChange={(e) => setForm({ ...form, customer_sub_channel: e.target.value })} />
                  </Grid>
                  <Grid item xs={6}>
                    <SmartField name="customer_segmentation" label="Customer Segmentation" value={form.customer_segmentation} onChange={(e) => setForm({ ...form, customer_segmentation: e.target.value })} />
                  </Grid>
                  {form.scope_type === 'customer' && (
                    <Grid item xs={12}>
                      <Autocomplete options={customers} getOptionLabel={(opt) => opt.name || opt.customer_name || ''}
                        value={customers.find(c => c.id === form.customer_id) || null}
                        onChange={(e, val) => setForm({ ...form, customer_id: val?.id || '' })}
                        renderInput={(params) => <TextField {...params} label="Specific Customer" />} />
                    </Grid>
                  )}
                </Grid>
              </FormSection>
              <FormSection title="Product Targeting (Optional)">
                <Grid container spacing={2}>
                  <Grid item xs={6}><SmartField name="product_vendor" label="Product Vendor" value={form.product_vendor} onChange={(e) => setForm({ ...form, product_vendor: e.target.value })} /></Grid>
                  <Grid item xs={6}><SmartField name="product_category" label="Product Category" value={form.product_category} onChange={(e) => setForm({ ...form, product_category: e.target.value })} /></Grid>
                  <Grid item xs={6}><SmartField name="product_brand" label="Product Brand" value={form.product_brand} onChange={(e) => setForm({ ...form, product_brand: e.target.value })} /></Grid>
                  <Grid item xs={6}><SmartField name="product_sub_brand" label="Product Sub-Brand" value={form.product_sub_brand} onChange={(e) => setForm({ ...form, product_sub_brand: e.target.value })} /></Grid>
                </Grid>
              </FormSection>
            </Box>
          )}

          {activeStep === 2 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Budget Summary</Typography>
              <Card variant="outlined" sx={{ mb: 2 }}><CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Name</Typography><Typography variant="body1" fontWeight={600}>{form.name || '\u2014'}</Typography></Grid>
                  <Grid item xs={3}><Typography variant="caption" color="text.secondary">Amount</Typography><Typography variant="body1" fontWeight={600}>R {Number(form.amount || 0).toLocaleString()}</Typography></Grid>
                  <Grid item xs={3}><Typography variant="caption" color="text.secondary">Year</Typography><Typography variant="body1">{form.year}</Typography></Grid>
                  <Grid item xs={3}><Typography variant="caption" color="text.secondary">Type</Typography><Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{(form.budget_type || '').replace('_', ' ')}</Typography></Grid>
                  <Grid item xs={3}><Typography variant="caption" color="text.secondary">Category</Typography><Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{(form.budget_category || '').replace('_', ' ')}</Typography></Grid>
                  <Grid item xs={3}><Typography variant="caption" color="text.secondary">Deal Type</Typography><Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{(form.deal_type || '').replace('_', ' ')}</Typography></Grid>
                  <Grid item xs={3}><Typography variant="caption" color="text.secondary">Scope</Typography><Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{(form.scope_type || '').replace('_', ' ')}</Typography></Grid>
                  {form.customer_channel && <Grid item xs={4}><Typography variant="caption" color="text.secondary">Channel</Typography><Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{form.customer_channel}</Typography></Grid>}
                  {form.product_brand && <Grid item xs={4}><Typography variant="caption" color="text.secondary">Brand</Typography><Typography variant="body2">{form.product_brand}</Typography></Grid>}
                  {form.product_category && <Grid item xs={4}><Typography variant="caption" color="text.secondary">Product Category</Typography><Typography variant="body2">{form.product_category}</Typography></Grid>}
                </Grid>
              </CardContent></Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setShowCreate(false); setForm({ ...emptyForm }); setError(''); setActiveStep(0); }}>Cancel</Button>
          {activeStep > 0 && <Button onClick={() => setActiveStep(activeStep - 1)}>Back</Button>}
          {activeStep < steps.length - 1 ? (
            <Button variant="contained" onClick={() => setActiveStep(activeStep + 1)} disabled={activeStep === 0 && (!form.name || !form.amount)}>Next</Button>
          ) : (
            <Button variant="contained" onClick={handleCreate} disabled={saving || !form.name || !form.amount}>{saving ? 'Creating...' : 'Create Budget'}</Button>
          )}
        </DialogActions>
      </Dialog>
    {ConfirmDialogComponent}
    </Box>
  );
}
