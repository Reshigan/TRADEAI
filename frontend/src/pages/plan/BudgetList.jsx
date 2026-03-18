import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Grid, MenuItem, LinearProgress, Alert, InputAdornment, Divider, Stepper, Step, StepLabel, Autocomplete } from '@mui/material';
import { Plus, Search, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { budgetService, customerService } from '../../services/api';

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
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (showCreate) {
      customerService.getAll().then(res => {
        const data = res.data || res || [];
        setCustomers(Array.isArray(data) ? data : []);
      }).catch(() => {});
    }
  }, [showCreate]);

  const filtered = budgets.filter(b => (b.name || '').toLowerCase().includes(search.toLowerCase()));

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
    if (!window.confirm('Delete this budget?')) return;
    try { await budgetService.delete(id); load(); } catch (e) { console.error(e); }
  };

  const statusColor = (s) => ({ draft: '#94A3B8', approved: '#2563EB', active: '#059669', closed: '#6B7280', planned: '#D97706' }[s] || '#94A3B8');
  const steps = ['Budget Details', 'Scope & Targeting', 'Review'];
  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spent || b.utilized || 0), 0);
  const totalCommitted = budgets.reduce((sum, b) => sum + Number(b.committed || 0), 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Budget Management</Typography>
          <Typography variant="body2" color="text.secondary">Plan, allocate, and track trade promotion budgets</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => { setForm({ ...emptyForm }); setError(''); setActiveStep(0); setShowCreate(true); }}>New Budget</Button>
      </Box>

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

      <Card>
        <CardContent sx={{ pb: '16px !important' }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField placeholder="Search budgets..." size="small" value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} /> }} sx={{ flex: 1, maxWidth: 360 }} />
          </Box>
          {loading ? <LinearProgress /> : (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Budget Name</TableCell><TableCell>Type</TableCell><TableCell>Category</TableCell><TableCell>Year</TableCell>
                  <TableCell align="right">Amount</TableCell><TableCell align="right">Committed</TableCell><TableCell align="right">Spent</TableCell>
                  <TableCell>Utilization</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={10} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No budgets found</Typography></TableCell></TableRow>
                  ) : filtered.map(b => {
                    const spent = Number(b.spent || b.utilized || 0);
                    const committed = Number(b.committed || 0);
                    const total = Number(b.amount || 0);
                    const util = total > 0 ? ((spent + committed) / total) * 100 : 0;
                    return (
                      <TableRow key={b.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/plan/budgets/${b.id}`)}>
                        <TableCell><Typography variant="body2" fontWeight={600}>{b.name}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{(b.budget_type || '').replace('_', ' ')}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{(b.budget_category || b.category || '').replace('_', ' ')}</Typography></TableCell>
                        <TableCell>{b.year}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(total)}</TableCell>
                        <TableCell align="right"><Typography variant="body2" color="warning.main">{fmt(committed)}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="body2" color="primary.main">{fmt(spent)}</Typography></TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress variant="determinate" value={Math.min(util, 100)} sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: util > 90 ? '#DC2626' : util > 70 ? '#D97706' : '#2563EB', borderRadius: 3 } }} />
                            <Typography variant="caption" sx={{ minWidth: 32 }}>{util.toFixed(0)}%</Typography>
                            {util > 90 && <AlertTriangle size={14} color="#DC2626" />}
                          </Box>
                        </TableCell>
                        <TableCell><Chip label={b.status || 'draft'} size="small" sx={{ bgcolor: `${statusColor(b.status)}15`, color: statusColor(b.status), fontWeight: 600, textTransform: 'capitalize' }} /></TableCell>
                        <TableCell align="right" onClick={e => e.stopPropagation()}>
                          <IconButton size="small" onClick={() => navigate(`/plan/budgets/${b.id}`)} title="View"><Eye size={16} /></IconButton>
                          <IconButton size="small" onClick={() => handleDelete(b.id)} title="Delete"><Trash2 size={16} /></IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

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
                <TextField fullWidth label="Budget Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  helperText="E.g. 'Q1 2025 Trade Promotion Budget' or 'Woolworths Listing Fees 2025'" />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Budget Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required
                  InputProps={{ startAdornment: <InputAdornment position="start">R</InputAdornment> }} helperText="Total budget allocation in ZAR" />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Fiscal Year" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth select label="Budget Type" value={form.budget_type} onChange={(e) => setForm({ ...form, budget_type: e.target.value })}>
                  {BUDGET_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth select label="Budget Category" value={form.budget_category} onChange={(e) => setForm({ ...form, budget_category: e.target.value })}>
                  {BUDGET_CATEGORIES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth select label="Deal Type" value={form.deal_type} onChange={(e) => setForm({ ...form, deal_type: e.target.value })}>
                  {DEAL_TYPES.map(d => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <MenuItem value="draft">Draft</MenuItem><MenuItem value="planned">Planned</MenuItem><MenuItem value="active">Active</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          )}

          {activeStep === 1 && (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary" gutterBottom>Scope & Targeting</Typography><Divider sx={{ mb: 1 }} /></Grid>
              <Grid item xs={6}>
                <TextField fullWidth select label="Scope Type" value={form.scope_type} onChange={(e) => setForm({ ...form, scope_type: e.target.value })}>
                  {SCOPE_TYPES.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth select label="Customer Channel" value={form.customer_channel} onChange={(e) => setForm({ ...form, customer_channel: e.target.value })}>
                  <MenuItem value="">All Channels</MenuItem>
                  {CUSTOMER_CHANNELS.map(ch => <MenuItem key={ch.value} value={ch.value}>{ch.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Customer Sub-Channel" value={form.customer_sub_channel} onChange={(e) => setForm({ ...form, customer_sub_channel: e.target.value })} helperText="Optional sub-channel filter" />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Customer Segmentation" value={form.customer_segmentation} onChange={(e) => setForm({ ...form, customer_segmentation: e.target.value })} helperText="E.g. Premium, Value, Mainstream" />
              </Grid>
              {form.scope_type === 'customer' && (
                <Grid item xs={12}>
                  <Autocomplete options={customers} getOptionLabel={(opt) => opt.name || opt.customer_name || ''}
                    value={customers.find(c => c.id === form.customer_id) || null}
                    onChange={(e, val) => setForm({ ...form, customer_id: val?.id || '' })}
                    renderInput={(params) => <TextField {...params} label="Specific Customer" helperText="Select a customer for customer-specific budgets" />} />
                </Grid>
              )}
              <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
              <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary" gutterBottom>Product Targeting (Optional)</Typography></Grid>
              <Grid item xs={6}><TextField fullWidth label="Product Vendor" value={form.product_vendor} onChange={(e) => setForm({ ...form, product_vendor: e.target.value })} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Product Category" value={form.product_category} onChange={(e) => setForm({ ...form, product_category: e.target.value })} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Product Brand" value={form.product_brand} onChange={(e) => setForm({ ...form, product_brand: e.target.value })} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Product Sub-Brand" value={form.product_sub_brand} onChange={(e) => setForm({ ...form, product_sub_brand: e.target.value })} /></Grid>
            </Grid>
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
    </Box>
  );
}
