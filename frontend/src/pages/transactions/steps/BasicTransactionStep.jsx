import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Autocomplete
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const TRANSACTION_TYPES = [
  { value: 'order', label: 'Order' },
  { value: 'trade_deal', label: 'Trade Deal' },
  { value: 'settlement', label: 'Settlement' },
  { value: 'payment', label: 'Payment' },
  { value: 'accrual', label: 'Accrual' },
  { value: 'deduction', label: 'Deduction' }
];

const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'ZAR', label: 'ZAR - South African Rand' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' }
];

export default function BasicTransactionStep({ data, errors, onChange, customers, vendors }) {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Transaction Details
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Transaction Type */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.transactionType}>
              <InputLabel>Transaction Type *</InputLabel>
              <Select
                value={data.transactionType || ''}
                onChange={(e) => handleChange('transactionType', e.target.value)}
                label="Transaction Type *"
              >
                {TRANSACTION_TYPES.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.transactionType && (
                <FormHelperText>{errors.transactionType}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Transaction Date */}
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Transaction Date *"
                value={data.transactionDate || null}
                onChange={(newValue) => handleChange('transactionDate', newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.transactionDate,
                    helperText: errors.transactionDate
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>

          {/* Customer Selection */}
          <Grid item xs={12}>
            <Autocomplete
              options={customers || []}
              getOptionLabel={(option) => `${option.name} (${option.code || 'N/A'})`}
              value={customers?.find(c => c._id === data.customerId) || null}
              onChange={(e, newValue) => handleChange('customerId', newValue?._id || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Customer *"
                  error={!!errors.customerId}
                  helperText={errors.customerId || 'Select the customer for this transaction'}
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body1">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.code} • {option.type}
                    </Typography>
                  </Box>
                </li>
              )}
            />
          </Grid>

          {/* Vendor Selection (Optional) */}
          <Grid item xs={12}>
            <Autocomplete
              options={vendors || []}
              getOptionLabel={(option) => `${option.name} (${option.code || 'N/A'})`}
              value={vendors?.find(v => v._id === data.vendorId) || null}
              onChange={(e, newValue) => handleChange('vendorId', newValue?._id || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Vendor (Optional)"
                  helperText="Select a vendor if applicable"
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body1">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.code}
                    </Typography>
                  </Box>
                </li>
              )}
            />
          </Grid>

          {/* Currency */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.currency}>
              <InputLabel>Currency *</InputLabel>
              <Select
                value={data.currency || 'USD'}
                onChange={(e) => handleChange('currency', e.target.value)}
                label="Currency *"
              >
                {CURRENCIES.map(curr => (
                  <MenuItem key={curr.value} value={curr.value}>
                    {curr.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.currency && (
                <FormHelperText>{errors.currency}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Contract ID (Optional) */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Contract ID (Optional)"
              value={data.contractId || ''}
              onChange={(e) => handleChange('contractId', e.target.value)}
              helperText="Reference to related contract if applicable"
            />
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes (Optional)"
              value={data.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Add any additional notes or comments about this transaction..."
              helperText="Internal notes will not be visible to customers"
            />
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
        <Typography variant="body2" color="info.main">
          💡 <strong>Tip:</strong> Make sure to select the correct transaction type as it determines the approval workflow and reporting categories.
        </Typography>
      </Box>
    </Box>
  );
}
