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


const PromotionEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreateMode = !id;
  const [loading, setLoading] = useState(!isCreateMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [promotion, setPromotion] = useState({
    name: '',
    type: 'Percentage Discount',
    description: '',
    customer: '',
    product: '',
    startDate: '',
    endDate: '',
    discount: 0,
    expectedROI: 0,
    expectedVolumeLift: 0,
    status: 'draft',
    budget: 0,
    actualSpend: 0,
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
      const requests = [
        apiClient.get(`/customers`),
        apiClient.get(`/products`)
      ];
      if (!isCreateMode) {
        requests.unshift(apiClient.get(`/promotions/${id}`));
      }
      const results = await Promise.all(requests);
      
      if (!isCreateMode) {
        const promotionRes = results[0];
        const promoData = promotionRes.data?.data || promotionRes.data;
        setPromotion({
          ...promoData,
          startDate: promoData.startDate?.split('T')[0] || '',
          endDate: promoData.endDate?.split('T')[0] || ''
        });
        setCustomers((results[1].data?.data || results[1].data) || []);
        setProducts((results[2].data?.data || results[2].data) || []);
      } else {
        setCustomers((results[0].data?.data || results[0].data) || []);
        setProducts((results[1].data?.data || results[1].data) || []);
      }
    } catch (err) {
      setError('Error loading data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setPromotion(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!promotion.name || !promotion.customer || !promotion.product) {
        setError('Name, customer, and product are required');
        return;
      }

      if (!promotion.startDate || !promotion.endDate) {
        setError('Start and end dates are required');
        return;
      }

      if (new Date(promotion.endDate) <= new Date(promotion.startDate)) {
        setError('End date must be after start date');
        return;
      }

      setSaving(true);
      setError('');

      if (isCreateMode) {
        const res = await apiClient.post('/promotions', promotion);
        const newId = res.data?.data?.id || res.data?.id;
        setSuccess('Promotion created successfully!');
        setTimeout(() => {
          navigate(newId ? `/promotions/${newId}` : '/promotions');
        }, 1500);
      } else {
        await apiClient.put(`/promotions/${id}`, promotion);
        setSuccess('Promotion updated successfully!');
        setTimeout(() => {
          navigate(`/promotions/${id}`);
        }, 1500);
      }
    } catch (err) {
      setError('Error updating promotion: ' + (err.response?.data?.message || err.message));
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

  const promotionTypes = [
    'Percentage Discount',
    'Buy One Get One (BOGO)',
    'Customer Rebate',
    'Bundle Deal',
    'Volume Discount',
    'Early Payment Discount'
  ];

  const statusOptions = [
    'draft',
    'scheduled',
    'active',
    'completed',
    'cancelled'
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            <EditIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {isCreateMode ? 'Create Promotion' : 'Edit Promotion'}
          </Typography>
          <Chip 
            label={promotion.status || 'Draft'} 
            color={
              promotion.status === 'active' ? 'success' :
              promotion.status === 'completed' ? 'info' :
              promotion.status === 'cancelled' ? 'error' : 'warning'
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

          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Promotion Name"
              value={promotion.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              select
              label="Promotion Type"
              value={promotion.type}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              {promotionTypes.map(type => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Status"
              value={promotion.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              {statusOptions.map(status => (
                <MenuItem key={status} value={status}>
                  {formatLabel(status)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={promotion.description || ''}
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
                value={promotion.customer?.id || promotion.customer?._id || promotion.customer || ''}
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
            <FormControl fullWidth required>
              <InputLabel>Product</InputLabel>
              <Select
                value={promotion.product?.id || promotion.product?._id || promotion.product || ''}
                onChange={(e) => handleChange('product', e.target.value)}
                label="Product"
              >
                {products.map(product => (
                  <MenuItem key={product.id || product._id} value={product.id || product._id}>
                    {product.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Dates and Financial Details */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Dates & Financial Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              type="date"
              label="Start Date"
              value={promotion.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              type="date"
              label="End Date"
              value={promotion.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Discount (%)"
              value={promotion.discount || 0}
              onChange={(e) => handleChange('discount', parseFloat(e.target.value) || 0)}
              InputProps={{
                endAdornment: '%'
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Budget"
              value={promotion.budget || 0}
              onChange={(e) => handleChange('budget', parseFloat(e.target.value) || 0)}
              InputProps={{
                startAdornment: '$'
              }}
            />
          </Grid>

          {/* Performance Metrics */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Performance Metrics
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Expected ROI (%)"
              value={promotion.expectedROI || 0}
              onChange={(e) => handleChange('expectedROI', parseFloat(e.target.value) || 0)}
              InputProps={{
                endAdornment: '%'
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Expected Volume Lift (%)"
              value={promotion.expectedVolumeLift || 0}
              onChange={(e) => handleChange('expectedVolumeLift', parseFloat(e.target.value) || 0)}
              InputProps={{
                endAdornment: '%'
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Actual Spend"
              value={promotion.actualSpend || 0}
              onChange={(e) => handleChange('actualSpend', parseFloat(e.target.value) || 0)}
              InputProps={{
                startAdornment: '$'
              }}
              helperText="Leave 0 if promotion hasn't started"
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
              value={promotion.notes || ''}
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
                onClick={() => navigate(isCreateMode ? '/promotions' : `/promotions/${id}`)}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? 'Saving...' : isCreateMode ? 'Create Promotion' : 'Save Changes'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default PromotionEdit;
