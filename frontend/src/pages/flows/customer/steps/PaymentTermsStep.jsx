import React from 'react';
import {
  Box,
  TextField,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Paper,
  InputAdornment
} from '@mui/material';
import {
  Payment as PaymentIcon,
  AccountBalance as BankIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';

const PaymentTermsStep = ({ data, onChange, errors = {} }) => {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const paymentTermsOptions = [
    { value: 'NET30', label: 'Net 30 Days' },
    { value: 'NET45', label: 'Net 45 Days' },
    { value: 'NET60', label: 'Net 60 Days' },
    { value: 'NET90', label: 'Net 90 Days' },
    { value: 'COD', label: 'Cash on Delivery' },
    { value: 'PREPAID', label: 'Prepaid' }
  ];

  const currencies = [
    { value: 'USD', label: 'US Dollar (USD)', symbol: '$' },
    { value: 'EUR', label: 'Euro (EUR)', symbol: '€' },
    { value: 'GBP', label: 'British Pound (GBP)', symbol: '£' },
    { value: 'ZAR', label: 'South African Rand (ZAR)', symbol: 'R' },
    { value: 'AUD', label: 'Australian Dollar (AUD)', symbol: 'A$' },
    { value: 'CAD', label: 'Canadian Dollar (CAD)', symbol: 'C$' }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PaymentIcon color="primary" />
        Payment Terms & Financial Details
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure payment terms, credit limits, and financial information for this customer.
      </Typography>

      <Grid container spacing={3}>
        {/* Credit Limit */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            type="number"
            label="Credit Limit"
            value={data.creditLimit || ''}
            onChange={(e) => handleChange('creditLimit', parseFloat(e.target.value) || 0)}
            error={!!errors.creditLimit}
            helperText={errors.creditLimit || 'Maximum credit allowed for this customer'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MoneyIcon color="action" />
                </InputAdornment>
              )
            }}
            placeholder="0.00"
          />
        </Grid>

        {/* Payment Terms */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required error={!!errors.paymentTerms}>
            <InputLabel>Payment Terms</InputLabel>
            <Select
              value={data.paymentTerms || 'NET30'}
              label="Payment Terms"
              onChange={(e) => handleChange('paymentTerms', e.target.value)}
            >
              {paymentTermsOptions.map((term) => (
                <MenuItem key={term.value} value={term.value}>
                  {term.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {errors.paymentTerms || 'Standard payment terms for invoices'}
            </FormHelperText>
          </FormControl>
        </Grid>

        {/* Currency */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required error={!!errors.currency}>
            <InputLabel>Currency</InputLabel>
            <Select
              value={data.currency || 'USD'}
              label="Currency"
              onChange={(e) => handleChange('currency', e.target.value)}
            >
              {currencies.map((curr) => (
                <MenuItem key={curr.value} value={curr.value}>
                  {curr.symbol} - {curr.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {errors.currency || 'Primary transaction currency'}
            </FormHelperText>
          </FormControl>
        </Grid>

        {/* Tax ID */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Tax ID / VAT Number"
            value={data.taxId || ''}
            onChange={(e) => handleChange('taxId', e.target.value)}
            error={!!errors.taxId}
            helperText={errors.taxId || 'Tax identification number'}
            placeholder="e.g., 123-45-6789"
          />
        </Grid>

        {/* Bank Details Section */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.300' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BankIcon fontSize="small" />
              Banking Information (Optional)
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Add bank account details for direct deposits or refunds.
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Bank Name"
                  value={data.bankDetails?.bankName || ''}
                  onChange={(e) => handleChange('bankDetails', { 
                    ...(data.bankDetails || {}), 
                    bankName: e.target.value 
                  })}
                  placeholder="e.g., First National Bank"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Account Holder Name"
                  value={data.bankDetails?.accountHolderName || ''}
                  onChange={(e) => handleChange('bankDetails', { 
                    ...(data.bankDetails || {}), 
                    accountHolderName: e.target.value 
                  })}
                  placeholder="Name as it appears on the account"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Account Number"
                  value={data.bankDetails?.accountNumber || ''}
                  onChange={(e) => handleChange('bankDetails', { 
                    ...(data.bankDetails || {}), 
                    accountNumber: e.target.value 
                  })}
                  placeholder="Bank account number"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Routing Number / SWIFT Code"
                  value={data.bankDetails?.routingNumber || ''}
                  onChange={(e) => handleChange('bankDetails', { 
                    ...(data.bankDetails || {}), 
                    routingNumber: e.target.value 
                  })}
                  placeholder="e.g., 123456789 or BNKAUS12XXX"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bank Branch Address"
                  value={data.bankDetails?.branchAddress || ''}
                  onChange={(e) => handleChange('bankDetails', { 
                    ...(data.bankDetails || {}), 
                    branchAddress: e.target.value 
                  })}
                  placeholder="Full branch address"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PaymentTermsStep;
