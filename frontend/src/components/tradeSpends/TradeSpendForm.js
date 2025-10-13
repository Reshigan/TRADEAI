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
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // If editing an existing trade spend, populate the form
  useEffect(() => {
    if (tradeSpend) {
      setFormData({
        budget_id: tradeSpend.budget.id,
        amount: tradeSpend.amount,
        type: tradeSpend.type,
        description: tradeSpend.description,
        status: tradeSpend.status,
        start_date: new Date(tradeSpend.start_date),
        end_date: new Date(tradeSpend.end_date),
        notes: tradeSpend.notes || ''
      });
    } else if (initialBudgetId) {
      setFormData(prev => ({
        ...prev,
        budget_id: initialBudgetId
      }));
    }
  }, [tradeSpend, initialBudgetId]);

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
      >
        <Box sx={{ p: 1 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
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
                    <MenuItem key={budget.id} value={budget.id}>
                      {budget.customer.name} ({budget.year})
                    </MenuItem>
                  ))}
                </Select>
                {errors.budget_id && (
                  <FormHelperText>{errors.budget_id}</FormHelperText>
                )}
              </FormControl>
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
                  <MenuItem value="pending">Pending Approval</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
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