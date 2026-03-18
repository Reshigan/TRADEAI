import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Alert, Paper } from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { deductionService } from '../../services/api';
import { customerService } from '../../services/api';
import { useToast } from '../../components/common/ToastNotification';
import analytics from '../../utils/analytics';
import { formatLabel } from '../../utils/formatters';
import { SmartField, FormSection, PageHeader } from '../../components/shared';

const CreateDeduction = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    deductionType: 'pricing', customer: '', deductionDate: new Date().toISOString().split('T')[0],
    amount: 0, currency: 'ZAR', invoiceNumber: '', reason: '', description: ''
  });

  useEffect(() => { loadCustomers(); analytics.trackEvent('create_deduction_page_viewed'); }, []);

  const loadCustomers = async () => {
    try { const response = await customerService.getCustomers(); setCustomers(response.data || []); }
    catch (err) { console.error('Error loading customers:', err); showToast('Failed to load customers', 'error'); }
  };

  const handleChange = (field, value) => { setFormData(prev => ({ ...prev, [field]: value })); };

  const handleSubmit = async () => {
    try {
      setLoading(true); setError(null);
      if (!formData.customer) { setError('Please select a customer'); showToast('Please select a customer', 'warning'); return; }
      if (formData.amount <= 0) { setError('Deduction amount must be greater than 0'); showToast('Deduction amount must be greater than 0', 'warning'); return; }
      if (!formData.reason) { setError('Please provide a reason for the deduction'); showToast('Please provide a reason', 'warning'); return; }
      await deductionService.createDeduction(formData);
      analytics.trackEvent('deduction_created', { deductionType: formData.deductionType, amount: formData.amount });
      showToast('Deduction created successfully', 'success');
      navigate('/deductions');
    } catch (err) {
      console.error('Error creating deduction:', err);
      setError(err.message || 'Failed to create deduction');
      showToast(err.message || 'Failed to create deduction', 'error');
      analytics.trackEvent('deduction_create_failed', { error: err.message });
    } finally { setLoading(false); }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: formData.currency }).format(amount);

  const customerOptions = customers.map(c => ({ value: c.id || c._id, label: `${c.name} (${c.code || (c.id || c._id || '').toString().slice(-6)})` }));

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <PageHeader
        title="Create Deduction"
        subtitle="Record a new customer deduction"
        actions={<Button variant="outlined" startIcon={<CancelIcon />} onClick={() => navigate('/deductions')}>Cancel</Button>}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <FormSection title="Deduction Information" defaultOpen>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <SmartField name="deductionType" label="Deduction Type" type="select" value={formData.deductionType} onChange={(e) => handleChange('deductionType', e.target.value)} required
                  options={[{ value: 'pricing', label: 'Pricing' }, { value: 'shortage', label: 'Shortage' }, { value: 'damage', label: 'Damage' }, { value: 'quality', label: 'Quality' }, { value: 'promotional', label: 'Promotional' }, { value: 'administrative', label: 'Administrative' }, { value: 'other', label: 'Other' }]} />
              </Grid>
              <Grid item xs={12} md={6}>
                <SmartField name="customer" label="Customer" type="select" value={formData.customer} onChange={(e) => handleChange('customer', e.target.value)} required
                  options={customerOptions} />
              </Grid>
              <Grid item xs={12} md={6}>
                <SmartField name="deductionDate" label="Deduction Date" type="date" value={formData.deductionDate} onChange={(e) => handleChange('deductionDate', e.target.value)} required />
              </Grid>
              <Grid item xs={12} md={6}>
                <SmartField name="amount" label="Amount" type="currency" value={formData.amount} onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)} required />
              </Grid>
              <Grid item xs={12} md={6}>
                <SmartField name="currency" label="Currency" type="select" value={formData.currency} onChange={(e) => handleChange('currency', e.target.value)}
                  options={[{ value: 'ZAR', label: 'ZAR' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }, { value: 'GBP', label: 'GBP' }]} />
              </Grid>
              <Grid item xs={12} md={6}>
                <SmartField name="invoiceNumber" label="Invoice Number" value={formData.invoiceNumber} onChange={(e) => handleChange('invoiceNumber', e.target.value)} placeholder="Optional" />
              </Grid>
              <Grid item xs={12}>
                <SmartField name="reason" label="Reason" value={formData.reason} onChange={(e) => handleChange('reason', e.target.value)} required placeholder="Brief reason for the deduction" />
              </Grid>
              <Grid item xs={12}>
                <SmartField name="description" label="Description" type="textarea" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Detailed description (optional)" />
              </Grid>
            </Grid>
          </FormSection>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider', position: 'sticky', top: 20 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Summary</Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" color="text.secondary">Deduction Amount</Typography>
              <Typography variant="h4" fontWeight={700} color="error.main">{formatCurrency(formData.amount)}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">Type</Typography>
              <Typography variant="body1" fontWeight={500}>{formatLabel(formData.deductionType)}</Typography>
            </Box>
            {formData.customer && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary">Customer</Typography>
                <Typography variant="body1" fontWeight={500}>{customers.find(c => (c.id || c._id) === formData.customer)?.name || 'Selected'}</Typography>
              </Box>
            )}
            <Button variant="contained" fullWidth onClick={handleSubmit} disabled={loading} startIcon={<SaveIcon />}
              sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, bgcolor: '#1E40AF', '&:hover': { bgcolor: '#1E3A8A' } }}>
              {loading ? 'Creating...' : 'Create Deduction'}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreateDeduction;
