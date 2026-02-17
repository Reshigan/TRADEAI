import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, CircularProgress, Alert, Grid, Divider,
  TextField, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import api from '../../services/api';

const productHierarchyOptions = {
  vendors: ['Unilever', 'Nestle', 'P&G', 'Coca-Cola', 'PepsiCo', 'Kraft Heinz', 'General Mills'],
  categories: ['Beverages', 'Snacks', 'Personal Care', 'Home Care', 'Food', 'Dairy', 'Confectionery'],
  brands: ['Coca-Cola', 'Pepsi', 'Lays', 'Doritos', 'Dove', 'Axe', 'Omo', 'Sunlight', 'Maggi', 'KitKat'],
  subBrands: ['Original', 'Zero Sugar', 'Diet', 'Light', 'Premium', 'Classic', 'Extra', 'Max']
};

const customerHierarchyOptions = {
  channels: ['Modern Trade', 'Traditional Trade', 'E-Commerce', 'Wholesale', 'Foodservice', 'Convenience'],
  subChannels: ['Hypermarket', 'Supermarket', 'Mini Market', 'Spaza Shop', 'Online Marketplace', 'Quick Service Restaurant'],
  segmentations: ['Premium', 'Value', 'Budget', 'Mainstream', 'Niche'],
  hierarchy1: ['National', 'Regional', 'Local'],
  hierarchy2: ['Key Account', 'Mid-Tier', 'Small Account'],
  hierarchy3: ['Strategic', 'Growth', 'Maintain', 'Decline'],
  headOffices: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein']
};

const PromotionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '', type: '', status: 'planned', priority: 'normal',
    startDate: '', endDate: '', budget: '', description: '',
    dealType: 'off_invoice', claimType: 'vendor_invoice',
    products: [], customers: [],
    productHierarchy: { vendor: '', category: '', brand: '', subBrand: '', productId: '' },
    customerHierarchy: { channel: '', subChannel: '', segmentation: '', hierarchy1: '', hierarchy2: '', hierarchy3: '', headOffice: '', customerId: '' }
  });

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    if (isEditMode) fetchPromotion();
  }, [id]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.data || response.data);
    } catch (err) { console.error('Failed to fetch products:', err); }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.data || response.data);
    } catch (err) { console.error('Failed to fetch customers:', err); }
  };

  const fetchPromotion = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/promotions/${id}`);
      const promotion = response.data.data || response.data;
      setFormData({
        name: promotion.name || '', type: promotion.promotionType || promotion.type || '',
        status: promotion.status || 'planned', priority: promotion.priority || 'normal',
        startDate: promotion.startDate ? new Date(promotion.startDate).toISOString().split('T')[0] : '',
        endDate: promotion.endDate ? new Date(promotion.endDate).toISOString().split('T')[0] : '',
        budget: promotion.budgetAmount || promotion.budget || '', description: promotion.description || '',
        dealType: promotion.dealType || 'off_invoice', claimType: promotion.claimType || 'vendor_invoice',
        products: promotion.products || [], customers: promotion.customers || [],
        productHierarchy: promotion.productHierarchy || { vendor: '', category: '', brand: '', subBrand: '', productId: '' },
        customerHierarchy: promotion.customerHierarchy || { channel: '', subChannel: '', segmentation: '', hierarchy1: '', hierarchy2: '', hierarchy3: '', headOffice: '', customerId: '' }
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load promotion');
    } finally { setLoading(false); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleHierarchyChange = (type, level, value) => {
    setFormData(prev => ({
      ...prev,
      [`${type}Hierarchy`]: { ...prev[`${type}Hierarchy`], [level]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError('Promotion name is required'); return; }
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      setError('End date must be after start date'); return;
    }
    try {
      setSaving(true); setError(null);
      const payload = { ...formData, promotionType: formData.type, budget: formData.budget ? parseFloat(formData.budget) : 0 };
      if (isEditMode) await api.put(`/promotions/${id}`, payload);
      else await api.post('/promotions', payload);
      navigate('/promotions');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save promotion');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{isEditMode ? 'Edit Promotion' : 'Create Promotion'}</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>Fill in the details below</Typography>
        </Box>
        <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => navigate('/promotions')}
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setError(null)}>{error}</Alert>}

      <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Typography variant="h6" fontWeight={600} mb={2}>Basic Information</Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Promotion Name" name="name" value={formData.name} onChange={handleChange} required placeholder="Enter promotion name" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth><InputLabel>Type</InputLabel>
                <Select name="type" value={formData.type} onChange={handleChange} label="Type">
                  <MenuItem value="">Select type</MenuItem>
                  <MenuItem value="discount">Discount</MenuItem><MenuItem value="bogo">Buy One Get One</MenuItem>
                  <MenuItem value="bundle">Bundle</MenuItem><MenuItem value="rebate">Rebate</MenuItem>
                  <MenuItem value="loyalty">Loyalty</MenuItem><MenuItem value="seasonal">Seasonal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required><InputLabel>Status</InputLabel>
                <Select name="status" value={formData.status} onChange={handleChange} label="Status">
                  <MenuItem value="planned">Planned</MenuItem><MenuItem value="active">Active</MenuItem>
                  <MenuItem value="paused">Paused</MenuItem><MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth><InputLabel>Priority</InputLabel>
                <Select name="priority" value={formData.priority} onChange={handleChange} label="Priority">
                  <MenuItem value="low">Low</MenuItem><MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">High</MenuItem><MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" fontWeight={600} mb={2}>Dates & Financial</Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Start Date" name="startDate" value={formData.startDate} onChange={handleChange} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="End Date" name="endDate" value={formData.endDate} onChange={handleChange} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Budget (R)" name="budget" value={formData.budget} onChange={handleChange} inputProps={{ min: 0, step: 0.01 }} placeholder="0.00" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth><InputLabel>Deal Type</InputLabel>
                <Select name="dealType" value={formData.dealType} onChange={handleChange} label="Deal Type">
                  <MenuItem value="off_invoice">Off Invoice</MenuItem><MenuItem value="on_invoice">On Invoice</MenuItem>
                  <MenuItem value="rebate">Rebate</MenuItem><MenuItem value="allowance">Allowance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth><InputLabel>Claim Type</InputLabel>
                <Select name="claimType" value={formData.claimType} onChange={handleChange} label="Claim Type">
                  <MenuItem value="vendor_invoice">Vendor Invoice</MenuItem><MenuItem value="credit_note">Credit Note</MenuItem>
                  <MenuItem value="deduction">Deduction</MenuItem><MenuItem value="check">Check</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" fontWeight={600} mb={1}>Product Hierarchy</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>Vendor - Category - Brand - Sub Brand - Product</Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth><InputLabel>Vendor</InputLabel>
                <Select value={formData.productHierarchy.vendor} onChange={(e) => handleHierarchyChange('product', 'vendor', e.target.value)} label="Vendor">
                  <MenuItem value="">All Vendors</MenuItem>
                  {productHierarchyOptions.vendors.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth><InputLabel>Category</InputLabel>
                <Select value={formData.productHierarchy.category} onChange={(e) => handleHierarchyChange('product', 'category', e.target.value)} label="Category">
                  <MenuItem value="">All Categories</MenuItem>
                  {productHierarchyOptions.categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth><InputLabel>Brand</InputLabel>
                <Select value={formData.productHierarchy.brand} onChange={(e) => handleHierarchyChange('product', 'brand', e.target.value)} label="Brand">
                  <MenuItem value="">All Brands</MenuItem>
                  {productHierarchyOptions.brands.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth><InputLabel>Sub Brand</InputLabel>
                <Select value={formData.productHierarchy.subBrand} onChange={(e) => handleHierarchyChange('product', 'subBrand', e.target.value)} label="Sub Brand">
                  <MenuItem value="">All Sub Brands</MenuItem>
                  {productHierarchyOptions.subBrands.map(sb => <MenuItem key={sb} value={sb}>{sb}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth><InputLabel>Specific Product</InputLabel>
                <Select value={formData.productHierarchy.productId} onChange={(e) => handleHierarchyChange('product', 'productId', e.target.value)} label="Specific Product">
                  <MenuItem value="">All Products</MenuItem>
                  {products.map(p => <MenuItem key={p.id || p._id} value={p.id || p._id}>{p.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" fontWeight={600} mb={1}>Customer Hierarchy</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>Channel - Sub Channel - Segmentation - Hierarchy - Head Office - Customer</Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth><InputLabel>Channel</InputLabel>
                <Select value={formData.customerHierarchy.channel} onChange={(e) => handleHierarchyChange('customer', 'channel', e.target.value)} label="Channel">
                  <MenuItem value="">All Channels</MenuItem>
                  {customerHierarchyOptions.channels.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth><InputLabel>Sub Channel</InputLabel>
                <Select value={formData.customerHierarchy.subChannel} onChange={(e) => handleHierarchyChange('customer', 'subChannel', e.target.value)} label="Sub Channel">
                  <MenuItem value="">All Sub Channels</MenuItem>
                  {customerHierarchyOptions.subChannels.map(sc => <MenuItem key={sc} value={sc}>{sc}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth><InputLabel>Segmentation</InputLabel>
                <Select value={formData.customerHierarchy.segmentation} onChange={(e) => handleHierarchyChange('customer', 'segmentation', e.target.value)} label="Segmentation">
                  <MenuItem value="">All Segments</MenuItem>
                  {customerHierarchyOptions.segmentations.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth><InputLabel>Hierarchy 1</InputLabel>
                <Select value={formData.customerHierarchy.hierarchy1} onChange={(e) => handleHierarchyChange('customer', 'hierarchy1', e.target.value)} label="Hierarchy 1">
                  <MenuItem value="">All</MenuItem>
                  {customerHierarchyOptions.hierarchy1.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth><InputLabel>Hierarchy 2</InputLabel>
                <Select value={formData.customerHierarchy.hierarchy2} onChange={(e) => handleHierarchyChange('customer', 'hierarchy2', e.target.value)} label="Hierarchy 2">
                  <MenuItem value="">All</MenuItem>
                  {customerHierarchyOptions.hierarchy2.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth><InputLabel>Hierarchy 3</InputLabel>
                <Select value={formData.customerHierarchy.hierarchy3} onChange={(e) => handleHierarchyChange('customer', 'hierarchy3', e.target.value)} label="Hierarchy 3">
                  <MenuItem value="">All</MenuItem>
                  {customerHierarchyOptions.hierarchy3.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth><InputLabel>Head Office</InputLabel>
                <Select value={formData.customerHierarchy.headOffice} onChange={(e) => handleHierarchyChange('customer', 'headOffice', e.target.value)} label="Head Office">
                  <MenuItem value="">All Head Offices</MenuItem>
                  {customerHierarchyOptions.headOffices.map(ho => <MenuItem key={ho} value={ho}>{ho}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth><InputLabel>Specific Customer</InputLabel>
                <Select value={formData.customerHierarchy.customerId} onChange={(e) => handleHierarchyChange('customer', 'customerId', e.target.value)} label="Specific Customer">
                  <MenuItem value="">All Customers</MenuItem>
                  {customers.map(c => <MenuItem key={c.id || c._id} value={c.id || c._id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" fontWeight={600} mb={2}>Description</Typography>
          <TextField fullWidth multiline rows={4} name="description" value={formData.description} onChange={handleChange} placeholder="Enter promotion description..." />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 3, mt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => navigate('/promotions')}
              sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, px: 3 }}>Cancel</Button>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saving}
              sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, px: 3, bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
              {saving ? 'Saving...' : isEditMode ? 'Update Promotion' : 'Create Promotion'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default PromotionForm;
