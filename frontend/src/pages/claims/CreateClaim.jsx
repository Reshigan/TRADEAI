import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Grid, MenuItem, Alert, Paper, IconButton, alpha,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import claimService from '../../services/claim/claimService';
import customerService from '../../services/customer/customerService';
import analytics from '../../utils/analytics';

const CreateClaim = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    claimType: 'promotion', customer: '', claimDate: new Date().toISOString().split('T')[0],
    claimAmount: 0, currency: 'ZAR', notes: '', lineItems: []
  });

  useEffect(() => { loadCustomers(); }, []);

  const loadCustomers = async () => {
    try { const response = await customerService.getCustomers(); setCustomers(response.data || []); }
    catch (err) { console.error('Error loading customers:', err); }
  };

  const handleChange = (field, value) => { setFormData(prev => ({ ...prev, [field]: value })); };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev, lineItems: [...prev.lineItems, { productCode: '', productName: '', quantity: 0, unitPrice: 0, claimRate: 0, claimAmount: 0 }]
    }));
  };

  const updateLineItem = (index, field, value) => {
    const updatedLineItems = [...formData.lineItems];
    updatedLineItems[index][field] = value;
    if (field === 'quantity' || field === 'unitPrice' || field === 'claimRate') {
      const item = updatedLineItems[index];
      item.claimAmount = (item.quantity || 0) * (item.unitPrice || 0) * (item.claimRate || 0) / 100;
    }
    setFormData(prev => ({ ...prev, lineItems: updatedLineItems, claimAmount: updatedLineItems.reduce((sum, item) => sum + (item.claimAmount || 0), 0) }));
  };

  const removeLineItem = (index) => {
    const updatedLineItems = formData.lineItems.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, lineItems: updatedLineItems, claimAmount: updatedLineItems.reduce((sum, item) => sum + (item.claimAmount || 0), 0) }));
  };

  const handleSubmit = async (submitForApproval = false) => {
    try {
      setLoading(true); setError(null);
      if (!formData.customer) { setError('Please select a customer'); return; }
      if (formData.claimAmount <= 0) { setError('Claim amount must be greater than 0'); return; }
      const response = await claimService.createClaim(formData);
      const createdId = response.data?.id || response.data?._id || response.id || response._id;
      if (submitForApproval && createdId) await claimService.submitClaim(createdId);
      analytics.trackEvent('claim_created', { claimType: formData.claimType, amount: formData.claimAmount, submitted: submitForApproval });
      navigate('/claims');
    } catch (err) {
      console.error('Error creating claim:', err);
      setError(err.message || 'Failed to create claim');
    } finally { setLoading(false); }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: formData.currency }).format(amount);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Create Claim</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>Submit a new claim for processing</Typography>
        </Box>
        <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => navigate('/claims')}
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider', mb: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Claim Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField select fullWidth label="Claim Type" value={formData.claimType} onChange={(e) => handleChange('claimType', e.target.value)} required>
                  <MenuItem value="promotion">Promotion</MenuItem><MenuItem value="rebate">Rebate</MenuItem>
                  <MenuItem value="allowance">Allowance</MenuItem><MenuItem value="markdown">Markdown</MenuItem>
                  <MenuItem value="damage">Damage</MenuItem><MenuItem value="return">Return</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField select fullWidth label="Customer" value={formData.customer} onChange={(e) => handleChange('customer', e.target.value)} required>
                  {customers.map((customer) => (
                    <MenuItem key={customer.id || customer._id} value={customer.id || customer._id}>{customer.name} ({customer.code || '-'})</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth type="date" label="Claim Date" value={formData.claimDate} onChange={(e) => handleChange('claimDate', e.target.value)} InputLabelProps={{ shrink: true }} required />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField select fullWidth label="Currency" value={formData.currency} onChange={(e) => handleChange('currency', e.target.value)}>
                  <MenuItem value="ZAR">ZAR</MenuItem><MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem><MenuItem value="GBP">GBP</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={3} label="Notes" value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} />
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>Line Items</Typography>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={addLineItem} size="small"
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>Add Line Item</Button>
            </Box>
            {formData.lineItems.length === 0 ? (
              <Paper elevation={0} sx={{ p: 4, borderRadius: '12px', bgcolor: alpha('#7C3AED', 0.04), textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No line items added. Click "Add Line Item" to add products to this claim.</Typography>
              </Paper>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 600, color: 'text.secondary', fontSize: '0.8rem', bgcolor: '#F9FAFB' } }}>
                      <TableCell>Product Code</TableCell><TableCell>Product Name</TableCell>
                      <TableCell>Qty</TableCell><TableCell>Unit Price</TableCell>
                      <TableCell>Rate (%)</TableCell><TableCell>Amount</TableCell><TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.lineItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell><TextField size="small" value={item.productCode} onChange={(e) => updateLineItem(index, 'productCode', e.target.value)} placeholder="Code" /></TableCell>
                        <TableCell><TextField size="small" value={item.productName} onChange={(e) => updateLineItem(index, 'productName', e.target.value)} placeholder="Name" /></TableCell>
                        <TableCell><TextField size="small" type="number" value={item.quantity} onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)} sx={{ width: 80 }} /></TableCell>
                        <TableCell><TextField size="small" type="number" value={item.unitPrice} onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)} sx={{ width: 100 }} /></TableCell>
                        <TableCell><TextField size="small" type="number" value={item.claimRate} onChange={(e) => updateLineItem(index, 'claimRate', parseFloat(e.target.value) || 0)} sx={{ width: 70 }} /></TableCell>
                        <TableCell><Typography variant="body2" fontWeight={700}>{item.claimAmount.toFixed(2)}</Typography></TableCell>
                        <TableCell><IconButton size="small" color="error" onClick={() => removeLineItem(index)}><DeleteIcon fontSize="small" /></IconButton></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider', position: 'sticky', top: 20 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Summary</Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" color="text.secondary">Total Claim Amount</Typography>
              <Typography variant="h4" fontWeight={700} color="primary.main">{formatCurrency(formData.claimAmount)}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" mb={3}>Line Items: {formData.lineItems.length}</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Button variant="outlined" fullWidth onClick={() => handleSubmit(false)} disabled={loading} startIcon={<SaveIcon />}
                sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}>Save as Draft</Button>
              <Button variant="contained" fullWidth onClick={() => handleSubmit(true)} disabled={loading}
                sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
                {loading ? 'Creating...' : 'Create & Submit'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreateClaim;
