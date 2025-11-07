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
  Divider
} from '@mui/material';
import { FormDialog } from '../common';
import { customerService } from '../../services/api';
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
        return currencyMap[user.company.currency] || '$';
      }
    }
  } catch (error) {
    console.warn('Error getting currency symbol:', error);
  }
  return '$'; // Fallback
};

const BudgetForm = ({ open, onClose, onSubmit, budget = null }) => {
  const [formData, setFormData] = useState({
    year: new Date().getFullYear() + 1,
    customer_id: '',
    total_amount: '',
    status: 'draft',
    notes: ''
  });
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
    
    // If editing an existing budget, populate the form
    if (budget) {
      setFormData({
        year: budget.year,
        customer_id: budget.customer.id,
        total_amount: budget.total_amount,
        status: budget.status,
        notes: budget.notes || ''
      });
    }
  }, [budget]);

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      const response = await customerService.getAll();
      setCustomers(response.data || response);
      setLoading(false);
    } catch (error) {
      console.error('Error loading customers:', error);
      setErrors({ general: error.message || 'Failed to load customers' });
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Find selected customer name
      const selectedCustomer = customers.find(c => c.id === formData.customer_id);
      const customerName = selectedCustomer ? selectedCustomer.name : 'Unknown';
      
      // Transform form data to match backend Budget model
      const transformedData = {
        name: `${customerName} ${formData.year} Budget`,
        code: `BUD-${formData.year}-${formData.customer_id.substring(0, 8).toUpperCase()}`,
        year: parseInt(formData.year),
        budgetType: 'budget',
        scope: {
          level: 'customer',
          customers: [formData.customer_id]
        },
        status: formData.status,
        allocated: parseFloat(formData.total_amount) || 0,
        remaining: parseFloat(formData.total_amount) || 0,
        spent: 0,
        notes: formData.notes
      };
      
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

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={budget ? 'Edit Budget' : 'Create Budget'}
      submitText={budget ? 'Update' : 'Create'}
      loading={loading}
    >
      <Box sx={{ p: 1 }}>
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
            <FormControl fullWidth error={!!errors.customer_id} required>
              <InputLabel id="customer-label">Customer</InputLabel>
              <Select
                labelId="customer-label"
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                label="Customer"
              >
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.customer_id && (
                <FormHelperText>{errors.customer_id}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
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
          
          <Grid item xs={12}>
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
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              multiline
              rows={4}
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
                  Allocated: {formatCurrency(budget.allocated_amount)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Remaining: {formatCurrency(budget.remaining_amount)}
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