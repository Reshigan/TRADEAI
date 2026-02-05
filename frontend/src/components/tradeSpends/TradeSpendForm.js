import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  FormHelperText,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Divider,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { FormDialog } from '../common';
import { customerService, productService } from '../../services/api';

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

const TradeSpendForm = ({ 
  open, 
  onClose, 
  onSubmit, 
  tradeSpend = null, 
  budgets = [],
  initialBudgetId = ''
}) => {
  const [formData, setFormData] = useState({
    budget_id: initialBudgetId || '',
    amount: '',
    type: 'promotion',
    description: '',
    status: 'draft',
    start_date: new Date(),
    end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    notes: '',
    dealType: 'off_invoice',
    claimType: 'vendor_invoice',
    scopeType: 'customer',
    // Product hierarchy
    productVendor: '',
    productCategory: '',
    productBrand: '',
    productSubBrand: '',
    productId: '',
    // Customer hierarchy
    customerChannel: '',
    customerSubChannel: '',
    customerSegmentation: '',
    customerHierarchy1: '',
    customerHierarchy2: '',
    customerHierarchy3: '',
    customerHeadOffice: '',
    customerId: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [scopeTab, setScopeTab] = useState(1);

  // Load customers and products on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, productsRes] = await Promise.all([
          customerService.getAll(),
          productService.getAll()
        ]);
        setCustomers(customersRes.data || customersRes || []);
        setProducts(productsRes.data || productsRes || []);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    fetchData();
  }, []);

  // If editing an existing trade spend, populate the form
  useEffect(() => {
    if (tradeSpend) {
      setFormData({
        budget_id: tradeSpend.budget?.id || tradeSpend.budget_id || '',
        amount: tradeSpend.amount,
        type: tradeSpend.type,
        description: tradeSpend.description,
        status: tradeSpend.status,
        start_date: new Date(tradeSpend.start_date),
        end_date: new Date(tradeSpend.end_date),
        notes: tradeSpend.notes || '',
        dealType: tradeSpend.dealType || tradeSpend.deal_type || 'off_invoice',
        claimType: tradeSpend.claimType || tradeSpend.claim_type || 'vendor_invoice',
        scopeType: tradeSpend.scopeType || tradeSpend.scope_type || 'customer',
        productVendor: tradeSpend.productVendor || tradeSpend.product_vendor || '',
        productCategory: tradeSpend.productCategory || tradeSpend.product_category || '',
        productBrand: tradeSpend.productBrand || tradeSpend.product_brand || '',
        productSubBrand: tradeSpend.productSubBrand || tradeSpend.product_sub_brand || '',
        productId: tradeSpend.productId || tradeSpend.product_id || '',
        customerChannel: tradeSpend.customerChannel || tradeSpend.customer_channel || '',
        customerSubChannel: tradeSpend.customerSubChannel || tradeSpend.customer_sub_channel || '',
        customerSegmentation: tradeSpend.customerSegmentation || tradeSpend.customer_segmentation || '',
        customerHierarchy1: tradeSpend.customerHierarchy1 || tradeSpend.customer_hierarchy_1 || '',
        customerHierarchy2: tradeSpend.customerHierarchy2 || tradeSpend.customer_hierarchy_2 || '',
        customerHierarchy3: tradeSpend.customerHierarchy3 || tradeSpend.customer_hierarchy_3 || '',
        customerHeadOffice: tradeSpend.customerHeadOffice || tradeSpend.customer_head_office || '',
        customerId: tradeSpend.customerId || tradeSpend.customer_id || ''
      });
      setScopeTab(tradeSpend.scopeType === 'product' || tradeSpend.scope_type === 'product' ? 0 : 1);
    } else if (initialBudgetId) {
      setFormData(prev => ({
        ...prev,
        budget_id: initialBudgetId
      }));
    }
  }, [tradeSpend, initialBudgetId]);

  // Handle scope tab change
  const handleScopeTabChange = (event, newValue) => {
    setScopeTab(newValue);
    setFormData(prev => ({
      ...prev,
      scopeType: newValue === 0 ? 'product' : 'customer'
    }));
  };

  // Handle form field changes
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
    
    // Clear error for the field
    if (errors[name]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: null
      }));
    }
  };

  // Handle date changes
  const handleDateChange = (name, date) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: date
    }));
    
    // Clear error for the field
    if (errors[name]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: null
      }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.budget_id) {
      newErrors.budget_id = 'Budget is required';
    }
    
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    if (!formData.description) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }
    
    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    } else if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
      newErrors.end_date = 'End date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      setLoading(true);
      
      // Format data for API
      const tradeSpendData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };
      
      // Submit form
      onSubmit(tradeSpendData);
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <FormDialog
        open={open}
        onClose={onClose}
        onSubmit={handleSubmit}
        title={tradeSpend ? 'Edit Trade Spend' : 'Create Trade Spend'}
        submitText={tradeSpend ? 'Update' : 'Create'}
        loading={loading}
        maxWidth="md"
      >
        <Box sx={{ p: 1 }}>
          {/* Basic Information */}
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Basic Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.budget_id} required>
                <InputLabel id="budget-label">Budget</InputLabel>
                <Select
                  labelId="budget-label"
                  name="budget_id"
                  value={formData.budget_id}
                  onChange={handleChange}
                  label="Budget"
                  disabled={!!initialBudgetId}
                >
                  {budgets.map((budget) => (
                    <MenuItem key={budget.id || budget._id} value={budget.id || budget._id}>
                      {budget.name || budget.customerName || `${budget.year} Budget`}
                    </MenuItem>
                  ))}
                </Select>
                {errors.budget_id && (
                  <FormHelperText>{errors.budget_id}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                error={!!errors.amount}
                helperText={errors.amount}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">R</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                error={!!errors.description}
                helperText={errors.description}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="type-label">Type</InputLabel>
                <Select
                  labelId="type-label"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  label="Type"
                >
                  <MenuItem value="promotion">Promotion</MenuItem>
                  <MenuItem value="listing">Listing</MenuItem>
                  <MenuItem value="display">Display</MenuItem>
                  <MenuItem value="rebate">Rebate</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="pending">Pending Approval</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Start Date"
                value={formData.start_date}
                onChange={(date) => handleDateChange('start_date', date)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    required
                    error={!!errors.start_date}
                    helperText={errors.start_date}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="End Date"
                value={formData.end_date}
                onChange={(date) => handleDateChange('end_date', date)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    required
                    error={!!errors.end_date}
                    helperText={errors.end_date}
                  />
                )}
                minDate={formData.start_date}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Deal & Claim Configuration */}
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Deal & Claim Configuration
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="deal-type-label">Deal Type</InputLabel>
                <Select
                  labelId="deal-type-label"
                  name="dealType"
                  value={formData.dealType}
                  onChange={handleChange}
                  label="Deal Type"
                >
                  <MenuItem value="off_invoice">Off Invoice</MenuItem>
                  <MenuItem value="on_invoice">On Invoice</MenuItem>
                  <MenuItem value="rebate">Rebate</MenuItem>
                  <MenuItem value="allowance">Allowance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="claim-type-label">Claim Type</InputLabel>
                <Select
                  labelId="claim-type-label"
                  name="claimType"
                  value={formData.claimType}
                  onChange={handleChange}
                  label="Claim Type"
                >
                  <MenuItem value="vendor_invoice">Vendor Invoice</MenuItem>
                  <MenuItem value="credit_note">Credit Note</MenuItem>
                  <MenuItem value="deduction">Deduction</MenuItem>
                  <MenuItem value="check">Check</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Scope Selection */}
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Trade Spend Scope
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select whether this trade spend applies to Product or Customer hierarchy
          </Typography>
          
          <Tabs 
            value={scopeTab} 
            onChange={handleScopeTabChange}
            sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Product Hierarchy" />
            <Tab label="Customer Hierarchy" />
          </Tabs>

          {/* Product Hierarchy Tab */}
          {scopeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  <Chip label="Product Hierarchy" size="small" color="primary" sx={{ mr: 1 }} />
                  Vendor - Category - Brand - Sub Brand - Product
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="product-vendor-label">Vendor</InputLabel>
                  <Select
                    labelId="product-vendor-label"
                    name="productVendor"
                    value={formData.productVendor}
                    onChange={handleChange}
                    label="Vendor"
                  >
                    <MenuItem value="">All Vendors</MenuItem>
                    {productHierarchyOptions.vendors.map(v => (
                      <MenuItem key={v} value={v}>{v}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="product-category-label">Category</InputLabel>
                  <Select
                    labelId="product-category-label"
                    name="productCategory"
                    value={formData.productCategory}
                    onChange={handleChange}
                    label="Category"
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {productHierarchyOptions.categories.map(c => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="product-brand-label">Brand</InputLabel>
                  <Select
                    labelId="product-brand-label"
                    name="productBrand"
                    value={formData.productBrand}
                    onChange={handleChange}
                    label="Brand"
                  >
                    <MenuItem value="">All Brands</MenuItem>
                    {productHierarchyOptions.brands.map(b => (
                      <MenuItem key={b} value={b}>{b}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="product-sub-brand-label">Sub Brand</InputLabel>
                  <Select
                    labelId="product-sub-brand-label"
                    name="productSubBrand"
                    value={formData.productSubBrand}
                    onChange={handleChange}
                    label="Sub Brand"
                  >
                    <MenuItem value="">All Sub Brands</MenuItem>
                    {productHierarchyOptions.subBrands.map(sb => (
                      <MenuItem key={sb} value={sb}>{sb}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="product-id-label">Specific Product</InputLabel>
                  <Select
                    labelId="product-id-label"
                    name="productId"
                    value={formData.productId}
                    onChange={handleChange}
                    label="Specific Product"
                  >
                    <MenuItem value="">All Products</MenuItem>
                    {products.map(p => (
                      <MenuItem key={p.id || p._id} value={p.id || p._id}>{p.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}

          {/* Customer Hierarchy Tab */}
          {scopeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  <Chip label="Customer Hierarchy" size="small" color="secondary" sx={{ mr: 1 }} />
                  Channel - Sub Channel - Segmentation - Hierarchy 1/2/3 - Head Office - Customer
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="customer-channel-label">Channel</InputLabel>
                  <Select
                    labelId="customer-channel-label"
                    name="customerChannel"
                    value={formData.customerChannel}
                    onChange={handleChange}
                    label="Channel"
                  >
                    <MenuItem value="">All Channels</MenuItem>
                    {customerHierarchyOptions.channels.map(c => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="customer-sub-channel-label">Sub Channel</InputLabel>
                  <Select
                    labelId="customer-sub-channel-label"
                    name="customerSubChannel"
                    value={formData.customerSubChannel}
                    onChange={handleChange}
                    label="Sub Channel"
                  >
                    <MenuItem value="">All Sub Channels</MenuItem>
                    {customerHierarchyOptions.subChannels.map(sc => (
                      <MenuItem key={sc} value={sc}>{sc}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="customer-segmentation-label">Segmentation</InputLabel>
                  <Select
                    labelId="customer-segmentation-label"
                    name="customerSegmentation"
                    value={formData.customerSegmentation}
                    onChange={handleChange}
                    label="Segmentation"
                  >
                    <MenuItem value="">All Segments</MenuItem>
                    {customerHierarchyOptions.segmentations.map(s => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="customer-h1-label">Hierarchy 1</InputLabel>
                  <Select
                    labelId="customer-h1-label"
                    name="customerHierarchy1"
                    value={formData.customerHierarchy1}
                    onChange={handleChange}
                    label="Hierarchy 1"
                  >
                    <MenuItem value="">All</MenuItem>
                    {customerHierarchyOptions.hierarchy1.map(h => (
                      <MenuItem key={h} value={h}>{h}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="customer-h2-label">Hierarchy 2</InputLabel>
                  <Select
                    labelId="customer-h2-label"
                    name="customerHierarchy2"
                    value={formData.customerHierarchy2}
                    onChange={handleChange}
                    label="Hierarchy 2"
                  >
                    <MenuItem value="">All</MenuItem>
                    {customerHierarchyOptions.hierarchy2.map(h => (
                      <MenuItem key={h} value={h}>{h}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="customer-h3-label">Hierarchy 3</InputLabel>
                  <Select
                    labelId="customer-h3-label"
                    name="customerHierarchy3"
                    value={formData.customerHierarchy3}
                    onChange={handleChange}
                    label="Hierarchy 3"
                  >
                    <MenuItem value="">All</MenuItem>
                    {customerHierarchyOptions.hierarchy3.map(h => (
                      <MenuItem key={h} value={h}>{h}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="customer-head-office-label">Head Office</InputLabel>
                  <Select
                    labelId="customer-head-office-label"
                    name="customerHeadOffice"
                    value={formData.customerHeadOffice}
                    onChange={handleChange}
                    label="Head Office"
                  >
                    <MenuItem value="">All Head Offices</MenuItem>
                    {customerHierarchyOptions.headOffices.map(ho => (
                      <MenuItem key={ho} value={ho}>{ho}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="customer-id-label">Specific Customer</InputLabel>
                  <Select
                    labelId="customer-id-label"
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleChange}
                    label="Specific Customer"
                  >
                    <MenuItem value="">All Customers</MenuItem>
                    {customers.map(c => (
                      <MenuItem key={c.id || c._id} value={c.id || c._id}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Notes */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
          
          {tradeSpend && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Trade Spend Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Created: {new Date(tradeSpend.created_at).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated: {new Date(tradeSpend.updated_at).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            </>
          )}
        </Box>
      </FormDialog>
    </LocalizationProvider>
  );
};

export default TradeSpendForm;
