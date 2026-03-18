import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, Grid, Stepper, Step, StepLabel, Alert, CircularProgress } from '@mui/material';
import { ArrowLeft, ArrowRight, Save, Send } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { promotionService, budgetService, customerService, productService, aiCopilotService } from '../../services/api';
import { SmartField, FormSection, PageHeader } from '../../components/shared';

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
  const [aiTips, setAiTips] = useState(null);
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

  useEffect(() => {
    if (step === 3 && form.name && form.planned_spend) {
      aiCopilotService.analyzePromotionLift({
        promotion_type: form.promotion_type, mechanic: form.mechanic,
        planned_spend: Number(form.planned_spend) || 0, customer_id: form.customer_id,
      }).then(res => { if (res?.recommendation || res?.insight) setAiTips(res.recommendation || res.insight); })
        .catch(() => {});
    }
  }, [step, form.name, form.planned_spend, form.promotion_type, form.mechanic, form.customer_id]);

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

  const budgetOptions = [{ value: '', label: 'None' }, ...budgets.map(b => ({ value: b.id, label: `${b.name} (R ${Number(b.total_amount || 0).toLocaleString()})` }))];
  const customerOptions = [{ value: '', label: 'All Customers' }, ...customers.map(c => ({ value: c.id, label: c.name || c.customer_name }))];

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Promotion' : 'Create Promotion'}
        actions={<Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate('/execute/promotions')} sx={{ color: 'text.secondary' }}>Back to List</Button>}
      />

      <Stepper activeStep={step} sx={{ mb: 3 }}>
        {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent>
          {step === 0 && (
            <FormSection title="Basic Information" defaultOpen>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <SmartField name="name" label="Promotion Name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
                </Grid>
                <Grid item xs={12}>
                  <SmartField name="description" label="Description" type="textarea" value={form.description} onChange={(e) => set('description', e.target.value)} />
                </Grid>
                <Grid item xs={6}>
                  <SmartField name="promotion_type" label="Promotion Type" type="select" value={form.promotion_type} onChange={(e) => set('promotion_type', e.target.value)}
                    options={[{ value: 'discount', label: 'Discount' }, { value: 'bogo', label: 'Buy One Get One' }, { value: 'bundle', label: 'Bundle' }, { value: 'rebate', label: 'Rebate' }, { value: 'display', label: 'Display Allowance' }, { value: 'slotting', label: 'Slotting Fee' }]} />
                </Grid>
                <Grid item xs={6}>
                  <SmartField name="mechanic" label="Mechanic" type="select" value={form.mechanic} onChange={(e) => set('mechanic', e.target.value)}
                    options={[{ value: 'percentage_off', label: 'Percentage Off' }, { value: 'fixed_amount', label: 'Fixed Amount' }, { value: 'free_goods', label: 'Free Goods' }]} />
                </Grid>
                <Grid item xs={6}>
                  <SmartField name="start_date" label="Start Date" type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
                </Grid>
                <Grid item xs={6}>
                  <SmartField name="end_date" label="End Date" type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} />
                </Grid>
              </Grid>
            </FormSection>
          )}
          {step === 1 && (
            <FormSection title="Financial Details" defaultOpen>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <SmartField name="planned_spend" label="Planned Spend" type="currency" value={form.planned_spend} onChange={(e) => set('planned_spend', e.target.value)} required />
                </Grid>
                <Grid item xs={6}>
                  <SmartField name="budget_id" label="Budget" type="select" value={form.budget_id} onChange={(e) => set('budget_id', e.target.value)}
                    options={budgetOptions} />
                </Grid>
                <Grid item xs={6}>
                  <SmartField name="discount_percentage" label="Discount %" type="percent" value={form.discount_percentage} onChange={(e) => set('discount_percentage', e.target.value)} />
                </Grid>
                <Grid item xs={6}>
                  <SmartField name="min_quantity" label="Min Quantity" type="number" value={form.min_quantity} onChange={(e) => set('min_quantity', e.target.value)} />
                </Grid>
              </Grid>
            </FormSection>
          )}
          {step === 2 && (
            <FormSection title="Products & Customers" defaultOpen>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <SmartField name="customer_id" label="Customer" type="select" value={form.customer_id} onChange={(e) => set('customer_id', e.target.value)}
                    options={customerOptions} />
                </Grid>
                <Grid item xs={12}>
                  <SmartField name="product_ids" label="Product IDs (comma separated)" value={form.product_ids} onChange={(e) => set('product_ids', e.target.value)}
                    helperText="Enter product IDs separated by commas" />
                </Grid>
              </Grid>
            </FormSection>
          )}
          {step === 3 && (
            <FormSection title="Review Promotion" defaultOpen>
              <Grid container spacing={1}>
                {[['Name', form.name], ['Type', form.promotion_type], ['Mechanic', form.mechanic], ['Planned Spend', `R ${Number(form.planned_spend || 0).toLocaleString()}`], ['Start Date', form.start_date || '-'], ['End Date', form.end_date || '-']].map(([label, val]) => (
                  <Grid item xs={6} key={label}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ textTransform: 'capitalize' }}>{String(val).replace(/_/g, ' ')}</Typography>
                  </Grid>
                ))}
              </Grid>
              {aiTips && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600}>AI Recommendation</Typography>
                  <Typography variant="body2">{aiTips}</Typography>
                </Alert>
              )}
            </FormSection>
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
