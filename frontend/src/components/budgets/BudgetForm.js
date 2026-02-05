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
import { FormDialog } from '../common';
import { customerService, productService } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

// Get currency symbol from user's company settings
const getCurrencySymbol = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.company && user.company.currency) {
        const currencyMap = {
          'USD': '$', 'EUR': '€', 'GBP': '£', 'ZAR': 'R', 'AUD': 'A$',
          'CAD': 'C$', 'JPY': '¥', 'CNY': '¥', 'INR': '₹'
        };
        return currencyMap[user.company.currency] || 'R';
      }
    }
  } catch (error) {
    console.warn('Error getting currency symbol:', error);
  }
  return 'R'; // Fallback to ZAR
};

// Hierarchy options
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

const BudgetForm = ({ open, onClose, onSubmit, budget = null }) => {
  const [formData, setFormData] = useState({
    year: new Date().getFullYear() + 1,
    total_amount: '',
    budgetCategory: 'marketing',
    status: 'draft',
    notes: '',
    scopeType: 'customer',
    dealType: 'off_invoice',
    claimType: 'vendor_invoice',
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
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [scopeTab, setScopeTab] = useState(1);

  // Fetch customers and products on component mount
  useEffect(() => {
    fetchCustomers();
    fetchProducts();
    
    // If editing an existing budget, populate the form
    if (budget) {
      setFormData({
        year: budget.year,
        total_amount: budget.amount || budget.total_amount,
        budgetCategory: budget.budgetCategory || budget.budget_category || 'marketing',
        status: budget.status,
        notes: budget.notes || '',
        scopeType: budget.scopeType || budget.scope_type || 'customer',
        dealType: budget.dealType || budget.deal_type || 'off_invoice',
        claimType: budget.claimType || budget.claim_type || 'vendor_invoice',
        productVendor: budget.productVendor || budget.product_vendor || '',
        productCategory: budget.productCategory || budget.product_category || '',
        productBrand: budget.productBrand || budget.product_brand || '',
        productSubBrand: budget.productSubBrand || budget.product_sub_brand || '',
        productId: budget.productId || budget.product_id || '',
        customerChannel: budget.customerChannel || budget.customer_channel || '',
        customerSubChannel: budget.customerSubChannel || budget.customer_sub_channel || '',
        customerSegmentation: budget.customerSegmentation || budget.customer_segmentation || '',
        customerHierarchy1: budget.customerHierarchy1 || budget.customer_hierarchy_1 || '',
        customerHierarchy2: budget.customerHierarchy2 || budget.customer_hierarchy_2 || '',
        customerHierarchy3: budget.customerHierarchy3 || budget.customer_hierarchy_3 || '',
        customerHeadOffice: budget.customerHeadOffice || budget.customer_head_office || '',
        customerId: budget.customerId || budget.customer_id || ''
      });
      setScopeTab(budget.scopeType === 'product' || budget.scope_type === 'product' ? 0 : 1);
    }
  }, [budget]);

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      const response = await customerService.getAll();
      setCustomers(response.data || response);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      setProducts(response.data || response);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Get company ID from user data
      const userData = localStorage.getItem('user');
      let companyId = null;
      if (userData) {
        const user = JSON.parse(userData);
        companyId = user.companyId || user.company?.id || user.company?._id;
      }
      
      if (!companyId) {
        throw new Error('Company ID not found. Please log in again.');
      }
      
      // Build budget name based on scope
      let budgetName = `${formData.year} ${formData.budgetCategory === 'marketing' ? 'Marketing' : 'Trade Spend'} Budget`;
      if (formData.scopeType === 'product' && formData.productVendor) {
        budgetName = `${formData.productVendor} - ${budgetName}`;
      } else if (formData.scopeType === 'customer' && formData.customerChannel) {
        budgetName = `${formData.customerChannel} - ${budgetName}`;
      }
      
      // Transform form data to match backend Budget model
      const transformedData = {
        company_id: companyId,
        name: budgetName,
        year: parseInt(formData.year),
        amount: parseFloat(formData.total_amount) || 0,
        utilized: 0,
        status: formData.status,
        budget_type: formData.budgetCategory,
        budget_category: formData.budgetCategory,
        scope_type: formData.scopeType,
        deal_type: formData.dealType,
        claim_type: formData.claimType,
        // Product hierarchy
        product_vendor: formData.productVendor || null,
        product_category: formData.productCategory || null,
        product_brand: formData.productBrand || null,
        product_sub_brand: formData.productSubBrand || null,
        product_id: formData.productId || null,
        // Customer hierarchy
        customer_channel: formData.customerChannel || null,
        customer_sub_channel: formData.customerSubChannel || null,
        customer_segmentation: formData.customerSegmentation || null,
        customer_hierarchy_1: formData.customerHierarchy1 || null,
        customer_hierarchy_2: formData.customerHierarchy2 || null,
        customer_hierarchy_3: formData.customerHierarchy3 || null,
        customer_head_office: formData.customerHeadOffice || null,
        customer_id: formData.customerId || null,
        data: JSON.stringify({ notes: formData.notes })
      };
      
      console.log('Transformed budget data:', transformedData);
      await onSubmit(transformedData);
      setLoading(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ general: error.message || 'Failed to submit form' });
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScopeTabChange = (event, newValue) => {
    setScopeTab(newValue);
    setFormData(prev => ({
      ...prev,
      scopeType: newValue === 0 ? 'product' : 'customer'
    }));
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={budget ? 'Edit Budget' : 'Create Budget'}
      submitText={budget ? 'Update' : 'Create'}
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
            <TextField
              fullWidth
              label="Year"
              name="year"
              type="number"
              value={formData.year}
              onChange={handleChange}
              error={!!errors.year}
              helperText={errors.year}
              required
              inputProps={{ min: new Date().getFullYear() }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Total Amount"
              name="total_amount"
              type="number"
              value={formData.total_amount}
              onChange={handleChange}
              error={!!errors.total_amount}
              helperText={errors.total_amount}
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">{getCurrencySymbol()}</InputAdornment>,
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="budget-category-label">Budget Category</InputLabel>
              <Select
                labelId="budget-category-label"
                name="budgetCategory"
                value={formData.budgetCategory}
                onChange={handleChange}
                label="Budget Category"
              >
                <MenuItem value="marketing">Marketing</MenuItem>
                <MenuItem value="trade_spend">Trade Spend</MenuItem>
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
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Deal Type and Claim Type */}
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

        {/* Scope Selection - Product or Customer Hierarchy */}
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Budget Scope
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select whether this budget applies to Product or Customer hierarchy
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
        
        {budget && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Budget Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Created: {new Date(budget.created_at).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Last Updated: {new Date(budget.updated_at).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Allocated: {formatCurrency(budget.amount)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Utilized: {formatCurrency(budget.utilized)}
                </Typography>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </FormDialog>
  );
};

export default BudgetForm;
