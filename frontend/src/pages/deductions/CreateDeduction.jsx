import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import deductionService from '../../services/deduction/deductionService';
import customerService from '../../services/customer/customerService';
import { useToast } from '../../components/common/ToastNotification';
import analytics from '../../utils/analytics';

const CreateDeduction = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  
  const [formData, setFormData] = useState({
    deductionType: 'pricing',
    customer: '',
    deductionDate: new Date().toISOString().split('T')[0],
    amount: 0,
    currency: 'ZAR',
    invoiceNumber: '',
    reason: '',
    description: ''
  });

  useEffect(() => {
    loadCustomers();
    analytics.trackEvent('create_deduction_page_viewed');
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await customerService.getCustomers();
      setCustomers(response.data || []);
    } catch (err) {
      console.error('Error loading customers:', err);
      showToast('Failed to load customers', 'error');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!formData.customer) {
        setError('Please select a customer');
        showToast('Please select a customer', 'warning');
        return;
      }

      if (formData.amount <= 0) {
        setError('Deduction amount must be greater than 0');
        showToast('Deduction amount must be greater than 0', 'warning');
        return;
      }

      if (!formData.reason) {
        setError('Please provide a reason for the deduction');
        showToast('Please provide a reason for the deduction', 'warning');
        return;
      }

      await deductionService.createDeduction(formData);

      analytics.trackEvent('deduction_created', {
        deductionType: formData.deductionType,
        amount: formData.amount
      });

      showToast('Deduction created successfully', 'success');
      navigate('/deductions');
    } catch (err) {
      console.error('Error creating deduction:', err);
      setError(err.message || 'Failed to create deduction');
      showToast(err.message || 'Failed to create deduction', 'error');
      analytics.trackEvent('deduction_create_failed', { error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Create Deduction</Typography>
        <Button variant="outlined" onClick={() => navigate('/deductions')}>
          Cancel
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Deduction Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Deduction Type"
                    value={formData.deductionType}
                    onChange={(e) => handleChange('deductionType', e.target.value)}
                    required
                  >
                    <MenuItem value="pricing">Pricing</MenuItem>
                    <MenuItem value="shortage">Shortage</MenuItem>
                    <MenuItem value="damage">Damage</MenuItem>
                    <MenuItem value="quality">Quality</MenuItem>
                    <MenuItem value="promotional">Promotional</MenuItem>
                    <MenuItem value="administrative">Administrative</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Customer"
                    value={formData.customer}
                    onChange={(e) => handleChange('customer', e.target.value)}
                    required
                  >
                    {customers.map((customer) => (
                      <MenuItem key={customer.id || customer._id} value={customer.id || customer._id}>
                        {customer.name} ({customer.code || (customer.id || customer._id || '').toString().slice(-6)})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Deduction Date"
                    value={formData.deductionDate}
                    onChange={(e) => handleChange('deductionDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Amount"
                    value={formData.amount}
                    onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                    required
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Currency"
                    value={formData.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                  >
                    <MenuItem value="ZAR">ZAR</MenuItem>
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                    <MenuItem value="GBP">GBP</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Invoice Number"
                    value={formData.invoiceNumber}
                    onChange={(e) => handleChange('invoiceNumber', e.target.value)}
                    placeholder="Optional"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Reason"
                    value={formData.reason}
                    onChange={(e) => handleChange('reason', e.target.value)}
                    required
                    placeholder="Brief reason for the deduction"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Detailed description of the deduction (optional)"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  Deduction Amount
                </Typography>
                <Typography variant="h4" color="error">
                  {formData.currency} {formData.amount.toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Type
                </Typography>
                <Typography variant="body1">
                  {formData.deductionType.charAt(0).toUpperCase() + formData.deductionType.slice(1)}
                </Typography>
              </Box>
              {formData.customer && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Customer
                  </Typography>
                  <Typography variant="body1">
                    {customers.find(c => (c.id || c._id) === formData.customer)?.name || 'Selected'}
                  </Typography>
                </Box>
              )}
              <Button
                variant="contained"
                fullWidth
                onClick={handleSubmit}
                disabled={loading}
                startIcon={<SaveIcon />}
              >
                {loading ? 'Creating...' : 'Create Deduction'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreateDeduction;
