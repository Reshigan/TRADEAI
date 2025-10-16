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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { FormDialog } from '../common';

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

const PromotionForm = ({ 
  open, 
  onClose, 
  onSubmit, 
  promotion = null, 
  customers = []
}) => {
  const [formData, setFormData] = useState({
    name: '',
    customer_id: '',
    budget: '',
    status: 'draft',
    start_date: new Date(),
    end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    description: '',
    objectives: '',
    kpis: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // If editing an existing promotion, populate the form
  useEffect(() => {
    if (promotion) {
      setFormData({
        name: promotion.name,
        customer_id: promotion.customer.id,
        budget: promotion.budget,
        status: promotion.status,
        start_date: new Date(promotion.start_date),
        end_date: new Date(promotion.end_date),
        description: promotion.description || '',
        objectives: promotion.objectives || '',
        kpis: promotion.kpis || ''
      });
    }
  }, [promotion]);

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
    
    if (!formData.name) {
      newErrors.name = 'Promotion name is required';
    }
    
    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required';
    }
    
    if (!formData.budget) {
      newErrors.budget = 'Budget is required';
    } else if (isNaN(formData.budget) || parseFloat(formData.budget) <= 0) {
      newErrors.budget = 'Budget must be a positive number';
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
      const promotionData = {
        ...formData,
        budget: parseFloat(formData.budget)
      };
      
      // Submit form
      onSubmit(promotionData);
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <FormDialog
        open={open}
        onClose={onClose}
        onSubmit={handleSubmit}
        title={promotion ? 'Edit Promotion' : 'Create Promotion'}
        submitText={promotion ? 'Update' : 'Create'}
        loading={loading}
      >
        <Box sx={{ p: 1 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Promotion Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
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
                label="Budget"
                name="budget"
                type="number"
                value={formData.budget}
                onChange={handleChange}
                error={!!errors.budget}
                helperText={errors.budget}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">{getCurrencySymbol()}</InputAdornment>,
                }}
              />
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
                  <MenuItem value="planned">Planned</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Objectives"
                name="objectives"
                value={formData.objectives}
                onChange={handleChange}
                multiline
                rows={2}
                placeholder="What are the goals of this promotion?"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="KPIs"
                name="kpis"
                value={formData.kpis}
                onChange={handleChange}
                multiline
                rows={2}
                placeholder="How will success be measured?"
              />
            </Grid>
          </Grid>
          
          {promotion && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Promotion Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Created: {new Date(promotion.created_at).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated: {new Date(promotion.updated_at).toLocaleDateString()}
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

export default PromotionForm;