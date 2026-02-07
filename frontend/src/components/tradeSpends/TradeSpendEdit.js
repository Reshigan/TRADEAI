import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Box,
  MenuItem,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { formatLabel } from '../../utils/formatters';

// Get currency symbol from user's company settings
const getCurrencySymbol = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      const currencyMap = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'ZAR': 'R', 'AUD': 'A$',
        'CAD': 'C$', 'JPY': '¥', 'CNY': '¥', 'INR': '₹', 'MXN': '$'
      };
      return currencyMap[user?.company?.currency] || 'R';
    }
  } catch (e) {
    console.warn('Error getting currency symbol:', e);
  }
  return 'R'; // Default to ZAR
};

const TradeSpendEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [tradeSpend, setTradeSpend] = useState({
    type: 'Promotion',
    description: '',
    customer: '',
    product: '',
    amount: 0,
    date: '',
    status: 'draft',
    category: '',
    activityType: '',
    paymentTerms: '',
    accrualType: 'immediate',
    glAccount: '',
    costCenter: '',
    notes: ''
  });

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tradeSpendRes, customersRes, productsRes] = await Promise.all([
        apiClient.get(`/trade-spends/${id}`),
        apiClient.get(`/customers`),
        apiClient.get(`/products`)
      ]);
      
      setTradeSpend({
        ...tradeSpendRes.data,
        date: tradeSpendRes.data.date?.split('T')[0] || ''
      });
      setCustomers(customersRes.data);
      setProducts(productsRes.data);
    } catch (err) {
      setError('Error loading data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setTradeSpend(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!tradeSpend.type || !tradeSpend.customer || !tradeSpend.amount) {
        setError('Type, customer, and amount are required');
        return;
      }

      if (!tradeSpend.date) {
        setError('Date is required');
        return;
      }

      setSaving(true);
      setError('');

      await apiClient.put(`/trade-spends/${id}`, tradeSpend);
      
      setSuccess('Trade spend updated successfully!');
      setTimeout(() => {
        navigate(`/trade-spends/${id}`);
      }, 1500);
    } catch (err) {
      setError('Error updating trade spend: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Container>
    );
  }

  const tradeSpendTypes = [
    'Promotion',
    'Rebate',
    'Discount',
    'Allowance',
    'Co-op Advertising',
    'Listing Fee',
    'Volume Incentive',
    'Other'
  ];

  const categories = [
    'Trade Marketing',
    'Customer Rebates',
    'Volume Incentives',
    'Display Allowances',
    'Promotional Support',
    'Advertising Co-op',
    'Slotting Fees',
    'Other'
  ];

  const statusOptions = ['draft', 'submitted', 'approved', 'paid', 'cancelled'];
  const accrualTypes = ['immediate', 'deferred', 'amortized'];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            <EditIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Edit Trade Spend
          </Typography>
          <Chip 
            label={tradeSpend.status || 'Draft'} 
            color={
              tradeSpend.status === 'approved' ? 'success' :
              tradeSpend.status === 'paid' ? 'info' :
              tradeSpend.status === 'cancelled' ? 'error' : 'warning'
            }
            sx={{ textTransform: 'capitalize' }}
          />
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              select
              label="Type"
              value={tradeSpend.type}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              {tradeSpendTypes.map(type => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Category"
              value={tradeSpend.category || ''}
              onChange={(e) => handleChange('category', e.target.value)}
            >
              {categories.map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Activity Type"
              value={tradeSpend.activityType || ''}
              onChange={(e) => handleChange('activityType', e.target.value)}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              <MenuItem value="trade_marketing">Trade Marketing</MenuItem>
              <MenuItem value="key_account">Key Account</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              value={tradeSpend.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </Grid>

          {/* Target Details */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Target Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Customer</InputLabel>
              <Select
                value={tradeSpend.customer?.id || tradeSpend.customer?._id || tradeSpend.customer || ''}
                onChange={(e) => handleChange('customer', e.target.value)}
                label="Customer"
              >
                {customers.map(customer => (
                  <MenuItem key={customer.id || customer._id} value={customer.id || customer._id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Product (Optional)</InputLabel>
              <Select
                value={tradeSpend.product?.id || tradeSpend.product?._id || tradeSpend.product || ''}
                onChange={(e) => handleChange('product', e.target.value)}
                label="Product (Optional)"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {products.map(product => (
                  <MenuItem key={product.id || product._id} value={product.id || product._id}>
                    {product.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Financial Details */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Financial Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              type="number"
              label="Amount"
              value={tradeSpend.amount || 0}
              onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
              InputProps={{
                startAdornment: getCurrencySymbol()
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              type="date"
              label="Date"
              value={tradeSpend.date}
              onChange={(e) => handleChange('date', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Status"
              value={tradeSpend.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              {statusOptions.map(status => (
                <MenuItem key={status} value={status}>
                  {formatLabel(status)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Accrual Type"
              value={tradeSpend.accrualType}
              onChange={(e) => handleChange('accrualType', e.target.value)}
            >
              {accrualTypes.map(type => (
                <MenuItem key={type} value={type}>
                  {formatLabel(type)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Accounting Details */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Accounting Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="GL Account"
              value={tradeSpend.glAccount || ''}
              onChange={(e) => handleChange('glAccount', e.target.value)}
              placeholder="e.g., 5200-001"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Cost Center"
              value={tradeSpend.costCenter || ''}
              onChange={(e) => handleChange('costCenter', e.target.value)}
              placeholder="e.g., CC-MKT-001"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Payment Terms"
              value={tradeSpend.paymentTerms || ''}
              onChange={(e) => handleChange('paymentTerms', e.target.value)}
              placeholder="e.g., Net 30, Net 60"
            />
          </Grid>

          {/* Additional Notes */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Additional Notes
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Notes"
              value={tradeSpend.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional notes or comments..."
            />
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => navigate(`/trade-spends/${id}`)}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default TradeSpendEdit;
