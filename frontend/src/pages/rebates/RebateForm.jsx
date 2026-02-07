import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  InputAdornment,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import {Save, Cancel} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import rebateService from '../../services/rebateService';
import api from '../../services/api';

// Static hierarchy options for consistency across the app
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

const RebateForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
      name: '',
      description: '',
      type: 'volume',
      status: 'draft',
      calculation: {
        method: 'percentage',
        value: 0,
        tiers: []
      },
      eligibility: {
        customerIds: [],
        productIds: [],
        minimumPurchase: 0,
        purchasePeriod: 'monthly'
      },
      terms: {
        startDate: '',
        endDate: '',
        paymentTerms: 'net_30',
        claimDeadline: 30
      },
      approvalWorkflow: {
        requiresApproval: true,
        approvers: [],
        autoApprove: false,
        approvalLimit: 0
      },
      // Product hierarchy
      productVendor: '',
      productCategory: '',
      productBrand: '',
      productSubBrand: '',
      // Customer hierarchy
      customerChannel: '',
      customerSubChannel: '',
      customerSegmentation: '',
      customerHierarchy1: '',
      customerHierarchy2: '',
      customerHierarchy3: '',
      customerHeadOffice: ''
    });

  useEffect(() => {
    loadInitialData();
    if (isEdit) {
      loadRebate();
    }
  }, [id]);

  const loadInitialData = async () => {
    try {
      const [customersRes, productsRes] = await Promise.all([
        api.get('/customers'),
        api.get('/products')
      ]);
      
      setCustomers(customersRes.data?.data || customersRes.data || []);
      setProducts(productsRes.data?.data || productsRes.data || []);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setError('Failed to load form data');
    }
  };

  const loadRebate = async () => {
    try {
      setLoading(true);
      const response = await rebateService.getRebateById(id);
      if (response.success) {
        setFormData(response.data);
      }
    } catch (error) {
      console.error('Failed to load rebate:', error);
      setError('Failed to load rebate details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let response;
      if (isEdit) {
        response = await rebateService.updateRebate(id, formData);
      } else {
        response = await rebateService.createRebate(formData);
      }

      if (response.success) {
        setSuccess(isEdit ? 'Rebate updated successfully' : 'Rebate created successfully');
        setTimeout(() => {
          navigate('/rebates');
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to save rebate:', error);
      setError(error.response?.data?.message || 'Failed to save rebate');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTier = () => {
    setFormData(prev => ({
      ...prev,
      calculation: {
        ...prev.calculation,
        tiers: [
          ...prev.calculation.tiers,
          { minQuantity: 0, maxQuantity: 0, value: 0 }
        ]
      }
    }));
  };

  const handleRemoveTier = (index) => {
    setFormData(prev => ({
      ...prev,
      calculation: {
        ...prev.calculation,
        tiers: prev.calculation.tiers.filter((_, i) => i !== index)
      }
    }));
  };

  const handleTierChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      calculation: {
        ...prev.calculation,
        tiers: prev.calculation.tiers.map((tier, i) =>
          i === index ? { ...tier, [field]: value } : tier
        )
      }
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {isEdit ? 'Edit Rebate' : 'Create New Rebate'}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          {/* Basic Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Basic Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Rebate Name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth required>
                    <InputLabel>Rebate Type</InputLabel>
                    <Select
                      value={formData.type}
                      onChange={(e) => handleChange('type', e.target.value)}
                      label="Rebate Type"
                    >
                      <MenuItem value="volume">Volume Rebate</MenuItem>
                      <MenuItem value="growth">Growth Rebate</MenuItem>
                      <MenuItem value="promotional">Promotional Rebate</MenuItem>
                      <MenuItem value="tiered">Tiered Rebate</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="pending_approval">Pending Approval</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Calculation Method */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Calculation Method</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Calculation Method</InputLabel>
                    <Select
                      value={formData.calculation.method}
                      onChange={(e) => handleNestedChange('calculation', 'method', e.target.value)}
                      label="Calculation Method"
                    >
                      <MenuItem value="percentage">Percentage</MenuItem>
                      <MenuItem value="fixed">Fixed Amount</MenuItem>
                      <MenuItem value="tiered">Tiered</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {formData.calculation.method !== 'tiered' && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={formData.calculation.method === 'percentage' ? 'Percentage (%)' : 'Fixed Amount (R)'}
                      type="number"
                      value={formData.calculation.value}
                      onChange={(e) => handleNestedChange('calculation', 'value', parseFloat(e.target.value))}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            {formData.calculation.method === 'percentage' ? '%' : 'R'}
                          </InputAdornment>
                        )
                      }}
                      required
                    />
                  </Grid>
                )}
              </Grid>

              {/* Tiered Rebate Configuration */}
              {formData.calculation.method === 'tiered' && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">Tier Configuration</Typography>
                    <Button size="small" onClick={handleAddTier} variant="outlined">
                      Add Tier
                    </Button>
                  </Box>
                  {formData.calculation.tiers.map((tier, index) => (
                    <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Min Quantity"
                            type="number"
                            value={tier.minQuantity}
                            onChange={(e) => handleTierChange(index, 'minQuantity', parseFloat(e.target.value))}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Max Quantity"
                            type="number"
                            value={tier.maxQuantity}
                            onChange={(e) => handleTierChange(index, 'maxQuantity', parseFloat(e.target.value))}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Rebate Value (%)"
                            type="number"
                            value={tier.value}
                            onChange={(e) => handleTierChange(index, 'value', parseFloat(e.target.value))}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <Button
                            fullWidth
                            variant="outlined"
                            color="error"
                            onClick={() => handleRemoveTier(index)}
                          >
                            Remove
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Eligibility Criteria */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Eligibility Criteria</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    options={customers}
                    getOptionLabel={(option) => option.name || ''}
                                    value={customers.filter(c => formData.eligibility.customerIds.includes(c.id || c._id))}
                                    onChange={(e, newValue) => {
                                      handleNestedChange('eligibility', 'customerIds', newValue.map(v => v.id || v._id));
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Eligible Customers" placeholder="Select customers" />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip label={option.name} {...getTagProps({ index })} size="small" />
                      ))
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    options={products}
                    getOptionLabel={(option) => option.name || ''}
                                    value={products.filter(p => formData.eligibility.productIds.includes(p.id || p._id))}
                                    onChange={(e, newValue) => {
                                      handleNestedChange('eligibility', 'productIds', newValue.map(v => v.id || v._id));
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Eligible Products" placeholder="Select products" />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip label={option.name} {...getTagProps({ index })} size="small" />
                      ))
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Minimum Purchase Amount"
                    type="number"
                    value={formData.eligibility.minimumPurchase}
                    onChange={(e) => handleNestedChange('eligibility', 'minimumPurchase', parseFloat(e.target.value))}
                                        InputProps={{
                                          startAdornment: <InputAdornment position="start">R</InputAdornment>
                                        }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Purchase Period</InputLabel>
                    <Select
                      value={formData.eligibility.purchasePeriod}
                      onChange={(e) => handleNestedChange('eligibility', 'purchasePeriod', e.target.value)}
                      label="Purchase Period"
                    >
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="quarterly">Quarterly</MenuItem>
                      <MenuItem value="yearly">Yearly</MenuItem>
                      <MenuItem value="campaign">Campaign Period</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Product Hierarchy */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Product Hierarchy (Optional)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                <Chip label="Product Hierarchy" size="small" color="primary" sx={{ mr: 1 }} />
                Vendor - Category - Brand - Sub Brand
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Vendor</InputLabel>
                    <Select
                      value={formData.productVendor}
                      onChange={(e) => handleChange('productVendor', e.target.value)}
                      label="Vendor"
                    >
                      <MenuItem value="">All Vendors</MenuItem>
                      {productHierarchyOptions.vendors.map(v => (
                        <MenuItem key={v} value={v}>{v}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.productCategory}
                      onChange={(e) => handleChange('productCategory', e.target.value)}
                      label="Category"
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {productHierarchyOptions.categories.map(c => (
                        <MenuItem key={c} value={c}>{c}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Brand</InputLabel>
                    <Select
                      value={formData.productBrand}
                      onChange={(e) => handleChange('productBrand', e.target.value)}
                      label="Brand"
                    >
                      <MenuItem value="">All Brands</MenuItem>
                      {productHierarchyOptions.brands.map(b => (
                        <MenuItem key={b} value={b}>{b}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Sub Brand</InputLabel>
                    <Select
                      value={formData.productSubBrand}
                      onChange={(e) => handleChange('productSubBrand', e.target.value)}
                      label="Sub Brand"
                    >
                      <MenuItem value="">All Sub Brands</MenuItem>
                      {productHierarchyOptions.subBrands.map(sb => (
                        <MenuItem key={sb} value={sb}>{sb}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Customer Hierarchy */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer Hierarchy (Optional)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                <Chip label="Customer Hierarchy" size="small" color="secondary" sx={{ mr: 1 }} />
                Channel - Sub Channel - Segmentation - Hierarchy 1/2/3 - Head Office
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Channel</InputLabel>
                    <Select
                      value={formData.customerChannel}
                      onChange={(e) => handleChange('customerChannel', e.target.value)}
                      label="Channel"
                    >
                      <MenuItem value="">All Channels</MenuItem>
                      {customerHierarchyOptions.channels.map(c => (
                        <MenuItem key={c} value={c}>{c}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Sub Channel</InputLabel>
                    <Select
                      value={formData.customerSubChannel}
                      onChange={(e) => handleChange('customerSubChannel', e.target.value)}
                      label="Sub Channel"
                    >
                      <MenuItem value="">All Sub Channels</MenuItem>
                      {customerHierarchyOptions.subChannels.map(sc => (
                        <MenuItem key={sc} value={sc}>{sc}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Segmentation</InputLabel>
                    <Select
                      value={formData.customerSegmentation}
                      onChange={(e) => handleChange('customerSegmentation', e.target.value)}
                      label="Segmentation"
                    >
                      <MenuItem value="">All Segments</MenuItem>
                      {customerHierarchyOptions.segmentations.map(s => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Hierarchy 1</InputLabel>
                    <Select
                      value={formData.customerHierarchy1}
                      onChange={(e) => handleChange('customerHierarchy1', e.target.value)}
                      label="Hierarchy 1"
                    >
                      <MenuItem value="">All</MenuItem>
                      {customerHierarchyOptions.hierarchy1.map(h => (
                        <MenuItem key={h} value={h}>{h}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Hierarchy 2</InputLabel>
                    <Select
                      value={formData.customerHierarchy2}
                      onChange={(e) => handleChange('customerHierarchy2', e.target.value)}
                      label="Hierarchy 2"
                    >
                      <MenuItem value="">All</MenuItem>
                      {customerHierarchyOptions.hierarchy2.map(h => (
                        <MenuItem key={h} value={h}>{h}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Hierarchy 3</InputLabel>
                    <Select
                      value={formData.customerHierarchy3}
                      onChange={(e) => handleChange('customerHierarchy3', e.target.value)}
                      label="Hierarchy 3"
                    >
                      <MenuItem value="">All</MenuItem>
                      {customerHierarchyOptions.hierarchy3.map(h => (
                        <MenuItem key={h} value={h}>{h}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Head Office</InputLabel>
                    <Select
                      value={formData.customerHeadOffice}
                      onChange={(e) => handleChange('customerHeadOffice', e.target.value)}
                      label="Head Office"
                    >
                      <MenuItem value="">All Head Offices</MenuItem>
                      {customerHierarchyOptions.headOffices.map(ho => (
                        <MenuItem key={ho} value={ho}>{ho}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Terms & Conditions</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={formData.terms.startDate}
                    onChange={(e) => handleNestedChange('terms', 'startDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={formData.terms.endDate}
                    onChange={(e) => handleNestedChange('terms', 'endDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Terms</InputLabel>
                    <Select
                      value={formData.terms.paymentTerms}
                      onChange={(e) => handleNestedChange('terms', 'paymentTerms', e.target.value)}
                      label="Payment Terms"
                    >
                      <MenuItem value="net_30">Net 30</MenuItem>
                      <MenuItem value="net_60">Net 60</MenuItem>
                      <MenuItem value="net_90">Net 90</MenuItem>
                      <MenuItem value="immediate">Immediate</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Claim Deadline (days)"
                    type="number"
                    value={formData.terms.claimDeadline}
                    onChange={(e) => handleNestedChange('terms', 'claimDeadline', parseInt(e.target.value))}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={() => navigate('/rebates')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Save />}
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Rebate' : 'Create Rebate')}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default RebateForm;
