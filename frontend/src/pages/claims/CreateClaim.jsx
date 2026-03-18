import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Grid, Alert, Paper, IconButton, alpha, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { claimService } from '../../services/api';
import { customerService } from '../../services/api';
import { productService } from '../../services/api';
import analytics from '../../utils/analytics';
import { SmartField, FormSection, PageHeader } from '../../components/shared';

const CreateClaim = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    claimType: 'promotion', customer: '', claimDate: new Date().toISOString().split('T')[0],
    claimAmount: 0, currency: 'ZAR', notes: '', lineItems: []
  });

  useEffect(() => { loadCustomers(); loadProducts(); }, []);

  const loadCustomers = async () => {
    try { const response = await customerService.getCustomers(); setCustomers(response.data || []); }
    catch (err) { console.error('Error loading customers:', err); }
  };

  const loadProducts = async () => {
    try { const response = await productService.getProducts(); setProducts(response.data || []); }
    catch (err) { console.error('Error loading products:', err); }
  };

  const handleChange = (field, value) => { setFormData(prev => ({ ...prev, [field]: value })); };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev, lineItems: [...prev.lineItems, { productId: '', productCode: '', productName: '', quantity: 0, unitPrice: 0, claimRate: 0, claimAmount: 0 }]
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

  const customerOptions = customers.map(c => ({ value: c.id || c._id, label: `${c.name} (${c.code || '-'})` }));

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <PageHeader
        title="Create Claim"
        subtitle="Submit a new claim for processing"
        actions={<Button variant="outlined" startIcon={<CancelIcon />} onClick={() => navigate('/claims')}>Cancel</Button>}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <FormSection title="Claim Information" defaultOpen>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <SmartField name="claimType" label="Claim Type" type="select" value={formData.claimType} onChange={(e) => handleChange('claimType', e.target.value)} required
                  options={[{ value: 'promotion', label: 'Promotion' }, { value: 'rebate', label: 'Rebate' }, { value: 'allowance', label: 'Allowance' }, { value: 'markdown', label: 'Markdown' }, { value: 'damage', label: 'Damage' }, { value: 'return', label: 'Return' }, { value: 'other', label: 'Other' }]} />
              </Grid>
              <Grid item xs={12} md={6}>
                <SmartField name="customer" label="Customer" type="select" value={formData.customer} onChange={(e) => handleChange('customer', e.target.value)} required
                  options={customerOptions} />
              </Grid>
              <Grid item xs={12} md={6}>
                <SmartField name="claimDate" label="Claim Date" type="date" value={formData.claimDate} onChange={(e) => handleChange('claimDate', e.target.value)} required />
              </Grid>
              <Grid item xs={12} md={6}>
                <SmartField name="currency" label="Currency" type="select" value={formData.currency} onChange={(e) => handleChange('currency', e.target.value)}
                  options={[{ value: 'ZAR', label: 'ZAR' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }, { value: 'GBP', label: 'GBP' }]} />
              </Grid>
              <Grid item xs={12}>
                <SmartField name="notes" label="Notes" type="textarea" value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} />
              </Grid>
            </Grid>
          </FormSection>

          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>Line Items</Typography>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={addLineItem} size="small"
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>Add Line Item</Button>
            </Box>
            {formData.lineItems.length === 0 ? (
              <Paper elevation={0} sx={{ p: 4, borderRadius: '12px', bgcolor: alpha('#1E40AF', 0.04), textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No line items added. Click "Add Line Item" to add products to this claim.</Typography>
              </Paper>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 600, color: 'text.secondary', fontSize: '0.8rem', bgcolor: 'background.default' } }}>
                      <TableCell colSpan={2}>Product</TableCell>
                      <TableCell>Qty</TableCell><TableCell>Unit Price</TableCell>
                      <TableCell>Rate (%)</TableCell><TableCell>Amount</TableCell><TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.lineItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell colSpan={2}>
                          <TextField select size="small" fullWidth value={item.productId} onChange={(e) => {
                            const prod = products.find(p => (p.id || p._id) === e.target.value);
                            if (prod) {
                              const updated = [...formData.lineItems];
                              updated[index] = { ...updated[index], productId: e.target.value, productCode: prod.code || prod.sku || '', productName: prod.name || '', unitPrice: prod.price || prod.unitPrice || 0 };
                              const amt = (updated[index].quantity || 0) * (updated[index].unitPrice || 0) * (updated[index].claimRate || 0) / 100;
                              updated[index].claimAmount = amt;
                              setFormData(prev => ({ ...prev, lineItems: updated, claimAmount: updated.reduce((s, i) => s + (i.claimAmount || 0), 0) }));
                            }
                          }} displayEmpty>
                            <MenuItem value="" disabled>Select product</MenuItem>
                            {products.map(p => <MenuItem key={p.id || p._id} value={p.id || p._id}>{p.name} ({p.code || p.sku || (p.id || '').slice(-6)})</MenuItem>)}
                          </TextField>
                        </TableCell>
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
                sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, bgcolor: 'primary.dark', '&:hover': { bgcolor: 'primary.dark', filter: 'brightness(0.85)' } }}>
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
