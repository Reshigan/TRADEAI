import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Grid, MenuItem, Stepper, Step, StepLabel, Alert, CircularProgress } from '@mui/material';
import { ArrowLeft, ArrowRight, Save, Send } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { promotionService, budgetService, customerService, productService } from '../../services/api';

const steps = ['Basic Info', 'Financials', 'Products & Customers', 'Review'];

export default function PromotionWizard() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id) && id !== 'new';
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [budgets, setBudgets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: '', description: '', promotion_type: 'discount', mechanic: 'percentage_off',
    start_date: '', end_date: '', budget_id: '', customer_id: '', product_ids: '',
    planned_spend: '', discount_percentage: '', min_quantity: '',
    status: 'draft',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [b, c, p] = await Promise.allSettled([
          budgetService.getAll(), customerService.getAll(), productService.getAll(),
        ]);
        if (b.status === 'fulfilled') setBudgets(b.value.data || b.value || []);
        if (c.status === 'fulfilled') setCustomers(c.value.data || c.value || []);
        if (p.status === 'fulfilled') setProducts(p.value.data || p.value || []);
        if (isEdit) {
          const res = await promotionService.getById(id);
          const d = res.data || res;
          setForm(prev => ({ ...prev, ...d, planned_spend: d.planned_spend || d.budget || '', name: d.name || d.promotion_name || '' }));
        }
      } catch (e) { console.error(e); }
    };
    load();
  }, [id, isEdit]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async (submitForApproval = false) => {
    setSaving(true); setError('');
    try {
      const payload = { ...form, planned_spend: Number(form.planned_spend) || 0 };
      if (submitForApproval) payload.status = 'pending_approval';
      if (isEdit) {
        await promotionService.update(id, payload);
      } else {
        await promotionService.create(payload);
      }
      navigate('/execute/promotions');
    } catch (e) { setError(e.response?.data?.message || 'Failed to save'); }
    setSaving(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate('/execute/promotions')} sx={{ color: 'text.secondary' }}>Back</Button>
        <Typography variant="h1">{isEdit ? 'Edit Promotion' : 'Create Promotion'}</Typography>
      </Box>

      <Stepper activeStep={step} sx={{ mb: 3 }}>
        {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent>
          {step === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}><TextField fullWidth label="Promotion Name" value={form.name} onChange={(e) => set('name', e.target.value)} required /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Description" multiline rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} /></Grid>
              <Grid item xs={6}><TextField fullWidth select label="Promotion Type" value={form.promotion_type} onChange={(e) => set('promotion_type', e.target.value)}>
                <MenuItem value="discount">Discount</MenuItem><MenuItem value="bogo">Buy One Get One</MenuItem><MenuItem value="bundle">Bundle</MenuItem>
                <MenuItem value="rebate">Rebate</MenuItem><MenuItem value="display">Display Allowance</MenuItem><MenuItem value="slotting">Slotting Fee</MenuItem>
              </TextField></Grid>
              <Grid item xs={6}><TextField fullWidth select label="Mechanic" value={form.mechanic} onChange={(e) => set('mechanic', e.target.value)}>
                <MenuItem value="percentage_off">Percentage Off</MenuItem><MenuItem value="fixed_amount">Fixed Amount</MenuItem><MenuItem value="free_goods">Free Goods</MenuItem>
              </TextField></Grid>
              <Grid item xs={6}><TextField fullWidth label="Start Date" type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="End Date" type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
            </Grid>
          )}
          {step === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField fullWidth label="Planned Spend (R)" type="number" value={form.planned_spend} onChange={(e) => set('planned_spend', e.target.value)} required /></Grid>
              <Grid item xs={6}><TextField fullWidth select label="Budget" value={form.budget_id} onChange={(e) => set('budget_id', e.target.value)}>
                <MenuItem value="">None</MenuItem>
                {budgets.map(b => <MenuItem key={b.id} value={b.id}>{b.name} (R {Number(b.total_amount || 0).toLocaleString()})</MenuItem>)}
              </TextField></Grid>
              <Grid item xs={6}><TextField fullWidth label="Discount %" type="number" value={form.discount_percentage} onChange={(e) => set('discount_percentage', e.target.value)} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Min Quantity" type="number" value={form.min_quantity} onChange={(e) => set('min_quantity', e.target.value)} /></Grid>
            </Grid>
          )}
          {step === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12}><TextField fullWidth select label="Customer" value={form.customer_id} onChange={(e) => set('customer_id', e.target.value)}>
                <MenuItem value="">All Customers</MenuItem>
                {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name || c.customer_name}</MenuItem>)}
              </TextField></Grid>
              <Grid item xs={12}><TextField fullWidth label="Product IDs (comma separated)" value={form.product_ids} onChange={(e) => set('product_ids', e.target.value)} helperText="Enter product IDs separated by commas" /></Grid>
            </Grid>
          )}
          {step === 3 && (
            <Box>
              <Typography variant="h3" sx={{ mb: 2 }}>Review Promotion</Typography>
              <Grid container spacing={1}>
                {[['Name', form.name], ['Type', form.promotion_type], ['Mechanic', form.mechanic], ['Planned Spend', `R ${Number(form.planned_spend || 0).toLocaleString()}`], ['Start Date', form.start_date || '-'], ['End Date', form.end_date || '-']].map(([label, val]) => (
                  <Grid item xs={6} key={label}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ textTransform: 'capitalize' }}>{String(val).replace(/_/g, ' ')}</Typography>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, pt: 2, borderTop: '1px solid #E2E8F0' }}>
            <Button disabled={step === 0} onClick={() => setStep(step - 1)} startIcon={<ArrowLeft size={16} />}>Back</Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {step < steps.length - 1 ? (
                <Button variant="contained" onClick={() => setStep(step + 1)} endIcon={<ArrowRight size={16} />}>Next</Button>
              ) : (<>
                <Button variant="outlined" onClick={() => handleSave(false)} disabled={saving} startIcon={<Save size={16} />}>Save Draft</Button>
                <Button variant="contained" onClick={() => handleSave(true)} disabled={saving} startIcon={<Send size={16} />}>{saving ? <CircularProgress size={18} /> : 'Submit for Approval'}</Button>
              </>)}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
