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
  Alert,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addDays } from 'date-fns';
import { formatCurrency } from '../../../utils/formatters';

const PAYMENT_METHODS = [
  { value: 'credit', label: 'Credit Card' },
  { value: 'debit', label: 'Debit Card' },
  { value: 'wire_transfer', label: 'Wire Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'cash', label: 'Cash' },
  { value: 'credit_memo', label: 'Credit Memo' }
];

const PAYMENT_TERMS = [
  { value: 'net_30', label: 'Net 30', days: 30, description: 'Payment due in 30 days' },
  { value: 'net_60', label: 'Net 60', days: 60, description: 'Payment due in 60 days' },
  { value: 'net_90', label: 'Net 90', days: 90, description: 'Payment due in 90 days' },
  { value: 'cod', label: 'COD', days: 0, description: 'Cash on delivery' },
  { value: 'prepaid', label: 'Prepaid', days: 0, description: 'Payment in advance' },
  { value: 'custom', label: 'Custom', days: null, description: 'Custom payment terms' }
];

export default function PaymentTermsStep({ data, errors, onChange }) {
  const handleChange = (field, value) => {
    const updated = { ...data, [field]: value };
    
    // Auto-calculate due date based on payment terms
    if (field === 'paymentTerms' && data.transactionDate) {
      const term = PAYMENT_TERMS.find(t => t.value === value);
      if (term && term.days !== null) {
        const dueDate = addDays(new Date(data.transactionDate), term.days);
        updated.paymentDueDate = dueDate;
      }
    }
    
    onChange(updated);
  };

  const selectedTerm = PAYMENT_TERMS.find(t => t.value === data.paymentTerms);
  const amount = data.amount?.net || 0;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Payment Terms
      </Typography>

      {amount === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Transaction amount is {formatCurrency(0)}. Please add line items in the previous step.
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Payment Method */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.paymentMethod}>
              <InputLabel>Payment Method *</InputLabel>
              <Select
                value={data.paymentMethod || ''}
                onChange={(e) => handleChange('paymentMethod', e.target.value)}
                label="Payment Method *"
              >
                {PAYMENT_METHODS.map(method => (
                  <MenuItem key={method.value} value={method.value}>
                    {method.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.paymentMethod && (
                <FormHelperText>{errors.paymentMethod}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Payment Terms */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.paymentTerms}>
              <InputLabel>Payment Terms *</InputLabel>
              <Select
                value={data.paymentTerms || ''}
                onChange={(e) => handleChange('paymentTerms', e.target.value)}
                label="Payment Terms *"
              >
                {PAYMENT_TERMS.map(term => (
                  <MenuItem key={term.value} value={term.value}>
                    {term.label}
                    {term.days !== null && ` (${term.days} days)`}
                  </MenuItem>
                ))}
              </Select>
              {errors.paymentTerms && (
                <FormHelperText>{errors.paymentTerms}</FormHelperText>
              )}
              {selectedTerm && (
                <FormHelperText>{selectedTerm.description}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Due Date */}
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Payment Due Date"
                value={data.paymentDueDate || null}
                onChange={(newValue) => handleChange('paymentDueDate', newValue)}
                minDate={data.transactionDate || new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.paymentDueDate,
                    helperText: errors.paymentDueDate || 'Automatically calculated based on payment terms'
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>

          {/* Reference Number */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Reference Number"
              value={data.paymentReferenceNumber || ''}
              onChange={(e) => handleChange('paymentReferenceNumber', e.target.value)}
              placeholder="e.g., PO-123456"
              helperText="Purchase order or reference number"
            />
          </Grid>

          {/* Custom Terms (if custom selected) */}
          {data.paymentTerms === 'custom' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Custom Payment Terms"
                value={data.customPaymentTerms || ''}
                onChange={(e) => handleChange('customPaymentTerms', e.target.value)}
                placeholder="Describe the custom payment terms..."
                error={!!errors.customPaymentTerms}
                helperText={errors.customPaymentTerms || 'Provide detailed custom payment terms'}
              />
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Payment Summary Card */}
      <Card sx={{ mt: 3, bgcolor: 'primary.lighter' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Payment Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Total Amount:
              </Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'right' }}>
              <Typography variant="h6" color="primary.main">
                ${amount.toFixed(2)}
              </Typography>
            </Grid>

            {data.paymentMethod && (
              <>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Method:
                  </Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Chip
                    label={PAYMENT_METHODS.find(m => m.value === data.paymentMethod)?.label}
                    size="small"
                    color="primary"
                  />
                </Grid>
              </>
            )}

            {data.paymentTerms && (
              <>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Terms:
                  </Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Chip
                    label={PAYMENT_TERMS.find(t => t.value === data.paymentTerms)?.label}
                    size="small"
                    color="info"
                  />
                </Grid>
              </>
            )}

            {data.paymentDueDate && (
              <>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Due Date:
                  </Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" fontWeight="medium">
                    {new Date(data.paymentDueDate).toLocaleDateString()}
                  </Typography>
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
        <Typography variant="body2" color="info.main">
          💡 <strong>Tip:</strong> Payment terms are based on your customer's contract. Double-check with the customer's profile before proceeding.
        </Typography>
      </Box>
    </Box>
  );
}
